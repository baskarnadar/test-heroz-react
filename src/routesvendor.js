//routeVendor.js
import React from 'react'

// Vendor dashboard & activity pages
const VendorDashboard = React.lazy(() => import('./vendordata/dashboard/Dashboard'))
const ActivityList = React.lazy(() => import('./vendordata/activityinfo/activity/list'))
const ActivityNew = React.lazy(() => import('./vendordata/activityinfo/activity/new'))
const ActivityModify = React.lazy(() => import('./vendordata/activityinfo/activity/modify'))
const ActivityView = React.lazy(() => import('./vendordata/activityinfo/activity/view'))

// ✅ Vendor Activity screen
const ViewActivityScreen = React.lazy(() => import('./vendordata/activity/ViewActivityScreen.jsx'))
const ActivityRequestList = React.lazy(() => import('./vendordata/actrequest/ActReqInfo.jsx'))
const ActivityRequestInfo = React.lazy(() => import('./vendordata/actrequest/ActReqInfo.jsx'))

// ✅ Vendor Info page
const VendorInfoPage = React.lazy(() => import('./vendordata/info/info'))

const routes = [
  { path: '/', name: 'Home' },

  // Vendor
  { path: '/vendor/dashboard', name: 'Dashboard', element: VendorDashboard },
  { path: '/vendor/activity-requests', name: 'Activity Requests', element: ActivityRequestList },
  { path: '/vendor/info', name: 'Vendor Info', element: VendorInfoPage },

  // ✅ Activity request detail
  { path: '/vendordata/actrequest/actreqinfo/:requestId', name: 'Activity Request Info', element: ActivityRequestInfo },

  // Activity pages
  { path: '/vendordata/activityinfo/activity/list', name: 'List', element: ActivityList },
  { path: '/vendordata/activityinfo/activity/new', name: 'New', element: ActivityNew },
  { path: '/vendordata/activityinfo/activity/modify', name: 'Modify', element: ActivityModify },
  { path: '/vendordata/activityinfo/activity/view', name: 'View', element: ActivityView },

  // ✅ Vendor Activity Screen (both paths point to same component)
  { path: '/vendordata/activity/ViewActivityScreen', name: 'ViewActivityScreen', element: ViewActivityScreen },
]

export default routes
