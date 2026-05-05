import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import {
  DspToastMessage,
  dspstatusv1,
  getAuthHeaders,
  IsAdminLoginIsValid,
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

  // ================= VAT REMOVED FROM DISPLAY/CALCULATION =================
  // VAT is already included in the entered prices, so do not add or display VAT separately.
  const vatPercentValue = 0
  const vatRateValue = 0

  const vatPillStyle = {
    display: 'none',
  }

  // ⭐ FIXED FINANCIAL ROUNDING (2.447 → 2.45, etc.)
  const to2 = (v) => {
    const n = Number(v || 0)
    if (!Number.isFinite(n)) return '0.00'
    return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2)
  }

  // ✅ SAME CONCEPT (layout helpers) — ADDED (no removals)
  const typeUpper = String(ActivityData?.actTypeID || '').toUpperCase()
  const isMemberType = typeUpper === 'MEMBERSHIP' || typeUpper ==="MEMBERSHIP"
  const isSchoolType = typeUpper === 'SCHOOL'

  const priceSectionTitle = isSchoolType
    ? 'Price Per Student'
    : isMemberType
      ? 'Star (Price) Information'
      : 'Price Per Student'

  const priceSectionBoxStyle = {
    border: '1px solid gray',
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
    borderRadius: 10,
  }

  const starPinkStyle = {
    border: '1px solid #cf2037',
    borderRadius: 10,
    backgroundColor: 'rgba(248, 234, 243, 1)', // pink
    boxShadow: 'none',
  }

  const calcDefaultTotalStarForParents = (totalStarValue, starValue) => {
    const t = Number(totalStarValue || 0)
    const s = Number(starValue || 0)
    if (!Number.isFinite(t) || !Number.isFinite(s) || s <= 0) return ''
    return to2(t / s)
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

  const tripTotalHerozOnly = firstHerozPriceRowBase + tripHerozVatAmountComputed
  const schoolPriceTripOnly = _tripTotalVendorOnly + tripTotalHerozOnly

  // ✅ FOOD-ONLY TOTALS (exclude trip) for School Price box
  const foodTotalVendorOnly = foodBaseAmountComputed + foodVatAmountComputed
  const foodTotalHerozOnly = foodHerozBaseAmountComputed + foodHerozVatAmountComputed
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

      // ✅ SAME FIX AS EDIT PAGE (API returns array sometimes)
      const raw = data?.data
      const normalized = Array.isArray(raw) ? raw[0] : raw
      setActivity(normalized || null)

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

        {/* ⭐ Activity Rating */}
        <div className="form-group">
          <label style={{ marginBottom: '10px', marginTop: '20px' }}>Activity Rating</label>
          <div className="admin-lbl-box">
            {ActivityData?.actRating !== undefined &&
            ActivityData?.actRating !== null &&
            String(ActivityData?.actRating).trim() !== ''
              ? ActivityData?.actRating
              : 'No Data Found'}
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
            {ActivityData?.actYouTubeID1 && String(ActivityData.actYouTubeID1).trim() !== '' ? (
              <YouTubeEmbed videoId={ActivityData.actYouTubeID1} />
            ) : (
              <div className="admin-lbl-box text-center">No Data Found</div>
            )}
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 2</label>
            {ActivityData?.actYouTubeID2 && String(ActivityData.actYouTubeID2).trim() !== '' ? (
              <YouTubeEmbed videoId={ActivityData.actYouTubeID2} />
            ) : (
              <div className="admin-lbl-box text-center">No Data Found</div>
            )}
          </div>

          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 3</label>
            {ActivityData?.actYouTubeID3 && String(ActivityData.actYouTubeID3).trim() !== '' ? (
              <YouTubeEmbed videoId={ActivityData.actYouTubeID3} />
            ) : (
              <div className="admin-lbl-box text-center">No Data Found</div>
            )}
          </div>
        </div>
      </div>


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

      {/* ================== PRICE PER STUDENT (APPLIED SAME CONCEPT + LAYOUT) ================== */}
      <div className="txtsubtitle">
        {priceSectionTitle}
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

      {/* ✅ SAME: gray border + yellow background */}
      <div className="divbox" style={priceSectionBoxStyle}>
        {/* ✅ Header changes based on MEMBER */}
        <CRow className="fw-bold text-center mb-2">
          <CCol sm={2}></CCol>

          {/* NON-MEMBER header (your existing) */}
          {!isMemberType && (
            <>
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
            </>
          )}

          {/* MEMBER header */}
          {isMemberType && (
            <>
              <CCol sm={3} style={{ backgroundColor: 'rgba(248, 234, 243, 1)' }}>
                Total Star Value
              </CCol>
              <CCol sm={3} style={{ backgroundColor: 'rgba(248, 234, 243, 1)' }}>
                Star Value
              </CCol>
              <CCol sm={3} style={{ backgroundColor: 'rgba(248, 234, 243, 1)' }}>
                Total Star For Parents
              </CCol>
            </>
          )}
        </CRow>

        {ActivityData?.priceList?.map((priceItem, index) => {
          const vendorBase = Number(priceItem.Price || 0)
          const herozBase = Number(priceItem.HerozStudentPrice || 0)
          const schoolBase = Number(priceItem.SchoolPrice || 0)

          const vendorVat = vendorBase * vatRateValue
          const herozVat = herozBase * vatRateValue

          // NON-MEMBER existing calc
          const TotalPricePerStudent =
            (parseFloat(priceItem.HerozStudentPrice) || 0) +
            (parseFloat(priceItem.Price) || 0) +
            (parseFloat(priceItem.SchoolPrice) || 0)

          // MEMBER values
          const apiTotalStarValue =
            priceItem.TotalStarValue ??
            priceItem.TotalStarValueAmount ??
            priceItem.TotalStarValues ??
            null

          const totalStarValueFinal =
            apiTotalStarValue !== null &&
            apiTotalStarValue !== undefined &&
            String(apiTotalStarValue).trim() !== ''
              ? Number(apiTotalStarValue || 0)
              : vendorBase + vendorVat // membership concept: price + VAT

          const apiStarValue =
            priceItem.StarValue ??
            priceItem.StarValues ??
            ActivityData?.StarValue ??
            ActivityData?.starValue ??
            null

          const starValueFinal =
            apiStarValue !== null &&
            apiStarValue !== undefined &&
            String(apiStarValue).trim() !== ''
              ? Number(apiStarValue || 0)
              : 0

          const apiParentsStar =
            priceItem.TotalStarForParents ??
            priceItem.TotalStarForParentsValue ??
            ActivityData?.TotalStarForParents ??
            ActivityData?.totalStarForParents ??
            null

          const parentsStarFinal =
            apiParentsStar !== null &&
            apiParentsStar !== undefined &&
            String(apiParentsStar).trim() !== ''
              ? String(apiParentsStar)
              : calcDefaultTotalStarForParents(totalStarValueFinal, starValueFinal)

          return (
            <CRow className="align-items-center mb-2" key={index}>
              <CCol sm={2}> </CCol>

              {/* NON-MEMBER layout */}
              {!isMemberType && (
                <>
                  <CCol sm={3}>
                    <div className="admin-lbl-box pink-shadow6">{to2(priceItem.Price)}</div>
                    {vatPercentValue > 0 && (
                      <div style={{ marginTop: 4, fontSize: 12 }}>
                        <span style={vatPillStyle}>{to2(vendorVat)}</span>
                      </div>
                    )}
                  </CCol>

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

                  <CCol sm={3} className="text-end">
                    <div
                      className="admin-lbl-box text-end pink-shadow"
                      style={{ marginRight: '10px' }}
                    >
                      {to2(TotalPricePerStudent)}
                    </div>
                    {vatPercentValue > 0 && (
                      <div style={{ marginTop: 4, fontSize: 12, textAlign: 'right' }}>
                        <span style={vatPillStyle}>
                          {to2((vendorBase + herozBase + schoolBase) * vatRateValue)}
                        </span>
                      </div>
                    )}
                  </CCol>
                </>
              )}

              {/* MEMBER layout */}
              {isMemberType && (
                <>
                  <CCol sm={3}>
                    <div className="admin-lbl-box text-center" style={starPinkStyle}>
                      {to2(totalStarValueFinal)}
                    </div>
                  </CCol>

                  <CCol sm={3}>
                    <div className="admin-lbl-box text-center" style={starPinkStyle}>
                      {starValueFinal ? String(starValueFinal) : '0'}
                    </div>
                  </CCol>

                  <CCol sm={3}>
                    <div className="admin-lbl-box text-center" style={starPinkStyle}>
                      {parentsStarFinal || ''}
                    </div>
                  </CCol>
                </>
              )}
            </CRow>
          )
        })}
      </div>
      {/* =================================================================== */}

      {/* ✅ HIDE THESE SECTIONS WHEN actTypeID = "MEMBERSHIP" */}
      {!isMemberType && (
        <>
          {/* ======================= Extra INFORMATION ======================= */}
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
                    <CCol sm={2}>
                      <div className="admin-lbl-box">{foodItem.FoodName}</div>
                    </CCol>

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

                    <CCol sm={2}>
                      <div className="admin-lbl-box text-center">{to2(TotalFoodPrice)}</div>
                      {vatPercentValue > 0 && (
                        <div style={{ marginTop: 4, fontSize: 10 }}>
                          <span style={vatPillStyle}>{to2(totalVat)}</span>
                        </div>
                      )}
                    </CCol>

                    <CCol sm={2}>
                      <div className="admin-lbl-box text-center">{foodItem.FoodNotes}</div>
                    </CCol>

                    <CCol sm={1}>
                      {foodItem.FoodImage ? (
                        <FilePreview file={foodItem.FoodImage} />
                      ) : (
                        <div className="admin-lbl-box text-center">No Image</div>
                      )}
                    </CCol>

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
          {/* =================================================================== */}

          {/* ====================== SUMMARY (VAT INCLUDED - NO EXTRA VAT CALCULATION) ====================== */}
          <div className="txtsubtitle">Summary</div>
          <div className="divbox" style={{ background: 'linear-gradient(135deg, #fff7fd 0%, #ffffff 48%, #f7efff 100%)' }}>
            <div
              style={{
                maxWidth: 1120,
                margin: '0 auto',
                borderRadius: 18,
                border: '1px solid rgba(112, 20, 108, 0.16)',
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 18px 45px rgba(76, 0, 72, 0.10)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '16px 20px',
                  background: 'linear-gradient(90deg, rgba(94, 0, 91, 0.96), rgba(202, 28, 151, 0.90))',
                  color: '#fff',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.2 }}>Summary</div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '6px 12px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  VAT Included
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    backgroundColor: '#fff',
                    fontSize: 15,
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#fff4fb' }}>
                      <th style={{ padding: '14px 16px', borderBottom: '1px solid #f0ddeb', textAlign: 'left', color: '#36033a', fontWeight: 900 }}>
                        Description
                      </th>
                      <th style={{ padding: '14px 16px', borderBottom: '1px solid #f0ddeb', textAlign: 'right', color: '#36033a', fontWeight: 900 }}>
                        Base Price (Vendor)
                      </th>
                      <th style={{ padding: '14px 16px', borderBottom: '1px solid #f0ddeb', textAlign: 'right', color: '#36033a', fontWeight: 900 }}>
                        Base Price (Heroz)
                      </th>
                      <th style={{ padding: '14px 16px', borderBottom: '1px solid #f0ddeb', textAlign: 'right', color: '#36033a', fontWeight: 900 }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '15px 16px', borderBottom: '1px solid #f5edf4', fontWeight: 700 }}>Trip</td>
                      <td style={{ padding: '15px 16px', borderBottom: '1px solid #f5edf4', textAlign: 'right', fontWeight: 700 }}>{to2(firstPriceRowBase)}</td>
                      <td style={{ padding: '15px 16px', borderBottom: '1px solid #f5edf4', textAlign: 'right', fontWeight: 700 }}>{to2(firstHerozPriceRowBase)}</td>
                      <td style={{ padding: '15px 16px', borderBottom: '1px solid #f5edf4', textAlign: 'right', fontWeight: 900, color: '#4f0754' }}>
                        {to2(firstPriceRowBase + firstHerozPriceRowBase)}
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '15px 16px', borderBottom: '1px solid #f5edf4', fontWeight: 700 }}>Extra</td>
                      <td style={{ padding: '15px 16px', borderBottom: '1px solid #f5edf4', textAlign: 'right', fontWeight: 700 }}>{to2(foodBaseAmountComputed)}</td>
                      <td style={{ padding: '15px 16px', borderBottom: '1px solid #f5edf4', textAlign: 'right', fontWeight: 700 }}>{to2(foodHerozBaseAmountComputed)}</td>
                      <td style={{ padding: '15px 16px', borderBottom: '1px solid #f5edf4', textAlign: 'right', fontWeight: 900, color: '#4f0754' }}>
                        {to2(foodBaseAmountComputed + foodHerozBaseAmountComputed)}
                      </td>
                    </tr>

                    <tr style={{ background: 'linear-gradient(90deg, #fff7fd, #f8eaf6)' }}>
                      <td style={{ padding: '16px', fontWeight: 950, color: '#2d022f' }}>Total</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 950, color: '#2d022f' }}>{to2(firstPriceRowBase + foodBaseAmountComputed)}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 950, color: '#2d022f' }}>{to2(firstHerozPriceRowBase + foodHerozBaseAmountComputed)}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 950, color: '#7b006d', fontSize: 17 }}>
                        {to2(firstPriceRowBase + foodBaseAmountComputed + firstHerozPriceRowBase + foodHerozBaseAmountComputed)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* =================================================================== */}
          {/* =================================================================== */}
        </>
      )}


      <div className="txtsubtitle">What is Include</div>
      <div className="divbox">
        <div className="admin-lbl-boxv1">{ActivityData?.actWhatsIncluded}</div>
      </div>

      <div className="txtsubtitle">Trip Details</div>
      <div className="divbox">
        <div className="admin-lbl-boxv1">{ActivityData?.actTripDetail}</div>
      </div>

      <div className="txtsubtitle">Terms And Conditions</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="admin-lbl-boxv1">{ActivityData?.actAdminNotes}</div>
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
