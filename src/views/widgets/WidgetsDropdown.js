import React, { useEffect, useRef, useState } from 'react'
 import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  CRow, CCol, CDropdown, CDropdownMenu, CDropdownItem, CDropdownToggle, CWidgetStatsA,
} from '@coreui/react'
import { getStyle } from '@coreui/utils'
import { CChartLine } from '@coreui/react-chartjs'
import CIcon from '@coreui/icons-react'
import { cilArrowBottom, cilArrowTop, cilOptions } from '@coreui/icons'
import { API_BASE_URL } from '../../config';
import card1 from 'src/assets/card/bg1.jpg';
 import bg1 from 'src/assets/card/bg1.jpg';
import bg2 from 'src/assets/card/bg2.jpg';
import bg3 from 'src/assets/card/bg3.jpg';
import bg4 from 'src/assets/card/bg4.jpg';
import bg5 from 'src/assets/card/bg5.jpg';
import bg6 from 'src/assets/card/bg6.jpg';
import bg7 from 'src/assets/card/bg7.jpg';
import bg8 from 'src/assets/card/bg8.jpg';


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
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/getDashBoardSummary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add other headers if needed, e.g., Authorization
      },
      // body: JSON.stringify({ /* Add body data here if API requires */ }),
    })
    const result = await response.json()
    console.log('result')
      console.log(result)
    if (result.statusCode === 200) {
      setSummary(result.data)
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

  return (
    <CRow className={props.className} xs={{ gutter: 4 }}>
      {/* NEW Orders */}
   

 <CCol sm={6} xl={4} xxl={3}>
  <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
    <CWidgetStatsA
      color="primary"
      value={<>{summary.NEW}</>}
      title="Total Clubs"
      style={{
        backgroundImage: `url(${card1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      action={
        <CDropdown alignment="end" onClick={(e) => e.stopPropagation()}>
          <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
            <CIcon icon={cilOptions} />
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem>Refresh</CDropdownItem>
            <CDropdownItem>Settings</CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
      }
      chart={
        <CChartLine
          ref={widgetChartRef1}
          className="mt-3 mx-3"
          style={{ height: '70px' }}
          data={{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
              label: 'New Orders',
              backgroundColor: 'transparent',
              borderColor: 'rgba(255,255,255,.55)',
              pointBackgroundColor: getStyle('--cui-primary'),
              data: [65, 59, 84, 84, 51, 55, 40],
            }],
          }}
          options={{
            plugins: { legend: { display: false } },
            maintainAspectRatio: false,
            scales: {
              x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
              y: { min: 30, max: 89, display: false, grid: { display: false }, ticks: { display: false } },
            },
            elements: {
              line: { borderWidth: 1, tension: 0.4 },
              point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
            },
          }}
        />
      }
    />
  </Link>
</CCol>


{/* PENDING Orders */}
<CCol sm={6} xl={4} xxl={3}>
  <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
  <CWidgetStatsA
    color="warning"
    value={
      <>
        {summary.PENDING}  
      </>
    }
    title="Total Schools"
      style={{
        backgroundImage: `url(${bg2})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    action={
      <CDropdown alignment="end">
        <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
          <CIcon icon={cilOptions} />
        </CDropdownToggle>
        <CDropdownMenu>
          <CDropdownItem>Refresh</CDropdownItem>
          <CDropdownItem>Settings</CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
    }
    chart={
      <CChartLine
        className="mt-3 mx-3"
        style={{ height: '70px' }}
        data={{
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Pending Orders',
            backgroundColor: 'transparent',
            borderColor: 'rgba(255,193,7,.55)', // warning color tone
            pointBackgroundColor: getStyle('--cui-warning'),
            data: [30, 20, 25, 30, 35, 40, 15], // replace with your actual data
          }],
        }}
        options={{
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          scales: {
            x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
            y: { min: 10, max: 50, display: false, grid: { display: false }, ticks: { display: false } },
          },
          elements: {
            line: { borderWidth: 1, tension: 0.4 },
            point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
          },
        }}
      />
    }
  />
  </Link>
</CCol>

{/* CANCEL Orders */}
<CCol sm={6} xl={4} xxl={3}>
   <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}> 
  <CWidgetStatsA
    color="danger"
    value={
      <>
        {summary.CANCEL}  
      </>
    }
    title="Total Revenue"
      style={{
        backgroundImage: `url(${bg3})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    action={
      <CDropdown alignment="end">
        <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
          <CIcon icon={cilOptions} />
        </CDropdownToggle>
        <CDropdownMenu>
          <CDropdownItem>Refresh</CDropdownItem>
          <CDropdownItem>Settings</CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
    }
    chart={
      <CChartLine
        className="mt-3 mx-3"
        style={{ height: '70px' }}
        data={{
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Total Children',
            backgroundColor: 'transparent',
            borderColor: 'rgba(220,53,69,.55)', // danger color tone
            pointBackgroundColor: getStyle('--cui-danger'),
            data: [10, 15, 13, 18, 12, 10, 8], // replace with your actual data
          }],
        }}
        options={{
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          scales: {
            x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
            y: { min: 5, max: 20, display: false, grid: { display: false }, ticks: { display: false } },
          },
          elements: {
            line: { borderWidth: 1, tension: 0.4 },
            point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
          },
        }}
      />
    }
  />
  </Link>
</CCol>

 

      {/* DELIVERED Orders */}
      <CCol sm={6} xl={4} xxl={3}>
         <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
        <CWidgetStatsA
          color="info"
          value={
            <>
              {summary.DELIVERED}{' '}
              
            </>
          }
          title="Total Children"
            style={{
        backgroundImage: `url(${bg4})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem>Refresh</CDropdownItem>
                <CDropdownItem>Settings</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          }
          chart={
            <CChartLine
              ref={widgetChartRef2}
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                  label: 'Delivered Orders',
                  backgroundColor: 'transparent',
                  borderColor: 'rgba(255,255,255,.55)',
                  pointBackgroundColor: getStyle('--cui-info'),
                  data: [1, 18, 9, 17, 34, 22, 11],
                }],
              }}
              options={{
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                scales: {
                  x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
                  y: { min: -9, max: 39, display: false, grid: { display: false }, ticks: { display: false } },
                },
                elements: {
                  line: { borderWidth: 1 },
                  point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
                },
              }}
            />
          }
        />
        </Link>
      </CCol>

  <CCol sm={6} xl={4} xxl={3}>
         <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
        <CWidgetStatsA
          color="info"
          value={
            <>
              {summary.DELIVERED}{' '}
              
            </>
          }
          title="Total Booking"
            style={{
        backgroundImage: `url(${bg5})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
          action={
            <CDropdown alignment="end">
              <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
                <CIcon icon={cilOptions} />
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem>Refresh</CDropdownItem>
                <CDropdownItem>Settings</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          }
          chart={
            <CChartLine
              ref={widgetChartRef2}
              className="mt-3 mx-3"
              style={{ height: '70px' }}
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                  label: 'Delivered Orders',
                  backgroundColor: 'transparent',
                  borderColor: 'rgba(255,255,255,.55)',
                  pointBackgroundColor: getStyle('--cui-info'),
                  data: [1, 18, 9, 17, 34, 22, 11],
                }],
              }}
              options={{
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                scales: {
                  x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
                  y: { min: -9, max: 39, display: false, grid: { display: false }, ticks: { display: false } },
                },
                elements: {
                  line: { borderWidth: 1 },
                  point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
                },
              }}
            />
          }
        />
        </Link>
      </CCol>
     

     
<CCol sm={6} xl={4} xxl={3}>
  <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
    <CWidgetStatsA
      color="primary"
      value={<>{summary.NEW}</>}
      title="Total Cancellations"
        style={{
        backgroundImage: `url(${bg6})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      action={
        <CDropdown alignment="end" onClick={(e) => e.stopPropagation()}>
          <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
            <CIcon icon={cilOptions} />
          </CDropdownToggle>
          <CDropdownMenu>
            <CDropdownItem>Refresh</CDropdownItem>
            <CDropdownItem>Settings</CDropdownItem>
          </CDropdownMenu>
        </CDropdown>
      }
      chart={
        <CChartLine
          ref={widgetChartRef1}
          className="mt-3 mx-3"
          style={{ height: '70px' }}
          data={{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
              label: 'New Orders',
              backgroundColor: 'transparent',
              borderColor: 'rgba(255,255,255,.55)',
              pointBackgroundColor: getStyle('--cui-primary'),
              data: [65, 59, 84, 84, 51, 55, 40],
            }],
          }}
          options={{
            plugins: { legend: { display: false } },
            maintainAspectRatio: false,
            scales: {
              x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
              y: { min: 30, max: 89, display: false, grid: { display: false }, ticks: { display: false } },
            },
            elements: {
              line: { borderWidth: 1, tension: 0.4 },
              point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
            },
          }}
        />
      }
    />
  </Link>
</CCol>


{/* PENDING Orders */}
<CCol sm={6} xl={4} xxl={3}>
  <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}>
  <CWidgetStatsA
    color="warning"
    value={
      <>
        {summary.PENDING}  
      </>
    }
    title="Total Activities"
      style={{
        backgroundImage: `url(${bg7})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
         border: '2px solid red',   // <-- added this line
    borderRadius: '0.5rem',     // optional: rounds corners to look nicer with border
      }}
    action={
      <CDropdown alignment="end">
        <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
          <CIcon icon={cilOptions} />
        </CDropdownToggle>
        <CDropdownMenu>
          <CDropdownItem>Refresh</CDropdownItem>
          <CDropdownItem>Settings</CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
    }
    chart={
      <CChartLine
        className="mt-3 mx-3"
        style={{ height: '70px' }}
        data={{
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Pending Orders',
            backgroundColor: 'transparent',
            borderColor: 'rgba(255,193,7,.55)', // warning color tone
            pointBackgroundColor: getStyle('--cui-warning'),
            data: [40, 20, 25, 35, 35, 40, 45], // replace with your actual data
          }],
        }}
        options={{
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          scales: {
            x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
            y: { min: 10, max: 50, display: false, grid: { display: false }, ticks: { display: false } },
          },
          elements: {
            line: { borderWidth: 1, tension: 0.4 },
            point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
          },
        }}
      />
    }
  />
  </Link>
</CCol>

{/* CANCEL Orders */}
<CCol sm={6} xl={4} xxl={3}>
   <Link to="/orders/orderlist" style={{ textDecoration: 'none' }}> 
  <CWidgetStatsA
    color="danger"
    value={
      <>
        {summary.CANCEL}  
      </>
    }
    title="Total Transfer"
      style={{
        backgroundImage: `url(${bg8})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    action={
      <CDropdown alignment="end">
        <CDropdownToggle color="transparent" caret={false} className="text-white p-0">
          <CIcon icon={cilOptions} />
        </CDropdownToggle>
        <CDropdownMenu>
          <CDropdownItem>Refresh</CDropdownItem>
          <CDropdownItem>Settings</CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
    }
    chart={
      <CChartLine
        className="mt-3 mx-3"
        style={{ height: '70px' }}
        data={{
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Total Children',
            backgroundColor: 'transparent',
            borderColor: 'rgba(220,53,69,.55)', // danger color tone
            pointBackgroundColor: getStyle('--cui-danger'),
            data: [10, 15, 13, 18, 12, 10, 8], // replace with your actual data
          }],
        }}
        options={{
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          scales: {
            x: { border: { display: false }, grid: { display: false }, ticks: { display: false } },
            y: { min: 5, max: 20, display: false, grid: { display: false }, ticks: { display: false } },
          },
          elements: {
            line: { borderWidth: 1, tension: 0.4 },
            point: { radius: 4, hitRadius: 10, hoverRadius: 4 },
          },
        }}
      />
    }
  />
  </Link>
</CCol>

 

    


    </CRow>
  )
}

WidgetsDropdown.propTypes = {
  className: PropTypes.string,
  withCharts: PropTypes.bool,
}

export default WidgetsDropdown
