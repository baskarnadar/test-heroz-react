// src/vendordata/activityinfo/activity/schPayment.js
import { API_BASE_URL } from '../../config'
import React from "react";
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormInput, CFormTextarea, CFormSelect, CAlert, CRow, CCol, CSpinner,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CBadge
} from "@coreui/react";
import { getAuthHeaders, getCurrentLoggedUserID, IsAdminLoginIsValid } from "../../utils/operation";

const PAY_SCHOOL_URL = `${API_BASE_URL}/admindata/payment/paytoSchVdr`;
const GET_SCH_VDR_URL = `${API_BASE_URL}/admindata/payment/getSchVdr`;

// === helpers ===
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const round2 = (n) => Math.round((toNum(n) + Number.EPSILON) * 100) / 100;
const sumBy = (arr, key) =>
  Array.isArray(arr) ? arr.reduce((s, x) => s + toNum(x?.[key]), 0) : 0;

// always render TWO decimals
const fmt = (v) => {
  const n = toNum(v);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (v ?? "-");
};

// safer stringify (handles circular refs, BigInt, undefined)
const safeStringify = (obj, space = 2) => {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (typeof value === "undefined") return null;
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    },
    space
  );
};

/* ---------- robust pickers that read from top-level or __full ---------- */
const has = (o, k) => Object.prototype.hasOwnProperty.call(o || {}, k);

// returns array from item[key] or item.__full[key]
const pickArr = (item, key) => {
  const top = (has(item, key) && Array.isArray(item[key])) ? item[key] : null;
  const full = (has(item || {}, "__full") && has(item.__full, key) && Array.isArray(item.__full[key])) ? item.__full[key] : null;
  return top || full || [];
};

// returns number from a dotted path, searching top-level then __full
const pickNum = (item, dottedPath) => {
  const read = (obj) => dottedPath.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
  const topVal = read(item);
  if (Number.isFinite(Number(topVal))) return Number(topVal);
  const fullVal = item && item.__full ? read(item.__full) : undefined;
  if (Number.isFinite(Number(fullVal))) return Number(fullVal);
  return 0;
};

// ---------- calculation rules ----------
// Detect "APPROVED" status across possible field casings/aliases.
const isApproved = (row) => {
  const v = (row?.PayStatus ?? row?.payStatus ?? row?.status ?? "").toString().toUpperCase();
  return v === "APPROVED";
};

// Heuristic "kids only" detector.
const isKid = (row) => {
  if (row?.isKid === true || row?.IsKid === true || row?.Kids === true || row?.ForKids === true) return true;
  const txt =
    (row?.StuType ??
     row?.StudentType ??
     row?.Type ??
     row?.PersonType ??
     row?.Category ??
     row?.For ??
     row?.Role ??
     row?.ageGroup ??
     row?.AgeGroup ??
     row?.target ??
     "").toString().toUpperCase();
  if (txt.includes("KID") || txt.includes("CHILD")) return true;
  if (txt === "STUDENT" || txt.includes("STUDENT")) return true;
  if (row?.IsAdult === true || row?.isAdult === true) return false;
  return false;
};

// Trip Profit = sum(TripSchoolPrice) for APPROVED payments  ✅ (100%)
const computeTripProfit = (item) => {
  const payments = pickArr(item, "payments");
  const approvedSum = payments
    .filter(isApproved)
    .reduce((s, r) => s + toNum(r?.TripSchoolPrice ?? r?.tripSchoolPrice), 0);

  if (approvedSum > 0) return round2(approvedSum);

  // Fallback: use summary if present (either level)
  const summary = pickNum(item, "tripPayment.totalTripSchoolPrice");
  return summary > 0 ? round2(summary) : 0;
};

// Food Profit = sum(FoodSchoolPrice) for APPROVED + kids only  ✅ 100%
const computeFoodProfit = (item) => {
  const foodExtras = pickArr(item, "foodExtras");

  const hasRowStatus = foodExtras.some((r) => r?.PayStatus || r?.payStatus || r?.status);
  const hasKidHint  = foodExtras.some((r) => isKid(r));

  let approvedKidsSum = 0;

  if (hasRowStatus || hasKidHint) {
    // strict per-row filtering
    approvedKidsSum = foodExtras
      .filter((r) => (!hasRowStatus || isApproved(r)) && (!hasKidHint || isKid(r)))
      .reduce((s, r) => s + toNum(r?.FoodSchoolPrice ?? r?.foodSchoolPrice), 0);
  } else {
    // No row-level flags; correlate with approved payments count conservatively
    const payments = pickArr(item, "payments");
    const approvedCount = payments.filter(isApproved).length;
    const n = Math.min(approvedCount, foodExtras.length);
    if (n > 0) {
      const totalFoodSchool = foodExtras.reduce((s, r) => s + toNum(r?.FoodSchoolPrice ?? r?.foodSchoolPrice), 0);
      const avg = totalFoodSchool / foodExtras.length;
      approvedKidsSum = avg * n;
    }
  }

  if (approvedKidsSum > 0) return round2(approvedKidsSum);

  // Fallback: use summary if present
  const summary = pickNum(item, "foodExtrasSummary.totalFoodSchoolPrice");
  return summary > 0 ? round2(summary) : 0;
};

// Route to rule-based functions
const sumTripSchoolPrice = (it) => computeTripProfit(it);
const sumFoodSchoolPrice = (it) => computeFoodProfit(it);

// ✅ Total = Trip Profit + Food Profit (not trip twice)
const sumSchoolTotal = (trip /* number */, food /* number */) =>
  round2(toNum(trip) + toNum(food));

// ---------- UI tiles ----------
const Tile = ({ title, value, tone = "neutral", subtitle }) => {
  const tones = {
    neutral: {
      bg: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
      border: "#e9ecef",
      text: "#343a40",
    },
    success: {
      bg: "linear-gradient(135deg, #e6fbef 0%, #ffffff 100%)",
      border: "#b7f0cf",
      text: "#057a48",
    },
    info: {
      bg: "linear-gradient(135deg, #e9f2ff 0%, #ffffff 100%)",
      border: "#cfe2ff",
      text: "#1e5bb8",
    },
    warning: {
      bg: "linear-gradient(135deg, #fff3cd 0%, #ffffff 100%)",
      border: "#ffe69c",
      text: "#8a6d3b",
    },
  };

  const t = tones[tone] || tones.neutral;

  return (
    <div
      className="rounded-4 p-3 shadow-sm h-100"
      style={{ background: t.bg, border: `1px solid ${t.border}` }}
    >
      <div className="d-flex justify-content-between align-items-start mb-1">
        <div style={{ color: t.text, fontWeight: 600 }}>{title}</div>
      </div>
      <div className="display-6 fw-bold mono" style={{ color: t.text, lineHeight: 1.1 }}>
        {fmt(value)}
      </div>
      {subtitle ? <div className="text-muted small mt-1">{subtitle}</div> : null}
    </div>
  );
};

const SchPaymentModal = ({ visible, onClose, item, totalProfit }) => {
  // ✅ Admin login validity check (applied here)
  React.useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  // === derived values following your conditions ===
  const tripSchool = sumTripSchoolPrice(item); // ✅ 100% of APPROVED TripSchoolPrice
  const foodSchool = sumFoodSchoolPrice(item); // ✅ 100% of APPROVED kids-only FoodSchoolPrice
  const schoolTotal = sumSchoolTotal(tripSchool, foodSchool); // ✅ Trip + Food

  // --- form state ---
  const [amount, setAmount] = React.useState(schoolTotal || 0);
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0,10));
  const [type, setType] = React.useState("CASH");
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Track if user manually edited amount (to avoid overwriting their value)
  const [userEditedAmount, setUserEditedAmount] = React.useState(false);

  // --- list state ---
  const [loadingList, setLoadingList] = React.useState(false);
  const [listError, setListError] = React.useState("");
  const [records, setRecords] = React.useState([]); // [{schPaidAmount, schPaidDate, schPaidNote, schPaidPaymentType, ...}]
  const totalPaid = React.useMemo(() => round2(sumBy(records, "schPaidAmount")), [records]);

  // Balance = Total Profit - Previous Payments (rounded to 2dp)
  const balancePayable = React.useMemo(
    () => round2(toNum(schoolTotal) - toNum(totalPaid)),
    [schoolTotal, totalPaid]
  );

  // ===== DEBUG: always show by default =====
  const [showDebug, setShowDebug] = React.useState(
    () => (typeof window !== "undefined" && typeof window.__SCH_DEBUG__ === "boolean")
      ? window.__SCH_DEBUG__
      : true
  );

  // Build a single object that shows what we got from parent + our derived values
  const debugBundle = React.useMemo(() => {
    const idPart = {
      RequestID: item?.RequestID ?? null,
      ActivityID: item?.ActivityID ?? null,
      SchoolID: item?.SchoolID ?? null,
    };

    const paymentsArr = pickArr(item, "payments");
    const foodArr = pickArr(item, "foodExtras");
    const tripApprovedCount = paymentsArr.filter(isApproved).length;

    // Detect where totals came from
    const topTrip = (item?.tripPayment?.totalTripSchoolPrice ?? undefined);
    const fullTrip = (item?.__full?.tripPayment?.totalTripSchoolPrice ?? undefined);
    const topFood = (item?.foodExtrasSummary?.totalFoodSchoolPrice ?? undefined);
    const fullFood = (item?.__full?.foodExtrasSummary?.totalFoodSchoolPrice ?? undefined);

    // Whether food rows carried status/kid hints
    const hasRowStatus = foodArr.some((r) => r?.PayStatus || r?.payStatus || r?.status);
    const hasKidHint  = foodArr.some((r) => isKid(r));

    return {
      props: {
        visible: !!visible,
        totalProfitProp: totalProfit ?? null,
      },
      identifiers: idPart,
      item,
      derived: {
        tripSchool_APPROVED_100pct: tripSchool,
        foodSchool_APPROVED_kidsOnly_100pct: foodSchool,
        totalProfit_tripPlusFood: schoolTotal,
        totalPaidHistory: totalPaid,
        balancePayable: balancePayable,
        amountField: round2(amount),
        counters: {
          payments_total: paymentsArr.length,
          payments_approved: tripApprovedCount,
          foodExtras_total: foodArr.length,
          foodExtras_hasRowStatus: hasRowStatus,
          foodExtras_hasKidHint: hasKidHint,
        },
        sources: {
          usedPaymentsFrom: Array.isArray(item?.payments) ? "item.payments" : Array.isArray(item?.__full?.payments) ? "item.__full.payments" : "none",
          usedFoodExtrasFrom: Array.isArray(item?.foodExtras) ? "item.foodExtras" : Array.isArray(item?.__full?.foodExtras) ? "item.__full.foodExtras" : "none",
          tripSummaryTopLevel: topTrip,
          tripSummaryFull: fullTrip,
          foodSummaryTopLevel: topFood,
          foodSummaryFull: fullFood,
        }
      },
      form: { amount: round2(amount), date, type, note },
    };
  }, [item, visible, totalProfit, tripSchool, foodSchool, schoolTotal, totalPaid, balancePayable, amount, date, type, note]);

  // Console logs whenever inputs change — helpful during development
  React.useEffect(() => {
    if (!visible) return;
    console.debug("[SchPaymentModal] Parent payload (item):", item);
    console.debug("[SchPaymentModal] totalProfit prop:", totalProfit);
    console.debug("[SchPaymentModal] derived:", {
      tripSchool, foodSchool, schoolTotal, totalPaid, balancePayable
    });
  }, [visible, item, totalProfit, tripSchool, foodSchool, schoolTotal, totalPaid, balancePayable]);

  // fetch list
  const fetchPayments = React.useCallback(async () => {
    if (!item?.RequestID || !item?.ActivityID) return;
    setLoadingList(true);
    setListError("");
    try {
      const body = {
        RequestID: item.RequestID,
        ActivityID: item.ActivityID,
        PaySection: "SCHOOL",
      };
      if (item?.SchoolID) body.SchoolID = item.SchoolID;

      console.debug("[SchPaymentModal] fetchPayments body:", body);

      const res = await fetch(GET_SCH_VDR_URL, {
        method: "POST",
        headers: {
          ...(getAuthHeaders ? getAuthHeaders() : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || `Request failed: ${res.status}`);
      }
      const recs = Array.isArray(json?.data?.records) ? json.data.records : [];
      recs.sort((a, b) => {
        const ad = new Date(a?.schPaidDate || a?.CreatedDate || 0).getTime();
        const bd = new Date(b?.schPaidDate || b?.CreatedDate || 0).getTime();
        return bd - ad;
      });
      setRecords(recs);
      console.debug("[SchPaymentModal] Payments list response:", recs);
    } catch (e) {
      setListError(e.message || "Failed to load payments.");
      console.debug("[SchPaymentModal] fetchPayments error:", e);
    } finally {
      setLoadingList(false);
    }
  }, [item]);

  // reset on open + fetch list
  React.useEffect(() => {
    if (visible) {
      setDate(new Date().toISOString().slice(0,10));
      setType("CASH");
      setNote("");
      setSubmitting(false);
      setError("");
      setSuccess("");
      setUserEditedAmount(false);
      fetchPayments();
    }
  }, [visible, item, totalProfit, fetchPayments]);

  // when any derived changes and user hasn't edited, sync default amount to balance (rounded)
  React.useEffect(() => {
    if (visible && !userEditedAmount) {
      setAmount(round2(balancePayable));
    }
  }, [balancePayable, visible, userEditedAmount]);

  // ---- validations ----
  const validate = () => {
    if (!item?.RequestID) return "Missing RequestID.";
    if (!item?.ActivityID) return "Missing ActivityID.";
    if (!date) return "Payment Date is required.";
    if (!type) return "Payment Type is required.";
    if (!note || !note.trim()) return "Payment Note is required.";
    if (!amount || Number(amount) <= 0) return "Payment Amount must be greater than 0.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    const vMsg = validate();
    if (vMsg) {
      setError(vMsg);
      return;
    }

    const nowIso = new Date().toISOString();
    const user = getCurrentLoggedUserID?.() || "";

    // Build payload; SchoolID is optional and only included if present
    const payload = {
      RequestID: item?.RequestID || "",
      ActivityID: item?.ActivityID || "",
      schPaidAmount: round2(amount),
      schPaidDate: date,
      schPaidNote: note || "",
      schPaidPaymentType: type,
      CreatedDate: nowIso,
      CreatedBy: user,
      ModifyDate: nowIso,
      ModifyBy: user,
      PaySection: 'SCHOOL',
    };
    if (item?.SchoolID) payload.SchoolID = item.SchoolID; // optional

    console.debug("[SchPaymentModal] Submit payload:", payload);

    try {
      setSubmitting(true);
      const res = await fetch(PAY_SCHOOL_URL, {
        method: "POST",
        headers: {
          ...(getAuthHeaders ? getAuthHeaders() : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.message || `Request failed: ${res.status}`);

      setSuccess("Payment saved successfully.");
      await fetchPayments();
      setUserEditedAmount(false);
      setNote("");
    } catch (err) {
      setError(err?.message || "Failed to submit payment.");
      console.debug("[SchPaymentModal] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="lg" backdrop="static">
      <CModalHeader closeButton>
        <CModalTitle>Pay To School</CModalTitle>
      </CModalHeader>
      <CModalBody>

        {/* ===== ALWAYS-VISIBLE DEBUG BLOCK (can hide) ===== */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="fw-semibold">Debug data</div>
            <CButton size="sm" color="light" variant="outline" onClick={() => setShowDebug((v) => !v)}>
              {showDebug ? "Hide" : "Show"}
            </CButton>
          </div>

          {showDebug && (
            <div className="mt-2 rounded-4 border" style={{ borderColor: "#e9ecef", background: "#fff" }}>
              <div className="p-2 border-bottom" style={{ borderColor: "#e9ecef" }} />
              <div className="p-2 border-top" style={{ borderColor: "#e9ecef" }} />
              <div style={{ maxHeight: 300, overflow: "auto" }} className="p-2" />
            </div>
          )}
        </div>

        {!!error && <CAlert color="danger" className="mb-3">{error}</CAlert>}
        {!!success && <CAlert color="success" className="mb-3">{success}</CAlert>}

        {/* ===== FOCUSED SUMMARY STRIP ===== */}
        <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
          <CBadge color="light" textColor="dark" className="p-2 rounded-3 shadow-sm">
            <b>Previous Payment:</b> <span className="ms-1 mono">{fmt(totalPaid)}</span>
          </CBadge>
          <CBadge color={balancePayable > 0 ? "warning" : "success"} textColor="dark" className="p-2 rounded-3 shadow-sm">
            <b>Balance Payable Amount:</b> <span className="ms-1 mono">{fmt(balancePayable)}</span>
          </CBadge>
        </div>

        {/* ===== THREE TILES ===== */}
        <CRow className="g-3 mb-3">
          <CCol xs={12} md={4}>
            <Tile title="Trip Profit" value={tripSchool} tone="info"  />
          </CCol>
          <CCol xs={12} md={4}>
            <Tile title="Food Profit" value={foodSchool} tone="success"   />
          </CCol>
          <CCol xs={12} md={4}>
            <Tile title="Total Profit" value={schoolTotal} tone="warning"   />
          </CCol>
        </CRow>

        {/* Quick hint */}
        <div className="text-muted small mb-2">
          Amount defaults to <i>Balance Payable Amount</i> — you can adjust it.
        </div>

        {/* ===== Form ===== */}
        <CForm onSubmit={handleSubmit} className="rounded-4 border p-3 mb-4" style={{ borderColor: "#e9ecef", background: "#fff" }}>
          <CRow className="g-3">
            <CCol xs={12} md={4}>
              <CFormInput
                type="number"
                step="0.01"
                label="Payment Amount *"
                value={Number(amount ?? 0).toFixed(2)}
                onChange={(e) => { setAmount(toNum(e.target.value)); setUserEditedAmount(true); }}
                required
                min="0.01"
                title="Defaults to (Total Profit - Previous Payments), but you can adjust manually"
              />
            </CCol>
            <CCol xs={12} md={4}>
              <CFormInput
                type="date"
                label="Payment Date *"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </CCol>
            <CCol xs={12} md={4}>
              <CFormSelect
                label="Payment Type *"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="CASH">CASH</option>
                <option value="BANK-TRANSFER">BANK-TRANSFER</option>
                <option value="ONLINE">ONLINE</option>
                <option value="OTHER">OTHER</option>
              </CFormSelect>
            </CCol>
            <CCol xs={12}>
              <CFormTextarea
                label="Payment Note *"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (required)"
                required
              />
            </CCol>
          </CRow>
          <div className="mt-3 d-flex justify-content-end gap-2">
            <CButton color="secondary" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Submit"}
            </CButton>
          </div>
        </CForm>

        {/* ===== Previous Payment History ===== */}
        <div className="mt-3">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="section-title fw-semibold">Previous Payment History</div>
            <div className="flex-grow-1"><hr className="mt-2 mb-2" /></div>
          </div>

          {loadingList && (
            <div className="d-flex align-items-center gap-2 text-muted mb-2">
              <CSpinner size="sm" /> Loading payments…
            </div>
          )}
          {!!listError && <CAlert color="danger" className="mb-2">{listError}</CAlert>}

          {!loadingList && !listError && (
            records.length ? (
              <div className="rounded-4 border" style={{ borderColor: "#e9ecef", overflow: "hidden" }}>
                <CTable small hover responsive="sm" className="mb-0">
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell className="text-center" style={{ width: 60 }}>#</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 160 }}>Date</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 170 }}>Type</CTableHeaderCell>
                      <CTableHeaderCell>Note</CTableHeaderCell>
                      <CTableHeaderCell className="text-end pe-3" style={{ width: 180 }}>Amount</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {records.map((r, idx) => (
                      <CTableRow key={idx} className={idx % 2 ? "bg-body-tertiary" : ""}>
                        <CTableDataCell className="text-center">{idx + 1}</CTableDataCell>
                        <CTableDataCell>{r?.schPaidDate || "-"}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="light" textColor="dark">
                            {r?.schPaidPaymentType || "-"}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{r?.schPaidNote || "-"}</CTableDataCell>
                        <CTableDataCell className="text-end pe-3 mono">{fmt(r?.schPaidAmount)}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            ) : (
              <div className="text-muted">No previous payments found</div>
            )
          )}
        </div>
      </CModalBody>
      <CModalFooter />
    </CModal>
  );
};

export default SchPaymentModal;
