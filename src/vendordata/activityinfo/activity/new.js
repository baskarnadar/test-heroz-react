import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage, getAuthHeaders, IsVendorLoginIsValid, getVatAmount } from '../../../utils/operation'
import FilePreview from '../../widgets/FilePreview'
import { getFileNameFromUrl, getCurrentLoggedUserID } from '../../../utils/operation'
import { CRow, CCol } from '@coreui/react'

// ✅ Validator (returns { ok, errors, message })
import { validateActivityForm } from '../../../vendordata/activityinfo/activity/validate/validate'

// 🔤 i18n packs (default Arabic if not set)
import enPack from '../../../i18n/enloc100.json'
import arPack from '../../../i18n/arloc100.json'

// ✅ external css
import '../../../style/activity.css'

const ErrorText = ({ msg }) => (msg ? <div className="act-errorText">{msg}</div> : null)

const Vendor = () => {
  const HIDE_PRICE_RANGE_UI = true
  const HIDE_ACTIVITY_RATING_UI = false // actRating field visible
  const HIDE_FOOD_IMAGE = true // 👈 hide Extra Image everywhere

  // ✅ Vendor login guard: runs once when this page mounts
  useEffect(() => {
    IsVendorLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  // ✅ VAT rate:
  //    Assume getVatAmount() returns PERCENT (ex: 15 for 15%)
  const vatPercentValue = Number(getVatAmount() || 0) // 15
  const vatRateValue = vatPercentValue / 100 // 0.15

  // ⭐ Standard money rounding (2.447 → 2.45, etc.)
  const to2 = (v) => {
    const n = Number(v || 0)
    if (!Number.isFinite(n)) return '0.00'
    return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2)
  }

  const [showModal, setShowModal] = useState(false)
  const [txtactImageName1, setactImageName1] = useState(null)
  const [txtactImageName2, setactImageName2] = useState(null)
  const [txtactImageName3, setactImageName3] = useState(null)

  // ✅ NEW: per-image file type errors
  const [imageTypeErrors, setImageTypeErrors] = useState({
    txtactImageName1: '',
    txtactImageName2: '',
    txtactImageName3: '',
  })

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // form fields
  const [txtactName, setactName] = useState('')

  // ✅ UPDATED: Activity Type now supports SCHOOL + MEMBERSHIP
  const [selectedType, setactType] = useState('SCHOOL')

  // default rating kept, now visible
  const [actRating, setactRating] = useState('0') // 1..5 required

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
  const [rdoactGender, setGenderService] = useState('') // radio -> string

  const [txtactMinStudent, setMinStudent] = useState('')
  const [txtactMaxStudent, setMaxStudent] = useState('')

  const [txtactWhatsIncluded, setactWhatsIncluded] = useState('')
  const [txtactTripDetail, setactTripDetail] = useState('')
  const [txtactAdminNotes, setAdminNotes] = useState('')

  const [foods, setFoods] = useState([{ name: '', price: '', include: false }])
  const [countries, setCountries] = useState([])
  const [cityList, setCityList] = useState([])
  const [fetchcategories, setFetchCategories] = useState([])

  const [errors, setErrors] = useState({}) // per-field error messages

  // availability
  const [days, setDays] = useState({
    sunday: { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    monday: { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    tuesday: { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    wednesday: { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    thursday: { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    friday: { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    saturday: { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
  })

  // price
  const [priceRanges, setPriceRanges] = useState([{ price: '', rangeFrom: '', rangeTo: '' }])

  // ---- i18n helpers ----
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      return v === 'ar' || v === 'en' ? v : 'ar'
    } catch {
      return 'ar'
    }
  }

  const setStoredLang = (nextLang) => {
    const safe = nextLang === 'en' ? 'en' : 'ar'
    try {
      localStorage.setItem('heroz_lang', safe)
    } catch {}
    // update local state
    setLang(safe)
    // let other components know
    try {
      window.dispatchEvent(new Event('heroz_lang_changed'))
    } catch {}
  }

  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback

  // ✅ Sync when other parts change language
  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])

  // ✅ Apply <html dir> + <html lang> on every lang change (same i18n concept)
  useEffect(() => {
    try {
      const html = document.documentElement
      html.setAttribute('lang', lang)
      html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    } catch {}
  }, [lang])
  // ----------------------

  // utils
  const timeStringToMinutes = (timeStr) => {
    if (!timeStr) return null
    const [hourStr, minuteStr] = timeStr.split(':')
    if (!minuteStr) return null
    const hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr, 10)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null
    return hour * 60 + minute
  }

  const hasOverlap = (daysObj) => {
    for (const [dayName, dayData] of Object.entries(daysObj)) {
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

  // ✅ NEW: validate activity image type (png/jpg/jpeg only)
  const isAllowedActivityImage = (file) => {
    if (!(file instanceof File)) return { ok: true, msg: '' }
    const type = String(file.type || '').toLowerCase()
    const name = String(file.name || '').toLowerCase()

    const allowedMime = ['image/png', 'image/jpeg', 'image/jpg']
    const allowedExt = ['.png', '.jpg', '.jpeg']

    const extOk = allowedExt.some((ext) => name.endsWith(ext))
    const mimeOk = allowedMime.includes(type)

    if (!mimeOk && !extOk) {
      return {
        ok: false,
        msg: tr('errOnlyPngJpg', 'Only PNG / JPG / JPEG files are allowed.'),
      }
    }
    return { ok: true, msg: '' }
  }

  // handlers
  const handleClosedChange = (day, isClosed) => {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], closed: isClosed } }))
  }

  const handleTimeChange = (day, index, field, value) => {
    setDays((prev) => {
      const updatedTimes = [...prev[day].times]
      const prevRow = updatedTimes[index] || {}
      const next = { ...prevRow, [field]: value }

      const s = String(next.start || '').trim()
      const e = String(next.end || '').trim()
      if (s && e) {
        const sMin = timeStringToMinutes(s)
        const eMin = timeStringToMinutes(e)
        if (sMin !== null && eMin !== null && eMin > sMin) {
          const hrs = (eMin - sMin) / 60
          next.total = hrs.toFixed(2)
        } else {
          next.total = ''
        }
      } else {
        next.total = ''
      }

      updatedTimes[index] = next
      const dayTotal = updatedTimes.reduce((sum, t) => sum + Number(t.total || 0), 0)
      return { ...prev, [day]: { ...prev[day], times: updatedTimes, total: dayTotal.toFixed(2) } }
    })
  }

  const handleRangeNoteChange = (day, index, value) => {
    setDays((prev) => {
      const updatedTimes = [...prev[day].times]
      updatedTimes[index] = { ...(updatedTimes[index] || {}), note: value }
      const dayTotal = updatedTimes.reduce((sum, t) => sum + Number(t.total || 0), 0)
      return { ...prev, [day]: { ...prev[day], times: updatedTimes, total: dayTotal.toFixed(2) } }
    })
  }

  const handleAddMore = (day) => {
    const existingTimes = days[day].times
    const lastEnd = existingTimes.length ? timeStringToMinutes(existingTimes[existingTimes.length - 1].end) ?? 480 : 480 // 8:00
    const minutesToTime = (mins) => {
      const h = String(Math.floor(mins / 60)).padStart(2, '0')
      const m = String(mins % 60).padStart(2, '0')
      return `${h}:${m}`
    }
    const newStart = lastEnd
    const newEnd = newStart + 60
    const newTimes = [...existingTimes, { start: minutesToTime(newStart), end: minutesToTime(newEnd), total: '1.00', note: '' }]
    setDays({ ...days, [day]: { ...days[day], times: newTimes } })
  }

  const handleRemoveTimeRange = (day, index) => {
    const updatedTimes = days[day].times.filter((_, i) => i !== index)
    const newTotal = updatedTimes.reduce((sum, t) => sum + parseFloat(t.total || 0), 0)
    setDays({
      ...days,
      [day]: {
        ...days[day],
        times: updatedTimes.length ? updatedTimes : [{ start: '', end: '', total: '', note: '' }],
        total: newTotal.toFixed(2),
      },
    })
  }

  const handlePriceChange = (index, field, value) => {
    setPriceRanges((prev) => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  const handleAddRange = () => setPriceRanges((prev) => [...prev, { price: '', rangeFrom: '', rangeTo: '' }])
  const handleRemoveRange = (index) => setPriceRanges((prev) => prev.filter((_, i) => i !== index))

  // ✅ UPDATED: file upload with type check (used for activity images 1/2/3)
  const handleFileUpload = (fieldName, setter) => async (e) => {
    const file = e.target.files && e.target.files[0]

    // clear old error first
    setImageTypeErrors((prev) => ({ ...prev, [fieldName]: '' }))

    if (!file) {
      setter(null)
      return
    }

    const check = isAllowedActivityImage(file)
    if (!check.ok) {
      // reset the input so same file can be selected again
      try {
        e.target.value = ''
      } catch {}

      setter(null)
      setImageTypeErrors((prev) => ({ ...prev, [fieldName]: check.msg }))

      setToastMessage(check.msg)
      setToastType('fail')
      return
    }

    setter(file)
  }

  const handleCheckboxChange = (CategoryID) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(CategoryID) ? prevSelected.filter((id) => id !== CategoryID) : [...prevSelected, CategoryID],
    )
  }

  // food
  const uploadFoodImage = async (file) => {
    const formdata = new FormData()
    formdata.append('image', file)
    formdata.append('foldername', 'files/product/food')
    const res = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, { method: 'POST', body: formdata })
    const result = await res.json()
    return result.data?.key || result.data?.Key
  }

  const handleFoodChange = (index, field, value) => {
    const updated = [...foods]
    if (field === 'include') {
      updated[index].include = value
      if (value === true) updated[index].price = 0
    } else if (field === 'price') {
      const num = value === '' ? '' : Number(value)
      updated[index].price = updated[index].include ? 0 : num
    } else {
      updated[index][field] = value
    }
    setFoods(updated)
  }

  const handleFoodAddMore = () => setFoods([...foods, { name: '', price: '', include: false }])
  const handleFoodRemoveFood = (index) => setFoods(foods.filter((_, i) => i !== index))

  const getFoodData = async () => {
    const foodData = await Promise.all(
      foods.map(async (item) => {
        // base price used for VAT (0 if included)
        const basePrice = item.include ? 0 : Number(item.price || 0) || 0
        const vatAmount = basePrice * vatRateValue

        // 🔒 When hidden, never upload or send a key
        if (HIDE_FOOD_IMAGE) {
          return {
            FoodName: item.name || '',
            FoodPrice: item.price || '',
            FoodPriceVatPercentage: vatPercentValue, // ✅ VAT %
            FoodPriceVatAmount: vatAmount, // ✅ VAT amount for this food
            FoodNotes: item.notes || '',
            FoodImage: '', // ← blank when hidden
            Include: item.include || false,
          }
        }

        // ELSE (if showing): upload if provided
        let uploadedImageKey = ''
        if (item.image instanceof File) uploadedImageKey = await uploadFoodImage(item.image)
        return {
          FoodName: item.name || '',
          FoodPrice: item.price || '',
          FoodPriceVatPercentage: vatPercentValue,
          FoodPriceVatAmount: vatAmount,
          FoodNotes: item.notes || '',
          FoodImage: uploadedImageKey || '',
          Include: item.include || false,
        }
      }),
    )
    return foodData
  }

  const getPriceData = () =>
    priceRanges.map((item) => ({
      Price: item.price || '',
      StudentRangeFrom: item.rangeFrom || '',
      StudentRangeTo: item.rangeTo || '',
    }))

  const getAvailDaysHoursData = (val) => {
    const rows = []
    Object.entries(days).forEach(([dayName, dayData]) => {
      if (dayData.closed) return
      dayData.times.forEach((range) => {
        if (!range.start || !range.end) return
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
    return { actAvailDaysHours: val, rows }
  }

  // -------------------- SUMMARY VALUES (VAT) --------------------
  const tripPriceBase = Number(priceRanges[0]?.price || 0)
  const tripVatAmount = tripPriceBase * vatRateValue

  const foodBaseAmount = foods.reduce((sum, item) => sum + (item.include ? 0 : Number(item.price || 0)), 0)
  const foodVatAmount = foodBaseAmount * vatRateValue

  const totalBaseAmount = tripPriceBase + foodBaseAmount
  const totalVatAmount = tripVatAmount + foodVatAmount
  const totalWithVat = totalBaseAmount + totalVatAmount

  // per-row totals (Amount + VAT)
  const tripTotalWithVatRow = tripPriceBase + tripVatAmount
  const foodTotalWithVatRow = foodBaseAmount + foodVatAmount

  // values to send in payload for Activity-level price VAT
  const actPriceVatPercentageVal = vatPercentValue
  const actPriceVatAmountVal = tripVatAmount

  // load lookups
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/lookupdata/city/getcityalllist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const result = await response.json()
        if (result.data) setCityList(result.data)
      } catch {}
    }
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/lookupdata/country/getcountrylist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const result = await response.json()
        if (result.data) setCountries(result.data)
      } catch {}
    }
    const FetchCategory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/lookupdata/category/getCategoryAllList`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        })
        const result = await response.json()
        if (result.data) setFetchCategories(result.data)
      } catch {}
    }
    fetchCities()
    fetchCountries()
    FetchCategory()
  }, [])

  // submit
  const handleSubmit = async (actStatusVal, e) => {
    if (e?.preventDefault) e.preventDefault()

    // ✅ Block submit if invalid image type selected
    const anyImageTypeError =
      (imageTypeErrors.txtactImageName1 && imageTypeErrors.txtactImageName1.trim()) ||
      (imageTypeErrors.txtactImageName2 && imageTypeErrors.txtactImageName2.trim()) ||
      (imageTypeErrors.txtactImageName3 && imageTypeErrors.txtactImageName3.trim())

    if (anyImageTypeError) {
      setToastMessage(tr('fixImageType', 'Please fix the image file type (PNG/JPG/JPEG only).'))
      setToastType('fail')
      return
    }

    const validation = validateActivityForm({
      txtactName,
      selectedType, // ✅ now can be 'SCHOOL' or 'MEMBERSHIP'
      selectedCategories,
      txtactDesc,
      txtactImageName1,
      txtactImageName2,
      txtactImageName3,
      txtactGoogleMap,
      txtactGlat,
      txtactGlan,
      ddactCountryID,
      ddactCityID,
      txtactAddress1,
      rdoactGender,
      txtactMinAge,
      txtactMaxAge,
      actRating, // now visible
      txtactMinStudent,
      txtactMaxStudent,
      priceRanges,
      days,
      foods,
      txtactAdminNotes,
    })

    if (!validation.ok) {
      setErrors(validation.errors || {})
      setToastMessage(validation.message || tr('fixHighlighted', 'Please fix the highlighted fields.'))
      setToastType('fail')

      const firstField = Object.keys(validation.errors || {})[0]
      if (firstField) {
        const el = document.querySelector(`[name="${firstField}"]`)
        if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (el?.focus) el.focus()
      }
      return
    }

    setErrors({})
    setLoading(true)
    setToastMessage('')

    const overlap = hasOverlap(days)
    if (overlap) {
      const overlapMsg = tr('timeOverlap', 'Time range overlap on {day}: {s1}–{e1} overlaps with {s2}–{e2}')
        .replace('{day}', overlap.day)
        .replace('{s1}', overlap.range1.start)
        .replace('{e1}', overlap.range1.end)
        .replace('{s2}', overlap.range2.start)
        .replace('{e2}', overlap.range2.end)

      setToastMessage(overlapMsg)
      setToastType('fail')
      setLoading(false)
      return
    }

    // upload activity images if any
    let img1 = '',
      img2 = '',
      img3 = ''
    try {
      if (txtactImageName1 instanceof File) {
        const fd = new FormData()
        fd.append('image', txtactImageName1)
        fd.append('foldername', 'activity')
        const r = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, { method: 'POST', body: fd })
        const j = await r.json()
        img1 = getFileNameFromUrl(j?.data?.key || j?.data?.Key)
      }

      if (txtactImageName2 instanceof File) {
        const fd = new FormData()
        fd.append('image', txtactImageName2)
        fd.append('foldername', 'activity')
        const r = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, { method: 'POST', body: fd })
        const j = await r.json()
        img2 = getFileNameFromUrl(j?.data?.key || j?.data?.Key)
      }

      if (txtactImageName3 instanceof File) {
        const fd = new FormData()
        fd.append('image', txtactImageName3)
        fd.append('foldername', 'activity')
        const r = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, { method: 'POST', body: fd })
        const j = await r.json()
        img3 = getFileNameFromUrl(j?.data?.key || j?.data?.Key)
      }
    } catch {
      // ignore upload error here; validator ensures at least one if required
    }

    const actfoodDataVal = await getFoodData()
    const actavailDaysHoursVal = getAvailDaysHoursData()
    const actPriceDataVal = getPriceData()

    // 🔍 DEBUG: log VAT + payload
    const url = `${API_BASE_URL}/vendordata/activityinfo/activity/createActivity`
    const payload = {
      VendorID: getCurrentLoggedUserID(),
      actName: txtactName || '',
      actTypeID: selectedType, // ✅ 'SCHOOL' or 'MEMBERSHIP'
      actCategoryID: selectedCategories,
      actDesc: txtactDesc || '',

      actImageName1: img1,
      actImageName2: img2,
      actImageName3: img3,

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
      actPriceVatPercentage: actPriceVatPercentageVal, // ✅ VAT %
      actPriceVatAmount: actPriceVatAmountVal, // ✅ VAT amount on base price

      // 🟢 send full totals but KEEP base price unchanged
      actTotalBaseAmount: totalBaseAmount, // Trip + Food base
      actTotalVatAmount: totalVatAmount, // Trip VAT + Food VAT
      actTotalAmountWithVat: totalWithVat, // Base + VAT

      actAvailDaysHours: actavailDaysHoursVal,
      actFood: actfoodDataVal, // 👈 FoodImage will be '' when hidden

      actWhatsIncluded: txtactWhatsIncluded || '',
      actTripDetail: txtactTripDetail || '',
      actAdminNotes: txtactAdminNotes || '',
      actRating: Number(actRating), // visible + submitted
      actStatus: actStatusVal,
      IsDataStatus: 1,
      CreatedBy: getCurrentLoggedUserID(),
      ModifyBy: getCurrentLoggedUserID(),
    }

    console.log('▶️ createActivity URL:', url)
    console.log('▶️ createActivity VAT %:', vatPercentValue, 'rate:', vatRateValue)
    console.log('▶️ createActivity tripPriceBase:', tripPriceBase, 'tripVatAmount:', tripVatAmount)
    console.log('▶️ createActivity foodBaseAmount:', foodBaseAmount, 'foodVatAmount:', foodVatAmount)
    console.log('▶️ createActivity TOTAL base:', totalBaseAmount, 'TOTAL VAT:', totalVatAmount, 'TOTAL with VAT:', totalWithVat)
    console.log('▶️ createActivity payload:', payload)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      console.log('◀️ createActivity status:', response.status)

      let resultJson = null
      try {
        resultJson = await response.json()
        console.log('◀️ createActivity response JSON:', resultJson)
      } catch (jsonErr) {
        console.log('⚠️ Failed to parse JSON from createActivity:', jsonErr)
      }

      if (!response.ok) {
        const errMsg = resultJson?.message || `HTTP error: ${response.status}`
        throw new Error(errMsg)
      }

      setToastMessage(tr('toastActivityAdded', 'Activity added successfully!'))
      setToastType('success')
      setTimeout(() => navigate('/vendordata/activityinfo/activity/list'), 2000)
    } catch (err) {
      console.error('❌ createActivity error:', err)
      setToastMessage(tr('toastActivityAddFailed', 'Failed to add Activity.'))
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  // UI
  const dayLabel = (d) => tr(`day_${d}`, d)

  const toggleLang = () => setStoredLang(lang === 'ar' ? 'en' : 'ar')

  return (
    <div>
      <div className="divhbg">
        <div className="txtheadertitle">{tr('actAddTitle', 'Add New Activity')}</div>

        <div className="act-headerActions">
          {/* ✅ EN/AR toggle (shows opposite language) */}
          <button type="button" className="admin-buttonv1" onClick={toggleLang} title={tr('toggleLang', 'Switch language')}>
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>

          <button className="admin-buttonv1" onClick={() => setShowModal(true)}>
            {tr('btnSendToAdmin', 'Send To Admin Approval')}
          </button>
          <button className="admin-buttonv1" onClick={(e) => handleSubmit('DRAFT', e)}>
            {tr('btnSave', 'Save')}
          </button>
          <button type="button" className="admin-buttonv1" onClick={() => navigate('/vendordata/activityinfo/activity/list')}>
            {tr('btnReturn', 'Return')}
          </button>
        </div>
      </div>

      <div className="txtsubtitle">{tr('sectionActivityInfo', 'Activity Information')}</div>

      <div className="divbox">
        <div className="form-group">
          <label className="act-requiredLabel">
            {tr('labelActivityName', 'Activity Name')} <span className="act-required">*</span>
          </label>
          <input name="txtactName" className="admin-txt-box" type="text" value={txtactName} onChange={(e) => setactName(e.target.value)} />
          <ErrorText msg={errors.txtactName} />
        </div>

        {/* ✅ UPDATED: Activity Type (SCHOOL / MEMBERSHIP) */}
        <div className="form-group">
          <label className="act-fieldLabelSpacing">
            {tr('labelActivityType', 'Activity Type')} <span className="act-required">*</span>
          </label>

          <div className="act-typeRow">
            <label className="act-genderOption" style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="selectedType"
                value="SCHOOL"
                checked={selectedType === 'SCHOOL'}
                onChange={(e) => setactType(e.target.value)}
                className="act-genderRadio"
              />
              <div className="pink-shadow4 act-typePill">{tr('typeSchool', 'School')}</div>
            </label>

            <label className="act-genderOption" style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                name="selectedType"
                value="MEMBERSHIP"
                checked={selectedType === 'MEMBERSHIP'}
                onChange={(e) => setactType(e.target.value)}
                className="act-genderRadio"
              />
              <div className="pink-shadow4 act-typePill">{tr('typeMembership', 'Membership')}</div>
            </label>

            {/* ✅ keep hidden value for any legacy form reads */}
            <input type="hidden" name="selectedTypeHidden" value={selectedType} />
          </div>

          <ErrorText msg={errors.selectedType} />
        </div>

        {!HIDE_ACTIVITY_RATING_UI && (
          <div className="act-ratingWrap">
            <label className="vendor-label act-ratingLabel" htmlFor="actRating">
              {tr('labelActivityRating', 'Activity Rating')} <span className="act-required">*</span>
            </label>

            <input
              id="actRating"
              name="actRating"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="1"
              max="5"
              className="admin-txt-box"
              placeholder={tr('phEnterRating', 'Enter rating 1 to 5')}
              value={actRating}
              onChange={(e) => setactRating(e.target.value)}
            />
            <ErrorText msg={errors.actRating} />
          </div>
        )}

        <div className="act-categoriesWrap">
          <label className="act-categoriesLabel">
            {tr('labelCategories', 'Activity Categories')} <span className="act-required">*</span>
          </label>

          <div className="act-categoriesGrid">
            {fetchcategories.map((item) => (
              <label key={item.CategoryID} className="act-categoryItem">
                <div className="act-categoryCheckWrap">
                  <input
                    type="checkbox"
                    name="selectedCategories"
                    value={item.CategoryID}
                    checked={selectedCategories.includes(item.CategoryID)}
                    onChange={() => handleCheckboxChange(item.CategoryID)}
                    className="act-categoryCheckbox"
                  />
                </div>
                <div className="pink-shadow4">{lang === 'ar' ? item.ArCategoryName : item.EnCategoryName}</div>
              </label>
            ))}
          </div>

          <ErrorText msg={errors.selectedCategories} />
        </div>

        <div className="form-group">
          <label className="act-requiredLabel">
            {tr('labelActivityDesc', 'Activity Description')} <span className="act-required">*</span>
          </label>
          <textarea name="txtactDesc" className="vendor-input" rows={4} value={txtactDesc} onChange={(e) => setactDesc(e.target.value)} />
          <ErrorText msg={errors.txtactDesc} />
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionActivityImages', 'Activity Images')} <span className="act-required">*</span>
        <span className="act-uploadNote">upload min image with (500px and png or jpg )</span>
      </div>

      <div className="divbox">
        <div className="act-imagesRow">
          <div className="form-group act-imageCol">
            <label>{tr('labelImage1', 'Activity Image 1')}</label>
            <input
              name="txtactImageName1"
              className="admin-txt-box"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileUpload('txtactImageName1', setactImageName1)}
            />
            <ErrorText msg={imageTypeErrors.txtactImageName1} />
            <FilePreview file={txtactImageName1} />
          </div>

          <div className="form-group act-imageCol">
            <label>{tr('labelImage2', 'Activity Image 2')}</label>
            <input
              name="txtactImageName2"
              className="admin-txt-box"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileUpload('txtactImageName2', setactImageName2)}
            />
            <ErrorText msg={imageTypeErrors.txtactImageName2} />
            <FilePreview file={txtactImageName2} />
          </div>

          <div className="form-group act-imageCol">
            <label>{tr('labelImage3', 'Activity Image 3')}</label>
            <input
              name="txtactImageName3"
              className="admin-txt-box"
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileUpload('txtactImageName3', setactImageName3)}
            />
            <ErrorText msg={imageTypeErrors.txtactImageName3} />
            <FilePreview file={txtactImageName3} />
          </div>
        </div>

        <ErrorText msg={errors.images} />
      </div>

      <div className="txtsubtitle">{tr('sectionYoutube', 'YouTube Videos (Optional)')}</div>

      <div className="divbox">
        <div className="form-group">
          <label className="vendor-label">{tr('labelYoutube1', 'YouTube Video 1')}</label>
          <input type="text" className="vendor-input" placeholder="Ydgkndgf" value={txtactYouTubeID1} onChange={(e) => setYouTube1(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="vendor-label">{tr('labelYoutube2', 'YouTube Video 2')}</label>
          <input type="text" className="vendor-input" placeholder="Ydgkndgf" value={txtactYouTubeID2} onChange={(e) => setYouTube2(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="vendor-label">{tr('labelYoutube3', 'YouTube Video 3')}</label>
          <input type="text" className="vendor-input" placeholder="Ydgkndgf" value={txtactYouTubeID3} onChange={(e) => setYouTube3(e.target.value)} />
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionLocation', 'Activity Location')} <span className="act-required">*</span>
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelGoogleMap', 'Google Map Location')} <span className="act-required">*</span>
              </label>
              <input name="txtactGoogleMap" className="vendor-input" value={txtactGoogleMap} onChange={(e) => setactGoogleMap(e.target.value)} />
              <ErrorText msg={errors.txtactGoogleMap} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLatitude', 'Google Latitude')} <span className="act-required">*</span>
              </label>
              <input name="txtactGlat" className="vendor-input" value={txtactGlat} onChange={(e) => setGlat(e.target.value)} />
              <ErrorText msg={errors.txtactGlat} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLongitude', 'Google Longitude')} <span className="act-required">*</span>
              </label>
              <input name="txtactGlan" className="vendor-input" value={txtactGlan} onChange={(e) => setGlan(e.target.value)} />
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
                {tr('labelCountry', 'Country')} <span className="act-required">*</span>
              </label>

              <select name="ddactCountryID" value={ddactCountryID} onChange={(e) => setCountryID(e.target.value)} className="act-select">
                <option value="">{tr('optSelectCountry', 'Select a country')}</option>
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
                {tr('labelCity', 'City')} <span className="act-required">*</span>
              </label>
              <select name="ddactCityID" className="admin-txt-box" value={ddactCityID} onChange={(e) => setSelectedCityID(e.target.value)}>
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
                {tr('labelLocation1', 'Location1')} <span className="act-required">*</span>
              </label>
              <input name="txtactAddress1" className="vendor-input" value={txtactAddress1} onChange={(e) => setAddress1(e.target.value)} />
              <ErrorText msg={errors.txtactAddress1} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">{tr('labelAddress2', 'Address2')}</label>
              <input name="txtactAddress2" className="vendor-input" value={txtactAddress2} onChange={(e) => setAddress2(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionAgeRange', 'Age Range')} <span className="act-required">*</span>
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="act-twoColRow">
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelMinAge', 'Minimum Age')} <span className="act-required">*</span>
              </label>
              <input name="txtactMinAge" type="number" min="0" className="vendor-input" value={txtactMinAge} onChange={(e) => setMinAge(e.target.value)} />
              <ErrorText msg={errors.txtactMinAge} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelMaxAge', 'Maximum Age')} <span className="act-required">*</span>
              </label>
              <input name="txtactMaxAge" type="number" min="0" className="vendor-input" value={txtactMaxAge} onChange={(e) => setMaxAge(e.target.value)} />
              <ErrorText msg={errors.txtactMaxAge} />
            </div>
          </div>
        </div>

        <div className="vendor-container act-genderContainer">
          <div className="act-genderRow">
            <label className="vendor-label">
              {tr('labelGender', 'Gender')} <span className="act-required">*</span>
            </label>

            <label className="act-genderOption">
              <input
                type="radio"
                name="rdoactGender"
                value="BOYS"
                checked={rdoactGender === 'BOYS'}
                onChange={(e) => setGenderService(e.target.value)}
                className="act-genderRadio"
              />
              <div className="pink-shadow4">{tr('genderBoys', 'Boys')}</div>
            </label>

            <label className="act-genderOption">
              <input
                type="radio"
                name="rdoactGender"
                value="GIRLS"
                checked={rdoactGender === 'GIRLS'}
                onChange={(e) => setGenderService(e.target.value)}
                className="act-genderRadio"
              />
              <div className="pink-shadow4">{tr('genderGirls', 'Girls')}</div>
            </label>

            <label className="act-genderOption">
              <input
                type="radio"
                name="rdoactGender"
                value="BOTH"
                checked={rdoactGender === 'BOTH'}
                onChange={(e) => setGenderService(e.target.value)}
                className="act-genderRadio"
              />
              <div className="pink-shadow4">{tr('genderBoth', 'Both')}</div>
            </label>
          </div>

          <ErrorText msg={errors.rdoactGender} />
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionCapacity', 'Capacity Information')} <span className="act-required">*</span>
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="act-twoColRow">
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelMinStudents', 'Minimum Students')} <span className="act-required">*</span>
              </label>
              <input
                name="txtactMinStudent"
                type="number"
                min="1"
                className="vendor-input"
                value={txtactMinStudent}
                onChange={(e) => setMinStudent(e.target.value)}
              />
              <ErrorText msg={errors.txtactMinStudent} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelMaxStudents', 'Maximum Students')} <span className="act-required">*</span>
              </label>
              <input
                name="txtactMaxStudent"
                type="number"
                min="1"
                className="vendor-input"
                value={txtactMaxStudent}
                onChange={(e) => setMaxStudent(e.target.value)}
              />
              <ErrorText msg={errors.txtactMaxStudent} />
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- VAT / PRICE SECTION -------------------- */}
      <div className="txtsubtitle">
        {tr('sectionPerStudent', 'Per Student (vendor Price)')}
        {vatPercentValue > 0 && <span className="act-vatPercentPill">{`+ VAT ${to2(vatPercentValue)}%`}</span>}
        <span className="act-required">*</span>
      </div>

      <div className="divbox">
        <CRow className="fw-bold mb-2">
          <CCol sm={3}>
            {tr('colBasePricePerStudent', 'Price Per Student (Excl. VAT)')} <span className="act-required">*</span>
          </CCol>
          <CCol sm={3} className={HIDE_PRICE_RANGE_UI ? 'act-hide' : ''}>
            {tr('labelStudentRangeFrom', 'Student Range From')}
          </CCol>
          <CCol sm={3} className={HIDE_PRICE_RANGE_UI ? 'act-hide' : ''}>
            {tr('labelStudentRangeTo', 'Student Range To')}
          </CCol>
          <CCol sm={3} className={HIDE_PRICE_RANGE_UI ? 'act-hide' : ''}></CCol>
        </CRow>

        {priceRanges.map((item, index) => {
          const priceNum = Number(item.price || 0)
          const vatAmount = priceNum * vatRateValue

          return (
            <CRow key={index} className="align-items-center mb-2">
              <CCol sm={12}>
                <input
                  name={`price_${index}`}
                  type="number"
                  className="vendor-input w-100"
                  placeholder={tr('phPrice', 'Price')}
                  value={item.price}
                  onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                  min="0"
                />
                {index === 0 && <ErrorText msg={errors.price} />}

                {priceNum > 0 && vatPercentValue > 0 && (
                  <div className="act-vatPillWrap">
                    <span className="act-vatPill">
                      {tr('labelVatAmount', 'VAT Amount')} ({to2(vatPercentValue)}%):{' '}
                      <strong className="act-vatStrong">{to2(vatAmount)}</strong>
                    </span>
                  </div>
                )}
              </CCol>

              <CCol sm={3} className={HIDE_PRICE_RANGE_UI ? 'act-hide' : ''}>
                <input
                  name={`rangeFrom_${index}`}
                  type="text"
                  className="vendor-input w-100 text-center"
                  value={item.rangeFrom}
                  onChange={(e) => handlePriceChange(index, 'rangeFrom', e.target.value)}
                />
              </CCol>

              <CCol sm={3} className={HIDE_PRICE_RANGE_UI ? 'act-hide' : ''}>
                <input
                  name={`rangeTo_${index}`}
                  type="text"
                  className="vendor-input w-100 text-center"
                  value={item.rangeTo}
                  onChange={(e) => handlePriceChange(index, 'rangeTo', e.target.value)}
                />
              </CCol>

              <CCol sm={3} className={HIDE_PRICE_RANGE_UI ? 'act-hide' : ''}>
                {priceRanges.length > 1 && (
                  <button type="button" className="btn btn-danger" onClick={() => handleRemoveRange(index)}>
                    {tr('btnRemove', 'Remove')}
                  </button>
                )}
              </CCol>
            </CRow>
          )
        })}

        <CRow className={`mt-3 ${HIDE_PRICE_RANGE_UI ? 'act-hide' : ''}`}>
          <CCol>
            <button type="button" className="admin-buttonv1" onClick={handleAddRange}>
              {tr('btnAddMore', 'Add More')}
            </button>
          </CCol>
        </CRow>
      </div>

      <div className="txtsubtitle">
        {tr('sectionSetAvailability', 'Set Availability')} <span className="act-required">*</span>
      </div>

      <div className="divbox">
        <ErrorText msg={errors.availability} />

        <div className="act-availabilityWrap">
          {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
            <div key={day} className="act-dayRow">
              <div className="act-dayGrow">
                <div className="act-dayHeader">
                  <label>
                    {dayLabel(day)}{' '}
                    <input type="checkbox" checked={!days[day].closed} onChange={(e) => handleClosedChange(day, !e.target.checked)} />{' '}
                    {tr('labelAvailable', 'Available')}
                  </label>
                </div>

                {!days[day].closed && (
                  <div className="act-dayTimesWrap">
                    {days[day].times.map((range, index) => (
                      <div key={index} className="act-timeRow">
                        <label className="act-timeLabel">
                          {tr('labelStartTime', 'Start Time')} <span className="act-required">*</span>{' '}
                          <input
                            className="admin-txt-box"
                            type="time"
                            name={`start_${day}_${index}`}
                            value={range.start}
                            onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)}
                          />
                        </label>

                        <label className="act-timeLabel">
                          {tr('labelEndTime', 'End Time')} <span className="act-required">*</span>{' '}
                          <input
                            className="admin-txt-box"
                            type="time"
                            name={`end_${day}_${index}`}
                            value={range.end}
                            onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)}
                          />
                        </label>

                        <label className="act-timeLabel">
                          {tr('labelNotes', 'Notes')}:{' '}
                          <input
                            type="text"
                            className="admin-txt-box"
                            value={range.note || ''}
                            placeholder={tr('phOptionalNotes', 'Optional notes')}
                            onChange={(e) => handleRangeNoteChange(day, index, e.target.value)}
                          />
                        </label>

                        <div className="act-rangeHours">
                          {tr('labelRangeHours', 'Range Hours')}: <strong>{range.total || '0.00'}</strong>
                        </div>

                        {days[day].times.length > 1 && (
                          <button type="button" className="act-removeTimeBtn" onClick={() => handleRemoveTimeRange(day, index)}>
                            {tr('btnRemove', 'Remove')}
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="act-addMoreWrap">
                      <button type="button" className="admin-buttonv1" onClick={() => handleAddMore(day)}>
                        {tr('btnAddMore', 'Add More')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="txtsubtitle">{tr('sectionFoodInfo', 'Extra Information')}</div>

      <div className="divbox">
        <div className="act-foodWrap">
          <CRow className="mb-2 fw-bold hbg">
            <CCol sm={3}>{tr('colFoodName', 'Extra Name')}</CCol>
            <CCol sm={2}>{tr('colBaseFoodPrice', 'Extra Price (Excl. VAT)')}</CCol>
            <CCol sm={3}>{tr('colFoodVatAmount', 'VAT Amount')}</CCol>
            <CCol sm={3}>{tr('colNotes', 'Notes')}</CCol>
            {!HIDE_FOOD_IMAGE && <CCol sm={1}>{tr('colFoodImage', 'Extra Image')}</CCol>}
            <CCol sm={1}>{tr('colInclude', 'Include')}</CCol>
            <CCol sm={1}></CCol>
          </CRow>

          {foods.map((item, index) => {
            const baseFoodPrice = item.include ? 0 : Number(item.price || 0)
            const foodVat = baseFoodPrice * vatRateValue

            return (
              <CRow key={index} className="mb-3 align-items-center">
                <CCol sm={3}>
                  <input
                    type="text"
                    className="admin-txt-box w-100"
                    placeholder={tr('phEnterName', 'Enter name')}
                    value={item.name}
                    onChange={(e) => handleFoodChange(index, 'name', e.target.value)}
                  />
                </CCol>

                <CCol sm={2}>
                  <input
                    type="number"
                    className="admin-txt-box w-100"
                    placeholder={item.include ? tr('phIncludedZero', 'Included (0)') : tr('phEnterPrice', 'Enter price')}
                    value={item.include ? 0 : item.price ?? ''}
                    onChange={(e) => handleFoodChange(index, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={item.include}
                  />
                </CCol>

                <CCol sm={3}>
                  {baseFoodPrice > 0 && vatPercentValue > 0 && (
                    <div className="act-foodVatCell">
                      <span className="act-vatPill">
                        {tr('labelVatAmount', 'VAT Amount')} ({to2(vatPercentValue)}%):{' '}
                        <strong className="act-vatStrong">{to2(foodVat)}</strong>
                      </span>
                    </div>
                  )}
                </CCol>

                <CCol sm={3}>
                  <input
                    type="text"
                    className="admin-txt-box w-100"
                    placeholder={tr('phEnterNotes', 'Enter notes')}
                    value={item.notes || ''}
                    onChange={(e) => handleFoodChange(index, 'notes', e.target.value)}
                  />
                </CCol>

                {!HIDE_FOOD_IMAGE && (
                  <CCol sm={1}>
                    <input type="file" accept="image/*" className="w-100" onChange={(e) => handleFoodChange(index, 'image', e.target.files[0])} />
                  </CCol>
                )}

                <CCol sm={1} className="text-center">
                  <input
                    type="checkbox"
                    checked={item.include}
                    onChange={(e) => handleFoodChange(index, 'include', e.target.checked)}
                    className="act-includeCheckbox"
                    title={tr('titleIncludePriceZero', 'If checked, price becomes 0')}
                  />
                </CCol>

                <CCol sm={1}>
                  {foods.length > 1 && (
                    <button type="button" onClick={() => handleFoodRemoveFood(index)} className="btn btn-danger btn-sm">
                      {tr('btnRemove', 'Remove')}
                    </button>
                  )}
                </CCol>
              </CRow>
            )
          })}

          <CRow className="mt-3">
            <CCol>
              <button type="button" className="admin-buttonv1" onClick={handleFoodAddMore}>
                {tr('btnAddMore', 'Add More')}
              </button>
            </CCol>
          </CRow>
        </div>
      </div>

      <div className="txtsubtitle">{tr('sectionTripExtraDetails', 'Trip Extra Details')}</div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="form-group">
            <label className="act-requiredLabel">
              {tr('labelWhatsIncluded', 'What is Include')}
            </label>
            <textarea
              name="txtactWhatsIncluded"
              className="vendor-input"
              rows={4}
              value={txtactWhatsIncluded}
              onChange={(e) => setactWhatsIncluded(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="act-requiredLabel">
              {tr('labelTripDetails', 'Trip Details')}
            </label>
            <textarea
              name="txtactTripDetail"
              className="vendor-input"
              rows={4}
              value={txtactTripDetail}
              onChange={(e) => setactTripDetail(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionTerms', 'Terms And Conditions')} <span className="act-required">*</span>
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <textarea name="txtactAdminNotes" className="vendor-input" rows={5} value={txtactAdminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
          <ErrorText msg={errors.txtactAdminNotes} />
        </div>
      </div>

      {/* -------------------- SUMMARY (BOTTOM) -------------------- */}
      <div className="txtsubtitle">{tr('sectionSummary', 'Summary')}</div>

      <div className="divbox">
        <div className="act-summaryCard">
          <div className="act-summaryHeader">
            <div className="act-summaryNo">{tr('summaryNo', '#')}</div>
            <div className="act-summaryDesc">{tr('summaryDescription', 'Description')}</div>
            <div className="act-summaryAmount">
              {tr('summaryAmount', 'Amount')} <span className="act-vatPill">({to2(vatPercentValue)}%)</span>
            </div>
            <div className="act-summaryVat">{tr('summaryVat', 'VAT')}</div>
            <div className="act-summaryTotal">{tr('summaryTotalInclVat', 'Total')}</div>
          </div>

          <div className="act-summaryBody">
            <div className="act-summaryRow">
              <div className="act-summaryNo">1.</div>
              <div className="act-summaryDesc">{tr('summaryTrip', 'Trip')}</div>
              <div className="act-summaryAmountVal">{to2(tripPriceBase)}</div>
              <div className="act-summaryVatVal">{to2(tripVatAmount)}</div>
              <div className="act-summaryTotalVal">{to2(tripTotalWithVatRow)}</div>
            </div>

            <div className="act-summaryRow">
              <div className="act-summaryNo">2.</div>
              <div className="act-summaryDesc">{tr('summaryFood', 'Extra')}</div>
              <div className="act-summaryAmountVal">{to2(foodBaseAmount)}</div>
              <div className="act-summaryVatVal">{to2(foodVatAmount)}</div>
              <div className="act-summaryTotalVal">{to2(foodTotalWithVatRow)}</div>
            </div>

            <div className="act-summaryTotalRow">
              <div className="act-summaryNo"></div>
              <div className="act-summaryDesc">{tr('summaryTotal', 'Total')}</div>
              <div className="act-summaryAmountVal">{to2(totalBaseAmount)}</div>
              <div className="act-summaryVatVal">{to2(totalVatAmount)}</div>
              <div className="act-summaryTotalVal">{to2(totalWithVat)}</div>
            </div>
          </div>
        </div>

        <div className="act-totalGreenBox">
          <div>
            <div className="act-totalGreenTitle">{tr('summaryTotalCostInclVat', 'Your Total Price Included VAT')}</div>
            <div className="act-totalGreenSub">{tr('summaryTotalCostEquation', 'Total Amount + Total VAT Amount')}</div>
          </div>
          <div className="act-totalGreenValue">{to2(totalWithVat)}</div>
        </div>
      </div>

      <div className="button-container">
        <button className="admin-buttonv1" onClick={() => setShowModal(true)}>
          {tr('btnSendToAdmin', 'Send To Admin Approval')}
        </button>
        <button className="admin-buttonv1" onClick={(e) => handleSubmit('DRAFT', e)}>
          {tr('btnSave', 'Save')}
        </button>
        <button type="button" className="admin-buttonv1" onClick={() => navigate('/vendordata/activityinfo/activity/list')}>
          {tr('btnCancel', 'Cancel')}
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content_50">
            <h4>{tr('modalSendApprovalTitle', 'Send To Admin Approval')}</h4>
            <p>{tr('modalSendApprovalText', 'Are you sure you want to send this for admin approval?')}</p>
            <div className="modal-buttons">
              <button
                className="admin-buttonv1"
                onClick={(e) => {
                  setShowModal(false)
                  handleSubmit('WAITING-FOR-APPROVAL', e)
                }}
              >
                {tr('yes', 'Yes')}
              </button>
              <button className="admin-buttonv1" onClick={() => setShowModal(false)}>
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
