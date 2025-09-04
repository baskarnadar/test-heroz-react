import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import { CIcon } from '@coreui/icons-react'
import { cilTrash, cilPencil } from '@coreui/icons'
import '../../scss/toast.css'
import { checkLogin } from '../../utils/auth'
import { DspToastMessage ,getAuthHeaders} from '../../utils/operation'
import card1 from '../../assets/card/card1.png'
import card2 from '../../assets/card/card2.png'
import card3 from '../../assets/card/card3.jpg'
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

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Membership And Credit Management </h3>
      </div>
        <div className="page-title">
       
        <button onClick={() => navigate('/admindata/membership/new')} className="add-product-button">
          New Card
        </button>
      </div>


      <div className="dashboard-row">
        <div className="dashboard-col">
          <div className="card1bg" style={{ backgroundImage: `url(${card1})` }}>
            <div> </div>
            <div className="txtv1">
              <b>500 SAR</b>
            </div>
            <div style={{ paddingTop: '90px' }}>
              <h5>You will get 10 Stars</h5>
            </div>
          </div>

          <div className="dashboard-right">
            <button
              onClick={() => handleModifyClick()}
              title="Edit/حذف"
              className="btn btnbtn-default graybox"
              style={{ padding: '2px', cursor: 'pointer' }}
              aria-label="Edit/حذف"
            >
              <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
            </button>
            <button
              onClick={() => handleDeleteClick()}
              title="Delete/حذف"
              className="btn btnbtn-default graybox"
              style={{ padding: '2px', cursor: 'pointer' }}
              aria-label="Delete/حذف"
            >
              <i style={{ color: '#cf2037' }} className="fa fa-trash-o" />
            </button>
          </div>
        </div>

        <div className="dashboard-col">
          <div className="card1bg" style={{ backgroundImage: `url(${card2})` }}>
            <div> </div>
            <div className="txtv1">
              <b>350 SAR</b>
            </div>
            <div style={{ paddingTop: '90px' }}>
              <h5>You will get 7 Stars</h5>
            </div>
          </div>

          <div className="dashboard-right">
            <button
              onClick={() => handleModifyClick()}
              title="Edit/حذف"
              className="btn btnbtn-default graybox"
              style={{ padding: '2px', cursor: 'pointer' }}
              aria-label="Edit/حذف"
            >
              <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
            </button>
            <button
              onClick={() => handleDeleteClick()}
              title="Delete/حذف"
              className="btn btnbtn-default graybox"
              style={{ padding: '2px', cursor: 'pointer' }}
              aria-label="Delete/حذف"
            >
              <i style={{ color: '#cf2037' }} className="fa fa-trash-o" />
            </button>
          </div>
        </div>

        <div className="dashboard-col">
          <div className="card1bg" style={{ backgroundImage: `url(${card3})` }}>
            <div> </div>
            <div className="txtv1">
              <b>250 SAR</b>
            </div>
            <div style={{ paddingTop: '90px' }}>
              <h5>You will get 5 Stars</h5>
            </div>
          </div>

          <div className="dashboard-right">
            <button
              onClick={() => handleModifyClick()}
              title="Edit/حذف"
              className="btn btnbtn-default graybox"
              style={{ padding: '2px', cursor: 'pointer' }}
              aria-label="Edit/حذف"
            >
              <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
            </button>
            <button
              onClick={() => handleDeleteClick()}
              title="Delete/حذف"
              className="btn btnbtn-default graybox"
              style={{ padding: '2px', cursor: 'pointer' }}
              aria-label="Delete/حذف"
            >
              <i style={{ color: '#cf2037' }} className="fa fa-trash-o" />
            </button>
          </div>
        </div>
      </div>

       {showDeleteModal && (
             <div className="modal-overlay">
               <div className="modal-content_50">
                 <h4>Confirm Delete</h4>
                 <p>Are you sure you want to delete this Card?</p>
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

export default ProductListWithPagination
