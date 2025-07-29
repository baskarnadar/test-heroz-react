import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { getFileNameFromUrl } from '../../utils/operation';
import { checkLogin } from '../../utils/auth';

const AddNewBanner = () => {
  const navigate = useNavigate();

  const [BannerImage, setBannerImage] = useState(null); // will hold File or URL string

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for Auth ---------------------------------------------------------
  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);
  // Check for Auth -----------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let uploadedImageKey = BannerImage;

      // Upload BannerImage file (if selected and is a File)
      if (BannerImage && BannerImage instanceof File) {
        const formdata = new FormData();
        formdata.append('image', BannerImage);
        formdata.append('foldername', 'files/banner');

        const uploadResponse = await fetch(
          `${API_BASE_URL}/product/upload/uploadImage`,
          {
            method: 'POST',
            body: formdata,
          }
        );

        if (!uploadResponse.ok) {
          throw new Error(`Image upload failed with status ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        uploadedImageKey = uploadResult?.data?.key || uploadResult?.data?.Key;
      }

      // Submit banner data with uploaded image filename (extracted from key)
      const response = await fetch(`${API_BASE_URL}/banner/createbanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BannerImage: getFileNameFromUrl(uploadedImageKey),
          createdBy: 'USER',
          updatedBy: 'USER',
          IsDataStatus: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Banner added:', data);

      // Reset form
      setBannerImage(null);
      setError('Banner added successfully!');
    } catch (error) {
      console.error('Error adding banner:', error);
      setError('Failed to add banner.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerImage(file);
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>New Banner</h3>

        <button
          type="button"
          onClick={() => navigate('/banner/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-row">
        <label>Banner Image</label>
        <>
          <input
            className="admin-txt-box"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            required
          />
          {BannerImage && typeof BannerImage !== 'string' && (
            <img
              src={URL.createObjectURL(BannerImage)}
              alt="Banner Preview"
              className="file-preview"
              style={{ maxWidth: '300px', marginTop: '10px' }}
            />
          )}
        </>
      </div>

      <div className="button-group">
        <button className="admin-buttonv1" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        <button
          className="admin-buttonv1"
          type="button"
          onClick={() => navigate('/banner/list')}
        >
          Cancel
        </button>
        {error && (
          <p className={error.toLowerCase().includes('success') ? 'message-success' : 'message-error'}>
            {error}
          </p>
        )}
      </div>
    </form>
  );
};

export default AddNewBanner;
