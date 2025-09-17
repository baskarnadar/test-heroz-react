import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  getAuthHeaders
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
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const ActivityPerPage = 10
  const navigate = useNavigate()

  useEffect(() => {
    fetchActivity()
    checkLogin(navigate)
    let timer
    if (toastMessage) {
      timer = setTimeout(() => {
        setToastMessage('')
      }, 2000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [currentPage, navigate, toastMessage])

  const fetchActivity = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/activity/activityList`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            page: currentPage,
            limit: ActivityPerPage,
          }),
        }
      )

      if (!response.ok) {
        let message = `Request failed with status ${response.status}`
        try {
          const errJson = await response.json()
          if (errJson?.message) message = errJson.message
        } catch {
          // Not JSON
        }
        throw new Error(message)
      }

      const data = await response.json()
      const list = Array.isArray(data?.data) ? data.data : []
      const totalCount = Number.isFinite(data?.totalCount) ? data.totalCount : list.length

      setActivity(list)
      setTotalPages(Math.max(1, Math.ceil(totalCount / (ActivityPerPage || 1))))
    } catch (error) {
      setError(error?.message || 'Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber)

  const handleViewClick = (ActivityID, VendorID) => {
    navigate(`/admindata/activityinfo/activity/modify?ActivityID=${ActivityID}&VendorID=${VendorID}`)
  }

  const handleBookedClick = (ActivityID, VendorID) => {
    navigate(`/admindata/activityinfo/trip/list?ActivityID=${ActivityID}&VendorID=${VendorID}`)
  }

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }

  const pageNumbers = getPageRange()

  const handleDeleteClick = (ActivityID, VendorID) => {
    setActivityIDelete(ActivityID)
    setVendorIDToDelete(VendorID)
    setConfirmText('')
    setShowDeleteModal(true)
  }

 const confirmDelete = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/admindata/activityinfo/activity/deleteActivity`,
      {
        method: "POST",
        headers:getAuthHeaders(),
        body: JSON.stringify({
          ActivityID: ActivityIDToDelete,
          VendorID: VendorIDToDelete,
          DeletedByID: getCurrentLoggedUserID(),
        }),
      }
    );

    // Try to parse JSON (even on non-2xx)
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || data?.success === false) {
      // Build a helpful error message
      let msg = data?.message || "Failed to delete Activity!";
      if (data?.IsDelete === "false") {
        const s = data?.activity?.normActStatus || data?.activity?.actStatus;
        if (s) msg += ` (Current status: ${s})`;
      }
 setShowDeleteModal(false)
      setToastType("fail");
      setToastMessage(msg);
      return; // keep modal open so user can read message / decide
    }

    // Success
    setToastType("success");
    setToastMessage(data?.message || "Activity deleted successfully!");
    setShowDeleteModal(false);
    setConfirmText("");
    setActivityIDelete?.(null);   // keep your existing state names
    setVendorIDToDelete?.(null);
    fetchActivity();
  } catch (e) {
    setToastType("fail");
    setToastMessage(e?.message || "Error deleting Activity");
  }
};

  const isConfirmMatch = confirmText.trim() === 'Delete Activity'

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th>#</th>
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
              {Activity.map((Activity, index) => (
                <tr key={Activity.PrdCodeNo}>
                  <td>
                    <strong>{(currentPage - 1) * ActivityPerPage + index + 1}</strong>
                  </td>
                  <td>
                    <div className="Activity-image-circle">
                      <img src={logo} alt="logo" style={{ width: '75px' }} />
                    </div>
                  </td>
                  <td>{Activity.actName}</td>
                  <td style={{ backgroundColor: 'rgba(158, 227, 158, 0.1)' }}>
                    {Activity.vdrName || '-'}
                  </td>
                  <td>{Activity.actTypeID}</td>
                  <td>
                    {Activity.EnCityName} {Activity.actAddress1} {Activity.actAddress2}
                  </td>
                  <td>{Activity.actGender}</td>
                  <td style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                    <img
                      src={moneyv1}
                      alt="logo"
                      style={{ width: '14px', marginRight: '6px', verticalAlign: 'middle' }}
                    />
                    {Activity.priceList && Activity.priceList.length > 0
                      ? Activity.priceList.map((price, index) => (
                          <span key={index}>
                            {price.Price} from {price.StudentRangeFrom} to {price.StudentRangeTo}
                            {index < Activity.priceList.length - 1 && ', '}
                          </span>
                        ))
                      : 'No prices'}
                  </td>
                  <td>{formatDate(Activity.CreatedDate)}</td>
                  <td>{dspstatus(Activity.actStatus)}</td>
                  <td align="center">
                    <button
                      onClick={() => handleBookedClick(Activity.ActivityID, Activity.VendorID)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: '1px solid #ccc',
                        background: '#ccc',
                        cursor: 'pointer',
                      }}
                    >
                      Booked [{Activity?.['TRIP-BOOKED']?.totalProposalCreatd ?? 0}]
                    </button>
                  </td>
                  <td align="center" style={{ width: '10%', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleViewClick(Activity.ActivityID, Activity.VendorID)}
                        title="View"
                        className="btn btnbtn-default graybox"
                        style={{
                          padding: '4px',
                          cursor: 'pointer',
                          border: '2px solid #cf2037',
                          borderRadius: '6px',
                          backgroundColor: 'white'
                        }}
                        aria-label="View"
                      >
                        <i style={{ color: '#cf2037', fontSize: '22px' }} className="fa fa-pencil" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(Activity.ActivityID, Activity.VendorID)}
                        title="Delete"
                        className="btn btnbtn-default graybox"
                        style={{
                          padding: '4px',
                          cursor: 'pointer',
                          border: '2px solid #cf2037',
                          borderRadius: '6px',
                          backgroundColor: 'white'
                        }}
                        aria-label="Delete"
                      >
                        <i style={{ color: '#cf2037', fontSize: '22px' }} className="fa fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {'<<'}
            </button>
            {pageNumbers.map((pageNumber) => (
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
                onClick={confirmDelete}  // ✅ uses stored ActivityIDToDelete & VendorIDToDelete
                disabled={!isConfirmMatch || !ActivityIDToDelete || !VendorIDToDelete}
                style={{
                  opacity: isConfirmMatch && ActivityIDToDelete && VendorIDToDelete ? 1 : 0.6,
                  cursor: isConfirmMatch && ActivityIDToDelete && VendorIDToDelete ? 'pointer' : 'not-allowed',
                  backgroundColor: isConfirmMatch ? '#cf2037' : '#bbb',
                  borderColor: '#cf2037',
                  color: '#fff'
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

export default ActivityList
