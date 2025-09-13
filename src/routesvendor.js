// src/routes.js
import React from 'react'

const VendorDashboard = React.lazy(() => import('./vendordata/dashboard/Dashboard'))
const ActivityList = React.lazy(() => import('./vendordata/activityinfo/activity/list'))
const ActivityNew = React.lazy(() => import('./vendordata/activityinfo/activity/new'))
const ActivityModify = React.lazy(() => import('./vendordata/activityinfo/activity/modify'))
const ActivityView = React.lazy(() => import('./vendordata/activityinfo/activity/view'))

// ✅ FIX: use React.lazy import, NOT require()
const ActivityRequestList = React.lazy(() =>
  import('./vendordata/activityinfo/activity/ActivityRequestList')
)

const routes = [
  { path: '/', name: 'Home' },
  { path: '/vendor/dashboard', name: 'Dashboard', element: VendorDashboard },

  // your existing pages
  { path: '/vendordata/activityinfo/activity/list', name: 'List', element: ActivityList },
  { path: '/vendordata/activityinfo/activity/new', name: 'New', element: ActivityNew },
  { path: '/vendordata/activityinfo/activity/modify', name: 'Modify', element: ActivityModify },
  { path: '/vendordata/activityinfo/activity/view', name: 'View', element: ActivityView },

  // ✅ NEW: Activity requests list page (the one you navigate to from Dashboard)
  { path: '/vendor/activity-requests', name: 'Activity Requests', element: ActivityRequestList },
]

export default routes
