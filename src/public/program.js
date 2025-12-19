// src/public/program.jsx
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

// ✅ Embedded payment helpers
import { initiateEmbeddedSession, executePaymentBySession } from "../public/payexcute";
import MyFatoorahEmbeddedCheckout from "../public/component/MyFatoorahEmbeddedModal";

const MOBILE_RE = /^05\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAYERROR_URL = "https://school.heroz.sa/public/payerror";

const round2 = (v) => {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return 0;
  const scaled = Math.round((n + Number.EPSILON) * 100);
  return scaled / 100;
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

const formatTemplate = (template, vars = {}) => {
  const t = String(template ?? "");
  return t.replace(/\{([A-Z0-9_]+)\}/gi, (match, key) => {
    const k = String(key || "").toUpperCase();
    const val = vars[k];
    return val == null ? match : String(val);
  });
};

// ✅ small safe stringify for debug UI
const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(e?.message || e);
  }
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

  const [childRows, setChildRows] = useState([{ schoolID: "", name: "", className: "", gender: "" }]);
  const [foodQty, setFoodQty] = useState({});

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

  // ✅ existing debug (keep)
  const [debugApiUrl, setDebugApiUrl] = useState("");
  const [debugPayload, setDebugPayload] = useState(null);
  const [debugResult, setDebugResult] = useState(null);

  const [initialTripPriceInclVat, setInitialTripPriceInclVat] = useState(null);

  // ✅ EMBEDDED PAYMENT UI MODAL
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [mfSessionId, setMfSessionId] = useState("");
  const [mfCountryCode, setMfCountryCode] = useState("");
  const [mfInitLoading, setMfInitLoading] = useState(false);
  const [mfInitErr, setMfInitErr] = useState("");

  // ✅ OTP iframe
  const [otpUrl, setOtpUrl] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);

  // ✅ NEW: debug panel state
  const [dbgOpen, setDbgOpen] = useState(true);
  const [dbgLastAction, setDbgLastAction] = useState("");
  const [dbgPayErrorReason, setDbgPayErrorReason] = useState("");

  const dbg = (...args) => {
    // console
    // eslint-disable-next-line no-console
    console.log("[PAY-DEBUG]", ...args);
  };

  const setApiDebug = ({ action, url, payload, response, errorObj }) => {
    setDbgLastAction(action || "");
    if (url) setDebugApiUrl(url);
    if (payload !== undefined) setDebugPayload(payload);
    setDebugResult((prev) => ({
      ...(prev || {}),
      [action || "action"]: {
        time: new Date().toISOString(),
        url,
        payload,
        response,
        error: errorObj ? String(errorObj?.message || errorObj) : null,
        stack: errorObj?.stack || null,
      },
    }));
    dbg(action, { url, payload, response, errorObj });
  };

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
    setApiDebug({ action: "UI_ERROR_MODAL", url: "", payload: { title, msg }, response: null, errorObj: null });
  };

  const handleAddRow = () =>
    setChildRows((prev) => [...prev, { schoolID: "", name: "", className: "", gender: "" }]);
  const handleRemoveRow = (idx) => setChildRows((prev) => prev.filter((_, i) => i !== idx));
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
    const url = `${API_BASE_URL}/admindata/activityinfo/trip/gettripview`;
    const payload = { ActivityID: ActivityIDVal, VendorID: VendorIDVal, RequestID: RequestIDVal };
    setApiDebug({ action: "FETCH_ACTIVITY_REQUEST", url, payload, response: null });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);

      setApiDebug({
        action: "FETCH_ACTIVITY_RESPONSE",
        url,
        payload,
        response: { ok: response.ok, status: response.status, json },
      });

      if (!response.ok) throw new Error("Failed to fetch activities");
      setActivity(json?.data || null);
    } catch (err) {
      setError("Error fetching activities");
      console.error(err);
      showError(dict.errCouldNotLoadActivity);
      setApiDebug({ action: "FETCH_ACTIVITY_ERROR", url, payload, response: null, errorObj: err });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (FoodID, isIncludedArg) => {
    const inferredIncluded =
      isIncludedArg ?? (ActivityData?.foodList?.find((f) => f.FoodID === FoodID)?.Include === true);

    setCheckedFoodItems((prev) => {
      const next = { ...prev };
      if (inferredIncluded) {
        (ActivityData?.foodList ?? []).filter((f) => f.Include === true).forEach((f) => (next[f.FoodID] = false));
        next[FoodID] = true;
      } else {
        next[FoodID] = !Boolean(prev[FoodID]);
      }
      return next;
    });
  };

  const handleExtraQtyChange = (FoodID, newQty) => {
    const q = newQty < 1 ? 1 : newQty;
    setFoodQty((prev) => ({ ...prev, [FoodID]: q }));
    setCheckedFoodItems((prev) => ({ ...prev, [FoodID]: true }));
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

  const fetchTripData = async (RequestID) => {
    setLoading(true);
    setError("");
    const url = `${API_BASE_URL}/admindata/activityinfo/trip/gettrip`;
    const payload = { RequestID };
    setApiDebug({ action: "FETCH_TRIP_REQUEST", url, payload, response: null });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => null);

      setApiDebug({
        action: "FETCH_TRIP_RESPONSE",
        url,
        payload,
        response: { ok: response.ok, status: response.status, json },
      });

      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

      const data = json;
      const payloadTrip = Array.isArray(data?.data) ? data.data[0] ?? null : data?.data ?? null;

      const dueRaw = payloadTrip?.PaymentDueDate;
      const missingDue =
        dueRaw == null ||
        String(dueRaw).trim() === "" ||
        String(dueRaw).trim().toLowerCase() === "undefined" ||
        String(dueRaw).trim().toLowerCase() === "null";

      if (missingDue || isPaymentExpired(dueRaw)) {
        setApiDebug({
          action: "NAV_EXPIRED",
          url: "/public/expired",
          payload: { missingDue, dueRaw },
          response: null,
        });
        navigate("/public/expired", { replace: true });
        return;
      }

      setTripData(payloadTrip);

      const ActivityIDVal = payloadTrip?.ActivityID;
      const VendorIDVal = payloadTrip?.VendorID;
      if (ActivityIDVal && VendorIDVal) fetchActivity(ActivityIDVal, VendorIDVal, RequestID);
    } catch (err) {
      console.error("Error fetching trip data:", err);
      setError(err.message || "Error fetching trip data");
      showError(dict.errCouldNotLoadTrip);
      setApiDebug({ action: "FETCH_TRIP_ERROR", url, payload, response: null, errorObj: err });
    } finally {
      setLoading(false);
    }
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
      setApiDebug({ action: "ERR_MISSING_REQUEST_ID", url: window.location.href, payload: null, response: null });
    }

    try {
      const absLogo = new URL(herozlogo, window.location.origin).href;
      setAbsoluteLogoUrl(absLogo);
    } catch {
      setAbsoluteLogoUrl("");
    }

    const canonical = `${window.location.origin}${window.location.pathname}#/public/program/${id}`;
    setShareUrl(id ? canonical : window.location.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

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
    () => [txtactImageName1, txtactImageName2, txtactImageName3].filter(Boolean),
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

  const filteredPriceList = (ActivityData?.priceList ?? []).filter((p) => {
    const vendor = parseFloat(p?.Price);
    const heroz = parseFloat(p?.HerozStudentPrice);
    const school = parseFloat(p?.RequestSchoolPrice);
    return Number.isFinite(vendor) || Number.isFinite(heroz) || Number.isFinite(school);
  });

  const priceTotalRaw = filteredPriceList.reduce((sum, item) => {
    const perStudent =
      (parseFloat(item?.HerozStudentPrice) || 0) +
      (parseFloat(item?.Price) || 0) +
      (parseFloat(item?.RequestSchoolPrice) || 0);
    return sum + perStudent;
  }, 0);
  const priceTotal = round2(priceTotalRaw);

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

  const tripPerStudentIncVat = round2(priceTotal + tripVatAmount);

  useEffect(() => {
    if (
      ActivityData &&
      initialTripPriceInclVat === null &&
      Number.isFinite(priceTotal) &&
      Number.isFinite(tripVatAmount)
    ) {
      setInitialTripPriceInclVat(tripPerStudentIncVat);
    }
  }, [ActivityData, priceTotal, tripVatAmount, initialTripPriceInclVat, tripPerStudentIncVat]);

  const tripPriceInclVat = initialTripPriceInclVat != null ? initialTripPriceInclVat : tripPerStudentIncVat;

  const extraPriceInclVat = useMemo(() => {
    const list = ActivityData?.foodList ?? [];
    let total = 0;

    for (const item of list) {
      if (item.Include === true) continue;
      if (!checkedFoodItems[item.FoodID]) continue;

      const qty = foodQty[item.FoodID] && Number(foodQty[item.FoodID]) > 0 ? Number(foodQty[item.FoodID]) : 1;

      const school = schoolPriceMap[item.FoodID] ?? (parseFloat(item?.RequestFoodSchoolPrice) || 0);
      const vendor = parseFloat(item?.FoodVendorPrice ?? item?.FoodPrice) || 0;
      const heroz = parseFloat(item?.FoodHerozPrice) || 0;

      const schoolVat = parseFloat(item?.RequestFoodSchoolPriceVatAmount) || 0;
      const vendorVat = parseFloat(item?.FoodPriceVatAmount) || 0;
      const herozVat = parseFloat(item?.FoodHerozPriceVatAmount) || 0;

      total += (school + vendor + heroz + schoolVat + vendorVat + herozVat) * qty;
    }

    return round2(total);
  }, [ActivityData, checkedFoodItems, foodQty, schoolPriceMap]);

  const totalPayablePerOrder = round2(tripPriceInclVat + extraPriceInclVat);

  const isValidKid = (row) => (row.name || "").trim() && (row.className || "").trim();
  const validKids = useMemo(() => childRows.filter(isValidKid), [childRows]);
  const validKidsCount = validKids.length;

  const childNameText = useMemo(() => {
    const names = (validKids || []).map((k) => (k.name || "").trim()).filter(Boolean);
    if (names.length === 0) return "";
    const joiner = lang === "ar" ? "، " : ", ";
    return names.join(joiner);
  }, [validKids, lang]);

  const paymentAmount = useMemo(() => {
    const kids = validKidsCount > 0 ? validKidsCount : 1;
    const total = tripPriceInclVat * kids + extraPriceInclVat;
    return round2(total);
  }, [validKidsCount, tripPriceInclVat, extraPriceInclVat]);

  // ✅ Identify why we triggered TripCostZero
  const computeZeroReason = () => {
    const baseTrip = Number(priceTotal) || 0;
    const perStudent = Number(tripPriceInclVat) || 0;
    const payAmt = Number(paymentAmount) || 0;

    if (baseTrip <= 0) return `priceTotal <= 0 (priceTotal=${baseTrip})`;
    if (perStudent <= 0) return `tripPriceInclVat <= 0 (tripPriceInclVat=${perStudent})`;
    if (payAmt <= 0) return `paymentAmount <= 0 (paymentAmount=${payAmt})`;
    return "";
  };

  useEffect(() => {
    if (!loading && ActivityData) {
      const perStudent = Number(tripPriceInclVat) || 0;
      if (perStudent <= 0 || paymentAmount <= 0) {
        const reason = computeZeroReason() || "perStudent/paymentAmount invalid";
        setDbgPayErrorReason(`TripCostZero modal shown: ${reason}`);
        setApiDebug({
          action: "TRIPCOSTZERO_TRIGGER_1",
          url: "TripCostZero",
          payload: {
            priceTotal,
            tripPriceInclVat,
            extraPriceInclVat,
            paymentAmount,
            validKidsCount,
            reason,
          },
          response: null,
        });
        setShowZeroCostModal(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ActivityData, tripPriceInclVat, paymentAmount]);

  useEffect(() => {
    if (!loading && ActivityData) {
      const baseTrip = Number(priceTotal) || 0;
      if (baseTrip <= 0) {
        const reason = computeZeroReason() || "baseTrip invalid";
        setDbgPayErrorReason(`TripCostZero modal shown: ${reason}`);
        setApiDebug({
          action: "TRIPCOSTZERO_TRIGGER_2",
          url: "TripCostZero",
          payload: {
            priceTotal,
            tripPriceInclVat,
            extraPriceInclVat,
            paymentAmount,
            validKidsCount,
            reason,
          },
          response: null,
        });
        setShowZeroCostModal(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ActivityData, priceTotal]);

  const tripCostPerStudent = round2(priceTotal);
  const tripFoodCostPerStudent = 0;
  const tripTaxPerStudent = round2(tripVatAmount);
  const tripFullPerStudent = round2(tripPriceInclVat);

  const buildSelectionSummaryAndPayload = () => {
    const RequestID = TripData?.RequestID;
    const ParentsID = getCurrentLoggedUserID();

    const includedId = (ActivityData?.foodList ?? [])
      .filter((f) => f.Include === true)
      .find((f) => checkedFoodItems[f.FoodID])?.FoodID;

    const includedName = (ActivityData?.foodList ?? []).find((f) => f.FoodID === includedId)?.FoodName;

    const extrasPicked = (ActivityData?.foodList ?? []).filter((f) => f.Include !== true && checkedFoodItems[f.FoodID]);

    const extraRows = extrasPicked.map((item) => {
      const qty = foodQty[item.FoodID] && Number(foodQty[item.FoodID]) > 0 ? Number(foodQty[item.FoodID]) : 1;

      const school = schoolPriceMap[item.FoodID] ?? (parseFloat(item?.RequestFoodSchoolPrice) || 0);
      const vendor = parseFloat(item?.FoodVendorPrice ?? item?.FoodPrice) || 0;
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

    let userDefinedFieldVal = TripData.actRequestRefNo + "-" + ActivityData.actName + "-" + getFormattedDateTime();
    if (ActivityData.actRequestStatus === "TRIP-BOOKED")
      userDefinedFieldVal = TripData.actRequestRefNo + "-" + ActivityData.actName + getFormattedDateTime();

    const customerReferenceVal = RequestID + "-" + TripData.actRequestRefNo;

    const PayRefNoVal = generatePayRefNo();
    localStorage.setItem("PayRefNo", PayRefNoVal);
    localStorage.setItem("customerReference", customerReferenceVal);
    localStorage.setItem("userDefinedField", userDefinedFieldVal);

    const parentName = document.querySelector('input[name="txtParentName"]')?.value.trim() || "";
    const parentMobile = document.querySelector('input[name="tripParentsMobileNo"]')?.value.trim() || "";
    const parentEmail = document.querySelector('input[name="tripParentsEmail"]')?.value.trim() || "";

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

    const summary = {
      included: includedName || "-",
      extras: extraRows,
      kids: validKids.map((k) => ({
        name: k.name.trim(),
        className: k.className.trim(),
        schoolID: (k.schoolID || "").trim(),
        gender: (k.gender || "").trim(),
      })),
      paymentLabel: "MyFatoorah Embedded",
      totals: {
        baseTripPerStudent: tripPriceInclVat.toFixed(2),
        foodPerStudent: extraPriceInclVat.toFixed(2),
        grandPerStudent: totalPayablePerOrder.toFixed(2),
        students: validKids.length,
        netAmount: round2(tripPriceInclVat * validKids.length + extraPriceInclVat).toFixed(2),
      },
    };

    const payload = {
      RequestID,
      ParentsID,
      tripParentsName: parentName,
      tripParentsMobileNo: parentMobile,
      tripParentsEmail: parentEmail,
      tripParentsNote: document.querySelector('textarea[name="txtParentsNote"]')?.value.trim() || "",
      tripPaymentTypeID: "ONLINE",
      tripPaymentMethodId: null,
      tripPaymentMethodLabel: "MyFatoorah Embedded",
      kidsInfo,
      FoodIncluded: includedId ? [includedId] : [],
      FoodExtra: extraRows.map(({ FoodID, FoodSchoolPrice, FoodVendorPrice, FoodHerozPrice, Quantity }) => ({
        FoodID,
        FoodSchoolPrice,
        FoodVendorPrice,
        FoodHerozPrice,
        Quantity,
      })),
    };

    setApiDebug({
      action: "BUILD_PAYLOAD",
      url: "buildSelectionSummaryAndPayload",
      payload,
      response: summary,
    });

    return { payload, summary };
  };

  const validateBeforeSubmit = () => {
    const hasMeals = Array.isArray(ActivityData?.foodList) && ActivityData.foodList.length > 0;
    const hasIncludedOptions = hasMeals && ActivityData.foodList.some((f) => f.Include === true);

    if (hasIncludedOptions) {
      const includedFoodRadio = document.querySelector('input[name="foodSelect"]:checked');
      if (!includedFoodRadio) {
        showError(dict.errSelectIncludedFood);
        return false;
      }
    }

    const parentName = document.querySelector('input[name="txtParentName"]')?.value.trim() || "";
    const parentMobile = document.querySelector('input[name="tripParentsMobileNo"]')?.value.trim() || "";
    const parentEmail = document.querySelector('input[name="tripParentsEmail"]')?.value.trim() || "";

    if (!parentName) return showError(dict.errEnterParentName), false;
    if (!MOBILE_RE.test(parentMobile)) return showError(dict.errParentPhoneFormat), false;
    if (parentEmail && !EMAIL_RE.test(parentEmail)) {
      showError(
        dict.errParentEmailFormat ||
          (lang === "ar" ? "الرجاء إدخال بريد إلكتروني صحيح." : "Please enter a valid email address.")
      );
      return false;
    }

    if (validKids.length === 0) return showError(dict.errEnterChildInfo), false;

    for (const kid of validKids) {
      if (kid.name.trim().length < 10) {
        showError(lang === "ar" ? "يجب أن يكون اسم الطفل 10 أحرف على الأقل." : "Child name must be at least 10 characters long.");
        return false;
      }
    }

    const termsCheckbox = document.getElementById("termsAgree");
    if (!termsCheckbox || !termsCheckbox.checked) {
      return showError(dict.errAgreeTerms || "Please agree to the terms and conditions."), false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (TripData?.PaymentDueDate && isPaymentExpired(TripData.PaymentDueDate)) {
      setIsExpired(true);
      showError(dict.errDueDateFinished);
      setApiDebug({
        action: "SUBMIT_BLOCKED_DUE_DATE",
        url: "",
        payload: { PaymentDueDate: TripData?.PaymentDueDate },
        response: null,
      });
      return;
    }

    if ((Number(priceTotal) || 0) <= 0) {
      const reason = computeZeroReason() || "priceTotal <= 0";
      setDbgPayErrorReason(`handleSubmit: TripCostZero -> ${reason}`);
      setShowZeroCostModal(true);
      return;
    }

    const perStudent = Number(tripPriceInclVat) || 0;
    if (perStudent <= 0 || paymentAmount <= 0) {
      const reason = computeZeroReason() || "perStudent/paymentAmount <= 0";
      setDbgPayErrorReason(`handleSubmit: TripCostZero -> ${reason}`);
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
    setApiDebug({ action: "TRIPADD_REQUEST", url: endpoint, payload: pendingPayload, response: null });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingPayload),
      });

      const submitJson = await response.json().catch(() => null);

      setApiDebug({
        action: "TRIPADD_RESPONSE",
        url: endpoint,
        payload: pendingPayload,
        response: { ok: response.ok, status: response.status, json: submitJson },
      });

      if (!response.ok) throw new Error("Failed to submit data");

      setConfirmOpen(false);

      // open embedded modal
      setPayModalOpen(true);
      setMfInitErr("");
      setMfSessionId("");
      setMfCountryCode("");
      setOtpUrl("");
      setOtpOpen(false);

      setMfInitLoading(true);

      // Initiate embedded session
      const ses = await initiateEmbeddedSession({ amount: paymentAmount, currencyCode: "SAR" });

      setApiDebug({
        action: "MF_INITIATE_SESSION_RESULT",
        url: `${API_BASE_URL}/myfatrooahdata/pay/initiate-session`,
        payload: { amount: paymentAmount, currencyCode: "SAR" },
        response: ses,
      });

      setMfInitLoading(false);

      if (!ses.ok) {
        setMfInitErr(ses.error || "Failed to initiate embedded session.");
        return;
      }

      setMfSessionId(ses.sessionId);
      setMfCountryCode(ses.countryCode);
    } catch (err) {
      console.error("Submit error:", err);
      setConfirmOpen(false);
      showError(dict.errSubmissionFailed);
      setApiDebug({ action: "TRIPADD_ERROR", url: endpoint, payload: pendingPayload, response: null, errorObj: err });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmbeddedCallback = async (mfResponse) => {
    try {
      if (!mfResponse) return;

      setApiDebug({ action: "MF_WIDGET_CALLBACK_RAW", url: "myfatoorah.init callback", payload: mfResponse, response: null });

      if (!mfResponse.isSuccess) {
        setApiDebug({ action: "MF_WIDGET_CALLBACK_NOT_SUCCESS", url: "", payload: mfResponse, response: null });
        return;
      }

      const callbackSessionId =
        mfResponse?.sessionId ||
        mfResponse?.SessionId ||
        mfResponse?.data?.SessionId ||
        mfResponse?.Data?.SessionId ||
        mfSessionId;

      if (!callbackSessionId) {
        showError(
          lang === "ar"
            ? "لم يتم العثور على SessionId من بوابة الدفع. الرجاء المحاولة مرة أخرى."
            : "SessionId was not found from the payment widget callback. Please try again."
        );
        setApiDebug({ action: "MF_CALLBACK_SESSIONID_MISSING", url: "", payload: mfResponse, response: null });
        return;
      }

      const parentName = document.querySelector('input[name="txtParentName"]')?.value.trim() || "";
      const parentMobile = document.querySelector('input[name="tripParentsMobileNo"]')?.value.trim() || "";
      const parentEmail = document.querySelector('input[name="tripParentsEmail"]')?.value.trim() || "";

      const sentBody = {
        sessionId: callbackSessionId,
        invoiceValue: paymentAmount,
        customer: { name: parentName, mobile: parentMobile, email: parentEmail || "no-reply@heroz.sa" },
        language: lang === "ar" ? "AR" : "EN",
        displayCurrency: "SAR",
      };

      setApiDebug({
        action: "MF_EXECUTE_SESSION_FRONTEND_SENT",
        url: `${API_BASE_URL}/myfatrooahdata/pay/execute-session`,
        payload: sentBody,
        response: null,
      });

      const exec = await executePaymentBySession(sentBody);

      setApiDebug({
        action: "MF_EXECUTE_SESSION_FRONTEND_RESULT",
        url: `${API_BASE_URL}/myfatrooahdata/pay/execute-session`,
        payload: sentBody,
        response: exec,
      });

      if (!exec.ok) {
        showError(exec.error || "ExecutePayment failed.");
        return;
      }

      if (!exec.paymentUrl) {
        showError(lang === "ar" ? "لم يتم إرجاع رابط الدفع (PaymentURL)." : "PaymentURL was not returned.");
        return;
      }

      setOtpUrl(exec.paymentUrl);
      setOtpOpen(true);
    } catch (e) {
      showError(String(e));
      setApiDebug({ action: "MF_EXECUTE_SESSION_EXCEPTION", url: "", payload: null, response: null, errorObj: e });
    }
  };

  useEffect(() => {
    function onMessage(event) {
      if (!event?.data) return;
      try {
        const message = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (message?.sender === "MF-3DSecure" && message?.url) {
          setApiDebug({ action: "MF_3DS_MESSAGE_REDIRECT", url: message.url, payload: message, response: null });
          window.location.href = message.url;
        }
      } catch (_) {}
    }

    window.addEventListener("message", onMessage, false);
    return () => window.removeEventListener("message", onMessage, false);
  }, []);

  const canonicalUrl = shareUrl || `${window.location.origin}${window.location.pathname}`;

  const program = useMemo(() => {
    const title = ActivityData?.actName
      ? `${dict.seoTripPrefix} — ${ActivityData.actName}`
      : `${dict.seoTripPrefix} — ${dict.seoProposal}`;
    const description = dict.seoDescription;
    const imageUrl = absoluteLogoUrl || "";
    return { title, description, imageUrl };
  }, [ActivityData, absoluteLogoUrl, dict]);

  const confirmPayMessage = useMemo(() => {
    const fallback = lang === "ar" ? "هل ترغب في إتمام الدفع لرحلة طفلك الآن؟" : "Would you like to finalize the payment for your child's trip now?";
    const template = dict.are_you_ready_to_pay_trip || fallback;
    const nameToShow = childNameText || "";
    return formatTemplate(template, { CHILDNAME: nameToShow });
  }, [dict, childNameText, lang]);

  return (
    <>
      <Helmet htmlAttributes={{ lang: lang === "ar" ? "ar" : "en", dir }}>
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
                <h2 className="section-title trip-gradient-color fontsize40">{dict.tripInformation}</h2>
                <h3 className="card-title">{dict.aboutThisTrip}</h3>
                <p className="card-text">
                  {ActivityData?.actDesc?.split("\n").map((line, index) => (
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
                    <div className="detail-label trip-gradient-color fontsize30">
                      <div className="row-inline">
                        <img src={icon5} alt="HEROZ" className="icon-tint-pink" />
                        <span>
                          {dict.tripCost} {dict.ar_inc_vat}
                        </span>
                      </div>
                    </div>
                    <div className="detail-value ">
                      {tripPriceInclVat.toFixed(2)} <img src={icon5} alt="HEROZ" />
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail">
                    <div className="detail-label trip-gradient-color fontsize30">
                      <div className="row-inline">
                        <img src={icon1} alt="HEROZ" />
                        <span>{dict.date}</span>
                      </div>
                    </div>
                    <div className="detail-value">{TripData?.actRequestDate || "-"}</div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail">
                    <div className="detail-label trip-gradient-color fontsize30">
                      <div className="row-inline">
                        <img src={icon2} alt="HEROZ" />
                        <span>{dict.time}</span>
                      </div>
                    </div>
                    <div className="detail-value">{TripData?.actRequestTime || "-"}</div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail">
                    <div className="detail-label trip-gradient-color fontsize30">
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
              onSubmit={handleSubmit}
              tripPriceInclVat={tripPriceInclVat}
              extraPriceInclVat={extraPriceInclVat}
              hidePaymentPicker={true}
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

          {/* ✅ Embedded Payment Modal */}
          <CModal
            visible={payModalOpen}
            onClose={() => setPayModalOpen(false)}
            alignment="center"
            size="xl"
            backdrop="static"
          >
            <CModalHeader onClose={() => setPayModalOpen(false)}>
              <CModalTitle>{lang === "ar" ? "الدفع" : "Payment"}</CModalTitle>
            </CModalHeader>
            <CModalBody>
              {mfInitLoading && (
                <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
                  {lang === "ar" ? "جاري تجهيز الدفع..." : "Preparing payment..."}
                </div>
              )}

              {!!mfInitErr && (
                <div style={{ padding: 12, border: "1px solid #f5a9a9", background: "#ffe6e6", borderRadius: 10 }}>
                  <b>{lang === "ar" ? "خطأ:" : "Error:"}</b> {mfInitErr}
                </div>
              )}

              {!mfInitLoading && !!mfSessionId && !!mfCountryCode && (
                <MyFatoorahEmbeddedCheckout
                  lang={lang}
                  sessionId={mfSessionId}
                  countryCode={mfCountryCode}
                  currencyCode={"SAR"}
                  amount={paymentAmount}
                  containerId="embedded-payment"
                  paymentOptions={["ApplePay", "GooglePay", "Card", "STCPay"]}
                  environment={"KSA_LIVE"}
                  onCallback={handleEmbeddedCallback}
                  onError={(msg) => setMfInitErr(msg)}
                />
              )}

              {otpOpen && !!otpUrl && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    {lang === "ar" ? "التحقق (OTP / 3D Secure)" : "Verification (OTP / 3D Secure)"}
                  </div>
                  <div
                    style={{
                      height: "70vh",
                      minHeight: 520,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #e6e6e6",
                    }}
                  >
                    <iframe
                      title="MF-3DS"
                      src={otpUrl}
                      style={{ width: "100%", height: "100%", border: 0 }}
                      allow="payment *; fullscreen *"
                    />
                  </div>
                </div>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setPayModalOpen(false)}>
                {lang === "ar" ? "إغلاق" : "Close"}
              </CButton>
            </CModalFooter>
          </CModal>

          {/* Confirm Modal */}
          <CModal visible={confirmOpen} onClose={() => setConfirmOpen(false)} alignment="center">
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
                {confirmPayMessage}
              </p>
            </CModalBody>
            <CModalFooter>
              <CButton color="secondary" onClick={() => setConfirmOpen(false)}>
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
          <CModal visible={errModalOpen} onClose={() => setErrModalOpen(false)} alignment="center">
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
              const reason = computeZeroReason() || "TripCostZero onClose redirect";
              setDbgPayErrorReason(`Redirect to PAYERROR_URL because TripCostZero closed: ${reason}`);

              setApiDebug({
                action: "TRIPCOSTZERO_REDIRECT_PAYERROR",
                url: PAYERROR_URL,
                payload: {
                  reason,
                  priceTotal,
                  tripPriceInclVat,
                  extraPriceInclVat,
                  paymentAmount,
                  validKidsCount,
                },
                response: null,
              });

              setShowZeroCostModal(false);
              window.location.href = PAYERROR_URL;
            }}
          />
        </main>

        <ProgramFooter lang={lang} />
      </div>

      {/* ✅ DEBUG PANEL */}
      <div
        style={{
          position: "fixed",
          bottom: 10,
          left: 10,
          right: 10,
          zIndex: 999999,
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            background: "#111",
            color: "#fff",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ padding: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <b style={{ fontSize: 14 }}>PAY DEBUG</b>
            <button
              onClick={() => setDbgOpen((v) => !v)}
              style={{
                marginLeft: "auto",
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {dbgOpen ? "Hide" : "Show"}
            </button>
          </div>

          {dbgOpen && (
            <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ padding: 10, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Last Action</div>
                  <div style={{ color: "#9be7ff" }}>{dbgLastAction || "-"}</div>

                  <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6 }}>PayError Reason</div>
                  <div style={{ color: "#ff9b9b", whiteSpace: "pre-wrap" }}>{dbgPayErrorReason || "-"}</div>

                  <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6 }}>Values</div>
                  <div style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
                    {safeStringify({
                      requestId,
                      priceTotal,
                      tripVatAmount,
                      tripPriceInclVat,
                      extraPriceInclVat,
                      totalPayablePerOrder,
                      paymentAmount,
                      validKidsCount,
                      showZeroCostModal,
                      payModalOpen,
                      otpOpen,
                      mfSessionId,
                      mfCountryCode,
                    })}
                  </div>
                </div>

                <div style={{ padding: 10, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10 }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>API URL</div>
                  <div style={{ color: "#a9ffb5", wordBreak: "break-word" }}>{debugApiUrl || "-"}</div>

                  <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6 }}>API Payload</div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#ddd" }}>
                    {safeStringify(debugPayload)}
                  </pre>

                  <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6 }}>API Response (latest)</div>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#ddd", maxHeight: 220, overflow: "auto" }}>
                    {safeStringify(debugResult)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProposalPage;
