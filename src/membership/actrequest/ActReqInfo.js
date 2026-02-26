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

// NOTE: this file lives in src/vendordata/activityinfo/activity/
// so config/utils are three levels up
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID, IsMemberShipLoginIsValid } from '../../utils/operation'

// ---------- Small helpers ----------
const SectionTitle = ({ children }) => (
  <div style={{ fontWeight: 700, fontSize: 18, margin: '16px 0 8px' }}>{children}</div>
)

const KeyValue = ({ label, value, strong }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
    <div style={{ fontWeight: 600, minWidth: 120 }}>{label}</div>
    <div style={{ fontWeight: strong ? 700 : 400 }}>{value ?? '—'}</div>
  </div>
)

const Chip = ({ children, color = '#6c757d' }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '4px 10px',
      margin: '4px',
      background: `${color}22`,
      color,
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    {children}
  </span>
)

const ImageCarousel = ({ images = [] }) => {
  const list = Array.isArray(images) ? images.filter(Boolean) : []
  if (!list.length) return null
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      {list.map((src, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }}>
          <img src={src} alt={`activity-${i}`} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
        </div>
      ))}
    </div>
  )
}

const AvailabilityTable = ({ rows = [] }) => {
  if (!rows?.length) return <div>—</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table table-sm">
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
  if (!prices?.length) return <div>—</div>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table table-sm">
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
      <SectionTitle>Included Meals</SectionTitle>
      {included.length === 0 ? (
        <div>—</div>
      ) : (
        included.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>{m.FoodName || '—'}</span>
            <Chip color="#198754">Included</Chip>
            {m.FoodNotes ? <span style={{ color: '#6c757d' }}>• {m.FoodNotes}</span> : null}
          </div>
        ))
      )}
    </CCol>
    <CCol md={6}>
      <SectionTitle>Additional Meals</SectionTitle>
      {excluded.length === 0 ? (
        <div>—</div>
      ) : (
        excluded.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontWeight: 600 }}>{m.FoodName || '—'}</span>
            <Chip color="#0d6efd">
              {typeof m.FoodPrice === 'number' ? m.FoodPrice : (m.FoodPrice || '—')}
            </Chip>
            {m.FoodNotes ? <span style={{ color: '#6c757d' }}>• {m.FoodNotes}</span> : null}
          </div>
        ))
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
    IsMemberShipLoginIsValid() // will redirect to BaseURL if token/usertype invalid
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
    <>
      <CRow className="mb-3">
        <CCol>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate(-1)}
            type="button"
          >
            ← Back
          </button>
        </CCol>
      </CRow>

      {loading && (
        <div className="text-center my-5">
          <CSpinner />
        </div>
      )}

      {!loading && error && (
        <CAlert color="danger">
          {error}
        </CAlert>
      )}

      {/* Optional debug panel: add ?debug=1 to URL */}
      {!loading && debug && rawJson && (
        <CCard className="mb-3">
          <CCardHeader>Debug • Raw API JSON</CCardHeader>
          <CCardBody>
            <pre style={{ maxHeight: 300, overflow: 'auto', background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
              {typeof rawJson === 'string' ? rawJson : JSON.stringify(rawJson, null, 2)}
            </pre>
          </CCardBody>
        </CCard>
      )}

      {!loading && !error && data && (
        <>
          {/* Header Card */}
          <CCard className="mb-3">
            <CCardBody>
              <CRow className="align-items-center">
                <CCol md={8}>
                  <h4 className="mb-2" style={{ fontWeight: 700 }}>{data.actName || '—'}</h4>
                  <div className="d-flex flex-wrap align-items-center" style={{ gap: 8 }}>
                    {data.vendorNo && <Chip color="#6f42c1">Code: {data.vendorNo}</Chip>}
                    {data.vdrStatus && (
                      <Chip color={(data.vdrStatus || '').toUpperCase() === 'ACTIVE' ? '#2E7D32' : '#C62828'}>
                        {data.vdrStatus}
                      </Chip>
                    )}
                    {data.actTypeID && <Chip>{data.actTypeID}</Chip>}
                  </div>
                </CCol>
                <CCol md={4} className="text-md-end text-start mt-3 mt-md-0">
                  <div className="d-inline-flex align-items-center gap-2">
                    <span className="text-warning" style={{ fontSize: 20 }}>★</span>
                    <span className="fw-bold" style={{ fontSize: 18 }}>
                      {data.actRating ?? '—'}
                    </span>
                  </div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Images */}
          <CCard className="mb-3">
            <CCardHeader>Images</CCardHeader>
            <CCardBody>
              <ImageCarousel images={images} />
            </CCardBody>
          </CCard>

          {/* Basics */}
          <CCard className="mb-3">
            <CCardHeader>Basic Information</CCardHeader>
            <CCardBody>
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
            </CCardBody>
          </CCard>

          {/* Description */}
          <CCard className="mb-3">
            <CCardHeader>Description</CCardHeader>
            <CCardBody>
              {data.actDesc ? (
                <div
                  style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: data.actDesc.replace(/\n/g, '<br/>') }}
                />
              ) : (
                <div>—</div>
              )}
            </CCardBody>
          </CCard>

          {/* Categories */}
          <CCard className="mb-3">
            <CCardHeader>Categories</CCardHeader>
            <CCardBody>
              {categories.length === 0 ? (
                <div>—</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {categories.map((c, i) => (
                    <CBadge key={`${c}-${i}`} color="secondary" className="me-1">{c}</CBadge>
                  ))}
                </div>
              )}
            </CCardBody>
          </CCard>

          {/* Prices */}
          <CCard className="mb-3">
            <CCardHeader>Price Per Student</CCardHeader>
            <CCardBody>
              <PriceList prices={data.priceList || data.actPrice || []} />
            </CCardBody>
          </CCard>

          {/* Availability */}
          <CCard className="mb-3">
            <CCardHeader>Availability</CCardHeader>
            <CCardBody>
              <AvailabilityTable rows={availRows} />
            </CCardBody>
          </CCard>

          {/* Capacity */}
          <CCard className="mb-3">
            <CCardHeader>Capacity</CCardHeader>
            <CCardBody>
              <CRow className="text-center">
                <CCol md={6} className="mb-2">
                  <div className="text-muted">Minimum Students</div>
                  <div className="fs-5 fw-bold">{data.actMinStudent ?? '—'}</div>
                </CCol>
                <CCol md={6} className="mb-2">
                  <div className="text-muted">Maximum Students</div>
                  <div className="fs-5 fw-bold">{data.actMaxStudent ?? '—'}</div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {/* Location */}
          <CCard className="mb-3">
            <CCardHeader>Location</CCardHeader>
            <CCardBody>
              <KeyValue label="Google Map" value={
                data.actGoogleMap ? (
                  <a href={data.actGoogleMap} target="_blank" rel="noreferrer">
                    Open Map
                  </a>
                ) : '—'
              } />
            </CCardBody>
          </CCard>

          {/* Meals */}
          <CCard className="mb-3">
            <CCardHeader>Meals</CCardHeader>
            <CCardBody>
              <Meals included={mealsIncluded} excluded={mealsExcluded} />
            </CCardBody>
          </CCard>

          {/* Terms */}
          <CCard className="mb-5">
            <CCardHeader>Terms & Conditions</CCardHeader>
            <CCardBody>
              {data.actAdminNotes ? <div style={{ whiteSpace: 'pre-wrap' }}>{data.actAdminNotes}</div> : '—'}
            </CCardBody>
          </CCard>
        </>
      )}
    </>
  )
}

export default ActDetailInfo
