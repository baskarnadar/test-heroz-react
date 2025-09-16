// src/_nav/vendormenu.js
import React, { useEffect, useState } from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilPuzzle, cilNotes, cilBasket } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

import { API_BASE_URL } from './config'
import { getAuthHeaders, getCurrentLoggedUserID } from './utils/operation'

const GET_VDR_SUMMARY = `${API_BASE_URL}/vendordata/dashboard/getvdrsummary`

function ApprovedActivityName() {
  const [approved, setApproved] = useState(null)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const resp = await fetch(GET_VDR_SUMMARY, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ VendorID: getCurrentLoggedUserID() }),
        })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        if (!alive) return
        const d = json?.data || {}
        setApproved(d?.TotalApproved ?? 0)
      } catch {
        if (alive) setApproved(0)
      }
    })()
    return () => { alive = false }
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <span>Approved Activity</span>
      <span style={{ color: 'yellow' }}>[{approved === null ? '…' : approved}]</span>
    </div>
  )
}

function PendingActivityName() {
  const [pending, setPending] = useState(null)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const resp = await fetch(GET_VDR_SUMMARY, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ VendorID: getCurrentLoggedUserID() }),
        })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        if (!alive) return
        const d = json?.data || {}
        setPending(d?.TotalPending ?? 0)
      } catch {
        if (alive) setPending(0)
      }
    })()
    return () => { alive = false }
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <span>Pending Activity</span>
      <span style={{ color: 'orange' }}>[{pending === null ? '…' : pending}]</span>
    </div>
  )
}

function RejectedActivityName() {
  const [rejected, setRejected] = useState(null)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const resp = await fetch(GET_VDR_SUMMARY, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ VendorID: getCurrentLoggedUserID() }),
        })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const json = await resp.json()
        if (!alive) return
        const d = json?.data || {}
        setRejected(d?.TotalRejected ?? 0)
      } catch {
        if (alive) setRejected(0)
      }
    })()
    return () => { alive = false }
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <span>Rejected Activity</span>
      <span style={{ color: 'red' }}>[{rejected === null ? '…' : rejected}]</span>
    </div>
  )
}

const vendormenu = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/vendor/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Activity Management',
  },
  {
    component: CNavItem,
    name: 'Activity',
    to: '/vendordata/activityinfo/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  // ✅ Match dashboard logic
  {
    component: CNavItem,
    name: <ApprovedActivityName />,
    to: '/vendor/activity-requests?status=APPROVED',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: <PendingActivityName />,
    to: '/vendor/activity-requests?status=WAITING-FOR-APPROVAL',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: <RejectedActivityName />,
    to: '/vendor/activity-requests?status=REJECTED',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Field Trip',
  },
  // You can apply same query logic for trips too later
  {
    component: CNavItem,
    name: 'Payment',
    to: '/parents/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Profile Setting',
    to: '/vendor/info',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Notification',
    to: '/vendor/list',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
 
]

export default vendormenu
