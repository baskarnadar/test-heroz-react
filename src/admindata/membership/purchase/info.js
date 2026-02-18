import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import '../../../scss/toast.css'
import { checkLogin } from '../../../utils/auth'
import { DspToastMessage, formatDate, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation'

const InvoiceInfo = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ✅ Admin login validation
  useEffect(() => {
    IsAdminLoginIsValid?.()
  }, [])

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

  useEffect(() => {
    let timer
    if (toastMessage) timer = setTimeout(() => setToastMessage(''), 2000)
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [toastMessage])

  // ✅ invoice passed from list page
  const invoiceFromState = useMemo(() => location?.state?.invoice || null, [location?.state])

  // ✅ URL fallback (for refresh/direct open)
  // ✅ ADDED: PaymentID (direct open)
  const urlParams = useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search || '')
      return {
        ParentsID: (sp.get('ParentsID') || '').toString().trim(),
        StarID: (sp.get('StarID') || '').toString().trim(),
        PaymentID: (sp.get('PaymentID') || '').toString().trim(),
      }
    } catch {
      return { ParentsID: '', StarID: '', PaymentID: '' }
    }
  }, [location.search])

  const [invoiceFromApi, setInvoiceFromApi] = useState(null)

  const fetchInvoiceByUrl = async (ParentsID, StarID) => {
    if (!ParentsID) return
    setLoading(true)
    setError('')
    try {
      const API = `${API_BASE_URL}/membership/purchase/getMemPurchaseList`
      const resp = await fetch(API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ prtuserid: ParentsID }),
      })

      const raw = await resp.text()
      let json = null
      try {
        json = JSON.parse(raw)
      } catch {}

      if (!resp.ok) throw new Error(json?.message || `Request failed (${resp.status})`)

      const list = Array.isArray(json?.data) ? json.data : []

      // ✅ prefer exact StarID match (clicked record)
      let found = null
      if (StarID) {
        found = list.find((x) => String(x?.StarID || '').trim() === String(StarID).trim()) || null
      }

      // ✅ fallback: newest purchase
      if (!found && list.length > 0) {
        list.sort((a, b) => new Date(b?.CreatedDate || 0) - new Date(a?.CreatedDate || 0))
        found = list[0] || null
      }

      setInvoiceFromApi(found)
    } catch (e) {
      setError(e?.message || 'Error loading invoice info')
      setInvoiceFromApi(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // If no state invoice, try URL fallback
    if (!invoiceFromState && urlParams.ParentsID) {
      fetchInvoiceByUrl(urlParams.ParentsID, urlParams.StarID)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceFromState, urlParams.ParentsID, urlParams.StarID])

  const invoice = invoiceFromState || invoiceFromApi

  const safe = (v, fallback = '-') => {
    if (v === null || v === undefined) return fallback
    const s = String(v).trim()
    return s ? s : fallback
  }

  const safeNum = (v, fallback = 0) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }

  const info = useMemo(() => {
    const reg = invoice?.RegInfo || null
    const prod = invoice?.ProductInfo || null

    const starIsActiveBool = invoice?.StarIsActive === true
    const validFrom = invoice?.StarValidPeriodFrom ? new Date(invoice?.StarValidPeriodFrom) : null
    const validTo = invoice?.StarValidPeriodTo ? new Date(invoice?.StarValidPeriodTo) : null
    const now = new Date()

    const isValidRange =
      validFrom instanceof Date &&
      !Number.isNaN(validFrom.getTime()) &&
      validTo instanceof Date &&
      !Number.isNaN(validTo.getTime()) &&
      now >= validFrom &&
      now <= validTo

    // ✅ "Star Valid means Active" => highlight when valid in date range (or StarIsActive true if no dates)
    const isStarValidActive = isValidRange || (starIsActiveBool && !validFrom && !validTo)

    // ✅ PaymentID priority:
    // 1) URL PaymentID (direct open)
    // 2) invoice.PayPaymentID
    const payPaymentId =
      safe(urlParams?.PaymentID) !== '-' ? safe(urlParams?.PaymentID) : safe(invoice?.PayPaymentID)

    const invoiceUrl =
      payPaymentId && payPaymentId !== '-'
        ? `https://sa.myfatoorah.com/Ar/SAU/PayInvoice/Result?paymentId=${encodeURIComponent(
            payPaymentId,
          )}`
        : ''

    // ✅ If invoice missing, still allow showing Payment section with button (if PaymentID exists)
    if (!invoice) {
      return {
        isStarValidActive: false,
        invoiceUrl,

        PayRefNo: '-',
        PayInvoiceID: '-',
        PayPaymentID: payPaymentId,
        PurchaseDate: '-',

        TotalStar: 0,
        TotalStarAmount: 0,

        RegUserFullName: '-',
        RegUserMobileNo: '-',
        RegUserEmailAddress: '-',

        ProductName: '-',
        ProductAmount: '-',
        ProductTotalStar: '-',
        IsDataStatus: '-',
        ProductCreatedDate: '-',
        ProductModifyDate: '-',

        StarIsActive: 'No',
        StarValidPeriodFrom: '-',
        StarValidPeriodTo: '-',
      }
    }

    return {
      // Flags
      isStarValidActive,
      invoiceUrl,

      // Purchase (keep in info, but we'll hide StarID in UI)
      StarID: safe(invoice?.StarID),
      PayRefNo: safe(invoice?.PayRefNo),
      PayInvoiceID: safe(invoice?.PayInvoiceID),
      PayPaymentID: payPaymentId,

      // ✅ hidden fields (do NOT show)
      ParentsID: safe(invoice?.ParentsID),
      prtuserid: safe(reg?.prtuserid),

      ProductID: safe(invoice?.ProductID),
      TotalStar: safeNum(invoice?.TotalStar, 0),
      TotalStarAmount: safeNum(invoice?.TotalStarAmount, 0),
      StarIsActive: starIsActiveBool ? 'Yes' : 'No',
      StarValidPeriodFrom: invoice?.StarValidPeriodFrom ? formatDate(invoice?.StarValidPeriodFrom) : '-',
      StarValidPeriodTo: invoice?.StarValidPeriodTo ? formatDate(invoice?.StarValidPeriodTo) : '-',
      PurchaseDate: invoice?.CreatedDate ? formatDate(invoice?.CreatedDate) : '-',

      // RegInfo
      RegUserFullName: safe(reg?.RegUserFullName),
      RegUserMobileNo: safe(reg?.RegUserMobileNo),
      RegUserEmailAddress: safe(reg?.RegUserEmailAddress),

      // ProductInfo (keep in info, but hide ProductImage + ProductID in UI)
      ProductName: safe(prod?.ProductName),
      ProductAmount: prod?.ProductAmount ?? '-',
      ProductTotalStar: prod?.ProductTotalStar ?? '-',
      ProductImage: safe(prod?.ProductImage),
      IsDataStatus:
        prod?.IsDataStatus === true ? 'Yes' : prod?.IsDataStatus === false ? 'No' : '-',
      ProductCreatedDate: prod?.CreatedDate ? formatDate(prod?.CreatedDate) : '-',
      ProductModifyDate: prod?.ModifyDate ? formatDate(prod?.ModifyDate) : '-',
    }
  }, [invoice, urlParams?.PaymentID])

  const goBack = () => {
    navigate('/admindata/membership/purchase/list')
  }

  const Section = ({ title, children, highlight = false }) => (
    <div
      style={{
        border: highlight ? '2px solid #1aa34a' : '1px solid #eee',
        borderRadius: highlight ? 16 : 12,
        background: '#fff',
        padding: 14,
        marginBottom: 12,
        boxShadow: highlight ? '0 0 0 4px rgba(26,163,74,0.08)' : 'none',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )

  const Row = ({ label, value }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px dashed #eee',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, wordBreak: 'break-word' }}>{value}</div>
    </div>
  )

  const openInvoice = () => {
    if (!info?.invoiceUrl) return
    window.open(info.invoiceUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button className="admin-buttonv1" onClick={goBack}>
            ← Return
          </button>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Invoice Info</div>
        </div>
        <p>Loading...</p>
        <DspToastMessage message={toastMessage} type={toastType} />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button className="admin-buttonv1" onClick={goBack}>
            ← Return
          </button>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Invoice Info</div>
        </div>

        <div
          style={{
            padding: 14,
            border: '1px solid #eee',
            borderRadius: 12,
            background: '#fff',
            color: '#cf2037',
          }}
        >
          {error}
        </div>

        <DspToastMessage message={toastMessage} type={toastType} />
      </div>
    )
  }

  // ✅ If invoice missing, still show Payment section if PaymentID exists
  if (!invoice || !info) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button className="admin-buttonv1" onClick={goBack}>
            ← Return
          </button>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Invoice Info</div>
        </div>

        <Section title="Payment / Invoice Info">
          <Row label="Pay Ref No" value={safe(info?.PayRefNo)} />
          <Row label="Pay Invoice ID" value={safe(info?.PayInvoiceID)} />
          <Row label="Pay Payment ID" value={safe(info?.PayPaymentID)} />
          <Row label="Purchase Date" value={safe(info?.PurchaseDate)} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              className="admin-buttonv1"
              onClick={openInvoice}
              disabled={!info?.invoiceUrl}
              title={info?.invoiceUrl ? 'Open invoice in MyFatoorah' : 'No PaymentID found'}
              style={{
                border: '2px solid #1aa34a',
                background: 'rgba(26,163,74,0.5)',
                color: '#0b3d1f',
                fontWeight: 900,
                opacity: info?.invoiceUrl ? 1 : 0.6,
              }}
            >
              View Invoice
            </button>
          </div>
        </Section>

        <div
          style={{
            padding: 14,
            border: '1px solid #eee',
            borderRadius: 12,
            background: '#fff',
            color: '#777',
          }}
        >
          No invoice data found. Please go back and click a record.
        </div>

        <DspToastMessage message={toastMessage} type={toastType} />
      </div>
    )
  }

  return (
    <div>
      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button className="admin-buttonv1" onClick={goBack}>
          ← Return
        </button>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Invoice Info</div>

        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
          Purchase Date: <strong>{info.PurchaseDate}</strong>
        </div>
      </div>

      {/* QUICK SUMMARY */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e5e5',
            borderRadius: 12,
            background: '#fff',
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 12, color: '#666' }}>Total Stars</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{info.TotalStar}</div>
        </div>

        <div
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e5e5',
            borderRadius: 12,
            background: '#fff',
            minWidth: 220,
          }}
        >
          <div style={{ fontSize: 12, color: '#666' }}>Total Amount</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{info.TotalStarAmount}</div>
        </div>

        <div
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e5e5',
            borderRadius: 12,
            background: '#fff',
            minWidth: 260,
          }}
        >
          <div style={{ fontSize: 12, color: '#666' }}>Pay Ref No</div>
          <div style={{ fontSize: 16, fontWeight: 900, wordBreak: 'break-word' }}>
            {info.PayRefNo}
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <Section title="Customer Info">
        <Row label="Name" value={info.RegUserFullName} />
        <Row label="Mobile No" value={info.RegUserMobileNo} />
        <Row label="Email" value={info.RegUserEmailAddress} />
        {/* ✅ DO NOT SHOW prtuserid / ParentsID */}
      </Section>

      <Section title="Product Info">
        <Row label="Product Name" value={info.ProductName} />
        <Row label="Product Amount" value={String(info.ProductAmount)} />
        <Row label="Product Total Star" value={String(info.ProductTotalStar)} />
        {/* ✅ REMOVED FROM UI: Product Image */}
        <Row label="Is Data Status" value={info.IsDataStatus} />
        <Row label="Product Created Date" value={info.ProductCreatedDate} />
        <Row label="Product Modify Date" value={info.ProductModifyDate} />
        {/* ✅ REMOVED FROM UI: ProductID */}
      </Section>

      {/* ✅ RESTORED: all payment info rows + button */}
      <Section title="Payment / Invoice Info">
        <Row label="Pay Ref No" value={info.PayRefNo} />
        <Row label="Pay Invoice ID" value={info.PayInvoiceID} />
        <Row label="Pay Payment ID" value={info.PayPaymentID} />
        <Row label="Purchase Date" value={info.PurchaseDate} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            className="admin-buttonv1"
            onClick={openInvoice}
            disabled={!info.invoiceUrl}
            title={info.invoiceUrl ? 'Open invoice in MyFatoorah' : 'No PayPaymentID found for this record'}
            style={{
              border: '2px solid #1aa34a',
              background: 'rgba(26,163,74,0.5)',
              color: '#0b3d1f',
              fontWeight: 900,
              opacity: info.invoiceUrl ? 1 : 0.6,
            }}
          >
            View Invoice
          </button>
        </div>
      </Section>

      {/* ✅ Highlight green when "Star Valid means Active" */}
      <Section title="Star Card Info" highlight={info.isStarValidActive}>
        {/* ✅ REMOVED FROM UI: StarID */}
        <Row label="Total Stars" value={String(info.TotalStar)} />
        <Row label="Total Amount" value={String(info.TotalStarAmount)} />
        <Row label="Active" value={info.StarIsActive} />
        <Row label="Valid From" value={info.StarValidPeriodFrom} />
        <Row label="Valid To" value={info.StarValidPeriodTo} />
      </Section>

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  )
}

export default InvoiceInfo
