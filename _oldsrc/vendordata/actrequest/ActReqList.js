// src/pages/vendor/ActivityRequestList.js
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CRow, CCol,
  CSpinner, CAlert, CBadge, CButton
} from '@coreui/react'
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID, IsVendorLoginIsValid } from '../../utils/operation'

const GET_ACTIVITY_REQUESTS = `${API_BASE_URL}/vendordata/activityinfo/activity/getAllActivityRequest`

const toStr = (v) => (v ?? '').toString()

function mapItem(json) {
  return {
    // 🔧 include ActivityID so onClick works
    ActivityID: toStr(json.ActivityID),
    RequestID: toStr(json.RequestID),
    SchoolID: toStr(json.SchoolID),
    VendorID: toStr(json.VendorID),
    actName: toStr(json.actName),
    actRequestRefNo: toStr(json.actRequestRefNo),
    actRequestDate: toStr(json.actRequestDate),
    actRequestTime: toStr(json.actRequestTime),
    actRequestStatus: toStr(json.actRequestStatus),
    actRequestMessage: toStr(json.actRequestMessage),
    actTypeID: toStr(json.actTypeID),
    totalPaidStudent: Number.parseInt(json.totalPaidStudent ?? 0, 10) || 0,
    actTotalNoStudents: Number.parseInt(json.actTotalNoStudents ?? 0, 10) || 0,

    // ✅ NEW: map reject reason (with robust fallbacks)
    RequestRejectReason: toStr(
      json.RequestRejectReason ??
      json.requestRejectReason ??
      json.RejectReason ??
      json.rejectReason ??
      ''
    ),
  }
}

function statusColor(status) {
  const s = (status || '').toUpperCase()
  if (s === 'TRIP-BOOKED') return 'success'
  if (s === 'APPROVED') return 'primary'
  if (s === 'WAITING-FOR-APPROVAL') return 'warning'
  if (s === 'REJECTED') return 'danger'
  if (s === 'COMPLETED') return 'info'
  return 'secondary'
}

function InfoRow({ label, value, bold = false, color, trailing }) {
  return (
    <div className="mb-2">
      <div className="d-flex align-items-center gap-2">
        <div className="flex-grow-0" style={{ minWidth: 120 }}>
          <span className={`text-body ${bold ? 'fw-bold' : ''}`} style={{ color }}>
            {label}
          </span>
        </div>
        <div className="flex-grow-1 text-truncate text-end">
          <span className={`text-body ${bold ? 'fw-bold' : ''}`} style={{ color }}>
            {value}
          </span>
        </div>
      </div>
      {trailing ? (
        <div className="mt-2 d-flex" style={{ justifyContent: 'flex-end' }}>
          {trailing}
        </div>
      ) : null}
    </div>
  )
}

// 🆕 accept optional t() to localize button labels (fallback to identity)
function TrailingByStatus({ status, onViewPaid, onApprove, onWaiting, t = (x) => x }) {
  const s = (status || '').toUpperCase()
  if (s === 'TRIP-BOOKED') {
    return <CButton color="success" size="sm" onClick={onViewPaid}>{t('list.view_paid_students')}</CButton>
  }
  if (s === 'WAITING-FOR-APPROVAL') {
    return <CButton color="warning" size="sm" onClick={onWaiting}>{t('list.waiting_for_approval_button')}</CButton>
  }
  if (s === 'APPROVED') {
    return <CButton color="primary" size="sm" onClick={onApprove}>{t('list.approved_request_button')}</CButton>
  }
  return null
}

/* =========================
   🔤 Light i18n glue (no libs)
   - Reads current lang from <html lang> or localStorage('heroz_lang')
   - Loads /public/locales/{lang}loc100.json at runtime
   - Re-renders on custom event 'heroz_lang_changed' and <html lang> changes
========================= */
const getLangNow = () =>
  (document?.documentElement?.lang || localStorage.getItem('heroz_lang') || 'ar')
    .toLowerCase().startsWith('en') ? 'en' : 'ar'

const useLang = () => {
  const [lang, setLang] = useState(getLangNow())
  useEffect(() => {
    const onEvt = (e) => setLang((e?.detail?.lang || getLangNow()).startsWith('en') ? 'en' : 'ar')
    window.addEventListener('heroz_lang_changed', onEvt)
    const obs = new MutationObserver(() => setLang(getLangNow()))
    if (document?.documentElement) {
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    }
    return () => {
      window.removeEventListener('heroz_lang_changed', onEvt)
      obs.disconnect()
    }
  }, [])
  return lang
}
// =========================

const ActivityRequestList = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const actRequestStatus = params.get('status') || 'ALL'

  // ✅ Vendor login guard
  useEffect(() => {
    IsVendorLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 🌐 language state + loader
  const lang = useLang()
  const [i18n, setI18n] = useState({})
  const t = useCallback(
    (k) => (i18n && Object.prototype.hasOwnProperty.call(i18n, k) ? i18n[k] : k),
    [i18n]
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await fetch(`/locales/${lang}loc100.json`, { cache: 'no-store' })
        const json = await res.json()
        if (alive) setI18n(json || {})
      } catch {
        if (alive) setI18n({})
      }
    })()
    return () => { alive = false }
  }, [lang])

  const pageTitle = useMemo(() => {
    const s = (actRequestStatus || '').toUpperCase()
    if (s === 'TRIP-BOOKED') return t('list.page_title_trip_booked')        // 'Trip Booked'
    if (s === 'WAITING-FOR-APPROVAL') return t('list.page_title_waiting_for_approval') // 'Waiting for Approval'
    if (s === 'APPROVED') return t('list.page_title_approved')              // 'Approved Requests'
    if (s === 'REJECTED') return t('list.page_title_rejected')              // 'Rejected Requests'
    if (s === 'COMPLETED') return t('list.page_title_completed')            // 'Completed Trip'
    return t('list.page_title_all')                                         // 'All Activity Requests'
  }, [actRequestStatus, t])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const url = GET_ACTIVITY_REQUESTS
        const payload = {
          VendorID: getCurrentLoggedUserID(),
          actRequestStatus,
        }

        const resp = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })

        const json = await resp.json()

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`)
        }

        // Accept multiple response shapes
        let listRaw = []
        if (Array.isArray(json?.data)) listRaw = json.data
        else if (Array.isArray(json)) listRaw = json
        else if (json && typeof json === 'object') listRaw = [json]

        const mapped = listRaw.map(mapItem)
        if (alive) setItems(mapped)
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load requests')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [actRequestStatus])

  return (
    <div className="container-fluid py-4">
      <CRow className="justify-content-center">
        <CCol xs={12} lg={10} xl={9}>
          <CCard className="shadow-sm">
            <CCardHeader className="bg-white">
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">{pageTitle}</h5>
                <CBadge color="secondary" shape="rounded-pill">{items.length}</CBadge>
              </div>
            </CCardHeader>
            <CCardBody>
              {loading && (
                <div className="text-center py-5">
                  <CSpinner />
                </div>
              )}

              {!loading && error && <CAlert color="danger">{error}</CAlert>}

              {!loading && !error && items.length === 0 && (
                <div className="text-center text-muted py-4 fw-bold">
                  {t('list.no_activity_found')} {/* No activity found */}
                </div>
              )}

              {!loading && !error && items.length > 0 && (
                <div className="d-flex flex-column" style={{ gap: 12 }}>
                  {items.map((req) => (
                    <div
                      key={req.RequestID || req.ActivityID}
                      className="p-3 bg-white border rounded"
                      style={{ borderColor: '#f5c2e7' }}
                      role="button"
                      onClick={() => {
                        // 🔒 robust fallback: prefer ActivityID, else use RequestID path
                        if (req.ActivityID) {
                          navigate(`/vendordata/actrequest/actreqinfo/${encodeURIComponent(req.ActivityID)}`)
                        } else if (req.RequestID) {
                          // if you have a details route by RequestID, use it; otherwise remove this branch
                          navigate(`/vendordata/actrequest/actreqinfo/by-request/${encodeURIComponent(req.RequestID)}`)
                        } else {
                          console.warn('No ActivityID/RequestID available for navigation', req)
                        }
                      }}
                    >
                      <div className="fw-semibold mb-2" style={{ color: '#333', fontSize: 16 }}>
                        {req.actName || '-'}
                      </div>

                      <InfoRow label={t('kv.ref_no')} value={req.actRequestRefNo || '-'} bold color="#444" />

                      <div className="rounded p-2" style={{ background: 'rgba(228,237,226,0.2)' }}>
                        <InfoRow label={t('kv.trip_date')} value={req.actRequestDate || '-'} color="#444" />
                      </div>

                      <div className="rounded p-2 mt-2" style={{ background: 'rgba(228,237,226,0.2)' }}>
                        <InfoRow label={t('kv.trip_time')} value={req.actRequestTime || '-'} color="#444" />
                      </div>

                      {/* ✅ NEW: Reject reason (shown if present). Yellow rgba 0.5 with rounded border */}
                      {req.RequestRejectReason && req.RequestRejectReason.trim() !== '' && (
                        <div
                          className="mt-2"
                          style={{
                            background: 'rgba(255, 193, 7, 0.5)',   // yellow @ 0.5
                            borderRadius: 14,
                            border: '1px solid #ffecb5',            // soft yellow border
                            padding: '10px 12px',
                            color: '#5c3c00',                        // readable on yellow
                            whiteSpace: 'pre-wrap',
                          }}
                          onClick={(e) => e.stopPropagation()} // don't trigger card navigation
                        >
                          <div className="fw-bold mb-1">{t('list.reject_reason')}</div>
                          {req.RequestRejectReason}
                        </div>
                      )}

                      {/* If you want to show status: */}
                      {/* <InfoRow
                        label="Status"
                        value={<CBadge color={statusColor(req.actRequestStatus)}>{req.actRequestStatus || '-'}</CBadge>}
                        color="#444"
                      /> */}

                      <InfoRow
                        label={t('list.total_expected')}
                        value={String(req.actTotalNoStudents || 0)}
                        color="#444"
                        trailing={
                          <TrailingByStatus
                            status={req.actRequestStatus}
                            t={t}
                          />
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  )
}

export default ActivityRequestList
