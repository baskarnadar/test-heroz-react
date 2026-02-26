// src/membership/calender/VdrCalenderScreen.js
import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CAlert,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CBadge,
} from '@coreui/react'
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID } from '../../utils/operation'

// ✅ FIXED IMPORT (your file is dashboard/calendar.js)
import Calendar from '../dashboard/calendar'

// 🔤 i18n packs
import enPack from '../../i18n/enloc100.json'
import arPack from '../../i18n/arloc100.json'

const GET_BOOKING_SUMMARY_LIST = `${API_BASE_URL}/membership/booking/vdrgetbookingSummaryList`
const toStr = (v) => (v ?? '').toString()

export default function VdrCalenderScreen() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [bookings, setBookings] = useState([])

  // modal
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedList, setSelectedList] = useState([])

  // ---- i18n ----
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      return v === 'ar' || v === 'en' ? v : 'ar'
    } catch {
      return 'ar'
    }
  }
  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback

  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])
  // ----------------

  const now = new Date()
  const initialYear = now.getFullYear()
  const initialMonth = now.getMonth()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const resp = await fetch(GET_BOOKING_SUMMARY_LIST, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          BookingVendorID: getCurrentLoggedUserID(),
          page: 1,
          limit: 500,
        }),
      })

      if (!resp.ok) {
        const t = await resp.text()
        throw new Error(`HTTP ${resp.status}: ${t}`)
      }

      const json = await resp.json()
      const d = json?.data || {}
      const list = Array.isArray(d?.BookingList) ? d.BookingList : []

      setBookings(list)
    } catch (e) {
      setError(e?.message || 'Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onDayClick = (ymd, list) => {
    setSelectedDate(ymd)
    setSelectedList(Array.isArray(list) ? list : [])
    setModalOpen(true)
  }

  const badgeColor = (status) => {
    const s = String(status || '').toUpperCase()
    if (s === 'BOOKED') return 'success'
    if (s === 'COMPLETED') return 'danger'
    return 'secondary'
  }

  return (
    <>
      <CCard className="mt-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div className="fw-bold">{tr('dashCalendar', 'Calendar')}</div>
          <CButton color="primary" variant="outline" size="sm" onClick={fetchData}>
            {tr('btnRefresh', 'Refresh')}
          </CButton>
        </CCardHeader>

        <CCardBody>
          {loading && (
            <div className="text-center my-4">
              <CSpinner />
            </div>
          )}

          {!loading && error && <CAlert color="danger">{error}</CAlert>}

          {!loading && !error && (
            <Calendar
              initialYear={initialYear}
              initialMonth={initialMonth}
              bookings={bookings}
              onDayClick={onDayClick}
            />
          )}
        </CCardBody>
      </CCard>

      {/* Modal */}
      <CModal visible={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <CModalHeader onClose={() => setModalOpen(false)}>
          <CModalTitle>
            {tr('calActivitiesOn', 'Activities on')} {selectedDate}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {(!selectedList || selectedList.length === 0) && (
            <div style={{ color: '#6b7280' }}>{tr('calNoData', 'No data found')}</div>
          )}

          {selectedList.map((b, idx) => (
            <div
              key={`${toStr(b?.BookingID)}-${idx}`}
              style={{
                border: '1px solid #eee',
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div style={{ fontWeight: 700 }}>
                  {tr('lblBookingID', 'BookingID')}: {toStr(b?.BookingID)}
                </div>
                <CBadge color={badgeColor(b?.BookingStatus || b?.BookingStatusName)}>
                  {toStr(b?.BookingStatusName || b?.BookingStatus)}
                </CBadge>
              </div>

              <div style={{ marginTop: 8, fontSize: 14 }}>
                <div><strong>{tr('lblActivity', 'Activity')}:</strong> {toStr(b?.actName)}</div>
                <div><strong>{tr('lblDate', 'Date')}:</strong> {toStr(b?.BookingActivityDate)}</div>
                <div><strong>{tr('lblTime', 'Time')}:</strong> {toStr(b?.BookingActivityTime)}</div>
                <div><strong>{tr('lblKid', 'Kid')}:</strong> {toStr(b?.KidsName)}</div>
                <div><strong>{tr('lblParent', 'Parent')}:</strong> {toStr(b?.RegUserFullName)}</div>
                <div><strong>{tr('lblMobile', 'Mobile')}:</strong> {toStr(b?.RegUserMobileNo)}</div>

                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: 'pointer' }}>{tr('lblFullJson', 'Full JSON')}</summary>
                  <pre style={{ marginTop: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(b, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ))}
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setModalOpen(false)}>
            {tr('btnClose', 'Close')}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}