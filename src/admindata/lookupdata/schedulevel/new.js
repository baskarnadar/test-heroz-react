import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import { checkLogin } from '../../../utils/auth'
import '../../../scss/toast.css'
import { DspToastMessage,getAuthHeaders } from '../../../utils/operation'

const AddSchEduLevelForm = () => {
  const navigate = useNavigate()

  const [EnSchEduLevelName, setEnSchEduLevelName] = useState('')
  const [ArSchEduLevelName, setArSchEduLevelName] = useState('')
  const [IsDataStatus, setIsDataStatus] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/lookupdata/schedulevel/getSchedulevelList`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // If your API expects data in the body
        })

        const result = await response.json()
        if (result.data) {
          setSchEduLevelList(result.data)
        }
      } catch (error) {
        console.error('Error fetching SchEduLevel list:', error)
      }
    }

    fetchCities()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!EnSchEduLevelName || !ArSchEduLevelName) {
      setToastMessage('Please fill in all required fields.')
      setToastType('fail')
      return
    }

    setLoading(true)
    setToastMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/schedulevel/createSchedulevel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          EnSchEduLevelName,
          ArSchEduLevelName,
          IsDataStatus: 1,
          CreatedBy: 'USER', // Ideally get from auth context
          ModifyBy: 'USER',
        }),
      })

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      await response.json()
      setToastMessage('SchEduLevel added successfully!')
      setToastType('success')

      setTimeout(() => navigate('/admindata/schedulevel/list'), 2000)
    } catch (err) {
      console.error('Error adding SchEduLevel:', err)
      setToastMessage('Failed to add SchEduLevel.')
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Add SchEduLevel</h3>
        <button type="button" onClick={() => navigate('/admindata/schedulevel/list')} className="admin-buttonv1">
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English SchEduLevel Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnSchEduLevelName}
          onChange={(e) => setEnSchEduLevelName(e.target.value)}
          placeholder="Enter English SchEduLevel Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic SchEduLevel Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArSchEduLevelName}
          onChange={(e) => setArSchEduLevelName(e.target.value)}
          placeholder="Enter Arabic SchEduLevel Name"
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

export default AddSchEduLevelForm
