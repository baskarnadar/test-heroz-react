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
 
export const checkSchUserExists = async (username, schEmailAddress) => {
  console.log('checkSchUserExists -> request:', { username, schEmailAddress });

  try {
    const res = await axios.post(`${API_BASE_URL}/common/SchIsUserEmailExist`, {
      username,
      schEmailAddress,
    });

    console.log('checkVdrUserEmailExists -> response:', JSON.stringify(res.data, null, 2));

    const data = res?.data?.data || {};

    // Backward-compat: if API returns a single `exists` boolean, use it
    if (typeof data.exists === 'boolean') return data.exists;

    // New shape: return true if username OR email exists; false only if both are falsey
    const usernameExists = !!data.usernameExists;
    const emailExists = !!data.emailExists;
    return usernameExists || emailExists;
  } catch (error) {
    if (error.response) {
      console.error(
        'checkVdrUserEmailExists -> error response:',
        error.response.status,
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error('checkVdrUserEmailExists -> network/other error:', error.message);
    }
    return false; // On error, treat as "does not exist" to avoid blocking
  }
};


export const checkVdrUserEmailExists = async (username, vdrEmailAddress) => {
  console.log('checkVdrUserEmailExists -> request:', { username, vdrEmailAddress });

  try {
    const res = await axios.post(`${API_BASE_URL}/common/VdrIsUserEmailExist`, {
      username,
      vdrEmailAddress,
    });

    console.log('checkVdrUserEmailExists -> response:', JSON.stringify(res.data, null, 2));

    const data = res?.data?.data || {};

    // Backward-compat: if API returns a single `exists` boolean, use it
    if (typeof data.exists === 'boolean') return data.exists;

    // New shape: return true if username OR email exists; false only if both are falsey
    const usernameExists = !!data.usernameExists;
    const emailExists = !!data.emailExists;
    return usernameExists || emailExists;
  } catch (error) {
    if (error.response) {
      console.error(
        'checkVdrUserEmailExists -> error response:',
        error.response.status,
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error('checkVdrUserEmailExists -> network/other error:', error.message);
    }
    return false; // On error, treat as "does not exist" to avoid blocking
  }
};
