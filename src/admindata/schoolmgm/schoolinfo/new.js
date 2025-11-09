// new.js
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation'
import FilePreview from '../../../views/widgets/FilePreview'
import { getFileNameFromUrl } from '../../../utils/operation'
import { checkUserExists, checkSchUserExists } from '../../../utils/auth'

// 🔗 REQUIRED-FIELDS VALIDATOR (separate file)
import {
  validateSchoolRequired,
  normalizeMobile05,
} from '../../validation/schRequiredfld'

// Local regex (for live checks before submit)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_05_RE = /^05\d{8}$/

// ===== Debug helpers =====
const pretty = (v) => {
  try { return JSON.stringify(v, null, 2) } catch { return String(v) }
}

const safeParseJson = async (resp) => {
  const raw = await resp.text() // works for JSON or non-JSON
  try {
    const json = raw ? JSON.parse(raw) : null
    return { json, raw }
  } catch {
    return { json: null, raw }
  }
}

const logApi = (label, meta, body) => {
  console.groupCollapsed(`%c${label}`, 'color:#6A1B9A;font-weight:bold')
  if (meta) console.log('meta:', meta)
  if (body !== undefined) console.log('body:', body)
  console.groupEnd()
}

const Vendor = () => {
  const navigate = useNavigate()

  // ✅ Admin login validation (will redirect to BaseURL if token/usertype invalid)
  useEffect(() => {
    IsAdminLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  // Inline errors (required, format, etc.)
  const [errors, setErrors] = useState({})

  // Uniqueness check states
  const [ErrorUserExistMsg, setUserExists] = useState('') // string message if exists
  const [checking, setChecking] = useState(false)         // async check in progress
  const [uniqueOk, setUniqueOk] = useState(false)         // true only when both are unique

  // UI/submit states
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // Files
  const [schImageName, setschImageName] = useState(null)
  const [schCertificateFileName, setschCertificateFileName] = useState(null)
  const [vdrCRFileName, setvdrCRCertificateFileName] = useState(null) // kept if needed later
  const [schTaxFileName, setschTaxFileName] = useState(null)

  // Form state
  const [txtschName, setSchName] = useState('')
  const [txtschEmailAddress, setSchEmailAddress] = useState('')
  const [txtschMobileNo1, setSchMobileNo1] = useState('')
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
  const [txtschGoogleMap, setschGoogleMap] = useState('')

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

  const [cityList, setCityList] = useState([])
  const [countries, setCountries] = useState([])
  const [educationLevels, setEducationLevels] = useState([])
  const [selectedOptions, setSelectedOptions] = useState([])

  const [categories, setCategories] = useState([]) // kept for future

  // ===== Debug state =====
  const [debugOpen, setDebugOpen] = useState(false)
  const [lastRequest, setLastRequest] = useState(null)   // { url, method, headers, body }
  const [lastResponse, setLastResponse] = useState(null) // { httpStatus, ok, body, parsed }

  // ----------------------------
  // Helpers
  // ----------------------------
  const handleFileUpload = (setter) => async (e) => {
    const file = e.target.files[0]
    if (file) {
      setter(file)
      // clear image error if selecting school image
      setErrors((p) => ({ ...p, schImageName: '' }))
    }
  }

  const handleFileChange = (e, key) => {
    const file = e.target.files[0]
    if (!file) return
    if (key === 'certificate') setschCertificateFileName(file)
    else if (key === 'tax') setschTaxFileName(file)
    else if (key === 'image') {
      setschImageName(file)
      setErrors((p) => ({ ...p, schImageName: '' }))
    }
  }

  const handleCheckboxChange = (value) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  const handleChangeLevels = (selected) => {
    setSelectedOptions(selected || [])
  }

  // ----------------------------
  // Pre-submit uniqueness check (mobile + email)
  // ----------------------------
  const runUniquenessCheck = async (mobileVal, emailVal) => {
    // Require valid patterns before checking server
    const emailOK = EMAIL_RE.test(String(emailVal || '').trim())
    const normalizedMobile = normalizeMobile05(String(mobileVal || ''))
    const mobileOK = MOBILE_05_RE.test(normalizedMobile)

    if (!emailOK || !mobileOK) {
      setUniqueOk(false)
      return
    }

    setChecking(true)
    setUserExists('')
    try {
      const exists = await checkSchUserExists(normalizedMobile, String(emailVal).trim())
      if (exists) {
        setUniqueOk(false)
        setUserExists('Mobile number or email already exists. Please use different details.')
      } else {
        setUniqueOk(true)
        setUserExists('')
      }
    } catch (e) {
      setUniqueOk(false)
      setUserExists('Could not verify uniqueness right now. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  // Debounced check while typing (500ms)
  useEffect(() => {
    const id = setTimeout(() => {
      runUniquenessCheck(txtschMobileNo1, txtschEmailAddress)
    }, 500)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txtschMobileNo1, txtschEmailAddress])

  // On blur, trigger immediate check
  const handleMobileBlur = () => runUniquenessCheck(txtschMobileNo1, txtschEmailAddress)
  const handleEmailBlur = () => runUniquenessCheck(txtschMobileNo1, txtschEmailAddress)

  // ----------------------------
  // Submit
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setToastMessage('')
    setToastType('info')

    // 1) Required-fields validation
    const reqErrors = validateSchoolRequired({
      txtschName,
      txtschEmailAddress,
      txtschMobileNo1,
      txtschAddress1,
      txtschGoogleMap,
      txtschGlan,
      txtschGlat,
      txtschAdminNotes,
    })

    // 🔴 Make SCHOOL IMAGE REQUIRED for "Add New"
    if (!(schImageName instanceof File)) {
      reqErrors.schImageName = 'School image is required.'
    }

    if (Object.keys(reqErrors).length > 0) {
      setErrors(reqErrors)
      setToastMessage('Please fix the required fields.')
      setToastType('fail')
      setLoading(false)
      return
    }

    // 2) Normalize and FINAL uniqueness check before submit
    const mobileForSubmit = normalizeMobile05(txtschMobileNo1)
    if (mobileForSubmit !== txtschMobileNo1) {
      setSchMobileNo1(mobileForSubmit)
    }

    try {
      setChecking(true)
      const exists = await checkSchUserExists(mobileForSubmit, txtschEmailAddress)

      if (exists) {
        setUserExists('Username/email already exists. Please change mobile or email.')
        setChecking(false)
        setLoading(false)
        return
      }
      setUserExists('')
    } catch (ex) {
      setUserExists('Could not verify username/email at the moment.')
      setChecking(false)
      setLoading(false)
      return
    } finally {
      setChecking(false)
    }

    // 3) Upload files (image, tax, certificate)
    let schImageNameVal = ''
    try {
      if (schImageName && schImageName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', schImageName)
        formdata.append('foldername', 'school')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })
        if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        const uploadedImageKey = uploadResult?.data?.key || uploadResult?.data?.Key || ''
        schImageNameVal = getFileNameFromUrl(uploadedImageKey)
      }
    } catch (error) {
      console.error('Error uploading school image:', error)
      setToastMessage('Failed to upload school image.')
      setToastType('fail')
      setLoading(false)
      return
    }

    let schTaxFileNameVal = ''
    try {
      if (schTaxFileName && schTaxFileName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', schTaxFileName)
        formdata.append('foldername', 'school')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })
        if (!uploadResponse.ok) throw new Error(`Tax upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        const uploadedImageKey1 = uploadResult?.data?.key || uploadResult?.data?.Key || ''
        schTaxFileNameVal = getFileNameFromUrl(uploadedImageKey1)
      }
    } catch (error) {
      console.error('Error uploading tax file:', error)
      setToastMessage('Failed to upload tax file.')
      setToastType('fail')
      setLoading(false)
      return
    }

    let schCertificateFileNameVal = ''
    try {
      if (schCertificateFileName && schCertificateFileName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', schCertificateFileName)
        formdata.append('foldername', 'school')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })
        if (!uploadResponse.ok) throw new Error(`Certificate upload failed: ${uploadResponse.status}`)
        const uploadResult = await response.json()
        const uploadedCRKey1 = uploadResult?.data?.key || uploadResult?.data?.Key || ''
        schCertificateFileNameVal = getFileNameFromUrl(uploadedCRKey1)
      }
    } catch (error) {
      console.error('Error uploading certificate file:', error)
      setToastMessage('Failed to upload certificate file.')
      setToastType('fail')
      setLoading(false)
      return
    }

    // 4) Submit (DEBUG-ENABLED)
    try {
      const payload = {
        schName: txtschName || '',
        schImageName: schImageNameVal,
        schTaxFileName: schTaxFileNameVal,
        schCertificateFileName: schCertificateFileNameVal,

        schEmailAddress: txtschEmailAddress || '',
        schMobileNo1: mobileForSubmit || '',
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
        CreatedBy: 'USER',
        ModifyBy: 'USER',
      }

      const reqInit = {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }

      const url = `${API_BASE_URL}/schoolinfo/School/createSchool`

      // Save request snapshot for debug panel
      setLastRequest({
        url,
        method: reqInit.method,
        headers: reqInit.headers,
        body: payload,
      })

      console.time('createSchool')
      const response = await fetch(url, reqInit)
      console.timeEnd('createSchool')

      // Parse body safely—works for JSON or plain text
      const { json: parsed, raw } = await safeParseJson(response)

      // Save response snapshot for debug panel
      setLastResponse({
        httpStatus: response.status,
        ok: response.ok,
        body: raw,
        parsed,
      })

      // Console debugging
      logApi('createSchool → RESPONSE', { status: response.status, ok: response.ok }, parsed ?? raw)

      if (!response.ok) {
        const serverMsg = parsed?.message || 'Failed to add School.'
        throw new Error(`${serverMsg} (HTTP ${response.status})`)
      }

      const successMsg =
        parsed?.message ||
        (typeof parsed === 'object' && parsed ? 'School added successfully!' : 'School added successfully!')

      setToastMessage(successMsg)
      setToastType('success')

      // Auto-open the debug panel on success so you can inspect the API reply
      setDebugOpen(true)

      setTimeout(() => navigate('/admindata/schoolmgm/schoolinfo/list'), 2000)
    } catch (err) {
      console.error('Error adding School:', err)
      setToastMessage(String(err?.message || 'Failed to add School.'))
      setToastType('fail')
      // Also auto-open the debug panel on failure
      setDebugOpen(true)
    } finally {
      setLoading(false)
    }
  }

  // ----------------------------
  // Effects: lookups
  // ----------------------------
  useEffect(() => {
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
        const response = await fetch(
          `${API_BASE_URL}/lookupdata/schedulevel/getSchedulevelAllList`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          },
        )
        const result = await response.json()
        if (result.data) {
          const mappedLevels = result.data.map((item) => ({
            value: item.SchEduLevelID,
            label: item.EnSchEduLevelName,
          }))
          setEducationLevels(mappedLevels)
        }
      } catch (error) {
        console.error('Error fetching education levels:', error)
      }
    }

    fetchCities()
    fetchCountries()
    fetchSchoolEducationLevels()
  }, [])

  // ----------------------------
  // Derived: validity for Save button
  // ----------------------------
  const normalizedMobileLive = normalizeMobile05(txtschMobileNo1)
  const mobileValidLive = MOBILE_05_RE.test(normalizedMobileLive)
  const emailValidLive = EMAIL_RE.test(String(txtschEmailAddress || '').trim())
  const bothFieldsValid = mobileValidLive && emailValidLive

  // Disable Save only when both fields are valid but uniqueness hasn't passed (or we’re checking)
  const saveDisabled = loading || checking || (bothFieldsValid && !uniqueOk)

  // Small UI helper for copy
  const copy = async (txt) => {
    try { await navigator.clipboard.writeText(txt) } catch {}
  }

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div>
      <div className="divhbg">
        <div className="txtheadertitle">Add New School</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSubmit} disabled={saveDisabled}>
            {loading ? 'Saving…' : checking ? 'Checking…' : 'Save'}
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

      <div className="txtsubtitle">School Information</div>

      <div className="divbox">
        <div className="form-group">
          <label>School Name</label>
          <input
            name="txtschName"
            className="admin-txt-box"
            placeholder="Enter School Name"
            type="text"
            required
            onChange={(e) => {
              setSchName(e.target.value)
              setErrors((p) => ({ ...p, txtschName: '' }))
            }}
          />
          <div className="ErrorMsg">{errors.txtschName}</div>
        </div>

        {/* 🔴 School image is REQUIRED */}
        <input
          name="txtschImageName"
          className="admin-txt-box"
          placeholder="Upload Vendor Image"
          type="file"
          accept="image/*"
          onChange={handleFileUpload(setschImageName)}
          style={{ height: 50, width: '100%' }}
        />
        <FilePreview file={schImageName} />
        <div className="ErrorMsg">{errors.schImageName}</div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            name="txtschEmailAddress"
            placeholder="Enter Email Address"
            className="admin-txt-box"
            type="text"
            required
            value={txtschEmailAddress}
            onChange={(e) => {
              setSchEmailAddress(e.target.value)
              setErrors((p) => ({ ...p, txtschEmailAddress: '' }))
              setUserExists('') // clear uniqueness message while editing
            }}
            onBlur={handleEmailBlur}
          />
        <div className="ErrorMsg">
            {errors.txtschEmailAddress || (!uniqueOk && ErrorUserExistMsg)}
          </div>
        </div>

        <div className="form-group">
          <label>
            Mobile Number 1 <span style={{ color: 'red' }}>[username]</span>
          </label>

          <div className="mobile-input-group">
            <input
              name="txtschMobileNo1"
              className="admin-txt-box"
              type="text"
              required
              placeholder="Enter mobile number1"
              value={txtschMobileNo1}
              onChange={(e) => {
                setSchMobileNo1(e.target.value)
                setErrors((p) => ({ ...p, txtschMobileNo1: '' }))
                setUserExists('') // clear uniqueness message while editing
              }}
              onBlur={() => {
                const n = normalizeMobile05(txtschMobileNo1)
                if (n && n !== txtschMobileNo1) setSchMobileNo1(n)
                handleMobileBlur()
              }}
              inputMode="numeric"
              maxLength={10}
              pattern="^05\\d{8}$"
              title="Must be 10 digits and start with 05"
            />
          </div>

          <div className="ErrorMsg">{errors.txtschMobileNo1 || (!uniqueOk && ErrorUserExistMsg)}</div>
        </div>

        <div className="form-group">
          <label>Mobile Number 2</label>
          <div className="mobile-input-group">
            <input
              name="txtschMobileNo2"
              className="admin-txt-box"
              type="text"
              placeholder="Enter mobile number2"
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
            onChange={(e) => setSchDesc(e.target.value)}
            required
          />
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">School Level </label>
              <input
                name="txtschLevel"
                className="vendor-input"
                placeholder="Enter School Level"
                onChange={(e) => setSchLevel(e.target.value)}
                required
              />
            </div>

            <div className="vendor-column">
              <div style={{ width: '300px' }}>
                <label style={{ marginBottom: '8px', display: 'block' }}>
                  Select Education Levels:
                </label>
                <Select
                  name="txtschEduLevel"
                  isMulti
                  options={educationLevels}
                  value={selectedOptions}
                  onChange={handleChangeLevels}
                  placeholder="Choose levels..."
                  required
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
            <div className="vendor-column">
              <label className="vendor-label">School Certificate </label>
              <input
                name="txtschCertificateName"
                className="vendor-input"
                placeholder="Enter School Certificate"
                onChange={(e) => setCertificateName(e.target.value)}
              />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">School Certificate Upload</label>
              <input
                name="txtschCertificateFileName"
                className="admin-txt-box"
                placeholder="Upload Vendor Image"
                type="file"
                onChange={handleFileUpload(setschCertificateFileName)}
                style={{ height: 50, width: '100%' }}
              />
              <FilePreview file={schCertificateFileName} />
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
                name="txtschAddress1"
                className="vendor-input"
                placeholder="Enter Street Address1"
                onChange={(e) => {
                  setAddress1(e.target.value)
                  setErrors((p) => ({ ...p, txtschAddress1: '' }))
                }}
                required
              />
              <div className="ErrorMsg">{errors.txtschAddress1}</div>
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
                onChange={(e) => setAddress2(e.target.value)}
                name="txtschAddress2"
                className="vendor-input"
                placeholder="Enter Street Address2"
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Country</label>
              <select
                onChange={(e) => setCountryID(e.target.value)}
                name="txtschCountryID"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                }}
                required
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
                onChange={(e) => setSelectedCityID(e.target.value)}
                required
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
                onChange={(e) => setRegionName(e.target.value)}
                required
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Zip Code</label>
              <input
                name="txtschZipCode"
                className="vendor-input"
                placeholder="Enter Zip Code"
                onChange={(e) => setZipCode(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Website Address</label>
              <input
                onChange={(e) => setWebsiteAddress(e.target.value)}
                name="txtschWebsiteAddress"
                className="vendor-input"
                placeholder="Enter Website Address"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Google Map Location</label>
              <input
                onChange={(e) => {
                  setschGoogleMap(e.target.value)
                  setErrors((p) => ({ ...p, txtschGoogleMap: '' }))
                }}
                name="txtschGoogleMap"
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
                name="txtschGLan"
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
              <label className="vendor-label">School Lattitude</label>
              <input
                name="txtschGlat"
                className="vendor-input"
                placeholder="Enter Lattitude"
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

      <div className="txtsubtitle"> Social Media Information </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Instagram</label>
              <input
                onChange={(e) => setInstagram(e.target.value)}
                name="txtschInstagram"
                className="vendor-input"
                placeholder="Enter Instagram"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">FaceBook</label>
              <input
                onChange={(e) => setFaceBook(e.target.value)}
                name="txtschFaceBook"
                className="vendor-input"
                placeholder="Enter FaceBook"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">X</label>
              <input
                onChange={(e) => setX(e.target.value)}
                name="txtschX"
                className="vendor-input"
                placeholder="Enter X"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">SnapChat</label>
              <input
                onChange={(e) => setSnapChat(e.target.value)}
                name="txtschSnapChat"
                className="vendor-input"
                placeholder="Enter SnapChat"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">TikTok</label>
              <input
                onChange={(e) => setTikTok(e.target.value)}
                name="txtschTikTok"
                className="vendor-input"
                placeholder="Enter TikTok"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Youtube</label>
              <input
                onChange={(e) => setYouTube(e.target.value)}
                name="txtschYouTube"
                className="vendor-input"
                placeholder="Enter Youtube"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Banking Information </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Bank Name</label>
              <input
                onChange={(e) => setBankName(e.target.value)}
                name="txtschBankName"
                className="vendor-input"
                placeholder="Enter Bank Name"
                required
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Name of Account Holder</label>
              <input
                required
                name="txtschAccHolderName"
                className="vendor-input"
                placeholder="Enter Name of Account Holder"
                onChange={(e) => setAccHolderName(e.target.value)}
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">IBAN Account Number</label>
              <input
                onChange={(e) => setIBANNo(e.target.value)}
                name="txtschAccIBANNo"
                className="vendor-input"
                placeholder="Enter IBAN Account Number"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Tax Document Information </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Tax Name</label>
              <input
                onChange={(e) => setTaxName(e.target.value)}
                name="txtschTaxName"
                className="vendor-input"
                placeholder="Tax Document Information"
                required
              />
            </div>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Tax Upload Document</label>
              <input
                name="txtschTaxFileName"
                className="admin-txt-box"
                placeholder="Upload Tax Image"
                type="file"
                onChange={handleFileUpload(setschTaxFileName)}
                style={{ height: 50, width: '100%' }}
              />
              <FilePreview file={schTaxFileName} />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Admin Notes Information </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Enter Admin Notes</label>
              <textarea
                onChange={(e) => {
                  setAdminNotes(e.target.value)
                  setErrors((p) => ({ ...p, txtschAdminNotes: '' }))
                }}
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

      {/* Buttons */}
      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSubmit} disabled={saveDisabled}>
          {loading ? 'Saving…' : checking ? 'Checking…' : 'Save'}
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/schoolmgm/schoolinfo/list')}
        >
          Cancel
        </button>
      </div>

      {/* ===== DEBUG PANEL ===== */}
      <div style={{ marginTop: 16, borderTop: '1px dashed #ccc', paddingTop: 12 }}>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => setDebugOpen((v) => !v)}
          style={{ background: debugOpen ? '#6A1B9A' : undefined }}
        >
          {debugOpen ? 'Hide' : 'Show'} API Debug
        </button>

        {debugOpen && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              background: '#fafafa',
              border: '1px solid #eee',
              borderRadius: 8,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 360px', minWidth: 320 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Last Request</div>
                {lastRequest ? (
                  <>
                    <div><b>URL:</b> {lastRequest.url}</div>
                    <div><b>Method:</b> {lastRequest.method}</div>
                    <div style={{ marginTop: 6 }}>
                      <b>Headers:</b>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{pretty(lastRequest.headers)}</pre>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <b>Body:</b>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{pretty(lastRequest.body)}</pre>
                    </div>
                    <button
                      type="button"
                      className="admin-buttonv1"
                      onClick={() => copy(pretty({ ...lastRequest, headers: lastRequest.headers, body: lastRequest.body }))}
                    >
                      Copy Request
                    </button>
                  </>
                ) : (
                  <div style={{ opacity: 0.6 }}>No request yet.</div>
                )}
              </div>

              <div style={{ flex: '1 1 360px', minWidth: 320 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Last Response</div>
                {lastResponse ? (
                  <>
                    <div>
                      <b>Status:</b> {lastResponse.httpStatus} {lastResponse.ok ? '(OK)' : '(FAIL)'}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <b>Parsed JSON:</b>
                      <pre style={{ whiteSpace: 'pre-wrap' }}>
                        {lastResponse.parsed ? pretty(lastResponse.parsed) : '— (not JSON) —'}
                      </pre>
                    </div>
                    {!lastResponse.parsed && (
                      <div style={{ marginTop: 6 }}>
                        <b>Raw Body:</b>
                        <pre style={{ whiteSpace: 'pre-wrap' }}>{lastResponse.body}</pre>
                      </div>
                    )}
                    <button
                      type="button"
                      className="admin-buttonv1"
                      onClick={() => copy(pretty(lastResponse.parsed ?? lastResponse.body))}
                    >
                      Copy Response
                    </button>
                  </>
                ) : (
                  <div style={{ opacity: 0.6 }}>No response yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default Vendor
