// list.js  (Booking Management Grid List)
// ✅ ONE LINE FILTER BAR (Clean UI)
// ✅ Title Added
// ✅ Eye Icon Last Column
// ✅ QR Icon Column (Icon Only in grid, but opens modal to SHOW QR image)
// ✅ Vendor Dropdown
// ✅ From / To Date
// ✅ Search by Mobile
// ✅ Professional Layout
// ✅ Grid first column: #
// ✅ Grid second column: Image
// ✅ On QR click -> Call API -> open Modal -> show QR from json.data.qrDataUrl
// ✅ UPDATED: include BookingParentsID in QR API payload + modal details
// ✅ UPDATED: removed BookingRequestID column from grid view (still used internally)

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import '../../../scss/toast.css'
import { checkLogin } from '../../../utils/auth'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation'
import { FaEye, FaQrcode, FaTimes } from 'react-icons/fa'

const BookingList = () => {
  const navigate = useNavigate()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // ✅ Filters (KEEP)
  const [searchText, setSearchText] = useState('')
  const [mobileSearch, setMobileSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // ✅ QR Modal State
  const [qrOpen, setQrOpen] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')
  const [qrData, setQrData] = useState(null) // { BookingID, BookingRequestID, BookingParentsID, BookingActivityID, BookingVendorID, qrDataUrl }

  useEffect(() => {
    IsAdminLoginIsValid?.()
  }, [])

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

  // ✅ Toast auto-hide (KEEP)
  useEffect(() => {
    let timer
    if (toastMessage) timer = setTimeout(() => setToastMessage(''), 2000)
    return () => timer && clearTimeout(timer)
  }, [toastMessage])

  const fetchBookings = async () => {
    setLoading(true)
    setError('')
    try {
      const API = `${API_BASE_URL}/membership/booking/getbookinglist`

      const resp = await fetch(API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      })

      const raw = await resp.text()
      let json = null
      try {
        json = JSON.parse(raw)
      } catch {}

      if (!resp.ok) throw new Error(json?.message || `Request failed (${resp.status})`)
      setRows(Array.isArray(json?.data) ? json.data : [])
    } catch (e) {
      setError(e?.message || 'Error fetching booking list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const safeText = (v, f = '-') => (v ?? '').toString().trim() || f
  const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

  // ✅ KEEP mapping + ActivityID + VendorID + ParentsID + RequestID (RequestID is removed from grid but used for QR API)
  const cleanRows = useMemo(() => {
    return rows.map((r) => ({
      BookingID: safeText(r.BookingID),
      BookingRequestID: safeText(r.BookingRequestID), // keep internal
      BookingParentsID: safeText(r.BookingParentsID), // for QR API
      BookingActivityID: safeText(r.BookingActivityID), // for QR API
      BookingVendorID: safeText(r.BookingVendorID), // for QR API

      RegUserFullName: safeText(r.RegUserFullName),
      RegUserMobileNo: safeText(r.RegUserMobileNo),
      KidsName: safeText(r.KidsName),
      actName: safeText(r.actName),
      BookingStarPerKids: safeNum(r.BookingStarPerKids),
      vdrName: safeText(r.vdrName),
      RegUserImageNameUrl: safeText(r.RegUserImageNameUrl, ''),
      BookingActivityDate: safeText(r.BookingActivityDate),
      BookingActivityTime: safeText(r.BookingActivityTime),
      BookingDate: safeText(r.BookingDate),
    }))
  }, [rows])

  // ✅ Vendor list (KEEP)
  const vendorList = useMemo(() => {
    const vendors = cleanRows.map((r) => r.vdrName).filter(Boolean)
    return [...new Set(vendors)]
  }, [cleanRows])

  // ✅ Filter logic (KEEP)
  const filtered = useMemo(() => {
    return cleanRows.filter((r) => {
      if (
        searchText &&
        !Object.values(r)
          .join(' ')
          .toLowerCase()
          .includes(searchText.toLowerCase())
      )
        return false

      if (mobileSearch && !r.RegUserMobileNo.includes(mobileSearch)) return false
      if (vendorFilter && r.vdrName !== vendorFilter) return false

      if (fromDate && new Date(r.BookingDate) < new Date(fromDate)) return false
      if (toDate && new Date(r.BookingDate) > new Date(toDate)) return false

      return true
    })
  }, [cleanRows, searchText, mobileSearch, vendorFilter, fromDate, toDate])

  const AvatarOnly = ({ url, title }) => (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '1px solid #e5e5e5',
        background: '#f3f3f3',
        margin: '0 auto',
      }}
    >
      {url && (
        <img
          src={url}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )

  // =========================================================
  // ✅ QR Click Handler -> call API -> open modal -> show image
  // =========================================================
  const openQrModal = async (row) => {
    setQrError('')
    setQrData(null)
    setQrOpen(true)
    setQrLoading(true)

    try {
      const API = `${API_BASE_URL}/membership/booking/getbookingqr`

      const payload = {
        BookingID: row.BookingID,
        BookingRequestID: row.BookingRequestID,
        BookingParentsID: row.BookingParentsID, // ✅ added
        BookingActivityID: row.BookingActivityID,
        BookingVendorID: row.BookingVendorID,
      }

      const resp = await fetch(API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const raw = await resp.text()
      let json = null
      try {
        json = JSON.parse(raw)
      } catch {}

      if (!resp.ok) throw new Error(json?.message || `Request failed (${resp.status})`)

      const d = json?.data || null
      if (!d?.qrDataUrl) throw new Error('QR not returned from API.')

      setQrData(d)
    } catch (e) {
      setQrError(e?.message || 'Error generating QR')
    } finally {
      setQrLoading(false)
    }
  }

  const closeQrModal = () => {
    setQrOpen(false)
    setQrError('')
    setQrLoading(false)
    setQrData(null)
  }

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeQrModal()
    }
    if (qrOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [qrOpen])

  // =========================================================
  // ✅ Modal UI
  // =========================================================
  const QrModal = () => {
    if (!qrOpen) return null
    return (
      <div
        onClick={closeQrModal}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(560px, 96vw)',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 18px 60px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid #eee',
              background: '#fafafa',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16 }}>Booking QR</div>
            <button
              onClick={closeQrModal}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 6,
              }}
              title="Close"
              type="button"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 16 }}>
            {qrLoading ? (
              <div style={{ padding: 10 }}>Generating QR...</div>
            ) : qrError ? (
              <div style={{ color: 'red', padding: 10 }}>{qrError}</div>
            ) : qrData ? (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {/* QR Image */}
                <div
                  style={{
                    width: 260,
                    minWidth: 240,
                    border: '1px solid #eee',
                    borderRadius: 10,
                    padding: 12,
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={qrData.qrDataUrl}
                    alt="QR Code"
                    style={{ width: 220, height: 220, objectFit: 'contain' }}
                  />
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>Details</div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#888' }}>BookingID</div>
                    <div style={{ fontWeight: 700 }}>{qrData.BookingID}</div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#888' }}>BookingRequestID</div>
                    <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>
                      {qrData.BookingRequestID}
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#888' }}>BookingParentsID</div>
                    <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>
                      {qrData.BookingParentsID}
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#888' }}>BookingActivityID</div>
                    <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>
                      {qrData.BookingActivityID}
                    </div>
                  </div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#888' }}>BookingVendorID</div>
                    <div style={{ fontWeight: 700, wordBreak: 'break-all' }}>
                      {qrData.BookingVendorID}
                    </div>
                  </div>

                  {/* Optional actions */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        const txt = qrData.BookingRequestID || ''
                        if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(txt)
                      }}
                      type="button"
                    >
                      Copy RequestID
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => window.open(qrData.qrDataUrl, '_blank')}
                      type="button"
                    >
                      Open QR Image
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 10 }}>No data.</div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: 12,
              borderTop: '1px solid #eee',
              display: 'flex',
              justifyContent: 'flex-end',
              background: '#fafafa',
            }}
          >
            <button className="btn btn-sm btn-secondary" onClick={closeQrModal} type="button">
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      {/* ================= TITLE ================= */}
      <h2 style={{ marginBottom: 20 }}>Booking Management</h2>

      {/* ================= ONE LINE FILTER BAR (KEEP) ================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          className="form-control"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 180 }}
        />

        <input
          type="text"
          className="form-control"
          placeholder="Mobile No"
          value={mobileSearch}
          onChange={(e) => setMobileSearch(e.target.value)}
          style={{ width: 150 }}
        />

        <select
          className="form-control"
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          style={{ width: 170 }}
        >
          <option value="">All Vendors</option>
          {vendorList.map((v, i) => (
            <option key={i} value={v}>
              {v}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="form-control"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ width: 160 }}
        />

        <input
          type="date"
          className="form-control"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ width: 160 }}
        />
      </div>

      {/* ================= TABLE ================= */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="grid-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th style={{ width: 80 }}>Image</th>

                <th>Booking ID</th>
                {/* ✅ REMOVED BookingRequestID FROM GRID VIEW */}

                <th>Parent</th>
                <th>Mobile</th>
                <th>Kid</th>
                <th>Activity</th>
                <th>Stars</th>
                <th>Vendor</th>
                <th>Activity Date & Time</th>
                <th>Booking Date</th>

                <th style={{ width: 60 }}>QR</th>
              
              </tr>
            </thead>

            <tbody>
              {filtered.map((r, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                  <td>
                    <AvatarOnly url={r.RegUserImageNameUrl} title={r.RegUserFullName} />
                  </td>

                  <td>{r.BookingID}</td>
                  {/* ✅ REMOVED BookingRequestID CELL */}

                  <td>{r.RegUserFullName}</td>
                  <td>{r.RegUserMobileNo}</td>
                  <td>{r.KidsName}</td>
                  <td>{r.actName}</td>
                  <td style={{ fontWeight: 700 }}>{r.BookingStarPerKids.toFixed(2)}</td>
                  <td>{r.vdrName}</td>

                  <td>
                    <div>{r.BookingActivityDate}</div>
                    <div>{r.BookingActivityTime}</div>
                  </td>

                  <td>{r.BookingDate}</td>

                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => openQrModal(r)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      title="Show QR"
                      type="button"
                    >
                      <FaQrcode size={18} />
                    </button>
                  </td>

                 
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />

      <QrModal />
    </div>
  )
}

export default BookingList
