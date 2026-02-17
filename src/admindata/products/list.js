import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import '../../scss/toast.css'
import { checkLogin } from '../../utils/auth'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../utils/operation'

const ProductListWithPagination = () => {
  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ProductIDToDelete, setProductIDToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const productsPerPage = 10
  const navigate = useNavigate()

  useEffect(() => {
    checkLogin(navigate)
    IsAdminLoginIsValid()
  }, [navigate])

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 2000)
      return () => clearTimeout(t)
    }
  }, [toastMessage])

  const fetchProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/product/productslist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          page: currentPage,
          limit: productsPerPage,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Failed to fetch products')

      setProducts(Array.isArray(data.data) ? data.data : [])
      setTotalPages(Math.max(1, Math.ceil((Number(data.totalCount) || 0) / productsPerPage)))
    } catch (e) {
      setError(e?.message || 'Error fetching products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage])

  const openDeleteModal = (id) => {
    setProductIDToDelete(id)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setProductIDToDelete(null)
    setDeleteLoading(false)
  }

  const handleDelete = async () => {
    if (!ProductIDToDelete) {
      setToastType('fail')
      setToastMessage('ProductID missing. Please try again.')
      return
    }

    setDeleteLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/product/productsdelete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ProductID: ProductIDToDelete,
          ModifyBy: 'ADMIN',
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        setToastType('success')
        setToastMessage(data?.message || 'Card deleted successfully')
        closeDeleteModal()
        fetchProducts()
      } else {
        setToastType('fail')
        setToastMessage(data?.message || 'Failed to delete card')
        setDeleteLoading(false)
      }
    } catch (e) {
      setToastType('fail')
      setToastMessage('Delete failed (network/server error)')
      setDeleteLoading(false)
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

  const safeBg = (url) => {
    if (!url || typeof url !== 'string') return null
    const u = url.trim()
    if (!u) return null
    if (u.startsWith('url(')) return u
    return `url("${u.replace(/"/g, '\\"')}")`
  }

  return (
    <div>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Membership And Credit Management</h3>
      </div>

      <div className="page-title">
        <button onClick={() => navigate('/admindata/products/new')} className="add-product-button">
          New Card
        </button>
      </div>

      {loading && <div style={{ padding: 10 }}>Loading...</div>}
      {error && <div style={{ padding: 10, color: 'red' }}>{error}</div>}

      {/* ✅ FIX: force cards to sit next to each other (no left/right spread) */}
      <div
        className="dashboard-row"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
        }}
      >
        {(products || []).map((p) => {
          const stars = Number(p?.ProductTotalStar || 0)
          const bg = safeBg(p?.ProductImageUrl)

          return (
            <div
              className="dashboard-col"
              key={p.ProductID}
              style={{
                flex: '0 0 220px', // ✅ fixed column width so it doesn't push to far right
                maxWidth: 220,
              }}
            >
              <div
                className="card1bg"
                style={{
                  backgroundImage: bg || 'none',
                  backgroundColor: bg ? 'transparent' : '#f2f2f2',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  minHeight: 250,
                  width: '100%',
                  maxWidth: 200,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: bg
                      ? 'linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.65))'
                      : 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.08))',
                  }}
                />

                <div style={{ position: 'relative', padding: 12 }}>
                  <div className="txtv1" style={{ marginTop: 2 }}>
                    <b style={{ fontSize: 18, color: bg ? '#fff' : '#111' }}>{p.ProductAmount} SAR</b>
                  </div>

                  <div
                    style={{
                      minHeight: 175,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      paddingTop: 10,
                    }}
                  >
                    <h5 style={{ marginBottom: 6, color: bg ? '#fff' : '#111' }}>{p.ProductName}</h5>

                    <div style={{ color: bg ? '#fff' : '#111', fontSize: 14 }}>
                      You will get <b>{stars}</b> Stars
                    </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-right">
                <button
                  className="btn btnbtn-default graybox"
                  style={{ padding: '2px', cursor: 'pointer' }}
                  onClick={() => navigate(`/admindata/products/modify?ProductID=${p.ProductID}`)}
                  title="Edit"
                  aria-label="Edit"
                >
                  <i style={{ color: '#cf2037' }} className="fa fa-pencil" />
                </button>

                <button
                  className="btn btnbtn-default graybox"
                  style={{ padding: '2px', cursor: 'pointer' }}
                  onClick={() => openDeleteModal(p.ProductID)}
                  title="Delete"
                  aria-label="Delete"
                >
                  <i style={{ color: '#cf2037' }} className="fa fa-trash-o" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, padding: 10, flexWrap: 'wrap' }}>
          <button
            className="admin-buttonv1"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              className="admin-buttonv1"
              onClick={() => setCurrentPage(n)}
              style={{ opacity: currentPage === n ? 1 : 0.7 }}
            >
              {n}
            </button>
          ))}

          <button
            className="admin-buttonv1"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showDeleteModal && (
        <div
          onClick={closeDeleteModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              width: 'min(700px, 95vw)',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
              padding: 24,
            }}
          >
            <h4 style={{ marginTop: 0, marginBottom: 12 }}>Confirm Delete</h4>
            <p style={{ marginTop: 0, marginBottom: 18 }}>Are you sure you want to delete this Card?</p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start' }}>
              <button className="admin-buttonv1" onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Yes'}
              </button>

              <button className="admin-buttonv1" onClick={closeDeleteModal} disabled={deleteLoading}>
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
