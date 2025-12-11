import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import {
  DspToastMessage,
  dspstatusv1,
  getAuthHeaders,
  IsAdminLoginIsValid,
  getVatAmount, // ✅ VAT helper
} from '../../../utils/operation'
import FilePreview from '../../../views/widgets/FilePreview'
import {
  getFileNameFromUrl,
  getCurrentLoggedUserID,
  YouTubeEmbed,
  GoogleMapEmbed,
} from '../../../utils/operation'
import { CRow, CCol } from '@coreui/react'
import moneyv1 from '../../../assets/images/moneyv1.png'
import ReactPlayer from 'react-player'

const Vendor = () => {
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

  // ================= VAT (same logic as Vendor Add form) =================
  // Assume getVatAmount() returns PERCENT (e.g. 15 for 15%)
  const vatPercentValue = Number(getVatAmount() || 0) // e.g. 15
  const vatRateValue = vatPercentValue / 100 // e.g. 0.15

  const vatPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid #cf2037',
    borderRadius: 999,
    padding: '3px 10px',
    backgroundColor: 'rgba(207, 32, 55, 0.15)',
    color: '#cf2037',
    whiteSpace: 'nowrap',
  }

  // ⭐ FIXED FINANCIAL ROUNDING (2.447 → 2.45, etc.)
  const to2 = (v) => {
    const n = Number(v || 0)
    if (!Number.isFinite(n)) return '0.00'
    return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2)
  }

  // ---------------- SUMMARY values (Trip + Food) for Vendor/School ---------------
  const firstPriceRowBase =
    ActivityData?.priceList && ActivityData.priceList.length > 0
      ? Number(ActivityData.priceList[0].Price || 0)
      : 0

  const foodBaseAmountComputed =
    ActivityData?.foodList?.reduce((sum, item) => {
      const base = item.Include ? 0 : Number(item.FoodPrice || 0)
      return sum + base
    }, 0) || 0

  const tripVatAmountComputed = firstPriceRowBase * vatRateValue
  const foodVatAmountComputed = foodBaseAmountComputed * vatRateValue

  const totalBaseAmountComputed = firstPriceRowBase + foodBaseAmountComputed
  const totalVatAmountComputed = tripVatAmountComputed + foodVatAmountComputed
  const totalWithVatComputed = totalBaseAmountComputed + totalVatAmountComputed

  const totalBaseAmount =
    ActivityData?.actTotalBaseAmount != null
      ? Number(ActivityData.actTotalBaseAmount)
      : totalBaseAmountComputed

  const totalVatAmount =
    ActivityData?.actTotalVatAmount != null
      ? Number(ActivityData.actTotalVatAmount)
      : totalVatAmountComputed

  const totalWithVat =
    ActivityData?.actTotalAmountWithVat != null
      ? Number(ActivityData.actTotalAmountWithVat)
      : totalWithVatComputed

  // ---------------- SUMMARY values for HEROZ -------------------------------------
  const firstHerozPriceRowBase =
    ActivityData?.priceList && ActivityData.priceList.length > 0
      ? Number(ActivityData.priceList[0].HerozStudentPrice || 0)
      : 0

  const foodHerozBaseAmountComputed =
    ActivityData?.foodList?.reduce((sum, item) => {
      const base = item.Include ? 0 : Number(item.FoodHerozPrice || 0)
      return sum + base
    }, 0) || 0

  const tripHerozVatAmountComputed = firstHerozPriceRowBase * vatRateValue
  const foodHerozVatAmountComputed = foodHerozBaseAmountComputed * vatRateValue

  const totalHerozBaseAmountComputed =
    firstHerozPriceRowBase + foodHerozBaseAmountComputed
  const totalHerozVatAmountComputed =
    tripHerozVatAmountComputed + foodHerozVatAmountComputed
  const totalHerozWithVatComputed =
    totalHerozBaseAmountComputed + totalHerozVatAmountComputed

  // ✅ FINAL TOTALS (Vendor + Heroz ALL, including food) – used in summary cards
  const overallVendorWithFood = totalWithVat
  const overallHerozWithFood = totalHerozWithVatComputed

  // ✅ TRIP-ONLY TOTALS (exclude food) for School Price box
  const tripTotalVendorOnly = firstPriceRowBase + tripHerozVatAmountComputed / vatRateValue * vatRateValue // (keep as derived from base+VAT)
  // Actually, simpler: vendor-only: base + its VAT:
  // but we already have:
  // const tripVatAmountComputed = firstPriceRowBase * vatRateValue
  // So:
  // const tripTotalVendorOnly = firstPriceRowBase + tripVatAmountComputed
  // I'll use that directly:
  const _tripTotalVendorOnly = firstPriceRowBase + tripVatAmountComputed

  const tripTotalHerozOnly =
    firstHerozPriceRowBase + tripHerozVatAmountComputed
  const schoolPriceTripOnly = _tripTotalVendorOnly + tripTotalHerozOnly

  // ✅ FOOD-ONLY TOTALS (exclude trip) for School Price box
  const foodTotalVendorOnly = foodBaseAmountComputed + foodVatAmountComputed
  const foodTotalHerozOnly =
    foodHerozBaseAmountComputed + foodHerozVatAmountComputed
  const schoolFoodOnly = foodTotalVendorOnly + foodTotalHerozOnly

  // ✅ FINAL TOTAL FOR SCHOOL (Trip + Food)
  const schoolPriceWithFood = schoolPriceTripOnly + schoolFoodOnly

  const getSearchParams = () => {
    const search =
      window.location.search ||
      (window.location.hash && window.location.hash.includes('?')
        ? `?${window.location.hash.split('?')[1]}`
        : '')
    return new URLSearchParams(search)
  }

  // ✅ NEW: ADMIN LOGIN VALIDATION
  useEffect(() => {
    IsAdminLoginIsValid()
  }, [])

  const fetchActivity = async (ActivityIDVal, VendorIDVal) => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ ActivityID: ActivityIDVal, VendorID: VendorIDVal }),
        },
      )

      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      setActivity(data.data || [])

      // setTotalPages(Math.ceil(data.totalCount / ActivityPerPage)) // original, not used
    } catch (error) {
      setError('Error fetching activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ActivityData) return

    setactImageName1(ActivityData.actImageName1Url || '')
    setactImageName2(ActivityData.actImageName2Url || '')
    setactImageName3(ActivityData.actImageName3Url || '')
  }, [ActivityData])

  useEffect(() => {
    const urlParams = getSearchParams()
    const ActivityIDVal = urlParams.get('ActivityID')
    const VendorIDVal = urlParams.get('VendorID')
    if (ActivityIDVal) {
      fetchActivity(ActivityIDVal, VendorIDVal)
    } else {
      setError('ActivityID is missing in URL')
    }
  }, [])

  return (
    <div>
      <div className="msgbox" style={{ marginBottom: '20px', marginTop: '20px' }}>
        <div className="form-group text-center">
          <div style={{ padding: '20px' }}>
            {' '}
            <b>ACTIVITY STATUS : </b> {dspstatusv1(ActivityData?.actStatus)}{' '}
          </div>
        </div>
      </div>
      <div className="divhbg">
        <div className="txtheadertitle">View Activity</div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/activityinfo/activity/list?')}
          >
            Return
          </button>
        </div>
      </div>

      <div className="txtsubtitle">Activity Information</div>

      <div className="divbox">
        <div className="form-group">
          <label style={{ marginBottom: '10px', marginTop: '20px' }}>Activity Name</label>
          <div className="admin-lbl-box"> {ActivityData?.actName} </div>
        </div>

        <div className="form-group">
          <label style={{ marginBottom: '10px', marginTop: '20px' }}>Activity Type</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="admin-lbl-box"> {ActivityData?.actTypeID} </div>
          </div>
        </div>

        <div style={{ marginBottom: '10px', marginTop: '20px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Activity Categories
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
          <label>Activity Description</label>
          <div className="admin-lbl-boxv1"> {ActivityData?.actDesc} </div>
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
          <div className="form-group" style={{ flex: '1' }}>
            <label>Activity Image 1</label>
            <FilePreview file={txtactImageName1} />
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>Activity Image 2</label>
            <FilePreview file={txtactImageName2} />
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>Activity Image 3</label>
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
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 1</label>
            <YouTubeEmbed videoId={ActivityData?.actYouTubeID1} />
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 2</label>
            <YouTubeEmbed videoId={ActivityData?.actYouTubeID2} />
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 3</label>
            <YouTubeEmbed videoId={ActivityData?.actYouTubeID3} />
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Activity Location </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Google Map Location</label>

              <iframe
                src={ActivityData?.actGoogleMap}
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Map"
              ></iframe>
            </div>
          </div>

          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Google Latitude</label>
              <div className="admin-lbl-box"> {ActivityData?.actGLat} </div>
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Google Longitude</label>
              <div className="admin-lbl-box"> {ActivityData?.actGLan} </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Country</label>
              <div className="admin-lbl-box"> {ActivityData?.EnCountryName} </div>
            </div>

            <div className="vendor-column">
              <label className="vendor-label">City</label>
              <div className="admin-lbl-box"> {ActivityData?.EnCityName} </div>
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Address1</label>
              <div className="admin-lbl-box"> {ActivityData?.actAddress1} </div>
            </div>
            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <div className="admin-lbl-box"> {ActivityData?.actAddress2} </div>
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle"> Age Range </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Minimum Age</label>

              <div className="admin-lbl-box"> {ActivityData?.actMinAge} </div>
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Maximum Age</label>
              <div className="admin-lbl-box"> {ActivityData?.actMaxAge} </div>
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="vendor-label">Gender</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div className="admin-lbl-box pink-badge"> {ActivityData?.actGender} </div>
            </label>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Capacity Information </div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Minimum Students</label>
              <div className="admin-lbl-box"> {ActivityData?.actMinStudent} </div>
            </div>

            <div
              className="vendor-column"
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <label className="vendor-label">Maximum Students</label>
              <div className="admin-lbl-box"> {ActivityData?.actMaxStudent} </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================== PRICE PER STUDENT (now same style as Extra Information) ================== */}
      <div className="txtsubtitle">
        Price Per Student
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

      <div className="divbox">
        {/* Header: only Vendor Base, Heroz Profit, Total Price */}
        <CRow className="fw-bold text-center mb-2">
          <CCol sm={2}></CCol>
          <CCol sm={3}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <img
                src={moneyv1}
                alt="logo"
                style={{ width: '14px', verticalAlign: 'middle' }}
              />
              <span>Vendor Base Price</span>
            </div>
          </CCol>

          <CCol sm={3}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <img
                src={moneyv1}
                alt="logo"
                style={{ width: '14px', verticalAlign: 'middle' }}
              />
              <span>Heroz Profit</span>
            </div>
          </CCol>

          <CCol sm={3}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
            >
              <img
                src={moneyv1}
                alt="logo"
                style={{ width: '14px', verticalAlign: 'middle' }}
              />
              <span>Total Price</span>
            </div>
          </CCol>
        </CRow>

        {ActivityData?.priceList?.map((priceItem, index) => {
          const vendorBase = Number(priceItem.Price || 0)
          const herozBase = Number(priceItem.HerozStudentPrice || 0)
          const schoolBase = Number(priceItem.SchoolPrice || 0)
          const totalBase = vendorBase + herozBase + schoolBase

          const vendorVat = vendorBase * vatRateValue
          const herozVat = herozBase * vatRateValue
          const totalVat = totalBase * vatRateValue

          const TotalPricePerStudent =
            (parseFloat(priceItem.HerozStudentPrice) || 0) +
            (parseFloat(priceItem.Price) || 0) +
            (parseFloat(priceItem.SchoolPrice) || 0)

          return (
            <CRow className="align-items-center mb-2" key={index}>
              {/* Vendor price + VAT pill */}
              <CCol sm={2}> </CCol>
              <CCol sm={3}>
                <div className="admin-lbl-box pink-shadow6">{to2(priceItem.Price)}</div>
                {vatPercentValue > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    <span style={vatPillStyle}>{to2(vendorVat)}</span>
                  </div>
                )}
              </CCol>

              {/* Heroz profit + VAT pill */}
              <CCol sm={3}>
                <div className="admin-lbl-box text-center pink-shadow7">
                  {to2(priceItem.HerozStudentPrice)}
                </div>
                {vatPercentValue > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    <span style={vatPillStyle}>{to2(herozVat)}</span>
                  </div>
                )}
              </CCol>

              {/* Total Price + VAT pill */}
              <CCol sm={3} className="text-end">
                <div
                  className="admin-lbl-box text-end pink-shadow"
                  style={{ marginRight: '10px' }}
                >
                  {to2(TotalPricePerStudent)}
                </div>
                {vatPercentValue > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12, textAlign: 'right' }}>
                    <span style={vatPillStyle}>{to2(totalVat)}</span>
                  </div>
                )}
              </CCol>
            </CRow>
          )
        })}
      </div>
      {/* =================================================================== */}

      {/* ======================= Extra INFORMATION (School Food profit hidden) ======================= */}
      <div className="txtsubtitle">
        Extra Information
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
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          {/* Header Row – School Food profit HIDDEN */}
          <CRow className="mb-2 fw-bold hbg">
            <CCol sm={2}>Extra Name</CCol>
            <CCol sm={2}>Vendor Extra Price</CCol>
            <CCol sm={2}>Heroz Extra profit</CCol>
            <CCol sm={2}>Total Price</CCol>
            <CCol sm={2}>Notes</CCol>
            <CCol sm={1}>Extra Image</CCol>
            <CCol sm={1}>Include</CCol>
          </CRow>

          {ActivityData?.foodList?.map((foodItem, index) => {
            const vendorBase = Number(foodItem.FoodPrice || 0)
            const herozBase = Number(foodItem.FoodHerozPrice || 0)
            const schoolBase = Number(foodItem.FoodSchoolPrice || 0)
            const totalBase = vendorBase + herozBase + schoolBase

            const vendorVat = vendorBase * vatRateValue
            const herozVat = herozBase * vatRateValue
            const totalVat = totalBase * vatRateValue

            const TotalFoodPrice =
              (parseFloat(foodItem.FoodPrice) || 0) +
              (parseFloat(foodItem.FoodHerozPrice) || 0) +
              (parseFloat(foodItem.FoodSchoolPrice) || 0)

            return (
              <CRow key={index} className="mb-3 align-items-center">
                {/* Extra Name */}
                <CCol sm={2}>
                  <div className="admin-lbl-box">{foodItem.FoodName}</div>
                </CCol>

                {/* Vendor Extra Price + VAT pill */}
                <CCol sm={2}>
                  <div className="admin-lbl-box text-center pink-shadow6">
                    {to2(foodItem.FoodPrice)}
                  </div>
                  {vatPercentValue > 0 && (
                    <div style={{ marginTop: 4, fontSize: 10 }}>
                      <span style={vatPillStyle}>{to2(vendorVat)}</span>
                    </div>
                  )}
                </CCol>

                {/* Heroz Extra  profit + VAT pill */}
                <CCol sm={2}>
                  <div className="admin-lbl-box text-center pink-shadow7">
                    {to2(foodItem.FoodHerozPrice)}
                  </div>
                  {vatPercentValue > 0 && (
                    <div style={{ marginTop: 4, fontSize: 10 }}>
                      <span style={vatPillStyle}>{to2(herozVat)}</span>
                    </div>
                  )}
                </CCol>

                {/* Total Price + VAT pill */}
                <CCol sm={2}>
                  <div className="admin-lbl-box text-center">
                    {to2(TotalFoodPrice)}
                  </div>
                  {vatPercentValue > 0 && (
                    <div style={{ marginTop: 4, fontSize: 10 }}>
                      <span style={vatPillStyle}>{to2(totalVat)}</span>
                    </div>
                  )}
                </CCol>

                {/* Notes */}
                <CCol sm={2}>
                  <div className="admin-lbl-box text-center">{foodItem.FoodNotes}</div>
                </CCol>

                {/* Image Preview */}
                <CCol sm={1}>
                  {foodItem.FoodImage ? (
                    <FilePreview file={foodItem.FoodImage} />
                  ) : (
                    <div className="admin-lbl-box text-center">No Image</div>
                  )}
                </CCol>

                {/* Include */}
                <CCol sm={1} className="text-center">
                  <div className="admin-lbl-box text-center">
                    {foodItem.Include ? 'Yes' : 'No'}
                  </div>
                </CCol>
              </CRow>
            )
          })}
        </div>
      </div>
      {/* ======================================================================== */}

      {/* ====================== SUMMARY (Vendor/School + Heroz like screenshot) ====================== */}
      <div className="txtsubtitle">Summary</div>
      <div className="divbox">
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            alignItems: 'stretch',
          }}
        >
          {/* Vendor / School Summary */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 'bold',
                padding: '10px 14px',
                borderRadius: '10px 10px 0 0',
                backgroundColor: '#f4f0ff',
              }}
            >
              Vendor Summary
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#fff',
                borderRadius: '0 0 10px 10px',
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f9f9f9' }}>
                  <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>
                    Description
                  </th>
                  <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>
                    Base Price
                  </th>
                  <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>
                    VAT ({to2(vatPercentValue)}%)
                  </th>
                  <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Trip row */}
                <tr>
                  <td style={{ padding: 8 }}>Trip</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(firstPriceRowBase)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(tripVatAmountComputed)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(firstPriceRowBase + tripVatAmountComputed)}
                  </td>
                </tr>

                {/* Food row */}
                <tr>
                  <td style={{ padding: 8 }}>Extra</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(foodBaseAmountComputed)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(foodVatAmountComputed)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(foodBaseAmountComputed + foodVatAmountComputed)}
                  </td>
                </tr>

                {/* Total row */}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                  <td style={{ padding: 8 }}>Total</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(totalBaseAmount)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(totalVatAmount)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(totalWithVat)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Heroz Summary */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 'bold',
                padding: '10px 14px',
                borderRadius: '10px 10px 0 0',
                backgroundColor: '#f4f0ff',
              }}
            >
              Heroz Summary
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#fff',
                borderRadius: '0 0 10px 10px',
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f9f9f9' }}>
                  <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'left' }}>
                    Description
                  </th>
                  <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>
                    Heroz Profit
                  </th>
                  <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>
                    Heroz VAT ({to2(vatPercentValue)}%)
                  </th>
                  <th style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Trip row */}
                <tr>
                  <td style={{ padding: 8 }}>Trip</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(firstHerozPriceRowBase)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(tripHerozVatAmountComputed)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(firstHerozPriceRowBase + tripHerozVatAmountComputed)}
                  </td>
                </tr>

                {/* Food row */}
                <tr>
                  <td style={{ padding: 8 }}>Extra</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(foodHerozBaseAmountComputed)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(foodHerozVatAmountComputed)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(foodHerozBaseAmountComputed + foodHerozVatAmountComputed)}
                  </td>
                </tr>

                {/* Total row */}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                  <td style={{ padding: 8 }}>Total</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(totalHerozBaseAmountComputed)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(totalHerozVatAmountComputed)}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {to2(totalHerozWithVatComputed)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total cards (bottom) – still commented */}
      </div>
      {/* ======================================================================== */}

      <div className="txtsubtitle">Terms And Conditions</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="admin-lbl-boxv1">{ActivityData?.actAdminNotes}</div>
        </div>
      </div>

      {/* ⭐ FINAL GRID SUMMARY – Name / Description / Total */}
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto 24px',
          border: '4px solid #512da8',
          borderRadius: 20,
          padding: '18px 24px',
          backgroundColor: '#f3e5f5',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        <div
          style={{
            marginBottom: 10,
            fontSize: 18,
            fontWeight: 800,
            textAlign: 'center',
            color: '#311b92',
          }}
        >
          School Price Summary (Incl. VAT)
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 4fr 1.3fr',
            rowGap: 10,
            columnGap: 16,
            alignItems: 'center',
          }}
        >
          {/* Header row */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#d1c4e9',
              fontWeight: 700,
            }}
          >
            Name
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#d1c4e9',
              fontWeight: 700,
            }}
          >
            Description (Vendor Price) +(Heroz Profit  )
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#d1c4e9',
              fontWeight: 700,
              textAlign: 'right',
            }}
          >
            Total
          </div>

          {/* Row 1: Trip only */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#ede7f6',
              fontWeight: 700,
            }}
          >
            School Price (Incl. VAT)
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#ede7f6',
            }}
          >
            <span style={{ color: '#1b5e20' }}>
              {to2(_tripTotalVendorOnly)}
            </span>{' '}
            +{' '}
            <span style={{ color: '#1a237e' }}>
              {to2(tripTotalHerozOnly)}
            </span>
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#ede7f6',
              textAlign: 'right',
              fontWeight: 800,
              color: '#c62828',
            }}
          >
            {to2(schoolPriceTripOnly)}
          </div>

          {/* Row 2: Food only */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#f8eaf6',
              fontWeight: 700,
            }}
          >
            Additional Items (Incl. VAT)
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#f8eaf6',
            }}
          >
            <span style={{ color: '#1b5e20' }}>
              {to2(foodTotalVendorOnly)}
            </span>{' '}
            +{' '}
            <span style={{ color: '#1a237e' }}>
              {to2(foodTotalHerozOnly)}
            </span>
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#f8eaf6',
              textAlign: 'right',
              fontWeight: 800,
              color: '#c62828',
            }}
          >
            {to2(schoolFoodOnly)}
          </div>

          {/* Row 3 (final school price) is still commented out */}
        </div>
      </div>

      <div className="button-container">
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/activityinfo/activity/list')}
        >
          Return
        </button>
      </div>
      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default Vendor
