import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import { CIcon } from '@coreui/icons-react'
import { cilTrash, cilPencil } from '@coreui/icons'
import '../../../scss/toast.css'
import { checkLogin } from '../../../utils/auth'
import {
  DspToastMessage,
  formatDate,
  getCurrentLoggedUserID,
  dspstatus,
  getAuthHeaders,
  IsAdminLoginIsValid, // ✅ added here
} from '../../../utils/operation'
import logo from '../../../assets/logo/default.png'
import moneyv1 from '../../../assets/images/moneyv1.png'
import { ActionButtonsV1 } from '../../../utils/btn'

const ActivityList = () => {
  const [ActivityIDToDelete, setActivityIDelete] = useState(null)
  const [VendorIDToDelete, setVendorIDToDelete] = useState(null)
  const [Activity, setActivity] = useState([])

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  // Order editing state
  const [orderMap, setOrderMap] = useState({}) // { [ActivityID]: number | '' }
  const [originalOrderMap, setOriginalOrderMap] = useState({})
  const [savingOrder, setSavingOrder] = useState(false)

  // Page size control (defaults to 10)
  const [pageSize, setPageSize] = useState(10)

  // Filters
  const [searchText, setSearchText] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const navigate = useNavigate()
  const location = useLocation()

  // ======================================================
  // ✅ NEW: remember last selected activitytype locally
  // ======================================================
  const ACT_TYPE_STORAGE_KEY = 'heroz_admin_activitytype'

  const readSavedActivityType = () => {
    try {
      const v = (localStorage.getItem(ACT_TYPE_STORAGE_KEY) || '').toString().trim().toLowerCase()
      if (v === 'membership') return 'MEMBERSHIP'
      if (v === 'school') return 'SCHOOL'
      return null
    } catch {
      return null
    }
  }

  const readActivityTypeFromUrl = () => {
    try {
      const sp = new URLSearchParams(location.search || '')
      const v = (sp.get('activitytype') || '').toString().trim().toLowerCase()
      if (!v) return null
      if (v === 'membership') return 'MEMBERSHIP'
      if (v === 'school') return 'SCHOOL'
      // if you later add more types, you can map them here
      return null
    } catch {
      return null
    }
  }

  const saveActivityType = (type) => {
    try {
      const v = (type || '').toString().trim().toUpperCase()
      if (v === 'MEMBERSHIP') localStorage.setItem(ACT_TYPE_STORAGE_KEY, 'membership')
      else if (v === 'SCHOOL') localStorage.setItem(ACT_TYPE_STORAGE_KEY, 'school')
    } catch {}
  }

  // ✅ NEW: compute requestedActType:
  // 1) URL param wins
  // 2) otherwise localStorage
  // 3) default SCHOOL
  const requestedActType = useMemo(() => {
    const fromUrl = readActivityTypeFromUrl()
    if (fromUrl) return fromUrl

    const fromSaved = readSavedActivityType()
    if (fromSaved) return fromSaved

    return 'SCHOOL'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  // ✅ NEW: when URL has activitytype, save it (one time) for later returns
  useEffect(() => {
    const fromUrl = readActivityTypeFromUrl()
    if (fromUrl) saveActivityType(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  // ✅ NEW: row filter based on requestedActType
  const isRequestedType = (row) => {
    const t = (row?.actTypeID ?? '').toString().trim().toUpperCase()
    return t === requestedActType
  }

  // ✅ reset page when type changes
  useEffect(() => {
    setCurrentPage(1)
  }, [requestedActType])

  // ✅ admin login validation (runs once on mount)
  useEffect(() => {
    IsAdminLoginIsValid?.() // will redirect to BaseURL if token/usertype invalid
  }, [])

  // ---------- tiny logging helpers ----------
  const logApiRequest = (label, url, payload, headers) => {
    console.groupCollapsed(`🔎 ${label} — Request`)
    console.log('URL:', url)
    if (headers) {
      try {
        console.log('Headers:', headers)
      } catch {}
    }
    if (Array.isArray(payload)) {
      console.table(payload)
    } else {
      console.log('Payload:', payload)
    }
    console.groupEnd()
  }

  const logApiResponse = async (label, resp) => {
    const headers = Array.from(resp.headers?.entries?.() || [])
    const raw = await resp.text()
    let json = null
    try {
      json = JSON.parse(raw)
    } catch {}
    console.groupCollapsed(`📨 ${label} — Response`)
    console.log('Status:', resp.status, resp.statusText, 'OK:', resp.ok)
    console.log('URL:', resp.url)
    console.log('Headers:', headers)
    console.log('Raw:', raw)
    console.log('JSON:', json)
    console.groupEnd()
    return { raw, json }
  }
  // ------------------------------------------

  useEffect(() => {
    fetchActivity()
    checkLogin(navigate)

    let timer
    if (toastMessage) {
      timer = setTimeout(() => setToastMessage(''), 2000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
    // (no dependency on currentPage here anymore for fetching)
  }, [pageSize, navigate, toastMessage])

  const safeNumFromApi = (v) => {
    if (v === '' || v === null || v === undefined) return ''
    const n = Number(v)
    return Number.isFinite(n) ? n : ''
  }

  // Prefer actOrderID from API
  const pickOrderField = (row) =>
    row?.actOrderID ??
    row?.OrderID ??
    row?.orderId ??
    row?.orderID ??
    row?.DisplayOrder ??
    row?.displayOrder ??
    row?.SortOrder ??
    row?.sortOrder ??
    row?.OrderNo ??
    row?.orderNo ??
    ''

  const fetchActivity = async () => {
    setLoading(true)
    setError(null)
    try {
      const API = `${API_BASE_URL}/admindata/activityinfo/activity/activityList`
      const body = {} // ✅ clear pageNo & limit: fetch all, paginate on client
      logApiRequest('Activity List', API, body, getAuthHeaders())

      const resp = await fetch(API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
      const { json } = await logApiResponse('Activity List', resp)

      if (!resp.ok) {
        const message = json?.message || `Request failed with status ${resp.status}`
        throw new Error(message)
      }

      const list = Array.isArray(json?.data) ? json.data : []

      setActivity(list)

      // initial total pages from full list (will resync to filters below)
      setTotalPages(Math.max(1, Math.ceil(list.length / (pageSize || 1))))

      // Seed order maps from API
      const orig = {}
      const cur = {}
      for (const row of list) {
        const id = row?.ActivityID || row?.id || row?._id
        const ord = safeNumFromApi(pickOrderField(row))
        if (id) {
          orig[id] = ord
          cur[id] = ord
        }
      }
      setOriginalOrderMap(orig)
      setOrderMap(cur)
    } catch (error) {
      setError(error?.message || 'Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber)

  const handleViewClick = (ActivityID, VendorID) => {
    navigate(`/admindata/activityinfo/membership/modify?ActivityID=${ActivityID}&VendorID=${VendorID}`)
  }

  const handleBookedClick = (ActivityID, VendorID) => {
    navigate(`/admindata/activityinfo/trip/list?ActivityID=${ActivityID}&VendorID=${VendorID}`)
  }

  // =========================
  // Filters (client-side)
  // =========================
  const norm = (v) => (v ?? '').toString().toLowerCase().trim()

  // Unique lists from CURRENT JSON page
  const uniqueVendors = useMemo(() => {
    const set = new Set()
    Activity.forEach((r) => {
      if (!isRequestedType(r)) return
      const v = (r?.vdrName ?? '').toString().trim()
      if (v) set.add(v)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [Activity, requestedActType])

  const uniqueGenders = useMemo(() => {
    const set = new Set()
    Activity.forEach((r) => {
      if (!isRequestedType(r)) return
      const v = (r?.actGender ?? '').toString().trim()
      if (v) set.add(v)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [Activity, requestedActType])

  const uniqueStatuses = useMemo(() => {
    const set = new Set()
    Activity.forEach((r) => {
      if (!isRequestedType(r)) return
      const v = (r?.actStatus ?? '').toString().trim()
      if (v) set.add(v)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [Activity, requestedActType])

  const filteredActivity = useMemo(() => {
    const s = norm(searchText)
    return Activity.filter((row) => {
      // ✅ ALWAYS filter to requested type first
      if (!isRequestedType(row)) return false

      const matchText =
        !s ||
        norm(row?.actName).includes(s) ||
        norm(row?.vdrName).includes(s) ||
        norm(row?.EnCityName).includes(s) ||
        norm(row?.actAddress1).includes(s) ||
        norm(row?.actAddress2).includes(s)

      const matchVendor = !filterVendor || (row?.vdrName ?? '') === filterVendor
      const matchGender = !filterGender || (row?.actGender ?? '') === filterGender
      const matchStatus = !filterStatus || (row?.actStatus ?? '') === filterStatus

      return matchText && matchVendor && matchGender && matchStatus
    })
  }, [Activity, searchText, filterVendor, filterGender, filterStatus, requestedActType])

  // 🔁 Keep UX snappy: reset to page 1 when filters/pageSize change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, filterVendor, filterGender, filterStatus, pageSize])

  // ✅ Client-side total pages based on FILTERED rows
  useEffect(() => {
    const pages = Math.max(1, Math.ceil((filteredActivity.length || 0) / (pageSize || 1)))
    setTotalPages(pages)
    if (currentPage > pages) setCurrentPage(pages) // clamp if filters shrink pages
  }, [filteredActivity.length, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // Page range (uses state totalPages)
  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }
  const pageNumbers = getPageRange()

  // ✅ Slice rows for the current page (client-side pagination)
  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredActivity.slice(start, end)
  }, [filteredActivity, currentPage, pageSize])

  const handleDeleteClick = (ActivityID, VendorID) => {
    setActivityIDelete(ActivityID)
    setVendorIDToDelete(VendorID)
    setConfirmText('')
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      const API = `${API_BASE_URL}/admindata/activityinfo/activity/deleteActivity`
      const body = {
        ActivityID: ActivityIDToDelete,
        VendorID: VendorIDToDelete,
        DeletedByID: getCurrentLoggedUserID(),
      }
      logApiRequest('Delete Activity', API, body, getAuthHeaders())

      const resp = await fetch(API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
      const { json } = await logApiResponse('Delete Activity', resp)

      if (!resp.ok || json?.success === false) {
        let msg = json?.message || 'Failed to delete Activity!'
        if (json?.IsDelete === 'false') {
          const s = json?.activity?.normActStatus || json?.activity?.actStatus
          if (s) msg += ` (Current status: ${s})`
        }
        setShowDeleteModal(false)
        setToastType('fail')
        setToastMessage(msg)
        return
      }

      setToastType('success')
      setToastMessage(json?.message || 'Activity deleted successfully!')
      setShowDeleteModal(false)
      setConfirmText('')
      setActivityIDelete?.(null)
      setVendorIDToDelete?.(null)
      fetchActivity()
    } catch (e) {
      setToastType('fail')
      setToastMessage(e?.message || 'Error deleting Activity')
    }
  }

  const isConfirmMatch = confirmText.trim() === 'Delete Activity'

  // Order editing helpers
  const onOrderInputChange = (activityId, value) => {
    const v = value === '' ? '' : Number(value)
    setOrderMap((prev) => ({ ...prev, [activityId]: v }))
  }

  const changedItems = useMemo(() => {
    const diffs = []
    for (const row of Activity) {
      if (!isRequestedType(row)) continue
      const id = row?.ActivityID || row?.id || row?._id
      if (!id) continue
      const before = originalOrderMap[id]
      const after = orderMap[id]
      const beforeIsNum = typeof before === 'number' && Number.isFinite(before)
      const afterIsNum = typeof after === 'number' && Number.isFinite(after)
      if (afterIsNum && (!beforeIsNum || before !== after)) {
        diffs.push({ ActivityID: id, OrderID: after })
      }
    }
    return diffs
  }, [Activity, originalOrderMap, orderMap, requestedActType])

  const hasChanges = changedItems.length > 0

  const handleChangeOrder = async () => {
    if (!hasChanges || savingOrder) return
    setSavingOrder(true)
    const API = `${API_BASE_URL}/admindata/activityinfo/activity/changeorder`
    const payload = {
      items: changedItems.map(({ ActivityID, OrderID }) => ({
        ActivityID,
        OrderID,
      })),
    }

    logApiRequest('Change Order', API, payload.items, getAuthHeaders())

    try {
      const resp = await fetch(API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })
      const { json } = await logApiResponse('Change Order', resp)

      if (!resp.ok || (json && json.success === false)) {
        const msg =
          (json && (json.message || json.error)) ||
          `Order update failed (HTTP ${resp.status}).`
        setToastType('fail')
        setToastMessage(msg)
        return
      }

      const updated = json?.modifiedCount ?? payload.items.length
      setToastType('success')
      setToastMessage(`Order updated for ${updated} item(s).`)
      fetchActivity()
    } catch (e) {
      console.groupCollapsed('❗ Change Order — Error')
      console.error(e)
      console.groupEnd()
      setToastType('fail')
      setToastMessage(e?.message || 'Order update error')
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div>
      {/* Filters Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto',
          gap: 8,
          marginBottom: 12,
          alignItems: 'end',
        }}
      >
        <div>
          <label style={{ fontSize: 12, color: '#666' }}>Search</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search activity, vendor, location..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <VendorFilter value={filterVendor} onChange={setFilterVendor} options={uniqueVendors} />

        <SimpleSelect
          label="Gender"
          value={filterGender}
          onChange={setFilterGender}
          options={uniqueGenders}
          allLabel="All Genders"
        />

        <SimpleSelect
          label="Status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={uniqueStatuses}
          allLabel="All Statuses"
        />

        <div style={{ justifySelf: 'end', minWidth: 150 }}>
          <label style={{ fontSize: 12, color: '#666' }}>Records / page</label>
          <select
            className="form-control"
            value={pageSize}
            onChange={(e) => {
              const v = Number(e.target.value) || 10
              setPageSize(v)
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick stats for filtered results */}
      <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
        Showing {pageRows.length} of {filteredActivity.length} filtered record(s) • Total loaded:{' '}
        {Activity.length}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th style={{ width: 70, textAlign: 'right' }}>#</th>
                <th style={{ width: 90 }}>Order</th>
                {/*  <th>#</th>   */}
                <th>Image</th>
                <th>Activity Name</th>
                <th>Vendor Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Gender</th>
                <th>Price Per Student</th>
                <th>Date</th>
                <th>Status</th>
                <th>Booked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* ✅ Use pageRows (client-side pagination) */}
              {pageRows.map((row, index) => {
                const key = row?.ActivityID || row?.id || row?._id || index
                const activityId = row?.ActivityID || row?.id || row?._id
                const orderValue = orderMap[activityId] ?? ''
                const serial = (currentPage - 1) * pageSize + index + 1

                return (
                  <tr key={key}>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{serial}</td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={orderValue}
                        onChange={(e) => onOrderInputChange(activityId, e.target.value)}
                        style={{ width: 80 }}
                        min={1}
                        inputMode="numeric"
                        aria-label="Display order"
                      />
                    </td>

                    <td>
                      <div className="Activity-image-circle">
                        <img src={logo} alt="logo" style={{ width: '75px' }} />
                      </div>
                    </td>
                    <td>{row.actName}</td>
                    <td style={{ backgroundColor: 'rgba(158, 227, 158, 0.1)' }}>
                      {row.vdrName || '-'}
                    </td>
                    <td>{row.actTypeID}</td>
                    <td>
                      {row.EnCityName} {row.actAddress1} {row.actAddress2}
                    </td>
                    <td>{row.actGender}</td>
                    <td
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '250px',
                      }}
                    >
                      <img
                        src={moneyv1}
                        alt="logo"
                        style={{
                          width: '14px',
                          marginRight: '6px',
                          verticalAlign: 'middle',
                        }}
                      />
                      {row.priceList && row.priceList.length > 0
                        ? row.priceList.map((price, i) => (
                            <span key={i}>
                              {price.Price} from {price.StudentRangeFrom} to {price.StudentRangeTo}
                              {i < row.priceList.length - 1 && ', '}
                            </span>
                          ))
                        : 'No prices'}
                    </td>
                    <td>{formatDate(row.CreatedDate)}</td>
                    <td>{dspstatus(row.actStatus)}</td>
                    <td align="center">
                      <button
                        onClick={() => handleBookedClick(row.ActivityID, row.VendorID)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 12,
                          border: '1px solid #ccc',
                          background: '#ccc',
                          cursor: 'pointer',
                        }}
                      >
                        Booked [{row?.['TRIP-BOOKED']?.totalProposalCreatd ?? 0}]
                      </button>
                    </td>
                    <td align="center" style={{ width: '10%', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '6px',
                          justifyContent: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => handleViewClick(row.ActivityID, row.VendorID)}
                          title="View"
                          className="btn btnbtn-default graybox"
                          style={{
                            padding: '4px',
                            cursor: 'pointer',
                            backgroundColor: 'white',
                          }}
                          aria-label="View"
                        >
                          <i
                            style={{ color: '#cf2037', fontSize: '22px' }}
                            className="fa fa-pencil"
                          />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(row.ActivityID, row.VendorID)}
                          title="Delete"
                          className="btn btnbtn-default graybox"
                          style={{
                            padding: '4px',
                            cursor: 'pointer',
                            backgroundColor: 'white',
                          }}
                          aria-label="Delete"
                        >
                          <i
                            style={{ color: '#cf2037', fontSize: '22px' }}
                            className="fa fa-trash"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              className="admin-buttonv1"
              onClick={handleChangeOrder}
              disabled={!hasChanges || savingOrder}
              style={{
                opacity: hasChanges && !savingOrder ? 1 : 0.6,
                cursor: hasChanges && !savingOrder ? 'pointer' : 'not-allowed',
                backgroundColor: '#2c4696',
                color: '#fff',
                borderColor: '#2c4696',
              }}
              title={hasChanges ? 'Apply order changes' : 'No changes to save'}
            >
              {savingOrder ? 'Saving…' : 'Change Order'}
            </button>
          </div>

          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {'<<'}
            </button>
            {getPageRange().map((pageNumber) => (
              <button
                key={pageNumber}
                className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                onClick={() => handlePageClick(pageNumber)}
                disabled={currentPage === pageNumber}
              >
                {pageNumber}
              </button>
            ))}
            <button
              className="pagination-button"
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {'>>'}
            </button>
          </div>
        </>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4 style={{ color: '#cf2037', marginBottom: 8, fontWeight: 700 }}>
              Confirm Deletion
            </h4>
            <p style={{ color: '#cf2037', marginBottom: 12 }}>
              ⚠️ This will permanently delete <strong>all data related to this activity</strong>.
              <br />
              <strong>This action cannot be undone.</strong>
            </p>

            <div style={{ marginBottom: 10 }}>
              <label htmlFor="confirm-delete" style={{ display: 'block', marginBottom: 6 }}>
                To confirm, type <code>Delete Activity</code>
              </label>
              <input
                id="confirm-delete"
                type="text"
                className="form-control"
                placeholder="Delete Activity"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{ padding: '8px', width: '100%' }}
                autoFocus
              />
            </div>

            <div className="modal-buttons" style={{ display: 'flex', gap: 8 }}>
              <button
                className="admin-buttonv1"
                onClick={confirmDelete}
                disabled={!isConfirmMatch || !ActivityIDToDelete || !VendorIDToDelete}
                style={{
                  opacity: isConfirmMatch && ActivityIDToDelete && VendorIDToDelete ? 1 : 0.6,
                  cursor: isConfirmMatch && ActivityIDToDelete && VendorIDToDelete ? 'pointer' : 'not-allowed',
                  backgroundColor: isConfirmMatch ? '#cf2037' : '#bbb',
                  borderColor: '#cf2037',
                  color: '#fff',
                }}
              >
                Confirm Delete
              </button>
              <button
                className="admin-buttonv1"
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmText('')
                  setActivityIDelete(null)
                  setVendorIDToDelete(null)
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

// Small helpers to keep JSX tidy (no logic removed)
const SimpleSelect = ({ label, value, onChange, options, allLabel }) => (
  <div>
    <label style={{ fontSize: 12, color: '#666' }}>{label}</label>
    <select
      className="form-control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{allLabel}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
)

const VendorFilter = ({ value, onChange, options }) => (
  <div>
    <label style={{ fontSize: 12, color: '#666' }}>Vendor</label>
    <select
      className="form-control"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">All Vendors</option>
      {options.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  </div>
)

export default ActivityList
