// src/pages/vendor/ActivityRequestList.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CSpinner,
  CAlert,
  CBadge,
  CButton,
  CFormInput,
  CFormSelect,
  CFormLabel,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import { API_BASE_URL } from "../../config";
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsMemberShipLoginIsValid,
} from "../../utils/operation";

// 🔤 i18n packs
import enPack from "../../i18n/enloc100.json";
import arPack from "../../i18n/arloc100.json";

/**
 * ✅ API
 * http://localhost:3000/api/membership/booking/vdrgetbookingSummaryList
 */
const GET_BOOKING_SUMMARY_LIST = `${API_BASE_URL}/membership/booking/vdrgetbookingSummaryList`;

// ---------- helpers ----------
const toStr = (v) => (v ?? "").toString();

const normalizeLang = (raw) => {
  const v = (raw || "").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ar")) return "ar";
  return null;
};

const getLangNow = () => {
  try {
    const stored = normalizeLang(localStorage.getItem("heroz_lang"));
    if (stored) return stored;
  } catch {
    // ignore
  }
  const htmlLang = normalizeLang(document?.documentElement?.lang || "");
  if (htmlLang) return htmlLang;
  return "ar";
};

const useLang = () => {
  const [lang, setLang] = useState(getLangNow());

  useEffect(() => {
    const onEvt = (e) => {
      const next = normalizeLang(e?.detail?.lang);
      setLang(next || getLangNow());
    };

    window.addEventListener("heroz_lang_changed", onEvt);

    const obs = new MutationObserver(() => setLang(getLangNow()));
    if (document?.documentElement) {
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["lang"],
      });
    }

    return () => {
      window.removeEventListener("heroz_lang_changed", onEvt);
      obs.disconnect();
    };
  }, []);

  return lang;
};

const num = (v) => {
  const n = Number.parseFloat((v ?? "").toString().trim());
  return Number.isFinite(n) ? n : 0;
};

const safeUpper = (v) => (v || "").toString().trim().toUpperCase();

const parseHHMM = (timeStr) => {
  const t = (timeStr || "").trim();
  if (!t) return null;

  // accept "HH:mm" or "HH:mm:ss"
  const parts = t.split(":").map((x) => x.trim());
  if (parts.length < 2) return null;
  const hh = Number.parseInt(parts[0], 10);
  const mm = Number.parseInt(parts[1], 10);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
};

const inTimeRange = (rowTime, fromTime, toTime) => {
  const t = parseHHMM(rowTime);
  if (t == null) return true; // if empty time, don't block records
  const f = parseHHMM(fromTime);
  const to = parseHHMM(toTime);
  if (f == null && to == null) return true;
  if (f != null && t < f) return false;
  if (to != null && t > to) return false;
  return true;
};

const inDateRange = (yyyyMmDd, fromDate, toDate) => {
  const d = (yyyyMmDd || "").trim();
  if (!d) return true;

  // compare as strings "YYYY-MM-DD"
  const f = (fromDate || "").trim();
  const t = (toDate || "").trim();

  if (!f && !t) return true;
  if (f && d < f) return false;
  if (t && d > t) return false;
  return true;
};

// ✅ Amount picker: prefer TotalStarValue, else totalStarValue, else BookingStarPerKids
const pickAmount = (json) => {
  const a =
    num(json?.TotalStarValue) > 0
      ? num(json?.TotalStarValue)
      : num(json?.totalStarValue) > 0
      ? num(json?.totalStarValue)
      : num(json?.BookingStarPerKids);

  return a;
};

function mapItem(json) {
  const Amount = pickAmount(json);

  return {
    BookingID: toStr(json.BookingID),
    BookingRequestID: toStr(json.BookingRequestID),
    BookingParentsID: toStr(json.BookingParentsID),
    BookingKidsID: toStr(json.BookingKidsID),
    BookingStarPerKids: json.BookingStarPerKids,
    BookingVendorID: toStr(json.BookingVendorID),
    BookingActivityID: toStr(json.BookingActivityID),
    BookingActivityDate: toStr(json.BookingActivityDate),
    BookingActivityTime: toStr(json.BookingActivityTime),
    BookingDate: toStr(json.BookingDate),
    BookingStatus: toStr(json.BookingStatus),
    BookingStatusName: toStr(json.BookingStatusName),
    vdrName: toStr(json.vdrName),

    RegUserFullName: toStr(json.RegUserFullName),
    RegUserEmailAddress: toStr(json.RegUserEmailAddress),
    RegUserMobileNo: toStr(json.RegUserMobileNo),

    KidsName: toStr(json.KidsName),
    actName: toStr(json.actName),

    // ✅ use Amount everywhere (grid + cards + pdf)
    Amount,
  };
}

const ActivityRequestList = () => {
  const [params] = useSearchParams();

  // URL: /membership/activity-requests?status=BOOKED
  const statusParamRaw = params.get("status");
  const bookingStatusFromUrl = safeUpper(statusParamRaw); // "BOOKED" / "COMPLETED" / "ALL" / ""

  // ✅ guard
  useEffect(() => {
    IsMemberShipLoginIsValid();
  }, []);

  // 🌐 i18n
  const lang = useLang();
  const dict = lang === "ar" ? arPack : enPack;
  const t = useCallback(
    (k, fallback) =>
      Object.prototype.hasOwnProperty.call(dict, k) ? dict[k] : fallback ?? k,
    [dict]
  );

  // data
  const [items, setItems] = useState([]);
  const [apiSummary, setApiSummary] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    bookedCount: 0,
    completedCount: 0,
    statusSummary: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI states (filters)
  const [q, setQ] = useState("");
  const [activityName, setActivityName] = useState(""); // dropdown
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  // modal view
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);

  // load
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const payload = {
          BookingVendorID: getCurrentLoggedUserID(), // ✅ vendor
          page: 1,
          limit: 1000,
        };

        // ✅ optional status filter to backend as well
        if (bookingStatusFromUrl && bookingStatusFromUrl !== "ALL") {
          payload.BookingStatus = bookingStatusFromUrl;
        }

        const resp = await fetch(GET_BOOKING_SUMMARY_LIST, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const json = await resp.json();

        console.log("API payload:", payload);
        console.log("API response:", json);

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const dataObj = json?.data || {};
        const listRaw =
          (Array.isArray(dataObj?.BookingList) && dataObj.BookingList) ||
          (Array.isArray(dataObj?.data) && dataObj.data) ||
          (Array.isArray(json?.data) && json.data) ||
          [];

        const mapped = listRaw.map(mapItem);

        if (alive) {
          setItems(mapped);
          setApiSummary({
            page: Number.parseInt(dataObj?.page ?? 1, 10) || 1,
            limit: Number.parseInt(dataObj?.limit ?? 10, 10) || 10,
            totalCount: Number.parseInt(dataObj?.totalCount ?? 0, 10) || 0,
            bookedCount: Number.parseInt(dataObj?.bookedCount ?? 0, 10) || 0,
            completedCount:
              Number.parseInt(dataObj?.completedCount ?? 0, 10) || 0,
            statusSummary: Array.isArray(dataObj?.statusSummary)
              ? dataObj.statusSummary
              : [],
          });
        }
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load booking list");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bookingStatusFromUrl]);

  const activityOptions = useMemo(() => {
    const set = new Set();
    items.forEach((x) => {
      const name = (x.actName || "").trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const actSel = (activityName || "").trim();
    const urlStatus =
      bookingStatusFromUrl && bookingStatusFromUrl !== "ALL"
        ? bookingStatusFromUrl
        : "";

    return items.filter((x) => {
      // ✅ FORCE filter by URL status
      if (urlStatus) {
        const rowStatus = safeUpper(x.BookingStatusName || x.BookingStatus);
        if (rowStatus !== urlStatus) return false;
      }

      // search box
      if (qq) {
        const hay = [
          x.BookingID,
          x.BookingRequestID,
          x.actName,
          x.KidsName,
          x.RegUserMobileNo,
          x.RegUserFullName,
          x.vdrName,
          x.BookingStatus,
        ]
          .map((v) => (v || "").toString().toLowerCase())
          .join(" | ");

        if (!hay.includes(qq)) return false;
      }

      // activity dropdown
      if (actSel && (x.actName || "").trim() !== actSel) return false;

      // date range
      if (!inDateRange(x.BookingActivityDate, fromDate, toDate)) return false;

      // time range
      if (!inTimeRange(x.BookingActivityTime, fromTime, toTime)) return false;

      return true;
    });
  }, [
    items,
    q,
    activityName,
    fromDate,
    toDate,
    fromTime,
    toTime,
    bookingStatusFromUrl,
  ]);

  // ✅ Cards based on filtered
  const uiSummary = useMemo(() => {
    const total = filtered.length;
    const booked = filtered.filter(
      (x) => safeUpper(x.BookingStatusName || x.BookingStatus) === "BOOKED"
    ).length;
    const completed = filtered.filter(
      (x) => safeUpper(x.BookingStatusName || x.BookingStatus) === "COMPLETED"
    ).length;

    const totalAmount = filtered.reduce((sum, x) => sum + num(x.Amount), 0);

    return { total, booked, completed, totalAmount };
  }, [filtered]);

  const resetFilters = () => {
    setQ("");
    setActivityName("");
    setFromDate("");
    setToDate("");
    setFromTime("");
    setToTime("");
  };

  // ---------- PDF (print) ----------
  const buildPrintHtml = (rows, title) => {
    const esc = (s) =>
      (s ?? "")
        .toString()
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    const now = new Date().toLocaleString();

    const header = `
      <div class="hdr">
        <div class="ttl">${esc(title)}</div>
        <div class="meta">
          <div><b>${esc(t("report.total", "Total"))}:</b> ${rows.length}</div>
          <div><b>${esc(
            t("report.total_amount", "Total Amount")
          )}:</b> ${rows.reduce((s, r) => s + num(r.Amount), 0).toFixed(2)}</div>
          <div class="dt">${esc(now)}</div>
        </div>
      </div>
    `;

    const thead = `
      <tr>
        <th>#</th>
        <th>${esc(t("grid.booking_id", "BookingID"))}</th>
        <th>${esc(t("grid.activity_name", "Activity"))}</th>
        <th>${esc(t("grid.activity_date", "Date"))}</th>
        <th>${esc(t("grid.activity_time", "Time"))}</th>
        <th>${esc(t("grid.kid_name", "KidsName"))}</th>
        <th>${esc(t("grid.mobile", "MobileNo"))}</th>
        <th>${esc(t("grid.booking_date", "Created Date"))}</th>
        <th>${esc(t("grid.status", "Status"))}</th>
        <th>${esc(t("grid.amount", "Amount"))}</th>
      </tr>
    `;

    const tbody = rows
      .map((r, idx) => {
        return `
          <tr>
            <td>${idx + 1}</td>
            <td><b>${esc(r.BookingID || "-")}</b></td>
            <td>${esc(r.actName)}</td>
            <td>${esc(r.BookingActivityDate)}</td>
            <td>${esc(r.BookingActivityTime)}</td>
            <td>${esc(r.KidsName)}</td>
            <td>${esc(r.RegUserMobileNo)}</td>
            <td>${esc(r.BookingDate)}</td>
            <td>${esc(r.BookingStatusName || r.BookingStatus)}</td>
            <td style="text-align:right">${num(r.Amount).toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${esc(title)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 18px; }
            .hdr { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:14px; }
            .ttl { font-size: 18px; font-weight: 800; }
            .meta { font-size: 12px; text-align:right; color:#333; }
            .meta .dt { margin-top: 4px; color:#666; }
            table { width:100%; border-collapse: collapse; }
            th, td { border: 1px solid #e6e6e6; padding: 8px; font-size: 12px; }
            th { background: #f7f7f7; text-align:left; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${header}
          <table>
            <thead>${thead}</thead>
            <tbody>${tbody}</tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 300);
            }
          </script>
        </body>
      </html>
    `;
  };

  const exportAllPdf = () => {
    const html = buildPrintHtml(
      filtered,
      t("report.title", "Static Report - Bookings")
    );
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const exportRowPdf = (row) => {
    const html = buildPrintHtml(
      [row],
      `${t("report.row_title", "Booking")} - ${
        row.BookingID || row.BookingRequestID || ""
      }`
    );
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const pageTitle = useMemo(() => {
    const s =
      bookingStatusFromUrl && bookingStatusFromUrl !== "ALL"
        ? bookingStatusFromUrl
        : "";
    return s
      ? `${t("page.title_activity_requests", "Activity Requests")} - ${s}`
      : t("page.title_activity_requests", "Activity Requests");
  }, [bookingStatusFromUrl, t]);

  return (
    <div className="container-fluid py-4">
      <CRow className="justify-content-center">
        <CCol xs={12} xl={11}>
          {/* Header */}
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
            <div>
              <div className="fw-bold" style={{ fontSize: 18 }}>
                {pageTitle}
              </div>

              {/* ✅ REMOVED:
                  - Search, filter, and export booking report.
                  - API total: X · Grid total: Y
               */}
            </div>

            <div className="d-flex align-items-center gap-2">
              <CButton color="dark" variant="outline" onClick={exportAllPdf}>
                📄 {t("actions.export_pdf", "Export PDF")}
              </CButton>
              <CBadge color="secondary" shape="rounded-pill">
                {uiSummary.total}
              </CBadge>
            </div>
          </div>

          {/* Cards */}
          <CRow className="g-3 mb-3">
            <CCol xs={12} md={6} xl={3}>
              <CCard className="shadow-sm h-100" style={{ borderRadius: 14 }}>
                <CCardBody>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t("report.total", "Total")}
                  </div>
                  <div className="fw-bold" style={{ fontSize: 22 }}>
                    {uiSummary.total}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3}>
              <CCard className="shadow-sm h-100" style={{ borderRadius: 14 }}>
                <CCardBody>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t("report.booked", "Booked")}
                  </div>
                  <div className="fw-bold" style={{ fontSize: 22 }}>
                    {uiSummary.booked}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3}>
              <CCard className="shadow-sm h-100" style={{ borderRadius: 14 }}>
                <CCardBody>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t("report.completed", "Completed")}
                  </div>
                  <div className="fw-bold" style={{ fontSize: 22 }}>
                    {uiSummary.completed}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12} md={6} xl={3}>
              <CCard className="shadow-sm h-100" style={{ borderRadius: 14 }}>
                <CCardBody>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {t("report.total_amount", "Total Amount")}
                  </div>
                  <div className="fw-bold" style={{ fontSize: 22 }}>
                    {uiSummary.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-muted" style={{ fontSize: 11 }}>
                    {t("report.filtered_note", "Based on current filters")}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Filters */}
          <CCard className="shadow-sm mb-3" style={{ borderRadius: 14 }}>
            <CCardHeader
              className="bg-white"
              style={{ borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="fw-bold">{t("filters.title", "Filters")}</div>
                <div className="d-flex gap-2">
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                  >
                    ↩ {t("actions.reset", "Reset")}
                  </CButton>
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3 align-items-end">
                <CCol xs={12} md={6} xl={3}>
                  <CFormLabel className="text-muted" style={{ fontSize: 12 }}>
                    {t("filters.search", "Search")}
                  </CFormLabel>
                  <CFormInput
                    placeholder={t(
                      "filters.search_ph",
                      "Search by activity, kid, mobile, booking id..."
                    )}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </CCol>

                <CCol xs={12} md={6} xl={3}>
                  <CFormLabel className="text-muted" style={{ fontSize: 12 }}>
                    {t("filters.activity_name", "Activity Name")}
                  </CFormLabel>
                  <CFormSelect
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                  >
                    <option value="">{t("filters.all", "All")}</option>
                    {activityOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={6} xl={2}>
                  <CFormLabel className="text-muted" style={{ fontSize: 12 }}>
                    {t("filters.from_date", "From Date")}
                  </CFormLabel>
                  <CFormInput
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </CCol>

                <CCol xs={12} md={6} xl={2}>
                  <CFormLabel className="text-muted" style={{ fontSize: 12 }}>
                    {t("filters.to_date", "To Date")}
                  </CFormLabel>
                  <CFormInput
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </CCol>

                <CCol xs={12} md={6} xl={1}>
                  <CFormLabel className="text-muted" style={{ fontSize: 12 }}>
                    {t("filters.from_time", "From Time")}
                  </CFormLabel>
                  <CFormInput
                    type="time"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                  />
                </CCol>

                <CCol xs={12} md={6} xl={1}>
                  <CFormLabel className="text-muted" style={{ fontSize: 12 }}>
                    {t("filters.to_time", "To Time")}
                  </CFormLabel>
                  <CFormInput
                    type="time"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                  />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Grid */}
          <CCard className="shadow-sm" style={{ borderRadius: 14 }}>
            <CCardHeader
              className="bg-white"
              style={{ borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
            >
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="fw-bold">{t("grid.title", "Bookings Grid")}</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {t("grid.showing", "Showing")} <b>{filtered.length}</b>{" "}
                  {t("grid.records", "records")}
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              {loading && (
                <div className="text-center py-5">
                  <CSpinner />
                </div>
              )}

              {!loading && error && <CAlert color="danger">{error}</CAlert>}

              {!loading && !error && filtered.length === 0 && (
                <div className="text-center text-muted py-4 fw-bold">
                  {t("list.no_activity_found", "No activity requests found")}
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <div className="table-responsive">
                  <CTable hover className="align-middle" style={{ minWidth: 1200 }}>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell scope="col">#</CTableHeaderCell>

                        <CTableHeaderCell scope="col">
                          {t("grid.booking_id", "BookingID")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col">
                          {t("grid.activity_name", "actName")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col">
                          {t("grid.activity_date", "Date")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col">
                          {t("grid.activity_time", "Time")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col">
                          {t("grid.kid_name", "KidsName")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col">
                          {t("grid.mobile", "MobileNo")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col">
                          {t("grid.booking_date", "Created Date")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col">
                          {t("grid.status", "Status")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col" className="text-end">
                          {t("grid.amount", "Amount")}
                        </CTableHeaderCell>

                        <CTableHeaderCell scope="col" className="text-center">
                          👁️
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="text-center">
                          📄
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {filtered.map((r, idx) => (
                        <CTableRow key={r.BookingID || r.BookingRequestID || idx}>
                          <CTableDataCell>{idx + 1}</CTableDataCell>
                          <CTableDataCell className="fw-bold">{r.BookingID || "-"}</CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-semibold">{(r.actName || "-").trim()}</div>
                          </CTableDataCell>
                          <CTableDataCell>{r.BookingActivityDate || "-"}</CTableDataCell>
                          <CTableDataCell>{r.BookingActivityTime || "-"}</CTableDataCell>
                          <CTableDataCell>{r.KidsName || "-"}</CTableDataCell>
                          <CTableDataCell>{r.RegUserMobileNo || "-"}</CTableDataCell>
                          <CTableDataCell>{r.BookingDate || "-"}</CTableDataCell>
                          <CTableDataCell>{r.BookingStatusName || r.BookingStatus || "-"}</CTableDataCell>
                          <CTableDataCell className="text-end fw-bold">{num(r.Amount).toFixed(2)}</CTableDataCell>

                          <CTableDataCell className="text-center">
                            <CButton
                              color="dark"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setViewRow(r);
                                setViewOpen(true);
                              }}
                              title={t("actions.view", "View")}
                            >
                              👁️
                            </CButton>
                          </CTableDataCell>

                          <CTableDataCell className="text-center">
                            <CButton
                              color="primary"
                              variant="outline"
                              size="sm"
                              onClick={() => exportRowPdf(r)}
                              title={t("actions.pdf", "PDF")}
                            >
                              📄
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              )}
            </CCardBody>
          </CCard>

          {/* View Modal */}
          <CModal visible={viewOpen} onClose={() => setViewOpen(false)} alignment="center" size="lg">
            <CModalHeader>
              <CModalTitle>{t("modal.details", "Booking Details")}</CModalTitle>
            </CModalHeader>
            <CModalBody>
              {!viewRow ? null : (
                <div className="d-flex flex-column" style={{ gap: 10 }}>
                  <div className="p-3 border rounded" style={{ borderRadius: 14 }}>
                    <div className="fw-bold" style={{ fontSize: 16 }}>
                      {(viewRow.actName || "-").trim()}
                    </div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {t("grid.booking_id", "BookingID")}: <b>{viewRow.BookingID || "-"}</b>
                      {" · "}
                      {t("grid.request_id", "BookingRequestID")}: <b>{viewRow.BookingRequestID || "-"}</b>
                    </div>
                  </div>

                  <CRow className="g-3">
                    <CCol md={6}>
                      <div className="p-3 border rounded" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.activity_date", "Date")}
                        </div>
                        <div className="fw-bold">{viewRow.BookingActivityDate || "-"}</div>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="p-3 border rounded" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.activity_time", "Time")}
                        </div>
                        <div className="fw-bold">{viewRow.BookingActivityTime || "-"}</div>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="p-3 border rounded" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.kid_name", "KidsName")}
                        </div>
                        <div className="fw-bold">{viewRow.KidsName || "-"}</div>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="p-3 border rounded" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.mobile", "MobileNo")}
                        </div>
                        <div className="fw-bold">{viewRow.RegUserMobileNo || "-"}</div>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="p-3 border rounded" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.booking_date", "Created Date")}
                        </div>
                        <div className="fw-bold">{viewRow.BookingDate || "-"}</div>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="p-3 border rounded" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.amount", "Amount")}
                        </div>
                        <div className="fw-bold">{num(viewRow.Amount).toFixed(2)}</div>
                      </div>
                    </CCol>

                    <CCol md={12}>
                      <div className="p-3 border rounded" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.status", "Status")}
                        </div>
                        <div className="fw-bold">
                          {viewRow.BookingStatusName || viewRow.BookingStatus || "-"}
                        </div>
                      </div>
                    </CCol>
                  </CRow>
                </div>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton color="primary" variant="outline" onClick={() => viewRow && exportRowPdf(viewRow)}>
                📄 {t("actions.export_pdf", "Export PDF")}
              </CButton>
              <CButton color="secondary" onClick={() => setViewOpen(false)}>
                {t("actions.close", "Close")}
              </CButton>
            </CModalFooter>
          </CModal>
        </CCol>
      </CRow>
    </div>
  );
};

export default ActivityRequestList;