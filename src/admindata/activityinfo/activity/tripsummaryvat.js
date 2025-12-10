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

  // --------- VENDOR / SCHOOL SIDE TOTALS ----------
  const tripTotalVendor = Number(tripBasePrice || 0) + Number(tripVatAmount || 0)
  const foodTotalVendor = Number(foodBaseAmount || 0) + Number(foodVatAmount || 0)
  const overallVendorTotal =
    Number(totalBaseAmount || 0) + Number(totalVatAmount || 0) || Number(totalWithVat || 0)

  // --------- HEROZ SIDE TOTALS ----------
  const tripTotalHeroz = Number(tripBaseHerozPrice || 0) + Number(tripHerozVatAmount || 0)
  const foodTotalHeroz =
    Number(foodHerozBaseAmount || 0) + Number(foodHerozVatAmount || 0)
  const overallHerozTotal =
    Number(totalHerozBaseAmount || 0) + Number(totalHerozVatAmount || 0) ||
    Number(totalHerozWithVat || 0)

  const vatLabel = vatPercentValue ? ` (${to2(vatPercentValue)}%)` : ''

  // --------- SCHOOL PRICE (TRIP ONLY, FOOD ONLY, FINAL) ----------
  const vendorTripForSchool = tripTotalVendor // trip only (incl. VAT)
  const herozTripForSchool = tripTotalHeroz // trip only (incl. VAT)
  const schoolTripOnly = vendorTripForSchool + herozTripForSchool

  const vendorFoodForSchool = foodTotalVendor // food only (incl. VAT)
  const herozFoodForSchool = foodTotalHeroz // food only (incl. VAT)
  const schoolFoodOnly = vendorFoodForSchool + herozFoodForSchool

  const schoolFinalWithFood = schoolTripOnly + schoolFoodOnly

  // --------- SHARED STYLES ----------
  const cardWrapperStyle = {
    maxWidth: 900,
    margin: '0 auto',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
  }

  const cardStyle = {
    flex: 1,
    minWidth: 260,
    border: '1px solid #ddd',
    borderRadius: 12,
    overflow: 'hidden',
    fontSize: 14,
    backgroundColor: '#fff',
  }

  const cardHeaderStyle = {
    padding: '10px 14px',
    fontWeight: 700,
    background: '#f5f5f5',
    borderBottom: '1px solid #ddd',
  }

  const headerRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
    fontWeight: 600,
    padding: '8px 12px',
    background: '#fafafa',
  }

  const rowStyle = {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
    padding: '6px 12px',
    alignItems: 'center',
    borderBottom: '1px solid #eee',
  }

  const totalRowStyle = {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
    padding: '8px 12px',
    alignItems: 'center',
    fontWeight: 700,
  }

  const right = { textAlign: 'right' }

  const pinkTotalCell = {
    background: 'rgba(255, 105, 180, 0)',
    color: '#000',
    textAlign: 'right',
    fontWeight: 700,
  }

  const schoolBoxWrapper = {
    maxWidth: 900,
    margin: '20px auto 0',
    padding: '18px 24px',
    borderRadius: 24,
    border: '4px solid #6a1b9a',
    backgroundColor: 'rgba(234, 209, 255, 0.7)',
    fontSize: 16,
    fontWeight: 600,
  }

  return (
    <div>
      {/* ========== TWO SIDE-BY-SIDE CARDS: VENDOR & HEROZ ========== */}
      <div style={cardWrapperStyle}>
        {/* VENDOR / SCHOOL SIDE */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>Vendor Summary</div>

          {/* Header row */}
          <div style={headerRowStyle}>
            <div>Description</div>
            <div style={right}>Base price</div>
            <div style={right}>{`VAT${vatLabel}`}</div>
            <div style={right}>Total</div>
          </div>

          {/* Trip row */}
          <div style={rowStyle}>
            <div>Trip</div>
            <div style={right}>{to2(tripBasePrice)}</div>
            <div style={right}>{to2(tripVatAmount)}</div>
            <div style={pinkTotalCell}>{to2(tripTotalVendor)}</div>
          </div>

          {/* Food row */}
          <div style={rowStyle}>
            <div>Food</div>
            <div style={right}>{to2(foodBaseAmount)}</div>
            <div style={right}>{to2(foodVatAmount)}</div>
            <div style={pinkTotalCell}>{to2(foodTotalVendor)}</div>
          </div>

          {/* Total row */}
          <div style={totalRowStyle}>
            <div>Total</div>
            <div style={right}>{to2(totalBaseAmount)}</div>
            <div style={right}>{to2(totalVatAmount)}</div>
            <div style={pinkTotalCell}>{to2(overallVendorTotal)}</div>
          </div>
        </div>

        {/* HEROZ SIDE */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>Heroz Summary</div>

          {/* Header row */}
          <div style={headerRowStyle}>
            <div>Description</div>
            <div style={right}>Heroz Profit</div>
            <div style={right}>{`Heroz VAT${vatLabel}`}</div>
            <div style={right}>Total</div>
          </div>

          {/* Trip row */}
          <div style={rowStyle}>
            <div>Trip</div>
            <div style={right}>{to2(tripBaseHerozPrice)}</div>
            <div style={right}>{to2(tripHerozVatAmount)}</div>
            <div style={pinkTotalCell}>{to2(tripTotalHeroz)}</div>
          </div>

          {/* Food row */}
          <div style={rowStyle}>
            <div>Food</div>
            <div style={right}>{to2(foodHerozBaseAmount)}</div>
            <div style={right}>{to2(foodHerozVatAmount)}</div>
            <div style={pinkTotalCell}>{to2(foodTotalHeroz)}</div>
          </div>

          {/* Total row */}
          <div style={totalRowStyle}>
            <div>Total</div>
            <div style={right}>{to2(totalHerozBaseAmount)}</div>
            <div style={right}>{to2(totalHerozVatAmount)}</div>
            <div style={pinkTotalCell}>{to2(overallHerozTotal)}</div>
          </div>
        </div>
      </div>

      {/* ========== FINAL BIG TOTAL BOXES (Vendor & Heroz) ========== */}
      <div
        style={{
          maxWidth: 900,
          margin: '16px auto 0',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {/* Vendor total box */}
        {/* <div
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
              Vendor Price
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, color: '#1b5e20' }}>Price + VAT</div>
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 24,
              color: '#1b5e20',
            }}
          >
            {to2(totalWithVat || overallVendorTotal)}
          </div>
        </div> */}

        {/* Heroz total box */}
        {/* <div
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
              Heroz Profit (inclusive )
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, color: '#1a237e' }}>
              Heroz Profit + Heroz VAT
            </div>
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 24,
              color: '#1a237e',
            }}
          >
            {to2(totalHerozWithVat || overallHerozTotal)}
          </div>
        </div> */}
      </div>

      {/* ========== FINAL SCHOOL PRICE GRID (TRIP + FOOD + FINAL) ========== */}
      <div style={schoolBoxWrapper}>
        <div
          style={{
            marginBottom: 10,
            fontSize: 18,
            fontWeight: 800,
            textAlign: 'center',
            color: '#311b92',
          }}
        >
          School Price Summary (Incl. VAT)
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 4fr 1.3fr',
            rowGap: 10,
            columnGap: 16,
            alignItems: 'center',
          }}
        >
          {/* Header row */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#d1c4e9',
              fontWeight: 700,
            }}
          >
            Name
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#d1c4e9',
              fontWeight: 700,
            }}
          >
            Description (Vendor Price+Heroz Profit)
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#d1c4e9',
              fontWeight: 700,
              textAlign: 'right',
            }}
          >
            Total
          </div>

          {/* Row 1: Trip only */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#ede7f6',
              fontWeight: 700,
            }}
          >
            School Price (Incl. VAT)
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#ede7f6',
            }}
          >
            <span style={{ color: '#1b5e20' }}>
               {to2(vendorTripForSchool)}
            </span>{' '}
            +{' '}
            <span style={{ color: '#1a237e' }}>
               {to2(herozTripForSchool)}
            </span>
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#ede7f6',
              textAlign: 'right',
              fontWeight: 800,
              color: '#c62828',
            }}
          >
            {to2(schoolTripOnly)}
          </div>

          {/* Row 2: Food only */}
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#f8eaf6',
              fontWeight: 700,
            }}
          >
            Food (Incl. VAT)
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#f8eaf6',
            }}
          >
            <span style={{ color: '#1b5e20' }}>
            {to2(vendorFoodForSchool)}
            </span>{' '}
            +{' '}
            <span style={{ color: '#1a237e' }}>
              {to2(herozFoodForSchool)}
            </span>
          </div>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: 12,
              backgroundColor: '#f8eaf6',
              textAlign: 'right',
              fontWeight: 800,
              color: '#c62828',
            }}
          >
            {to2(schoolFoodOnly)}
          </div>

          {/* Row 3: Final total */}
          {/* <div
            style={{
              padding: '10px 10px',
              borderRadius: 12,
              backgroundColor: '#d500f9',
              fontWeight: 800,
              color: '#ffffff',
            }}
          >
            Final School Price Including Food (Incl. VAT)
          </div>
          <div
            style={{
              padding: '10px 10px',
              borderRadius: 12,
              backgroundColor: '#e040fb',
              color: '#ffffff',
            }}
          >
            {to2(schoolTripOnly)} + {to2(schoolFoodOnly)}
          </div>
          <div
            style={{
              padding: '10px 10px',
              borderRadius: 12,
              backgroundColor: '#aa00ff',
              textAlign: 'right',
              fontWeight: 900,
              color: '#ffffff',
              fontSize: 20,
            }}
          >
            {to2(schoolFinalWithFood)}
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default TripSummaryVat
