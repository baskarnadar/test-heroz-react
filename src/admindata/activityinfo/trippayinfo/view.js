import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import { CCarousel, CCarouselItem } from "@coreui/react";

import { API_BASE_URL } from "../../../config";
import logo from "../../../assets/logo/default.png";

import "../../../scss/payment.css";

import {
  DspToastMessage,
  getCurrentLoggedUserID,
  generatePayRefNo,
  getAuthHeaders } from "../../../utils/operation";

//import FoodInfo from "../../../public/foodinfo";
import moneyv1 from "../../../assets/images/moneyv1.png";
 import TripPaidList from "./trippaidlist";
const ProposalPage = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [checkedFoodItems, setCheckedFoodItems] = useState({});
  const [TripData, setTripData] = useState([]);
  const [txtactImageName1, setactImageName1] = useState(null);
  const [txtactImageName2, setactImageName2] = useState(null);
  const [txtactImageName3, setactImageName3] = useState(null);
  const [ActivityData, setActivity] = useState(null);

  const [fetchedCategories, setFetchedCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

  const [childRows, setChildRows] = useState([
    { schoolID: "", name: "", className: "" },
  ]);

  const handleAddRow = () => {
    setChildRows([...childRows, { schoolID: "", name: "", className: "" }]);
  };

  const handleInputChange = (index, field, value) => {
    const updatedRows = [...childRows];
    updatedRows[index][field] = value;
    setChildRows(updatedRows);
  };
  // Hide header/sidebar/footer ONLY on this page
  useEffect(() => {
    document.body.classList.add("hide-chrome");
    return () => document.body.classList.remove("hide-chrome");
  }, []);

  const fetchActivity = async (ActivityIDVal, VendorIDVal, RequestIDVal) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/trip/gettripview`,
        {
          method: "POST",
         headers: getAuthHeaders(),
          body: JSON.stringify({
            ActivityID: ActivityIDVal,
            VendorID: VendorIDVal,
            RequestID: RequestIDVal,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to fetch activities");

      const data = await response.json();
      setActivity(data.data || null);

      // setTotalPages?.(Math.ceil(data.totalCount / ActivityPerPage));
    } catch (err) {
      setError("Error fetching activities");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (FoodID) => {
    setCheckedFoodItems((prevState) => ({
      ...prevState,
      [FoodID]: !prevState[FoodID],
    }));
  };

  const fetchTripData = async (RequestID) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/trip/gettrip`,
        {
          method: "POST",
         headers: getAuthHeaders(),
          body: JSON.stringify({ RequestID }),
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      const payload = Array.isArray(data?.data)
        ? (data.data[0] ?? null)
        : (data?.data ?? null);
      setTripData(payload);

      const ActivityIDVal = payload?.ActivityID;
      const VendorIDVal = payload?.VendorID;
      if (ActivityIDVal && VendorIDVal) {
        fetchActivity(ActivityIDVal, VendorIDVal, RequestID);
      }
    } catch (err) {
      console.error("Error fetching trip data:", err);
      setError(err.message || "Error fetching trip data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ActivityData) return;

    // Basic info
    setactImageName1(ActivityData.actImageName1Url || "");
    setactImageName2(ActivityData.actImageName2Url || "");
    setactImageName3(ActivityData.actImageName3Url || "");
  }, [ActivityData]);

  useEffect(() => {
    if (ActivityData?.foodList) {
      const initialChecked = {};
      ActivityData.foodList.forEach((item) => {
        initialChecked[item.FoodID] = item.Include === true;
      });
      setCheckedFoodItems(initialChecked);
    }
  }, [ActivityData]);

    const getSearchParams = () => {
        const search = window.location.search ||
        (window.location.hash && window.location.hash.includes('?')
        ? `?${window.location.hash.split('?')[1]}`
        : '');
        return new URLSearchParams(search);
        };

  useEffect(() => {
    
    const urlParams = getSearchParams();
    const RequestID = urlParams.get("RequestID");
    if (RequestID) {
      fetchTripData(RequestID);
    } else {
      setError("ActivityID is missing in URL");
    }
  }, []);

  // Build images array AFTER the state variables exist
  const activityImages = useMemo(
    () =>
      [txtactImageName1, txtactImageName2, txtactImageName3].filter(Boolean),
    [txtactImageName1, txtactImageName2, txtactImageName3]
  );

  // ======= Calculate totals outside of JSX (no side-effects while rendering) =======
  const filteredPriceList = (ActivityData?.priceList ?? []).filter(
    (priceItem) => Number(priceItem?.RequestSchoolPrice) > 0
  );

  const priceTotal = filteredPriceList.reduce((sum, item) => {
    const perStudent =
      (parseFloat(item?.HerozStudentPrice) || 0) +
      (parseFloat(item?.Price) || 0) +
      (parseFloat(item?.RequestSchoolPrice) || 0);
    return sum + perStudent;
  }, 0);

  const foodTotal = useMemo(() => {
    return (ActivityData?.foodList ?? []).reduce((sum, item) => {
      if (checkedFoodItems[item.FoodID]) {
        const foodPrice =
          (parseFloat(item?.FoodPrice) || 0) +
          (parseFloat(item?.FoodHerozPrice) || 0) +
          (parseFloat(item?.RequestFoodSchoolPrice) || 0);
        return sum + foodPrice;
      }
      return sum;
    }, 0);
  }, [ActivityData, checkedFoodItems]);

  const grandTotal = priceTotal + foodTotal;

  // ======= Add 15% tax and final total =======
  const TAX_RATE = 0.15;
  const taxAmount = (Number(grandTotal) || 0) * TAX_RATE;
  const grandTotalWithTax = (Number(grandTotal) || 0) + taxAmount;
  const [selectedMethod, setSelectedMethod] = useState("creditCard");

  const paymentOptions = [
    {
      value: "creditCard",
      label: "Credit/Debit Card",
      description:
        "Secure online payment with Visa, MasterCard, or American Express",
    },

    {
      value: "applePay",
      label: "Apple Pay",
      description: "Quick and secure payment with Touch ID or Face ID",
    },
  ];
  // Handle change of selected payment method
  const handleMethodChange = (method) => {
    setSelectedMethod(method);
  };
  useEffect(() => {
    // Hide layout
    document.body.classList.add("hide-layout");
    return () => {
      document.body.classList.remove("hide-layout");
    };
  }, []);

  const handleSubmit = async () => {
    const ParentsID = getCurrentLoggedUserID();
    const RequestID = TripData?.RequestID;

    const parentName =
      document.querySelector('input[name="txtParentName"]')?.value || "";
    const parentMobile =
      document.querySelector('input[name="tripParentsMobileNo"]')?.value || "";
    const parentNote =
      document.querySelector('textarea[name="txtParentsNote"]')?.value || "";

    const foodIncluded = [];
    const foodExtra = [];

    // Get selected included food (radio name: "foodSelect")
    const includedFoodRadio = document.querySelector(
      'input[name="foodSelect"]:checked'
    );
    if (includedFoodRadio) {
      foodIncluded.push(includedFoodRadio.value); // use FoodID as value in radio
    }

    // Get all checked extra foods (checkboxes like: foodCheckbox-<FoodID>)
    (ActivityData?.foodList ?? []).forEach((item) => {
      if (item.Include !== true) {
        const checkbox = document.querySelector(
          `input[name="foodCheckbox-${item.FoodID}"]`
        );
        if (checkbox?.checked) {
          foodExtra.push(item.FoodID);
        }
      }
    });

    const kidsInfo = childRows.map((row) => ({
      RequestID,
      ParentsID,
      KidsID: "",
      TripKidsSchoolNo: row.schoolID,
      TripKidsName: row.name,
      tripKidsClassName: row.className,
      TripCost: priceTotal.toFixed(2),
      TripFoodCost: foodTotal.toFixed(2),
      TripTaxAmount: taxAmount.toFixed(2),
      TripFullAmount: grandTotalWithTax.toFixed(2),
      PayStaus: "NEW",
      InvoiceNo: "0",
      MyFatrooahRefNo: "0",
      PayRefNo: generatePayRefNo(),
    }));

    const payload = {
      RequestID,
      ParentsID,
      tripParentsName: parentName,
      tripParentsMobileNo: parentMobile,
      tripParentsNote: parentNote,
      tripPaymentTypeID:
        selectedMethod === "creditCard" ? "CREDIT-CARD" : "APPLE-PAY",
      kidsInfo,
      FoodIncluded: foodIncluded,
      FoodExtra: foodExtra,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/trip/tripAddParentsKidsInfo`,
        {
          method: "POST",
         headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );
      console.log("payload");
      console.log(payload);
      if (!response.ok) throw new Error("Failed to submit data");
      const result = await response.json();
      console.log("Submission success:", result);
      setToastMessage("Submitted successfully!");
      setToastType("success");
    } catch (error) {
      console.error("Submit error:", error);
      setToastMessage("Submission failed");
      setToastType("danger");
    }
  };

  return (
    <>
      <div>
      
      <TripPaidList   />
    </div>
      <div
        className="min-vh-100 d-flex flex-row align-items-center"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div>
          {error && (
            <div className="divbox" style={{ color: "red" }}>
              {error}
            </div>
          )}

          <div className="school-header-container">
            <div className="school-brand">
              <img
                src={TripData?.schImageNameUrl ?? logo}
                alt="School Logo"
                className="school-logo"
              />
              <h1 className="school-name">
                {TripData?.schName || "School Logo"}
              </h1>
            </div>
            <p className="school-invite">
              <h1> 🎉 You're Invited!</h1> <br />
              <h3> Review and book {ActivityData?.actName} school trip</h3>
            </p>
          </div>

          {/* {TripData?.schImageNameUrl ?? logo} */}
          {activityImages.length > 0 ? (
            <CCarousel controls interval={5000} dark>
              {activityImages.map((src, idx) => (
                <CCarouselItem key={idx}>
                  <div style={{ position: "relative" }}>
                    {/* <img
                      src={TripData?.schImageNameUrl ?? logo}
                      style={{
                        maxWidth: "200px",
                        maxHeight: "150px",
                        height: "auto",
                        objectFit: "contain",
                        display: "block",
                        marginBottom: "10px",
                        position: "absolute",
                        top: 0,
                        margin: 20,
                        right: 0,
                      }}
                      loading="lazy"
                    /> */}

                    <img
                      className="d-block w-100"
                      src={src}
                      alt={`Activity Image ${idx + 1}`}
                      style={{
                        objectFit: "cover",
                        maxHeight: 300,
                        borderTopLeftRadius: "0px", // Use camelCase for CSS properties
                        borderTopRightRadius: "0px", // Same here
                        width: "100%",
                      }}
                    />
                    {/* Text at the bottom */}
                    {/* <div className="actname">{ActivityData?.actName}</div> */}
                  </div>
                </CCarouselItem>
              ))}
            </CCarousel>
          ) : (
            <div className="admin-lbl-box text-center">No images</div>
          )}
          <div className="trip">
            <div className="tripsubtitlefirst">Trip Information</div>

            <section className=" " aria-labelledby="request-details-title">
              <div className="details-grid">
                <div className="tripsubtitlev3">
                  📅 Date
                  <div>{TripData?.actRequestDate} </div>
                </div>
                <div className="tripsubtitlev3">
                  {" "}
                  ⏰ Time
                  <div>{TripData?.actRequestTime}</div>
                </div>
                <div className="tripsubtitlev3">
                  {" "}
                  ⏰ Localtion
                  <div>{ActivityData?.actAddress1}</div>
                  <div>{ActivityData?.actAddress2}</div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <a
                        href={ActivityData?.actGoogleMap}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaMapMarkerAlt
                          style={{
                            marginRight: "8px",
                            fontSize: "20px",
                            color: "#007bff",
                          }}
                        />
                        View On Google Map
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              {/* Value row */}
            </section>

            <div className="tripsubtitlev1"> {ActivityData?.actDesc} </div>

            {/* Price per student */}

            {/* 
            <FoodInfo
              ActivityData={ActivityData}
              checkedFoodItems={checkedFoodItems}
              handleCheckboxChange={handleCheckboxChange}
            />
            Food */}

            <div className="tripsubtitle" style={{ marginTop: "10px" }}>
              Child Information & Booking
            </div>

            <div className="proParents">
              <div className="kids-info-container">
                <div className="input-group">
                  <label>Parents Name</label>
                  <input name="txtParentName" className="vendor-input" />
                </div>
                <div className="input-group">
                  <label>Parents Mobile Number</label>
                  <input name="tripParentsMobileNo" className="vendor-input" />
                </div>
              </div>

              <div className="kids-info-container">
                <div className="input-group">
                  <label>Parents Note</label>
                  <textarea
                    name="txtParentsNote"
                    className="vendor-input"
                    rows={3}
                    placeholder="Enter note here..."
                  />
                </div>
              </div>
            </div>

            {childRows.map((row, index) => (
              <div className="proParents" key={index}>
                <div className="kids-info-container">
                  <div className="input-group">
                    <label>Kids School ID Number</label>
                    <input
                      name="txtKidsSchoolID"
                      className="vendor-input"
                      value={row.schoolID}
                      onChange={(e) =>
                        handleInputChange(index, "schoolID", e.target.value)
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label>Kids Name</label>
                    <input
                      name="txtKidsName"
                      className="vendor-input"
                      value={row.name}
                      onChange={(e) =>
                        handleInputChange(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="input-group">
                    <label>Class Name</label>
                    <input
                      name="txtKidsClassName"
                      className="vendor-input"
                      value={row.className}
                      onChange={(e) =>
                        handleInputChange(index, "className", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ padding: "10px 20px" }}>
              <button type="button" className="btnpay" onClick={handleAddRow}>
                Add More
              </button>
            </div>

            <div className="payment-method-container">
              <div className="col1">
                <div className="tripsubtitlev2">
                  <div>
                    <b>Price Total:</b> {priceTotal.toFixed(2)}
                  </div>
                  <div>
                    <b>Food Total:</b> {foodTotal.toFixed(2)}
                  </div>

                  {/* Tax row */}
                  <div>
                    <b>Tax (15%):</b>{" "}
                    <img
                      src={moneyv1}
                      alt="logo"
                      style={{
                        width: "14px",
                        marginRight: "6px",
                        verticalAlign: "middle",
                      }}
                    />
                    {taxAmount.toFixed(2)}
                  </div>

                  <h2>
                    {" "}
                    Price Per Student :{" "}
                    <img
                      src={moneyv1}
                      alt="logo"
                      style={{
                        width: "14px",
                        marginRight: "6px",
                        verticalAlign: "middle",
                      }}
                    />
                    {grandTotalWithTax.toFixed(2)}
                  </h2>
                </div>
              </div>
              <div className="col2">
                <div className="payment-method-section">
                  <p>Choose your payment method:</p>

                  {paymentOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`payment-method-option ${
                        selectedMethod === option.value ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={selectedMethod === option.value}
                        onChange={() => setSelectedMethod(option.value)}
                      />
                      <div>
                        <div style={{ fontWeight: "bold" }}>{option.label}</div>
                        <div style={{ fontSize: "0.9rem", color: "#555" }}>
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}

                  <div className="payment-selected">
                    <strong>Selected method:</strong> {selectedMethod}
                  </div>
                  <button className="continue-button" onClick={handleSubmit}>
                    Continue to Payment
                  </button>
                </div>
              </div>
            </div>

            <div className="tripsubtitle" style={{ marginTop: "10px" }}>
              Terms And Conditions
            </div>
            <div className="">
              <div className="tripsubtitlev4">
                {ActivityData?.actAdminNotes}
              </div>
            </div>

            {/* Button */}
            <div className="button-container"></div>
          </div>
          <DspToastMessage message={toastMessage} type={toastType} />
        </div>
      </div>
    </>
  );
};

export default ProposalPage;
