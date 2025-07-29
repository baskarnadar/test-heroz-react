import adminRoutes from './routesadmin'
import vendorRoutes from './routesvendor'
const routes = [
  { path: '/', exact: true, name: 'Home' },
  ...adminRoutes,
  ...vendorRoutes
 
]
export default routes
