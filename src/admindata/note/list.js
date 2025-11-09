import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter } from '@coreui/icons'

import { API_BASE_URL } from '../../config'
import { checkLogin } from '../../utils/auth'
import {
  getCurrentLoggedUserType,
  formatDate,
  dspstatus,
  DspToastMessage,
  dspstatusv1,
  getAuthHeaders,
  IsAdminLoginIsValid, // ✅ added
} from '../../utils/operation'

const SchoolList = () => {
  const [NoteInfo, setNoteInfo] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const NoteInfoPerPage = 10
  const navigate = useNavigate()
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [selectedNoteID, setSelectedNoteID] = useState(null)

  // ✅ admin login validity check (applied here)
  useEffect(() => {
    IsAdminLoginIsValid() // will redirect to BaseURL if token/usertype invalid
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

  const fetchNoteInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/note/getnoteList`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ noteTo: getCurrentLoggedUserType() }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notification')
      }

      const data = await response.json()
      console.log(data)
      setNoteInfo(data.data || [])
      setTotalPages(Math.ceil(data.totalCount / NoteInfoPerPage))
    } catch (err) {
      setError('Error fetching notification')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchNoteInfo()
  }, [currentPage, navigate])

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber)

  const handleDeleteClick = (NoteID) => {
    setSelectedNoteID(NoteID)
    setShowDeleteModal(true)
  }

  const handleSetLinkClick = (NoteID, ActivityID, noteKeyWord) => {
    if (noteKeyWord === 'ACTIVITY-WAITING-FOR-APPROVAL')
      navigate(`/admindata/setlink/setlink?NoteID=${NoteID}`)
  }

  const handleViewClick = (id) => {
    navigate(`/schoolmgm/schoolinfo/view?NoteID=${id}`)
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/note/delNote`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ NoteID: selectedNoteID }),
      })

      console.log('Raw response:', response)
      const data = await response.json()
      console.log('Response JSON:', data)

      if (response.ok) {
        setToastMessage(data.message || 'School successfully deleted')
        setToastType('success')
        fetchNoteInfo()
      } else {
        setToastMessage(data.message || 'Failed to delete School')
        setToastType('fail')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setToastMessage('Error deleting School')
      setToastType('fail')
    } finally {
      setShowDeleteModal(false)
      setSelectedNoteID(null)
    }
  }

  return (
    <div>
      <div
        className="page-title"
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
      >
        <h3 style={{ margin: 0, flexShrink: 0 }}>Notification</h3>

        <div style={{ position: 'relative', flexGrow: 3, maxWidth: '300px' }}></div>
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
                <th> Description</th>
                <th> Date</th>
                <th>Status</th>
                <th className="txt-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {NoteInfo.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '1rem' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                NoteInfo.map((notedata, index) => (
                  <tr key={notedata.NoteID || index}>
                    <td>{(currentPage - 1) * NoteInfoPerPage + index + 1}</td>

                    <td>
                      {notedata.actName} - {dspstatus(notedata.actStatus)}
                    </td>
                    <td>{formatDate(notedata.CreatedDate)}</td>
                    <td>{dspstatusv1(notedata.noteStatus)}</td>
                    <td align="center">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleDeleteClick(notedata.NoteID)}
                          title="Delete"
                          className="  graybox"
                        >
                          <i className="fa fa-trash-o" style={{ color: '#cf2037' }} />
                        </button>
                        <button
                          onClick={() =>
                            handleSetLinkClick(
                              notedata.NoteID,
                              notedata.ActivityID,
                              notedata.noteKeyWord,
                            )
                          }
                          title="View"
                          className="  graybox"
                        >
                          <i className="fa fa-eye" style={{ color: '#cf2037' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

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
            <p>Are you sure you want to delete this notification?</p>
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

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default SchoolList
