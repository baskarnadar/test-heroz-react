import React from "react";
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CModalTitle,
  CBadge, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CButton
} from "@coreui/react";

// ===== Debug disabled per your request =====
const DEBUG_MODE = false;

// API base + auth headers
import { API_BASE_URL } from "../../config";
import { getAuthHeaders } from "../../utils/operation";

const GET_PAY_SUMMARY_URL = `${API_BASE_URL}/commondata/trip/gettripPaymentSummary`;

// ---------- helpers ----------
const toStr = (v) => (v ?? "").toString();
const fmtNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toString() : toStr(v);
};
const fmtMoney = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "-";
};
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

// ---------- tolerant numeric readers ----------
const parseNum = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v === "string") {
    const cleaned = v.replace(/,/g, ".").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
};

const numField = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    const n = parseNum(v);
    if (Number.isFinite(n)) return n;
  }
  if (obj && typeof obj === "object") {
    const lowerMap = {};
    for (const ok of Object.keys(obj)) lowerMap[ok.toLowerCase()] = obj[ok];
    for (const k of keys) {
      const lk = String(k).toLowerCase();
      if (lk in lowerMap) {
        const n = parseNum(lowerMap[lk]);
        if (Number.isFinite(n)) return n;
      }
    }
  }
  return 0;
};

const looseNumberByKey = (obj, ...needleParts) => {
  if (!obj || typeof obj !== "object") return 0;
  const parts = needleParts.map(p => String(p).toLowerCase());
  for (const [rawK, v] of Object.entries(obj)) {
    const k = String(rawK).replace(/[\s_\-]/g, "").toLowerCase();
    const hit = parts.every(p => k.includes(p));
    if (!hit) continue;
    const n = parseNum(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

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

  // local fallback payments (when item + allRequests don’t provide any)
  const [fallbackPayments, setFallbackPayments] = React.useState([]);
  const [fallbackTried, setFallbackTried] = React.useState(false); // avoid refetch loops

  // try to fetch payments only if needed (visible, selected item, no payments)
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
        }
      } catch {}
    }

    fetchIfNeeded();
    return () => { aborted = true; };
  }, [visible, item, paymentsSourceRaw, fallbackTried]);

  // Use raw source if present; otherwise fallback to fetched payments
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

  // Food extras list
  const foodExtras = React.useMemo(() => {
    return Array.isArray(item?.foodExtras)
      ? item.foodExtras
      : Array.isArray(item?.FoodExtras)
        ? item.FoodExtras
        : [];
  }, [item]);

  // ---------- JSON helpers ----------
  const prettyJSON = (obj) => {
    try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
  };

  // Compact JSON (for readability in UI)
  const selectedRecordJSON = React.useMemo(() => {
    const trimmedFoodExtras = (Array.isArray(item?.foodExtras) ? item.foodExtras
      : Array.isArray(item?.FoodExtras) ? item.FoodExtras : [])
      .map(f => ({
        FoodID: f?.FoodID,
        FoodName: f?.FoodName,
        FoodSchoolPrice: f?.FoodSchoolPrice ?? f?.foodSchoolPrice,
        FoodVendorPrice: f?.FoodVendorPrice ?? f?.foodVendorPrice,
        FoodHerozPrice: f?.FoodHerozPrice ?? f?.foodHerozPrice,
      }));

    const trimmedPayments = (Array.isArray(effectivePayments) ? effectivePayments : []).map(p => ({
      KidsID: p?.KidsID,
      TripSchoolPrice: p?.TripSchoolPrice ?? p?.tripSchoolPrice,
      TripVendorCost: p?.TripVendorCost ?? p?.tripVendorCost,
      TripHerozCost: p?.TripHerozCost ?? p?.tripHerozCost,
      TripFullAmount: p?.TripFullAmount ?? p?.tripFullAmount,
      PayStatus: p?.PayStatus ?? p?.payStatus,
      PayDate: p?.PayDate ?? p?.payDate,
    }));

    const trimmedKids = (Array.isArray(item?.KidsSumamry) ? item.KidsSumamry : []).map(k => ({
      KidsID: k?.KidsID,
      TripKidsName: k?.TripKidsName,
      tripKidsStatus: k?.tripKidsStatus,
      CreatedDate: k?.CreatedDate,
    }));

    return {
      actRequestRefNo: item?.actRequestRefNo,
      actName: item?.actName,
      vdrName: item?.vdrName,
      actRequestStatus: item?.actRequestStatus,
      studentSummary: item?.studentSummary ?? null,
      foodExtras: trimmedFoodExtras,
      foodExtrasSummary: item?.foodExtrasSummary ?? item?.FoodExtrasSummary ?? null,
      payments: trimmedPayments,
      kids: trimmedKids,
    };
  }, [item, effectivePayments]);

  // ---------- Aggregate profits & totals (All records) ----------
  const aggregates = React.useMemo(() => {
    const trip = {
      count: 0,
      fullAmount: 0,
      school: 0,
      vendor: 0,
      heroz: 0,
      foodCostOnPayments: 0,
      tax: 0,
    };

    for (const p of effectivePayments) {
      trip.count += 1;
      trip.fullAmount += numField(p, "TripFullAmount", "tripFullAmount");
      trip.school += numField(p, "TripSchoolPrice", "tripSchoolPrice");
      trip.vendor += numField(p, "TripVendorCost", "tripVendorCost");
      trip.heroz  += numField(p, "TripHerozCost", "tripHerozCost");
      trip.foodCostOnPayments += numField(p, "TripFoodCost", "tripFoodCost");
      trip.tax += numField(p, "TripTaxAmount", "tripTaxAmount");
    }

    const food = {
      count: 0,
      school: 0,
      vendor: 0,
      heroz: 0,
    };

    for (const f of foodExtras) {
      food.count += 1;

      let s = numField(f, "FoodSchoolPrice", "foodSchoolPrice", "SchoolPrice");
      let v = numField(f, "FoodVendorPrice", "foodVendorPrice", "VendorPrice");
      let h = numField(f, "FoodHerozPrice",  "foodHerozPrice",  "HerozPrice");

      if (s === 0) s = looseNumberByKey(f, "food", "school") || looseNumberByKey(f, "school");
      if (v === 0) v = looseNumberByKey(f, "food", "vendor") || looseNumberByKey(f, "vendor");
      if (h === 0) h = looseNumberByKey(f, "food", "heroz")  || looseNumberByKey(f, "heroz");

      food.school += s;
      food.vendor += v;
      food.heroz  += h;
    }

    // Fallback to summary totals if we had no rows
    if (food.count === 0) {
      const sum = item?.foodExtrasSummary || item?.FoodExtrasSummary;
      if (sum) {
        food.count  = numField(sum, "count");
        food.school += numField(sum, "totalFoodSchoolPrice", "FoodSchoolPrice", "school")
                    || looseNumberByKey(sum, "food", "school") || looseNumberByKey(sum, "school");
        food.vendor += numField(sum, "totalFoodVendorPrice", "FoodVendorPrice", "vendor")
                    || looseNumberByKey(sum, "food", "vendor") || looseNumberByKey(sum, "vendor");
        food.heroz  += numField(sum, "totalFoodHerozPrice",  "FoodHerozPrice",  "heroz")
                    || looseNumberByKey(sum, "food", "heroz")  || looseNumberByKey(sum, "heroz");
      }
    }

    const grand = {
      school: trip.school + food.school,
      vendor: trip.vendor + food.vendor,
      heroz:  trip.heroz  + food.heroz,
    };

    return { trip, food, grand };
  }, [effectivePayments, foodExtras, item]);

  // Totals for footer under kids table (e.g., TripFullAmount sum)
  const kidsTotals = React.useMemo(() => {
    let totalFull = 0;
    let totalSchool = 0;
    let totalVendor = 0;
    let totalHeroz = 0;

    for (const k of (item?.KidsSumamry || [])) {
      const key = norm(k?.KidsID);
      const pay = paymentMap[key];
      if (pay) {
        totalFull += numField(pay, "TripFullAmount", "tripFullAmount");
        totalSchool += numField(pay, "TripSchoolPrice", "tripSchoolPrice");
        totalVendor += numField(pay, "TripVendorCost", "tripVendorCost");
        totalHeroz += numField(pay, "TripHerozCost", "tripHerozCost");
      }
    }
    return { totalFull, totalSchool, totalVendor, totalHeroz };
  }, [item, paymentMap]);

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static" className="custom-modal">
      <CModalHeader closeButton>
        <CModalTitle>Payment Request Details</CModalTitle>
      </CModalHeader>

      <CModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {!item ? (
          <div className="muted">No record selected.</div>
        ) : (
          <>
            

            {/* ===== Basic Info ===== */}
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

            {/* ===== Student Summary ===== */}
            <SectionTitle>Student Summary</SectionTitle>
            <Grid>
              <Tile label="Total Paid" value={fmtNum(item?.studentSummary?.totalStudentPaid)} />
              <Tile label="Approved" value={fmtNum(item?.studentSummary?.totalStudentApproved)} />
              <Tile label="Failed" value={fmtNum(item?.studentSummary?.totalStudentFailed)} />
              <Tile label="New" value={fmtNum(item?.studentSummary?.totalStudentNew)} />
            </Grid>

            {/* ===== Payments Summary ===== */}
            <SectionTitle>Payments Summary</SectionTitle>
            <Grid>
              <Tile label="Trip profit (Vendor)" value={fmtMoney(aggregates.trip.vendor)} mono />
              <Tile label="Food profit (Vendor)" value={fmtMoney(aggregates.food.vendor)} mono />
              <Tile label="Food profit (School)" value={fmtMoney(aggregates.food.school)} mono />
              <Tile label="Food profit (Heroz)" value={fmtMoney(aggregates.food.heroz)} mono />
              <Tile label="Total Trip Profit (Vendor)" value={fmtMoney(aggregates.grand.vendor)} mono />
            </Grid>

            {/* ===== Profit Breakdown (All Records) ===== */}
            <SectionTitle>Profit Breakdown (All Records)</SectionTitle>
            <CTable small hover responsive className="mb-3 profit-breakdown">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Category</CTableHeaderCell>
                  <CTableHeaderCell className="mono col-school">School</CTableHeaderCell>
                  <CTableHeaderCell className="mono col-vendor">Vendor</CTableHeaderCell>
                  <CTableHeaderCell className="mono col-heroz">Heroz</CTableHeaderCell>
                  <CTableHeaderCell className="mono">Count</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow>
                  <CTableDataCell>Trip Payments</CTableDataCell>
                  <CTableDataCell className="mono col-school">{fmtMoney(aggregates.trip.school)}</CTableDataCell>
                  <CTableDataCell className="mono col-vendor">{fmtMoney(aggregates.trip.vendor)}</CTableDataCell>
                  <CTableDataCell className="mono col-heroz">{fmtMoney(aggregates.trip.heroz)}</CTableDataCell>
                  <CTableDataCell className="mono">{fmtNum(aggregates.trip.count)}</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>Food Extras</CTableDataCell>
                  <CTableDataCell className="mono col-school">{fmtMoney(aggregates.food.school)}</CTableDataCell>
                  <CTableDataCell className="mono col-vendor">{fmtMoney(aggregates.food.vendor)}</CTableDataCell>
                  <CTableDataCell className="mono col-heroz">{fmtMoney(aggregates.food.heroz)}</CTableDataCell>
                  <CTableDataCell className="mono">{fmtNum(aggregates.food.count)}</CTableDataCell>
                </CTableRow>
                <CTableRow className="row-total">
                  <CTableDataCell><b>Grand Total</b></CTableDataCell>
                  <CTableDataCell className="mono col-school"><b>{fmtMoney(aggregates.grand.school)}</b></CTableDataCell>
                  <CTableDataCell className="mono col-vendor"><b>{fmtMoney(aggregates.grand.vendor)}</b></CTableDataCell>
                  <CTableDataCell className="mono col-heroz"><b>{fmtMoney(aggregates.grand.heroz)}</b></CTableDataCell>
                  <CTableDataCell />
                </CTableRow>
              </CTableBody>
            </CTable>

            {/* ===== Kids Information ===== */}
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
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {item.KidsSumamry.map((k, i) => {
                    const parent = k?.ParentsID ? parentMap[k.ParentsID] : null;
                    const key = norm(k?.KidsID);
                    const pay = paymentMap[key];

                    return (
                      <CTableRow key={`${k.KidsID || i}`}>
                        <CTableDataCell>{i + 1}</CTableDataCell>
                        <CTableDataCell className="mono">
                          {pay?.TripFullAmount !== undefined || pay?.tripFullAmount !== undefined
                            ? fmtMoney(numField(pay, "TripFullAmount", "tripFullAmount"))
                            : "-"}
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
                      </CTableRow>
                    );
                  })}
                  {/* Totals footer under kids table */}
                  <CTableRow>
                    <CTableDataCell />
                    <CTableDataCell className="mono"><b>{fmtMoney(kidsTotals.totalFull)}</b></CTableDataCell>
                    <CTableDataCell colSpan={3}><i>Trip totals by mapped payments:</i></CTableDataCell>
                    <CTableDataCell className="mono">
                      <span className="me-2">School:</span><b>{fmtMoney(kidsTotals.totalSchool)}</b>
                    </CTableDataCell>
                    <CTableDataCell className="mono">
                      <span className="me-2">Vendor:</span><b>{fmtMoney(kidsTotals.totalVendor)}</b>
                    </CTableDataCell>
                    <CTableDataCell className="mono">
                      <span className="me-2">Heroz:</span><b>{fmtMoney(kidsTotals.totalHeroz)}</b>
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            ) : (
              <div className="muted">No kids found for this request.</div>
            )}

            {/* ===== Food Extras ===== */}
            {foodExtras.length > 0 && (
              <>
                <SectionTitle>Food Extras</SectionTitle>
                <CTable small hover responsive className="mb-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>Food Name</CTableHeaderCell>
                      <CTableHeaderCell className="mono">School</CTableHeaderCell>
                      <CTableHeaderCell className="mono">Vendor</CTableHeaderCell>
                      <CTableHeaderCell className="mono">Heroz</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {foodExtras.map((f, i) => (
                      <CTableRow key={`${f?.FoodID || i}`}>
                        <CTableDataCell>{i + 1}</CTableDataCell>
                        <CTableDataCell>{f?.FoodName || "-"}</CTableDataCell>
                        <CTableDataCell className="mono">{fmtMoney(numField(f, "FoodSchoolPrice", "foodSchoolPrice", "SchoolPrice") || looseNumberByKey(f, "food", "school") || looseNumberByKey(f, "school"))}</CTableDataCell>
                        <CTableDataCell className="mono">{fmtMoney(numField(f, "FoodVendorPrice", "foodVendorPrice", "VendorPrice") || looseNumberByKey(f, "food", "vendor") || looseNumberByKey(f, "vendor"))}</CTableDataCell>
                        <CTableDataCell className="mono">{fmtMoney(numField(f, "FoodHerozPrice",  "foodHerozPrice",  "HerozPrice")  || looseNumberByKey(f, "food", "heroz")  || looseNumberByKey(f, "heroz"))}</CTableDataCell>
                      </CTableRow>
                    ))}
                    <CTableRow>
                      <CTableDataCell />
                      <CTableDataCell className="mono"><b>Totals</b></CTableDataCell>
                      <CTableDataCell className="mono"><b>{fmtMoney(aggregates.food.school)}</b></CTableDataCell>
                      <CTableDataCell className="mono"><b>{fmtMoney(aggregates.food.vendor)}</b></CTableDataCell>
                      <CTableDataCell className="mono"><b>{fmtMoney(aggregates.food.heroz)}</b></CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              </>
            )}
          </>
        )}
      </CModalBody>

      <CModalFooter>
        <div className="me-auto small text-muted">
          <div>Trip Full Amount (all payments): <b>{fmtMoney(aggregates.trip.fullAmount)}</b></div>
          <div>Food on Payments: <b>{fmtMoney(aggregates.trip.foodCostOnPayments)}</b> • Tax: <b>{fmtMoney(aggregates.trip.tax)}</b></div>
        </div>
        <CButton color="secondary" className="add-product-button" variant="outline" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ViewPaymentModal;
