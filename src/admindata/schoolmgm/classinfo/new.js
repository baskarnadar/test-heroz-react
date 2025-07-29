import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AddClassForm = () => {
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
        <div className="txtheadertitle">Add New Class</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSave}>Save</button>
          <button className="admin-buttonv1" onClick={() => navigate('/admindata/schoolmgm/classinfo/list')}>Return</button>
        </div>
      </div>

      {/* Form */}
      <div className="divbox">
        <div className="form-group">
          <label>Class Name</label>
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
          <label>Number Of Students</label>
          <input
            className="admin-txt-box"
            type="text"
            name="numberOfStudents"
            value={formData.numberOfStudents}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSave}>Save</button>
        <button className="admin-buttonv1" onClick={() => navigate('/admindata/schoolmgm/classinfo/list')}>Cancel</button>
      </div>
    </div>
  )
}

export default AddClassForm
