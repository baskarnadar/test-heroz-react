import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage,getAuthHeaders } from '../../../utils/operation'
import FilePreview from '../../widgets/FilePreview'
import { getFileNameFromUrl, getCurrentLoggedUserID } from '../../../utils/operation'
import { CRow, CCol } from '@coreui/react'

// ✅ Import the shared validator
import { validateActivityForm } from '../../../vendordata/activityinfo/activity/validate/validate'

const Vendor = () => {
  // === NEW: single flag to hide range & delete UI (kept code, just hidden)
  const HIDE_PRICE_RANGE_UI = true

  const [error, setError] = useState('')

  const [OrgtxtactImageName1, setOrgsetactImageName1] = useState('')
  const [OrgtxtactImageName2, setOrgsetactImageName2] = useState('')
  const [OrgtxtactImageName3, setOrgsetactImageName3] = useState('')

  const [getActivityIDVal, setActivityIDVal] = useState(null)
  const [ActivityData, setActivity] = useState(null)
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
  const [actRating, setactRating] = useState('') // ⭐ NEW: Activity Rating (decimal)
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

  const [foods, setFoods] = useState([
    { name: '', price: '', include: false, ChkRemoveFood: false },
  ])
  const [countries, setCountries] = useState([])
  const [cityList, setCityList] = useState([])

  // ✅ Auto-enforce price = 0 when Include is checked
  const handleFoodChange = (index, field, value) => {
    const updated = [...foods]
    if (field === 'include') {
      updated[index].include = value
      if (value === true) {
        updated[index].price = 0
      }
    } else if (field === 'price') {
      updated[index].price = updated[index].include ? 0 : value
    } else {
      updated[index][field] = value
    }
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

    // Calculate default new start and end time
    let lastEnd = existingTimes.length
      ? timeToMinutes(existingTimes[existingTimes.length - 1].end)
      : 480 // 8:00 AM

    if (lastEnd === null) lastEnd = 480

    const newStartMins = lastEnd
    const newEndMins = newStartMins + 60 // +1 hour

    const minutesToTime = (mins) => {
      let h = Math.floor(mins / 60)
      let m = mins % 60
      const suffix = h >= 12 ? 'PM' : 'AM'
      h = h % 12 || 12
      return `${h}:${m.toString().padStart(2, '0')} ${suffix}`
    }

    const newStart = minutesToTime(newStartMins)
    const newEnd = minutesToTime(newEndMins)

    // include note and total
    const newTimes = [
      ...existingTimes,
      {
        start: newStart,
        end: newEnd,
        note: '',
        total: '0.00',
      },
    ]

    setDays({
      ...days,
      [day]: { ...days[day], times: newTimes },
    })
  }

  const calculateTotal = (start, end) => {
    const startMinutes = timeToMinutes(start)
    const endMinutes = timeToMinutes(end)
    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) return ''
    return ((endMinutes - startMinutes) / 60).toFixed(2)
  }

  const [days, setDays] = useState({
    sunday: {
      times: [{ start: '', end: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    monday: {
      times: [{ start: '', end: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    tuesday: {
      times: [{ start: '', end: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    wednesday: {
      times: [{ start: '', end: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    thursday: {
      times: [{ start: '', end: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    friday: {
      times: [{ start: '', end: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    saturday: {
      times: [{ start: '', end: '', ChkRemoveDays: false, total: '' }],
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

  // ✅ compute row total + day total
  const handleTimeChange = (day, index, field, value) => {
    setDays((prevDays) => {
      const updatedTimes = [...prevDays[day].times]
      const prevRow = updatedTimes[index] || {}
      const nextRow = { ...prevRow, [field]: value }

      const s = String(nextRow.start || '').trim()
      const e = String(nextRow.end || '').trim()
      if (s && e) {
        // support both "HH:MM" and "h:mm AM/PM"
        let sMin = timeStringToMinutes(s)
        let eMin = timeStringToMinutes(e)
        if (sMin == null || eMin == null) {
          sMin = timeToMinutes(s)
          eMin = timeToMinutes(e)
        }
        if (sMin != null && eMin != null && eMin > sMin) {
          nextRow.total = ((eMin - sMin) / 60).toFixed(2)
        } else {
          nextRow.total = ''
        }
      } else {
        nextRow.total = ''
      }

      updatedTimes[index] = nextRow
      const dayTotal = updatedTimes.reduce((sum, t) => sum + Number(t.total || 0), 0)

      return {
        ...prevDays,
        [day]: {
          ...prevDays[day],
          times: updatedTimes,
          total: dayTotal.toFixed(2),
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

  const handleSubmit = async (actStatusVal, e) => {
    console.log('Submitting with status:', actStatusVal)
    if (e && e.preventDefault) e.preventDefault()

    // ✅ Run validation first (uses original images if no new upload)
    const validation = validateActivityForm({
      txtactName,
      selectedType,
      selectedCategories,
      txtactDesc,
      txtactImageName1: txtactImageName1 || OrgtxtactImageName1,
      txtactImageName2: txtactImageName2 || OrgtxtactImageName2,
      txtactImageName3: txtactImageName3 || OrgtxtactImageName3,
      txtactGoogleMap,
      txtactGlat,
      txtactGlan,
      ddactCountryID,
      ddactCityID,
      txtactAddress1,
      rdoactGender,
      priceRanges,
      days,
      foods,                // validator will force price=0 for included items
      txtactAdminNotes,
      actRating,            // ⭐ pass to validator (safe if unused)
    })

    if (!validation.ok) {
      setToastMessage(validation.message)
      setToastType('fail')
      return
    }

    setLoading(true)
    setToastMessage('')

    const overlap = hasOverlap(days)
    if (overlap) {
      setToastMessage(
        `Time range overlap on ${overlap.day}: ` +
          `${overlap.range1.start} - ${overlap.range1.end} overlaps with ` +
          `${overlap.range2.start} - ${overlap.range2.start}`,
      )
      setToastType('fail')
      setLoading(false)
      return
    }

    console.log(`${API_BASE_URL}/product/upload/uploadImage`)
    //Image 1
    let txtactImageName1Val = OrgtxtactImageName1
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
    } catch (error) {
      console.error('Error uploading tax file:', error)
      setToastMessage('Failed to upload tax file.')
      setToastType('fail')
    }

    //Image 2
    let txtactImageName2Val = OrgtxtactImageName2
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
    let txtactImageName3Val = OrgtxtactImageName3
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
        `${API_BASE_URL}/vendordata/activityinfo/activity/updateActivity`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ActivityID: getActivityIDVal,
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
            actRating: actRating === '' ? '' : Number(actRating), // ⭐ NEW: pass to API
            actStatus: actStatusVal,
            IsDataStatus: 1,
            ModifyBy: getCurrentLoggedUserID(),
          }),
        },
      )

      console.log('response')
      console.log(response)
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      await response.json()
      setToastMessage('Activity updated successfully!')
      setToastType('success')

      setTimeout(() => navigate('/vendordata/activityinfo/activity/list'), 2000)
    } catch (err) {
      console.error('Error updated Activity:', err)
      setToastMessage('Failed to updated Activity.')
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
        // send only filled rows
        if (!range.start || !range.end) return
        rows.push({
          AvailDaysHoursID: range.AvailDaysHoursID,
          DayName: dayName,
          StartTime: range.start,
          EndTime: range.end,
          Note: range.note || '',
          Total: range.total || '0.00',
          CreatedBy: getCurrentLoggedUserID(),
          ModifyBy: getCurrentLoggedUserID(),
          RemoveDays: range.ChkRemoveDays,
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
    const fetchInitialData = async () => {
      try {
        // Fetch Cities
        const citiesRes = await fetch(`${API_BASE_URL}/lookupdata/city/getcityalllist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const citiesResult = await citiesRes.json()
        if (citiesResult.data) {
          setCityList(citiesResult.data)
        }

        // Fetch Countries
        const countriesRes = await fetch(`${API_BASE_URL}/lookupdata/country/getcountrylist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const countriesResult = await countriesRes.json()
        if (countriesResult.data) {
          setCountries(countriesResult.data)
        }

        // Fetch Categories
        const categoryRes = await fetch(`${API_BASE_URL}/lookupdata/category/getCategoryAllList`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const categoryResult = await categoryRes.json()
        if (categoryResult.data) {
          setFetchCategories(categoryResult.data)
        }

        // Get ActivityID from URL
        const getSearchParams = () => {
          const search =
            window.location.search ||
            (window.location.hash && window.location.hash.includes('?')
              ? `?${window.location.hash.split('?')[1]}`
              : '')
          return new URLSearchParams(search)
        }

        const urlParams = getSearchParams()
        const ActivityIDVal = urlParams.get('ActivityID')

        if (ActivityIDVal) {
          fetchActivity(ActivityIDVal)
        } else {
          setError('ActivityID is missing in URL')
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        setError('Failed to load initial data.')
      }
    }

    fetchInitialData()
  }, [])

  //Edit
  useEffect(() => {
    console.log('ActivityData')
    console.log(ActivityData)
    if (!ActivityData) return

    setactImageName1(ActivityData.actImageName1Url)
    setactImageName2(ActivityData.actImageName2Url)
    setactImageName3(ActivityData.actImageName3Url)

    setOrgsetactImageName1(ActivityData.actImageName1)
    setOrgsetactImageName2(ActivityData.actImageName2)
    setOrgsetactImageName3(ActivityData.actImageName3)

    // Basic info
    setactName(ActivityData.actName || '')
    setactType(ActivityData.actTypeID || '')
    setSelectedCategories(ActivityData.actCategoryID || [])
    setactDesc(ActivityData.actDesc || '')

    // ⭐ NEW: Rating
    setactRating(
      ActivityData.actRating !== undefined && ActivityData.actRating !== null
        ? String(ActivityData.actRating)
        : ''
    )

    // YouTube IDs
    setYouTube1(ActivityData.actYouTubeID1 || '')
    setYouTube2(ActivityData.actYouTubeID2 || '')
    setYouTube3(ActivityData.actYouTubeID3 || '')

    // Location
    setactGoogleMap(ActivityData.actGoogleMap || '')
    setGlat(ActivityData.actGlat)
    setGlan(ActivityData.actGlan || '')
    setCountryID(ActivityData.actCountryID || '')
    setSelectedCityID(ActivityData.actCityID || '')
    setAddress1(ActivityData.actAddress1 || '')
    setAddress2(ActivityData.actAddress2 || '')

    // Age & Gender
    setMinAge(ActivityData.actMinAge || '')
    setMaxAge(ActivityData.actMaxAge || '')
    setGenderService(ActivityData.actGender || '')
    setMinStudent(ActivityData.actMinStudent || '')
    setMaxStudent(ActivityData.actMaxStudent || '')
    setAdminNotes(ActivityData.actAdminNotes || '')

    // Price list
    if (Array.isArray(ActivityData.priceList) && ActivityData.priceList.length > 0) {
      const formattedPriceRanges = ActivityData.priceList.map((item) => ({
        PriceID: item.PriceID,
        price: item.Price,
        rangeFrom: item.StudentRangeFrom,
        rangeTo: item.StudentRangeTo,
      }))
      setPriceRanges(formattedPriceRanges)
    } else {
      setPriceRanges([{ PriceID: '', price: '', rangeFrom: '', rangeTo: '' }])
    }

    // Set Food List
    if (Array.isArray(ActivityData.foodList)) {
      const mappedFoods = ActivityData.foodList.map((item) => ({
        FoodID: item.FoodID || '',
        name: item.FoodName || '',
        price: item.FoodPrice || '',
        notes: item.FoodNotes || '',
        image: item.FoodImage || null,
        include: item.Include || false,
        ChkRemoveFood: false,
      }))
      setFoods(mappedFoods)
    } else {
      setFoods([
        {
          FoodID: '',
          name: '',
          price: '',
          notes: '',
          image: null,
          include: false,
          ChkRemoveFood: false,
        },
      ])
    }

    // Set Availability
    if (Array.isArray(ActivityData.availList)) {
      const dayMap = {
        sunday: { closed: true, times: [] },
        monday: { closed: true, times: [] },
        tuesday: { closed: true, times: [] },
        wednesday: { closed: true, times: [] },
        thursday: { closed: true, times: [] },
        friday: { closed: true, times: [] },
        saturday: { closed: true, times: [] },
      }

      ActivityData.availList.forEach((item) => {
        const day = item.DayName.toLowerCase()
        if (!dayMap[day]) return

        dayMap[day].times.push({
          AvailDaysHoursID: item.AvailDaysHoursID,
          start: item.StartTime,
          end: item.EndTime,
          note: item.Note || '',
          total: item.Total || '0.00',
        })

        dayMap[day].closed = false
      })

      setDays(dayMap)
    }
  }, [ActivityData])

  useEffect(() => {
    // Extract ActivityID from the URL
    const getSearchParams = () => {
      const search =
        window.location.search ||
        (window.location.hash && window.location.hash.includes('?')
          ? `?${window.location.hash.split('?')[1]}`
          : '')
      return new URLSearchParams(search)
    }

    const urlParams = getSearchParams()
    const ActivityIDVal = urlParams.get('ActivityID')

    if (ActivityIDVal) {
      setActivityIDVal(ActivityIDVal)
      fetchActivity(ActivityIDVal)
      setActivity(ActivityIDVal)
    } else {
      setError('ActivityID is missing in URL')
    }
  }, [])

  const fetchActivity = async (ActivityIDVal) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ActivityID: ActivityIDVal, VendorID: getCurrentLoggedUserID() }),
      })

      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      if (data?.data?.actStatus !== 'DRAFT') {
        navigate(`/vendordata/activityinfo/activity/view?ActivityID=${ActivityIDVal}`)
        return
      }

      setActivity(data.data || [])
      // setTotalPages(Math.ceil(data.totalCount / ActivityPerPage)) // (left as-is if used elsewhere)
    } catch (error) {
      setError('Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

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
          FoodID: item.FoodID || null,
          FoodName: item.name || '',
          FoodPrice: item.price || '',
          FoodNotes: item.notes || '',
          FoodImage: uploadedImageKey || '',
          Include: item.include || false,
          RemoveFood: item.ChkRemoveFood || false,
        }
      }),
    )

    return foodData
  }

  //price ------------------------------------
  const [priceRanges, setPriceRanges] = useState([
    { price: '', rangeFrom: '', rangeTo: '', ChkRemovePrice: false },
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
      PriceID: item.PriceID || '',
      Price: item.price || '',
      StudentRangeFrom: item.rangeFrom || '',
      StudentRangeTo: item.rangeTo || '',
      RemovePrice: item.ChkRemovePrice || false,
    }))
  }
  //Country

  //Send to Admin Approval
  const handlebtnSendToApprovalClick = () => {
    setShowModal(true) // Show confirmation modal
  }
  const handleConfirm = () => {
    setShowModal(false)
    handleSubmit('WAITING-FOR-APPROVAL')
  }

  const handleCancel = () => {
    setShowModal(false)
  }

  //Save
  const handleSave = () => {
    handleSubmit('DRAFT')
  }
  return (
    <div>
      <div className="divhbg">
        {/* Left side: Title */}
        <div className="txtheadertitle">Modify Activity</div>

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
          <label>Activity Name <span style={{color:'red'}}>*</span></label>
          <input
            name="txtactName"
            className="admin-txt-box"
            type="text"
            required
            value={txtactName}
            onChange={(e) => setactName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label style={{ marginBottom: '10px', marginTop: '20px' }}>
            Activity Type <span style={{color:'red'}}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactTyper"
                value="SCHOOL"
                checked={selectedType === 'SCHOOL'}
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
                checked={selectedType === 'INDIVIDUAL'}
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
                checked={selectedType === 'MEMBER'}
                onChange={(e) => setactType(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> Member</div>
            </label>

          
          </div>
        </div>
  {/* ⭐ NEW: Activity Rating (decimal) */}
            <div style={{   alignItems: 'center', gap: 8,   }}>
              <label className="vendor-label" htmlFor="actRating" style={{ margin: 0 }}>
                Activity Rating
              </label>
              <input
                id="actRating"
                name="actRating"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="5"
                className="vendor-input"
                placeholder="e.g., 4.5"
                value={actRating}
                onChange={(e) => setactRating(e.target.value)}
                style={{ width: 120 }}
              />
            </div>
        <div style={{ marginBottom: '10px', marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Activity Categories <span style={{color:'red'}}>*</span>
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {fetchcategories.map((item) => (
              <label
                key={item.CategoryID}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <input
                  type="checkbox"
                  name="txtactCategoryID"
                  value={item.CategoryID}
                  checked={selectedCategories.includes(item.CategoryID)}
                  onChange={() => handleCheckboxChange(item.CategoryID)}
                  style={{
                    marginRight: 10,
                    transform: 'scale(1.6)',
                    cursor: 'pointer',
                    accentColor: 'red',
                  }}
                />
                <span className="pink-shadow4">{item.EnCategoryName}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Activity Description <span style={{color:'red'}}>*</span></label>
          <textarea
            name="txtactDesc"
            className="vendor-input"
            rows={4}
            value={txtactDesc}
            onChange={(e) => setactDesc(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="txtsubtitle">Activity Images <span style={{color:'red'}}>*</span></div>
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

      <div className="txtsubtitle">Activity Youtube Videos</div>
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
          {/* Link 1 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 1</label>
            <input
              name="txtactYouTubeID1"
              className="vendor-input"
              value={txtactYouTubeID1}
              onChange={(e) => setYouTube1(e.target.value)}
            />
          </div>

          {/* Link 2 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 2</label>
            <input
              name="txtactYouTubeID2"
              value={txtactYouTubeID2}
              className="vendor-input"
              onChange={(e) => setYouTube2(e.target.value)}
            />
          </div>

          {/* Link 3 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 3</label>
            <input
              name="txtactYouTubeID3"
              className="vendor-input"
              value={txtactYouTubeID3}
              onChange={(e) => setYouTube3(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Activity Location <span style={{color:'red'}}>*</span></div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Google Map Location <span style={{color:'red'}}>*</span></label>
              <input
                name="txtactGoogleMap"
                className="vendor-input"
                value={txtactGoogleMap}
                onChange={(e) => setactGoogleMap(e.target.value)}
                required
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Google Latitude <span style={{color:'red'}}>*</span></label>
              <input
                name="txtactGlat"
                className="vendor-input"
                value={txtactGlat}
                onChange={(e) => setGlat(e.target.value)}
                required
              />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Google Longitude <span style={{color:'red'}}>*</span></label>
              <input
                name="txtactGlan"
                value={txtactGlan}
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
              <label className="vendor-label">Country <span style={{color:'red'}}>*</span></label>
              <select
                onChange={(e) => setCountryID(e.target.value)}
                name="txtactCountryID"
                value={ddactCountryID}
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
              <label className="vendor-label">City <span style={{color:'red'}}>*</span></label>
              <select
                value={ddactCityID}
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
              <label className="vendor-label">Address1 <span style={{color:'red'}}>*</span></label>
              <input
                value={txtactAddress1}
                name="txtactAddress1"
                className="vendor-input"
                onChange={(e) => setAddress1(e.target.value)}
                required
              />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
                value={txtactAddress2}
                name="txtactAddress2"
                className="vendor-input"
                onChange={(e) => setAddress2(e.target.value)}
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
                value={txtactMinAge}
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
                value={txtactMaxAge}
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
            <label className="vendor-label">Gender <span style={{color:'red'}}>*</span></label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactGender"
                checked={rdoactGender === 'BOYS'}
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
                checked={rdoactGender === 'GIRLS'}
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
                checked={rdoactGender === 'BOTH'}
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

      <div className="txtsubtitle">Price Per Student <span style={{color:'red'}}>*</span></div>

      <div className="divbox">
        {/* Table Header */}
        <CRow className="fw-bold   mb-2">
          <CCol sm={3}>Price <span style={{color:'red'}}>*</span></CCol>
          <CCol
            sm={3}
            style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
          >
            Student Range From
          </CCol>
          <CCol
            sm={3}
            style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
          >
            Student Range To
          </CCol>
          <CCol
            sm={3}
            style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
          >
            Delete
          </CCol>
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
                min="0"
              />
            </CCol>
            <CCol
              sm={3}
              style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
            >
              <input
                name="txtStudentRangeFrom"
                type="text"
                className="vendor-input w-100 text-center"
                placeholder=""
                value={item.rangeFrom}
                onChange={(e) => handlePriceChange(index, 'rangeFrom', e.target.value)}
              />
            </CCol>
            <CCol
              sm={3}
              style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
            >
              <input
                name="txtStudentRangeTo"
                type="text"
                className="vendor-input w-100 text-center"
                placeholder=""
                value={item.rangeTo}
                onChange={(e) => handlePriceChange(index, 'rangeTo', e.target.value)}
              />
            </CCol>

            <CCol
              sm={3}
              style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
            >
              {item.PriceID ? (
                <input
                  key={index}
                  type="checkbox"
                  name="chkRemovePrice"
                  onChange={(e) => {
                    const updatedRanges = [...priceRanges]
                    updatedRanges[index].ChkRemovePrice = e.target.checked
                    setPriceRanges(updatedRanges)
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    accentColor: 'red',
                    cursor: 'pointer',
                  }}
                />
              ) : (
                priceRanges.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleRemoveRange(index)}
                  >
                    Remove
                  </button>
                )
              )}
            </CCol>
          </CRow>
        ))}

        {/* Add More */}
        <CRow className="mt-3" style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
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
          {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(
            (day) => (
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

                  {!days[day].closed && (
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
                              placeholder="Optional notes"
                              value={range.note || ''}
                              onChange={() => {}}
                              disabled // 🔒 optional note is not enabled
                            />
                          </label>

                          <div>
                            Range Hours: <strong>{range.total || '0.00'}</strong>
                          </div>

                          {days[day].times.length > 1 &&
                            (days[day].times[index].AvailDaysHoursID ? (
                              <input
                                type="checkbox"
                                name="ChkRemoveDays"
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  accentColor: 'red',
                                  cursor: 'pointer',
                                }}
                                onChange={(e) => {
                                  const updatedTimes = [...days[day].times]
                                  updatedTimes[index].ChkRemoveDays = e.target.checked

                                  setDays({
                                    ...days,
                                    [day]: {
                                      ...days[day],
                                      times: updatedTimes,
                                    },
                                  })
                                }}
                              />
                            ) : (
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
                            ))}
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
                  )}
                </div>
              </div>
            ),
          )}
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
            <CCol sm={1}>Delete</CCol> {/* For remove button */}
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
                  placeholder={item.include ? 'Included (0)' : 'Enter price'}
                  value={item.include ? 0 : (item.price ?? '')}
                  onChange={(e) => handleFoodChange(index, 'price', e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={item.include}  // 🔒 locked at 0 when included
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
                  title="If checked, price becomes 0"
                />
              </CCol>

              {/* Remove Button */}
              <CCol sm={1}>
                {item.FoodID ? (
                  <input
                    type="checkbox"
                    name="ChkRemoveFood"
                    onChange={(e) => {
                      const updatedFoods = [...foods]
                      updatedFoods[index].ChkRemoveFood = e.target.checked
                      setFoods(updatedFoods)
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      accentColor: 'red',
                      cursor: 'pointer',
                    }}
                  />
                ) : (
                  priceRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleFoodRemoveFood(index)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  )
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

      <div className="txtsubtitle">Terms And Conditions <span style={{color:'red'}}>*</span></div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <textarea
            onChange={(e) => setAdminNotes(e.target.value)}
            value={txtactAdminNotes}
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
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/vendordata/activityinfo/activity/list')}
        >
          Return
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
