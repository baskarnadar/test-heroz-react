// send.js
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import { cilFilter } from '@coreui/icons'

import { API_BASE_URL } from '../../config'
import {
  formatDate,
  DspToastMessage,
  getAuthHeaders,
  IsAdminLoginIsValid,
} from '../../utils/operation'

import '../../scss/PushTokenList.css' // ✅ external CSS

const SchoolList = () => {
  const [tokenRows, setTokenRows] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedTID, setSelectedTID] = useState(null)
  const [selectedOwnerName, setSelectedOwnerName] = useState('')

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [selectedIds, setSelectedIds] = useState([])

  // 🔔 send push modal
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendTitle, setSendTitle] = useState('')
  const [sendBody, setSendBody] = useState('')
  const [sending, setSending] = useState(false)

  // 🔽 sort config
  const [sortConfig, setSortConfig] = useState({
    key: 'OwnerName', // default sort by school name
    direction: 'asc',
  })

  const navigate = useNavigate()

  // ✅ admin login validity check
  useEffect(() => {
    IsAdminLoginIsValid()
  }, [])

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)

    for (let i = startPage; i <= endPage; i++) {
      range.push(i)
    }
    return range
  }

  // 🔽 helper: apply sorting
  const applySort = (rows, config = sortConfig) => {
    if (!config?.key) return rows

    const { key, direction } = config
    const sorted = [...rows].sort((a, b) => {
      let aVal
      let bVal

      switch (key) {
        case 'rowNumber':
          aVal = a._rowIndex ?? 0
          bVal = b._rowIndex ?? 0
          break
        case 'OwnerName':
          aVal = (a.OwnerName || a.OwnerType || '').toString().toLowerCase()
          bVal = (b.OwnerName || b.OwnerType || '').toString().toLowerCase()
          break
        case 'TokenID':
          aVal = (a.TokenID || '').toString().toLowerCase()
          bVal = (b.TokenID || '').toString().toLowerCase()
          break
        case 'ModifyDate':
          aVal = new Date(a.ModifyDate || a.CreatedDate || 0).getTime()
          bVal = new Date(b.ModifyDate || b.CreatedDate || 0).getTime()
          break
        default:
          aVal = (a[key] || '').toString().toLowerCase()
          bVal = (b[key] || '').toString().toLowerCase()
      }

      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
      return 0
    })

    return direction === 'asc' ? sorted : sorted.reverse()
  }

  const fetchTokenList = async (pageToLoad = 1, search = '') => {
    setLoading(true)
    setError('')

    try {
      console.log('📡 API URL:', `${API_BASE_URL}/admindata/pushmsg/list`)

      const payload = {
        page: pageToLoad,
        pageSize: pageSize,
        searchTerm: search.trim() || undefined,
      }

      console.log('📩 API Payload:', payload)

      const response = await fetch(`${API_BASE_URL}/admindata/pushmsg/list`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      console.log('📥 Raw Fetch Response:', response)

      const json = await response.json()
      console.log('📥 Token list response:', json)

      if (!response.ok || json.statusCode !== 200) {
        throw new Error(json.message || 'Failed to fetch token list')
      }

      const data = json.data || {}
      console.log('📤 API JSON Response:', data)

      const rows = (data.rows || []).map((row, idx) => ({
        ...row,
        _rowIndex: idx, // used for sort by row #
      }))

      const sortedRows = applySort(rows)
      setTokenRows(sortedRows)
      setCurrentPage(data.page || pageToLoad)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error('Error fetching token list:', err)
      setError(err.message || 'Error fetching token list')
    } finally {
      setLoading(false)
    }
  }

  // Initial load + reload when page / searchTerm changes
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchTokenList(currentPage, searchTerm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, currentPage, searchTerm])

  const handlePageClick = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return
    setCurrentPage(pageNumber)
  }

  // 🔴 open delete modal with info
  const handleDeleteClick = (row) => {
    setSelectedTID(row.TID)
    setSelectedOwnerName(row.OwnerName || row.OwnerType || '-')
    setShowDeleteModal(true)
  }

  const handleSearchApply = () => {
    setCurrentPage(1)
    setSearchTerm(searchInput)
  }

  const handleSelectRow = (tid) => {
    setSelectedIds((prev) =>
      prev.includes(tid) ? prev.filter((id) => id !== tid) : [...prev, tid],
    )
  }

  const handleSelectAllCurrentPage = (e) => {
    const checked = e.target.checked
    const currentPageIds = tokenRows.map((row) => row.TID)

    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])))
    } else {
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)))
    }
  }

  const isAllCurrentPageSelected =
    tokenRows.length > 0 && tokenRows.every((row) => selectedIds.includes(row.TID))

  // 🔽 handle column sort click
  const handleSort = (key) => {
    setSortConfig((prev) => {
      let direction = 'asc'
      if (prev.key === key && prev.direction === 'asc') {
        direction = 'desc'
      }
      const newConfig = { key, direction }
      setTokenRows((prevRows) => applySort(prevRows, newConfig))
      return newConfig
    })
  }

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <span className="ptl-sort-icon">↕</span>
    }
    return (
      <span className="ptl-sort-icon-active">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  // 🔔 open send push modal
  const handleOpenSendModal = () => {
    if (selectedIds.length === 0) {
      setToastMessage('Please select at least one school.')
      setToastType('fail')
      return
    }
    setSendTitle('')
    setSendBody('')
    setShowSendModal(true)
  }

  // 🔔 send push notifications using your structure
  const handleSendPush = async () => {
    const title = sendTitle.trim()
    const body = sendBody.trim()

    if (!title || !body) {
      setToastMessage('Title and message are required.')
      setToastType('fail')
      return
    }

    // Collect selected rows (for this page)
    const selectedRows = tokenRows.filter((row) => selectedIds.includes(row.TID))

    if (selectedRows.length === 0) {
      setToastMessage('No selected schools found on this page.')
      setToastType('fail')
      return
    }

    // Build token list
    const tokens = selectedRows
      .map((row) => row.TokenID)
      .filter((t) => !!t)

    if (tokens.length === 0) {
      setToastMessage('No valid tokens found for selected schools.')
      setToastType('fail')
      return
    }

    // ✅ Your required payload structure
    // 1 token  -> token: "abc123"
    // many     -> token: [ "abc111", "abc222" ]
    const payload =
      tokens.length === 1
        ? { token: tokens[0], title, body }
        : { token: tokens, title, body }

    setSending(true)

    try {
      console.log('🚀 Sending push payload:', payload)

      const resp = await fetch(`${API_BASE_URL}/admindata/pushmsg/sendmsg`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const json = await resp.json()
      console.log('📨 Push response:', json)

      if (!resp.ok || json.statusCode !== 200) {
        throw new Error(json.message || 'Failed to send push notification')
      }

      setToastMessage('Push notification sent successfully.')
      setToastType('success')
      setShowSendModal(false)
    } catch (err) {
      console.error('Push send error:', err)
      setToastMessage(err.message || 'Error sending push notification')
      setToastType('fail')
    } finally {
      setSending(false)
    }
  }

  // ✅ Confirm delete (single OR multiple)
  const confirmDelete = async () => {
    if (!selectedTID) return

    // If multiple selected and clicked row is part of them -> delete all selected
    let tidsToDelete = []
    if (selectedIds.length > 1 && selectedIds.includes(selectedTID)) {
      tidsToDelete = [...selectedIds]
    } else {
      tidsToDelete = [selectedTID]
    }

    const payload =
      tidsToDelete.length === 1
        ? { TID: tidsToDelete[0] }
        : { TID: tidsToDelete }

    try {
      console.log('🗑 Delete payload:', payload)

      const response = await fetch(
        `${API_BASE_URL}/admindata/pushmsg/deleteToken`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      )

      const data = await response.json()
      console.log('🗑 Delete response:', data)

      if (response.ok && data.statusCode === 200) {
        setToastMessage(data.message || 'Token(s) deleted successfully')
        setToastType('success')

        // Remove deleted IDs from selection
        setSelectedIds((prev) => prev.filter((id) => !tidsToDelete.includes(id)))

        // Reload current page
        fetchTokenList(currentPage, searchTerm)
      } else {
        setToastMessage(data.message || 'Failed to delete token(s)')
        setToastType('fail')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setToastMessage('Error deleting token(s)')
      setToastType('fail')
    } finally {
      setShowDeleteModal(false)
      setSelectedTID(null)
      setSelectedOwnerName('')
    }
  }

  const selectedRowsForModal = tokenRows.filter((row) => selectedIds.includes(row.TID))

  // For delete modal: detect if this is multi-delete
  const isMultiDelete =
    selectedIds.length > 1 && selectedIds.includes(selectedTID || '')

  return (
    <div className="ptl-wrapper">
      {/* Header + Search */}
      <div className="ptl-header-card">
        <div className="ptl-header-left">
          <h3 className="ptl-header-title">Push Notification Tokens</h3>
          <div className="ptl-header-subtitle">
            Manage and review FCM tokens for schools and parents.
          </div>
        </div>

        <div className="ptl-search-container">
          <input
            type="text"
            className="form-control"
            placeholder="Search by school name, owner, token..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="button"
            className="admin-buttonv1 ptl-filter-button"
            onClick={handleSearchApply}
          >
            <CIcon icon={cilFilter} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Grid card */}
      <div className="ptl-grid-card">
        {loading ? (
          <p className="ptl-message">Loading...</p>
        ) : error ? (
          <p className="ptl-message ptl-message-error">{error}</p>
        ) : (
          <>
            <table className="grid-table ptl-grid-table">
              <thead>
                <tr>
                  <th
                    className="ptl-th-clickable ptl-col-small"
                    onClick={() => handleSort('rowNumber')}
                  >
                    #
                    {renderSortIcon('rowNumber')}
                  </th>
                  <th className="txt-center ptl-col-small">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={handleSelectAllCurrentPage}
                    />
                  </th>
                  <th
                    className="ptl-th-clickable"
                    onClick={() => handleSort('OwnerName')}
                  >
                    School Name
                    {renderSortIcon('OwnerName')}
                  </th>
                  <th
                    className="ptl-th-clickable ptl-col-token"
                    onClick={() => handleSort('TokenID')}
                  >
                    Token ID
                    {renderSortIcon('TokenID')}
                  </th>
                  <th
                    className="ptl-th-clickable ptl-col-date"
                    onClick={() => handleSort('ModifyDate')}
                  >
                    Modified Date
                    {renderSortIcon('ModifyDate')}
                  </th>
                  <th className="txt-center ptl-col-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {tokenRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ptl-empty-row">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  tokenRows.map((row, index) => (
                    <tr
                      key={row.TID || index}
                      className={index % 2 === 0 ? 'grid-row-even' : 'grid-row-odd'}
                    >
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>

                      <td className="txt-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.TID)}
                          onChange={() => handleSelectRow(row.TID)}
                        />
                      </td>

                      <td>
                        <span className="ptl-owner-name">
                          {row.OwnerName || '-'}
                        </span>
                        {row.OwnerType && (
                          <span className="ptl-owner-type-chip">
                            {row.OwnerType}
                          </span>
                        )}
                      </td>

                      <td className="ptl-token-cell" title={row.TokenID}>
                        {row.TokenID}
                      </td>

                      <td>{formatDate(row.ModifyDate || row.CreatedDate || '')}</td>

                      <td align="center">
                        <div className="action-buttons">
                          {/* 🔴 Only delete icon */}
                          <button
                            onClick={() => handleDeleteClick(row)}
                            title="Delete"
                            className="graybox"
                          >
                            <i className="fa fa-trash-o" style={{ color: '#cf2037' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination on right side with circle buttons */}
            <div className="ptl-pagination">
              <button
                onClick={() => handlePageClick(currentPage - 1)}
                disabled={currentPage === 1}
                className="ptl-page-button"
              >
                {'<'}
              </button>
              {getPageRange().map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`ptl-page-button pagination-button ${
                    currentPage === pageNumber ? 'active' : ''
                  }`}
                  onClick={() => handlePageClick(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => handlePageClick(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ptl-page-button"
              >
                {'>'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bottom Send Push Notification bar */}
      <div className="ptl-bottom-bar">
        <button
          type="button"
          className="admin-buttonv1"
          onClick={handleOpenSendModal}
          disabled={selectedIds.length === 0}
        >
          Send Push Notification
        </button>
        <span className="ptl-selected-info">
          {selectedIds.length === 0
            ? 'Select at least one school to send notification.'
            : `${selectedIds.length} selected`}
        </span>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Delete Token</h4>

            {isMultiDelete ? (
              <>
                <p>Are you sure you want to remove these tokens?</p>
                <p>
                  <strong>{selectedIds.length}</strong> token(s) selected.
                </p>
              </>
            ) : (
              <>
                <p>Are you sure you want to remove this token?</p>
                <p>
                  <strong>Owner Name:</strong> {selectedOwnerName || '-'}
                </p>
              </>
            )}

            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>
                Confirm
              </button>
              <button
                className="admin-buttonv1"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedTID(null)
                  setSelectedOwnerName('')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Push Notification Modal (75% width) */}
      {showSendModal && (
        <div className="modal-overlay">
          <div className="modal-content_75">
            <div className="ptl-send-modal-header">
              <h4>Send Push Notification</h4>
              <button
                type="button"
                className="ptl-close-button"
                onClick={() => setShowSendModal(false)}
                disabled={sending}
              >
                ×
              </button>
            </div>

            <div className="ptl-send-modal-body">
              <div className="ptl-selected-list">
                <h5>Selected Schools ({selectedRowsForModal.length})</h5>
                {selectedRowsForModal.length === 0 ? (
                  <div className="ptl-selected-empty">
                    No selected schools found on this page.
                  </div>
                ) : (
                  <ul>
                    {selectedRowsForModal.map((row) => (
                      <li key={row.TID}>
                        <span className="ptl-owner-name">{row.OwnerName || '-'}</span>
                        {row.OwnerType && (
                          <span className="ptl-owner-type-chip">{row.OwnerType}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="ptl-send-form">
                <div className="form-group">
                  <label>
                    Title (max 75 characters)
                    <span className="ptl-char-counter">
                      {sendTitle.length}/75
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength={75}
                    value={sendTitle}
                    onChange={(e) => setSendTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>
                    Message (max 150 characters)
                    <span className="ptl-char-counter">
                      {sendBody.length}/150
                    </span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    maxLength={150}
                    value={sendBody}
                    onChange={(e) => setSendBody(e.target.value)}
                  />
                </div>

                <div className="ptl-send-actions">
                  <button
                    type="button"
                    className="admin-buttonv1"
                    onClick={handleSendPush}
                    disabled={sending || selectedRowsForModal.length === 0}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                  <button
                    type="button"
                    className="admin-buttonv1 ptl-cancel-button"
                    onClick={() => setShowSendModal(false)}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default SchoolList
