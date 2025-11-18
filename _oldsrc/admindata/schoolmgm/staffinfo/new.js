import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IsAdminLoginIsValid } from '../../../utils/operation'

const StaffNewForm = () => {
  const navigate = useNavigate()

  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  const [formData, setFormData] = useState({
    className: '',
    numberOfStaffs: '',
  })

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
        <div className="txtheadertitle">Add New Staff</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSave}>
            Save
          </button>
          <button
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/schoolmgm/staffinfo/list')}
          >
            Return
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="divbox">
        <div className="form-group">
          <label>Staff ID</label>
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
          <label>Staff Name</label>
          <input
            className="admin-txt-box"
            type="text"
            name="numberOfStaffs"
            value={formData.numberOfStaffs}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            className="admin-txt-box"
            type="text"
            name="numberOfStaffs"
            value={formData.numberOfStaffs}
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

        <div className="form-group">
          <label>Role</label>
          <select className="admin-txt-box" name="schoolClass" required>
            <option value="">-- Select Role --</option>
            <option value="A">Manage Booking</option>
          </select>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSave}>
          Save
        </button>
        <button
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/schoolmgm/staffinfo/list')}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default StaffNewForm
