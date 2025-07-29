import React from 'react'
const vendordashboard = React.lazy(() => import('./vendordata/dashboard/Dashboard'))
const ActivityList = React.lazy(() => import('./vendordata/activityinfo/activity/list'))
const ActivityNew = React.lazy(() => import('./vendordata/activityinfo/activity/new'))
const ActivityModify = React.lazy(() => import('./vendordata/activityinfo/activity/modify'))
const ActivityView = React.lazy(() => import('./vendordata/activityinfo/activity/view'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/vendor/dashboard', name: 'Dashboard', element: vendordashboard },
  { path: '/vendordata/activityinfo/activity/list', name: 'List', element: ActivityList },
  { path: '/vendordata/activityinfo/activity/new', name: 'List', element: ActivityNew },
  { path: '/vendordata/activityinfo/activity/modify', name: 'List', element: ActivityModify },
  { path: '/vendordata/activityinfo/activity/view', name: 'List', element: ActivityView },
]
export default routes
