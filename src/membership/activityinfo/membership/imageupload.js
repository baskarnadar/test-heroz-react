import React, { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../../config'
import { getAuthHeaders, getCurrentLoggedUserID, getFileNameFromUrl } from '../../../utils/operation'

const REMOVE_URL = 'https://api.heroz.sa/api/vendordata/activityinfo/membership/removeattachImages'

/** ---------- Modern Confirm Dialog ---------- */
const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
}) => {
  const onKeyDown = useCallback(
    (e) => {
      if (!open) return
      if (e.key === 'Escape') onCancel?.()
      if (e.key === 'Enter') onConfirm?.()
    },
    [open, onCancel, onConfirm]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onKeyDown])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="modal-content"
        style={{
          width: 'min(92vw, 420px)',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          padding: 20
        }}
      >
        <h4 style={{ marginTop: 0, marginBottom: 8 }}>{title}</h4>
        <p style={{ marginTop: 0, marginBottom: 16, color: '#444' }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-light"
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer'
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid transparent',
              background: danger ? '#cf2037' : '#0d6efd',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

const ImageUploadModal = ({ isOpen, onClose, onSaved, activity }) => {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [existingImages, setExistingImages] = useState([]) // [{ actImageGalleryID, url }]
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState({}) // { [actImageGalleryID]: true }
  const [error, setError] = useState('')

  // confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPayload, setConfirmPayload] = useState(null) // { img }

  // Load existing images when modal opens
  useEffect(() => {
    const fetchImages = async () => {
      if (!isOpen || !activity?.ActivityID) return
      try {
        const res = await fetch(
          `${API_BASE_URL}/vendordata/activityinfo/membership/getattachImages`,
          {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ ActivityID: activity.ActivityID }),
          }
        )
        const data = await res.json()

        if (res.ok && Array.isArray(data?.data)) {
          const normalized = data.data.map((img) => {
            if (typeof img === 'string') {
              return { actImageGalleryID: null, url: img }
            }
            const id = img.actImageGalleryID || img._id || img.id || null
            const url = img.actimagesUrl || img.actimages || img.url || ''
            return { actImageGalleryID: id, url }
          })
          setExistingImages(normalized)
        } else {
          setExistingImages([])
        }
      } catch (err) {
        console.error('Error fetching gallery images:', err)
        setExistingImages([])
      }
    }
    fetchImages()
  }, [isOpen, activity])

  if (!isOpen) return null

  const handleFilePick = (e) => {
    const file = (e.target.files && e.target.files[0]) || null
    if (!file) return
    setFiles([file])
    setPreviews([{ name: file.name, url: URL.createObjectURL(file) }])
    setError('')
  }

  const removeIndex = (idx) => {
    setFiles(files.filter((_, i) => i !== idx))
    setPreviews(previews.filter((_, i) => i !== idx))
  }

  const uploadSingle = async (file) => {
    const fd = new FormData()
    fd.append('image', file)
    fd.append('foldername', 'activity/imagegallery')
    const res = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
      method: 'POST',
      body: fd,
    })
    if (!res.ok) throw new Error(`Upload failed: ${file.name}`)
    const j = await res.json()
    const key = j?.data?.key || j?.data?.Key || ''
    return getFileNameFromUrl(key) || key
  }

  const attachToActivityIfSupported = async (key) => {
    try {
      const res = await fetch(`${API_BASE_URL}/vendordata/activityinfo/membership/attachImages`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ActivityID: activity?.ActivityID,
          VendorID: getCurrentLoggedUserID(),
          actImageName: key,
        }),
      })
      if (res.ok) {
        const jr = await res.json().catch(() => null)
        const created = jr?.data && typeof jr.data === 'object' ? jr.data : null
        if (created) {
          const id = created.actImageGalleryID || created._id || created.id || null
          const url = created.actimagesUrl || created.actimages || created.url
          if (url) setExistingImages(prev => [{ actImageGalleryID: id, url }, ...prev])
        }
      }
    } catch (err) {
      console.warn('attachImages failed/ignored:', err?.message)
    }
  }

  const handleUpload = async () => {
    if (!files.length) {
      setError('Please select an image.')
      return
    }
    const file = files[0]
    if (!file.type?.startsWith?.('image/')) {
      setError('Selected file is not an image.')
      return
    }

    setError('')
    setUploading(true)
    try {
      const uploadedKey = await uploadSingle(file)
      if (uploadedKey) {
        await attachToActivityIfSupported(uploadedKey)
        onSaved?.(uploadedKey)
      }
      setFiles([])
      setPreviews([])
      setUploading(false)
      onClose?.()
    } catch (e) {
      console.error(e)
      setError(e?.message || 'Upload failed.')
      setUploading(false)
    }
  }

  // open modern confirm dialog
  const askDelete = (img) => {
    if (!img?.actImageGalleryID) {
      setError('This image cannot be deleted because it is missing actImageGalleryID.')
      return
    }
    if (!activity?.ActivityID) {
      setError('Missing ActivityID.')
      return
    }
    setConfirmPayload({ img })
    setConfirmOpen(true)
  }

  // confirmed delete
  const confirmDelete = async () => {
    const img = confirmPayload?.img
    setConfirmOpen(false)
    if (!img) return

    // Optimistic removal
    setDeleting(prev => ({ ...prev, [img.actImageGalleryID]: true }))
    const prevImages = existingImages
    setExistingImages(prev => prev.filter(x => x.actImageGalleryID !== img.actImageGalleryID))

    try {
      const res = await fetch(REMOVE_URL, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ActivityID: activity.ActivityID,
          actImageGalleryID: img.actImageGalleryID,
        }),
      })
      if (!res.ok) {
        // Revert UI on error
        setExistingImages(prevImages)
        const jr = await res.json().catch(() => ({}))
        throw new Error(jr?.message || `Delete failed (${res.status})`)
      }
    } catch (e) {
      console.error('Remove image error:', e)
      setError(e?.message || 'Delete failed.')
    } finally {
      setDeleting(prev => {
        const n = { ...prev }
        delete n[img.actImageGalleryID]
        return n
      })
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content_50">
        <h4 style={{ marginTop: 0 }}>
          Upload Image {activity?.actName && (
            <span style={{ color: '#cf2037' }}>({activity.actName})</span>
          )}
        </h4>

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h5>Existing Images</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {existingImages.map((img, idx) => (
                <div
                  key={img.actImageGalleryID || idx}
                  style={{
                    border: '1px solid #eee',
                    padding: 6,
                    borderRadius: 6,
                    position: 'relative',
                    width: 120
                  }}
                >
                  <img
                    src={img.url}
                    alt="gallery"
                    style={{ width: 108, height: 108, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => askDelete(img)}
                    disabled={!!deleting[img.actImageGalleryID]}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      padding: '2px 6px',
                      opacity: deleting[img.actImageGalleryID] ? 0.6 : 1,
                      cursor: deleting[img.actImageGalleryID] ? 'not-allowed' : 'pointer'
                    }}
                    title="Delete image"
                  >
                    {deleting[img.actImageGalleryID] ? '…' : '🗑️'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ margin: '10px 0' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleFilePick}
            className="admin-txt-box"
            style={{ width: '100%' }}
          />
          {error && <div style={{ color: '#cf2037', marginTop: 6 }}>{error}</div>}
        </div>

        {/* Preview grid for new upload */}
        {previews.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <h5>New Image</h5>
            <div style={{ display: 'flex', gap: 12 }}>
              {previews.map((p, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <img src={p.url} alt={p.name} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6 }} />
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ position: 'absolute', top: 4, right: 4, padding: '2px 6px' }}
                    onClick={() => removeIndex(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-buttons" style={{ marginTop: 16 }}>
          <button className="admin-buttonv1" onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button className="admin-buttonv1" onClick={onClose} disabled={uploading}>
            Close
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete image?"
        message="This image will be permanently removed from the gallery."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

export default ImageUploadModal
