import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import {
  DspToastMessage,
  dspstatusv1,
  getAuthHeaders,
  IsVendorLoginIsValid,
  getVatAmount,
} from '../../../utils/operation'
import FilePreview from '../../widgets/FilePreview'
import {
  getFileNameFromUrl,
  getCurrentLoggedUserID,
  YouTubeEmbed,
  GoogleMapEmbed,
} from '../../../utils/operation'
import { CRow, CCol } from '@coreui/react'
import moneyv1 from '../../../assets/images/moneyv1.png'
import ReactPlayer from 'react-player'

// 🔤 i18n packs (keeps English as fallback for any missing keys)
import enPack from '../../../i18n/enloc100.json'
import arPack from '../../../i18n/arloc100.json'

const Vendor = () => {
  // ✅ Toggle to hide "Student Range From" and "Student Range To"
  const HIDE_PRICE_RANGE_UI = true

  // ✅ Vendor login guard: runs once when this page mounts
  useEffect(() => {
    IsVendorLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

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
  const dayLabel = (d) => tr(`day_${d}`, d)
  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])
  // ----------------------------------------

  const [error, setError] = useState('')
  const [txtactImageName1, setactImageName1] = useState(null)
  const [txtactImageName2, setactImageName2] = useState(null)
  const [txtactImageName3, setactImageName3] = useState(null)
  const [ActivityData, setActivity] = useState(null)

  const navigate = useNavigate()
  const [fetchedCategories, setFetchedCategories] = useState([])

  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  // -------------------- VAT VALUES + SUMMARY (READ-ONLY) --------------------
  // Use same VAT setup as Add Activity screen
  const vatPercentValue = Number(getVatAmount() || 0) // e.g. 15
  const vatRateValue = vatPercentValue / 100 // e.g. 0.15

  const priceList = ActivityData?.priceList || []
  const foodList = ActivityData?.foodList || []

  // Base trip price: first price row
  const tripPriceBase = priceList.length > 0 ? Number(priceList[0].Price || 0) : 0
  const tripVatAmount = tripPriceBase * vatRateValue

  // Food base: sum of non-included food prices
  const foodBaseAmount = foodList.reduce(
    (sum, item) => sum + (item.Include ? 0 : Number(item.FoodPrice || 0)),
    0,
  )
  const foodVatAmount = foodBaseAmount * vatRateValue

  const totalBaseAmount = tripPriceBase + foodBaseAmount
  const totalVatAmount = tripVatAmount + foodVatAmount
  const totalWithVat = totalBaseAmount + totalVatAmount

  // Per-row totals (Trip + Food)
  const tripTotalWithVat = tripPriceBase + tripVatAmount
  const foodTotalWithVat = foodBaseAmount + foodVatAmount

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
  }
  // -------------------------------------------------------------------------

  const fetchActivity = async (ActivityIDVal) => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ActivityID: ActivityIDVal,
            VendorID: getCurrentLoggedUserID(),
          }),
        },
      )

      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      setActivity(data.data || [])
      setTotalPages(Math.ceil(data.totalCount / ActivityPerPage))
    } catch (error) {
      setError(tr('errFetchActivities', 'Error fetching activities'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ActivityData) return

    // Basic info
    setactImageName1(ActivityData.actImageName1Url || '')
    setactImageName2(ActivityData.actImageName2Url || '')
    setactImageName3(ActivityData.actImageName3Url || '')
  }, [ActivityData])

  useEffect(() => {
    // 👇 Extract ActivityID from the URL
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
      setError(tr('errActivityIdMissing', 'ActivityID is missing in URL'))
    }
  }, [])

  return (
    <div>
      <div className="msgbox" style={{ marginBottom: '20px', marginTop: '20px' }}>
        <div className="form-group text-center">
          <div style={{ padding: '20px' }}>
            <b>{tr('labelActivityStatus', 'ACTIVITY STATUS :')}</b>{' '}
            {dspstatusv1(ActivityData?.actStatus)}
          </div>
        </div>
      </div>
      <div className="divhbg">
        {/* Left side: Title */}
        <div className="txtheadertitle">{tr('viewActivityTitle', 'View Activity')}</div>

        {/* Right side: Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/vendordata/activityinfo/activity/list?')}
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
          <label style={{ marginBottom: '10px', marginTop: '20px' }}>
            {tr('labelActivityName', 'Activity Name')}
          </label>
          <div className="admin-lbl-box"> {ActivityData?.actName} </div>
        </div>

        <div className="form-group">
          <label style={{ marginBottom: '10px', marginTop: '20px' }}>
            {tr('labelActivityType', 'Activity Type')}
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="admin-lbl-box"> {ActivityData?.actTypeID} </div>
          </div>
        </div>

        <div style={{ marginBottom: '10px', marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            {tr('labelCategories', 'Activity Categories')}
          </label>

          <div>
            {ActivityData?.categoryInfo?.map((cat, index) => (
              <span key={index} className="admin-lbl-box pink-badge">
                {cat.EnCategoryName}
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>{tr('labelActivityDesc', 'Activity Description')}</label>
          <div className="admin-lbl-boxv1"> {ActivityData?.actDesc} </div>
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionActivityImages', 'Activity Images')}{' '}
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
            <FilePreview file={txtactImageName1} />
          </div>

          {/* Image 2 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelImage2', 'Activity Image 2')}</label>
            <FilePreview file={txtactImageName2} />
          </div>

          {/* Image 3 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelImage3', 'Activity Image 3')}</label>
            <FilePreview file={txtactImageName3} />
          </div>
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionYouTube', 'Activity Youtube Videos')}{' '}
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
          {/* Video 1 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelYouTube1', 'Youtube Video Link 1')}</label>
            <YouTubeEmbed videoId={ActivityData?.actYouTubeID1} />
          </div>

          {/* Video 2 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelYouTube2', 'Youtube Video Link 2')}</label>
            <div>
              <YouTubeEmbed videoId={ActivityData?.actYouTubeID2} />
            </div>
          </div>

          {/* Video 3 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>{tr('labelYouTube3', 'Youtube Video Link 3')}</label>
            <div>
              <YouTubeEmbed videoId={ActivityData?.actYouTubeID3} />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionLocation', 'Activity Location')}{' '}
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelGoogleMap', 'Google Map Location')}
              </label>

              <iframe
                width="100%"
                height="300"
                frameBorder="0"
                style={{ border: 0 }}
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyC59f-F3JungvspyPlTLlQa90DQ2aQAhRo&center=${
                  ActivityData?.actGlat || 39.2111492
                },${ActivityData?.actGlan || 21.4552355}&zoom=15`}
                allowFullScreen
                title="Google Map"
              />
            </div>
          </div>

          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLatitude', 'Google Latitude')}
              </label>
              <div className="admin-lbl-box"> {ActivityData?.actGlat} </div>
            </div>
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLongitude', 'Google Longitude')}
              </label>
              <div className="admin-lbl-box"> {ActivityData?.actGlan} </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">{tr('labelCountry', 'Country')}</label>
              <div className="admin-lbl-box"> {ActivityData?.EnCountryName} </div>
            </div>

            <div className="vendor-column">
              <label className="vendor-label">{tr('labelCity', 'City')}</label>
              <div className="admin-lbl-box"> {ActivityData?.EnCityName} </div>
            </div>
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelLocation1', 'Address1')}
              </label>
              <div className="admin-lbl-box"> {ActivityData?.actAddress1} </div>
            </div>
            <div className="vendor-column">
              <label className="vendor-label">
                {tr('labelAddress2', 'Address2')}
              </label>
              <div className="admin-lbl-box"> {ActivityData?.actAddress2} </div>
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionAgeRange', ' Age Range ')}
      </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">
                {tr('labelMinAge', 'Minimum Age')}
              </label>

              <div className="admin-lbl-box"> {ActivityData?.actMinAge} </div>
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">
                {tr('labelMaxAge', 'Maximum Age')}
              </label>
              <div className="admin-lbl-box"> {ActivityData?.actMaxAge} </div>
            </div>
          </div>
        </div>
        {/* // row end */}

        {/* // row start */}
        <div className="vendor-container">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="vendor-label">{tr('labelGender', 'Gender')}</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div className="admin-lbl-box pink-badge"> {ActivityData?.actGender} </div>
            </label>
          </div>
        </div>
        {/* // row end */}
      </div>
      {/* // row end */}

      <div className="txtsubtitle">
        {tr('sectionCapacityInfo', 'Capacity Information ')}{' '}
      </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">
                {tr('labelMinStudents', 'Minimum Students')}
              </label>
              <div className="admin-lbl-box"> {ActivityData?.actMinStudent} </div>
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">
                {tr('labelMaxStudents', 'Maximum Students')}
              </label>
              <div className="admin-lbl-box"> {ActivityData?.actMaxStudent} </div>
            </div>
          </div>
        </div>
        {/* // row end */}
      </div>

      <div className="txtsubtitle">
        {tr('sectionPricePerStudent', 'Price Per Student')}
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
      </div>

      <div className="divbox">
        {/* Table Header */}
        <CRow className="fw-bold  mb-2">
          <CCol sm={3}>{tr('colBasePricePerStudent', 'Price')}</CCol>
          <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
            {tr('labelStudentRangeFrom', 'Student Range From')}
          </CCol>
          <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
            {tr('labelStudentRangeTo', 'Student Range To')}
          </CCol>
          <CCol sm={3}></CCol> {/* Remove column */}
        </CRow>

        {/* Dynamic Form Rows */}
        {ActivityData?.priceList?.map((priceItem, index) => {
          const basePrice = Number(priceItem.Price || 0)
          const vatAmount = basePrice * vatRateValue
          const totalWithVatRow = basePrice + vatAmount

          return (
            <CRow className="align-items-center mb-2" key={index}>
              <CCol sm={12}>
                <div className="admin-lbl-box pink-shadow1 ">
                  <img
                    src={moneyv1}
                    alt="logo"
                    style={{ width: '14px', marginRight: '6px', verticalAlign: 'middle' }}
                  />
                  {priceItem.Price}
                </div>

                {/* VAT pill + Total incl. VAT under price (read-only) */}
                {basePrice > 0 && vatPercentValue > 0 && (
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
                    <span style={vatPillStyle}>
                      {tr('labelVatAmount', 'VAT Amount')}{' '}
                      ({vatPercentValue.toFixed(2)}%):{' '}
                      <strong style={{ marginInlineStart: 4 }}>
                        {vatAmount.toFixed(2)}
                      </strong>
                    </span>
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
              <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
                <div className="admin-lbl-box text-center pink-shadow2">
                  {priceItem.StudentRangeFrom}
                </div>
              </CCol>
              <CCol sm={3} style={{ display: HIDE_PRICE_RANGE_UI ? 'none' : undefined }}>
                <div className="admin-lbl-box text-center pink-shadow3">
                  {priceItem.StudentRangeTo}
                </div>
              </CCol>
            </CRow>
          )
        })}
      </div>

      <div className="txtsubtitle">
        {tr('sectionSetAvailability', 'Set Availability')}
      </div>
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            .filter((day) => ActivityData?.availList?.some((item) => item.DayName === day))
            .map((day) => {
              const matchedEntries = ActivityData.availList.filter(
                (item) => item.DayName === day,
              )

              return (
                <div
                  key={day}
                  style={{
                    marginBottom: '30px',
                    padding: '20px',
                    borderBottom: '1px solid #ccc',
                    borderRadius: '10px',
                    backgroundColor: '#f9f9f9',
                  }}
                >
                  <label>
                    <div
                      className="admin-lbl-box pink-shadow1"
                      style={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                    >
                      {dayLabel(day)} <input type="checkbox" checked readOnly />{' '}
                      {tr('labelAvailable', 'Available')}
                    </div>
                  </label>

                  <div style={{ marginTop: '10px' }}>
                    {/* Header row */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 20,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        fontWeight: 'bold',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ width: '200px', textAlign: 'center' }}>
                        {tr('labelStartTime', 'Start Time')}
                      </div>
                      <div style={{ width: '200px', textAlign: 'center' }}>
                        {tr('labelEndTime', 'End Time')}
                      </div>
                      <div style={{ width: '200px', textAlign: 'center' }}>
                        {tr('labelNotes', 'Note')}
                      </div>
                    </div>

                    {/* Data rows */}
                    {matchedEntries.map((slot, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          gap: 20,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          marginBottom: '6px',
                        }}
                      >
                        <div
                          className="admin-lbl-boxv1"
                          style={{ width: '200px', textAlign: 'center' }}
                        >
                          {slot.StartTime || '--'}
                        </div>
                        <div
                          className="admin-lbl-boxv1"
                          style={{ width: '200px', textAlign: 'center' }}
                        >
                          {slot.EndTime || '--'}
                        </div>
                        <div
                          className="admin-lbl-boxv1"
                          style={{ width: '200px', textAlign: 'center' }}
                        >
                          {slot.Note || '--'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      <div className="txtsubtitle">
        {tr('sectionFoodInfo', 'Food Information')}
      </div>
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          {/* Header Row */}
          <CRow className="mb-2 fw-bold hbg">
            <CCol sm={3}>{tr('colFoodName', 'Food Name')}</CCol>
            <CCol sm={2}>
              {tr('colBaseFoodPrice', 'Food Price (Excl. VAT)')}
            </CCol>
            <CCol sm={3}>{tr('colNotes', 'Notes')}</CCol>
            <CCol sm={2}>{tr('colFoodImage', 'Food Image')}</CCol>
            <CCol sm={1}>{tr('colInclude', 'Include')}</CCol>
            <CCol sm={1}></CCol> {/* For remove button */}
          </CRow>

          {ActivityData?.foodList?.map((foodItem, index) => {
            const baseFoodPrice = foodItem.Include ? 0 : Number(foodItem.FoodPrice || 0)
            const foodVat = baseFoodPrice * vatRateValue
            const foodTotalWithVatRow = baseFoodPrice + foodVat

            return (
              <CRow key={index} className="mb-3 align-items-center">
                {/* Food Name */}
                <CCol sm={3}>
                  <div className="admin-lbl-box  ">{foodItem.FoodName}</div>
                </CCol>

                {/* Price + VAT pill + Total incl. VAT */}
                <CCol sm={2}>
                  <div className="admin-lbl-box text-center">
                    {foodItem.FoodPrice}
                  </div>
                  {baseFoodPrice > 0 && vatPercentValue > 0 && (
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
                      <span style={vatPillStyle}>
                        {tr('labelVatAmount', 'VAT Amount')}{' '}
                        ({vatPercentValue.toFixed(2)}%):{' '}
                        <strong style={{ marginInlineStart: 4 }}>
                          {foodVat.toFixed(2)}
                        </strong>
                      </span>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#333',
                        }}
                      >
                        {tr('labelPriceWithVatShort', 'Total incl. VAT')}:{' '}
                        <span>{foodTotalWithVatRow.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </CCol>

                {/* Notes */}
                <CCol sm={3}>
                  <div className="admin-lbl-box text-center">
                    {foodItem.FoodNotes}
                  </div>
                </CCol>

                {/* Image Preview (optional handling for blank image) */}
                <CCol sm={2}>
                  {foodItem.FoodImage ? (
                    <FilePreview file={foodItem.FoodImage} />
                  ) : (
                    <div className="admin-lbl-box text-center">
                      {tr('noImage', 'No Image')}
                    </div>
                  )}
                </CCol>

                {/* Include (displayed as Yes/No or Boolean) */}
                <CCol sm={1} className="text-center">
                  <div className="admin-lbl-box text-center">
                    {foodItem.Include ? tr('yes', 'Yes') : tr('no', 'No')}
                  </div>
                </CCol>
              </CRow>
            )
          })}
        </div>
      </div>

      {/* -------------------- SUMMARY (BOTTOM, READ-ONLY) -------------------- */}
      <div className="txtsubtitle">
        {tr('sectionSummary', 'Summary')}
      </div>
      <div className="divbox">
        {/* Main summary card: Trip / Food / Total */}
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
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
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
              <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
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
              <div style={{ flex: 1, textAlign: 'right' }}>
                {totalVatAmount.toFixed(2)}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                {totalWithVat.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Final big Total Cost box */}
        <div
          style={{
            maxWidth: 650,
            margin: '16px auto 0',
            border: '3px solid #2e7d32',
            borderRadius: 16,
            padding: '12px 16px',
            backgroundColor: 'rgba(46, 125, 50, 0.15)',
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
                'Total Amount + Total VAT Amount',
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
      {/* ----------------------------------------------------------- */}

      <div className="txtsubtitle">
        {tr('sectionTerms', 'Terms And Conditions')}
      </div>
      <div className="divbox">
        {/* // row start */}
        <div className="vendor-container">
          <div className="admin-lbl-boxv1">{ActivityData?.actAdminNotes}</div>
        </div>
        {/* // row end */}
      </div>
      <div className="button-container">
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/vendordata/activityinfo/activity/list')}
        >
          {tr('btnReturn', 'Return')}
        </button>
      </div>
      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}
export default Vendor
