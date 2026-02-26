// src/pages/vendor/ActivityRequestList.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CRow,
  CCol,
  CSpinner,
  CAlert,
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
  if (t == null) return true;
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

  const f = (fromDate || "").trim();
  const t = (toDate || "").trim();

  if (!f && !t) return true;
  if (f && d < f) return false;
  if (t && d > t) return false;
  return true;
};

const pickAmount = (json) => {
  const a =
    num(json?.TotalStarValue) > 0
      ? num(json?.TotalStarValue)
      : num(json?.totalStarValue) > 0
      ? num(json?.totalStarValue)
      : num(json?.BookingStarPerKids);
  return a;
};

const dateOnly = (val) => {
  const s = (val ?? "").toString().trim();
  if (!s) return "";
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return s;
};

const fmtAmount = (v) => {
  const n = num(v);
  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
};

const dateTimeOneLine = (dateStr, timeStr) => {
  const d = (dateStr || "").trim();
  const t = (timeStr || "").trim();
  if (d && t) return `${d} ${t}`;
  if (d) return d;
  if (t) return t;
  return "-";
};

function mapItem(json) {
  const Amount = pickAmount(json);

  return {
    BookingID: toStr(json.BookingID),
    BookingRequestID: toStr(json.BookingRequestID),
    BookingParentsID: toStr(json.BookingParentsID),
    BookingKidsID: toStr(json.BookingKidsID),
    BookingVendorID: toStr(json.BookingVendorID),
    BookingActivityID: toStr(json.BookingActivityID),
    BookingActivityDate: toStr(json.BookingActivityDate),
    BookingActivityTime: toStr(json.BookingActivityTime),
    BookingDate: toStr(json.BookingDate),
    BookingStatus: toStr(json.BookingStatus),
    BookingStatusName: toStr(json.BookingStatusName),

    // ✅ keep modal data
    RegUserMobileNo: toStr(json.RegUserMobileNo),

    KidsName: toStr(json.KidsName),
    actName: toStr(json.actName),

    Amount,
  };
}

const ActivityRequestList = () => {
  const [params] = useSearchParams();

  // URL: /membership/activity-requests?status=BOOKED
  const statusParamRaw = params.get("status");
  const bookingStatusFromUrl = safeUpper(statusParamRaw);

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI states (filters)
  const [q, setQ] = useState("");
  const [activityName, setActivityName] = useState("");
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
          BookingVendorID: getCurrentLoggedUserID(),
          page: 1,
          limit: 1000,
        };

        if (bookingStatusFromUrl && bookingStatusFromUrl !== "ALL") {
          payload.BookingStatus = bookingStatusFromUrl;
        }

        const resp = await fetch(GET_BOOKING_SUMMARY_LIST, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const json = await resp.json();
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const dataObj = json?.data || {};
        const listRaw =
          (Array.isArray(dataObj?.BookingList) && dataObj.BookingList) ||
          (Array.isArray(dataObj?.data) && dataObj.data) ||
          (Array.isArray(json?.data) && json.data) ||
          [];

        const mapped = listRaw.map(mapItem);
        if (alive) setItems(mapped);
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
      if (urlStatus) {
        const rowStatus = safeUpper(x.BookingStatusName || x.BookingStatus);
        if (rowStatus !== urlStatus) return false;
      }

      if (qq) {
        const hay = [x.BookingID, x.actName, x.KidsName, x.RegUserMobileNo]
          .map((v) => (v || "").toString().toLowerCase())
          .join(" | ");
        if (!hay.includes(qq)) return false;
      }

      if (actSel && (x.actName || "").trim() !== actSel) return false;
      if (!inDateRange(x.BookingActivityDate, fromDate, toDate)) return false;
      if (!inTimeRange(x.BookingActivityTime, fromTime, toTime)) return false;

      return true;
    });
  }, [items, q, activityName, fromDate, toDate, fromTime, toTime, bookingStatusFromUrl]);

  const uiSummary = useMemo(() => {
    const bookedCount =
      bookingStatusFromUrl === "BOOKED" ||
      !bookingStatusFromUrl ||
      bookingStatusFromUrl === "ALL"
        ? filtered.filter(
            (x) => safeUpper(x.BookingStatusName || x.BookingStatus) === "BOOKED"
          ).length
        : filtered.length;

    const totalAmount = filtered.reduce((sum, x) => sum + num(x.Amount), 0);

    return { booked: bookedCount, totalAmount };
  }, [filtered, bookingStatusFromUrl]);

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
          <div><b>${esc(t("report.booked", "Booked"))}:</b> ${rows.length}</div>
          <div><b>${esc(t("report.total_amount", "Total Amount"))}:</b> ${rows
            .reduce((s, r) => s + num(r.Amount), 0)
            .toFixed(2)}</div>
          <div class="dt">${esc(now)}</div>
        </div>
      </div>
    `;

    const thead = `
      <tr>
        <th>#</th>
        <th>${esc(t("grid.booking_id", "BookingID"))}</th>
        <th>${esc(t("grid.activity_name", "ActName"))}</th>
        <th>${esc(t("grid.kid_name", "KidName"))}</th>
        <th>${esc(t("grid.activity_date", "Date/Time"))}</th>
        <th>${esc(t("grid.booking_date", "Created Date"))}</th>
        <th style="text-align:right">${esc(t("grid.amount", "Amount"))}</th>
      </tr>
    `;

    const tbody = rows
      .map((r, idx) => {
        const dt = dateTimeOneLine(r.BookingActivityDate, r.BookingActivityTime);
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${esc(r.BookingID || "-")}</td>
            <td>${esc(r.actName || "-")}</td>
            <td>${esc(r.KidsName || "-")}</td>
            <td>${esc(dt)}</td>
            <td>${esc(dateOnly(r.BookingDate) || "-")}</td>
            <td style="text-align:right">${esc(num(r.Amount).toFixed(2))}</td>
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
            body { font-family: Arial, sans-serif; padding: 14px; }
            .hdr { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:10px; }
            .ttl { font-size: 16px; font-weight: 800; }
            .meta { font-size: 12px; text-align:right; color:#333; }
            .meta .dt { margin-top: 4px; color:#666; }
            table { width:100%; border-collapse: collapse; }
            th, td { border: 1px solid #ededed; padding: 8px; font-size: 12px; }
            th { background: #ffffff; text-align:left; font-weight:800; }
            tr:nth-child(even) td { background: #f8fafc; }
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
    const html = buildPrintHtml(filtered, t("report.title", "Activity Requests"));
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

  // ✅ Icon (document/details)
  const DetailsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 7h8M8 11h8M8 15h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.5 3.5h11A2.5 2.5 0 0 1 20 6v12a2.5 2.5 0 0 1-2.5 2.5H9l-4.5-4.5V6A2.5 2.5 0 0 1 6.5 3.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="container-fluid py-3">
      <style>{`
        .hrz-topbar{ display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px; }
        .hrz-title{ font-weight:900; font-size:18px; line-height:1.2; }

        .hrz-chips{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .hrz-chip{
          display:inline-flex; align-items:center;
          padding:6px 12px; border-radius:999px;
          font-size:12px; font-weight:800;
          border:1px solid rgba(0,0,0,0.08);
          background: #f7f7fb;
          white-space: nowrap;
        }
        .hrz-chip--green{ background: rgba(25,135,84,0.12); border-color: rgba(25,135,84,0.18); }
        .hrz-chip--blue{ background: rgba(13,110,253,0.10); border-color: rgba(13,110,253,0.18); }

        .hrz-actions{ display:flex; align-items:center; gap:8px; }

        .hrz-card{
          border-radius:16px !important;
          overflow:hidden;
          border:1px solid rgba(0,0,0,0.08);
          box-shadow: 0 10px 28px rgba(0,0,0,0.05);
          background:#fff;
        }

        .hrz-filters{
          display:grid;
          grid-template-columns: 1.2fr 1fr 0.9fr 0.9fr 0.75fr 0.75fr auto;
          gap:10px;
          align-items:end;
          width:100%;
        }
        @media (max-width: 1200px){
          .hrz-filters{ grid-template-columns: 1.1fr 1fr 1fr 1fr 0.8fr 0.8fr auto; }
        }
        @media (max-width: 992px){
          .hrz-filters{ grid-template-columns: 1fr 1fr; }
        }

        .hrz-label{
          font-size:11px;
          margin-bottom:4px;
          color: rgba(0,0,0,0.60);
          font-weight:800;
        }
        .hrz-input, .hrz-select{
          border-radius:10px !important;
          height:36px;
          font-weight:400 !important;
        }
        .hrz-resetbtn{
          border-radius:10px !important;
          height:36px;
          white-space: nowrap;
        }

        .hrz-table{
          border-radius:14px;
          overflow:hidden;
          margin-bottom:0;
          border: 1px solid rgba(0,0,0,0.08);
        }
        .hrz-table thead th{
          background:#ffffff;
          font-size:12px;
          font-weight:900;
          color: rgba(0,0,0,0.72);
          border-bottom: 1px solid rgba(0,0,0,0.10) !important;
          white-space: nowrap;
          padding: 10px 12px;
        }
        .hrz-table tbody td{
          border-top: 1px solid rgba(0,0,0,0.06);
          padding: 10px 12px;
          vertical-align: middle;
          font-weight:400 !important;
          line-height: 1.2;
        }
        .hrz-table tbody tr:nth-child(odd) td{ background:#ffffff; }
        .hrz-table tbody tr:nth-child(even) td{ background:#f8fafc; }

        .hrz-serial{
          width:26px; height:26px;
          border-radius:999px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          font-size:12px;
          border: 1px solid rgba(0,0,0,0.10);
          background: rgba(0,0,0,0.03);
          color: rgba(0,0,0,0.70);
        }

        .hrz-iconBtn{
          width:34px; height:34px;
          border-radius:10px !important;
          padding:0 !important;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          border:1px solid rgba(13,110,253,0.35) !important;
          color: rgba(13,110,253,0.95) !important;
          background: rgba(13,110,253,0.08) !important;
        }
        .hrz-iconBtn:hover{ background: rgba(13,110,253,0.12) !important; }

        .hrz-dtline{ white-space: nowrap; font-weight:400; }

        .hrz-idBadge{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 6px 12px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 12px;
          border: 1px solid rgba(13,110,253,0.25);
          background: rgba(13,110,253,0.10);
          color: rgba(13,110,253,0.95);
        }
        .hrz-modalHeaderBox{
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(13,110,253,0.10), rgba(0,0,0,0.00));
        }
      `}</style>

      <CRow className="justify-content-center">
        <CCol xs={12} xl={11}>
          {/* Top row */}
          <div className="hrz-topbar">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="hrz-title">{pageTitle}</div>

              <div className="hrz-chips">
                <span className="hrz-chip hrz-chip--green">
                  {t("report.booked", "Booked")}: {uiSummary.booked}
                </span>
                <span className="hrz-chip hrz-chip--blue">
                  {t("report.total_amount", "Total Amount")}: {fmtAmount(uiSummary.totalAmount)}
                </span>
              </div>
            </div>

            <div className="hrz-actions">
              <CButton
                color="dark"
                variant="outline"
                size="sm"
                style={{ borderRadius: 10, height: 34 }}
                onClick={exportAllPdf}
              >
                📄 {t("actions.export_pdf", "Export PDF")}
              </CButton>
            </div>
          </div>

          {/* Filters */}
          <CCard className="hrz-card mb-3">
            <CCardBody className="py-2">
              <div className="hrz-filters">
                <div>
                  <div className="hrz-label">{t("filters.search", "Search")}</div>
                  <CFormInput
                    className="hrz-input"
                    placeholder={t("filters.search_ph", "Search...")}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                <div>
                  <div className="hrz-label">{t("filters.activity_name", "Activity")}</div>
                  <CFormSelect
                    className="hrz-select"
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
                </div>

                <div>
                  <div className="hrz-label">{t("filters.from_date", "From")}</div>
                  <CFormInput
                    className="hrz-input"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="hrz-label">{t("filters.to_date", "To")}</div>
                  <CFormInput
                    className="hrz-input"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>

                <div>
                  <div className="hrz-label">{t("filters.from_time", "From")}</div>
                  <CFormInput
                    className="hrz-input"
                    type="time"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                  />
                </div>

                <div>
                  <div className="hrz-label">{t("filters.to_time", "To")}</div>
                  <CFormInput
                    className="hrz-input"
                    type="time"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <CButton
                    color="secondary"
                    variant="outline"
                    size="sm"
                    className="hrz-resetbtn"
                    onClick={resetFilters}
                  >
                    Reset
                  </CButton>
                </div>
              </div>
            </CCardBody>
          </CCard>

          {/* Grid */}
          <CCard className="hrz-card">
            <CCardBody className="pt-2">
              {loading && (
                <div className="text-center py-4">
                  <CSpinner />
                </div>
              )}

              {!loading && error && <CAlert color="danger">{error}</CAlert>}

              {!loading && !error && filtered.length === 0 && (
                <div className="text-center text-muted py-4">
                  {t("list.no_activity_found", "No activity requests found")}
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <div className="table-responsive">
                  <CTable hover className="align-middle hrz-table" style={{ minWidth: 980 }}>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell scope="col" style={{ width: 60 }}>
                          #
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ width: 140 }}>
                          {t("grid.booking_id", "BookingID")}
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ width: 220 }}>
                          {t("grid.activity_name", "ActName")}
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ width: 220 }}>
                          {t("grid.kid_name", "KidName")}
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ width: 200 }}>
                          {t("grid.activity_date", "Date / Time")}
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" style={{ width: 150 }}>
                          {t("grid.booking_date", "Created Date")}
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="text-end" style={{ width: 140 }}>
                          {t("grid.amount", "Amount")}
                        </CTableHeaderCell>
                        <CTableHeaderCell scope="col" className="text-center" style={{ width: 90 }}>
                          {t("grid.actions", "Actions")}
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {filtered.map((r, idx) => (
                        <CTableRow key={r.BookingID || r.BookingRequestID || idx}>
                          <CTableDataCell>
                            <span className="hrz-serial">{idx + 1}</span>
                          </CTableDataCell>

                          <CTableDataCell>{r.BookingID || "-"}</CTableDataCell>
                          <CTableDataCell>{(r.actName || "-").trim()}</CTableDataCell>
                          <CTableDataCell>{r.KidsName || "-"}</CTableDataCell>

                          <CTableDataCell className="hrz-dtline">
                            {dateTimeOneLine(r.BookingActivityDate, r.BookingActivityTime)}
                          </CTableDataCell>

                          <CTableDataCell>{dateOnly(r.BookingDate) || "-"}</CTableDataCell>
                          <CTableDataCell className="text-end">{fmtAmount(r.Amount)}</CTableDataCell>

                          <CTableDataCell className="text-center">
                            <CButton
                              color="primary"
                              variant="outline"
                              size="sm"
                              className="hrz-iconBtn"
                              onClick={() => {
                                setViewRow(r);
                                setViewOpen(true);
                              }}
                              title={t("actions.view", "Details")}
                            >
                              <DetailsIcon />
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
                  <div className="p-3 border hrz-modalHeaderBox">
                    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                      <div style={{ fontSize: 16, fontWeight: 800 }}>
                        {(viewRow.actName || "-").trim()}
                      </div>

                      <div className="hrz-idBadge">
                        {t("grid.booking_id", "BookingID")}: {viewRow.BookingID || "-"}
                      </div>
                    </div>
                  </div>

                  <CRow className="g-2">
                    <CCol md={6}>
                      <div className="p-3 border" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.activity_date", "Date / Time")}
                        </div>
                        <div>
                          {dateTimeOneLine(viewRow.BookingActivityDate, viewRow.BookingActivityTime)}
                        </div>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="p-3 border" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.kid_name", "KidName")}
                        </div>
                        <div>{viewRow.KidsName || "-"}</div>
                      </div>
                    </CCol>

                    {/* ✅ NEW: Mobile No in Modal */}
                    <CCol md={6}>
                      <div className="p-3 border" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.mobile", "MobileNo")}
                        </div>
                        <div>{viewRow.RegUserMobileNo || "-"}</div>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="p-3 border" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.booking_date", "Created Date")}
                        </div>
                        <div>{dateOnly(viewRow.BookingDate) || "-"}</div>
                      </div>
                    </CCol>

                    <CCol md={6}>
                      <div className="p-3 border" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.amount", "Amount")}
                        </div>
                        <div>{fmtAmount(viewRow.Amount)}</div>
                      </div>
                    </CCol>

                    <CCol md={12}>
                      <div className="p-3 border" style={{ borderRadius: 14 }}>
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {t("grid.status", "Status")}
                        </div>
                        <div>{viewRow.BookingStatusName || viewRow.BookingStatus || "-"}</div>
                      </div>
                    </CCol>
                  </CRow>
                </div>
              )}
            </CModalBody>

            <CModalFooter>
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