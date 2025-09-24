// src/pages/dashboard/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IsUserAccessPage } from '../../utils/auth'
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID } from '../../utils/operation'
import VdrCalenderScreen from "../calender/VdrCalenderScreen";
import {
  CCard, CCardBody, CCardHeader, CRow, CCol, CProgress, CBadge,
  CSpinner, CAlert,
} from '@coreui/react'

 
const GET_VDR_SUMMARY = `${API_BASE_URL}/vendordata/dashboard/getvdrsummary`

 
function StatCard({ title, value, color = 'primary', onClick }) {
  return (
    <CCard
      className="mb-3 h-100"
      role={onClick ? 'button' : undefined}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <CCardBody className="text-center">
        <div className="fw-bold mb-2">{title}</div>
        <div className={`fs-3 fw-semibold text-${color}`}>{value}</div>
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

  const [totalCount, setTotalCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [rejectedCount, setRejectedCount] = useState(0)
  const [totalProposalCreated, setTotalProposalCreated] = useState(0)
  const [totalCompletedTrip, setTotalCompletedTrip] = useState(0)
  const [totalTodayTrip, setTotalTodayTrip] = useState(0)
  const [totalPayableSchoolAmount, setTotalPayableSchoolAmount] = useState(0)

  // Helper: navigate safely for both HashRouter and BrowserRouter
  const goToListByStatus = (statusKey) => {
    const query = `?status=${encodeURIComponent(statusKey)}`
    // Detect if app uses hash routing by checking current URL shape
    const usingHash = typeof window !== 'undefined' && window.location.hash.startsWith('#/')
    if (usingHash) {
      window.location.hash = `#/vendor/activity-requests${query}`
    } else {
      navigate(`/vendor/activity-requests${query}`)
    }
  }

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
      {/* ======== STATS AT THE TOP ======== */}
      <CRow className="mb-4">
        {statCards.map((s) => (
          <CCol key={s.title} xs={12} sm={6} xl={4}>
            <StatCard
              title={s.title}
              value={s.value}
              color={s.color}
              onClick={() => goToListByStatus(s.statusKey)}
            />
          </CCol>
        ))}
      </CRow>

      {/* Wallet */}
      <CRow className="mb-4">
        <CCol xs={12} md={6}>
          <WalletCard label="Amount Received" amount={'0'} />
        </CCol>
        <CCol xs={12} md={6}>
          <WalletCard label="Balance" amount={'0'} />
        </CCol>
      </CRow>

      {/* Today’s Trips */}
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
  <VdrCalenderScreen />
      {/* Loading / Error */}
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
