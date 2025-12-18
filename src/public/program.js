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

// i18n packs
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

import TrupSummary from "../public/component/tripsummary";
import ParentForm from "../public/component/parentform";
import { executeMyFatoorahPayment } from "../public/payexcute";

const MOBILE_RE = /^05\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYERROR_URL = "https://school.heroz.sa/public/payerror";

// rounding helper
const round2 = (v) => {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return 0;
  const scaled = Math.round((n + Number.EPSILON) * 100);
  return scaled / 100;
};

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

// ✅ NEW: template formatter that replaces {KEY} tokens
const formatTemplate = (template, vars = {}) => {
  const t = String(template ?? "");
  return t.replace(/\{([A-Z0-9_]+)\}/gi, (match, key) => {
    const k = String(key || "").toUpperCase();
    const val = vars[k];
    return val == null ? match : String(val);
  });
};

const ProposalPage = () => {
  const navigate = useNavigate();

  const initialLang = (() => {
    const stored = localStorage.getItem("heroz_lang");
    if (stored === "ar" || stored === "en") return stored;
    localStorage.setItem("heroz_lang", "ar");
    return "ar";
  })();
  const [lang, setLang] = useState(initialLang);
  const dict = lang === "ar" ? arPack : enPack;
  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", lang === "ar" ? "ar" : "en");
    document.body.setAttribute("dir", dir);
  }, [dir, lang]);

  const [error, setError] = useState("");
  const [checkedFoodItems, setCheckedFoodItems] = useState({});
  const [TripData, setTripData] = useState([]);
  const [txtactImageName1, setactImageName1] = useState(null);
  const [txtactImageName2, setactImageName2] = useState(null);
  const [txtactImageName3, setactImageName3] = useState(null);
  const [ActivityData, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);

  const [childRows, setChildRows] = useState([
    { schoolID: "", name: "", className: "", gender: "" },
  ]);

  const [foodQty, setFoodQty] = useState({});
  const [selectedMethodId, setSelectedMethodId] = useState(null);

  const [menuOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [absoluteLogoUrl, setAbsoluteLogoUrl] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const [errModalOpen, setErrModalOpen] = useState(false);
  const [errModalTitle, setErrModalTitle] = useState("Error");
  const [errModalMsg, setErrModalMsg] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSummary, setConfirmSummary] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showZeroCostModal, setShowZeroCostModal] = useState(false);

  const [debugApiUrl, setDebugApiUrl] = useState("");
  const [debugPayload, setDebugPayload] = useState(null);
  const [debugResult, setDebugResult] = useState(null);

  // freeze base trip price + VAT (per student) once
  const [initialTripPriceInclVat, setInitialTripPriceInclVat] = useState(null);

  // ✅ NEW: keep last selected method stable + numeric (prevents misclassification / wrong redirect)
  const lastMethodIdRef = React.useRef(null);

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

  const handleExtraQtyChange = (FoodID, newQty) => {
    const q = newQty < 1 ? 1 : newQty;
    setFoodQty((prev) => ({
      ...prev,
      [FoodID]: q,
    }));
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

  const schoolPriceMap = useMemo(() => {
    const m = {};
    const list = TripData?.schoolreqfoodprice ?? [];
    for (const x of list) {
      if (x?.FoodID) m[x.FoodID] = Number(x.FoodSchoolPrice) || 0;
    }
    return m;
  }, [TripData]);

  // -------- BASE TRIP PRICE (PER STUDENT) – EXCL VAT ----------
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

  const priceTotalRaw = filteredPriceList.reduce((sum, item) => {
    const perStudent =
      (parseFloat(item?.HerozStudentPrice) || 0) +
      (parseFloat(item?.Price) || 0) +
      (parseFloat(item?.RequestSchoolPrice) || 0);
    return sum + perStudent;
  }, 0);
  const priceTotal = round2(priceTotalRaw); // base trip cost per student (no VAT, no extra)

  // -------- TRIP VAT (PER STUDENT) ----------
  const tripVatAmount = useMemo(() => {
    const list = ActivityData?.priceList ?? [];
    const total = list.reduce((sum, item) => {
      const actVat = parseFloat(item?.actPriceVatAmount) || 0;
      const herozVat = parseFloat(item?.HerozStudentPriceVatAmount) || 0;
      const schoolVat = parseFloat(item?.RequestSchoolPriceVatAmount) || 0;
      return sum + actVat + herozVat + schoolVat;
    }, 0);
    return round2(total);
  }, [ActivityData]);

  // per-student trip (base + VAT)
  const tripPerStudentIncVat = round2(priceTotal + tripVatAmount);

  // freeze initial base trip+VAT (in case later state changes)
  useEffect(() => {
    if (
      ActivityData &&
      initialTripPriceInclVat === null &&
      Number.isFinite(priceTotal) &&
      Number.isFinite(tripVatAmount)
    ) {
      setInitialTripPriceInclVat(tripPerStudentIncVat);
    }
  }, [
    ActivityData,
    priceTotal,
    tripVatAmount,
    initialTripPriceInclVat,
    tripPerStudentIncVat,
  ]);

  const tripPriceInclVat =
    initialTripPriceInclVat != null
      ? initialTripPriceInclVat
      : tripPerStudentIncVat;

  // -------- EXTRA ITEMS TOTAL (Inc VAT, WHOLE ORDER, NOT PER KID) ----------
  const extraPriceInclVat = useMemo(() => {
    const list = ActivityData?.foodList ?? [];
    let total = 0;

    for (const item of list) {
      // only EXTRA items (Include !== true)
      if (item.Include === true) continue;
      if (!checkedFoodItems[item.FoodID]) continue;

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

      const schoolVat =
        parseFloat(item?.RequestFoodSchoolPriceVatAmount) || 0;
      const vendorVat = parseFloat(item?.FoodPriceVatAmount) || 0;
      const herozVat = parseFloat(item?.FoodHerozPriceVatAmount) || 0;

      const unitBase = school + vendor + heroz;
      const unitVat = schoolVat + vendorVat + herozVat;

      total += (unitBase + unitVat) * qty;
    }

    return round2(total);
  }, [ActivityData, checkedFoodItems, foodQty, schoolPriceMap]);

  // -------- TOTALS (UI + PAYMENT) ----------
  const totalPayablePerOrder = round2(tripPriceInclVat + extraPriceInclVat);

  // helpers for kid rows
  const isValidKid = (row) =>
    (row.name || "").trim() && (row.className || "").trim();

  const validKids = useMemo(() => childRows.filter(isValidKid), [childRows]);
  const validKidsCount = validKids.length;

  // ✅ NEW: build child name text for modal (1 kid or many)
  const childNameText = useMemo(() => {
    const names = (validKids || [])
      .map((k) => (k.name || "").trim())
      .filter(Boolean);

    if (names.length === 0) return "";

    const joiner = lang === "ar" ? "، " : ", ";
    return names.join(joiner);
  }, [validKids, lang]);

  // Net amount for ALL kids (trip per student * kids + extra once)
  const paymentAmount = useMemo(() => {
    const kids = validKidsCount > 0 ? validKidsCount : 1;
    const total = tripPriceInclVat * kids + extraPriceInclVat;
    return round2(total);
  }, [validKidsCount, tripPriceInclVat, extraPriceInclVat]);

  // ======= AUTO-MODAL if Trip Price is zero or less =======
  useEffect(() => {
    if (!loading && ActivityData) {
      const perStudent = Number(tripPriceInclVat) || 0;
      if (perStudent <= 0 || paymentAmount <= 0) {
        setShowZeroCostModal(true);
      }
    }
  }, [loading, ActivityData, tripPriceInclVat, paymentAmount]);

  useEffect(() => {
    if (!loading && ActivityData) {
      const baseTrip = Number(priceTotal) || 0;
      if (baseTrip <= 0) {
        setShowZeroCostModal(true);
      }
    }
  }, [loading, ActivityData, priceTotal]);

  // values per student for kidsInfo payload
  const tripCostPerStudent = round2(priceTotal);
  const tripFoodCostPerStudent = 0; // extras are separate (FoodExtra)
  const tripTaxPerStudent = round2(tripVatAmount);
  const tripFullPerStudent = round2(tripPriceInclVat);

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
      TripCost: tripCostPerStudent.toFixed(2),
      TripFoodCost: tripFoodCostPerStudent.toFixed(2),
      TripTaxAmount: tripTaxPerStudent.toFixed(2),
      TripFullAmount: tripFullPerStudent.toFixed(2),
      PayStaus: "NEW",
      InvoiceNo: "0",
      MyFatrooahRefNo: "0",
      PayRefNo: PayRefNoVal,
      PayTypeID: "ONLINE",
    }));

    const paymentLabel = paymentLabelFromId(selectedMethodId);

    const vatPerStudent = round2(tripTaxPerStudent).toFixed(2);
    const totalVatAllStudents = round2(
      tripTaxPerStudent * (validKids.length || 1)
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
        baseTripPerStudent: tripPriceInclVat.toFixed(2),
        foodPerStudent: extraPriceInclVat.toFixed(2),
        grandPerStudent: totalPayablePerOrder.toFixed(2),
        students: validKids.length,
        netAmount: round2(
          tripPriceInclVat * validKids.length + extraPriceInclVat
        ).toFixed(2),
        vatPerStudent,
        totalVat: totalVatAllStudents,
      },
    };

    const payload = {
      RequestID,
      ParentsID,
      tripParentsName: parentName,
      tripParentsMobileNo: parentMobile,
      tripParentsEmail: parentEmail,
      tripParentsNote:
        document
          .querySelector('textarea[name="txtParentsNote"]')
          ?.value.trim() || "",
      tripPaymentTypeID: tripPaymentTypeIdFromId(selectedMethodId),
      // ✅ NEW (non-breaking): keep MF method id + label for backend debugging (won't break if backend ignores)
      tripPaymentMethodId: selectedMethodId != null ? Number(selectedMethodId) : null,
      tripPaymentMethodLabel: paymentLabelFromId(selectedMethodId),
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

    // ✅ NEW: validate numeric payment method id
    const mid = Number(selectedMethodId);
    if (!Number.isFinite(mid) || mid <= 0) {
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

    const perStudent = Number(tripPriceInclVat) || 0;
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

      // ✅ NEW: always normalize method id to Number (prevents wrong redirect / misclassification)
      const methodId = Number(selectedMethodId);
      if (!Number.isFinite(methodId) || methodId <= 0) {
        showError(dict.errChoosePaymentMethod);
        setSubmitting(false);
        return;
      }

      // ✅ NEW: store a stable ref (avoid any late state mismatch)
      lastMethodIdRef.current = methodId;

      try {
        // ✅ NEW: extra client-side debug log (visible in console + helpful for MF disputes)
        try {
          console.log("MF_CLIENT_METHOD_SELECTED", {
            selectedMethodIdRaw: selectedMethodId,
            methodIdNormalized: methodId,
            label: paymentLabelFromId(methodId),
            amount: schoolTotalTripCost,
            requestId: TripData?.RequestID,
            actRequestRefNo: TripData?.actRequestRefNo,
          });
        } catch (_) {}

        const result = await executeMyFatoorahPayment({
          amount: schoolTotalTripCost,
          paymentMethodId: methodId, // ✅ FIX: always send Number
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

  // ✅ NEW: compute the final confirm message with {CHILDNAME} replaced
  const confirmPayMessage = useMemo(() => {
    const fallback =
      lang === "ar"
        ? "هل ترغب في إتمام الدفع لرحلة طفلك الآن؟"
        : "Would you like to finalize the payment for your child's trip now?";

    const template = dict.are_you_ready_to_pay_trip || fallback;

    // if you want special wording for multiple kids, you can change here later
    const nameToShow = childNameText || "";
    return formatTemplate(template, { CHILDNAME: nameToShow });
  }, [dict, childNameText, lang]);

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
                      {tripPriceInclVat.toFixed(2)}{" "}
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
            <TrupSummary
              dict={dict}
              priceTotal={priceTotal}
              grandTotalWithTax={totalPayablePerOrder}
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
              // ✅ FIX: keep your code, only normalize id to Number (prevents MF misclassification)
              onPaymentMethodSelect={(id, method) => {
                const nid = Number(id);
                setSelectedMethodId(Number.isFinite(nid) ? nid : id);
                lastMethodIdRef.current = Number.isFinite(nid) ? nid : id;
              }}
              onSubmit={handleSubmit}
              tripPriceInclVat={tripPriceInclVat}
              extraPriceInclVat={extraPriceInclVat}
            />

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
                {/* ✅ HERE: {CHILDNAME} replaced with real kid name(s) */}
                {confirmPayMessage}
              </p>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setConfirmOpen(false)}>
                {dict.cancel}
              </CButton>
              <CButton
                color="primary"
                disabled={submitting || !selectedMethodId} // ✅ small safety
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
              <CButton color="secondary" onClick={() => setErrModalOpen(false)}>
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
