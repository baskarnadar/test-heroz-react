// program.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
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
import ProgramFooter from "/src/public/prgfooter";
import PrgHeader from "/src/public/Prgheader";
import PrgSchHeader from "/src/public/prgschheader";
import TripCostZero from "./tripcostzero";

import "../scss/payment.css";
import { getCurrentLoggedUserID, generatePayRefNo } from "../utils/operation";

// 🔤 i18n packs
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

// NEW: pricing section extracted
import TrupSummary from "../public/component/tripsummary";
// NEW: parent form extracted
import ParentForm from "../public/component/parentform";

// 🔹 NEW: import MyFatoorah helper (this replaces window.executeMyFatoorahPayment)
import { executeMyFatoorahPayment } from "../services/myfatoorah";

const MOBILE_RE = /^05\d{8}$/; // starts with 05 and total 10 digits
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // simple email format check
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
  const navigate = useNavigate();

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

  // Enforce <html> lang/dir
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", lang === "ar" ? "ar" : "en");
    document.body.setAttribute("dir", dir);
  }, [dir, lang]);

  // UI state
  const [error, setError] = useState("");
  const [checkedFoodItems, setCheckedFoodItems] = useState({});
  const [TripData, setTripData] = useState([]);
  const [txtactImageName1, setactImageName1] = useState(null);
  const [txtactImageName2, setactImageName2] = useState(null);
  const [txtactImageName3, setactImageName3] = useState(null);
  const [ActivityData, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  // ➕ kids
  const [childRows, setChildRows] = useState([
    { schoolID: "", name: "", className: "", gender: "" },
  ]);

  // 💡 food quantity per FoodID (for EXTRA items)
  const [foodQty, setFoodQty] = useState({});

  // MyFatoorah method
  const [selectedMethodId, setSelectedMethodId] = useState(null);

  const [menuOpen, setMenuOpen] = useState(false); // not used but kept
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

  // ✅ freeze "Trip Price Including VAT" once (base price + base VAT only)
  const [initialTripPriceInclVat, setInitialTripPriceInclVat] =
    useState(null);

  // 🌐 toggle language
  const toggleLang = () => {
    const next = lang === "ar" ? "en" : "ar";
    setLang(next);
    localStorage.setItem("heroz_lang", next);
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

  // ---- child rows handlers ----
  const handleAddRow = () =>
    setChildRows((prev) => [
      ...prev,
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
        // only one included item at a time
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

  // NEW: when user changes qty of an EXTRA item (via + / -)
  const handleExtraQtyChange = (FoodID, newQty) => {
    const q = newQty < 1 ? 1 : newQty;
    setFoodQty((prev) => ({
      ...prev,
      [FoodID]: q,
    }));
    // ensure extra is checked if user touches qty
    setCheckedFoodItems((prev) => ({
      ...prev,
      [FoodID]: true,
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
        navigate("/public/expired", { replace: true });
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

  // Trip price total (per student) - BASE TRIP ONLY (NO FOOD)
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

  // Food total (checked items only) ✅ multiplied by quantity
  const foodTotal = useMemo(() => {
    return (ActivityData?.foodList ?? []).reduce((sum, item) => {
      if (!checkedFoodItems[item.FoodID]) return sum;

      const qty =
        foodQty[item.FoodID] && Number(foodQty[item.FoodID]) > 0
          ? Number(foodQty[item.FoodID])
          : 1;

      const school =
        schoolPriceMap[item.FoodID] ??
        (parseFloat(item?.RequestFoodSchoolPrice) || 0);
      const vendor =
        parseFloat(item?.FoodVendorPrice ?? item?.FoodPrice) || 0;
      const heroz = parseFloat(item?.FoodHerozPrice) || 0;

      return sum + (school + vendor + heroz) * qty;
    }, 0);
  }, [ActivityData, checkedFoodItems, schoolPriceMap, foodQty]);

  // ----------------- VAT CALCULATION -----------------
  // VAT from base trip prices (per student)
  const tripVatAmount = useMemo(() => {
    const list = ActivityData?.priceList ?? [];
    return list.reduce((sum, item) => {
      const actVat = parseFloat(item?.actPriceVatAmount) || 0;
      const herozVat = parseFloat(item?.HerozStudentPriceVatAmount) || 0;
      const schoolVat = parseFloat(item?.RequestSchoolPriceVatAmount) || 0;
      return sum + actVat + herozVat + schoolVat;
    }, 0);
  }, [ActivityData]);

  // ✅ freeze base trip price + base VAT once (no food VAT)
  useEffect(() => {
    if (
      ActivityData &&
      initialTripPriceInclVat === null &&
      Number.isFinite(priceTotal) &&
      Number.isFinite(tripVatAmount)
    ) {
      const base = Number(priceTotal) || 0;
      const baseVat = Number(tripVatAmount) || 0;
      setInitialTripPriceInclVat(base + baseVat);
    }
  }, [ActivityData, priceTotal, tripVatAmount, initialTripPriceInclVat]);

  // VAT from selected food items only (per student) ✅ multiplied by quantity
  const foodVatAmount = useMemo(() => {
    const list = ActivityData?.foodList ?? [];
    return list.reduce((sum, item) => {
      if (!checkedFoodItems[item.FoodID]) return sum;

      const qty =
        foodQty[item.FoodID] && Number(foodQty[item.FoodID]) > 0
          ? Number(foodQty[item.FoodID])
          : 1;

      const foodPriceVat = parseFloat(item?.FoodPriceVatAmount) || 0;
      const foodHerozVat = parseFloat(item?.FoodHerozPriceVatAmount) || 0;
      const foodSchoolVat =
        parseFloat(item?.RequestFoodSchoolPriceVatAmount) || 0;

      return sum + (foodPriceVat + foodHerozVat + foodSchoolVat) * qty;
    }, 0);
  }, [ActivityData, checkedFoodItems, foodQty]);

  // Final VAT per student: trip + food
  const vatAmount = Number((tripVatAmount + foodVatAmount).toFixed(2));

  // ----------------- TOTALS (WITH VAT / WITHOUT VAT) -----------------
  const grandTotal = priceTotal + foodTotal; // per-student subtotal (trip + food)
  const perStudentSubTotal = Number((Number(grandTotal) || 0).toFixed(2));

  const perStudentTotal = perStudentSubTotal;
  const taxAmount = vatAmount;

  const grandTotalWithTax = Number(
    (perStudentTotal + taxAmount).toFixed(2)
  );

  // ✅ value for "Trip Price Including VAT" (base trip + BASE VAT ONLY)
  const tripBasePlusVat =
    (initialTripPriceInclVat ?? priceTotal + tripVatAmount) || 0;

  // ---------- helpers ----------
  const isValidKid = (row) =>
    (row.name || "").trim() && (row.className || "").trim();

  const validKids = useMemo(() => childRows.filter(isValidKid), [childRows]);
  const validKidsCount = validKids.length;

  // total amount to pass into PaymentMethodPicker (INCLUDES VAT)
  const paymentAmount = useMemo(() => {
    const count = validKidsCount > 0 ? validKidsCount : 1;
    return Number((grandTotalWithTax * count).toFixed(2));
  }, [grandTotalWithTax, validKidsCount]);

  // ======= AUTO-MODAL if Trip Price is zero or less =======
  useEffect(() => {
    if (!loading && ActivityData) {
      const perStudent = Number(grandTotalWithTax) || 0;
      if (perStudent <= 0 || paymentAmount <= 0) {
        setShowZeroCostModal(true);
      }
    }
  }, [loading, ActivityData, grandTotalWithTax, paymentAmount]);

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
      const qty =
        foodQty[item.FoodID] && Number(foodQty[item.FoodID]) > 0
          ? Number(foodQty[item.FoodID])
          : 1;

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
        Quantity: qty,
        Total: (school + vendor + heroz) * qty,
      };
    });

    // By Default
    let userDefinedFieldVal =
      TripData.actRequestRefNo +
      "-" +
      ActivityData.actName +
      "-" +
      getFormattedDateTime();

    if (ActivityData.actRequestStatus === "TRIP-BOOKED")
      userDefinedFieldVal =
        TripData.actRequestRefNo +
        "-" +
        ActivityData.actName +
        getFormattedDateTime();

    const customerReferenceVal = RequestID + "-" + TripData.actRequestRefNo;

    const PayRefNoVal = generatePayRefNo();
    localStorage.setItem("PayRefNo", PayRefNoVal);
    localStorage.setItem("customerReference", customerReferenceVal);
    localStorage.setItem("userDefinedField", userDefinedFieldVal);

    // 🔹 Read parent details from form fields (incl. email)
    const parentName =
      document
        .querySelector('input[name="txtParentName"]')
        ?.value.trim() || "";
    const parentMobile =
      document
        .querySelector('input[name="tripParentsMobileNo"]')
        ?.value.trim() || "";
    const parentEmail =
      document
        .querySelector('input[name="tripParentsEmail"]')
        ?.value.trim() || "";

    const kidsInfo = validKids.map((row) => ({
      RequestID,
      ParentsID,
      KidsID: "",
      TripKidsSchoolNo: (row.schoolID || "").trim(),
      TripKidsName: row.name.trim(),
      tripKidsClassName: row.className.trim(),
      TripKidsGender: (row.gender || "").trim(),
      TripCost: perStudentSubTotal.toFixed(2),
      TripFoodCost: foodTotal.toFixed(2),
      TripTaxAmount: taxAmount.toFixed(2),
      TripFullAmount: grandTotalWithTax.toFixed(2),
      PayStaus: "NEW",
      InvoiceNo: "0",
      MyFatrooahRefNo: "0",
      PayRefNo: PayRefNoVal,
      PayTypeID: "ONLINE",
    }));

    const paymentLabel = paymentLabelFromId(selectedMethodId);

    const vatPerStudent = taxAmount.toFixed(2);
    const totalVatAllStudents = (
      taxAmount * (validKids.length || 1)
    ).toFixed(2);

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
        baseTripPerStudent: priceTotal.toFixed(2),
        foodPerStudent: foodTotal.toFixed(2),
        grandPerStudent: grandTotalWithTax.toFixed(2),
        students: validKids.length,
        netAmount: (grandTotalWithTax * validKids.length).toFixed(2),
        vatPerStudent,
        totalVat: totalVatAllStudents,
      },
    };

    const payload = {
      RequestID,
      ParentsID,
      tripParentsName: parentName,
      tripParentsMobileNo: parentMobile,
      tripParentsEmail: parentEmail, // 🔹 NEW: send parent email to API
      tripParentsNote:
        document
          .querySelector('textarea[name="txtParentsNote"]')
          ?.value.trim() || "",
      tripPaymentTypeID: tripPaymentTypeIdFromId(selectedMethodId),
      kidsInfo,
      FoodIncluded: includedId ? [includedId] : [],
      FoodExtra: extraRows.map(
        ({
          FoodID,
          FoodSchoolPrice,
          FoodVendorPrice,
          FoodHerozPrice,
          Quantity,
        }) => ({
          FoodID,
          FoodSchoolPrice,
          FoodVendorPrice,
          FoodHerozPrice,
          Quantity,
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
    const parentEmail =
      document
        .querySelector('input[name="tripParentsEmail"]')
        ?.value.trim() || "";

    if (!parentName) {
      showError(dict.errEnterParentName);
      return false;
    }
    if (!MOBILE_RE.test(parentMobile)) {
      showError(dict.errParentPhoneFormat);
      return false;
    }

    // 🔹 Email optional but if entered, must be valid format
    if (parentEmail && !EMAIL_RE.test(parentEmail)) {
      showError(
        dict.errParentEmailFormat ||
          (lang === "ar"
            ? "الرجاء إدخال بريد إلكتروني صحيح."
            : "Please enter a valid email address.")
      );
      return false;
    }

    if (validKids.length === 0) {
      showError(dict.errEnterChildInfo);
      return false;
    }

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

    if ((Number(priceTotal) || 0) <= 0) {
      setShowZeroCostModal(true);
      return;
    }

    const perStudent = Number(grandTotalWithTax) || 0;
    if (perStudent <= 0 || paymentAmount <= 0) {
      setShowZeroCostModal(true);
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
      const parentEmail =
        document
          .querySelector('input[name="tripParentsEmail"]')
          ?.value.trim() || "";

      if (!selectedMethodId) {
        showError(dict.errChoosePaymentMethod);
        setSubmitting(false);
        return;
      }

      try {
        // 🔹 USE IMPORTED HELPER HERE (no more window.*)
        const result = await executeMyFatoorahPayment({
          amount: schoolTotalTripCost,
          paymentMethodId: selectedMethodId,
          customer: {
            name: parentName,
            email: parentEmail || "no-reply@heroz.sa",
            mobile: parentMobile,
          },
          language: lang === "ar" ? "AR" : "EN",
          displayCurrency: "SAR",
          redirect: true,
        });
        console.log(result);

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
                        <span>
                          {" "}
                          {dict.tripCost} {dict.ar_inc_vat}{" "}
                        </span>
                      </div>
                    </div>
                    <div className="detail-value ">
                      {tripBasePlusVat.toFixed(2)}{" "}
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
            {/* Pricing (separate component) */}
            <TrupSummary
              dict={dict}
              priceTotal={priceTotal}
              grandTotalWithTax={grandTotalWithTax}
              validKidsCount={validKidsCount}
              ActivityData={ActivityData}
              TripData={TripData}
              checkedFoodItems={checkedFoodItems}
              handleCheckboxChange={handleCheckboxChange}
              foodQty={foodQty}
              handleExtraQtyChange={handleExtraQtyChange}
              lang={lang}
              paymentAmount={paymentAmount}
              apiBase={API_BASE_URL}
              onPaymentMethodSelect={(id, method) =>
                setSelectedMethodId(id)
              }
              onSubmit={handleSubmit}
            />

            {/* Booking form (separate component) */}
            <ParentForm
              dict={dict}
              TripData={TripData}
              ActivityData={ActivityData}
              childRows={childRows}
              onAddRow={handleAddRow}
              onRemoveRow={handleRemoveRow}
              onInputChange={handleInputChange}
            />
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
              <p
                style={{
                  margin: 0,
                  textAlign: lang === "ar" ? "right" : "left",
                  fontSize: "1.1rem",
                  fontWeight: 500,
                }}
              >
                {dict.are_you_ready_to_pay_trip}
              </p>
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
        </main>

        <ProgramFooter lang={lang} />
      </div>
    </>
  );
};

export default ProposalPage;
