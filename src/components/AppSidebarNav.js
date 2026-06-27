import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import PropTypes from 'prop-types'

import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

import { CBadge } from '@coreui/react'

export const AppSidebarNav = ({ items }) => {
  const location = useLocation()

  const getItemPath = (to) => {
    if (!to) return ''
    return String(to).split('?')[0]
  }

  const hasActiveChild = (item) => {
    if (!item?.items || !Array.isArray(item.items)) return false

    return item.items.some((child) => {
      const childPath = getItemPath(child?.to)

      if (childPath && location.pathname.startsWith(childPath)) {
        return true
      }

      if (child?.items) {
        return hasActiveChild(child)
      }

      return false
    })
  }

  const getGroupKey = (item, index, parentKey = '') => {
    const key = item?.menuKey || item?.name || `group-${index}`
    return parentKey ? `${parentKey}-${key}-${index}` : `${key}-${index}`
  }

  // Accordion-safe initial state: at each level only the FIRST group that
  // matches (autoOpen or has active child) is opened. All others stay closed.
  const buildInitialOpenGroups = useMemo(() => {
    const openState = {}

    const scan = (navItems, parentKey = '') => {
      let levelOpened = false

      navItems.forEach((item, index) => {
        if (item?.items) {
          const key = getGroupKey(item, index, parentKey)
          const shouldOpen = !levelOpened && (item?.autoOpen === true || hasActiveChild(item))

          openState[key] = shouldOpen
          if (shouldOpen) levelOpened = true

          scan(item.items, key)
        }
      })
    }

    scan(items || [])
    return openState
  }, [items, location.pathname])

  const [openGroups, setOpenGroups] = useState(buildInitialOpenGroups)

  useEffect(() => {
    setOpenGroups(buildInitialOpenGroups)
  }, [buildInitialOpenGroups])

  // Map of parentKey -> sibling group keys at that level (for accordion close)
  const siblingMap = useMemo(() => {
    const map = {}
    const scan = (navItems, parentKey = '') => {
      const siblingKeys = []
      navItems.forEach((item, index) => {
        if (item?.items) {
          const key = getGroupKey(item, index, parentKey)
          siblingKeys.push(key)
          scan(item.items, key)
        }
      })
      if (siblingKeys.length) map[parentKey] = siblingKeys
    }
    scan(items || [])
    return map
  }, [items])

  // When a group is clicked: close all siblings at the same level, then toggle
  const toggleGroup = (key, parentKey = '') => {
    setOpenGroups((prev) => {
      const isCurrentlyOpen = prev[key]
      const siblings = siblingMap[parentKey] || []
      const next = { ...prev }
      siblings.forEach((sibKey) => { next[sibKey] = false })
      next[key] = !isCurrentlyOpen
      return next
    })
  }

  const navLinkContent = (name, icon, badge, indent = false) => {
    return (
      <>
        {icon
          ? icon
          : indent && (
              <span className="nav-icon">
                <span className="nav-icon-bullet"></span>
              </span>
            )}

        {name}

        {badge && (
          <CBadge color={badge.color} className="ms-auto">
            {badge.text}
          </CBadge>
        )}
      </>
    )
  }

  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, style, className, ...rest } = item

    if (!rest.to && !rest.href && !item.items) {
      return (
        <li key={index} className={className || 'nav-title'} style={style || undefined}>
          {navLinkContent(name, icon, badge, indent)}
        </li>
      )
    }

    return (
      <li key={index} className={`nav-item ${className || ''}`} style={style || undefined}>
        {rest.to ? (
          <NavLink className="nav-link" to={rest.to} end={false}>
            {navLinkContent(name, icon, badge, indent)}
          </NavLink>
        ) : (
          <a className="nav-link" href={rest.href || '#'} target={rest.href ? '_blank' : undefined} rel={rest.href ? 'noopener noreferrer' : undefined}>
            {navLinkContent(name, icon, badge, indent)}
          </a>
        )}
      </li>
    )
  }

  const navGroup = (item, index, parentKey = '') => {
    const { name, icon, badge, items: childItems, toggler, style, className } = item
    const key = getGroupKey(item, index, parentKey)
    const isOpen = openGroups[key] === true

    return (
      <li
        key={key}
        className={`nav-group ${isOpen ? 'show' : ''} ${className || ''}`}
        style={style || undefined}
      >
        <a
          href="#"
          className="nav-link nav-group-toggle"
          onClick={(e) => {
            e.preventDefault()
            toggleGroup(key, parentKey)
          }}
        >
          {toggler || navLinkContent(name, icon, badge)}
        </a>

        <ul
          className="nav-group-items"
          style={{
            display: isOpen ? 'block' : 'none',
            height: isOpen ? 'auto' : 0,
            overflow: isOpen ? 'visible' : 'hidden',
          }}
        >
          {childItems?.map((child, childIndex) =>
            child.items ? navGroup(child, childIndex, key) : navItem(child, childIndex, true),
          )}
        </ul>
      </li>
    )
  }

  return (
    <SimpleBar>
      <ul className="sidebar-nav">
        {items &&
          items.map((item, index) =>
            item.items ? navGroup(item, index) : navItem(item, index),
          )}
      </ul>
    </SimpleBar>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
}