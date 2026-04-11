import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL, HerozStarValue } from '../../../config'
import {
  DspToastMessage,
  getAuthHeaders,
  IsAdminLoginIsValid,
  getVatAmount, // ✅ ADDED
} from '../../../utils/operation'
import FilePreview from '../../../views/widgets/FilePreview'
import { getFileNameFromUrl, getCurrentLoggedUserID, dspstatusv1 } from '../../../utils/operation'
import { CRow, CCol } from '@coreui/react'

// ✅ bring the shared validator
import { validateActivityForm } from '../../../vendordata/activityinfo/activity/validate/validate'

// ✅ trip summary component
import TripSummaryVat from './tripsummaryvat'

// ✅ tiny error renderer (same as other page)
const ErrorText = ({ msg }) =>
  msg ? <div style={{ color: '#cf2037', fontSize: 12, marginTop: 4 }}>{msg}</div> : null

const Vendor = () => {
  const [error, setError] = useState('')

  const [OrgtxtactImageName1, setOrgsetactImageName1] = useState('')
  const [OrgtxtactImageName2, setOrgsetactImageName2] = useState('')
  const [OrgtxtactImageName3, setOrgsetactImageName3] = useState('')

  const [getActivityIDVal, setActivityIDVal] = useState(null)
  const [getVendorIDVal, setAVendorVal] = useState(null)
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

  // ✅ NEW: field-level errors holder
  const [errors, setErrors] = useState({})

  // === NEW: single flag to hide price-range & delete UI (kept logic, just hidden)
  const HIDE_PRICE_RANGE_UI = true

  // ✅ ADD (no removals): prevent runtime errors for code you already have
  const [formData, setFormData] = useState({
    daysAvailable: {},
    phoneNumbers: [''],
  })
  const [certificateFile, setCertificateFile] = useState(null)
  const [taxFile, setTaxFile] = useState(null)

  // --- helpers added (no removals) ---
  const uniqueBy = (arr, key) =>
    Array.from(new Map((arr || []).map((item) => [item?.[key], item])).values())

  // Fallbacks to avoid ReferenceError in this component
  const [__dummyTotalPages, __setDummyTotalPages] = useState(0)
  const setTotalPages = (val) => {
    __setDummyTotalPages(val)
  }
  const ActivityPerPage = 10

  // prevent duplicate fetches when two effects call fetchActivity
  const [lastFetchKey, setLastFetchKey] = useState(null)
  // --- end helpers ---

  // Define state for each input
  const [txtactName, setactName] = useState('')
  const [selectedType, setactType] = useState('') // was []; used like a string everywhere
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
  const [rdoactGender, setGenderService] = useState('') // was []
  const [txtactMinStudent, setMinStudent] = useState('') // was []
  const [txtactMaxStudent, setMaxStudent] = useState('') // was []

  const [txtactWhatsIncluded, setactWhatsIncluded] = useState('')
  const [txtactTripDetail, setactTripDetail] = useState('')
  const [txtactAdminNotes, setAdminNotes] = useState('')

  // ⭐ Activity Rating (0–5 UI). We’ll validate by mapping to 1–10 scale internally.
  const [actRating, setactRating] = useState('')

  const [foods, setFoods] = useState([
    { name: '', price: '', herozprice: '', include: false, ChkRemoveFood: false, notes: '', image: null },
  ])
  const [countries, setCountries] = useState([])
  const [cityList, setCityList] = useState([])

  // ✅ NEW: ADMIN LOGIN VALIDATION (as requested)
  useEffect(() => {
    IsAdminLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  // ---------------- VAT & SUMMARY NUMBERS (READ-ONLY) ----------------
  const vatPercentValue = Number(getVatAmount() || 0) // e.g. 15
  const vatRateValue = vatPercentValue / 100 // e.g. 0.15
  // -------------------------------------------------------------------

  // ✅ MEMBERSHIP detection (no removals)
  const typeUpper = String(selectedType || '').toUpperCase()
  const isMemberType = typeUpper === 'MEMBERSHIP' || typeUpper ==="MEMBERSHIP"

  // ⭐ FIXED FINANCIAL ROUNDING (2.447 → 2.45, etc.)
  const to2 = (v) => {
    const n = Number(v || 0)
    if (!Number.isFinite(n)) return '0.00'
    return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2)
  }

  // ✅ NEW: default formula for Total Star For Parents
  // Total Star For Parents = Total Star Value / Star Value
  const calcDefaultTotalStarForParents = (totalStarValue, starValue) => {
    const t = Number(totalStarValue || 0)
    const s = Number(starValue || 0)
    if (!Number.isFinite(t) || !Number.isFinite(s) || s <= 0) return ''
    return to2(t / s)
  }

  // ✅ star configs
  const starValueNum = Number(HerozStarValue || 0)

  const vatPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid #cf2037',
    borderRadius: 999,
    padding: '3px 10px',
    backgroundColor: 'rgba(207, 32, 55, 0.15)',
    color: '#cf2037',
    fontSize: 12,
    marginTop: 4,
    whiteSpace: 'nowrap',
  }

  // ✅ NEW: dynamic title for section (SCHOOL => Price Per Student else Star(Price) Information)
  const priceSectionTitle =
    String(selectedType || '').toUpperCase() === 'SCHOOL' ? 'Price Per Student' : 'Star (Price) Information'

  // ✅ NEW: requested border gray + rgba(0.5) yellow background for this section
  const priceSectionBoxStyle = {
    border: '1px solid gray',
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
    borderRadius: 10,
  }

  // === UPDATED: if include is turned on, force both prices to "0" and keep state in sync
  const handleFoodChange = (index, field, value) => {
    setFoods((prev) => {
      const updated = [...prev]
      // toggle / set field first
      updated[index] = { ...updated[index], [field]: value }
      // rule: when include == true -> prices must be 0
      if (field === 'include' && value === true) {
        updated[index].price = '0'
        updated[index].herozprice = '0'
      }
      return updated
    })
  }

  const handleFoodAddMore = () => {
    setFoods([...foods, { name: '', price: '', herozprice: '', include: false, notes: '', image: null }])
  }

  const handleFoodRemoveFood = (index) => {
    const updated = foods.filter((_, i) => i !== index)
    setFoods(updated)
  }

  /*  days */
  const handleAddMore = (day) => {
    const existingTimes = days[day].times

    // Calculate default new start and end time
    let lastEnd = existingTimes.length ? timeToMinutes(existingTimes[existingTimes.length - 1].end) : 480 // 08:00

    if (lastEnd === null) lastEnd = 480

    const newStartMins = lastEnd
    const newEndMins = newStartMins + 60 // +1 hour

    // Use "HH:MM" (24h) because inputs are type="time"
    const minutesToTime = (mins) => {
      let h = Math.floor(mins / 60)
      let m = mins % 60
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      return `${hh}:${mm}`
    }

    const newStart = minutesToTime(newStartMins)
    const newEnd = minutesToTime(newEndMins)

    // ✅ Include note and total
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
    return ((endMinutes - startMinutes) / 60).toFixed(2)
  }

  const [days, setDays] = useState({
    sunday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    monday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    tuesday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    wednesday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    thursday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    friday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    saturday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
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
    // supports "HH:MM"
    const [hh, mm] = String(time).split(':')
    const hours = parseInt(hh, 10)
    const minutes = parseInt(mm, 10)
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
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
      // auto-calc total when both set
      const s = updatedTimes[index].start
      const e = updatedTimes[index].end
      if (s && e) {
        updatedTimes[index].total = calculateTotal(s, e)
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

  const handleSubmit = async (actStatusVal, e) => {
    if (e && e.preventDefault) e.preventDefault()

    // ✅ 1) Build payload for validation (mirror the other page)
    // Note: our UI rating is 0–5. Convert to 1–10 *for validation only*.
    const ratingForValidation =
      actRating === '' ? '' : String(Math.min(10, Math.max(0, Number(actRating) * 2)))

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
      foods, // validator enforces include => price=0 rule & non-negative
      txtactAdminNotes,
      actRating: ratingForValidation, // mapped
      txtactMinAge,
      txtactMaxAge,
      txtactMinStudent,
      txtactMaxStudent,
    })

    if (!validation.ok) {
      setErrors(validation.errors || {}) // show errors under fields/sections
      setToastMessage(validation.message || 'Please correct the highlighted fields.')
      setToastType('fail')
      return
    }

    // ✅ clear errors if validation passed
    setErrors({})
    setLoading(true)
    setToastMessage('')

    // ✅ 2) Overlap check (your existing extra guard)
    const overlap = hasOverlap(days)
    if (overlap) {
      setToastMessage(
        `Time range overlap on ${overlap.day}: ${overlap.range1.start} - ${overlap.range1.end} overlaps with ${overlap.range2.start} - ${overlap.range2.end}`,
      )
      setToastType('fail')
      setLoading(false)
      return
    }

    // ✅ 3) Uploads + submit (unchanged)
    // Image 1
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
      console.error('Error uploading activity image 1:', error)
      setToastMessage('Failed to upload Activity Image 1.')
      setToastType('fail')
    }

    // Image 2
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
      console.error('Error uploading activity image 2:', error)
      setToastMessage('Failed to upload Activity Image 2.')
      setToastType('fail')
    }

    // Image 3
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
      console.error('Error uploading activity image 3:', error)
      setToastMessage('Failed to upload Activity Image 3.')
      setToastType('fail')
    }

    const actfoodDataVal = await getFoodData()
    const actavailDaysHoursVal = getAvailDaysHoursData()
    const actPriceDataVal = getPriceData()

    // ✅ NEW: derive VAT fields from your existing VAT numbers
    const effectiveVatPercent = vatPercentValue // same as getVatAmount()
    const effectiveVatRate = vatRateValue // percent / 100
    const firstPriceNum = tripBasePrice // first range base price
    const dec = (v) => Number(v || 0).toFixed(2) // simple 2-decimal helper

    const actPriceVatPercentageVal = effectiveVatPercent
    const actPriceVatAmountVal = dec(firstPriceNum * effectiveVatRate)
    try {
      const response = await fetch(`${API_BASE_URL}/vendordata/activityinfo/activity/updateActivity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ActivityID: getActivityIDVal,
          VendorID: getVendorIDVal,
          actName: txtactName || '',
          actTypeID: selectedType,
          actCategoryID: selectedCategories,
          actDesc: txtactDesc || '',

          actImageName1: txtactImageName1Val,
          actImageName2: txtactImageName2Val,
          actImageName3: txtactImageName3Val,

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
          actPriceVatPercentage: actPriceVatPercentageVal,
          actPriceVatAmount: actPriceVatAmountVal,
          actAvailDaysHours: actavailDaysHoursVal,
          actFood: actfoodDataVal,

          actWhatsIncluded: txtactWhatsIncluded || '',
          actTripDetail: txtactTripDetail || '',

          actAdminNotes: txtactAdminNotes || '',
          // keep UI scale (0–5) for backend, as in your current page
          actRating: actRating === '' ? '' : Number(actRating),

          actStatus: actStatusVal,
          IsDataStatus: 1,
          ModifyBy: getCurrentLoggedUserID(),
        }),
      })

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      await response.json()
      setToastMessage('Activity updated successfully!')
      setToastType('success')

      // ✅ NEW REDIRECT LOGIC:
      // if we updated the status to APPROVED, go to view page with same ActivityID & VendorID
      if (actStatusVal === 'APPROVED') {
        setTimeout(() => {
          navigate(`/admindata/activityinfo/activity/view?ActivityID=${getActivityIDVal}&VendorID=${getVendorIDVal}`)
        }, 2000)
      } else {
        // keep your original behavior for other statuses
        setTimeout(() => navigate('/admindata/activityinfo/activity/list'), 2000)
      }
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

  const getSearchParams = () => {
    const search =
      window.location.search ||
      (window.location.hash && window.location.hash.includes('?')
        ? `?${window.location.hash.split('?')[1]}`
        : '')
    return new URLSearchParams(search)
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
          setCityList(uniqueBy(citiesResult.data, 'CityID')) // dedupe
        }

        // Fetch Countries
        const countriesRes = await fetch(`${API_BASE_URL}/lookupdata/country/getcountrylist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const countriesResult = await countriesRes.json()
        if (countriesResult.data) {
          setCountries(uniqueBy(countriesResult.data, 'CountryID')) // dedupe
        }

        // Fetch Categories
        const categoryRes = await fetch(`${API_BASE_URL}/lookupdata/category/getCategoryAllList`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const categoryResult = await categoryRes.json()
        if (categoryResult.data) {
          // ✅ keep your existing state name
          setFetchCategories(uniqueBy(categoryResult.data, 'CategoryID')) // dedupe
          // ✅ also keep the other state (no removals)
          setFetchedCategories(uniqueBy(categoryResult.data, 'CategoryID'))
        }

        // Get ActivityID from URL
        const urlParams = getSearchParams()
        const ActivityIDVal = urlParams.get('ActivityID')
        if (ActivityIDVal) {
          const key = `${ActivityIDVal}|`
          if (lastFetchKey !== key) {
            setLastFetchKey(key)
            fetchActivity(ActivityIDVal)
          }
        } else {
          setError('ActivityID is missing in URL')
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        setError('Failed to load initial data.')
      }
    }

    fetchInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  //Edit
  useEffect(() => {
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

    // ⭐ load rating (UI 0–5)
    setactRating(
      ActivityData?.actRating !== undefined && ActivityData?.actRating !== null
        ? String(ActivityData.actRating)
        : '',
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
    setactWhatsIncluded(ActivityData.actWhatsIncluded || '')
    setactTripDetail(ActivityData.actTripDetail || '')
    setAdminNotes(ActivityData.actAdminNotes || '')

    // ✅ NEW: ROOT-LEVEL fallbacks (your JSON shows these at root)
    const rootStarValue =
      ActivityData?.StarValue ??
      ActivityData?.starValue ??
      ActivityData?.HerozStarValue ??
      null

    const rootTotalStarValue =
      ActivityData?.TotalStarValue ??
      ActivityData?.totalStarValue ??
      ActivityData?.TotalStarValueAmount ??
      null

    const rootTotalStarForParents =
      ActivityData?.TotalStarForParents ??
      ActivityData?.totalStarForParents ??
      ActivityData?.TotalStarForParentsValue ??
      null

    // Set Price list
    if (Array.isArray(ActivityData.priceList) && ActivityData.priceList.length > 0) {
      const formattedPriceRanges = ActivityData.priceList.map((item) => {
        const herozPriceNum = Number(item.HerozStudentPrice || 0)
        const herozVatAmount = herozPriceNum * vatRateValue

        // ✅ base/vat for this row
        const vendorBase = Number(item.Price || 0)
        const vendorVat = vendorBase * vatRateValue

        // ✅ Total Star Value from API:
        // Prefer priceList item → else ROOT (ActivityData.TotalStarValue) → else compute (Price + VAT)
        const apiTotalStarValueFromItem =
          item.TotalStarValue ?? item.TotalStarValueAmount ?? item.TotalStarValues ?? item.TotalStar ?? null
        const computedTotalStarValue = vendorBase + vendorVat
        const totalStarValueFinal =
          apiTotalStarValueFromItem !== null &&
          apiTotalStarValueFromItem !== undefined &&
          String(apiTotalStarValueFromItem).trim() !== ''
            ? Number(apiTotalStarValueFromItem || 0)
            : rootTotalStarValue !== null &&
                rootTotalStarValue !== undefined &&
                String(rootTotalStarValue).trim() !== ''
              ? Number(rootTotalStarValue || 0)
              : computedTotalStarValue

        // ✅ Star Value from API:
        // Prefer priceList item → else ROOT (ActivityData.StarValue) → else config HerozStarValue
        const apiStarValueFromItem = item.StarValue ?? item.StarValues ?? item.HerozStarValue ?? null
        const starValueFinal =
          apiStarValueFromItem !== null &&
          apiStarValueFromItem !== undefined &&
          String(apiStarValueFromItem).trim() !== ''
            ? Number(apiStarValueFromItem || 0)
            : rootStarValue !== null && rootStarValue !== undefined && String(rootStarValue).trim() !== ''
              ? Number(rootStarValue || 0)
              : starValueNum

        // ✅ Total Star For Parents:
        // Prefer priceList item → else ROOT (ActivityData.TotalStarForParents) → else formula
        const existingParentsStarFromItem =
          item.TotalStarForParents ??
          item.TotalStarForParentsValue ??
          item.TotalStarParents ??
          item.TotalStarForParent ??
          ''

        const existingParentsStarFinal =
          existingParentsStarFromItem !== '' &&
          existingParentsStarFromItem !== null &&
          existingParentsStarFromItem !== undefined &&
          String(existingParentsStarFromItem).trim() !== ''
            ? existingParentsStarFromItem
            : rootTotalStarForParents !== null &&
                rootTotalStarForParents !== undefined &&
                String(rootTotalStarForParents).trim() !== ''
              ? rootTotalStarForParents
              : ''

        // ✅ Only apply formula when there is NO value from API (item/root)
        const defaultParentsStar = calcDefaultTotalStarForParents(totalStarValueFinal, starValueFinal)

        return {
          PriceID: item.PriceID,
          price: item.Price,
          HerozStudentPrice: item.HerozStudentPrice,
          HerozStudentPriceVatAmount: herozVatAmount.toFixed(2),
          rangeFrom: item.StudentRangeFrom,
          rangeTo: item.StudentRangeTo,

          // ✅ keep these in state so we can "get value and display" + send payload
          TotalStarValue: totalStarValueFinal, // number
          StarValue: starValueFinal, // number

          // ✅ IMPORTANT:
          // If API gives TotalStarForParents (item/root) => set it and DO NOT calculate.
          // If API does NOT give value => calculate TotalStarValue/StarValue.
          TotalStarForParents:
            existingParentsStarFinal !== '' &&
            existingParentsStarFinal !== null &&
            existingParentsStarFinal !== undefined &&
            String(existingParentsStarFinal).trim() !== ''
              ? String(existingParentsStarFinal)
              : defaultParentsStar,

          // ✅ manual flag = true only when API provided value
          __parentsStarManual:
            existingParentsStarFinal !== '' &&
            existingParentsStarFinal !== null &&
            existingParentsStarFinal !== undefined &&
            String(existingParentsStarFinal).trim() !== '',
        }
      })
      setPriceRanges(formattedPriceRanges)
    } else {
      setPriceRanges([
        {
          PriceID: '',
          price: '',
          HerozStudentPrice: '',
          rangeFrom: '',
          rangeTo: '',
          TotalStarValue: '',
          StarValue: '',
          TotalStarForParents: '',
          __parentsStarManual: false,
        },
      ])
    }

    // Set Food List ( Display Food Data)
    if (Array.isArray(ActivityData.foodList)) {
      const mappedFoods = ActivityData.foodList.map((item) => ({
        FoodID: item.FoodID || '',
        name: item.FoodName || '',
        price: item.FoodPrice || '',
        herozprice: item.FoodHerozPrice || '',
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
          herozprice: '',
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
        const day = (item.DayName || '').toLowerCase()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ActivityData])

  // ✅ NEW: auto-redirect on load if actStatus is APPROVED
  useEffect(() => {
    const status = ActivityData?.actStatus
    if (status === 'APPROVED' && getActivityIDVal && getVendorIDVal) {
      const timer = setTimeout(() => {
        navigate(`/admindata/activityinfo/activity/view?ActivityID=${getActivityIDVal}&VendorID=${getVendorIDVal}`)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [ActivityData, getActivityIDVal, getVendorIDVal, navigate])

  useEffect(() => {
    const urlParams = getSearchParams()
    const ActivityIDVal = urlParams.get('ActivityID')
    const VendorIDVal = urlParams.get('VendorID')

    if (ActivityIDVal) {
      setActivityIDVal(ActivityIDVal)
      setAVendorVal(VendorIDVal)
      const key = `${ActivityIDVal}|${VendorIDVal || ''}`
      if (lastFetchKey !== key) {
        setLastFetchKey(key)
        fetchActivity(ActivityIDVal, VendorIDVal)
      }
    } else {
      setError('ActivityID is missing in URL')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchActivity = async (ActivityIDVal, VendorIDVal) => {
    const key = `${ActivityIDVal}|${VendorIDVal || ''}`
    if (lastFetchKey === key && loading) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ActivityID: ActivityIDVal, VendorID: VendorIDVal }),
      })

      if (!response.ok) throw new Error('Failed to fetch activities1')

      const jsonResponse = await response.json()
      // Pretty print for debugging
      console.log('📦 getActivity JSON:', JSON.stringify(jsonResponse, null, 2))

      setActivity(jsonResponse.data || [])
      setTotalPages(Math.ceil((jsonResponse.totalCount || 0) / (ActivityPerPage || 1)))
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

        // Guarantee price zeros if include is true
        const priceOut = item.include ? '0' : item.price || ''
        const herozOut = item.include ? '0' : item.herozprice || ''

        // ⭐ VAT CALCULATIONS
        const basePrice = Number(priceOut || 0)
        const baseHeroz = Number(herozOut || 0)

        const foodVat = basePrice * vatRateValue
        const herozVat = baseHeroz * vatRateValue

        return {
          FoodID: item.FoodID || null,
          FoodName: item.name || '',
          FoodPrice: priceOut,

          // ⭐ NEW — FOOD VAT (Price)
          FoodPriceVatPercentage: vatPercentValue, // e.g., 15
          FoodPriceVatAmount: foodVat.toFixed(2), // price * VAT %

          // ⭐ EXISTING + VAT
          FoodHerozPrice: herozOut,
          FoodHerozPriceVatAmount: herozVat.toFixed(2),

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
    {
      price: '',
      HerozStudentPrice: '',
      rangeFrom: '',
      rangeTo: '',
      ChkRemovePrice: false,
      TotalStarForParents: '',
      TotalStarValue: '',
      StarValue: '',
      __parentsStarManual: false, // ✅ NEW internal flag
    },
  ])

  // ✅ UPDATED: when Base price changes -> TotalStarValue and TotalStarForParents must change automatically
  // ✅ Admin can still edit TotalStarForParents. If they edit, we mark manual=true.
  // ✅ If Base price changes again, we auto-recalculate (your requirement) and reset manual=false.
  const handlePriceChange = (index, field, value) => {
    setPriceRanges((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }

      // ✅ Keep StarValue in state always (so payload always has it)
      updated[index].StarValue = starValueNum

      // ✅ If admin edits TotalStarForParents => manual mode
      if (field === 'TotalStarForParents') {
        updated[index].__parentsStarManual = true
        return updated
      }

      // ✅ When MEMBER and price changes:
      // - recompute TotalStarValue (price + VAT)
      // - recompute TotalStarForParents ALWAYS (auto)
      if (isMemberType && field === 'price') {
        const basePrice = Number(updated[index].price || 0)
        const vatAmount = basePrice * vatRateValue
        const totalStarValue = basePrice + vatAmount

        // ✅ store for payload + display
        updated[index].TotalStarValue = totalStarValue

        // ✅ AUTO update (required)
        updated[index].TotalStarForParents = calcDefaultTotalStarForParents(totalStarValue, starValueNum)

        // ✅ because it is derived from price now
        updated[index].__parentsStarManual = false
      }

      // Non-member behavior unchanged
      return updated
    })
  }

  const getPriceData = () => {
    return priceRanges.map((item) => {
      const baseHeroz = Number(item.HerozStudentPrice || 0)
      const herozVat = baseHeroz * vatRateValue // ← VAT CALCULATION

      // ✅ NEW: compute total star value for payload (prefer state value if present)
      const basePrice = Number(item.price || 0)
      const vendorVat = basePrice * vatRateValue

      const computedTotalStarValue = basePrice + vendorVat
      const totalStarValueOut =
        item.TotalStarValue !== undefined && item.TotalStarValue !== null && String(item.TotalStarValue).trim() !== ''
          ? Number(item.TotalStarValue || 0)
          : computedTotalStarValue

      const starValueOut =
        item.StarValue !== undefined && item.StarValue !== null && String(item.StarValue).trim() !== ''
          ? Number(item.StarValue || 0)
          : starValueNum

      return {
        PriceID: item.PriceID || '',
        Price: item.price || '',
        HerozStudentPrice: item.HerozStudentPrice || '',
        HerozStudentPriceVatAmount: herozVat.toFixed(2), // ← ADDED HERE

        // ✅ REQUIRED: send these 3 fields in payload
        TotalStarValue: to2(totalStarValueOut),
        StarValue: starValueOut,
        TotalStarForParents: item.TotalStarForParents || '',

        // keep these fields for backward compatibility
        StudentRangeFrom: item.rangeFrom || '',
        StudentRangeTo: item.rangeTo || '',
        RemovePrice: item.ChkRemovePrice || false,
      }
    })
  }

  //Send to Admin Approval
  const handleSave = () => {
    setShowModal(true)
  }
  const handleUnPublish = () => {
    handleSubmit('WAITING-FOR-APPROVAL')
  }
  const handleUnPending = () => {
    handleSubmit('PENDING')
  }

  const handleConfirm = () => {
    setShowModal(false)
    handleSubmit('APPROVED')
  }

  const handleCancel = () => {
    setShowModal(false)
  }

  const firstRange = priceRanges && priceRanges.length > 0 ? priceRanges[0] : null

  const tripBasePrice = firstRange ? Number(firstRange.price || 0) : 0
  const tripBaseHerozPrice = firstRange ? Number(firstRange.HerozStudentPrice || 0) : 0

  const tripVatAmount = tripBasePrice * vatRateValue
  const tripHerozVatAmount = tripBaseHerozPrice * vatRateValue

  const foodBaseAmount = foods.reduce((sum, item) => sum + (item.include ? 0 : Number(item.price || 0)), 0)
  const foodHerozBaseAmount = foods.reduce((sum, item) => sum + (item.include ? 0 : Number(item.herozprice || 0)), 0)

  const foodVatAmount = foodBaseAmount * vatRateValue
  const foodHerozVatAmount = foodHerozBaseAmount * vatRateValue

  const totalBaseAmount = tripBasePrice + foodBaseAmount
  const totalHerozBaseAmount = tripBaseHerozPrice + foodHerozBaseAmount

  const totalVatAmount = tripVatAmount + foodVatAmount
  const totalHerozVatAmount = tripHerozVatAmount + foodHerozVatAmount

  const totalWithVat = totalBaseAmount + totalVatAmount
  const totalHerozWithVat = totalHerozBaseAmount + totalHerozVatAmount

  const totalTripCost = totalWithVat + totalHerozWithVat

  const starBoxStyle = {
    border: '1px solid #9b9b9b',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 0, 0.3)',
  }

  const starBoxPlainStyle = {
    border: 'none',
    backgroundColor: 'transparent',
    boxShadow: 'none',
  }

  // ✅ NEW: Pink background style for:
  // Total Star Value, Star Value, Total Star For Parents (as you asked)
  const starPinkStyle = {
    border: '1px solid #cf2037',
    borderRadius: 10,
    backgroundColor: 'rgba(248, 234, 243, 1)', // pink
    boxShadow: 'none',
  }

  // ✅ NEW: Pink header background for the 3 columns
  const starHeaderPink = { backgroundColor: 'rgba(248, 234, 243, 1)' }

  return (
    <div>
      {/* STATUS BANNER */}
      <div className="msgbox" style={{ marginBottom: '20px', marginTop: '20px' }}>
        <div className="form-group text-center">
          <div style={{ padding: '20px' }}>
            <b>ACTIVITY STATUS : </b> {dspstatusv1(ActivityData?.actStatus)}
          </div>
        </div>
      </div>

      {/* VENDOR INFO — ADDED AT THE TOP */}
      <div
        className="divbox"
        style={{
          marginBottom: 16,
          background: '#f6fff2',
          border: '1px solid #dbeed0',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            padding: '12px 16px',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Vendor Name</div>
            <div className="admin-lbl-box">{ActivityData?.vdrName || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Club Name</div>
            <div className="admin-lbl-box">{ActivityData?.vdrClubName || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Mobile</div>
            <div className="admin-lbl-box">{ActivityData?.vdrMobileNo1 || '-'}</div>
          </div>
        </div>
      </div>

      <div className="divhbg">
        {/* Left side: Title */}
        <div className="txtheadertitle">Activity</div>

        {/* Right side: Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1 btn-green" onClick={handleSave}>
            PUBLISH
          </button>
          <button
            className="admin-buttonv1"
            style={{ backgroundColor: 'Gray', color: 'white' }}
            onClick={handleUnPending}
          >
            Pending
          </button>
          <button
            className="admin-buttonv1"
            style={{ backgroundColor: 'orange', color: 'white' }}
            onClick={handleUnPublish}
          >
            SAVE & UNPUBLISH
          </button>

          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/activityinfo/activity/list')}
          >
            Return
          </button>
        </div>
      </div>

      <div className="txtsubtitle">Activity Information</div>

      <div className="divbox">
        <div className="form-group">
          <label>
            Activity Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            name="txtactName"
            className="admin-txt-box"
            type="text"
            required
            value={txtactName}
            onChange={(e) => setactName(e.target.value)}
          />
          <ErrorText msg={errors.txtactName} />
        </div>

        <div className="form-group">
          <label style={{ marginBottom: '10px', marginTop: '20px' }}>
            Activity Type <span style={{ color: 'red' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                value="MEMBERSHIP"
                checked={selectedType ==="MEMBERSHIP"}
                onChange={(e) => setactType(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> Member</div>
            </label>
          </div>
          <ErrorText msg={errors.selectedType} />
        </div>

        {/* ⭐ Activity Rating */}
        <div className="form-group" style={{ marginTop: 8 }}>
          <label>
            Activity Rating <span style={{ color: 'red' }}>*</span>
          </label>
          <input
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
            style={{ width: 140 }}
          />
          {/* We still use errors.actRating from shared validator */}
          <ErrorText msg={errors.actRating} />
        </div>

        <div style={{ marginBottom: '10px', marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Activity Categories <span style={{ color: 'red' }}>*</span>
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {fetchcategories.map((item, i) => (
              <label key={`${item.CategoryID}-${i}`}>
                <input
                  type="checkbox"
                  name="txtactCategoryID"
                  value={item.CategoryID}
                  checked={selectedCategories.includes(item.CategoryID)}
                  onChange={() => handleCheckboxChange(item.CategoryID)}
                  style={{
                    marginRight: 18,
                    marginLeft: 18,
                    transform: 'scale(2.0)',
                    cursor: 'pointer',
                    accentColor: 'red',
                  }}
                />
                <span className="pink-shadow4">{item.EnCategoryName}</span>
              </label>
            ))}
          </div>
          <ErrorText msg={errors.selectedCategories} />
        </div>

        <div className="form-group">
          <label>
            Activity Description <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            name="txtactDesc"
            className="vendor-input"
            rows={4}
            value={txtactDesc}
            onChange={(e) => setactDesc(e.target.value)}
            required
          />
          <ErrorText msg={errors.txtactDesc} />
        </div>
      </div>

      <div className="txtsubtitle">
        Activity Images <span style={{ color: 'red' }}>*</span>
      </div>
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
            {/* Show overall images error here too */}
            <ErrorText msg={errors.txtactImageName1 || errors.images} />
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
            <ErrorText msg={errors.txtactImageName2 || errors.images} />
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
            <ErrorText msg={errors.txtactImageName3 || errors.images} />
          </div>
        </div>
        {/* Keep section-level too (works with current validator) */}
        <ErrorText msg={errors.images} />
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
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 1</label>
            <input
              name="txtactYouTubeID1"
              className="vendor-input"
              value={txtactYouTubeID1}
              onChange={(e) => setYouTube1(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 2</label>
            <input
              name="txtactYouTubeID2"
              value={txtactYouTubeID2}
              className="vendor-input"
              onChange={(e) => setYouTube2(e.target.value)}
            />
          </div>

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

      <div className="txtsubtitle">
        Activity Location <span style={{ color: 'red' }}>*</span>
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Google Map Location</label>
              <input
                name="txtactGoogleMap"
                className="vendor-input"
                value={txtactGoogleMap}
                onChange={(e) => setactGoogleMap(e.target.value)}
                required
              />
              <ErrorText msg={errors.txtactGoogleMap} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Google Latitude</label>

              <input
                name="txtactGlat"
                className="vendor-input"
                value={txtactGlat}
                onChange={(e) => setGlat(e.target.value)}
                required
              />
              <ErrorText msg={errors.txtactGlat} />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Google Longitude</label>
              <input
                name="txtactGlan"
                value={txtactGlan}
                className="vendor-input"
                onChange={(e) => setGlan(e.target.value)}
                required
              />
              <ErrorText msg={errors.txtactGlan} />
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
                {countries.map((country, i) => (
                  <option key={`${country.CountryID}-${i}`} value={country.CountryID}>
                    {country.EnCountryName}
                  </option>
                ))}
              </select>
              <ErrorText msg={errors.ddactCountryID} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">City</label>
              <select
                value={ddactCityID}
                name="txtactCityID"
                className="admin-txt-box"
                onChange={(e) => setSelectedCityID(e.target.value)}
                required
              >
                <option value="">Select City</option>
                {cityList.map((city, i) => (
                  <option key={`${city.CityID}-${i}`} value={city.CityID}>
                    {city.EnCityName}
                  </option>
                ))}
              </select>
              <ErrorText msg={errors.ddactCityID} />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Address1</label>
              <input
                value={txtactAddress1}
                name="txtactAddress1"
                className="vendor-input"
                onChange={(e) => setAddress1(e.target.value)}
                required
              />
              <ErrorText msg={errors.txtactAddress1} />
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
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">
                Minimum Age <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                value={txtactMinAge}
                onChange={(e) => setMinAge(e.target.value)}
                name="txtactMinAge"
                className="vendor-input"
              />
              <ErrorText msg={errors.txtactMinAge} />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">
                Maximum Age <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                value={txtactMaxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                name="txtactMaxAge"
                className="vendor-input"
              />
              <ErrorText msg={errors.txtactMaxAge} />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="vendor-label">
              Gender <span style={{ color: 'red' }}>*</span>
            </label>
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
          <ErrorText msg={errors.rdoactGender} />
        </div>
      </div>

      <div className="txtsubtitle">
        Capacity Information <span style={{ color: 'red' }}>*</span>
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Minimum Students</label>
              <input
                value={txtactMinStudent}
                onChange={(e) => setMinStudent(e.target.value)}
                name="txtactMinStudent"
                className="vendor-input"
              />
              <ErrorText msg={errors.txtactMinStudent} />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Maximum Students</label>
              <input
                value={txtactMaxStudent}
                onChange={(e) => setMaxStudent(e.target.value)}
                name="txtactMaxStudent"
                className="vendor-input"
              />
              <ErrorText msg={errors.txtactMaxStudent} />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ TITLE CHANGES BASED ON actTypeID (selectedType) */}
      <div className="txtsubtitle">
        {priceSectionTitle} <span style={{ color: 'red' }}>*</span>
        {vatPercentValue > 0 && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 13,
              border: '1px solid #cf2037',
              borderRadius: 999,
              padding: '3px 10px',
              backgroundColor: 'rgba(207, 32, 55, 0.15)',
              color: '#cf2037',
              display: 'inline-flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            + VAT {vatPercentValue.toFixed(2)}%
          </span>
        )}
      </div>

      {/* ✅ SECTION BORDER GRAY + RGBA 0.5 YELLOW BACKGROUND */}
      <div className="divbox" style={priceSectionBoxStyle}>
        {/* ✅ UPDATED: Membership columns added but no code removed */}
        <CRow className="fw-bold mb-2">
          <CCol sm={3}>Vendor Base Price</CCol>

          {!isMemberType && (
            <CCol sm={3} style={{ backgroundColor: '#f8eaf3ff' }}>
              Heroz Profit
            </CCol>
          )}

          {isMemberType && (
            <>
              <CCol sm={2} style={{ backgroundColor: 'rgba(248, 234, 243, 1)' }}>
                Total Star Value
              </CCol>
              <CCol sm={2} style={{ backgroundColor: 'rgba(248, 234, 243, 1)' }}>
                Star Value
              </CCol>
              <CCol sm={3} style={{ backgroundColor: 'rgba(248, 234, 243, 1)' }}>
                Total Star For Parents
              </CCol>
            </>
          )}
        </CRow>

        {priceRanges.map((item, index) => {
          const basePrice = Number(item.price || 0)
          const baseHerozPrice = Number(item.HerozStudentPrice || 0)
          const vatAmount = basePrice * vatRateValue
          const vatHerozAmount = baseHerozPrice * vatRateValue

          // ✅ MEMBERSHIP total star value (price + VAT) OR non-member normal calc stays unchanged visually
          const computedRowTotalStarValue = isMemberType
            ? basePrice + vatAmount
            : basePrice + baseHerozPrice + vatAmount + vatHerozAmount

          // ✅ "get value and display" (prefer API/state value if present)
          const stateOrApiRowTotalStarValue =
            item.TotalStarValue !== undefined && item.TotalStarValue !== null && String(item.TotalStarValue).trim() !== ''
              ? Number(item.TotalStarValue || 0)
              : computedRowTotalStarValue

          const stateOrApiStarValue =
            item.StarValue !== undefined && item.StarValue !== null && String(item.StarValue).trim() !== ''
              ? Number(item.StarValue || 0)
              : starValueNum

          // ✅ IMPORTANT:
          // If API provided TotalStarForParents -> show it directly (no formula).
          // Only if empty -> show formula.
          const displayParentsStar =
            isMemberType && String(item.TotalStarForParents ?? '').trim() === ''
              ? calcDefaultTotalStarForParents(stateOrApiRowTotalStarValue, stateOrApiStarValue)
              : item.TotalStarForParents

          return (
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
                <ErrorText
                  msg={
                    (errors.priceRanges && errors.priceRanges[index] && errors.priceRanges[index].price) ||
                    (index === 0 ? errors.price : '')
                  }
                />
                {vatPercentValue > 0 && (
                  <div>
                    <span style={vatPillStyle}>{vatAmount.toFixed(2)}</span>
                  </div>
                )}
              </CCol>

              {!isMemberType && (
                <CCol sm={3} style={{ backgroundColor: '#f8eaf3ff' }}>
                  <input
                    name="txtHerozStudentPrice"
                    type="number"
                    className="vendor-input w-100"
                    placeholder="Heroz Price"
                    value={item.HerozStudentPrice}
                    onChange={(e) => handlePriceChange(index, 'HerozStudentPrice', e.target.value)}
                  />
                  <ErrorText
                    msg={
                      errors.priceRanges &&
                      errors.priceRanges[index] &&
                      errors.priceRanges[index].HerozStudentPrice
                        ? errors.priceRanges[index].HerozStudentPrice
                        : ''
                    }
                  />
                  {vatPercentValue > 0 && (
                    <div>
                      <span style={vatPillStyle}>{vatHerozAmount.toFixed(2)}</span>
                    </div>
                  )}
                </CCol>
              )}

              {/* ✅ MEMBER/MEMBERSHIP ONLY */}
              {isMemberType && (
                <>
                  <CCol sm={2}>
                    <input
                      type="text"
                      className="admin-txt-box w-100"
                      style={{ height: 38, ...starPinkStyle }} // ✅ PINK BG
                      value={to2(stateOrApiRowTotalStarValue)}
                      readOnly
                      title="Total Star Value"
                    />
                  </CCol>

                  <CCol sm={2}>
                    <input
                      type="text"
                      className="admin-txt-box w-100"
                      style={{ height: 38, ...starPinkStyle }} // ✅ PINK BG
                      value={stateOrApiStarValue > 0 ? String(stateOrApiStarValue) : '0'}
                      readOnly
                      title="Star Value (HerozStarValue)"
                    />
                  </CCol>

                  {/* ✅ REQUIRED: Total Star For Parents EDITABLE + PINK background */}
                  <CCol sm={3}>
                    <input
                      type="number"
                      step="0.01"
                      className="vendor-input w-100"
                      style={{ height: 38, ...starPinkStyle }} // ✅ PINK BG
                      value={displayParentsStar || ''}
                      onChange={(e) => handlePriceChange(index, 'TotalStarForParents', e.target.value)}
                      title="Total Star For Parents"
                      placeholder="Enter value"
                    />
                  </CCol>
                </>
              )}
            </CRow>
          )
        })}
      </div>

      {/* ✅ HIDE THESE SECTIONS WHEN actTypeID = MEMBERSHIP/MEMBER */}
      {!isMemberType && (
        <>
          <div className="txtsubtitle">
            Extra Information
            {vatPercentValue > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 13,
                  border: '1px solid #cf2037',
                  borderRadius: 999,
                  padding: '3px 10px',
                  backgroundColor: 'rgba(207, 32, 55, 0.15)',
                  color: '#cf2037',
                  display: 'inline-flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                + VAT {vatPercentValue.toFixed(2)}%
              </span>
            )}
          </div>
          <ErrorText msg={errors.foods} />

          <div className="divbox">
            <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
              <CRow className="mb-2 fw-bold hbg">
                <CCol sm={3}>Extra Name</CCol>
                <CCol sm={1}>Vendor Extra Price</CCol>
                <CCol sm={1} style={{ backgroundColor: '#f8eaf3ff' }}>
                  Heroz Extra Profit
                </CCol>
                <CCol sm={3}>Notes</CCol>
                <CCol sm={2}>Extra Image</CCol>
                <CCol sm={1}>Include</CCol>
                <CCol sm={1}>Delete</CCol>
              </CRow>

              {foods.map((item, index) => {
                const baseFoodPrice = item.include ? 0 : Number(item.price || 0)
                const baseFoodHerozPrice = item.include ? 0 : Number(item.herozprice || 0)
                const foodVat = baseFoodPrice * vatRateValue
                const foodHerozVat = baseFoodHerozPrice * vatRateValue

                return (
                  <CRow key={index} className="mb-3 align-items-center">
                    <CCol sm={3}>
                      <input
                        type="text"
                        className="admin-txt-box w-100"
                        placeholder="Enter name"
                        value={item.name}
                        onChange={(e) => handleFoodChange(index, 'name', e.target.value)}
                      />
                    </CCol>

                    <CCol sm={1}>
                      <input
                        type="number"
                        className="admin-txt-box w-100"
                        placeholder="Enter price"
                        value={item.price}
                        onChange={(e) => handleFoodChange(index, 'price', e.target.value)}
                        disabled={item.include === true}
                      />
                      {vatPercentValue > 0 && (
                        <div>
                          <span style={vatPillStyle}>{foodVat.toFixed(2)}</span>
                        </div>
                      )}
                    </CCol>

                    <CCol sm={1} style={{ backgroundColor: '#f8eaf3ff' }}>
                      <input
                        type="number"
                        className="admin-txt-box w-100"
                        placeholder="Enter Heroz price"
                        value={item.herozprice}
                        onChange={(e) => handleFoodChange(index, 'herozprice', e.target.value)}
                        disabled={item.include === true}
                      />
                      {vatPercentValue > 0 && (
                        <div>
                          <span style={vatPillStyle}>{foodHerozVat.toFixed(2)}</span>
                        </div>
                      )}
                    </CCol>

                    <CCol sm={3}>
                      <input
                        type="text"
                        className="admin-txt-box w-100"
                        placeholder="Enter notes"
                        value={item.notes}
                        onChange={(e) => handleFoodChange(index, 'notes', e.target.value)}
                      />
                    </CCol>

                    <CCol sm={2}>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-100"
                        onChange={(e) => handleFoodChange(index, 'image', e.target.files[0])}
                      />
                    </CCol>

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
                        foods.length > 1 && (
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
                )
              })}

              <CRow className="mt-3">
                <CCol>
                  <button type="button" className="admin-buttonv1" onClick={handleFoodAddMore}>
                    Add More
                  </button>
                </CCol>
              </CRow>
            </div>
          </div>

          <div className="txtsubtitle">Summary</div>
          <div className="divbox">
            <TripSummaryVat
              vatPercentValue={vatPercentValue}
              tripBasePrice={tripBasePrice}
              tripVatAmount={tripVatAmount}
              tripBaseHerozPrice={tripBaseHerozPrice}
              tripHerozVatAmount={tripHerozVatAmount}
              foodBaseAmount={foodBaseAmount}
              foodVatAmount={foodVatAmount}
              foodHerozBaseAmount={foodHerozBaseAmount}
              foodHerozVatAmount={foodHerozVatAmount}
              totalBaseAmount={totalBaseAmount}
              totalVatAmount={totalVatAmount}
              totalHerozBaseAmount={totalHerozBaseAmount}
              totalHerozVatAmount={totalHerozVatAmount}
              totalWithVat={totalWithVat}
              totalHerozWithVat={totalHerozWithVat}
            />
          </div>
        </>
      )}


      <div className="txtsubtitle">What is Include</div>

      <div className="divbox">
        <div className="vendor-container">
          <textarea
            className="vendor-input"
            rows={5}
            value={txtactWhatsIncluded}
            name="txtactWhatsIncluded"
            onChange={(e) => setactWhatsIncluded(e.target.value)}
          />
        </div>
      </div>

      <div className="txtsubtitle">Trip Details</div>

      <div className="divbox">
        <div className="vendor-container">
          <textarea
            className="vendor-input"
            rows={5}
            value={txtactTripDetail}
            name="txtactTripDetail"
            onChange={(e) => setactTripDetail(e.target.value)}
          />
        </div>
      </div>

      <div className="txtsubtitle">
        Terms And Conditions <span style={{ color: 'red' }}>*</span>
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <textarea
            onChange={(e) => setAdminNotes(e.target.value)}
            value={txtactAdminNotes}
            name="txtactAdminNotes"
            className="vendor-input"
            rows={5}
          />
          <ErrorText msg={errors.txtactAdminNotes} />
        </div>
      </div>

      <div className="button-container">
        <button className="admin-buttonv1" style={{ backgroundColor: 'green', color: 'white' }} onClick={handleSave}>
          PUBLISH
        </button>
        <button
          className="admin-buttonv1"
          style={{ backgroundColor: 'orange', color: 'white' }}
          onClick={handleUnPublish}
        >
          SAVE & UNPUBLISH
        </button>
        <button
          className="admin-buttonv1"
          style={{ backgroundColor: 'Marron', color: 'white' }}
          onClick={handleUnPending}
        >
          Pending
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/activityinfo/activity/list')}
        >
          Return
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <p>Are you sure you want to approve this activity? You will not be able to make changes after approval.</p>
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
