import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { getFileNameFromUrl } from '../../utils/operation';
import '../../scss/toast.css';
import { checkLogin } from '../../utils/auth';
import { DspToastMessage,import { DspToastMessage } from '../../utils/operation'; } from '../../utils/operation';

const BannerForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const BannerID = queryParams.get('BannerID');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  const [BannerImageUrl, setBannerImageUrl] = useState(null);
  const [originalImageFileName, setOriginalImageFileName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchBannerData = async () => {
      if (!BannerID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/banner/getbanner`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ BannerID }),
        });

        const result = await res.json();
        const banner = result.data;

        if (banner) {
          setBannerImageUrl(banner.BannerImageUrl);
          setOriginalImageFileName(banner.BannerImage);
        }
      } catch (err) {
        console.error('Error fetching banner:', err);
      }
    };

    fetchBannerData();
  }, [BannerID]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setBannerImageUrl(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');

    if (!BannerImageUrl) {
      setToastMessage('Please upload a banner image.');
      setToastType('fail');
      setLoading(false);
      return;
    }

    let BannerImageUrlVal = originalImageFileName;

    try {
      if (BannerImageUrl instanceof File) {
        const formdata = new FormData();
        formdata.append('image', BannerImageUrl);
        formdata.append('foldername', 'files/banner');

        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formdata,
        });

        const uploadResult = await uploadResponse.json();
        const uploadedKey = uploadResult?.data?.key || uploadResult?.data?.Key;
        BannerImageUrlVal = getFileNameFromUrl(uploadedKey);
      }

      const payload = {
        BannerImage: BannerImageUrlVal,
      };

      if (BannerID) payload.BannerID = BannerID;

      const apiUrl = `${API_BASE_URL}/banner/updatebanner`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('Banner saved successfully!');
      setToastType('success');
      setTimeout(() => navigate('/banner/list'), 2000);
    } catch (error) {
      console.error('Error saving banner:', error);
      setToastType('fail');
      setToastMessage('Failed to save banner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{BannerID ? 'Edit' : 'Add'} Banner</h3>
        <button
          type="button"
          onClick={() => navigate('/banner/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>Banner Image</label>
        <input
          className="admin-txt-box"
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          required={!BannerID}
        />
        {BannerImageUrl && (
          <img
            src={BannerImageUrl instanceof File ? URL.createObjectURL(BannerImageUrl) : BannerImageUrl}
            alt="Banner Preview"
            className="image-preview"
          />
        )}
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : BannerID ? 'Update Banner' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default BannerForm;
