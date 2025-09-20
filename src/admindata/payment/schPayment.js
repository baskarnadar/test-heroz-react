// src/vendordata/activityinfo/activity/schPayment.js
import { API_BASE_URL } from '../../config'
import React from "react";
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormInput, CFormTextarea, CFormSelect, CAlert, CRow, CCol, CSpinner,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CBadge
} from "@coreui/react";
import { getAuthHeaders, getCurrentLoggedUserID } from "../../utils/operation";

const PAY_SCHOOL_URL = `${API_BASE_URL}/admindata/payment/paytoSchVdr`;
const GET_SCH_VDR_URL = `${API_BASE_URL}/admindata/payment/getSchVdr`;

// === helpers ===
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const sumBy = (arr, key) => (Array.isArray(arr) ? arr.reduce((s, x) => s + toNum(x?.[key]), 0) : 0);
const fmt = (v) => {
  const n = toNum(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (v ?? "-");
};

// array-first versions:
const sumTripSchoolPrice = (it) =>
  sumBy(it?.payments, "TripSchoolPrice") ||
  toNum(it?.tripPayment?.totalTripSchoolPrice);

const sumFoodSchoolPrice = (it) =>
  sumBy(it?.foodExtras, "FoodSchoolPrice") ||
  toNum(it?.foodExtrasSummary?.totalFoodSchoolPrice);

const sumSchoolTotal = (it) =>
  sumTripSchoolPrice(it) + sumFoodSchoolPrice(it);

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
  // derive directly from arrays; fall back to prop if absolutely needed
  const tripSchool = sumTripSchoolPrice(item);
  const foodSchool = sumFoodSchoolPrice(item);
  const schoolTotal = sumSchoolTotal(item) || toNum(totalProfit); // "Total Profit"

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
  const totalPaid = React.useMemo(() => sumBy(records, "schPaidAmount"), [records]);

  // Balance = Total Profit - Previous Payments
  const balancePayable = React.useMemo(
    () => Math.max(0, toNum(schoolTotal) - toNum(totalPaid)),
    [schoolTotal, totalPaid]
  );

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
      // SchoolID is optional; include only if present
      if (item?.SchoolID) body.SchoolID = item.SchoolID;

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
      // sort newest first by schPaidDate then CreatedDate
      recs.sort((a, b) => {
        const ad = new Date(a?.schPaidDate || a?.CreatedDate || 0).getTime();
        const bd = new Date(b?.schPaidDate || b?.CreatedDate || 0).getTime();
        return bd - ad;
      });
      setRecords(recs);
    } catch (e) {
      setListError(e.message || "Failed to load payments.");
    } finally {
      setLoadingList(false);
    }
  }, [item]);

  // reset on open + fetch list
  React.useEffect(() => {
    if (visible) {
      const fresh = sumSchoolTotal(item) || toNum(totalProfit);
      setAmount(fresh || 0); // will be overwritten by balance after list loads
      setDate(new Date().toISOString().slice(0,10));
      setType("CASH");
      setNote("");
      setSubmitting(false);
      setError("");
      setSuccess("");
      setUserEditedAmount(false); // allow auto-fill with balance
      fetchPayments();
    }
  }, [visible, item, totalProfit, fetchPayments]);

  // keep amount synced to balance only if user hasn't edited it yet
  React.useEffect(() => {
    if (visible && !userEditedAmount) {
      setAmount(balancePayable);
    }
  }, [balancePayable, visible, userEditedAmount]);

  // ---- validations ----
  const validate = () => {
    if (!item?.RequestID) return "Missing RequestID.";
    if (!item?.ActivityID) return "Missing ActivityID.";
    // SchoolID is OPTIONAL now; no blocking validation
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
      schPaidAmount: Number(amount),
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
      // refresh list
      await fetchPayments();
      // allow amount to auto-adjust to new balance after refresh
      setUserEditedAmount(false);
      setNote("");
    } catch (err) {
      setError(err?.message || "Failed to submit payment.");
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
            <Tile title="Trip Profit" value={tripSchool} tone="info" subtitle="From trip payments" />
          </CCol>
          <CCol xs={12} md={4}>
            <Tile title="Food Profit" value={foodSchool} tone="success" subtitle="From food add-ons" />
          </CCol>
          <CCol xs={12} md={4}>
            <Tile title="Total Profit" value={schoolTotal} tone="warning" subtitle="Trip + Food" />
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
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setUserEditedAmount(true); }}
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
                        {/* RIGHT aligned + padding on the right */}
                      
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
