import React from "react";
import {
  CModal, CModalHeader, CModalBody, CModalFooter, CModalTitle,
  CBadge, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CButton
} from "@coreui/react";
import "./ViewPaymentModal.css";

// ===== Debug disabled per your request =====
const DEBUG_MODE = false;
// Enable logs either by setting DEBUG_MODE = true OR in the console: window.__DBG_API = true
const IS_DEBUG = DEBUG_MODE || (typeof window !== "undefined" && window.__DBG_API === true);

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

// --- inline icons (no deps) ---
const Icon = ({ name, className = "" }) => {
  if (name === "vendor") {
    return (
      <svg className={`icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm2-4h14v3H5V3zm3 8h4v6H8v-6z" />
      </svg>
    );
  }
  if (name === "school") {
    return (
      <svg className={`icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l9 5-9 5-9-5 9-5zm0 12l6-3.333V17l-6 3-6-3v-5.333L12 15z" />
      </svg>
    );
  }
  if (name === "heroz") {
    return (
      <svg className={`icon ${className}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2l2.39 4.84L20 8.27l-3.9 3.8L17.78 20 12 16.9 6.22 20l1.68-7.93L4 8.27l5.61-1.43L12 2z" />
      </svg>
    );
  }
  return null;
};

const SectionTitle = ({ children, right }) => (
  <div className="section-title">
    <span>{children}</span>
    {right ? <span className="section-title__right">{right}</span> : null}
  </div>
);

const Tile = ({ label, value, mono, className = "" }) => (
  <div className={`tile ${mono ? "mono" : ""} ${className}`}>
    <div className="tile__label">{label}</div>
    <div className="tile__value">{value}</div>
  </div>
);

const Grid = ({ children, className = "" }) => <div className={`grid ${className}`}>{children}</div>;

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

const strField = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v != null && v !== "") return String(v);
  }
  if (obj && typeof obj === "object") {
    const lowerMap = {};
    for (const ok of Object.keys(obj)) lowerMap[ok.toLowerCase()] = obj[ok];
    for (const k of keys) {
      const lk = String(k).toLowerCase();
      if (lk in lowerMap) {
        const v = lowerMap[lk];
        if (v != null && v !== "") return String(v);
      }
    }
  }
  return "";
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
  if (IS_DEBUG) {
    console.log("[ViewPaymentModal] choosePaymentsSource inputs", {
      hasOverride: Array.isArray(paymentsOverride) && paymentsOverride.length,
      hasItemPayments: Array.isArray(item?.payments) && item.payments.length,
      allRequestsLen: Array.isArray(allRequests) ? allRequests.length : 0,
    });
  }

  if (Array.isArray(paymentsOverride) && paymentsOverride.length) {
    if (IS_DEBUG) console.log("[ViewPaymentModal] chosen source:", "paymentsOverride", "count:", paymentsOverride.length);
    return { source: "paymentsOverride", payments: paymentsOverride };
  }
  if (Array.isArray(item?.payments) && item.payments.length) {
    if (IS_DEBUG) console.log("[ViewPaymentModal] chosen source:", "item.payments", "count:", item.payments.length);
    return { source: "item.payments", payments: item.payments };
  }
  if (Array.isArray(allRequests) && allRequests.length) {
    const byId = allRequests.find(r => r?.RequestID && r.RequestID === item?.RequestID);
    const byRef = allRequests.find(r => r?.actRequestRefNo && r.actRequestRefNo === item?.actRequestRefNo);
    const match = byId || byRef;
    if (Array.isArray(match?.payments) && match.payments.length) {
      const src = byId ? "allRequests(RequestID)" : "allRequests(actRequestRefNo)";
      if (IS_DEBUG) console.log("[ViewPaymentModal] chosen source:", src, "count:", match.payments.length);
      return { source: src, payments: match.payments };
    }
  }
  if (IS_DEBUG) console.log("[ViewPaymentModal] chosen source:", "none", "count:", 0);
  return { source: "none", payments: [] };
}

const JsonBlock = ({ title, obj }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
    <pre className="json-block">
      {obj ? JSON.stringify(obj, null, 2) : "—"}
    </pre>
  </div>
);

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
  const chosen = React.useMemo(
    () => choosePaymentsSource(item, paymentsOverride, allRequests),
    [item, paymentsOverride, allRequests]
  );
  const paymentsSourceRaw = chosen.payments;

  // local fallback payments (when item + allRequests don’t provide any)
  const [fallbackPayments, setFallbackPayments] = React.useState([]);
  const [fallbackTried, setFallbackTried] = React.useState(false); // avoid refetch loops

  // ===== Debug panel state =====
  const [showDebug, setShowDebug] = React.useState(IS_DEBUG); // auto-open if global debug
  const [lastApiDebug, setLastApiDebug] = React.useState(null);
  const [matchedDebug, setMatchedDebug] = React.useState(null);

  // try to fetch payments only if needed (visible, selected item, no payments)
  React.useEffect(() => {
    let aborted = false;

    async function fetchIfNeeded() {
      if (!visible) return;
      if (!item || !item.RequestID || !item.actRequestRefNo) return;
      if (Array.isArray(paymentsSourceRaw) && paymentsSourceRaw.length) return; // already have payments
      if (fallbackTried) return; // already tried a fetch once

      const startedAt = Date.now();
      const requestBody = {}; // intentionally empty per current API
      try {
        setFallbackTried(true);

        if (IS_DEBUG) {
          console.log("[ViewPaymentModal] Fallback fetch →", GET_PAY_SUMMARY_URL, {
            refNo: item?.actRequestRefNo,
            reqId: item?.RequestID,
          });
        }

        const res = await fetch(GET_PAY_SUMMARY_URL, {
          method: "POST",
          headers: {
            ...(getAuthHeaders ? getAuthHeaders() : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const txt = await res.text(); // capture raw then parse
        let json;
        try { json = JSON.parse(txt); } catch { json = { _raw: txt }; }

        const finishedAt = Date.now();
        const apiDbg = {
          url: GET_PAY_SUMMARY_URL,
          method: "POST",
          requestBody,
          status: res.status,
          ok: res.ok,
          durationMs: finishedAt - startedAt,
          json,
        };
        if (!aborted) setLastApiDebug(apiDbg);

        const arr = Array.isArray(json?.data) ? json.data : (json?.data ? [json.data] : []);
        if (!arr.length) return;

        const match =
          arr.find(r => r?.RequestID && r.RequestID === item.RequestID) ||
          arr.find(r => r?.actRequestRefNo && r.actRequestRefNo === item.actRequestRefNo);

        if (!aborted) setMatchedDebug(match || null);

        if (!aborted && Array.isArray(match?.payments) && match.payments.length) {
          setFallbackPayments(match.payments);
        }
      } catch (e) {
        const finishedAt = Date.now();
        if (!aborted) {
          setLastApiDebug({
            url: GET_PAY_SUMMARY_URL,
            method: "POST",
            requestBody,
            status: "NETWORK/EXCEPTION",
            ok: false,
            durationMs: finishedAt - startedAt,
            error: String(e?.message || e),
          });
        }
        if (IS_DEBUG) console.error("[ViewPaymentModal] Fallback fetch error", e);
      }
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

  // ------- NEW: count MyFatrooahRefNo to detect multi-kid payments -------
  const refCountMap = React.useMemo(() => {
    const m = {};
    for (const p of effectivePayments) {
      const ref = strField(
        p,
        "MyFatrooahRefNo",
        "MyFatoorahRefNo",
        "myFatoorahRefNo",
        "myfatoorahRefNo",
        "MFRefNo",
        "mfRefNo",
        "mfReference",
        "FatoorahRefNo"
      ).trim();
      if (!ref) continue;
      m[ref] = (m[ref] || 0) + 1;
    }
    return m;
  }, [effectivePayments]);

  // Food extras list
  const foodExtras = React.useMemo(() => {
    return Array.isArray(item?.foodExtras)
      ? item.foodExtras
      : Array.isArray(item?.FoodExtras)
        ? item.FoodExtras
        : [];
  }, [item]);

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

  // Per-kid costs (robust: average across payments)
  const perKid = React.useMemo(() => {
    if (!effectivePayments.length) return { vendor: 0, school: 0, heroz: 0 };
    let vSum = 0, sSum = 0, hSum = 0;
    for (const p of effectivePayments) {
      vSum += numField(p, "TripVendorCost", "tripVendorCost");
      sSum += numField(p, "TripSchoolPrice", "tripSchoolPrice");
      hSum += numField(p, "TripHerozCost", "tripHerozCost");
    }
    const n = effectivePayments.length || 1;
    return {
      vendor: vSum / n,
      school: sSum / n,
      heroz:  hSum / n
    };
  }, [effectivePayments]);

  // Single “Total Profit” (Vendor grand total) as text
  const totalProfitStr = React.useMemo(() => fmtMoney(aggregates.grand.vendor), [aggregates.grand.vendor]);

  // Totals for footer under kids table
  const paymentTotalsForKids = React.useMemo(() => {
    let totalFull = 0, totalSchool = 0, totalVendor = 0, totalHeroz = 0;
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

  // ------- NEW: header totals (with/without ABSENT) -------
  const headerTotals = React.useMemo(() => {
    let withAll = 0;
    let withoutAbsent = 0;
    for (const k of (item?.KidsSumamry || [])) {
      const pay = paymentMap[norm(k?.KidsID)];
      if (!pay) continue;
      const amt = numField(pay, "TripFullAmount", "tripFullAmount");
      withAll += amt;
      const st = String(k?.tripKidsStatus || "").toUpperCase();
      if (st !== "ABSENT" && st !== "ABSET") {
        withoutAbsent += amt;
      }
    }
    return { withAll, withoutAbsent };
  }, [item, paymentMap]);

  // ---------- Excel Export (Kids grid + MyFatrooahRefNo) ----------
  const [exportBusy, setExportBusy] = React.useState(false);

  const handleExportKidsExcel = React.useCallback(async () => {
    const kids = Array.isArray(item?.KidsSumamry) ? item.KidsSumamry : [];
    if (!kids.length) return;

    try {
      setExportBusy(true);
      const XLSX = await import("xlsx");

      const rows = [];
      let idx = 0;
      for (const k of kids) {
        idx += 1;
        const parent = k?.ParentsID ? parentMap[k.ParentsID] : null;
        const pay = paymentMap[norm(k?.KidsID)] || {};

        const myfRef = strField(
          pay,
          "MyFatrooahRefNo",
          "MyFatoorahRefNo",
          "myFatoorahRefNo",
          "myfatoorahRefNo",
          "MFRefNo",
          "mfRefNo",
          "mfReference",
          "FatoorahRefNo"
        );

        rows.push({
          "#": idx,
          TripFullAmount: numField(pay, "TripFullAmount", "tripFullAmount") || "",
          SchoolNo: k?.TripKidsSchoolNo ?? "",
          Name: k?.TripKidsName ?? "",
          Status: k?.tripKidsStatus ?? "",
          Created: fmtDateTime(k?.CreatedDate),
          ParentName: parent?.tripParentsName ?? "",
          Mobile: parent?.tripParentsMobileNo ?? "",
          MyFatrooahRefNo: myfRef || "",
        });
      }

      const wsKids = XLSX.utils.json_to_sheet(rows);

      // Auto-fit columns approximately
      const colWidths = Object.keys(rows[0] || { A: "" }).map((key) => ({ wch: Math.max(10, key.length + 2) }));
      for (const r of rows) {
        let c = 0;
        for (const key of Object.keys(r)) {
          const v = r[key] == null ? "" : String(r[key]);
          colWidths[c].wch = Math.max(colWidths[c].wch, v.length + 2);
          c += 1;
        }
      }
      wsKids["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsKids, "Kids");

      const safeRef = (item?.actRequestRefNo || "request").replace(/[^\w\-]+/g, "_");
      XLSX.writeFile(wb, `kids_grid_${safeRef}.xlsx`);
    } catch (err) {
      if (DEBUG_MODE) console.error("Excel export failed:", err);
    } finally {
      setExportBusy(false);
    }
  }, [item, parentMap, paymentMap]);

  // ===== Render =====
  const vendorTrip  = aggregates.trip.vendor;
  const vendorFood  = aggregates.food.vendor;
  const vendorTotal = vendorTrip + vendorFood;

  const schoolTrip  = aggregates.trip.school;
  const schoolFood  = aggregates.food.school;
  const schoolTotal  = schoolTrip + schoolFood;

  const herozTrip   = aggregates.trip.heroz;
  const herozFood   = aggregates.food.heroz;
  const herozTotal  = herozTrip + herozFood;

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" backdrop="static" className="custom-modal">
      <CModalHeader closeButton>
        <CModalTitle>Payment Request Details</CModalTitle>

        {/* NEW: header totals on the right */}
        <div className="ms-auto d-flex align-items-center gap-2">
          <CBadge color="secondary" className="px-3 py-2">
            With Absent: <span className="mono">{fmtMoney(headerTotals.withAll)}</span>
          </CBadge>
          <CBadge color="success" className="px-3 py-2">
            Without Absent: <span className="mono">{fmtMoney(headerTotals.withoutAbsent)}</span>
          </CBadge>
        </div>
      </CModalHeader>

      <CModalBody style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {!item ? (
          <div className="muted">No record selected.</div>
        ) : (
          <>
            {/* ===== Basic Info ===== */}
            <SectionTitle>Basic Info</SectionTitle>
            <Grid className="grid--equal grid--spacious">
              <div className="tile tile--idgreen tile--idcombo">
                <div className="pair">
                  <span className="pair__label">Request ID</span>
                  <span className="pair__value mono">{item?.RequestID || "-"}</span>
                </div>
                <div className="pair">
                  <span className="pair__label">Reference No.</span>
                  <span className="pair__value mono">{item?.actRequestRefNo || "-"}</span>
                </div>
              </div>

              <Tile label="Activity Name" value={item.actName} />
              <Tile label="Vendor Name" value={item.vdrName || "-"} />

              <div className="tile tile--clusterbox tile--vertical">
                <div className="pill pill--amber">
                  <span className="pill__label">Activity Time</span>
                  <span className="pill__value mono">{item?.actRequestTime || "-"}</span>
                </div>

                <div className="pill pill--amber">
                  <span className="pill__label">Activity Date</span>
                  <span className="pill__value mono">{item?.actRequestDate || "-"}</span>
                </div>

                <div className="pill pill--info">
                  <span className="pill__label">Status</span>
                  <span className="pill__value">
                    <CBadge className={`status-badge ${statusClassName(item?.actRequestStatus)}`}>
                      {item?.actRequestStatus || "-"}
                    </CBadge>
                  </span>
                </div>
              </div>
            </Grid>

            {/* ===== Student Summary ===== */}
            <SectionTitle>Student Summary</SectionTitle>
            <Grid className="grid--tight grid--spacious">
              <Tile className="tile--stat" label="Total Paid" value={fmtNum(item?.studentSummary?.totalStudentPaid)} />
              <Tile className="tile--stat" label="Approved"   value={fmtNum(item?.studentSummary?.totalStudentApproved)} />
              <Tile className="tile--stat" label="Failed"     value={fmtNum(item?.studentSummary?.totalStudentFailed)} />
              <Tile className="tile--stat" label="New"        value={fmtNum(item?.studentSummary?.totalStudentNew)} />
            </Grid>

            {/* ===== Payments Summary → Party (single grid) ===== */}
            <SectionTitle>Payments Summary</SectionTitle>
            <div className="summary-card">
              <div className="card-head">
                <div className="card-title">Party</div>
                <div className="chips">
                  <span className="chip chip--vendor">
                    <Icon name="vendor" className="chip__icon" />
                    Vendor: {fmtMoney(vendorTotal)}
                  </span>
                  <span className="chip chip--school">
                    <Icon name="school" className="chip__icon" />
                    School: {fmtMoney(schoolTotal)}
                  </span>
                  <span className="chip chip--heroz">
                    <Icon name="heroz" className="chip__icon" />
                    Heroz: {fmtMoney(herozTotal)}
                  </span>
                </div>
              </div>

              {/* Single compact table */}
              <CTable small hover responsive className="mb-0 table--dense table--accented">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 220 }}>Party</CTableHeaderCell>
                    <CTableHeaderCell className="mono text-end">Per Kid</CTableHeaderCell>
                    <CTableHeaderCell className="mono text-end">Kids</CTableHeaderCell>
                    <CTableHeaderCell className="mono text-end">Trip Profit</CTableHeaderCell>
                    <CTableHeaderCell className="mono text-end">Food Profit</CTableHeaderCell>
                    <CTableHeaderCell className="mono text-end">Total Profit</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow className="row-accent row-accent--vendor">
                    <CTableDataCell className="with-icon">
                      <Icon name="vendor" /> <b>Vendor</b>
                    </CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(perKid.vendor)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtNum(aggregates.trip.count)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(vendorTrip)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(vendorFood)}</CTableDataCell>
                    <CTableDataCell className="mono text-end"><b>{fmtMoney(vendorTotal)}</b></CTableDataCell>
                  </CTableRow>

                  <CTableRow className="row-accent row-accent--school">
                    <CTableDataCell className="with-icon">
                      <Icon name="school" /> <b>School</b>
                    </CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(perKid.school)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtNum(aggregates.trip.count)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(schoolTrip)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(schoolFood)}</CTableDataCell>
                    <CTableDataCell className="mono text-end"><b>{fmtMoney(schoolTotal)}</b></CTableDataCell>
                  </CTableRow>

                  <CTableRow className="row-accent row-accent--heroz">
                    <CTableDataCell className="with-icon">
                      <Icon name="heroz" /> <b>Heroz</b>
                    </CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(perKid.heroz)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtNum(aggregates.trip.count)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(herozTrip)}</CTableDataCell>
                    <CTableDataCell className="mono text-end">{fmtMoney(herozFood)}</CTableDataCell>
                    <CTableDataCell className="mono text-end"><b>{fmtMoney(herozTotal)}</b></CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>

            {/* ===== Profit Breakdown (All Records) ===== */}
            <SectionTitle>Profit Breakdown (All Records)</SectionTitle>
            <div className="table-card">
              <CTable small hover striped responsive className="mb-0 table--dense profit-breakdown">
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
            </div>

            {/* ===== Kids Information ===== */}
            <SectionTitle
              right={
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted">Pink row = same MyFatrooahRefNo</span>
                  {Array.isArray(item?.KidsSumamry) && item.KidsSumamry.length > 0 ? (
                    <CButton color="success" size="sm" onClick={handleExportKidsExcel} disabled={exportBusy}>
                      {exportBusy ? "Exporting..." : "Export to Grid"}
                    </CButton>
                  ) : null}
                </div>
              }
            >
              Kids Information
            </SectionTitle>

            {Array.isArray(item?.KidsSumamry) && item.KidsSumamry.length > 0 ? (
              <div className="table-card">
                <CTable small hover striped responsive className="mb-0 table--dense">
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

                      // NEW: detect duplicate reference numbers for pink row background
                      const ref = pay
                        ? strField(
                            pay,
                            "MyFatrooahRefNo",
                            "MyFatoorahRefNo",
                            "myFatoorahRefNo",
                            "myfatoorahRefNo",
                            "MFRefNo",
                            "mfRefNo",
                            "mfReference",
                            "FatoorahRefNo"
                          ).trim()
                        : "";
                      const isDupRef = ref && refCountMap[ref] >= 2;

                      return (
                        <CTableRow
                          key={`${k.KidsID || i}`}
                          style={isDupRef ? { backgroundColor: "#ffd6ea" } : undefined}
                        >
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
                    <CTableRow>
                      <CTableDataCell />
                      <CTableDataCell className="mono"><b>{fmtMoney(paymentTotalsForKids.totalFull)}</b></CTableDataCell>
                      <CTableDataCell colSpan={3}><i>Trip totals by mapped payments:</i></CTableDataCell>
                      <CTableDataCell className="mono">
                        <span className="me-2">School:</span><b>{fmtMoney(paymentTotalsForKids.totalSchool)}</b>
                      </CTableDataCell>
                      <CTableDataCell className="mono">
                        <span className="me-2">Vendor:</span><b>{fmtMoney(paymentTotalsForKids.totalVendor)}</b>
                      </CTableDataCell>
                      <CTableDataCell className="mono">
                        <span className="me-2">Heroz:</span><b>{fmtMoney(paymentTotalsForKids.totalHeroz)}</b>
                      </CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              </div>
            ) : (
              <div className="muted">No kids found for this request.</div>
            )}

            {/* ---- Debug ---- */}
            {showDebug && (
              <>
                <SectionTitle>Debug</SectionTitle>
                <JsonBlock
                  title="Aggregates Snapshot"
                  obj={{ aggregates, perKid }}
                />
              </>
            )}
          </>
        )}
      </CModalBody>

      <CModalFooter className="footer-meta">
        <div className="me-auto small text-muted footer-meta__left">
          <div>Trip Full Amount (all payments): <b>{fmtMoney(aggregates.trip.fullAmount)}</b></div>
          <div>Food on Payments: <b>{fmtMoney(aggregates.trip.foodCostOnPayments)}</b> • Tax: <b>{fmtMoney(aggregates.trip.tax)}</b></div>
          <div>Total Profit: <b>{totalProfitStr}</b></div>
        </div>

        <CButton
          color="success"
          className="me-2"
          disabled={!Array.isArray(item?.KidsSumamry) || item.KidsSumamry.length === 0 || exportBusy}
          onClick={handleExportKidsExcel}
        >
          {exportBusy ? "Exporting..." : "Export to Grid"}
        </CButton>

        <CButton
          color={showDebug ? "warning" : "info"}
          variant={showDebug ? "solid" : "outline"}
          className="me-2"
          onClick={() => setShowDebug((v) => !v)}
        >
          {showDebug ? "Hide Debug" : "Debug API"}
        </CButton>

        <CButton color="secondary" className="add-product-button" variant="outline" onClick={onClose}>
          Close
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ViewPaymentModal;
