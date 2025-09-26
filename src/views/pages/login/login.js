import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import logo from '../../../assets/logo/default.png'

// 🔤 use these exact imports (as you asked)
import enPack from '../../../i18n/enloc100.json'
import arPack from '../../../i18n/arloc100.json'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // ---- i18n (local, no provider) ----
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      // ✅ default Arabic
      return v === 'ar' || v === 'en' ? v : 'ar'
    } catch {
      return 'ar'
    }
  }
  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback

  // keep <html dir/lang> + persist choice
  useEffect(() => {
    try { localStorage.setItem('heroz_lang', lang) } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', lang)
    }
  }, [lang])

  const handleLogin = async () => {

    console.log("username")
    console.log(password)

    try {
      const response = await fetch(`${API_BASE_URL}/subadmin/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })
      
      const data = await response.json()
      console.log('API Response:', data)
      console.log('data.data.token', data.data.token)

      if (response.ok && data.data.token) {
        // ✅ Save token to localStorage
        localStorage.setItem('allowedPages', JSON.stringify(data.allowedPages))
        localStorage.setItem('token', data.data.token)

        // ✅ Optionally save user data
        localStorage.setItem('prtuserid', data.data.prtuserid)
        localStorage.setItem('username', data.data.username)
        localStorage.setItem('usertype', data.data.usertype)
        localStorage.setItem('loggedusername', data.data.loggedusername)
        
        if (data.data.usertype == 'ADMIN')  
          navigate('/admin/dashboard') 
 
        if (data.data.usertype == 'VENDOR-SUBADMIN')  
          navigate('/vendor/dashboard')

      } else {
        handleLogout()
        setError(data.message || tr('errInvalidCredentials', 'Invalid credentials'))
      }
    } catch (err) {
      console.error('Login error:', err)
      handleLogout()
      setError(tr('loginFailedTryAgain', 'Login failed. Please try again.'))
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
    })
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      {/* 🌐 Top-right language switch (default AR) */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          insetInlineEnd: 12, // RTL/LTR aware
          display: 'flex',
          gap: 8,
          zIndex: 1050,
        }}
      >
        <CButton
          size="sm"
          color={lang === 'ar' ? 'primary' : 'light'}
          className="d-inline-flex align-items-center gap-1"
          type="button"
          onClick={() => setLang('ar')}
          title="العربية"
          aria-label="العربية"
        >
          <span role="img" aria-hidden>🌐</span> AR
        </CButton>
        <CButton
          size="sm"
          color={lang === 'en' ? 'primary' : 'light'}
          className="d-inline-flex align-items-center gap-1"
          type="button"
          onClick={() => setLang('en')}
          title="English"
          aria-label="English"
        >
          <span role="img" aria-hidden>🌐</span> EN
        </CButton>
      </div>

      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleLogin()
                    }}
                  >
                    <h1>{tr('loginTitle', 'Login')}</h1>
                    <p className="text-body-secondary">
                      {tr('loginSubtitle', 'Sign in to your account')}
                    </p>

                    {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder={tr('usernamePlaceholder', 'Username')}
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </CInputGroup>

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder={tr('passwordPlaceholder', 'Password')}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" className="px-4" type="submit">
                          {tr('loginBtn', 'Login')}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <CButton color="link" className="px-0">
                          {tr('forgotPassword', 'Forgot password?')}
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              <CCard
                className="text-white bg-primary py-5 d-flex align-items-center justify-content-center"
                style={{
                  width: '44%',
                  backgroundImage: `url(${logo})`,
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                <CCardBody className="text-center">{/* You can remove the <img> now */}</CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
