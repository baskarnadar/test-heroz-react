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

const ErrorText = ({ msg }) =>
  msg ? <div style={{ color: '#cf2037', fontSize: 12, marginTop: 4 }}>{msg}</div> : null

const Vendor = () => {
  const HIDE_PRICE_RANGE_UI = true
  const HIDE_ACTIVITY_RATING_UI = false   // actRating field visible
  const HIDE_FOOD_IMAGE = true            // 👈 hide Food Image everywhere

  // ✅ Vendor login guard: runs once when this page mounts
  useEffect(() => {
    IsVendorLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  // ✅ VAT rate:
  //    Assume getVatAmount() returns PERCENT (ex: 15 for 15%)
  const vatPercentValue = Number(getVatAmount() || 0)   // 15
  const vatRateValue = vatPercentValue / 100           // 0.15

  const [showModal, setShowModal] = useState(false)
  const [txtactImageName1, setactImageName1] = useState(null)
  const [txtactImageName2, setactImageName2] = useState(null)
  const [txtactImageName3, setactImageName3] = useState(null)

  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // form fields
  const [txtactName, setactName] = useState('')
  // 🔒 Activity Type fixed to SCHOOL
  const [selectedType, setactType] = useState('SCHOOL')

  // default rating kept, now visible
  const [actRating, setactRating] = useState('0')  // 1..5 required

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

  const [txtactAdminNotes, setAdminNotes] = useState('')

  const [foods, setFoods] = useState([{ name: '', price: '', include: false }])
  const [countries, setCountries] = useState([])
  const [cityList, setCityList] = useState([])
  const [fetchcategories, setFetchCategories] = useState([])

  const [errors, setErrors] = useState({}) // per-field error messages

  // availability
  const [days, setDays] = useState({
    sunday:    { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    monday:    { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    tuesday:   { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    wednesday: { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    thursday:  { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    friday:    { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
    saturday:  { times: [{ start: '', end: '', total: '', note: '' }], total: '', closed: false, note: '' },
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
  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback
  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])
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
    const lastEnd = existingTimes.length
      ? timeStringToMinutes(existingTimes[existingTimes.length - 1].end) ?? 480
      : 480 // 8:00
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

  const handleFileUpload = (setter) => async (e) => {
    const file = e.target.files[0]
    if (file) setter(file)
  }

  const handleCheckboxChange = (CategoryID) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(CategoryID)
        ? prevSelected.filter((id) => id !== CategoryID)
        : [...prevSelected, CategoryID],
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
            FoodPriceVatPercentage: vatPercentValue, // ✅ pass VAT percentage
            FoodPriceVatAmount: vatAmount,           // ✅ pass VAT amount for this food
            FoodNotes: item.notes || '',
            FoodImage: '',            // ← blank when hidden
            Include: item.include || false,
          }
        }
        // ELSE (if showing): upload if provided
        let uploadedImageKey = ''
        if (item.image instanceof File) uploadedImageKey = await uploadFoodImage(item.image)
        return {
          FoodName: item.name || '',
          FoodPrice: item.price || '',
          FoodPriceVatPercentage: vatPercentValue, // ✅ pass VAT percentage
          FoodPriceVatAmount: vatAmount,           // ✅ pass VAT amount
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

  // -------------------- SUMMARY VALUES --------------------
  const tripPriceBase = Number(priceRanges[0]?.price || 0)
  const tripVatAmount = tripPriceBase * vatRateValue   // ✅ use decimal rate

  const foodBaseAmount = foods.reduce(
    (sum, item) => sum + (item.include ? 0 : Number(item.price || 0)),
    0
  )
  const foodVatAmount = foodBaseAmount * vatRateValue  // ✅ use decimal rate

  const totalBaseAmount = tripPriceBase + foodBaseAmount        // Total Amount
  const totalVatAmount = tripVatAmount + foodVatAmount          // Total VAT Amount
  const totalWithVat = totalBaseAmount + totalVatAmount         // Total Amount + Total VAT Amount

  // values to send in payload for Activity-level price VAT
  const actPriceVatPercentageVal = vatPercentValue      // ✅ VAT %
  const actPriceVatAmountVal = tripVatAmount            // ✅ VAT amount on base activity price

  const vatPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid #cf2037',
    borderRadius: 999,
    padding: '3px 10px',
    backgroundColor: 'rgba(207, 32, 55, 0.15)',
    color: '#cf2037',
  }
  // -------------------------------------------------------

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

    const validation = validateActivityForm({
      txtactName,
      selectedType,            // fixed 'SCHOOL'
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
      const overlapMsg = tr(
        'timeOverlap',
        'Time range overlap on {day}: {s1}–{e1} overlaps with {s2}–{e2}'
      )
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
    let img1 = '', img2 = '', img3 = ''
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
    const actPriceDataVal = getPriceData();
    console.log("url")
    console.log(`${API_BASE_URL}/vendordata/activityinfo/activity/createActivity`);
    try {
      const response = await fetch(`${API_BASE_URL}/vendordata/activityinfo/activity/createActivity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          VendorID: getCurrentLoggedUserID(),
          actName: txtactName || '',
          actTypeID: selectedType,           // 'SCHOOL'
          actCategoryID: selectedCategories,
          actDesc: txtactDesc || '',

          actImageName1: img1,
          actImageName2: img2,
          actImageName3: img3,

          actYouTubeID1: txtactYouTubeID1,
          actYouTubeID2: txtactYouTubeID2,
          actYouTubeID3: txtactYouTube3,

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
          actPriceVatAmount: actPriceVatAmountVal,         // ✅ VAT amount on base price

          actAvailDaysHours: actavailDaysHoursVal,
          actFood: actfoodDataVal,        // 👈 FoodImage will be '' when hidden

          actAdminNotes: txtactAdminNotes || '',
          actRating: Number(actRating),   // visible + submitted
          actStatus: actStatusVal,
          IsDataStatus: 1,
          CreatedBy: getCurrentLoggedUserID(),
          ModifyBy: getCurrentLoggedUserID(),
        }),
      })
      console.log("console");
      console.log(response);
      alert(1);
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      await response.json()
      setToastMessage(tr('toastActivityAdded', 'Activity added successfully!'))
      setToastType('success')
      setTimeout(() => navigate('/vendordata/activityinfo/activity/list'), 2000)
    } catch {
      setToastMessage(tr('toastActivityAddFailed', 'Failed to add Activity.'))
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  // UI
  const dayLabel = (d) => tr(`day_${d}`, d)
  return (
    <div>
      <div className="divhbg">
        <div className="txtheadertitle">{tr('actAddTitle', 'Add New Activity')}</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={() => setShowModal(true)}>
            {tr('btnSendToAdmin', 'Send To Admin Approval')}
          </button>
          <button className="admin-buttonv1" onClick={(e) => handleSubmit('DRAFT', e)}>
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

      <div className="txtsubtitle">{tr('sectionActivityInfo', 'Activity Information')}</div>

      <div className="divbox">
        <div className="form-group">
          <label>
            {tr('labelActivityName', 'Activity Name')} <span style={{color:'red'}}>*</span>
          </label>
          <input name="txtactName" className="admin-txt-box" type="text" value={txtactName} onChange={(e) => setactName(e.target.value)} />
          <ErrorText msg={errors.txtactName} />
        </div>

        {/* 🔒 Activity Type fixed to School (only) */}
        <div className="form-group">
          <label style={{ marginBottom: 10, marginTop: 20 }}>
            {tr('labelActivityType', 'Activity Type')} <span style={{color:'red'}}>*</span>
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="pink-shadow4" style={{ fontWeight: 700, padding: '6px 12px', borderRadius: 8 }}>
              {tr('typeSchool', 'School')}
            </div>
            {/* keep a hidden input so validators / form refs see the value */}
            <input type="hidden" name="selectedType" value="SCHOOL" />
          </div>
          <ErrorText msg={errors.selectedType} />
        </div>

        {!HIDE_ACTIVITY_RATING_UI && (
          <div style={{ alignItems: 'center', gap: 8, marginTop: 10 }}>
            <label className="vendor-label" htmlFor="actRating" style={{ margin: 0 }}>
              {tr('labelActivityRating', 'Activity Rating')} <span style={{color:'red'}}>*</span>
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

        <div style={{ marginBottom: 10, marginTop: 20 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            {tr('labelCategories', 'Activity Categories')} <span style={{color:'red'}}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {fetchcategories.map((item, idx) => (
              <label
                key={`${item.CategoryID}-${idx}`}
                style={{ width: '33.33%', marginBottom: 10, marginTop: 20, display: 'flex', alignItems: 'center' }}
              >
                <div style={{ marginLeft: 8, marginRight: 8 }}>
                  <input
                    type="checkbox"
                    name="selectedCategories"
                    value={item.CategoryID}
                    checked={selectedCategories.includes(item.CategoryID)}
                    onChange={() => handleCheckboxChange(item.CategoryID)}
                    style={{ marginRight: 8, transform: 'scale(2.0)', cursor: 'pointer', accentColor: 'red' }}
                  />
                </div>
                <div className="pink-shadow4">
                  {lang === 'ar' ? item.ArCategoryName : item.EnCategoryName}
                </div>
              </label>
            ))}
          </div>
          <ErrorText msg={errors.selectedCategories} />
        </div>

        <div className="form-group">
          <label>
            {tr('labelActivityDesc', 'Activity Description')} <span style={{color:'red'}}>*</span>
          </label>
          <textarea name="txtactDesc" className="vendor-input" rows={4} value={txtactDesc} onChange={(e) => setactDesc(e.target.value)} />
          <ErrorText msg={errors.txtactDesc} />
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionActivityImages', 'Activity Images')} <span style={{color:'red'}}>*</span>
      </div>
      <div className="divbox">
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20, marginBottom: 8 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>{tr('labelImage1', 'Activity Image 1')}</label>
            <input name="txtactImageName1" className="admin-txt-box" type="file" onChange={handleFileUpload(setactImageName1)} style={{ height: 50, width: '100%' }} />
            <FilePreview file={txtactImageName1} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>{tr('labelImage2', 'Activity Image 2')}</label>
            <input name="txtactImageName2" className="admin-txt-box" type="file" onChange={handleFileUpload(setactImageName2)} style={{ height: 50, width: '100%' }} />
            <FilePreview file={txtactImageName2} />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>{tr('labelImage3', 'Activity Image 3')}</label>
            <input name="txtactImageName3" className="admin-txt-box" type="file" onChange={handleFileUpload(setactImageName3)} style={{ height: 50, width: '100%' }} />
            <FilePreview file={txtactImageName3} />
          </div>
        </div>
        <ErrorText msg={errors.images} />
      </div>

      <div className="txtsubtitle">
        {tr('sectionLocation', 'Activity Location')} <span style={{color:'red'}}>*</span>
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelGoogleMap', 'Google Map Location')} <span style={{color:'red'}}>*</span>
              </label>
              <input name="txtactGoogleMap" className="vendor-input" value={txtactGoogleMap} onChange={(e) => setactGoogleMap(e.target.value)} />
              <ErrorText msg={errors.txtactGoogleMap} />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLatitude', 'Google Latitude')} <span style={{color:'red'}}>*</span>
              </label>
              <input name="txtactGlat" className="vendor-input" value={txtactGlat} onChange={(e) => setGlat(e.target.value)} />
              <ErrorText msg={errors.txtactGlat} />
            </div>
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLongitude', 'Google Longitude')} <span style={{color:'red'}}>*</span>
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
                {tr('labelCountry', 'Country')} <span style={{color:'red'}}>*</span>
              </label>
              <select
                name="ddactCountryID"
                value={ddactCountryID}
                onChange={(e) => setCountryID(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">{tr('optSelectCountry', 'Select a country')}</option>
                {countries.map((country, idx) => (
                  <option
                    key={`${country.CountryID}-${idx}`}       
                    value={country.CountryID}
                  >
                    {country.EnCountryName}
                  </option>
                ))}
              </select>
              <ErrorText msg={errors.ddactCountryID} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelCity', 'City')} <span style={{color:'red'}}>*</span>
              </label>
              <select
                name="ddactCityID"
                className="admin-txt-box"
                value={ddactCityID}
                onChange={(e) => setSelectedCityID(e.target.value)}
              >
                <option value="">{tr('optSelectCity', 'Select City')}</option>
                {cityList.map((city, idx) => (
                  <option
                    key={`${city.CityID}-${idx}`}            
                    value={city.CityID}
                  >
                    {city.EnCityName}
                  </option>
                ))}
              </select>
              <ErrorText msg={errors.ddactCityID} />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLocation1', 'Location1')} <span style={{color:'red'}}>*</span>
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
        {tr('sectionAgeRange', 'Age Range')} <span style={{color:'red'}}>*</span>
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1 }}>
              <label className="vendor-label">
                {tr('labelMinAge', 'Minimum Age')} <span style={{color:'red'}}>*</span>
              </label>
              <input name="txtactMinAge" type="number" min="0" className="vendor-input" value={txtactMinAge} onChange={(e) => setMinAge(e.target.value)} />
              <ErrorText msg={errors.txtactMinAge} />
            </div>
            <div className="vendor-column" style={{ flex: 1 }}>
              <label className="vendor-label">
                {tr('labelMaxAge', 'Maximum Age')} <span style={{color:'red'}}>*</span>
              </label>
              <input name="txtactMaxAge" type="number" min="0" className="vendor-input" value={txtactMaxAge} onChange={(e) => setMaxAge(e.target.value)} />
              <ErrorText msg={errors.txtactMaxAge} />
            </div>
          </div>
        </div>

        <div className="vendor-container" style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label className="vendor-label">
              {tr('labelGender', 'Gender')} <span style={{color:'red'}}>*</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <input type="radio" name="rdoactGender" value="BOYS" checked={rdoactGender === 'BOYS'} onChange={(e) => setGenderService(e.target.value)} style={{ width: 24, height: 24 }} />
              <div className="pink-shadow4">{tr('genderBoys', 'Boys')}</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <input type="radio" name="rdoactGender" value="GIRLS" checked={rdoactGender === 'GIRLS'} onChange={(e) => setGenderService(e.target.value)} style={{ width: 24, height: 24 }} />
              <div className="pink-shadow4">{tr('genderGirls', 'Girls')}</div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <input type="radio" name="rdoactGender" value="BOTH" checked={rdoactGender === 'BOTH'} onChange={(e) => setGenderService(e.target.value)} style={{ width: 24, height: 24 }} />
              <div className="pink-shadow4">{tr('genderBoth', 'Both')}</div>
            </label>
          </div>
          <ErrorText msg={errors.rdoactGender} />
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionCapacity', 'Capacity Information')} <span style={{color:'red'}}>*</span>
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1 }}>
              <label className="vendor-label">
                {tr('labelMinStudents', 'Minimum Students')} <span style={{color:'red'}}>*</span>
              </label>
              <input name="txtactMinStudent" type="number" min="1" className="vendor-input" value={txtactMinStudent} onChange={(e) => setMinStudent(e.target.value)} />
              <ErrorText msg={errors.txtactMinStudent} />
            </div>
            <div className="vendor-column" style={{ flex: 1 }}>
              <label className="vendor-label">
                {tr('labelMaxStudents', 'Maximum Students')} <span style={{color:'red'}}>*</span>
              </label>
              <input name="txtactMaxStudent" type="number" min="1" className="vendor-input" value={txtactMaxStudent} onChange={(e) => setMaxStudent(e.target.value)} />
              <ErrorText msg={errors.txtactMaxStudent} />
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- VAT / PRICE SECTION -------------------- */}
      <div className="txtsubtitle">
        {tr('sectionPerStudent', 'Per Student (vendor Price)')}
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
            }}
          >
            {`+ VAT ${vatPercentValue.toFixed(2)}%`}
          </span>
        )}
        <span style={{color:'red'}}>*</span>
      </div>

      <div className="divbox">
        <CRow className="fw-bold mb-2">
          <CCol sm={3}>
            {tr('labelPrice', 'Price')} <span style={{color:'red'}}>*</span>
          </CCol>
          <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
            {tr('labelStudentRangeFrom', 'Student Range From')}
          </CCol>
          <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
            {tr('labelStudentRangeTo', 'Student Range To')}
          </CCol>
          <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}></CCol>
        </CRow>

        {priceRanges.map((item, index) => {
          const priceNum = Number(item.price || 0)
          // ✅ VAT amount = price * vatRateValue (decimal)
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

                {/* ✅ VAT Amount pill */}
                {priceNum > 0 && vatPercentValue > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid #cf2037',
                        borderRadius: 999,
                        padding: '3px 10px',
                        backgroundColor: 'rgba(207, 32, 55, 0.15)',
                        color: '#cf2037',
                      }}
                    >
                      {tr('labelVatAmount', 'VAT Amount')}{' '}
                      ({vatPercentValue.toFixed(2)}%):{' '}
                      <strong style={{ marginInlineStart: 4 }}>{vatAmount.toFixed(2)}</strong>
                    </span>
                  </div>
                )}
              </CCol>
              <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
                <input
                  name={`rangeFrom_${index}`}
                  type="text"
                  className="vendor-input w-100 text-center"
                  value={item.rangeFrom}
                  onChange={(e) => handlePriceChange(index, 'rangeFrom', e.target.value)}
                />
              </CCol>
              <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
                <input
                  name={`rangeTo_${index}`}
                  type="text"
                  className="vendor-input w-100 text-center"
                  value={item.rangeTo}
                  onChange={(e) => handlePriceChange(index, 'rangeTo', e.target.value)}
                />
              </CCol>
              <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
                {priceRanges.length > 1 && (
                  <button type="button" className="btn btn-danger" onClick={() => handleRemoveRange(index)}>
                    {tr('btnRemove', 'Remove')}
                  </button>
                )}
              </CCol>
            </CRow>
          )
        })}

        <CRow className="mt-3" style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
          <CCol>
            <button type="button" className="admin-buttonv1" onClick={handleAddRange}>
              {tr('btnAddMore', 'Add More')}
            </button>
          </CCol>
        </CRow>
      </div>

      <div className="txtsubtitle">
        {tr('sectionSetAvailability', 'Set Availability')} <span style={{color:'red'}}>*</span>
      </div>
      <div className="divbox">
        <ErrorText msg={errors.availability} />
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          {['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map((day) => (
            <div key={day} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #ccc' }}>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 8 }}>
                  <label>
                    {dayLabel(day)}{' '}
                    <input
                      type="checkbox"
                      checked={!days[day].closed}
                      onChange={(e) => handleClosedChange(day, !e.target.checked)}
                    /> {tr('labelAvailable', 'Available')}
                  </label>
                </div>

                {!days[day].closed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {days[day].times.map((range, index) => (
                      <div key={index} style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                        <label>
                          {tr('labelStartTime', 'Start Time')} <span style={{color:'red'}}>*</span>{' '}
                          <input className="admin-txt-box" type="time" name={`start_${day}_${index}`} value={range.start} onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)} />
                        </label>

                        <label>
                          {tr('labelEndTime', 'End Time')} <span style={{color:'red'}}>*</span>{' '}
                          <input className="admin-txt-box" type="time" name={`end_${day}_${index}`} value={range.end} onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)} />
                        </label>

                        <label>
                          {tr('labelNotes', 'Notes')}: {' '}
                          <input
                            type="text"
                            className="admin-txt-box"
                            value={range.note || ''}
                            placeholder={tr('phOptionalNotes', 'Optional notes')}
                            onChange={(e) => handleRangeNoteChange(day, index, e.target.value)}
                          />
                        </label>

                        <div>
                          {tr('labelRangeHours', 'Range Hours')}: <strong>{range.total || '0.00'}</strong>
                        </div>

                        {days[day].times.length > 1 && (
                          <button
                            type="button"
                            style={{ background: 'tomato', color: 'white', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                            onClick={() => handleRemoveTimeRange(day, index)}
                          >
                            {tr('btnRemove', 'Remove')}
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{ marginTop: 10 }}>
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

      <div className="txtsubtitle">{tr('sectionFoodInfo', 'Food Information')}</div>
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          <CRow className="mb-2 fw-bold hbg">
            <CCol sm={3}>{tr('colFoodName', 'Food Name')}</CCol>
            <CCol sm={2}>{tr('colPrice', 'Price')}</CCol>
            {/* NEW: Food VAT header */}
            <CCol sm={2}>{tr('colFoodVatAmount', 'VAT Amount')}</CCol>
            <CCol sm={3}>{tr('colNotes', 'Notes')}</CCol>
            {!HIDE_FOOD_IMAGE && <CCol sm={1}>{tr('colFoodImage', 'Food Image')}</CCol>}
            <CCol sm={1}>{tr('colInclude', 'Include')}</CCol>
            <CCol sm={1}></CCol>
          </CRow>

          {foods.map((item, index) => {
            const baseFoodPrice = item.include ? 0 : Number(item.price || 0)
            const foodVat = baseFoodPrice * vatRateValue   // ✅ decimal rate

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
                    value={item.include ? 0 : (item.price ?? '')}
                    onChange={(e) => handleFoodChange(index, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={item.include}
                  />
                </CCol>

                {/* NEW: Food VAT Amount pill */}
                <CCol sm={2}>
                  {baseFoodPrice > 0 && vatPercentValue > 0 && (
                    <span style={vatPillStyle}>
                      {foodVat.toFixed(2)}
                    </span>
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

                {/* Food Image column (hidden when HIDE_FOOD_IMAGE) */}
                {!HIDE_FOOD_IMAGE && (
                  <CCol sm={1}>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-100"
                      onChange={(e) => handleFoodChange(index, 'image', e.target.files[0])}
                    />
                  </CCol>
                )}

                <CCol sm={1} className="text-center">
                  <input
                    type="checkbox"
                    checked={item.include}
                    onChange={(e) => handleFoodChange(index, 'include', e.target.checked)}
                    style={{ transform: 'scale(1.5)', accentColor: 'red', cursor: 'pointer' }}
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

      <div className="txtsubtitle">
        {tr('sectionTerms', 'Terms And Conditions')} <span style={{color:'red'}}>*</span>
      </div>
      <div className="divbox">
        <div className="vendor-container">
          <textarea
            name="txtactAdminNotes"
            className="vendor-input"
            rows={5}
            value={txtactAdminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          <ErrorText msg={errors.txtactAdminNotes} />
        </div>
      </div>

      {/* -------------------- SUMMARY (BOTTOM) -------------------- */}
      <div className="txtsubtitle">
        {tr('sectionSummary', 'Summary')}
      </div>
      <div className="divbox">
        {/* Main summary card: 1. Description / Amount / VAT */}
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
            <div style={{ flex: 1, textAlign: 'right' }}>
              {tr('summaryVat', 'VAT')}
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
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                {tripVatAmount.toFixed(2)}
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
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                {foodVatAmount.toFixed(2)}
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
              <div style={{ flex: 1, textAlign: 'right' }}>
                {totalVatAmount.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 🔶 Final big Total Cost box */}
        <div
          style={{
            maxWidth: 650,
            margin: '16px auto 0',
            border: '3px solid #2e7d32',                // big green border
            borderRadius: 16,
            padding: '12px 16px',
            backgroundColor: 'rgba(46, 125, 50, 0.15)', // rgba green with ~0.5 feel
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
        <button className="admin-buttonv1" onClick={() => setShowModal(true)}>
          {tr('btnSendToAdmin', 'Send To Admin Approval')}
        </button>
        <button className="admin-buttonv1" onClick={(e) => handleSubmit('DRAFT', e)}>
          {tr('btnSave', 'Save')}
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/vendordata/activityinfo/activity/list')}
        >
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
