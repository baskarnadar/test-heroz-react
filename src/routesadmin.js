import React from 'react'
const AdminDashboard = React.lazy(() => import('./admindata/dashboard/Dashboard'))
const LoginPage = React.lazy(() => import('./views/pages/login/login.js'))
const PublicProposal = React.lazy(() => import('./public/proposal.js'))
const PublicProgram = React.lazy(() => import('./public/program.js'))
const PublicProgramv1 = React.lazy(() => import('./public/programv1.js'))
// const PublicPayError = React.lazy(() => import('./public/payerror.js'))
// const PublicPaySuccess = React.lazy(() => import('./public/paysuccess.js'))

//adminschoolmgms
const adminschoolmgmList = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/list'))
const adminschoolmgmNew = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/new'))
const adminschoolmgmModify = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/modify.js'))
const adminschoolmgmView = React.lazy(() => import('./admindata/schoolmgm/schoolinfo/view'))
const adminschoolmgmChangePwd = React.lazy(
  () => import('./admindata/schoolmgm/schoolinfo/changepwd'),
)

//trip
const adminschTripProposalCraeted = React.lazy(() => import('./admindata/activityinfo/trip/list'))
const adminschTripView = React.lazy(() => import('./admindata/activityinfo/trip/view'))

//tripPayInfo
const adminTripPayInfo = React.lazy(() => import('./admindata/activityinfo/trippayinfo/view'))
 

//classinfo
const classinfoList = React.lazy(() => import('./admindata/schoolmgm/classinfo/list'))
const classinfoNew = React.lazy(() => import('./admindata/schoolmgm/classinfo/new'))
const classinfoModify = React.lazy(() => import('./admindata/schoolmgm/classinfo/modify.js'))
const classinfoView = React.lazy(() => import('./admindata/schoolmgm/classinfo/view'))

//studentinfo
const studentinfoList = React.lazy(() => import('./admindata/schoolmgm/studentinfo/list'))
const studentinfoNew = React.lazy(() => import('./admindata/schoolmgm/studentinfo/new'))
const studentinfoModify = React.lazy(() => import('./admindata/schoolmgm/studentinfo/modify.js'))
const studentinfoView = React.lazy(() => import('./admindata/schoolmgm/studentinfo/view'))

//staffinfo
const staffinfoList = React.lazy(() => import('./admindata/schoolmgm/staffinfo/list'))
const staffinfoNew = React.lazy(() => import('./admindata/schoolmgm/staffinfo/new'))
const staffinfoModify = React.lazy(() => import('./admindata/schoolmgm/staffinfo/modify.js'))
const staffinfoView = React.lazy(() => import('./admindata/schoolmgm/staffinfo/view'))

//parentinfo
const parentinfoList = React.lazy(() => import('./admindata/schoolmgm/parentinfo/list'))
const parentinfoNew = React.lazy(() => import('./admindata/schoolmgm/parentinfo/new'))
const parentinfoModify = React.lazy(() => import('./admindata/schoolmgm/parentinfo/modify.js'))
const parentinfoView = React.lazy(() => import('./admindata/schoolmgm/parentinfo/view'))

const vendorList = React.lazy(() => import('./admindata/vendor/list'))
const vendorNew = React.lazy(() => import('./admindata/vendor/new'))
const vendorModify = React.lazy(() => import('./admindata/vendor/modify'))
const vendorView = React.lazy(() => import('./admindata/vendor/view'))
const vendorchangepwd = React.lazy(() => import('./admindata/vendor/changepwd'))

//vendorstaffinfo
const vendorstaffinfoList = React.lazy(() => import('./admindata/vendor/staffinfo/list'))
const vendorstaffinfoNew = React.lazy(() => import('./admindata/vendor/staffinfo/new'))
const vendorstaffinfoModify = React.lazy(() => import('./admindata/vendor/staffinfo/modify.js'))
const vendorstaffinfoView = React.lazy(() => import('./admindata/vendor/staffinfo/view'))

//Badge
const BadgeList = React.lazy(() => import('./admindata/badge/list'))
const BadgeNew = React.lazy(() => import('./admindata/badge/new'))
const BadgeModify = React.lazy(() => import('./admindata/badge/modify'))
const BadgeView = React.lazy(() => import('./admindata/badge/view'))

//activityoversight
const activityoversightList = React.lazy(() => import('./admindata/activityoversight/list'))
 
//reportsandanalysis
const reportsandanalysisList = React.lazy(
  () => import('./admindata/reportsandanalysis/providerlist'),
)
const reportsandanalysisNew = React.lazy(() => import('./admindata/reportsandanalysis/schoollist'))


//MemberShip List
const MemberShipList = React.lazy(() => import('./admindata/membership/list'))
const MemberShipNew = React.lazy(() => import('./admindata/membership/new'))
const MemberShipModify = React.lazy(() => import('./admindata/membership/modify'))

//Payment List
const PaymentList = React.lazy(() => import('./admindata/payment/list'))

//City
const CityList = React.lazy(() => import('./admindata/lookupdata/city/list'))
const CityNew = React.lazy(() => import('./admindata/lookupdata/city/new'))
const CityModify = React.lazy(() => import('./admindata/lookupdata/city/modify'))

//Country
const countryList = React.lazy(() => import('./admindata/lookupdata/country/list'))
const countryNew = React.lazy(() => import('./admindata/lookupdata/country/new'))
const countryModify = React.lazy(() => import('./admindata/lookupdata/country/modify'))

//Category
const categoryList = React.lazy(() => import('./admindata/lookupdata/category/list'))
const categoryNew = React.lazy(() => import('./admindata/lookupdata/category/new'))
const categoryModify = React.lazy(() => import('./admindata/lookupdata/category/modify'))

//EducationLevel
const SchEduLevelList = React.lazy(() => import('./admindata/lookupdata/schedulevel/list'))
const SchEduLevelNew = React.lazy(() => import('./admindata/lookupdata/schedulevel/new'))
const SchEduLevelModify = React.lazy(() => import('./admindata/lookupdata/schedulevel/modify'))

//SubAdmin
const UserList = React.lazy(() => import('./admindata/subadmin/list'))
const UserNew = React.lazy(() => import('./admindata/subadmin/new'))
const UserModify = React.lazy(() => import('./admindata/subadmin/modify'))

const MainMenuList = React.lazy(() => import('./admindata/mainmenu/list'))
const MainMenuNew = React.lazy(() => import('./admindata/mainmenu/new'))
const MainMenuModify = React.lazy(() => import('./admindata/mainmenu/modify'))


//BirthDay List
const NoteList = React.lazy(() => import('./admindata/note/list'))

const AdminSetLink = React.lazy(() => import('./admindata/setlink/setlink'))



const RightsList = React.lazy(() => import('./admindata/rights/list'))





//admin Activity
const adminDataActivityView = React.lazy(() => import('./admindata/activityinfo/activity/view'))
const adminDataActivityList = React.lazy(() => import('./admindata/activityinfo/activity/list'))
const adminDataActivityModify = React.lazy(() => import('./admindata/activityinfo/activity/modify'))

//parents
const parentsList = React.lazy(() => import('./views/parents/list'))
const parentsView = React.lazy(() => import('./views/parents/view'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/admin/dashboard', name: 'Dashboard', element: AdminDashboard },
  { path: '/login', name: 'Login ', element: LoginPage },

  //schoolmgm
  {
    path: '/admindata/schoolmgm/schoolinfo/list',
    name: 'School Management',
    element: adminschoolmgmList,
  },
  { path: '/admindata/schoolmgm/schoolinfo/new', name: 'New', element: adminschoolmgmNew },
  { path: '/admindata/schoolmgm/schoolinfo/modify', name: 'Modify', element: adminschoolmgmModify },
  { path: '/admindata/schoolmgm/schoolinfo/view', name: 'View', element: adminschoolmgmView },
  {
    path: '/admindata/schoolmgm/schoolinfo/changepwd',
    name: 'View',
    element: adminschoolmgmChangePwd,
  },
  //trip PayInfo
{    path: '/admindata/activityinfo/trippayinfo/view',    name: 'Paid Student List',    element: adminTripPayInfo,},
 


  //trip propsal
{    path: '/admindata/activityinfo/trip/list',    name: 'Proposal Created',    element: adminschTripProposalCraeted,},
{    path: '/admindata/activityinfo/trip/view',    name: 'Proposal View',    element: adminschTripView,},

  //classinfo
  {
    path: '/admindata/schoolmgm/classinfo/list',
    name: 'Class Information',
    element: classinfoList,
  },
  { path: '/admindata/schoolmgm/classinfo/new', name: 'New', element: classinfoNew },
  { path: '/admindata/schoolmgm/classinfo/modify', name: 'Modify', element: classinfoModify },
  { path: '/admindata/schoolmgm/classinfo/view', name: 'View', element: classinfoView },

  //studentinfo
  {
    path: '/admindata/schoolmgm/studentinfo/list',
    name: 'Class Information',
    element: studentinfoList,
  },
  { path: '/admindata/schoolmgm/studentinfo/new', name: 'New', element: studentinfoNew },
  { path: '/admindata/schoolmgm/studentinfo/modify', name: 'Modify', element: studentinfoModify },
  { path: '/admindata/schoolmgm/studentinfo/view', name: 'View', element: studentinfoView },

  //staffinfo
  {
    path: '/admindata/schoolmgm/staffinfo/list',
    name: 'Class Information',
    element: staffinfoList,
  },
  { path: '/admindata/schoolmgm/staffinfo/new', name: 'New', element: staffinfoNew },
  { path: '/admindata/schoolmgm/staffinfo/modify', name: 'Modify', element: staffinfoModify },
  { path: '/admindata/schoolmgm/staffinfo/view', name: 'View', element: staffinfoView },

  //parentinfo
  {
    path: '/admindata/schoolmgm/parentinfo/list',
    name: 'Class Information',
    element: parentinfoList,
  },
  { path: '/admindata/schoolmgm/parentinfo/new', name: 'New', element: parentinfoNew },
  { path: '/admindata/schoolmgm/parentinfo/modify', name: 'Modify', element: parentinfoModify },
  { path: '/admindata/schoolmgm/parentinfo/view', name: 'View', element: parentinfoView },

  //vendor
  { path: '/admindata/vendor/list', name: 'vendor List', element: vendorList },
  { path: '/admindata/vendor/new', name: 'vendor Modify', element: vendorNew },
  { path: '/admindata/vendor/modify', name: 'vendor Modify', element: vendorModify },
  { path: '/admindata/vendor/view', name: 'vendor Modify', element: vendorView },
  { path: '/admindata/vendor/changepwd', name: 'Change Password', element: vendorchangepwd },

  //vendor staffinfo
  {
    path: '/admindata/vendor/staffinfo/list',
    name: 'Staff Information',
    element: vendorstaffinfoList,
  },
  { path: '/admindata/vendor/staffinfo/new', name: 'New', element: vendorstaffinfoNew },
  { path: '/admindata/vendor/staffinfo/modify', name: 'Modify', element: vendorstaffinfoModify },
  { path: '/admindata/vendor/staffinfo/view', name: 'View', element: vendorstaffinfoView },

  //badge

  { path: '/admindata/badge/list', name: 'Badge List', element: BadgeList },
  { path: '/admindata/badge/new', name: 'Badge New', element: BadgeNew },
  { path: '/admindata/badge/modify', name: 'Badge Modify', element: BadgeModify },
  { path: '/admindata/badge/view', name: 'Badge Modify', element: BadgeView },
  //activityoversight
  {
    path: '/admindata/activityoversight/list',
    name: 'activityoversight List',
    element: activityoversightList,
  },

  //reportsandanalysis
  {
    path: '/admindata/reportsandanalysis/providerlist',
    name: 'reportsandanalysis List',
    element: reportsandanalysisList,
  },
  {
    path: '/admindata/reportsandanalysis/schoollist',
    name: 'reportsandanalysis Modify',
    element: reportsandanalysisNew,
  },

  //MemberShip
  { path: '/admindata/membership/list', name: 'banner List', element: MemberShipList },
  { path: '/admindata/membership/new', name: 'banner List', element: MemberShipNew },
  { path: '/admindata/membership/modify', name: 'banner List', element: MemberShipModify },

    //Payment
  { path: '/admindata/payment/list', name: 'banner List', element: PaymentList },

  //City
  { path: 'admindata/city/list', name: 'City List', element: CityList },
  { path: 'admindata/city/new', name: 'New City', element: CityNew },
  { path: 'admindata/city/modify', name: 'Modify City', element: CityModify },

  //Country
  { path: 'admindata/country/list', name: 'country List', element: countryList },
  { path: 'admindata/country/new', name: 'New country', element: countryNew },
  { path: 'admindata/country/modify', name: 'Modify country', element: countryModify },

  //Category
  { path: 'admindata/category/list', name: 'category List', element: categoryList },
  { path: 'admindata/category/new', name: 'New category', element: categoryNew },
  { path: 'admindata/category/modify', name: 'Modify category', element: categoryModify },

  //Education Level
  { path: 'admindata/schedulevel/list', name: 'schedulevel List', element: SchEduLevelList },
  { path: 'admindata/schedulevel/new', name: 'New schedulevel', element: SchEduLevelNew },
  { path: 'admindata/schedulevel/modify', name: 'Modify schedulevel', element: SchEduLevelModify },


//SubAdmin
  { path: '/admindata/subadmin/list', name: 'User List', element: UserList },
  { path: '/admindata/subadmin/new', name: 'New User', element: UserNew },
  { path: '/admindata/subadmin/modify', name: 'Modify User', element: UserModify },

  

  //Parents
  { path: '/parents/list', name: 'parents List', element: parentsList },
  { path: '/parents/view', name: 'parents Modify', element: parentsView },

 

  { path: '/mainmenu/list', name: 'banner List', element: MainMenuList },
  { path: '/mainmenu/new', name: 'banner List', element: MainMenuNew },
  { path: '/mainmenu/modify', name: 'banner List', element: MainMenuModify }, 
  { path: '/rights/list', name: 'banner List', element: RightsList },
  
{ path: '/public/proposal', name: 'Proposal', element: PublicProposal },
{ path: '/public/program/:requestId', name: 'Program', element: PublicProgram },
{ path: '/public/programv1/:requestId', name: 'Program', element: PublicProgramv1 },
  // { path: '/public/payerror', name: 'Proposal ', element: PublicPayError },
  // { path: '/public/paysuccess', name: 'Proposal ', element: PublicPaySuccess },

  //Notefication
  { path: '/admindata/note/list', name: 'banner List', element: NoteList },
  { path: '/admindata/setlink/setlink', name: 'Set Link', element: AdminSetLink },

  //Admin Activity
  {
    path: '/admindata/activityinfo/activity/modify',
    name: 'Activity Management',
    element: adminDataActivityModify,
  },
  {
    path: '/admindata/activityinfo/activity/View',
    name: 'Activity Management',
    element: adminDataActivityView,
  },
  {
    path: '/admindata/activityinfo/activity/list',
    name: 'Activity Management',
    element: adminDataActivityList,
  },
]

export default routes
