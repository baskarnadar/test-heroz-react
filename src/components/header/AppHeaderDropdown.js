import React from 'react'
  import { cilAccountLogout } from '@coreui/icons'; // make sure this icon is imported
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import {
  cilBell,
  cilCreditCard,
  cilCommentSquare,
  cilEnvelopeOpen,
  cilFile,
  cilLockLocked,
  cilSettings,
  cilTask,
  cilUser,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import avatar8 from './../../assets/images/avatars/8.jpg'
import { Link } from 'react-router-dom';


const AppHeaderDropdown = () => {
  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader>
        <CDropdownItem  >
         <Link to="admindata/note/list" className="nav-link position-relative">
          <CIcon icon={cilBell} className="me-2" />
          Notifcation
          <CBadge color="success" className="ms-2"></CBadge>
          </Link>
        </CDropdownItem>
        <CDropdownItem >
           <Link to="/vendor/info" className="nav-link position-relative">
          <CIcon icon={cilUser} className="me-2" />
          Profile
          </Link>
        </CDropdownItem>
        {/*
        <CDropdownItem >
          <Link to="/setting/list" className="nav-link position-relative">
          <CIcon icon={cilSettings} className="me-2" />
          Settings
          </Link>
        </CDropdownItem>
        <CDropdownItem href="#">
            <Link to="/message/list" className="nav-link position-relative">
          <CIcon icon={cilEnvelopeOpen} className="me-2" />
          Messages
          <CBadge color="success" className="ms-2"></CBadge>
          </Link>
        </CDropdownItem>
  */}
        

<CDropdownItem>
  <Link to="/login" className="nav-link position-relative">
    <CIcon icon={cilAccountLogout} className="me-2" />
    Logout
    <CBadge color="danger" className="ms-2"></CBadge>
  </Link>
</CDropdownItem>


      </CDropdownMenu>
      
    </CDropdown>
  )
}

export default AppHeaderDropdown
