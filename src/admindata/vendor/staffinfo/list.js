import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import { cilFilter } from '@coreui/icons'

import { API_BASE_URL } from '../../../config'
import { checkLogin } from '../../../utils/auth'
import { formatDate, DspToastMessage,getAuthHeaders } from '../../../utils/operation'

const StudentList = () => {
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [active, setActive] = useState('STAFF')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productIDToDelete, setProductIDToDelete] = useState(null)

  const ordersPerPage = 10

  useEffect(() => {
    checkLogin(navigate)
    fetchOrders()
  }, [currentPage])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/order/getorder`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: ordersPerPage }),
      })

      if (!response.ok) throw new Error('Failed to fetch orders')

      const data = await response.json()
      setOrders(data.data || [])
      setTotalPages(Math.ceil(data.totalCount / ordersPerPage))
    } catch {
      setError('Error fetching orders')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/product/delproductByID`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ProductID: productIDToDelete }),
      })

      if (res.ok) {
        setToastMessage('Product deleted successfully!')
        setToastType('success')
        setShowDeleteModal(false)
        fetchOrders()
      } else {
        throw new Error()
      }
    } catch {
      setToastType('fail')
      setToastMessage('Error deleting product.')
    }
  }

  const handleModify = (id) => navigate(`/vendor/staffinfo/modify?SchoolID=${id}`)
  const handleView = (id) => navigate(`/vendor/staffinfo/view?SchoolID=${id}`)
  const handleNew = () => navigate('/vendor/staffinfo/new')

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase()
    return (
      order.UserOrderNo?.toLowerCase().includes(term) ||
      order.DeliveryTypeID?.toLowerCase().includes(term) ||
      order.orderstatus?.toLowerCase().includes(term)
    )
  })

  const getPageRange = () => {
    const start = Math.floor((currentPage - 1) / 5) * 5 + 1
    const end = Math.min(start + 4, totalPages)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  return (
    <div>
      <div
        className="page-title"
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
      >
        <h3 style={{ margin: 0, flexShrink: 0 }}>Staff Information</h3>

        <div style={{ position: 'relative', flexGrow: 3, maxWidth: '300px' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-txt-box"
            style={{ paddingRight: '30px' }}
          />
          <CIcon
            icon={cilFilter}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              width: '18px',
              height: '18px',
              pointerEvents: 'none',
            }}
          />
        </div>

       
        
        
         <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleNew} className="admin-buttonv1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            stroke="currentColor"
            width="16"
            height="16"
            style={{ marginRight: '8px' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </button>{' '}
          <button
            type="button"
            onClick={() => navigate('/vendor/list')}
            className="admin-buttonv1"
          >
            Return
          </button>
        </div>
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
                <th> ID</th>
                <th> Name</th>
                <th> Email</th>
                <th> Mobile No</th>
                <th> Role</th>
                <th>Created Date</th>
                <th className="txt-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <tr key={order._id || index}>
                    <td>{(currentPage - 1) * ordersPerPage + index + 1}</td>
                    <td>B56789</td>
                    <td>Ahmed</td>
                    <td>sample@sample.com</td>
                    <td>0500865623</td>
                    <td>Manage Booking</td>

                    <td>{formatDate(order.CreatedBy)}</td>

                    <td align="center">
                      <div className="action-buttons">
                        <span
                          id="qlwapp"
                          className="qlwapp qlwapp-free qlwapp-button qlwapp-bottom-right qlwapp-all qlwapp-rounded"
                          style={{ display: 'inline-block' }}
                        >
                          <a
                            className="qlwapp-toggle"
                            data-action="open"
                            data-phone="966500832016"
                            data-message=""
                            role="button"
                            tabIndex={0}
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://wa.me/966500832016"
                            title="Show Hide Profile"
                          >
                            <div className="btn btnbtn-default graybox" style={{ padding: '2px' }}>
                              <i style={{ color: 'darkgreen' }} className="fa fa-whatsapp" />
                            </div>
                          </a>
                        </span>

                        <button
                          onClick={() => handleModify(order._id)}
                          title="Edit"
                          className="graybox"
                        >
                          <i className="fa fa-pencil" style={{ color: '#cf2037' }} />
                        </button>
                        <button
                          onClick={() => {
                            setProductIDToDelete(order._id)
                            setShowDeleteModal(true)
                          }}
                          title="Delete"
                          className="graybox"
                        >
                          <i className="fa fa-trash-o" style={{ color: '#cf2037' }} />
                        </button>
                        <button
                          onClick={() => handleView(order._id)}
                          title="View"
                          className="graybox"
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
            <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              {'<<'}
            </button>
            {getPageRange().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`pagination-button ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {'>>'}
            </button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this Staff?</p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={handleDelete}>
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

export default StudentList
