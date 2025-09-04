import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import { API_BASE_URL } from '../../config'
import { checkLogin } from '../../utils/auth'
import { getStatusBadgeColor, formatDate,getAuthHeaders } from '../../utils/operation'
import { CBadge } from '@coreui/react'
import { cilFilter } from '@coreui/icons'
import logo from '../../assets/logo/default.png'

const VendorList = () => {
  const navigate = useNavigate()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [uservendorss, setuservendorss] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVendorID, setSelectedVendorID] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const VendorListPage = 10

  useEffect(() => {
    checkLogin(navigate)
    fetchuservendors()
  }, [currentPage])

  const fetchuservendors = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/vendorinfo/vendor/getvendorlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: currentPage,
          limit: VendorListPage,
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch vendor list')

      const data = await response.json()
      setuservendorss(data.data || [])
      setTotalPages(Math.ceil((data.totalCount || 0) / VendorListPage))
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/vendorinfo/vendor/delvendor`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ VendorID: selectedVendorID }),
      })

      console.log('Raw response:', response)
      const data = await response.json() // Safely parse JSON
      console.log('Response JSON:', data)

      if (response.ok) {
        setToastMessage(data.message || 'Vendor successfully deleted')
        setToastType('success')
        fetchuservendors() // Refresh list
      } else {
        setToastMessage(data.message || 'Failed to delete Vendor')
        setToastType('fail')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setToastMessage('Error deleting Vendor')
      setToastType('fail')
    } finally {
      setShowDeleteModal(false)
      setSelectedVendorID(null)
    }
  }

  const filteredvendors = uservendorss.filter((vendor) =>
    vendor.vdrName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }

  const handleModifyClick = (id) => {
    navigate(`/admindata/vendor/modify?VendorID=${id}`)
  }

  const handleViewClick = (id) => {
    navigate(`/admindata/vendor/view?VendorID=${id}`)
  }

  const handleCahngePwdClick = (id) => {
    navigate(`/admindata/vendor/changepwd?VendorID=${id}`)
  }
  const handleDeleteClick = (VendorID) => {
    setSelectedVendorID(VendorID)
    setShowDeleteModal(true)
  }

  return (
    <div>
      <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h3 style={{ margin: 0 }}>Vendor Management</h3>

        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '300px' }}>
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

        <button onClick={() => navigate('/admindata/vendor/new')} className="admin-buttonv1">
          + New
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
                <th></th>
                <th>Name</th>
                <th>Club Name</th>
                <th>Mobile No</th>
                <th>City</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredvendors.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredvendors.map((vendor, index) => (
                  <tr key={vendor._id}>
                    <td>{(currentPage - 1) * VendorListPage + index + 1}</td>
                    <td>
                      <img src={logo} alt="logo" width="40" height="40" />
                    </td>
                    <td>{vendor.vdrName}</td>
                    <td>{vendor.vdrClubName}</td>
                    <td>{vendor.vdrMobileNo1}</td>
                    <td>{vendor.cityInfo?.EnCityName || 'N/A'}</td>
                    <td>{formatDate(vendor.CreatedDate)}</td>
                    <td>
                      <CBadge color={getStatusBadgeColor(vendor.vdrStatus)} shape="pill">
                        {vendor.vdrStatus || 'N/A'}
                      </CBadge>
                    </td>
                    <td align="center">
                      <div className="action-buttons">
                        <button
                          onClick={() => handleModifyClick(vendor.VendorID)}
                          title="Edit"
                          className="  graybox"
                        >
                          <i className="fa fa-pencil" style={{ color: '#cf2037' }} />
                        </button>
                        {/* <button
                          onClick={() => handleDeleteClick(vendor.VendorID)}
                          title="Delete"
                          className="  graybox"
                        >
                          <i className="fa fa-trash-o" style={{ color: '#cf2037' }} />
                        </button> */}
                        <button
                          onClick={() => handleViewClick(vendor.VendorID)}
                          title="View"
                          className="  graybox"
                        >
                          <i className="fa fa-eye" style={{ color: '#cf2037' }} />
                        </button>
                        <button
                          onClick={() => handleCahngePwdClick(vendor.VendorID)}
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
          <div className="pagination-container">
            <button
              className="pagination-button"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              {'<<'}
            </button>

            {getPageRange().map((pageNumber) => (
              <button
                key={pageNumber}
                className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}

            <button
              className="pagination-button"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {'>>'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorList
