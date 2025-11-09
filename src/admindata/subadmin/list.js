import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import { checkLogin } from '../../utils/auth'
import { CIcon } from '@coreui/icons-react'
import { cilTrash, cilPencil } from '@coreui/icons'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../utils/operation'

const UserList = () => {
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedprtuserid, setSelectedprtuserid] = useState(null)

  const usersPerPage = 10
  const navigate = useNavigate()

  // ✅ Admin login validation (from your snippet)
  useEffect(() => {
    IsAdminLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/subadmin/getsubadminall`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ page: currentPage, limit: usersPerPage }),
      })

      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data.data)
      setTotalPages(Math.ceil(data.totalCount / usersPerPage))
    } catch (error) {
      setToastMessage('Error fetching users')
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) {
      range.push(i)
    }
    return range
  }

  const handleModifyClick = (prtuserid) => {
    navigate(`/admindata/subadmin/modify?prtuserid=${prtuserid}`)
  }

  const handleDeleteClick = (prtuserid) => {
    setSelectedprtuserid(prtuserid)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    console.log(`${API_BASE_URL}/subadmin/deletesubadmin`)
    try {
      const response = await fetch(`${API_BASE_URL}/subadmin/deletesubadmin`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ prtuserid: selectedprtuserid }),
      })

      if (response.ok) {
        setToastMessage('User successfully deleted')
        setToastType('success')
        fetchUsers()
      } else {
        setToastMessage('Failed to delete user')
        setToastType('fail')
      }
    } catch (err) {
      setToastMessage('Error deleting user')
      setToastType('fail')
    } finally {
      setShowDeleteModal(false)
      setSelectedprtuserid(null)
    }
  }

  const pageNumbers = getPageRange()

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>User List</h3>
        <button
          onClick={() => navigate('/admindata/subadmin/new')}
          className="add-product-button"
        >
          Add New User
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <table className="grid-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User Name</th>
                <th>Full Name</th>
                <th>User Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.prtuserid}>
                  <td>
                    <strong>
                      {(currentPage - 1) * usersPerPage + index + 1}
                    </strong>
                  </td>
                  <td>{user.username}</td>
                  <td>{user.UserFullName}</td>
                  <td>{user.usertype}</td>
                  <td>{user.userstatus ? 'Active' : 'Inactive'}</td>
                  <td>
                    <CIcon
                      onClick={() => handleModifyClick(user.prtuserid)}
                      icon={cilPencil}
                      size="lg"
                      className="edit-icon"
                    />
                    <CIcon
                      onClick={() => handleDeleteClick(user.prtuserid)}
                      icon={cilTrash}
                      size="lg"
                      className="trash-icon"
                    />
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
                className={`pagination-button ${
                  currentPage === pageNumber ? 'active' : ''
                }`}
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>Confirm Delete</h4>
            <p>Are you sure you want to delete this user?</p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={confirmDelete}>
                Yes
              </button>
              <button
                className="admin-buttonv1"
                onClick={() => setShowDeleteModal(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default UserList
