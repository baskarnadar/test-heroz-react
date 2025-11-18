import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import { checkLogin } from '../../../utils/auth'
import '../../../scss/toast.css'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation'

const AddCategoryForm = () => {
  const navigate = useNavigate()

  const [EnCategoryName, setEnCategoryName] = useState('')
  const [ArCategoryName, setArCategoryName] = useState('')
  const [IsDataStatus, setIsDataStatus] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

  // ✅ Added admin login validation hook
  useEffect(() => {
    IsAdminLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/lookupdata/Category/getCategorylist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // If your API expects data in the body
        })

        const result = await response.json()
        if (result.data) {
          setCategoryList(result.data)
        }
      } catch (error) {
        console.error('Error fetching Category list:', error)
      }
    }

    fetchCities()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!EnCategoryName || !ArCategoryName) {
      setToastMessage('Please fill in all required fields.')
      setToastType('fail')
      return
    }

    setLoading(true)
    setToastMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/Category/createCategory`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          EnCategoryName,
          ArCategoryName,
          IsDataStatus: 1,
          CreatedBy: 'USER', // Ideally get from auth context
          ModifyBy: 'USER',
        }),
      })

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      await response.json()
      setToastMessage('Category added successfully!')
      setToastType('success')

      setTimeout(() => navigate('/admindata/category/list'), 2000)
    } catch (err) {
      console.error('Error adding Category:', err)
      setToastMessage('Failed to add Category.')
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Add Category</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/category/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English Category Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnCategoryName}
          onChange={(e) => setEnCategoryName(e.target.value)}
          placeholder="Enter English Category Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic Category Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArCategoryName}
          onChange={(e) => setArCategoryName(e.target.value)}
          placeholder="Enter Arabic Category Name"
          required
        />
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  )
}

export default AddCategoryForm
