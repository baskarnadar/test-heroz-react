// src/App.js
import React, { Suspense, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Auth / misc pages
const Login = React.lazy(() => import('./views/pages/login/login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

// ✅ Public pages (rendered OUTSIDE DefaultLayout)
const PublicProposal = React.lazy(() => import('./public/proposal.js'))
const PublicProgram = React.lazy(() => import('./public/program.js'))
const PublicProgramv1 = React.lazy(() => import('./public/programv1.js'))
const PublicPayError = React.lazy(() => import('./public/payerror.js'))
const PublicPaySuccess = React.lazy(() => import('./public/paysuccess.js'))
const PublicPaymentPage = React.lazy(() => import('./public/PaymentPage.jsx'))
const PublicSuccess = React.lazy(() => import('./public/Success.jsx'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const themeParam = params.get('theme')
    const theme = themeParam && themeParam.match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) setColorMode(theme)
    if (!isColorModeSet()) setColorMode(storedTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Router>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          {/* ===== Public routes (no layout, no guards) ===== */}
          <Route path="/public/proposal" element={<PublicProposal />} />
          <Route path="/public/program/:requestId" element={<PublicProgram />} />
          <Route path="/public/programv1/:requestId" element={<PublicProgramv1 />} />
          <Route path="/public/payerror" element={<PublicPayError />} />
          <Route path="/public/paysuccess" element={<PublicPaySuccess />} />
          <Route path="/public/PaymentPage" element={<PublicPaymentPage />} />
          <Route path="/public/PaymentSuccess" element={<PublicSuccess />} />

          {/* ===== Auth / misc ===== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/404" element={<Page404 />} />
          <Route path="/500" element={<Page500 />} />

          {/* ===== Everything else uses the main app layout ===== */}
          <Route path="*" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
