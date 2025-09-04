import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import { CIcon } from '@coreui/icons-react'
import { cilTrash, cilPencil } from '@coreui/icons'
import '../../scss/toast.css'
import { checkLogin } from '../../utils/auth'
import { DspToastMessage,getAuthHeaders } from '../../utils/operation'
import Incoming from './incomingts';  
import Outgoing from './outgoing'; 
import { ActionButtonsV1 } from '../../utils/btn'

const ProductListWithPagination = () => {
  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState('providers') // default act
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
        headers: getAuthHeaders(),
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

  const handleViewClick = (ProductID) => {
    navigate(`/activityoversight/view?ProductID=${ProductID}`)
  }
  const handleClick = (type) => {
    setActive(type)
    console.log(type)
    if (type == 'providers') navigate('/reportsandanalysis/providerlist')
    if (type == 'school') navigate('/reportsandanalysis/schoollist')
  }
  const getPageRange = () => {
    const range = []
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1
    const endPage = Math.min(startPage + 4, totalPages)
    for (let i = startPage; i <= endPage; i++) range.push(i)
    return range
  }

  const pageNumbers = getPageRange()
  const handleModifyClick = () => {
    navigate(`/membership/modify`)
  }

  const handleDeleteClick = () => {
    setProductIDToDelete()
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/product/delproductByID`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)
   const [activeTab, setActiveTab] = useState('income');
   const incomeData = 'No Data';
    const outgoingData = 'No Data';
  return (
    <div>
      <div className="txtsubtitle">
        <h4 style={{ margin: 0 }}>Payment Overview </h4>
      </div>
      <div className="divbox">
        <div className="dashboard-row">
          <div className="dashboard-col">
            <div className="txtv2">
              <b>Total Revenue From Parents</b>
            </div>
            <div className="row-right">
              <div className="txtv3">500 SAR</div>
              <div
                className="view-details"
                onClick={openModal}
                style={{ cursor: 'pointer', color: 'blue' }}
              >
                View Details
              </div>
            </div>
          </div>

          <div className="dashboard-col">
            <div className="txtv2">
              <b>Total Tax Collected</b>
            </div>
            <div className="row-right">
              <div className="txtv3">500 SAR</div>
              <div
                className="view-details"
                onClick={openModal}
                style={{ cursor: 'pointer', color: 'blue' }}
              >
                View Details
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="txtv2">
              <b>Vender payment</b>
            </div>
            <div className="row-right">
              <div className="txtv3">500 SAR</div>
              <div
                className="view-details"
                onClick={openModal}
                style={{ cursor: 'pointer', color: 'blue' }}
              >
                View Details
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="txtv2">
              <b>School payment</b>
            </div>
            <div className="row-right">
              <div className="txtv3">500 SAR</div>
              <div
                className="view-details"
                onClick={openModal}
                style={{ cursor: 'pointer', color: 'blue' }}
              >
                View Details
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="modal-overlay-v1" onClick={closeModal}>
          <div className="modal-content-v1" onClick={(e) => e.stopPropagation()}>
            <h4>Revenue Breakdown</h4>
            <div className="divbox1 div-mt-2">
              <div>Total Subscription</div>
              <div>5,000 SAR</div>
            </div>
            <div className="divbox1 div-mt-2">
              <div>Total Star Purchase</div>
              <div>7,000 SAR</div>
            </div>
            <div className="divbox1 div-mt-2">
              <div>Total Trips</div>
              <div>25,000 SAR</div>
            </div>
            <button onClick={closeModal} className="div-mt-2 admin-buttonv1">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="txtsubtitle">
        <h4 style={{ margin: 0 }}>Transaction History </h4>
      </div>

     {/* tab */}
     <div>
      {/* Tab headers */}
      <div style={{ display: 'flex', cursor: 'pointer', marginBottom: '10px' }}>
        <div
          onClick={() => setActiveTab('income')}
          style={{
            padding: '10px 20px',
            borderBottom: activeTab === 'income' ? '2px solid blue' : '2px solid transparent',
            fontWeight: activeTab === 'income' ? 'bold' : 'normal',
          }}
        >
          Income Transaction
        </div>
        <div
          onClick={() => setActiveTab('outgoing')}
          style={{
            padding: '10px 20px',
            borderBottom: activeTab === 'outgoing' ? '2px solid blue' : '2px solid transparent',
            fontWeight: activeTab === 'outgoing' ? 'bold' : 'normal',
          }}
        >
          Outgoing Transaction
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'income' && (
          <div>
            <div className="divbox"> 
              <Incoming data={incomeData} />
            </div>
            
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div>
            
            <div className="divbox"> 
              <Outgoing data={outgoingData} />
            </div>
          </div>
        )}
      </div>
    </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default ProductListWithPagination
