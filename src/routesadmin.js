import React from 'react'
const AdminDashboard = React.lazy(() => import('./admindata/dashboard/Dashboard'))
const LoginPage = React.lazy(() => import('./views/pages/login/login.js'))
const PublicProgram = React.lazy(() => import('./public/program.js'))

const PublicPayError = React.lazy(() => import('./public/payerror.js'))
const PublicPaySuccess = React.lazy(() => import('./public/paysuccess.js'))

//adminschoolmgms
const adminschoolmgmList = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/list'))
const adminschoolmgmNew = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/new'))
const adminschoolmgmModify = React.lazy(() =>
  import('./admindata/schoolmgm/schoolinfo/modify.js'),
)
const adminschoolmgmView = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/view'))
const adminschoolmgmChangePwd = React.lazy(
  () => import('./admindata/schoolmgm/schoolinfo/changepwd'),
)

//trip
const adminschTripProposalCraeted = React.lazy(() => import('./admindata/activityinfo/trip/list'))
const adminschTripView = React.lazy(() => import('./admindata/activityinfo/trip/view'))

// trip tripdata
const Triptripdata = React.lazy(() => import('./admindata/trip/tripdata'))

//tripPayInfo
const adminTripPayInfo = React.lazy(() => import('./admindata/activityinfo/trippayinfo/view'))

//vendor
const vendorList = React.lazy(() => import('./admindata/vendor/list'))
const vendorNew = React.lazy(() => import('./admindata/vendor/new'))
const vendorModify = React.lazy(() => import('./admindata/vendor/modify'))
const vendorView = React.lazy(() => import('./admindata/vendor/view'))
const vendorchangepwd = React.lazy(() => import('./admindata/vendor/changepwd'))

// ✅ Products
const ProductList = React.lazy(() => import('./admindata/products/list'))
const ProductNew = React.lazy(() => import('./admindata/products/new'))
const ProductModify = React.lazy(() => import('./admindata/products/modify')) // ✅ ADDED

//Membership Activity
const adminMembershipActivityList = React.lazy(() =>
  import('./admindata/activityinfo/membership/list'),
)
const adminMembershipActivityModify = React.lazy(() =>
  import('./admindata/activityinfo/membership/modify'),
)
const adminMembershipActivityView = React.lazy(() =>
  import('./admindata/activityinfo/membership/view'),
)

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/admin/dashboard', name: 'Dashboard', element: AdminDashboard },
  { path: '/login', name: 'Login ', element: LoginPage },

  // ✅ Product List
  {
    path: '/admindata/products/list',
    name: 'Product List',
    element: ProductList,
  },

  // ✅ Product New
  {
    path: '/admindata/products/new',
    name: 'New Product',
    element: ProductNew,
  },

  // ✅ Product Modify (NEW ROUTE)
  {
    path: '/admindata/products/modify',
    name: 'Modify Product',
    element: ProductModify,
  },

  //Membership Activity
  {
    path: '/admindata/activityinfo/membership/list',
    name: 'Membership Activity',
    element: adminMembershipActivityList,
  },
  {
    path: '/admindata/activityinfo/membership/modify',
    name: 'Membership Activity Modify',
    element: adminMembershipActivityModify,
  },
  {
    path: '/admindata/activityinfo/membership/view',
    name: 'Membership Activity View',
    element: adminMembershipActivityView,
  },

  { path: '/public/program/:requestId', name: 'Program', element: PublicProgram },
  { path: '/public/payerror', name: 'Pay Error ', element: PublicPayError },
  { path: '/public/paysuccess', name: 'Pay Success ', element: PublicPaySuccess },
]

export default routes
