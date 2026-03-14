// src/_nav/vendormenu.js

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilBuilding,
  cilPeople,
  cilBell,
  cilChart,
  cilStar,
  cilWallet,
  cilList,
  cilLocationPin,
  cilMap,
  cilLibrary,
  cilFile,
  cilSettings,
} from '@coreui/icons'
import { CNavItem, CNavGroup } from '@coreui/react'

const adminmenu = [
  // ======================================================
  // DASHBOARD
  // ======================================================
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/admin/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  // ======================================================
  // MANAGEMENT
  // ======================================================
  {
    component: CNavGroup,
    name: 'Management',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'School Management',
        to: '/admindata/schoolmgm/schoolinfo/list',
      },
      {
        component: CNavItem,
        name: 'Activity Management',
        to: '/admindata/activityinfo/activity/list',
      },
      {
        component: CNavItem,
        name: 'Vendor Management',
        to: '/admindata/vendor/list',
      },
      {
        component: CNavItem,
        name: 'Sub Admin Management',
        to: '/admindata/subadmin/list',
      },
    ],
  },

  // ======================================================
  // MEMBERSHIP
  // ======================================================
  {
    component: CNavGroup,
    name: 'Membership',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Membership Activities',
        to: '/admindata/activityinfo/membership/list?activitytype=membership',
      },
      {
        component: CNavItem,
        name: 'Star Cards',
        to: '/admindata/membership/products/list',
      },
      {
        component: CNavItem,
        name: 'Purchase Management',
        to: '/admindata/membership/purchase/list',
      },
      {
        component: CNavItem,
        name: 'Booking Management',
        to: '/admindata/membership/booking/list',
      },
    ],
  },

  // ======================================================
  // LOOKUP DATA
  // ======================================================
  {
    component: CNavGroup,
    name: 'Lookup Data',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Country',
        to: '/admindata/country/list',
        icon: <CIcon icon={cilMap} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'City',
        to: '/admindata/city/list',
        icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Category',
        to: '/admindata/category/list',
        icon: <CIcon icon={cilLibrary} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'School Education Level',
        to: '/admindata/schedulevel/list',
        icon: <CIcon icon={cilLibrary} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Agreement',
        to: '/admindata/agree/modify',
        icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      },
    ],
  },

  // ======================================================
  // COMMUNICATION & REPORTING
  // ======================================================
  {
    component: CNavGroup,
    name: 'Communication & Reports',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Reports & Analysis',
        to: '/admindata/reportsandanalysis/providerlist',
      },
      {
        component: CNavItem,
        name: 'Send Push Notification',
        to: '/admindata/push/send',
        icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Notifications',
        to: '/admindata/note/list',
      },
    ],
  },

  // ======================================================
  // OTHER
  // ======================================================
  {
    component: CNavItem,
    name: 'Trip Management',
    to: '/trip/tripdata',
    icon: <CIcon icon={cilWallet} customClassName="nav-icon" />,
  },
]

export default adminmenu
