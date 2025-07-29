import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';

const AddNewSubMenu = () => {
  const navigate = useNavigate();

  const [EnMenuName, setEnMenuName] = useState('');
  const [ArMenuName, setArMenuName] = useState('');
  const [MainMenuID, setMainMenuID] = useState('');
  const [PageID, setPageID] = useState('');
  const [mainMenuList, setMainMenuList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkLogin(navigate);
    fetchMainMenuList();
  }, [navigate]);

  const fetchMainMenuList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mainmenu/getmainmenulist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      setMainMenuList(data.data || []);
    } catch (err) {
      console.error('Failed to fetch main menu list', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!EnMenuName || !ArMenuName || !MainMenuID || !PageID) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/submenu/createsubmenu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          EnMenuName,
          ArMenuName,
          MainMenuID,
          PageID,
          CreatedBy: 'USER',
          ModifyBy: 'USER',
          IsDataStatus: 1,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      setEnMenuName('');
      setArMenuName('');
      setMainMenuID('');
      setPageID('');
      setError('SubMenu added successfully!');
    } catch (error) {
      console.error('Error adding submenu:', error);
      setError('Failed to add submenu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="page-title">
        <h3 style={{ margin: 0 }}>New SubMenu</h3>
        <button type="button" onClick={() => navigate('/submenu/list')} className="admin-buttonv1">
          Return
        </button>
      </div>

      <div className="form-row">
        <label>English Menu Name</label>
        <input
          type="text"
          className="admin-txt-box"
          value={EnMenuName}
          onChange={(e) => setEnMenuName(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label>Arabic Menu Name</label>
        <input
          type="text"
          className="admin-txt-box"
          value={ArMenuName}
          onChange={(e) => setArMenuName(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label>Page ID</label>
        <input
          type="text"
          className="admin-txt-box"
          value={PageID}
          onChange={(e) => setPageID(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <label>Main Menu</label>
        <select
          className="admin-txt-box"
          value={MainMenuID}
          onChange={(e) => setMainMenuID(e.target.value)}
          required
        >
          <option value="">-- Select Main Menu --</option>
          {mainMenuList.map((menu) => (
            <option key={menu.MainMenuID} value={menu.MainMenuID}>
              {menu.ArMenuName}
            </option>
          ))}
        </select>
      </div>

      <div className="button-group">
        <button className="admin-buttonv1" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        <button
          className="admin-buttonv1"
          type="button"
          onClick={() => navigate('/submenu/list')}
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

export default AddNewSubMenu;
