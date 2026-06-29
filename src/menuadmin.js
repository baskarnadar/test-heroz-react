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
  cilLibrary,
  cilFile,
  cilSchool,
  cilBasket,
  cilUserFollow,
  cilDiamond,
  cilCreditCard,
  cilCart,
  cilTask,
  cilGlobeAlt,
  cilTags,
  cilEducation,
  cilDescription,
  cilPaperPlane,
  cilClipboard,
} from '@coreui/icons'
import { CNavItem, CNavGroup } from '@coreui/react'

const adminmenu = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/admin/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavGroup,
    name: 'Management',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'School Management',
        to: '/admindata/schoolmgm/schoolinfo/list',
        icon: <CIcon icon={cilSchool} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Activity Management',
        to: '/admindata/activityinfo/activity/list',
        icon: <CIcon icon={cilBasket} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Vendor Management',
        to: '/admindata/vendor/list',
        icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Sub Admin Management',
        to: '/admindata/subadmin/list',
        icon: <CIcon icon={cilUserFollow} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Membership',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Membership Activities',
        to: '/admindata/activityinfo/membership/list?activitytype=membership',
        icon: <CIcon icon={cilDiamond} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Star Cards',
        to: '/admindata/membership/products/list',
        icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Purchase Management',
        to: '/admindata/membership/purchase/list',
        icon: <CIcon icon={cilCart} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Booking Management',
        to: '/admindata/membership/booking/list',
        icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Lookup Data',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Kids Interest',
        to: '/admindata/kidsinterest/list',
        icon: <CIcon icon={cilLibrary} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Country',
        to: '/admindata/country/list',
        icon: <CIcon icon={cilGlobeAlt} customClassName="nav-icon" />,
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
        icon: <CIcon icon={cilTags} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'School Education Level',
        to: '/admindata/schedulevel/list',
        icon: <CIcon icon={cilEducation} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Agreement',
        to: '/admindata/agree/modify',
        icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
      },
      ,
      {
        component: CNavItem,
        name: 'Refund Policy',
        to: '/admindata/refundpolicy/modify',
        icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Communication & Reports',
    icon: <CIcon icon={cilChart} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Reports & Analysis',
        to: '/admindata/reportsandanalysis/providerlist',
        icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Send Push Notification',
        to: '/admindata/push/send',
        icon: <CIcon icon={cilPaperPlane} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Notifications',
        to: '/admindata/note/list',
        icon: <CIcon icon={cilBell} customClassName="nav-icon" />,
      },
    ],
  },
  {
    component: CNavItem,
    name: 'Trip Management',
    to: '/trip/tripdata',
    icon: <CIcon icon={cilWallet} customClassName="nav-icon" />,
  },
]

export default adminmenu