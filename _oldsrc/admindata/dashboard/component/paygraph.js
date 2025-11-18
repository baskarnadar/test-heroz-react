// === Your requested import block (kept as-is) ===
import React from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../../config'
import {
  CCard,
  CCardBody,
  CCardHeader,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cibCcAmex,
  cibCcApplePay,
  cibCcMastercard,
  cibCcPaypal,
  cibCcStripe,
  cibCcVisa,
  cibGoogle,
  cibFacebook,
  cibLinkedin,
  cifBr,
  cifEs,
  cifFr,
  cifIn,
  cifPl,
  cifUs,
  cibTwitter,
  cilCloudDownload,
  cilUser,
  cilUserFemale,
} from '@coreui/icons'
// === end of your import block ===

import { getAuthHeaders } from '../../../utils/operation'

// === Chart.js + datalabels ===
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title, ChartDataLabels)

const monthName = (m) =>
  new Date(2000, (m ?? 1) - 1, 1).toLocaleString(undefined, { month: 'short' })

const randomColor = (i) => {
  const baseColors = [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
    '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ab',
  ]
  return baseColors[i % baseColors.length]
}

const PayGraph = ({
  apiUrl = `${API_BASE_URL}/admindata/dashboard/getdashboardPaySummary`,
  title = 'Total Students per Trip Request',
}) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [labels, setLabels] = useState([])
  const [seriesCounts, setSeriesCounts] = useState([])
  const [seriesAmounts, setSeriesAmounts] = useState([])
  const [barColors, setBarColors] = useState([])
  const [error, setError] = useState('')
  const [maxY, setMaxY] = useState(0)

  useEffect(() => {
    let alive = true
    const go = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            ...(typeof getAuthHeaders === 'function' ? getAuthHeaders() : {}),
          },
        })

        const contentType = res.headers.get('content-type') || ''
        const bodyText = await res.text()
        if (!contentType.includes('application/json')) {
          throw new Error(`Non-JSON response: ${contentType}`)
        }

        let json
        try {
          json = JSON.parse(bodyText)
        } catch {
          throw new Error('Response was not valid JSON.')
        }

        if (!res.ok) {
          const msg = json?.message || `HTTP ${res.status}`
          throw new Error(msg)
        }

        const arr = Array.isArray(json?.data) ? json.data : []
        // Filter: only show countPayments > 5
        const filtered = arr.filter((r) => Number(r?.countPayments ?? 0) > 5)

        // Sort by actName then date for stable ordering
        const sorted = [...filtered].sort((a, b) => {
          const an = String(a?.actName ?? '')
          const bn = String(b?.actName ?? '')
          if (an !== bn) return an.localeCompare(bn)
          const ay = Number(a?.PayYear ?? 0), by = Number(b?.PayYear ?? 0)
          if (ay !== by) return ay - by
          const am = Number(a?.PayMonth ?? 0), bm = Number(b?.PayMonth ?? 0)
          return am - bm
        })

        // ⬇️ Multi-line labels: ["Act Name", "(Mon YYYY)"]
        const outLabels = sorted.map((r) => {
          const act = String(r?.actName ?? '-').trim()
          const y = Number(r?.PayYear ?? 0)
          const m = Number(r?.PayMonth ?? 0)
          const when = y && m ? `(${monthName(m)} ${y})` : ''
          return [act, when] // Chart.js will render on two lines
        })

        const outCounts  = sorted.map((r) => Number(r?.countPayments     ?? 0))
        const outAmounts = sorted.map((r) => Number(r?.totalFullAmount   ?? 0))
        const outColors  = sorted.map((_, i) => randomColor(i))

        const maxCount = Math.max(...outCounts, 0)
        const adjustedMax = maxCount + 100 // headroom so top label never clips

        if (!alive) return
        setLabels(outLabels)
        setSeriesCounts(outCounts)
        setSeriesAmounts(outAmounts)
        setBarColors(outColors)
        setMaxY(adjustedMax)
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load pay summary')
      } finally {
        if (alive) setLoading(false)
      }
    }
    go()
    return () => { alive = false }
  }, [apiUrl])

  const data = {
    labels,
    datasets: [
      {
        label: 'Total Students',
        data: seriesCounts,
        backgroundColor: barColors,
        borderWidth: 1,
        datalabels: {
          align: 'end',
          anchor: 'end',
          color: '#111',
          font: { weight: 'bold', size: 14 },
          formatter: (value, ctx) => {
            const amt = seriesAmounts[ctx.dataIndex]
            return amt ? `${amt.toFixed(0)}` : ''
          },
        },
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false, text: title },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const amt = seriesAmounts[ctx.dataIndex]
            return `Students: ${ctx.parsed.y}, Amount: ${amt?.toFixed(0) ?? 0}`
          },
          // When labels are arrays, Chart.js joins them with newlines
          title: (items) => (Array.isArray(items?.[0]?.label) ? items[0].label.join(' ') : (items?.[0]?.label ?? '')),
        },
      },
      datalabels: { display: true },
    },
    scales: {
      x: {
        type: 'category',
        title: { display: true, text: 'Activity (Month Year)' },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
        },
        grid: { drawBorder: true },
      },
      y: {
        type: 'linear',
        title: { display: true, text: 'Total Students' },
        ticks: { precision: 0 },
        min: 0,
        max: maxY, // dynamic headroom
        grid: { drawBorder: true },
      },
    },
  }

  return (
    <CCard className="mb-4 shadow-sm">
      <CCardHeader>
        <strong>{title}</strong>
      </CCardHeader>
      <CCardBody style={{ height: 440 }}>
        {loading ? (
          <div className="text-body-secondary">Loading graph…</div>
        ) : error ? (
          <div className="text-danger" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        ) : (
          <Bar data={data} options={options} />
        )}
      </CCardBody>
    </CCard>
  )
}

export default PayGraph
