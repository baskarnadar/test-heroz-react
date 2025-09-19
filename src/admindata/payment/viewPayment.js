// src/vendordata/activityinfo/activity/viewPayment.js
import React from "react";
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CModalTitle,
  CBadge, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CButton
} from "@coreui/react";

// ===== Toggle this off after you finish debugging =====
const DEBUG_MODE = true;

// ⬇️ NEW: bring the API base + auth headers so we can fetch payments if they’re missing
import { API_BASE_URL } from "../../config";
import { getAuthHeaders } from "../../utils/operation";

const GET_PAY_SUMMARY_URL = `${API_BASE_URL}/commondata/trip/gettripPaymentSummary`;

// ---------- helpers ----------
const toStr = (v) => (v ?? "").toString();
const fmtNum = (v) => (Number.isFinite(Number(v)) ? Number(v).toString() : toStr(v));
const fmtDateTime = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return toStr(iso);
    return d.toISOString().replace("T", " ").replace("Z", "");
  } catch { return toStr(iso); }
};
const statusClassName = (status = "") => {
  const s = (status || "").toUpperCase();
  if (s === "TRIP-BOOKED") return "status--trip-booked";
  if (s === "APPROVED") return "status--approved";
  if (s === "FAILED") return "status--failed";
  if (s === "NEW") return "status--new";
  if (s === "PRESENT") return "status--present";
  if (s === "ABSENT" || s === "ABSET") return "status--absent";
  return "status--default";
};
const SectionTitle = ({ children }) => <div className="section-title">{children}</div>;
const Tile = ({ label, value, mono }) => (
  <div className={`tile ${mono ? "mono" : ""}`}>
    <div className="tile__label">{label}</div>
    <div className="tile__value">{value}</div>
  </div>
);
const Grid = ({ children }) => <div className="grid">{children}</div>;

// ---------- id + map helpers ----------
const norm = (v) => (v == null ? "" : String(v).trim().toLowerCase());

/**
 * Choose the payments array with this priority:
 * 1) paymentsOverride (prop)
 * 2) item.payments (on the item itself)
 * 3) from allRequests: match by RequestID or actRequestRefNo
 */
function choosePaymentsSource(item, paymentsOverride, allRequests) {
  if (Array.isArray(paymentsOverride) && paymentsOverride.length) {
    return { source: "paymentsOverride", payments: paymentsOverride };
  }
  if (Array.isArray(item?.payments) && item.payments.length) {
    return { source: "item.payments", payments: item.payments };
  }
  if (Array.isArray(allRequests) && allRequests.length) {
    const byId = allRequests.find(r => r?.RequestID && r.RequestID === item?.RequestID);
    const byRef = allRequests.find(r => r?.actRequestRefNo && r.actRequestRefNo === item?.actRequestRefNo);
    const match = byId || byRef;
    if (Array.isArray(match?.payments) && match.payments.length) {
      return { source: byId ? "allRequests(RequestID)" : "allRequests(actRequestRefNo)", payments: match.payments };
    }
  }
  return { source: "none", payments: [] };
}

const ViewPaymentModal = ({ visible, onClose, item, paymentsOverride, allRequests }) => {
  // Parents map (ParentsID -> parent)
  const parentMap = React.useMemo(() => {
    const map = {};
    if (Array.isArray(item?.parentsInfo)) {
      for (const p of item.parentsInfo) if (p?.ParentsID) map[p.ParentsID] = p;
    }
    return map;
  }, [item]);

  // Decide where payments come from
  const { source: paymentsSourceName, payments: paymentsSourceRaw } = React.useMemo(
    () => choosePaymentsSource(item, paymentsOverride, allRequests),
    [item, paymentsOverride, allRequests]
  );

  // ⬇️ NEW: local fallback payments (when item + allRequests don’t provide any)
  const [fallbackPayments, setFallbackPayments] = React.useState([]);
  const [fallbackTried, setFallbackTried] = React.useState(false); // avoid refetch loops

  // ⬇️ NEW: try to fetch payments only if needed (visible, selected item, no payments)
  React.useEffect(() => {
    let aborted = false;

    async function fetchIfNeeded() {
      if (!visible) return;
      if (!item || !item.RequestID || !item.actRequestRefNo) return;
      if (Array.isArray(paymentsSourceRaw) && paymentsSourceRaw.length) return; // already have payments
      if (fallbackTried) return; // already tried a fetch once

      try {
        setFallbackTried(true);
        const res = await fetch(GET_PAY_SUMMARY_URL, {
          method: "POST",
          headers: {
            ...(getAuthHeaders ? getAuthHeaders() : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });
        const json = await res.json().catch(() => ({}));
        const arr = Array.isArray(json?.data) ? json.data : (json?.data ? [json.data] : []);
        if (!arr.length) return;

        const match =
          arr.find(r => r?.RequestID && r.RequestID === item.RequestID) ||
          arr.find(r => r?.actRequestRefNo && r.actRequestRefNo === item.actRequestRefNo);

        if (!aborted && Array.isArray(match?.payments) && match.payments.length) {
          setFallbackPayments(match.payments);
          if (DEBUG_MODE) {
            // eslint-disable-next-line no-console
            console.debug("[ViewPaymentModal] fetched fallback payments:", match.payments.length);
          }
        }
      } catch (err) {
        if (DEBUG_MODE) {
          // eslint-disable-next-line no-console
          console.debug("[ViewPaymentModal] fallback fetch error:", err?.message || err);
        }
      }
    }

    fetchIfNeeded();
    return () => { aborted = true; };
  }, [visible, item, paymentsSourceRaw, fallbackTried]);

  // ⬇️ Use raw source if present; otherwise fallback to fetched payments
  const effectivePayments = React.useMemo(() => {
    if (Array.isArray(paymentsSourceRaw) && paymentsSourceRaw.length) return paymentsSourceRaw;
    if (Array.isArray(fallbackPayments) && fallbackPayments.length) return fallbackPayments;
    return [];
  }, [paymentsSourceRaw, fallbackPayments]);

  // Build map (KidsID -> latest payment)
  const paymentMap = React.useMemo(() => {
    const map = {};
    for (const pay of effectivePayments) {
      const key = norm(pay?.KidsID);
      if (!key) continue;
      const prev = map[key];
      const prevDate = prev?.PayDate || prev?.CreatedDate || 0;
      const currDate = pay?.PayDate || pay?.CreatedDate || 0;
      if (!prev || new Date(currDate) > new Date(prevDate)) map[key] = pay;
    }
    return map;
  }, [effectivePayments]);

  // Debug values
  const kidKeys = React.useMemo(
    () => (Array.isArray(item?.KidsSumamry) ? item.KidsSumamry.map(k => norm(k?.KidsID)) : []),
    [item]
  );

  if (DEBUG_MODE) {
    try {
      // eslint-disable-next-line no-console
      console.debug("[ViewPaymentModal] item", { RequestID: item?.RequestID, actRequestRefNo: item?.actRequestRefNo });
      // eslint-disable-next-line no-console
      console.debug("[ViewPaymentModal] paymentsSourceName:", paymentsSourceName);
      // eslint-disable-next-line no-console
      console.debug("[ViewPaymentModal] paymentsSourceRaw.length:", (paymentsSourceRaw || []).length);
      // eslint-disable-next-line no-console
      console.debug("[ViewPaymentModal] fallbackPayments.length:", (fallbackPayments || []).length);
      // eslint-disable-next-line no-console
      console.debug("[ViewPaymentModal] effectivePayments.length:", effectivePayments.length);
      // eslint-disable-next-line no-console
      console.debug("[ViewPaymentModal] paymentMap keys:", Object.keys(paymentMap));
      // eslint-disable-next-line no-console
      console.debug("[ViewPaymentModal] kids keys:", kidKeys);
    } catch {}
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static" size="lg">
      <CModalHeader closeButton>
        <CModalTitle>Payment Request Details</CModalTitle>
      </CModalHeader>

      <CModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {!item ? (
          <div className="muted">No record selected.</div>
        ) : (
          <>
            {DEBUG_MODE && (
              <div style={{ background: "#fff3cd", border: "1px solid #ffeeba", padding: 8, marginBottom: 12, fontSize: 12 }}>
                <div><strong>DEBUG</strong></div>
                <div>paymentsSource: <b>{paymentsSourceName}</b></div>
                <div>paymentsSourceRaw.length: {(paymentsSourceRaw || []).length}</div>
                <div>fallbackPayments.length: {(fallbackPayments || []).length}</div>
                <div><b>effectivePayments.length: {effectivePayments.length}</b></div>
                <div>payment keys: {Object.keys(paymentMap).join(", ") || "(none)"}</div>
                <div>kids keys: {kidKeys.join(", ") || "(none)"}</div>
                <div>RequestID: {item?.RequestID || "-"}</div>
                <div>RefNo: {item?.actRequestRefNo || "-"}</div>
              </div>
            )}

            <SectionTitle>Basic Info</SectionTitle>
            <Grid>
              <Tile label="Reference No." value={item.actRequestRefNo} mono />
              <Tile label="Activity Name" value={item.actName} />
              <Tile label="Vendor Name" value={item.vdrName || "-"} />
              <div className="tile">
                <div className="tile__label">Status</div>
                <div>
                  <CBadge className={`status-badge ${statusClassName(item.actRequestStatus)}`}>
                    {item.actRequestStatus}
                  </CBadge>
                </div>
              </div>
              <Tile label="Request Date" value={item.actRequestDate} mono />
              <Tile label="Request Time" value={item.actRequestTime} mono />
            </Grid>

            <SectionTitle>Student Summary</SectionTitle>
            <Grid>
              <Tile label="Total Paid" value={fmtNum(item?.studentSummary?.totalStudentPaid)} />
              <Tile label="Approved" value={fmtNum(item?.studentSummary?.totalStudentApproved)} />
              <Tile label="Failed" value={fmtNum(item?.studentSummary?.totalStudentFailed)} />
              <Tile label="New" value={fmtNum(item?.studentSummary?.totalStudentNew)} />
            </Grid>

            <SectionTitle>Payments Summary</SectionTitle>
            <Grid>
              <Tile label="Trip profit" value={fmtNum(item?.tripPayment?.totalTripVendorCost)} mono />
              <Tile label="Food profit" value={fmtNum(item?.foodExtrasSummary?.totalFoodVendorPrice)} mono />
              <Tile label=" Total Trip Profit " value={fmtNum(item?.totalPaymentSummary?.totalVendorTripProfit)} mono />
            </Grid>

            <SectionTitle>Kids Information</SectionTitle>
            {Array.isArray(item?.KidsSumamry) && item.KidsSumamry.length > 0 ? (
              <CTable small hover responsive className="mb-3">
                <CTableHead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>TripFullAmount</CTableHeaderCell>
                    <CTableHeaderCell>SchoolNo</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Created</CTableHeaderCell>
                    <CTableHeaderCell>Parent Name</CTableHeaderCell>
                    <CTableHeaderCell>Mobile</CTableHeaderCell>
                    {DEBUG_MODE && <CTableHeaderCell>DBG</CTableHeaderCell>}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {item.KidsSumamry.map((k, i) => {
                    const parent = k?.ParentsID ? parentMap[k.ParentsID] : null;
                    const key = norm(k?.KidsID);
                    const pay = paymentMap[key];

                    if (DEBUG_MODE) {
                      try {
                        // eslint-disable-next-line no-console
                        console.debug(`[ViewPaymentModal] row ${i + 1}`, {
                          rawKidsID: k?.KidsID, normKey: key, found: !!pay, pay
                        });
                      } catch {}
                    }

                    return (
                      <CTableRow key={`${k.KidsID || i}`}>
                        <CTableDataCell>{i + 1}</CTableDataCell>
                        <CTableDataCell className="mono">
                          {pay?.TripFullAmount !== undefined ? fmtNum(pay.TripFullAmount) : "-"}
                        </CTableDataCell>
                        <CTableDataCell className="mono">{k?.TripKidsSchoolNo || "-"}</CTableDataCell>
                        <CTableDataCell>{k?.TripKidsName || "-"}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge className={`status-badge ${statusClassName(k?.tripKidsStatus)}`}>
                            {k?.tripKidsStatus || "-"}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell className="mono">{fmtDateTime(k?.CreatedDate)}</CTableDataCell>
                        <CTableDataCell>{parent?.tripParentsName || "-"}</CTableDataCell>
                        <CTableDataCell className="mono">{parent?.tripParentsMobileNo || "-"}</CTableDataCell>
                        {DEBUG_MODE && (
                          <CTableDataCell className="mono">
                            {pay ? `OK • ${pay.PayStatus || "?"}` : "NO MATCH / NO PAYMENTS"}
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    );
                  })}
                </CTableBody>
              </CTable>
            ) : (
              <div className="muted">No kids found for this request.</div>
            )}
          </>
        )}
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" className="add-product-button" variant="outline" onClick={onClose}>
          Close1
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ViewPaymentModal;
