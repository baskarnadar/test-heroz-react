import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation'
import { checkLogin } from '../../../utils/auth'
import '../../../scss/toast.css'

const ProductNew = () => {
  const navigate = useNavigate()

  const [ProductName, setProductName] = useState('')
  const [ProductAmount, setProductAmount] = useState('')
  const [ProductTotalStar, setProductTotalStar] = useState('')
  const [ProductImage, setProductImage] = useState('bg1.jpg') // ✅ DROPDOWN default

  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // ✅ options bg1.jpg -> bg8.jpg
  const imageOptions = Array.from({ length: 8 }, (_, i) => `bg${i + 1}.jpg`)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setToastMessage('')

    const amountNum = Number(ProductAmount)
    const starNum = Number(ProductTotalStar)

    if (!ProductName.trim() || !Number.isFinite(amountNum) || !Number.isFinite(starNum)) {
      setToastType('fail')
      setToastMessage('Please enter Title, Amount and Total Stars.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/product/productsadd`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ProductName: ProductName.trim(),
          ProductAmount: amountNum, // ✅ NUMBER
          ProductTotalStar: starNum, // ✅ NUMBER
          ProductImage: (ProductImage || '').trim(), // ✅ DROPDOWN VALUE
          CreatedBy: 'ADMIN',
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Create failed')

      setToastType('success')
      setToastMessage('Card created')
      setTimeout(() => navigate('/admindata/membership/products/list'), 1000)
    } catch (e2) {
      setToastType('fail')
      setToastMessage(e2?.message || 'Create failed')
    } finally {
      setLoading(false)
    }
  }

  // ✅ since ProductImage is filename, we can’t preview without base url
  // so just show selected filename as text
  const selectedLabel = ProductImage || ''

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>New Membership Card</h3>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="admin-buttonv1" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/membership/products/list')}
            disabled={loading}
          >
            Return
          </button>
        </div>
      </div>

      <div className="divbox">
        <div className="form-group">
          <label>Membership Title</label>
          <input
            className="admin-txt-box"
            value={ProductName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Membership Amount</label>
          <input
            className="admin-txt-box"
            type="number"
            value={ProductAmount}
            onChange={(e) => setProductAmount(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Total Stars</label>
          <input
            className="admin-txt-box"
            type="number"
            value={ProductTotalStar}
            onChange={(e) => setProductTotalStar(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Product Image</label>

          {/* ✅ DROPDOWN (bg1.jpg -> bg8.jpg) */}
          <select
            className="admin-txt-box"
            value={ProductImage}
            onChange={(e) => setProductImage(e.target.value)}
            style={{ height: 42 }}
          >
            {imageOptions.map((img) => (
              <option key={img} value={img}>
                {img}
              </option>
            ))}
          </select>

          {/* ✅ show selected value */}
          {selectedLabel ? (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              Selected: <b>{selectedLabel}</b>
            </div>
          ) : null}
        </div>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  )
}

export default ProductNew
