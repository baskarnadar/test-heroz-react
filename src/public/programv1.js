import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";
import {
  CCarousel,
  CCarouselItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
} from "@coreui/react";
import { API_BASE_URL } from "../config";
import logo from "../assets/logo/default.png";
import herozlogo from "../assets/logo/herozlogo.png";
import viewonmap from "../assets/icon/viewonmap.png";
import icon1 from "../assets/icon/icon1.png";
import icon2 from "../assets/icon/icon2.png";
import icon3 from "../assets/icon/icon3.png";
import icon5 from "../assets/icon/icon5.png";
import icon6 from "../assets/icon/icon6.png";
import ProgramFooter from "/src/public/prgfooter"; 
import PrgHeader from "/src/public/Prgheader"; 
import PrgSchHeader from "/src/public/prgschheader";

import "../scss/payment.css";
import { getCurrentLoggedUserID, generatePayRefNo } from "../utils/operation";
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

  const [childRows, setChildRows] = useState([
    { schoolID: "", name: "", className: "" },
  ]);

  const [selectedMethod, setSelectedMethod] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [absoluteLogoUrl, setAbsoluteLogoUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  // Error Modal
  const [errModalOpen, setErrModalOpen] = useState(false);
  const [errModalTitle, setErrModalTitle] = useState("Error");
  const [errModalMsg, setErrModalMsg] = useState("");

  // Confirm Modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSummary, setConfirmSummary] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showError = (msg, title = "Error") => {
    setErrModalTitle(title);
    setErrModalMsg(msg);
    setErrModalOpen(true);
  };

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
      showError("Could not load activity details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Included items are RADIO, extras are CHECKBOXES.
  // Robust: supports handleCheckboxChange(FoodID) OR (FoodID, isIncluded)
  const handleCheckboxChange = (FoodID, isIncludedArg) => {
    const inferredIncluded =
      isIncludedArg ??
      (ActivityData?.foodList?.find((f) => f.FoodID === FoodID)?.Include ===
        true);

    setCheckedFoodItems((prev) => {
      const next = { ...prev };
      if (inferredIncluded) {
        // radio behavior for included: deselect all included first
        (ActivityData?.foodList ?? [])
          .filter((f) => f.Include === true)
          .forEach((f) => (next[f.FoodID] = false));
        next[FoodID] = true;
      } else {
        // checkbox behavior for extras
        next[FoodID] = !Boolean(prev[FoodID]);
      }
      return next;
    });
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
        ? data.data[0] ?? null
        : data?.data ?? null;

      const dueRaw = payload?.PaymentDueDate;
      const missingDue =
        dueRaw == null ||
        String(dueRaw).trim() === "" ||
        String(dueRaw).trim().toLowerCase() === "undefined" ||
        String(dueRaw).trim().toLowerCase() === "null";

      if (missingDue || isPaymentExpired(dueRaw)) {
        window.location.hash = "#/public/payerror";
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
      showError("Could not load trip data. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helpers for due date
  const hasRealDueDate = (raw) => {
    if (raw == null) return false;
    const s = String(raw).trim().toLowerCase();
    return s !== "" && s !== "undefined" && s !== "null" && s !== "nan";
  };

  const parseDueDate = (raw) => {
    if (!hasRealDueDate(raw)) return null;
    let s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split("/");
      s = `${yyyy}-${mm}-${dd}`;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const isPaymentExpired = (raw) => {
    const d = parseDueDate(raw);
    if (!d) return false;
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  // ====== Get RequestID from /public/program/:requestId with fallbacks ======
  const { requestId: routeId } = useParams();
  useEffect(() => {
    let id = routeId || "";

    if (!id) {
      const m = window.location.hash.match(/#\/public\/program\/([^?/#]+)/i);
      if (m && m[1]) id = m[1];
    }
    if (!id) {
      const qs = window.location.hash.split("?")[1] || "";
      const params = new URLSearchParams(qs);
      id = params.get("RequestID") || "";
    }

    setRequestId(id);

    if (id) {
      fetchTripData(id);
    } else {
      setError("RequestID is missing in URL");
      showError("RequestID is missing in the URL.");
    }

    try {
      const absLogo = new URL(herozlogo, window.location.origin).href;
      setAbsoluteLogoUrl(absLogo);
    } catch {
      setAbsoluteLogoUrl("");
    }

    const canonical = `${window.location.origin}${window.location.pathname}#/public/program/${id}`;
    setShareUrl(id ? canonical : window.location.href);
  }, [routeId]);

  useEffect(() => {
    if (!ActivityData) return;
    setactImageName1(ActivityData.actImageName1Url || "");
    setactImageName2(ActivityData.actImageName2Url || "");
    setactImageName3(ActivityData.actImageName3Url || "");
  }, [ActivityData]);

  // Default selection: first included ONCE when ActivityData changes
  useEffect(() => {
    if (!ActivityData?.foodList) return;

    const included = ActivityData.foodList.filter((f) => f.Include === true);

    const initial = {};
    (ActivityData.foodList || []).forEach((f) => (initial[f.FoodID] = false));
    if (included.length > 0) {
      initial[included[0].FoodID] = true;
    }
    setCheckedFoodItems(initial);
  }, [ActivityData]);

  const activityImages = useMemo(
    () =>
      [txtactImageName1, txtactImageName2, txtactImageName3].filter(Boolean),
    [txtactImageName1, txtactImageName2, txtactImageName3]
  );

  // Map: FoodID -> FoodSchoolPrice (from TripData.schoolreqfoodprice)
  const schoolPriceMap = useMemo(() => {
    const m = {};
    const list = TripData?.schoolreqfoodprice ?? [];
    for (const x of list) {
      if (x?.FoodID) m[x.FoodID] = Number(x.FoodSchoolPrice) || 0;
    }
    return m;
  }, [TripData]);

  // Trip price total (per student)
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

  // Food total (checked items only)
  const foodTotal = useMemo(() => {
    return (ActivityData?.foodList ?? []).reduce((sum, item) => {
      if (checkedFoodItems[item.FoodID]) {
        const school =
          schoolPriceMap[item.FoodID] ??
          (parseFloat(item?.RequestFoodSchoolPrice) || 0);
        const vendor =
          parseFloat(item?.FoodVendorPrice ?? item?.FoodPrice) || 0;
        const heroz = parseFloat(item?.FoodHerozPrice) || 0;
        return sum + (school + vendor + heroz);
      }
      return sum;
    }, 0);
  }, [ActivityData, checkedFoodItems, schoolPriceMap]);

  const grandTotal = priceTotal + foodTotal;
  const TAX_RATE = 0;
  const taxAmount = (Number(grandTotal) || 0) * TAX_RATE;
  const grandTotalWithTax = (Number(grandTotal) || 0) + taxAmount;

  // ---------- Build selection summary & payload ----------
  const buildSelectionSummaryAndPayload = () => {
    const RequestID = TripData?.RequestID;
    const ParentsID = getCurrentLoggedUserID();

    // Included (radio): one ID
    const includedId = (ActivityData?.foodList ?? [])
      .filter((f) => f.Include === true)
      .find((f) => checkedFoodItems[f.FoodID])?.FoodID;

    const includedName = (ActivityData?.foodList ?? []).find(
      (f) => f.FoodID === includedId
    )?.FoodName;

    // Extras
    const extrasPicked = (ActivityData?.foodList ?? []).filter(
      (f) => f.Include !== true && checkedFoodItems[f.FoodID]
    );

    const extraRows = extrasPicked.map((item) => {
      const school =
        schoolPriceMap[item.FoodID] ??
        (parseFloat(item?.RequestFoodSchoolPrice) || 0);
      const vendor = parseFloat(item?.FoodVendorPrice ?? item?.FoodPrice) || 0;
      const heroz = parseFloat(item?.FoodHerozPrice) || 0;
      return {
        FoodID: item.FoodID,
        FoodName: item.FoodName,
        FoodSchoolPrice: school,
        FoodVendorPrice: vendor,
        FoodHerozPrice: heroz,
        Total: school + vendor + heroz,
      };
    });

    // Valid kids
    const validKids = childRows
      .map((row) => ({
        schoolID: (row.schoolID || "").trim(),
        name: (row.name || "").trim(),
        className: (row.className || "").trim(),
      }))
      .filter((r) => r.schoolID && r.name && r.className);

    const kidsInfo = validKids.map((row) => ({
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
      PayTypeID: "ONLINE",
    }));

    const payload = {
      RequestID,
      ParentsID,
      tripParentsName:
        document.querySelector('input[name="txtParentName"]')?.value.trim() ||
        "",
      tripParentsMobileNo:
        document
          .querySelector('input[name="tripParentsMobileNo"]')
          ?.value.trim() || "",
      tripParentsNote:
        document
          .querySelector('textarea[name="txtParentsNote"]')
          ?.value.trim() || "",
      tripPaymentTypeID:
        selectedMethod === "creditCard" ? "CREDIT-CARD" : "APPLE-PAY",
      kidsInfo,
      FoodIncluded: includedId ? [includedId] : [],
      FoodExtra: extraRows.map(
        ({ FoodID, FoodSchoolPrice, FoodVendorPrice, FoodHerozPrice }) => ({
          FoodID,
          FoodSchoolPrice,
          FoodVendorPrice,
          FoodHerozPrice,
        })
      ),
    };

    const paymentLabel =
      selectedMethod === "creditCard" ? "Credit/Debit Card" : "Apple Pay";

    const summary = {
      included: includedName || "-",
      extras: extraRows,
      kids: validKids.map((k) => ({
        name: k.name,
        className: k.className,
        schoolID: k.schoolID,
      })),
      paymentLabel,
      totals: {
        baseTripPerStudent: priceTotal.toFixed(2),
        foodPerStudent: foodTotal.toFixed(2),
        grandPerStudent: grandTotalWithTax.toFixed(2),
        students: validKids.length,
        netAmount: (grandTotalWithTax * validKids.length).toFixed(2),
      },
    };

    return { payload, summary };
  };

  // ---------- Validation ----------
  const validateBeforeSubmit = () => {
    const includedFoodRadio = document.querySelector(
      'input[name="foodSelect"]:checked'
    );
    if (!includedFoodRadio) {
      showError("Please select one Included food option.");
      return false;
    }

    const hasValidChild = childRows.some((row) => {
      const name = (row.name || "").trim();
      const cls = (row.className || "").trim();
      const sid = (row.schoolID || "").trim();
      return name && cls && sid;
    });
    if (!hasValidChild) {
      showError(
        "Please enter Child Information: Name, Class and School ID for at least one child."
      );
      return false;
    }

    if (!selectedMethod) {
      showError("Please select a Payment Method.");
      return false;
    }

    // Basic parent fields
    const parentName =
      document.querySelector('input[name="txtParentName"]')?.value.trim() ||
      "";
    const parentMobile =
      document
        .querySelector('input[name="tripParentsMobileNo"]')
        ?.value.trim() || "";
    if (!parentName || !parentMobile) {
      showError("Please enter parent name and phone number.");
      return false;
    }

    return true;
  };

  // Step 1: Validate then open confirm modal
  const handleSubmit = () => {
    if (TripData?.PaymentDueDate && isPaymentExpired(TripData.PaymentDueDate)) {
      setIsExpired(true);
      showError(
        "We are sorry, the payment due date has finished. You cannot pay."
      );
      return;
    }

    if (!validateBeforeSubmit()) return;

    const { payload, summary } = buildSelectionSummaryAndPayload();
    setPendingPayload(payload);
    setConfirmSummary(summary);
    setConfirmOpen(true);
  };

  // Step 2: If confirmed, post payload
  const submitConfirmed = async () => {
    if (!pendingPayload) {
      setConfirmOpen(false);
      showError("Nothing to submit. Please try again.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/trip/tripAddParentsKidsInfo`,
        {
          method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pendingPayload),
        }
      );
      if (!response.ok) throw new Error("Failed to submit data");
      await response.json();
      setConfirmOpen(false);
      window.location.replace("#/public/paysuccess");
    } catch (err) {
      console.error("Submit error:", err);
      setConfirmOpen(false);
      showError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Heroz – Check your trip details: ${shareUrl}`
  )}`;

  const pageTitle = `Heroz Trip — ${ActivityData?.actName || "Proposal"}`;
  const ogDesc = "Check your trip details with Heroz";

  return (
    <>
      {/* SEO / Social meta */}
      <Helmet>
        <title>{pageTitle}</title>
        <meta property="og:title" content="Heroz" />
        <meta property="og:description" content={ogDesc} />
        {absoluteLogoUrl ? (
          <meta property="og:image" content={absoluteLogoUrl} />
        ) : null}
        {shareUrl ? <meta property="og:url" content={shareUrl} /> : null}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Heroz" />
        <meta name="twitter:description" content={ogDesc} />
        {absoluteLogoUrl ? (
          <meta name="twitter:image" content={absoluteLogoUrl} />
        ) : null}
      </Helmet>

      <div className="bodyimg">
       
       
       <PrgHeader />

        {/* PAGE */}
        <main className="proposal">
          {error && <div className="alert-error">{error}</div>}

         <PrgSchHeader
  schImageNameUrl={TripData?.schImageNameUrl}
  schName={TripData?.schName}
  schAddress1={TripData?.schAddress1}
  schAddress2={TripData?.schAddress2}
  activityName={ActivityData?.actName}
  activityImages={activityImages}
  carouselInterval={5000} // optional
/>

          {/* Trip info */}
          <section className="trip-info" aria-labelledby="trip-info-title">
            <div className="card about-details">
              <div className="about-left">
                <h2 className="section-title trip-gradient-color fontsize40">
                  Trip Information
                </h2>
                <h3 className="card-title">About This Trip</h3>
                <p className="card-text">{ActivityData?.actDesc}</p>
              </div>

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
                  schoolReqFoodPrice={TripData?.schoolreqfoodprice ?? []}
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
                <h4>Vendor Terms & Condition</h4>
                <div className="terms-text">{ActivityData?.actAdminNotes}</div>
              </div>
              <div className="terms">
                <h4>School Terms & Condition</h4>
                <div className="terms-text">{TripData?.SchoolTerms}</div>
              </div>
            </div>
          </section>

          {/* Confirm Modal */}
          <CModal
            visible={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            alignment="center"
          >
            <CModalHeader onClose={() => setConfirmOpen(false)}>
              <CModalTitle>Confirm your selections</CModalTitle>
            </CModalHeader>
            <CModalBody>
              {confirmSummary ? (
                <div className="confirm-summary">
                  <div style={{ marginBottom: 12 }}>
                    <strong>Included Food:</strong> {confirmSummary.included}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>Extra Food:</strong>
                    {confirmSummary.extras.length === 0 ? (
                      <div>None</div>
                    ) : (
                      <ul style={{ marginTop: 6 }}>
                        {confirmSummary.extras.map((e) => (
                          <li key={e.FoodID}>
                            {e.FoodName} — School {e.FoodSchoolPrice.toFixed(2)}
                            , Vendor {e.FoodVendorPrice.toFixed(2)}, Heroz{" "}
                            {e.FoodHerozPrice.toFixed(2)} (Total{" "}
                            {e.Total.toFixed(2)})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>Kids ({confirmSummary.kids.length}):</strong>
                    {confirmSummary.kids.length === 0 ? (
                      <div>None</div>
                    ) : (
                      <ul style={{ marginTop: 6 }}>
                        {confirmSummary.kids.map((k, idx) => (
                          <li key={idx}>
                            {k.name} — Class {k.className}, School ID {k.schoolID}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>Payment Method:</strong> {confirmSummary.paymentLabel}
                  </div>

                  <div>
                    <strong>Totals:</strong>
                    <ul style={{ marginTop: 6 }}>
                      <li>
                        Base Trip (per student):{" "}
                        {confirmSummary.totals.baseTripPerStudent}
                      </li>
                      <li>
                        Food (per student): {confirmSummary.totals.foodPerStudent}
                      </li>
                      <li>
                        Grand (per student):{" "}
                        {confirmSummary.totals.grandPerStudent}
                      </li>
                      <li>
                        Students: {confirmSummary.totals.students} — Net Amount:{" "}
                        {confirmSummary.totals.netAmount}
                      </li>
                    </ul>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    Are you sure you want to submit?
                  </div>
                </div>
              ) : (
                <div>Loading summary…</div>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </CButton>
              <CButton color="primary" disabled={submitting} onClick={submitConfirmed} style={{backgroundColor:"green"}}>
                {submitting ? "Submitting..." : "Yes, Submit"}
              </CButton>
            </CModalFooter>
          </CModal>

          {/* Error Modal */}
          <CModal
            visible={errModalOpen}
            onClose={() => setErrModalOpen(false)}
            alignment="center"
          >
            <CModalHeader onClose={() => setErrModalOpen(false)}>
              <CModalTitle>{errModalTitle}</CModalTitle>
            </CModalHeader>
            <CModalBody>
              <p>{errModalMsg}</p>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setErrModalOpen(false)}>
                Close
              </CButton>
            </CModalFooter>
          </CModal>
        </main>

        {/* Footer */}
      <ProgramFooter />
      </div>
    </>
  );
};

export default ProposalPage;
