// src/_nav/Membershipmenu.js
import React, { useEffect, useState } from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilPuzzle, cilNotes, cilBasket } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

import { API_BASE_URL } from './config'
import { getAuthHeaders, getCurrentLoggedUserID } from './utils/operation'

// 🔤 i18n packs (default Arabic if not set)
import enPack from './i18n/enloc100.json'
import arPack from './i18n/arloc100.json'

const GET_VDR_SUMMARY = `${API_BASE_URL}/membership/dashboard/getvdrsummary`

// ---- tiny i18n helpers (local, no provider) ----
const getLang = () => {
  try {
    const v = localStorage.getItem('heroz_lang')
    return v === 'ar' || v === 'en' ? v : 'ar' // default AR
  } catch {
    return 'ar'
  }
}
const getDict = () => (getLang() === 'ar' ? arPack : enPack)
const t = (key, fb) => {
  const d = getDict()
  return (d && d[key]) || fb
}

// React node that renders a translated label
const Txt = ({ k, fb }) => <span>{t(k, fb)}</span>
// -------------------------------------------------

function ApprovedActivityName() {
  const [approved, setApproved] = useState(null)
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const resp = await fetch(GET_VDR_SUMMARY, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ MembershipID: getCurrentLoggedUserID() }),
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
    return () => {
      alive = false
    }
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <span>
        <Txt k="navApprovedTrips" fb="Booked Activity" />
      </span>
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
          body: JSON.stringify({ MembershipID: getCurrentLoggedUserID() }),
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
    return () => {
      alive = false
    }
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <span>
        <Txt k="navCompletedTrips" fb="Completed Activity" />
      </span>
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
          body: JSON.stringify({ MembershipID: getCurrentLoggedUserID() }),
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
    return () => {
      alive = false
    }
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <span>
        <Txt k="navRejectedTrips" fb="Rejected Trips" />
      </span>
      <span style={{ color: 'red' }}>[{rejected === null ? '…' : rejected}]</span>
    </div>
  )
}

const Membershipmenu = [
  {
    component: CNavItem,
    name: <Txt k="navDashboard" fb="Dashboard" />,
    to: '/membership/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: <Txt k="navActivityManagement" fb="Activity Management" />,
  },
  

  // ✅ ADDED: Membership Activities
  {
    component: CNavItem,
    name: <Txt k="navMembershipActivities" fb="Membership Activities" />,
    to: '/membership/membership/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },

  // ✅ Match dashboard logic
  {
    component: CNavItem,
    name: <ApprovedActivityName />,
    to: '/membership/activity-requests?status=BOOKED',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: <PendingActivityName />,
    to: '/membership/activity-requests?status=COMPLETED',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  }, 
 
  {
    component: CNavItem,
    name: <Txt k="navPayment" fb="Payment" />,
    to: '/membership/Payment/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: <Txt k="navProfileSetting" fb="Profile Setting" />,
    to: '/membership/info',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: <Txt k="navNotification" fb="Notification" />,
    to: 'membership/note/list',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
]

export default Membershipmenu
