// list.js  (Booking Management Grid List)
// ✅ FIRST COLUMN: Big circle Parents Image
// ✅ Activity Date & Time: TWO LINES (Date on top, Time below)
// ✅ API: /membership/booking/getbookinglist

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import '../../scss/toast.css'
import { checkLogin } from '../../utils/auth'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../utils/operation'

const BookingList = () => {
  const navigate = useNavigate()

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [searchText, setSearchText] = useState('')
  const [sortKey, setSortKey] = useState('BookingDate')
  const [sortDir, setSortDir] = useState('desc')

  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500, 'ALL']
  const [pageSize, setPageSize] = useState(10)
  const [pageNo, setPageNo] = useState(1)

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
      try { json = JSON.parse(raw) } catch {}

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

  const norm = (v) => (v ?? '').toString().toLowerCase().trim()
  const safeNum = (v) => Number.isFinite(Number(v)) ? Number(v) : 0
  const safeText = (v, f = '-') => (v ?? '').toString().trim() || f

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

  const filtered = useMemo(() => {
    const s = norm(searchText)
    if (!s) return cleanRows
    return cleanRows.filter((r) =>
      Object.values(r).join(' ').toLowerCase().includes(s)
    )
  }, [cleanRows, searchText])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      if (va === vb) return 0
      return va > vb ? dir : -dir
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalItems = sorted.length
  const effectivePageSize = pageSize === 'ALL' ? totalItems || 1 : Number(pageSize)
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize))

  const pageRows = useMemo(() => {
    if (pageSize === 'ALL') return sorted
    const start = (pageNo - 1) * effectivePageSize
    return sorted.slice(start, start + effectivePageSize)
  }, [sorted, pageNo, pageSize, effectivePageSize])

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
      {url ? (
        <img src={url} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : null}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table className="grid-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>Image</th>
              <th>#</th>
              <th>Booking ID</th>
              <th>Parent</th>
              <th>Mobile</th>
              <th>Kid</th>
              <th>Activity</th>
              <th>Stars</th>
              <th>Vendor</th>
              <th>Activity Date & Time</th>
              <th>Booking Date</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, idx) => (
              <tr key={idx}>
                <td><AvatarOnly url={r.RegUserImageNameUrl} title={r.RegUserFullName} /></td>
                <td>{idx + 1}</td>
                <td>{r.BookingID}</td>
                <td>{r.RegUserFullName}</td>
                <td>{r.RegUserMobileNo}</td>
                <td>{r.KidsName}</td>
                <td>{r.actName}</td>
                <td style={{ fontWeight: 700 }}>{r.BookingStarPerKids.toFixed(2)}</td>
                <td>{r.vdrName}</td>

                {/* ✅ TWO LINES exactly as requested */}
                <td>
                  <div>{r.BookingActivityDate}</div>
                  <div>{r.BookingActivityTime}</div>
                </td>

                <td>{r.BookingDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default BookingList
