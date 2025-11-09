// src/vendordata/activityinfo/activity/ViewActivityScreen.js
import React, { useEffect } from 'react';
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
import { getAuthHeaders, getCurrentLoggedUserID, IsVendorLoginIsValid } from "../../utils/operation";
import "../../style/payment.css";

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

// NEW: class selector for badge colors (no inline styles)
const statusClassName = (status = "") => {
  const s = status.toUpperCase();
  if (s === "TRIP-BOOKED") return "status--trip-booked";
  if (s === "APPROVED") return "status--approved";
  if (s === "FAILED") return "status--failed";
  if (s === "NEW") return "status--new";
  return "status--default";
};

const SectionTitle = ({ children }) => (
  <div
    className="section-title"
    style={{
      fontSize: 13,
      fontWeight: 600,
      color: "#111827",
      marginBottom: 8,
    }}
  >
    {children}
  </div>
);

const Tile = ({ label, value, mono, style }) => (
  <div
    className={`tile ${mono ? "mono" : ""}`}
    style={{
      padding: "8px 10px",
      borderRadius: 10,
      background: "rgba(249,250,251,0.95)",
      border: "1px solid rgba(229,231,235,0.9)",
      minHeight: 52,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      ...style,
    }}
  >
    <div
      className="tile__label"
      style={{ fontSize: 11, color: "#000000", marginBottom: 2 }}
    >
      {label}
    </div>
    <div
      className="tile__value"
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#111827",
        overflowWrap: "anywhere",
      }}
    >
      {value}
    </div>
  </div>
);

const Grid = ({ children }) => <div className="grid">{children}</div>;

// NEW: simple helper to force a specific number of columns in one row
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
    totalStudentApproved: Number(x?.studentSummary?.totalStudentApproved ?? 0),
    totalStudentFailed: Number(x?.studentSummary?.totalStudentFailed ?? 0),
    totalStudentNew: Number(x?.studentSummary?.totalStudentNew ?? 0),
  },
  tripPayment: {
    totalTripVendorCost: Number(x?.tripPayment?.totalTripVendorCost ?? 0),
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
    const st = (kid.tripKidsStatus || "")
      .toString()
      .toLowerCase();
    if (
      st === "present" ||
      st === "approved" ||
      st === "trip-booked"
    ) {
      presentCount += 1;
    }
  });

  const absentCount = Math.max(0, totalKids - presentCount);
  return { totalKids, presentCount, absentCount };
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

  // kids rows for current selected record (built from API data)
  const [kids, setKids] = React.useState([]);

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
    let data = items;

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

  // reset to first page when filters/page size change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, vendorFilter, statusFilter, pageSize]);

  const totalPages = React.useMemo(() => {
    if (!filteredItems.length) return 1;
    return Math.max(1, Math.ceil(filteredItems.length / pageSize));
  }, [filteredItems, pageSize]);

  const pageItems = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const showingFrom =
    filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, filteredItems.length);

  // total of all Vendor Trip Profit across items
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

  // total kids TripVendorCost (for current selected) – used in modal
  const kidsVendorTotal = React.useMemo(() => {
    try {
      if (!kids || !kids.length) return 0;
      return kids.reduce(
        (sum, kid) => sum + (Number(kid.TripVendorCost) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [kids]);

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
                style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}
              >
                Payment Information
              </div>
            </div>

            {/* Right-side total profit box with rounded corners */}
            <div className="vas-header-right">
              <div className="vas-total-tile tile--xl">
                <Tile
                  label="Total Profit"
                  value={fmtNum(totalProfitAll)}
                  mono
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(16,185,129,0.08))",
                    border: "1px solid rgba(59,130,246,0.18)",
                  }}
                />
              </div>
              <CButton
                color="secondary"
                className="add-product-button"
                variant="outline"
                onClick={() => navigate(-1)}
                style={{
                  marginLeft: 8,
                  borderRadius: 999,
                  borderColor: "#d1d5db",
                  fontSize: 12,
                }}
              >
                ← Back
              </CButton>
            </div>
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
              <label style={ts(12, { marginBottom: 4, color: "#000000" })}>
                Search
              </label>
              <input
                type="text"
                className="admin-txt-box"
                style={{
                  width: "100%",
                  fontSize: 12,
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
              <label style={ts(12, { marginBottom: 4 })}>Vendor</label>
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
              <label style={ts(12, { marginBottom: 4, color: "#000000" })}>
                Status
              </label>
              <select
                className="admin-txt-box"
                style={{
                  fontSize: 12,
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
              <label style={ts(12, { marginBottom: 4, color: "#000000" })}>
                Show records
              </label>
              <select
                className="admin-txt-box"
                style={{
                  fontSize: 12,
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
                  fontSize: 12,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <CTableHead
                  style={{
                    background: "rgba(248,250,252,0.96)",
                  }}
                >
                  <CTableRow>
                    {/* Headers (with "Total Student Approved") */}
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Ref No.</CTableHeaderCell>
                    <CTableHeaderCell>Act Name</CTableHeaderCell>
                    <CTableHeaderCell>Trip Date</CTableHeaderCell>
                    <CTableHeaderCell>Time</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Total Student</CTableHeaderCell>
                    <CTableHeaderCell>Trip Profit</CTableHeaderCell>
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

                        {/* Student Summary Approved */}
                        <CTableDataCell className="mono">
                          {fmtNum(row.studentSummary.totalStudentApproved)}
                        </CTableDataCell>

                        {/* Trip Vendor Cost (Trip Profit) */}
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
                              fontSize: 11,
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

              {filteredItems.length === 0 && (
                <div
                  className="center-text muted"
                  style={{ marginTop: 8, fontSize: 12 }}
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
          {!loading && !error && filteredItems.length > 0 && (
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
              <div style={ts(12, { marginBottom: 4, color: "#000000" })}>
                Showing {showingFrom} to {showingTo} of{" "}
                {filteredItems.length} entries
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
                        fontSize: 11,
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
        size="lg"
        className="modern-modal"
      >
        <CModalHeader
          closeButton
          style={{
            background: "rgba(241,245,249,0.9)",
            borderBottom: "1px solid rgba(203,213,225,0.9)",
          }}
        >
          <CModalTitle
            style={{
              fontWeight: 700,
              color: "#111827",
              fontSize: 16,
            }}
          >
            Payment Request Details
          </CModalTitle>
        </CModalHeader>
        <CModalBody
          style={{
            background: "rgba(255,255,255,0.98)",
            color: "#111827",
            fontSize: 13,
            lineHeight: 1.6,
            padding: "14px 16px",
          }}
        >
          {!selected ? (
            <div className="muted">No record selected.</div>
          ) : (
            <>
              {/* Basic Info: one row */}
              <div
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <SectionTitle>Basic Info</SectionTitle>
                <RowGrid columns={5}>
                  <Tile
                    label="Reference No."
                    value={selected.actRequestRefNo}
                    mono
                  />
                  <Tile label="Activity Name" value={selected.actName} />
                  <div
                    className="tile"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "rgba(239,246,255,0.9)",
                      border: "1px solid rgba(191,219,254,0.9)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      className="tile__label"
                      style={{
                        fontSize: 11,
                        color: "#000000",
                        marginBottom: 2,
                      }}
                    >
                      Status
                    </div>
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

              {/* Payment Information (after Basic Info) – ALL IN ONE ROW */}
              <div
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <SectionTitle>Payment Information</SectionTitle>
                {(() => {
                  const totalTripProfit = Number(
                    selected.totalPaymentSummary?.totalVendorTripProfit || 0
                  );
                  const totalPresentStudent = Number(
                    selected.studentSummary?.totalStudentApproved || 0
                  );
                  const tripCostPerStudent =
                    totalPresentStudent > 0
                      ? totalTripProfit / totalPresentStudent
                      : 0;
                  const totalTripCost = totalTripProfit;
                  const taxRatePercent = 15;
                  const taxAmount =
                    totalTripCost * (taxRatePercent / 100);

                  return (
                    <RowGrid columns={5}>
                      <Tile
                        label="Trip Cost Per Student"
                        value={fmtNum(tripCostPerStudent.toFixed(0))}
                        mono
                      />
                      <Tile
                        label="Total Present Student"
                        value={fmtNum(totalPresentStudent)}
                        mono
                      />
                      <Tile
                        label="Total Trip Cost"
                        value={fmtNum(totalTripCost.toFixed(0))}
                        mono
                      />
                      <Tile
                        label="Tax Value"
                        value={`${taxRatePercent}%`}
                        mono
                      />
                      <Tile
                        label="Tax Amount"
                        value={fmtNum(taxAmount.toFixed(0))}
                        mono
                      />
                    </RowGrid>
                  );
                })()}
              </div>

              {/* Student Summary: one row */}
              <div
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <SectionTitle>Student Summary</SectionTitle>
                <RowGrid columns={4}>
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
                </RowGrid>
              </div>

              {/* Extra Student Information section – now based on kids */}
              <div
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <SectionTitle>Student Information</SectionTitle>
                {(() => {
                  const { totalKids, presentCount, absentCount } =
                    computeKidsPresence(kids);

                  return (
                    <RowGrid columns={3}>
                      <Tile
                        label="Total Student"
                        value={fmtNum(totalKids)}
                      />
                      <Tile
                        label="Total Present Student"
                        value={fmtNum(presentCount)}
                        mono
                        style={{
                          background: "rgba(220,252,231,0.9)",
                          border:
                            "1px solid rgba(22,163,74,0.55)",
                          color: "#065f46",
                        }}
                      />
                      <Tile
                        label="Total Absent Student"
                        value={fmtNum(absentCount)}
                        mono
                        style={{
                          background: "rgba(254,226,226,0.9)",
                          border:
                            "1px solid rgba(248,113,113,0.7)",
                          color: "#991b1b",
                        }}
                      />
                    </RowGrid>
                  );
                })()}
              </div>

              {/* Payment Summary: Total Trip Profit + Tax 15% + Tax Amount + Total With Tax */}
              <div
                style={{
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <SectionTitle>Payment Summary</SectionTitle>
                {(() => {
                  const totalTripProfit = Number(
                    selected.totalPaymentSummary
                      ?.totalVendorTripProfit || 0
                  );
                  const taxRate = 0.15;
                  const taxAmount = totalTripProfit * taxRate;
                  const totalWithTax = totalTripProfit + taxAmount;

                  return (
                    <RowGrid columns={4}>
                      <Tile
                        label="Total Trip Profit"
                        value={fmtNum(totalTripProfit)}
                        mono
                      />
                      <Tile label="Tax %" value="15%" mono />
                      <Tile
                        label="Tax Amount"
                        value={fmtNum(taxAmount.toFixed(2))}
                        mono
                      />
                      <Tile
                        label="Total With Tax"
                        value={fmtNum(totalWithTax.toFixed(2))}
                        mono
                      />
                    </RowGrid>
                  );
                })()}
              </div>

              {/* Kids Information – with total Trip Vendor Cost AND present/absent summary */}
              <div
                style={{
                  marginBottom: 4,
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(248,250,252,0.9)",
                  border: "1px solid rgba(229,231,235,0.9)",
                }}
              >
                <SectionTitle>Kids Information</SectionTitle>

                {kids && kids.length > 0 ? (
                  <>
                    <CTable
                      small
                      hover
                      responsive
                      className="mt-2"
                      style={{
                        fontSize: 12,
                        borderRadius: 10,
                        overflow: "hidden",
                        border:
                          "1px solid rgba(229,231,235,0.9)",
                      }}
                    >
                      <CTableHead
                        style={{
                          background: "rgba(241,245,249,0.96)",
                        }}
                      >
                        <CTableRow>
                          <CTableHeaderCell>#</CTableHeaderCell>
                          <CTableHeaderCell>
                            School No
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            Kid Name
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            Class Name
                          </CTableHeaderCell>
                          <CTableHeaderCell>Status</CTableHeaderCell>
                          <CTableHeaderCell>
                            Payment Type
                          </CTableHeaderCell>
                          <CTableHeaderCell>
                            Trip Vendor Cost
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {kids.map((kid, index) => (
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
                              {kid.tripKidsStatus || "-"}
                            </CTableDataCell>
                            <CTableDataCell className="mono">
                              {kid.tripPaymentTypeID || "-"}
                            </CTableDataCell>
                            <CTableDataCell className="mono">
                              {fmtNum(kid.TripVendorCost ?? 0)}
                            </CTableDataCell>
                          </CTableRow>
                        ))}

                        {/* Total Trip Vendor Cost row */}
                        <CTableRow>
                          <CTableDataCell
                            colSpan={6}
                            style={{
                              textAlign: "right",
                              fontWeight: "bold",
                            }}
                          >
                            Total Trip Vendor Cost
                          </CTableDataCell>
                          <CTableDataCell
                            className="mono"
                            style={{ fontWeight: "bold" }}
                          >
                            {fmtNum(kidsVendorTotal.toFixed(2))}
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>

                    {/* Present / Absent summary under Kids Information – SAME logic as Student Information */}
                    {(() => {
                      const { presentCount, absentCount } =
                        computeKidsPresence(kids);

                      return (
                        <div style={{ marginTop: 10 }}>
                          <RowGrid columns={2}>
                            <Tile
                              label="Present Students"
                              value={fmtNum(presentCount)}
                              mono
                              style={{
                                background:
                                  "rgba(220,252,231,0.9)",
                                border:
                                  "1px solid rgba(22,163,74,0.55)",
                                color: "#065f46",
                              }}
                            />
                            <Tile
                              label="Absent Students"
                              value={fmtNum(absentCount)}
                              mono
                              style={{
                                background:
                                  "rgba(254,226,226,0.9)",
                                border:
                                  "1px solid rgba(248,113,113,0.7)",
                                color: "#991b1b",
                              }}
                            />
                          </RowGrid>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <div
                    className="muted"
                    style={{ marginTop: 4, fontSize: 12 }}
                  >
                    No kids information found for this trip.
                  </div>
                )}
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter
          style={{
            background: "rgba(241,245,249,0.9)",
            borderTop: "1px solid rgba(203,213,225,0.9)",
          }}
        >
          <CButton
            color="secondary"
            className="add-product-button"
            variant="outline"
            onClick={() => setShowModal(false)}
            style={{
              borderRadius: 999,
              fontSize: 12,
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
