import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import '../../../scss/toast.css';
import { checkLogin } from '../../../utils/auth';
import { DspToastMessage,getAuthHeaders } from '../../../utils/operation';

const SubMenuForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const SubMenuID = queryParams.get('SubMenuID');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [loading, setLoading] = useState(false);

  const [EnMenuName, setEnMenuName] = useState('');
  const [ArMenuName, setArMenuName] = useState('');
  const [MainMenuID, setMainMenuID] = useState('');
  const [PageID, setPageID] = useState('');

  const [mainMenuList, setMainMenuList] = useState([]);

  useEffect(() => {
    checkLogin(navigate);
    fetchMainMenuList();
  }, [navigate]);

  useEffect(() => {
    const fetchSubMenuData = async () => {
      if (!SubMenuID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/submenu/getsubmenu`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ SubMenuID }),
        });

        const result = await res.json();
        const submenu = result.data;

        console.log(submenu.PageID);
        if (submenu) {
          setEnMenuName(submenu.EnMenuName || '');
          setArMenuName(submenu.ArMenuName || '');
          setMainMenuID(submenu.MainMenuID || '');
          setPageID(submenu.PageID || '');
        }
      } catch (err) {
        console.error('Error fetching submenu:', err);
      }
    };

    fetchSubMenuData();
  }, [SubMenuID]);

  const fetchMainMenuList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/mainmenu/getmainmenulist`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
    setToastMessage('');

    if (!EnMenuName || !ArMenuName || !MainMenuID || !PageID) {
      setToastType('fail');
      setToastMessage('Please fill all required fields.');
      setLoading(false);
      return;
    }
    const payload = {
      EnMenuName,
      ArMenuName,
      MainMenuID,
      PageID,
    };

    if (SubMenuID) payload.SubMenuID = SubMenuID;

    const apiUrl = SubMenuID
      ? `${API_BASE_URL}/submenu/updatesubmenu`
      : `${API_BASE_URL}/submenu/createsubmenu`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastType('success');
      setToastMessage(`SubMenu ${SubMenuID ? 'updated' : 'created'} successfully!`);
      setTimeout(() => navigate('/submenu/list'), 2000);
    } catch (error) {
      console.error('Error saving submenu:', error);
      setToastType('fail');
      setToastMessage('Failed to save submenu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{SubMenuID ? 'Edit' : 'Add'} SubMenu</h3>
        <button
          type="button"
          onClick={() => navigate('/submenu/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English Menu Name</label>
        <input
          type="text"
          className="admin-txt-box"
          value={EnMenuName}
          onChange={(e) => setEnMenuName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic Menu Name</label>
        <input
          type="text"
          className="admin-txt-box"
          value={ArMenuName}
          onChange={(e) => setArMenuName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Page ID</label>
        <input
          type="text"
          className="admin-txt-box"
          value={PageID}
          onChange={(e) => setPageID(e.target.value)}
          required
        />
      </div>

     <div className="form-group">
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

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : SubMenuID ? 'Update SubMenu' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default SubMenuForm;
