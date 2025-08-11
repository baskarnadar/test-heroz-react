import React, { useState, useEffect, useMemo } from "react";
import {
  FaMapMarkerAlt,
  FaInstagram,
  FaFacebookF,
  FaTwitter,
} from "react-icons/fa";
import { CCarousel, CCarouselItem } from "@coreui/react";
import { API_BASE_URL } from "../config";
import logo from "../assets/logo/default.png";
import herozlogo from "../assets/logo/herozlogo.png";
import viewonmap from "../assets/icon/viewonmap.png";
import icon1 from "../assets/icon/icon1.png";
import icon2 from "../assets/icon/icon2.png";
import icon3 from "../assets/icon/icon3.png";
import icon4 from "../assets/icon/icon4.png";
import icon5 from "../assets/icon/icon5.png";
import icon6 from "../assets/icon/icon6.png";
import etop from "../assets/icon/etop.png";

import "../scss/payment.css"; // external CSS
import {
  DspToastMessage,
  getCurrentLoggedUserID,
  generatePayRefNo,
} from "../utils/operation";
import FoodInfo from "./foodinfo";

const ProposalPage = () => {
  const [error, setError] = useState("");
  const [checkedFoodItems, setCheckedFoodItems] = useState({});
  const [TripData, setTripData] = useState([]);
  const [txtactImageName1, setactImageName1] = useState(null);
  const [txtactImageName2, setactImageName2] = useState(null);
  const [txtactImageName3, setactImageName3] = useState(null);
  const [ActivityData, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [childRows, setChildRows] = useState([
    { schoolID: "", name: "", className: "" },
  ]);
  const [selectedMethod, setSelectedMethod] = useState("creditCard");
  const [menuOpen, setMenuOpen] = useState(false); // NEW: mobile nav

  // ADDED: expired flag
  const [isExpired, setIsExpired] = useState(false);

 

  const handleAddRow = () =>
    setChildRows([...childRows, { schoolID: "", name: "", className: "" }]);

  const handleRemoveRow = (idx) =>
    setChildRows((prev) => prev.filter((_, i) => i !== idx));

  const handleInputChange = (index, field, value) => {
    const updated = [...childRows];
    updated[index][field] = value;
    setChildRows(updated);
  };

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
    } catch (err) {
      setError("Error fetching activities");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (FoodID) => {
    setCheckedFoodItems((prev) => ({ ...prev, [FoodID]: !prev[FoodID] }));
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
      if (!response.ok)
        throw new Error(`Request failed with status ${response.status}`);
      const data = await response.json();
      const payload = Array.isArray(data?.data)
        ? (data.data[0] ?? null)
        : (data?.data ?? null);
 
    const dueRaw = payload?.PaymentDueDate;
console.log("PaymentDueDate ->", dueRaw, typeof dueRaw);

const missingDue =
  dueRaw == null ||
  String(dueRaw).trim() === "" ||
  String(dueRaw).trim().toLowerCase() === "undefined" ||
  String(dueRaw).trim().toLowerCase() === "null";

if (missingDue || isPaymentExpired(dueRaw)) {
  window.location.hash = '#/public/payerror';
  return;
}
      setTripData(payload);

      const ActivityIDVal = payload?.ActivityID;
      const VendorIDVal = payload?.VendorID;
      if (ActivityIDVal && VendorIDVal)
        fetchActivity(ActivityIDVal, VendorIDVal, RequestID);
    } catch (err) {
      console.error("Error fetching trip data:", err);
      setError(err.message || "Error fetching trip data");
    } finally {
      setLoading(false);
    }
  };
// Treat null, undefined, "", "undefined", "null", "NaN" as NO due date
const hasRealDueDate = (raw) => {
  if (raw == null) return false;
  const s = String(raw).trim().toLowerCase();
  return s !== "" && s !== "undefined" && s !== "null" && s !== "nan";
};

const parseDueDate = (raw) => {
  if (!hasRealDueDate(raw)) return null;
  let s = String(raw).trim();

  // Common fixes: "YYYY-MM-DD HH:mm:ss" -> ISO
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");

  // Support DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("/");
    s = `${yyyy}-${mm}-${dd}`;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// Expired if due date exists and is <= today
const isPaymentExpired = (raw) => {
  const d = parseDueDate(raw);
  if (!d) return false; // no valid date -> do NOT expire
  const today = new Date();
  d.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  return d.getTime() <= today.getTime();
};

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
    const RequestID = urlParams.get("RequestID");
    if (RequestID) fetchTripData(RequestID);
    else setError("ActivityID is missing in URL");
  }, []);

  useEffect(() => {
    if (!ActivityData) return;
    setactImageName1(ActivityData.actImageName1Url || "");
    setactImageName2(ActivityData.actImageName2Url || "");
    setactImageName3(ActivityData.actImageName3Url || "");
  }, [ActivityData]);

  useEffect(() => {
    if (ActivityData?.foodList) {
      const initialChecked = {};
      ActivityData.foodList.forEach(
        (i) => (initialChecked[i.FoodID] = i.Include === true)
      );
      setCheckedFoodItems(initialChecked);
    }
  }, [ActivityData]);

  const activityImages = useMemo(
    () =>
      [txtactImageName1, txtactImageName2, txtactImageName3].filter(Boolean),
    [txtactImageName1, txtactImageName2, txtactImageName3]
  );

  // ===== Totals (tax included already) =====
  const filteredPriceList = (ActivityData?.priceList ?? []).filter(
    (p) => Number(p?.RequestSchoolPrice) > 0
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
        const fp =
          (parseFloat(item?.FoodPrice) || 0) +
          (parseFloat(item?.FoodHerozPrice) || 0) +
          (parseFloat(item?.RequestFoodSchoolPrice) || 0);
        return sum + fp;
      }
      return sum;
    }, 0);
  }, [ActivityData, checkedFoodItems]);

  const grandTotal = priceTotal + foodTotal;
  const TAX_RATE = 0;
  const taxAmount = (Number(grandTotal) || 0) * TAX_RATE;
  const grandTotalWithTax = (Number(grandTotal) || 0) + taxAmount;

  const handleSubmit = async () => {
    // ADDED: safety check at submit time too
    if (TripData?.PaymentDueDate && isPaymentExpired(TripData.PaymentDueDate)) {
      setIsExpired(true);
      setToastType("danger");
      setToastMessage(
        "We are sorry, the payment due date has finished. You cannot pay."
      );
      window.location.replace("/public/payerror");
      return;
    }

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

    const includedFoodRadio = document.querySelector(
      'input[name="foodSelect"]:checked'
    );
    if (includedFoodRadio) foodIncluded.push(includedFoodRadio.value);

    (ActivityData?.foodList ?? []).forEach((item) => {
      if (item.Include !== true) {
        const checkbox = document.querySelector(
          `input[name="foodCheckbox-${item.FoodID}"]`
        );
        if (checkbox?.checked) foodExtra.push(item.FoodID);
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("Failed to submit data");
      const result = await response.json();
      console.log("Submission success:", result);
      window.location.replace("/public/paysuccess");
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
      <div className="bodyimg">
        {/* ===== Custom Header ===== */}
        <header className="site-header">
          <div className="container header-inner ">
            <a href="#" className="brand" aria-label="Heroz Home">
              <img src={herozlogo} alt="HEROZ" className="header-logo" />
            </a>
            <button
              className={`nav-toggle ${menuOpen ? "open" : ""}`}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((s) => !s)}
            >
              <span />
              <span />
              <span />
            </button>

            <nav className={`nav ${menuOpen ? "show" : ""}`}>
              <a href="#about">About</a>
              <a href="#providers">Our Providers</a>
              <a href="#schools">Heroz For School</a>
              <a href="#join" className="btn-join">
                Join As A provider
              </a>
            </nav>
          </div>
        </header>

        {/* PAGE */}
        <main className="proposal">
          {error && <div className="alert-error">{error}</div>}

          {/* Header hero (school) */}
          <div className="hero-frame">
            <header className="hero">
              <img
                src={TripData?.schImageNameUrl || logo}
                alt="School"
                className="hero-img"
              />
              <div className="hero-overlay" />
              <div className="hero-content">
                <h1 className="hero-title">{TripData?.schName || "School"}</h1>
                <p className="hero-sub">
                  {TripData?.schAddress1 || ""} {TripData?.schAddress2 || ""}
                </p>
              </div>
            </header>
          </div>

          {/* Intro section */}
          <section className="intro container  ">
            <h2 className="intro-title">
              <span role="img" aria-label="party">
                🎉
              </span>

              <h1 className="trip-gradient-title">
                Here your child is going for a trip
              </h1>
              <span role="img" aria-label="party">
                🎉
              </span>
            </h2>
            <p className="intro-sub">
              Review and book {ActivityData?.actName} school trip
            </p>
          </section>

          {/* Activity image carousel */}
          <section className="activity-media container">
            {activityImages.length > 0 ? (
              <CCarousel controls interval={5000} dark>
                {activityImages.map((src, idx) => (
                  <CCarouselItem key={idx}>
                    <img
                      className="activity-img"
                      src={src}
                      alt={`Activity ${idx + 1}`}
                    />
                  </CCarouselItem>
                ))}
              </CCarousel>
            ) : (
              <div className="empty-media">No images</div>
            )}
          </section>

          {/* Trip info grid */}
          <section className="trip-info" aria-labelledby="trip-info-title">
            <div className="card about-details">
              <div className="about-left">
                {/* ADDED title inside the left column */}
                <h2 className="section-title trip-gradient-color fontsize40">
                  Trip Information
                </h2>
                {/* Or use gradient: <h2 className="section-title gradient">TRIP INFORMATION</h2> */}

                <h3 className="card-title">About This Trip</h3>
                <p className="card-text">{ActivityData?.actDesc}</p>
              </div>

              {/* Right column - Trip Details */}
              <div className="about-right">
                <div className="detail-row">
                  <div className="detail">
                    <div className="detail-label trip-gradient-color  fontsize30">
                      <div className="row-inline">
                        <img
                          src={icon5}
                          alt="HEROZ"
                          className="icon-tint-pink"
                        />

                        <span> Trip Cost</span>
                      </div>
                    </div>
                    <div className="detail-value ">
                      {priceTotal.toFixed(2)} <img src={icon5} alt="HEROZ" />
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail">
                    <div className="detail-label trip-gradient-color  fontsize30">
                      <div className="row-inline">
                        <span>
                          {" "}
                          <div className="row-inline">
                            <img src={icon1} alt="HEROZ" />
                            <span>Date</span>
                          </div>
                        </span>
                      </div>
                    </div>
                    <div className="detail-value">
                      {TripData?.actRequestDate || "-"}
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail">
                    <div className="detail-label trip-gradient-color  fontsize30">
                      <div className="row-inline">
                        <img src={icon2} alt="HEROZ" />
                        <span>Time</span>
                      </div>
                    </div>
                    <div className="detail-value">
                      {TripData?.actRequestTime || "-"}
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail">
                    <div className="detail-label trip-gradient-color  fontsize30">
                      {" "}
                      <div className="row-inline">
                        <img src={icon3} alt="HEROZ" />
                        <span>Location</span>
                      </div>
                    </div>
                    <div className="detail-value">
                      <div>{ActivityData?.actAddress1}</div>
                      <div>{ActivityData?.actAddress2}</div>
                    </div>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-value">
                    {ActivityData?.actGoogleMap && (
                      <a
                        className="map-link"
                        href={ActivityData?.actGoogleMap}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={viewonmap}
                          alt="HEROZ"
                          className="footer-logo"
                        />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing + Booking */}
          <section className="container twocol">
            {/* Pricing */}
            <div className="card pricing">
              <h3 className="card-title trip-gradient-color fontsize40">
                Trips Pricing
              </h3>

              <div className="price-row">
                <span className="price-label fontsize20">Base Trip Cost</span>
                <span className="price-value fontsize20">
                  {priceTotal.toFixed(2)} <img src={icon5} alt="HEROZ" />
                </span>
              </div>

              <div className="divider" />
              <div className="price-subtitle">Included </div>
              <div className="divider" />
              <div className="food-wrap">
                <FoodInfo
                  ActivityData={ActivityData}
                  checkedFoodItems={checkedFoodItems}
                  handleCheckboxChange={handleCheckboxChange}
                />
              </div>

              <div className="divider" />
              <div className="summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>
                    {grandTotal.toFixed(2)} <img src={icon5} alt="HEROZ" />
                  </span>
                </div>
                {/* <div className="summary-row total">
                <span>Total Payable</span>
                <span>{grandTotalWithTax.toFixed(2)} SAR</span>
              </div> */}
              </div>

              <div className="summary-row total trip-gradient-color">
                <span>Total Payable (per student)</span>
                <span>
                  {grandTotalWithTax.toFixed(2)}{" "}
                  <img src={icon5} alt="HEROZ" />
                </span>
              </div>

              {childRows.length > 1 && (
                <div className="summary-row total net-payable trip-gradient-color">
                  <span>Net Payable Amount ({childRows.length} kids)</span>
                  <span>
                    {(grandTotalWithTax * childRows.length).toFixed(2)}{" "}
                    <img src={icon5} alt="HEROZ" />
                  </span>
                </div>
              )}

              <div className="divider" />
              <div className="payment-group">
                <div className="payment-title">Payment Method</div>

                {[
                  {
                    value: "creditCard",
                    label: "Credit/Debit Card",
                    description: "Secure online payment",
                  },
                  {
                    value: "applePay",
                    label: "Apple Pay",
                    description: "Quick and secure",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`payment-option ${
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
                    <div className="payment-info">
                      <div className="payment-label">{option.label}</div>
                      <div className="payment-desc">{option.description}</div>
                    </div>
                  </label>
                ))}

                <button className="btn-primary" onClick={handleSubmit}>
                  Continue to payment
                </button>
              </div>
            </div>

            {/* Booking form */}
            <div className="card booking">
              <h3 className="card-title trip-gradient-color fontsize40">
                Child Information & Booking
              </h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>Parent Name*</label>
                  <input name="txtParentName" className="input" />
                </div>
                <div className="form-group">
                  <label>Parent Phone*</label>
                  <input name="tripParentsMobileNo" className="input" />
                </div>
              </div>

              {childRows.map((row, index) => (
                <div className="kid-card" key={index}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Child Name*</label>
                      <input
                        name="txtKidsName"
                        className="input"
                        value={row.name}
                        onChange={(e) =>
                          handleInputChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Grade/Class*</label>
                      <input
                        name="txtKidsClassName"
                        className="input"
                        value={row.className}
                        onChange={(e) =>
                          handleInputChange(index, "className", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Child School ID*</label>
                    <input
                      name="txtKidsSchoolID"
                      className="input"
                      value={row.schoolID}
                      onChange={(e) =>
                        handleInputChange(index, "schoolID", e.target.value)
                      }
                    />
                  </div>

                  {childRows.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveRow(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <div className="btn-row-left">
                <button
                  type="button"
                  className="btn-link"
                  onClick={handleAddRow}
                >
                  <span className="trip-gradient-color">
                    <div className="row-inline">
                      <img
                        src={icon6}
                        alt="HEROZ"
                        className="icon-tint-pink"
                      />

                      <span> + Add more child</span>
                    </div>
                  </span>
                </button>
              </div>

              <div className="form-group">
                <label>Parents Note</label>
                <textarea
                  name="txtParentsNote"
                  className="input"
                  rows={4}
                  placeholder="Please include any medical conditions, allergies, or special requirements"
                />
              </div>

              <div className="terms">
                <h4>Terms & Condition</h4>
                <div className="terms-text">{ActivityData?.actAdminNotes}</div>
              </div>
            </div>
          </section>

          <DspToastMessage message={toastMessage} type={toastType} />
        </main>

        {/* ===== Footer (kept) ===== */}
        <footer className="site-footer">
          <div className="footer-top container ">
            <div className="footer-brand">
              <img src={herozlogo} alt="HEROZ" className="footer-logo" />
              <p className="footer-tag">Discover the hero in them</p>
              <div className="footer-social">
                <a href="#" aria-label="Instagram">
                  <FaInstagram />
                </a>
                <a href="#" aria-label="Facebook">
                  <FaFacebookF />
                </a>
                <a href="#" aria-label="Twitter">
                  <FaTwitter />
                </a>
              </div>
            </div>

            <div className="footer-contact">
              <h4>Contact Information</h4>
              <ul>
                <li>
                  <strong>Customer Support:</strong>{" "}
                  <a href="mailto:Herozapp1@gmail.com">Herozapp1@gmail.com</a>
                </li>
                <li>
                  <strong>Phone Number:</strong> +966 548066660
                </li>
                <li>
                  <strong>Headquarters:</strong> 8408 these alyamnees street,
                  Jeddah, Saudi arabia. 23454
                </li>
                <li>
                  <strong>CR:</strong> 4030580386
                </li>
                <li>
                  <strong>TAX ID:</strong> 3125655750900003
                </li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Company</h4>
              <ul>
                <li>
                  <a href="#">About Us</a>
                </li>
                <li>
                  <a href="#">Contact Us</a>
                </li>
              </ul>
            </div>

            <div className="footer-links">
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="#">Privacy</a>
                </li>
                <li>
                  <a href="#">Terms Of Service</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom container">
            <span>Copyright © Heroz {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>{" "}
    </>
  );
};

export default ProposalPage;
