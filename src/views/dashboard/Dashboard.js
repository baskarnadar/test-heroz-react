import React from 'react'
import classNames from 'classnames'
import { useNavigate, useLocation } from 'react-router-dom';
import  { useState, useEffect } from 'react';
import { checkLogin } from '../../utils/auth';
import {
  CAvatar,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
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
  cilPeople,
  cilUser,
  cilUserFemale,
} from '@coreui/icons'

import avatar1 from 'src/assets/images/avatars/1.jpg'
import avatar2 from 'src/assets/images/avatars/2.jpg'
import avatar3 from 'src/assets/images/avatars/3.jpg'
import avatar4 from 'src/assets/images/avatars/4.jpg'
import avatar5 from 'src/assets/images/avatars/5.jpg'
import avatar6 from 'src/assets/images/avatars/6.jpg'

import WidgetsBrand from '../widgets/WidgetsBrand'
import WidgetsDropdown from '../widgets/WidgetsDropdown'
import MainChart from './MainChart'

const Dashboard = () => {
 const navigate = useNavigate();
   // useEffect(() => {
    //checkLogin(navigate);
   // }, [navigate]); 
    useEffect(() => {
    const verify = async () => {
      const hasAccess = await IsUserHasAccessThisPage(navigate,'P100');
      if (!hasAccess) {
        navigate('/login');
      }
    }; 
    verify();
    }, []);



  const progressExample = [
    { title: 'Total Clubs', value: '29.703  ', percent: 40, color: 'success' },
    { title: 'Pending Orders', value: '24.093  ', percent: 20, color: 'info' },
    { title: 'Canceled Orders', value: '78.706  ', percent: 60, color: 'warning' },
    { title: 'Progress Orders', value: '22.123  ', percent: 80, color: 'danger' },
    { title: 'Delivered Orders', value: ' 40.15  ', percent: 40.15, color: 'primary' },
  ]

  const progressGroupExample1 = [
    { title: 'Monday', value1: 34, value2: 78 },
    { title: 'Tuesday', value1: 56, value2: 94 },
    { title: 'Wednesday', value1: 12, value2: 67 },
    { title: 'Thursday', value1: 43, value2: 91 },
    { title: 'Friday', value1: 22, value2: 73 },
    { title: 'Saturday', value1: 53, value2: 82 },
    { title: 'Sunday', value1: 9, value2: 69 },
  ]

  const progressGroupExample2 = [
    { title: 'Male', icon: cilUser, value: 53 },
    { title: 'Female', icon: cilUserFemale, value: 43 },
  ]

  const progressGroupExample3 = [
    { title: 'Organic Search', icon: cibGoogle, percent: 56, value: '191,235' },
    { title: 'Facebook', icon: cibFacebook, percent: 15, value: '51,223' },
    { title: 'Twitter', icon: cibTwitter, percent: 11, value: '37,564' },
    { title: 'lk', icon: cibLinkedin, percent: 8, value: '27,319' },
  ]

  const OrderTable = [
    {
      avatar: { src: avatar1, status: 'success' },
      user: {
        name: 'Yiorgos Avraamu',
        new: true,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'USA', flag: cifUs },
      usage: {
        value: 50,
        period: '',
        color: 'success',
      },
      payment: { name: 'Mastercard', icon: cibCcMastercard },
      activity: '10 sec ago',
    },
    {
      avatar: { src: avatar2, status: 'danger' },
      user: {
        name: 'Avram Tarasios',
        new: false,
         
      },
      country: { name: 'Brazil', flag: cifBr },
      usage: {
        value: 22,
        period: '',
        color: 'info',
      },
      payment: { name: 'Visa', icon: cibCcVisa },
      activity: '5 minutes ago',
    },
    {
      avatar: { src: avatar3, status: 'warning' },
      user: { name: 'Quintin Ed', new: true,   },
      country: { name: 'India', flag: cifIn },
      usage: {
        value: 74,
        period: '',
        color: 'warning',
      },
      payment: { name: 'Stripe', icon: cibCcStripe },
      activity: '1 hour ago',
    },
    {
      avatar: { src: avatar4, status: 'secondary' },
      user: { name: 'Enéas Kwadwo', new: true,   },
      country: { name: 'France', flag: cifFr },
      usage: {
        value: 98,
        period: '',
        color: 'danger',
      },
      payment: { name: 'PayPal', icon: cibCcPaypal },
      activity: 'Last month',
    },
    {
      avatar: { src: avatar5, status: 'success' },
      user: {
        name: 'Agapetus Tadeáš',
        new: true,
        
      },
      country: { name: 'Spain', flag: cifEs },
      usage: {
        value: 22,
        period: '',
        color: 'primary',
      },
      payment: { name: 'Google Wallet', icon: cibCcApplePay },
      activity: 'Last week',
    },
    {
      avatar: { src: avatar6, status: 'danger' },
      user: {
        name: 'Friderik Dávid',
        new: true,
       
      },
      country: { name: 'Poland', flag: cifPl },
      usage: {
        value: 43,
        period: '',
        color: 'success',
      },
      payment: { name: 'Amex', icon: cibCcAmex },
      activity: 'Last week',
    },
  ]

  return (
    <>
      <WidgetsDropdown className="mb-4" />
      <CCard className="mb-4">
        <CCardBody>
          <CRow>
            <CCol sm={5}>
              <h4 id="traffic" className="card-title mb-0">
                Sales 
              </h4>
              <div className="small text-body-secondary">January - July 2025</div>
            </CCol>
            <CCol sm={7} className="d-none d-md-block">
              <CButton color="primary" className="float-end">
                <CIcon icon={cilCloudDownload} />
              </CButton>
              <CButtonGroup className="float-end me-3">
                {['Day', 'Month', 'Year'].map((value) => (
                  <CButton
                    color="outline-secondary"
                    key={value}
                    className="mx-0"
                    active={value === 'Month'}
                  >
                    {value}
                  </CButton>
                ))}
              </CButtonGroup>
            </CCol>
          </CRow>
          <MainChart />
        </CCardBody>
        
      </CCard>
      <WidgetsBrand className="mb-4" withCharts />
      <CRow>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader><h3>Recent Vendor</h3></CCardHeader>
            <CCardBody> 
              <br /> 
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary text-center">
                      <CIcon icon={cilPeople} />
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary"> </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">
                        Name
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Email</CTableHeaderCell>
                     <CTableHeaderCell className="bg-body-tertiary">Amount</CTableHeaderCell>
                     <CTableHeaderCell className="bg-body-tertiary">City</CTableHeaderCell>
                      <CTableHeaderCell className="bg-body-tertiary">  Status</CTableHeaderCell>
                     
                    <CTableHeaderCell className="bg-body-tertiary text-center">
                      Payment Method
                    </CTableHeaderCell>
                   <CTableHeaderCell className="bg-body-tertiary">Date</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary"> </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {OrderTable.map((item, index) => (
                    <CTableRow v-for="item in tableItems" key={index}>
                      <CTableDataCell className="text-center">
                        <CAvatar size="md" src={item.avatar.src} status={item.avatar.status} />
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{item.user.name}</div>
                        <div className="small text-body-secondary text-nowrap">
                          
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">  </CTableDataCell>
                       <CTableDataCell className="text-center">  </CTableDataCell>
                        <CTableDataCell className="text-center">  </CTableDataCell>
                     <CTableHeaderCell className="bg-body-tertiary"> </CTableHeaderCell><CTableDataCell>
                        <div className="d-flex justify-content-between text-nowrap">
                          <div className="fw-semibold">{item.usage.value}%</div>
                          <div className="ms-3">
                            <small className="text-body-secondary">{item.usage.period}</small>
                          </div>
                        </div>
                        <CProgress thin color={item.usage.color} value={item.usage.value} />
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <CIcon size="xl" icon={item.payment.icon} />
                      </CTableDataCell>
                       
                      <CTableDataCell>
                       
                        <div className="fw-semibold text-nowrap">{item.activity}</div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

       <WidgetsBrand className="mb-4" withCharts />
      <CRow>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader><h3>Recent School</h3></CCardHeader>
            <CCardBody> 
              <br /> 
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary text-center">
                      <CIcon icon={cilPeople} />
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Mobile Number   </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Address Location  </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">ID Number</CTableHeaderCell>
                   
                    <CTableHeaderCell className="bg-body-tertiary">Status</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Date</CTableHeaderCell>
                     
                
                  
                   
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {OrderTable.map((item, index) => (
                    <CTableRow v-for="item in tableItems" key={index}>
                      <CTableDataCell className="text-center">
                        <CAvatar size="md" src={item.avatar.src} status={item.avatar.status} />
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{item.user.name}</div>
                        <div className="small text-body-secondary text-nowrap">
                          
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center">  </CTableDataCell>
                       <CTableDataCell className="text-center">  </CTableDataCell>
                        <CTableDataCell className="text-center">  </CTableDataCell>
                     <CTableHeaderCell className="bg-body-tertiary"> </CTableHeaderCell><CTableDataCell>
                         
                       
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                       
                      </CTableDataCell>
                       
                      
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
