import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage, getAuthHeaders, getVatAmount } from '../../../utils/operation'
import FilePreview from '../../widgets/FilePreview'
import { getFileNameFromUrl, getCurrentLoggedUserID } from '../../../utils/operation'
import { CRow, CCol } from '@coreui/react'

// ✅ Import the shared validator (returns { ok, errors, message? })
import { validateActivityForm } from '../../../vendordata/activityinfo/activity/validate/validate'

// 🔤 i18n packs (default Arabic if not set)
import enPack from '../../../i18n/enloc100.json'
import arPack from '../../../i18n/arloc100.json'

// ✅ Tiny helper to show a message right under each field
const ErrorText = ({ msg }) =>
  msg ? <div style={{ color: '#cf2037', fontSize: 12, marginTop: 4 }}>{msg}</div> : null

const Vendor = () => {
  // === Feature flags ===
  const HIDE_PRICE_RANGE_UI = true
  const HIDE_FOOD_IMAGE = true // ⬅️ Hide Food Image everywhere (UI + payload)

  // === VAT SETUP (global default from settings) ===
  // getVatAmount() may return 15  OR  0.15
  const vatRaw = Number(getVatAmount() || 0) // 15  or  0.15
  const vatPercentValue = vatRaw > 1 ? vatRaw : vatRaw * 100 // always 15-style
  const vatRateValue = vatPercentValue / 100 // always 0.15-style (decimal)

  // 🔢 VAT from server (override) – taken from ActivityData.priceList[0].actPriceVatPercentage
  const [vatPercentFromServer, setVatPercentFromServer] = useState(null)

  // ✅ Effective VAT to use everywhere (price + food)
  const effectiveVatPercent = vatPercentFromServer ?? vatPercentValue
  const effectiveVatRate = effectiveVatPercent / 100

  // ✅ Safe 2-decimal helper (ONLY for VAT / totals, NOT base price)
  const dec = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100

  // ---- i18n helpers (non-destructive) ----
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      return v === 'ar' || v === 'en' ? v : 'ar'
    } catch {
      return 'ar'
    }
  }
  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback
  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])
  const dayLabel = (d) => tr(`day_${d}`, d)
  // ----------------------------------------

  const [error, setError] = useState('')
  const [errors, setErrors] = useState({}) // ✅ field-level errors

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
  // 🔒 Force Activity Type to SCHOOL only (default + guards below)
  const [selectedType, setactType] = useState('SCHOOL')
  const [actRating, setactRating] = useState('') // ⭐ Activity Rating 1..5 (decimals allowed) – read-only display
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
    { name: '', price: '', include: false, ChkRemoveFood: false, notes: '', image: null },
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
    setFoods([...foods, { name: '', price: '', include: false, notes: '', image: null }])
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
      times: [{ start: '', end: '', note: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    monday: {
      times: [{ start: '', end: '', note: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    tuesday: {
      times: [{ start: '', end: '', note: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    wednesday: {
      times: [{ start: '', end: '', note: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    thursday: {
      times: [{ start: '', end: '', note: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    friday: {
      times: [{ start: '', end: '', note: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
    saturday: {
      times: [{ start: '', end: '', note: '', ChkRemoveDays: false, total: '' }],
      total: '',
      closed: false,
      note: '',
    },
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

  const handleRangeNoteChange = (day, index, value) => {
    setDays((prevDays) => {
      const updatedTimes = [...prevDays[day].times]
      const prevRow = updatedTimes[index] || {}
      updatedTimes[index] = { ...prevRow, note: value }
      const dayTotal = updatedTimes.reduce((sum, t) => sum + Number(t.total || 0), 0)
      return {
        ...prevDays,
        [day]: { ...prevDays[day], times: updatedTimes, total: dayTotal.toFixed(2) },
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

  // 🔒 Validate rating 1..5 (decimals allowed) and show as read-only
  const isValidActRating = (val) => {
    if (val === '' || val === null || typeof val === 'undefined') return false
    const n = Number(val)
    return Number.isFinite(n) && n >= 1 && n <= 5
  }

  // 🔒 Guard: if anything tries to set a non-SCHOOL value, force back to SCHOOL
  useEffect(() => {
    if (selectedType !== 'SCHOOL') setactType('SCHOOL')
  }, [selectedType])

  const handleSubmit = async (actStatusVal, e) => {
    if (e && e.preventDefault) e.preventDefault()

    // ❗ Enforce Activity Rating 1..5 (decimals allowed)
    if (!isValidActRating(actRating)) {
      setErrors((prev) => ({
        ...prev,
        actRating: tr(
          'errRatingRange',
          'Activity Rating must be between 1 and 5 (decimals allowed).',
        ),
      }))
      setToastMessage(tr('fixRating', 'Please correct Activity Rating.'))
      setToastType('fail')
      return
    }

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
      foods, // validator will force price=0 for included items
      txtactAdminNotes,
      actRating,
      txtactMinAge,
      txtactMaxAge,
      txtactMinStudent,
      txtactMaxStudent,
    })

    if (!validation.ok) {
      setErrors(validation.errors || {}) // ✅ show under fields
      setToastMessage(
        validation.message || tr('fixHighlighted', 'Please correct the highlighted fields.'),
      )
      setToastType('fail')
      return
    }

    // ✅ clear field errors on success path
    setErrors({})
    setLoading(true)
    setToastMessage('')

    const overlap = hasOverlap(days)
    if (overlap) {
      setToastMessage(
        tr(
          'timeOverlap',
          'Time range overlap on {day}: {s1}–{e1} overlaps with {s2}–{e2}',
        )
          .replace('{day}', overlap.day)
          .replace('{s1}', overlap.range1.start)
          .replace('{e1}', overlap.range1.end)
          .replace('{s2}', overlap.range2.start)
          .replace('{e2}', overlap.range2.end),
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
      console.error('🐞 Image 1 upload error:', error)
      setToastMessage(tr('toastImg1Failed', 'Failed to upload image 1.'))
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
      console.error('🐞 Image 2 upload error:', error)
      setToastMessage(tr('toastImg2Failed', 'Failed to upload image 2.'))
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
      console.error('🐞 Image 3 upload error:', error)
      setToastMessage(tr('toastImg3Failed', 'Failed to upload image 3.'))
      setToastType('fail')
    }

    const actfoodDataVal = await getFoodData()
    console.log('🐞 DEBUG getFoodData payload:', actfoodDataVal)

    const actavailDaysHoursVal = getAvailDaysHoursData()
    console.log('🐞 DEBUG getAvailDaysHoursData payload:', actavailDaysHoursVal)

    const actPriceDataVal = getPriceData()
    console.log('🐞 DEBUG getPriceData payload:', actPriceDataVal)

    // 🔢 VAT for main activity price (use first price row) – now using effectiveVatPercent from server
    const firstPriceNum = Number(priceRanges[0]?.price || 0)
    const actPriceVatPercentageVal = effectiveVatPercent
    const actPriceVatAmountVal = dec(firstPriceNum * effectiveVatRate)
   // alert(actPriceVatPercentageVal)
    //alert(actPriceVatAmountVal)
    // 🐞 Build and log final API payload
    const payload = {
      ActivityID: getActivityIDVal,
      VendorID: getCurrentLoggedUserID(),
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

      actAdminNotes: txtactAdminNotes || '',
      actRating: actRating === '' ? '' : Number(actRating), // still sent to API
      actStatus: actStatusVal,
      IsDataStatus: 1,
      ModifyBy: getCurrentLoggedUserID(),
    }

    console.log('🐞 DEBUG updateActivity payload:', payload)

    try {
      const response = await fetch(
        `${API_BASE_URL}/vendordata/activityinfo/activity/updateActivity`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        },
      )

      console.log('🐞 DEBUG updateActivity raw response:', response)

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      const result = await response.json()
      console.log('🐞 DEBUG updateActivity API result:', result)

      setToastMessage(tr('toastActivityUpdated', 'Activity updated successfully!'))
      setToastType('success')

      setTimeout(() => navigate('/vendordata/activityinfo/activity/list'), 2000)
    } catch (err) {
      console.error('🐞 DEBUG updateActivity error:', err)
      setToastMessage(tr('toastActivityUpdateFailed', 'Failed to update Activity.'))
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

  const handleAddRange = () => {
    setPriceRanges((prev) => [
      ...prev,
      { price: '', rangeFrom: '', rangeTo: '', ChkRemovePrice: false },
    ])
  }

  const handleRemoveRange = (index) => {
    setPriceRanges((prev) => prev.filter((_, i) => i !== index))
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
        console.log('🐞 DEBUG getcityalllist result:', citiesResult)
        if (citiesResult.data) {
          setCityList(citiesResult.data)
        }

        const countriesRes = await fetch(`${API_BASE_URL}/lookupdata/country/getcountrylist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const countriesResult = await countriesRes.json()
        console.log('🐞 DEBUG getcountrylist result:', countriesResult)
        if (countriesResult.data) {
          setCountries(countriesResult.data)
        }

        const categoryRes = await fetch(
          `${API_BASE_URL}/lookupdata/category/getCategoryAllList`,
          {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({}),
          },
        )
        const categoryResult = await categoryRes.json()
        console.log('🐞 DEBUG getCategoryAllList result:', categoryResult)
        if (categoryResult.data) {
          setFetchCategories(categoryResult.data)
        }

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

        console.log('🐞 DEBUG URL ActivityID:', ActivityIDVal)

        if (ActivityIDVal) {
          fetchActivity(ActivityIDVal)
        } else {
          setError(tr('errActivityIdMissing', 'ActivityID is missing in URL'))
        }
      } catch (error) {
        console.error('🐞 DEBUG fetchInitialData error:', error)
        setError(tr('errLoadInitial', 'Failed to load initial data.'))
      }
    }

    fetchInitialData()
  }, [])

  useEffect(() => {
    if (!ActivityData) return

    console.log('🐞 DEBUG set from ActivityData:', ActivityData)

    setactImageName1(ActivityData.actImageName1Url)
    setactImageName2(ActivityData.actImageName2Url)
    setactImageName3(ActivityData.actImageName3Url)

    setOrgsetactImageName1(ActivityData.actImageName1)
    setOrgsetactImageName2(ActivityData.actImageName2)
    setOrgsetactImageName3(ActivityData.actImageName3)

    setactName(ActivityData.actName || '')
    setactType(ActivityData.actTypeID || '') // ← keep your original line
    if (ActivityData.actTypeID !== 'SCHOOL') {
      // ← enforce SCHOOL anyway
      setactType('SCHOOL')
    }
    setSelectedCategories(ActivityData.actCategoryID || [])
    setactDesc(ActivityData.actDesc || '')

    setactRating(
      ActivityData.actRating !== undefined && ActivityData.actRating !== null
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

    // 🔢 From API: set price ranges and read VAT % from first price row
    if (Array.isArray(ActivityData.priceList) && ActivityData.priceList.length > 0) {
      const formattedPriceRanges = ActivityData.priceList.map((item) => ({
        PriceID: item.PriceID,
        price: item.Price,
        rangeFrom: item.StudentRangeFrom,
        rangeTo: item.StudentRangeTo,
        // we don't store actPriceVatAmount here; we compute fresh from price
        ChkRemovePrice: false,
      }))
      console.log('🐞 DEBUG mapped priceRanges from API:', formattedPriceRanges)
      setPriceRanges(formattedPriceRanges)

      // ✅ Get VAT % from first row if present
      const firstVat = Number(ActivityData.priceList[0].actPriceVatPercentage)
      if (Number.isFinite(firstVat) && firstVat > 0) {
        console.log('🐞 DEBUG VAT from server first row:', firstVat)
        setVatPercentFromServer(firstVat)
      }
    } else {
      setPriceRanges([
        { PriceID: '', price: '', rangeFrom: '', rangeTo: '', ChkRemovePrice: false },
      ])
    }

    if (Array.isArray(ActivityData.foodList)) {
      const mappedFoods = ActivityData.foodList.map((item) => ({
        FoodID: item.FoodID || '',
        name: item.FoodName || '',
        price: item.FoodPrice || '', // base price only
        notes: item.FoodNotes || '',
        image: HIDE_FOOD_IMAGE ? null : item.FoodImage || null, // keep state consistent
        include: item.Include || false,
        ChkRemoveFood: false,
      }))
      console.log('🐞 DEBUG mapped foods from API:', mappedFoods)
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

      console.log('🐞 DEBUG mapped availList dayMap:', dayMap)
      setDays(dayMap)
    }
  }, [ActivityData])

  useEffect(() => {
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

    console.log('🐞 DEBUG useEffect(2) URL ActivityID:', ActivityIDVal)

    if (ActivityIDVal) {
      setActivityIDVal(ActivityIDVal)
      fetchActivity(ActivityIDVal)
      setActivity(ActivityIDVal)
    } else {
      setError(tr('errActivityIdMissing', 'ActivityID is missing in URL'))
    }
  }, [])

  const fetchActivity = async (ActivityIDVal) => {
    setLoading(true)
    try {
      const payload = {
        ActivityID: ActivityIDVal,
        VendorID: getCurrentLoggedUserID(),
      }
      console.log('🐞 DEBUG getActivity payload:', payload)

      const response = await fetch(`${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      console.log('🐞 DEBUG getActivity raw response:', response)

      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      console.log('🐞 DEBUG getActivity API result:', data)

      if ((data?.data?.actStatus !== 'DRAFT') || (data?.data?.actStatus !== 'DRAFT')) {
        navigate(`/vendordata/activityinfo/activity/view?ActivityID=${ActivityIDVal}`)
        return
      }

      setActivity(data.data || [])
    } catch (error) {
      console.error('🐞 DEBUG fetchActivity error:', error)
      setError(tr('errFetchActivities', 'Error fetching activities'))
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
        times:
          updatedTimes.length > 0
            ? updatedTimes
            : [{ start: '', end: '', note: '', total: '' }],
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
    console.log('🐞 DEBUG uploadFoodImage result:', result)
    return result.data?.key || result.data?.Key
  }

  const getFoodData = async () => {
    const foodData = await Promise.all(
      foods.map(async (item) => {
        // base price (respect Include=0)
        const baseFoodPrice = item.include ? 0 : Number(item.price || 0)
        // 🔢 VAT for food uses same percentage as main price (effectiveVatPercent)
        const foodVatAmount =
          baseFoodPrice > 0 && effectiveVatPercent > 0
            ? dec(baseFoodPrice * effectiveVatRate)
            : 0

        // When hidden, we never upload nor send an image key
        if (HIDE_FOOD_IMAGE) {
          return {
            FoodID: item.FoodID || null,
            FoodName: item.name || '',
            FoodPrice: baseFoodPrice,
            FoodPriceVatPercentage: effectiveVatPercent,
            FoodPriceVatAmount: foodVatAmount,
            FoodNotes: item.notes || '',
            FoodImage: '', // ⬅️ always blank when hidden
            Include: item.include || false,
            RemoveFood: item.ChkRemoveFood || false,
          }
        }

        // ELSE (if showing images): normal behavior
        let uploadedImageKey = ''
        if (item.image instanceof File) {
          uploadedImageKey = await uploadFoodImage(item.image)
        }

        return {
          FoodID: item.FoodID || null,
          FoodName: item.name || '',
          FoodPrice: baseFoodPrice,
          FoodPriceVatPercentage: effectiveVatPercent,
          FoodPriceVatAmount: foodVatAmount,
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
    const result = priceRanges.map((item) => ({
      PriceID: item.PriceID || '',
      Price: item.price || '',
      StudentRangeFrom: item.rangeFrom || '',
      StudentRangeTo: item.rangeTo || '',
      RemovePrice: item.ChkRemovePrice || false,
    }))
    return result
  }

  // -------------------- SUMMARY VALUES (VAT) --------------------
  const tripPriceBase = Number(priceRanges[0]?.price || 0)
  const tripVatAmount =
    tripPriceBase > 0 && effectiveVatPercent > 0
      ? dec(tripPriceBase * effectiveVatRate)
      : 0

  const foodBaseAmount = foods.reduce(
    (sum, item) => sum + (item.include ? 0 : Number(item.price || 0)),
    0,
  )
  const foodVatAmount =
    foodBaseAmount > 0 && effectiveVatPercent > 0
      ? dec(foodBaseAmount * effectiveVatRate)
      : 0

  const totalBaseAmount = tripPriceBase + foodBaseAmount
  const totalVatAmount = dec(tripVatAmount + foodVatAmount)
  const totalWithVat = dec(totalBaseAmount + totalVatAmount)

  // NEW: per-row totals for summary
  const tripTotalWithVat = dec(tripPriceBase + tripVatAmount)
  const foodTotalWithVat = dec(foodBaseAmount + foodVatAmount)
  // -------------------------------------------------------------

  //Send to Admin Approval
  const handlebtnSendToApprovalClick = () => {
    setShowModal(true)
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
        <div className="txtheadertitle">{tr('modifyTitle', 'Modify Activity')}</div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handlebtnSendToApprovalClick}>
            {tr('btnSendToAdmin', 'Send To Admin Approval')}
          </button>
          <button className="admin-buttonv1" onClick={handleSave}>
            {tr('btnSave', 'Save')}
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/vendordata/activityinfo/activity/list')}
          >
            {tr('btnReturn', 'Return')}
          </button>
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionActivityInfo', 'Activity Information')}
      </div>

      <div className="divbox">
        <div className="form-group">
          <label>
            {tr('labelActivityName', 'Activity Name')}{' '}
            <span style={{ color: 'red' }}>*</span>
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
            {tr('labelActivityType', 'Activity Type')}{' '}
            <span style={{ color: 'red' }}>*</span>
          </label>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="rdoactTyper"
                value="SCHOOL"
                checked={selectedType === 'SCHOOL'}
                onChange={() => setactType('SCHOOL')}
                style={{ width: '24px', height: '24px' }}
              />
              <div className="pink-shadow4"> {tr('typeSchool', 'School')}</div>
            </label>

            {/* Keep your original options but hide + disable them */}
            <label
              style={{
                display: 'none', // 🔒 hidden
                alignItems: 'center',
                gap: '5px',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            >
              <input
                type="radio"
                name="rdoactTyper"
                value="INDIVIDUAL"
                checked={selectedType === 'INDIVIDUAL'}
                onChange={() => setactType('SCHOOL')}
                style={{ width: '24px', height: '24px' }}
                disabled
              />
              <div className="pink-shadow4"> {tr('typeIndividual', 'Individual')}</div>
            </label>

            <label
              style={{
                display: 'none', // 🔒 hidden
                alignItems: 'center',
                gap: '5px',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            >
              <input
                type="radio"
                name="rdoactTyper"
                value="MEMBER"
                checked={selectedType === 'MEMBER'}
                onChange={() => setactType('SCHOOL')}
                style={{ width: '24px', height: '24px' }}
                disabled
              />
              <div className="pink-shadow4"> {tr('typeMember', 'Member')}</div>
            </label>
          </div>
          <ErrorText msg={errors.selectedType} />
        </div>

        {/* ⭐ Activity Rating – read-only display, validated 1..5 (decimals allowed) */}
        <div style={{ alignItems: 'center', gap: 8, marginTop: 10 }}>
          <label className="vendor-label" style={{ margin: 0 }}>
            {tr('labelActivityRating', 'Activity Rating')}{' '}
            <span style={{ color: 'red' }}>*</span>
          </label>
          <div
            className="vendor-input"
            style={{
              background: '#f7f7f7',
              cursor: 'not-allowed',
              userSelect: 'none',
            }}
            title={tr('titleReadOnly', 'This value is read-only')}
          >
            {actRating === '' ? '—' : actRating}
          </div>
          <input type="hidden" name="actRating" value={actRating} readOnly />
          <ErrorText msg={errors.actRating} />
        </div>

        <div style={{ marginBottom: '10px', marginTop: '20px' }}>
          <label
            style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}
          >
            {tr('labelCategories', 'Activity Categories')}{' '}
            <span style={{ color: 'red' }}>*</span>
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
          <ErrorText msg={errors.selectedCategories} />
        </div>

        <div className="form-group">
          <label>
            {tr('labelActivityDesc', 'Activity Description')}{' '}
            <span style={{ color: 'red' }}>*</span>
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
        {tr('sectionActivityImages', 'Activity Images')}{' '}
        <span style={{ color: 'red' }}>*</span>
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
            <label>{tr('labelImage1', 'Activity Image 1')}</label>
            <input
              name="txtactImageName1"
              className="admin-txt-box"
              placeholder={tr('phUploadVendorImage', 'Upload Vendor Image')}
              type="file"
              onChange={handleFileUpload(setactImageName1)}
              style={{ height: 50, width: '100%' }}
            />
            <FilePreview file={txtactImageName1} />
          </div>

          {/* Image 2 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelImage2', 'Activity Image 2')}</label>
            <input
              name="txtactImageName2"
              className="admin-txt-box"
              placeholder={tr('phUploadVendorImage', 'Upload Vendor Image')}
              type="file"
              onChange={handleFileUpload(setactImageName2)}
              style={{ height: 50, width: '100%' }}
            />
            <FilePreview file={txtactImageName2} />
          </div>

          {/* Image 3 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelImage3', 'Activity Image 3')}</label>
            <input
              name="txtactImageName3"
              className="admin-txt-box"
              placeholder={tr('phUploadVendorImage', 'Upload Vendor Image')}
              type="file"
              onChange={handleFileUpload(setactImageName3)}
              style={{ height: 50, width: '100%' }}
            />
            <FilePreview file={txtactImageName3} />
          </div>
        </div>
        <ErrorText msg={errors.images} />
      </div>

      <div className="txtsubtitle">
        {tr('sectionYouTube', 'Activity Youtube Videos')}
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
          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelYouTube1', 'Youtube Video Link 1')}</label>
            <input
              name="txtactYouTubeID1"
              className="vendor-input"
              value={txtactYouTubeID1}
              onChange={(e) => setYouTube1(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelYouTube2', 'Youtube Video Link 2')}</label>
            <input
              name="txtactYouTubeID2"
              value={txtactYouTubeID2}
              className="vendor-input"
              onChange={(e) => setYouTube2(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelYouTube3', 'Youtube Video Link 3')}</label>
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
        {tr('sectionLocation', 'Activity Location')}{' '}
        <span style={{ color: 'red' }}>*</span>
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelGoogleMap', 'Google Map Location')}{' '}
                <span style={{ color: 'red' }}>*</span>
              </label>
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
              <label className="vendor-label">
                {tr('labelLatitude', 'Google Latitude')}{' '}
                <span style={{ color: 'red' }}>*</span>
              </label>
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
              <label className="vendor-label">
                {tr('labelLongitude', 'Google Longitude')}{' '}
                <span style={{ color: 'red' }}>*</span>
              </label>
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
              <label className="vendor-label">
                {tr('labelCountry', 'Country')}{' '}
                <span style={{ color: 'red' }}>*</span>
              </label>
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
                <option value="">
                  {tr('optSelectCountry', 'Select a country')}
                </option>
                {countries.map((country) => (
                  <option key={country.CountryID} value={country.CountryID}>
                    {country.EnCountryName}
                  </option>
                ))}
              </select>
              <ErrorText msg={errors.ddactCountryID} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelCity', 'City')}{' '}
                <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={ddactCityID}
                name="txtactCityID"
                className="admin-txt-box"
                onChange={(e) => setSelectedCityID(e.target.value)}
                required
              >
                <option value="">{tr('optSelectCity', 'Select City')}</option>
                {cityList.map((city) => (
                  <option key={city.CityID} value={city.CityID}>
                    {city.EnCityName}
                  </option>
                ))}
              </select>
              <ErrorText msg={errors.ddactCityID} />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLocation1', 'Location')}
              </label>
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
              <label className="vendor-label">
                {tr('labelAddress2', 'Address2')}
              </label>
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

      <div className="txtsubtitle">
        {tr('sectionAgeRange', ' Age Range ')}
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">
                {tr('labelMinAge', 'Minimum Age')}{' '}
                <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                value={txtactMinAge}
                onChange={(e) => setMinAge(e.target.value)}
                name="txtactMinAge"
                className="vendor-input"
                type="number"
                min="0"
              />
              <ErrorText msg={errors.txtactMinAge} />
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">
                {tr('labelMaxAge', 'Maximum Age')}{' '}
                <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                value={txtactMaxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                name="txtactMaxAge"
                className="vendor-input"
                type="number"
                min="0"
              />
              <ErrorText msg={errors.txtactMaxAge} />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="vendor-label">
              {tr('labelGender', 'Gender')}{' '}
              <span style={{ color: 'red' }}>*</span>
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
              <div className="pink-shadow4">
                {' '}
                {tr('genderBoys', 'Boys')}
              </div>
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
              <div className="pink-shadow4">
                {' '}
                {tr('genderGirls', 'Girls')}
              </div>
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
              <div className="pink-shadow4">
                {' '}
                {tr('genderBoth', 'Both')}
              </div>
            </label>
          </div>
          <ErrorText msg={errors.rdoactGender} />
        </div>
      </div>

      {/* 🔴 NEW HEADER STRIP WITH PINK VAT BADGE (LIKE YOUR SCREENSHOT) */}
      <div
        className="txtsubtitle"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          backgroundColor: '#fce4ef',
          borderRadius: 16,
          padding: '8px 12px',
        }}
      >
        <div>
          {tr('sectionPricePerStudent', 'Per Student (vendor Price)')}{' '}
          <span style={{ color: 'red' }}>*</span>
        </div>

        {effectiveVatPercent > 0 && (
          <div
            style={{
              padding: '4px 16px',
              borderRadius: 999,
              border: '1px solid #cf2037',
              backgroundColor: '#ffffff',
              color: '#cf2037',
              fontSize: 12,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            + VAT {effectiveVatPercent.toFixed(2)}%
          </div>
        )}
      </div>

      <div className="divbox">
        <CRow className="fw-bold   mb-2">
          <CCol sm={3}>
            {tr('colBasePricePerStudent', 'Price Per Student (Excl. VAT)')}{' '}
            <span style={{ color: 'red' }}>*</span>
          </CCol>
          <CCol
            sm={3}
            style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
          >
            {tr('labelStudentRangeFrom', 'Student Range From')}
          </CCol>
          <CCol
            sm={3}
            style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
          >
            {tr('labelStudentRangeTo', 'Student Range To')}
          </CCol>
          <CCol
            sm={3}
            style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
          >
            {tr('colDelete', 'Delete')}
          </CCol>
        </CRow>

        {priceRanges.map((item, index) => {
          const priceNum = Number(item.price || 0)
          const vatAmt =
            priceNum > 0 && effectiveVatPercent > 0
              ? dec(priceNum * effectiveVatRate)
              : 0
          const totalWithVatRow = dec(priceNum + vatAmt)

          return (
            <CRow key={index} className="align-items-center mb-2">
              <CCol sm={3}>
                <input
                  name="txtPricePerStudent"
                  type="number"
                  className="vendor-input w-100"
                  placeholder={tr('phPrice', 'Price')}
                  value={item.price}
                  onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                  min="0"
                />
                {index === 0 && <ErrorText msg={errors.price} />} {/* show once under first input */}
                {priceNum > 0 && effectiveVatPercent > 0 && (
                  <div
                    style={{
                      marginTop: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* VAT badge like screenshot (but smaller, under input) */}
                    <div
                      style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        border: '1px solid #cf2037',
                        backgroundColor: '#ffe6eb',
                        color: '#cf2037',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {tr('labelVatAmount', 'VAT Amount')} (
                      {effectiveVatPercent.toFixed(2)}%):{' '}
                      <span style={{ fontWeight: 800 }}>
                        {vatAmt.toFixed(2)}
                      </span>
                    </div>
                    {/* Total with VAT */}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#333',
                      }}
                    >
                      {tr('labelPriceWithVatShort', 'Total incl. VAT')}:{' '}
                      <span>{totalWithVatRow.toFixed(2)}</span>
                    </div>
                  </div>
                )}
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
                      {tr('btnRemove', 'Remove')}
                    </button>
                  )
                )}
              </CCol>
            </CRow>
          )
        })}

        <CRow
          className="mt-3"
          style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}
        >
          <CCol>
            <button
              type="button"
              className="admin-buttonv1"
              onClick={handleAddRange}
            >
              {tr('btnAddMore', 'Add More')}
            </button>
          </CCol>
        </CRow>
      </div>

      <div className="txtsubtitle">
        {tr('sectionSetAvailability', 'Set Availability')}
      </div>
      {/* Section-level availability error */}
      <ErrorText msg={errors.availability} />

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
                  <div
                    style={{
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      marginBottom: 8,
                    }}
                  >
                    <label>
                      {dayLabel(day)}{' '}
                      <input
                        type="checkbox"
                        checked={!days[day].closed}
                        onChange={(e) =>
                          handleClosedChange(day, !e.target.checked)
                        }
                      />{' '}
                      {tr('labelAvailable', 'Available')}
                    </label>
                  </div>

                  {!days[day].closed && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {days[day].times.map((range, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            gap: 20,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <label>
                            {tr('labelStartTime', 'Start Time')}:{' '}
                            <input
                              className="admin-txt-box"
                              type="time"
                              value={range.start}
                              onChange={(e) =>
                                handleTimeChange(day, index, 'start', e.target.value)
                              }
                            />
                          </label>

                          <label>
                            {tr('labelEndTime', 'End Time')}:{' '}
                            <input
                              className="admin-txt-box"
                              type="time"
                              value={range.end}
                              onChange={(e) =>
                                handleTimeChange(day, index, 'end', e.target.value)
                              }
                            />
                          </label>

                          <label>
                            {tr('labelNotes', 'Notes')}:{' '}
                            <input
                              type="text"
                              className="admin-txt-box"
                              placeholder={tr(
                                'phOptionalNotes',
                                'Optional notes',
                              )}
                              value={range.note || ''}
                              onChange={(e) =>
                                handleRangeNoteChange(
                                  day,
                                  index,
                                  e.target.value,
                                )
                              }
                            />
                          </label>

                          <div>
                            {tr('labelRangeHours', 'Range Hours')}:{' '}
                            <strong>{range.total || '0.00'}</strong>
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
                                  updatedTimes[index].ChkRemoveDays =
                                    e.target.checked

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
                                onClick={() =>
                                  handleRemoveTimeRange(day, index)
                                }
                              >
                                {tr('btnRemove', 'Remove')}
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
                          {tr('btnAddMore', 'Add More')}
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

      <div className="txtsubtitle">
        {tr('sectionFoodInfo', 'Food Information')}
      </div>
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          <CRow className="mb-2 fw-bold hbg">
            <CCol sm={3}>{tr('colFoodName', 'Food Name')}</CCol>
            <CCol sm={2}>
              {tr('colBaseFoodPrice', 'Food Price (Excl. VAT)')}
            </CCol>
            <CCol sm={3}>{tr('colNotes', 'Notes')}</CCol>
            {!HIDE_FOOD_IMAGE && <CCol sm={2}>{tr('colFoodImage', 'Food Image')}</CCol>}
            <CCol sm={1}>{tr('colInclude', 'Include')}</CCol>
            <CCol sm={1}>{tr('colDelete', 'Delete')}</CCol>
          </CRow>

          {foods.map((item, index) => {
            const basePrice = item.include ? 0 : Number(item.price || 0)
            const foodVatAmount =
              basePrice > 0 && effectiveVatPercent > 0
                ? dec(basePrice * effectiveVatRate)
                : 0
            const foodTotalWithVat = dec(basePrice + foodVatAmount)

            return (
              <CRow key={index} className="mb-3 align-items-center">
                <CCol sm={3}>
                  <input
                    type="text"
                    className="admin-txt-box w-100"
                    placeholder={tr('phEnterName', 'Enter name')}
                    value={item.name}
                    onChange={(e) =>
                      handleFoodChange(index, 'name', e.target.value)
                    }
                  />
                </CCol>

                <CCol sm={2}>
                  <input
                    type="number"
                    className="admin-txt-box w-100"
                    placeholder={
                      item.include
                        ? tr('phIncludedZero', 'Included (0)')
                        : tr('phEnterPrice', 'Enter price')
                    }
                    value={item.include ? 0 : item.price ?? ''}
                    onChange={(e) =>
                      handleFoodChange(index, 'price', e.target.value)
                    }
                    min="0"
                    step="0.01"
                    disabled={item.include}
                  />
                  {basePrice > 0 && effectiveVatPercent > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* VAT badge (matches your screenshot) */}
                      <div
                        style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          border: '1px solid #cf2037',
                          backgroundColor: '#ffe6eb',
                          color: '#cf2037',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {tr('labelVatAmount', 'VAT Amount')} (
                        {effectiveVatPercent.toFixed(2)}%):{' '}
                        <span style={{ fontWeight: 800 }}>
                          {foodVatAmount.toFixed(2)}
                        </span>
                      </div>

                      {/* Total incl. VAT text */}
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#333',
                        }}
                      >
                        {tr('labelPriceWithVatShort', 'Total incl. VAT')}:{' '}
                        <span>{foodTotalWithVat.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CCol>

                <CCol sm={3}>
                  <input
                    type="text"
                    className="admin-txt-box w-100"
                    placeholder={tr('phEnterNotes', 'Enter notes')}
                    value={item.notes}
                    onChange={(e) =>
                      handleFoodChange(index, 'notes', e.target.value)
                    }
                  />
                </CCol>

                {/* Food Image column (hidden when HIDE_FOOD_IMAGE) */}
                {!HIDE_FOOD_IMAGE && (
                  <CCol sm={2}>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-100"
                      onChange={(e) =>
                        handleFoodChange(
                          index,
                          'image',
                          e.target.files[0],
                        )
                      }
                    />
                  </CCol>
                )}

                <CCol sm={1} className="text-center">
                  <input
                    type="checkbox"
                    checked={item.include}
                    onChange={(e) =>
                      handleFoodChange(index, 'include', e.target.checked)
                    }
                    style={{
                      transform: 'scale(1.5)',
                      accentColor: 'red',
                      cursor: 'pointer',
                    }}
                    title={tr(
                      'titleIncludePriceZero',
                      'If checked, price becomes 0',
                    )}
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
                    priceRanges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleFoodRemoveFood(index)}
                        className="btn btn-danger btn-sm"
                      >
                        {tr('btnRemove', 'Remove')}
                      </button>
                    )
                  )}
                </CCol>
              </CRow>
            )
          })}

          <CRow className="mt-3">
            <CCol>
              <button
                type="button"
                className="admin-buttonv1"
                onClick={handleFoodAddMore}
              >
                {tr('btnAddMore', 'Add More')}
              </button>
            </CCol>
          </CRow>
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionTerms', 'Terms And Conditions')}{' '}
        <span style={{ color: 'red' }}>*</span>
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

      {/* -------------------- SUMMARY (BOTTOM) -------------------- */}
      <div className="txtsubtitle">
        {tr('sectionSummary', 'Summary')}
      </div>
      <div className="divbox">
        {/* Main summary card: Description / Amount / VAT / Total */}
        <div
          style={{
            maxWidth: 650,
            margin: '0 auto',
            border: '1px solid #ddd',
            borderRadius: 12,
            overflow: 'hidden',
            fontSize: 14,
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              background: '#f7f7f7',
              fontWeight: 600,
              padding: '8px 12px',
            }}
          >
            <div style={{ flex: 0.5 }}>
              {tr('summaryNo', '#')}
            </div>
            <div style={{ flex: 1.5 }}>
              {tr('summaryDescription', 'Description')}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {tr('summaryAmount', 'Amount')}
            </div>
            <div style={{ flex: 1, textAlign: 'right', color: '#cf2037' }}>
              {tr('summaryVat', 'VAT')}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {tr('summaryTotal', 'Total')}
            </div>
          </div>

          {/* Body rows */}
          <div style={{ padding: '8px 12px' }}>
            {/* 1. Trip */}
            <div
              style={{
                display: 'flex',
                padding: '6px 0',
                borderBottom: '1px solid #eee',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 0.5 }}>1.</div>
              <div style={{ flex: 1.5 }}>{tr('summaryTrip', 'Trip')}</div>
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                {tripPriceBase.toFixed(2)}
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: 'right',
                  fontWeight: 600,
                  color: '#cf2037',
                }}
              >
                {tripVatAmount.toFixed(2)}
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 700 }}>
                {tripTotalWithVat.toFixed(2)}
              </div>
            </div>

            {/* 2. Food */}
            <div
              style={{
                display: 'flex',
                padding: '6px 0',
                borderBottom: '1px solid #eee',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 0.5 }}>2.</div>
              <div style={{ flex: 1.5 }}>{tr('summaryFood', 'Food')}</div>
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                {foodBaseAmount.toFixed(2)}
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: 'right',
                  fontWeight: 600,
                  color: '#cf2037',
                }}
              >
                {foodVatAmount.toFixed(2)}
              </div>
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 700 }}>
                {foodTotalWithVat.toFixed(2)}
              </div>
            </div>

            {/* Total row */}
            <div
              style={{
                display: 'flex',
                padding: '8px 0 4px',
                fontWeight: 700,
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 0.5 }}></div>
              <div style={{ flex: 1.5 }}>
                {tr('summaryTotal', 'Total')}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                {totalBaseAmount.toFixed(2)}
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: 'right',
                  color: '#cf2037',
                }}
              >
                {totalVatAmount.toFixed(2)}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                {totalWithVat.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 🔶 Final big Total Cost box (green) */}
        <div
          style={{
            maxWidth: 650,
            margin: '16px auto 0',
            border: '3px solid #2e7d32',                // big green border
            borderRadius: 16,
            padding: '12px 16px',
            backgroundColor: 'rgba(46, 125, 50, 0.15)', // rgba green
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1b5e20' }}>
              {tr('summaryTotalCostInclVat', 'Your Total Cost Included VAT')}
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, color: '#1b5e20' }}>
              {tr(
                'summaryTotalCostEquation',
                'Total Amount + Total VAT Amount'
              )}
            </div>
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 24,
              color: '#1b5e20',
              marginTop: 8,
            }}
          >
            {totalWithVat.toFixed(2)}
          </div>
        </div>
      </div>
      {/* --------------------------------------------------------- */}

      <div className="button-container">
        <button className="admin-buttonv1" onClick={handlebtnSendToApprovalClick}>
          {tr('btnSendToAdmin', 'Send To Admin Approval')}
        </button>
        <button className="admin-buttonv1" onClick={handleSave} disabled={loading}>
          {loading ? tr('saving', 'Saving...') : tr('btnSave', 'Save')}
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/vendordata/activityinfo/activity/list')}
        >
          {tr('btnReturn', 'Return')}
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4> {tr('modalSendApprovalTitle', 'Send To Admin Approval')}</h4>
            <p>
              {tr(
                'modalSendApprovalText',
                'Are you sure you want to send this for admin approval?',
              )}
            </p>
            <div className="modal-buttons">
              <button className="admin-buttonv1" onClick={handleConfirm}>
                {tr('yes', 'Yes')}
              </button>
              <button className="admin-buttonv1" onClick={handleCancel}>
                {tr('no', 'No')}
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
