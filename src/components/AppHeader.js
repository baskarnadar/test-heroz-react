import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavItem,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilContrast, cilMenu, cilMoon, cilSun } from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

import { getCurrentLoggedUserType,getAuthHeadersV1  } from '../utils/operation'
import { API_BASE_URL } from '../config'

const UserRoleLabel = () => {
  const usertype = localStorage.getItem('usertype')

  let roleLabel = 'SAMPLE'
  if (usertype == 'SCHOOL-SUBADMIN') {
    roleLabel = ''
  } else if (usertype == 'VENDOR-SUBADMIN') {
    roleLabel = ''
  } else if (usertype == 'ADMIN') {
    roleLabel = ''
  }

  return <span>{roleLabel}</span>
}

const AppHeader = () => {
  const [totalCountVal, setTotalCountVal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  useEffect(() => {
    // Scroll shadow logic
    const handleScroll = () => {
      if (headerRef.current) {
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
      }
    }
    document.addEventListener('scroll', handleScroll)

    // Fetch notifications when component mounts
    const fetchNotification = async () => {
      setLoading(true)
      try {
        const noteResponse = await fetch(`${API_BASE_URL}/common/totnote`, {
          method: 'POST',
          headers: getAuthHeadersV1(),
          body: JSON.stringify({ noteTo: getCurrentLoggedUserType() }),
        })
        console.log('noteResponse')
        console.log(noteResponse)
        if (noteResponse.ok) {
          const noteData = await noteResponse.json()
          console.log(noteData)
          const totalCountVal = noteData?.data?.totalCount || 0

          const total = noteData?.data?.totalCount || 0
          setTotalCountVal(total)

          console.log('Total New Notifications:', totalCountVal)
          // You can store this in state if needed
        } else {
          console.warn('Failed to fetch total notifications')
        }
      } catch (error) {
        setError('Error fetching notifications')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotification()

    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
          style={{ marginInlineStart: '-14px' }}
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <div className="flex-grow-1 text-center">
          <h4>
            {localStorage.getItem('loggedusername')} <UserRoleLabel />
          </h4>
        </div>

        <CHeaderNav className="ms-auto">
          <CNavItem>
            <Link to="/admindata/note/list" className="nav-link position-relative">
              <CIcon icon={cilBell} size="lg" />
              <span
                className="position-absolute top-0 start-100 badge rounded-pill bg-danger"
                style={{
                  transform: 'translate(-50%, 10%)',
                  fontSize: '0.7rem',
                }}
              >
                {totalCountVal}
              </span>
            </Link>
          </CNavItem>
        </CHeaderNav>

        <CHeaderNav>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
        
        {/*   <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false}>
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                active={colorMode === 'light'}
                className="d-flex align-items-center"
                as="button"
                onClick={() => setColorMode('light')}
              >
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
            
          </CDropdown>
          */}
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>

      <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
