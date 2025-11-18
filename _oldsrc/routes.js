import { Navigate } from 'react-router-dom'
import adminRoutes from './routesadmin'
import vendorRoutes from './routesvendor'

const routes = [
  { path: '/', element: <Navigate to="/login" replace /> },
  ...adminRoutes,
  ...vendorRoutes
]

export default routes
