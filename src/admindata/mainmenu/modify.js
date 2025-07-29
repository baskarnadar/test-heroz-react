import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import '../../../scss/toast.css';
import { checkLogin } from '../../../utils/auth';
import { DspToastMessage } from '../../../utils/operation';

const MainMenuForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const MainMenuID = queryParams.get('MainMenuID');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  const [EnMenuName, setEnMenuName] = useState('');
  const [ArMenuName, setArMenuName] = useState('');
  const [loading, setLoading] = useState(false);

  // Check login
  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  // Load MainMenu data if editing
  useEffect(() => {
    const fetchMainMenuData = async () => {
      if (!MainMenuID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/mainmenu/getmainmenu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ MainMenuID }),
        });

        const result = await res.json();
        const MainMenu = result?.data;

        if (MainMenu) {
          setEnMenuName(MainMenu.EnMenuName || '');
          setArMenuName(MainMenu.ArMenuName || '');
        }
      } catch (err) {
        console.error('Error fetching MainMenu:', err);
      }
    };

    fetchMainMenuData();
  }, [MainMenuID]);

  // Handle form submit
   const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setToastMessage('');

  if (!EnMenuName || !ArMenuName) {
    setToastMessage('Please enter both English and Arabic menu names.');
    setToastType('fail');
    setLoading(false);
    return;
  }

  try {
    const payload = {
      EnMenuName,
      ArMenuName,
      ModifyBy: 'USER',
    };

    if (MainMenuID) {
      payload.MainMenuID = MainMenuID; // ✅ include MainMenuID when editing
    }

    const apiUrl = `${API_BASE_URL}/mainmenu/updatemainmenu`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('API error');

    setToastMessage(`MainMenu ${MainMenuID ? 'updated' : 'created'} successfully!`);
    setToastType('success');
    setTimeout(() => navigate('/MainMenu/list'), 2000);
  } catch (error) {
    console.error('Error saving MainMenu:', error);
    setToastType('fail');
    setToastMessage('Failed to save MainMenu.');
  } finally {
    setLoading(false);
  }
};


  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{MainMenuID ? 'Edit' : 'Add'} MainMenu</h3>
        <button
          type="button"
          onClick={() => navigate('/MainMenu/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English Menu Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnMenuName}
          onChange={(e) => setEnMenuName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic Menu Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArMenuName}
          onChange={(e) => setArMenuName(e.target.value)}
          required
        />
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : MainMenuID ? 'Update MainMenu' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default MainMenuForm;
