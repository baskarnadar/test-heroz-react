import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage } from '../../../utils/operation'
import FilePreview from '../../widgets/FilePreview'
import { getFileNameFromUrl, getCurrentLoggedUserID } from '../../../utils/operation'
import { CRow, CCol } from '@coreui/react'
const Vendor = () => {
 
  const [showModal, setShowModal] = useState(false)
  const [txtactImageName1, setactImageName1] = useState(null)
  const [txtactImageName2, setactImageName2] = useState(null)
  const [txtactImageName3, setactImageName3] = useState(null)

  const navigate = useNavigate()
  const [fetchedCategories, setFetchedCategories] = useState([])

  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // Define state for each input
  const [txtactName, setactName] = useState('')
  const [selectedType, setactType] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [txtactDesc, setactDesc] = useState('')
  const [txtactYouTubeID1, setYouTube1] = useState('')
  const [txtactYouTubeID2, setYouTube2] = useState('')
  const [txtactYouTubeID3, setYouTube3] = useState('')

  const [txtactGoogleMap, setactGoogleMap] = useState('')
  const [txtactGlat, setGlat] = useState('')
  const [txtactGlan, setGlan] = useState('')
  const [ddactCountryID, setCountryID] = useState('')
  const [ddactCityID, setSelectedCityID] = useState('')
  const [txtactAddress1, setAddress1] = useState('')
  const [txtactAddress2, setAddress2] = useState('')

  const [txtactMinAge, setMinAge] = useState('')
  const [txtactMaxAge, setMaxAge] = useState('')
  const [rdoactGender, setGenderService] = useState([])
  const [txtactMinStudent, setMinStudent] = useState([])
  const [txtactMaxStudent, setMaxStudent] = useState([])

  const [txtactAdminNotes, setAdminNotes] = useState('')

  const [foods, setFoods] = useState([{ name: '', price: '', include: false }])
  const [countries, setCountries] = useState([])
  const [cityList, setCityList] = useState([])
  const handleFoodChange = (index, field, value) => {
    const updated = [...foods]
    updated[index][field] = value
    setFoods(updated)
  }

  const handleFoodAddMore = () => {
    setFoods([...foods, { name: '', price: '', include: false }])
  }

  const handleFoodRemoveFood = (index) => {
    const updated = foods.filter((_, i) => i !== index)
    setFoods(updated)
  }

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
    sunday: { times: [{ start: '', end: '' }], total: '', closed: false, notes: '' },
    monday: { times: [{ start: '', end: '' }], total: '', closed: false, notes: '' },
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
  const handleSubmit = async (actStatusVal,e) => {
  console.log("Submitting with status:", actStatusVal);
   
 
    if (e && e.preventDefault) e.preventDefault(); // Only call if e exists

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
   //Image 1
     let txtactImageName1Val = "";
     let uploadedImageKey1 = ''
 
     try {
       if (txtactImageName1 && txtactImageName1 instanceof File) {
         const formdata = new FormData()
         formdata.append('image', txtactImageName1)
         formdata.append('foldername', 'activity')
         const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
           method: 'POST',
           body: formdata,
         })
 
         if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
         const uploadResult = await uploadResponse.json()
         uploadedImageKey1 = uploadResult?.data?.key || uploadResult?.data?.Key
           txtactImageName1Val = getFileNameFromUrl(uploadedImageKey1)
       }
 
      // ✅ assign to outer variable
     } catch (error) {
       console.error('Error uploading tax file:', error)
       setToastMessage('Failed to upload tax file.')
       setToastType('fail')
     }
 
     //Image 2
     let txtactImageName2Val = "";
     let uploadedImageKey2 = ''
 
     try {
       if (txtactImageName2 && txtactImageName2 instanceof File) {
         const formdata = new FormData()
         formdata.append('image', txtactImageName2)
         formdata.append('foldername', 'activity')
         const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
           method: 'POST',
           body: formdata,
         })
 
         if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
         const uploadResult = await uploadResponse.json()
         uploadedImageKey2 = uploadResult?.data?.key || uploadResult?.data?.Key
          txtactImageName2Val = getFileNameFromUrl(uploadedImageKey2)
       }
 
       
     } catch (error) {
       console.error('Error uploading tax file:', error)
       setToastMessage('Failed to upload tax file.')
       setToastType('fail')
     }
     //Image 3
     let txtactImageName3Val = "";
     let uploadedImageKey3 = ''
 
     try {
       if (txtactImageName3 && txtactImageName3 instanceof File) {
         const formdata = new FormData()
         formdata.append('image', txtactImageName3)
         formdata.append('foldername', 'activity')
         const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
           method: 'POST',
           body: formdata,
         })
 
         if (!uploadResponse.ok) throw new Error(`Image upload failed: ${uploadResponse.status}`)
         const uploadResult = await uploadResponse.json()
         uploadedImageKey3 = uploadResult?.data?.key || uploadResult?.data?.Key
 
          txtactImageName3Val = getFileNameFromUrl(uploadedImageKey3)  
       }
 
      
     } catch (error) {
       console.error('Error uploading tax file:', error)
       setToastMessage('Failed to upload tax file.')
       setToastType('fail')
     }
 
    const actfoodDataVal = await getFoodData()
    const actavailDaysHoursVal = getAvailDaysHoursData()
    const actPriceDataVal = getPriceData()

    try {
      const response = await fetch(
        `${API_BASE_URL}/vendordata/activityinfo/activity/createActivity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            VendorID: getCurrentLoggedUserID(),
            actName: txtactName || '',
            actTypeID: selectedType,
            actCategoryID: selectedCategories,
            actDesc: txtactDesc || '',

            actImageName1: txtactImageName1Val, // file
            actImageName2: txtactImageName2Val, // file
            actImageName3: txtactImageName3Val, // file

            actYouTubeID1: txtactYouTubeID1,
            actYouTubeID2: txtactYouTubeID2,
            actYouTubeID3: txtactYouTubeID3,

            actGoogleMap: txtactGoogleMap || '',
            actGlat: txtactGlat || '',
            actGlan: txtactGlan || '',
            actAddress1: txtactAddress1 || '',
            actAddress2: txtactAddress2 || '',
            actCountryID: ddactCountryID || '',
            actCityID: ddactCityID || '',

            actMinAge: txtactMinAge || '',
            actMaxAge: txtactMaxAge || '',
            actGender: rdoactGender,
            actMinStudent: txtactMinStudent || '',
            actMaxStudent: txtactMaxStudent || '',

            actPrice: actPriceDataVal,
            actAvailDaysHours: actavailDaysHoursVal,
            actFood: actfoodDataVal,

            actAdminNotes: txtactAdminNotes || '',
            actStatus : actStatusVal,
            IsDataStatus: 1,
            CreatedBy: getCurrentLoggedUserID(),
            ModifyBy: getCurrentLoggedUserID(),
          }),
        },
      )

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      await response.json()
      setToastMessage('Activity added successfully!')
      setToastType('success')

      setTimeout(() => navigate('/vendordata/activityinfo/activity/list'), 2000)
    } catch (err) {
      console.error('Error adding Activity:', err)
      setToastMessage('Failed to add Activity.')
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  const getAvailDaysHoursData = (actAvailDaysHoursVal) => {
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
      actAvailDaysHours: actAvailDaysHoursVal,
      rows,
    }
  }

  const handleAddRange = () => {
    setPriceRanges((prev) => [...prev, { price: '', range: '' }])
  }

  const handleRemoveRange = (index) => {
    setPriceRanges((prev) => prev.filter((_, i) => i !== index))
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

  const handleCheckboxChange = (CategoryID) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(CategoryID)
        ? prevSelected.filter((id) => id !== CategoryID)
        : [...prevSelected, CategoryID],
    )
  }

  //Food--------------------------
  const uploadFoodImage = async (file) => {
    const formdata = new FormData()
    formdata.append('image', file)
    formdata.append('foldername', 'files/product/food')

    const res = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
      method: 'POST',
      body: formdata,
    })

    const result = await res.json()
    return result.data?.key || result.data?.Key
  }

  const getFoodData = async () => {
    const foodData = await Promise.all(
      foods.map(async (item) => {
        let uploadedImageKey = ''
        if (item.image instanceof File) {
          uploadedImageKey = await uploadFoodImage(item.image)
        }

        return {
          FoodName: item.name || '',
          FoodPrice: item.price || '',
          FoodNotes: item.notes || '',
          FoodImage: uploadedImageKey || '', // Save uploaded key
          Include: item.include || false,
        }
      }),
    )

    return foodData
  }
  //price ------------------------------------
  const [priceRanges, setPriceRanges] = useState([
    { price: '', rangeFrom: '', rangeTo: '' }, // ✅ better structure
  ])

  const handlePriceChange = (index, field, value) => {
    setPriceRanges((prev) => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }
  const getPriceData = () => {
    return priceRanges.map((item) => ({
      Price: item.price || '',
      StudentRangeFrom: item.rangeFrom || '',
      StudentRangeTo: item.rangeTo || '',
    }))
  }
  //Country

  //Send to Admin Approval
  const handlebtnSendToApprovalClick = () => {
    setShowModal(true) // Show confirmation modal
  }
  const handleConfirm = () => {
 
    setShowModal(false);
    handleSubmit("WAITING-FOR-APPROVAL");
  }

  const handleCancel = () => {
    setShowModal(false)
  }


  //Save 
  const handleSave = () => {
 
  handleSubmit("DRAFT");  
};
  return (
    <div>
      <div className="divhbg">
        {/* Left side: Title */}
        <div className="txtheadertitle">Add New Activity</div>

        {/* Right side: Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handlebtnSendToApprovalClick}>
            Send To Admin Approval
          </button>
          <button className="admin-buttonv1" onClick={handleSave}>
            Save
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/vendordata/activityinfo/activity/list')}
          >
            Return
          </button>
        </div>
      </div>

      <div className="txtsubtitle">Activity Information</div>

      <div className="divbox">
        <div className="form-group">
          <label>Activity Name</label>
          <input
            name="txtactName"
            className="admin-txt-box"
            type="text"
            required
            onChange={(e) => setactName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label style={{ marginBottom: '10px', marginTop: '20px' }}>Activity Type</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactTyper"
                value="SCHOOL"
                onChange={(e) => setactType(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> School</div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactTyper"
                value="INDIVIDUAL"
                onChange={(e) => setactType(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> Individual</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactTyper"
                value="MEMBER"
                onChange={(e) => setactType(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> Member</div>
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '10px', marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Activity Categories
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {fetchcategories.map((item) => (
              <label
                key={item.CategoryID}
                style={{
                  width: '33.33%',
                  marginBottom: 10,
                  marginTop: 20,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    marginLeft: 8,
                    marginRight: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    name="txtactCategoryID"
                    value={item.CategoryID}
                    onChange={() => handleCheckboxChange(item.CategoryID)}
                    style={{
                      marginRight: 8,
                      transform: 'scale(2.0)',
                      cursor: 'pointer',
                      accentColor: 'red', // ✅ sets the checkbox color
                    }}
                  />
                </div>
                <div className="pink-shadow4"> {item.EnCategoryName}</div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Activity Description</label>
          <textarea
            name="txtactDesc"
            className="vendor-input"
            rows={4}
            onChange={(e) => setactDesc(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="txtsubtitle">Activity Images </div>
      <div className="divbox">
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            marginTop: '20px',
            marginBottom: '20px',
          }}
        >
          {/* Image 1 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Activity Image 1</label>
            <input
              name="txtactImageName1"
              className="admin-txt-box"
              placeholder="Upload Vendor Image"
              type="file"
              onChange={handleFileUpload(setactImageName1)}
              style={{ height: 50, width: '100%' }}
            />
            <FilePreview file={txtactImageName1} />
          </div>

          {/* Image 2 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Activity Image 2</label>
            <input
              name="txtactImageName2"
              className="admin-txt-box"
              placeholder="Upload Vendor Image"
              type="file"
              onChange={handleFileUpload(setactImageName2)}
              style={{ height: 50, width: '100%' }}
            />
            <FilePreview file={txtactImageName2} />
          </div>

          {/* Image 3 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Activity Image 3</label>
            <input
              name="txtactImageName3"
              className="admin-txt-box"
              placeholder="Upload Vendor Image"
              type="file"
              onChange={handleFileUpload(setactImageName3)}
              style={{ height: 50, width: '100%' }}
            />
            <FilePreview file={txtactImageName3} />
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Activity Youtube Videos </div>
      <div className="divbox">
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            marginTop: '20px',
            marginBottom: '20px',
          }}
        >
          {/* Image 1 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 1</label>
            <input
              name="txtactYouTubeID1"
              className="vendor-input"
              onChange={(e) => setYouTube1(e.target.value)}
              required
            />
          </div>

          {/* Image 2 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 2</label>
            <input
              name="txtactYouTubeID2"
              className="vendor-input"
              onChange={(e) => setYouTube2(e.target.value)}
              required
            />
            <FilePreview file={txtactImageName2} />
          </div>

          {/* Image 3 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 3</label>
            <input
              name="txtactYouTubeID3"
              className="vendor-input"
              onChange={(e) => setYouTube3(e.target.value)}
              required
            />
            <FilePreview file={txtactImageName3} />
          </div>
        </div>
      </div>
      <div className="txtsubtitle">Activity Location </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Google Map Location</label>
              <input
                name="txtactGoogleMap"
                className="vendor-input"
                onChange={(e) => setactGoogleMap(e.target.value)}
                required
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Google Latitude</label>
              <input
                name="txtactGlat"
                className="vendor-input"
                onChange={(e) => setGlat(e.target.value)}
                required
              />{' '}
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Google Longitude</label>
              <input
                name="txtactGlan"
                className="vendor-input"
                onChange={(e) => setGlan(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Country</label>
              <select
                onChange={(e) => setCountryID(e.target.value)}
                name="txtactCountryID"
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

            <div className="vendor-column">
              <label className="vendor-label">City</label>
              <select
                name="txtactCityID"
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
              <label className="vendor-label">Address1</label>
              <input
                name="txtactAddress1"
                className="vendor-input"
                onChange={(e) => setAddress1(e.target.value)}
                required
              />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
                name="txtactAddress2"
                className="vendor-input"
                onChange={(e) => setAddress2(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>
      <div className="txtsubtitle"> Age Range </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Minimum Age</label>
              <input
                onChange={(e) => setMinAge(e.target.value)}
                name="txtactMinAge"
                className="vendor-input"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Maximum Age</label>
              <input
                onChange={(e) => setMaxAge(e.target.value)}
                name="txtactMaxAge"
                className="vendor-input"
              />
            </div>
          </div>
        </div>
        {/* // row end */}

        {/* // row start */}
        <div className="vendor-container">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="vendor-label">Gender</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactGender"
                value="BOYS"
                onChange={(e) => setGenderService(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> Boys</div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactGender"
                value="GIRLS"
                onChange={(e) => setGenderService(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> Girls</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactGender"
                value="BOTH"
                onChange={(e) => setGenderService(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> Both</div>
            </label>
          </div>
        </div>
        {/* // row end */}
      </div>
      {/* // row end */}

      <div className="txtsubtitle">Capacity Information </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Minimum Students</label>
              <input
                onChange={(e) => setMinStudent(e.target.value)}
                name="txtactMinStudent"
                className="vendor-input"
              />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Maximum Students</label>
              <input
                onChange={(e) => setMaxStudent(e.target.value)}
                name="txtactMaxStudent"
                className="vendor-input"
              />
            </div>
          </div>
        </div>
        {/* // row end */}
      </div>

      <div className="txtsubtitle">Price Per Student</div>

      <div className="divbox">
        {/* Table Header */}
        <CRow className="fw-bold text-center mb-2">
          <CCol sm={3}>Price</CCol>
          <CCol sm={3}>Student Range From</CCol>
          <CCol sm={3}>Student Range To</CCol>
          <CCol sm={3}></CCol> {/* Remove column */}
        </CRow>

        {/* Dynamic Form Rows */}
        {priceRanges.map((item, index) => (
          <CRow key={index} className="align-items-center mb-2">
            <CCol sm={3}>
              <input
                name="txtPricePerStudent"
                type="number"
                className="vendor-input w-100"
                placeholder="Price"
                value={item.price}
                onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
              />
            </CCol>
            <CCol sm={3}>
              <input
                name="txtStudentRangeFrom"
                type="text"
                className="vendor-input w-100 text-center"
                placeholder=""
                value={item.rangeFrom}
                onChange={(e) => handlePriceChange(index, 'rangeFrom', e.target.value)}
              />
            </CCol>
            <CCol sm={3}>
              <input
                name="txtStudentRangeTo"
                type="text"
                className="vendor-input w-100 text-center"
                placeholder=""
                value={item.rangeTo}
                onChange={(e) => handlePriceChange(index, 'rangeTo', e.target.value)}
              />
            </CCol>

            <CCol sm={3}>
              {priceRanges.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleRemoveRange(index)}
                >
                  Remove
                </button>
              )}
            </CCol>
          </CRow>
        ))}

        {/* Add More */}
        <CRow className="mt-3">
          <CCol>
            <button type="button" className="admin-buttonv1" onClick={handleAddRange}>
              Add More
            </button>
          </CCol>
        </CRow>
      </div>

      <div className="txtsubtitle">Set Availability</div>
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          {['sunday', 'monday'].map((day) => (
            <div
              key={day}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #ccc',
              }}
            >
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 8 }}>
                  <label>
                    {day}{' '}
                    <input
                      type="checkbox"
                      checked={!days[day].closed}
                      onChange={(e) => handleClosedChange(day, !e.target.checked)}
                    />{' '}
                    Available
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {days[day].times.map((range, index) => (
                    <div
                      key={index}
                      style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <label>
                        Start Time:{' '}
                        <input
                          className="admin-txt-box"
                          type="time"
                          value={range.start}
                          onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)}
                        />
                      </label>

                      <label>
                        End Time:{' '}
                        <input
                          className="admin-txt-box"
                          type="time"
                          value={range.end}
                          onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)}
                        />
                      </label>

                      <label>
                        Notes:{' '}
                        <input
                          type="text"
                          className="admin-txt-box"
                          value={range.note || ''}
                          placeholder="Optional notes"
                          onChange={() => {}} // if needed
                        />
                      </label>

                      <div>
                        Range Hours: <strong>{range.total || '0.00'}</strong>
                      </div>

                      {days[day].times.length > 1 && (
                        <button
                          type="button"
                          style={{
                            background: 'tomato',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleRemoveTimeRange(day, index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                  <div style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="admin-buttonv1"
                      onClick={() => handleAddMore(day)}
                    >
                      Add More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="txtsubtitle">Food Information</div>
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          {/* Header Row */}
          <CRow className="mb-2 fw-bold hbg">
            <CCol sm={3}>Food Name</CCol>
            <CCol sm={2}>Price</CCol>
            <CCol sm={3}>Notes</CCol>
            <CCol sm={2}>Food Image</CCol>
            <CCol sm={1}>Include</CCol>
            <CCol sm={1}></CCol> {/* For remove button */}
          </CRow>

          {/* Dynamic Rows */}
          {foods.map((item, index) => (
            <CRow key={index} className="mb-3 align-items-center">
              {/* Food Name */}
              <CCol sm={3}>
                <input
                  type="text"
                  className="admin-txt-box w-100"
                  placeholder="Enter name"
                  value={item.name}
                  onChange={(e) => handleFoodChange(index, 'name', e.target.value)}
                />
              </CCol>

              {/* Price */}
              <CCol sm={2}>
                <input
                  type="number"
                  className="admin-txt-box w-100"
                  placeholder="Enter price"
                  value={item.price}
                  onChange={(e) => handleFoodChange(index, 'price', e.target.value)}
                />
              </CCol>

              {/* Notes */}
              <CCol sm={3}>
                <input
                  type="text"
                  className="admin-txt-box w-100"
                  placeholder="Enter notes"
                  value={item.notes}
                  onChange={(e) => handleFoodChange(index, 'notes', e.target.value)}
                />
              </CCol>

              {/* Image Upload */}
              <CCol sm={2}>
                <input
                  type="file"
                  accept="image/*"
                  className="w-100"
                  onChange={(e) => handleFoodChange(index, 'image', e.target.files[0])}
                />
              </CCol>

              {/* Include Checkbox */}
              <CCol sm={1} className="text-center">
                <input
                  type="checkbox"
                  checked={item.include}
                  onChange={(e) => handleFoodChange(index, 'include', e.target.checked)}
                  style={{
                    transform: 'scale(1.5)',
                    accentColor: 'red',
                    cursor: 'pointer',
                  }}
                />
              </CCol>

              {/* Remove Button */}
              <CCol sm={1}>
                {foods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleFoodRemoveFood(index)}
                    className="btn btn-danger btn-sm"
                  >
                    Remove
                  </button>
                )}
              </CCol>
            </CRow>
          ))}

          {/* Add More Button */}
          <CRow className="mt-3">
            <CCol>
              <button type="button" className="admin-buttonv1" onClick={handleFoodAddMore}>
                Add More
              </button>
            </CCol>
          </CRow>
        </div>
      </div>

      <div className="txtsubtitle">Terms And Conditions</div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <textarea
            onChange={(e) => setAdminNotes(e.target.value)}
            name="txtactAdminNotes"
            className="vendor-input"
            rows={5}
          />
        </div>
        {/* // row end */}
      </div>
      <div className="button-container">
        <button className="admin-buttonv1" onClick={handlebtnSendToApprovalClick}>
            Send To Admin Approval
          </button>
        <button className="admin-buttonv1" onClick={handleSave}>
          Save
        </button>
        <button type="button" className="admin-buttonv1" onClick={() => navigate('/vendordata/activityinfo/activity/list')}>
          Cancel
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4> Send To Admin Approval</h4>
            <p>Are you sure you want to send this for admin approval?</p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={handleConfirm}>
                Yes
              </button>
              <button className="admin-buttonv1" onClick={handleCancel}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}
export default Vendor
