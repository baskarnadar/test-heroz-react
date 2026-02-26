//routes.js

import { Navigate } from 'react-router-dom'
import adminRoutes from './routesadmin'
import vendorRoutes from './routesvendor'
import MembershipRoutes from './routesmembership'
const routes = [
  { path: '/', element: <Navigate to="/login" replace /> },
  ...adminRoutes,
  ...vendorRoutes,
  ...MembershipRoutes
]

export default routes
