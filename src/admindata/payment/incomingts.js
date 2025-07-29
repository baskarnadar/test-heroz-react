import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import { CIcon } from '@coreui/icons-react'
import { cilTrash, cilPencil } from '@coreui/icons'
import '../../scss/toast.css'
import { checkLogin } from '../../utils/auth'
import { DspToastMessage } from '../../utils/operation'
import logo from '../../assets/logo/default.png'
import { ActionButtonsV1 } from '../../utils/btn'

const IncomingTransaction = () => {
  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [selectedProduct, setSelectedProduct] = useState(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ProductIDToDelete, setProductIDToDelete] = useState(null)

  const productsPerPage = 10
  const navigate = useNavigate()

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/product/getAllProductsList`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: currentPage,
          limit: productsPerPage,
        }),
      })

      if (!response.ok) throw new Error('Failed to fetch products')

      const data = await response.json()
      setProducts(data.data || [])
      setTotalPages(Math.ceil(data.totalCount / productsPerPage))
    } catch (error) {
      setError('Error fetching products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [currentPage])

  const handlePageClick = (pageNumber) => setCurrentPage(pageNumber)

  const handleProductColorClick = (product) => {
    setSelectedProduct(product)
    navigate(`/forms/prdcolor/prdcolorlist?ProductID=${product.ProductID}`)
  }

  const handleModifyClick = (ProductID) => {
    navigate(`/subadmin/modify?ProductID=${ProductID}`)
  }
  const handleViewClick = (ProductID) => {
    navigate(`/subadmin/view?ProductID=${ProductID}`)
  }

  const handleDeleteClick = (ProductID) => {
    setProductIDToDelete(ProductID)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/product/delproductByID`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProductID: ProductIDToDelete }),
      })

      if (response.ok) {
        setToastType('success')
        setToastMessage('Product deleted successfully!')
        setShowDeleteModal(false)
        fetchProducts()
      } else {
        setToastType('fail')
        setToastMessage('Failed to delete product!')
      }
    } catch (error) {
      setToastType('fail')
      setToastMessage('Error deleting product')
    }
  }

  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }

  const pageNumbers = getPageRange()

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
                <th>Transaction ID</th>
                <th>Parent Name</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Tax Amount</th>
                <th>No Of Stars</th> 
                <th>Payment Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.PrdCodeNo}>
                  <td>
                    <strong>{(currentPage - 1) * productsPerPage + index + 1}</strong>
                  </td>
                  <td>B77234532</td>
                  <td>Ahmed</td>
                  <td>25-Jun-2025</td>
                  <td>1,490</td>
                  <td>700</td>
                  <td>250</td> 
                  <td>Cash</td>
                  <td>Completed</td>
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

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default IncomingTransaction
