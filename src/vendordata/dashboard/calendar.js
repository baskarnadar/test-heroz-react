 import React, { useState } from 'react';

export default function Calendar({ initialYear, initialMonth, events }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [hoveredDay, setHoveredDay] = useState(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayIndex = new Date(year, month, 1).getDay();

  const today = new Date();

  // Map event type to route path
  const routeMap = {
    BOOKED: '/activity/booked',
    WAITING: '/activity/pending',
    REJECTED: '/activity/rejected',
  };

  return (
    <div style={{ maxWidth: 500, margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      {/* Navigation (optional) */}
      <h2 style={{ textAlign: 'center' }}>
        {new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}
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
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
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
          const dayEvents = events[day] || [];
          const hasEvents = dayEvents.length > 0;

          let backgroundColor = 'white';
          if (dayEvents.includes('BOOKED') && dayEvents.length === 1) {
            backgroundColor = 'green';
          } else if (dayEvents.includes('WAITING') && dayEvents.length === 1) {
            backgroundColor = 'orange';
          } else if (dayEvents.includes('REJECTED') && dayEvents.length === 1) {
            backgroundColor = 'red';
          } else if (dayEvents.length > 1) {
            backgroundColor = '#4a0d52';
          }

          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

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
                  const url = routeMap[ev] || '#';
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
                       
                      title={`Go to ${ev.toLowerCase()} activity page`}
                    >
                      {idx + 1}. {ev.toLowerCase()}
                    </a>
                  );
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
                  You have activity booked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
