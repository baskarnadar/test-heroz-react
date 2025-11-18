import { useEffect } from 'react'
import { API_BASE_URL } from '../../config'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../utils/operation'

// ✅ Custom hook so you can use your admin-login check anywhere in React components
export const useAdminLoginGuard = () => {
  useEffect(() => {
    // IsAdminLoginIsValidd(); // will redirect to BaseURL if token/usertype invalid (original snippet with typo)
    IsAdminLoginIsValid() // will redirect to BaseURL if token/usertype invalid
  }, [])
}

// Navigation function
export const fnNavigation = async (data, navigate) => {
  if (!data) {
    console.warn('fnNavigation: No data provided')
    return
  }

  const { noteKeyWord, NoteID, ActivityID, VendorID } = data

  if (!noteKeyWord || !NoteID) {
    console.warn('fnNavigation: Missing noteKeyWord or NoteID')
    return
  }

  const updated = await fnUpdateNoteStatus(NoteID)
  if (!updated) {
    console.warn('fnNavigation: Failed to update note status')
    return
  }

  if (noteKeyWord === 'ACTIVITY-WAITING-FOR-APPROVAL') {
    navigate(
      `/admindata/activityinfo/activity/view?ActivityID=${ActivityID}&VendorID=${VendorID}`,
    )
  } else {
    console.info(`fnNavigation: No navigation rule for keyword ${noteKeyWord}`)
  }
}

// Note status updater
const fnUpdateNoteStatus = async (NoteIDVal) => {
  try {
    const response = await fetch(`${API_BASE_URL}/note/updateNote`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ NoteID: NoteIDVal }),
    })

    if (!response.ok) {
      console.error('fnUpdateNoteStatus: Request failed')
      return false
    }

    const data = await response.json()
    console.log('fnUpdateNoteStatus: Updated successfully', data)
    return true
  } catch (err) {
    console.error('fnUpdateNoteStatus: Error updating note status', err)
    return false
  }
}
