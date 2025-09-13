// src/pages/vendor/ActivityRequestList.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CCard, CCardBody, CCardHeader, CRow, CCol,
  CSpinner, CAlert, CBadge, CButton
} from '@coreui/react'
import { API_BASE_URL } from '../../../config'
import { getAuthHeaders, getCurrentLoggedUserID } from '../../../utils/operation'

const GET_ACTIVITY_REQUESTS = `${API_BASE_URL}/vendordata/activityinfo/activity/getAllActivityRequest`

const toStr = (v) => (v ?? '').toString()

function mapItem(json) {
  return {
    RequestID: toStr(json.RequestID),
    actName: toStr(json.actName),
    actRequestRefNo: toStr(json.actRequestRefNo),
    actRequestDate: toStr(json.actRequestDate),
    actRequestTime: toStr(json.actRequestTime),
    actRequestStatus: toStr(json.actRequestStatus),
    actRequestMessage: toStr(json.actRequestMessage),
    actTotalNoStudents: Number.parseInt(json.actTotalNoStudents ?? 0, 10) || 0,
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

        console.log('API:', url)
        console.log('API PAYLOAD:', payload)

        const resp = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })

        const json = await resp.json()
        console.log('API RESPONSE:', json)

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`)
        }

        // Accept multiple response shapes:
        // 1) { status, data: [...] }
        // 2) [ ... ]
        // 3) { ...single object... }
        let listRaw = []
        if (Array.isArray(json?.data)) {
          listRaw = json.data
        } else if (Array.isArray(json)) {
          listRaw = json
        } else if (json && typeof json === 'object') {
          listRaw = [json]
        }

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
                      key={req.RequestID}
                      className="p-3 bg-white border rounded"
                      style={{ borderColor: '#f5c2e7' }}
                      role="button"
                      onClick={() => navigate(`/vendor/activity/${encodeURIComponent(req.RequestID)}`)}
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

                      {/* <InfoRow
                        label="Status"
                        value={<span><CBadge color={statusColor(req.actRequestStatus)}>{req.actRequestStatus || '-'}</CBadge></span>}
                        color="#444"
                      /> */}

                      <InfoRow
                        label="Total Expected"
                        value={String(req.actTotalNoStudents || 0)}
                        color="#444"
                        trailing={
                          <TrailingByStatus
                            status={req.actRequestStatus}
                            onViewPaid={(e) => {
                              e.stopPropagation()
                              navigate(`/vendor/activity/${encodeURIComponent(req.RequestID)}?tab=paid`)
                            }}
                            onWaiting={(e) => {
                              e.stopPropagation()
                              navigate(`/vendor/activity/${encodeURIComponent(req.RequestID)}?tab=review`)
                            }}
                            onApprove={(e) => {
                              e.stopPropagation()
                              navigate(`/vendor/activity/${encodeURIComponent(req.RequestID)}?tab=approved`)
                            }}
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
