// src/vendordata/activityinfo/activity/ViewActivityScreen.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CButton,
  CBadge,
  CAlert,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormSelect,
  CFormInput,
  CPagination,
  CPaginationItem,
} from "@coreui/react";
import { AppColors } from "../../_shared/colors";
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsAdminLoginIsValid,
} from "../../utils/operation";
import "../../style/payment.css";

import SchPaymentModal from "../payment/schPayment";
import VdrPaymentModal from "../payment/vdrPayment";
import ViewPaymentModal from "../payment/viewPayment";

import { API_BASE_URL } from "../../config";

// 🔧 column width constants (you can tweak these)
const TRIP_COL_WIDTH = "26ch";
const SCHOOL_COL_WIDTH = "26ch";
const VENDOR_COL_WIDTH = "32ch"; // Vendor wider
const DATE_COL_WIDTH = "22ch";
const ACTIONS_COL_WIDTH = "18ch";

// 🔴 debug style for every column (header + data)
const debugCellStyle = {
  border: "1px solid #f3eded",
  borderCollapse: "collapse",
};

// ✅ API Debug switches
const DEBUG_API = true; // set false when done

const debugFetch = async (label, url, options = {}) => {
  if (DEBUG_API) {
    console.log("====================================");
    console.log(`[${label}] URL:`, url);
    console.log(`[${label}] OPTIONS:`, options);
    if (options?.body) {
      try {
        console.log(`[${label}] PAYLOAD(JSON):`, JSON.parse(options.body));
      } catch {
        console.log(`[${label}] PAYLOAD(RAW):`, options.body);
      }
    }
  }

  const res = await fetch(url, options);
  const text = await res.text();

  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { _raw: text };
  }

  if (DEBUG_API) {
    console.log(`[${label}] STATUS:`, res.status, res.statusText);
    console.log(`[${label}] RESPONSE TEXT:`, text);
    console.log(`[${label}] RESPONSE JSON:`, json);
    console.log("====================================");
  }

  return { res, text, json };
};

// ---------- tiny inline SVG icons ----------
const IconCard = ({ size = 16, title = "Pay" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label={title}
    focusable="false"
  >
    <title>{title}</title>
    <rect
      x="2"
      y="5"
      width="20"
      height="14"
      rx="2"
      ry="2"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="2"
      y1="10"
      x2="22"
      y2="10"
      stroke="currentColor"
      strokeWidth="2"
    />
    <rect x="6" y="14" width="6" height="2" fill="currentColor" />
  </svg>
);

const IconEye = ({ size = 16, title = "View" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label={title}
    focusable="false"
  >
    <title>{title}</title>
    <path
      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

// helpers
const toStr = (v) => (v ?? "").toString();
const fmtNum = (v) =>
  Number.isFinite(Number(v)) ? Number(v).toString() : toStr(v);
const fmtMoney = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "-";
};
const fold = (s) => toStr(s).toLowerCase().trim();

const useDocDir = () => {
  const [dir, setDir] = React.useState(
    document?.documentElement?.dir || "ltr"
  );
  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setDir(document?.documentElement?.dir || "ltr");
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });
    return () => obs.disconnect();
  }, []);
  return dir;
};

// ✅ Ellipsis now fills full cell width; maxWidth is optional cap
const Ellipsis = ({ text, maxWidth, className = "" }) => (
  <div
    className={`text-truncate ${className}`}
    title={text || ""}
    style={{
      width: "100%",
      maxWidth: maxWidth || "100%",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }}
  >
    {text || "-"}
  </div>
);

// ✅ endpoints
const get_trip_data = `${API_BASE_URL}/trip/tripdata`;
const get_pay_summary = `${API_BASE_URL}/commondata/trip/gettripPaymentSummary`;

// helper: build URL from a given status (?status=...)
const buildTripUrl = (status) => {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  return qs.toString() ? `${get_trip_data}?${qs.toString()}` : get_trip_data;
};

// ---------- status helpers ----------
const statusMatchesFilter = (rowStatus, targetStatus) => {
  const rs = (rowStatus || "").toUpperCase().trim();
  const ts = (targetStatus || "").toUpperCase().trim();
  if (!ts) return true;
  if (!rs) return false;

  if (rs === ts) return true;

  // ACTIVITY-REJECTED → REJECTED, ACTIVITY-APPROVED → APPROVED, etc.
  const rsNoActivityPrefix = rs.replace(/^ACTIVITY-/, "");
  if (rsNoActivityPrefix === ts) return true;

  // TRIP-BOOKED → BOOKED (just in case)
  const rsAfterDash = rs.includes("-") ? rs.split("-").slice(-1)[0] : rs;
  if (rsAfterDash === ts) return true;

  // fallback: contains
  if (rs.includes(ts)) return true;

  return false;
};

// ✅ badge classes with your requested colors
const statusClassName = (status = "") => {
  const s = (status || "").toUpperCase().trim();

  if (
    s === "APPROVED" ||
    s === "COMPLETED" ||
    s === "COMPLATED" ||
    s === "ACTIVITY-APPROVED"
  )
    return "status--approved"; // green

  if (s === "TRIP-BOOKED") return "status--trip-booked"; // orange

  if (s === "WAITING-FOR-APPROVAL" || s === "WAITING-FOR-APPROVAL-")
    return "status--waiting"; // dark yellow

  if (s === "REJECTED" || s === "ACTIVITY-REJECTED")
    return "status--rejected"; // red

  if (s === "FAILED") return "status--failed";
  if (s === "NEW") return "status--new";
  if (s === "PRESENT") return "status--present";
  if (s === "ABSENT" || s === "ABSET") return "status--absent";

  return "status--default";
};

const Tile = ({ label, value, mono }) => (
  <div className={`tile ${mono ? "mono" : ""}`}>
    <div className="tile__label">{label}</div>
    <div className="tile__value">{value}</div>
  </div>
);

// date helper
const parseYMD = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// ✅ Open / Close based ONLY on PaymentDueDate (passed => CLOSE red else OPEN green)
const getPaymentOpenClose = (paymentDueDate) => {
  if (!paymentDueDate) {
    return { label: "Open", color: "#16a34a" }; // default OPEN
  }

  const due = new Date(paymentDueDate);
  if (isNaN(due.getTime())) {
    return { label: "Open", color: "#16a34a" };
  }

  // compare by DATE only (ignore time)
  const today = new Date();
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const due0 = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  // 🔴 If due date passed → CLOSE
  if (today0 > due0) {
    return { label: "closed", color: "#dc2626" };
  }

  // 🟢 Still valid → OPEN
  return { label: "open", color: "#16a34a" };
};

// ✅ derive PaymentDueDate from ref (kept for fallback only)
const getPaymentDueDateFromRef = (refNo) => {
  const ref = toStr(refNo).trim();
  if (!ref) return "";

  // pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const m1 = ref.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;

  // pattern 2: YYYYMMDD
  const m2 = ref.match(/(\d{4})(\d{2})(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;

  // pattern 3: DD-MM-YYYY or DD/MM/YYYY
  const m3 = ref.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (m3) return `${m3[3]}-${m3[2]}-${m3[1]}`;

  return "";
};

// Server → UI (normalized for table), PLUS keep the full raw record
const normalizeItem = (x) => {
  const actRequestRefNo = toStr(x.actRequestRefNo);

  // ✅ PaymentDueDate from JSON first; fallback derive from ref
  const paymentDueDate =
    toStr(x.PaymentDueDate) ||
    toStr(x.paymentDueDate) ||
    getPaymentDueDateFromRef(actRequestRefNo);

  return {
    RequestID: toStr(x.RequestID),
    ActivityID: toStr(x.ActivityID),
    SchoolID: toStr(x.SchoolID),
    VendorID: toStr(x.VendorID),
    actRequestRefNo,
    actName: toStr(x.actName),
    vdrName: toStr(x.vdrName),
    schName: toStr(x.schName),
    actRequestStatus: toStr(x.actRequestStatus),
    actRequestDate: toStr(x.actRequestDate),
    actRequestTime: toStr(x.actRequestTime),

    // ✅ NEW: PaymentDueDate from API JSON (preferred)
    PaymentDueDate: paymentDueDate,

    studentSummary: {
      totalStudentPaid: Number(x?.studentSummary?.totalStudentPaid ?? 0),
      totalStudentApproved: Number(x?.studentSummary?.totalStudentApproved ?? 0),
      totalStudentFailed: Number(x?.studentSummary?.totalStudentFailed ?? 0),
      totalStudentNew: Number(x?.studentSummary?.totalStudentNew ?? 0),
      totalStudentAbsent: Number(x?.studentSummary?.totalStudentAbsent ?? 0),
    },
    tripPayment: {
      totalTripVendorCost: Number(x?.tripPayment?.totalTripVendorCost ?? 0),
    },
    foodExtrasSummary: {
      totalFoodVendorPrice: Number(x?.foodExtrasSummary?.totalFoodVendorPrice ?? 0),
    },
    totalPaymentSummary: {
      totalVendorTripProfit: Number(x?.totalPaymentSummary?.totalVendorTripProfit ?? 0),
    },

    __full: x,
  };
};

// sort header with ▲▼
const SortHeader = ({ label, columnKey, sortConfig, onSort }) => {
  const active = sortConfig?.key === columnKey ? sortConfig.direction : null;
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        cursor: "pointer",
        font: "inherit",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          display: "inline-flex",
          flexDirection: "column",
          lineHeight: 0.7,
          fontSize: "0.65em",
        }}
      >
        <span style={{ opacity: active === "asc" ? 1 : 0.3 }}>▲</span>
        <span style={{ opacity: active === "desc" ? 1 : 0.3 }}>▼</span>
      </span>
    </button>
  );
};

// Profit column flag
const SHOW_PROFIT_COLUMN = false;

const ViewActivityScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dir = useDocDir();
  const vendorID = getCurrentLoggedUserID?.() || "";

  React.useEffect(() => {
    IsAdminLoginIsValid?.();
  }, []);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  // payment modals
  const [showSchPay, setShowSchPay] = React.useState(false);
  const [showVdrPay, setShowVdrPay] = React.useState(false);

  // filters
  const [filterVendor, setFilterVendor] = React.useState("");
  const [filterFromDate, setFilterFromDate] = React.useState("");
  const [filterToDate, setFilterToDate] = React.useState("");
  const [filterQuery, setFilterQuery] = React.useState("");

  // pagination
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  // sorting
  const [sortConfig, setSortConfig] = React.useState({
    key: "",
    direction: "asc",
  });

  // status from URL
  const statusFromUrl = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    const raw = params.get("status") || "COMPLETED";
    return raw.trim();
  }, [location.search]);

  const statusUpperFromUrl = statusFromUrl.toUpperCase();

  React.useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const url = buildTripUrl(statusFromUrl);

        let json;

        // ---- NEW endpoint ----
        const newResp = await debugFetch("NEW tripdata", url, {
          method: "GET",
          headers: {
            ...(getAuthHeaders ? getAuthHeaders() : {}),
          },
        });

        if (newResp.res.status === 404) {
          // ---- LEGACY endpoint ----
          const legacyBody = statusFromUrl ? { status: statusFromUrl } : {};

          const legacyResp = await debugFetch(
            "LEGACY gettripPaymentSummary",
            get_pay_summary,
            {
              method: "POST",
              headers: {
                ...(getAuthHeaders ? getAuthHeaders() : {}),
                "Content-Type": "application/json",
              },
              body: JSON.stringify(legacyBody),
            }
          );

          if (!legacyResp.res.ok) {
            throw new Error(
              legacyResp.json?.message ||
                `Legacy request failed: ${legacyResp.res.status}`
            );
          }

          json = legacyResp.json;
        } else {
          if (!newResp.res.ok) {
            throw new Error(
              newResp.json?.message || `Request failed: ${newResp.res.status}`
            );
          }
          json = newResp.json;
        }

        const rawArr = Array.isArray(json?.data)
          ? json.data
          : json?.data
          ? [json.data]
          : [];

        // normalize
        let normalized = rawArr.map(normalizeItem);

        // 🔎 Debug the keys and PaymentDueDate
        if (DEBUG_API && normalized?.length) {
          console.log("FIRST NORMALIZED ROW:", normalized[0]);
          console.log("FIRST FULL RAW ROW:", normalized[0]?.__full);
          console.log("RAW KEYS:", Object.keys(normalized[0]?.__full || {}));
          console.log(
            "PaymentDueDate:",
            normalized[0]?.PaymentDueDate
          );
          console.log(
            "OpenClose:",
            getPaymentOpenClose(normalized[0]?.PaymentDueDate)
          );
        }

        // status filter by URL
        if (statusUpperFromUrl) {
          normalized = normalized.filter((it) =>
            statusMatchesFilter(it.actRequestStatus, statusUpperFromUrl)
          );
        }

        if (isMounted) {
          setItems(normalized);
          setSelected(normalized[0] || null);
        }
      } catch (e) {
        if (isMounted) {
          setError(e.message || "Failed to load data.");
          setItems([]);
          setSelected(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [vendorID, statusFromUrl, statusUpperFromUrl]);

  const openModalFor = (row) => {
    setSelected(row);
    setShowModal(true);
  };

  // dropdown options – vendor is dynamic
  const vendorOptions = React.useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      const v = (it?.vdrName || "").trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // filter (vendor, date, query)
  const filteredItems = React.useMemo(() => {
    const from = parseYMD(filterFromDate);
    const to = parseYMD(filterToDate);
    const q = fold(filterQuery);

    return items.filter((it) => {
      if (filterVendor && (it.vdrName || "") !== filterVendor) return false;

      if (filterFromDate || filterToDate) {
        const d = parseYMD(it.actRequestDate);
        if (!d) return false;
        if (from && d < from) return false;
        if (to) {
          const toEnd = new Date(to);
          toEnd.setHours(23, 59, 59, 999);
          if (d > toEnd) return false;
        }
      }

      if (q) {
        const hay = `${it.actName} ${it.schName} ${it.vdrName} ${it.actRequestRefNo}`;
        if (!fold(hay).includes(q)) return false;
      }

      return true;
    });
  }, [items, filterVendor, filterFromDate, filterToDate, filterQuery]);

  // sorted items (after filter)
  const sortedItems = React.useMemo(() => {
    if (!sortConfig?.key) return filteredItems;

    const arr = [...filteredItems];

    const getSortValue = (item) => {
      switch (sortConfig.key) {
        case "actRequestRefNo":
          return toStr(item.actRequestRefNo);
        case "actName":
          return toStr(item.actName);
        case "schName":
          return toStr(item.schName);
        case "vdrName":
          return toStr(item.vdrName);
        case "actRequestDate": {
          const d = parseYMD(item.actRequestDate);
          return d ? d.getTime() : 0;
        }
        case "actRequestTime":
          return toStr(item.actRequestTime);
        case "actRequestStatus":
          return toStr(item.actRequestStatus);
        case "studentApproved":
          return Number(item.studentSummary?.totalStudentApproved ?? 0);
        case "studentAbsent":
          return Number(item.studentSummary?.totalStudentAbsent ?? 0);
        case "profit":
          return Number(item.totalPaymentSummary?.totalVendorTripProfit ?? 0);
        default:
          return 0;
      }
    };

    arr.sort((a, b) => {
      const aVal = getSortValue(a);
      const bVal = getSortValue(b);

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filteredItems, sortConfig]);

  const totalProfitAll = React.useMemo(() => {
    try {
      return filteredItems.reduce(
        (sum, it) =>
          sum + (Number(it?.totalPaymentSummary?.totalVendorTripProfit) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [filteredItems]);

  const resetFilters = () => {
    setFilterVendor("");
    setFilterFromDate("");
    setFilterToDate("");
    setFilterQuery("");
  };

  const handleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev?.key === columnKey) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        return { key: columnKey, direction: nextDir };
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  // pagination derived
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    filterVendor,
    filterFromDate,
    filterToDate,
    filterQuery,
    pageSize,
    statusFromUrl,
  ]);

  const totalItems = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = React.useMemo(
    () => sortedItems.slice(startIndex, endIndex),
    [sortedItems, startIndex, endIndex]
  );

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  const pageSizeOptions = [10, 25, 50, 100];

  // Build a raw list (complete JSON per record) for the modal
  const rawAllRequests = React.useMemo(
    () => items.map((it) => it?.__full || it),
    [items]
  );

  return (
    <div dir={dir} className="vas-container">
      <CCard
        className="vas-card"
        style={{
          borderColor: AppColors?.onPinkBorderColor || undefined,
        }}
      >
        {/* small right padding so grid uses more space */}
        <CCardBody className="vas-card-body" style={{ paddingRight: 8 }}>
          {/* Header */}
          <div className="vas-header">
            <div className="vas-header-left">
              <div className="title-main">Trip Status Information</div>
            </div>

            <div className="vas-header-right">
              <div className="vas-total-tile tile--xl">
                <Tile label="Total Profit" value={fmtMoney(totalProfitAll)} mono />
              </div>
            </div>
          </div>

          {/* Filters row */}
          <div
            className="d-flex align-items-end gap-2 flex-nowrap overflow-auto mb-3"
            style={{ paddingBottom: 4 }}
          >
            <div style={{ minWidth: 100 }}>
              <CFormInput
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search activity, school, vendor, or Ref#"
              />
            </div>

            <div style={{ minWidth: 180 }}>
              <CFormSelect
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
              >
                <option value="">All Vendors</option>
                {vendorOptions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </CFormSelect>
            </div>

            <div style={{ minWidth: 150 }}>
              <CFormInput
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                placeholder="From date"
              />
            </div>

            <div style={{ minWidth: 150 }}>
              <CFormInput
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                placeholder="To date"
              />
            </div>

            <CButton color="secondary" variant="outline" onClick={resetFilters}>
              Reset
            </CButton>

            <div className="ms-auto d-flex align-items-center gap-2">
              <CFormSelect
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) || 10)}
                style={{ width: 110 }}
                title="Records per page"
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </CFormSelect>
              <small className="text-muted text-nowrap">
                Showing {totalItems === 0 ? 0 : startIndex + 1}–
                {Math.min(endIndex, totalItems)} of {totalItems}
              </small>
            </div>
          </div>

          {loading && (
            <div className="center-text">
              <CSpinner size="sm" />{" "}
              <span style={{ marginLeft: 6 }}>Loading…</span>
            </div>
          )}

          {!!error && (
            <CAlert color="danger" className="mb-16">
              {error}
            </CAlert>
          )}

          {/* Table + scroll wrapper */}
          {!loading && !error && !!pageItems.length && (
            <div
              className="mb-3 vas-table-scroll"
              style={{
                maxWidth: "100%",
                overflowX: "auto",
              }}
            >
              <div className="vas-table-scroll-inner" style={{ minWidth: "100%" }}>
                <CTable
                  responsive
                  small
                  hover
                  className="vas-table"
                  style={{
                    tableLayout: "auto",
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell
                        style={{ ...debugCellStyle, width: "5ch" }}
                        className="text-center"
                      >
                        #
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ ...debugCellStyle, width: "8ch" }}>
                        <SortHeader
                          label="Ref#"
                          columnKey="actRequestRefNo"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        className="text-nowrap"
                        style={{ ...debugCellStyle, width: TRIP_COL_WIDTH }}
                      >
                        <SortHeader
                          label="Trip Name"
                          columnKey="actName"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        className="text-nowrap"
                        style={{ ...debugCellStyle, width: SCHOOL_COL_WIDTH }}
                      >
                        <SortHeader
                          label="School"
                          columnKey="schName"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        className="text-nowrap"
                        style={{ ...debugCellStyle, width: VENDOR_COL_WIDTH }}
                      >
                        <SortHeader
                          label="Vendor"
                          columnKey="vdrName"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        className="text-nowrap"
                        style={{ ...debugCellStyle, width: DATE_COL_WIDTH }}
                      >
                        <SortHeader
                          label="Trip Date"
                          columnKey="actRequestDate"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </CTableHeaderCell>

                      <CTableHeaderCell style={{ ...debugCellStyle, width: "15ch" }}>
                        <SortHeader
                          label="Status"
                          columnKey="actRequestStatus"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </CTableHeaderCell>

                      <CTableHeaderCell
                        style={{ ...debugCellStyle, width: "9ch" }}
                        className="text-center"
                      >
                        <SortHeader
                          label="Student"
                          columnKey="studentApproved"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        style={{ ...debugCellStyle, width: "9ch" }}
                        className="text-center"
                      >
                        <SortHeader
                          label="Absense"
                          columnKey="studentAbsent"
                          sortConfig={sortConfig}
                          onSort={handleSort}
                        />
                      </CTableHeaderCell>

                      {SHOW_PROFIT_COLUMN && (
                        <CTableHeaderCell style={{ ...debugCellStyle, width: "10ch" }}>
                          <SortHeader
                            label="Profit"
                            columnKey="profit"
                            sortConfig={sortConfig}
                            onSort={handleSort}
                          />
                        </CTableHeaderCell>
                      )}

                      <CTableHeaderCell
                        className="text-nowrap"
                        style={{ ...debugCellStyle, width: ACTIONS_COL_WIDTH }}
                      >
                        Actions
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {pageItems.map((row, idx) => {
                      // ✅ Use PaymentDueDate for Open/Close
                      const oc = getPaymentOpenClose(row.PaymentDueDate);

                      return (
                        <CTableRow
                          key={row.RequestID || startIndex + idx}
                          onClick={() => openModalFor(row)}
                          className="row-clickable"
                        >
                          <CTableDataCell className="text-center" style={debugCellStyle}>
                            {startIndex + idx + 1}
                          </CTableDataCell>

                          <CTableDataCell className="mono" style={debugCellStyle}>
                            {row.actRequestRefNo || "-"}
                          </CTableDataCell>

                          <CTableDataCell style={debugCellStyle}>
                            <Ellipsis text={row.actName} maxWidth={TRIP_COL_WIDTH} />
                          </CTableDataCell>

                          <CTableDataCell style={debugCellStyle}>
                            <Ellipsis text={row.schName} maxWidth={SCHOOL_COL_WIDTH} />
                          </CTableDataCell>

                          <CTableDataCell style={debugCellStyle}>
                            <Ellipsis text={row.vdrName} maxWidth={VENDOR_COL_WIDTH} />
                          </CTableDataCell>

                          <CTableDataCell className="mono text-nowrap" style={debugCellStyle}>
                            <div>{row.actRequestDate || "-"}</div>
                            <div style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
                              {(row.actRequestTime || "-").toString().trim()}
                            </div>
                          </CTableDataCell>

                          <CTableDataCell style={debugCellStyle}>
                            <CBadge
                              className={`status-badge ${statusClassName(
                                row.actRequestStatus
                              )}`}
                            >
                              {row.actRequestStatus}
                            </CBadge>

                            <span
                              style={{
                                color: oc.color,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                marginLeft: 8,
                              }}
                            >
                              {row.PaymentDueDate ? `${row.PaymentDueDate} ` : ""}
                              {oc.label}
                            </span>
                          </CTableDataCell>

                          <CTableDataCell className="mono text-center" style={debugCellStyle}>
                            {fmtNum(row.studentSummary.totalStudentApproved)}
                          </CTableDataCell>

                          <CTableDataCell className="mono text-center" style={debugCellStyle}>
                            {fmtNum(row.studentSummary.totalStudentAbsent)}
                          </CTableDataCell>

                          {SHOW_PROFIT_COLUMN && (
                            <CTableDataCell className="mono" style={debugCellStyle}>
                              {fmtMoney(row.totalPaymentSummary.totalVendorTripProfit)}
                            </CTableDataCell>
                          )}

                          <CTableDataCell className="text-nowrap" style={debugCellStyle}>
                            <div
                              className="d-flex gap-1 flex-wrap"
                              style={{
                                maxWidth: "180px",
                                minWidth: "120px",
                                overflow: "visible",
                              }}
                            >
                              <CButton
                                size="sm"
                                color="secondary"
                                variant="outline"
                                title="View"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModalFor(row);
                                }}
                              >
                                <IconEye title="View" />
                              </CButton>

                              <CButton
                                size="sm"
                                color="success"
                                variant="outline"
                                title="Pay School"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected(row);
                                  setShowSchPay(true);
                                }}
                              >
                                <IconCard title="Pay School" />
                              </CButton>

                              <CButton
                                size="sm"
                                color="primary"
                                variant="outline"
                                title="Pay Vendor"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected(row);
                                  setShowVdrPay(true);
                                }}
                              >
                                <IconCard title="Pay Vendor" />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      );
                    })}
                  </CTableBody>
                </CTable>
              </div>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">
                  Page {safePage} of {totalPages}
                </small>
                <CPagination align="end" className="mb-0">
                  <CPaginationItem disabled={safePage === 1} onClick={() => goToPage(1)}>
                    «
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={safePage === 1}
                    onClick={() => goToPage(safePage - 1)}
                  >
                    ‹
                  </CPaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const half = 2;
                    let start = Math.max(1, safePage - half);
                    let end = Math.min(totalPages, start + 4);
                    start = Math.max(1, end - 4);
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <CPaginationItem
                        key={page}
                        active={page === safePage}
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </CPaginationItem>
                    );
                  })}

                  <CPaginationItem
                    disabled={safePage === totalPages}
                    onClick={() => goToPage(safePage + 1)}
                  >
                    ›
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={safePage === totalPages}
                    onClick={() => goToPage(totalPages)}
                  >
                    »
                  </CPaginationItem>
                </CPagination>
              </div>
            </div>
          )}

          {!loading && !error && !filteredItems.length && (
            <div className="center-text muted">No data found for the selected filters.</div>
          )}
        </CCardBody>
      </CCard>

      {/* View Details (separate component) */}
     <ViewPaymentModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  item={selected?.__full || selected}
  allRequests={rawAllRequests}
  paymentDueDate={selected?.PaymentDueDate}
/>


      {/* Payment Modals */}
      {selected && (
        <>
          <SchPaymentModal
            visible={showSchPay}
            onClose={() => setShowSchPay(false)}
            item={selected}
            totalProfit={Number(selected?.totalPaymentSummary?.totalVendorTripProfit) || 0}
          />
          <VdrPaymentModal
            visible={showVdrPay}
            onClose={() => setShowVdrPay(false)}
            item={selected}
            totalProfit={Number(selected?.totalPaymentSummary?.totalVendorTripProfit) || 0}
          />
        </>
      )}
    </div>
  );
};

export default ViewActivityScreen;
