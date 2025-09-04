import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL } from '../../config'
import { fnNavigation } from './link'
import { DspToastMessage,getAuthHeaders } from '../../utils/operation';
const SetLinkList = () => {
  const [NoteInfo, setNoteInfo] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const noteIdFromURL = queryParams.get('NoteID')

  const fetchNoteInfo = async () => {
    if (!noteIdFromURL) return
   
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/note/getnote`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          NoteID: noteIdFromURL,
        }),
      })
  
      if (!response.ok) throw new Error('Failed to fetch notification')
      const data = await response.json()
    console.log('response')
      console.log(response)
      fnNavigation(data.data[0], navigate)
      setNoteInfo(data.data ? [data.data] : [])
    } catch (err) {
      console.error('Error fetching notification:', err)
      setError('Error fetching notification')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchNoteInfo()
  }, [navigate, noteIdFromURL])

  return <div>Admin Set Link Page</div>
}

export default SetLinkList
