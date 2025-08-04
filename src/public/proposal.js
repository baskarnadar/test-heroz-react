import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import {
  CCarousel,
  CCarouselItem,
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CFormCheck,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked, cilUser } from "@coreui/icons";
import { API_BASE_URL } from "../config";
import logo from "../assets/logo/default.png";
import { format, parse } from "date-fns";

import Select from "react-select";
import "../scss/payment.css";
import PaymentMethodOption from "../public/payoption";

import {
  DspToastMessage,
  dspstatusv1,
  getFileNameFromUrl,
  getCurrentLoggedUserID,
  YouTubeEmbed,
  GoogleMapEmbed,
  getDayName,
  convertToAMPM,
} from "../utils/operation";
import FilePreview from "../views/widgets/FilePreview";

import moneyv1 from "../assets/images/moneyv1.png";
import ReactPlayer from "react-player";

const ProposalPage = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [TripData, setTripData] = useState([]);
  const [txtactImageName1, setactImageName1] = useState(null);
  const [txtactImageName2, setactImageName2] = useState(null);
  const [txtactImageName3, setactImageName3] = useState(null);
  const [ActivityData, setActivity] = useState(null);

  const [fetchedCategories, setFetchedCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");

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
          headers: { "Content-Type": "application/json" },
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

  const fetchTripData = async (RequestID) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/trip/gettrip`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    // Extract RequestID from hash URL (#/public/proposal?RequestID=...)
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
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

  const foodTotal = (ActivityData?.foodList ?? []).reduce((sum, item) => {
    const foodPrice =
      (parseFloat(item?.FoodPrice) || 0) +
      (parseFloat(item?.FoodHerozPrice) || 0) +
      (parseFloat(item?.RequestFoodSchoolPrice) || 0);
    return sum + foodPrice;
  }, 0);

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

  return (
    <>
      <style>{`
        /* Hide app chrome */
        body.hide-chrome .sidebar,
        body.hide-chrome .app-sidebar,
        body.hide-chrome .header,
        body.hide-chrome .app-header,
        body.hide-chrome .footer,
        body.hide-chrome .app-footer { display:none !important; }

        /* Remove the sidebar left offset CoreUI applies */
        body.hide-chrome .wrapper {
          margin-left: 0 !important;
          --cui-sidebar-width: 0 !important;
          --cui-sidebar-occupy-start: 0 !important;
        }
        body.hide-chrome .wrapper .body {
          padding: 0 !important;
          margin: 0 !important;
        }
        body.hide-chrome .wrapper .body > .container,
        body.hide-chrome .wrapper .body > .container-fluid {
          padding-left: 0 !important;
          padding-right: 0 !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* Page header */
        .proposal-header {
          background: #ffffff;
          border-bottom: 1px solid #ddd;
          padding: 12px 16px;
        }
        .proposal-header .brand { display:flex; align-items:center; gap:12px; }
        .proposal-header .brand img { height:40px; width:auto; display:block; }
        .proposal-header .brand-title { margin:0; font-size:1.125rem; font-weight:600; color:#333; }
        
      `}</style>

      {/* Full‑width header */}

      {/* Main */}
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

          {activityImages.length > 0 ? (
            <CCarousel controls interval={5000} dark>
              {activityImages.map((src, idx) => (
                <CCarouselItem key={idx}>
                  <div style={{ position: "relative" }}>
                    <img
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
                    />

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
                    <div className="actname">{ActivityData?.actName}</div>
                  </div>
                </CCarouselItem>
              ))}
            </CCarousel>
          ) : (
            <div className="admin-lbl-box text-center">No images</div>
          )}
          <div  className="trip">
          <div className="proposalsubtitlefirst"  >
            Trip Information
          </div>

          <section className=" " aria-labelledby="request-details-title">
            <div className="details-grid">
              <div className="proposalsubtitlev3">
                📅 Date
                <div>{getDayName(TripData?.actRequestDate)} </div>
              </div>
              <div className="proposalsubtitlev3">
                {" "}
                ⏰ Time
                <div>{TripData?.actRequestTime}</div>
              </div>
              <div className="proposalsubtitlev3">
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

          <div className="proposalsubtitlev1"> {ActivityData?.actDesc} </div>

          {/* Price per student */}

          {/* Food */}
          <div className="proposalsubtitle" style={{ marginTop: "10px" }}>
            Food Information
          </div>
          <div style={{ padding: 20 }}>
            {(ActivityData?.foodList ?? []).map((foodItem, index) => {
              const TotalFoodPrice =
                (parseFloat(foodItem?.FoodPrice) || 0) +
                (parseFloat(foodItem?.FoodHerozPrice) || 0) +
                (parseFloat(foodItem?.RequestFoodSchoolPrice) || 0);
              return (
                <div className="proposalsubtitlev2">{foodItem?.FoodName}</div>
              );
            })}
          </div>
          <div className="proposalsubtitle" style={{ marginTop: "10px" }}>
            Trip Pricing
          </div>
          <div className="payment-method-container">
            <div className="col1">
              <div className="proposalsubtitlev2">
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
                <button className="continue-button">Continue to Payment</button>
              </div>
            </div>
          </div>

          <div className="proposalsubtitle" style={{ marginTop: "10px" }}>
            Terms And Conditions
          </div>
          <div className="">
            <div className="proposalsubtitlev4">
              {ActivityData?.actAdminNotes}
            </div>
          </div>

          {/* Button */}
          <div className="button-container">
            <button
              type="button"
              className="btnpay"
              onClick={() => navigate("/admindata/activityinfo/activity/list")}
            >
              Next
            </button>
          </div>
</div>
          <DspToastMessage message={toastMessage} type={toastType} />
        </div>
      </div>
    </>
  );
};

export default ProposalPage;
