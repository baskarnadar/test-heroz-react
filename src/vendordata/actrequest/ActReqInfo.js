// src/vendordata/activityinfo/activity/actdeatilinfo.js
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft,
  cilCheckCircle,
  cilImage,
  cilInfo,
  cilLocationPin,
  cilMoney,
  cilCalendar,
  cilPeople,
  cilMap,
  cilRestaurant,
  cilDescription,
  cilStar,
  cilTags,
} from '@coreui/icons'

// NOTE: this file lives in src/vendordata/activityinfo/activity/
// so config/utils are three levels up
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID, IsVendorLoginIsValid } from '../../utils/operation'
import "./../../scss/style.css";// ---------- Small helpers ----------
const SectionTitle = ({ children, icon }) => (
  <div className="act-detail-section-title">
    {icon ? <CIcon icon={icon} className="act-detail-section-icon" /> : null}
    <span>{children}</span>
  </div>
)

const KeyValue = ({ label, value, strong }) => (
  <div className="act-detail-kv-row">
    <div className="act-detail-kv-label">{label}</div>
    <div className={`act-detail-kv-value ${strong ? 'act-detail-kv-value-strong' : ''}`}>
      {value ?? '—'}
    </div>
  </div>
)

const Chip = ({ children, color = '#d63384' }) => (
  <span
    className="act-detail-chip"
    style={{
      '--chip-color': color,
      '--chip-bg': `${color}18`,
      '--chip-border': `${color}33`,
    }}
  >
    {children}
  </span>
)

const ImageCarousel = ({ images = [] }) => {
  const list = Array.isArray(images) ? images.filter(Boolean) : []
  if (!list.length) {
    return <div className="act-detail-empty-box">No images found</div>
  }

  return (
    <div className="act-detail-image-grid">
      {list.map((src, i) => (
        <div key={i} className="act-detail-image-card">
          <img src={src} alt={`activity-${i}`} className="act-detail-image" />
        </div>
      ))}
    </div>
  )
}

const AvailabilityTable = ({ rows = [] }) => {
  if (!rows?.length) return <div className="act-detail-empty-box">—</div>
  return (
    <div className="act-detail-table-wrap">
      <table className="table table-sm act-detail-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Start</th>
            <th>End</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td>{r.DayName || '—'}</td>
              <td>{r.StartTime || '—'}</td>
              <td>{r.EndTime || '—'}</td>
              <td>{r.Note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const PriceList = ({ prices = [] }) => {
  if (!prices?.length) return <div className="act-detail-empty-box">—</div>
  return (
    <div className="act-detail-table-wrap">
      <table className="table table-sm act-detail-table">
        <thead>
          <tr>
            <th>Price</th>
            <th>Range From</th>
            <th>Range To</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p, i) => (
            <tr key={i}>
              <td>{p.Price ?? '—'}</td>
              <td>{p.StudentRangeFrom ?? '—'}</td>
              <td>{p.StudentRangeTo ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const Meals = ({ included = [], excluded = [] }) => (
  <CRow>
    <CCol md={6}>
      <SectionTitle icon={cilRestaurant}>Included Meals</SectionTitle>
      {included.length === 0 ? (
        <div className="act-detail-empty-box">—</div>
      ) : (
        <div className="act-detail-meal-list">
          {included.map((m, i) => (
            <div key={i} className="act-detail-meal-item">
              <span className="act-detail-meal-name">{m.FoodName || '—'}</span>
              <Chip color="#14532d">Included</Chip>
              {m.FoodNotes && m.FoodNotes.toString().trim().toLowerCase() !== (m.FoodName || '').toString().trim().toLowerCase() ? (
              <span className="act-detail-meal-note">• {m.FoodNotes}</span>
            ) : null}
            </div>
          ))}
        </div>
      )}
    </CCol>
    <CCol md={6}>
      <SectionTitle icon={cilRestaurant}>Additional Meals</SectionTitle>
      {excluded.length === 0 ? (
        <div className="act-detail-empty-box">—</div>
      ) : (
        <div className="act-detail-meal-list">
          {excluded.map((m, i) => (
            <div key={i} className="act-detail-meal-item">
              <span className="act-detail-meal-name">{m.FoodName || '—'}</span>
              <Chip color="#d63384">
                {typeof m.FoodPrice === 'number' ? m.FoodPrice : (m.FoodPrice || '—')}
              </Chip>
              {m.FoodNotes && m.FoodNotes.toString().trim().toLowerCase() !== (m.FoodName || '').toString().trim().toLowerCase() ? (
              <span className="act-detail-meal-note">• {m.FoodNotes}</span>
            ) : null}
            </div>
          ))}
        </div>
      )}
    </CCol>
  </CRow>
)

// ---------- Console helper ----------
const logJSON = (label, obj) => {
  try {
    const text = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
    console.log(`${label}:\n${text}`)
  } catch {
    console.log(label, obj)
  }
}

// Normalize possible image structures to an array of URLs (strings)
const extractImageUrls = (data) => {
  const urls = []

  // 1) Prefer activityImages array
  const imgs = data?.activityImages
  if (Array.isArray(imgs)) {
    for (const it of imgs) {
      if (typeof it === 'string') {
        urls.push(it)
      } else if (it && typeof it === 'object') {
        // Your JSON uses actImageNameUrl
        const u =
          it.actImageNameUrl ||
          it.url ||
          it.src ||
          it.href ||
          it.imageUrl ||
          null
        if (u) urls.push(u)
      }
    }
  }

  // 2) Fallbacks: actImageName1Url/2Url/3Url if present
  ;['actImageName1Url', 'actImageName2Url', 'actImageName3Url'].forEach((k) => {
    const v = data?.[k]
    if (typeof v === 'string' && /^https?:\/\//i.test(v)) urls.push(v)
  })

  // De-dupe while preserving order
  return Array.from(new Set(urls.filter(Boolean)))
}

// ---------- Main page ----------
const ActDetailInfo = () => {
  const [search] = useSearchParams()
  const { requestId } = useParams() // from /vendordata/actrequest/actreqinfo/:requestId
  const navigate = useNavigate()

  // Prefer path param; fall back to query (?ActivityID=...)
  const ActivityID = requestId || search.get('ActivityID') || ''
  const VendorID = search.get('VendorID') || getCurrentLoggedUserID()
  const debug = search.get('debug') === '1'

  // ✅ Vendor login guard
  useEffect(() => {
    IsVendorLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])

  const [data, setData] = useState(null)
  const [rawJson, setRawJson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // normalize derived
  const categories = useMemo(() => {
    const arr =
      data?.enCategoryNames ||
      data?.EnCategoryNames || // your JSON has EnCategoryNames (capital E)
      data?.actCategoryNames ||
      []
    const flat = Array.isArray(arr) ? arr : typeof arr === 'string' ? [arr] : []
    return flat
      .flatMap((s) => (typeof s === 'string' ? s.split(',') : []))
      .map((s) => s.trim())
      .filter(Boolean)
  }, [data])

  // ✅ Robust image extraction (works with your JSON)
  const images = useMemo(() => extractImageUrls(data), [data])

  const availRows = useMemo(() => data?.availList || data?.actAvailDaysHours?.rows || [], [data])

  const mealsIncluded = useMemo(
    () => (data?.foodList || []).filter((f) => f?.Include === true || f?.include === true),
    [data],
  )
  const mealsExcluded = useMemo(
    () => (data?.foodList || []).filter((f) => !(f?.Include === true || f?.include === true)),
    [data],
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!ActivityID) {
        setError('ActivityID is missing.')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)

        const url = `${API_BASE_URL}/vendordata/activityinfo/activity/getActivity`
        const payload = { ActivityID, VendorID }

        const resp = await fetch(url, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })

        const raw = await resp.clone().text()
        let json = null
        try {
          json = JSON.parse(raw)
        } catch {
          // keep json = null
        }

        // Log everything nicely
        console.groupCollapsed('[getActivity] API call')
        console.log('▶ URL:', url)
        console.log('▶ Payload:', payload)
        console.log('◀ Status:', resp.status, resp.statusText)
        console.log('◀ Headers:', Object.fromEntries(resp.headers.entries()))
        logJSON('◀ Raw body (text)', raw)
        if (json !== null) {
          logJSON('◀ Parsed JSON', json)
          if (Array.isArray(json)) {
            try { console.table(json) } catch {}
          }
        } else {
          console.warn('⚠ Response was not valid JSON.')
        }
        console.groupEnd()

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${raw || resp.statusText}`)
        }

        if (!alive) return

        setRawJson(json ?? raw)

        // Success detection
        const statusStr = (
          (json?.status ?? json?.result ?? json?.success ?? json?.ok ?? '')
        ).toString().toLowerCase()

        const isSuccess =
          statusStr === 'success' ||
          statusStr === 'ok' ||
          statusStr === 'true' ||
          json?.code === 200 ||
          json?.statusCode === 200

        let payloadData =
          json?.data ??
          json?.activity ??
          json?.record ??
          json?.doc ??
          json?.result?.data ??
          json?.rows

        if (!payloadData && json && typeof json === 'object' && !Array.isArray(json)) {
          const looksLikeActivity =
            ['actName', 'actDesc', 'actCityName', 'EnCityName', 'priceList', 'foodList', 'availList']
              .some((k) => k in json)
          if (looksLikeActivity && !('status' in json) && !('result' in json)) {
            payloadData = json
          }
        }

        if (!payloadData && Array.isArray(json) && json.length) {
          payloadData = json[0]
        }

        if (isSuccess && payloadData && Object.keys(payloadData).length > 0) {
          setData(payloadData)
        } else {
          const msg =
            (typeof json?.message === 'string' && json.message) ||
            (typeof json?.msg === 'string' && json.msg) ||
            'Failed to load activity.'
          const extra =
            msg.toLowerCase().includes('found') && !payloadData
              ? ' (but no activity data was returned)'
              : ''
          setError(msg + extra)
        }
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load activity.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [ActivityID, VendorID])

  return (
    <div className="act-detail-page">
      <div className="act-detail-shell">
        <div className="act-detail-top-title-row">
          <h4 className="act-detail-main-title act-detail-main-title-outside">
            {data?.actName || '—'}
          </h4>

          <button
            className="act-detail-back-btn"
            onClick={() => navigate(-1)}
            type="button"
          >
            <span className="act-detail-back-circle">
              <CIcon icon={cilArrowLeft} />
            </span>
            <span>Back</span>
          </button>
        </div>

        {loading && (
          <div className="act-detail-loading-box">
            <CSpinner />
          </div>
        )}

        {!loading && error && (
          <CAlert color="danger" className="act-detail-alert">
            {error}
          </CAlert>
        )}

        {/* Optional debug panel: add ?debug=1 to URL */}
        {!loading && debug && rawJson && (
          <CCard className="act-detail-card mb-3">
            <CCardHeader className="act-detail-card-header">Debug • Raw API JSON</CCardHeader>
            <CCardBody>
              <pre className="act-detail-debug-pre">
                {typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson, null, 2)}
              </pre>
            </CCardBody>
          </CCard>
        )}

        {!loading && !error && data && (
          <CCard className="act-detail-one-card">
            <CCardBody className="act-detail-one-card-body">
              {/* Header Section */}
              <div className="act-detail-hero-section">
                <CRow className="align-items-center">
                  <CCol md={8}>
                    <div className="act-detail-type-rating-row">
                      <div className="act-detail-type-box">
                        <span className="act-detail-type-label">Activity Type</span>
                        <span className="act-detail-type-value">{data.actTypeID || '—'}</span>
                      </div>

                      <div className="act-detail-rating-box act-detail-rating-box-inline">
                        <span className="act-detail-type-label">Rating</span>
                        <span className="act-detail-rating-pill">
                          <CIcon icon={cilStar} className="act-detail-rating-icon" />
                          <span>{data.actRating ?? '—'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="act-detail-chip-row act-detail-chip-row-hidden-title">
                      {data.vendorNo && <Chip color="#d63384">Code: {data.vendorNo}</Chip>}
                      {data.vdrStatus && (
                        <Chip color={(data.vdrStatus || '').toUpperCase() === 'ACTIVE' ? '#14532d' : '#C62828'}>
                          <CIcon icon={cilCheckCircle} className="act-detail-chip-icon" />
                          {data.vdrStatus}
                        </Chip>
                      )}
                    </div>
                  </CCol>
                  <CCol md={4} className="text-md-end text-start mt-3 mt-md-0 act-detail-old-rating-col">
                    <div className="act-detail-rating-pill">
                      <CIcon icon={cilStar} className="act-detail-rating-icon" />
                      <span>{data.actRating ?? '—'}</span>
                    </div>
                  </CCol>
                </CRow>
              </div>

              {/* Images */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilImage}>Images</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                  <ImageCarousel images={images} />
                </div>
              </div>

              {/* Basics */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilInfo}>Basic Information</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                <CRow>
                  <CCol md={6}>
                    <KeyValue label="Address" value={data.actAddress1 || '—'} />
                    {data.actAddress2 ? <KeyValue label="Address 2" value={data.actAddress2} /> : null}
                    <KeyValue label="Gender" value={data.actGender || '—'} />
                    <KeyValue label="Age Range" value={
                      [data.actMinAge, data.actMaxAge].filter(Boolean).join(' to ') || '—'
                    } />
                  </CCol>
                  <CCol md={6}>
                    <KeyValue label="Country" value={data.EnCountryName || data.actCountryName || data.actCountryID || '—'} />
                    <KeyValue label="City" value={data.EnCityName || data.actCityName || data.actCityID || '—'} />
                    <KeyValue label="Latitude" value={data.actGlat || '—'} />
                    <KeyValue label="Longitude" value={data.actGlan || '—'} />
                  </CCol>
                </CRow>
                </div>
              </div>

              {/* Description */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilDescription}>Description</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                {data.actDesc ? (
                  <div
                    className="act-detail-description"
                    dangerouslySetInnerHTML={{ __html: data.actDesc.replace(/\n/g, '<br/>') }}
                  />
                ) : (
                  <div className="act-detail-empty-box">—</div>
                )}
                </div>
              </div>

              {/* Categories */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilTags}>Categories</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                {categories.length === 0 ? (
                  <div className="act-detail-empty-box">—</div>
                ) : (
                  <div className="act-detail-category-list">
                    {categories.map((c, i) => (
                      <CBadge key={`${c}-${i}`} className="act-detail-category-badge">{c}</CBadge>
                    ))}
                  </div>
                )}
                </div>
              </div>

              {/* Prices */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilMoney}>Price Per Student</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                <PriceList prices={data.priceList || data.actPrice || []} />
                </div>
              </div>

              {/* Availability */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilCalendar}>Availability</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                <AvailabilityTable rows={availRows} />
                </div>
              </div>

              {/* Capacity */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilPeople}>Capacity</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                <CRow className="text-center">
                  <CCol md={6} className="mb-2">
                    <div className="act-detail-stat-card">
                      <div className="act-detail-stat-label">Minimum Students</div>
                      <div className="act-detail-stat-value">{data.actMinStudent ?? '—'}</div>
                    </div>
                  </CCol>
                  <CCol md={6} className="mb-2">
                    <div className="act-detail-stat-card">
                      <div className="act-detail-stat-label">Maximum Students</div>
                      <div className="act-detail-stat-value">{data.actMaxStudent ?? '—'}</div>
                    </div>
                  </CCol>
                </CRow>
                </div>
              </div>

              {/* Location */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilLocationPin}>Location</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                <KeyValue label="Google Map" value={
                  data.actGoogleMap ? (
                    <a className="act-detail-map-link" href={data.actGoogleMap} target="_blank" rel="noreferrer">
                      <CIcon icon={cilMap} />
                      <span>Open Map</span>
                    </a>
                  ) : '—'
                } />
                </div>
              </div>

              {/* Meals */}
              <div className="act-detail-section-block">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilRestaurant}>Meals</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                <Meals included={mealsIncluded} excluded={mealsExcluded} />
                </div>
              </div>

              {/* Terms */}
              <div className="act-detail-section-block act-detail-last-section">
                <div className="act-detail-card-header">
                  <SectionTitle icon={cilDescription}>Terms & Conditions</SectionTitle>
                </div>
                <div className="act-detail-section-body">
                {data.actAdminNotes ? <div className="act-detail-description">{data.actAdminNotes}</div> : <div className="act-detail-empty-box">—</div>}
                </div>
              </div>
            </CCardBody>
          </CCard>
        )}
      </div>
    </div>
  )
}

export default ActDetailInfo
