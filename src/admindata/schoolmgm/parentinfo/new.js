import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IsAdminLoginIsValid } from '../../../utils/operation'

const ParentNewForm = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    className: '',
    numberOfParents: '',
  })

  // will redirect to BaseURL if token/usertype invalid
  useEffect(() => {
    IsAdminLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = () => {
    // Implement save logic here (e.g., API call)
    console.log('Saving class data:', formData)
  }

  return (
    <div>
      {/* Header */}
      <div className="divhbg">
        <div className="txtheadertitle">Add New Parent</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSave}>
            Save
          </button>
          <button
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/schoolmgm/parentinfo/list')}
          >
            Return
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="divbox">
        <div className="form-group">
          <label>Parent ID</label>
          <input
            className="admin-txt-box"
            type="text"
            name="className"
            value={formData.className}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Parent Name</label>
          <input
            className="admin-txt-box"
            type="text"
            name="numberOfParents"
            value={formData.numberOfParents}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            className="admin-txt-box"
            type="text"
            name="numberOfParents"
            value={formData.numberOfParents}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Mobile Number</label>
          <div className="mobile-input-group">
            <select className="country-code-dropdown" required>
              <option value="+966">+966</option>
            </select>
            <input
              className="admin-txt-box"
              type="text"
              required
              placeholder="Enter mobile number"
            />
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSave}>
          Save
        </button>
        <button
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/schoolmgm/parentinfo/list')}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ParentNewForm
