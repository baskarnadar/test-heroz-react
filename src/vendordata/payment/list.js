// src/vendordata/activityinfo/activity/ViewActivityScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CCard, CCardBody, CButton, CBadge, CAlert, CSpinner,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CModal, CModalHeader, CModalBody, CModalFooter, CModalTitle
} from "@coreui/react";
import { AppColors } from "../../_shared/colors";
import { getAuthHeaders, getCurrentLoggedUserID } from "../../utils/operation";
import "../../style/payment.css";

import { API_BASE_URL } from '../../config'
const ts = (fontSize, extra = {}) => ({ fontSize, ...extra }); // kept
const toStr = (v) => (v ?? "").toString();
const fmtNum = (v) => (Number.isFinite(Number(v)) ? Number(v).toString() : toStr(v));

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

// API endpoint
const get_pay_summary =`${API_BASE_URL}/commondata/trip/gettripPaymentSummary`;

const statusColor = (status) => { // kept
  switch ((status || "").toUpperCase()) {
    case "TRIP-BOOKED": return "#067f3c";
    case "APPROVED": return "#2c4696";
    case "FAILED": return "#b91c1c";
    case "NEW": return "#6b7280";
    default: return "#374151";
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
  <div className="section-title">{children}</div>
);

const Tile = ({ label, value, mono }) => (
  <div className={`tile ${mono ? "mono" : ""}`}>
    <div className="tile__label">{label}</div>
    <div className="tile__value">{value}</div>
  </div>
);

const Grid = ({ children }) => <div className="grid">{children}</div>;

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
    return () => { isMounted = false; };
  }, [vendorID]);

  const openModalFor = (row) => {
    setSelected(row);
    setShowModal(true);
  };

  // total of all Vendor Trip Profit across items
  const totalProfitAll = React.useMemo(() => {
    try {
      return items.reduce(
        (sum, it) => sum + (Number(it?.totalPaymentSummary?.totalVendorTripProfit) || 0),
        0
      );
    } catch {
      return 0;
    }
  }, [items]);

  return (
    <div dir={dir} className="vas-container">
      <CCard className="vas-card" style={{ borderColor: AppColors?.onPinkBorderColor || undefined }}>
        <CCardBody className="vas-card-body">
          {/* Header */}
          <div className="vas-header">
            <div className="vas-header-left">
              <div className="title-main">Payment Information</div>
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

          {loading && (
            <div className="center-text">
              <CSpinner size="sm" /> <span style={{ marginLeft: 6 }}>Loading…</span>
            </div>
          )}

          {!!error && <CAlert color="danger" className="mb-16">{error}</CAlert>}

          {/* List of many records */}
          {!loading && !error && !!items.length && (
            <div className="mb-16">
              <CTable small hover responsive>
                <CTableHead>
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
                    <CTableHeaderCell>Food Profit</CTableHeaderCell>
                    <CTableHeaderCell>Total Profit</CTableHeaderCell>
                    <CTableHeaderCell></CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {items.map((row, idx) => (
                    <CTableRow
                      key={row.RequestID || idx}
                      onClick={() => openModalFor(row)}
                      className="row-clickable"
                    >
                      {/* Serial No. */}
                      <CTableDataCell>{idx + 1}</CTableDataCell>

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
                        <CBadge className={`status-badge ${statusClassName(row.actRequestStatus)}`}>
                          {row.actRequestStatus}
                        </CBadge>
                      </CTableDataCell>

                      {/* Student Summary Approved */}
                      <CTableDataCell className="mono">
                        {fmtNum(row.studentSummary.totalStudentApproved)}
                      </CTableDataCell>

                      {/* Trip Vendor Cost */}
                      <CTableDataCell className="mono">
                        {fmtNum(row.tripPayment.totalTripVendorCost)}
                      </CTableDataCell>

                      {/* Food Vendor Price (Total) */}
                      <CTableDataCell className="mono">
                        {fmtNum(row.foodExtrasSummary.totalFoodVendorPrice)}
                      </CTableDataCell>

                      {/* Vendor Trip Profit (Total) */}
                      <CTableDataCell className="mono">
                        {fmtNum(row.totalPaymentSummary.totalVendorTripProfit)}
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
                        >
                          View
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}

          {!loading && !error && !items.length && (
            <div className="center-text muted">No data available.</div>
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
      >
        <CModalHeader closeButton>
          <CModalTitle>Payment Request Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {!selected ? (
            <div className="muted">No record selected.</div>
          ) : (
            <>
              <SectionTitle>Basic Info</SectionTitle>
              <Grid>
                <Tile label="Reference No." value={selected.actRequestRefNo} mono />
                <Tile label="Activity Name" value={selected.actName} />
                <div className="tile">
                  <div className="tile__label">Status</div>
                  <div>
                    <CBadge className={`status-badge ${statusClassName(selected.actRequestStatus)}`}>
                      {selected.actRequestStatus}
                    </CBadge>
                  </div>
                </div>
                <Tile label="Request Date" value={selected.actRequestDate} mono />
                <Tile label="Request Time" value={selected.actRequestTime} mono />
              </Grid>

              <SectionTitle>Student Summary</SectionTitle>
              <Grid>
                <Tile label="Total Paid" value={fmtNum(selected.studentSummary.totalStudentPaid)} />
                <Tile label="Approved" value={fmtNum(selected.studentSummary.totalStudentApproved)} />
                <Tile label="Failed" value={fmtNum(selected.studentSummary.totalStudentFailed)} />
                <Tile label="Trying Paying" value={fmtNum(selected.studentSummary.totalStudentNew)} />
              </Grid>

              <SectionTitle>Payments Summary</SectionTitle>
              <Grid>
                <Tile label="Trip profit" value={fmtNum(selected.tripPayment.totalTripVendorCost)} mono />
                <Tile label="Food profit" value={fmtNum(selected.foodExtrasSummary.totalFoodVendorPrice)} mono />
                <Tile label=" Total Trip Profit " value={fmtNum(selected.totalPaymentSummary.totalVendorTripProfit)} mono />
              </Grid>

            
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" className="add-product-button" variant="outline" onClick={() => setShowModal(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
};

export default ViewActivityScreen;
