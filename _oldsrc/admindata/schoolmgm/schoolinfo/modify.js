// new.js
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage, getCurrentLoggedUserID, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation'
import FilePreview from '../../../views/widgets/FilePreview'
import { getFileNameFromUrl } from '../../../utils/operation'

import {
  validateSchoolRequired,
  normalizeMobile05,
} from '../../validation/schRequiredfld'

const Vendor = () => {
  const [SchoolIDVal, setSchoolID] = useState('')
  const [OrgtxtschImageName1Val, setOrgsetSchImageName] = useState('')
  const [OrgtxtschTaxFileNameVal, setOrgtxtschTaxFileNameVal] = useState('')
  const [OrgtxtschCertificateFileNameVal, setOrgtxtschCertificateFileNameVal] = useState('')

  const [txtschImageName1, setSchImageName] = useState(null)
  const [txtschTaxFileName, setschTaxFileName] = useState(null)
  const [txtschCertificateFileName, setschCertificateFileName] = useState('')

  const [SchoolData, SetSchool] = useState(null)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // Errors for required/format issues (keys must match validator)
  const [errors, setErrors] = useState({})

  // Form state
  const [txtschName, setSchName] = useState('')
  const [txtschEmailAddress, setSchEmailAddress] = useState('') // read-only; still submitted + validated
  const [txtschMobileNo1, setSchMobileNo1] = useState('')       // username (read-only display, validated)
  const [txtschMobileNo2, setSchMobileNo2] = useState('')

  const [txtschDesc, setSchDesc] = useState('')
  const [txtschLevel, setSchLevel] = useState('')
  const [txtschCertificateName, setCertificateName] = useState('')

  const [txtschAddress1, setAddress1] = useState('')
  const [txtschAddress2, setAddress2] = useState('')
  const [txtschCountryID, setCountryID] = useState('')
  const [txtschCityID, setSelectedCityID] = useState('')

  const [txtschRegionName, setRegionName] = useState('')
  const [txtschZipCode, setZipCode] = useState('')
  const [txtschWebsiteAddress, setWebsiteAddress] = useState('')

  const [txtschGlat, setGlat] = useState('') // Latitude
  const [txtschGlan, setGlan] = useState('') // Longitude
  const [txtschGoogleMap, setGoogleMap] = useState('')

  const [txtschInstagram, setInstagram] = useState('')
  const [txtschFaceBook, setFaceBook] = useState('')
  const [txtschX, setX] = useState('')
  const [txtschSnapChat, setSnapChat] = useState('')
  const [txtschTikTok, setTikTok] = useState('')
  const [txtschYouTube, setYouTube] = useState('')

  const [txtschBankName, setBankName] = useState('')
  const [txtschAccHolderName, setAccHolderName] = useState('')
  const [txtschAccIBANNo, setIBANNo] = useState('')
  const [txtschTaxName, setTaxName] = useState('')

  const [txtschAdminNotes, setAdminNotes] = useState('')

  // Lookups
  const [cityList, setCityList] = useState([])
  const [countries, setCountries] = useState([])
  const [educationLevels, setEducationLevels] = useState([])
  const [selectedOptions, setSelectedOptions] = useState([])

  // Generic fetch error (for top-level load failures)
  const [error, setError] = useState('')

  // ✅ Admin login validation (will redirect to BaseURL if token/usertype invalid)
  useEffect(() => {
    IsAdminLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  // ----------------------------
  // Helpers
  // ----------------------------
  const handleFileUpload = (setter) => async (e) => {
    const file = e.target.files[0]
    if (file) {
      setter(file)
      setErrors((p) => ({ ...p, txtschImageName1: '' })) // clear image error on select
    }
  }

  const getSearchParams = () => {
    const search =
      window.location.search ||
      (window.location.hash && window.location.hash.includes('?')
        ? `?${window.location.hash.split('?')[1]}`
        : '')
    return new URLSearchParams(search)
  }

  // ----------------------------
  // Submit (with required-field validation)
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setToastMessage('')
    setToastType('info')

    // Validate required fields using your shared validator
    const reqErrors = validateSchoolRequired({
      txtschName,
      txtschEmailAddress,
      txtschMobileNo1,  // read-only username still validated
      txtschAddress1,
      txtschGoogleMap,
      txtschGlan,       // Longitude
      txtschGlat,       // Latitude
      txtschAdminNotes, // Admin Notes
    })

    // Make school image REQUIRED:
    // Either an existing server image (OrgtxtschImageName1Val) OR a newly selected file must be present.
    if (!OrgtxtschImageName1Val && !(txtschImageName1 instanceof File)) {
      reqErrors.txtschImageName1 = 'School image is required.'
    }

    if (Object.keys(reqErrors).length > 0) {
      setErrors(reqErrors)
      setToastMessage('Please fix the required fields.')
      setToastType('fail')
      setLoading(false)
      return
    }

    // Username normalization (even if read-only, keep consistent with API expectations)
    const normalizedMobile = normalizeMobile05(String(txtschMobileNo1 || ''))

    // -------- File uploads ----------
    // Image
    let txtschImageName1Val = OrgtxtschImageName1Val
    try {
      if (txtschImageName1 && txtschImageName1 instanceof File) {
        const formdata = new FormData()
        formdata.append('image', txtschImageName1)
        formdata.append('foldername', 'school')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })
        if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        const uploadedImageKey1 = uploadResult?.data?.key || uploadResult?.data?.Key
        txtschImageName1Val = getFileNameFromUrl(uploadedImageKey1)
      }
    } catch (error) {
      console.error('Error uploading image file:', error)
      setToastMessage('Failed to upload image.')
      setToastType('fail')
      setLoading(false)
      return
    }

    // Tax
    let schTaxFileNameVal = OrgtxtschTaxFileNameVal
    try {
      if (txtschTaxFileName && txtschTaxFileName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', txtschTaxFileName)
        formdata.append('foldername', 'school')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })
        if (!uploadResponse.ok) throw new Error(`Tax upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        const uploadedImageKey2 = uploadResult?.data?.key || uploadResult?.data?.Key
        schTaxFileNameVal = getFileNameFromUrl(uploadedImageKey2)
      }
    } catch (error) {
      console.error('Error uploading tax file:', error)
      setToastMessage('Failed to upload tax file.')
      setToastType('fail')
      setLoading(false)
      return
    }

    // Certificate
    let schCertificateFileNameVal = OrgtxtschCertificateFileNameVal
    try {
      if (txtschCertificateFileName && txtschCertificateFileName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', txtschCertificateFileName)
        formdata.append('foldername', 'school')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })
        if (!uploadResponse.ok) throw new Error(`Certificate upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        const uploadedCRKey1 = uploadResult?.data?.key || uploadResult?.data?.Key
        schCertificateFileNameVal = getFileNameFromUrl(uploadedCRKey1)
      }
    } catch (error) {
      console.error('Error uploading certificate file:', error)
      setToastMessage('Failed to upload certificate file.')
      setToastType('fail')
      setLoading(false)
      return
    }

    // -------- Submit ----------
    try {
      const response = await fetch(`${API_BASE_URL}/schoolinfo/School/updateschool`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          SchoolID: SchoolIDVal,

          schImageName: txtschImageName1Val,
          schTaxFileName: schTaxFileNameVal,
          schCertificateFileName: schCertificateFileNameVal,

          schName: txtschName || '',
          schEmailAddress: txtschEmailAddress || '',
          schMobileNo1: normalizedMobile || '',
          schMobileNo2: txtschMobileNo2 || '',

          schDesc: txtschDesc || '',
          schLevel: txtschLevel || '',
          schEduLevel: selectedOptions.map((opt) => opt.value),
          schCertificateName: txtschCertificateName || '',

          schAddress1: txtschAddress1 || '',
          schAddress2: txtschAddress2 || '',
          schCountryID: txtschCountryID || '',
          schCityID: txtschCityID || '',
          schRegionName: txtschRegionName || '',
          schZipCode: txtschZipCode || '',
          schWebsiteAddress: txtschWebsiteAddress || '',

          schGoogleMap: txtschGoogleMap || '',
          schGlat: txtschGlat || '',
          schGlan: txtschGlan || '',

          schInstagram: txtschInstagram || '',
          schFaceBook: txtschFaceBook || '',
          schX: txtschX || '',
          schSnapChat: txtschSnapChat || '',
          schTikTok: txtschTikTok || '',
          schYouTube: txtschYouTube || '',

          schBankName: txtschBankName || '',
          schAccHolderName: txtschAccHolderName || '',
          schAccIBANNo: txtschAccIBANNo || '',
          schTaxName: txtschTaxName || '',

          schAdminNotes: txtschAdminNotes || '',

          IsDataStatus: 1,
          CreatedBy: getCurrentLoggedUserID(),
          ModifyBy: getCurrentLoggedUserID(),
        }),
      })

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      await response.json()
      setToastMessage('School Updated successfully!')
      setToastType('success')

      setTimeout(() => navigate('/admindata/schoolmgm/schoolinfo/list'), 2000)
    } catch (err) {
      console.error('Error Updated School:', err)
      setToastMessage('Failed to Updated School.')
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------
  // Fetch School (prefill)
  // ----------------------------
  const fetchSchool = async (SchoolIDValParam) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/schoolinfo/School/getSchool`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ SchoolID: SchoolIDValParam }),
      })
      if (!response.ok) throw new Error('Failed to fetch school')
      const data = await response.json()
      SetSchool(data.data || [])
    } catch (error) {
      setError('Error fetching school')
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------
  // Lookups
  // ----------------------------
  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/city/getcityalllist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      if (result.data) setCityList(result.data)
    } catch (error) {
      console.error('Error fetching city list:', error)
    }
  }

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/country/getcountrylist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      if (result.data) setCountries(result.data)
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  const fetchSchoolEducationLevels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/schedulevel/getSchedulevelAllList`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const result = await response.json()
      if (result.data) {
        const mapped = result.data.map((item) => ({
          value: item.SchEduLevelID,
          label: item.EnSchEduLevelName,
        }))
        setEducationLevels(mapped)
      }
    } catch (error) {
      console.error('Error fetching education levels:', error)
    }
  }

  // ----------------------------
  // Initial load
  // ----------------------------
  useEffect(() => {
    const urlParams = getSearchParams()
    const SchoolIDFromUrl = urlParams.get('SchoolID')

    fetchCountries()
    fetchSchoolEducationLevels()
    fetchCities()

    if (SchoolIDFromUrl) {
      setSchoolID(SchoolIDFromUrl)
      fetchSchool(SchoolIDFromUrl)
    } else {
      setError('SchoolID is missing in URL')
    }
  }, [])

  // ----------------------------
  // Populate form when SchoolData arrives
  // ----------------------------
  useEffect(() => {
    if (!SchoolData) return

    // Files (string URLs or File—FilePreview handles both)
    setSchImageName(SchoolData.schImageNameUrl)
    setschTaxFileName(SchoolData.schTaxFileNameUrl)
    setschCertificateFileName(SchoolData.schCertificateFileNameUrl)

    setOrgsetSchImageName(SchoolData.schImageName || '')
    setOrgtxtschTaxFileNameVal(SchoolData.schTaxFileName || '')
    setOrgtxtschCertificateFileNameVal(SchoolData.schCertificateFileName || '')

    // Core fields
    setSchName(SchoolData.schName || '')
    setSchEmailAddress(SchoolData.schEmailAddress || '')
    setSchMobileNo1(SchoolData.schMobileNo1 || '')
    setSchMobileNo2(SchoolData.schMobileNo2 || '')

    setSchDesc(SchoolData.schDesc || '')
    setSchLevel(SchoolData.schLevel || '')
    setCertificateName(SchoolData.schCertificateName || '')

    setAddress1(SchoolData.schAddress1 || '')
    setAddress2(SchoolData.schAddress2 || '')

    setCountryID(SchoolData.schCountryID || '')
    setSelectedCityID(SchoolData.schCityID || '')

    setRegionName(SchoolData.schRegionName || '')
    setZipCode(SchoolData.schZipCode || '')
    setWebsiteAddress(SchoolData.schWebsiteAddress || '')
    setGoogleMap(SchoolData.schGoogleMap || '')

    setGlat(SchoolData.schGlat || '')
    setGlan(SchoolData.schGlan || '')

    setInstagram(SchoolData.schInstagram || '')
    setFaceBook(SchoolData.schFaceBook || '')
    setX(SchoolData.schX || '')
    setSnapChat(SchoolData.schSnapChat || '')
    setTikTok(SchoolData.schTikTok || '')
    setYouTube(SchoolData.schYouTube || '')

    setBankName(SchoolData.schBankName || '')
    setAccHolderName(SchoolData.schAccHolderName || '')
    setIBANNo(SchoolData.schAccIBANNo || '')
    setTaxName(SchoolData.schTaxName || '')
    setAdminNotes(SchoolData.schAdminNotes || '')
  }, [SchoolData])

  // Education levels multi-select
  const handleChange = (selected) => setSelectedOptions(selected || [])

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div>
      <div className="divhbg">
        <div className="txtheadertitle">Update School</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/schoolmgm/schoolinfo/list')}
          >
            Return
          </button>
        </div>
      </div>

      {/* Username + Email (email next to username, both read-only) */}
      <div className="divbox" style={{ marginTop: 12 }}>
        <div className="form-group">
          <label>
            <span style={{ color: 'red', padding: '10px', fontSize: '22px', fontWeight: 'bold' }}>
              username
            </span>
          </label>
          <div
            className="mobile-input-group"
            style={{
              border: '1px solid #ccc',
              borderRadius: '12px',
              padding: '10px',
              fontSize: '18px',
              fontWeight: '600',
              background: '#f8f8f8',
            }}
            title="Mobile username (read-only)"
          >
            {txtschMobileNo1}
          </div>
          <div className="ErrorMsg">{errors.txtschMobileNo1}</div>
        </div>

        <div className="form-group" style={{ marginTop: 8 }}>
          <label>Email Address</label>
          <input
            name="txtschEmailAddress"
            className="admin-txt-box"
            type="text"
            value={txtschEmailAddress}
            readOnly
            disabled
            style={{ background: '#f0f0f0', color: '#555' }}
            title="Email (read-only)"
          />
          <div className="ErrorMsg">{errors.txtschEmailAddress}</div>
        </div>
      </div>

      <div className="txtsubtitle">School Information</div>

      <div className="divbox">
        <div className="form-group">
          <label>School Name</label>
          <input
            name="txtschName"
            className="admin-txt-box"
            placeholder="Enter School Name"
            type="text"
            value={txtschName}
            onChange={(e) => {
              setSchName(e.target.value)
              setErrors((p) => ({ ...p, txtschName: '' }))
            }}
          />
          <div className="ErrorMsg">{errors.txtschName}</div>
        </div>

        {/* School main image (REQUIRED) */}
        <div className="form-group">
          <label>School Image</label>
          <input
            name="txtschImageName1"
            className="admin-txt-box"
            placeholder="Upload School Image"
            type="file"
            accept="image/*"
            onChange={handleFileUpload(setSchImageName)}
            style={{ height: 50, width: '100%' }}
          />
          <FilePreview file={txtschImageName1 || (OrgtxtschImageName1Val ? SchoolData?.schImageNameUrl : null)} />
          <div className="ErrorMsg">{errors.txtschImageName1}</div>
        </div>

        <div className="form-group">
          <label>Mobile Number 2</label>
          <div className="mobile-input-group">
            <input
              name="txtschMobileNo2"
              className="admin-txt-box"
              type="text"
              value={txtschMobileNo2}
              placeholder="Enter mobile number 2"
              onChange={(e) => setSchMobileNo2(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>School Description</label>
          <textarea
            name="txtschDesc"
            className="vendor-input"
            placeholder="Enter School Description"
            rows={4}
            value={txtschDesc}
            onChange={(e) => setSchDesc(e.target.value)}
          />
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">School Level</label>
              <input
                name="txtschLevel"
                value={txtschLevel}
                className="vendor-input"
                placeholder="Enter School Level"
                onChange={(e) => setSchLevel(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <div style={{ width: 300 }}>
                <label style={{ marginBottom: 8, display: 'block' }}>
                  Select Education Levels:
                </label>
                <Select
                  name="txtschEduLevel"
                  isMulti
                  options={educationLevels}
                  value={selectedOptions}
                  onChange={(sel) => setSelectedOptions(sel || [])}
                  placeholder="Choose levels..."
                />
                <div style={{ marginTop: 10 }}>
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
            <div className="vendor-column">
              <label className="vendor-label">School Certificate</label>
              <input
                name="txtschCertificateName"
                value={txtschCertificateName}
                className="vendor-input"
                placeholder="Enter School Certificate"
                onChange={(e) => setCertificateName(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Upload Certificate</label>
              <input
                name="txtschCertificateFileName"
                type="file"
                onChange={handleFileUpload(setschCertificateFileName)}
                className="vendor-input"
              />
              <FilePreview file={txtschCertificateFileName} />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">School Location</div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Address1</label>
              <input
                name="txtschAddress1"
                value={txtschAddress1}
                className="vendor-input"
                placeholder="Enter Street Address1"
                onChange={(e) => {
                  setAddress1(e.target.value)
                  setErrors((p) => ({ ...p, txtschAddress1: '' }))
                }}
              />
              <div className="ErrorMsg">{errors.txtschAddress1}</div>
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
                onChange={(e) => setAddress2(e.target.value)}
                name="txtschAddress2"
                value={txtschAddress2}
                className="vendor-input"
                placeholder="Enter Street Address2"
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Country</label>
              <select
                value={txtschCountryID}
                onChange={(e) => setCountryID(e.target.value)}
                name="txtschCountryID"
                style={{ width: '100%', padding: '10px', borderRadius: '4px' }}
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.CountryID} value={country.CountryID}>
                    {country.EnCountryName}
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
              <select
                name="txtschCityID"
                className="admin-txt-box"
                value={txtschCityID}
                onChange={(e) => setSelectedCityID(e.target.value)}
              >
                <option value="">Select City</option>
                {cityList.map((city) => (
                  <option key={city.CityID} value={city.CityID}>
                    {city.EnCityName}
                  </option>
                ))}
              </select>
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Region</label>
              <input
                name="txtschRegionName"
                className="vendor-input"
                placeholder="Enter Region"
                value={txtschRegionName}
                onChange={(e) => setRegionName(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Zip Code</label>
              <input
                name="txtschZipCode"
                className="vendor-input"
                placeholder="Enter Zip Code"
                value={txtschZipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Website Address</label>
              <input
                onChange={(e) => setWebsiteAddress(e.target.value)}
                value={txtschWebsiteAddress}
                name="txtschWebsiteAddress"
                className="vendor-input"
                placeholder="Enter Website Address"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Google Map Location</label>
              <input
                onChange={(e) => {
                  setGoogleMap(e.target.value)
                  setErrors((p) => ({ ...p, txtschGoogleMap: '' }))
                }}
                name="txtschGoogleMap"
                value={txtschGoogleMap}
                className="vendor-input"
                placeholder="Enter Google Map Location"
              />
              <div className="ErrorMsg">{errors.txtschGoogleMap}</div>
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">School Longitude</label>
              <input
                value={txtschGlan}
                name="txtschGlan"
                className="vendor-input"
                placeholder="Enter Longitude"
                onChange={(e) => {
                  setGlan(e.target.value)
                  setErrors((p) => ({ ...p, txtschGlan: '' }))
                }}
              />
              <div className="ErrorMsg">{errors.txtschGlan}</div>
            </div>

            <div className="vendor-column">
              <label className="vendor-label">School Latitude</label>
              <input
                value={txtschGlat}
                name="txtschGlat"
                className="vendor-input"
                placeholder="Enter Latitude"
                onChange={(e) => {
                  setGlat(e.target.value)
                  setErrors((p) => ({ ...p, txtschGlat: '' }))
                }}
              />
              <div className="ErrorMsg">{errors.txtschGlat}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Social Media Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Instagram</label>
              <input
                onChange={(e) => setInstagram(e.target.value)}
                name="txtschInstagram"
                value={txtschInstagram}
                className="vendor-input"
                placeholder="Enter Instagram"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">FaceBook</label>
              <input
                value={txtschFaceBook}
                onChange={(e) => setFaceBook(e.target.value)}
                name="txtschFaceBook"
                className="vendor-input"
                placeholder="Enter FaceBook"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">X</label>
              <input
                onChange={(e) => setX(e.target.value)}
                name="txtschX"
                value={txtschX}
                className="vendor-input"
                placeholder="Enter X"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">SnapChat</label>
              <input
                onChange={(e) => setSnapChat(e.target.value)}
                name="txtschSnapChat"
                value={txtschSnapChat}
                className="vendor-input"
                placeholder="Enter SnapChat"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">TikTok</label>
              <input
                value={txtschTikTok}
                onChange={(e) => setTikTok(e.target.value)}
                name="txtschTikTok"
                className="vendor-input"
                placeholder="Enter TikTok"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Youtube</label>
              <input
                value={txtschYouTube}
                onChange={(e) => setYouTube(e.target.value)}
                name="txtschYouTube"
                className="vendor-input"
                placeholder="Enter Youtube"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Banking Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Bank Name</label>
              <input
                value={txtschBankName}
                onChange={(e) => setBankName(e.target.value)}
                name="txtschBankName"
                className="vendor-input"
                placeholder="Enter Bank Name"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Name of Account Holder</label>
              <input
                value={txtschAccHolderName}
                name="txtschAccHolderName"
                className="vendor-input"
                placeholder="Enter Name of Account Holder"
                onChange={(e) => setAccHolderName(e.target.value)}
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">IBAN Account Number</label>
              <input
                value={txtschAccIBANNo}
                onChange={(e) => setIBANNo(e.target.value)}
                name="txtschAccIBANNo"
                className="vendor-input"
                placeholder="Enter IBAN Account Number"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Tax Document Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Tax Name</label>
              <input
                onChange={(e) => setTaxName(e.target.value)}
                value={txtschTaxName}
                name="txtschTaxName"
                className="vendor-input"
                placeholder="Tax Document Information"
              />
            </div>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Upload Document</label>
              <input
                name="txtschTaxFileName"
                type="file"
                onChange={handleFileUpload(setschTaxFileName)}
                className="vendor-input"
              />
              <FilePreview file={txtschTaxFileName} />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Admin Notes Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Enter Admin Notes</label>
              <textarea
                onChange={(e) => {
                  setAdminNotes(e.target.value)
                  setErrors((p) => ({ ...p, txtschAdminNotes: '' }))
                }}
                value={txtschAdminNotes}
                name="txtschAdminNotes"
                className="vendor-input"
                placeholder="Enter Admin Notes"
                rows={4}
              />
              <div className="ErrorMsg">{errors.txtschAdminNotes}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/schoolmgm/schoolinfo/list')}
        >
          Cancel
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default Vendor
