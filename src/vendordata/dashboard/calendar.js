// src/components/Calendar.jsx
import React, { useEffect, useState } from 'react'

// 🔤 i18n packs (default Arabic if not set)
import enPack from '../../i18n/enloc100.json'
import arPack from '../../i18n/arloc100.json'

export default function Calendar({ initialYear, initialMonth, events }) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [hoveredDay, setHoveredDay] = useState(null)

  // ---- i18n (local, no provider) ----
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      return v === 'ar' || v === 'en' ? v : 'ar' // default AR
    } catch {
      return 'ar'
    }
  }
  const [lang, setLang] = useState(getStoredLang())
  const dict = lang === 'ar' ? arPack : enPack
  const tr = (key, fallback) => (dict && dict[key]) || fallback

  // react to global header toggle (if used elsewhere)
  useEffect(() => {
    const onChange = () => setLang(getStoredLang())
    window.addEventListener('heroz_lang_changed', onChange)
    return () => window.removeEventListener('heroz_lang_changed', onChange)
  }, [])
  // ------------------------------------

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const firstDayIndex = new Date(year, month, 1).getDay()

  const today = new Date()
  const locale = lang === 'ar' ? 'ar' : 'en'

  // Map event type to route path (unchanged)
  const routeMap = {
    BOOKED: '/activity/booked',
    WAITING: '/activity/pending',
    REJECTED: '/activity/rejected',
  }

  // Localized labels
  const dayNames = [
    tr('wkSun', 'Sun'),
    tr('wkMon', 'Mon'),
    tr('wkTue', 'Tue'),
    tr('wkWed', 'Wed'),
    tr('wkThu', 'Thu'),
    tr('wkFri', 'Fri'),
    tr('wkSat', 'Sat'),
  ]

  const labelMap = {
    BOOKED: tr('evtBooked', 'Booked'),
    WAITING: tr('evtWaiting', 'Pending'),
    REJECTED: tr('evtRejected', 'Rejected'),
  }

  return (
    <div style={{ maxWidth: 500, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Month / Year */}
      <h2 style={{ textAlign: 'center' }}>
        {new Date(year, month).toLocaleString(locale, { month: 'long', year: 'numeric' })}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 8,
          textAlign: 'center',
        }}
      >
        {/* Weekday headers */}
        {dayNames.map((day) => (
          <div key={day} style={{ fontWeight: 'bold' }}>
            {day}
          </div>
        ))}

        {/* Empty slots before the first day of the month */}
        {Array(firstDayIndex)
          .fill(null)
          .map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

        {/* Day cells */}
        {daysArray.map((day) => {
          const dayEvents = events[day] || []
          const hasEvents = dayEvents.length > 0

          let backgroundColor = 'white'
          if (dayEvents.includes('BOOKED') && dayEvents.length === 1) {
            backgroundColor = 'green'
          } else if (dayEvents.includes('WAITING') && dayEvents.length === 1) {
            backgroundColor = 'orange'
          } else if (dayEvents.includes('REJECTED') && dayEvents.length === 1) {
            backgroundColor = 'red'
          } else if (dayEvents.length > 1) {
            backgroundColor = '#4a0d52'
          }

          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()

          return (
            <div
              key={day}
              onMouseEnter={() => hasEvents && setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              style={{
                border: '1px solid #4a0d52',
                borderRadius: 6,
                padding: 6,
                color: hasEvents ? 'white' : '#000',
                backgroundColor: hasEvents ? backgroundColor : isToday ? '#def' : 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                cursor: hasEvents ? 'pointer' : 'default',
                fontSize: '12px',
              }}
            >
              <div style={{ fontWeight: 'normal', marginBottom: 4 }}>{day}</div>

              {hasEvents &&
                dayEvents.map((ev, idx) => {
                  const url = routeMap[ev] || '#'
                  const label = labelMap[ev] || ev
                  return (
                    <a
                      key={idx}
                      href={url}
                      style={{
                        fontSize: '0.6rem',
                        textTransform: 'lowercase',
                        color: '#fff',
                        borderRadius: 3,
                        backgroundColor:
                          ev.toLowerCase() === 'booked'
                            ? 'green'
                            : ev.toLowerCase() === 'rejected'
                            ? 'red'
                            : 'gray',
                        marginTop: 2,
                        padding: '2px 4px',
                        width: '100%',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                      title={tr('calGoToActivity', 'Go to {type} activity page').replace('{type}', (label || '').toLowerCase())}
                    >
                      {idx + 1}. {(label || '').toLowerCase()}
                    </a>
                  )
                })}

              {hoveredDay === day && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '100%',
                    backgroundColor: '#4a0d52',
                    color: 'white',
                    padding: '6px 8px',
                    borderRadius: 6,
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                    transform: 'translateY(-8px)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  {tr('calBookedTooltip', 'You have activity booked')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
