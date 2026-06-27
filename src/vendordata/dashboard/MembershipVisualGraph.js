// src/pages/dashboard/MembershipVisualGraph.js
import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CRow,
  CCol,
  CBadge,
  CSpinner,
  CAlert,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilChartLine,
  cilCheckCircle,
  cilCalendar,
  cilMoney,
  cilLayers,
  cilX,
  cilArrowRight,
} from '@coreui/icons'
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID } from '../../utils/operation'

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const formatAmount = (value) => {
  const n = toNumber(value)
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatCount = (value) => {
  const n = toNumber(value)
  return n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })
}

const cleanText = (value) => (value ?? '').toString().trim()

const startOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const dateKey = (date) => {
  const d = startOfDay(date)
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

const parseBookingDate = (value) => {
  const raw = cleanText(value)
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return startOfDay(d)
}

const getBookingDateValue = (row) => {
  const raw = cleanText(row.activityDate || row.bookingDate || row.BookingActivityDate || row.BookingDate)
  const parsed = parseBookingDate(raw)
  return parsed ? parsed.getTime() : 0
}

const mapUpcomingBooking = (item) => ({
  bookingId: cleanText(item.BookingID || item.bookingId || item.BookingRequestID),
  kidsName: cleanText(item.KidsName || item.kidsName),
  activityName: cleanText(item.actName || item.ActName || item.ActivityName || item.activityName),
  activityDate: cleanText(item.BookingActivityDate || item.activityDate || item.BookingDate || item.bookingDate),
  sortDate: getBookingDateValue({
    activityDate: item.BookingActivityDate || item.activityDate,
    bookingDate: item.BookingDate || item.bookingDate,
  }),
})

const getDayShort = (date) =>
  date.toLocaleDateString(undefined, {
    weekday: 'short',
  })

const getMonthShort = (date) =>
  date.toLocaleDateString(undefined, {
    month: 'short',
  })

const getDaysLeftText = (daysLeft, isRTL) => {
  if (daysLeft <= 0) return isRTL ? 'اليوم' : 'Today'
  if (daysLeft === 1) return isRTL ? 'بعد يوم واحد' : '1 Day Left'
  return isRTL ? `بعد ${daysLeft} أيام` : `${daysLeft} Days Left`
}

const getUpcomingTone = (daysLeft) => {
  if (daysLeft <= 1) return 'hot'
  if (daysLeft === 2) return 'green'
  if (daysLeft === 3) return 'orange'
  if (daysLeft === 4) return 'purple'
  if (daysLeft === 5) return 'cyan'
  if (daysLeft === 6) return 'pink'
  return 'blue'
}

function MiniStat({ icon, label, value, tone = 'purple', suffix = '', onClick }) {
  const tones = {
    purple: {
      bg: 'linear-gradient(135deg, rgba(79, 11, 82, 0.12), rgba(138, 58, 140, 0.06))',
      iconBg: 'linear-gradient(135deg, #4f0b52, #8a3a8c)',
      color: '#4f0b52',
    },
    blue: {
      bg: 'linear-gradient(135deg, rgba(47, 128, 255, 0.12), rgba(47, 128, 255, 0.05))',
      iconBg: 'linear-gradient(135deg, #1d4ed8, #2f80ff)',
      color: '#1d4ed8',
    },
    green: {
      bg: 'linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(22, 163, 74, 0.05))',
      iconBg: 'linear-gradient(135deg, #047857, #16a34a)',
      color: '#047857',
    },
    pink: {
      bg: 'linear-gradient(135deg, rgba(214, 51, 132, 0.13), rgba(214, 51, 132, 0.05))',
      iconBg: 'linear-gradient(135deg, #a20d86, #d63384)',
      color: '#a20d86',
    },
  }

  const theme = tones[tone] || tones.purple

  return (
    <button
      type="button"
      className={`mvg-mini-stat ${onClick ? 'mvg-clickable' : ''}`}
      onClick={onClick}
      style={{ background: theme.bg }}
    >
      <div className="mvg-mini-stat-icon" style={{ background: theme.iconBg }}>
        <CIcon icon={icon} />
      </div>
      <div>
        <div className="mvg-mini-stat-label">{label}</div>
        <div className="mvg-mini-stat-value" style={{ color: theme.color }}>
          {value}
          {suffix}
        </div>
      </div>
    </button>
  )
}

function ProgressBar({ label, value, max, amount, color = '#8a3a8c', onClick }) {
  const safeMax = Math.max(toNumber(max), 1)
  const pct = Math.max(0, Math.min(100, Math.round((toNumber(value) / safeMax) * 100)))

  return (
    <button type="button" className={`mvg-progress-row ${onClick ? 'mvg-clickable' : ''}`} onClick={onClick}>
      <div className="mvg-progress-top">
        <span>{label}</span>
        <strong>
          {amount} ({pct}%)
        </strong>
      </div>
      <div className="mvg-progress-track">
        <div
          className="mvg-progress-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.55))`,
          }}
        />
      </div>
    </button>
  )
}

const MembershipVisualGraph = ({
  isRTL = false,
  tr = (key, fallback) => fallback || key,
  bookedActivities = 0,
  completedActivities = 0,
  todayActivities = 0,
  amountReceived = 0,
  balance = 0,
  onOpenStatus,
}) => {
  const [showBalanceInfo, setShowBalanceInfo] = useState(false)
  const [upcomingLoading, setUpcomingLoading] = useState(false)
  const [upcomingError, setUpcomingError] = useState('')
  const [upcomingBookings, setUpcomingBookings] = useState([])

  useEffect(() => {
    let mounted = true

    const loadUpcomingBookings = async () => {
      try {
        setUpcomingLoading(true)
        setUpcomingError('')

        const res = await fetch(`${API_BASE_URL}/membership/booking/getbookinglist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            BookingVendorID: getCurrentLoggedUserID(),
            BookingStatus: 'BOOKED',
          }),
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const json = await res.json()
        if (json?.statusCode !== 200) {
          throw new Error(json?.message || 'Failed to load upcoming bookings')
        }

        const list = Array.isArray(json?.data) ? json.data : []
        const mapped = list
          .map(mapUpcomingBooking)
          .filter((x) => x.bookingId || x.kidsName || x.activityName)
          .sort((a, b) => a.sortDate - b.sortDate)

        if (mounted) setUpcomingBookings(mapped)
      } catch (err) {
        if (mounted) setUpcomingError(err?.message || 'Failed to load upcoming bookings')
      } finally {
        if (mounted) setUpcomingLoading(false)
      }
    }

    loadUpcomingBookings()

    return () => {
      mounted = false
    }
  }, [])

  const metrics = useMemo(() => {
    const booked = toNumber(bookedActivities)
    const completed = toNumber(completedActivities)
    const today = toNumber(todayActivities)
    const received = toNumber(amountReceived)
    const payableBalance = toNumber(balance)
    const totalAmount = received + payableBalance
    const completionRate = booked > 0 ? Math.round((completed / booked) * 100) : 0
    const receivedRate = totalAmount > 0 ? Math.round((received / totalAmount) * 100) : 0

    return {
      booked,
      completed,
      today,
      received,
      payableBalance,
      totalAmount,
      completionRate: Math.max(0, Math.min(100, completionRate)),
      receivedRate: Math.max(0, Math.min(100, receivedRate)),
    }
  }, [bookedActivities, completedActivities, todayActivities, amountReceived, balance])

  const upcomingDays = useMemo(() => {
    const today = startOfDay(new Date())
    const MS_PER_DAY = 24 * 60 * 60 * 1000

    const grouped = upcomingBookings.reduce((acc, booking) => {
      const d = parseBookingDate(booking.activityDate)
      if (!d) return acc

      const daysLeft = Math.round((d.getTime() - today.getTime()) / MS_PER_DAY)

      // ✅ Do not show today or past dates in Upcoming Bookings
      if (daysLeft < 1) return acc

      const key = dateKey(d)
      if (!acc[key]) {
        acc[key] = {
          key,
          date: d,
          daysLeft,
          tone: getUpcomingTone(daysLeft),
          count: 0,
        }
      }

      acc[key].count += 1
      return acc
    }, {})

    // ✅ Show booking dates only.
    // ✅ Minimum target is 5 upcoming booking days when API has enough data, even if dates are next month.
    // ✅ Maximum visible cards is 7 to keep the dashboard clean.
    return Object.values(grouped)
      .filter((day) => day.count > 0)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 7)
  }, [upcomingBookings])

  const graphRows = [
    {
      label: tr('dashBookedActivities', 'Booked Activities'),
      value: metrics.booked,
      amount: formatCount(metrics.booked),
      color: '#2f80ff',
      status: 'BOOKED',
    },
    {
      label: tr('dashCompletedActivities', 'Completed Activities'),
      value: metrics.completed,
      amount: formatCount(metrics.completed),
      color: '#6c5ce7',
      status: 'COMPLETED',
    },
    {
      label: tr('dashTodaysActivities', 'Today’s Activities'),
      value: metrics.today,
      amount: formatCount(metrics.today),
      color: '#16a34a',
    },
  ]

  const maxCount = Math.max(...graphRows.map((x) => x.value), 1)

  return (
    <div className={`membership-visual-graph ${isRTL ? 'mvg-rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <style>
        {`
          .membership-visual-graph {
            margin: 4px 0 28px;
          }

          .mvg-card {
            border: 0 !important;
            border-radius: 30px !important;
            overflow: hidden !important;
            background:
              radial-gradient(circle at top left, rgba(214, 51, 132, 0.13), transparent 36%),
              radial-gradient(circle at top right, rgba(47, 128, 255, 0.09), transparent 32%),
              linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98)) !important;
            box-shadow: 0 24px 62px rgba(15, 23, 42, 0.10) !important;
            border: 1px solid rgba(255, 255, 255, 0.88) !important;
          }

          .mvg-card-body {
            padding: 26px !important;
          }

          .mvg-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
          }

          .mvg-title-row {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .mvg-title-icon {
            width: 54px;
            height: 54px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #4f0b52, #d63384);
            color: #fff;
            box-shadow: 0 16px 32px rgba(162, 13, 134, 0.26);
            flex: 0 0 auto;
          }

          .mvg-title-icon svg {
            width: 26px;
            height: 26px;
          }

          .mvg-kicker {
            color: #a20d86;
            font-size: 12px;
            font-weight: 400;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 3px;
          }

          .mvg-title {
            margin: 0;
            color: #111827;
            font-size: 24px;
            font-weight: 400;
            letter-spacing: -0.04em;
            line-height: 1.12;
          }

          .mvg-subtitle {
            margin-top: 5px;
            color: #64748b;
            font-size: 13px;
            font-weight: 400;
          }

          .mvg-badge {
            border-radius: 999px !important;
            padding: 9px 13px !important;
            background: #fff0f8 !important;
            color: #a20d86 !important;
            border: 1px solid rgba(214, 51, 132, 0.18) !important;
            font-weight: 400 !important;
            white-space: nowrap;
          }

          .mvg-mini-stat {
            width: 100%;
            text-align: inherit;
            border: 1px solid rgba(15, 23, 42, 0.06);
            cursor: default;
            min-height: 104px;
            border-radius: 24px;
            padding: 17px;
            display: flex;
            align-items: center;
            gap: 14px;
            box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
            transition: transform 160ms ease, box-shadow 160ms ease;
          }

          .mvg-mini-stat.mvg-clickable {
            cursor: pointer;
          }

          .mvg-mini-stat:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 38px rgba(15, 23, 42, 0.09);
          }

          .mvg-mini-stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 18px;
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 12px 26px rgba(15, 23, 42, 0.14);
            flex: 0 0 auto;
          }

          .mvg-mini-stat-icon svg {
            width: 23px;
            height: 23px;
          }

          .mvg-mini-stat-label {
            color: #64748b;
            font-size: 12px;
            font-weight: 400;
            margin-bottom: 5px;
          }

          .mvg-mini-stat-value {
            font-size: 25px;
            font-weight: 400;
            line-height: 1;
            letter-spacing: -0.04em;
          }

          .mvg-upcoming-shell {
            margin: 20px 0 20px;
            border-radius: 28px;
            padding: 24px;
            background:
              radial-gradient(circle at top left, rgba(236, 26, 128, 0.08), transparent 34%),
              linear-gradient(180deg, #ffffff 0%, #fffafd 100%);
            border: 1px solid rgba(214, 51, 132, 0.16);
            box-shadow: 0 20px 48px rgba(214, 51, 132, 0.09);
            position: relative;
            overflow: hidden;
          }

          .mvg-upcoming-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
            position: relative;
            z-index: 1;
          }

          .mvg-upcoming-title-wrap {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
          }

          .mvg-upcoming-icon {
            width: 52px;
            height: 52px;
            border-radius: 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            background: linear-gradient(135deg, #ec1a80, #ff4da6);
            box-shadow: 0 14px 28px rgba(214, 51, 132, 0.22);
            flex: 0 0 auto;
          }

          .mvg-upcoming-icon svg {
            width: 24px;
            height: 24px;
          }

          .mvg-upcoming-title {
            color: #111827;
            font-size: 22px;
            font-weight: 400;
            letter-spacing: -0.02em;
            line-height: 1.12;
          }

          .mvg-upcoming-subtitle {
            color: #64748b;
            font-size: 13px;
            font-weight: 400;
            margin-top: 5px;
          }

          .mvg-view-all-btn {
            min-height: 44px;
            border-radius: 16px !important;
            padding: 0 18px !important;
            border: 1px solid rgba(214, 51, 132, 0.24) !important;
            background: linear-gradient(135deg, #ffffff, #fff4fa) !important;
            color: #d63384 !important;
            font-size: 13px !important;
            font-weight: 400 !important;
            box-shadow: 0 12px 24px rgba(214, 51, 132, 0.10) !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 9px !important;
            white-space: nowrap !important;
          }

          .mvg-view-all-btn:hover {
            background: linear-gradient(135deg, #d63384, #ff4da6) !important;
            color: #ffffff !important;
            transform: translateY(-1px);
          }

          .mvg-upcoming-empty {
            width: 100% !important;
            min-height: 120px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #64748b !important;
            font-size: 15px !important;
            font-weight: 400 !important;
            border: 1px dashed rgba(214, 51, 132, 0.24) !important;
            border-radius: 22px !important;
            background: rgba(255, 255, 255, 0.72) !important;
          }

          .mvg-upcoming-timeline {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(154px, 1fr));
            gap: 14px;
            position: relative;
            z-index: 1;
          }

          .mvg-day-card {
            position: relative;
            border: 1px solid var(--tone-border);
            background:
              linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82)),
              var(--tone-soft);
            text-align: center;
            padding: 16px 14px 14px;
            border-radius: 24px;
            min-width: 0;
            box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
            overflow: hidden;
          }

          .mvg-day-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--tone), rgba(255,255,255,0.1));
          }

          .mvg-day-dot {
            width: 12px;
            height: 12px;
            border-radius: 999px;
            margin: 0 auto 10px;
            background: var(--tone);
            border: 3px solid #fff;
            box-shadow: 0 0 0 2px var(--tone-soft), 0 8px 14px var(--tone-shadow);
          }

          .mvg-day-inner {
            min-height: 128px;
            border: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .mvg-day-card:first-child .mvg-day-inner,
          .mvg-rtl .mvg-day-inner,
          .mvg-rtl .mvg-day-card:first-child .mvg-day-inner {
            border: 0;
          }

          .mvg-tomorrow-pill {
            position: absolute;
            top: 10px;
            inset-inline-start: 10px;
            transform: none;
            border-radius: 999px;
            padding: 5px 10px;
            background: linear-gradient(135deg, #ec1a80, #ff4da6);
            color: #fff;
            font-size: 11px;
            font-weight: 400;
            box-shadow: 0 10px 20px rgba(214, 51, 132, 0.20);
            white-space: nowrap;
            z-index: 2;
          }

          .mvg-day-week {
            color: #334155;
            font-size: 13px;
            font-weight: 400;
            margin-bottom: 6px;
          }

          .mvg-day-date {
            display: flex;
            align-items: baseline;
            justify-content: center;
            gap: 7px;
            margin-bottom: 10px;
          }

          .mvg-day-num {
            color: #0f172a;
            font-size: 30px;
            font-weight: 400;
            letter-spacing: -0.02em;
            line-height: 1;
          }

          .mvg-day-month {
            color: var(--tone);
            font-size: 13px;
            font-weight: 400;
            text-transform: uppercase;
          }

          .mvg-day-bookings {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            color: #1e293b;
            font-size: 13px;
            font-weight: 400;
            margin-bottom: 10px;
          }

          .mvg-day-bookings svg {
            width: 16px;
            height: 16px;
            color: var(--tone);
          }

          .mvg-days-left {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 32px;
            border-radius: 999px;
            padding: 6px 13px;
            background: #ffffff;
            border: 1px solid var(--tone-border);
            color: var(--tone);
            font-size: 13px;
            font-weight: 400;
            white-space: nowrap;
            box-shadow: 0 8px 18px var(--tone-shadow);
          }

          .mvg-main-grid {
            display: grid;
            grid-template-columns: minmax(280px, 1fr) 340px;
            gap: 20px;
            margin-top: 20px;
          }

          .mvg-panel {
            border-radius: 26px;
            background: rgba(255, 255, 255, 0.90);
            border: 1px solid rgba(15, 23, 42, 0.06);
            box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
            padding: 20px;
          }

          .mvg-panel-title {
            color: #111827;
            font-size: 16px;
            font-weight: 400;
            letter-spacing: -0.02em;
            margin-bottom: 16px;
          }

          .mvg-progress-row {
            width: 100%;
            display: block;
            text-align: inherit;
            border: 0;
            background: transparent;
            padding: 0;
            cursor: default;
          }

          .mvg-progress-row.mvg-clickable {
            cursor: pointer;
          }

          .mvg-progress-row + .mvg-progress-row {
            margin-top: 20px;
          }

          .mvg-clickable:hover .mvg-progress-track {
            box-shadow: inset 0 2px 6px rgba(15, 23, 42, 0.06), 0 0 0 4px rgba(214, 51, 132, 0.10);
          }

          .mvg-progress-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            color: #475569;
            font-size: 13px;
            font-weight: 400;
            margin-bottom: 9px;
          }

          .mvg-progress-top strong {
            color: #111827;
            font-size: 14px;
            font-weight: 400;
          }

          .mvg-progress-track {
            width: 100%;
            height: 13px;
            border-radius: 999px;
            background: #eef2f7;
            overflow: hidden;
            box-shadow: inset 0 2px 6px rgba(15, 23, 42, 0.06);
          }

          .mvg-progress-fill {
            height: 100%;
            border-radius: 999px;
            min-width: 8px;
            transition: width 220ms ease;
          }

          .mvg-donut-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 180px;
          }

          .mvg-donut {
            width: 165px;
            height: 165px;
            border-radius: 50%;
            background:
              conic-gradient(#d63384 0deg, #d63384 var(--mvg-deg), #c9c5ff var(--mvg-deg), #e8ecf3 360deg);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 18px 38px rgba(162, 13, 134, 0.16);
            position: relative;
          }

          .mvg-donut::after {
            content: "";
            width: 108px;
            height: 108px;
            border-radius: 50%;
            background: #fff;
            position: absolute;
            box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
          }

          .mvg-donut-center {
            position: relative;
            z-index: 1;
            text-align: center;
          }

          .mvg-donut-value {
            color: #4f0b52;
            font-size: 31px;
            font-weight: 400;
            letter-spacing: -0.05em;
            line-height: 1;
          }

          .mvg-donut-label {
            margin-top: 6px;
            color: #64748b;
            font-size: 12px;
            font-weight: 400;
          }

          .mvg-money-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 16px;
          }

          .mvg-money-box {
            border-radius: 20px;
            padding: 14px;
            background: linear-gradient(135deg, #fff7fc, #ffffff);
            border: 1px solid rgba(214, 51, 132, 0.12);
          }

          .mvg-money-label {
            color: #64748b;
            font-size: 11px;
            font-weight: 400;
            margin-bottom: 5px;
          }

          .mvg-money-value {
            color: #111827;
            font-size: 18px;
            font-weight: 400;
            letter-spacing: -0.04em;
          }

          .mvg-money-box-btn {
            width: 100%;
            text-align: inherit;
            cursor: pointer;
            transition: transform 160ms ease, box-shadow 160ms ease;
          }

          .mvg-money-box-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(162, 13, 134, 0.12);
          }

          .mvg-balance-backdrop {
            position: fixed;
            inset: 0;
            z-index: 1060;
            background: rgba(15, 23, 42, 0.58);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
          }

          .mvg-balance-modal {
            width: min(520px, 100%);
            border-radius: 28px;
            background: #ffffff;
            box-shadow: 0 30px 80px rgba(15, 23, 42, 0.30);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.7);
          }

          .mvg-balance-modal-head {
            padding: 22px;
            color: #fff;
            background: linear-gradient(135deg, #4f0b52, #d63384);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .mvg-balance-modal-title {
            font-size: 21px;
            font-weight: 400;
            letter-spacing: -0.03em;
          }

          .mvg-balance-close {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.18);
            color: #fff;
            background: rgba(255,255,255,0.15);
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .mvg-balance-modal-body {
            padding: 22px;
          }

          .mvg-balance-line {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 14px;
            border-radius: 18px;
            background: #fff7fc;
            border: 1px solid rgba(214, 51, 132, 0.12);
            color: #111827;
            font-weight: 400;
          }

          .mvg-balance-line + .mvg-balance-line {
            margin-top: 10px;
          }

          .mvg-balance-note {
            margin-top: 14px;
            color: #64748b;
            font-size: 13px;
            font-weight: 400;
            line-height: 1.55;
          }

          @media (max-width: 1199px) {
            .mvg-upcoming-empty {
            width: 100% !important;
            min-height: 120px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #64748b !important;
            font-size: 15px !important;
            font-weight: 400 !important;
            border: 1px dashed rgba(214, 51, 132, 0.24) !important;
            border-radius: 22px !important;
            background: rgba(255, 255, 255, 0.64) !important;
          }

          .mvg-upcoming-timeline {
              overflow-x: auto;
              display: flex;
              gap: 0;
              padding-bottom: 8px;
            }

            .mvg-day-card {
              min-width: 160px;
              flex: 0 0 160px;
            }
          }

          @media (max-width: 991px) {
            .mvg-main-grid {
              grid-template-columns: 1fr;
            }

            .mvg-header,
            .mvg-upcoming-head {
              flex-direction: column;
              align-items: stretch;
            }

            .mvg-view-all-btn {
              justify-content: center !important;
              width: 100%;
            }
          }

          @media (max-width: 575px) {
            .mvg-card-body {
              padding: 16px !important;
            }

            .mvg-title-row {
              align-items: flex-start;
            }

            .mvg-title {
              font-size: 20px;
            }

            .mvg-money-row {
              grid-template-columns: 1fr;
            }

            .mvg-upcoming-shell {
              padding: 18px 14px 14px;
            }
          }
        `}
      </style>

      <CCard className="mvg-card">
        <CCardBody className="mvg-card-body">
          <div className="mvg-header">
            <div className="mvg-title-row">
              <div className="mvg-title-icon">
                <CIcon icon={cilChartLine} />
              </div>
              <div>
                <div className="mvg-kicker">{tr('dashMemberShipTab', 'MemberShip')}</div>
                <h3 className="mvg-title">
                  {isRTL ? 'تحليل حجوزات العضوية' : 'Membership Booking Visual Summary'}
                </h3>
                <div className="mvg-subtitle">
                  {isRTL
                    ? 'عرض مرئي سريع يساعد المستخدم على فهم الحجوزات والمبالغ بسهولة'
                    : 'A quick visual view to understand bookings and amounts easily'}
                </div>
              </div>
            </div>

            <CBadge className="mvg-badge">
              {isRTL ? 'نسبة الإنجاز' : 'Completion Rate'}: {metrics.completionRate}%
            </CBadge>
          </div>

          <CRow className="g-3">
            <CCol xs={12} sm={6} xl={3}>
              <MiniStat
                icon={cilCalendar}
                label={tr('dashBookedActivities', 'Booked Activities')}
                value={formatCount(metrics.booked)}
                tone="blue"
                onClick={() => onOpenStatus?.('BOOKED')}
              />
            </CCol>
            <CCol xs={12} sm={6} xl={3}>
              <MiniStat
                icon={cilCheckCircle}
                label={tr('dashCompletedActivities', 'Completed Activities')}
                value={formatCount(metrics.completed)}
                tone="purple"
                onClick={() => onOpenStatus?.('COMPLETED')}
              />
            </CCol>
            <CCol xs={12} sm={6} xl={3}>
              <MiniStat
                icon={cilLayers}
                label={tr('dashTodaysActivities', 'Today’s Activities')}
                value={formatCount(metrics.today)}
                tone="green"
              />
            </CCol>
            <CCol xs={12} sm={6} xl={3}>
              <MiniStat
                icon={cilMoney}
                label={tr('dashAmountReceived', 'Amount Received')}
                value={formatAmount(metrics.received)}
                tone="pink"
              />
            </CCol>
          </CRow>

          <div className="mvg-upcoming-shell">
            <div className="mvg-upcoming-head">
              <div className="mvg-upcoming-title-wrap">
                <div className="mvg-upcoming-icon">
                  <CIcon icon={cilCalendar} />
                </div>
                <div>
                  <div className="mvg-upcoming-title">
                    {isRTL ? 'الحجوزات القادمة' : 'Upcoming Bookings'}
                  </div>
                  <div className="mvg-upcoming-subtitle">
                    {isRTL ? 'أقرب الحجوزات القادمة حسب التاريخ' : 'Next booking dates from today'}
                  </div>
                </div>
              </div>

              <CButton className="mvg-view-all-btn" type="button" onClick={() => onOpenStatus?.('BOOKED')}>
                <CIcon icon={cilCalendar} />
                {isRTL ? 'عرض كل الحجوزات' : 'View All Bookings'}
                <CIcon icon={cilArrowRight} />
              </CButton>
            </div>

            {upcomingLoading && (
              <div className="py-4 text-center">
                <CSpinner size="sm" />
              </div>
            )}

            {!upcomingLoading && upcomingError && (
              <CAlert color="danger" className="mb-0">
                {upcomingError}
              </CAlert>
            )}

            {!upcomingLoading && !upcomingError && (
              <div className="mvg-upcoming-timeline">
                {upcomingDays.length === 0 && (
                  <div className="mvg-upcoming-empty">
                    {isRTL ? 'لا توجد حجوزات قادمة' : 'No upcoming bookings'}
                  </div>
                )}

                {upcomingDays.map((day, index) => {
                  const toneVars = {
                    hot: ['#ec1a80', 'rgba(236,26,128,0.12)', 'rgba(236,26,128,0.24)', 'rgba(236,26,128,0.18)'],
                    green: ['#16a34a', 'rgba(22,163,74,0.12)', 'rgba(22,163,74,0.22)', 'rgba(22,163,74,0.18)'],
                    orange: ['#f97316', 'rgba(249,115,22,0.12)', 'rgba(249,115,22,0.22)', 'rgba(249,115,22,0.18)'],
                    purple: ['#9333ea', 'rgba(147,51,234,0.12)', 'rgba(147,51,234,0.22)', 'rgba(147,51,234,0.18)'],
                    cyan: ['#0891b2', 'rgba(8,145,178,0.12)', 'rgba(8,145,178,0.22)', 'rgba(8,145,178,0.18)'],
                    pink: ['#db2777', 'rgba(219,39,119,0.12)', 'rgba(219,39,119,0.22)', 'rgba(219,39,119,0.18)'],
                    blue: ['#2563eb', 'rgba(37,99,235,0.12)', 'rgba(37,99,235,0.22)', 'rgba(37,99,235,0.18)'],
                  }[day.tone]

                  return (
                    <div
                      className="mvg-day-card"
                      key={day.key}
                      style={{
                        '--tone': toneVars[0],
                        '--tone-soft': toneVars[1],
                        '--tone-border': toneVars[2],
                        '--tone-shadow': toneVars[3],
                      }}
                    >
                      {day.daysLeft === 1 && (
                        <div className="mvg-tomorrow-pill">{isRTL ? 'غداً' : 'Tomorrow'}</div>
                      )}
                      <div className="mvg-day-dot" />
                      <div className="mvg-day-inner">
                        <div className="mvg-day-week">{getDayShort(day.date)}</div>
                        <div className="mvg-day-date">
                          <span className="mvg-day-num">{`${day.date.getDate()}`.padStart(2, '0')}</span>
                          <span className="mvg-day-month">{getMonthShort(day.date)}</span>
                        </div>
                        {day.count > 0 && (
                          <div className="mvg-day-bookings">
                            <CIcon icon={cilCalendar} />
                            {day.count} {day.count === 1 ? (isRTL ? 'حجز' : 'Booking') : (isRTL ? 'حجوزات' : 'Bookings')}
                          </div>
                        )}
                        <div className="mvg-days-left">{getDaysLeftText(day.daysLeft, isRTL)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mvg-main-grid">
            <div className="mvg-panel">
              <div className="mvg-panel-title">{isRTL ? 'مقارنة الحجوزات' : 'Booking Comparison'}</div>

              {graphRows.map((row) => (
                <ProgressBar
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  max={maxCount}
                  amount={row.amount}
                  color={row.color}
                  onClick={row.status ? () => onOpenStatus?.(row.status) : undefined}
                />
              ))}
            </div>

            <div className="mvg-panel">
              <div className="mvg-panel-title">{isRTL ? 'تحصيل المبلغ' : 'Amount Collection'}</div>

              <div className="mvg-donut-wrap">
                <div
                  className="mvg-donut"
                  style={{
                    '--mvg-deg': `${Math.round((metrics.receivedRate / 100) * 360)}deg`,
                  }}
                >
                  <div className="mvg-donut-center">
                    <div className="mvg-donut-value">{metrics.receivedRate}%</div>
                    <div className="mvg-donut-label">{isRTL ? 'تم التحصيل' : 'Received'}</div>
                  </div>
                </div>
              </div>

              <div className="mvg-money-row">
                <div className="mvg-money-box">
                  <div className="mvg-money-label">{tr('dashAmountReceived', 'Amount Received')}</div>
                  <div className="mvg-money-value">{formatAmount(metrics.received)}</div>
                </div>
                <button type="button" className="mvg-money-box mvg-money-box-btn" onClick={() => setShowBalanceInfo(true)}>
                  <div className="mvg-money-label">{tr('dashBalance', 'Balance')}</div>
                  <div className="mvg-money-value">{formatAmount(metrics.payableBalance)}</div>
                </button>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {showBalanceInfo && (
        <div className="mvg-balance-backdrop" onClick={() => setShowBalanceInfo(false)}>
          <div className="mvg-balance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mvg-balance-modal-head">
              <div>
                <div className="mvg-balance-modal-title">{isRTL ? 'تفاصيل الرصيد' : 'Balance Details'}</div>
                <div className="mvg-subtitle" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  {isRTL ? 'مصدر المبلغ من ملخص لوحة التحكم' : 'Amount source from dashboard summary'}
                </div>
              </div>
              <button type="button" className="mvg-balance-close" onClick={() => setShowBalanceInfo(false)}>
                <CIcon icon={cilX} />
              </button>
            </div>
            <div className="mvg-balance-modal-body">
              <div className="mvg-balance-line">
                <span>{tr('dashAmountReceived', 'Amount Received')}</span>
                <strong>{formatAmount(metrics.received)}</strong>
              </div>
              <div className="mvg-balance-line">
                <span>{tr('dashBalance', 'Balance')}</span>
                <strong>{formatAmount(metrics.payableBalance)}</strong>
              </div>
              <div className="mvg-balance-line">
                <span>{isRTL ? 'إجمالي المبلغ' : 'Total Amount'}</span>
                <strong>{formatAmount(metrics.totalAmount)}</strong>
              </div>
              <div className="mvg-balance-note">
                {isRTL
                  ? 'الرصيد هو المبلغ المتبقي للدفع. يتم تحميله من API ملخص لوحة التحكم باستخدام مفاتيح TotalMembershipBalance / MembershipBalance / TotalPayableMembershipAmount.'
                  : 'Balance is the remaining payable amount. It is loaded from the dashboard summary API using TotalMembershipBalance / MembershipBalance / TotalPayableMembershipAmount.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MembershipVisualGraph
