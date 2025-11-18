// src/_nav/schoolmenu.js (or wherever your _nav files are stored)
import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilPuzzle,
  cilNotes,
  cilBasket,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const schoolmenu = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/schooldata/dashboard/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'School Activity  ',
  },
  {
    component: CNavItem,
    name: 'Activity ',
    to: '/schooldata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Approved Activity</span>
        <span style={{ color: 'yellow' }}>[0]</span>
      </div>
    ),
    to: '/schooldata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Pending Activity</span>
        <span style={{ color: 'orange' }}>[0]</span>
      </div>
    ),
    to: '/schooldata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Rejected Activity</span>
        <span style={{ color: 'red' }}>[0]</span>
      </div>
    ),
    to: '/schooldata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  
   {
  component: CNavItem,
  name: (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: 'red',     // 🔴 Add red background
        padding: '2px 6px',         // Optional: add padding
        borderRadius: '4px',        // Optional: rounded corners
        color: 'white',             // Optional: make text readable
      }}
    >
      <span>Archive Activity</span>
      <span>[0]</span>
    </div>
  ),
  to: '/schooldata/activity/list',
  icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
}
,
  {
    component: CNavTitle,
    name: 'Field Trip ',
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Today</span>
        <span style={{ color: 'white' }}>[0]</span>
      </div>
    ),
    to: '/schooldata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Sent To Parents</span>
        <span style={{ color: 'yellow' }}>[0]</span>
      </div>
    ),
    to: '/schooldata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Confirmed</span>
        <span style={{ color: 'orange' }}>[0]</span>
      </div>
    ),
    to: '/schooldata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  } ,
  {
    component: CNavItem,
    name: 'Payment',
    to: '/parents/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Profile Setting',
    to: '/badge/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Notification',
    to: '/vendor/list',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Wallet',
    to: '/note/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
]

export default schoolmenu
