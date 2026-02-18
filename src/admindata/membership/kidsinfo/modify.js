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
import { validateActivityForm } from '../../../vendordata/activityinfo/membership/validate/validate'

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
  const HIDE_PRICE_RANGE_UI = false

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

  const [txtactAdminNotes, setAdminNotes] = useState('')

  // ✅ NEW: Trip Detail + What's Included (no removals)
  const [txtactTripDetail, setactTripDetail] = useState('')
  const [txtactWhatsIncluded, setactWhatsIncluded] = useState('')

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
  const isMemberType = typeUpper === 'MEMBERSHIP'

  // ⭐ FIXED FINANCIAL ROUNDING (2.447 → 2.45, etc.)
  const to2 = (v) => {
    const n = Number(v || 0)
    if (!Number.isFinite(n)) return '0.00'
    return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2)
  }

  // ✅ Total Star For Parents = Total Star Value / Star Value
  const calcDefaultTotalStarForParents = (totalStarValue, starValue) => {
    const t = Number(totalStarValue || 0)
    const s = Number(starValue || 0)
    if (!Number.isFinite(t) || !Number.isFinite(s) || s <= 0) return ''
    return to2(t / s)
  }

  // ✅ star configs (default)
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

  const priceSectionTitle =
    String(selectedType || '').toUpperCase() === 'SCHOOL'
      ? 'Price Per Student'
      : isMemberType
        ? 'Membership Price (Star) Information'
        : 'Star (Price) Information'

  const priceSectionBoxStyle = {
    border: '1px solid gray',
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
    borderRadius: 10,
  }

  const starPinkStyle = {
    border: '1px solid #cf2037',
    borderRadius: 10,
    backgroundColor: 'rgba(248, 234, 243, 1)',
    boxShadow: 'none',
  }
  const starHeaderPink = { backgroundColor: 'rgba(248, 234, 243, 1)' }

  // ✅ robust numeric input sanitizer (keeps empty allowed)
  const numOrEmpty = (v) => {
    const s = String(v ?? '')
    if (s.trim() === '') return ''
    const n = Number(s)
    if (!Number.isFinite(n)) return ''
    return n
  }

  const handleFoodChange = (index, field, value) => {
    setFoods((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
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

  const handleAddMore = (day) => {
    const existingTimes = days[day].times
    let lastEnd = existingTimes.length ? timeToMinutes(existingTimes[existingTimes.length - 1].end) : 480 // 08:00
    if (lastEnd === null) lastEnd = 480

    const newStartMins = lastEnd
    const newEndMins = newStartMins + 60

    const minutesToTime = (mins) => {
      let h = Math.floor(mins / 60)
      let m = mins % 60
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      return `${hh}:${mm}`
    }

    const newStart = minutesToTime(newStartMins)
    const newEnd = minutesToTime(newEndMins)

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

  const timeToMinutes = (time) => {
    if (!time) return null
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
      foods,
      txtactAdminNotes,
      actRating: ratingForValidation,
      txtactMinAge,
      txtactMaxAge,
      txtactMinStudent,
      txtactMaxStudent,
      txtactTripDetail,
      txtactWhatsIncluded,
    })

    if (!validation.ok) {
      setErrors(validation.errors || {})
      setToastMessage(validation.message || 'Please correct the highlighted fields.')
      setToastType('fail')
      return
    }

    setErrors({})
    setLoading(true)
    setToastMessage('')

    const overlap = hasOverlap(days)
    if (overlap) {
      setToastMessage(
        `Time range overlap on ${overlap.day}: ${overlap.range1.start} - ${overlap.range1.end} overlaps with ${overlap.range2.start} - ${overlap.range2.end}`,
      )
      setToastType('fail')
      setLoading(false)
      return
    }

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

    const effectiveVatPercent = vatPercentValue
    const effectiveVatRate = vatRateValue
    const firstPriceNum = tripBasePrice
    const dec = (v) => Number(v || 0).toFixed(2)

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
          actPrice: actPriceDataVal, // ✅ includes StarValue + TotalStarValue + TotalStarForParents
          actPriceVatPercentage: actPriceVatPercentageVal,
          actPriceVatAmount: actPriceVatAmountVal,
          actAvailDaysHours: actavailDaysHoursVal,
          actFood: actfoodDataVal,
          actTripDetail: txtactTripDetail || '',
          actWhatsIncluded: txtactWhatsIncluded || '',
          actAdminNotes: txtactAdminNotes || '',
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

      if (actStatusVal === 'APPROVED') {
        setTimeout(() => {
          navigate(
            `/admindata/activityinfo/membership/view?ActivityID=${getActivityIDVal}&VendorID=${getVendorIDVal}`,
          )
        }, 2000)
      } else {
        setTimeout(() => navigate('/admindata/activityinfo/membership/list'), 2000)
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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const citiesRes = await fetch(`${API_BASE_URL}/lookupdata/city/getcityalllist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const citiesResult = await citiesRes.json()
        if (citiesResult.data) {
          setCityList(uniqueBy(citiesResult.data, 'CityID'))
        }

        const countriesRes = await fetch(`${API_BASE_URL}/lookupdata/country/getcountrylist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const countriesResult = await countriesRes.json()
        if (countriesResult.data) {
          setCountries(uniqueBy(countriesResult.data, 'CountryID'))
        }

        const categoryRes = await fetch(`${API_BASE_URL}/lookupdata/category/getCategoryAllList`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const categoryResult = await categoryRes.json()
        if (categoryResult.data) {
          setFetchCategories(uniqueBy(categoryResult.data, 'CategoryID'))
          setFetchedCategories(uniqueBy(categoryResult.data, 'CategoryID'))
        }

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

  useEffect(() => {
    if (!ActivityData) return

    setactImageName1(ActivityData.actImageName1Url)
    setactImageName2(ActivityData.actImageName2Url)
    setactImageName3(ActivityData.actImageName3Url)

    setOrgsetactImageName1(ActivityData.actImageName1)
    setOrgsetactImageName2(ActivityData.actImageName2)
    setOrgsetactImageName3(ActivityData.actImageName3)

    setactName(ActivityData.actName || '')
    setactType(ActivityData.actTypeID || '')
    setSelectedCategories(ActivityData.actCategoryID || [])
    setactDesc(ActivityData.actDesc || '')

    setactTripDetail(ActivityData?.actTripDetail || '')
    setactWhatsIncluded(ActivityData?.actWhatsIncluded || '')

    setactRating(
      ActivityData?.actRating !== undefined && ActivityData?.actRating !== null
        ? String(ActivityData.actRating)
        : '',
    )

    setYouTube1(ActivityData.actYouTubeID1 || '')
    setYouTube2(ActivityData.actYouTubeID2 || '')
    setYouTube3(ActivityData.actYouTubeID3 || '')

    setactGoogleMap(ActivityData.actGoogleMap || '')
    setGlat(ActivityData.actGlat)
    setGlan(ActivityData.actGlan || '')
    setCountryID(ActivityData.actCountryID || '')
    setSelectedCityID(ActivityData.actCityID || '')
    setAddress1(ActivityData.actAddress1 || '')
    setAddress2(ActivityData.actAddress2 || '')

    setMinAge(ActivityData.actMinAge || '')
    setMaxAge(ActivityData.actMaxAge || '')
    setGenderService(ActivityData.actGender || '')
    setMinStudent(ActivityData.actMinStudent || '')
    setMaxStudent(ActivityData.actMaxStudent || '')
    setAdminNotes(ActivityData.actAdminNotes || '')

    const rootStarValue =
      ActivityData?.StarValue ?? ActivityData?.starValue ?? ActivityData?.HerozStarValue ?? null

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

    if (Array.isArray(ActivityData.priceList) && ActivityData.priceList.length > 0) {
      const formattedPriceRanges = ActivityData.priceList.map((item) => {
        const vendorBase = Number(item.Price || 0)
        const vendorVat = vendorBase * vatRateValue
        const computedTotalStarValue = vendorBase + vendorVat

        const apiTotalStarValueFromItem =
          item.TotalStarValue ?? item.TotalStarValueAmount ?? item.TotalStarValues ?? item.TotalStar ?? null

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

        const apiStarValueFromItem = item.StarValue ?? item.StarValues ?? item.HerozStarValue ?? null

        const starValueFinal =
          apiStarValueFromItem !== null &&
          apiStarValueFromItem !== undefined &&
          String(apiStarValueFromItem).trim() !== ''
            ? Number(apiStarValueFromItem || 0)
            : rootStarValue !== null &&
                rootStarValue !== undefined &&
                String(rootStarValue).trim() !== ''
              ? Number(rootStarValue || 0)
              : starValueNum

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

        const defaultParentsStar = calcDefaultTotalStarForParents(totalStarValueFinal, starValueFinal)

        return {
          PriceID: item.PriceID,
          price: item.Price,
          HerozStudentPrice: item.HerozStudentPrice,
          rangeFrom: item.StudentRangeFrom,
          rangeTo: item.StudentRangeTo,

          TotalStarValue: totalStarValueFinal === '' ? '' : String(totalStarValueFinal),
          StarValue: starValueFinal === '' ? '' : String(starValueFinal),

          // ✅ keep API value in UI, but DO NOT lock auto-calc
          // auto-calc should work until user manually edits the field
          TotalStarForParents:
            existingParentsStarFinal !== '' &&
            existingParentsStarFinal !== null &&
            existingParentsStarFinal !== undefined &&
            String(existingParentsStarFinal).trim() !== ''
              ? String(existingParentsStarFinal)
              : defaultParentsStar,

          // ✅ IMPORTANT FIX:
          // __parentsStarManual should mean "USER edited it", not "API provided it"
          __parentsStarManual: false,

          __totalStarManual: false,
          __starManual: false,
          ChkRemovePrice: false,
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
          StarValue: String(starValueNum || ''),
          TotalStarForParents: '',
          __parentsStarManual: false,
          __totalStarManual: false,
          __starManual: false,
          ChkRemovePrice: false,
        },
      ])
    }

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

  useEffect(() => {
    const status = ActivityData?.actStatus
    if (status === 'APPROVED' && getActivityIDVal && getVendorIDVal) {
      const timer = setTimeout(() => {
        navigate(
          `/admindata/activityinfo/membership/view?ActivityID=${getActivityIDVal}&VendorID=${getVendorIDVal}`,
        )
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
    if (lastFetchKey === key && loading) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ActivityID: ActivityIDVal, VendorID: VendorIDVal }),
      })

      if (!response.ok) throw new Error('Failed to fetch activities1')

      const jsonResponse = await response.json()
      console.log('📦 getActivity JSON:', JSON.stringify(jsonResponse, null, 2))

      const raw = jsonResponse?.data
      const normalized = Array.isArray(raw) ? raw[0] : raw
      setActivity(normalized || null)

      setTotalPages(Math.ceil(((jsonResponse.totalCount || 0) * 1) / (ActivityPerPage || 1)))
    } catch (error) {
      setError('Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e, key) => {
    const file = e.target.files[0]
    if (key === 'certificate') setCertificateFile(file)
    else if (key === 'tax') setTaxFile(file)
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

        const priceOut = item.include ? '0' : item.price || ''
        const herozOut = item.include ? '0' : item.herozprice || ''

        const basePrice = Number(priceOut || 0)
        const baseHeroz = Number(herozOut || 0)

        const foodVat = basePrice * vatRateValue
        const herozVat = baseHeroz * vatRateValue

        return {
          FoodID: item.FoodID || null,
          FoodName: item.name || '',
          FoodPrice: priceOut,
          FoodPriceVatPercentage: vatPercentValue,
          FoodPriceVatAmount: foodVat.toFixed(2),
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
      __parentsStarManual: false,
      __totalStarManual: false,
      __starManual: false,
    },
  ])

  // ✅ FIXED:
  // When Vendor Base Price changes -> update TotalStarValue AND TotalStarForParents automatically
  // TotalStarValue = price + (price * vatRate)
  // TotalStarForParents = TotalStarValue / StarValue
  // (If user manually edits TotalStarForParents, then stop auto overriding it)
  const handlePriceChange = (index, field, value) => {
    setPriceRanges((prev) => {
      const updated = [...prev]
      const row = { ...updated[index] }

      row[field] = value

      if (!isMemberType) {
        updated[index] = row
        return updated
      }

      // Ensure StarValue always has a usable fallback for calculations
      const starForCalc = (() => {
        const sRaw = row.StarValue !== '' && row.StarValue !== null && row.StarValue !== undefined ? row.StarValue : ''
        const n = numOrEmpty(sRaw)
        if (n === '') return Number(starValueNum || 0)
        return Number(n || 0)
      })()

      if (field === 'TotalStarForParents') {
        row.__parentsStarManual = true
        updated[index] = row
        return updated
      }

      if (field === 'TotalStarValue') {
        row.__totalStarManual = true
        const t = numOrEmpty(value)

        // ✅ ALWAYS recalc parents when TotalStarValue changes (unless user manually edited parents field)
        if (!row.__parentsStarManual) {
          row.TotalStarForParents = t === '' ? '' : calcDefaultTotalStarForParents(t, starForCalc)
        }

        updated[index] = row
        return updated
      }

      if (field === 'StarValue') {
        row.__starManual = true
        const t = numOrEmpty(row.TotalStarValue)
        const s = numOrEmpty(value)

        // ✅ recalc parents when StarValue changes (unless user manually edited parents field)
        if (!row.__parentsStarManual) {
          row.TotalStarForParents = t === '' ? '' : calcDefaultTotalStarForParents(t, s === '' ? 0 : s)
        }

        updated[index] = row
        return updated
      }

      // ✅ KEY: Vendor Base Price change must recalc TotalStarValue and TotalStarForParents
      if (field === 'price') {
        const basePrice = Number(row.price || 0)
        const vatAmount = basePrice * vatRateValue
        const computedTotalStar = basePrice + vatAmount

        // TotalStarValue always follows base price (your request)
        row.TotalStarValue = String(to2(computedTotalStar))
        row.__totalStarManual = false

        // If StarValue is empty -> set default
        if (row.StarValue === '' || row.StarValue === null || row.StarValue === undefined) {
          row.StarValue = String(starValueNum || 0)
          row.__starManual = false
        }

        // ✅ IMPORTANT: Always compute parents star from (TotalStarValue / StarValue)
        // unless user manually edited parents field
        if (!row.__parentsStarManual) {
          const sNow = (() => {
            const s = numOrEmpty(row.StarValue)
            return s === '' ? 0 : Number(s || 0)
          })()

          // TotalStarForParents = TotalStarValue / StarValue
          row.TotalStarForParents = sNow > 0 ? calcDefaultTotalStarForParents(computedTotalStar, sNow) : ''
        }

        updated[index] = row
        return updated
      }

      updated[index] = row
      return updated
    })
  }

  const getPriceData = () => {
    return priceRanges.map((item) => {
      const baseHeroz = Number(item.HerozStudentPrice || 0)
      const herozVat = baseHeroz * vatRateValue

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
        HerozStudentPriceVatAmount: herozVat.toFixed(2),

        TotalStarValue: to2(totalStarValueOut),
        StarValue: starValueOut,

        // ✅ send what’s in UI (auto or manual)
        TotalStarForParents: item.TotalStarForParents || '',

        StudentRangeFrom: item.rangeFrom || '',
        StudentRangeTo: item.rangeTo || '',
        RemovePrice: item.ChkRemovePrice || false,
      }
    })
  }

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
        <div className="txtheadertitle">Activity</div>

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
            onClick={() => navigate('/admindata/activityinfo/membership/list')}
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
                checked={selectedType === 'MEMBERSHIP'}
                onChange={(e) => setactType(e.target.value)}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> Membership</div>
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

      {/* ✅ MEMBERSHIP: STAR VALUE SECTION (EDITABLE) */}
      {isMemberType && (
        <>
          <div className="txtsubtitle">
            Membership Price (Star) Information
            {vatPercentValue > 0 && (
              <span
                style={{
                  marginInlineStart: 8,
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
                {`+ VAT ${to2(vatPercentValue)}%`}
              </span>
            )}
          </div>

          <div className="divbox" style={priceSectionBoxStyle}>
            <CRow className="fw-bold text-center mb-2">
              <CCol sm={3} style={starHeaderPink}>
                Vendor Base Price
              </CCol>
              <CCol sm={3} style={starHeaderPink}>
                Total Star Value
              </CCol>
              <CCol sm={3} style={starHeaderPink}>
                Star Value
              </CCol>
              <CCol sm={3} style={starHeaderPink}>
                Total Star For Parents
              </CCol>
            </CRow>

            {priceRanges.map((row, index) => {
              const vendorBase = Number(row.price || 0)
              const vendorVat = vendorBase * vatRateValue
              const computed = vendorBase + vendorVat
              const computedHint = `Auto: ${to2(computed)} (Price + VAT)`

              return (
                <CRow key={index} className="align-items-center mb-2">
                  <CCol sm={3}>
                    <input
                      className="admin-txt-box text-center"
                      type="number"
                      step="0.01"
                      value={row.price}
                      onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                      placeholder="Vendor Price"
                    />
                    {vatPercentValue > 0 && (
                      <div style={{ fontSize: 12 }}>
                        <span style={vatPillStyle}>{to2(vendorVat)}</span>
                      </div>
                    )}
                  </CCol>

                  <CCol sm={3}>
                    <input
                      className="admin-txt-box text-center"
                      style={starPinkStyle}
                      type="number"
                      step="0.01"
                      value={row.TotalStarValue}
                      onChange={(e) => handlePriceChange(index, 'TotalStarValue', e.target.value)}
                      placeholder="Total Star Value"
                      title={computedHint}
                    />
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>{computedHint}</div>
                  </CCol>

                  <CCol sm={3}>
                    <input
                      className="admin-txt-box text-center"
                      style={starPinkStyle}
                      type="number"
                      step="0.01"
                      value={row.StarValue}
                      onChange={(e) => handlePriceChange(index, 'StarValue', e.target.value)}
                      placeholder="Star Value"
                    />
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                      Default: {String(starValueNum || 0)}
                    </div>
                  </CCol>

                  <CCol sm={3}>
                    <input
                      className="admin-txt-box text-center"
                      style={starPinkStyle}
                      type="number"
                      step="0.01"
                      value={row.TotalStarForParents}
                      onChange={(e) => handlePriceChange(index, 'TotalStarForParents', e.target.value)}
                      placeholder="Total Star For Parents"
                    />
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                      Auto: TotalStarValue / StarValue
                    </div>
                  </CCol>
                </CRow>
              )
            })}
          </div>
        </>
      )}

      {/* ✅ NEW: Trip Details + What's Included */}
      <div className="txtsubtitle">
        Trip Details <span style={{ color: 'red' }}>*</span>
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="form-group">
            <label>
              Trip Detail <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              name="txtactTripDetail"
              className="vendor-input"
              rows={4}
              value={txtactTripDetail}
              onChange={(e) => setactTripDetail(e.target.value)}
              placeholder="Enter Trip Detail"
            />
            <ErrorText msg={errors.txtactTripDetail} />
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label>
              What's Included <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              name="txtactWhatsIncluded"
              className="vendor-input"
              rows={4}
              value={txtactWhatsIncluded}
              onChange={(e) => setactWhatsIncluded(e.target.value)}
              placeholder="Enter What's Included"
            />
            <ErrorText msg={errors.txtactWhatsIncluded} />
          </div>
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
        <button
          className="admin-buttonv1"
          style={{ backgroundColor: 'green', color: 'white' }}
          onClick={handleSave}
        >
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
          onClick={() => navigate('/admindata/activityinfo/membership/list')}
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
