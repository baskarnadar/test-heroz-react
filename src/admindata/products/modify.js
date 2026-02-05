import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../utils/operation'
import { checkLogin } from '../../utils/auth'
import '../../scss/toast.css'

const ProductModify = () => {
  const navigate = useNavigate()
  const ProductID = new URLSearchParams(useLocation().search).get('ProductID')

  const [ProductName, setProductName] = useState('')
  const [ProductAmount, setProductAmount] = useState('')
  const [ProductTotalStar, setProductTotalStar] = useState('')

  // ✅ change to dropdown like ProductNew (bg1.jpg -> bg8.jpg)
  const [ProductImage, setProductImage] = useState('bg1.jpg')
  const [ProductImageUrl, setProductImageUrl] = useState('') // for preview (from API)

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

  useEffect(() => {
    const load = async () => {
      if (!ProductID) return

      try {
        const res = await fetch(`${API_BASE_URL}/product/productsview`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ProductID }),
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.message || 'Failed to load')

        const p = data?.data
        if (p) {
          setProductName(p.ProductName || '')
          setProductAmount(String(p.ProductAmount ?? ''))
          setProductTotalStar(String(p.ProductTotalStar ?? ''))

          // ✅ load dropdown value from DB, fallback bg1.jpg
          const imgVal = (p.ProductImage || '').trim()
          setProductImage(imgVal || 'bg1.jpg')

          // ✅ built by API (preview)
          setProductImageUrl(p.ProductImageUrl || '')
        }
      } catch (e) {
        setToastType('fail')
        setToastMessage(e?.message || 'Failed to load card')
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ProductID])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setToastMessage('')

    if (!ProductID) {
      setToastType('fail')
      setToastMessage('ProductID missing.')
      setLoading(false)
      return
    }

    const amountNum = Number(ProductAmount)
    const starNum = Number(ProductTotalStar)

    if (!ProductName.trim() || !Number.isFinite(amountNum) || !Number.isFinite(starNum)) {
      setToastType('fail')
      setToastMessage('Please enter Title, Amount and Total Stars.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/product/productsmodify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ProductID,
          ProductName: ProductName.trim(),
          ProductAmount: amountNum,
          ProductTotalStar: starNum,
          ProductImage: (ProductImage || '').trim(), // ✅ DROPDOWN VALUE
          ModifyBy: 'ADMIN',
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || 'Update failed')

      setToastType('success')
      setToastMessage('Card updated')
      setTimeout(() => navigate('/admindata/products/list'), 1000)
    } catch (e2) {
      setToastType('fail')
      setToastMessage(e2?.message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  // ✅ preview from API only (since dropdown gives filename)
  const previewUrl = ProductImageUrl || ''

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Edit Membership Card</h3>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="admin-buttonv1" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/products/list')}
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

          {/* ✅ Show image preview from API (ProductImageUrl) */}
          {previewUrl ? (
            <div style={{ marginTop: 10 }}>
              <img alt="preview" style={{ width: 220, borderRadius: 10 }} src={previewUrl} />
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75, wordBreak: 'break-all' }}>
                <span style={{ opacity: 0.7 }}>ProductImageUrl: </span>
                <b>{previewUrl}</b>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Preview will appear after save (API returns <b>ProductImageUrl</b>).
            </div>
          )}
        </div>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  )
}

export default ProductModify
