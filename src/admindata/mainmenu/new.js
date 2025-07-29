import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import { DspToastMessage } from '../../../utils/operation';
const AddNewmainmenu = () => {
  const navigate = useNavigate();

  const [EnMenuName, setEnMenuName] = useState('');
  const [ArMenuName, setArMenuName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');

  // Check user login
  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/mainmenu/createmainmenu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          EnMenuName,
          ArMenuName,
          CreatedBy: 'USER',
          ModifyBy: 'USER',
          IsDataStatus: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('mainmenu creation failed');
      }

      const result = await response.json();
      setToastMessage('mainmenu created successfully!');
      setEnMenuName('');
      setArMenuName('');
       setToastType('success');

    } catch (error) {
      console.error('Error creating mainmenu:', error);
      setToastMessage('Failed to create mainmenu.');
       setToastType('fail');

    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
      <div className="page-title">
        <h3>New mainmenu</h3>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/mainmenu/list')}
        >
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

      <div className="button-group">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/mainmenu/list')}
        >
          Cancel
        </button>
      </div>

      {message && (
        <p
          className={
            message.toLowerCase().includes('success')
              ? 'message-success'
              : 'message-error'
          }
        >
          {message}
        </p>
      )}

         <DspToastMessage message={toastMessage} type={toastType} />
    </form>
    
  );
};

export default AddNewmainmenu;
