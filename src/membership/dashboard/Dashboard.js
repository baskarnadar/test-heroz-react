// src/pages/dashboard/Dashboard.js
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IsUserAccessPage } from '../../utils/auth'
import { API_BASE_URL } from '../../config'
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsMemberShipLoginIsValid,
} from '../../utils/operation'
import VdrCalenderScreen from '../calender/VdrCalenderScreen'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CProgress,
  CBadge,
  CSpinner,
  CAlert,
} from '@coreui/react'

// 🔤 i18n packs (default Arabic if not set)
import enPack from '../../i18n/enloc100.json'
import arPack from '../../i18n/arloc100.json'

const GET_VDR_SUMMARY = `${API_BASE_URL}/vendordata/dashboard/getvdrsummary`
const GET_BOOKING_SUMMARY_LIST = `${API_BASE_URL}/membership/booking/vdrgetbookingSummaryList`

const pad2 = (n) => String(n).padStart(2, '0')
const todayYMD = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

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

const Dashboard = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // totals shown on top cards
  const [totalProposalCreated, setTotalProposalCreated] = useState(0) // Booked Activity
  const [totalCompletedTrip, setTotalCompletedTrip] = useState(0) // Completed Activity
  const [totalTodayTrip, setTotalTodayTrip] = useState(0)

  const [totalPayableSchoolAmount, setTotalPayableSchoolAmount] = useState(0)

  useEffect(() => {
    IsMemberShipLoginIsValid?.()
  }, [])

  // ---- i18n (local, no provider) ----
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      return v === 'ar' || v === 'en' ? v : 'ar'
    } catch {
      return 'ar'
    }
  }
  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback

  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])
  // ------------------------------------

  const goToListByStatus = (statusKey) => {
    const query = `?status=${encodeURIComponent(statusKey)}`
    const usingHash =
      typeof window !== 'undefined' && window.location.hash.startsWith('#/')
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

        // 1) Existing dashboard summary (kept)
        try {
          const resp = await fetch(GET_VDR_SUMMARY, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ VendorID: getCurrentLoggedUserID() }),
          })

          if (resp.ok) {
            const json = await resp.json()
            if (json?.status === 'success') {
              const d = json.data || {}
              if (!isMounted) return
              setTotalPayableSchoolAmount(d.TotalPayableSchoolAmount ?? 0)
            }
          }
        } catch {
          // ignore (kept safe)
        }

        // 2) ✅ Booking Summary List (NEW) -> totalBooked / totalCompleted / today count
        const resp2 = await fetch(GET_BOOKING_SUMMARY_LIST, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            BookingVendorID: getCurrentLoggedUserID(),
            page: 1,
            limit: 500,
          }),
        })

        if (!resp2.ok) {
          const txt = await resp2.text()
          throw new Error(`HTTP ${resp2.status}: ${txt}`)
        }

        const json2 = await resp2.json()
        const d2 = json2?.data || {}
        const list = Array.isArray(d2?.BookingList) ? d2.BookingList : []

        const ymd = todayYMD()
        const todayCount = list.filter((x) => String(x?.BookingActivityDate || '') === ymd).length

        if (!isMounted) return
        setTotalProposalCreated(Number(d2?.bookedCount ?? 0))
        setTotalCompletedTrip(Number(d2?.completedCount ?? 0))
        setTotalTodayTrip(todayCount)
      } catch (e) {
        if (!isMounted) return
        setError(e?.message || 'Failed to load dashboard')
      } finally {
        if (!isMounted) return
        setLoading(false)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [navigate])

  const statCards = useMemo(
    () => [
      {
        title: tr('dashBookedActivity', 'Booked Activity'),
        value: totalProposalCreated,
        color: 'info',
        statusKey: 'BOOKED',
      },
      {
        title: tr('dashCompletedActivity', 'Completed Activity'),
        value: totalCompletedTrip,
        color: 'success',
        statusKey: 'COMPLETED',
      },
    ],
    [totalProposalCreated, totalCompletedTrip, dict],
  )

  return (
    <>
      {/* ======== STATS AT THE TOP ======== */}
      <CRow className="mb-4">
        {statCards.map((s) => (
          <CCol key={s.title} xs={12} sm={6} xl={6}>
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
          <WalletCard label={tr('dashAmountReceived', 'Amount Received')} amount={'0'} />
        </CCol>
        <CCol xs={12} md={6}>
          <WalletCard label={tr('dashBalance', 'Balance')} amount={totalPayableSchoolAmount} />
        </CCol>
      </CRow>

      {/* Today’s Trips */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard>
            <CCardHeader className="d-flex align-items-center justify-content-between">
              <div className="fw-bold">{tr('dashTodaysTrips', 'Today’s Trips')}</div>
              <CBadge color="primary" shape="rounded-pill">
                {totalTodayTrip}
              </CBadge>
            </CCardHeader>
            <CCardBody>
              <CProgress value={100} />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Calendar */}
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