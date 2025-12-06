// src/_nav/vendormenu.js (or wherever your _nav files are stored)
import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilCalculator,
  cilNotes,
  cilPuzzle,
  cilSpeedometer,
  cilUser,
  cilDrop,
  cilExcerpt,
  cilBasket,
} from '@coreui/icons'
import { CNavItem } from '@coreui/react'

const adminmenu = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/admin/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'School Management',
    to: 'admindata/schoolmgm/schoolinfo/list',
    icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Activity Management',
    to: '/admindata/activityinfo/activity/list',
    icon: <CIcon icon={cilDrop} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Vendor Management',
    to: '/admindata/vendor/list',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },

  // ✅ NEW POSITION: Send Push Notification (moved here before Badges)
  {
    component: CNavItem,
    name: 'Send Push Notification',
    to: '/admindata/push/send',
    icon: <CIcon icon={cilExcerpt} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: 'Badges',
    to: '/admindata/badge/list',
    icon: <CIcon icon={cilPuzzle} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Activity Oversight',
    to: '/admindata/activityoversight/list',
    icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Reports And Analysis',
    to: '/admindata/reportsandanalysis/providerlist',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Membership And Credits',
    to: '/admindata/membership/list',
    icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
  },

  // existing Trip menu
  {
    component: CNavItem,
    name: 'Trip tripdata',
    to: '/trip/tripdata',
    icon: <CIcon icon={cilCalculator} customClassName="nav-icon" />,
  },

  {
    component: CNavItem,
    name: 'Agreement',
    to: '/admindata/agree/modify',
    icon: <CIcon icon={cilExcerpt} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'City',
    to: '/admindata/city/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  // ✅ NEW — Outcome menu
  {
    component: CNavItem,
    name: 'Outcome',
    to: '/admindata/outcome/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Country',
    to: '/admindata/country/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Category',
    to: '/admindata/category/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'School Education Level',
    to: '/admindata/schedulevel/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Sub Admin',
    to: '/admindata/subadmin/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Notification',
    to: '/admindata/note/list',
    icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
  },
]

export default adminmenu
