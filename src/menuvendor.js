// src/_nav/vendormenu.js
import React, { useEffect, useState } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPuzzle,
  cilHome,
  cilCheckCircle,
  cilClock,
  cilXCircle,
  cilUser,
  cilBell,
  cilSettings,
  cilMoney,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

import { API_BASE_URL } from './config'
import { getAuthHeaders, getCurrentLoggedUserID } from './utils/operation'

const GET_VDR_SUMMARY = `${API_BASE_URL}/vendordata/dashboard/getvdrsummary`

const modernItemStyle = {
  margin: '2px 12px',
  borderRadius: '10px',
  padding: '2px 0',
}

const reportSubItemStyle = {
  margin: '2px 12px 2px 22px',
  borderRadius: '10px',
  padding: '2px 0',
}

const membershipSubItemStyle = {
  margin: '2px 12px',
  borderRadius: '10px',
  padding: '2px 0',
}

const membershipReportSubItemStyle = {
  margin: '2px 12px 2px 38px',
  borderRadius: '10px',
  padding: '2px 0',
}

function StatusCounter({ fallback, color, field }) {
  const [count, setCount] = useState(null)

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const resp = await fetch(GET_VDR_SUMMARY, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            VendorID: getCurrentLoggedUserID(),
          }),
        })

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

        const json = await resp.json()
        const d = json?.data || {}

        if (alive) setCount(d?.[field] ?? 0)
      } catch {
        if (alive) setCount(0)
      }
    })()

    return () => {
      alive = false
    }
  }, [field])

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <span>{fallback}</span>

      <span
        style={{
          background: color,
          color: '#fff',
          minWidth: '22px',
          height: '22px',
          borderRadius: '50%',
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '11px',
          fontWeight: '700',
        }}
      >
        {count === null ? '…' : count}
      </span>
    </div>
  )
}

const vendormenu = [
  // ================= DASHBOARD =================
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/vendor/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    style: modernItemStyle,
  },

  // ================= SCHOOL MANAGEMENT =================
  {
    component: CNavTitle,
    name: 'SCHOOL MANAGEMENT',
    className: 'vendor-menu-title vendor-school-card',
  },
  {
    component: CNavItem,
    name: 'School Activities',
    to: '/vendordata/activityinfo/activity/list',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
    style: modernItemStyle,
    className: 'vendor-menu-item vendor-school-card',
  },
  {
    component: CNavItem,
    name: (
      <StatusCounter
        fallback="Booked Trips"
        color="#28c76f"
        field="TotalApproved"
      />
    ),
    to: '/vendor/activity-requests?status=APPROVED',
    icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
    style: modernItemStyle,
    className: 'vendor-menu-item vendor-school-card',
  },
  {
    component: CNavItem,
    name: (
      <StatusCounter
        fallback="Pending Trips"
        color="#ff9f43"
        field="TotalPending"
      />
    ),
    to: '/vendor/activity-requests?status=WAITING-FOR-APPROVAL',
    icon: <CIcon icon={cilClock} customClassName="nav-icon" />,
    style: modernItemStyle,
    className: 'vendor-menu-item vendor-school-card',
  },
  {
    component: CNavItem,
    name: (
      <StatusCounter
        fallback="Rejected Trips"
        color="#ea5455"
        field="TotalRejected"
      />
    ),
    to: '/vendor/activity-requests?status=REJECTED',
    icon: <CIcon icon={cilXCircle} customClassName="nav-icon" />,
    style: modernItemStyle,
    className: 'vendor-menu-item vendor-school-card',
  },

  // ================= REPORT =================
  {
    component: CNavTitle,
    name: 'REPORT',
    className: 'vendor-menu-title vendor-report-card',
  },
  {
    component: CNavItem,
    name: 'Trip Booked',
    to: '/vendordata/trip/tripbooked',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    style: reportSubItemStyle,
    className: 'vendor-menu-item vendor-report-card vendor-report-submenu',
  },
  {
    component: CNavItem,
    name: 'Completed Trips',
    to: '/vendordata/trip/completed',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    style: reportSubItemStyle,
    className: 'vendor-menu-item vendor-report-card vendor-report-submenu',
  },

  // ================= MEMBERSHIP =================
  {
    component: CNavTitle,
    name: 'MEMBERSHIP',
    className: 'vendor-menu-title vendor-membership-card',
  },
  {
    component: CNavItem,
    name: 'Membership Activities',
    to: '/vendordata/membership/activity/list',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
    style: membershipSubItemStyle,
    className: 'vendor-menu-item vendor-membership-card',
  },
  {
    component: CNavItem,
    name: 'Booked Activity',
    to: '/vendordata/membership?status=BOOKED',
    icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
    style: membershipSubItemStyle,
    className: 'vendor-menu-item vendor-membership-card',
  },
  {
    component: CNavItem,
    name: 'Completed Activity',
    to: '/vendordata/membership?status=COMPLETED',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
    style: membershipSubItemStyle,
    className: 'vendor-menu-item vendor-membership-card',
  },

  // ✅ Membership internal report submenu
  {
    component: CNavTitle,
    name: 'REPORT',
    className: 'vendor-menu-title vendor-membership-card',
  },
  {
    component: CNavItem,
    name: 'Payment',
    to: '/vendordata/membership/report/payment',
    icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
    style: membershipReportSubItemStyle,
    className: 'vendor-menu-item vendor-membership-card vendor-report-submenu',
  },
  {
    component: CNavItem,
    name: 'Completed Booking',
    to: '/vendordata/membership/report/completed-booking?status=COMPLETED',
    icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
    style: membershipReportSubItemStyle,
    className: 'vendor-menu-item vendor-membership-card vendor-report-submenu',
  },

  // ================= SETTINGS =================
  {
    component: CNavTitle,
    name: 'SETTINGS',
    className: 'vendor-menu-title vendor-settings-card',
  },
  {
    component: CNavItem,
    name: 'Profile Setting',
    to: '/vendor/info',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    style: modernItemStyle,
    className: 'vendor-menu-item vendor-settings-card',
  },
  {
    component: CNavItem,
    name: 'Notification',
    to: '/vendordata/note/list',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
    style: modernItemStyle,
    className: 'vendor-menu-item vendor-settings-card',
  },
]

export default vendormenu
