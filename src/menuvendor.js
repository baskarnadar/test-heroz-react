// src/_nav/vendormenu.js (or wherever your _nav files are stored)
import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilPuzzle, cilNotes, cilBasket } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

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
    name: 'Activity ',
    to: '/vendordata/activityinfo/activity/list',
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
    to: '/vendordata/activity/list',
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
    to: '/vendordata/activity/list',
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
    to: '/vendordata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
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
    to: '/vendordata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Upcoming</span>
        <span style={{ color: 'yellow' }}>[0]</span>
      </div>
    ),
    to: '/vendordata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Completed</span>
        <span style={{ color: 'orange' }}>[0]</span>
      </div>
    ),
    to: '/vendordata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: (
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span>Canceled</span>
        <span style={{ color: 'red' }}>[0]</span>
      </div>
    ),
    to: '/vendordata/activity/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
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

export default vendormenu
