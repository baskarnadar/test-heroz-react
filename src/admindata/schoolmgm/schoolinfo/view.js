import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import ToggleButtons from "../include/headermenu";  
import {
  IsAdminLoginIsValid
} from '../../../utils/operation'

const Vendor = () => {
  const navigate = useNavigate()

  // will redirect to BaseURL if token/usertype invalid
  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    clubName: '',
    email: '',
    phoneNumbers: [''],
    clubDescription: '',
    category: [],
    crNumber: '',
    taxId: '',
    street: '',
    region: '',
    zipcode: '',
    websiteURL: '',
    instagram: '',
    facebook: '',
    twitter: '',
    snapchat: '',
    tiktok: '',
    youtube: '',
    capacity: '',
    pricePerPerson: '',
    bankName: '',
    accountName: '',
    iban: '',
    adminNotes: '',
    logoFile: null,
    crDoc: null,
    taxDoc: null,
  })

  const schoolOptions = [
    { value: 'Kindergarten', label: 'Kindergarten' },
    { value: 'Elementary', label: 'Elementary' },
    { value: 'Secondary', label: 'Secondary' },
  ]
  const [active, setActive] = useState("SCHOOL");
  const countries = ['Saudi Arabia', 'UAE']
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

  const handleFileChange = (e, key) => {
    const file = e.target.files[0]
    setFormData((prev) => ({ ...prev, [key]: file }))
  }

  const handlePhoneChange = (index, value) => {
    const updatedPhones = [...formData.phoneNumbers]
    updatedPhones[index] = value
    setFormData((prev) => ({ ...prev, phoneNumbers: updatedPhones }))
  }

  const addPhoneField = () => {
    setFormData((prev) => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, ''],
    }))
  }

  const [categories, setCategories] = useState([])

  const handleCheckboxChange = (value) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  const [selectedOptions, setSelectedOptions] = useState([])
  const handleChange = (selected) => {
    setSelectedOptions(selected || [])
  }

  const btnhandleClick = (value) => {
    setActive(value);
    console.log(value);
  };
  
  return (
    <div>

      <div>
        <ToggleButtons active={active} handleClick={btnhandleClick} /> 
      </div>

      <div className="divhbg">
        {/* Left side: Title */}
        <div className="txtheadertitle">Modify School</div>

        {/* Right side: Buttons */}
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

      <div className="txtsubtitle">School Information</div>

      <div className="divbox">
        <div className="form-group">
          <label>School Name</label>
          <input className="admin-txt-box" type="text" required />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input className="admin-txt-box" type="text" required />
        </div>

        <div className="form-group">
          <label>Mobile Number 1</label>
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
          <label>Mobile Number 2</label>
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
          <label>School Description</label>

          <textarea
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="vendor-input"
            placeholder=" "
            rows={4}
          />
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            {/* Left: Commercial Registration Number */}
            <div className="vendor-column">
              <label className="vendor-label">School Level </label>
              <input
                name="crNumber"
                value={formData.crNumber}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter registration number"
              />
            </div>

            {/* Right: Upload Commercial Registration */}
            <div className="vendor-column">
              <div style={{ width: '300px' }}>
                <label style={{ marginBottom: '8px', display: 'block' }}>
                  Select Education Levels:
                </label>
                <Select
                  isMulti
                  options={schoolOptions}
                  value={selectedOptions}
                  onChange={handleChange}
                  placeholder="Choose levels..."
                />
                <div style={{ marginTop: '10px' }}>
                  <strong>Selected:</strong>{' '}
                  {selectedOptions.length > 0
                    ? selectedOptions.map((opt) => opt.label).join(', ')
                    : 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            {/* Left: Commercial Registration Number */}
            <div className="vendor-column">
              <label className="vendor-label">School Certificate </label>
              <input
                name="crNumber"
                value={formData.crNumber}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter registration number"
              />
            </div>

            {/* Right: Upload Commercial Registration */}
            <div className="vendor-column">
              <label className="vendor-label">Upload Certificate</label>
              <input type="file" onChange={handleFileChange} className="vendor-input" />
              {formData.crDoc && (
                <p className="vendor-file-name">Selected file: {formData.crDoc.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">School Location </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Address1</label>
              <input
                name="crNumber"
                value={formData.crNumber}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Street Address"
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
                name="crNumber"
                value={formData.crNumber}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Street Address"
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Country</label>
              <select
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">City</label>
              <input
                name="crNumber"
                value={formData.crNumber}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Street Address"
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Region</label>
              <input
                name="crNumber"
                value={formData.crNumber}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Region  "
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Zip Code</label>
              <input
                name="crNumber"
                value={formData.crNumber}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Region  "
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Website Address</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Website Address"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle"> Social Media Information </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Instagram</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter City"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">FaceBook</label>
              <input
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Region"
              />
            </div>
          </div>
        </div>
        {/* // row end */}

        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">X</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter City"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">SnapChat</label>
              <input
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Region"
              />
            </div>
          </div>
        </div>
        {/* // row end */}

        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">TikTok</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter City"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Youtube</label>
              <input
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Region"
              />
            </div>
          </div>
        </div>
      </div>
      {/* // row end */}

      <div className="txtsubtitle">Banking Information </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Bank Name</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Bank Name"
              />
            </div>
          </div>
        </div>
        {/* // row end */}

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Name of Account Holder</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Name of Account Holder"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">IBAN Account Number</label>
              <input
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder="Enter Price per person"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Tax Document Information </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Tax Name</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder=" "
              />
            </div>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Upload Document </label>
              <input type="file" onChange={handleFileChange} className="vendor-input" />
            </div>
          </div>
        </div>
        {/* // row end */}
      </div>

      <div className="txtsubtitle">Admin Notes Information </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Enter Admin Notes</label>
              <textarea
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="vendor-input"
                placeholder=" "
                rows={4}
              />
            </div>
          </div>
        </div>
        {/* // row end */}
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
    </div>
  )
}
export default Vendor
