import React from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ Make sure this is imported

const ToggleButtons = ({ active, handleClick }) => {
  const navigate = useNavigate(); // ✅ Must be inside the component

  const btnhandleClick = (value) => {
    handleClick(value); // Call parent handler
    if (value === 'SCHOOL') navigate(`/admindata/schoolmgm/schoolinfo/modify`);
    if (value === 'CLASS') navigate(`/admindata/schoolmgm/classinfo/list`);
    if (value === 'STUDENT') navigate(`/admindata/schoolmgm/studentinfo/list`);
    if (value === 'STAFF') navigate(`/admindata/schoolmgm/staffinfo/list`);
    if (value === 'PARENT') navigate(`/admindata/schoolmgm/parentinfo/list`);
    console.log(value);
  };

  return (
    <div className="btnMenu">
      <button
        type="button"
        onClick={() => btnhandleClick('SCHOOL')}
        style={{
          backgroundColor: active === 'SCHOOL' ? '#b0238c' : '',
          marginRight: '10px',
        }}
        className="admin-buttonv1"
      >
        School Information
      </button>

      <button
        type="button"
        onClick={() => btnhandleClick('CLASS')}
        style={{
          backgroundColor: active === 'CLASS' ? '#b0238c' : '',
          marginRight: '10px',
        }}
        className="admin-buttonv1"
      >
        Class Information
      </button>

      <button
        type="button"
        onClick={() => btnhandleClick('STUDENT')}
        style={{
          backgroundColor: active === 'STUDENT' ? '#b0238c' : '',
          marginRight: '10px',
        }}
        className="admin-buttonv1"
      >
        Student Information
      </button>

      <button
        type="button"
        onClick={() => btnhandleClick('STAFF')}
        style={{
          backgroundColor: active === 'STAFF' ? '#b0238c' : '',
          marginRight: '10px',
        }}
        className="admin-buttonv1"
      >
        Staff Information
      </button>

      <button
        type="button"
        onClick={() => btnhandleClick('PARENT')}
        style={{
          backgroundColor: active === 'PARENT' ? '#b0238c' : '',
          marginRight: '10px',
        }}
        className="admin-buttonv1"
      >
        Parents Information
      </button>
    </div>
  );
};

export default ToggleButtons;
