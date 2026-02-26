import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  CRow,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownItem,
  CDropdownToggle,
  CWidgetStatsA,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilArrowBottom, cilArrowTop, cilOptions } from '@coreui/icons'
import { API_BASE_URL } from '../../config'
import card1 from 'src/assets/card/bg1.jpg'
import bg1 from 'src/assets/card/bg1.jpg'
import bg2 from 'src/assets/card/bg2.jpg'
import bg3 from 'src/assets/card/bg3.jpg'
import bg4 from 'src/assets/card/bg4.jpg'
import bg5 from 'src/assets/card/bg5.jpg'
import bg6 from 'src/assets/card/bg6.jpg'
import bg7 from 'src/assets/card/bg7.jpg'
import bg8 from 'src/assets/card/bg8.jpg'
import Calendar from '../dashboard/calendar'
const today = new Date()
const year = today.getFullYear()
const month = today.getMonth()

// Dummy events data: 7 events on 20th, 9 on 25th
const events = {
  20: ['BOOKED', 'REJECTED'],
  25: ['BOOKED'],
  29: ['WAITING'],
  30: ['BOOKED'],
}
const WidgetsDropdown = (props) => {
  const widgetChartRef1 = useRef(null)
  const widgetChartRef2 = useRef(null)

  const [summary, setSummary] = useState({
    NEW: 0,
    DELIVERED: 0,
    CANCEL: 0,
    PENDING: 0,
    PROGRESS: 0,
  })

useEffect(() => {
  const fetchDashboardSummary = async () => {
    var VendorIDVal = localStorage.getItem('prtuserid')
    console.log('VendorIDVal:', VendorIDVal)
    if (!VendorIDVal) {
      console.warn('VendorIDVal is missing. Cannot fetch dashboard summary.')
      return
    }
    else
    {
       console.warn('VendorIDVal is OK ')
    }

    console.log(`${API_BASE_URL}/vendordata/dashboard/getDashboardSummary`);
    try {
      console.warn('Step2 ')
      const response = await fetch(`${API_BASE_URL}/vendordata/dashboard/getDashboardSummary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          VendorID: VendorIDVal,
        }),
      })
    console.warn('Step3 ')
      console.log(`${API_BASE_URL}/vendordata/dashboard/getDashboardSummary`)
      console.log('response status:', response.status)
      console.log('response ok:', response.ok)

      const result = await response.json()
      console.log('result:', result)
      if (result.statusCode === 200) {
        console.log('Data received:', result.data)
        setSummary(result.data)
      } else {
        console.warn('API returned non-200 statusCode:', result.statusCode)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error)
    }
  }

  fetchDashboardSummary()
}, [])


  useEffect(() => {
    const updateColors = () => {
      if (widgetChartRef1.current) {
        setTimeout(() => {
          widgetChartRef1.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-primary')
          widgetChartRef1.current.update()
        })
      }

      if (widgetChartRef2.current) {
        setTimeout(() => {
          widgetChartRef2.current.data.datasets[0].pointBackgroundColor = getStyle('--cui-info')
          widgetChartRef2.current.update()
        })
      }
    }

    document.documentElement.addEventListener('ColorSchemeChange', updateColors)
    return () => document.documentElement.removeEventListener('ColorSchemeChange', updateColors)
  }, [])
  const today = new Date()
  return (
    <>
      <h5
        style={{
          backgroundColor: 'rgba(74, 13, 82, 0.0.05)',
          borderRadius: '5px',
          padding: '0px 16px',
          display: 'inline-block', // so it doesn't take full width
          color: '#333',
          width: '100%',
        }}
      >
        Admin Activities
      </h5>

      <CRow className={props.className} xs={{ gutter: 4 }}>
        {/* NEW Orders */}

        <CCol sm={6} xl={4} xxl={3}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 100,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Total Activities </div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{summary.TotalActivity || 0}</div>
            </div>
          </Link>
        </CCol>

        {/* PENDING Orders */}
        <CCol sm={6} xl={4} xxl={3}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 100,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Approved Activities</div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{summary.TotalApproved || 0}</div>
            </div>
          </Link>
        </CCol>

        {/* CANCEL Orders */}
        <CCol sm={6} xl={4} xxl={3}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 100,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Pending Activities</div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{summary.totalWaitingForApproval || 0}</div>
            </div>
          </Link>
        </CCol>

        {/* DELIVERED Orders */}
        <CCol sm={6} xl={4} xxl={3}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 100,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Rejected Activities</div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{summary.TotalRejected || 0}</div>
            </div>
          </Link>
        </CCol>
      </CRow>

      <div>
        <h5
          style={{
            backgroundColor: 'rgba(74, 13, 82, 0.0.05)',
            borderRadius: '5px',
            padding: '0px 16px',
            display: 'inline-block', // so it doesn't take full width
            color: '#333',
            width: '100%',
          }}
        >
          School Activities
        </h5>
      </div>
      <CRow className={props.className} xs={{ gutter: 4 }}>
        <CCol xs={6} sm={4} md={2}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 130,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Total Field Trips</div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>0</div>
            </div>
          </Link>
        </CCol>

        <CCol xs={6} sm={4} md={2}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 130,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Accepted</div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>0</div>
            </div>
          </Link>
        </CCol>

        {/* PENDING Orders */}
        <CCol xs={6} sm={4} md={2}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 130,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Pending</div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>0</div>
            </div>
          </Link>
        </CCol>

        {/* CANCEL Orders */}
        <CCol xs={6} sm={4} md={2}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 130,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Rejected</div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>0</div>
            </div>
          </Link>
        </CCol>

        {/* CANCEL Orders */}
        <CCol xs={6} sm={4} md={2}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 130,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                Canceled
                <div style={{ fontSize: '1rem', marginTop: '0.01rem' }}> (School)</div>
              </div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>0</div>
            </div>
          </Link>
        </CCol>
        {/* CANCEL Orders */}
        <CCol xs={6} sm={4} md={2}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 130,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                backgroundColor: '#fff', // optional: add background
                color: '#333', // text color
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Archive</div>
              <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>0</div>
            </div>
          </Link>
        </CCol>
      </CRow>

      <CRow className={`${props.className} justify-content-center`} xs={{ gutter: 5 }}>
        {/* First column: 3 */}
        <CCol sm={3} xl={3} xxl={3}>
          <h5
            style={{
              backgroundColor: 'rgba(74, 13, 82, 0.0.05)',
              borderRadius: '5px',
              padding: '0px 16px',
              display: 'inline-block', // so it doesn't take full width
              color: '#333',
              width: '100%',
            }}
          >
            My Wallet
          </h5>
        </CCol>

        {/* Second column: 3 */}
        <CCol sm={3} xl={3} xxl={3}></CCol>

        {/* Third column (calendar): 6 */}
        <CCol sm={6} xl={6} xxl={6}>
          <h5
            style={{
              backgroundColor: 'rgba(74, 13, 82, 0.0.05)',
              borderRadius: '5px',
              padding: '0px 16px',
              display: 'inline-block', // so it doesn't take full width
              color: '#333',
              width: '100%',
            }}
          >
            Booked Activities
          </h5>
        </CCol>
      </CRow>
      <CRow className={`${props.className} justify-content-center`} xs={{ gutter: 5 }}>
        {/* First column: 3 */}
        <CCol sm={3} xl={3} xxl={3}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 295,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: '#63136e', // text color
                backgroundColor: 'rgba(74, 13, 82, 0.1)',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.51rem' }}>
                Amount Received From Heroz
              </div>
              <div style={{ fontSize: '2rem', marginTop: '2rem', fontWeight: 'bold' }}>0</div>
            </div>
          </Link>
        </CCol>

        {/* Second column: 3 */}
        <CCol sm={3} xl={3} xxl={3}>
          <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
            <div
              style={{
                minHeight: 295,
                border: '2px solid #e2bbe9',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: '#63136e', // text color
                backgroundColor: 'rgba(74, 13, 82, 0.1)',
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '1.51rem' }}>
                Upcoming Amount From Heroz
              </div>
              <div style={{ fontSize: '2rem', marginTop: '2rem', fontWeight: 'bold' }}>0</div>
            </div>
          </Link>
        </CCol>

        {/* Third column (calendar): 6 */}
        <CCol sm={6} xl={6} xxl={6}>
          <div
            style={{
              maxWidth: '100%',
              margin: 'auto',
              fontFamily: 'Arial, sans-serif',
              border: '1px solid rgba(74, 13, 82, 0.1)',
              padding: 20,
              borderRadius: 10,
              backgroundColor: 'rgba(74, 13, 82, 0.1)',
            }}
          >
            <Calendar
              initialYear={today.getFullYear()}
              initialMonth={today.getMonth()}
              events={events}
            />
          </div>
        </CCol>
      </CRow>
    </>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsDropdown
