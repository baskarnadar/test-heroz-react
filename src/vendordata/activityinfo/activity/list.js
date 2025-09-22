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
  getAuthHeaders,
} from '../../../utils/operation'
import logo from '../../../assets/logo/default.png'
import moneyv1 from '../../../assets/images/moneyv1.png'
import { ActionButtonsV1 } from '../../../utils/btn'

// ⭐ NEW: Modal component for image uploads
import ImageUploadModal from './imageupload'

const ActivityList = () => {
  const [ActivityIDToDelete, setActivityIDelete] = useState(null)
  const [Activity, setActivity] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [selectedActivity, setSelectedActivity] = useState(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // ⭐ NEW: state for gallery modal
  const [showGalleryModal, setShowGalleryModal] = useState(false)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, navigate, toastMessage])

  const fetchActivity = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/vendordata/activityinfo/activity/activityList`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            page: currentPage,
            limit: ActivityPerPage,
            VendorID: getCurrentLoggedUserID(),
          }),
        },
      )
      console.log('📡 API Status:', response.status)

      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      console.log('📦 API Response:', data)
      setActivity(data.data || [])
      setTotalPages(Math.ceil((data.totalCount || 0) / ActivityPerPage))
    } catch (error) {
      console.error(error)
      setError('Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber)

  const handleModifyClick = (ActivityID) => {
    navigate(`/vendordata/activityinfo/activity/modify?ActivityID=${ActivityID}`)
  }
  const handleViewClick = (ActivityID) => {
    navigate(`/vendordata/activityinfo/activity/view?ActivityID=${ActivityID}`)
  }

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }

  const pageNumbers = getPageRange()

  // Delete
  const handleDeleteClick = (row) => {
    setActivityIDelete(row.ActivityID)
    setSelectedActivity(row) // 👈 store full row so we can show actName in the modal
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    console.log(ActivityIDToDelete)
    console.log(getCurrentLoggedUserID())
    try {
      const response = await fetch(
        `${API_BASE_URL}/vendordata/activityinfo/activity/deleteActivity`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ActivityID: ActivityIDToDelete,
            VendorID: getCurrentLoggedUserID(),
          }),
        },
      )

      if (response.ok) {
        setToastType('success')
        setToastMessage('Activity deleted successfully!')
        setShowDeleteModal(false)
        setSelectedActivity(null)
        // Refresh list after successful delete
        fetchActivity()
      } else {
        setShowDeleteModal(false)
        // 🔹 Try to read the JSON error response
        let errorMsg = 'Failed to delete Activity!'
        try {
          const data = await response.json()
          if (data?.message) {
            errorMsg = data.message
          }
        } catch (err) {
          console.error('Error parsing error response:', err)
        }

        setToastType('fail')
        setToastMessage(errorMsg)
      }
    } catch (error) {
      setToastType('fail')
      setToastMessage('Error deleting Activity')
    }
  }

  // ⭐ NEW: OPEN gallery modal (button already exists in your code)
  const handleImageGalleryClick = (row) => {
    setSelectedActivity(row)
    setShowGalleryModal(true)
  }

  // ⭐ NEW: after successful upload, close modal & optionally refresh
  const handleGallerySaved = (uploadedKeys = []) => {
    setShowGalleryModal(false)
    if (uploadedKeys.length) {
      setToastType('success')
      setToastMessage('Image(s) uploaded successfully!')
    } else {
      setToastType('info')
      setToastMessage('No images uploaded.')
    }
    // If your list shows an image count/thumbnail, you can refresh:
    // fetchActivity()
  }

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Activity </h3>
        <button
          onClick={() => navigate('/vendordata/activityinfo/activity/new')}
          className="add-product-button"
        >
          New Activity
        </button>
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
                <th>#</th>
                <th>Image</th>
                <th>Activity Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Gender</th>
                <th>Price Per Student </th>
                <th>Created Date</th>
                <th>Status </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Activity.map((row, index) => (
                <tr key={row.PrdCodeNo || `${row.ActivityID}-${index}`}>
                  <td>
                    <strong>{(currentPage - 1) * ActivityPerPage + index + 1}</strong>
                  </td>
                  <td>
                    <div className="Activity-image-circle">
                      <img src={logo} alt="logo" style={{ width: '75px' }} />
                    </div>
                  </td>
                  <td> {row.actName} </td>
                  <td> {row.actTypeID} </td>
                  <td>
                    {row.EnCityName} {row.actAddress1}
                    {row.actAddress2}
                  </td>
                  <td> {row.actGender} </td>
                  <td
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '250px',
                    }}
                  >
                    {row.priceList && row.priceList.length > 0 ? (
                      row.priceList.map((price, i) => (
                        <div key={i}>
                          <img
                            src={moneyv1}
                            alt="logo"
                            style={{ width: '14px', marginRight: '6px', verticalAlign: 'middle' }}
                          />{' '}
                          {price.Price} from {price.StudentRangeFrom} to {price.StudentRangeTo}
                        </div>
                      ))
                    ) : (
                      'No prices'
                    )}
                  </td>

                  <td>{formatDate(row.CreatedDate)}</td>

                  <td> {dspstatus(row.actStatus)} </td>

                  <td align="center" style={{ width: '10%', whiteSpace: 'nowrap' }}>
                    <div
                      className="text-align"
                      style={{
                        display: 'flex',
                        gap: '6px',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                         <button
  onClick={() => handleImageGalleryClick(row)}
  title="Image Gallery / معرض الصور"
  className="btn btn-default graybox"
  style={{ padding: '2px 6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
  aria-label="Image Gallery / معرض الصور"
>
  {/* Either alias works in FA4 */}
  <i className="fa fa-picture-o" style={{ color: '#cf2037' }} aria-hidden="true" />
  {/* <i className="fa fa-image" style={{ color: '#cf2037' }} aria-hidden="true" /> */}
 
</button>

                      <button
                        onClick={() => handleModifyClick(row.ActivityID)}
                        title="Edit/حذف"
                        className="btn btnbtn-default graybox"
                        style={{ padding: '2px', cursor: 'pointer' }}
                        aria-label="Edit/حذف"
                      >
                        <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
                      </button>

                      <button
                        onClick={() => handleDeleteClick(row)}
                        title="Delete/حذف"
                        className="btn btnbtn-default graybox"
                        style={{ padding: '2px', cursor: 'pointer' }}
                        aria-label="Delete/حذف"
                      >
                        <i style={{ color: '#cf2037' }} className="fa fa-trash-o" />
                      </button>

                      {/* ⭐ NEW: your existing button now opens modal */}
                    
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
            <h4>Confirm Delete</h4>
            <p>
              Are you sure you want to delete this Activity?
              {selectedActivity?.actName && (
                <> <span style={{ color: '#cf2037', fontWeight: 700 }}>{' '}{selectedActivity.actName}</span></>
              )}
            </p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>
                Yes
              </button>
              <button
                className="admin-buttonv1"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedActivity(null)
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ NEW: Image upload modal */}
      {showGalleryModal && selectedActivity && (
        <ImageUploadModal
          isOpen={showGalleryModal}
          onClose={() => setShowGalleryModal(false)}
          onSaved={handleGallerySaved}
          activity={selectedActivity}
        />
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default ActivityList
