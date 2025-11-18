import React from 'react'

const FilePreview = ({ file }) => {
  if (!file) return null

  const isFileObject = file instanceof File
  const fileUrl = isFileObject ? URL.createObjectURL(file) : file

  // Infer type
  const fileType = isFileObject
    ? file.type
    : file.toLowerCase().endsWith('.pdf')
    ? 'application/pdf'
    : file.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif|png)$/)
    ? 'image'
    : ''

  // ✅ Show image preview
  if (
    (isFileObject && fileType.startsWith('image/')) ||
    fileType === 'image'
  ) {
    return (
      <img
        src={fileUrl}
        alt="Preview"
        style={{ maxWidth: '100%', maxHeight: 250, marginTop: '10px' }}
      />
    )
  }

  // ✅ Show PDF preview
  if (fileType === 'application/pdf') {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', marginTop: '10px' }}
      >
        View PDF
      </a>
    )
  }

  return <p style={{ marginTop: '10px' }}>Preview not supported</p>
}

export default FilePreview
