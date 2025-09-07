// /src/admindata/school/validation/schRequiredfld.js

// Loose email check (good enough for UI)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Exactly 10 digits, must start with 05
const MOBILE_05_RE = /^05\d{8}$/;

/** Keep only digits; if user typed 9 digits starting with 5, prefix 0 -> "05xxxxxxxx" */
export function normalizeMobile05(input) {
  if (typeof input !== 'string') return '';
  const digits = input.replace(/\D+/g, '');
  if (digits.length === 9 && digits.startsWith('5')) return `0${digits}`;
  return digits;
}

/**
 * Validate required School fields.
 * Returns { fieldName: "error", ... }
 * Field names match your state vars for easy mapping.
 */
export function validateSchoolRequired(fields) {
  const {
    txtschName,
    txtschEmailAddress,
    txtschMobileNo1,
    txtschAddress1,
    txtschGoogleMap,
    txtschGlan,       // Longitude
    txtschGlat,       // Latitude
    txtschAdminNotes, // Admin Notes
  } = fields;

  const errors = {};

  // School Name
  if (!txtschName || String(txtschName).trim() === '') {
    errors.txtschName = 'School Name is required.';
  }

  // Email Address
  if (!txtschEmailAddress || String(txtschEmailAddress).trim() === '') {
    errors.txtschEmailAddress = 'Email Address is required.';
  } else if (!EMAIL_RE.test(String(txtschEmailAddress).trim())) {
    errors.txtschEmailAddress = 'Please enter a valid email address.';
  }

  // Mobile Number 1 [username] → exactly 10 digits, starts with 05
  const normalized = normalizeMobile05(String(txtschMobileNo1 || ''));
  if (!normalized) {
    errors.txtschMobileNo1 = 'Mobile Number 1 is required.';
  } else if (!MOBILE_05_RE.test(normalized)) {
    errors.txtschMobileNo1 = 'Mobile must be 10 digits and start with 05 (e.g., 05xxxxxxxx).';
  }

  // Address1
  if (!txtschAddress1 || String(txtschAddress1).trim() === '') {
    errors.txtschAddress1 = 'Address1 is required.';
  }

  // Google Map Location
  if (!txtschGoogleMap || String(txtschGoogleMap).trim() === '') {
    errors.txtschGoogleMap = 'Google Map Location is required.';
  }

  // Longitude
  if (!txtschGlan || String(txtschGlan).trim() === '') {
    errors.txtschGlan = 'School Longitude is required.';
  }

  // Latitude
  if (!txtschGlat || String(txtschGlat).trim() === '') {
    errors.txtschGlat = 'School Lattitude is required.';
  }

  // Admin Notes
  if (!txtschAdminNotes || String(txtschAdminNotes).trim() === '') {
    errors.txtschAdminNotes = 'Enter Admin Notes is required.';
  }

  return errors;
}
