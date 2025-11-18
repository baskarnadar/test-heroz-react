// src/vendordata/activityinfo/activity/ViewActivityScreen.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CModalTitle,
} from "@coreui/react";
import { AppColors } from "../../_shared/colors";
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsVendorLoginIsValid,
} from "../../utils/operation";
import "../../style/paymentv1.css";
import * as XLSX from "xlsx"; // ✅ Excel export

import { API_BASE_URL } from "../../config";

const ts = (fontSize, extra = {}) => ({ fontSize, ...extra }); // kept
const toStr = (v) => (v ?? "").toString();
const fmtNum = (v) =>
  Number.isFinite(Number(v)) ? Number(v).toString() : toStr(v);

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

// API endpoint
const get_pay_summary = `${API_BASE_URL}/commondata/trip/gettripPaymentSummary`;

const statusColor = (status) => {
  // kept (even if unused)
  switch ((status || "").toUpperCase()) {
    case "TRIP-BOOKED":
      return "#067f3c";
    case "APPROVED":
      return "#2c4696";
    case "FAILED":
      return "#b91c1c";
    case "NEW":
      return "#6b7280";
    default:
      return "#374151";
  }
};

// class selector for badge colors (no inline styles)
const statusClassName = (status = "") => {
  const s = status.toUpperCase();
  if (s === "TRIP-BOOKED") return "status--trip-booked";
  if (s === "APPROVED") return "status--approved";
  if (s === "FAILED") return "status--failed";
  if (s === "NEW") return "status--new";
  return "status--default";
};

const SectionTitle = ({ children }) => (
  <div className="section-title">{children}</div>
);

const Tile = ({ label, value, mono, style }) => (
  <div className={`tile ${mono ? "mono" : ""}`} style={style}>
    <div className="tile__label">{label}</div>
    <div className="tile__value">{value}</div>
  </div>
);

const Grid = ({ children }) => <div className="grid">{children}</div>;

// simple helper to force a specific number of columns in one row
const RowGrid = ({ columns, children }) => (
  <div
    className="grid-row"
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: "10px",
      marginBottom: "4px",
    }}
  >
    {children}
  </div>
);

// ---- Helpers for status ----
const isPresentStatus = (status) => {
  const s = (status || "").toString().toLowerCase();
  return s === "present" || s === "approved" || s === "trip-booked";
};

const isAbsentStatus = (status) => {
  const s = (status || "").toString().toLowerCase();
  return s === "absent";
};

// Server → UI
const normalizeItem = (x) => ({
  RequestID: toStr(x.RequestID),
  ActivityID: toStr(x.ActivityID),
  SchoolID: toStr(x.SchoolID),
  actRequestRefNo: toStr(x.actRequestRefNo),
  actName: toStr(x.actName),
  actRequestStatus: toStr(x.actRequestStatus),
  actRequestDate: toStr(x.actRequestDate),
  actRequestTime: toStr(x.actRequestTime),
  studentSummary: {
    totalStudentPaid: Number(x?.studentSummary?.totalStudentPaid ?? 0),
    totalStudentApproved: Number(
      x?.studentSummary?.totalStudentApproved ?? 0
    ),
    totalStudentFailed: Number(x?.studentSummary?.totalStudentFailed ?? 0),
    totalStudentNew: Number(x?.studentSummary?.totalStudentNew ?? 0),
    totalStudentAbsent: Number(
      x?.studentSummary?.totalStudentAbsent ?? 0
    ),
  },
  tripPayment: {
    totalTripVendorCost: Number(
      x?.tripPayment?.totalTripVendorCost ?? 0
    ),
  },
  foodExtrasSummary: {
    totalFoodVendorPrice: Number(
      x?.foodExtrasSummary?.totalFoodVendorPrice ?? 0
    ),
  },
  totalPaymentSummary: {
    totalVendorTripProfit: Number(
      x?.totalPaymentSummary?.totalVendorTripProfit ?? 0
    ),
  },
  // extra info for filters (kept safe if API doesn’t send them)
  vendorID: toStr(x.VendorID),
  vendorName: toStr(x.VendorName || x.vdrName),
  // RAW arrays kept to build kids grid
  payments: Array.isArray(x.payments) ? x.payments : [],
  kidsSummary: Array.isArray(x.KidsSumamry) ? x.KidsSumamry : [],
  parentsInfo: Array.isArray(x.parentsInfo) ? x.parentsInfo : [],
});

// Helper: compute total/present/absent from kids array
const computeKidsPresence = (kidsList = []) => {
  const totalKids = kidsList.length;
  let presentCount = 0;

  kidsList.forEach((kid) => {
    if (isPresentStatus(kid.tripKidsStatus)) {
      presentCount += 1;
    }
  });

  const absentCount = Math.max(0, totalKids - presentCount);
  return { totalKids, presentCount, absentCount };
};

// 🔽🔼 Sortable header
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
        color: "#111827",
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

const ViewActivityScreen = () => {
  const navigate = useNavigate();
  const dir = useDocDir();
  const vendorID = getCurrentLoggedUserID?.() || "";

  // ✅ run vendor login validation on mount
  useEffect(() => {
    IsVendorLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  // 🔍 filters & paging
  const [searchTerm, setSearchTerm] = React.useState("");
  const [vendorFilter, setVendorFilter] = React.useState(""); // kept but hidden from UI
  const [statusFilter, setStatusFilter] = React.useState("");
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  // sorting (main grid)
  const [sortConfig, setSortConfig] = React.useState({
    key: "",
    direction: "asc",
  });

  // kids rows for current selected record (built from API data)
  const [kids, setKids] = React.useState([]);

  // kids filter + sorting
  const [kidsFilter, setKidsFilter] = React.useState("ALL"); // ALL | PRESENT | ABSENT
  const [kidsSortConfig, setKidsSortConfig] = React.useState({
    key: "",
    direction: "asc",
  });

  React.useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        console.log("API:", get_pay_summary);

        const payload = { VendorID: vendorID };
        console.log("API Payload:", payload);

        const res = await fetch(get_pay_summary, {
          method: "POST",
          headers: {
            ...(getAuthHeaders ? getAuthHeaders() : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => ({}));
        console.log("API Response:", json);

        if (!res.ok) {
          throw new Error(json?.message || `Request failed: ${res.status}`);
        }

        const arr = Array.isArray(json?.data)
          ? json.data
          : json?.data
          ? [json.data]
          : [];

        const normalized = arr.map(normalizeItem);
        if (!normalized.length) throw new Error("No data returned.");

        if (isMounted) {
          setItems(normalized);
          setSelected(normalized[0]);
        }
      } catch (e) {
        if (isMounted) setError(e.message || "Failed to load data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [vendorID]);

  const buildKidsRows = (row) => {
    if (!row) return [];
    const kidsArr = Array.isArray(row.kidsSummary) ? row.kidsSummary : [];
    const paysArr = Array.isArray(row.payments) ? row.payments : [];

    const map = new Map();

    // Start with kids summary
    kidsArr.forEach((k) => {
      const kidsId = k.KidsID;
      if (!kidsId) return;
      map.set(kidsId, {
        KidsID: kidsId,
        TripKidsSchoolNo: k.TripKidsSchoolNo || "",
        TripKidsName: k.TripKidsName || k.tripKidsName || "",
        tripKidsClassName: k.tripKidsClassName || "",
        tripKidsStatus: k.tripKidsStatus || k.TripKidsStatus || "",
        tripPaymentTypeID: "",
        TripVendorCost: 0,
      });
    });

    // Merge in payment info by KidsID
    paysArr.forEach((p) => {
      const kidsId = p.KidsID;
      if (!kidsId) return;
      const existing = map.get(kidsId) || {
        KidsID: kidsId,
        TripKidsSchoolNo: "",
        TripKidsName: "",
        tripKidsClassName: "",
        tripKidsStatus: "",
        tripPaymentTypeID: "",
        TripVendorCost: 0,
      };
      map.set(kidsId, {
        ...existing,
        tripPaymentTypeID:
          p.tripPaymentTypeID || p.PayTypeID || existing.tripPaymentTypeID,
        TripVendorCost: p.TripVendorCost ?? existing.TripVendorCost,
      });
    });

    return Array.from(map.values());
  };

  const openModalFor = (row) => {
    setSelected(row);
    setShowModal(true);
    setKids(buildKidsRows(row)); // build kids grid directly from current record

    // reset kids filters/sorting on each open
    setKidsFilter("ALL");
    setKidsSortConfig({ key: "", direction: "asc" });
  };

  // unique vendors for dropdown (kept, but UI hidden)
  const vendorOptions = React.useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const id = (it.vendorID || "").trim();
      const name = (it.vendorName || it.vendorID || "").trim();
      const key = id || name;
      if (!key) return;
      if (!map.has(key)) map.set(key, name || key);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [items]);

  // unique statuses for dropdown
  const statusOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((it) => (it.actRequestStatus || "").trim())
            .filter(Boolean)
        )
      ),
    [items]
  );

  // apply filters
  const filteredItems = React.useMemo(() => {
    // ✅ FIRST: only keep TRIP-BOOKED statuses
    let data = items.filter(
      (it) => (it.actRequestStatus || "").toUpperCase() === "TRIP-BOOKED"
    );

    const t = searchTerm.trim().toLowerCase();
    if (t) {
      data = data.filter((it) => {
        return (
          (it.actRequestRefNo || "").toLowerCase().includes(t) ||
          (it.actName || "").toLowerCase().includes(t) ||
          (it.actRequestDate || "").toLowerCase().includes(t) ||
          (it.actRequestTime || "").toLowerCase().includes(t)
        );
      });
    }

    if (vendorFilter) {
      data = data.filter((it) => {
        const vid = (it.vendorID || it.vendorName || "").toString();
        return vid === vendorFilter;
      });
    }

    if (statusFilter) {
      data = data.filter((it) => (it.actRequestStatus || "") === statusFilter);
    }

    return data;
  }, [items, searchTerm, vendorFilter, statusFilter]);

  // 🔽🔼 apply sorting on filteredItems
  const sortedItems = React.useMemo(() => {
    if (!sortConfig?.key) return filteredItems;

    const arr = [...filteredItems];

    const getSortValue = (item) => {
      switch (sortConfig.key) {
        case "actRequestRefNo":
          return toStr(item.actRequestRefNo);
        case "actName":
          return toStr(item.actName);
        case "actRequestDate": {
          // sort by date; if invalid, use 0
          const d = new Date(item.actRequestDate);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        case "actRequestTime":
          return toStr(item.actRequestTime);
        case "actRequestStatus":
          return toStr(item.actRequestStatus);
        case "studentApproved":
          return Number(item.studentSummary?.totalStudentApproved ?? 0);
        case "studentAbsent":
          return Number(item.studentSummary?.totalStudentAbsent ?? 0);
        case "vendorCost":
          return Number(item.tripPayment?.totalTripVendorCost ?? 0);
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

  const handleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev?.key === columnKey) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        return { key: columnKey, direction: nextDir };
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  // reset to first page when filters/page size / sort change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, vendorFilter, statusFilter, pageSize, sortConfig]);

  const totalPages = React.useMemo(() => {
    if (!sortedItems.length) return 1;
    return Math.max(1, Math.ceil(sortedItems.length / pageSize));
  }, [sortedItems, pageSize]);

  const pageItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const showingFrom =
    sortedItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, sortedItems.length);

  // total of all Vendor Trip Profit across items (kept same for header widget)
  const totalProfitAll = React.useMemo(() => {
    try {
      return items.reduce(
        (sum, it) =>
          sum +
          (Number(it?.totalPaymentSummary?.totalVendorTripProfit) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [items]);

  // total kids TripVendorCost (for current selected) – PRESENT ONLY
  const kidsVendorTotal = React.useMemo(() => {
    try {
      if (!kids || !kids.length) return 0;
      return kids.reduce((sum, kid) => {
        if (isPresentStatus(kid.tripKidsStatus)) {
          return sum + (Number(kid.TripVendorCost) || 0);
        }
        return sum;
      }, 0);
    } catch {
      return 0;
    }
  }, [kids]);

  // ----- Kids filter + sorting -----
  const filteredKids = React.useMemo(() => {
    if (!kids || !kids.length) return [];

    if (kidsFilter === "PRESENT") {
      return kids.filter((k) => isPresentStatus(k.tripKidsStatus));
    }
    if (kidsFilter === "ABSENT") {
      return kids.filter((k) => isAbsentStatus(k.tripKidsStatus));
    }
    return kids;
  }, [kids, kidsFilter]);

  const sortedKids = React.useMemo(() => {
    if (!kidsSortConfig?.key) return filteredKids;

    const arr = [...filteredKids];

    const getVal = (kid) => {
      switch (kidsSortConfig.key) {
        case "TripKidsSchoolNo":
          return toStr(kid.TripKidsSchoolNo);
        case "TripKidsName":
          return toStr(kid.TripKidsName);
        case "tripKidsClassName":
          return toStr(kid.tripKidsClassName);
        case "tripKidsStatus":
          return toStr(kid.tripKidsStatus);
        case "tripPaymentTypeID":
          return toStr(kid.tripPaymentTypeID);
        case "TripVendorCost":
          return Number(kid.TripVendorCost ?? 0);
        default:
          return 0;
      }
    };

    arr.sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);

      if (aVal < bVal) return kidsSortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return kidsSortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [filteredKids, kidsSortConfig]);

  const handleKidsSort = (columnKey) => {
    setKidsSortConfig((prev) => {
      if (prev?.key === columnKey) {
        const nextDir = prev.direction === "asc" ? "desc" : "asc";
        return { key: columnKey, direction: nextDir };
      }
      return { key: columnKey, direction: "asc" };
    });
  };

  // ✅ Export kids to real Excel (.xlsx)
  const handleExportKids = () => {
    if (!sortedKids || !sortedKids.length) return;

    const dataForExcel = sortedKids.map((kid, index) => ({
      "#": index + 1,
      "School No": kid.TripKidsSchoolNo || "",
      "Kid Name": kid.TripKidsName || "",
      "Class Name": kid.tripKidsClassName || "",
      Status: kid.tripKidsStatus || "",
      "Payment Type": kid.tripPaymentTypeID || "",
      "Trip Vendor Cost": Number(kid.TripVendorCost ?? 0),
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kids");

    const ref = selected?.actRequestRefNo || "trip";
    const fileName = `kids_${ref}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  return (
    <div dir={dir} className="vas-container">
      <CCard
        className="vas-card"
        style={{
          borderColor: AppColors?.onPinkBorderColor || undefined,
          borderRadius: 14,
          boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
        }}
      >
        <CCardBody className="vas-card-body">
          {/* Header */}
          <div className="vas-header">
            <div className="vas-header-left">
              <div
                className="title-main"
                style={{ fontSize: 19, fontWeight: 700, color: "#111827" }} // ⬆ a bit bigger
              >
                Trip-Booked Information
              </div>
            </div>

            {/* Right side (kept empty now) */}
          </div>

          {/* 🔍 Filters and page-size selector – all in one row: Search / Status / Show records */}
          <div
            className="vas-filters"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "12px",
              alignItems: "flex-end",
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(248,250,252,0.9)",
              border: "1px solid rgba(229,231,235,0.9)",
            }}
          >
            {/* Search */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "2 1 0%",
                minWidth: 220,
              }}
            >
              <label style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Search
              </label>
              <input
                type="text"
                className="admin-txt-box"
                style={{
                  width: "100%",
                  fontSize: 13,
                  borderRadius: 999,
                  paddingInline: 12,
                  borderColor: "#d1d5db",
                }}
                placeholder="Ref No / Activity / Date / Time"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Vendor filter kept but hidden from search UI */}
            <div
              style={{
                display: "none",
                flexDirection: "column",
                minWidth: 160,
              }}
            >
              <label style={ts(13, { marginBottom: 4 })}>Vendor</label>
              <select
                className="admin-txt-box"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              >
                <option value="">All Vendors</option>
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 0%",
                minWidth: 160,
              }}
            >
              <label style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Status
              </label>
              <select
                className="admin-txt-box"
                style={{
                  fontSize: 13,
                  borderRadius: 999,
                  paddingInline: 12,
                  borderColor: "#d1d5db",
                }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Page size (Show records) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1 1 0%",
                minWidth: 140,
              }}
            >
              <label style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Show records
              </label>
              <select
                className="admin-txt-box"
                style={{
                  fontSize: 13,
                  borderRadius: 999,
                  paddingInline: 12,
                  borderColor: "#d1d5db",
                }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value) || 10)}
              >
                {[10, 20, 50, 100, 500].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
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

          {/* List of many records */}
          {!loading && !error && !!items.length && (
            <div className="mb-16">
              <CTable
                small
                hover
                responsive
                style={{
                  fontSize: 13, // ⬆ a bit bigger grid font
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <CTableHead
                  style={{
                    background: "rgba(248,250,252,0.96)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  <CTableRow>
                    {/* Headers */}
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Ref No."
                        columnKey="actRequestRefNo"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Act Name"
                        columnKey="actName"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Trip Date"
                        columnKey="actRequestDate"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Time"
                        columnKey="actRequestTime"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Status"
                        columnKey="actRequestStatus"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Total Present"
                        columnKey="studentApproved"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    {/* ✅ NEW column header for totalStudentAbsent */}
                    <CTableHeaderCell>
                      <SortHeader
                        label="Total Absense"
                        columnKey="studentAbsent"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>
                      <SortHeader
                        label="Vendor Cost"
                        columnKey="vendorCost"
                        sortConfig={sortConfig}
                        onSort={handleSort}
                      />
                    </CTableHeaderCell>
                    {/* Food Profit & Total Profit kept but hidden from grid */}
                    <CTableHeaderCell style={{ display: "none" }}>
                      Food Profit
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ display: "none" }}>
                      Total Profit
                    </CTableHeaderCell>
                    <CTableHeaderCell></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageItems.map((row, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <CTableRow
                        key={row.RequestID || rowNumber}
                        onClick={() => openModalFor(row)}
                        className="row-clickable"
                        style={{ cursor: "pointer" }}
                      >
                        {/* Serial No. */}
                        <CTableDataCell>{rowNumber}</CTableDataCell>

                        {/* Ref No. */}
                        <CTableDataCell className="mono">
                          {row.actRequestRefNo || "-"}
                        </CTableDataCell>

                        {/* Act Name */}
                        <CTableDataCell>{row.actName || "-"}</CTableDataCell>

                        {/* Trip Date */}
                        <CTableDataCell className="mono">
                          {row.actRequestDate || "-"}
                        </CTableDataCell>

                        {/* Time */}
                        <CTableDataCell className="mono">
                          {row.actRequestTime || "-"}
                        </CTableDataCell>

                        {/* Status */}
                        <CTableDataCell>
                          <CBadge
                            className={`status-badge ${statusClassName(
                              row.actRequestStatus
                            )}`}
                          >
                            {row.actRequestStatus}
                          </CBadge>
                        </CTableDataCell>

                        {/* Student Summary Approved (Total Student) */}
                        <CTableDataCell className="mono">
                          {fmtNum(row.studentSummary.totalStudentApproved)}
                        </CTableDataCell>

                        {/* ✅ NEW cell: Total Absense Student from API */}
                        <CTableDataCell className="mono">
                          {fmtNum(row.studentSummary.totalStudentAbsent)}
                        </CTableDataCell>

                        {/* Vendor Cost */}
                        <CTableDataCell className="mono">
                          {fmtNum(row.tripPayment.totalTripVendorCost)}
                        </CTableDataCell>

                        {/* Food Vendor Price (Total) - hidden */}
                        <CTableDataCell
                          className="mono"
                          style={{ display: "none" }}
                        >
                          {fmtNum(row.foodExtrasSummary.totalFoodVendorPrice)}
                        </CTableDataCell>

                        {/* Vendor Trip Profit (Total) - hidden */}
                        <CTableDataCell
                          className="mono"
                          style={{ display: "none" }}
                        >
                          {fmtNum(
                            row.totalPaymentSummary.totalVendorTripProfit
                          )}
                        </CTableDataCell>

                        {/* Open */}
                        <CTableDataCell>
                          <CButton
                            size="sm"
                            className="add-product-button"
                            color="secondary"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModalFor(row);
                            }}
                            style={{
                              borderRadius: 999,
                              fontSize: 12,
                              padding: "3px 10px",
                            }}
                          >
                            View
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })}
                </CTableBody>
              </CTable>

              {sortedItems.length === 0 && (
                <div
                  className="center-text muted"
                  style={{ marginTop: 8, fontSize: 13 }}
                >
                  No records match current filters.
                </div>
              )}
            </div>
          )}

          {!loading && !error && !items.length && (
            <div className="center-text muted">No data available.</div>
          )}

          {/* 🔢 Pagination under grid footer */}
          {!loading && !error && sortedItems.length > 0 && (
            <div
              className="vas-pagination"
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <div style={ts(13, { marginBottom: 4, color: "#000000" })}>
                Showing {showingFrom} to {showingTo} of {sortedItems.length}{" "}
                entries
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`page-btn ${
                        page === currentPage ? "active" : ""
                      }`}
                      style={{
                        minWidth: 32,
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: "1px solid #d1d5db",
                        backgroundColor:
                          page === currentPage ? "#4b5563" : "#ffffff",
                        color:
                          page === currentPage ? "#ffffff" : "#111827",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ===== Modal with details ===== */}
      <CModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        alignment="center"
        backdrop="static"
        size="xl"
        className="modern-modal"
      >
        <CModalHeader closeButton className="modern-modal-header">
          <CModalTitle className="modern-modal-title">
            Payment Request Details
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="modern-modal-body">
          {!selected ? (
            <div className="muted">No record selected.</div>
          ) : (
            <>
              {/* Basic Info */}
              <div className="vas-section-block">
                <SectionTitle>Basic Info</SectionTitle>
                <RowGrid columns={5}>
                  <Tile
                    label="Reference No."
                    value={selected.actRequestRefNo}
                    mono
                  />
                  <Tile label="Activity Name" value={selected.actName} />
                  <div className="tile tile--status">
                    <div className="tile__label">Status</div>
                    <div>
                      <CBadge
                        className={`status-badge ${statusClassName(
                          selected.actRequestStatus
                        )}`}
                      >
                        {selected.actRequestStatus}
                      </CBadge>
                    </div>
                  </div>
                  <Tile
                    label="Request Date"
                    value={selected.actRequestDate}
                    mono
                  />
                  <Tile
                    label="Request Time"
                    value={selected.actRequestTime}
                    mono
                  />
                </RowGrid>
              </div>

              {/* Payment Information (Vendor Cost only, PRESENT students only) */}
              <div className="vas-section-block">
                <SectionTitle>Payment Information</SectionTitle>
                {(() => {
                  // Use ONLY PRESENT students for all amounts
                  let presentCount = 0;
                  let presentCost = 0;

                  if (kids && kids.length) {
                    kids.forEach((kid) => {
                      if (isPresentStatus(kid.tripKidsStatus)) {
                        presentCount += 1;
                        presentCost += Number(kid.TripVendorCost) || 0;
                      }
                    });
                  } else {
                    // Fallback if kids data is not available
                    presentCount = Number(
                      selected.studentSummary?.totalStudentApproved || 0
                    );
                    presentCost = Number(
                      selected.tripPayment?.totalTripVendorCost || 0
                    );
                  }

                  const totalVendorCost = presentCost;
                  const totalPresentStudent = presentCount;
                  const costPerStudent =
                    totalPresentStudent > 0
                      ? totalVendorCost / totalPresentStudent
                      : 0;
                  const taxRatePercent = 15;
                  const taxAmount =
                    totalVendorCost * (taxRatePercent / 100);
                  const totalWithTax = totalVendorCost + taxAmount;

                  return (
                    <RowGrid columns={6}>
                      <Tile
                        label="Vendor Cost Per Student (Present)"
                        value={fmtNum(costPerStudent.toFixed(0))}
                        mono
                      />
                      <Tile
                        label="Total Present Student"
                        value={fmtNum(totalPresentStudent)}
                        mono
                      />
                      <Tile
                        label="Total Vendor Cost (Present)"
                        value={fmtNum(totalVendorCost.toFixed(0))}
                        mono
                      />
                      <Tile
                        label="Tax %"
                        value={`${taxRatePercent}%`}
                        mono
                      />
                      <Tile
                        label="Tax Amount"
                        value={fmtNum(taxAmount.toFixed(0))}
                        mono
                      />
                      <Tile
                        label="Total Amount With Tax"
                        value={fmtNum(totalWithTax.toFixed(2))}
                        mono
                      />
                    </RowGrid>
                  );
                })()}
              </div>

              {/* Student Summary + Student Information in ONE section */}
              <div className="vas-section-block">
                <SectionTitle>Student Summary & Information</SectionTitle>
                {(() => {
                  const { totalKids, presentCount, absentCount } =
                    computeKidsPresence(kids);

                  return (
                    <RowGrid columns={7}>
                      {/* From Student Summary */}
                      <Tile
                        label="Total Paid"
                        value={fmtNum(
                          selected.studentSummary.totalStudentPaid
                        )}
                      />
                      <Tile
                        label="Approved"
                        value={fmtNum(
                          selected.studentSummary.totalStudentApproved
                        )}
                      />
                      <Tile
                        label="Failed"
                        value={fmtNum(
                          selected.studentSummary.totalStudentFailed
                        )}
                      />
                      <Tile
                        label="Trying Paying"
                        value={fmtNum(
                          selected.studentSummary.totalStudentNew
                        )}
                      />
                      {/* From Student Information (kids presence) */}
                      <Tile
                        label="Total Student"
                        value={fmtNum(totalKids)}
                      />
                      <Tile
                        label="Total Present Student"
                        value={fmtNum(presentCount)}
                        mono
                        style={{
                          borderColor: "rgba(22,163,74,0.5)",
                          backgroundColor: "rgba(34,197,94,0.15)",
                          color: "#166534",
                        }}
                      />
                      <Tile
                        label="Total Absent Student"
                        value={fmtNum(absentCount)}
                        mono
                        style={{
                          borderColor: "rgba(248,113,113,0.8)",
                          backgroundColor: "rgba(248,113,113,0.15)",
                          color: "#b91c1c",
                        }}
                      />
                    </RowGrid>
                  );
                })()}
              </div>

              {/* Kids Information */}
              <div className="vas-section-block">
                <SectionTitle>Kids Information</SectionTitle>

                {/* Filter + Export toolbar */}
                <div
                  className="kids-toolbar"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={ts(13, { color: "#000000" })}>
                      Filter:
                    </span>
                    <button
                      type="button"
                      onClick={() => setKidsFilter("ALL")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border:
                          kidsFilter === "ALL"
                            ? "1px solid #4b5563"
                            : "1px solid #d1d5db",
                        backgroundColor:
                          kidsFilter === "ALL" ? "#4b5563" : "#ffffff",
                        color:
                          kidsFilter === "ALL" ? "#ffffff" : "#111827",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      All Kids
                    </button>
                    <button
                      type="button"
                      onClick={() => setKidsFilter("PRESENT")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border:
                          kidsFilter === "PRESENT"
                            ? "1px solid #16a34a"
                            : "1px solid #d1d5db",
                        backgroundColor:
                          kidsFilter === "PRESENT" ? "#16a34a" : "#ffffff",
                        color:
                          kidsFilter === "PRESENT" ? "#ffffff" : "#111827",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      PRESENT
                    </button>
                    <button
                      type="button"
                      onClick={() => setKidsFilter("ABSENT")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border:
                          kidsFilter === "ABSENT"
                            ? "1px solid #dc2626"
                            : "1px solid #d1d5db",
                        backgroundColor:
                          kidsFilter === "ABSENT" ? "#dc2626" : "#ffffff",
                        color:
                          kidsFilter === "ABSENT" ? "#ffffff" : "#111827",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      ABSENT
                    </button>
                  </div>

                  <div>
                    <CButton
                      size="sm"
                      color="success"
                      variant="outline"
                      disabled={!sortedKids.length}
                      onClick={handleExportKids}
                      style={{
                        borderRadius: 999,
                        fontSize: 12,
                        padding: "4px 12px",
                      }}
                    >
                      Export Excel
                    </CButton>
                  </div>
                </div>

                {sortedKids && sortedKids.length > 0 ? (
                  <>
                    <CTable
                      small
                      hover
                      responsive
                      className="mt-2 vas-kids-table"
                      style={{ fontSize: 13 }}
                    >
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>#</CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="School No"
                              columnKey="TripKidsSchoolNo"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Kid Name"
                              columnKey="TripKidsName"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Class Name"
                              columnKey="tripKidsClassName"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Status"
                              columnKey="tripKidsStatus"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Payment Type"
                              columnKey="tripPaymentTypeID"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            <SortHeader
                              label="Trip Vendor Cost"
                              columnKey="TripVendorCost"
                              sortConfig={kidsSortConfig}
                              onSort={handleKidsSort}
                            />
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {sortedKids.map((kid, index) => {
                          const statusRaw =
                            (kid.tripKidsStatus || "").toString();
                          const present = isPresentStatus(statusRaw);
                          const absent = isAbsentStatus(statusRaw);

                          const circleClass =
                            "kid-status-circle " +
                            (present
                              ? "kid-status-circle--present"
                              : absent
                              ? "kid-status-circle--absent"
                              : "");

                          return (
                            <CTableRow key={kid.KidsID || index}>
                              <CTableDataCell>
                                {index + 1}
                              </CTableDataCell>
                              <CTableDataCell className="mono">
                                {kid.TripKidsSchoolNo || ""}
                              </CTableDataCell>
                              <CTableDataCell>
                                {kid.TripKidsName || "-"}
                              </CTableDataCell>
                              <CTableDataCell>
                                {kid.tripKidsClassName || "-"}
                              </CTableDataCell>
                              <CTableDataCell>
                                <div className="kid-status-cell">
                                  <span className={circleClass}>
                                    {statusRaw || "-"}
                                  </span>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell className="mono">
                                {kid.tripPaymentTypeID || "-"}
                              </CTableDataCell>
                              <CTableDataCell className="mono">
                                {fmtNum(kid.TripVendorCost ?? 0)}
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })}

                        {/* Total Trip Vendor Cost row - PRESENT ONLY + Total Absent */}
                        {(() => {
                          const { absentCount } =
                            computeKidsPresence(kids);
                          return (
                            <CTableRow className="kids-total-row">
                              <CTableDataCell
                                colSpan={6}
                                style={{
                                  textAlign: "right",
                                  fontWeight: "bold",
                                }}
                              >
                                Total Trip Vendor Cost (Present Only) | Total
                                Absent Student: {fmtNum(absentCount)}
                              </CTableDataCell>
                              <CTableDataCell
                                className="mono"
                                style={{ fontWeight: "bold" }}
                              >
                                {fmtNum(kidsVendorTotal.toFixed(2))}
                              </CTableDataCell>
                            </CTableRow>
                          );
                        })()}
                      </CTableBody>
                    </CTable>
                  </>
                ) : (
                  <div
                    className="muted"
                    style={{ marginTop: 4, fontSize: 13 }}
                  >
                    No kids information found for this trip.
                  </div>
                )}
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter className="modern-modal-footer">
          <CButton
            color="secondary"
            className="add-product-button"
            variant="outline"
            onClick={() => setShowModal(false)}
            style={{
              borderRadius: 999,
              fontSize: 13,
              paddingInline: 16,
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default ViewActivityScreen;
