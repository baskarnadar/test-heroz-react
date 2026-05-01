// src/pages/dashboard/MemberShipdashboard.js
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IsUserAccessPage } from '../../utils/auth'
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID, IsVendorLoginIsValid } from '../../utils/operation'
import MemberShipCalenderScreen from './MemberShipCalenderScreen'
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
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilClock,
  cilXCircle,
  cilCalendar,
  cilList,
  cilWallet,
  cilMoney,
  cilArrowRight,
  cilLayers,
} from '@coreui/icons'

// 🔤 i18n packs (default Arabic if not set)
import enPack from '../../i18n/enloc100.json'
import arPack from '../../i18n/arloc100.json'

const GET_VDR_SUMMARY = `${API_BASE_URL}/vendordata/dashboard/getvdrsummary`
const GET_MEMBERSHIP_BOOKING_LIST = `${API_BASE_URL}/membership/booking/getbookinglist`

const dashboardTheme = {
  warning: {
    accent: '#ff9f43',
    soft: 'rgba(255, 159, 67, 0.14)',
    gradient: 'linear-gradient(135deg, rgba(255,159,67,0.18), rgba(255,255,255,0.96))',
    progress: '#ff9f43',
  },
  success: {
    accent: '#16a34a',
    soft: 'rgba(22, 163, 74, 0.14)',
    gradient: 'linear-gradient(135deg, rgba(22,163,74,0.16), rgba(255,255,255,0.96))',
    progress: '#16a34a',
  },
  info: {
    accent: '#2f80ff',
    soft: 'rgba(47, 128, 255, 0.13)',
    gradient: 'linear-gradient(135deg, rgba(47,128,255,0.16), rgba(255,255,255,0.96))',
    progress: '#2f80ff',
  },
  primary: {
    accent: '#6c5ce7',
    soft: 'rgba(108, 92, 231, 0.14)',
    gradient: 'linear-gradient(135deg, rgba(108,92,231,0.16), rgba(255,255,255,0.96))',
    progress: '#6c5ce7',
  },
  secondary: {
    accent: '#64748b',
    soft: 'rgba(100, 116, 139, 0.14)',
    gradient: 'linear-gradient(135deg, rgba(100,116,139,0.15), rgba(255,255,255,0.96))',
    progress: '#64748b',
  },
  danger: {
    accent: '#ef4444',
    soft: 'rgba(239, 68, 68, 0.13)',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.16), rgba(255,255,255,0.96))',
    progress: '#ef4444',
  },
}

const getStatIcon = (statusKey) => {
  if (statusKey === 'WAITING-FOR-APPROVAL') return cilClock
  if (statusKey === 'APPROVED') return cilCheckCircle
  if (statusKey === 'TRIP-BOOKED') return cilCalendar
  if (statusKey === 'COMPLETED') return cilLayers
  if (statusKey === 'REJECTED') return cilXCircle
  return cilList
}

function StatCard({ title, value, color = 'primary', statusKey, onClick }) {
  const theme = dashboardTheme[color] || dashboardTheme.primary

  return (
    <CCard
      className="mb-4 h-100 border-0 dashboard-modern-card"
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
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '22px',
        overflow: 'hidden',
        background: theme.gradient,
        boxShadow: '0 16px 38px rgba(15, 23, 42, 0.08)',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      <CCardBody style={{ padding: '22px' }}>
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div>
            <div
              className="fw-bold mb-2"
              style={{
                color: '#111827',
                fontSize: '15px',
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </div>

            <div
              className="fw-bold"
              style={{
                color: theme.accent,
                fontSize: '34px',
                lineHeight: 1,
              }}
            >
              {value}
            </div>
          </div>

          <div
            className="d-inline-flex align-items-center justify-content-center"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: theme.soft,
              color: theme.accent,
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.75)',
              flex: '0 0 auto',
            }}
          >
            <CIcon icon={getStatIcon(statusKey)} style={{ width: 24, height: 24 }} />
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mt-4">
          <div
            style={{
              height: '8px',
              borderRadius: '999px',
              width: '78%',
              background: 'rgba(15, 23, 42, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
                borderRadius: '999px',
                background: `linear-gradient(90deg, ${theme.progress}, rgba(255,255,255,0.35))`,
              }}
            />
          </div>

          <span
            className="d-inline-flex align-items-center justify-content-center"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#fff',
              color: theme.accent,
              boxShadow: '0 8px 18px rgba(15, 23, 42, 0.10)',
            }}
          >
            <CIcon icon={cilArrowRight} style={{ width: 16, height: 16 }} />
          </span>
        </div>
      </CCardBody>
    </CCard>
  )
}

function WalletCard({ label, amount, type = 'received' }) {
  const isBalance = type === 'balance'
  return (
    <CCard
      className="mb-4 border-0"
      style={{
        borderRadius: '22px',
        overflow: 'hidden',
        background: isBalance
          ? 'linear-gradient(135deg, #4f0b52, #8a3a8c)'
          : 'linear-gradient(135deg, #350536, #7b2f7e)',
        color: '#fff',
        boxShadow: '0 18px 42px rgba(87, 4, 87, 0.20)',
      }}
    >
      <CCardBody className="d-flex justify-content-between align-items-center" style={{ padding: '22px' }}>
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-inline-flex align-items-center justify-content-center"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <CIcon icon={isBalance ? cilWallet : cilMoney} style={{ width: 24, height: 24 }} />
          </div>
          <div className="fw-bold" style={{ fontSize: '16px' }}>
            {label}
          </div>
        </div>

        <div className="fw-bold" style={{ fontSize: '24px' }}>
          {amount}
        </div>
      </CCardBody>
    </CCard>
  )
}

// ===============
// Main MemberShip Dashboard
// ===============
const MemberShipdashboard = () => {
  const navigate = useNavigate()

  const [activeDashboardTab, setActiveDashboardTab] = useState('membership')

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

  // ✅ Membership dashboard counters
  const [totalMembershipBookedActivities, setTotalMembershipBookedActivities] = useState(0)
  const [totalMembershipCompletedActivities, setTotalMembershipCompletedActivities] = useState(0)
  const [totalMembershipTodayActivities, setTotalMembershipTodayActivities] = useState(0)
  const [totalMembershipAmountReceived, setTotalMembershipAmountReceived] = useState(0)
  const [totalMembershipBalance, setTotalMembershipBalance] = useState(0)

  // ✅ vendor-login validation (same pattern as other vendor pages)
  useEffect(() => {
    IsVendorLoginIsValid?.()
  }, [])

  // ---- i18n (local, no provider) ----
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      return v === 'ar' || v === 'en' ? v : 'ar' // default AR
    } catch {
      return 'ar'
    }
  }
  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback

  // React to global header toggle
  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])
  // ------------------------------------

  // Helper: navigate safely for both HashRouter and BrowserRouter
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

  // ✅ Membership tab navigation
  // Booked Activities   -> /vendordata/membership?status=BOOKED
  // Completed Activities -> /vendordata/membership?status=COMPLETED
  const goToMembershipListByStatus = (statusKey) => {
    const query = `?status=${encodeURIComponent(statusKey)}`
    const usingHash =
      typeof window !== 'undefined' && window.location.hash.startsWith('#/')

    if (usingHash) {
      window.location.hash = `#/vendordata/membership${query}`
    } else {
      navigate(`/vendordata/membership${query}`)
    }
  }

  // ✅ Same API used in membership booked/completed page.
  // This loads exact BOOKED and COMPLETED record counts from:
  // POST /membership/booking/getbookinglist
  const loadMembershipBookingCounts = async () => {
    const vendorId = getCurrentLoggedUserID()

    const bookedPayload = {
      BookingVendorID: vendorId,
      BookingStatus: 'BOOKED',
    }

    const completedPayload = {
      BookingVendorID: vendorId,
      BookingStatus: 'COMPLETED',
    }

    console.log('MEMBERSHIP DASHBOARD BOOKED COUNT API:', GET_MEMBERSHIP_BOOKING_LIST)
    console.log('MEMBERSHIP DASHBOARD BOOKED COUNT PAYLOAD:', bookedPayload)
    console.log('MEMBERSHIP DASHBOARD COMPLETED COUNT API:', GET_MEMBERSHIP_BOOKING_LIST)
    console.log('MEMBERSHIP DASHBOARD COMPLETED COUNT PAYLOAD:', completedPayload)

    const [bookedResp, completedResp] = await Promise.all([
      fetch(GET_MEMBERSHIP_BOOKING_LIST, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(bookedPayload),
      }),
      fetch(GET_MEMBERSHIP_BOOKING_LIST, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(completedPayload),
      }),
    ])

    if (!bookedResp.ok) {
      const txt = await bookedResp.text()
      throw new Error(`Booked Activities API HTTP ${bookedResp.status}: ${txt}`)
    }

    if (!completedResp.ok) {
      const txt = await completedResp.text()
      throw new Error(`Completed Activities API HTTP ${completedResp.status}: ${txt}`)
    }

    const bookedJson = await bookedResp.json()
    const completedJson = await completedResp.json()

    console.log('MEMBERSHIP DASHBOARD BOOKED COUNT RESPONSE:', bookedJson)
    console.log('MEMBERSHIP DASHBOARD COMPLETED COUNT RESPONSE:', completedJson)

    const bookedData = Array.isArray(bookedJson?.data) ? bookedJson.data : []
    const completedData = Array.isArray(completedJson?.data) ? completedJson.data : []

    setTotalMembershipBookedActivities(bookedData.length)
    setTotalMembershipCompletedActivities(completedData.length)
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

          // ✅ Membership fields from summary kept as fallback / existing logic
          setTotalMembershipBookedActivities(
            d.TotalMembershipBookedActivities ??
              d.TotalBookedActivities ??
              d.TotalMembershipBooked ??
              d.TotalBookedActivity ??
              0,
          )
          setTotalMembershipCompletedActivities(
            d.TotalMembershipCompletedActivities ??
              d.TotalCompletedActivities ??
              d.TotalMembershipCompleted ??
              d.TotalCompletedActivity ??
              0,
          )
          setTotalMembershipTodayActivities(
            d.TotalMembershipTodayActivities ??
              d.TotalTodayActivities ??
              d.TotalMembershipToday ??
              0,
          )
          setTotalMembershipAmountReceived(
            d.TotalMembershipAmountReceived ??
              d.MembershipAmountReceived ??
              d.TotalAmountReceived ??
              0,
          )
          setTotalMembershipBalance(
            d.TotalMembershipBalance ??
              d.MembershipBalance ??
              d.TotalPayableMembershipAmount ??
              d.TotalPayableSchoolAmount ??
              0,
          )

          // ✅ Override dashboard membership cards using exact same list API
          await loadMembershipBookingCounts()
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
    return () => {
      isMounted = false
    }
  }, [navigate])

  const statCards = useMemo(
    () => [
      {
        title: tr('dashPendingRequests', 'Pending Requests'),
        value: pendingCount,
        color: 'warning',
        statusKey: 'WAITING-FOR-APPROVAL',
      },
      {
        title: tr('dashApprovedRequests', 'Approved Requests'),
        value: approvedCount,
        color: 'success',
        statusKey: 'APPROVED',
      },
      {
        title: tr('dashTripBooked', 'Trip Booked'),
        value: totalProposalCreated,
        color: 'info',
        statusKey: 'TRIP-BOOKED',
      },
      {
        title: tr('dashCompletedTrip', 'Completed Trip'),
        value: totalCompletedTrip,
        color: 'primary',
        statusKey: 'COMPLETED',
      },
      {
        title: tr('dashTotalRequests', 'Total Requests'),
        value: totalCount,
        color: 'secondary',
        statusKey: 'ALL',
      },
      {
        title: tr('dashRejected', 'Rejected'),
        value: rejectedCount,
        color: 'danger',
        statusKey: 'REJECTED',
      },
    ],
    [
      pendingCount,
      approvedCount,
      totalProposalCreated,
      totalCompletedTrip,
      totalCount,
      rejectedCount,
      dict,
    ],
  )

  const membershipStatCards = useMemo(
    () => [
      {
        title: tr('dashBookedActivities', 'Booked Activities'),
        value: totalMembershipBookedActivities,
        color: 'info',
        statusKey: 'BOOKED',
      },
      {
        title: tr('dashCompletedActivities', 'Completed Activities'),
        value: totalMembershipCompletedActivities,
        color: 'primary',
        statusKey: 'COMPLETED',
      },
    ],
    [totalMembershipBookedActivities, totalMembershipCompletedActivities, dict],
  )

  const isSchoolTab = activeDashboardTab === 'school'
  const activeStatCards = isSchoolTab ? statCards : membershipStatCards
  const activeAmountReceived = isSchoolTab ? '0' : totalMembershipAmountReceived
  const activeBalance = isSchoolTab ? totalPayableSchoolAmount : totalMembershipBalance
  const activeTodayCount = isSchoolTab ? totalTodayTrip : totalMembershipTodayActivities
  const activeTodayLabel = isSchoolTab
    ? tr('dashTodaysTrips', 'Today’s Trips')
    : tr('dashTodaysActivities', 'Today’s Activities')

  return (
    <div
      className="vendor-dashboard-modern"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(123,47,126,0.10), transparent 34%), radial-gradient(circle at top right, rgba(47,128,255,0.08), transparent 30%)',
        borderRadius: '24px',
        padding: '2px',
      }}
    >
      <style>
        {`
          .dashboard-tabs-wrap {
            display: inline-flex;
            gap: 10px;
            padding: 8px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.82);
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
            border: 1px solid rgba(15, 23, 42, 0.06);
            margin-bottom: 22px;
          }

          .dashboard-tab-btn {
            border: 0;
            min-width: 150px;
            padding: 12px 18px;
            border-radius: 15px;
            font-weight: 900;
            color: #4b5563;
            background: transparent;
            transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease;
          }

          .dashboard-tab-btn:hover {
            transform: translateY(-1px);
            color: #4f0b52;
          }

          .dashboard-tab-btn.active {
            color: #fff;
            background: linear-gradient(135deg, #4f0b52, #8a3a8c);
            box-shadow: 0 12px 26px rgba(87, 4, 87, 0.22);
          }

          .dashboard-modern-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 22px 48px rgba(15, 23, 42, 0.13) !important;
          }

          .vendor-dashboard-modern .card {
            border: 0;
          }

          .vendor-dashboard-modern .progress {
            border-radius: 999px;
            height: 10px;
            background-color: rgba(15, 23, 42, 0.08);
          }

          .vendor-dashboard-modern .progress-bar {
            border-radius: 999px;
          }

          .vendor-dashboard-modern .today-trip-card {
            border-radius: 22px;
            overflow: hidden;
            box-shadow: 0 16px 38px rgba(15, 23, 42, 0.08);
          }

          .vendor-dashboard-modern .today-trip-card .card-header {
            background: rgba(255, 255, 255, 0.88);
            border-bottom: 1px solid rgba(15, 23, 42, 0.06);
            padding: 18px 20px;
          }

          .vendor-dashboard-modern .today-trip-badge {
            width: 48px;
            height: 48px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4f0b52, #7b2f7e) !important;
            font-size: 22px;
            box-shadow: 0 12px 28px rgba(87, 4, 87, 0.24);
          }

          /* ================= MODERN CALENDAR LOOK ================= */
          .vendor-calendar-modern-wrap {
            margin-top: 28px;
            padding: 28px;
            border-radius: 30px;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.94)),
              radial-gradient(circle at top left, rgba(123,47,126,0.14), transparent 32%),
              radial-gradient(circle at top right, rgba(47,128,255,0.10), transparent 30%);
            box-shadow: 0 22px 55px rgba(15, 23, 42, 0.10);
            border: 1px solid rgba(255,255,255,0.85);
            overflow: hidden;
          }

          .vendor-calendar-modern-wrap h1,
          .vendor-calendar-modern-wrap h2,
          .vendor-calendar-modern-wrap h3,
          .vendor-calendar-modern-wrap .calendar-title,
          .vendor-calendar-modern-wrap [class*="title"] {
            color: #111827 !important;
            font-weight: 900 !important;
            letter-spacing: -0.04em !important;
            text-shadow: 0 1px 0 rgba(255,255,255,0.65);
          }

          .vendor-calendar-modern-wrap button,
          .vendor-calendar-modern-wrap [role="button"],
          .vendor-calendar-modern-wrap a[href="#"],
          .vendor-calendar-modern-wrap span[onclick] {
            border: 0 !important;
            border-radius: 14px !important;
            box-shadow: 0 12px 28px rgba(123, 17, 79, 0.28) !important;
            background: linear-gradient(135deg, #7b114f, #c2185b) !important;
            color: #fff !important;
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: 900 !important;
            text-decoration: none !important;
            transition: transform 160ms ease, box-shadow 160ms ease;
          }

          .vendor-calendar-modern-wrap button:hover,
          .vendor-calendar-modern-wrap [role="button"]:hover,
          .vendor-calendar-modern-wrap a[href="#"]:hover,
          .vendor-calendar-modern-wrap span[onclick]:hover {
            transform: translateY(-2px) scale(1.03);
            box-shadow: 0 16px 34px rgba(123, 17, 79, 0.36) !important;
          }

          .vendor-calendar-modern-wrap button:first-child,
          .vendor-calendar-modern-wrap button:last-child {
            font-size: 0 !important;
          }

          .vendor-calendar-modern-wrap button:first-child::before,
          .vendor-calendar-modern-wrap [aria-label*="prev"]::before,
          .vendor-calendar-modern-wrap [aria-label*="Previous"]::before {
            content: '‹';
            font-size: 26px;
            line-height: 1;
          }

          .vendor-calendar-modern-wrap button:last-child::before,
          .vendor-calendar-modern-wrap [aria-label*="next"]::before,
          .vendor-calendar-modern-wrap [aria-label*="Next"]::before {
            content: '›';
            font-size: 26px;
            line-height: 1;
          }

          .vendor-calendar-modern-wrap table {
            width: 100%;
            border-collapse: separate !important;
            border-spacing: 10px !important;
          }

          .vendor-calendar-modern-wrap th {
            color: #047857 !important;
            font-size: 18px !important;
            font-weight: 900 !important;
            padding: 8px 4px !important;
            text-align: center !important;
          }

          .vendor-calendar-modern-wrap th:first-child,
          .vendor-calendar-modern-wrap th:nth-child(6),
          .vendor-calendar-modern-wrap th:nth-child(7) {
            color: #047857 !important;
            background: transparent !important;
            box-shadow: none !important;
          }

          .vendor-calendar-modern-wrap td {
            border-radius: 20px !important;
            border: 1px solid rgba(15, 23, 42, 0.06) !important;
            background: linear-gradient(180deg, #ffffff, #f8fafc) !important;
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.07) !important;
            transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
            overflow: hidden;
          }

          .vendor-calendar-modern-wrap td:hover {
            transform: translateY(-3px);
            box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12) !important;
            filter: saturate(1.04);
          }

          .vendor-calendar-modern-wrap tbody tr td:first-child,
          .vendor-calendar-modern-wrap tbody tr td:nth-child(6),
          .vendor-calendar-modern-wrap tbody tr td:nth-child(7) {
            background: linear-gradient(180deg, #ffffff, #f8fafc) !important;
            color: #1A1A2E !important;
            border: 1px solid rgba(15, 23, 42, 0.06) !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
          }

          .vendor-calendar-modern-wrap tbody tr td:first-child *,
          .vendor-calendar-modern-wrap tbody tr td:nth-child(6) *,
          .vendor-calendar-modern-wrap tbody tr td:nth-child(7) * {
            color: inherit !important;
          }

          .vendor-calendar-modern-wrap [style*="background-color: green"],
          .vendor-calendar-modern-wrap [style*="background-color:green"],
          .vendor-calendar-modern-wrap [style*="background: green"],
          .vendor-calendar-modern-wrap [style*="background: rgb(0, 128, 0"],
          .vendor-calendar-modern-wrap [style*="background-color: rgb(0, 128, 0"],
          .vendor-calendar-modern-wrap [style*="background-color:rgb(0, 128, 0"],
          .vendor-calendar-modern-wrap [style*="background-color: #8f"],
          .vendor-calendar-modern-wrap [style*="background-color:#8f"],
          .vendor-calendar-modern-wrap [style*="background-color: #90"],
          .vendor-calendar-modern-wrap [style*="background-color:#90"] {
            background: #B5005B !important;
            background-color: #B5005B !important;
            color: #fff !important;
            border: 1px solid rgba(255,255,255,0.30) !important;
            box-shadow: 0 14px 32px rgba(181, 0, 91, 0.35) !important;
          }

          .vendor-calendar-modern-wrap [style*="background-color: green"] *,
          .vendor-calendar-modern-wrap [style*="background-color:green"] *,
          .vendor-calendar-modern-wrap [style*="background: green"] *,
          .vendor-calendar-modern-wrap [style*="background: rgb(0, 128, 0"] *,
          .vendor-calendar-modern-wrap [style*="background-color: rgb(0, 128, 0"] *,
          .vendor-calendar-modern-wrap [style*="background-color:rgb(0, 128, 0"] *,
          .vendor-calendar-modern-wrap [style*="background-color: #8f"] *,
          .vendor-calendar-modern-wrap [style*="background-color:#8f"] *,
          .vendor-calendar-modern-wrap [style*="background-color: #90"] *,
          .vendor-calendar-modern-wrap [style*="background-color:#90"] * {
            color: #fff !important;
          }

          .vendor-calendar-modern-wrap [style*="background-color: purple"],
          .vendor-calendar-modern-wrap [style*="background: purple"],
          .vendor-calendar-modern-wrap [style*="background-color: rgb(216"],
          .vendor-calendar-modern-wrap [style*="background: rgb(216"] {
            background: linear-gradient(135deg, #eadcff, #d9c4ff) !important;
            color: #5b21b6 !important;
            border: 1px solid rgba(123,47,126,0.14) !important;
            box-shadow: 0 14px 30px rgba(123, 47, 126, 0.12) !important;
          }

          .vendor-calendar-modern-wrap [class*="count"],
          .vendor-calendar-modern-wrap [class*="badge"],
          .vendor-calendar-modern-wrap .badge {
            border-radius: 13px !important;
            min-width: 42px !important;
            height: 42px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-weight: 900 !important;
            background: rgba(255,255,255,0.22) !important;
            color: inherit !important;
            backdrop-filter: blur(8px);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.30);
          }

          .vendor-calendar-modern-wrap td[style*="green"],
          .vendor-calendar-modern-wrap td[style*="rgb(0, 128, 0"],
          .vendor-calendar-modern-wrap td[style*="#8f"],
          .vendor-calendar-modern-wrap td[style*="#90"],
          .vendor-calendar-modern-wrap td[class*="green"],
          .vendor-calendar-modern-wrap td[class*="occupied"],
          .vendor-calendar-modern-wrap td[class*="booked"],
          .vendor-calendar-modern-wrap .occupied,
          .vendor-calendar-modern-wrap .booked,
          .vendor-calendar-modern-wrap .green,
          .vendor-calendar-modern-wrap [class*="occupied"],
          .vendor-calendar-modern-wrap [class*="booked"] {
            background: #B5005B !important;
            background-color: #B5005B !important;
            color: #fff !important;
            border: 1px solid rgba(255,255,255,0.30) !important;
            box-shadow: 0 14px 32px rgba(181, 0, 91, 0.35) !important;
          }

          .vendor-calendar-modern-wrap td[style*="green"] *,
          .vendor-calendar-modern-wrap td[style*="rgb(0, 128, 0"] *,
          .vendor-calendar-modern-wrap td[style*="#8f"] *,
          .vendor-calendar-modern-wrap td[style*="#90"] *,
          .vendor-calendar-modern-wrap td[class*="green"] *,
          .vendor-calendar-modern-wrap td[class*="occupied"] *,
          .vendor-calendar-modern-wrap td[class*="booked"] *,
          .vendor-calendar-modern-wrap .occupied *,
          .vendor-calendar-modern-wrap .booked *,
          .vendor-calendar-modern-wrap .green *,
          .vendor-calendar-modern-wrap [class*="occupied"] *,
          .vendor-calendar-modern-wrap [class*="booked"] * {
            color: #fff !important;
          }

          .vendor-dashboard-modern .modal,
          .vendor-dashboard-modern .modal-overlay,
          .vendor-dashboard-modern [class*="modal-overlay"] {
            background: rgba(15, 23, 42, 0.54) !important;
            backdrop-filter: blur(10px) !important;
          }

          .vendor-dashboard-modern .modal-dialog {
            max-width: 620px !important;
          }

          .vendor-dashboard-modern .modal-content,
          .vendor-dashboard-modern .modal-content_50,
          .vendor-dashboard-modern [class*="modal-content"] {
            border: 0 !important;
            border-radius: 28px !important;
            overflow: hidden !important;
            box-shadow: 0 28px 80px rgba(15, 23, 42, 0.34) !important;
            background:
              linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98)) !important;
          }

          .vendor-dashboard-modern .modal-header,
          .vendor-dashboard-modern [class*="modal-header"] {
            background: linear-gradient(135deg, #4f0b52, #8a3a8c) !important;
            color: #fff !important;
            border: 0 !important;
            padding: 20px 24px !important;
          }

          .vendor-dashboard-modern .modal-title,
          .vendor-dashboard-modern [class*="modal-title"] {
            font-weight: 900 !important;
            letter-spacing: -0.03em !important;
            color: #fff !important;
          }

          .vendor-dashboard-modern .modal-body,
          .vendor-dashboard-modern [class*="modal-body"] {
            padding: 24px !important;
            color: #111827 !important;
          }

          .vendor-dashboard-modern .modal-footer,
          .vendor-dashboard-modern [class*="modal-footer"] {
            border-top: 1px solid rgba(15, 23, 42, 0.06) !important;
            padding: 18px 24px !important;
            background: rgba(248,250,252,0.86) !important;
          }

          .vendor-dashboard-modern .modal-body table,
          .vendor-dashboard-modern [class*="modal-body"] table {
            border-collapse: separate !important;
            border-spacing: 0 10px !important;
          }

          .vendor-dashboard-modern .modal-body tr,
          .vendor-dashboard-modern [class*="modal-body"] tr {
            background: #fff !important;
            border-radius: 16px !important;
            box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06) !important;
          }

          .vendor-dashboard-modern .modal-body td,
          .vendor-dashboard-modern [class*="modal-body"] td {
            padding: 12px 14px !important;
            border: 0 !important;
          }

          .vendor-dashboard-modern .modal button,
          .vendor-dashboard-modern [class*="modal"] button {
            border-radius: 14px !important;
            border: 0 !important;
            font-weight: 800 !important;
            padding: 10px 18px !important;
          }

          .vendor-calendar-modern-wrap tbody td[style*="green"],
          .vendor-calendar-modern-wrap tbody td[style*="Green"],
          .vendor-calendar-modern-wrap tbody td[style*="#008000"],
          .vendor-calendar-modern-wrap tbody td[style*="#00ff00"],
          .vendor-calendar-modern-wrap tbody td[style*="#90"],
          .vendor-calendar-modern-wrap tbody td[style*="#8f"],
          .vendor-calendar-modern-wrap tbody td[style*="#93"],
          .vendor-calendar-modern-wrap tbody td[style*="#9c"],
          .vendor-calendar-modern-wrap tbody td[style*="rgb(0, 128, 0"],
          .vendor-calendar-modern-wrap tbody td[style*="rgb(143"],
          .vendor-calendar-modern-wrap tbody td[style*="rgb(144"],
          .vendor-calendar-modern-wrap tbody td[style*="rgb(147"],
          .vendor-calendar-modern-wrap tbody td[style*="rgb(156"],
          .vendor-calendar-modern-wrap tbody td[style*="rgba(0, 128, 0"],
          .vendor-calendar-modern-wrap tbody td[style*="rgba(143"],
          .vendor-calendar-modern-wrap tbody td[style*="rgba(144"],
          .vendor-calendar-modern-wrap tbody td[style*="rgba(147"],
          .vendor-calendar-modern-wrap tbody td[style*="rgba(156"],
          .vendor-calendar-modern-wrap tbody td[class*="green"],
          .vendor-calendar-modern-wrap tbody td[class*="Green"],
          .vendor-calendar-modern-wrap tbody td[class*="occupied"],
          .vendor-calendar-modern-wrap tbody td[class*="Occupied"],
          .vendor-calendar-modern-wrap tbody td[class*="booked"],
          .vendor-calendar-modern-wrap tbody td[class*="Booked"] {
            background: #B5005B !important;
            background-color: #B5005B !important;
            color: #fff !important;
            border: 1px solid rgba(255,255,255,0.30) !important;
            box-shadow: 0 14px 32px rgba(181, 0, 91, 0.35) !important;
          }

          .vendor-calendar-modern-wrap tbody td[style*="green"] *,
          .vendor-calendar-modern-wrap tbody td[style*="Green"] *,
          .vendor-calendar-modern-wrap tbody td[style*="#008000"] *,
          .vendor-calendar-modern-wrap tbody td[style*="#00ff00"] *,
          .vendor-calendar-modern-wrap tbody td[style*="#90"] *,
          .vendor-calendar-modern-wrap tbody td[style*="#8f"] *,
          .vendor-calendar-modern-wrap tbody td[style*="#93"] *,
          .vendor-calendar-modern-wrap tbody td[style*="#9c"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgb(0, 128, 0"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgb(143"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgb(144"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgb(147"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgb(156"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgba(0, 128, 0"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgba(143"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgba(144"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgba(147"] *,
          .vendor-calendar-modern-wrap tbody td[style*="rgba(156"] *,
          .vendor-calendar-modern-wrap tbody td[class*="green"] *,
          .vendor-calendar-modern-wrap tbody td[class*="Green"] *,
          .vendor-calendar-modern-wrap tbody td[class*="occupied"] *,
          .vendor-calendar-modern-wrap tbody td[class*="Occupied"] *,
          .vendor-calendar-modern-wrap tbody td[class*="booked"] *,
          .vendor-calendar-modern-wrap tbody td[class*="Booked"] * {
            color: #fff !important;
          }


          /* ✅ FINAL MEMBERSHIP CALENDAR OVERRIDE: BOOKED / COMPLETED dates must be GREEN */
          .vendor-calendar-modern-wrap .membership-cal-day.has-booked,
          .vendor-calendar-modern-wrap .membership-cal-day.has-completed,
          .vendor-calendar-modern-wrap tbody td.has-booked,
          .vendor-calendar-modern-wrap tbody td.has-completed,
          .vendor-calendar-modern-wrap tbody td[class*="has-booked"],
          .vendor-calendar-modern-wrap tbody td[class*="has-completed"] {
            background: linear-gradient(135deg, #16a34a, #22c55e) !important;
            background-color: #16a34a !important;
            color: #ffffff !important;
            border: 1px solid rgba(255,255,255,0.35) !important;
            box-shadow: 0 14px 32px rgba(22, 163, 74, 0.35) !important;
          }

          .vendor-calendar-modern-wrap .membership-cal-day.has-completed,
          .vendor-calendar-modern-wrap tbody td.has-completed,
          .vendor-calendar-modern-wrap tbody td[class*="has-completed"] {
            background: linear-gradient(135deg, #047857, #16a34a) !important;
            background-color: #047857 !important;
            color: #ffffff !important;
            box-shadow: 0 14px 32px rgba(4, 120, 87, 0.35) !important;
          }

          .vendor-calendar-modern-wrap .membership-cal-day.has-booked *,
          .vendor-calendar-modern-wrap .membership-cal-day.has-completed *,
          .vendor-calendar-modern-wrap tbody td.has-booked *,
          .vendor-calendar-modern-wrap tbody td.has-completed *,
          .vendor-calendar-modern-wrap tbody td[class*="has-booked"] *,
          .vendor-calendar-modern-wrap tbody td[class*="has-completed"] * {
            color: #ffffff !important;
          }

          @media (max-width: 768px) {
            .vendor-dashboard-modern {
              padding: 0 !important;
            }

            .vendor-calendar-modern-wrap {
              padding: 14px;
              border-radius: 20px;
            }

            .vendor-calendar-modern-wrap table {
              border-spacing: 6px !important;
            }

            .vendor-calendar-modern-wrap th {
              font-size: 14px !important;
            }
          }
        `}
      </style>

      {/* ======== SCHOOL / MEMBERSHIP TABS ======== */}
      <div className="dashboard-tabs-wrap">
        <button
          type="button"
          className={`dashboard-tab-btn ${activeDashboardTab === 'school' ? 'active' : ''}`}
          onClick={() => navigate('/vendor/dashboard')}
        >
          {tr('dashSchoolTab', 'School')}
        </button>
        <button
          type="button"
          className={`dashboard-tab-btn ${activeDashboardTab === 'membership' ? 'active' : ''}`}
          onClick={() => setActiveDashboardTab('membership')}
        >
          {tr('dashMemberShipTab', 'MemberShip')}
        </button>
      </div>

      {/* ======== STATS AT THE TOP ======== */}
      <CRow className="mb-2">
        {activeStatCards.map((s) => (
          <CCol key={s.title} xs={12} sm={6} xl={4}>
            <StatCard
              title={s.title}
              value={s.value}
              color={s.color}
              statusKey={s.statusKey}
              onClick={() =>
                isSchoolTab
                  ? goToListByStatus(s.statusKey)
                  : goToMembershipListByStatus(s.statusKey)
              }
            />
          </CCol>
        ))}
      </CRow>

      {/* Wallet */}
      <CRow className="mb-2">
        <CCol xs={12} md={6}>
          <WalletCard
            label={tr('dashAmountReceived', 'Amount Received')}
            amount={activeAmountReceived}
            type="received"
          />
        </CCol>
        <CCol xs={12} md={6}>
          <WalletCard
            label={tr('dashBalance', 'Balance')}
            amount={activeBalance}
            type="balance"
          />
        </CCol>
      </CRow>

      {/* Today’s Trips */}
      <CRow className="mb-4">
        <CCol xs={12}>
          <CCard className="today-trip-card">
            <CCardHeader className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '15px',
                    background: 'rgba(108, 92, 231, 0.12)',
                    color: '#6c5ce7',
                  }}
                >
                  <CIcon icon={cilCalendar} style={{ width: 22, height: 22 }} />
                </div>
                <div className="fw-bold" style={{ fontSize: '17px' }}>
                  {activeTodayLabel}
                </div>
              </div>
              <CBadge color="primary" shape="rounded-pill" className="today-trip-badge">
                {activeTodayCount}
              </CBadge>
            </CCardHeader>
            <CCardBody style={{ padding: '20px' }}>
              <CProgress value={100} color="primary" />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Calendar */}
      <div className="vendor-calendar-modern-wrap">
        <MemberShipCalenderScreen />
      </div>

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
    </div>
  )
}

export default MemberShipdashboard
