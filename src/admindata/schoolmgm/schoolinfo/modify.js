import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage, getCurrentLoggedUserID } from '../../../utils/operation'
import FilePreview from '../../../views/widgets/FilePreview'
import { getFileNameFromUrl } from '../../../utils/operation'
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

  // Define state for each input
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

  const [txtschRegionName, setRegionName] = useState('')
  const [txtschZipCode, setZipCode] = useState('')
  const [txtschWebsiteAddress, setWebsiteAddress] = useState('')
  const [txtschGlat, setGlat] = useState('')
  const [txtschGlan, setGlan] = useState('')
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
  const [cityList, setCityList] = useState([])
  const [txtschCityID, setSelectedCityID] = useState('')
  const [countries, setCountries] = useState([])
  const [educationLevels, setEducationLevels] = useState([])
  const [error, setError] = useState('')
  const handleFileUpload = (setter) => async (e) => {
    const file = e.target.files[0]
    if (file) setter(file)
  }
  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setToastMessage('')

    //Image 1
    let txtschImageName1Val = OrgtxtschImageName1Val
    let uploadedImageKey1 = ''

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
        uploadedImageKey1 = uploadResult?.data?.key || uploadResult?.data?.Key
        txtschImageName1Val = getFileNameFromUrl(uploadedImageKey1)
      }

      // ✅ assign to outer variable
    } catch (error) {
      console.error('Error uploading tax file:', error)
      setToastMessage('Failed to upload tax file.')
      setToastType('fail')
    }

    //Tax
    let uploadedImageKey2 = "";
    let schTaxFileNameVal = OrgtxtschTaxFileNameVal // <-- move this declaration outside

    try {
      if (txtschTaxFileName && txtschTaxFileName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', txtschTaxFileName)
        formdata.append('foldername', 'school')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })

        if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        uploadedImageKey2 = uploadResult?.data?.key || uploadResult?.data?.Key
        schTaxFileNameVal = getFileNameFromUrl(uploadedImageKey2)
      }

      // ✅ assign to outer variable
    } catch (error) {
      console.error('Error uploading tax file:', error)
      setToastMessage('Failed to upload tax file.')
      setToastType('fail')
    }

    //Certificate
    let uploadedCRKey1 = "";
    let schCertificateFileNameVal = OrgtxtschCertificateFileNameVal // <-- move this declaration outside

    try {
      if (txtschCertificateFileName && txtschCertificateFileName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', txtschCertificateFileName)
        formdata.append('foldername', 'school')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })

        if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        uploadedCRKey1 = uploadResult?.data?.key || uploadResult?.data?.Key
        schCertificateFileNameVal = getFileNameFromUrl(uploadedCRKey1)
      }

      // ✅ assign to outer variable
    } catch (error) {
      console.error('Error uploading CR file:', error)
      setToastMessage('Failed to upload CR file.')
      setToastType('fail')
    }

    try {
      console.log(`${API_BASE_URL}/schoolinfo/School/updateschool`)
      const response = await fetch(`${API_BASE_URL}/schoolinfo/School/updateschool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SchoolID: SchoolIDVal,
          schImageName: txtschImageName1Val, // file
          schTaxFileName: schTaxFileNameVal, // file
          schCertificateFileName: schCertificateFileNameVal, // file

          schName: txtschName || '',
          schEmailAddress: txtschEmailAddress || '',
          schMobileNo1: txtschMobileNo1 || '',
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

  const fetchSchool = async (SchoolIDVal) => {
    console.log('SchoolIDVal.data')
    console.log(SchoolIDVal)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/schoolinfo/School/getSchool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SchoolID: SchoolIDVal }),
      })
      console.log(`${API_BASE_URL}/schoolinfo/School/getSchool`)
      if (!response.ok) throw new Error('Failed to fetch school')

      const data = await response.json()
      console.log('data.data')
      console.log(data.data)
      SetSchool(data.data || [])
    } catch (error) {
      setError('Error fetching school')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Now this works fine
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1])
    const SchoolIDVal = urlParams.get('SchoolID')
    console.log('SchoolIDVal')
    console.log(SchoolIDVal)
    fetchCountries()
    fetchSchoolEducationLevels()
    fetchCities()
    if (SchoolIDVal) {
      setSchoolID(SchoolIDVal)
      fetchSchool(SchoolIDVal)
    } else {
      setError('SchoolID is missing in URL')
    }
  }, [])

  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/city/getcityalllist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // If your API expects data in the body
      })

      const result = await response.json()
      if (result.data) {
        setCityList(result.data)
      }
    } catch (error) {
      console.error('Error fetching city list:', error)
    }
  }

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/country/getcountrylist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // if needed
      })

      const result = await response.json()
      if (result.data) {
        setCountries(result.data)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  const fetchSchoolEducationLevels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lookupdata/schedulevel/getSchedulevelAllList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // optional if your API accepts an empty object
      })

      const result = await response.json()
      console.log(result.data)
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

  useEffect(() => {
    console.log('SchoolData')
    console.log(SchoolData)
    if (!SchoolData) return

    console.log(SchoolData.schImageNameUrl)
    setSchImageName(SchoolData.schImageNameUrl)
    setschTaxFileName(SchoolData.schTaxFileNameUrl)
    setschCertificateFileName(SchoolData.schCertificateFileNameUrl)

    setOrgsetSchImageName(SchoolData.schImageName)
    setOrgtxtschTaxFileNameVal(SchoolData.schTaxFileName)
    setOrgtxtschCertificateFileNameVal(SchoolData.schCertificateFileName)

    setSchName(SchoolData.schName || '')
    setSchEmailAddress(SchoolData.schEmailAddress || '')
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

    setRegionName(SchoolData.schRegionName)
    setZipCode(SchoolData.schZipCode)
    setWebsiteAddress(SchoolData.schWebsiteAddress)
    setGoogleMap(SchoolData.schGoogleMap)
    setGlat(SchoolData.schGlat)
    setGlan(SchoolData.schGlan)

    setInstagram(SchoolData.schInstagram)
    setFaceBook(SchoolData.schFaceBook)
    setX(SchoolData.schX)
    setSnapChat(SchoolData.schSnapChat)
    setTikTok(SchoolData.schTikTok)
    setYouTube(SchoolData.schYouTube)

    setBankName(SchoolData.schBankName)
    setAccHolderName(SchoolData.schAccHolderName)
    setIBANNo(SchoolData.schAccIBANNo)
    setTaxName(SchoolData.schTaxName)
    setAdminNotes(SchoolData.schAdminNotes)

    console.log('SchoolData')
    console.log(SchoolData.schName)
  }, [SchoolData])

  const handleFileChange = (e, key) => {
    const file = e.target.files[0]
    if (key === 'certificate') {
      setCertificateFile(file)
    } else if (key === 'tax') {
      setTaxFile(file)
    }
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

  return (
    <div>
      <div className="divhbg">
        {/* Left side: Title */}
        <div className="txtheadertitle">Add New School</div>

        {/* Right side: Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSubmit}>
            Save
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
          <label>
            <span style={{ color: 'red', padding: '10px', fontSize: '22px', fontWeight: 'bold' }}>
              username
            </span>
          </label>
          <div
            className="mobile-input-group"
            style={{
              border: '1px solid #ccc',
              borderRadius: '20px',
              padding: '10px',
              fontSize: '22px',
              fontWeight: 'bold',
            }}
          >
            {txtschMobileNo1}
          </div>
        </div>

        <div className="form-group">
          <label>School Name</label>
          <input
            name="txtschName"
            className="admin-txt-box"
            placeholder="Enter School Name"
            type="text"
            required
            value={txtschName}
            onChange={(e) => setSchName(e.target.value)}
          />
        </div>

        <input
          name="txtschImageName1"
          className="admin-txt-box"
          placeholder="Upload Vendor Image"
          type="file"
          onChange={handleFileUpload(setSchImageName)}
          style={{ height: 50, width: '100%' }}
        />
        <FilePreview file={txtschImageName1} />

        <div className="form-group">
          <label>Email Address</label>
          <input
            name="txtschEmailAddress"
            placeholder="Enter Email Address"
            className="admin-txt-box"
            type="text"
            required
            value={txtschEmailAddress}
            onChange={(e) => setSchEmailAddress(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Mobile Number 2</label>
          <div className="mobile-input-group">
            <input
              name="txtschMobileNo2"
              className="admin-txt-box"
              type="text"
              value={txtschMobileNo2}
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
            value={txtschDesc}
            onChange={(e) => setSchDesc(e.target.value)}
            required
          />
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            {/* Left: Commercial Registration Number */}
            <div className="vendor-column">
              <label className="vendor-label">School Level </label>
              <input
                name="txtschLevel"
                value={txtschLevel}
                className="vendor-input"
                placeholder="Enter School Level"
                onChange={(e) => setSchLevel(e.target.value)}
                required
              />
            </div>

            {/* Right: Upload Commercial Registration */}
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
                  onChange={handleChange}
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
            {/* Left: Commercial Registration Number */}
            <div className="vendor-column">
              <label className="vendor-label">School Certificate </label>
              <input
                name="txtschCertificateName"
                value={txtschCertificateName}
                className="vendor-input"
                placeholder="Enter School Certificate"
                onChange={(e) => setCertificateName(e.target.value)}
              />
            </div>

            {/* Right: Upload Commercial Registration */}
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

      <div className="txtsubtitle">School Location </div>

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
                onChange={(e) => setAddress1(e.target.value)}
                required
              />
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
                value={txtschCountryID} // ✅ bind the selected value
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
                value={txtschCityID} // ✅ controlled input
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
                placeholder="Enter Region  "
                value={txtschRegionName}
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
                value={txtschZipCode}
                onChange={(e) => setZipCode(e.target.value)}
                required
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
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Google Map Location</label>
              <input
                onChange={(e) => setGoogleMap(e.target.value)}
                name="txtschGoogleMap"
                value={txtschGoogleMap}
                className="vendor-input"
                placeholder="Enter Google Map Location"
              />
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
                placeholder="Enter Longitude  "
                onChange={(e) => setGlan(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">School Lattitude</label>
              <input
                value={txtschGlat}
                name="txtschGlat"
                className="vendor-input"
                placeholder="Enter Lattitude  "
                onChange={(e) => setGlat(e.target.value)}
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
                onChange={(e) => setInstagram(e.target.value)}
                name="txtschInstagram"
                value={txtschInstagram}
                className="vendor-input"
                placeholder="Enter Instagram"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
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
                onChange={(e) => setX(e.target.value)}
                name="txtschX"
                value={txtschX}
                className="vendor-input"
                placeholder="Enter X"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
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
                value={txtschTikTok}
                onChange={(e) => setTikTok(e.target.value)}
                name="txtschTikTok"
                className="vendor-input"
                placeholder="Enter TikTok"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
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
                value={txtschBankName}
                onChange={(e) => setBankName(e.target.value)}
                name="txtschBankName"
                className="vendor-input"
                placeholder="Enter Bank Name"
                required
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
                required
                value={txtschAccHolderName}
                name="txtschAccHolderName"
                className="vendor-input"
                placeholder="Enter Name of Account Holder"
                onChange={(e) => setAccHolderName(e.target.value)}
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">IBAN Account Number</label>
              <input
                value={txtschAccIBANNo}
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
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Tax Name</label>
              <input
                onChange={(e) => setTaxName(e.target.value)}
                value={txtschTaxName}
                name="txtschTaxName"
                className="vendor-input"
                placeholder="Tax Document Information "
                required
              />
            </div>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Upload Document </label>
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
                onChange={(e) => setAdminNotes(e.target.value)}
                value={txtschAdminNotes}
                name="txtschAdminNotes"
                className="vendor-input"
                placeholder="Enter Admin Notes "
                rows={4}
              />
            </div>
          </div>
        </div>
        {/* // row end */}
      </div>
      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSubmit}>
          Save
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
