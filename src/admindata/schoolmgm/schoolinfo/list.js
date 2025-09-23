import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter } from '@coreui/icons'

import logo from '../../../assets/logo/default.png'
import { API_BASE_URL } from '../../../config'
import { getStatusBadgeColor, formatDate, getAuthHeaders, DspToastMessage } from '../../../utils/operation'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const SchoolList = () => {
  const [Schoolinfo, setSchoolinfo] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10) // ← client-side page size selector
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const navigate = useNavigate()

  // Toast state
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [toastKey, setToastKey] = useState(0) // forces re-mount so it always shows

  const [selectedSchoolID, setSelectedSchoolID] = useState(null)

  // Helper: always show toast (even same text) by bumping key
  const showToast = useCallback((type, message) => {
    setToastType(type)
    setToastMessage(message || '')
    setToastKey((k) => k + 1) // <- force re-render/remount
  }, [])

  const fetchSchoolinfo = useCallback(async () => {
    const token = localStorage.getItem('token')
    setLoading(true)

    try {
      if (!token) throw new Error('Missing auth token')

      const apiUrl = `${API_BASE_URL}/schoolinfo/school/getschoollist`

      console.log('📡 API URL:', apiUrl)
      // ⛔️ Do NOT send page or limit — we’ll paginate on the client
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}), // keep POST shape if backend expects POST
      })

      if (!response.ok) {
        console.error('❌ API Error:', response.status, response.statusText)
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized — please log in again.')
        }
        throw new Error('Failed to fetch school info')
      }

      const data = await response.json()
      console.log('✅ API Response:', data)

      const list = Array.isArray(data?.data) ? data.data : []
      setSchoolinfo(list)
      setError('')
      // Reset to page 1 when data set changes
      setCurrentPage(1)
    } catch (err) {
      console.error('⚠️ Fetch Error:', err)
      const msg = err instanceof Error ? err.message : 'Error fetching school info'
      setError(msg)
      showToast('fail', msg)
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchSchoolinfo()
  }, [navigate, fetchSchoolinfo])

  // Client-side search (by school name / city / id)
  const filtered = useMemo(() => {
    if (!searchTerm) return Schoolinfo
    const q = searchTerm.toLowerCase()
    return Schoolinfo.filter((s) => {
      return (
        (s.schName || '').toLowerCase().includes(q) ||
        (s.EnCityName || '').toLowerCase().includes(q) ||
        String(s.SchoolNo || '').toLowerCase().includes(q)
      )
    })
  }, [Schoolinfo, searchTerm])

  // Reset to page 1 if search term or page size changes (to avoid empty pages)
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, pageSize])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filtered.length)
  const pageRows = filtered.slice(startIndex, endIndex)

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }

  const handlePageClick = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return
    setCurrentPage(pageNumber)
  }

  const handleModifyClick = (id) => navigate(`/admindata/schoolmgm/schoolinfo/modify?SchoolID=${id}`)
  const handleDeleteClick = (SchoolID) => {
    setSelectedSchoolID(SchoolID)
    setShowDeleteModal(true)
  }
  const handleCahngePwdClick = (id) => navigate(`/admindata/schoolmgm/schoolinfo/changepwd?SchoolID=${id}`)

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/schoolinfo/school/delschool`, {
        method: 'POST',
        headers: getAuthHeaders(), // ← do not change this
        body: JSON.stringify({ SchoolID: selectedSchoolID }),
      })

      let data = null
      let rawText = null
      try {
        data = await response.json()
      } catch {
        try {
          rawText = await response.text()
        } catch {
          rawText = null
        }
      }

      console.log('Raw response:', response)
      console.log('Response JSON:', data || rawText)

      if (response.ok) {
        showToast('success', data?.message || 'School successfully deleted')
        await fetchSchoolinfo() // refresh
      } else {
        let msg =
          data?.message ||
          data?.error?.message ||
          rawText ||
          'Failed to delete School'

        if (data?.error?.IsDelete === 'false') {
          const reqTotal = data?.error?.requests?.total
          if (typeof reqTotal === 'number') {
            msg += ` (Event requests: ${reqTotal})`
          }
        }
        showToast('fail', msg)
      }
    } catch (err) {
      console.error('Delete error:', err)
      showToast('fail', err?.message || 'Error deleting School')
    } finally {
      setShowDeleteModal(false)
      setSelectedSchoolID(null)
    }
  }

  return (
    <div>
      <div
        className="page-title"
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}
      >
        <h3 style={{ margin: 0, flexShrink: 0 }}>School Management</h3>

        {/* Search */}
        <div style={{ position: 'relative', flexGrow: 3, minWidth: 240, maxWidth: 320 }}>
          <input
            type="text"
            placeholder="Search by name, city, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 30px 6px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem',
            }}
          />
          <CIcon
            icon={cilFilter}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#666',
              width: '18px',
              height: '18px',
            }}
          />
        </div>

        {/* Page size selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#555' }}>Rows per page:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button onClick={() => navigate('/admindata/schoolmgm/schoolinfo/new')} className="admin-buttonv1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            width="16"
            height="16"
            style={{ marginRight: '8px', verticalAlign: 'middle' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        {loading ? 'Loading…' : error ? null : (
          <>
            Showing <strong>{filtered.length === 0 ? 0 : startIndex + 1}</strong>–
            <strong>{endIndex}</strong> of <strong>{filtered.length}</strong> records
          </>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>#</th>
                <th> </th>
                <th>School ID</th>
                <th>Name</th>
                <th>Mobile No</th>
                <th>City</th>
                <th>No Of Students</th>
                <th>No Of Trips</th>
                <th>Join Date</th>
                <th>Status</th>
                <th className="txt-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '1rem' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                pageRows.map((schooldata, idx) => (
                  <tr key={schooldata.SchoolID || `${startIndex + idx}-${schooldata.SchoolNo}`}>
                    <td>{startIndex + idx + 1}</td>
                    <td>
                      <div className="product-image-circle">
                        <img src={logo} alt="logo" />
                      </div>
                    </td>
                    <td>{schooldata.SchoolNo}</td>
                    <td>{schooldata.schName}</td>
                    <td>{schooldata.schMobileNo1}</td>
                    <td>{schooldata.EnCityName}</td>
                    <td>{schooldata.schTotalStudents}</td>
                    <td>{schooldata.schTotalNoOftrips}</td>
                    <td>{formatDate(schooldata.CreatedDate)}</td>
                    <td>
                      <CBadge color={getStatusBadgeColor(schooldata.userstatus)} shape="pill">
                        {schooldata.userstatus || 'N/A'}
                      </CBadge>
                    </td>
                    <td align="center">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleModifyClick(schooldata.SchoolID)}
                          title="Edit"
                          className="graybox"
                        >
                          <i className="fa fa-pencil" style={{ color: '#cf2037' }} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(schooldata.SchoolID)}
                          title="Delete"
                          className="graybox"
                        >
                          <i className="fa fa-trash-o" style={{ color: '#cf2037' }} />
                        </button>

                        <button
                          onClick={() => handleCahngePwdClick(schooldata.SchoolID)}
                          title="Change Password"
                          className="graybox"
                        >
                          <i className="fa fa-key" style={{ color: '#cf2037' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination-container">
            <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1}>
              {'<<'}
            </button>
            {getPageRange().map((pageNumber) => (
              <button
                key={pageNumber}
                className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                onClick={() => handlePageClick(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {'>>'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this School?</p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>
                Yes
              </button>
              <button className="admin-buttonv1" onClick={() => setShowDeleteModal(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force remount on every toast show via key */}
      <DspToastMessage key={toastKey} message={toastMessage} type={toastType} />
    </div>
  )
}

export default SchoolList
