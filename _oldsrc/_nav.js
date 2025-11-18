// _nav.js
import adminmenu from './menuadmin'
import vendormenu from './menuvendor'
import schoolmenu from './menuschool'

export const getNav = (usertype) => {
  const _nav = []

  if (usertype === 'ADMIN') _nav.push(...adminmenu)
  if (usertype === 'VENDOR-SUBADMIN') _nav.push(...vendormenu)
  if (usertype === 'SCHOOL-SUBADMIN') _nav.push(...schoolmenu)

  return _nav
}
