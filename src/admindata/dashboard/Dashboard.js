import React from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router-dom';
import  { useState, useEffect } from 'react';
import { checkLogin } from '../../utils/auth';
import { API_BASE_URL } from '../../config'; // ⬅️ add this
import {
  CAvatar,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
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
 

 
import WidgetsDropdown from '../../views/widgets/WidgetsDropdown'
import MainChart from './MainChart'

// ⬇️ Calendar component
import DBCalendar from '../dashboard/component/dbcalendar'

// ADDED: Summary tiles
import DashboardSummary from '../dashboard/component/dashboardSummary'  
import PayGraph from '../dashboard/component/paygraph'


const Dashboard = () => {
  const navigate = useNavigate();  
  return (
    <>
    
      <DashboardSummary
        apiUrl={`${API_BASE_URL}/admindata/dashboard/getdashboardtotal`} // adjust path if needed
        title="Heroz – Dashboard Summary"
      />

     

      <DBCalendar
        apiUrl={`${API_BASE_URL}/admindata/activityinfo/trip/getalltriplist`}
        title="Trips by Request Date"
      />
       <PayGraph  title="Sales" />
      
    </>
  )
}

export default Dashboard
