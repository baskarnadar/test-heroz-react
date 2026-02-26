// _nav.js
import adminmenu from './menuadmin'
import vendormenu from './menuvendor'
import schoolmenu from './menuschool'
import membershipmenu from './menumembership'   // ✅ NEW

export const getNav = (usertype) => {
  const _nav = []

  if (usertype === 'ADMIN') _nav.push(...adminmenu)
  if (usertype === 'VENDOR-SUBADMIN') _nav.push(...vendormenu)
  if (usertype === 'SCHOOL-SUBADMIN') _nav.push(...schoolmenu)

  // ✅ ADD MEMBERSHIP SUPPORT
  if (usertype === 'MEMBERSHIP') _nav.push(...membershipmenu)

  return _nav
}