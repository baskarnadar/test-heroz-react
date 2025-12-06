import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';

const AddOutcomeForm = () => {
  const navigate = useNavigate();

  const [EnOutCome, setEnOutCome] = useState('');
  const [ArOutCome, setArOutCome] = useState('');
  const [IsDataStatus, setIsDataStatus] = useState(true);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!EnOutCome || !ArOutCome) {
      setToastMessage('Please fill in all required fields.');
      setToastType('fail');
      return;
    }

    setLoading(true);
    setToastMessage('');

    try {
      const payload = {
        EnOutCome,
        ArOutCome,
        // ⛔ OrderID hidden and removed
        IsDataStatus: IsDataStatus ? 1 : 0,
        CreatedBy: 'USER',
        ModifyBy: 'USER',
      };

      const response = await fetch(`${API_BASE_URL}/lookupdata/outcome/createoutcome`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      await response.json();
      setToastMessage('Outcome added successfully!');
      setToastType('success');

      setTimeout(() => {
        navigate('/admindata/outcome/list');
      }, 2000);
    } catch (error) {
      console.error('Error adding outcome:', error);
      setToastMessage('Failed to add outcome.');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Add Outcome</h3>
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

      {/* OrderID fully removed */}

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
          {loading ? 'Saving...' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default AddOutcomeForm;
