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
} from '../../../utils/operation'
import logo from '../../../assets/logo/default.png'
import moneyv1 from '../../../assets/images/moneyv1.png'
import { ActionButtonsV1 } from '../../../utils/btn'

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
    try {
      const response = await fetch(
        `${API_BASE_URL}/admindata/activityinfo/activity/activityList`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: currentPage,
            limit: ActivityPerPage,
          }),W
        },
      )

      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      console.log('data')
      console.log(data.data)
      setActivity(data.data || [])
      setTotalPages(Math.ceil(data.totalCount / ActivityPerPage))
    } catch (error) {
      setError('Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber)

 
  const handleViewClick = (ActivityID,VendorID) => {
    navigate(`/admindata/activityinfo/activity/modify?ActivityID=${ActivityID}&VendorID=${VendorID}`)
  }

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }

  const pageNumbers = getPageRange()

  //Delete

  const handleDeleteClick = (ActivityID) => {
    setActivityIDelete(ActivityID)
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
          headers: { 'Content-Type': 'application/json' },
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
      } else {
        setToastType('fail')
        setToastMessage('Failed to delete Activity!')
      }
    } catch (error) {
      setToastType('fail')
      setToastMessage('Error deleting Activity')
    }
  }
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
                <th>Type</th>
                <th>Location</th>
                <th>Gender</th>
                <th>Price Per Student </th>
                <th> Date</th>
                <th>Status </th>
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
                  <td> {Activity.actName} </td>
                  <td> {Activity.actTypeID} </td>
                  <td>
                    {' '}
                    {Activity.EnCityName} {Activity.actAddress1}
                    {Activity.actAddress2}{' '}
                  </td>
                  <td> {Activity.actGender} </td>
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

                  <td> {dspstatus(Activity.actStatus)} </td>

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
                        onClick={() => handleViewClick(Activity.ActivityID,Activity.VendorID)}
                        title="Transfer/تحويل"
                        className="btn btnbtn-default graybox"
                        style={{ padding: '2px', cursor: 'pointer' }}
                        aria-label="View"
                      >
                        <i style={{ color: '#cf2037' }} className="fa fa-eye" />
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
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this Activity?</p>
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

export default ActivityList
