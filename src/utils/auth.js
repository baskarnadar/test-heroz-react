// src/utils/auth.js
import axios from 'axios';
import { API_BASE_URL } from '../config'
export const checkLogin = (navigate) => {
  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
  }
};

 

 export async function IsUserAccessPage(navigate,pageid) {

  const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
    else
    {
       return true;
    }

  // try {
  //   const userid = localStorage.getItem('userid');
  //   const username = localStorage.getItem('username');
  //   const groupid = localStorage.getItem('groupid');

  //   // Basic validation
  //   if (!userid || !username || !groupid) {
  //      navigate('/login');
  //     return false;
  //   }

  //   const stored = localStorage.getItem('allowedPages');
  //   if (!stored) {
  //      navigate('/login');
  //     return false;
  //   }

  //   const allowedPages = JSON.parse(stored); 
  //   if (Array.isArray(allowedPages) && allowedPages.includes(pageid)) {
  //     return true;
  //   } else {
  //     // User does not have access
  //     navigate('/login');
  //     return false;
  //   }

  // } catch (error) {
  //   console.error('Access check failed:', error);
  //    navigate('/login');
  //   return false;
  // }
}

export const checkUserExists = async (username) => {
  console.log(username);
  try {
    const response = await axios.post(`${API_BASE_URL}/common/IsUserExist`, {
      username,
    });
    return response.data?.data?.exists === true;
  } catch (error) {
    console.error("Error checking user existence:", error);
    return false; // assume false on error
  }
};