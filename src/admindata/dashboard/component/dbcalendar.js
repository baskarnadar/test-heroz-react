import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  CCard,
  CCardBody,
  CButton,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";
import { cilChevronLeft, cilChevronRight, cilSearch } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import { getAuthHeaders } from "../../../utils/operation";

// ===== Debug switch (runtime togglable via window.__DBG_API = true) =====
const DEBUG_MODE = false;
const IS_DEBUG = DEBUG_MODE || (typeof window !== "undefined" && window.__DBG_API === true);

const BRAND = {
  dark: "#560955",
  main: "#7b116f",
  bright: "#b01886",
  soft: "#fff7ff",
  border: "rgba(123, 17, 111, 0.12)",
};

const STATUS_COLORS = {
  APPROVED: "#16a34a",
  "WAITING-FOR-APPROVAL": "#f59e0b",
  REJECTED: "#ef4444",
  "TRIP-BOOKED": "#078761",
  BOOKED: "#078761",
  COMPLETED: "#075c46",
  "TRIP-REJECTED": "#ef4444",
  "TRIP-APPROVED": "#16a34a",
};

const STATUS_BADGE = {
  APPROVED: "success",
  "WAITING-FOR-APPROVAL": "warning",
  REJECTED: "danger",
  "TRIP-BOOKED": "success",
  BOOKED: "success",
  COMPLETED: "success",
  "TRIP-REJECTED": "danger",
  "TRIP-APPROVED": "success",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const UI = {
  radius: 28,
  surface: "#ffffff",
  pageBg: "#f7f4fb",
  border: "#ece7f2",
  softBorder: "rgba(15, 23, 42, 0.08)",
  shadowCard: "0 24px 60px rgba(86, 9, 85, 0.10)",
  shadowSoft: "0 18px 35px rgba(86, 9, 85, 0.12)",
  gradientButton: "linear-gradient(135deg, #65075f 0%, #9c168a 55%, #b01886 100%)",
};

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function daysInMonth(d) { return endOfMonth(d).getDate(); }
function pad(n) { return String(n).padStart(2, "0"); }
function dateKeyFromParts(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseYmd(dateStr) {
  if (!dateStr) return null;
  const clean = String(dateStr).slice(0, 10);
  return new Date(`${clean}T00:00:00`);
}
function getDateKeyFromItem(item) {
  return String(item?.actRequestDate || item?.RequestDate || item?.CreatedDate || "").slice(0, 10);
}
function getStatus(item) {
  return String(item?.actRequestStatus || item?.BookingStatus || item?.RequestStatus || "").trim();
}
function getStatusColor(statusRaw) {
  const s = String(statusRaw || "").toUpperCase();
  return STATUS_COLORS[s] || BRAND.main;
}
function getStatusBadge(statusRaw) {
  const s = String(statusRaw || "").toUpperCase();
  return STATUS_BADGE[s] || "secondary";
}
function getActivityName(item) {
  return item?.actName || item?.ActivityName || item?.activityName || item?.ActivityTitle || "Activity";
}
function getVendorName(item) {
  return item?.vdrName || item?.VendorName || item?.vendorName || "-";
}
function getSchoolName(item) {
  return item?.schName || item?.SchoolName || item?.schoolName || "-";
}

const DebugPanel = ({ show, apiUrl, requestBody, httpStatus, rawJson, onClose }) => {
  if (!show) return null;
  return (
    <div style={{ border: `1px solid ${UI.border}`, borderRadius: 18, background: "#0b1220", color: "#e2e8f0", padding: 12, marginBottom: 18 }}>
      <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 8 }}>
        <strong style={{ color: "#f9a8d4" }}>Debug Panel</strong>
        <CButton size="sm" color="secondary" variant="outline" onClick={onClose}>Hide</CButton>
      </div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <div><strong>API:</strong> <code style={{ color: "#fef08a" }}>{apiUrl}</code></div>
        <div><strong>Status:</strong> {httpStatus ?? "-"}</div>
      </div>
      <pre style={{ margin: 0, padding: 10, fontSize: 12, maxHeight: 240, overflow: "auto", background: "#0f172a", borderRadius: 12 }}>
        {JSON.stringify({ requestBody, response: rawJson }, null, 2)}
      </pre>
    </div>
  );
};

DebugPanel.propTypes = {
  show: PropTypes.bool,
  apiUrl: PropTypes.string,
  requestBody: PropTypes.any,
  httpStatus: PropTypes.any,
  rawJson: PropTypes.any,
  onClose: PropTypes.func,
};

const DayCell = ({ dayNumber, muted, items, isToday, onClick }) => {
  const count = items?.length || 0;
  const hasItems = count > 0;
  const hasCompleted = (items || []).some((x) => String(getStatus(x)).toUpperCase() === "COMPLETED");
  const statusColor = hasCompleted ? STATUS_COLORS.COMPLETED : STATUS_COLORS["TRIP-BOOKED"];

  return (
    <button
      type="button"
      onClick={hasItems ? onClick : undefined}
      disabled={!hasItems}
      style={{
        position: "relative",
        height: 74,
        border: hasItems ? "none" : `1px solid ${UI.softBorder}`,
        borderRadius: 14,
        background: hasItems
          ? `linear-gradient(180deg, rgba(255,255,255,0.10) 0%, ${statusColor} 46%, ${statusColor} 100%)`
          : "#ffffff",
        color: hasItems ? "#ffffff" : muted ? "#9ca3af" : "#111827",
        fontWeight: 900,
        fontSize: 16,
        boxShadow: hasItems ? "0 16px 28px rgba(7, 92, 70, 0.22)" : "0 5px 12px rgba(15, 23, 42, 0.04)",
        cursor: hasItems ? "pointer" : "default",
        outline: isToday ? `3px solid ${BRAND.bright}` : "none",
        outlineOffset: isToday ? 2 : 0,
        overflow: "hidden",
        transition: "transform .14s ease, box-shadow .14s ease",
      }}
      onMouseEnter={(e) => {
        if (hasItems) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 18px 34px rgba(7, 92, 70, 0.28)";
        }
      }}
      onMouseLeave={(e) => {
        if (hasItems) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 16px 28px rgba(7, 92, 70, 0.22)";
        }
      }}
    >
      {hasItems && (
        <span
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 25,
            borderBottomLeftRadius: "45%",
            borderBottomRightRadius: "45%",
            background: "rgba(255,255,255,0.14)",
          }}
        />
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{dayNumber}</span>
      {hasItems && (
        <span
          style={{
            position: "absolute",
            left: "50%",
            bottom: 10,
            transform: "translateX(-50%)",
            minWidth: 24,
            height: 24,
            padding: "0 7px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 900,
            color: "#ffffff",
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.36)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
};

DayCell.propTypes = {
  dayNumber: PropTypes.number.isRequired,
  muted: PropTypes.bool,
  items: PropTypes.array,
  isToday: PropTypes.bool,
  onClick: PropTypes.func,
};

const DBCalendar = ({ apiUrl, title = "Activities Calendar" }) => {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState([]);
  const [error, setError] = useState("");
  const [viewDate, setViewDate] = useState(() => new Date());

  const [showModal, setShowModal] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const [form, setForm] = useState({ q: "", vendor: "", status: "", startDate: "", endDate: "" });
  const [params, setParams] = useState(null);

  const [debugOpen, setDebugOpen] = useState(IS_DEBUG);
  const [lastRequestBody, setLastRequestBody] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [lastHttpStatus, setLastHttpStatus] = useState(null);

  const vendorOptions = useMemo(() => {
    const s = new Set();
    raw.forEach((t) => { const v = getVendorName(t); if (v && v !== "-") s.add(v); });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [raw]);

  const statusOptions = useMemo(() => {
    const s = new Set();
    raw.forEach((t) => { const v = getStatus(t); if (v) s.add(v); });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [raw]);

  useEffect(() => {
    let isMounted = true;
    const go = async () => {
      setLoading(true);
      setError("");
      setLastHttpStatus(null);
      setLastResponse(null);
      const requestBody = params || {};
      setLastRequestBody(requestBody);

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        setLastHttpStatus(res.status);
        let payload = null;
        try { payload = await res.json(); } catch { payload = null; }
        setLastResponse(payload);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.Data)
          ? payload.data.Data
          : Array.isArray(payload?.Data)
          ? payload.Data
          : [];

        if (isMounted) setRaw(list);
      } catch (e) {
        if (isMounted) {
          setError(String(e?.message || e));
          setRaw([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    go();
    return () => { isMounted = false; };
  }, [apiUrl, params]);

  const filtered = useMemo(() => {
    let arr = raw;
    if (params?.q) {
      const q = params.q.toLowerCase();
      arr = arr.filter((t) => getActivityName(t).toLowerCase().includes(q));
    }
    if (params?.vendor) arr = arr.filter((t) => getVendorName(t) === params.vendor);
    if (params?.status) arr = arr.filter((t) => getStatus(t) === params.status);
    if (params?.startDate) arr = arr.filter((t) => getDateKeyFromItem(t) >= params.startDate);
    if (params?.endDate) arr = arr.filter((t) => getDateKeyFromItem(t) <= params.endDate);
    return arr;
  }, [raw, params]);

  const monthStart = startOfMonth(viewDate);
  const totalDays = daysInMonth(viewDate);
  const offset = monthStart.getDay();
  const monthEnd = endOfMonth(viewDate);
  const todayKey = new Date().toISOString().slice(0, 10);

  const byDate = useMemo(() => {
    const map = new Map();
    filtered.forEach((t) => {
      const key = getDateKeyFromItem(t);
      const d = parseYmd(key);
      if (!d) return;
      if (d >= monthStart && d <= monthEnd) {
        const arr = map.get(key) || [];
        arr.push(t);
        map.set(key, arr);
      }
    });
    return map;
  }, [filtered, monthStart, monthEnd]);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const onApplyFilters = () => {
    setParams({
      q: form.q?.trim() || undefined,
      vendor: form.vendor || undefined,
      status: form.status || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    });
  };

  const onResetFilters = () => {
    setForm({ q: "", vendor: "", status: "", startDate: "", endDate: "" });
    setParams(null);
  };

  const openDateModal = (dateKey, items) => {
    setSelectedDateKey(dateKey);
    setSelectedItems(Array.isArray(items) ? items : []);
    setShowModal(true);
  };

  const closeDateModal = () => {
    setShowModal(false);
    setSelectedDateKey("");
    setSelectedItems([]);
  };

  const gridItems = [];
  const prevMonthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  const prevMonthTotal = daysInMonth(prevMonthDate);

  for (let i = 0; i < offset; i += 1) {
    gridItems.push({ day: prevMonthTotal - offset + i + 1, muted: true, key: `prev-${i}`, items: [] });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const key = dateKeyFromParts(viewDate.getFullYear(), viewDate.getMonth(), day);
    gridItems.push({ day, muted: false, key, items: byDate.get(key) || [] });
  }

  while (gridItems.length % 7 !== 0) {
    const day = gridItems.length - offset - totalDays + 1;
    gridItems.push({ day, muted: true, key: `next-${day}`, items: [] });
  }

  return (
    <CCard style={{ border: "none", borderRadius: UI.radius, boxShadow: UI.shadowCard, overflow: "hidden", background: "#ffffff", marginBottom: 22 }}>
      <CCardBody style={{ background: "linear-gradient(180deg, #ffffff 0%, #fbf8ff 100%)", padding: 28 }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "stretch",
            flexWrap: "nowrap",
            overflowX: "auto",
            padding: 10,
            background: "#ffffff",
            borderRadius: 16,
            border: `1px solid ${UI.border}`,
            boxShadow: "0 12px 28px rgba(86, 9, 85, 0.08)",
            marginBottom: 28,
          }}
        >
          <CInputGroup style={{ minWidth: 260, maxWidth: 360, flex: "1 1 260px" }}>
            <CInputGroupText style={{ background: BRAND.soft, borderColor: UI.border, color: BRAND.main }}>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search activity name..."
              value={form.q}
              onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
              style={{ borderColor: UI.border }}
            />
          </CInputGroup>

          <CFormSelect value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} style={{ maxWidth: 220, borderColor: UI.border }}>
            <option value="">All Vendors</option>
            {vendorOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </CFormSelect>

          <CFormSelect value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ maxWidth: 220, borderColor: UI.border }}>
            <option value="">All Statuses</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </CFormSelect>

          <CFormInput type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} style={{ maxWidth: 180, borderColor: UI.border }} />
          <CFormInput type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} style={{ maxWidth: 180, borderColor: UI.border }} />

          <div style={{ display: "flex", gap: 8 }}>
            <CButton onClick={onApplyFilters} style={{ border: "none", background: UI.gradientButton, fontWeight: 900, paddingInline: 18 }}>Apply</CButton>
            <CButton color="secondary" variant="outline" onClick={onResetFilters} style={{ fontWeight: 800 }}>Reset</CButton>
          </div>
        </div>

        <DebugPanel show={debugOpen} apiUrl={apiUrl} requestBody={lastRequestBody} httpStatus={lastHttpStatus} rawJson={lastResponse} onClose={() => setDebugOpen(false)} />

        {error && (
          <div style={{ marginBottom: 16, padding: 12, borderRadius: 14, background: "#fff1f2", color: "#991b1b", border: "1px solid #fecaca", fontWeight: 800 }}>
            {error}
          </div>
        )}

        <div style={{ maxWidth: 1030, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
            <CButton onClick={prevMonth} aria-label="Previous month" style={{ width: 48, height: 48, borderRadius: 13, border: "none", background: UI.gradientButton, boxShadow: UI.shadowSoft }}>
              <CIcon icon={cilChevronLeft} />
            </CButton>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <div style={{ fontSize: 12, color: "#7b7280", fontWeight: 700 }}>{title}</div>
            </div>

            <CButton onClick={nextMonth} aria-label="Next month" style={{ width: 48, height: 48, borderRadius: 13, border: "none", background: UI.gradientButton, boxShadow: UI.shadowSoft }}>
              <CIcon icon={cilChevronRight} />
            </CButton>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 10 }}>
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} style={{ textAlign: "center", fontWeight: 900, color: "#4b4769", textTransform: "uppercase", letterSpacing: ".8px", fontSize: 13 }}>{w}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {gridItems.map((cell) => (
              <DayCell
                key={cell.key}
                dayNumber={cell.day}
                muted={cell.muted}
                items={cell.items}
                isToday={cell.key === todayKey}
                onClick={() => openDateModal(cell.key, cell.items)}
              />
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 22, flexWrap: "wrap", marginTop: 26, fontSize: 13, color: "#4b5563", fontWeight: 700 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: STATUS_COLORS["TRIP-BOOKED"] }} />Booked Activity</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: STATUS_COLORS.COMPLETED }} />Completed Activity</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: 999, background: BRAND.main }} />Today</span>
          </div>
        </div>

        {loading && (
          <div className="mt-4 d-flex align-items-center justify-content-center" style={{ gap: 10, color: BRAND.main, fontWeight: 800 }}>
            <CSpinner size="sm" />
            <span>Loading calendar...</span>
          </div>
        )}
      </CCardBody>

      <CModal visible={showModal} onClose={closeDateModal} alignment="center" scrollable size="lg">
        <CModalHeader style={{ background: UI.gradientButton, color: "#ffffff", borderBottom: "none", padding: "20px 24px" }}>
          <CModalTitle style={{ fontWeight: 900 }}>
            Activity Details
            {selectedDateKey ? <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 700, opacity: 0.9 }}>({selectedDateKey})</span> : null}
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ background: "#fbf7ff", padding: 20, minHeight: 120 }}>
          {selectedItems.length === 0 ? (
            <div style={{ padding: 18, borderRadius: 14, background: "#ffffff", border: `1px solid ${UI.border}`, color: "#6b7280", fontWeight: 800 }}>
              No activity details found for this date.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {selectedItems.map((item, index) => {
                const status = getStatus(item);
                const color = getStatusColor(status);
                return (
                  <div
                    key={item?._id || item?.RequestID || item?.ActivityID || index}
                    style={{
                      background: "#ffffff",
                      border: `1px solid ${UI.border}`,
                      borderLeft: `6px solid ${color}`,
                      borderRadius: 16,
                      padding: 16,
                      boxShadow: "0 14px 28px rgba(86, 9, 85, 0.08)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 900, color: "#111827" }}>{index + 1}. {getActivityName(item)}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>Ref: {item?.actRequestRefNo || item?.RequestID || item?.ActivityID || "-"}</div>
                      </div>
                      <CBadge color={getStatusBadge(status)} shape="rounded-pill" style={{ alignSelf: "flex-start", padding: "7px 12px", fontSize: 12 }}>{status || "Status"}</CBadge>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, fontSize: 13.5, color: "#1f2937" }}>
                      <div><strong>Date:</strong> {getDateKeyFromItem(item) || "-"}</div>
                      <div><strong>Total Students:</strong> {item?.actTotalNoStudents ?? item?.TotalStudents ?? "-"}</div>
                      <div><strong>Vendor:</strong> {getVendorName(item)}</div>
                      <div><strong>School:</strong> {getSchoolName(item)}</div>
                      <div style={{ gridColumn: "1 / -1" }}><strong>Message:</strong> {item?.actRequestMessage || item?.Message || "-"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CModalBody>
        <CModalFooter style={{ background: "#fbf7ff", borderTop: `1px solid ${UI.border}` }}>
          <CButton color="secondary" variant="outline" onClick={closeDateModal}>Close</CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  );
};

DBCalendar.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  title: PropTypes.string,
};

export default DBCalendar;
