import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';
import { DspToastMessage,getAuthHeaders } from '../../../utils/operation';

const OfferForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const SchEduLevelID = queryParams.get('SchEduLevelID');

  const [loading, setLoading] = useState(false);
 

  const [EnSchEduLevelName, setEnSchEduLevelName] = useState('');
  const [ArSchEduLevelName, setArSchEduLevelName] = useState('');

  const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchSchEduLevelData = async () => {
      if (!SchEduLevelID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/schedulevel/getschedulevel`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ SchEduLevelID }),
        });

        const result = await res.json();
        const SchEduLevel = result.data;

        if (SchEduLevel) {
          setEnSchEduLevelName(SchEduLevel.EnSchEduLevelName || '');
          setArSchEduLevelName(SchEduLevel.ArSchEduLevelName || '');
        }
      } catch (err) {
        console.error('Error fetching SchEduLevel:', err);
      }
    };

    fetchSchEduLevelData();
  }, [SchEduLevelID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');

    if (!EnSchEduLevelName.trim() || !ArSchEduLevelName.trim()) {
      setToastMessage('Please fill in all required fields.');
       setToastType('fail');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        SchEduLevelID,
        EnSchEduLevelName,
        ArSchEduLevelName,
        ModifyDate: new Date(),
        ModifyBy: 'USER',
      };

      const response = await fetch(`${API_BASE_URL}/lookupdata/schedulevel/updateSchedulevel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('SchEduLevel updated successfully!');
       setToastType('success');
      setTimeout(() => navigate('/admindata/schedulevel/list'), 2000);
    } catch (err) {
      console.error('Error updating SchEduLevel:', err);
      setToastMessage('Failed to update SchEduLevel.');
       setToastType('fail');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{SchEduLevelID ? 'Edit' : 'Add'} SchEduLevel</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/schedulevel/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English SchEduLevel Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnSchEduLevelName}
          onChange={(e) => setEnSchEduLevelName(e.target.value)}
          placeholder="Enter English SchEduLevel Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic SchEduLevel Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArSchEduLevelName}
          onChange={(e) => setArSchEduLevelName(e.target.value)}
          placeholder="Enter Arabic SchEduLevel Name"
          required
        />
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : SchEduLevelID ? 'Update SchEduLevel' : 'Submit'}
        </button>
      </div>

     <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default OfferForm;
