// src/pages/dashboard/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IsUserAccessPage } from '../../utils/auth'
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID } from '../../utils/operation'

import {
  CCard, CCardBody, CCardHeader, CRow, CCol, CProgress, CBadge,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CSpinner, CAlert, CButton
} from '@coreui/react'

import WidgetsBrand from '../widgets/WidgetsBrand'
import WidgetsDropdown from '../widgets/WidgetsDropdown'

// =======================================
// Endpoints (match your Dart ApiBaseUrl):
// =======================================
// Dart used: ApiBaseUrl.getvdrsummary and ApiBaseUrl.getAllActivityRequestUrl
// Fill these with your real endpoints if different.
const GET_VDR_SUMMARY = `${API_BASE_URL}/vendordata/dashboard/getvdrsummary`
const GET_ACTIVITY_REQUESTS = `${API_BASE_URL}/vendordata/activityrequest/list`

// ------------------------
// Helpers (Dart parity)
// ------------------------
const toStr = (v) => (v ?? '').toString()
const toInt = (v, def = 0) => {
  const n = parseInt(v ?? '', 10)
  return Number.isFinite(n) ? n : def
}

// Minimal item model mirroring your Dart _ReqItem
function mapReqItem(json) {
  return {
    requestID: toStr(json.RequestID),
    actName: toStr(json.actName),
    refNo: toStr(json.actRequestRefNo),
    date: toStr(json.actRequestDate),
    time: toStr(json.actRequestTime),
    status: toStr(json.actRequestStatus),
    message: toStr(json.actRequestMessage),
    totalStudents: toInt(json.actTotalNoStudents),
    totalPaidStudent: toInt(json.totalPaidStudent),
  }
}

// ============================
// ActivityPreview (like Dart)
// ============================
function ActivityPreview({ status, limit = 5 }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const resp = await fetch(GET_ACTIVITY_REQUESTS, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            VendorID: getCurrentLoggedUserID(),
            actRequestStatus: status,
            limit, // if your API ignores this, we slice client-side
          }),
        })
        if (!resp.ok) {
          const txt = await resp.text()
          throw new Error(`HTTP ${resp.status}: ${txt}`)
        }
        const data = await resp.json()
        // Pretty print to console (like Dart)
        console.log('📦 Full API Response:', data)
        const list = Array.isArray(data?.data) ? data.data : []
        const mapped = list.map(mapReqItem).slice(0, limit)
        if (isMounted) setItems(mapped)
      } catch (e) {
        if (isMounted) setError(e.message || 'Failed to load')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [status, limit])

  if (loading) {
    return (
      <div className="py-3 text-center">
        <CSpinner />
      </div>
    )
  }
  if (error) {
    return <CAlert color="danger" className="mb-0">Error: {error}</CAlert>
  }
  if (!items.length) {
    return <div className="text-muted text-center py-3">No activities found.</div>
  }

  return (
    <CTable align="middle" className="mb-0 border" hover responsive>
      <CTableHead color="light">
        <CTableRow>
          <CTableHeaderCell>Activity</CTableHeaderCell>
          <CTableHeaderCell>Ref No</CTableHeaderCell>
          <CTableHeaderCell>Date</CTableHeaderCell>
          <CTableHeaderCell>Time</CTableHeaderCell>
          <CTableHeaderCell>Status</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Students</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {items.map((it) => {
          const isTripBooked = it.status.toUpperCase() === 'TRIP-BOOKED'
          return (
            <CTableRow key={it.requestID}>
              <CTableDataCell style={{ maxWidth: 220 }}>
                <div className="fw-semibold text-truncate">{it.actName}</div>
                {it.message ? <div className="text-muted small text-truncate">{it.message}</div> : null}
              </CTableDataCell>
              <CTableDataCell>{it.refNo || '-'}</CTableDataCell>
              <CTableDataCell>{it.date || '-'}</CTableDataCell>
              <CTableDataCell>{it.time || '-'}</CTableDataCell>
              <CTableDataCell>
                <CBadge color={isTripBooked ? 'success' : 'secondary'}>{it.status}</CBadge>
              </CTableDataCell>
              <CTableDataCell className="text-end">
                {isTripBooked ? (
                  <>
                    <span className="fw-semibold">{it.totalPaidStudent}</span>
                    <span className="text-muted"> / {it.totalStudents}</span>
                  </>
                ) : (
                  <span className="text-muted">{it.totalStudents}</span>
                )}
              </CTableDataCell>
            </CTableRow>
          )
        })}
      </CTableBody>
    </CTable>
  )
}

// =====================
// StatCard + WalletCard
// =====================
function StatCard({ title, value, color = 'primary', onClick }) {
  return (
    <CCard className="mb-3 h-100" role={onClick ? 'button' : undefined} onClick={onClick}>
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start">
          <div className="fw-bold">{title}</div>
          <CBadge color={color} shape="rounded-pill">{value}</CBadge>
        </div>
        <CProgress thin className="mt-3" value={100} color={color} />
      </CCardBody>
    </CCard>
  )
}

function WalletCard({ label, amount }) {
  return (
    <CCard className="mb-3" style={{ background: 'rgba(87, 4, 87, 0.8)', color: '#fff' }}>
      <CCardBody className="d-flex justify-content-between align-items-center">
        <div className="fw-bold">{label}</div>
        <div className="fs-5">{amount}</div>
      </CCardBody>
    </CCard>
  )
}

// ===============
// Main Dashboard
// ===============
const Dashboard = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Summary values (mirror Dart names)
  const [totalCount, setTotalCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [rejectedCount, setRejectedCount] = useState(0)
  const [totalProposalCreated, setTotalProposalCreated] = useState(0)
  const [totalCompletedTrip, setTotalCompletedTrip] = useState(0)
  const [totalTodayTrip, setTotalTodayTrip] = useState(0)
  const [totalPayableSchoolAmount, setTotalPayableSchoolAmount] = useState(0)

  // Gate access, then fetch
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      const hasAccess = await IsUserAccessPage(navigate, 'P100')
      if (!hasAccess) return navigate('/login')

      try {
        setLoading(true)
        setError(null)

        const resp = await fetch(GET_VDR_SUMMARY, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ VendorID: getCurrentLoggedUserID() }),
        })

        if (!resp.ok) {
          const txt = await resp.text()
          throw new Error(`HTTP ${resp.status}: ${txt}`)
        }

        const json = await resp.json()
        if (json?.status === 'success') {
          const d = json.data || {}
          if (!isMounted) return
          setTotalCount(d.TotalActivity ?? 0)
          setApprovedCount(d.TotalApproved ?? 0)
          setPendingCount(d.TotalPending ?? 0)
          setRejectedCount(d.TotalRejected ?? 0)
          setTotalProposalCreated(d.TotalProposalCreated ?? 0)
          setTotalCompletedTrip(d.totalCompletedTrip ?? 0)
          setTotalTodayTrip(d.TotalTodayTrip ?? 0)
          setTotalPayableSchoolAmount(d.TotalPayableSchoolAmount ?? 0)
        } else {
          if (!isMounted) return
          setError(json?.message || 'Failed to load dashboard')
        }
      } catch (e) {
        if (!isMounted) return
        setError(e.message || 'Failed to load dashboard')
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    })()
    return () => { isMounted = false }
  }, [navigate])

  const statCards = useMemo(() => ([
    { title: 'Pending Requests', value: pendingCount, color: 'warning', statusKey: 'WAITING-FOR-APPROVAL' },
    { title: 'Approved Requests', value: approvedCount, color: 'success', statusKey: 'APPROVED' },
    { title: 'Trip Booked', value: totalProposalCreated, color: 'info', statusKey: 'TRIP-BOOKED' },
    { title: 'Completed Trip', value: totalCompletedTrip, color: 'primary', statusKey: 'COMPLETED' },
    { title: 'Total Requests', value: totalCount, color: 'secondary', statusKey: 'ALL' },
    { title: 'Rejected', value: rejectedCount, color: 'danger', statusKey: 'REJECTED' },
  ]), [pendingCount, approvedCount, totalProposalCreated, totalCompletedTrip, totalCount, rejectedCount])

  return (
    <>
      {/* Keep your existing widgets */}
      <WidgetsDropdown className="mb-4" />
      <WidgetsBrand className="mb-4" withCharts />

      {/* Summary / Wallet */}
      <CRow className="mb-4">
        <CCol xs={12} md={6}>
          <WalletCard label="Amount Received" amount={"0"} />
        </CCol>
        <CCol xs={12} md={6}>
          <WalletCard label="Balance" amount={String(totalPayableSchoolAmount || 0)} />
        </CCol>
      </CRow>

      {/* Stats */}
      <CRow className="mb-4">
        {statCards.map((s) => (
          <CCol key={s.title} xs={12} sm={6} xl={4}>
            <StatCard
              title={s.title}
              value={s.value}
              color={s.color}
              onClick={() => {
                // navigate to your list page (if you have it)
                // e.g. /vendor/activity-requests?status=...
                navigate(`/vendor/activity-requests?status=${encodeURIComponent(s.statusKey)}`)
              }}
            />
          </CCol>
        ))}
      </CRow>

      {/* Today’s Trips (optional quick badge) */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader className="d-flex align-items-center justify-content-between">
              <div className="fw-bold">Today’s Trips</div>
              <CBadge color="primary" shape="rounded-pill">{totalTodayTrip}</CBadge>
            </CCardHeader>
            <CCardBody>
              <CProgress value={100} />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Lists that mirror your Flutter previews */}
      <CRow className="mb-4">
        <CCol xs={12} lg={6}>
          <CCard className="h-100">
            <CCardHeader className="fw-bold">Waiting for Approval</CCardHeader>
            <CCardBody>
              <ActivityPreview status="WAITING-FOR-APPROVAL" limit={5} />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} lg={6}>
          <CCard className="h-100">
            <CCardHeader className="fw-bold">Trip Booked</CCardHeader>
            <CCardBody>
              <ActivityPreview status="TRIP-BOOKED" limit={5} />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* (Optional) More sections as needed */}
      {/* <WidgetsBrand className="mb-4" withCharts /> */}

      {/* Loading / Error overlay (kept simple) */}
      {loading && (
        <div className="text-center my-4">
          <CSpinner />
        </div>
      )}
      {!loading && error && (
        <CAlert color="danger" className="mt-3">
          {error}
        </CAlert>
      )}
    </>
  )
}

export default Dashboard
