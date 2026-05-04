// src/membership/booking/MspBookedList.js
import React, { useEffect, useState, useCallback, useRef } from "react";
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
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilQrCode, cilPeople, cilCalendar, cilClock,
  cilPhone, cilChild, cilInstitution, cilMoney,
  cilX, cilReload, cilCheckCircle, cilSearch, cilList, cilArrowRight,
} from "@coreui/icons";
import { API_BASE_URL } from "../../../config";
import { getAuthHeaders, getCurrentLoggedUserID, IsVendorLoginIsValid } from "../../../utils/operation";
import "./../../../scss/style.css";//
import enPack from "../../../i18n/enloc100.json";
import arPack from "../../../i18n/arloc100.json";

// ─── Lang hook ────────────────────────────────────────────────────────────────
const normalizeLang = (raw) => { const v=(raw||"").toLowerCase(); if(v.startsWith("en"))return"en"; if(v.startsWith("ar"))return"ar"; return null; };
const getLangNow = () => { try{const s=normalizeLang(localStorage.getItem("heroz_lang"));if(s)return s;}catch{} const h=normalizeLang(document?.documentElement?.lang||"");if(h)return h;return"ar"; };
const useLang = () => {
  const [lang, setLang] = useState(getLangNow());
  useEffect(() => {
    const onEvt=(e)=>{const n=normalizeLang(e?.detail?.lang);setLang(n||getLangNow());};
    window.addEventListener("heroz_lang_changed",onEvt);
    const obs=new MutationObserver(()=>setLang(getLangNow()));
    if(document?.documentElement)obs.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
    return()=>{window.removeEventListener("heroz_lang_changed",onEvt);obs.disconnect();};
  },[]);
  return lang;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toStr = (v) => (v??'').toString();
const valOrDash = (v) => { const s=toStr(v).trim(); return s||'–'; };

function mapBookingRow(m) {
  let activityPrice='';
  try{ const list=m['ActivityPrice']; if(Array.isArray(list)&&list.length>0){activityPrice=toStr(list[0]['Price']??'').trim();}}catch{}
  return {
    bookingId:    toStr(m['BookingID']),
    requestId:    toStr(m['BookingRequestID']),
    parentsId:    toStr(m['BookingParentsID']),
    kidsId:       toStr(m['BookingKidsID']),
    vendorId:     toStr(m['BookingVendorID']),
    activityId:   toStr(m['BookingActivityID']),
    activityDate: toStr(m['BookingActivityDate']),
    activityTime: toStr(m['BookingActivityTime']),
    bookingDate:  toStr(m['BookingDate']),
    activityPrice,
    parentName:   toStr(m['RegUserFullName']),
    parentEmail:  toStr(m['RegUserEmailAddress']),
    parentMobile: toStr(m['RegUserMobileNo']),
    kidsName:     toStr(m['KidsName']),
    actName:      toStr(m['actName']),
    vdrName:      toStr(m['vdrName']),
    bookingStatus:toStr(m['BookingStatus']??m['bookingStatus']??''),
    raw: m,
  };
}

// ─── Detail Tile ──────────────────────────────────────────────────────────────
function DetailTile({ icon, label, value, fullWidth=false }) {
  return (
    <div className={`msp-detail-tile ${fullWidth?'msp-detail-tile-full':''}`}>
      <div className="msp-detail-tile-icon-wrap">
        <CIcon icon={icon} className="msp-detail-tile-icon" />
      </div>
      <div className="msp-detail-tile-text">
        <div className="msp-detail-tile-label">{label}</div>
        <div className="msp-detail-tile-value">{value||'–'}</div>
      </div>
    </div>
  );
}

// ─── Booking Detail Side Window (Screen 3) ───────────────────────────────────
function BookingDetailModal({ row, isRTL, onClose }) {
  const overlayRef = useRef(null);
  useEffect(()=>{ document.body.style.overflow='hidden'; return()=>{ document.body.style.overflow=''; }; },[]);
  const handleOverlayClick=(e)=>{ if(e.target===overlayRef.current)onClose(); };
  const amount = row.activityPrice.trim()||'–';
  const cleanDate = valOrDash(row.activityDate);
  const cleanTime = valOrDash(row.activityTime);
  const cleanBookingDate = valOrDash(row.bookingDate);

  return (
    <div className={`msp-side-backdrop ${isRTL?'vdr-rtl':''}`} ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={`msp-side-panel ${isRTL?'vdr-rtl msp-side-panel-rtl':''}`} dir={isRTL?'rtl':'ltr'}>
        <div className="msp-side-header">
          <div className="msp-side-header-left">
            <div className="msp-side-header-icon">
              <CIcon icon={cilQrCode} className="msp-side-header-icon-svg" />
            </div>
            <div>
              <div className="msp-side-kicker">{isRTL?'تفاصيل العضوية':'MEMBERSHIP BOOKING'}</div>
              <div className="msp-side-title">{isRTL?'تفاصيل الحجز':'Booking Details'}</div>
            </div>
          </div>
          <button className="msp-side-close-btn" onClick={onClose} aria-label="Close">
            <CIcon icon={cilX}/>
          </button>
        </div>

        <div className="msp-side-body">
          <div className="msp-side-activity-card">
            <div className="msp-side-activity-top">
              <div>
                <div className="msp-side-activity-label">{isRTL?'النشاط':'Activity'}</div>
                <div className="msp-side-activity-name">{valOrDash(row.actName)}</div>
              </div>
              <StatusBadge status={row.bookingStatus} isRTL={isRTL}/>
            </div>

            <div className="msp-side-booking-id-row">
              <span>{isRTL?'رقم الحجز':'Booking ID'}</span>
              <strong>{valOrDash(row.bookingId)}</strong>
            </div>
          </div>

          <div className="msp-side-section-title">{isRTL?'التاريخ والوقت':'Date & Time'}</div>
          <div className="msp-side-datetime-grid">
            <div className="msp-side-datetime-card msp-side-datetime-date">
              <div className="msp-side-datetime-icon"><CIcon icon={cilCalendar}/></div>
              <div>
                <div className="msp-side-datetime-label">{isRTL?'تاريخ النشاط':'Activity Date'}</div>
                <div className="msp-side-datetime-value">{cleanDate}</div>
              </div>
            </div>
            <div className="msp-side-datetime-card msp-side-datetime-time">
              <div className="msp-side-datetime-icon"><CIcon icon={cilClock}/></div>
              <div>
                <div className="msp-side-datetime-label">{isRTL?'وقت النشاط':'Activity Time'}</div>
                <div className="msp-side-datetime-value">{cleanTime}</div>
              </div>
            </div>
            <div className="msp-side-datetime-card msp-side-datetime-full">
              <div className="msp-side-datetime-icon"><CIcon icon={cilCalendar}/></div>
              <div>
                <div className="msp-side-datetime-label">{isRTL?'تاريخ إنشاء الحجز':'Booking Created Date'}</div>
                <div className="msp-side-datetime-value">{cleanBookingDate}</div>
              </div>
            </div>
          </div>

          <div className="msp-side-section-title">{isRTL?'بيانات الطفل وولي الأمر':'Kid & Parent Information'}</div>
          <div className="msp-detail-grid-2 msp-side-detail-grid">
            <DetailTile icon={cilChild}       label={isRTL?'اسم الطفل':'Kid Name'}       value={valOrDash(row.kidsName)}/>
            <DetailTile icon={cilPeople}      label={isRTL?'اسم ولي الأمر':'Parents Name'}      value={valOrDash(row.parentName)}/>
            <DetailTile icon={cilPhone}       label={isRTL?'جوال ولي الأمر':'Parents Mobile NO'} value={valOrDash(row.parentMobile)}/>
            <DetailTile icon={cilInstitution} label={isRTL?'اسم المزود':'Vendor Name'} value={valOrDash(row.vdrName)}/>
          </div>

          <div className="msp-side-section-title">{isRTL?'المبلغ':'Amount'}</div>
          <div className="msp-detail-amount-section msp-side-amount-section">
            <div className="msp-detail-amount-row">
              <div className="msp-detail-amount-label">
                <CIcon icon={cilMoney} className="msp-detail-amount-icon"/>{isRTL?'مبلغ النشاط':'Activity Amount'}
              </div>
              <div className="msp-detail-amount-value">{amount}</div>
            </div>
          </div>
        </div>

        <div className="msp-side-footer">
          <button className="msp-modal-close-full-btn btn" onClick={onClose}>{isRTL?'إغلاق':'Close'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, isRTL }) {
  const s=(status||'').toUpperCase();
  const label=s==='COMPLETED'?(isRTL?'مكتمل':'COMPLETED'):(isRTL?'محجوز':'BOOKED');
  return(
    <CBadge className="modern-status-pill">
      <CIcon icon={cilCheckCircle} className="modern-status-icon modern-status-icon-visible"/>
      <span>{label}</span>
    </CBadge>
  );
}

// ─── Mini line ────────────────────────────────────────────────────────────────
function MiniLine({ label, value }) {
  return(
    <div className="modern-info-row">
      <div className="modern-info-label"><span>{label}</span></div>
      <div className="modern-info-value"><span>{value}</span></div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const MspBookedList = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status')||'BOOKED';
  const lang = useLang();
  const isRTL = lang==='ar';
  const dict = lang==='ar'?arPack:enPack;
  const t = useCallback((k)=>(Object.prototype.hasOwnProperty.call(dict,k)?dict[k]:k),[dict]);

  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [rows,     setRows]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(()=>{ IsVendorLoginIsValid(); },[]);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const payload = { BookingVendorID:getCurrentLoggedUserID(), BookingStatus:status.trim() };
      console.log("MEMBERSHIP BOOKING LIST API:", `${API_BASE_URL}/membership/booking/getbookinglist`);
      console.log("MEMBERSHIP BOOKING LIST PAYLOAD:", payload);

      const res = await fetch(`${API_BASE_URL}/membership/booking/getbookinglist`,{
        method:'POST', headers:getAuthHeaders(),
        body:JSON.stringify(payload),
      });
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const json=await res.json();
      console.log("MEMBERSHIP BOOKING LIST RESPONSE:", json);

      if(json?.statusCode!==200)throw new Error(json?.message||'API error');
      const data=Array.isArray(json?.data)?json.data:[];
      const mapped=data.map(e=>mapBookingRow(e));
      const want=status.trim().toUpperCase();
      const filtered=want?mapped.filter(r=>{ const st=r.bookingStatus.trim().toUpperCase(); return !st||st===want; }):mapped;
      setRows(filtered);
    } catch(e){ setError(e.message||'Failed to load'); }
    finally{ setLoading(false); }
  },[status]);

  useEffect(()=>{ load(); },[load]);

  const dateTimeText=(r)=>{
    const d=valOrDash(r.activityDate), tm=valOrDash(r.activityTime);
    if(d==='–'&&tm==='–')return'–';
    if(d==='–')return tm; if(tm==='–')return d;
    return`${d} • ${tm}`;
  };

  const DateTimeClearLine = ({ row }) => {
    const d = valOrDash(row.activityDate);
    const tm = valOrDash(row.activityTime);
    return (
      <div className="modern-info-row msp-clear-datetime-row">
        <div className="modern-info-label"><span>{isRTL?'التاريخ والوقت':'Date & Time'}</span></div>
        <div className="msp-clear-datetime-value">
          <span className="msp-date-chip" title={d}><CIcon icon={cilCalendar} className="msp-date-time-icon" />{d}</span>
          <span className="msp-time-chip" title={tm}><CIcon icon={cilClock} className="msp-date-time-icon" />{tm}</span>
        </div>
      </div>
    );
  };

  const filteredRows = rows.filter((r) => {
    const q = searchText.trim().toLowerCase();
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

  const pageStyle = `
    /* ✅ Date & Time clear row: force full width so time is never hidden */
    .msp-clear-datetime-row {
      grid-template-columns: 1fr !important;
      align-items: stretch !important;
      gap: 7px !important;
    }
    .msp-clear-datetime-row .modern-info-label {
      width: 100% !important;
    }
    .msp-clear-datetime-row .modern-info-label span {
      white-space: nowrap !important;
      overflow: visible !important;
      text-overflow: clip !important;
    }
    .msp-clear-datetime-value {
      width: 100% !important;
      min-width: 0 !important;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      text-align: start !important;
      overflow: visible !important;
    }
    .modern-info-row .msp-clear-datetime-value span.msp-date-chip,
    .modern-info-row .msp-clear-datetime-value span.msp-time-chip {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      width: 100% !important;
      min-width: 0 !important;
      min-height: 32px !important;
      padding: 6px 8px !important;
      border-radius: 999px !important;
      background: #ffffff !important;
      border: 1px solid rgba(214, 51, 132, 0.18) !important;
      color: #211827 !important;
      font-size: 12.5px !important;
      font-weight: 800 !important;
      line-height: 1.25 !important;
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: clip !important;
      word-break: break-word !important;
    }
    .msp-date-time-icon {
      width: 13px !important;
      height: 13px !important;
      color: #d63384 !important;
      flex: 0 0 auto !important;
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
    .msp-side-detail-grid {
      margin-bottom: 16px;
    }
    .msp-side-detail-grid .msp-detail-tile {
      box-shadow: none;
      border-color: rgba(214, 51, 132, 0.12);
    }
    .msp-side-amount-section {
      background: #ffffff !important;
      margin-bottom: 0 !important;
    }
    @media (max-width: 575px) {
      .msp-clear-datetime-row {
        grid-template-columns: 1fr !important;
      }
      .msp-clear-datetime-value {
        grid-template-columns: 1fr !important;
      }
      .msp-side-panel {
        width: 100vw;
      }
      .msp-side-body {
        padding: 14px;
      }
      .msp-side-datetime-grid,
      .msp-side-detail-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  return(
    <div className={`modern-request-page ${isRTL?'vdr-rtl rtl':'ltr'}`} dir={isRTL?'rtl':'ltr'}>
      <style>{pageStyle}</style>
      <div className="modern-request-shell">
        <CCard className="modern-main-card">
          <CCardHeader className="modern-card-header">
            <div className="modern-inline-header">
              <div className="modern-title-area">
                <h3 className="modern-page-title">
                  {status.trim().toUpperCase()==='COMPLETED'
                    ? (isRTL?'الأنشطة المكتملة':'Completed Activities')
                    : (isRTL?'الأنشطة المحجوزة':'Booked Activities')}
                </h3>
              </div>

              <div className="modern-search-area">
                <CInputGroup className="modern-search-group">
                  <CInputGroupText className="modern-search-icon-wrap">
                    <CIcon icon={cilSearch} className="modern-search-icon" />
                  </CInputGroupText>
                  <CFormInput
                    className="modern-search-input"
                    placeholder={isRTL?'بحث بالاسم أو رقم الحجز أو النشاط':'Search by name, booking ID, or activity'}
                    value={searchText}
                    onChange={(e)=>setSearchText(e.target.value)}
                  />
                </CInputGroup>
              </div>

              <div className="modern-record-summary">
                <div className="modern-total-card">
                  <CIcon icon={cilList} className="modern-total-icon" />
                  <div>
                    <div className="modern-total-label">{isRTL?'إجمالي السجلات':'Total Records'}</div>
                    <div className="modern-total-value">{filteredRows.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <div className="mb-3">
              <StatusBadge status={status} isRTL={isRTL}/>
            </div>

            {loading&&<div className="modern-loading-box"><CSpinner/></div>}

            {!loading&&error&&(
              <div className="modern-empty-box">
                <CAlert color="danger" className="mb-3">{error}</CAlert>
                <CButton onClick={load} className="modern-view-action-btn">
                  <span>{isRTL?'إعادة المحاولة':'Retry'}</span>
                  <span className="modern-view-action-circle"><CIcon icon={cilReload} className="modern-view-action-icon" /></span>
                </CButton>
              </div>
            )}

            {!loading&&!error&&filteredRows.length===0&&(
              <div className="modern-empty-box">{isRTL?'لا توجد بيانات':'No data found'}</div>
            )}

            {!loading&&!error&&filteredRows.length>0&&(
              <div className="modern-list-wrap">
                {filteredRows.map((r,i)=>(
                  <div key={r.bookingId||i} className="modern-request-card" role="button" tabIndex={0}
                    onClick={()=>setSelected(r)} onKeyDown={(e)=>e.key==='Enter'&&setSelected(r)}>
                    <div className="modern-request-top">
                      <div className="modern-activity-name">{valOrDash(r.actName)}</div>
                    </div>

                    <div className="modern-info-grid">
                      <div className="modern-info-row modern-reference-row">
                        <div className="modern-info-label"><span>{isRTL?'رقم الحجز':'Booking ID'}</span></div>
                        <div className="modern-info-value modern-reference-value"><span>{valOrDash(r.bookingId)}</span></div>
                        <div className="modern-reference-status"><StatusBadge status={r.bookingStatus||status} isRTL={isRTL}/></div>
                      </div>

                      <MiniLine label={isRTL?'اسم الطفل':'Kids Name'} value={valOrDash(r.kidsName)}/>
                      <MiniLine label={isRTL?'اسم ولي الأمر':'Parents Name'} value={valOrDash(r.parentName)}/>
                      <MiniLine label={isRTL?'جوال ولي الأمر':'Parents Mobile'} value={valOrDash(r.parentMobile)}/>
                      <DateTimeClearLine row={r}/>

                      {r.bookingStatus.toUpperCase()==='COMPLETED'&&(
                        <MiniLine label={isRTL?'مبلغ النشاط':'Activity Amount'} value={r.activityPrice.trim()||'–'}/>
                      )}

                      <div className="modern-info-action">
                        <CButton className="modern-view-action-btn" type="button"
                          onClick={(e)=>{e.stopPropagation();setSelected(r);}}>
                          <span>{isRTL?'عرض':'View'}</span>
                          <span className="modern-view-action-circle">
                            <CIcon icon={cilArrowRight} className="modern-view-action-icon" />
                          </span>
                        </CButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CCardBody>
        </CCard>
      </div>

      {selected&&<BookingDetailModal row={selected} isRTL={isRTL} onClose={()=>setSelected(null)}/>}
    </div>
  );
};

export default MspBookedList;
