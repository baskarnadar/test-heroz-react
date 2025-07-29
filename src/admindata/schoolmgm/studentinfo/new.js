import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const StudentNewForm = () => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    className: '',
    numberOfStudents: '',
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
        <div className="txtheadertitle">Add New Student</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSave}>
            Save
          </button>
          <button className="admin-buttonv1" onClick={() => navigate('/admindata/schoolmgm/studentinfo/list')}>
            Return
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="divbox">
        <div className="form-group">
          <label>Student ID</label>
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
          <label>Student Name</label>
          <input
            className="admin-txt-box"
            type="text"
            name="numberOfStudents"
            value={formData.numberOfStudents}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Parent Name</label>
          <input
            className="admin-txt-box"
            type="text"
            name="numberOfStudents"
            value={formData.numberOfStudents}
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
          <label>School Class</label>
          <select className="admin-txt-box" name="schoolClass" required>
            <option value="">-- Select Class --</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSave}>
          Save
        </button>
        <button className="admin-buttonv1" onClick={() => navigate('/admindata/schoolmgm/studentinfo/list')}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default StudentNewForm
