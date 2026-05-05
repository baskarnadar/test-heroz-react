// src/menuvendor.js
import React, { useEffect, useState } from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilCheckCircle,
  cilClock,
  cilXCircle,
  cilBell,
  cilSettings,
  cilMoney,
  cilLibrary,
  cilTask,
  cilCalendar,
  cilClipboard,
  cilFolder,
} from '@coreui/icons'
import { CNavItem, CNavTitle, CNavGroup } from '@coreui/react'

import { API_BASE_URL } from './config'
import { getAuthHeaders, getCurrentLoggedUserID } from './utils/operation'

const GET_VDR_SUMMARY = API_BASE_URL + '/vendordata/dashboard/getvdrsummary'

// ================= ROOT MENU STYLE =================
const modernItemStyle = {
  margin: '1px 4px',
  borderRadius: '9px',
  padding: '1px 0',
  fontSize: '14px',
}

// ================= SUBMENU STYLE =================
const subItemStyle = {
  margin: '1px 4px 1px 6px',
  borderRadius: '9px',
  padding: '1px 0',
  fontSize: '13px',
}

// ================= SUB-SUBMENU STYLE =================
const subSubItemStyle = {
  margin: '1px 4px 1px 12px',
  borderRadius: '9px',
  padding: '1px 0',
  fontSize: '12px',
}

// ================= ICON STYLE =================
const iconCircleStyle = {
  width: '26px',
  height: '26px',
  minWidth: '26px',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.1)',
  marginRight: '6px',
}

const menuIcon = (iconName) => (
  <span style={iconCircleStyle}>
    <CIcon
      icon={iconName}
      style={{
        color: '#ffffff',
        width: '14px',
        height: '14px',
      }}
    />
  </span>
)

// ================= SECTION TOGGLER =================
const sectionToggler = (label) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      padding: '4px 4px 2px 4px',
      cursor: 'pointer',
    }}
  >
    <span
      style={{
        fontSize: '15px',
        fontWeight: '700',
        color: 'rgba(255,255,255,1)',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  </div>
)

// ================= REPORT TOGGLER =================
const reportToggler = (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      width: '100%',
    }}
  >
    {menuIcon(cilFolder)}
    <span style={{ fontSize: '13px', color: '#ffffff' }}>Report</span>
  </div>
)

// ================= STATUS COUNTER =================
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

        if (!resp.ok) throw new Error('HTTP ' + resp.status)

        const json = await resp.json()
        const d = json?.data || {}

        if (alive) {
          setCount(d?.[field] ?? 0)
        }
      } catch {
        if (alive) {
          setCount(0)
        }
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
          minWidth: '18px',
          height: '18px',
          borderRadius: '50%',
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '10px',
          fontWeight: '700',
        }}
      >
        {count === null ? '…' : count}
      </span>
    </div>
  )
}

// ================= VENDOR MENU =================
const vendormenu = [
  // ================= DASHBOARD =================
  {
    component: CNavTitle,
    name: 'DASHBOARD',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/vendor/dashboard',
    icon: menuIcon(cilSpeedometer),
    style: modernItemStyle,
  },

  // ================= SCHOOL MANAGEMENT =================
  {
    component: CNavGroup,
    name: 'School Management',
    menuKey: 'school-management',
    autoOpen: true,
    toggler: sectionToggler('School Management'),
    visible: true, // ✅ AUTO OPEN ON INITIAL LOAD
    className: 'nav-section-group auto-open-school-management',
    items: [
      {
        component: CNavItem,
        name: 'School Activities',
        to: '/vendordata/activityinfo/activity/list',
        icon: menuIcon(cilLibrary),
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: <StatusCounter fallback="Booked Trips" color="#28c76f" field="TotalApproved" />,
        to: '/vendor/activity-requests?status=APPROVED',
        icon: menuIcon(cilCheckCircle),
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: <StatusCounter fallback="Pending Trips" color="#ff9f43" field="TotalPending" />,
        to: '/vendor/activity-requests?status=WAITING-FOR-APPROVAL',
        icon: menuIcon(cilClock),
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: <StatusCounter fallback="Rejected Trips" color="#ea5455" field="TotalRejected" />,
        to: '/vendor/activity-requests?status=REJECTED',
        icon: menuIcon(cilXCircle),
        style: subItemStyle,
      },

      // ================= REPORT =================
      {
        component: CNavGroup,
        name: 'Report',
        menuKey: 'school-report',
        autoOpen: false,
        toggler: reportToggler,
        visible: false,
        style: subItemStyle,
        items: [
          {
            component: CNavItem,
            name: 'Trip Booked',
            to: '/vendordata/trip/tripbooked',
            icon: menuIcon(cilTask),
            style: subSubItemStyle,
          },
          {
            component: CNavItem,
            name: 'Completed Trips',
            to: '/vendordata/trip/completed',
            icon: menuIcon(cilCalendar),
            style: subSubItemStyle,
          },
        ],
      },
    ],
  },

  // ================= MEMBERSHIP =================
  {
    component: CNavGroup,
    name: 'Membership',
    menuKey: 'membership',
    autoOpen: false,
    toggler: sectionToggler('Membership'),
    visible: false,
    className: 'nav-section-group',
    items: [
      {
        component: CNavItem,
        name: 'Membership Activities',
        to: '/vendordata/membership/activity/list',
        icon: menuIcon(cilLibrary),
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Booked Activity',
        to: '/vendordata/membership?status=BOOKED',
        icon: menuIcon(cilClipboard),
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Completed Activity',
        to: '/vendordata/membership?status=COMPLETED',
        icon: menuIcon(cilCalendar),
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Payment',
        to: '/vendordata/membership/report/payment',
        icon: menuIcon(cilMoney),
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Completed Booking',
        to: '/vendordata/membership/report/completed-booking?status=COMPLETED',
        icon: menuIcon(cilCheckCircle),
        style: subItemStyle,
      },
    ],
  },

  // ================= SETTINGS =================
  {
    component: CNavTitle,
    name: 'SETTINGS',
  },
  {
    component: CNavItem,
    name: 'Profile Setting',
    to: '/vendor/info',
    icon: menuIcon(cilSettings),
    style: modernItemStyle,
  },
  {
    component: CNavItem,
    name: 'Notification',
    to: '/vendordata/note/list',
    icon: menuIcon(cilBell),
    style: modernItemStyle,
  },
]

export default vendormenu