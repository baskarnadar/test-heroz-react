// src/public/expired.js
import React from 'react'
import { CCard, CCardBody, CCol, CContainer, CRow } from '@coreui/react'
import logo from '../assets/logo/herozlogo.png'

const PublicExpired = () => {
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">

      {/* 🔝 Top-center HEROZ logo */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1100,
        }}
      >
        <img
          src={logo}
          alt="Heroz Logo"
          style={{ height: 58, objectFit: 'contain' }}
        />
      </div>

      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8} lg={6}>
            <CCard className="p-4">
              <CCardBody className="text-center">

                {/* 🔹 English Message */}
                <p
                  className="text-body-secondary mb-3"
                  style={{ fontSize: 25, lineHeight: 1.6 }}
                >
                  Sorry, you cannot make this payment.  
                  The trip payment due date has passed.
                </p>

                <hr style={{ margin: '16px auto', maxWidth: 260 }} />

                {/* 🔹 Arabic Message */}
                <p
                  className="text-body-secondary mb-0"
                  style={{ fontSize: 25, lineHeight: 1.8 }}
                >
                  عذراً، لا يمكنك إتمام عملية الدفع.  
                  لقد انتهى موعد السداد الخاص بهذه الرحلة.
                </p>

              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default PublicExpired
