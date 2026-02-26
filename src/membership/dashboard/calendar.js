// src/membership/dashboard/calender.js
import React, { useEffect, useMemo, useState } from 'react'

// 🔤 i18n packs (default Arabic if not set)
import enPack from '../../i18n/enloc100.json'
import arPack from '../../i18n/arloc100.json'

const pad2 = (n) => String(n).padStart(2, '0')
const toYMD = (y, m0, d) => `${y}-${pad2(m0 + 1)}-${pad2(d)}`

export default function Calendar({
  initialYear,
  initialMonth, // 0-based
  bookings = [], // BookingList from API
  onDayClick, // (ymd, listForDate) => void
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)

  // ---- i18n (local, no provider) ----
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
  // ------------------------------------

  const locale = lang === 'ar' ? 'ar' : 'en'

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysArray = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => i + 1),
    [daysInMonth],
  )
  const firstDayIndex = new Date(year, month, 1).getDay()

  const today = new Date()
  const todayYMD = toYMD(today.getFullYear(), today.getMonth(), today.getDate())

  // ✅ Build map by BookingActivityDate: "YYYY-MM-DD"
  const dateMap = useMemo(() => {
    const map = {}
    for (const b of bookings || []) {
      const date = String(b?.BookingActivityDate || '').trim()
      if (!date) continue

      if (!map[date]) {
        map[date] = { list: [], hasBooked: false, hasCompleted: false }
      }
      map[date].list.push(b)

      const st = String(b?.BookingStatus || b?.BookingStatusName || '').toUpperCase()
      if (st === 'BOOKED') map[date].hasBooked = true
      if (st === 'COMPLETED') map[date].hasCompleted = true
    }
    return map
  }, [bookings])

  const dayNames = [
    tr('wkSun', 'Sun'),
    tr('wkMon', 'Mon'),
    tr('wkTue', 'Tue'),
    tr('wkWed', 'Wed'),
    tr('wkThu', 'Thu'),
    tr('wkFri', 'Fri'),
    tr('wkSat', 'Sat'),
  ]

  const goPrev = () => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1)
        return 11
      }
      return m - 1
    })
  }

  const goNext = () => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1)
        return 0
      }
      return m + 1
    })
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Month / Year header with arrows */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 12,
          userSelect: 'none',
        }}
      >
        <button
          type="button"
          onClick={goPrev}
          style={{
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: 6,
            padding: '2px 8px',
            cursor: 'pointer',
          }}
          aria-label="Previous month"
        >
          ◀
        </button>

        <h3 style={{ margin: 0, fontWeight: 700 }}>
          {new Date(year, month).toLocaleString(locale, { month: 'long', year: 'numeric' })}
        </h3>

        <button
          type="button"
          onClick={goNext}
          style={{
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: 6,
            padding: '2px 8px',
            cursor: 'pointer',
          }}
          aria-label="Next month"
        >
          ▶
        </button>
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 10,
          textAlign: 'center',
        }}
      >
        {/* Weekday headers */}
        {dayNames.map((day) => (
          <div key={day} style={{ fontWeight: 700, color: '#198754' }}>
            {day}
          </div>
        ))}

        {/* Empty slots */}
        {Array(firstDayIndex)
          .fill(null)
          .map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

        {/* Day cells */}
        {daysArray.map((day) => {
          const ymd = toYMD(year, month, day)
          const info = dateMap[ymd] || { list: [], hasBooked: false, hasCompleted: false }
          const hasAny = info.list.length > 0
          const isToday = ymd === todayYMD

          return (
            <div
              key={ymd}
              onClick={() => {
                if (!hasAny) return
                onDayClick?.(ymd, info.list)
              }}
              style={{
                border: '1px solid #e6e6e6',
                borderRadius: 10,
                padding: 14,
                background: isToday ? '#EAF4FF' : '#fff',
                minHeight: 68,
                position: 'relative',
                cursor: hasAny ? 'pointer' : 'default',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
              title={hasAny ? tr('calClickToView', 'Click to view activities') : tr('calNoActivity', 'No activity')}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{day}</div>

              {/* ✅ circles (green booked, red completed) */}
              <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                {info.hasBooked && (
                  <span
                    style={{ width: 12, height: 12, borderRadius: '50%', background: '#16a34a' }}
                    title={tr('calBooked', 'Booked')}
                  />
                )}
                {info.hasCompleted && (
                  <span
                    style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }}
                    title={tr('calCompleted', 'Completed')}
                  />
                )}
              </div>

              {hasAny && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  {tr('calTotal', 'Total')}: {info.list.length}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}