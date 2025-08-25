// ProposalPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton,
} from "@coreui/react";
import { API_BASE_URL } from "../config";
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
import PaymentMethodPicker from "./paymentpicker";
import { executeMyFatoorahPayment } from "./payexcute";

import "../scss/payment.css";
import { getCurrentLoggedUserID, generatePayRefNo } from "../utils/operation";
import FoodInfo from "./foodinfo";

const MOBILE_RE = /^05\d{8}$/; // starts with 05 and total 10 digits

// Map PaymentMethodId -> UI label
const paymentLabelFromId = (id) => {
  switch (Number(id)) {
    case 11: return "Apple Pay";
    case 2:  return "VISA / MasterCard";
    case 14: return "STC Pay";
    case 6:  return "MADA";
    default: return `Method ${id}`;
  }
};

// Map PaymentMethodId -> tripPaymentTypeID you store in backend
const tripPaymentTypeIdFromId = (id) => {
  switch (Number(id)) {
    case 11: return "APPLE-PAY";
    case 2:  return "CREDIT-CARD";
    case 14: return "STC-PAY";
    case 6:  return "MADA";
    default: return "ONLINE";
  }
};

const ProposalPage = () => {
  const [error, setError] = useState("");
  const [checkedFoodItems, setCheckedFoodItems] = useState({});
  const [TripData, setTripData] = useState([]);
  const [txtactImageName1, setactImageName1] = useState(null);
  const [txtactImageName2, setactImageName2] = useState(null);
  const [txtactImageName3, setactImageName3] = useState(null);
  const [ActivityData, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  const [childRows, setChildRows] = useState([{ schoolID: "", name: "", className: "" }]);

  // Removed old selectedMethod radio; we rely only on PaymentMethodPicker
  const [selectedMethodId, setSelectedMethodId] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [absoluteLogoUrl, setAbsoluteLogoUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  // API for PaymentMethodPicker (backend that serves initiate-payment)
   

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
          body: JSON.stringify({ ActivityID: ActivityIDVal, VendorID: VendorIDVal, RequestID: RequestIDVal }),
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
  const handleCheckboxChange = (FoodID, isIncludedArg) => {
    const inferredIncluded =
      isIncludedArg ??
      (ActivityData?.foodList?.find((f) => f.FoodID === FoodID)?.Include === true);

    setCheckedFoodItems((prev) => {
      const next = { ...prev };
      if (inferredIncluded) {
        (ActivityData?.foodList ?? [])
          .filter((f) => f.Include === true)
          .forEach((f) => (next[f.FoodID] = false));
        next[FoodID] = true;
      } else {
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
      const payload = Array.isArray(data?.data) ? data.data[0] ?? null : data?.data ?? null;

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
      if (ActivityIDVal && VendorIDVal) fetchActivity(ActivityIDVal, VendorIDVal, RequestID);
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
    if (included.length > 0) initial[included[0].FoodID] = true;
    setCheckedFoodItems(initial);
  }, [ActivityData]);

  const activityImages = useMemo(
    () => [txtactImageName1, txtactImageName2, txtactImageName3].filter(Boolean),
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

  // ---------- helpers ----------
  // Student ID OPTIONAL now: only name + className required
  const isValidKid = (row) =>
    (row.name || "").trim() &&
    (row.className || "").trim();

  const validKids = useMemo(() => childRows.filter(isValidKid), [childRows]);
  const validKidsCount = validKids.length;

  // ======= total amount to pass into PaymentMethodPicker =======
  const paymentAmount = useMemo(() => {
    const count = validKidsCount > 0 ? validKidsCount : 1;
    return Number((grandTotalWithTax * count).toFixed(2));
  }, [grandTotalWithTax, validKidsCount]);

  // ---------- Build selection summary & payload ----------
  const buildSelectionSummaryAndPayload = () => {
    const RequestID = TripData?.RequestID;
    const ParentsID = getCurrentLoggedUserID();

    const includedId = (ActivityData?.foodList ?? [])
      .filter((f) => f.Include === true)
      .find((f) => checkedFoodItems[f.FoodID])?.FoodID;

    const includedName = (ActivityData?.foodList ?? []).find(
      (f) => f.FoodID === includedId
    )?.FoodName;

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

    const kidsInfo = validKids.map((row) => ({
      RequestID,
      ParentsID,
      KidsID: "",
      TripKidsSchoolNo: (row.schoolID || "").trim(), // optional
      TripKidsName: row.name.trim(),
      tripKidsClassName: row.className.trim(),
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

    const paymentLabel = paymentLabelFromId(selectedMethodId);

    const summary = {
      included: includedName || "-",
      extras: extraRows,
      kids: validKids.map((k) => ({
        name: k.name.trim(),
        className: k.className.trim(),
        schoolID: (k.schoolID || "").trim(),
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

    const payload = {
      RequestID,
      ParentsID,
      tripParentsName:
        document.querySelector('input[name="txtParentName"]')?.value.trim() || "",
      tripParentsMobileNo:
        document.querySelector('input[name="tripParentsMobileNo"]')?.value.trim() || "",
      tripParentsNote:
        document.querySelector('textarea[name="txtParentsNote"]')?.value.trim() || "",
      tripPaymentTypeID: tripPaymentTypeIdFromId(selectedMethodId),
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

    return { payload, summary };
  };

  // ---------- Validation ----------
  const validateBeforeSubmit = () => {
    // Only require included food selection if there are included options
    const hasMeals = Array.isArray(ActivityData?.foodList) && ActivityData.foodList.length > 0;
    const hasIncludedOptions = hasMeals && ActivityData.foodList.some((f) => f.Include === true);

    if (hasIncludedOptions) {
      const includedFoodRadio = document.querySelector('input[name="foodSelect"]:checked');
      if (!includedFoodRadio) {
        showError("Please select one Included food option.");
        return false;
      }
    }

    const parentName =
      document.querySelector('input[name="txtParentName"]')?.value.trim() || "";
    const parentMobile =
      document.querySelector('input[name="tripParentsMobileNo"]')?.value.trim() || "";

    if (!parentName) {
      showError("Please enter parent name.");
      return false;
    }
    if (!MOBILE_RE.test(parentMobile)) {
      showError("Parent phone must start with 05 and be exactly 10 digits.");
      return false;
    }

    if (validKids.length === 0) {
      showError("Please enter Child Information: Name and Class for at least one child.");
      return false;
    }

    if (!selectedMethodId) {
      showError("Please choose a payment method from the list above.");
      return false;
    }

    return true;
  };

  // Step 1: Validate then open confirm modal
  const handleSubmit = () => {
    if (TripData?.PaymentDueDate && isPaymentExpired(TripData.PaymentDueDate)) {
      setIsExpired(true);
      showError("We are sorry, the payment due date has finished. You cannot pay.");
      return;
    }

    if (!validateBeforeSubmit()) return;

    const { payload, summary } = buildSelectionSummaryAndPayload();
    setPendingPayload(payload);
    setConfirmSummary(summary);
    setConfirmOpen(true);
  };

  // Step 2: If confirmed, post payload and execute payment
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

      const schoolTotalTripCost = paymentAmount;
      const parentName =
        document.querySelector('input[name="txtParentName"]')?.value.trim() || "";
      const parentMobile =
        document.querySelector('input[name="tripParentsMobileNo"]')?.value.trim() || "";

      if (!selectedMethodId) {
        showError("Please choose a payment method from the list above.");
        setSubmitting(false);
        return;
      }

      try {
        const result = await executeMyFatoorahPayment({
          amount: schoolTotalTripCost,
          paymentMethodId: selectedMethodId,
          customer: {
            name: parentName,
            email: "no-reply@heroz.sa",
            mobile: parentMobile,
          },
          language: "EN",
          displayCurrency: "SAR",
          redirect: true,
        });
        console.log(result);
        if (!result.ok) {
          showError(result.error || "Payment could not be started.");
        }
      } catch (e) {
        showError(String(e));
      }
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

  // ---------- SEO / Social (Helmet) ----------
  const canonicalUrl = shareUrl || `${window.location.origin}${window.location.pathname}`;
  const program = useMemo(() => {
    const title = ActivityData?.actName
      ? `Heroz Trip — ${ActivityData.actName}`
      : "Heroz Trip — Proposal";
    const description = "Check your trip details with Heroz";
    const imageUrl = absoluteLogoUrl || "";
    return { title, description, imageUrl };
  }, [ActivityData, absoluteLogoUrl]);

  return (
    <>
      <Helmet>
        <title>{program.title}</title>
        <meta property="og:title" content={program.title} />
        <meta property="og:description" content={program.description} />
        {program.imageUrl ? <meta property="og:image" content={program.imageUrl} /> : null}
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={program.title} />
        <meta name="twitter:description" content={program.description} />
        {program.imageUrl ? <meta name="twitter:image" content={program.imageUrl} /> : null}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="bodyimg">
        <PrgHeader />

        <main className="proposal">
          {error && <div className="alert-error">{error}</div>}

          <PrgSchHeader
            schImageNameUrl={TripData?.schImageNameUrl}
            schName={TripData?.schName}
            schAddress1={TripData?.schAddress1}
            schAddress2={TripData?.schAddress2}
            activityName={ActivityData?.actName}
            activityImages={activityImages}
            carouselInterval={5000}
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
                        <img src={icon5} alt="HEROZ" className="icon-tint-pink" />
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
                        <img src={viewonmap} alt="HEROZ" className="footer-logo" />
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
              <h3 className="card-title trip-gradient-color fontsize40">Trips Pricing</h3>

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
                  {grandTotalWithTax.toFixed(2)} <img src={icon5} alt="HEROZ" />
                </span>
              </div>

              {validKidsCount > 1 && (
                <div className="summary-row total net-payable trip-gradient-color">
                  <span>Net Payable Amount ({validKidsCount} kids)</span>
                  <span>
                    {(grandTotalWithTax * validKidsCount).toFixed(2)}{" "}
                    <img src={icon5} alt="HEROZ" />
                  </span>
                </div>
              )}

              {/* ===== MyFatoorah: Initiate + Choose (reusable picker) ===== */}
              <div style={{ marginTop: 16 }}>
                <PaymentMethodPicker
                  amount={paymentAmount}
                  apiBase={API_BASE_URL}
                  currency="SAR"
                  onSelect={(id, method) => setSelectedMethodId(id)}
                  autoFetch
                />

                
              </div>

              <div className="divider" />

              {/* Removed hardcoded radios. Only the picker remains. */}
              <div className="payment-group">
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
                  <label>Parent Phone* (format: 05XXXXXXXX)</label>
                  <input
                    name="tripParentsMobileNo"
                    className="input"
                    inputMode="numeric"
                    pattern="^05\\d{8}$"
                    maxLength={10}
                    placeholder="05XXXXXXXX"
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    }}
                  />
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
                        onChange={(e) => handleInputChange(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Grade/Class*</label>
                      <input
                        name="txtKidsClassName"
                        className="input"
                        value={row.className}
                        onChange={(e) => handleInputChange(index, "className", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Child School ID (optional)</label>
                    <input
                      name="txtKidsSchoolID"
                      className="input"
                      value={row.schoolID}
                      onChange={(e) => handleInputChange(index, "schoolID", e.target.value)}
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
                <button type="button" className="btn-link" onClick={handleAddRow}>
                  <span className="trip-gradient-color">
                    <div className="row-inline">
                      <img src={icon6} alt="HEROZ" className="icon-tint-pink" />
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
                <h4>Proposal Message</h4>
                <div className="terms-text">{TripData?.ProposalMessage}</div>
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
          <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)} alignment="center">
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
                            {e.FoodName} — School {e.FoodSchoolPrice.toFixed(2)}, Vendor{" "}
                            {e.FoodVendorPrice.toFixed(2)}, Heroz {e.FoodHerozPrice.toFixed(2)} (Total{" "}
                            {e.Total.toFixed(2)})
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
                      <li>Base Trip (per student): {confirmSummary.totals.baseTripPerStudent}</li>
                      <li>Food (per student): {confirmSummary.totals.foodPerStudent}</li>
                      <li>Grand (per student): {confirmSummary.totals.grandPerStudent}</li>
                      <li>
                        Students: {confirmSummary.totals.students} — Net Amount:{" "}
                        {confirmSummary.totals.netAmount}
                      </li>
                    </ul>
                  </div>

                  <div style={{ marginTop: 6 }}>Are you sure you want to submit?</div>
                </div>
              ) : (
                <div>Loading summary…</div>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </CButton>
              <CButton
                color="primary"
                disabled={submitting}
                onClick={submitConfirmed}
                style={{ backgroundColor: "green" }}
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </CButton>
            </CModalFooter>
          </CModal>

          {/* Error Modal */}
          <CModal visible={errModalOpen} onClose={() => setErrModalOpen(false)} alignment="center">
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

        <ProgramFooter />
      </div>
    </>
  );
};

export default ProposalPage;
