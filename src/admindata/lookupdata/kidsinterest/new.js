import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../../config'
import { checkLogin } from '../../../utils/auth'
import '../../../scss/toast.css'
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation'

const AddkidsinterestForm = () => {
  const navigate = useNavigate()

  const [EnkidsinterestName, setEnkidsinterestName] = useState('')
  const [ArkidsinterestName, setArkidsinterestName] = useState('')
  const [EnkidsinterestDesc, setEnkidsinterestDesc] = useState('')
  const [ArkidsinterestDesc, setArkidsinterestDesc] = useState('')
  const [kidsinterestImageName, setKidsinterestImageName] = useState(null)
  const [imageTypeError, setImageTypeError] = useState('')
  const [IsDataStatus, setIsDataStatus] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('info')

  useEffect(() => {
    checkLogin(navigate)
  }, [navigate])

  useEffect(() => {
    IsAdminLoginIsValid()
  }, [])

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  useEffect(() => {
    const fetchKidsInterest = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/lookupdata/kidsinterest/getkidsinterestlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })

        const result = await response.json()
        console.log('kidsinterest list result:', result)
      } catch (error) {
        console.error('Error fetching kidsinterest list:', error)
      }
    }

    fetchKidsInterest()
  }, [])

  const getFileNameFromUrlLocal = (input) => {
    if (!input) return ''
    const str = String(input)
    const cleanStr = str.split('?')[0]
    const parts = cleanStr.split('/')
    return parts[parts.length - 1] || ''
  }

  const isAllowedImage = (file) => {
    if (!(file instanceof File)) return { ok: true, msg: '' }

    const type = String(file.type || '').toLowerCase()
    const name = String(file.name || '').toLowerCase()

    const allowedMime = ['image/png', 'image/jpeg', 'image/jpg']
    const allowedExt = ['.png', '.jpg', '.jpeg']

    const mimeOk = allowedMime.includes(type)
    const extOk = allowedExt.some((ext) => name.endsWith(ext))

    if (!mimeOk && !extOk) {
      return {
        ok: false,
        msg: 'Only PNG / JPG / JPEG files are allowed.',
      }
    }

    return { ok: true, msg: '' }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0]

    setImageTypeError('')

    if (!file) {
      setKidsinterestImageName(null)
      return
    }

    const check = isAllowedImage(file)
    if (!check.ok) {
      try {
        e.target.value = ''
      } catch {}

      setKidsinterestImageName(null)
      setImageTypeError(check.msg)
      setToastMessage(check.msg)
      setToastType('fail')
      return
    }

    setKidsinterestImageName(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!EnkidsinterestName || !ArkidsinterestName) {
      setToastMessage('Please fill in all required fields.')
      setToastType('fail')
      return
    }

    if (imageTypeError) {
      setToastMessage('Please fix the image file type.')
      setToastType('fail')
      return
    }

    setLoading(true)
    setToastMessage('')

    try {
      let uploadedKidsinterestImageName = ''

      if (kidsinterestImageName instanceof File) {
        const formData = new FormData()
        formData.append('image', kidsinterestImageName)
        formData.append('foldername', 'activity')

        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formData,
        })

        const uploadResult = await uploadResponse.json()
        console.log('kidsinterest image upload result:', uploadResult)

        uploadedKidsinterestImageName = getFileNameFromUrlLocal(
          uploadResult?.data?.key || uploadResult?.data?.Key || '',
        )
      }

      const response = await fetch(`${API_BASE_URL}/lookupdata/kidsinterest/createkidsinterest`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          EnkidsinterestName,
          ArkidsinterestName,
          EnkidsinterestDesc,
          ArkidsinterestDesc,
          kidsinterestImageName: uploadedKidsinterestImageName,
          IsDataStatus: IsDataStatus ? 1 : 0,
          CreatedBy: 'USER',
          ModifyBy: 'USER',
        }),
      })

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)

      const result = await response.json()
      console.log('create kidsinterest result:', result)

      setToastMessage('kidsinterest added successfully!')
      setToastType('success')

      setTimeout(() => navigate('/admindata/kidsinterest/list'), 2000)
    } catch (err) {
      console.error('Error adding kidsinterest:', err)
      setToastMessage('Failed to add kidsinterest.')
      setToastType('fail')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Add kidsinterest</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/kidsinterest/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English kidsinterest Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnkidsinterestName}
          onChange={(e) => setEnkidsinterestName(e.target.value)}
          placeholder="Enter English kidsinterest Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic kidsinterest Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArkidsinterestName}
          onChange={(e) => setArkidsinterestName(e.target.value)}
          placeholder="Enter Arabic kidsinterest Name"
          required
        />
      </div>

      <div className="form-group">
        <label>English kidsinterest Description</label>
        <textarea
          className="admin-txt-box"
          value={EnkidsinterestDesc}
          onChange={(e) => setEnkidsinterestDesc(e.target.value)}
          placeholder="Enter English kidsinterest Description"
          rows={6}
          style={{
            minHeight: '140px',
            resize: 'vertical',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            paddingTop: '10px',
            paddingBottom: '10px'
          }}
        />
      </div>

      <div className="form-group">
        <label>Arabic kidsinterest Description</label>
        <textarea
          className="admin-txt-box"
          value={ArkidsinterestDesc}
          onChange={(e) => setArkidsinterestDesc(e.target.value)}
          placeholder="Enter Arabic kidsinterest Description"
          rows={6}
          style={{
            minHeight: '140px',
            resize: 'vertical',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            paddingTop: '10px',
            paddingBottom: '10px'
          }}
        />
      </div>

      {/* ✅ ONLY CHANGE: HIDE IMAGE UPLOAD */}
      <div className="form-group" style={{ display: 'none' }}>
        <label>kidsinterest Image</label>
        <input
          name="kidsinterestImageName"
          className="admin-txt-box"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileUpload}
        />
      </div>

      {imageTypeError && (
        <div style={{ color: 'red', fontSize: '13px', marginTop: '5px' }}>
          {imageTypeError}
        </div>
      )}

      {kidsinterestImageName && kidsinterestImageName instanceof File && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '6px' }}>{kidsinterestImageName.name}</div>
          <img
            src={URL.createObjectURL(kidsinterestImageName)}
            alt="kidsinterest preview"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}
          />
        </div>
      )}

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  )
}

export default AddkidsinterestForm