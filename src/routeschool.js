import React from 'react'
const AdminDashboard = React.lazy(() => import('./views/admin/dashboard/Dashboard'))
const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Colors = React.lazy(() => import('./views/theme/colors/Colors'))
const Typography = React.lazy(() => import('./views/theme/typography/Typography'))
const Orders = React.lazy(() => import('./views/orders/orderlist/list'))
const OrderInfo = React.lazy(() => import('./views/orders/orderlist/info'))
const Painter = React.lazy(() => import('./views/painter/painterinfo/list'))
const AddPainter = React.lazy(() => import('./views/painter/painterinfo/new'))
const ViewPainter = React.lazy(() => import('./views/painter/painterinfo/view'))
// Base

const LoginPage = React.lazy(() => import('./views/pages/login/login.js'))


const OfferList = React.lazy(() => import('./views/offers/offerlist'))
const OfferNew = React.lazy(() => import('./views/offers/new'))
const OfferModify = React.lazy(() => import('./views/offers/modify'))

//parents
const parentsList = React.lazy(() => import('./views/parents/list'))
const parentsView = React.lazy(() => import('./views/parents/view'))

//vendor
const vendorList = React.lazy(() => import('./views/vendor/list'))
const vendorNew = React.lazy(() => import('./views/vendor/new'))
const vendorModify = React.lazy(() => import('./views/vendor/modify'))
const vendorView = React.lazy(() => import('./views/vendor/view'))
const vendorchangepwd = React.lazy(() => import('./views/vendor/changepwd'))


//vendorstaffinfo
const vendorstaffinfoList = React.lazy(() => import('./views/vendor/staffinfo/list'))
const vendorstaffinfoNew = React.lazy(() => import('./views/vendor/staffinfo/new'))
const vendorstaffinfoModify = React.lazy(() => import('./views/vendor/staffinfo/modify.js'))
const vendorstaffinfoView = React.lazy(() => import('./views/vendor/staffinfo/view'))


//activityoversight
const activityoversightList = React.lazy(() => import('./views/activityoversight/list'))
const activityoversightNew = React.lazy(() => import('./views/activityoversight/new'))


//reportsandanalysis
const reportsandanalysisList = React.lazy(() => import('./views/reportsandanalysis/providerlist'))
const reportsandanalysisNew = React.lazy(() => import('./views/reportsandanalysis/schoollist'))

//Badge
const BadgeList = React.lazy(() => import('./views/badge/list'))
const BadgeNew = React.lazy(() => import('./views/badge/new'))
const BadgeModify = React.lazy(() => import('./views/badge/modify'))
const BadgeView = React.lazy(() => import('./views/badge/view'))



//schoolmgm
const schoolmgmList = React.lazy(() => import('./views/schoolmgm/schoolinfo/list'))
const schoolmgmNew = React.lazy(() => import('./views/schoolmgm/schoolinfo/new'))
const schoolmgmModify = React.lazy(() => import('./views/schoolmgm/schoolinfo/modify.js'))
const schoolmgmView = React.lazy(() => import('./views/schoolmgm/schoolinfo/view'))
const schoolmgmChangePwd = React.lazy(() => import('./views/schoolmgm/schoolinfo/changepwd'))

//classinfo
const classinfoList = React.lazy(() => import('./views/schoolmgm/classinfo/list'))
const classinfoNew = React.lazy(() => import('./views/schoolmgm/classinfo/new'))
const classinfoModify = React.lazy(() => import('./views/schoolmgm/classinfo/modify.js'))
const classinfoView = React.lazy(() => import('./views/schoolmgm/classinfo/view'))

//studentinfo
const studentinfoList = React.lazy(() => import('./views/schoolmgm/studentinfo/list'))
const studentinfoNew = React.lazy(() => import('./views/schoolmgm/studentinfo/new'))
const studentinfoModify = React.lazy(() => import('./views/schoolmgm/studentinfo/modify.js'))
const studentinfoView = React.lazy(() => import('./views/schoolmgm/studentinfo/view'))


//staffinfo
const staffinfoList = React.lazy(() => import('./views/schoolmgm/staffinfo/list'))
const staffinfoNew = React.lazy(() => import('./views/schoolmgm/staffinfo/new'))
const staffinfoModify = React.lazy(() => import('./views/schoolmgm/staffinfo/modify.js'))
const staffinfoView = React.lazy(() => import('./views/schoolmgm/staffinfo/view'))

//parentinfo
const parentinfoList = React.lazy(() => import('./views/schoolmgm/parentinfo/list'))
const parentinfoNew = React.lazy(() => import('./views/schoolmgm/parentinfo/new'))
const parentinfoModify = React.lazy(() => import('./views/schoolmgm/parentinfo/modify.js'))
const parentinfoView = React.lazy(() => import('./views/schoolmgm/parentinfo/view'))

const BannerList = React.lazy(() => import('./views/banner/list'))
const BannerNew = React.lazy(() => import('./views/banner/new'))
const BannerModify = React.lazy(() => import('./views/banner/modify'))

const MainMenuList = React.lazy(() => import('./views/admin/mainmenu/list'))
const MainMenuNew = React.lazy(() => import('./views/admin/mainmenu/new'))
const MainMenuModify = React.lazy(() => import('./views/admin/mainmenu/modify'))

//MemberShip List
const MemberShipList = React.lazy(() => import('./views/membership/list'))
const MemberShipNew = React.lazy(() => import('./views/membership/new'))
const MemberShipModify = React.lazy(() => import('./views/membership/modify'))
 

 
//BirthDay List
const NoteList = React.lazy(() => import('./views/note/list'))

//Payment List
const PaymentList = React.lazy(() => import('./views/payment/list'))
 
const RightsList = React.lazy(() => import('./views/admin/rights/list'))

const SubMenuList = React.lazy(() => import('./views/admin/submenu/list'))
const SubMenuNew = React.lazy(() => import('./views/admin/submenu/new'))
const SubMenuModify = React.lazy(() => import('./views/admin/submenu/modify'))

const CityList = React.lazy(() => import('./views/lookupdata/city/list'))
const CityNew = React.lazy(() => import('./views/lookupdata/city/new'))
const CityModify = React.lazy(() => import('./views/lookupdata/city/modify'))

const countryList = React.lazy(() => import('./views/lookupdata/country/list'))
const countryNew = React.lazy(() => import('./views/lookupdata/country/new'))
const countryModify = React.lazy(() => import('./views/lookupdata/country/modify'))

const categoryList = React.lazy(() => import('./views/lookupdata/category/list'))
const categoryNew = React.lazy(() => import('./views/lookupdata/category/new'))
const categoryModify = React.lazy(() => import('./views/lookupdata/category/modify'))

const SchEduLevelList = React.lazy(() => import('./views/lookupdata/schedulevel/list'))
const SchEduLevelNew = React.lazy(() => import('./views/lookupdata/schedulevel/new'))
const SchEduLevelModify = React.lazy(() => import('./views/lookupdata/schedulevel/modify'))

const UserList = React.lazy(() => import('./views/user/list'))
const UserNew = React.lazy(() => import('./views/user/new'))
const UserModify = React.lazy(() => import('./views/user/modify'))

const OrderStatusList = React.lazy(() => import('./views/lookupdata/orderstatus/list'))
const OrderStatusNew = React.lazy(() => import('./views/lookupdata/orderstatus/new'))
const OrderStatusModify = React.lazy(() => import('./views/lookupdata/orderstatus/modify'))


const Accordion = React.lazy(() => import('./views/base/accordion/Accordion'))
const Breadcrumbs = React.lazy(() => import('./views/base/breadcrumbs/Breadcrumbs'))
const Cards = React.lazy(() => import('./views/base/cards/Cards'))
const Carousels = React.lazy(() => import('./views/base/carousels/Carousels'))
const Collapses = React.lazy(() => import('./views/base/collapses/Collapses'))
const ListGroups = React.lazy(() => import('./views/base/list-groups/ListGroups'))
const Navs = React.lazy(() => import('./views/base/navs/Navs'))
const Paginations = React.lazy(() => import('./views/base/paginations/Paginations'))
const Placeholders = React.lazy(() => import('./views/base/placeholders/Placeholders'))
const Popovers = React.lazy(() => import('./views/base/popovers/Popovers'))
const Progress = React.lazy(() => import('./views/base/progress/Progress'))
const Spinners = React.lazy(() => import('./views/base/spinners/Spinners'))
const Tabs = React.lazy(() => import('./views/base/tabs/Tabs'))
const Tables = React.lazy(() => import('./views/base/tables/Tables'))
const Tooltips = React.lazy(() => import('./views/base/tooltips/Tooltips'))

// Buttons
const Buttons = React.lazy(() => import('./views/buttons/buttons/Buttons'))
const ButtonGroups = React.lazy(() => import('./views/buttons/button-groups/ButtonGroups'))
const Dropdowns = React.lazy(() => import('./views/buttons/dropdowns/Dropdowns'))

//Forms
const ChecksRadios = React.lazy(() => import('./views/forms/checks-radios/ChecksRadios'))

//Category
const category = React.lazy(() => import('./views/forms/category/list'))
const newcategory = React.lazy(() => import('./views/forms/category/new'))


//Store
const StoreList = React.lazy(() => import('./views/store/list'))
const StoreNew = React.lazy(() => import('./views/store/new'))

const subcategory = React.lazy(() => import('./views/forms/category/prdsubcategory'))
const productlist = React.lazy(() => import('./views/forms/product/productlist'))
const prdsizelist = React.lazy(() => import('./views/forms/prdsize/prdsizelist'))
const addproduct = React.lazy(() => import('./views/forms/product/addproduct'))
const EditProduct = React.lazy(() => import('./views/forms/product/modify'))
 
const prdcolorlist = React.lazy(() => import('./views/forms/prdcolor/prdcolorlist'))
const prdnewsize = React.lazy(() => import('./views/forms/prdsize/prdnewsize'))

const FloatingLabels = React.lazy(() => import('./views/forms/floating-labels/FloatingLabels'))
const FormControl = React.lazy(() => import('./views/forms/form-control/FormControl'))
const InputGroup = React.lazy(() => import('./views/forms/input-group/InputGroup'))
const Layout = React.lazy(() => import('./views/forms/layout/Layout'))
const Range = React.lazy(() => import('./views/forms/range/Range'))
const Select = React.lazy(() => import('./views/forms/select/Select'))
const Validation = React.lazy(() => import('./views/forms/validation/Validation'))

const Charts = React.lazy(() => import('./views/charts/Charts'))

// Icons
const CoreUIIcons = React.lazy(() => import('./views/icons/coreui-icons/CoreUIIcons'))
const Flags = React.lazy(() => import('./views/icons/flags/Flags'))
const Brands = React.lazy(() => import('./views/icons/brands/Brands'))

// Notifications
const Alerts = React.lazy(() => import('./views/notifications/alerts/Alerts'))
const Badges = React.lazy(() => import('./views/notifications/badges/Badges'))
const Modals = React.lazy(() => import('./views/notifications/modals/Modals'))
const Toasts = React.lazy(() => import('./views/notifications/toasts/Toasts'))

const Widgets = React.lazy(() => import('./views/widgets/Widgets'))

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/admin/dashboard', name: 'Dashboard', element: AdminDashboard },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/theme', name: 'Theme', element: Colors, exact: true },
  { path: '/theme/colors', name: 'Colors', element: Colors },
  { path: '/theme/typography', name: 'Typography', element: Typography },
  { path: '/orders/orderlist', name: 'All Parents', element: Orders },
 { path: '/orders/orderinfo', name: 'orderinfo', element: OrderInfo },
  

 
   { path: '/login', name: 'Login ', element: LoginPage },

  { path: '/painter/painterinfo', name: 'painterinfo', element: Painter },
  { path: '/painter/addpainter', name: 'New Painter', element: AddPainter },
  { path: '/painter/view', name: 'View Painter', element: ViewPainter },
    

{ path: '/user/list', name: 'User List', element: UserList },
{ path: '/user/new', name: 'New User', element: UserNew },
{ path: '/user/modify', name: 'Modify User', element: UserModify },

{ path: '/city/list', name: 'City List', element: CityList },
{ path: '/city/new', name: 'New City', element: CityNew },
{ path: '/city/modify', name: 'Modify City', element: CityModify },

{ path: '/country/list', name: 'country List', element: countryList },
{ path: '/country/new', name: 'New country', element: countryNew },
{ path: '/country/modify', name: 'Modify country', element: countryModify },

{ path: '/category/list', name: 'category List', element: categoryList },
{ path: '/category/new', name: 'New category', element: categoryNew },
{ path: '/category/modify', name: 'Modify category', element: categoryModify },

{ path: '/schedulevel/list', name: 'schedulevel List', element: SchEduLevelList },
{ path: '/schedulevel/new', name: 'New schedulevel', element: SchEduLevelNew },
{ path: '/schedulevel/modify', name: 'Modify schedulevel', element: SchEduLevelModify },


{ path: '/orderstatus/list', name: '  Order Status', element: OrderStatusList },
{ path: '/orderstatus/new', name: 'New Order Status', element: OrderStatusNew },
{ path: '/orderstatus/modify', name: 'Modify Order Status', element: OrderStatusModify },

{ path: '/offers/offerlist', name: 'Offer List', element: OfferList },
{ path: '/offers/new', name: 'Offer List', element: OfferNew },
{ path: '/offers/modify', name: 'Offer List', element: OfferModify },


{ path: '/badge/list', name: 'Badge List', element: BadgeList },
{ path: '/badge/new', name: 'Badge New', element: BadgeNew },
{ path: '/badge/modify', name: 'Badge Modify', element: BadgeModify },
{ path: '/badge/view', name: 'Badge Modify', element: BadgeView },

//Parents
{ path: '/parents/list', name: 'parents List', element: parentsList },
{ path: '/parents/view', name: 'parents Modify', element: parentsView },

//vendor
{ path: '/vendor/list', name: 'vendor List', element: vendorList },
{ path: '/vendor/new', name: 'vendor Modify', element: vendorNew },
{ path: '/vendor/modify', name: 'vendor Modify', element: vendorModify },
{ path: '/vendor/view', name: 'vendor Modify', element: vendorView },
{ path: '/vendor/changepwd', name: 'Change Password', element: vendorchangepwd },


//vendor staffinfo
{ path: '/vendor/staffinfo/list', name: 'Staff Information', element: vendorstaffinfoList },
{ path: '/vendor/staffinfo/new', name: 'New', element: vendorstaffinfoNew },
{ path: '/vendor/staffinfo/modify', name: 'Modify', element: vendorstaffinfoModify },
{ path: '/vendor/staffinfo/view', name: 'View', element: vendorstaffinfoView },

//activityoversight
{ path: '/activityoversight/list', name: 'activityoversight List', element: activityoversightList },
{ path: '/activityoversight/new', name: 'activityoversight Modify', element: activityoversightNew },

//reportsandanalysis
{ path: '/reportsandanalysis/providerlist', name: 'reportsandanalysis List', element: reportsandanalysisList },
{ path: '/reportsandanalysis/schoollist', name: 'reportsandanalysis Modify', element: reportsandanalysisNew },



//schoolmgm
{ path: '/schoolmgm/schoolinfo/list', name: 'School Management', element: schoolmgmList },
{ path: '/schoolmgm/schoolinfo/new', name: 'New', element: schoolmgmNew },
{ path: '/schoolmgm/schoolinfo/modify', name: 'Modify', element: schoolmgmModify },
{ path: '/schoolmgm/schoolinfo/view', name: 'View', element: schoolmgmView },
{ path: '/schoolmgm/schoolinfo/changepwd', name: 'View', element: schoolmgmChangePwd },

//classinfo
{ path: '/schoolmgm/classinfo/list', name: 'Class Information', element: classinfoList },
{ path: '/schoolmgm/classinfo/new', name: 'New', element: classinfoNew },
{ path: '/schoolmgm/classinfo/modify', name: 'Modify', element: classinfoModify },
{ path: '/schoolmgm/classinfo/view', name: 'View', element: classinfoView },


//studentinfo
{ path: '/schoolmgm/studentinfo/list', name: 'Class Information', element: studentinfoList },
{ path: '/schoolmgm/studentinfo/new', name: 'New', element: studentinfoNew },
{ path: '/schoolmgm/studentinfo/modify', name: 'Modify', element: studentinfoModify },
{ path: '/schoolmgm/studentinfo/view', name: 'View', element: studentinfoView },

//staffinfo
{ path: '/schoolmgm/staffinfo/list', name: 'Class Information', element: staffinfoList },
{ path: '/schoolmgm/staffinfo/new', name: 'New', element: staffinfoNew },
{ path: '/schoolmgm/staffinfo/modify', name: 'Modify', element: staffinfoModify },
{ path: '/schoolmgm/staffinfo/view', name: 'View', element: staffinfoView },

//parentinfo
{ path: '/schoolmgm/parentinfo/list', name: 'Class Information', element: parentinfoList },
{ path: '/schoolmgm/parentinfo/new', name: 'New', element: parentinfoNew },
{ path: '/schoolmgm/parentinfo/modify', name: 'Modify', element: parentinfoModify },
{ path: '/schoolmgm/parentinfo/view', name: 'View', element: parentinfoView },

{ path: '/banner/list', name: 'banner List', element: BannerList },
{ path: '/banner/new', name: 'banner List', element: BannerNew },
{ path: '/banner/modify', name: 'banner List', element: BannerModify },
      
{ path: '/mainmenu/list', name: 'banner List', element: MainMenuList },
{ path: '/mainmenu/new', name: 'banner List', element: MainMenuNew },
{ path: '/mainmenu/modify', name: 'banner List', element: MainMenuModify },



{ path: '/rights/list', name: 'banner List', element: RightsList },

//MemberShip
{ path: '/membership/list', name: 'banner List', element: MemberShipList },
{ path: '/membership/new', name: 'banner List', element: MemberShipNew },
{ path: '/membership/modify', name: 'banner List', element: MemberShipModify },
 
//Payment
{ path: '/payment/list', name: 'banner List', element: PaymentList },

//Notefication
{ path: '/note/list', name: 'banner List', element: NoteList },

 


  { path: '/base', name: 'Base', element: Cards, exact: true },
  { path: '/base/accordion', name: 'Accordion', element: Accordion },
  { path: '/base/breadcrumbs', name: 'Breadcrumbs', element: Breadcrumbs },
  { path: '/base/cards', name: 'Cards', element: Cards },
  { path: '/base/carousels', name: 'Carousel', element: Carousels },
  { path: '/base/collapses', name: 'Collapse', element: Collapses },
  { path: '/base/list-groups', name: 'List Groups', element: ListGroups },
  { path: '/base/navs', name: 'Navs', element: Navs },
  { path: '/base/paginations', name: 'Paginations', element: Paginations },
  { path: '/base/placeholders', name: 'Placeholders', element: Placeholders },
  { path: '/base/popovers', name: 'Popovers', element: Popovers },
  { path: '/base/progress', name: 'Progress', element: Progress },
  { path: '/base/spinners', name: 'Spinners', element: Spinners },
  { path: '/base/tabs', name: 'Tabs', element: Tabs },
  { path: '/base/tables', name: 'Tables', element: Tables },
  { path: '/base/tooltips', name: 'Tooltips', element: Tooltips },
  { path: '/buttons', name: 'Buttons', element: Buttons, exact: true },
  { path: '/buttons/buttons', name: 'Buttons', element: Buttons },
  { path: '/buttons/dropdowns', name: 'Dropdowns', element: Dropdowns },
  { path: '/buttons/button-groups', name: 'Button Groups', element: ButtonGroups },
  { path: '/charts', name: 'Charts', element: Charts },
  { path: '/forms', name: 'Forms', element: FormControl, exact: true },
  { path: '/forms/form-control', name: 'Form Control', element: FormControl },
  { path: '/forms/select', name: 'Select', element: Select },
  { path: '/forms/checks-radios', name: 'Checks & Radios', element: ChecksRadios },
  { path: '/forms/category', name: 'Category', element: category },
    { path: '/forms/newcategory', name: 'New Category ', element: newcategory },

  //Store
  { path: '/store/list', name: 'Store', element: StoreList },
  { path: '/store/new', name: 'Store', element: StoreNew },

  { path: '/forms/subcategory', name: 'Sub Category', element: subcategory },
  { path: '/forms/product/productlist', name: 'Product List', element: productlist },
  { path: '/forms/prdsize/prdsizelist', name: 'Product List', element: prdsizelist },
  
  { path: '/forms/product/addproduct', name: 'Add Prodcut', element: addproduct },
  { path: '/forms/product/modify', name: 'Modify Prodcut', element: EditProduct },

 
  { path: '/forms/prdcolor/prdcolorlist', name: ' Color List', element: prdcolorlist },
  
  { path: '/forms/prdsize/prdnewsize', name: 'Add Color', element: prdnewsize },
 

  { path: '/forms/range', name: 'Range', element: Range },
  { path: '/forms/input-group', name: 'Input Group', element: InputGroup },
  { path: '/forms/floating-labels', name: 'Floating Labels', element: FloatingLabels },
  { path: '/forms/layout', name: 'Layout', element: Layout },
  { path: '/forms/validation', name: 'Validation', element: Validation },
  { path: '/icons', exact: true, name: 'Icons', element: CoreUIIcons },
  { path: '/icons/coreui-icons', name: 'CoreUI Icons', element: CoreUIIcons },
  { path: '/icons/flags', name: 'Flags', element: Flags },
  { path: '/icons/brands', name: 'Brands', element: Brands },
  { path: '/notifications', name: 'Notifications', element: Alerts, exact: true },
  { path: '/notifications/alerts', name: 'Alerts', element: Alerts },
  { path: '/notifications/badges', name: 'Badges', element: Badges },
  { path: '/notifications/modals', name: 'Modals', element: Modals },
  { path: '/notifications/toasts', name: 'Toasts', element: Toasts },
  { path: '/widgets', name: 'Widgets', element: Widgets },
]

export default routes
