// list.js  (Booking Management Grid List)
// ✅ ONE LINE FILTER BAR (Clean UI)
// ✅ Title Added
// ✅ Eye Icon Last Column
// ✅ Vendor Dropdown
// ✅ From / To Date
// ✅ Search by Mobile
// ✅ Professional Layout
// ✅ Grid first column: #
// ✅ Grid second column: Image

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import '../../scss/toast.css'
import { checkLogin } from '../../utils/auth'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../utils/operation'
import { FaEye } from 'react-icons/fa'

const BookingList = () => {
  const navigate = useNavigate()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [searchText, setSearchText] = useState('')
  const [mobileSearch, setMobileSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    IsAdminLoginIsValid?.()
  }, [])

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

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

  const cleanRows = useMemo(() => {
    return rows.map((r) => ({
      BookingID: safeText(r.BookingID),
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

  const vendorList = useMemo(() => {
    const vendors = cleanRows.map((r) => r.vdrName).filter(Boolean)
    return [...new Set(vendors)]
  }, [cleanRows])

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

  return (
    <div style={{ padding: 20 }}>
      {/* ================= TITLE ================= */}
      <h2 style={{ marginBottom: 20 }}>Booking Management</h2>

      {/* ================= ONE LINE FILTER BAR ================= */}
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
                {/* ✅ FIRST #, SECOND Image */}
                <th style={{ width: 60 }}>#</th>
                <th style={{ width: 80 }}>Image</th>

                <th>Booking ID</th>
                <th>Parent</th>
                <th>Mobile</th>
                <th>Kid</th>
                <th>Activity</th>
                <th>Stars</th>
                <th>Vendor</th>
                <th>Activity Date & Time</th>
                <th>Booking Date</th>
                <th style={{ width: 80 }}>View</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r, idx) => (
                <tr key={idx}>
                  {/* ✅ FIRST #, SECOND Image */}
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{idx + 1}</td>
                  <td>
                    <AvatarOnly url={r.RegUserImageNameUrl} title={r.RegUserFullName} />
                  </td>

                  <td>{r.BookingID}</td>
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
                      onClick={() => navigate(`/membership/booking/view/${r.BookingID}`)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      title="View"
                    >
                      <FaEye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default BookingList
