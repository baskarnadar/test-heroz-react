// ✅ FILE: src/utils/filevalidation.js

export const verifyImageExtension = (file) => {
  try {
    if (!file) return { ok: false, ext: '' }

    const name = String(file.name || '').toLowerCase().trim()
    const ext = name.includes('.') ? name.split('.').pop() : ''

    const allowed = ['jpg', 'jpeg', 'png']
    return { ok: allowed.includes(ext), ext, allowed }
  } catch {
    return { ok: false, ext: '' }
  }
}

export const getImageExtErrorMessage = (tr) => {
  const msg = 'Invalid image file. Allowed extensions: JPG, JPEG, PNG.'
  return typeof tr === 'function' ? tr('invalidImageType', msg) : msg
}
