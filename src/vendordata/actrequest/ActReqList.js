// src/pages/vendor/ActivityRequestList.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CRow, CCol,
  CSpinner, CAlert, CBadge, CButton
} from '@coreui/react'
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID } from '../../utils/operation'

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

function TrailingByStatus({ status, onViewPaid, onApprove, onWaiting }) {
  const s = (status || '').toUpperCase()
  if (s === 'TRIP-BOOKED') {
    return <CButton color="success" size="sm" onClick={onViewPaid}>View Paid Students</CButton>
  }
  if (s === 'WAITING-FOR-APPROVAL') {
    return <CButton color="warning" size="sm" onClick={onWaiting}>Waiting for Approval</CButton>
  }
  if (s === 'APPROVED') {
    return <CButton color="primary" size="sm" onClick={onApprove}>Approved Request</CButton>
  }
  return null
}

const ActivityRequestList = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const actRequestStatus = params.get('status') || 'ALL'

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const pageTitle = useMemo(() => {
    const s = (actRequestStatus || '').toUpperCase()
    if (s === 'TRIP-BOOKED') return 'Trip Booked'
    if (s === 'WAITING-FOR-APPROVAL') return 'Waiting for Approval'
    if (s === 'APPROVED') return 'Approved Requests'
    if (s === 'REJECTED') return 'Rejected Requests'
    if (s === 'COMPLETED') return 'Completed Trip'
    return 'All Activity Requests'
  }, [actRequestStatus])

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
                  No activity found
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

                      <InfoRow label="Ref No" value={req.actRequestRefNo || '-'} bold color="#444" />

                      <div className="rounded p-2" style={{ background: 'rgba(228,237,226,0.2)' }}>
                        <InfoRow label="Trip Date" value={req.actRequestDate || '-'} color="#444" />
                      </div>

                      <div className="rounded p-2 mt-2" style={{ background: 'rgba(228,237,226,0.2)' }}>
                        <InfoRow label="Trip Time" value={req.actRequestTime || '-'} color="#444" />
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
                          <div className="fw-bold mb-1">Reject Reason</div>
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
                        label="Total Expected"
                        value={String(req.actTotalNoStudents || 0)}
                        color="#444"
                        trailing={
                          <TrailingByStatus
                            status={req.actRequestStatus}
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
