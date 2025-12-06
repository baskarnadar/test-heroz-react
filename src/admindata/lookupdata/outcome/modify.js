import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';

const OutcomeForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const OutComeID = queryParams.get('OutComeID');

  const [loading, setLoading] = useState(false);

  const [EnOutCome, setEnOutCome] = useState('');
  const [ArOutCome, setArOutCome] = useState('');
  const [IsDataStatus, setIsDataStatus] = useState(true);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  // ✅ Admin login validation
  useEffect(() => {
    IsAdminLoginIsValid();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const fetchOutcomeData = async () => {
      if (!OutComeID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/outcome/getoutcome`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ OutComeID }),
        });

        const result = await res.json();
        const outcome = result.data;

        if (outcome) {
          setEnOutCome(outcome.EnOutCome || '');
          setArOutCome(outcome.ArOutCome || '');
          setIsDataStatus(outcome.IsDataStatus === 1 || outcome.IsDataStatus === true);
        }
      } catch (err) {
        console.error('Error fetching outcome:', err);
      }
    };

    fetchOutcomeData();
  }, [OutComeID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');

    if (!EnOutCome.trim() || !ArOutCome.trim()) {
      setToastMessage('Please fill in all required fields.');
      setToastType('fail');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        OutComeID,
        EnOutCome,
        ArOutCome,
        // ⛔ OrderID removed (hidden)
        IsDataStatus: IsDataStatus ? 1 : 0,
        ModifyBy: 'USER',
      };

      const response = await fetch(`${API_BASE_URL}/lookupdata/outcome/updateoutcome`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('Outcome updated successfully!');
      setToastType('success');
      setTimeout(() => navigate('/admindata/outcome/list'), 2000);
    } catch (err) {
      console.error('Error updating outcome:', err);
      setToastMessage('Failed to update outcome.');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{OutComeID ? 'Edit' : 'Add'} Outcome</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/outcome/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English Outcome</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnOutCome}
          onChange={(e) => setEnOutCome(e.target.value)}
          placeholder="Enter English Outcome"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic Outcome</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArOutCome}
          onChange={(e) => setArOutCome(e.target.value)}
          placeholder="Enter Arabic Outcome"
          required
        />
      </div>

      {/* Order ID field removed / hidden */}

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={IsDataStatus}
            onChange={(e) => setIsDataStatus(e.target.checked)}
          />{' '}
          Active
        </label>
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : OutComeID ? 'Update Outcome' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default OutcomeForm;
