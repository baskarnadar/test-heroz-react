import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import { API_BASE_URL } from '../../../config'
import { DspToastMessage, dspstatusv1 } from '../../../utils/operation'
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

  const fetchActivity = async (ActivityIDVal, VendorIDVal) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ActivityID: ActivityIDVal, VendorID: VendorIDVal }),
      })

      if (!response.ok) throw new Error('Failed to fetch activities')

      const data = await response.json()
      setActivity(data.data || [])

      setTotalPages(Math.ceil(data.totalCount / ActivityPerPage))
    } catch (error) {
      setError('Error fetching activities')
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
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1])
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
        {/* Left side: Title */}
        <div className="txtheadertitle">View Activity</div>

        {/* Right side: Buttons */}
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
          {/* Image 1 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Activity Image 1</label>
            <FilePreview file={txtactImageName1} /> 
          </div>

          {/* Image 2 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Activity Image 2</label>
            <FilePreview file={txtactImageName2} />
          </div>

          {/* Image 3 */}
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
          {/* Image 1 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 1</label>
            <YouTubeEmbed videoId={ActivityData?.actYouTubeID1} />

            <div></div>
          </div>

          {/* Image 2 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 2</label>
            <div>
              <YouTubeEmbed videoId={ActivityData?.actYouTubeID2} />
            </div>
          </div>

          {/* Image 3 */}
          <div className="form-group" style={{ flex: '1' }}>
            <label>Youtube Video Link 3</label>
            <div>
              <YouTubeEmbed videoId={ActivityData?.actYouTubeID3} />
            </div>
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
        {/* // row start */}
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
        {/* // row end */}

        {/* // row start */}
        <div className="vendor-container">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label className="vendor-label">Gender</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div className="admin-lbl-box pink-badge"> {ActivityData?.actGender} </div>
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
        {/* // row end */}
      </div>

      <div className="txtsubtitle">Price Per Student</div>

      <div className="divbox">
        {/* Table Header */}
        <CRow className="fw-bold text-center mb-2">
          <CCol sm={2}>Student Range From</CCol>
          <CCol sm={2}>Student Range To</CCol>
          <CCol sm={2}>
            <img
              src={moneyv1}
              alt="logo"
              style={{ width: '14px', marginRight: '6px', verticalAlign: 'middle' }}
            />
            Price
          </CCol>
          <CCol sm={2}>
            <img
              src={moneyv1}
              alt="logo"
              style={{ width: '14px', marginRight: '6px', verticalAlign: 'middle' }}
            />
            Heroz Price
          </CCol>
          <CCol sm={2}>
            <img
              src={moneyv1}
              alt="logo"
              style={{ width: '14px', marginRight: '6px', verticalAlign: 'middle' }}
            />
            School Price
          </CCol>
          <CCol sm={2}>
            {' '}
            <img
              src={moneyv1}
              alt="logo"
              style={{ width: '14px', marginRight: '6px', verticalAlign: 'middle' }}
            />{' '}
            Total Cost
          </CCol>
        </CRow>

        {/* Dynamic Form Rows */}
        {ActivityData?.priceList?.map((priceItem, index) => {
          const TotalPricePerStudent =
            (parseFloat(priceItem.HerozStudentPrice) || 0) +
            (parseFloat(priceItem.Price) || 0) +
            (parseFloat(priceItem.SchoolPrice) || 0)

          return (
            <CRow className="align-items-center mb-2" key={index}>
              <CCol sm={2}>
                <div className="admin-lbl-box text-center pink-shadow2">
                  {priceItem.StudentRangeFrom}
                </div>
              </CCol>
              <CCol sm={2}>
                <div className="admin-lbl-box text-center pink-shadow3">
                  {priceItem.StudentRangeTo}
                </div>
              </CCol>
              <CCol sm={2}>
                <div className="admin-lbl-box pink-shadow6">{priceItem.Price}</div>
              </CCol>
              <CCol sm={2}>
                <div className="admin-lbl-box text-center pink-shadow7">
                  {priceItem.HerozStudentPrice}
                </div>
              </CCol>
              <CCol sm={2}>
                <div className="admin-lbl-box text-center pink-shadow8">
                  {priceItem.SchoolPrice}
                </div>
              </CCol>
              <CCol sm={2} className="text-end">
                <div className="admin-lbl-box text-end pink-shadow" style={{ marginRight: '10px' }}>
                  {TotalPricePerStudent.toFixed(2)}
                </div>
              </CCol>
            </CRow>
          )
        })}
      </div>

      <div className="txtsubtitle">Set Availability</div>
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            .filter((day) => ActivityData?.availList?.some((item) => item.DayName === day))
            .map((day) => {
              const matchedEntries = ActivityData.availList.filter((item) => item.DayName === day)

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
                      {day} <input type="checkbox" checked readOnly /> Available
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
                      <div style={{ width: '200px', textAlign: 'center' }}>Start Time</div>
                      <div style={{ width: '200px', textAlign: 'center' }}>End Time</div>
                      <div style={{ width: '200px', textAlign: 'center' }}>Note</div>
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

      <div className="txtsubtitle">Food Information</div>
      <div className="divbox">
        <div style={{ margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
          {/* Header Row */}
          <CRow className="mb-2 fw-bold hbg">
            <CCol sm={2}>Food Name</CCol>
            <CCol sm={1}>Price</CCol>
            <CCol sm={1}>Heroz Price</CCol>
            <CCol sm={1}>School Price</CCol>
            <CCol sm={1}>Total Price</CCol>
            <CCol sm={2}>Notes</CCol>
            <CCol sm={2}>Food Image</CCol>
            <CCol sm={1}>Include</CCol>
            <CCol sm={1}></CCol> {/* For remove button */}
          </CRow>

          {ActivityData?.foodList?.map((foodItem, index) => {
            const TotalFoodPrice =
              (parseFloat(foodItem.FoodPrice) || 0) +
              (parseFloat(foodItem.FoodHerozPrice) || 0) +
              (parseFloat(foodItem.FoodSchoolPrice) || 0)

            console.log(parseFloat(foodItem.FoodPrice))
            console.log(parseFloat(foodItem.FoodHerozPrice))
            console.log(parseFloat(foodItem.FoodSchoolPrice))
            return (
              <CRow key={index} className="mb-3 align-items-center">
                {/* Food Name */}
                <CCol sm={2}>
                  <div className="admin-lbl-box">{foodItem.FoodName}</div>
                </CCol>

                {/* Prices */}
                <CCol sm={1}>
                  <div className="admin-lbl-box text-center pink-shadow6">{foodItem.FoodPrice}</div>
                </CCol>
                <CCol sm={1}>
                  <div className="admin-lbl-box text-center pink-shadow7">
                    {foodItem.FoodHerozPrice}
                  </div>
                </CCol>
                <CCol sm={1}>
                  <div className="admin-lbl-box text-center pink-shadow8">
                    {foodItem.FoodSchoolPrice}
                  </div>
                </CCol>

                {/* Total Price */}
                <CCol sm={1}>
                  <div className="admin-lbl-box text-center">{TotalFoodPrice.toFixed(2)}</div>
                </CCol>

                {/* Notes */}
                <CCol sm={2}>
                  <div className="admin-lbl-box text-center">{foodItem.FoodNotes}</div>
                </CCol>

                {/* Image Preview */}
                <CCol sm={2}>
                  {foodItem.FoodImage ? (
                    <FilePreview file={foodItem.FoodImage} />
                  ) : (
                    <div className="admin-lbl-box text-center">No Image</div>
                  )}
                </CCol>

                {/* Include */}
                <CCol sm={1} className="text-center">
                  <div className="admin-lbl-box text-center">{foodItem.Include ? 'Yes' : 'No'}</div>
                </CCol>
              </CRow>
            )
          })}
        </div>
      </div>

      <div className="txtsubtitle">Terms And Conditions</div>
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
