import React, { useState, useEffect, useMemo } from 'react'
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
import { cilPhone } from '@coreui/icons'
import { API_BASE_URL } from '../../../config'
import logo from '../../../assets/logo/default.png'

// 🔤 same imports used in login.js
import enPack from '../../../i18n/enloc100.json'
import arPack from '../../../i18n/arloc100.json'

const ResetPwd = () => {
  const navigate = useNavigate()

  const [mobileno, setMobileno] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(false)

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

  const cleanMobile = useMemo(() => mobileno.replace(/\D/g, ''), [mobileno])

  // keep <html dir/lang> + persist choice
  useEffect(() => {
    try {
      localStorage.setItem('heroz_lang', lang)
    } catch {}

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', lang)
    }
  }, [lang])

  useEffect(() => {
    try {
      const savedMobile = localStorage.getItem('resetpwd_mobileno') || ''
      if (savedMobile) setMobileno(savedMobile)
    } catch {}
  }, [])

  const handleMobileChange = (value) => {
    let onlyDigits = value.replace(/\D/g, '')

    // ✅ Same login textbox rule: mobile number must be 5XXXXXXXX.
    // ✅ Do not allow 05XXXXXXXX while typing.
    if (onlyDigits.startsWith('0')) {
      onlyDigits = onlyDigits.replace(/^0+/, '')
    }

    if (onlyDigits.length > 0 && !onlyDigits.startsWith('5')) {
      return
    }

    setMobileno(onlyDigits.slice(0, 9))
    setError('')
  }

  const validateMobile = () => {
    if (!cleanMobile) {
      setError(tr('phoneRequired', 'Mobile number is required'))
      return false
    }

    if (!/^5\d{8}$/.test(cleanMobile)) {
      setError(tr('enterValidSaudiMobile', 'Please enter valid Saudi mobile number like 5XXXXXXXX'))
      return false
    }

    setError('')
    return true
  }

  const getApiStatusCode = (httpStatusCode, data) => {
    const raw = data && data.statusCode

    if (typeof raw === 'number') return raw
    if (typeof raw === 'string') return Number(raw) || httpStatusCode

    return httpStatusCode
  }

  const handleResetPassword = async () => {
    if (loading) return
    if (!validateMobile()) return

    try {
      setLoading(true)

      try {
        localStorage.setItem('resetpwd_mobileno', cleanMobile)
        localStorage.setItem('resetpwd_country_code', '+966')
        localStorage.setItem('resetpwd_country_flag', '🇸🇦')
      } catch {}

      const url = `${API_BASE_URL}/commondata/operation/resetpwd`
      const body = {
        mobileno: cleanMobile,
      }

      console.log('======================================')
      console.log('RESET PASSWORD API HIT')
      console.log('URL  :', url)
      console.log('BODY :', body)
      console.log('======================================')

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      })

      let data = {}
      try {
        data = await response.json()
      } catch {
        data = {
          statusCode: response.status,
          message: '',
        }
      }

      console.log('RESET PASSWORD STATUS CODE:', response.status)
      console.log('RESET PASSWORD API RESPONSE:', data)

      const apiStatusCode = getApiStatusCode(response.status, data)
      setModalSuccess(apiStatusCode === 200)
      setShowModal(true)
    } catch (err) {
      console.error('Reset password error:', err)
      setModalSuccess(false)
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)

    if (modalSuccess) {
      navigate('/login')
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      {/* 🌐 Top-right language switch - copied same as login.js */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          insetInlineEnd: 12,
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
          <span role="img" aria-hidden>
            🌐
          </span>{' '}
          AR
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
          <span role="img" aria-hidden>
            🌐
          </span>{' '}
          EN
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
                      handleResetPassword()
                    }}
                  >
                    <h1>{tr('resetPasswordTitle', 'Reset Password')}</h1>
                    <p className="text-body-secondary">
                      {tr('resetSubtitle', 'Enter your mobile number to receive your new password')}
                    </p>

                    {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilPhone} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="5XXXXXXXX"
                        autoComplete="tel"
                        inputMode="numeric"
                        maxLength={9}
                        value={mobileno}
                        onChange={(e) => handleMobileChange(e.target.value)}
                      />
                    </CInputGroup>

                    <CRow>
                      <CCol xs={6}>
                        <CButton color="primary" className="px-4" type="submit" disabled={loading}>
                          {loading
                            ? tr('processing', 'Processing...')
                            : tr('resetPasswordBtn', 'Reset Password')}
                        </CButton>
                      </CCol>

                      <CCol xs={6} className="text-right">
                        <CButton
                          color="link"
                          className="px-0"
                          type="button"
                          onClick={() => navigate('/login')}
                          style={{ cursor: 'pointer', position: 'relative', zIndex: 10 }}
                        >
                          {tr('backToLogin', 'Back to login')}
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
                <CCardBody className="text-center">
                  {/* Same right image card copied from login.js */}
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.42)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 390,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 18px 50px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: 22 }}>
              <h4 style={{ margin: '0 0 12px', fontWeight: 800 }}>
                {tr('resetPasswordTitle', 'Reset Password')}
              </h4>

              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  color: modalSuccess ? '#2e8b3c' : '#d94b4b',
                  lineHeight: 1.45,
                }}
              >
                {modalSuccess
                  ? tr(
                      'resetPasswordSuccessMessage',
                      'Your new password successfully sent to your mobile no',
                    )
                  : tr('mobileNotExist', 'Mobile number does not exist')}
              </p>

              <CButton color="primary" className="w-100 mt-4" type="button" onClick={closeModal}>
                {tr('closeBtn', 'Close')}
              </CButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResetPwd
