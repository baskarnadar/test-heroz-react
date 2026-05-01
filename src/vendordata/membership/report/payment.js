// src/membership/booking/MspBookedList.js
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CSpinner,
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CBadge,
  CFormSelect,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilQrCode,
  cilPeople,
  cilCalendar,
  cilClock,
  cilPhone,
  cilChild,
  cilInstitution,
  cilMoney,
  cilX,
  cilReload,
  cilCheckCircle,
  cilSearch,
  cilList,
} from "@coreui/icons";
import { API_BASE_URL } from "../../../config";
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsVendorLoginIsValid,
} from "../../../utils/operation";
import "./../../../scss/style.css";//
import enPack from "../../../i18n/enloc100.json";
import arPack from "../../../i18n/arloc100.json";

// ─── Lang hook ────────────────────────────────────────────────────────────────
const normalizeLang = (raw) => {
  const v = (raw || "").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ar")) return "ar";
  return null;
};

const getLangNow = () => {
  try {
    const s = normalizeLang(localStorage.getItem("heroz_lang"));
    if (s) return s;
  } catch {}
  const h = normalizeLang(document?.documentElement?.lang || "");
  if (h) return h;
  return "ar";
};

const useLang = () => {
  const [lang, setLang] = useState(getLangNow());

  useEffect(() => {
    const onEvt = (e) => {
      const n = normalizeLang(e?.detail?.lang);
      setLang(n || getLangNow());
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toStr = (v) => (v ?? "").toString();

const valOrDash = (v) => {
  const s = toStr(v).trim();
  return s || "–";
};

const escapeHtml = (v) =>
  toStr(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatMoney = (v) => {
  const n = toNumber(v, 0);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function mapBookingRow(m) {
  let activityPrice = "";
  let vendorPrice = {};

  try {
    vendorPrice = m["VendorPrice"] && typeof m["VendorPrice"] === "object" ? m["VendorPrice"] : {};
    activityPrice = toStr(vendorPrice["Price"] ?? "").trim();

    // ✅ Fallback for old API response if VendorPrice is not available yet
    if (!activityPrice) {
      const list = m["ActivityPrice"];
      if (Array.isArray(list) && list.length > 0) {
        activityPrice = toStr(list[0]["Price"] ?? "").trim();
      }
    }
  } catch {}

  return {
    bookingId: toStr(m["BookingID"]),
    requestId: toStr(m["BookingRequestID"]),
    parentsId: toStr(m["BookingParentsID"]),
    kidsId: toStr(m["BookingKidsID"]),
    vendorId: toStr(m["BookingVendorID"]),
    activityId: toStr(m["BookingActivityID"]),
    activityDate: toStr(m["BookingActivityDate"]),
    activityTime: toStr(m["BookingActivityTime"]),
    bookingDate: toStr(m["BookingDate"]),
    activityPrice,
    vendorPrice,
    parentName: toStr(m["RegUserFullName"]),
    parentEmail: toStr(m["RegUserEmailAddress"]),
    parentMobile: toStr(m["RegUserMobileNo"]),
    kidsName: toStr(m["KidsName"]),
    actName: toStr(m["actName"]),
    vdrName: toStr(m["vdrName"]),
    bookingStatus: toStr(m["BookingStatus"] ?? m["bookingStatus"] ?? ""),
    totalPresent: toNumber(m["TotalPresent"] ?? m["totalPresent"] ?? m["PresentCount"] ?? 0),
    totalAbsense: toNumber(
      m["TotalAbsense"] ??
        m["TotalAbsence"] ??
        m["totalAbsense"] ??
        m["totalAbsence"] ??
        m["AbsenseCount"] ??
        m["AbsenceCount"] ??
        0
    ),
    vendorCost: toNumber(
      m["VendorCost"] ??
        m["vendorCost"] ??
        m["TotalVendorCost"] ??
        m["totalVendorCost"] ??
        activityPrice ??
        0
    ),
    raw: m,
  };
}

// ─── Detail Tile ──────────────────────────────────────────────────────────────
function DetailTile({ icon, label, value, fullWidth = false }) {
  return (
    <div className={`msp-detail-tile ${fullWidth ? "msp-detail-tile-full" : ""}`}>
      <div className="msp-detail-tile-icon-wrap">
        <CIcon icon={icon} className="msp-detail-tile-icon" />
      </div>
      <div className="msp-detail-tile-text">
        <div className="msp-detail-tile-label">{label}</div>
        <div className="msp-detail-tile-value">{value || "–"}</div>
      </div>
    </div>
  );
}

// ─── Booking Detail Side Window ───────────────────────────────────────────────
function BookingDetailModal({ row, isRTL, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const amount = row.activityPrice.trim() ? formatMoney(row.activityPrice) : "–";
  const cleanDate = valOrDash(row.activityDate);
  const cleanTime = valOrDash(row.activityTime);
  const cleanBookingDate = valOrDash(row.bookingDate);

  return (
    <div
      className={`msp-side-backdrop ${isRTL ? "vdr-rtl" : ""}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`msp-side-panel ${isRTL ? "vdr-rtl msp-side-panel-rtl" : ""}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="msp-side-header">
          <div className="msp-side-header-left">
            <div className="msp-side-header-icon">
              <CIcon icon={cilQrCode} className="msp-side-header-icon-svg" />
            </div>
            <div>
              <div className="msp-side-kicker">
                {isRTL ? "تفاصيل العضوية" : "MEMBERSHIP BOOKING"}
              </div>
              <div className="msp-side-title">{isRTL ? "تفاصيل الحجز" : "Booking Details"}</div>
            </div>
          </div>
          <button className="msp-side-close-btn" onClick={onClose} aria-label="Close">
            <CIcon icon={cilX} />
          </button>
        </div>

        <div className="msp-side-body">
          <div className="msp-side-activity-card">
            <div className="msp-side-activity-top">
              <div>
                <div className="msp-side-activity-label">{isRTL ? "النشاط" : "Activity"}</div>
                <div className="msp-side-activity-name">{valOrDash(row.actName)}</div>
              </div>
              <StatusBadge status={row.bookingStatus} isRTL={isRTL} />
            </div>

            <div className="msp-side-booking-id-row">
              <span>{isRTL ? "رقم الحجز" : "Booking ID"}</span>
              <strong>{valOrDash(row.bookingId)}</strong>
            </div>
          </div>

          <div className="msp-side-section-title">{isRTL ? "التاريخ والوقت" : "Date & Time"}</div>
          <div className="msp-side-datetime-grid">
            <div className="msp-side-datetime-card msp-side-datetime-date">
              <div className="msp-side-datetime-icon">
                <CIcon icon={cilCalendar} />
              </div>
              <div>
                <div className="msp-side-datetime-label">
                  {isRTL ? "تاريخ النشاط" : "Activity Date"}
                </div>
                <div className="msp-side-datetime-value">{cleanDate}</div>
              </div>
            </div>

            <div className="msp-side-datetime-card msp-side-datetime-time">
              <div className="msp-side-datetime-icon">
                <CIcon icon={cilClock} />
              </div>
              <div>
                <div className="msp-side-datetime-label">
                  {isRTL ? "وقت النشاط" : "Activity Time"}
                </div>
                <div className="msp-side-datetime-value">{cleanTime}</div>
              </div>
            </div>

            <div className="msp-side-datetime-card msp-side-datetime-full">
              <div className="msp-side-datetime-icon">
                <CIcon icon={cilCalendar} />
              </div>
              <div>
                <div className="msp-side-datetime-label">
                  {isRTL ? "تاريخ إنشاء الحجز" : "Booking Created Date"}
                </div>
                <div className="msp-side-datetime-value">{cleanBookingDate}</div>
              </div>
            </div>
          </div>

          <div className="msp-side-section-title">
            {isRTL ? "بيانات الطفل وولي الأمر" : "Kid & Parent Information"}
          </div>
          <div className="msp-detail-grid-2 msp-side-detail-grid">
            <DetailTile
              icon={cilChild}
              label={isRTL ? "اسم الطفل" : "Kid Name"}
              value={valOrDash(row.kidsName)}
            />
            <DetailTile
              icon={cilPeople}
              label={isRTL ? "اسم ولي الأمر" : "Parents Name"}
              value={valOrDash(row.parentName)}
            />
            <DetailTile
              icon={cilPhone}
              label={isRTL ? "جوال ولي الأمر" : "Parents Mobile NO"}
              value={valOrDash(row.parentMobile)}
            />
            <DetailTile
              icon={cilInstitution}
              label={isRTL ? "اسم المزود" : "Vendor Name"}
              value={valOrDash(row.vdrName)}
            />
          </div>

          <div className="msp-side-section-title">{isRTL ? "المبلغ" : "Amount"}</div>
          <div className="msp-detail-amount-section msp-side-amount-section">
            <div className="msp-detail-amount-row">
              <div className="msp-detail-amount-label">
                <CIcon icon={cilMoney} className="msp-detail-amount-icon" />
                {isRTL ? "مبلغ النشاط" : "Activity Amount"}
              </div>
              <div className="msp-detail-amount-value">{amount}</div>
            </div>
          </div>
        </div>

        <div className="msp-side-footer">
          <button className="msp-modal-close-full-btn btn" onClick={onClose}>
            {isRTL ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, isRTL }) {
  const s = (status || "").toUpperCase();
  const label = s === "COMPLETED" ? (isRTL ? "مكتمل" : "COMPLETED") : (isRTL ? "محجوز" : "BOOKED");

  return (
    <CBadge className="modern-status-pill msp-grid-status-pill">
      <CIcon icon={cilCheckCircle} className="modern-status-icon modern-status-icon-visible" />
      <span>{label}</span>
    </CBadge>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const MspBookedList = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status") || "BOOKED";
  const lang = useLang();
  const isRTL = lang === "ar";
  const dict = lang === "ar" ? arPack : enPack;
  const t = useCallback((k) => (Object.prototype.hasOwnProperty.call(dict, k) ? dict[k] : k), [dict]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [pageNo, setPageNo] = useState(1);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    IsVendorLoginIsValid();
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        BookingVendorID: getCurrentLoggedUserID(),
        BookingStatus: status.trim(),
      };

      console.log("MEMBERSHIP BOOKING LIST API:", `${API_BASE_URL}/membership/booking/getbookinglist`);
      console.log("MEMBERSHIP BOOKING LIST PAYLOAD:", payload);

      const res = await fetch(`${API_BASE_URL}/membership/booking/getbookinglist`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      console.log("MEMBERSHIP BOOKING LIST RESPONSE:", json);

      if (json?.statusCode !== 200) throw new Error(json?.message || "API error");

      const data = Array.isArray(json?.data) ? json.data : [];
      const mapped = data.map((e) => mapBookingRow(e));
      const want = status.trim().toUpperCase();

      const filtered = want
        ? mapped.filter((r) => {
            const st = r.bookingStatus.trim().toUpperCase();
            return !st || st === want;
          })
        : mapped;

      setRows(filtered);
      setPageNo(1);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const statusFilterUpper = statusFilter.trim().toUpperCase();

    return rows.filter((r) => {
      const rowStatus = (r.bookingStatus || "").trim().toUpperCase();

      const statusOk = statusFilterUpper === "ALL" || rowStatus === statusFilterUpper;
      if (!statusOk) return false;

      if (!q) return true;

      return [
        r.bookingId,
        r.requestId,
        r.kidsName,
        r.actName,
        r.parentName,
        r.parentMobile,
        r.vdrName,
        r.bookingStatus,
        r.activityDate,
        r.activityTime,
      ].some((v) => toStr(v).toLowerCase().includes(q));
    });
  }, [rows, searchText, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePageNo = Math.min(pageNo, totalPages);
  const startIndex = (safePageNo - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRows.length);
  const pagedRows = filteredRows.slice(startIndex, endIndex);

  // ✅ Total Amount from VendorPrice.Price for current filtered grid rows
  const totalAmount = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + toNumber(r.activityPrice, 0), 0);
  }, [filteredRows]);

  useEffect(() => {
    setPageNo(1);
  }, [searchText, statusFilter, pageSize]);

  // ✅ Export PDF without jspdf import, so Vite has no missing dependency error.
  // Browser print dialog lets user save as PDF.
  const exportPdfFallbackPrint = useCallback(
    (exportRows, reportTitle) => {
      const exportTotalAmount = exportRows.reduce((sum, r) => sum + toNumber(r.activityPrice, 0), 0);

      const htmlRows = exportRows
        .map(
          (r, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(r.bookingId)}</td>
              <td>${escapeHtml(r.actName)}</td>
              <td>${escapeHtml(r.activityDate)}</td>
              <td>${escapeHtml(r.activityTime)}</td>
              <td>${escapeHtml(r.bookingStatus || status)}</td>
              <td>${escapeHtml(r.kidsName)}</td>
              <td>${escapeHtml(r.parentName)}</td>
              <td>${escapeHtml(r.parentMobile)}</td>
              <td>${escapeHtml(formatMoney(r.activityPrice))}</td>
            </tr>
          `
        )
        .join("");

      const win = window.open("", "_blank", "width=1100,height=800");

      if (!win) {
        alert(isRTL ? "يرجى السماح بفتح النوافذ لتصدير PDF" : "Please allow popups to export PDF");
        return;
      }

      win.document.open();
      win.document.write(`
        <!DOCTYPE html>
        <html dir="${isRTL ? "rtl" : "ltr"}">
          <head>
            <title>${escapeHtml(reportTitle)}</title>
            <style>
              @page { size: A4 landscape; margin: 12mm; }
              body {
                font-family: Arial, sans-serif;
                color: #111827;
                margin: 0;
                padding: 0;
                background: #fff;
              }
              .pdf-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 16px;
                border-bottom: 3px solid #a20d86;
                padding-bottom: 10px;
                margin-bottom: 14px;
              }
              h1 {
                margin: 0 0 6px;
                font-size: 22px;
                color: #570457;
              }
              .meta {
                font-size: 12px;
                color: #6b7280;
                line-height: 1.5;
              }
              .total {
                background: #fff0f7;
                border: 1px solid #f5b6d5;
                border-radius: 12px;
                padding: 10px 14px;
                color: #a20d86;
                font-weight: 800;
                min-width: 110px;
                text-align: center;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                font-size: 10px;
              }
              th {
                background: #570457;
                color: #fff;
                padding: 8px 6px;
                border: 1px solid #570457;
                text-align: ${isRTL ? "right" : "left"};
              }
              td {
                padding: 7px 6px;
                border: 1px solid #e5e7eb;
                word-break: break-word;
                vertical-align: top;
              }
              tr:nth-child(even) td {
                background: #fff7fb;
              }
              .print-note {
                margin-top: 10px;
                color: #6b7280;
                font-size: 11px;
              }
            </style>
          </head>
          <body>
            <div class="pdf-header">
              <div>
                <h1>${escapeHtml(reportTitle)}</h1>
                <div class="meta">
                  ${escapeHtml(isRTL ? "تقرير حجوزات العضوية" : "Membership Booking Report")}<br/>
                  ${escapeHtml(isRTL ? "تاريخ التصدير" : "Export Date")}: ${new Date().toLocaleString()}
                </div>
              </div>
              <div class="total">
                ${escapeHtml(isRTL ? "عدد السجلات" : "Total Records")}<br/>
                ${exportRows.length}
                <div style="height:6px"></div>
                ${escapeHtml(isRTL ? "إجمالي المبلغ" : "Total Amount")}<br/>
                ${escapeHtml(formatMoney(exportTotalAmount))}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width:34px">#</th>
                  <th>Ref No.</th>
                  <th>Act Name</th>
                  <th>Trip Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Kid</th>
                  <th>Parent</th>
                  <th>Mobile</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>${htmlRows}</tbody>
            </table>
            <div class="print-note">
              ${escapeHtml(isRTL ? "اختر Save as PDF من نافذة الطباعة." : "Choose Save as PDF from the print dialog.")}
            </div>
            <script>
              window.onload = function () {
                window.focus();
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      win.document.close();
    },
    [isRTL, status]
  );

  const handleExportPdf = useCallback(async () => {
    try {
      setExportingPdf(true);

      if (!filteredRows.length) {
        alert(isRTL ? "لا توجد بيانات للتصدير" : "No data to export");
        return;
      }

      const statusText =
        status.trim().toUpperCase() === "COMPLETED"
          ? isRTL
            ? "الحجوزات المكتملة"
            : "Completed Bookings"
          : isRTL
            ? "الحجوزات المحجوزة"
            : "Booked Activities";

      const reportTitle = `${statusText} - Membership Report`;
      exportPdfFallbackPrint(filteredRows, reportTitle);
    } finally {
      setExportingPdf(false);
    }
  }, [filteredRows, status, isRTL, exportPdfFallbackPrint]);

  const pageStyle = `
    /* ✅ TABLE GRID LAYOUT LIKE TRIP-BOOKED SCREEN */
    .msp-grid-page {
      padding: 0;
    }

    .msp-grid-shell {
      width: 100%;
    }

    .msp-grid-card {
      border: 1px solid rgba(214, 51, 132, 0.26) !important;
      border-radius: 16px !important;
      box-shadow: 0 10px 26px rgba(87, 4, 87, 0.08) !important;
      overflow: hidden !important;
      background: #ffffff !important;
    }

    .msp-grid-card-header {
      background: #ffffff !important;
      border-bottom: 1px solid rgba(214, 51, 132, 0.14) !important;
      padding: 18px !important;
    }

    .msp-grid-title {
      font-size: 22px !important;
      font-weight: 900 !important;
      color: #111827 !important;
      margin: 0 0 4px 0 !important;
      letter-spacing: -0.03em !important;
    }

    .msp-total-amount-row {
      display: flex !important;
      justify-content: flex-end !important;
      align-items: center !important;
      gap: 12px !important;
      margin: 12px 0 12px 0 !important;
    }

    .msp-total-amount-card {
      min-width: 240px !important;
      border-radius: 16px !important;
      padding: 12px 16px !important;
      background: linear-gradient(135deg, rgba(87, 4, 87, 0.95), rgba(162, 13, 134, 0.92)) !important;
      color: #ffffff !important;
      box-shadow: 0 10px 24px rgba(162, 13, 134, 0.22) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 12px !important;
    }

    .msp-total-amount-label {
      font-size: 12px !important;
      font-weight: 800 !important;
      opacity: 0.88 !important;
      margin-bottom: 2px !important;
    }

    .msp-total-amount-value {
      font-size: 22px !important;
      font-weight: 950 !important;
      line-height: 1.1 !important;
      letter-spacing: -0.02em !important;
    }

    .msp-total-amount-icon {
      width: 42px !important;
      height: 42px !important;
      border-radius: 14px !important;
      background: rgba(255, 255, 255, 0.16) !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 auto !important;
    }

    .msp-total-amount-icon svg {
      width: 20px !important;
      height: 20px !important;
      color: #ffffff !important;
    }

    .msp-filter-box {
      border: 1px solid #e5e7eb !important;
      border-radius: 12px !important;
      padding: 14px !important;
      background: #f9fafb !important;
      display: grid !important;
      grid-template-columns: minmax(260px, 1fr) 300px 220px 150px !important;
      gap: 12px !important;
      align-items: end !important;
      margin-top: 4px !important;
    }

    .msp-filter-field label {
      display: block !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      color: #111827 !important;
      margin-bottom: 6px !important;
    }

    .msp-search-group .input-group-text,
    .msp-search-group input,
    .msp-filter-select {
      border-radius: 14px !important;
      border-color: #d9dde5 !important;
      min-height: 40px !important;
      background: #ffffff !important;
      font-size: 13px !important;
    }

    .msp-search-group .input-group-text {
      border-inline-end: 0 !important;
      color: #d63384 !important;
    }

    .msp-search-group input {
      border-inline-start: 0 !important;
    }

    .msp-export-pdf-btn {
      width: 100% !important;
      min-height: 40px !important;
      border-radius: 999px !important;
      border: 0 !important;
      background: linear-gradient(135deg, #570457, #a20d86) !important;
      color: #ffffff !important;
      font-weight: 900 !important;
      box-shadow: 0 8px 18px rgba(162, 13, 134, 0.22) !important;
    }

    .msp-export-pdf-btn:disabled {
      opacity: 0.55 !important;
      cursor: not-allowed !important;
      box-shadow: none !important;
    }

    .msp-table-wrap {
      width: 100% !important;
      overflow-x: auto !important;
      background: #ffffff !important;
    }

    .msp-data-table {
      width: 100% !important;
      border-collapse: collapse !important;
      min-width: 980px !important;
      table-layout: auto !important;
      font-size: 13px !important;
    }

    .msp-data-table thead th {
      background: #ffffff !important;
      color: #111827 !important;
      font-weight: 900 !important;
      padding: 12px 8px !important;
      border-bottom: 1px solid #e5e7eb !important;
      white-space: nowrap !important;
      text-align: left !important;
    }

    .vdr-rtl .msp-data-table thead th {
      text-align: right !important;
    }

    .msp-data-table tbody td {
      padding: 9px 8px !important;
      border-bottom: 1px solid #e5e7eb !important;
      color: #111827 !important;
      vertical-align: middle !important;
      white-space: nowrap !important;
    }

    .msp-data-table tbody tr:nth-child(even) {
      background: #fafafa !important;
    }

    .msp-data-table tbody tr:hover {
      background: #f1f5f9 !important;
    }

    .msp-grid-status-pill {
      background: #dff8ee !important;
      color: #009b72 !important;
      border: 1px solid #9ee7cf !important;
      border-radius: 999px !important;
      padding: 5px 10px !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      min-width: 94px !important;
      justify-content: center !important;
    }

    .msp-grid-status-pill .modern-status-icon {
      width: 12px !important;
      height: 12px !important;
      color: #009b72 !important;
    }

    .msp-grid-view-btn {
      min-width: 108px !important;
      height: 28px !important;
      border-radius: 999px !important;
      border: 0 !important;
      padding: 4px 18px !important;
      background: #a20d86 !important;
      color: #ffffff !important;
      font-weight: 900 !important;
      font-size: 12px !important;
      line-height: 1 !important;
    }

    .msp-grid-view-btn:hover {
      background: #870971 !important;
      color: #ffffff !important;
    }

    .msp-table-footer {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 12px !important;
      padding: 14px 0 0 !important;
      color: #111827 !important;
      font-size: 13px !important;
    }

    .msp-pagination {
      display: inline-flex !important;
      gap: 8px !important;
      align-items: center !important;
    }

    .msp-page-btn {
      width: 32px !important;
      height: 32px !important;
      border-radius: 50% !important;
      border: 1px solid #d9dde5 !important;
      background: #ffffff !important;
      color: #111827 !important;
      font-weight: 800 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
    }

    .msp-page-btn.active {
      background: #475569 !important;
      color: #ffffff !important;
      border-color: #475569 !important;
    }

    .msp-page-btn:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }

    .msp-sort-mark {
      color: #aab0bb !important;
      font-size: 14px !important;
      margin-inline-start: 3px !important;
    }

    .msp-loading-box,
    .msp-empty-box {
      min-height: 180px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-direction: column !important;
      gap: 12px !important;
    }

    .msp-side-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.48);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      justify-content: flex-end;
      align-items: stretch;
    }

    .msp-side-backdrop.vdr-rtl {
      justify-content: flex-start;
    }

    .msp-side-panel {
      width: min(430px, 100vw);
      height: 100vh;
      background: #ffffff;
      box-shadow: -18px 0 48px rgba(17, 24, 39, 0.22);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: mspSlideFromRight 220ms ease both;
    }

    .msp-side-panel-rtl {
      animation-name: mspSlideFromLeft;
      box-shadow: 18px 0 48px rgba(17, 24, 39, 0.22);
    }

    @keyframes mspSlideFromRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @keyframes mspSlideFromLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    .msp-side-header {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 18px;
      background: linear-gradient(135deg, #d63384, #570457);
      color: #ffffff;
    }

    .msp-side-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .msp-side-header-icon {
      width: 44px;
      height: 44px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.16);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
    }

    .msp-side-header-icon-svg {
      width: 22px;
      height: 22px;
      color: #ffffff;
    }

    .msp-side-kicker {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: rgba(255, 255, 255, 0.78);
    }

    .msp-side-title {
      font-size: 19px;
      font-weight: 900;
      line-height: 1.2;
      color: #ffffff;
    }

    .msp-side-close-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 0;
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex: 0 0 auto;
    }

    .msp-side-close-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .msp-side-body {
      flex: 1 1 auto;
      overflow-y: auto;
      padding: 18px;
      background: #fffafd;
    }

    .msp-side-footer {
      flex: 0 0 auto;
      padding: 14px 18px 18px;
      background: #ffffff;
      border-top: 1px solid rgba(214, 51, 132, 0.12);
    }

    .msp-side-activity-card {
      background: #ffffff;
      border: 1px solid rgba(214, 51, 132, 0.14);
      border-radius: 18px;
      padding: 14px;
      box-shadow: 0 12px 28px rgba(114, 28, 80, 0.06);
      margin-bottom: 16px;
    }

    .msp-side-activity-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }

    .msp-side-activity-label,
    .msp-side-section-title {
      color: #9d2161;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .msp-side-activity-name {
      color: #111827;
      font-size: 18px;
      font-weight: 900;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .msp-side-booking-id-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(214, 51, 132, 0.10), rgba(255, 105, 180, 0.06));
      border: 1px solid rgba(214, 51, 132, 0.18);
    }

    .msp-side-booking-id-row span {
      color: #7a5470;
      font-size: 12px;
      font-weight: 700;
    }

    .msp-side-booking-id-row strong {
      color: #d63384;
      font-size: 15px;
      font-weight: 900;
    }

    .msp-side-datetime-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }

    .msp-side-datetime-full {
      grid-column: 1 / -1;
    }

    .msp-side-datetime-card {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 76px;
      background: #ffffff;
      border: 1px solid rgba(214, 51, 132, 0.14);
      border-radius: 16px;
      padding: 12px;
      box-shadow: 0 8px 20px rgba(114, 28, 80, 0.05);
    }

    .msp-side-datetime-date {
      background: linear-gradient(135deg, rgba(214, 51, 132, 0.13), #ffffff);
    }

    .msp-side-datetime-time {
      background: linear-gradient(135deg, rgba(87, 4, 87, 0.10), #ffffff);
    }

    .msp-side-datetime-icon {
      width: 38px;
      height: 38px;
      border-radius: 14px;
      background: rgba(214, 51, 132, 0.12);
      color: #d63384;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
    }

    .msp-side-datetime-label {
      color: #7a5470;
      font-size: 11px;
      font-weight: 800;
      margin-bottom: 4px;
    }

    .msp-side-datetime-value {
      color: #111827;
      font-size: 15px;
      font-weight: 900;
      line-height: 1.25;
      overflow-wrap: anywhere;
    }

    .msp-detail-grid-2 {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 10px !important;
    }

    .msp-detail-tile {
      background: #ffffff !important;
      border: 1px solid rgba(214, 51, 132, 0.14) !important;
      border-radius: 14px !important;
      padding: 12px !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
    }

    .msp-detail-tile-icon-wrap {
      width: 34px !important;
      height: 34px !important;
      border-radius: 12px !important;
      background: rgba(214, 51, 132, 0.10) !important;
      color: #d63384 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 auto !important;
    }

    .msp-detail-tile-icon {
      width: 17px !important;
      height: 17px !important;
    }

    .msp-detail-tile-label {
      color: #7a5470 !important;
      font-size: 11px !important;
      font-weight: 800 !important;
      margin-bottom: 2px !important;
    }

    .msp-detail-tile-value {
      color: #111827 !important;
      font-size: 13px !important;
      font-weight: 900 !important;
      overflow-wrap: anywhere !important;
    }

    .msp-detail-amount-section {
      background: #ffffff !important;
      border: 1px solid rgba(214, 51, 132, 0.14) !important;
      border-radius: 16px !important;
      padding: 12px !important;
      margin-bottom: 0 !important;
    }

    .msp-detail-amount-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 12px !important;
    }

    .msp-detail-amount-label {
      display: inline-flex !important;
      align-items: center !important;
      gap: 8px !important;
      color: #7a5470 !important;
      font-size: 12px !important;
      font-weight: 900 !important;
    }

    .msp-detail-amount-icon {
      color: #d63384 !important;
    }

    .msp-detail-amount-value {
      color: #111827 !important;
      font-weight: 900 !important;
      font-size: 16px !important;
    }

    @media (max-width: 991px) {
      .msp-filter-box {
        grid-template-columns: 1fr !important;
      }

      .msp-table-footer {
        flex-direction: column !important;
        align-items: flex-start !important;
      }
    }

    @media (max-width: 575px) {
      .msp-side-panel {
        width: 100vw;
      }

      .msp-side-body {
        padding: 14px;
      }

      .msp-side-datetime-grid,
      .msp-detail-grid-2 {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  return (
    <div className={`msp-grid-page ${isRTL ? "vdr-rtl rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <style>{pageStyle}</style>

      <div className="msp-grid-shell">
        <CCard className="msp-grid-card">
          <CCardHeader className="msp-grid-card-header">
            <h3 className="msp-grid-title">
              {status.trim().toUpperCase() === "COMPLETED"
                ? isRTL
                  ? "الحجوزات المكتملة"
                  : "Completed Booking Information"
                : isRTL
                  ? "معلومات الحجوزات"
                  : "Booked Activity Information"}
            </h3>

            <div className="msp-total-amount-row">
              <div className="msp-total-amount-card">
                <div>
                  <div className="msp-total-amount-label">
                    {isRTL ? "إجمالي المبلغ" : "Total Amount"}
                  </div>
                  <div className="msp-total-amount-value">{formatMoney(totalAmount)}</div>
                </div>
                <div className="msp-total-amount-icon">
                  <CIcon icon={cilMoney} />
                </div>
              </div>
            </div>

            <div className="msp-filter-box">
              <div className="msp-filter-field">
                <label>{isRTL ? "بحث" : "Search"}</label>
                <CInputGroup className="msp-search-group">
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput
                    placeholder={isRTL ? "رقم المرجع / النشاط / التاريخ / الوقت" : "Ref No / Activity / Date / Time"}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </CInputGroup>
              </div>

              <div className="msp-filter-field">
                <label>{isRTL ? "الحالة" : "Status"}</label>
                <CFormSelect
                  className="msp-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">{isRTL ? "كل الحالات" : "All Status"}</option>
                  <option value="BOOKED">{isRTL ? "محجوز" : "BOOKED"}</option>
                  <option value="COMPLETED">{isRTL ? "مكتمل" : "COMPLETED"}</option>
                </CFormSelect>
              </div>

              <div className="msp-filter-field">
                <label>{isRTL ? "عرض السجلات" : "Show records"}</label>
                <CFormSelect
                  className="msp-filter-select"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </CFormSelect>
              </div>

              <div className="msp-filter-field">
                <label>{isRTL ? "تصدير" : "Export"}</label>
                <CButton
                  className="msp-export-pdf-btn"
                  type="button"
                  onClick={handleExportPdf}
                  disabled={loading || exportingPdf || filteredRows.length === 0}
                >
                  {exportingPdf ? (isRTL ? "جاري..." : "Exporting...") : (isRTL ? "PDF" : "Export PDF")}
                </CButton>
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            {loading && (
              <div className="msp-loading-box">
                <CSpinner />
              </div>
            )}

            {!loading && error && (
              <div className="msp-empty-box">
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
                <CButton onClick={load} className="msp-grid-view-btn">
                  {isRTL ? "إعادة المحاولة" : "Retry"}
                </CButton>
              </div>
            )}

            {!loading && !error && filteredRows.length === 0 && (
              <div className="msp-empty-box">{isRTL ? "لا توجد بيانات" : "No data found"}</div>
            )}

            {!loading && !error && filteredRows.length > 0 && (
              <>
                <div className="msp-table-wrap">
                  <table className="msp-data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>
                          {isRTL ? "رقم المرجع" : "Ref No."}
                          <span className="msp-sort-mark">♦</span>
                        </th>
                        <th>
                          {isRTL ? "اسم النشاط" : "Act Name"}
                          <span className="msp-sort-mark">♦</span>
                        </th>
                        <th>
                          {isRTL ? "تاريخ الرحلة" : "Trip Date"}
                          <span className="msp-sort-mark">♦</span>
                        </th>
                        <th>
                          {isRTL ? "الوقت" : "Time"}
                          <span className="msp-sort-mark">♦</span>
                        </th>
                        <th>
                          {isRTL ? "الحالة" : "Status"}
                          <span className="msp-sort-mark">♦</span>
                        </th>
                        <th>{isRTL ? "اسم الطفل" : "Kid Name"}</th>
                        <th>{isRTL ? "ولي الأمر" : "Parent Name"}</th>
                        <th>{isRTL ? "الجوال" : "Parent Mobile"}</th>
                        <th>{isRTL ? "المبلغ" : "Amount"}</th>
                        <th>{isRTL ? "عرض" : "View"}</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pagedRows.map((r, i) => (
                        <tr key={r.bookingId || `${startIndex}-${i}`}>
                          <td>{startIndex + i + 1}</td>
                          <td>{valOrDash(r.bookingId)}</td>
                          <td>{valOrDash(r.actName)}</td>
                          <td>{valOrDash(r.activityDate)}</td>
                          <td>{valOrDash(r.activityTime)}</td>
                          <td>
                            <StatusBadge status={r.bookingStatus || status} isRTL={isRTL} />
                          </td>
                          <td>{valOrDash(r.kidsName)}</td>
                          <td>{valOrDash(r.parentName)}</td>
                          <td>{valOrDash(r.parentMobile)}</td>
                          <td>{formatMoney(r.activityPrice)}</td>
                          <td>
                            <CButton className="msp-grid-view-btn" type="button" onClick={() => setSelected(r)}>
                              {isRTL ? "عرض" : "View"}
                            </CButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="msp-table-footer">
                  <div>
                    {isRTL
                      ? `عرض ${filteredRows.length === 0 ? 0 : startIndex + 1} إلى ${endIndex} من ${filteredRows.length} سجل`
                      : `Showing ${filteredRows.length === 0 ? 0 : startIndex + 1} to ${endIndex} of ${filteredRows.length} entries`}
                  </div>

                  <div className="msp-pagination">
                    <button
                      type="button"
                      className="msp-page-btn"
                      disabled={safePageNo <= 1}
                      onClick={() => setPageNo((p) => Math.max(1, p - 1))}
                    >
                      ‹
                    </button>

                    {Array.from({ length: totalPages }).slice(0, 7).map((_, idx) => {
                      const page = idx + 1;
                      return (
                        <button
                          key={page}
                          type="button"
                          className={`msp-page-btn ${safePageNo === page ? "active" : ""}`}
                          onClick={() => setPageNo(page)}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      className="msp-page-btn"
                      disabled={safePageNo >= totalPages}
                      onClick={() => setPageNo((p) => Math.min(totalPages, p + 1))}
                    >
                      ›
                    </button>
                  </div>
                </div>
              </>
            )}
          </CCardBody>
        </CCard>
      </div>

      {selected && (
        <BookingDetailModal row={selected} isRTL={isRTL} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default MspBookedList;
