import React, { useEffect, useState } from 'react'
import '../scss/toast.css'
import ReactPlayer from 'react-player'
 import { BaseURL } from '../config'
 import { format, parseISO } from 'date-fns';
export function convertToAMPM(timeRange) {
  try {
    // Split the time range into start and end times
    const [start, end] = timeRange.split(' - ');

    // Parse both start and end times into Date objects (Assume today's date for consistency)
    const startTime = parse(start, 'HH:mm', new Date());
    const endTime = parse(end, 'HH:mm', new Date());

    // Format the parsed times into 12-hour AM/PM format
    const formattedStart = format(startTime, 'hh:mm a');  // e.g. "09:00 AM"
    const formattedEnd = format(endTime, 'hh:mm a');      // e.g. "08:00 PM"

    // Return the formatted time range
    return `${formattedStart} - ${formattedEnd}`;
  } catch (error) {
    console.error('Error formatting time range:', error);
    return 'Invalid Time Range'; // Fallback message if parsing fails
  }
}
export function getDayName(date) {
  try {
    // Parse the input date string (e.g., '2025-08-20') into a Date object
    const parsedDate = parseISO(date);

    // Check if the parsedDate is a valid date
    if (isNaN(parsedDate)) {
      throw new Error('Invalid date');
    }

    // Extract the abbreviated day name (e.g., "Wed"), full month name (e.g., "August"), 
    // day of the month (e.g., "20"), and the full year (e.g., "2025")
    return format(parsedDate, 'eee, MMMM, d, yyyy'); // "Wed, August, 20, 2025"
  } catch (error) {
    console.error('Error parsing date:', error);
    return 'Invalid Date'; // Fallback message if date parsing fails
  }
}
// Extract file name from a URL string
export function getFileNameFromUrl(key) {
  if (typeof key !== 'string') {
    console.warn('Expected a string for key but got:', key)
    return ''
  }

  const parts = key.split('/')

  return parts[parts.length - 1] // Returns "filename.png"
}
export function generateOfferCode(key) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
export function generatePayRefNo(key) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
export const DspToastMessage = ({ message, type = 'info', duration = 3000 }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), duration)
      return () => clearTimeout(timer)
    }
  }, [message, duration])

  if (!visible || !message) return null

  // Just render one div with class based on type
  // Make sure your CSS handles 'success', 'error', etc.
  return <div className={`toast-message-${type}`}>{message}</div>
}

// src/utils/statusUtils.js

export const getStatusBadgeColor = (status) => {
  const statusColorMap = {
    Pending: 'bg-v1-warning',
    Approved: 'bg-v1-success',
    Rejected: 'bg-v1-danger',
    Delivered: 'bg-v1-primary',
    Cancelled: 'bg-v1-danger',
    Completed: 'bg-v1-success',
    New: 'bg-v1-primary',
    NEW: 'bg-v1-primary',
    ACTIVE: 'bg-v1-primary',
    // Add more as needed
  }

  return statusColorMap[status] || 'dark' // default fallback color
}

 
export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date)) return ''

  const day = date.getDate().toString().padStart(2, '0')
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

export const getCurrentLoggedUserID = () => {
  return localStorage.getItem('prtuserid')
}
export const getCurrentLoggedUserType = () => {
  return localStorage.getItem('usertype')
}

export const dspstatus = (status) => {
  const upperStatus = status?.toUpperCase()

  let color = 'gray'
  switch (upperStatus) {
    case 'APPROVED':
      color = 'green'
      break
    case 'PENDING':
      color = 'orange'
      break
    case 'REJECTED':
      color = 'red'
      break
    case 'READ':
      color = 'blue'
      break
    case 'NEW':
      color = 'red'
      break
    case 'WAITING-FOR-APPROVAL':
      color = 'red'
      break
    case 'DRAFT':
      color = 'blue'
      break
        case 'TRIP-BOOKED':
      color = 'blue'
      break
    default:
      color = 'gray'
  }

  return <span style={{ color, textTransform: 'capitalize', fontSize: '12px' }}>{status}</span>
}
export const dspstatusv1 = (status) => {
  const upperStatus = status?.toUpperCase()

  let color = 'gray'
  switch (upperStatus) {
    case 'APPROVED':
      color = 'green'
      break
    case 'PENDING':
      color = 'orange'
      break
    case 'REJECTED':
      color = 'red'
      break
    case 'NEW':
      color = 'red'
      break
       case 'READ':
      color = 'blue'
      break
    case 'WAITING-FOR-APPROVAL':
      color = 'red'
      break
    case 'DRAFT':
      color = 'blue'
      break
    default:
      color = 'gray'
  }

  return <span style={{ color, textTransform: 'capitalize' }}>{status}</span>
}
export const YouTubeEmbed = ({ videoId, width = '100%', height = '360px' }) => {
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
      <iframe
        src={embedUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video player"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  )
}

// Usage:

export const GoogleMapEmbed = ({ embedUrl, width = '100%', height = '400px' }) => {
  return (
    <div style={{ width, height, borderRadius: '8px', overflow: 'hidden' }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="300"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Google Map"
      ></iframe>
    </div>
  )
}

 function isTokenExpired(token) {
  try {
    // JWT format: header.payload.signature → we take payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    return payload.exp && payload.exp < now;
  } catch (e) {
    console.error("Invalid token format", e);
    return true; // treat as expired if broken
  }
}

export function getAuthHeaders() {
  const token = localStorage.getItem('token'); 
  //console.log("token:", token);

  // ✅ Check expiry before returning headers
  if (!token || isTokenExpired(token)) {
    console.warn("Token missing or expired — redirecting to login");
    localStorage.removeItem('token');
    window.location.href = BaseURL;
    return {}; // return empty headers
  }

  return { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export function getVatAmount() {
  return localStorage.getItem('vatamount');  ; 
}

export function getAuthHeadersV1() {
  const token = localStorage.getItem('token');
  console.log("token:", token); 
  return { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}


//------------------Vendor user Verification------------------------------------------------
export function IsVendorLoginIsValid() {
  const token = localStorage.getItem('token');
  const usertype = localStorage.getItem('usertype'); 

  if (!token || isTokenExpired(token) || usertype !== 'VENDOR-SUBADMIN') {
    console.warn("Invalid session (token or usertype) — redirecting to login");

    localStorage.removeItem('token');
    localStorage.removeItem('usertype');
    window.location.href = BaseURL; 
    return {}; 
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

//------------------admin user Verification------------------------------------------------
export function IsAdminLoginIsValid() {
  const token = localStorage.getItem('token');
  const usertype = localStorage.getItem('usertype'); 

  if (!token || isTokenExpired(token) || usertype !== 'ADMIN') {
    console.warn("Invalid session (token or usertype) — redirecting to login");

    localStorage.removeItem('token');
    localStorage.removeItem('usertype');
    window.location.href = BaseURL; 
    return {}; 
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
