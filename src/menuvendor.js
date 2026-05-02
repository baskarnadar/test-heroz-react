// src/menuvendor.js
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
import { CNavItem, CNavTitle, CNavGroup } from '@coreui/react'

import { API_BASE_URL } from './config'
import { getAuthHeaders, getCurrentLoggedUserID } from './utils/operation'

const GET_VDR_SUMMARY = API_BASE_URL + '/vendordata/dashboard/getvdrsummary'
const ROOT_MENU_FONT_SIZE = '15px'
const ROOT_MENU_FONT_WEIGHT = '600'

const modernItemStyle = {
  margin: '2px 8px',
  borderRadius: '10px',
  padding: '2px 0',
  fontSize: '14px',
}

const subItemStyle = {
  margin: '2px 8px 2px 24px',
  borderRadius: '10px',
  padding: '2px 0',
  fontSize: '13px',
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

        if (!resp.ok) throw new Error('HTTP ' + resp.status)

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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <span>{fallback}</span>
      <span
        style={{
          background: color,
          color: '#fff',
          minWidth: '20px',
          height: '20px',
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

const vendormenu = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/vendor/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    style: modernItemStyle,
  },

  {
    component: CNavGroup,
    toggler: (
      <>
        <CIcon icon={cilHome} className="nav-icon" />
        <span style={{ paddingLeft:3,fontSize: ROOT_MENU_FONT_SIZE, fontWeight: ROOT_MENU_FONT_WEIGHT }}>
          School Management
        </span>
      </>
    ),
    style: modernItemStyle,
    items: [
      {
        component: CNavItem,
        name: 'School Activities',
        to: '/vendordata/activityinfo/activity/list',
        icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: <StatusCounter fallback="Booked Trips" color="#28c76f" field="TotalApproved" />,
        to: '/vendor/activity-requests?status=APPROVED',
        icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: <StatusCounter fallback="Pending Trips" color="#ff9f43" field="TotalPending" />,
        to: '/vendor/activity-requests?status=WAITING-FOR-APPROVAL',
        icon: <CIcon icon={cilClock} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: <StatusCounter fallback="Rejected Trips" color="#ea5455" field="TotalRejected" />,
        to: '/vendor/activity-requests?status=REJECTED',
        icon: <CIcon icon={cilXCircle} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Trip Booked',
        to: '/vendordata/trip/tripbooked',
        icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Completed Trips',
        to: '/vendordata/trip/completed',
        icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
        style: subItemStyle,
      },
    ],
  },

  {
    component: CNavGroup,
    toggler: (
      <>
        <CIcon icon={cilUser} className="nav-icon" />
        <span style={{ fontSize: ROOT_MENU_FONT_SIZE, fontWeight: ROOT_MENU_FONT_WEIGHT }}>
          Membership
        </span>
      </>
    ),
    style: modernItemStyle,
    items: [
      {
        component: CNavItem,
        name: 'Membership Activities',
        to: '/vendordata/membership/activity/list',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Booked Activity',
        to: '/vendordata/membership?status=BOOKED',
        icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Completed Activity',
        to: '/vendordata/membership?status=COMPLETED',
        icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Payment',
        to: '/vendordata/membership/report/payment',
        icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
        style: subItemStyle,
      },
      {
        component: CNavItem,
        name: 'Completed Booking',
        to: '/vendordata/membership/report/completed-booking?status=COMPLETED',
        icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
        style: subItemStyle,
      },
    ],
  },

  {
    component: CNavTitle,
    name: 'SETTINGS',
  },
  {
    component: CNavItem,
    name: 'Profile Setting',
    to: '/vendor/info',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    style: modernItemStyle,
  },
  {
    component: CNavItem,
    name: 'Notification',
    to: '/vendordata/note/list',
    icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
    style: modernItemStyle,
  },
]

export default vendormenu
