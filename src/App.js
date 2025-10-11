// src/App.js
import React, { Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CSpinner, useColorModes } from '@coreui/react'
import './scss/style.scss'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))

// Pages
const Login = React.lazy(() => import('./views/pages/login/login'))
const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

// --- Helpers to read query params on hash routes ---
function useQuery() {
  const { search } = useLocation()
  return new URLSearchParams(search)
}

// --- Inline Success/Error pages (can be moved to separate files later) ---
function PaySuccess() {
  const q = useQuery()
  const paymentId = q.get('paymentId') || q.get('PaymentId') || q.get('Id') || q.get('InvoiceId')
  return (
    <div style={{ padding: 24 }}>
      <h2>✅ Payment Successful</h2>
      {paymentId ? (
        <p><strong>Reference:</strong> {paymentId}</p>
      ) : (
        <p>Payment completed.</p>
      )}
      <p>You can safely close this page or continue browsing.</p>
    </div>
  )
}

function PayError() {
  const q = useQuery()
  const error = q.get('error') || q.get('Message') || 'The payment was canceled or failed.'
  const paymentId = q.get('paymentId') || q.get('PaymentId') || q.get('Id') || q.get('InvoiceId')
  return (
    <div style={{ padding: 24 }}>
      <h2>❌ Payment Error</h2>
      <p>{error}</p>
      {paymentId && <p><strong>Reference:</strong> {paymentId}</p>}
      <p>Please try again or contact support if the issue persists.</p>
    </div>
  )
}

const App = () => {
  const { isColorModeSet, setColorMode, colorMode } =
    useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    // 🛑 Always force LIGHT mode on first mount
    setColorMode('light')

    // If CoreUI has a stored mode and it's not light, correct it.
    try {
      const key = 'coreui-free-react-admin-template-theme'
      const lsVal = localStorage.getItem(key)
      if (lsVal && lsVal.toLowerCase() !== 'light') {
        localStorage.setItem(key, 'light')
        setColorMode('light')
      }
    } catch {
      // ignore storage errors (Safari privacy, etc.)
    }

    // Ignore ?theme=... in URL and any redux-stored theme; keep LIGHT only.
    // If someone tries to switch later, the effect below will snap it back.

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // 🔒 Guard: if anything sets dark/auto later, snap back to light
    if (colorMode && colorMode.toLowerCase() !== 'light') {
      setColorMode('light')
    }
  }, [colorMode, setColorMode])

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
       
          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Error pages */}
          <Route path="/404" element={<Page404 />} />
          <Route path="/500" element={<Page500 />} />

          {/* 🔁 Redirect root to /login (must be above the wildcard) */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Wildcard LAST: your app layout (dashboards, etc.) */}
          <Route path="*" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
