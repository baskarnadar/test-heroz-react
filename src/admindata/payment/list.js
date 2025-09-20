// src/vendordata/activityinfo/activity/ViewActivityScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CCard, CCardBody, CButton, CBadge, CAlert, CSpinner,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CRow, CCol, CFormSelect, CFormInput,
  CPagination, CPaginationItem
} from "@coreui/react";
import { AppColors } from "../../_shared/colors";
import { getAuthHeaders, getCurrentLoggedUserID } from "../../utils/operation";
import "../../style/payment.css";

import SchPaymentModal from "./schPayment";
import VdrPaymentModal from "./vdrPayment";
import ViewPaymentModal from "./viewPayment";

import { API_BASE_URL } from '../../config';

// ---------- tiny inline SVG icons (no dependencies) ----------
const IconCard = ({ size = 16, title = "Pay" }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" role="img"
    aria-label={title} focusable="false"
  >
    <title>{title}</title>
    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
    <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2"/>
    <rect x="6" y="14" width="6" height="2" fill="currentColor"/>
  </svg>
);

const IconEye = ({ size = 16, title = "View" }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" role="img"
    aria-label={title} focusable="false"
  >
    <title>{title}</title>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// simple helpers
const toStr = (v) => (v ?? "").toString();
const fmtNum = (v) => (Number.isFinite(Number(v)) ? Number(v).toString() : toStr(v));
const fold = (s) => toStr(s).toLowerCase().trim();

const useDocDir = () => {
  const [dir, setDir] = React.useState(document?.documentElement?.dir || "ltr");
  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setDir(document?.documentElement?.dir || "ltr");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => obs.disconnect();
  }, []);
  return dir;
};

// Small helper to keep text on one line with ellipsis + tooltip
const Ellipsis = ({ text, width = '22ch', className = '' }) => (
  <div
    className={`text-truncate ${className}`}
    title={text || ''}
    style={{
      maxWidth: width,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }}
  >
    {text || '-'}
  </div>
);

// API endpoint
const get_pay_summary = `${API_BASE_URL}/commondata/trip/gettripPaymentSummary`;

// badge classes
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

const Tile = ({ label, value, mono }) => (
  <div className={`tile ${mono ? "mono" : ""}`}>
    <div className="tile__label">{label}</div>
    <div className="tile__value">{value}</div>
  </div>
);

// date helper for filters
const parseYMD = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// Server → UI
const normalizeItem = (x) => ({
  RequestID: toStr(x.RequestID),
  ActivityID: toStr(x.ActivityID),
  SchoolID: toStr(x.SchoolID),
  VendorID: toStr(x.VendorID),
  actRequestRefNo: toStr(x.actRequestRefNo),
  actName: toStr(x.actName),
  vdrName: toStr(x.vdrName),
  schName: toStr(x.schName),
  actRequestStatus: toStr(x.actRequestStatus),
  actRequestDate: toStr(x.actRequestDate),
  actRequestTime: toStr(x.actRequestTime),

  // ✅ Keep payments so the modal can show TripFullAmount by KidsID
  payments: Array.isArray(x?.payments) ? x.payments.map((p) => ({
    KidsID: toStr(p?.KidsID),
    PayTypeID: toStr(p?.PayTypeID),
    tripPaymentTypeID: toStr(p?.tripPaymentTypeID),
    TripCost: Number(p?.TripCost ?? 0),
    TripFoodCost: Number(p?.TripFoodCost ?? 0),
    TripTaxAmount: Number(p?.TripTaxAmount ?? 0),
    TripFullAmount: Number(p?.TripFullAmount ?? 0),
    TripVendorCost: Number(p?.TripVendorCost ?? 0),
    TripHerozCost: Number(p?.TripHerozCost ?? 0),
    TripSchoolPrice: Number(p?.TripSchoolPrice ?? 0),
    CreatedDate: toStr(p?.CreatedDate),
    PayDate: toStr(p?.PayDate),
    PayStatus: toStr(p?.PayStatus),
    MyFatrooahRefNo: toStr(p?.MyFatrooahRefNo),
  })) : [],

  KidsSumamry: Array.isArray(x?.KidsSumamry) ? x.KidsSumamry.map((k) => ({
    ParentsID: toStr(k?.ParentsID),
    KidsID: toStr(k?.KidsID),
    TripKidsSchoolNo: toStr(k?.TripKidsSchoolNo),
    TripKidsName: toStr(k?.TripKidsName),
    tripKidsClassName: toStr(k?.tripKidsClassName),
    CreatedDate: toStr(k?.CreatedDate),
    tripKidsStatus: toStr(k?.tripKidsStatus),
  })) : [],
  parentsInfo: Array.isArray(x?.parentsInfo) ? x.parentsInfo.map((p) => ({
    ParentsID: toStr(p?.ParentsID),
    tripParentsName: toStr(p?.tripParentsName),
    tripParentsMobileNo: toStr(p?.tripParentsMobileNo),
    tripParentsNote: toStr(p?.tripParentsNote),
    CreatedDate: toStr(p?.CreatedDate),
  })) : [],
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
    totalFoodVendorPrice: Number(x?.foodExtrasSummary?.totalFoodVendorPrice ?? 0),
  },
  totalPaymentSummary: {
    totalVendorTripProfit: Number(x?.totalPaymentSummary?.totalVendorTripProfit ?? 0),
  },
});

const ViewActivityScreen = () => {
  const navigate = useNavigate();
  const dir = useDocDir();
  const vendorID = getCurrentLoggedUserID?.() || "";

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
  const [filterStatus, setFilterStatus] = React.useState("");
  const [filterFromDate, setFilterFromDate] = React.useState("");
  const [filterToDate, setFilterToDate] = React.useState("");
  const [filterQuery, setFilterQuery] = React.useState(""); // 🔎 new free-text search

  // pagination
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(get_pay_summary, {
          method: "POST",
          headers: {
            ...(getAuthHeaders ? getAuthHeaders() : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || `Request failed: ${res.status}`);

        const arr = Array.isArray(json?.data) ? json.data : (json?.data ? [json.data] : []);
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
    return () => { isMounted = false; };
  }, [vendorID]);

  const openModalFor = (row) => {
    setSelected(row);
    setShowModal(true);
  };

  // dropdown options
  const vendorOptions = React.useMemo(() => {
    const set = new Set();
    items.forEach(it => {
      const v = (it?.vdrName || "").trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const statusOptions = React.useMemo(() => {
    const set = new Set();
    items.forEach(it => {
      const s = (it?.actRequestStatus || "").trim();
      if (s) set.add(s);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  // filter
  const filteredItems = React.useMemo(() => {
    const from = parseYMD(filterFromDate);
    const to = parseYMD(filterToDate);
    const q = fold(filterQuery);

    return items.filter((it) => {
      if (filterVendor && (it.vdrName || "") !== filterVendor) return false;
      if (filterStatus && (it.actRequestStatus || "") !== filterStatus) return false;

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
  }, [items, filterVendor, filterStatus, filterFromDate, filterToDate, filterQuery]);

  // totals
  const totalProfitAll = React.useMemo(() => {
    try {
      return filteredItems.reduce(
        (sum, it) => sum + (Number(it?.totalPaymentSummary?.totalVendorTripProfit) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [filteredItems]);

  const resetFilters = () => {
    setFilterVendor("");
    setFilterStatus("");
    setFilterFromDate("");
    setFilterToDate("");
    setFilterQuery("");
  };

  // pagination derived
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterVendor, filterStatus, filterFromDate, filterToDate, filterQuery, pageSize]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = React.useMemo(
    () => filteredItems.slice(startIndex, endIndex),
    [filteredItems, startIndex, endIndex]
  );

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
  };

  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div dir={dir} className="vas-container">
      <CCard className="vas-card" style={{ borderColor: AppColors?.onPinkBorderColor || undefined }}>
        <CCardBody className="vas-card-body">
          {/* Header */}
          <div className="vas-header">
            <div className="vas-header-left">
              <div className="title-main">Payment Information New</div>
            </div>

            {/* Right-side total profit box with rounded corners */}
            <div className="vas-header-right">
              <div className="vas-total-tile tile--xl">
                <Tile label="Total Profit" value={fmtNum(totalProfitAll)} mono />
              </div>
              <CButton color="secondary" className="add-product-button" variant="outline" onClick={() => navigate(-1)}>
                ← Back
              </CButton>
            </div>
          </div>

          {/* Filters row (single line, scroll if narrow) */}
          <div className="d-flex align-items-end gap-2 flex-nowrap overflow-auto mb-3" style={{ paddingBottom: 4 }}>
            {/* Free-text search */}
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
                  <option key={v} value={v}>{v}</option>
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

            <div style={{ minWidth: 170 }}>
              <CFormSelect
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </CFormSelect>
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
                {pageSizeOptions.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </CFormSelect>
              <small className="text-muted text-nowrap">
                Showing {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}
              </small>
            </div>
          </div>

          {loading && (
            <div className="center-text">
              <CSpinner size="sm" /> <span style={{ marginLeft: 6 }}>Loading…</span>
            </div>
          )}

          {!!error && <CAlert color="danger" className="mb-16">{error}</CAlert>}

          {/* Table */}
          {!loading && !error && !!pageItems.length && (
            <div className="mb-3">
              <CTable small hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>#</CTableHeaderCell>
                    <CTableHeaderCell>Ref#</CTableHeaderCell>
                    <CTableHeaderCell className="text-nowrap">Trip Name</CTableHeaderCell>
                    <CTableHeaderCell className="text-nowrap">School</CTableHeaderCell>
                    <CTableHeaderCell className="text-nowrap">vendor</CTableHeaderCell>
                    <CTableHeaderCell className="text-nowrap">Trip Date</CTableHeaderCell>
                    <CTableHeaderCell className="text-nowrap">Time</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Student</CTableHeaderCell>
                    <CTableHeaderCell>Profit</CTableHeaderCell>
                    <CTableHeaderCell className="text-nowrap">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageItems.map((row, idx) => (
                    <CTableRow
                      key={row.RequestID || (startIndex + idx)}
                      onClick={() => openModalFor(row)}
                      className="row-clickable"
                    >
                      <CTableDataCell>{startIndex + idx + 1}</CTableDataCell>
                      <CTableDataCell className="mono">{row.actRequestRefNo || "-"}</CTableDataCell>

                      {/* Trip Name (no wrap + ellipsis + tooltip) */}
                      <CTableDataCell>
                        <Ellipsis text={row.actName} width="26ch" />
                      </CTableDataCell>

                      {/* School (no wrap + ellipsis + tooltip) */}
                      <CTableDataCell>
                        <Ellipsis text={row.schName} width="24ch" />
                      </CTableDataCell>

                      {/* vendor (no wrap + ellipsis + tooltip) */}
                      <CTableDataCell>
                        <Ellipsis text={row.vdrName} width="20ch" />
                      </CTableDataCell>

                      {/* NO WRAP for date/time */}
                      <CTableDataCell className="mono text-nowrap">{row.actRequestDate || "-"}</CTableDataCell>
                      <CTableDataCell className="mono text-nowrap">{row.actRequestTime || "-"}</CTableDataCell>

                      <CTableDataCell>
                        <CBadge className={`status-badge ${statusClassName(row.actRequestStatus)}`}>
                          {row.actRequestStatus}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="mono">
                        {fmtNum(row.studentSummary.totalStudentApproved)}
                      </CTableDataCell>
                      <CTableDataCell className="mono">
                        {fmtNum(row.totalPaymentSummary.totalVendorTripProfit)}
                      </CTableDataCell>

                      {/* ACTIONS: force single line, allow horizontal scroll if needed */}
                      <CTableDataCell className="text-nowrap">
                        <div className="d-flex gap-1 flex-nowrap overflow-auto" style={{ maxWidth: '220px' }}>
                          <CButton
                            size="sm"
                            color="success"
                            variant="outline"
                            title="Pay School"
                            aria-label="Pay School"
                            onClick={(e) => { e.stopPropagation(); setSelected(row); setShowSchPay(true); }}
                          >
                            <IconCard title="Pay School" />
                          </CButton>
                          <CButton
                            size="sm"
                            color="primary"
                            variant="outline"
                            title="Pay Vendor"
                            aria-label="Pay Vendor"
                            onClick={(e) => { e.stopPropagation(); setSelected(row); setShowVdrPay(true); }}
                          >
                            <IconCard title="Pay Vendor" />
                          </CButton>
                          <CButton
                            size="sm"
                            color="secondary"
                            variant="outline"
                            title="View"
                            aria-label="View"
                            onClick={(e) => { e.stopPropagation(); openModalFor(row); }}
                          >
                            <IconEye title="View" />
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              {/* Pagination */}
              <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">Page {safePage} of {totalPages}</small>
                <CPagination align="end" className="mb-0">
                  <CPaginationItem disabled={safePage === 1} onClick={() => goToPage(1)}>« First</CPaginationItem>
                  <CPaginationItem disabled={safePage === 1} onClick={() => goToPage(safePage - 1)}>‹ Prev</CPaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const half = 2;
                    let start = Math.max(1, safePage - half);
                    let end = Math.min(totalPages, start + 4);
                    start = Math.max(1, end - 4);
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <CPaginationItem key={page} active={page === safePage} onClick={() => goToPage(page)}>
                        {page}
                      </CPaginationItem>
                    );
                  })}
                  <CPaginationItem disabled={safePage === totalPages} onClick={() => goToPage(safePage + 1)}>Next ›</CPaginationItem>
                  <CPaginationItem disabled={safePage === totalPages} onClick={() => goToPage(totalPages)}>Last »</CPaginationItem>
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
        item={selected}
        allRequests={items}  // ✅ give modal the full list as a fallback source
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
