import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { checkLogin } from '../../utils/auth';
import '../../scss/toast.css';

const UserForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const UserID = queryParams.get('UserID');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userfullname, setuserfullname] = useState('');
  const [username, setusername] = useState('');
  const [usertype, setusertype] = useState('Admin');
  const [userstatus, setuserstatus] = useState(1); // 1 = Active, 0 = Inactive

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!UserID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/subadmin/getsubadmin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ UserID }),
        });

        const result = await res.json();
        const user = result.data;

        if (user) {
          setuserfullname(user.userfullname || '');
          setusername(user.username || '');
          setusertype(user.usertype || 'Admin');
          setuserstatus(user.userstatus ?? 1);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUserData();
  }, [UserID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!userfullname.trim() || !username.trim()) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const payload = {
      userfullname,
      username,
      usertype,
      userstatus,
      ModifydBy: 'ADMIN',
    };

    if (UserID) {
      payload.UserID = UserID;
    } else {
      payload.createdBy = 'ADMIN';
    }

    const apiUrl = UserID
      ? `${API_BASE_URL}/subadmin/updateuserbyid`
      : `${API_BASE_URL}/user/create`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setError('User saved successfully!');
      setTimeout(() => navigate('/admindata/subadmin/list'), 2000);
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{UserID ? 'Edit' : 'Add'} User</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/subadmin/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>User Full Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={userfullname}
          onChange={(e) => setuserfullname(e.target.value)}
          required
          placeholder="Enter Full Name"
        />
      </div>

      <div className="form-group">
        <label>User Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={username}
          onChange={(e) => setusername(e.target.value)}
          required
          placeholder="Enter User Name"
        />
      </div>

      <div className="form-group">
        <label>User Type</label>
        <select
          className="admin-txt-box"
          value={usertype}
          onChange={(e) => setusertype(e.target.value)}
        >
          <option value="Admin">Admin</option>
          <option value="Editor">Editor</option>
          <option value="Viewer">Viewer</option>
        </select>
      </div>

      <div className="form-group">
        <label>Status</label>
        <select
          className="admin-txt-box"
          value={userstatus}
          onChange={(e) => setuserstatus(Number(e.target.value))}
        >
          <option value={1}>Active</option>
          <option value={0}>Inactive</option>
        </select>
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : UserID ? 'Update User' : 'Submit'}
        </button>
      </div>

      {error && (
        <div className={`toast-message ${error.includes('success') ? 'success' : 'error'}`}>
          {error}
        </div>
      )}
    </form>
  );
};

export default UserForm;
