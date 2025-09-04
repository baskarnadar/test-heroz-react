import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFilter } from '@coreui/icons'

import logo from '../../../assets/logo/default.png'
import { API_BASE_URL } from '../../../config'
import { checkLogin } from '../../../utils/auth'
import { getStatusBadgeColor, formatDate } from '../../../utils/operation'
import { DspToastMessage,getAuthHeaders } from '../../../utils/operation'

const SchoolList = () => {
  const [Schoolinfo, setSchoolinfo] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const SchoolinfoPerPage = 10
  const navigate = useNavigate()
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [selectedSchoolID, setSelectedSchoolID] = useState(null)

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)

    for (let i = startPage; i <= endPage; i++) {
      range.push(i)
    }
    return range
  }

  const fetchSchoolinfo = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/schoolinfo/school/getschoollist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: SchoolinfoPerPage }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch school Info')
      }

      const data = await response.json()
      console.log(data)
      setSchoolinfo(data.data || [])
      setTotalPages(Math.ceil(data.totalCount / SchoolinfoPerPage))
    } catch (err) {
      setError('Error fetching school Info')
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

    fetchSchoolinfo()
  }, [currentPage, navigate])

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber)

  // Placeholder functions for actions
  const handleModifyClick = (id) => {
    navigate(`/admindata/schoolmgm/schoolinfo/modify?SchoolID=${id}`)
  }

  const handleDeleteClick = (SchoolID) => {
    setSelectedSchoolID(SchoolID)
    setShowDeleteModal(true)
  }

  const handleViewClick = (id) => {
    navigate(`/admindata/schoolmgm/schoolinfo/view?SchoolID=${id}`)
  }

  const handleCahngePwdClick = (id) => {
    navigate(`/admindata/schoolmgm/schoolinfo/changepwd?SchoolID=${id}`)
  }

  const confirmDelete = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/schoolinfo/school/delschool`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ SchoolID: selectedSchoolID }),
    });

    console.log("Raw response:", response);
    const data = await response.json(); // Safely parse JSON
    console.log("Response JSON:", data);

    if (response.ok) {
      setToastMessage(data.message || 'School successfully deleted');
      setToastType('success');
      fetchSchoolinfo(); // Refresh list
    } else {
      setToastMessage(data.message || 'Failed to delete School');
      setToastType('fail');
    }
  } catch (err) {
    console.error("Delete error:", err);
    setToastMessage('Error deleting School');
    setToastType('fail');
  } finally {
    setShowDeleteModal(false);
    setSelectedSchoolID(null);
  }
};

  return (
    <div>
      <div
        className="page-title"
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
      >
        <h3 style={{ margin: 0, flexShrink: 0 }}>School Management</h3>

        <div style={{ position: 'relative', flexGrow: 3, maxWidth: '300px' }}>
          <input
            type="text"
            placeholder="Search..."
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
              {Schoolinfo.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '1rem' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                Schoolinfo.map((schooldata, index) => (
                  <tr key={schooldata.SchoolID || index}>
                    <td>{(currentPage - 1) * SchoolinfoPerPage + index + 1}</td>
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
                          className="  graybox"
                        >
                          <i className="fa fa-pencil" style={{ color: '#cf2037' }} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(schooldata.SchoolID)}
                          title="Delete"
                          className="  graybox"
                        >
                          <i className="fa fa-trash-o" style={{ color: '#cf2037' }} />
                        </button>
                        <button
                          onClick={() => handleViewClick(schooldata.SchoolID)}
                          title="View"
                          className="  graybox"
                        >
                          <i className="fa fa-eye" style={{ color: '#cf2037' }} />
                        </button>
                        <button
                          onClick={() => handleCahngePwdClick(schooldata.SchoolID)}
                          title="Edit"
                          className="  graybox"
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

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default SchoolList
