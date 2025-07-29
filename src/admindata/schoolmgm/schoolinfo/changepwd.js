import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage,getCurrentLoggedUserID } from '../../../utils/operation'
const Vendor = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')
  const [schoolID, setSchoolID] = useState(null)
  const [loading, setLoading] = useState(false)
  const [schoolinfo, setSchoolinfo] = useState(null) // Changed to single object
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    newpassword: '',
    daysAvailable: {},
  })

  // Extract SchoolID from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const id = params.get('SchoolID')
    setSchoolID(id)
  }, [location])

  // Fetch school info when schoolID is available
  useEffect(() => {
    if (schoolID) {
      fetchSchoolinfo(schoolID)
    }
  }, [schoolID])

  const updateSchoolPwd = async (SchoolID, usernameval, newpasswordval) => {
  setLoading(true)
  setError(null)



  try {
    const response = await fetch(`${API_BASE_URL}/schoolinfo/school/updatepwd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prtuserid: SchoolID,
        username: usernameval,
        password: newpasswordval,
        ModifyBy: getCurrentLoggedUserID(),
      }),
    })

    console.log("response.ok:", response.ok)

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update password')
    }

    console.log('Update response:', data)

    setToastMessage('Password successfully updated')
    setToastType('success')

    // ✅ Redirect to list page after short delay
    setTimeout(() => {
      navigate('/admindata/schoolmgm/schoolinfo/list')
    }, 2000)

  } catch (err) {
    console.error("Error updating password:", err)
    setToastMessage('Error updating password')
    setToastType('fail')
  } finally {
    setLoading(false)
  }
}

  const fetchSchoolinfo = async (SchoolID) => {
    setLoading(true)
    setError(null)
    console.log(`${API_BASE_URL}/schoolinfo/school/getschool`)
    try {
      const response = await fetch(`${API_BASE_URL}/schoolinfo/school/getschool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SchoolID }),
      })
      console.log('response')
      console.log(response)
      if (!response.ok) {
        throw new Error('Failed to fetch school info')
      }

      const data = await response.json()
      console.log(data.data)
      // Assuming your API returns an object for a single school or data.data[0]
      setSchoolinfo(data.data || null)
    } catch (err) {
      setError('Error fetching school info')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name.startsWith('day_')) {
      const day = name.split('_')[1]
      setFormData((prev) => ({
        ...prev,
        daysAvailable: { ...prev.daysAvailable, [day]: checked },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Redirect to login if no token found
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const handleUpdateClick = (e) => {
    e.preventDefault()
    if (!formData.newpassword) {
      setError('Please enter a new password')
      return
    }
    console.log("formData.newpassword");
     console.log(formData.newpassword)
    updateSchoolPwd(schoolID, schoolinfo.schMobileNo1 , formData.newpassword)
  }
  return (
    <form onSubmit={handleUpdateClick}>
      <div>
        {schoolinfo ? (
          <>
            <div className="divhbg">
              <div className="txtheadertitle">Change Password</div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="admin-buttonv1">Update</button>
                <button
                  type="button"
                  className="admin-buttonv1"
                  onClick={() => navigate('/admindata/schoolmgm/schoolinfo/list')}
                >
                  Return
                </button>
              </div>
            </div>
            <div className="divbox">
              <div className="form-group">
                <h4>School Name : {schoolinfo.schName}</h4>
                <label>User Name : {schoolinfo.schMobileNo1}</label>

                <div className="form-group">
                  <label>Enter New Password</label>
                  <input
                    className="admin-txt-box"
                    type="password"
                    name="newpassword"
                    value={formData.newpassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
              </div>
            </div>
            <div className="button-container">
              <button className="admin-buttonv1">Update</button>
              <button
                type="button"
                className="admin-buttonv1"
                onClick={() => navigate('/admindata/schoolmgm/schoolinfo/list')}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <p>No school info available</p>
        )}

        {loading && <p>Loading school info...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  )
}

export default Vendor
