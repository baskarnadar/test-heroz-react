// program.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
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
import TripCostZero from "./tripcostzero";

import "../scss/payment.css";
import { getCurrentLoggedUserID, generatePayRefNo } from "../utils/operation";
import FoodInfo from "./foodinfo";

// 🔤 i18n packs
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

const MOBILE_RE = /^05\d{8}$/; // starts with 05 and total 10 digits
const PAYERROR_URL = "https://school.heroz.sa/public/payerror";

// Map PaymentMethodId -> UI label
const paymentLabelFromId = (id) => {
  switch (Number(id)) {
    case 11:
      return "Apple Pay";
    case 2:
      return "VISA / MasterCard";
    case 14:
      return "STC Pay";
    case 6:
      return "MADA";
    default:
      return `Method ${id}`;
  }
};

const getFormattedDateTime = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} : ${hh}:${min}:${ss}`;
};

// Map PaymentMethodId -> tripPaymentTypeID you store in backend
const tripPaymentTypeIdFromId = (id) => {
  switch (Number(id)) {
    case 11:
      return "APPLE-PAY";
    case 2:
      return "CREDIT-CARD";
    case 14:
      return "STC-PAY";
    case 6:
      return "MADA";
    default:
      return "ONLINE";
  }
};

const ProposalPage = () => {
  // 🌐 language state (persist to localStorage) — DEFAULT ARABIC
  const initialLang = (() => {
    const stored = localStorage.getItem("heroz_lang");
    if (stored === "ar" || stored === "en") return stored;
    localStorage.setItem("heroz_lang", "ar"); // persist default
    return "ar";
  })();
  const [lang, setLang] = useState(initialLang);
  const dict = lang === "ar" ? arPack : enPack;
  const dir = lang === "ar" ? "rtl" : "ltr";

  // Enforce <html> lang/dir (belt & suspenders)
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", lang === "ar" ? "ar" : "en");
    document.body.setAttribute("dir", dir);
  }, [dir, lang]);

  // UI state (existing)
  const [error, setError] = useState("");
  const [checkedFoodItems, setCheckedFoodItems] = useState({});
  const [TripData, setTripData] = useState([]);
  const [txtactImageName1, setactImageName1] = useState(null);
  const [txtactImageName2, setactImageName2] = useState(null);
  const [txtactImageName3, setactImageName3] = useState(null);
  const [ActivityData, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  // ➕ added gender to each row (kept your original fields)
  const [childRows, setChildRows] = useState([
    { schoolID: "", name: "", className: "", gender: "" },
  ]);

  // Removed old selectedMethod radio; we rely only on PaymentMethodPicker
  const [selectedMethodId, setSelectedMethodId] = useState(null);

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

  // Zero-cost modal
  const [showZeroCostModal, setShowZeroCostModal] = useState(false);

  // 🔍 DEBUG: API / Payload / Result
  const [debugApiUrl, setDebugApiUrl] = useState("");
  const [debugPayload, setDebugPayload] = useState(null);
  const [debugResult, setDebugResult] = useState(null);

  // 🌐 toggle language
  const toggleLang = () => {
    const next = lang === "ar" ? "en" : "ar";
    setLang(next);
    localStorage.setItem("heroz_lang", next);
    // Flip document direction immediately
    const html = document.documentElement;
    html.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
    html.setAttribute("lang", next === "ar" ? "ar" : "en");
    document.body.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
  };

  const showError = (msg, title = dict.errorTitle) => {
    setErrModalTitle(title);
    setErrModalMsg(msg);
    setErrModalOpen(true);
  };

  const handleAddRow = () =>
    setChildRows([
      ...childRows,
      { schoolID: "", name: "", className: "", gender: "" },
    ]);

  const handleRemoveRow = (idx) =>
    setChildRows((prev) => prev.filter((_, i) => i !== idx));

  const handleInputChange = (index, field, value) => {
    const updated = [...childRows];
    updated[index][field] = value;
    setChildRows(updated);
  };

  useEffect(() => {
    document.body.classList.add("hide-chrome");
    document.documentElement.setAttribute("dir", dir);
    return () => document.body.classList.remove("hide-chrome");
  }, [dir]);

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
      showError(dict.errCouldNotLoadActivity);
    } finally {
      setLoading(false);
    }
  };

  // Included items are RADIO, extras are CHECKBOXES.
  const handleCheckboxChange = (FoodID, isIncludedArg) => {
    const inferredIncluded =
      isIncludedArg ??
      (ActivityData?.foodList?.find((f) => f.FoodID === FoodID)?.Include ===
        true);

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
      showError(dict.errCouldNotLoadTrip);
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
      showError(dict.errRequestIdMissing);
    }

    try {
      const absLogo = new URL(herozlogo, window.location.origin).href;
      setAbsoluteLogoUrl(absLogo);
    } catch {
      setAbsoluteLogoUrl("");
    }

    const canonical = `${window.location.origin}${window.location.pathname}#/public/program/${id}`;
    setShareUrl(id ? canonical : window.location.href);
  }, [routeId]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const filteredPriceList = (ActivityData?.priceList ?? []).filter((p) => {
    const vendor = parseFloat(p?.Price);
    const heroz = parseFloat(p?.HerozStudentPrice);
    const school = parseFloat(p?.RequestSchoolPrice);
    return (
      Number.isFinite(vendor) ||
      Number.isFinite(heroz) ||
      Number.isFinite(school)
    );
  });

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

  // ----------------- VAT CALCULATION -----------------
  // VAT from base trip prices (per student)
  const tripVatAmount = useMemo(() => {
    const list = ActivityData?.priceList ?? [];
    return list.reduce((sum, item) => {
      const actVat = parseFloat(item?.actPriceVatAmount) || 0;
      const herozVat = parseFloat(item?.HerozStudentPriceVatAmount) || 0;
      const schoolVat= parseFloat(item?.RequestSchoolPriceVatAmount) || 0;
      // (SchoolPriceVatAmount is ignored as per your formula)
       console.log(actVat);
        console.log(herozVat);
         console.log(schoolVat);
      return sum + actVat + herozVat+schoolVat;
      
    }, 0);
  }, [ActivityData]);

  // VAT from selected food items only (per student)
  const foodVatAmount = useMemo(() => {
    const list = ActivityData?.foodList ?? [];
    return list.reduce((sum, item) => {
      if (!checkedFoodItems[item.FoodID]) return sum;
      const foodPriceVat = parseFloat(item?.FoodPriceVatAmount) || 0;
      const foodHerozVat = parseFloat(item?.FoodHerozPriceVatAmount) || 0;
       const foodSchoolVat = parseFloat(item?.RequestFoodSchoolPriceVatAmount) || 0;
      // (FoodSchoolPriceVatAmount ignored as per your formula)
      return sum + foodPriceVat + foodHerozVat+foodSchoolVat;
    }, 0);
  }, [ActivityData, checkedFoodItems]);

  // Final VAT per student: act + heroz + food + food-heroz
  const vatAmount = Number((tripVatAmount + foodVatAmount).toFixed(2));
  // ---------------------------------------------------

  // ----------------- TOTAL (NO VAT IN TOTALS YET) -----------------
  const grandTotal = priceTotal + foodTotal; // raw per-student subtotal (trip + food)

  // Subtotal per student (trip + food), rounded
  const perStudentSubTotal = Number((Number(grandTotal) || 0).toFixed(2));

  // Total payable per student = subtotal (NO VAT added into total for now)
  const perStudentTotal = perStudentSubTotal;

  // Keep your old variable names so the rest of the code still works
  const taxAmount = 0; // backend tax field still 0.00 (display only)
  const grandTotalWithTax = perStudentTotal;
  // ---------------------------------------------------------------

  // ---------- helpers ----------
  // Student ID OPTIONAL now: only name + className required
  const isValidKid = (row) =>
    (row.name || "").trim() && (row.className || "").trim();

  const validKids = useMemo(() => childRows.filter(isValidKid), [childRows]);
  const validKidsCount = validKids.length;

  // ======= total amount to pass into PaymentMethodPicker =======
  const paymentAmount = useMemo(() => {
    const count = validKidsCount > 0 ? validKidsCount : 1;
    return Number((grandTotalWithTax * count).toFixed(2));
  }, [grandTotalWithTax, validKidsCount]);

  // ======= AUTO-MODAL if trip cost is zero or less (no immediate redirect) =======
  useEffect(() => {
    if (!loading && ActivityData) {
      const perStudent = Number(grandTotalWithTax) || 0;
      if (perStudent <= 0 || paymentAmount <= 0) {
        setShowZeroCostModal(true); // ✅ open modal automatically
      }
    }
  }, [loading, ActivityData, grandTotalWithTax, paymentAmount]);

  // ✅ EXTRA: also open automatically if *base* trip cost itself is zero/less
  useEffect(() => {
    if (!loading && ActivityData) {
      const baseTrip = Number(priceTotal) || 0;
      if (baseTrip <= 0) {
        setShowZeroCostModal(true);
      }
    }
  }, [loading, ActivityData, priceTotal]);

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
      const vendor =
        parseFloat(item?.FoodVendorPrice ?? item?.FoodPrice) || 0;
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

    // By Default
    var userDefinedFieldVal =
      TripData.actRequestRefNo +
      "-" +
      ActivityData.actName +
      "-" +
      getFormattedDateTime();

    if (ActivityData.actRequestStatus == "TRIP-BOOKED")
      userDefinedFieldVal =
        TripData.actRequestRefNo +
        "-" +
        ActivityData.actName +
        getFormattedDateTime();

    var customerReferenceVal = RequestID + "-" + TripData.actRequestRefNo;
    // Local Storage
    const PayRefNoVal = generatePayRefNo();
    localStorage.setItem("PayRefNo", PayRefNoVal);
    localStorage.setItem("customerReference", customerReferenceVal);
    localStorage.setItem("userDefinedField", userDefinedFieldVal);

    const kidsInfo = validKids.map((row) => ({
      RequestID,
      ParentsID,
      KidsID: "",
      TripKidsSchoolNo: (row.schoolID || "").trim(),
      TripKidsName: row.name.trim(),
      tripKidsClassName: row.className.trim(),
      TripKidsGender: (row.gender || "").trim(),
      TripCost: perStudentSubTotal.toFixed(2), // subtotal (trip + food)
      TripFoodCost: foodTotal.toFixed(2),
      TripTaxAmount: taxAmount.toFixed(2), // 0.00 (no VAT to backend yet)
      TripFullAmount: grandTotalWithTax.toFixed(2), // same as subtotal
      PayStaus: "NEW",
      InvoiceNo: "0",
      MyFatrooahRefNo: "0",
      PayRefNo: PayRefNoVal,
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
        gender: (k.gender || "").trim(),
      })),
      paymentLabel,
      totals: {
        baseTripPerStudent: perStudentSubTotal.toFixed(2),
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
        document
          .querySelector('input[name="txtParentName"]')
          ?.value.trim() || "",
      tripParentsMobileNo:
        document
          .querySelector('input[name="tripParentsMobileNo"]')
          ?.value.trim() || "",
      tripParentsNote:
        document
          .querySelector('textarea[name="txtParentsNote"]')
          ?.value.trim() || "",
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
    const hasMeals =
      Array.isArray(ActivityData?.foodList) &&
      ActivityData.foodList.length > 0;
    const hasIncludedOptions =
      hasMeals && ActivityData.foodList.some((f) => f.Include === true);

    if (hasIncludedOptions) {
      const includedFoodRadio = document.querySelector(
        'input[name="foodSelect"]:checked'
      );
      if (!includedFoodRadio) {
        showError(dict.errSelectIncludedFood);
        return false;
      }
    }

    const parentName =
      document
        .querySelector('input[name="txtParentName"]')
        ?.value.trim() || "";
    const parentMobile =
      document
        .querySelector('input[name="tripParentsMobileNo"]')
        ?.value.trim() || "";

    if (!parentName) {
      showError(dict.errEnterParentName);
      return false;
    }
    if (!MOBILE_RE.test(parentMobile)) {
      showError(dict.errParentPhoneFormat);
      return false;
    }

    if (validKids.length === 0) {
      showError(dict.errEnterChildInfo);
      return false;
    }

    // 🔐 NEW: child name length validation (minimum 10 characters)
    for (const kid of validKids) {
      if (kid.name.trim().length < 10) {
        showError(
          lang === "ar"
            ? "يجب أن يكون اسم الطفل 10 أحرف على الأقل."
            : "Child name must be at least 10 characters long."
        );
        return false;
      }
    }

    if (!selectedMethodId) {
      showError(dict.errChoosePaymentMethod);
      return false;
    }

    const termsCheckbox = document.getElementById("termsAgree");
    if (!termsCheckbox || !termsCheckbox.checked) {
      showError(
        dict.errAgreeTerms || "Please agree to the terms and conditions."
      );
      return false;
    }

    return true;
  };

  // Step 1: Validate then open confirm modal
  const handleSubmit = () => {
    if (TripData?.PaymentDueDate && isPaymentExpired(TripData.PaymentDueDate)) {
      setIsExpired(true);
      showError(dict.errDueDateFinished);
      return;
    }

    // ✅ EXTRA: block & open modal when base trip cost is zero/less
    if ((Number(priceTotal) || 0) <= 0) {
      setShowZeroCostModal(true);
      return;
    }

    const perStudent = Number(grandTotalWithTax) || 0;
    if (perStudent <= 0 || paymentAmount <= 0) {
      setShowZeroCostModal(true); // ✅ show modal instead of redirecting immediately
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
      showError(dict.errNothingToSubmit);
      return;
    }
    setSubmitting(true);

    // 🔍 DEBUG: capture API + payload (kids info insert)
    const endpoint = `${API_BASE_URL}/admindata/activityinfo/trip/tripAddParentsKidsInfo`;
    setDebugApiUrl(endpoint);
    setDebugPayload(pendingPayload);
    let submitJson = null;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingPayload),
      });
      if (!response.ok) throw new Error("Failed to submit data");
      submitJson = await response.json();

      // store initial debug result with submit response
      setDebugResult({ submitResponse: submitJson });

      setConfirmOpen(false);

      const schoolTotalTripCost = paymentAmount;
      const parentName =
        document
          .querySelector('input[name="txtParentName"]')
          ?.value.trim() || "";
      const parentMobile =
        document
          .querySelector('input[name="tripParentsMobileNo"]')
          ?.value.trim() || "";

      if (!selectedMethodId) {
        showError(dict.errChoosePaymentMethod);
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
          language: lang === "ar" ? "AR" : "EN",
          displayCurrency: "SAR",
          redirect: true,
        });
        console.log(result);

        // 🔍 DEBUG: attach payment result as well
        setDebugResult((prev) => ({
          ...(prev || {}),
          paymentResult: result,
        }));

        if (!result.ok) {
          showError(result.error || dict.errPaymentCouldNotStart);
        }
      } catch (e) {
        showError(String(e));
      }
    } catch (err) {
      console.error("Submit error:", err);
      setConfirmOpen(false);
      showError(dict.errSubmissionFailed);

      // if error, also reflect it in debug
      setDebugResult((prev) => ({
        ...(prev || {}),
        submitError: String(err),
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${dict.brandName} – ${dict.shareTripText}: ${shareUrl}`
  )}`;

  // ---------- SEO / Social (Helmet) ----------
  const canonicalUrl =
    shareUrl || `${window.location.origin}${window.location.pathname}`;
  const program = useMemo(() => {
    const title = ActivityData?.actName
      ? `${dict.seoTripPrefix} — ${ActivityData.actName}`
      : `${dict.seoTripPrefix} — ${dict.seoProposal}`;
    const description = dict.seoDescription;
    const imageUrl = absoluteLogoUrl || "";
    return { title, description, imageUrl };
  }, [ActivityData, absoluteLogoUrl, dict]);

  return (
    <>
      {/* Also set <html> attributes via Helmet for SSR correctness */}
      <Helmet htmlAttributes={{ lang: lang === "ar" ? "ar" : "en", dir }}>
        <title>{program.title}</title>
        <meta property="og:title" content={program.title} />
        <meta property="og:description" content={program.description} />
        {program.imageUrl ? (
          <meta property="og:image" content={program.imageUrl} />
        ) : null}
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={program.title} />
        <meta name="twitter:description" content={program.description} />
        {program.imageUrl ? (
          <meta name="twitter:image" content={program.imageUrl} />
        ) : null}
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="bodyimg" dir={dir}>
        <PrgHeader lang={lang} onToggleLang={toggleLang} />

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
                  {dict.tripInformation}
                </h2>
                <h3 className="card-title">{dict.aboutThisTrip}</h3>
                <p className="card-text">
                  {ActivityData?.actDesc
                    ?.split("\n")
                    .map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                </p>
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
                        <span> {dict.tripCost}</span>
                      </div>
                    </div>
                    <div className="detail-value ">
                      {perStudentSubTotal.toFixed(2)}{" "}
                      <img src={icon5} alt="HEROZ" />
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
                            <span>{dict.date}</span>
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
                        <span>{dict.time}</span>
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
                        <span>{dict.location}</span>
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
                        aria-label={dict.viewOnMap}
                        title={dict.viewOnMap}
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
                {dict.tripsPricing}
              </h3>

              <div className="price-row">
                <span className="price-label fontsize20">
                  {dict.baseTripCost}
                </span>
                <span className="price-value fontsize20">
                  {perStudentSubTotal.toFixed(2)}{" "}
                  <img src={icon5} alt="HEROZ" />
                </span>
              </div>

              <div className="divider" />
              <div className="price-subtitle">{dict.included}</div>
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
                {/* VAT row (per student) */}
                <div className="summary-row">
                  <span>{dict.vatAmount}</span>
                  <span>
                    {vatAmount.toFixed(2)} <img src={icon5} alt="HEROZ" />
                  </span>
                </div>

                {/* Subtotal row (trip + food, no VAT) */}
                <div className="summary-row">
                  <span>{dict.subtotal}</span>
                  <span>
                    {perStudentSubTotal.toFixed(2)}{" "}
                    <img src={icon5} alt="HEROZ" />
                  </span>
                </div>
              </div>

              {/* Total Payable (per student) = subtotal (NO VAT included yet) */}
              <div className="summary-row total trip-gradient-color">
                <span>
                  <div>{dict.totalPayable}</div>
                  <div>({dict.perStudent})</div>
                </span>
                <span>
                  {grandTotalWithTax.toFixed(2)}{" "}
                  <img src={icon5} alt="HEROZ" />
                </span>
              </div>

              {/* Net payable only if more than 1 kid */}
              {validKidsCount > 1 && (
                <div className="summary-row total net-payable trip-gradient-color">
                  <span>
                    {dict.netPayableAmount.replace(
                      "{count}",
                      validKidsCount
                    )}
                  </span>
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
                  lang={lang}
                />
              </div>

              <div className="divider" />

              {/* Removed hardcoded radios. Only the picker remains. */}
              <div className="payment-group">
                <button className="btn-primary" onClick={handleSubmit}>
                  {dict.continueToPayment}
                </button>
              </div>
            </div>

            {/* Booking form */}
            <div className="card booking">
              <h3 className="card-title trip-gradient-color fontsize40">
                {dict.childInfoBooking}
              </h3>

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    {dict.parentNameReq}
                    <span
                      style={{ color: "red", fontSize: "25px" }}
                    >
                      {" "}
                      *
                    </span>
                  </label>
                  <input name="txtParentName" className="input" />
                </div>
                <div className="form-group">
                  <label>
                    {dict.parentPhoneReq}
                    <span
                      style={{ color: "red", fontSize: "25px" }}
                    >
                      {" "}
                      *
                    </span>
                  </label>
                  <input
                    name="tripParentsMobileNo"
                    className="input"
                    inputMode="numeric"
                    pattern="^05\\d{8}$"
                    maxLength={10}
                    placeholder="05XXXXXXXX"
                    onInput={(e) => {
                      e.target.value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                    }}
                  />
                </div>
              </div>

              {childRows.map((row, index) => (
                <div className="kid-card" key={index}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>
                        {dict.childNameReq}
                        <span
                          style={{ color: "red", fontSize: "25px" }}
                        >
                          {" "}
                          *
                        </span>
                      </label>
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
                      <label>
                        {dict.gradeClassReq}
                        <span
                          style={{ color: "red", fontSize: "25px" }}
                        >
                          {" "}
                          *
                        </span>
                      </label>
                      <input
                        name="txtKidsClassName"
                        className="input"
                        value={row.className}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "className",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* ➕ Gender select */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label>{dict.gender}</label>
                      <select
                        className="input"
                        value={row.gender}
                        onChange={(e) =>
                          handleInputChange(index, "gender", e.target.value)
                        }
                      >
                        <option value="">{dict.select}</option>
                        <option value="Male">{dict.male}</option>
                        <option value="Female">{dict.female}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{dict.childSchoolIdOptional}</label>
                      <input
                        name="txtKidsSchoolID"
                        className="input"
                        value={row.schoolID}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "schoolID",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  {childRows.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveRow(index)}
                    >
                      {dict.remove}
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
                      <span> {dict.addMoreChild}</span>
                    </div>
                  </span>
                </button>
              </div>

              <div className="form-group">
                <label>{dict.parentsNote}</label>
                <textarea
                  name="txtParentsNote"
                  className="input"
                  rows={4}
                  placeholder={dict.parentsNotePlaceholder}
                />
              </div>

              <div className="terms">
                <h4>{dict.proposalMessage}</h4>
                <div className="terms-text">
                  {TripData?.ProposalMessage?.split("\n").map(
                    (line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    )
                  )}
                </div>
              </div>

              <div className="terms">
                <h4>{dict.vendorTerms}</h4>
                <div className="terms-text">
                  {ActivityData?.actAdminNotes
                    ?.split("\n")
                    .map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                </div>
              </div>
              <div className="terms">
                <h4>{dict.schoolTerms}</h4>
                <div className="terms-text">
                  {TripData?.SchoolTerms?.split("\n").map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
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
              <CModalTitle>{dict.confirmSelections}</CModalTitle>
            </CModalHeader>
            <CModalBody>
              {confirmSummary ? (
                <div className="confirm-summary">
                  <div style={{ marginBottom: 12 }}>
                    <strong>{dict.includedFood}</strong>{" "}
                    {confirmSummary.included}
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <strong>{dict.paymentMethod}</strong>{" "}
                    {confirmSummary.paymentLabel}
                  </div>

                  <div>
                    <strong>{dict.totals}</strong>
                    <ul style={{ marginTop: 6 }}>
                      <li>
                        {dict.baseTripPerStudent}:{" "}
                        {confirmSummary.totals.baseTripPerStudent}
                      </li>
                      <li>
                        {dict.foodPerStudent}:{" "}
                        {confirmSummary.totals.foodPerStudent}
                      </li>
                      <li>
                        {dict.grandPerStudent}:{" "}
                        {confirmSummary.totals.grandPerStudent}
                      </li>
                      <li>
                        {dict.studentsLabel}:{" "}
                        {confirmSummary.totals.students} —{" "}
                        {dict.netAmountLabel}:{" "}
                        {confirmSummary.totals.netAmount}
                      </li>
                    </ul>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    {dict.areYouSureSubmit}
                  </div>
                </div>
              ) : (
                <div>{dict.loadingSummary}</div>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton
                color="secondary"
                onClick={() => setConfirmOpen(false)}
              >
                {dict.cancel}
              </CButton>
              <CButton
                color="primary"
                disabled={submitting}
                onClick={submitConfirmed}
                style={{ backgroundColor: "green" }}
              >
                {submitting ? dict.submitting : dict.yesSubmit}
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
              <CButton
                color="secondary"
                onClick={() => setErrModalOpen(false)}
              >
                {dict.close}
              </CButton>
            </CModalFooter>
          </CModal>

          {/* Zero/negative trip cost modal (auto-redirects after Xs) */}
          <TripCostZero
            visible={showZeroCostModal}
            seconds={30}
            url={PAYERROR_URL}
            lang={lang}
            onClose={() => {
              setShowZeroCostModal(false);
              window.location.href = PAYERROR_URL;
            }}
          />

          {/* 🔍 DEBUG PANEL: API / Payload / Result */}
          {/* <section className="container" style={{ marginTop: 24 }}>
            <div
              className="card"
              style={{
                background: "#111",
                color: "#0f0",
                fontFamily: "monospace",
                fontSize: 12,
                maxHeight: 400,
                overflow: "auto",
              }}
            >
              <h4 style={{ marginBottom: 8 }}>
                {lang === "ar"
                  ? "منطقة تصحيح API (للاختبار فقط)"
                  : "API Debug Panel (for testing)"}
              </h4>
              <div style={{ marginBottom: 8 }}>
                <strong>API:</strong>{" "}
                <span>{debugApiUrl || "(no API called yet)"}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Payload:</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {debugPayload
                    ? JSON.stringify(debugPayload, null, 2)
                    : "(no payload yet)"}
                </pre>
              </div>
              <div>
                <strong>Result:</strong>
                <pre style={{ whiteSpace: "pre-wrap" }}>
                  {debugResult
                    ? JSON.stringify(debugResult, null, 2)
                    : "(no result yet)"}
                </pre>
              </div>
            </div>
          </section> */}
        </main>

        <ProgramFooter lang={lang} />
      </div>
    </>
  );
};

export default ProposalPage;
