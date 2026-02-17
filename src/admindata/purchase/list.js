// list.js  (FULL FILE)
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import '../../scss/toast.css'
import { checkLogin } from '../../utils/auth'
import {
  DspToastMessage,
  formatDate,
  getAuthHeaders,
  IsAdminLoginIsValid,
} from '../../utils/operation'

const PurchaseList = () => {
  const navigate = useNavigate()

  // =========================
  // Data + UI state
  // =========================
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // Search + Date range
  const [searchText, setSearchText] = useState('')
  const [dateFrom, setDateFrom] = useState('') // yyyy-mm-dd
  const [dateTo, setDateTo] = useState('') // yyyy-mm-dd

  // Sorting
  const [sortKey, setSortKey] = useState('CreatedDate')
  const [sortDir, setSortDir] = useState('desc') // asc | desc

  // Pagination
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500, 'ALL']
  const [pageSize, setPageSize] = useState(10)
  const [pageNo, setPageNo] = useState(1)

  // =========================
  // Admin login validation
  // =========================
  useEffect(() => {
    IsAdminLoginIsValid?.()
  }, [])

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

  useEffect(() => {
    let timer
    if (toastMessage) {
      timer = setTimeout(() => setToastMessage(''), 2000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [toastMessage])

  // =========================
  // Fetch
  // =========================
  const fetchPurchases = async () => {
    setLoading(true)
    setError('')
    try {
      const API = `${API_BASE_URL}/membership/purchase/getMemPurchaseList`
      const resp = await fetch(API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}), // ✅ admin: no prtuserid
      })

      const raw = await resp.text()
      let json = null
      try {
        json = JSON.parse(raw)
      } catch {}

      if (!resp.ok) {
        throw new Error(json?.message || `Request failed (${resp.status})`)
      }

      const list = Array.isArray(json?.data) ? json.data : []
      setRows(list)
    } catch (e) {
      setError(e?.message || 'Error fetching purchase list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // =========================
  // Helpers
  // =========================
  const norm = (v) => (v ?? '').toString().toLowerCase().trim()

  const toDateOnlyISO = (d) => {
    // returns yyyy-mm-dd
    if (!d) return ''
    const x = new Date(d)
    if (Number.isNaN(x.getTime())) return ''
    const yyyy = x.getFullYear()
    const mm = String(x.getMonth() + 1).padStart(2, '0')
    const dd = String(x.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const inDateRange = (createdDate) => {
    if (!dateFrom && !dateTo) return true
    const cd = new Date(createdDate)
    if (Number.isNaN(cd.getTime())) return false

    // compare by date only (ignore time)
    const cdStr = toDateOnlyISO(cd)

    if (dateFrom && cdStr < dateFrom) return false
    if (dateTo && cdStr > dateTo) return false
    return true
  }

  const safeNum = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  // =========================
  // Clean rows for grid
  // =========================
  const cleanRows = useMemo(() => {
    return rows.map((r) => {
      const name = r?.RegInfo?.RegUserFullName || '-'
      const mobile = r?.RegInfo?.RegUserMobileNo || '-'
      const productName = r?.ProductInfo?.ProductName || '-'
      const purchaseDate = r?.CreatedDate || null
      const totalStarAmount = safeNum(r?.TotalStarAmount)
      const totalStar = safeNum(r?.TotalStar)
      const payRefNo = (r?.PayRefNo ?? '').toString().trim() || '-'
      const parentsId = (r?.ParentsID ?? '').toString().trim()
      const starId = (r?.StarID ?? '').toString().trim()

      return {
        _raw: r, // ✅ FULL record to pass to info page
        StarID: starId,
        ParentsID: parentsId,
        RegUserFullName: name,
        RegUserMobileNo: mobile,
        ProductName: productName,
        CreatedDate: purchaseDate,
        TotalStarAmount: totalStarAmount,
        TotalStar: totalStar,
        PayRefNo: payRefNo,
      }
    })
  }, [rows])

  // =========================
  // Search (All fields) + Date between
  // =========================
  const filtered = useMemo(() => {
    const s = norm(searchText)

    return cleanRows.filter((r) => {
      if (!inDateRange(r.CreatedDate)) return false
      if (!s) return true

      const hay = [
        r.RegUserFullName,
        r.RegUserMobileNo,
        r.ProductName,
        r.PayRefNo,
        r.ParentsID,
        r.StarID,
        String(r.TotalStarAmount),
        String(r.TotalStar),
        toDateOnlyISO(r.CreatedDate),
      ]
        .map(norm)
        .join(' | ')

      return hay.includes(s)
    })
  }, [cleanRows, searchText, dateFrom, dateTo])

  // =========================
  // Top totals (based on filtered)
  // =========================
  const topTotals = useMemo(() => {
    let totalStar = 0
    let totalAmount = 0
    for (const r of filtered) {
      totalStar += safeNum(r.TotalStar)
      totalAmount += safeNum(r.TotalStarAmount)
    }
    return { totalStar, totalAmount }
  }, [filtered])

  // =========================
  // Sorting
  // =========================
  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dirMul = sortDir === 'asc' ? 1 : -1

    const getVal = (r) => {
      switch (sortKey) {
        case 'RegUserFullName':
          return (r.RegUserFullName || '').toString()
        case 'RegUserMobileNo':
          return (r.RegUserMobileNo || '').toString()
        case 'ProductName':
          return (r.ProductName || '').toString()
        case 'CreatedDate':
          return new Date(r.CreatedDate || 0).getTime() || 0
        case 'TotalStarAmount':
          return safeNum(r.TotalStarAmount)
        case 'TotalStar':
          return safeNum(r.TotalStar)
        case 'PayRefNo':
          return (r.PayRefNo || '').toString()
        default:
          return new Date(r.CreatedDate || 0).getTime() || 0
      }
    }

    arr.sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)

      if (typeof va === 'number' && typeof vb === 'number') {
        if (va === vb) return 0
        return va > vb ? dirMul : -dirMul
      }

      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      if (sa === sb) return 0
      return sa > sb ? dirMul : -dirMul
    })

    return arr
  }, [filtered, sortKey, sortDir])

  // =========================
  // Pagination
  // =========================
  useEffect(() => {
    setPageNo(1)
  }, [searchText, dateFrom, dateTo, pageSize, sortKey, sortDir])

  const totalItems = sorted.length
  const effectivePageSize = pageSize === 'ALL' ? totalItems || 1 : Number(pageSize) || 10
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize))

  const pageRows = useMemo(() => {
    if (pageSize === 'ALL') return sorted
    const start = (pageNo - 1) * effectivePageSize
    const end = start + effectivePageSize
    return sorted.slice(start, end)
  }, [sorted, pageNo, pageSize, effectivePageSize])

  const clampPageNo = (n) => {
    const x = Math.min(Math.max(1, n), totalPages)
    setPageNo(x)
  }

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((pageNo - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }

  // =========================
  // ✅ CLICK row -> InvoiceInfo
  // =========================
  const goPurchaseInfo = (clickedRow) => {
    if (!clickedRow?._raw) return
    const ParentsID = (clickedRow?.ParentsID || '').toString().trim()
    const StarID = (clickedRow?.StarID || '').toString().trim()

    const qs = new URLSearchParams()
    if (ParentsID) qs.set('ParentsID', ParentsID)
    if (StarID) qs.set('StarID', StarID)

    navigate(`/admindata/purchase/info?${qs.toString()}`, {
      state: {
        invoice: clickedRow._raw, // ✅ full object
      },
    })
  }

  // =========================
  // UI helpers
  // =========================
  const sortToggle = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortHeader = ({ label, k, style }) => (
    <th
      onClick={() => sortToggle(k)}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
      title="Click to sort"
    >
      {label}{' '}
      {sortKey === k ? (
        <span style={{ fontSize: 12 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
      ) : (
        <span style={{ fontSize: 12, opacity: 0.35 }}>⇅</span>
      )}
    </th>
  )

  // ✅ Simple eye icon (no extra libs)
  const EyeIcon = ({ size = 18 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 12C4.5 7 8 4.5 12 4.5C16 4.5 19.5 7 22 12C19.5 17 16 19.5 12 19.5C8 19.5 4.5 17 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )

  return (
    <div>
      {/* TOP SUMMARY */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e5e5',
            borderRadius: 12,
            background: '#fff',
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 12, color: '#666' }}>Total Stars</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{topTotals.totalStar}</div>
        </div>

        <div
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e5e5',
            borderRadius: 12,
            background: '#fff',
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 12, color: '#666' }}>Total Amount</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{topTotals.totalAmount}</div>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button
            className="admin-buttonv1"
            onClick={fetchPurchases}
            disabled={loading}
            style={{
              backgroundColor: '#2c4696',
              borderColor: '#2c4696',
              color: '#fff',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
          gap: 10,
          marginBottom: 10,
          alignItems: 'end',
        }}
      >
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Search (All)</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search name, mobile, product, pay ref, stars..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Purchase Date From</label>
          <input
            type="date"
            className="form-control"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Purchase Date To</label>
          <input
            type="date"
            className="form-control"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Page Size</label>
          <select
            className="form-control"
            value={pageSize}
            onChange={(e) => {
              const v = e.target.value
              setPageSize(v === 'ALL' ? 'ALL' : Number(v))
            }}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={String(opt)} value={String(opt)}>
                {opt === 'ALL' ? 'All' : opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status row */}
      <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
        Showing {pageRows.length} of {sorted.length} record(s)
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          {/* GRID TABLE */}
          <table className="grid-table">
            <thead>
              <tr>
                <th style={{ width: 60, textAlign: 'right' }}>#</th>
                <SortHeader label="Name" k="RegUserFullName" />
                <SortHeader label="Mobile No" k="RegUserMobileNo" />
                <SortHeader label="Product" k="ProductName" />
                <SortHeader label="Total Amount" k="TotalStarAmount" style={{ textAlign: 'right' }} />
                <SortHeader label="Total Star" k="TotalStar" style={{ textAlign: 'right' }} />
                <SortHeader label="Pay Ref No" k="PayRefNo" />
                <SortHeader label="Purchase Date" k="CreatedDate" />
                {/* ✅ NEW last column: Eye icon */}
                <th style={{ width: 60, textAlign: 'center' }}> </th>
              </tr>
            </thead>

            <tbody>
              {pageRows.map((r, idx) => {
                const serial =
                  pageSize === 'ALL'
                    ? idx + 1
                    : (pageNo - 1) * effectivePageSize + idx + 1

                return (
                  <tr
                    key={`${r.StarID || ''}-${idx}`}
                    onClick={() => goPurchaseInfo(r)}
                    style={{
                      cursor: r.ParentsID ? 'pointer' : 'default',
                    }}
                    title="Click to open Invoice Info"
                  >
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{serial}</td>

                    <td style={{ fontWeight: 600 }}>{r.RegUserFullName}</td>
                    <td>{r.RegUserMobileNo}</td>
                    <td>{r.ProductName}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.TotalStarAmount}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.TotalStar}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.PayRefNo}</td>
                    <td>{formatDate(r.CreatedDate)}</td>

                    {/* ✅ Eye icon clickable (and does not double trigger row click) */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          goPurchaseInfo(r)
                        }}
                        title="View Invoice"
                        style={{
                          border: '1px solid #e5e5e5',
                          background: '#fff',
                          borderRadius: 10,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <EyeIcon size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}

              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 14, color: '#777' }}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          {pageSize !== 'ALL' && (
            <div className="pagination-container">
              <button
                className="pagination-button"
                onClick={() => clampPageNo(pageNo - 1)}
                disabled={pageNo === 1}
              >
                {'<<'}
              </button>

              {getPageRange().map((p) => (
                <button
                  key={p}
                  className={`pagination-button ${pageNo === p ? 'active' : ''}`}
                  onClick={() => clampPageNo(p)}
                  disabled={pageNo === p}
                >
                  {p}
                </button>
              ))}

              <button
                className="pagination-button"
                onClick={() => clampPageNo(pageNo + 1)}
                disabled={pageNo === totalPages}
              >
                {'>>'}
              </button>
            </div>
          )}
        </>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default PurchaseList
