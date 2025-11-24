// src/admindata/activityinfo/activity/tripsummaryvat.js
import React from 'react'

const TripSummaryVat = ({
  vatPercentValue = 0,
  tripBasePrice = 0,
  tripVatAmount = 0,
  tripBaseHerozPrice = 0,
  tripHerozVatAmount = 0,
  foodBaseAmount = 0,
  foodVatAmount = 0,
  foodHerozBaseAmount = 0,
  foodHerozVatAmount = 0,
  totalBaseAmount = 0,
  totalVatAmount = 0,
  totalHerozBaseAmount = 0,
  totalHerozVatAmount = 0,
  totalWithVat = 0,
  totalHerozWithVat = 0,
}) => {
  const to2 = (v) => Number(v || 0).toFixed(2)

  return (
    <div>
      {/* Main table: Trip + Food + Totals */}
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          border: '1px solid #ddd',
          borderRadius: 12,
          overflow: 'hidden',
          fontSize: 14,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            background: '#f7f7f7',
            fontWeight: 600,
            padding: '8px 12px',
          }}
        >
          <div style={{ flex: 0.5 }}>#</div>
          <div style={{ flex: 1.5 }}>Description</div>
          <div style={{ flex: 1, textAlign: 'right' }}>Amount</div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            VAT{vatPercentValue ? ` (${to2(vatPercentValue)}%)` : ''}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>Heroz Amount</div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            Heroz VAT{vatPercentValue ? ` (${to2(vatPercentValue)}%)` : ''}
          </div>
        </div>

        <div style={{ padding: '8px 12px' }}>
          {/* Trip row */}
          <div
            style={{
              display: 'flex',
              padding: '6px 0',
              borderBottom: '1px solid #eee',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 0.5 }}>1.</div>
            <div style={{ flex: 1.5 }}>Trip</div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {to2(tripBasePrice)}
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {to2(tripVatAmount)}
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {to2(tripBaseHerozPrice)}
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {to2(tripHerozVatAmount)}
            </div>
          </div>

          {/* Food row */}
          <div
            style={{
              display: 'flex',
              padding: '6px 0',
              borderBottom: '1px solid #eee',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 0.5 }}>2.</div>
            <div style={{ flex: 1.5 }}>Food</div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {to2(foodBaseAmount)}
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {to2(foodVatAmount)}
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {to2(foodHerozBaseAmount)}
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
              {to2(foodHerozVatAmount)}
            </div>
          </div>

          {/* Total row */}
          <div
            style={{
              display: 'flex',
              padding: '8px 0 4px',
              fontWeight: 700,
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 0.5 }}></div>
            <div style={{ flex: 1.5 }}>Total</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {to2(totalBaseAmount)}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {to2(totalVatAmount)}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {to2(totalHerozBaseAmount)}
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              {to2(totalHerozVatAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Two final total boxes: Normal + Heroz */}
      <div
        style={{
          maxWidth: 800,
          margin: '16px auto 0',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 260,
            border: '3px solid #2e7d32',
            borderRadius: 16,
            padding: '12px 16px',
            backgroundColor: 'rgba(46, 125, 50, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1b5e20' }}>
              Total Cost (Incl. VAT)
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, color: '#1b5e20' }}>
              Amount + VAT
            </div>
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 24,
              color: '#1b5e20',
            }}
          >
            {to2(totalWithVat)}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 260,
            border: '3px solid #283593',
            borderRadius: 16,
            padding: '12px 16px',
            backgroundColor: 'rgba(40, 53, 147, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a237e' }}>
              Heroz Cost (Incl. VAT)
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, color: '#1a237e' }}>
              Heroz Amount + Heroz VAT
            </div>
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 24,
              color: '#1a237e',
            }}
          >
            {to2(totalHerozWithVat)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripSummaryVat
