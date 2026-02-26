// routemembership.js
import React from 'react'

// Membership dashboard & activity pages
const MembershipDashboard = React.lazy(() => import('./membership/dashboard/Dashboard'))
const ActivityList = React.lazy(() => import('./membership/activityinfo/activity/list'))
const ActivityNew = React.lazy(() => import('./membership/activityinfo/activity/new'))
const ActivityModify = React.lazy(() => import('./membership/activityinfo/activity/modify'))
const ActivityView = React.lazy(() => import('./membership/activityinfo/activity/view'))

// ✅ Membership activity pages
const MembershipActivityList = React.lazy(() => import('./membership/activityinfo/membership/list'))
const MembershipActivityNew = React.lazy(() => import('./membership/activityinfo/membership/new'))
const MembershipActivityModify = React.lazy(() => import('./membership/activityinfo/membership/modify'))
const MembershipActivityView = React.lazy(() => import('./membership/activityinfo/membership/view'))

// ✅ Membership Activity screen
const ViewActivityScreen = React.lazy(() => import('./membership/activity/ViewActivityScreen.js'))
const ActivityRequestList = React.lazy(() => import('./membership/actrequest/ActReqList.js'))
const ActivityRequestInfo = React.lazy(() => import('./membership/actrequest/ActReqInfo.js'))
const PaymentList = React.lazy(() => import('./membership/payment/list.js'))
const MembershipInfoPage = React.lazy(() => import('./membership/info/info'))
const membershipNoteList = React.lazy(() => import('./membership/note/list'))

// ✅ Trip pages
const TripBooked = React.lazy(() => import('./membership/trip/tripbooked.js'))
const TripCompleted = React.lazy(() => import('./membership/trip/completed.js'))

const routes = [
  { path: '/', name: 'Home' },

  // Membership
  { path: '/membership/dashboard', name: 'Dashboard', element: MembershipDashboard },
  { path: '/membership/activity-requests', name: 'Activity Requests', element: ActivityRequestList },
  { path: '/membership/info', name: 'Membership Info', element: MembershipInfoPage },

  // ✅ Activity request detail
  { path: '/membership/actrequest/actreqinfo/:requestId', name: 'Activity Request Info', element: ActivityRequestInfo },

  // =======================
  // Activity (Normal)
  // =======================
  { path: '/membership/activityinfo/activity/list', name: 'Activity List', element: ActivityList },
  { path: '/membership/activityinfo/activity/new', name: 'Activity New', element: ActivityNew },
  { path: '/membership/activityinfo/activity/modify', name: 'Activity Modify', element: ActivityModify },
  { path: '/membership/activityinfo/activity/view', name: 'Activity View', element: ActivityView },

  // =======================
  // ✅ Membership Activity (NEW base: activityinfo/membership)
  // =======================
  { path: '/membership/activityinfo/membership/list', name: 'Membership Activity List', element: MembershipActivityList },
  { path: '/membership/activityinfo/membership/new', name: 'Membership Activity New', element: MembershipActivityNew },
  { path: '/membership/activityinfo/membership/modify', name: 'Membership Activity Modify', element: MembershipActivityModify },
  { path: '/membership/activityinfo/membership/view', name: 'Membership Activity View', element: MembershipActivityView },

  // =======================
  // ✅ Membership Activity (ALIAS routes to match your menu URL)
  // =======================
  { path: '/membership/membership/activity/list', name: 'Membership Activity List (Alias)', element: MembershipActivityList },
  { path: '/membership/membership/activity/new', name: 'Membership Activity New (Alias)', element: MembershipActivityNew },
  { path: '/membership/membership/activity/modify', name: 'Membership Activity Modify (Alias)', element: MembershipActivityModify },
  { path: '/membership/membership/activity/view', name: 'Membership Activity View (Alias)', element: MembershipActivityView },

  // Membership Activity Screen
  { path: '/membership/activity/ViewActivityScreen', name: 'ViewActivityScreen', element: ViewActivityScreen },

  // Payment & Notes
  { path: '/membership/payment/list', name: 'MembershipPaymentList', element: PaymentList },
  { path: '/membership/note/list', name: 'MembershipNoteList', element: membershipNoteList },

  // Trips
  { path: '/membership/trip/tripbooked', name: 'Trip Booked', element: TripBooked },
  { path: '/membership/trip/completed', name: 'Completed Trips', element: TripCompleted },
]

export default routes
