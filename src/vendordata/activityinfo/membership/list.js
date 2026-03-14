// (keep same path as your project) e.g. src/pages/vendordata/activityinfo/membership/ActivityList.jsx
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
  IsVendorLoginIsValid,   // ✅ IsVendorLoginIsValid imported here
} from '../../../utils/operation'
import logo from '../../../assets/logo/default.png'
import moneyv1 from '../../../assets/images/moneyv1.png'
import { ActionButtonsV1 } from '../../../utils/btn'

// ⭐ NEW: Modal component for image uploads
import ImageUploadModal from './imageupload'

// 🔤 i18n packs (default Arabic if not set)
import enPack from '../../../i18n/enloc100.json'
import arPack from '../../../i18n/arloc100.json'

const ActivityList = () => {
  // ✅ Vendor login guard: runs once when component mounts
  useEffect(() => {
    IsVendorLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

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

  // ---- i18n (local, no provider) ----
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      return v === 'ar' || v === 'en' ? v : 'ar' // default AR
    } catch {
      return 'ar'
    }
  }
  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback
  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])
  // ------------------------------------

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
      setError(tr('errFetchActivities', 'Error fetching activities'))
    } finally {
      setLoading(false)
    }
  }

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber)

  const handleModifyClick = (ActivityID) => {
    navigate(`/vendordata/activityinfo/membership/modify?ActivityID=${ActivityID}`)
  }

  const handleViewClick = (ActivityID) => {
    navigate(`/vendordata/activityinfo/membership/view?ActivityID=${ActivityID}`)
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
        `${API_BASE_URL}/vendordata/activityinfo/membership/deleteActivity`,
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
        setToastMessage(tr('toastActivityDeleted', 'Activity deleted successfully!'))
        setShowDeleteModal(false)
        setSelectedActivity(null)
        // Refresh list after successful delete
        fetchActivity()
      } else {
        setShowDeleteModal(false)
        // 🔹 Try to read the JSON error response
        let errorMsg = tr('toastDeleteFailed', 'Failed to delete Activity!')
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
      setToastMessage(tr('toastErrorDeleting', 'Error deleting Activity'))
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
      setToastMessage(tr('toastImagesUploaded', 'Image(s) uploaded successfully!'))
    } else {
      setToastType('info')
      setToastMessage(tr('toastNoImagesUploaded', 'No images uploaded.'))
    }
    // fetchActivity() // if needed
  }

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>{tr('membershipListTitle', 'Activity')}</h3>
        <button
          onClick={() => navigate('/vendordata/activityinfo/membership/new')}
          className="add-product-button"
        >
          {tr('actNewBtn', 'New Activity')}
        </button>
      </div>

      {loading ? (
        <p>{tr('commonLoading', 'Loading...')}</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <table className="grid-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{tr('tblImage', 'Image')}</th>
                <th>{tr('tblActivityName', 'Activity Name')}</th>
                <th>{tr('tblType', 'Type')}</th>
                <th>{tr('tblLocation', 'Location')}</th>
                <th>{tr('tblGender', 'Gender')}</th>
                <th>{tr('tblPricePerStudent', 'Price Per Student')}</th>
                <th>{tr('tblCreatedDate', 'Created Date')}</th>
                <th>{tr('tblStatus', 'Status')}</th>
                <th>{tr('tblActions', 'Actions')}</th>
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
                          {price.Price}{' '}
                          {tr('rangeFromTo', 'from {from} to {to}')
                            .replace('{from}', price.StudentRangeFrom)
                            .replace('{to}', price.StudentRangeTo)}
                        </div>
                      ))
                    ) : (
                      tr('noPrices', 'No prices')
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
                        title={tr('btnImageGallery', 'Image Gallery')}
                        className="btn btn-default graybox"
                        style={{
                          padding: '2px 6px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        aria-label={tr('btnImageGallery', 'Image Gallery')}
                      >
                        <i className="fa fa-picture-o" style={{ color: '#cf2037' }} aria-hidden="true" />
                      </button>

                      <button
                        onClick={() => handleModifyClick(row.ActivityID)}
                        title={tr('btnEdit', 'Edit')}
                        className="btn btnbtn-default graybox"
                        style={{ padding: '2px', cursor: 'pointer' }}
                        aria-label={tr('btnEdit', 'Edit')}
                      >
                        <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
                      </button>

                      <button
                        onClick={() => handleDeleteClick(row)}
                        title={tr('btnDelete', 'Delete')}
                        className="btn btnbtn-default graybox"
                        style={{ padding: '2px', cursor: 'pointer' }}
                        aria-label={tr('btnDelete', 'Delete')}
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
            <h4>{tr('confirmDeleteTitle', 'Confirm Delete')}</h4>
            <p>
              {tr('confirmDeleteMsg', 'Are you sure you want to delete this Activity?')}
              {selectedActivity?.actName && (
                <>
                  {' '}
                  <span style={{ color: '#cf2037', fontWeight: 700 }}>
                    {selectedActivity.actName}
                  </span>
                </>
              )}
            </p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>
                {tr('yes', 'Yes')}
              </button>
              <button
                className="admin-buttonv1"
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedActivity(null)
                }}
              >
                {tr('no', 'No')}
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
