import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../config'
import { DspToastMessage } from '../../utils/operation'
import FilePreview from '../../views/widgets/FilePreview'
import { getFileNameFromUrl, getCurrentLoggedUserID } from '../../utils/operation'
import { checkUserExists } from '../../utils/auth'
const Vendor = () => {
  const [OrgtxtvdrImageName1Val, setOrgsetvdrImageName] = useState('')
  const [OrgtxtvdrTaxFileNameVal, setOrgtxtvdrTaxFileName] = useState('')
  const [OrgtxtvdrCRFileNameVal, setOrgtxtvdrCRFileName] = useState('')

  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [ErrorUserExistMsg, setUserExists] = useState(false)
  const [checking, setChecking] = useState(false)

  const [VendorIDVal, setVendorID] = useState(false)
  const [VendorData, SetVendor] = useState(null)

  const [fetchedCategories, setFetchedCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])

  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // Define state for each input
  const [txtvdrName, setVdrName] = useState('')

  const [txtvdrClubName, setClubName] = useState('')
  const [vdrImageName, setvdrImageName] = useState(null)
  const [vdrTaxFileName, setvdrTaxFileName] = useState(null)
  const [vdrCRFileName, setvdrCRFileName] = useState(null)

  const [txtvdrEmailAddress, setVdrEmailAddress] = useState('')
  const [txtvdrMobileNo1, setVdrMobileNo1] = useState('')
  const [txtvdrMobileNo2, setVdrMobileNo2] = useState('')
  const [txtvdrDesc, setVdrDesc] = useState('')
  const [txtvdrLevel, setVdrLevel] = useState('')
  const [txtvdrCRNumber, setCRNumber] = useState('')
  const [txtvdrAddress1, setAddress1] = useState('')
  const [txtvdrAddress2, setAddress2] = useState('')
  const [txtvdrCountryID, setCountryID] = useState('')

  const [txtvdrRegionName, setRegionName] = useState('')
  const [txtvdrZipCode, setZipCode] = useState('')
  const [txtvdrWebsiteAddress, setWebsiteAddress] = useState('')
  const [txtvdrGlat, setGlat] = useState('')
  const [txtvdrGlan, setGlan] = useState('')
  const [txtvdrGoogleMap, setVdrGoogleMap] = useState('')
  const [txtvdrInstagram, setInstagram] = useState('')
  const [txtvdrFaceBook, setFaceBook] = useState('')
  const [txtvdrX, setX] = useState('')
  const [txtvdrSnapChat, setSnapChat] = useState('')
  const [txtvdrTikTok, setTikTok] = useState('')
  const [txtvdrYouTube, setYouTube] = useState('')
  const [txtvdrBankName, setBankName] = useState('')
  const [txtvdrAccHolderName, setAccHolderName] = useState('')
  const [txtvdrAccIBANNo, setIBANNo] = useState('')
  const [txtvdrTaxName, setTaxName] = useState('')

  const [txtvdrAdminNotes, setAdminNotes] = useState('')
  const [cityList, setCityList] = useState([])
  const [txtvdrCityID, setSelectedCityID] = useState('')
  const [countries, setCountries] = useState([])
  const [Category, setCategory] = useState([])

  const [chkvdrIsBirthDayService, setBirthDayService] = useState([])
  const [vdrCapacity, setCapacity] = useState([])
  const [vdrPricePerPerson, setPricePerPerson] = useState([])
  const [txtschGoogleMap, setGoogleMap] = useState('')
  /*  days */
  const handleAddMore = (day) => {
    const existingTimes = days[day].times

    // Calculate default new start and end time (e.g. right after last end)
    let lastEnd = existingTimes.length
      ? timeToMinutes(existingTimes[existingTimes.length - 1].end)
      : 480 // default 8:00 AM = 480 mins

    if (lastEnd === null) lastEnd = 480

    const newStartMins = lastEnd
    const newEndMins = newStartMins + 60 // 1 hour after

    // Convert back to HH:MM AM/PM
    const minutesToTime = (mins) => {
      let h = Math.floor(mins / 60)
      let m = mins % 60
      const suffix = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      return `${h}:${m.toString().padStart(2, '0')} ${suffix}`
    }

    const newStart = minutesToTime(newStartMins)
    const newEnd = minutesToTime(newEndMins)

    const newTimes = [...existingTimes, { start: newStart, end: newEnd }]
    setDays({
      ...days,
      [day]: { ...days[day], times: newTimes },
    })
  }

  const [days, setDays] = useState({
    sunday: {
      times: [{ start: '', end: '', ChkRemoveDays: false }],
      total: '',
      closed: false,
      note: '',
    },
    monday: {
      times: [{ start: '', end: '', ChkRemoveDays: false }],
      total: '',
      closed: false,
      note: '',
    },
    tuesday: {
      times: [{ start: '', end: '', ChkRemoveDays: false }],
      total: '',
      closed: false,
      note: '',
    },
    wednesday: {
      times: [{ start: '', end: '', ChkRemoveDays: false }],
      total: '',
      closed: false,
      note: '',
    },
    thursday: {
      times: [{ start: '', end: '', ChkRemoveDays: false }],
      total: '',
      closed: false,
      note: '',
    },
    friday: {
      times: [{ start: '', end: '', ChkRemoveDays: false }],
      total: '',
      closed: false,
      note: '',
    },
    saturday: {
      times: [{ start: '', end: '', ChkRemoveDays: false }],
      total: '',
      closed: false,
      note: '',
    },
    // more days...
  })

  const handleClosedChange = (day, isClosed) => {
    setDays((prevDays) => ({
      ...prevDays,
      [day]: {
        ...prevDays[day],
        closed: isClosed,
      },
    }))
  }
  // days

  const timeToMinutes = (time) => {
    if (!time) return null
    // If time is like "8:00 AM" or "4:00 PM"
    const [timePart, modifier] = time.split(' ')
    let [hours, minutes] = timePart.split(':').map(Number)

    if (modifier === 'PM' && hours !== 12) hours += 12
    if (modifier === 'AM' && hours === 12) hours = 0

    return hours * 60 + minutes
  }

  const timeStringToMinutes = (timeStr) => {
    if (!timeStr) return null
    const [hourStr, minuteStr] = timeStr.split(':')
    if (!minuteStr) return null
    let hour = parseInt(hourStr, 10)
    let minute = parseInt(minuteStr.slice(0, 2), 10)
    if (isNaN(hour) || isNaN(minute)) return null
    return hour * 60 + minute
  }

  const hasOverlap = (days) => {
    for (const [dayName, dayData] of Object.entries(days)) {
      if (dayData.closed) continue

      const times = dayData.times.filter((t) => t.start && t.end)
      for (let i = 0; i < times.length; i++) {
        const startA = timeStringToMinutes(times[i].start)
        const endA = timeStringToMinutes(times[i].end)
        if (startA === null || endA === null) continue

        for (let j = i + 1; j < times.length; j++) {
          const startB = timeStringToMinutes(times[j].start)
          const endB = timeStringToMinutes(times[j].end)
          if (startB === null || endB === null) continue

          // Overlap if startA < endB && endA > startB
          if (startA < endB && endA > startB) {
            return { day: dayName, range1: times[i], range2: times[j] }
          }
        }
      }
    }
    return null
  }

  const handleTimeChange = (day, index, field, value) => {
    setDays((prevDays) => {
      const updatedTimes = [...prevDays[day].times]
      updatedTimes[index] = {
        ...updatedTimes[index],
        [field]: value,
      }
      return {
        ...prevDays,
        [day]: {
          ...prevDays[day],
          times: updatedTimes,
        },
      }
    })
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
  const handleFileUpload = (setter) => async (e) => {
    const file = e.target.files[0]
    if (file) setter(file)
  }
  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setToastMessage('')

    const overlap = hasOverlap(days)
    if (overlap) {
      setToastMessage(
        `Time range overlap on ${overlap.day}: ` +
          `${overlap.range1.start} - ${overlap.range1.end} overlaps with ` +
          `${overlap.range2.start} - ${overlap.range2.end}`,
      )
      setToastType('fail')
      return // stop submission
    }

    let uploadedImageKey = ''
    let vdrImageNameVal = OrgtxtvdrImageName1Val
    try {
      if (vdrImageName && vdrImageName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', vdrImageName)
        formdata.append('foldername', 'vendor')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })

        if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        uploadedImageKey = uploadResult?.data?.key || uploadResult?.data?.Key
        vdrImageNameVal = getFileNameFromUrl(uploadedImageKey)
      }
    } catch (error) {
      console.error('Error adding Product:', error)
      setToastMessage('Failed to add product.')
      setToastType('fail')
    }

    //Tax
    let uploadedImageKey1 = ''
    let vdrTaxFileNameVal = OrgtxtvdrTaxFileNameVal // <-- move this declaration outside

    try {
      if (vdrTaxFileName && vdrTaxFileName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', vdrTaxFileName)
        formdata.append('foldername', 'vendor')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })

        if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        uploadedImageKey1 = uploadResult?.data?.key || uploadResult?.data?.Key
        vdrTaxFileNameVal = getFileNameFromUrl(uploadedImageKey1)
      }

      // ✅ assign to outer variable
    } catch (error) {
      console.error('Error uploading tax file:', error)
      setToastMessage('Failed to upload tax file.')
      setToastType('fail')
    }

    //CR
    let uploadedCRKey1 = ''
    let vdrCRFileNameVal = OrgtxtvdrCRFileNameVal

    try {
      if (vdrCRFileName && vdrCRFileName instanceof File) {
        const formdata = new FormData()
        formdata.append('image', vdrCRFileName)
        formdata.append('foldername', 'vendor')
        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        })

        if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
        const uploadResult = await uploadResponse.json()
        uploadedCRKey1 = uploadResult?.data?.key || uploadResult?.data?.Key
        vdrCRFileNameVal = getFileNameFromUrl(uploadedCRKey1)
      }

      // ✅ assign to outer variable
    } catch (error) {
      console.error('Error uploading CR file:', error)
      setToastMessage('Failed to upload CR file.')
      setToastType('fail')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vendorinfo/vendor/updatevendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          VendorID: VendorIDVal,
          vdrName: txtvdrName || '',
          vdrClubName: txtvdrClubName,
          vdrImageName: vdrImageNameVal, // file
          vdrTaxFileName: vdrTaxFileNameVal, // file
          vdrCRFileName: vdrCRFileNameVal,
          vdrEmailAddress: txtvdrEmailAddress || '',
          vdrMobileNo1: txtvdrMobileNo1 || '',
          vdrMobileNo2: txtvdrMobileNo2 || '',
          vdrDesc: txtvdrDesc || '',
          vdrCategoryID: selectedCategories,
          vdrCRNumber: txtvdrCRNumber || '',
          vdrCvdrCRFileName: null, // file
          vdrAddress1: txtvdrAddress1 || '',
          vdrAddress2: txtvdrAddress2 || '',
          vdrCountryID: txtvdrCountryID || '',
          vdrCityID: txtvdrCityID || '',
          vdrRegionName: txtvdrRegionName || '',
          vdrZipCode: txtvdrZipCode || '',
          vdrWebsiteAddress: txtvdrWebsiteAddress || '',
          vdrGoogleMap: txtvdrGoogleMap || '0',

          vdrGlat: txtvdrGlat || '',
          vdrGlan: txtvdrGlan || '',

          vdrInstagram: txtvdrInstagram || '',
          vdrFaceBook: txtvdrFaceBook || '',
          vdrX: txtvdrX || '',
          vdrSnapChat: txtvdrSnapChat || '',
          vdrTikTok: txtvdrTikTok || '',
          vdrYouTube: txtvdrYouTube || '',
          vdrBankName: txtvdrBankName || '',
          vdrAccHolderName: txtvdrAccHolderName || '',
          vdrAccIBANNo: txtvdrAccIBANNo || '',
          vdrTaxName: txtvdrTaxName || '',

          vdrAdminNotes: txtvdrAdminNotes || '',

          vdrIsBirthDayService: chkvdrIsBirthDayService,
          vdrCapacity: vdrCapacity,
          vdrPricePerPerson: vdrPricePerPerson,
          OfficeOpenHours: getOpeningHoursTableData(),
          IsDataStatus: 1,
          CreatedBy: getCurrentLoggedUserID(),
          ModifyBy: getCurrentLoggedUserID(),
        }),
      })

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      await response.json()
      setToastMessage('Vendor added successfully!')
      setToastType('success')

      setTimeout(() => navigate('/admindata/vendor/list'), 2000)
    } catch (err) {
      console.error('Error adding Vendor:', err)
      setToastMessage('Failed to add Vendor.')
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  const getOpeningHoursTableData = (OfficeOpenHoursVal) => {
    const rows = []

    Object.entries(days).forEach(([dayName, dayData]) => {
      if (dayData.closed) return

      dayData.times.forEach((range) => {
        rows.push({
          DayName: dayName,
          StartTime: range.start,
          EndTime: range.end,
          Note: range.note || '',
          Total: range.total || '0.00',
          CreatedBy: getCurrentLoggedUserID(),
          ModifyBy: getCurrentLoggedUserID(),
        })
      })
    })

    return {
      OfficeOpenHours: OfficeOpenHoursVal,
      rows,
    }
  }

  useEffect(() => {
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

    const FetchCategory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/lookupdata/category/getCategoryAllList`, {
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
            value: item.CategoryID,
            label: item.EnCategoryName,
          }))
          setFetchCategories(result.data)
        }
      } catch (error) {
        console.error('Error fetching education levels:', error)
      }
    }

    fetchCities()
    fetchCountries()
    FetchCategory()
  }, [])

  const fetchVendor = async (VendorIDVal) => {
    console.log('VendorIDVal.data')
    console.log(VendorIDVal)
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/Vendorinfo/Vendor/getVendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ VendorID: VendorIDVal }),
      })
      console.log(`${API_BASE_URL}/Vendorinfo/Vendor/getVendor`)
      if (!response.ok) throw new Error('Failed to fetch Vendor')

      const data = await response.json()
      console.log('data.data')
      console.log(data.data)
      SetVendor(data.data || [])
    } catch (error) {
      setError('Error fetching Vendor')
    } finally {
      setLoading(false)
    }
  }

   const getSearchParams = () => {
  const search = window.location.search ||
    (window.location.hash && window.location.hash.includes('?')
      ? `?${window.location.hash.split('?')[1]}`
      : '');
  return new URLSearchParams(search);
};

  // ✅ Now this works fine
  useEffect(() => {
  
     const urlParams = getSearchParams()
    const VendorIDVal = urlParams.get('VendorID')
    console.log('VendorIDVal')
    console.log(VendorIDVal)

    if (VendorIDVal) {
      setVendorID(VendorIDVal)
      fetchVendor(VendorIDVal)
    } else {
      setError('VendorID is missing in URL')
    }
  }, [])

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
  const [fetchcategories, setFetchCategories] = useState([])

  const handleRemoveTimeRange = (day, index) => {
    const updatedTimes = days[day].times.filter((_, i) => i !== index)
    const newTotal = updatedTimes.reduce((sum, t) => sum + parseFloat(t.total || 0), 0)

    setDays({
      ...days,
      [day]: {
        ...days[day],
        times: updatedTimes.length > 0 ? updatedTimes : [{ start: '', end: '', total: '' }],
        total: newTotal.toFixed(2),
      },
    })
  }
  const handleCheckboxChange = (id) => {
    const idStr = String(id)
    setSelectedCategories((prev) => {
      const updated = prev.includes(idStr) ? prev.filter((val) => val !== idStr) : [...prev, idStr]

      console.log('Updated selectedCategories:', updated)
      return updated
    })
  }
  useEffect(() => {
    console.log('VendorData')
    console.log(VendorData)
    if (!VendorData) return

    setvdrImageName(VendorData.vdrImageNameUrl)
    setvdrCRFileName(VendorData.vdrCRFileNameUrl)
    setvdrTaxFileName(VendorData.vdrTaxFileNameUrl)

    setOrgsetvdrImageName(VendorData.vdrImageName)
    setOrgtxtvdrTaxFileName(VendorData.vdrTaxFileName)
    setOrgtxtvdrCRFileName(VendorData.vdrCRFileName)

    setVdrName(VendorData.vdrName || '')
    setClubName(VendorData.vdrClubName || '')
    setVdrEmailAddress(VendorData.vdrEmailAddress || '')
    setVdrEmailAddress(VendorData.vdrEmailAddress || '')
    setVdrMobileNo1(VendorData.vdrMobileNo1 || '')
    setVdrMobileNo2(VendorData.vdrMobileNo2 || '')

    setVdrDesc(VendorData.vdrDesc || '')

    setVdrLevel(VendorData.vdrLevel || '')
    // setCertificateName(VendorData.vdrCertificateName || '')

    setAddress1(VendorData.vdrAddress1 || '')
    setAddress2(VendorData.vdrAddress2 || '')

    setCountryID(VendorData.vdrCountryID || '')
    setSelectedCityID(VendorData.vdrCityID || '')

    setRegionName(VendorData.vdrRegionName)
    setZipCode(VendorData.vdrZipCode)
    setWebsiteAddress(VendorData.vdrWebsiteAddress)
    setVdrGoogleMap(VendorData.vdrGoogleMap)
    setGlat(VendorData.vdrGlat)
    setGlan(VendorData.vdrGlan)

    setInstagram(VendorData.vdrInstagram)
    setFaceBook(VendorData.vdrFaceBook)
    setX(VendorData.vdrX)
    setSnapChat(VendorData.vdrSnapChat)
    setTikTok(VendorData.vdrTikTok)
    setYouTube(VendorData.vdrYouTube)

    setBankName(VendorData.vdrBankName)
    setAccHolderName(VendorData.vdrAccHolderName)
    setIBANNo(VendorData.vdrAccIBANNo)
    setTaxName(VendorData.vdrTaxName)
    setAdminNotes(VendorData.vdrAdminNotes)
    setCRNumber(VendorData.vdrCRNumber)

    console.log('VendorData')
    console.log(VendorData.vdrName)

    if (VendorData?.vdrCategoryID) {
      const ids = VendorData.vdrCategoryID.map((id) => String(id)) // normalize to string
      setSelectedCategories(ids)
      console.log('Preselected categories:', ids)

      if (VendorData?.vdrIsBirthDayService) {
        setBirthDayService(VendorData.vdrIsBirthDayService) // "Yes" or "No"
      }
    }
  }, [VendorData])
  return (
    <div>
      <div className="divhbg">
        {/* Left side: Title */}
        <div className="txtheadertitle">Add New Vendor</div>

        {/* Right side: Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSubmit}>
            Save
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/vendor/list')}
          >
            Return
          </button>
        </div>
      </div>

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
            margin: '10px',
          }}
        >
          {txtvdrMobileNo1}
        </div>
      </div>

      <div className="txtsubtitle">Vendor Information</div>

      <div className="divbox">
        <div className="form-group">
          <label>Vendor Name</label>
          <input
            name="txtvdrName"
            className="admin-txt-box"
            placeholder="Enter Vendor Name"
            type="text"
            required
            value={txtvdrName}
            onChange={(e) => setVdrName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Club Name</label>
          <input
            name="txtvdrClubName"
            className="admin-txt-box"
            placeholder="Enter Vendor Name"
            type="text"
            required
            value={txtvdrClubName}
            onChange={(e) => setClubName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Vendor Image</label>
          <input
            name="txtvdrImageName"
            className="admin-txt-box"
            placeholder="Upload Vendor Image"
            type="file"
            onChange={handleFileUpload(setvdrImageName)}
          />
          {console.log('vdrImageName:', vdrImageName)}
          {vdrImageName && <FilePreview file={vdrImageName} />}
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            name="txtvdrEmailAddress"
            placeholder="Enter Email Address"
            className="admin-txt-box"
            type="text"
            required
            value={txtvdrEmailAddress}
            onChange={(e) => setVdrEmailAddress(e.target.value)}
          />
        </div>

        <div className="form-group">
          <div className="ErrorMsg"> {ErrorUserExistMsg}</div>
        </div>
        <div className="form-group">
          <label>Mobile Number 2</label>
          <div className="mobile-input-group">
            <input
              name="txtvdrMobileNo2"
              className="admin-txt-box"
              type="text"
              value={txtvdrMobileNo2}
              placeholder="Enter mobile number2"
              onChange={(e) => setVdrMobileNo2(e.target.value)}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Vendor Description</label>
          <textarea
            name="txtvdrDesc"
            className="vendor-input"
            placeholder="Enter Vendor Description"
            rows={4}
            onChange={(e) => setVdrDesc(e.target.value)}
            required
            value={txtvdrDesc}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Select Categories
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {fetchcategories.map((item) => {
                const id = String(item.CategoryID)
                const isChecked = selectedCategories.includes(id)

                console.log(
                  `Rendering category: ${item.EnCategoryName} (${id}) - Checked: ${isChecked}`,
                )
                return (
                  <label
                    key={id}
                    style={{
                      width: '33.33%',
                      marginBottom: 10,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="checkbox"
                      value={id}
                      onChange={() => handleCheckboxChange(id)}
                      checked={isChecked}
                      style={{ marginRight: 8 }}
                    />
                    {item.EnCategoryName}
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Vendor Location </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Address1</label>
              <input
                name="txtvdrAddress1"
                value={txtvdrAddress1}
                className="vendor-input"
                placeholder="Enter Street Address1"
                onChange={(e) => setAddress1(e.target.value)}
                required
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
                value={txtvdrAddress2}
                onChange={(e) => setAddress2(e.target.value)}
                name="txtvdrAddress2"
                className="vendor-input"
                placeholder="Enter Street Address2"
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Country</label>
              <select
                onChange={(e) => setCountryID(e.target.value)}
                name="txtvdrCountryID"
                value={txtvdrCountryID}
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
                name="txtvdrCityID"
                value={txtvdrCityID}
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
                value={txtvdrRegionName}
                name="txtvdrRegionName"
                className="vendor-input"
                placeholder="Enter Region  "
                onChange={(e) => setRegionName(e.target.value)}
                required
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Zip Code</label>
              <input
                value={txtvdrZipCode}
                name="txtvdrZipCode"
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
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Website Address</label>
              <input
                onChange={(e) => setWebsiteAddress(e.target.value)}
                name="txtvdrWebsiteAddress"
                value={txtvdrWebsiteAddress}
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
                value={txtvdrGoogleMap}
                onChange={(e) => setVdrGoogleMap(e.target.value)}
                name="txtvdrGoogleMap"
                className="vendor-input"
                placeholder="Enter Google Map Location"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Vendor Longitude</label>
              <input
                value={txtvdrGlan}
                name="txtvdrGlan "
                className="vendor-input"
                placeholder="Enter Longitude  "
                onChange={(e) => setGlan(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Vendor Lattitude</label>
              <input
                value={txtvdrGlat}
                name="txtvdrGlat"
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
                value={txtvdrInstagram}
                onChange={(e) => setInstagram(e.target.value)}
                name="txtvdrInstagram"
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
                value={txtvdrFaceBook}
                onChange={(e) => setFaceBook(e.target.value)}
                name="txtvdrFaceBook"
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
                name="txtvdrX"
                value={txtvdrX}
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
                name="txtvdrSnapChat"
                value={txtvdrSnapChat}
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
                onChange={(e) => setTikTok(e.target.value)}
                name="txtvdrTikTok"
                value={txtvdrTikTok}
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
                value={txtvdrYouTube}
                onChange={(e) => setYouTube(e.target.value)}
                name="txtvdrYouTube"
                className="vendor-input"
                placeholder="Enter Youtube"
              />
            </div>
          </div>
        </div>
      </div>
      {/* // row end */}

      <div className="txtsubtitle">Birth Day Information </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label className="vendor-label">Are you offering Birth Day?</label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="radio"
                    name="chkvdrIsBirthDayService"
                    value="Yes"
                    onChange={(e) => setBirthDayService(e.target.value)}
                    checked={chkvdrIsBirthDayService === 'Yes'}
                    style={{ width: '24px', height: '24px' }}
                  />
                  Yes
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="radio"
                    name="chkvdrIsBirthDayService"
                    value="No"
                    onChange={(e) => setBirthDayService(e.target.value)}
                    checked={chkvdrIsBirthDayService === 'No'}
                    style={{ width: '24px', height: '24px' }}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>
        {/* // row end */}
      </div>

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
                onChange={(e) => setBankName(e.target.value)}
                name="txtvdrBankName"
                value={txtvdrBankName}
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
                value={txtvdrAccHolderName}
                name="txtvdrAccHolderName"
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
                value={txtvdrAccIBANNo}
                onChange={(e) => setIBANNo(e.target.value)}
                name="txtvdrAccIBANNo"
                className="vendor-input"
                placeholder="Enter IBAN Account Number"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle"> Document Information </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            {/* Left: Commercial Registration Number */}
            <div className="vendor-column">
              <label className="vendor-label">CR Number </label>
              <input
                value={txtvdrCRNumber}
                name="txtvdrCRNumber"
                className="vendor-input"
                placeholder="Enter Vendor Certificate"
                onChange={(e) => setCRNumber(e.target.value)}
              />
            </div>

            {/* Right: Upload Commercial Registration */}
            <div className="vendor-column">
              <label className="vendor-label">Upload CR No Certificate</label>
              <input
                name="txtvdrCRCertificateFileName"
                type="file"
                onChange={handleFileUpload(setvdrCRFileName)}
                className="vendor-input"
              />
              {vdrCRFileName && <FilePreview file={vdrCRFileName} />}
            </div>
          </div>
        </div>
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Tax Name</label>
              <input
                value={txtvdrTaxName}
                onChange={(e) => setTaxName(e.target.value)}
                name="txtvdrTaxName"
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
                name="txtvdrTaxFileName"
                type="file"
                onChange={handleFileUpload(setvdrTaxFileName)}
                className="vendor-input"
              />
              {vdrTaxFileName && <FilePreview file={vdrTaxFileName} />}
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
                value={txtvdrAdminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                name="txtvdrAdminNotes"
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
          onClick={() => navigate('/admindata/vendor/list')}
        >
          Cancel
        </button>
      </div>
      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}
export default Vendor
