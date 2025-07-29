import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { checkLogin } from '../../utils/auth';
import '../../scss/toast.css';

const AddUserForm = () => {
  const navigate = useNavigate();

  const [userfullname, setuserfullname] = useState('');
  const [username, setusername] = useState('');
  const [password, setpassword] = useState(''); // 🔐 New state for password
  const [usertype, setusertype] = useState('');
  const [userstatus, setuserstatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userfullname || !username || !password || !usertype) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
 
    try {
      const response = await fetch(`${API_BASE_URL}/subadmin/createsubadmin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userfullname,
          username,
          password,  
          usertype,
          userstatus: userstatus ? 1 : 0,
          CreatedBy: 'ADMIN',
          ModifyBy: 'ADMIN',
        }),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const result = await response.json();
      setToastMessage('User added successfully!');
      setTimeout(() => navigate('/admindata/subadmin/list'), 2000);
    } catch (err) {
      console.error('Error adding user:', err);
      setError('Failed to add user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3 style={{ margin: 0 }}>Add User</h3>
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
          placeholder="Enter Full Name"
          required
        />
      </div>

      <div className="form-group">
        <label>User Name (Mobile No)</label>
        <input
          className="admin-txt-box"
          type="text"
          value={username}
          onChange={(e) => setusername(e.target.value)}
          placeholder="Enter User Name"
          required
        />
      </div>

      <div className="form-group">
        <label>password</label>
        <input
          className="admin-txt-box"
          type="password"
          value={password}
          onChange={(e) => setpassword(e.target.value)}
          placeholder="Enter password"
          required
        />
      </div>

      <div className="form-group">
        <label>User Type</label>
        <select
          className="admin-txt-box"
          value={usertype}
          onChange={(e) => setusertype(e.target.value)}
          required
        >
           <option value="--">--Select User Type</option>
          <option value="ADMIN">ADMIN</option> 
           
        </select>
      </div>

      <div className="form-group">
        <label>Status</label>
        <select
          className="admin-txt-box"
          value={userstatus ? '1' : '0'}
          onChange={(e) => setuserstatus(e.target.value === '1')}
        >
           <option value="--">--Select User Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1">
          {loading ? 'Saving...' : 'Submit'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {toastMessage && <div className="toast-message">{toastMessage}</div>}
    </form>
  );
};

export default AddUserForm;
