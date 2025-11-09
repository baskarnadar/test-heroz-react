// src/pages/vendor/VendorInfoPage.js
import React, { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../../config'
import { getAuthHeaders, getCurrentLoggedUserID, IsVendorLoginIsValid } from '../../utils/operation'

/** ============== Localization placeholders (replace with your i18n) ============== */
const L = {
  ar_err_missingVendorID: 'Missing Vendor ID.',
  ar_err_unexpectedResponse: 'Unexpected response.',
  ar_err_requestFailed: 'Request failed',
  err_genericPrefix: 'Error:',
  err_noData: 'No data.',
  retry: 'Retry',
  copy: 'Copy',
  dash: '—',
  code_short: 'Code',
  table_day: 'Day',
  table_start: 'Start',
  table_end: 'End',
  table_note: 'Note',
  ar_info_title: 'Vendor Information',
}

/** ============== Label map (kept from Flutter) ============== */
export const kVendorLabels = {
  // Identity
  _id: 'Record ID',
  VendorID: 'Vendor ID',
  vendorNo: 'Vendor Code',
  vdrName: 'Vendor Name',
  vdrClubName: 'Club/Company Name',
  vdrStatus: 'Status',
  IsDataStatus: 'Data Status',
  CreatedDate: 'Created On',
  ModifyDate: 'Modified On',
  CreatedBy: 'Created By',
  ModifyBy: 'Modified By',

  // Contact
  vdrEmailAddress: 'Email',
  vdrMobileNo1: 'Mobile (Primary)',
  vdrMobileNo2: 'Mobile (Secondary)',

  // Description
  vdrDesc: 'Description',
  vdrLevel: 'Level',
  vdrCategoryID: 'Categories',

  // Address
  vdrAddress1: 'Address Line 1',
  vdrAddress2: 'Address Line 2',
  vdrRegionName: 'Region',
  vdrZipCode: 'Zip Code',

  // Socials / Web
  vdrWebsiteAddress: 'Website',
  vdrInstagram: 'Instagram',
  vdrFaceBook: 'Facebook',
  vdrX: 'X (Twitter)',
  vdrSnapChat: 'Snapchat',
  vdrTikTok: 'TikTok',
  vdrYouTube: 'YouTube',

  // Banking / Tax
  vdrBankName: 'Bank Name',
  vdrAccHolderName: 'Account Holder',
  vdrAccIBANNo: 'IBAN',
  vdrTaxName: 'Tax Document Name',
  vdrTaxFileName: 'Tax File Name',

  // Services / Pricing
  vdrIsBirthDayService: 'Birthday Service',
  vdrCapacity: 'Capacity',
  vdrPricePerPerson: 'Price Per Person',

  // Certificates
  vdrCertificateName: 'Certificate Name',
  vdrCertificateFileName: 'Certificate File',

  // Hours
  OfficeOpenHours: 'Office Open Hours',

  // Admin
  vdrAdminNotes: 'Admin Notes',
}

const VDR_INFO = `${API_BASE_URL}/vendordata/vendor/getvendor` // <-- adjust to your real path

/** ===================== Utilities ===================== */
const formatIsoDate = (value) => {
  const raw = String(value ?? '')
  if (!raw) return L.dash
  const dt = new Date(raw)
  if (isNaN(dt.getTime())) return raw
  const two = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${two(dt.getMonth() + 1)}-${two(dt.getDate())} ${two(
    dt.getHours(),
  )}:${two(dt.getMinutes())}:${two(dt.getSeconds())}`
}

const maskIban = (value) => {
  const v = String(value ?? '').replace(/\s+/g, '')
  if (!v) return L.dash
  const last4 = v.slice(-4)
  const masked = `${'*'.repeat(Math.max(0, v.length - 4))}${last4}`
  return masked.replace(/(.{4})/g, '$1 ').trim()
}

const formatValue = (v) => {
  if (v == null) return L.dash
  if (typeof v === 'string' && v.trim() === '') return L.dash
  if (Array.isArray(v)) return v.map((e) => (e == null ? L.dash : String(e))).join(', ')
  if (typeof v === 'object') return JSON.stringify(v, null, 2)
  return String(v)
}

/** ===================== Subcomponents ===================== */

const ErrorView = ({ message, onRetry }) => (
  <div style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
    <div style={{ maxWidth: 420 }}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ color: '#e57373', fontSize: 48 }}>⚠️</span>
      </div>
      <p style={{ textAlign: 'center', marginBottom: 16 }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button onClick={onRetry} style={{ padding: '8px 12px' }}>
          🔄 {L.retry}
        </button>
      </div>
    </div>
  </div>
)

const Avatar = ({ imgUrl, fallbackLetter }) => {
  const [error, setError] = useState(false)
  const hasImg = !!imgUrl && !error
  return (
    <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', background: '#eee' }}>
      {hasImg ? (
        <img
          src={imgUrl}
          alt="logo"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setError(true)}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: '#555',
          }}
        >
          <strong style={{ fontSize: 28 }}>{fallbackLetter || 'V'}</strong>
        </div>
      )}
    </div>
  )
}

const HeaderCard = ({ vendor }) => {
  const imgUrl = String(vendor.vdrImageNameURL || vendor.vdrImageNameUrl || '')

  const name = String(vendor.vdrName || '')
  const code = String(vendor.vendorNo || '')
  const status = String(vendor.vdrStatus || '')
  const initial = name ? name[0].toUpperCase() : 'V'

  const statusColor = useMemo(() => {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return '#2E7D32'
      case 'INACTIVE':
        return '#C62828'
      default:
        return '#455A64'
    }
  }, [status])

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid #eee',
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <Avatar imgUrl={imgUrl} fallbackLetter={initial} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700 }}>{name || L.dash}</div>
        {code && (
          <span
            style={{
              border: '1px solid #ddd',
              borderRadius: 999,
              padding: '4px 10px',
              background: '#fafafa',
              fontWeight: 600,
            }}
          >
            {L.code_short}: {code}
          </span>
        )}
        {status && (
          <span
            style={{
              borderRadius: 999,
              padding: '4px 10px',
              background: `${statusColor}22`,
              color: statusColor,
              fontWeight: 700,
            }}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  )
}

/** renderers: use consistent font sizes */
const renderLinkText = (value) => {
  const text = String(value ?? '').trim()
  if (!text) return <span>{L.dash}</span>
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <a href={text} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
        {text}
      </a>
      <button onClick={copy} title={L.copy} style={{ padding: '2px 6px' }}>
        📋
      </button>
    </div>
  )
}

const renderMonospace = (value) => {
  const text = String(value ?? '')
  return (
    <span
      style={{
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      }}
    >
      {text || L.dash}
    </span>
  )
}

const renderOfficeHours = (value) => {
  if (!value || typeof value !== 'object' || !Array.isArray(value.rows))
    return <span>{L.dash}</span>
  const rows = value.rows
  if (!rows.length) return <span>{L.dash}</span>

  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          background: '#faf8ff',
          border: '1px solid #e6e1f2',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F6F2FF' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>{L.table_day}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{L.table_start}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{L.table_end}</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>{L.table_note}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: '8px', whiteSpace: 'nowrap', overflowX: 'auto' }}>
                  {r.DayName || L.dash}
                </td>
                <td style={{ padding: '8px' }}>{r.StartTime || L.dash}</td>
                <td style={{ padding: '8px' }}>{r.EndTime || L.dash}</td>
                <td style={{ padding: '8px' }}>{r.Note || L.dash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** ===================== Fields Card ===================== */
const CustomizableFieldsCard = ({
  vendor,
  order = [],
  labels = {},
  renderers = {},
  hide = new Set(),
  blockKeys = new Set(['OfficeOpenHours']),
}) => {
  // order first, then the rest alphabetical, excluding hidden
  const allKeys = new Set(Object.keys(vendor || {}))
  const ordered = order.filter((k) => allKeys.has(k) && !hide.has(k))
  const remaining = Array.from(allKeys)
    .filter((k) => !hide.has(k) && !ordered.includes(k))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  const keys = [...ordered, ...remaining]

  return (
    <div style={{ borderRadius: 16, border: '1px solid #eee', padding: 12 }}>
      <div style={{ height: 8 }} />
      <hr style={{ border: 0, borderTop: '1px solid #eee', margin: 0 }} />

      {keys.map((key, i) => {
        const value = vendor[key]
        const label = labels[key] ?? key
        const custom = renderers[key]
        const isBlock = blockKeys.has(key)

        if (isBlock) {
          return (
            <div key={key}>
              <div style={{ padding: '10px 0' }}>
                <div style={{ fontWeight: 700, color: '#111', marginBottom: 8 }}>
                  {label}
                </div>
                <div>
                  {custom ? (
                    custom(value)
                  ) : (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {formatValue(value)}
                    </pre>
                  )}
                </div>
              </div>
              {i !== keys.length - 1 && (
                <hr
                  style={{ border: 0, borderTop: '1px solid #eee', margin: 0 }}
                />
              )}
            </div>
          )
        }

        return (
          <div key={key}>
            <div style={{ padding: '10px 0', display: 'flex', gap: 16 }}>
              <div style={{ flex: 2, fontWeight: 600, color: '#111' }}>
                {label}
              </div>
              <div style={{ flex: 3 }}>
                {custom ? (
                  custom(value)
                ) : (
                  <span>{formatValue(value)}</span>
                )}
              </div>
            </div>
            {i !== keys.length - 1 && (
              <hr
                style={{ border: 0, borderTop: '1px solid #eee', margin: 0 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** ===================== Main Component ===================== */
const VendorInfoPage = ({
  /** Optional label overrides (will be merged with kVendorLabels) */
  customLabels,
  /** Force text direction: 'rtl' | 'ltr' */
  dir = 'ltr',
  /** Optional: pass a custom endpoint if different */
  endpoint = VDR_INFO,
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vendor, setVendor] = useState(null)

  // ✅ vendor-login validation (same pattern as other pages)
  useEffect(() => {
    IsVendorLoginIsValid?.()
  }, [])

  const fetchVendor = async ({ vendorID } = {}) => {
    const id = String(vendorID ?? getCurrentLoggedUserID() ?? '').trim()
    if (!id) {
      setLoading(false)
      setError(L.ar_err_missingVendorID)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ VendorID: id }),
      })
      if (!resp.ok) {
        setError(`${L.ar_err_requestFailed} (${resp.status}).`)
        return
      }
      const json = await resp.json()
      if (json?.status === 'success' && json?.data && typeof json.data === 'object') {
        setVendor(json.data)
      } else {
        setError(L.ar_err_unexpectedResponse)
      }
    } catch (e) {
      setError(`${L.err_genericPrefix} ${e}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mergedLabels = useMemo(
    () => ({ ...kVendorLabels, ...(customLabels || {}) }),
    [customLabels],
  )

  const hide = useMemo(
    () =>
      new Set([
        '_id',
        'VendorID',
        'IsDataStatus',
        'CreatedBy',
        'ModifyBy',
        'vdrCityID',
        'vdrCountryID',
        'vdCountryID',
        'vdrImageName',
        'VdrImageName',
        'vdrImageNameURL',
        'vdrImageNameUrl',
      ]),
    [],
  )

  const renderers = useMemo(
    () => ({
      vdrWebsiteAddress: (v) => renderLinkText(v),
      vdrInstagram: (v) => renderLinkText(v),
      vdrFaceBook: (v) => renderLinkText(v),
      vdrX: (v) => renderLinkText(v),
      vdrSnapChat: (v) => renderLinkText(v),
      vdrTikTok: (v) => renderLinkText(v),
      vdrYouTube: (v) => renderLinkText(v),

      vdrEmailAddress: (v) => renderMonospace(v),
      vdrAccIBANNo: (v) => renderMonospace(maskIban(v)),
      CreatedDate: (v) => renderMonospace(formatIsoDate(v)),
      ModifyDate: (v) => renderMonospace(formatIsoDate(v)),
      vdrMobileNo1: (v) => renderMonospace(v),
      vdrMobileNo2: (v) => renderMonospace(v),

      OfficeOpenHours: (v) => renderOfficeHours(v),
    }),
    [],
  )

  const order = useMemo(
    () => [
      'vdrName',
      'vendorNo',
      'vdrStatus',
      'vdrDesc',

      'vdrEmailAddress',
      'vdrMobileNo1',
      'vdrMobileNo2',

      'vdrWebsiteAddress',
      'vdrInstagram',
      'vdrFaceBook',
      'vdrX',
      'vdrSnapChat',
      'vdrTikTok',
      'vdrYouTube',

      'vdrAddress1',
      'vdrAddress2',
      'vdrRegionName',
      'vdrZipCode',

      'vdrBankName',
      'vdrAccHolderName',
      'vdrAccIBANNo',

      'vdrTaxName',
      'vdrTaxFileName',

      'OfficeOpenHours',

      'vdrLevel',
      'vdrCategoryID',
      'vdrIsBirthDayService',
      'vdrCapacity',
      'vdrPricePerPerson',

      'CreatedDate',
      'ModifyDate',

      'vdrAdminNotes',
    ],
    [],
  )

  return (
    <div dir={dir} style={{ padding: '2rem 5vw' }}>
      <h2 style={{ marginBottom: 16 }}>{L.ar_info_title}</h2>

      {loading && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div className="spinner-border" role="status" />
        </div>
      )}

      {!loading && error && (
        <ErrorView
          message={error}
          onRetry={() => fetchVendor()}
        />
      )}

      {!loading && !error && vendor && (
        <>
          <HeaderCard vendor={vendor} />
          <div style={{ height: 16 }} />
          <CustomizableFieldsCard
            vendor={vendor}
            order={order}
            labels={mergedLabels}
            renderers={renderers}
            hide={hide}
            blockKeys={new Set(['OfficeOpenHours'])}
          />
        </>
      )}
    </div>
  )
}

export default VendorInfoPage
