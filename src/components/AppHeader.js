// src/_nav/AppHeader.jsx
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
  CButton,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBell, cilContrast, cilMenu, cilMoon, cilSun } from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

import { getCurrentLoggedUserType, getAuthHeadersV1 } from '../utils/operation'
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

  // Language (default AR), persisted and applies dir/lang on <html>
  const getStoredLang = () => {
    try {
      const v = localStorage.getItem('heroz_lang')
      return v === 'ar' || v === 'en' ? v : 'ar'
    } catch {
      return 'ar'
    }
  }
  const [lang, setLang] = useState(getStoredLang())
  useEffect(() => {
    try { localStorage.setItem('heroz_lang', lang) } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', lang)
    }
    // 🔔 notify app (if any listeners exist)
    try { window.dispatchEvent(new CustomEvent('heroz_lang_changed', { detail: { lang } })) } catch {}
  }, [lang])

  // ⬇️ keep your function name; just enhance it
  const toggleLang = () =>
    setLang((p) => {
      const next = p === 'ar' ? 'en' : 'ar'
      // write immediately so a reload picks it up
      try { localStorage.setItem('heroz_lang', next) } catch {}
      // flip html attrs instantly for visual direction
      try {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('dir', next === 'ar' ? 'rtl' : 'ltr')
          document.documentElement.setAttribute('lang', next)
        }
      } catch {}
      // notify any live listeners (optional)
      try { window.dispatchEvent(new CustomEvent('heroz_lang_changed', { detail: { lang: next } })) } catch {}
      // ✅ hard refresh so screens that read lang at mount re-render in the new language
      setTimeout(() => { try { window.location.reload() } catch {} }, 10)
      return next
    })

  // Notifications link
  const userType = localStorage.getItem('usertype') || getCurrentLoggedUserType()
  const noteLink =
    userType === 'VENDOR-SUBADMIN'
      ? '/vendordata/note/list'
      : userType === 'ADMIN'
      ? '/admindata/note/list'
      : null

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
      }
    }
    document.addEventListener('scroll', handleScroll)

    const fetchNotification = async () => {
      setLoading(true)
      try {
        const noteResponse = await fetch(`${API_BASE_URL}/common/totnote`, {
          method: 'POST',
          headers: getAuthHeadersV1(),
          body: JSON.stringify({ noteTo: getCurrentLoggedUserType() }),
        })

        if (noteResponse.ok) {
          const noteData = await noteResponse.json()
          const total = noteData?.data?.totalCount ?? 0
          setTotalCountVal(total)
          console.log('Total New Notifications:', total)
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
    return () => document.removeEventListener('scroll', handleScroll)
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
            {noteLink && (
              <Link to={noteLink} className="nav-link position-relative">
                <CIcon icon={cilBell} size="lg" />
                <span
                  className="position-absolute top-0 start-100 badge rounded-pill bg-danger"
                  style={{ transform: 'translate(-50%, 10%)', fontSize: '0.7rem' }}
                >
                  {totalCountVal}
                </span>
              </Link>
            )}
          </CNavItem>
        </CHeaderNav>

        <CHeaderNav>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

          {/* Language toggle (shows opposite label) */}
          <CNavItem className="d-flex align-items-center">
            <CButton
              size="sm"
              color="light"
              className="d-inline-flex align-items-center gap-1"
              type="button"
              onClick={toggleLang}
              title={lang === 'ar' ? 'English' : 'العربية'}
              aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <span role="img" aria-hidden>🌐</span> {lang === 'ar' ? 'EN' : 'AR'}
            </CButton>
          </CNavItem>

          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

          {/* Theme switcher kept as comment per your original */}
          {/*
          <CDropdown variant="nav-item" placement="bottom-end">
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
