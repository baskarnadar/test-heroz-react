import React, { Suspense, useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
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
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state) => state.theme)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HashRouter>
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          {/* MyFatoorah result pages (hash routes). 
              The web server or static redirect files should send /paysuccess → /#/public/paysuccess */}
          <Route path="/public/paysuccess" element={<PaySuccess />} />
          <Route path="/public/payerror" element={<PayError />} />

          {/* Existing app pages */}
          <Route path="/login" name="Login Page" element={<Login />} />
          <Route path="/register" name="Register Page" element={<Register />} />
          <Route path="/404" name="Page 404" element={<Page404 />} />
          <Route path="/500" name="Page 500" element={<Page500 />} />

          {/* Wildcard route last */}
          <Route path="*" name="Home" element={<DefaultLayout />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
