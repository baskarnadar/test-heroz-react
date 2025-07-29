import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { checkLogin } from '../../utils/auth';

const ViewBanner = () => {
  const navigate = useNavigate();

  // Check for Auth
  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const BannerIDVal = queryParams.get('BannerID');

  const [BannerImage, setBannerImage] = useState(null);
  const [UserStatus, setUserStatus] = useState('ACTIVE'); // if applicable

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchBannerDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/banner/getBannerInfo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ BannerID: BannerIDVal }),
      });

      if (!response.ok) throw new Error('Failed to fetch banner info');

      const data = await response.json();
      const banner = data.data?.[0];

      if (banner) {
        setBannerImage(banner.BannerImageUrl || null);
        setUserStatus(banner.UserStatus || 'ACTIVE'); // if banner has status
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching banner details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (BannerIDVal) fetchBannerDetails();
  }, [BannerIDVal]);

  const updateBannerStatus = async () => {
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/banner/updateStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BannerID: BannerIDVal,
          UserStatus: UserStatus,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Update failed');

      setSuccessMsg('Banner status updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update banner status');
    }
  };

  return (
    <div className="form-container">
      <div className="page-title">
        <h3 style={{ margin: 0 }}>View Banner</h3>
        <button
          onClick={() => navigate('/banner/list')}
          className="admin-buttonv1"
          type="button"
        >
          Return
        </button>
      </div>

      <div className="form-row">
        <label>Banner Image</label>
        {BannerImage ? (
          <img src={BannerImage} alt="Banner" className="file-preview" />
        ) : (
          <div className="readonly-value">No image uploaded</div>
        )}
      </div>

      <div className="form-row">
        <label>Status</label>
        <label>
          <input
            type="radio"
            value="ACTIVE"
            checked={UserStatus === 'ACTIVE'}
            onChange={(e) => setUserStatus(e.target.value)}
          />
          Active
        </label>
        <label style={{ marginLeft: '1rem' }}>
          <input
            type="radio"
            value="DE-ACTIVE"
            checked={UserStatus === 'DE-ACTIVE'}
            onChange={(e) => setUserStatus(e.target.value)}
          />
          De-Active
        </label>
      </div>

      <div className="form-row">
        <button type="button" className="admin-buttonv1" onClick={updateBannerStatus}>
          Update Status
        </button>
      </div>

      {error && <p className="message-error">{error}</p>}
      {successMsg && <p className="message-success">{successMsg}</p>}
    </div>
  );
};

export default ViewBanner;
