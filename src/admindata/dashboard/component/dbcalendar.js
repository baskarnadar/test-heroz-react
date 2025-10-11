import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CButtonGroup,
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

/**
 * Status palettes (includes both generic & trip-prefixed variants)
 */
const STATUS_COLORS = {
  APPROVED: "#22c55e",                // green
  "WAITING-FOR-APPROVAL": "#f59e0b",  // amber
  REJECTED: "#ef4444",                // red
  "TRIP-BOOKED": "#3b82f6",           // blue
  BOOKED: "#3b82f6",
  COMPLETED: "#22c55e",
  "TRIP-REJECTED": "#ef4444",
  "TRIP-APPROVED": "#22c55e",
};

const STATUS_BADGE = {
  APPROVED: "success",
  "WAITING-FOR-APPROVAL": "warning",
  REJECTED: "danger",
  "TRIP-BOOKED": "info",
  BOOKED: "info",
  COMPLETED: "success",
  "TRIP-REJECTED": "danger",
  "TRIP-APPROVED": "success",
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// UI tokens
const UI = {
  radius: 14,
  surface: "#ffffff",
  softBg: "#f8fafc",
  border: "#e5e7eb",
  shadowCard: "0 12px 24px rgba(17, 24, 39, 0.08)",
  shadowItem: "0 2px 6px rgba(17, 24, 39, 0.08)",
  headerGrad: "linear-gradient(135deg, #0f172a 0%, #111827 55%, #1f2937 100%)",
};

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function daysInMonth(d) { return endOfMonth(d).getDate(); }
function toKeyDate(dateStr) { return dateStr?.trim(); }
function parseYmd(dateStr) { return new Date(`${dateStr}T00:00:00`); }

const Legend = () => (
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    {Object.entries({
      APPROVED: STATUS_COLORS.APPROVED,
      "TRIP-BOOKED": STATUS_COLORS["TRIP-BOOKED"],
      REJECTED: STATUS_COLORS.REJECTED,
      "WAITING-FOR-APPROVAL": STATUS_COLORS["WAITING-FOR-APPROVAL"],
    }).map(([status, color]) => (
      <span
        key={status}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          background: UI.softBg,
          border: `1px solid ${UI.border}`,
          fontSize: 12,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: color,
            display: "inline-block",
            boxShadow: "0 0 0 2px rgba(0,0,0,0.05)",
          }}
        />
        {status}
      </span>
    ))}
  </div>
);

// Helpers to derive background rgba(0.3) by status
const statusBg = (statusRaw) => {
  const s = (statusRaw || "").toUpperCase();
  if (s === "APPROVED" || s === "TRIP-APPROVED" || s === "COMPLETED") {
    return "rgba(34, 197, 94, 0.3)"; // green 0.3
  }
  if (s === "TRIP-BOOKED" || s === "BOOKED") {
    return "rgba(59, 130, 246, 0.3)"; // blue 0.3
  }
  if (s === "REJECTED" || s === "TRIP-REJECTED") {
    return "rgba(239, 68, 68, 0.3)"; // red 0.3
  }
  if (s === "WAITING-FOR-APPROVAL") {
    return "rgba(245, 158, 11, 0.3)"; // amber 0.3
  }
  return "rgba(15, 23, 42, 0.06)"; // fallback light slate
};

const statusBorderLeft = (statusRaw) => {
  const s = (statusRaw || "").toUpperCase();
  return STATUS_COLORS[s] || "#94a3b8";
};

const statusBadge = (statusRaw) => {
  const s = (statusRaw || "").toUpperCase();
  return STATUS_BADGE[s] || "secondary";
};

// Resolve a solid color for a single item (mini-circle)
const statusSolidColor = (statusRaw) => {
  const s = (statusRaw || "").toUpperCase();
  return STATUS_COLORS[s] || "#64748b";
};

// Per-day cell
const DayCell = ({ dayNumber, items, onItemClick, dateKey }) => {
  const MAX_ROWS = 6;
  const visible = (items || []).slice(0, MAX_ROWS);
  const hasOverflowRows = (items?.length || 0) > MAX_ROWS;

  const TODAY_KEY = new Date().toISOString().slice(0, 10);
  const isToday = dateKey === TODAY_KEY;

  // Only show day header if there are trips
  const dayHasTrips = (items?.length || 0) > 0;

  // Day number circle (always maroon for days with trips)
  const MAROON = "#800000";
  const dayCircleStyle = {
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 13,
    border: `1px solid ${MAROON}`,
    color: "#ffffff",
    background: isToday ? MAROON : "rgba(128, 0, 0, .9)",
    boxShadow: isToday ? "0 2px 8px rgba(128,0,0,.35)" : "none",
  };

  // Mini numbered chips for each event (now at the BOTTOM)
  const miniChipBase = {
    minWidth: 22,
    height: 22,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 11,
    padding: 0,
    lineHeight: "22px",
    color: "#0f172a",
    border: `1px solid ${UI.border}`,
  };

  return (
    <div
      style={{
        border: `1px solid ${UI.border}`,
        minHeight: 120,
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: UI.surface,
        borderRadius: 12,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      {/* Top row: maroon day circle (only when trips exist) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {dayHasTrips ? <div style={dayCircleStyle}>{dayNumber}</div> : null}
        </div>
        <div style={{ display: "none" }} />
      </div>

      {/* Items list: status-tinted backgrounds */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxHeight: 140,
          overflow: "auto",
        }}
      >
        {visible.map((it, idx) => {
          const bg = statusBg(it.actRequestStatus);
          const left = statusBorderLeft(it.actRequestStatus);
          const badge = statusBadge(it.actRequestStatus);
          const title = `${it.actName || ""} • ${it.actRequestStatus || ""}`;

          return (
            <div
              key={it._id || idx}
              title={title}
              onClick={() => onItemClick && onItemClick(it)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "10px 10px",
                borderRadius: 10,
                background: bg,
                border: `1px solid ${UI.border}`,
                borderLeft: `4px solid ${left}`,
                cursor: "pointer",
                boxShadow: UI.shadowItem,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: ".2px",
                }}
              >
                {it.actName || "-"}
              </div>
              <div>
                <CBadge
                  color={badge}
                  shape="rounded-pill"
                  style={{ fontSize: 11, lineHeight: "14px", padding: "2px 8px" }}
                >
                  {it.actRequestStatus || "—"}
                </CBadge>
              </div>
            </div>
          );
        })}
        {hasOverflowRows && (
          <div style={{ fontSize: 11, color: "#64748b" }}>
            +{items.length - MAX_ROWS} more…
          </div>
        )}
      </div>

      {/* Bottom chips row: numbered by order, colored by status */}
      {dayHasTrips && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginTop: "auto",
            paddingTop: 6,
            borderTop: `1px dashed ${UI.border}`,
          }}
        >
          {items.map((it, idx) => {
            const c = statusSolidColor(it.actRequestStatus);
            return (
              <span
                key={`${it._id || idx}-chip`}
                title={String(it.actRequestStatus || "").trim() || "Status"}
                aria-label={String(it.actRequestStatus || "").trim() || "Status"}
                style={{
                  ...miniChipBase,
                  background: `${c}22`, // light tint
                  borderColor: c,
                  color: "#0f172a",
                  cursor: "default",
                }}
              >
                {idx + 1}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

DayCell.propTypes = {
  dayNumber: PropTypes.number.isRequired,
  items: PropTypes.array,
  onItemClick: PropTypes.func,
  dateKey: PropTypes.string,
};

// Small utility
const copyText = async (txt) => {
  try {
    await navigator.clipboard.writeText(txt);
  } catch {}
};

// ============ Debug Panel ============
const DebugPanel = ({ show, apiUrl, requestBody, httpStatus, rawJson, onClose }) => {
  if (!show) return null;
  const prettyReq = requestBody ? JSON.stringify(requestBody, null, 2) : "{}";
  const prettyRes = rawJson ? JSON.stringify(rawJson, null, 2) : "null";

  return (
    <div
      style={{
        border: `1px solid ${UI.border}`,
        borderRadius: 12,
        background: "#0b1220",
        color: "#e2e8f0",
        padding: 12,
        marginTop: 12,
      }}
    >
      <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 8 }}>
        <strong style={{ color: "#93c5fd" }}>Debug Panel</strong>
        <CButton size="sm" color="secondary" variant="outline" onClick={onClose}>
          Hide
        </CButton>
      </div>

      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <div><strong>API:</strong> <code style={{ color: "#fef08a" }}>{apiUrl}</code></div>
        <div><strong>Status:</strong> {httpStatus ?? "-"}</div>
      </div>

      <div className="mb-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#0f172a", border: `1px solid ${UI.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ padding: "6px 10px", borderBottom: `1px solid ${UI.border}` }}
          >
            <strong>Request Body</strong>
            <CButton size="sm" color="dark" onClick={() => copyText(prettyReq)}>
              Copy
            </CButton>
          </div>
          <pre style={{ margin: 0, padding: 10, fontSize: 12, maxHeight: 240, overflow: "auto" }}>{prettyReq}</pre>
        </div>

        <div style={{ background: "#0f172a", border: `1px solid ${UI.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div
            className="d-flex justify-content-between align-items-center"
            style={{ padding: "6px 10px", borderBottom: `1px solid ${UI.border}` }}
          >
            <strong>Response JSON</strong>
            <CButton size="sm" color="dark" onClick={() => copyText(prettyRes)}>
              Copy
            </CButton>
          </div>
          <pre style={{ margin: 0, padding: 10, fontSize: 12, maxHeight: 240, overflow: "auto" }}>{prettyRes}</pre>
        </div>
      </div>
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

const DBCalendar = ({ apiUrl, title = "Activities Calendar" }) => {
  const [loading, setLoading] = useState(false);
  const [raw, setRaw] = useState([]);
  const [error, setError] = useState("");
  const [viewDate, setViewDate] = useState(() => new Date());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter form + params (includes status)
  const [form, setForm] = useState({ q: "", vendor: "", status: "", startDate: "", endDate: "" });
  const [params, setParams] = useState(null);

  // ===== Debug states =====
  const [debugOpen, setDebugOpen] = useState(IS_DEBUG);
  const [lastRequestBody, setLastRequestBody] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [lastHttpStatus, setLastHttpStatus] = useState(null);

  // Build unique vendor list from data
  const vendorOptions = useMemo(() => {
    const s = new Set();
    raw.forEach((t) => { if (t?.vdrName) s.add(t.vdrName); });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [raw]);

  // Build unique status list from data
  const statusOptions = useMemo(() => {
    const s = new Set();
    raw.forEach((t) => { if (t?.actRequestStatus) s.add(String(t.actRequestStatus)); });
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

        // If response is JSON, parse it; else record text
        let payload = null;
        let text = null;
        try {
          payload = await res.json();
        } catch {
          try {
            text = await res.text();
            payload = { rawText: text };
          } catch {
            payload = null;
          }
        }
        setLastResponse(payload);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Support both {data:[...]} and plain [...]
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
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

  // Client-side fallback filter (in case backend ignores JSON body)
  const filtered = useMemo(() => {
    let arr = raw;
    if (params?.q) {
      const q = params.q.toLowerCase();
      arr = arr.filter((t) => (t?.actName || "").toLowerCase().includes(q));
    }
    if (params?.vendor) {
      arr = arr.filter((t) => t?.vdrName === params.vendor);
    }
    if (params?.status) {
      arr = arr.filter((t) => String(t?.actRequestStatus) === params.status);
    }
    if (params?.startDate) {
      arr = arr.filter((t) => (t?.actRequestDate || "") >= params.startDate);
    }
    if (params?.endDate) {
      arr = arr.filter((t) => (t?.actRequestDate || "") <= params.endDate);
    }
    return arr;
  }, [raw, params]);

  const monthStart = startOfMonth(viewDate);
  const totalDays = daysInMonth(viewDate);
  const offset = monthStart.getDay();
  const monthEnd = endOfMonth(viewDate);

  // Group items by date inside visible month
  const byDate = useMemo(() => {
    const map = new Map();
    filtered.forEach((t) => {
      if (!t?.actRequestDate) return;
      const key = toKeyDate(t.actRequestDate);
      const d = parseYmd(key);
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
  const thisMonth = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handleOpenItem = (item) => { setSelectedItem(item); setShowModal(true); };
  const handleClose = () => { setShowModal(false); setSelectedItem(null); };

  const onApplyFilters = () => {
    const payload = {
      q: form.q?.trim() || undefined,
      vendor: form.vendor || undefined,
      status: form.status || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };
    setParams(payload);
  };
  const onResetFilters = () => {
    setForm({ q: "", vendor: "", status: "", startDate: "", endDate: "" });
    setParams(null);
  };

  return (
    <CCard style={{ border: "none", borderRadius: UI.radius, boxShadow: UI.shadowCard, overflow: "hidden" }}>
      <CCardHeader
        className="d-flex justify-content-between align-items-center"
        style={{ background: UI.headerGrad, color: "#fff", border: "none" }}
      >
        <div>
          <div style={{ fontWeight: 800, letterSpacing: ".2px" }}>{title}</div>
          <div className="text-body-secondary" style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            {viewDate.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
        </div>
        <CButtonGroup>
          <CButton color="light" variant="ghost" onClick={prevMonth} style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }}>
            <CIcon icon={cilChevronLeft} /> Prev
          </CButton>
          <CButton color="light" variant="ghost" onClick={thisMonth} style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }}>
            Today
          </CButton>
          <CButton color="light" variant="ghost" onClick={nextMonth} style={{ color: "#fff", borderColor: "rgba(255,255,255,.25)" }}>
            Next <CIcon icon={cilChevronRight} />
          </CButton>
        </CButtonGroup>
      </CCardHeader>

      <CCardBody style={{ background: "#fbfcfe" }}>
        {/* FILTER BAR – single row modern look */}
        <div
          className="mb-3"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "stretch",
            flexWrap: "nowrap",
            overflowX: "auto",
            padding: 6,
            background: "#ffffff",
            borderRadius: 12,
            border: `1px solid ${UI.border}`,
            boxShadow: "0 2px 10px rgba(15,23,42,.05)",
          }}
        >
          <CInputGroup style={{ minWidth: 260, maxWidth: 360, flex: "1 1 260px" }}>
            <CInputGroupText style={{ background: "#f1f5f9", borderRight: `1px solid ${UI.border}` }}>
              <CIcon icon={cilSearch} />
            </CInputGroupText>
            <CFormInput
              placeholder="Search activity name…"
              value={form.q}
              onChange={(e) => setForm((f) => ({ ...f, q: e.target.value }))}
              style={{ borderLeft: "none" }}
            />
          </CInputGroup>

          <CFormSelect
            value={form.vendor}
            onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
            style={{ maxWidth: 220 }}
          >
            <option value="">All Vendors</option>
            {vendorOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </CFormSelect>

          <CFormSelect
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            style={{ maxWidth: 220 }}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </CFormSelect>

          <CFormInput
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            style={{ maxWidth: 180 }}
          />
          <CFormInput
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            style={{ maxWidth: 180 }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <CButton color="primary" onClick={onApplyFilters}>Apply</CButton>
            <CButton color="secondary" variant="outline" onClick={onResetFilters}>Reset</CButton>
          </div>
        </div>

        {/* Debug panel */}
        <DebugPanel
          show={debugOpen}
          apiUrl={apiUrl}
          requestBody={lastRequestBody}
          httpStatus={lastHttpStatus}
          rawJson={lastResponse}
          onClose={() => setDebugOpen(false)}
        />

        <CRow className="mb-3">
          <CCol>
            <Legend />
          </CCol>
        </CRow>

        {error && (
          <div className="mb-3">
            <CBadge color="danger" shape="rounded-pill">
              {error}
            </CBadge>
          </div>
        )}

        {/* Weekday header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 8 }}>
          {WEEKDAY_LABELS.map((w) => (
            <div
              key={w}
              style={{
                textAlign: "center",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: ".6px",
                fontSize: 11,
              }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {/* Leading blanks */}
          {Array.from({ length: offset }).map((_, i) => (
            <div
              key={`blank-${i}`}
              style={{ minHeight: 120, border: `1px dashed ${UI.border}`, background: UI.softBg, borderRadius: 12 }}
            />
          ))}

          {/* Actual days */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const key = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toISOString().slice(0, 10);
            const items = byDate.get(key) || [];
            return (
              <DayCell
                key={key}
                dayNumber={day}
                items={items}
                onItemClick={handleOpenItem}
                dateKey={key}
              />
            );
          })}
        </div>

        {loading && (
          <div className="mt-4 d-flex align-items-center" style={{ gap: 10 }}>
            <CSpinner size="sm" />
            <span className="text-body-secondary">Loading calendar…</span>
          </div>
        )}
      </CCardBody>

      {/* Details modal */}
      <CModal visible={showModal} onClose={handleClose} alignment="center" scrollable>
        <CModalHeader style={{ background: "transparent", color: "#0f172a", borderBottom: `1px solid ${UI.border}` }}>
          <CModalTitle style={{ fontWeight: 800 }}>
            {selectedItem?.actName || "Activity"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ background: "#f8fafc" }}>
          {selectedItem ? (
            <div style={{ display: "grid", rowGap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: "#fff", border: `1px solid ${UI.border}` }}>
                  Ref: <strong>{selectedItem.actRequestRefNo || "-"}</strong>
                </span>
                <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: "#fff", border: `1px solid ${UI.border}` }}>
                  {selectedItem.actRequestDate || "-"}
                </span>
                {selectedItem.actRequestStatus && (
                  <CBadge color={statusBadge(selectedItem.actRequestStatus)} shape="rounded-pill" style={{ fontSize: 11 }}>
                    {selectedItem.actRequestStatus}
                  </CBadge>
                )}
              </div>

              <div style={{ background: "#fff", border: `1px solid ${UI.border}`, borderRadius: 12, padding: 12, boxShadow: UI.shadowItem }}>
                <div style={{ display: "grid", rowGap: 6, fontSize: 13.5, color: "#0f172a" }}>
                  <div><strong>Total Students:</strong> {selectedItem.actTotalNoStudents ?? "-"}</div>
                  <div><strong>Vendor:</strong> {selectedItem.vdrName || "-"}</div>
                  <div><strong>School:</strong> {selectedItem.schName || "-"}</div>
                  <div><strong>Message:</strong> {selectedItem.actRequestMessage || "-"}</div>
                  <div><strong>Created:</strong> {selectedItem.CreatedDate || "-"}</div>
                </div>
              </div>
            </div>
          ) : null}
        </CModalBody>
        <CModalFooter style={{ background: "#f8fafc" }}>
          <CButton color="secondary" variant="outline" onClick={handleClose}>Close</CButton>
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
