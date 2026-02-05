// routeVendor.js
import React from 'react'

// Vendor dashboard & activity pages
const VendorDashboard = React.lazy(() => import('./vendordata/dashboard/Dashboard'))
const ActivityList = React.lazy(() => import('./vendordata/activityinfo/activity/list'))
const ActivityNew = React.lazy(() => import('./vendordata/activityinfo/activity/new'))
const ActivityModify = React.lazy(() => import('./vendordata/activityinfo/activity/modify'))
const ActivityView = React.lazy(() => import('./vendordata/activityinfo/activity/view'))

// ✅ Membership activity pages
const MembershipActivityList = React.lazy(() => import('./vendordata/activityinfo/membership/list'))
const MembershipActivityNew = React.lazy(() => import('./vendordata/activityinfo/membership/new'))
const MembershipActivityModify = React.lazy(() => import('./vendordata/activityinfo/membership/modify'))
const MembershipActivityView = React.lazy(() => import('./vendordata/activityinfo/membership/view'))

// ✅ Vendor Activity screen
const ViewActivityScreen = React.lazy(() => import('./vendordata/activity/ViewActivityScreen.js'))
const ActivityRequestList = React.lazy(() => import('./vendordata/actrequest/ActReqList.js'))
const ActivityRequestInfo = React.lazy(() => import('./vendordata/actrequest/ActReqInfo.js'))
const PaymentList = React.lazy(() => import('./vendordata/payment/list.js'))
const VendorInfoPage = React.lazy(() => import('./vendordata/info/info'))
const VendordataNoteList = React.lazy(() => import('./vendordata/note/list'))

// ✅ Trip pages
const TripBooked = React.lazy(() => import('./vendordata/trip/tripbooked.js'))
const TripCompleted = React.lazy(() => import('./vendordata/trip/completed.js'))

const routes = [
  { path: '/', name: 'Home' },

  // Vendor
  { path: '/vendor/dashboard', name: 'Dashboard', element: VendorDashboard },
  { path: '/vendor/activity-requests', name: 'Activity Requests', element: ActivityRequestList },
  { path: '/vendor/info', name: 'Vendor Info', element: VendorInfoPage },

  // ✅ Activity request detail
  { path: '/vendordata/actrequest/actreqinfo/:requestId', name: 'Activity Request Info', element: ActivityRequestInfo },

  // =======================
  // Activity (Normal)
  // =======================
  { path: '/vendordata/activityinfo/activity/list', name: 'Activity List', element: ActivityList },
  { path: '/vendordata/activityinfo/activity/new', name: 'Activity New', element: ActivityNew },
  { path: '/vendordata/activityinfo/activity/modify', name: 'Activity Modify', element: ActivityModify },
  { path: '/vendordata/activityinfo/activity/view', name: 'Activity View', element: ActivityView },

  // =======================
  // ✅ Membership Activity (NEW base: activityinfo/membership)
  // =======================
  { path: '/vendordata/activityinfo/membership/list', name: 'Membership Activity List', element: MembershipActivityList },
  { path: '/vendordata/activityinfo/membership/new', name: 'Membership Activity New', element: MembershipActivityNew },
  { path: '/vendordata/activityinfo/membership/modify', name: 'Membership Activity Modify', element: MembershipActivityModify },
  { path: '/vendordata/activityinfo/membership/view', name: 'Membership Activity View', element: MembershipActivityView },

  // =======================
  // ✅ Membership Activity (ALIAS routes to match your menu URL)
  // =======================
  { path: '/vendordata/membership/activity/list', name: 'Membership Activity List (Alias)', element: MembershipActivityList },
  { path: '/vendordata/membership/activity/new', name: 'Membership Activity New (Alias)', element: MembershipActivityNew },
  { path: '/vendordata/membership/activity/modify', name: 'Membership Activity Modify (Alias)', element: MembershipActivityModify },
  { path: '/vendordata/membership/activity/view', name: 'Membership Activity View (Alias)', element: MembershipActivityView },

  // Vendor Activity Screen
  { path: '/vendordata/activity/ViewActivityScreen', name: 'ViewActivityScreen', element: ViewActivityScreen },

  // Payment & Notes
  { path: '/vendordata/payment/list', name: 'VendorPaymentList', element: PaymentList },
  { path: '/vendordata/note/list', name: 'VendorNoteList', element: VendordataNoteList },

  // Trips
  { path: '/vendordata/trip/tripbooked', name: 'Trip Booked', element: TripBooked },
  { path: '/vendordata/trip/completed', name: 'Completed Trips', element: TripCompleted },
]

export default routes
