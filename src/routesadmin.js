import React from 'react'

// Core
const AdminDashboard = React.lazy(() => import('./admindata/dashboard/Dashboard'))
const LoginPage = React.lazy(() => import('./views/pages/login/login.js'))

// Public
const PublicProgram = React.lazy(() => import('./public/program.js'))
const PublicPayError = React.lazy(() => import('./public/payerror.js'))
const PublicPaySuccess = React.lazy(() => import('./public/paysuccess.js'))

// =======================
// School Management
// =======================
const adminschoolmgmList = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/list'))
const adminschoolmgmNew = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/new'))
const adminschoolmgmModify = React.lazy(() =>
  import('./admindata/schoolmgm/schoolinfo/modify.js'),
)
const adminschoolmgmView = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/view'))
const adminschoolmgmChangePwd = React.lazy(
  () => import('./admindata/schoolmgm/schoolinfo/changepwd'),
)

// Class Info
const classinfoList = React.lazy(() => import('./admindata/schoolmgm/classinfo/list'))
const classinfoNew = React.lazy(() => import('./admindata/schoolmgm/classinfo/new'))
const classinfoModify = React.lazy(() => import('./admindata/schoolmgm/classinfo/modify.js'))
const classinfoView = React.lazy(() => import('./admindata/schoolmgm/classinfo/view'))

// Student Info
const studentinfoList = React.lazy(() => import('./admindata/schoolmgm/studentinfo/list'))
const studentinfoNew = React.lazy(() => import('./admindata/schoolmgm/studentinfo/new'))
const studentinfoModify = React.lazy(() =>
  import('./admindata/schoolmgm/studentinfo/modify.js'),
)
const studentinfoView = React.lazy(() => import('./admindata/schoolmgm/studentinfo/view'))

// Staff Info
const staffinfoList = React.lazy(() => import('./admindata/schoolmgm/staffinfo/list'))
const staffinfoNew = React.lazy(() => import('./admindata/schoolmgm/staffinfo/new'))
const staffinfoModify = React.lazy(() => import('./admindata/schoolmgm/staffinfo/modify.js'))
const staffinfoView = React.lazy(() => import('./admindata/schoolmgm/staffinfo/view'))

// Parent Info
const parentinfoList = React.lazy(() => import('./admindata/schoolmgm/parentinfo/list'))
const parentinfoNew = React.lazy(() => import('./admindata/schoolmgm/parentinfo/new'))
const parentinfoModify = React.lazy(() => import('./admindata/schoolmgm/parentinfo/modify.js'))
const parentinfoView = React.lazy(() => import('./admindata/schoolmgm/parentinfo/view'))

// =======================
// Trips
// =======================
const adminschTripProposalCraeted = React.lazy(() => import('./admindata/activityinfo/trip/list'))
const adminschTripView = React.lazy(() => import('./admindata/activityinfo/trip/view'))
const Triptripdata = React.lazy(() => import('./admindata/trip/tripdata'))
const adminTripPayInfo = React.lazy(() => import('./admindata/activityinfo/trippayinfo/view'))

// =======================
// Vendor
// =======================
const vendorList = React.lazy(() => import('./admindata/vendor/list'))
const vendorNew = React.lazy(() => import('./admindata/vendor/new'))
const vendorModify = React.lazy(() => import('./admindata/vendor/modify'))
const vendorView = React.lazy(() => import('./admindata/vendor/view'))
const vendorchangepwd = React.lazy(() => import('./admindata/vendor/changepwd'))

// Vendor Staff
const vendorstaffinfoList = React.lazy(() => import('./admindata/vendor/staffinfo/list'))
const vendorstaffinfoNew = React.lazy(() => import('./admindata/vendor/staffinfo/new'))
const vendorstaffinfoModify = React.lazy(() =>
  import('./admindata/vendor/staffinfo/modify.js'),
)
const vendorstaffinfoView = React.lazy(() => import('./admindata/vendor/staffinfo/view'))

// =======================
// Products
// =======================
const ProductList = React.lazy(() => import('./admindata/products/list'))
const ProductNew = React.lazy(() => import('./admindata/products/new'))
const ProductModify = React.lazy(() => import('./admindata/products/modify'))

// =======================
// Membership Activity
// =======================
const adminMembershipActivityList = React.lazy(() =>
  import('./admindata/activityinfo/membership/list'),
)
const adminMembershipActivityModify = React.lazy(() =>
  import('./admindata/activityinfo/membership/modify'),
)
const adminMembershipActivityView = React.lazy(() =>
  import('./admindata/activityinfo/membership/view'),
)

// =======================
// Membership
// =======================
const MemberShipList = React.lazy(() => import('./admindata/membership/list'))
const MemberShipNew = React.lazy(() => import('./admindata/membership/new'))
const MemberShipModify = React.lazy(() => import('./admindata/membership/modify'))

// =======================
// Badge
// =======================
const BadgeList = React.lazy(() => import('./admindata/badge/list'))
const BadgeNew = React.lazy(() => import('./admindata/badge/new'))
const BadgeModify = React.lazy(() => import('./admindata/badge/modify'))
const BadgeView = React.lazy(() => import('./admindata/badge/view'))

// =======================
// Lookup Data
// =======================
const CityList = React.lazy(() => import('./admindata/lookupdata/city/list'))
const CityNew = React.lazy(() => import('./admindata/lookupdata/city/new'))
const CityModify = React.lazy(() => import('./admindata/lookupdata/city/modify'))

const countryList = React.lazy(() => import('./admindata/lookupdata/country/list'))
const countryNew = React.lazy(() => import('./admindata/lookupdata/country/new'))
const countryModify = React.lazy(() => import('./admindata/lookupdata/country/modify'))

const categoryList = React.lazy(() => import('./admindata/lookupdata/category/list'))
const categoryNew = React.lazy(() => import('./admindata/lookupdata/category/new'))
const categoryModify = React.lazy(() => import('./admindata/lookupdata/category/modify'))

const SchEduLevelList = React.lazy(() => import('./admindata/lookupdata/schedulevel/list'))
const SchEduLevelNew = React.lazy(() => import('./admindata/lookupdata/schedulevel/new'))
const SchEduLevelModify = React.lazy(() =>
  import('./admindata/lookupdata/schedulevel/modify'),
)

// Outcome
const OutcomeList = React.lazy(() => import('./admindata/lookupdata/outcome/list'))
const OutcomeNew = React.lazy(() => import('./admindata/lookupdata/outcome/new'))
const OutcomeModify = React.lazy(() => import('./admindata/lookupdata/outcome/modify'))

// =======================
// Reports / Payments / Others
// =======================
const PaymentList = React.lazy(() => import('./admindata/payment/list'))
const AgreementList = React.lazy(() => import('./admindata/agree/modify'))
const activityoversightList = React.lazy(() => import('./admindata/activityoversight/list'))

const reportsandanalysisList = React.lazy(() =>
  import('./admindata/reportsandanalysis/providerlist'),
)
const reportsandanalysisNew = React.lazy(() =>
  import('./admindata/reportsandanalysis/schoollist'),
)

// =======================
// Sub Admin / Menu / Rights
// =======================
const UserList = React.lazy(() => import('./admindata/subadmin/list'))
const UserNew = React.lazy(() => import('./admindata/subadmin/new'))
const UserModify = React.lazy(() => import('./admindata/subadmin/modify'))

const MainMenuList = React.lazy(() => import('./admindata/mainmenu/list'))
const MainMenuNew = React.lazy(() => import('./admindata/mainmenu/new'))
const MainMenuModify = React.lazy(() => import('./admindata/mainmenu/modify'))

const RightsList = React.lazy(() => import('./admindata/rights/list'))

// =======================
// Push / Notes / Links
// =======================
const NoteList = React.lazy(() => import('./admindata/note/list'))
const AdminSetLink = React.lazy(() => import('./admindata/setlink/setlink'))
const PushSendList = React.lazy(() => import('./admindata/push/send'))

// =======================
// Admin Activity
// =======================
const adminDataActivityView = React.lazy(() => import('./admindata/activityinfo/activity/view'))
const adminDataActivityList = React.lazy(() => import('./admindata/activityinfo/activity/list'))
const adminDataActivityModify = React.lazy(() =>
  import('./admindata/activityinfo/activity/modify'),
)

// Parents (frontend)
const parentsList = React.lazy(() => import('./views/parents/list'))
const parentsView = React.lazy(() => import('./views/parents/view'))

// =======================
// ROUTES
// =======================
const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/admin/dashboard', name: 'Dashboard', element: AdminDashboard },
  { path: '/login', name: 'Login', element: LoginPage },

  // School
  { path: '/admindata/schoolmgm/schoolinfo/list', element: adminschoolmgmList },
  { path: '/admindata/schoolmgm/schoolinfo/new', element: adminschoolmgmNew },
  { path: '/admindata/schoolmgm/schoolinfo/modify', element: adminschoolmgmModify },
  { path: '/admindata/schoolmgm/schoolinfo/view', element: adminschoolmgmView },
  { path: '/admindata/schoolmgm/schoolinfo/changepwd', element: adminschoolmgmChangePwd },

  // Class / Student / Staff / Parent
  { path: '/admindata/schoolmgm/classinfo/list', element: classinfoList },
  { path: '/admindata/schoolmgm/studentinfo/list', element: studentinfoList },
  { path: '/admindata/schoolmgm/staffinfo/list', element: staffinfoList },
  { path: '/admindata/schoolmgm/parentinfo/list', element: parentinfoList },

  // Trips
  { path: '/admindata/activityinfo/trip/list', element: adminschTripProposalCraeted },
  { path: '/admindata/activityinfo/trip/view', element: adminschTripView },
  { path: '/trip/tripdata', element: Triptripdata },
  { path: '/admindata/activityinfo/trippayinfo/view', element: adminTripPayInfo },

  // Membership Activity
  { path: '/admindata/activityinfo/membership/list', element: adminMembershipActivityList },
  { path: '/admindata/activityinfo/membership/modify', element: adminMembershipActivityModify },
  { path: '/admindata/activityinfo/membership/view', element: adminMembershipActivityView },

  // Products
  { path: '/admindata/products/list', element: ProductList },
  { path: '/admindata/products/new', element: ProductNew },
  { path: '/admindata/products/modify', element: ProductModify },

  // Public
  { path: '/public/program/:requestId', element: PublicProgram },
  { path: '/public/payerror', element: PublicPayError },
  { path: '/public/paysuccess', element: PublicPaySuccess },
]

export default routes
