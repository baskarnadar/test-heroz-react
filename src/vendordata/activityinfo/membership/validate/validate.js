// Structured validator with per-field errors.
// Returns: { ok: boolean, message: string, errors: Record<string,string> }

function parseFlexibleTimeToMinutes(str) {
  if (!str) return null;
  const raw = String(str).trim().toLowerCase();

  // 12-hour with am/pm (tolerate extra colon before meridiem)
  const re12h = /^(\d{1,2})\s*:\s*(\d{1,2})\s*:?\s*(am|pm)$/i;
  const m12 = raw.match(re12h);
  if (m12) {
    let hour = parseInt(m12[1], 10);
    let minute = parseInt(m12[2], 10);
    const mer = m12[3].toLowerCase();

    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    if (hour < 1 || hour > 12) return null;
    if (minute < 0 || minute > 59) return null;

    if (mer === 'am') { if (hour === 12) hour = 0; }
    else { if (hour !== 12) hour += 12; }
    return hour * 60 + minute;
  }

  // 24-hour "HH:MM"
  const re24h = /^(\d{1,2})\s*:\s*(\d{1,2})$/;
  const m24 = raw.match(re24h);
  if (m24) {
    const hour = parseInt(m24[1], 10);
    const minute = parseInt(m24[2], 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    if (hour < 0 || hour > 23) return null;
    if (minute < 0 || minute > 59) return null;
    return hour * 60 + minute;
  }

  return null;
}

export function validateActivityForm(payload) {
  const errors = {};

  // 1) Activity Name
  if (!String(payload.txtactName || '').trim()) {
    errors.txtactName = 'Activity Name is required.';
  }

  // 2) Activity Type
  if (!String(payload.selectedType || '').trim()) {
    errors.selectedType = 'Activity Type is required.';
  }

  // 3) Activity Categories
  if (!Array.isArray(payload.selectedCategories) || payload.selectedCategories.length === 0) {
    errors.selectedCategories = 'Select at least one Activity Category.';
  }

  // 4) Activity Description
  if (!String(payload.txtactDesc || '').trim()) {
    errors.txtactDesc = 'Activity Description is required.';
  }

  // 5) At least one image
  const hasImg1 = !!payload.txtactImageName1;
  const hasImg2 = !!payload.txtactImageName2;
  const hasImg3 = !!payload.txtactImageName3;
  if (!hasImg1 && !hasImg2 && !hasImg3) {
    errors.images = 'Upload at least one Activity Image.';
  }

  // 6) Location
  if (!String(payload.txtactGoogleMap || '').trim()) {
    errors.txtactGoogleMap = 'Google Map Location is required.';
  }
  if (!String(payload.txtactGlat || '').trim()) {
    errors.txtactGlat = 'Google Latitude is required.';
  }
  if (!String(payload.txtactGlan || '').trim()) {
    errors.txtactGlan = 'Google Longitude is required.';
  }
  if (!String(payload.ddactCountryID || '').trim()) {
    errors.ddactCountryID = 'Country is required.';
  }
  if (!String(payload.ddactCityID || '').trim()) {
    errors.ddactCityID = 'City is required.';
  }
  if (!String(payload.txtactAddress1 || '').trim()) {
    errors.txtactAddress1 = 'Address1 is required.';
  }

  // 7) Gender
  if (!String(payload.rdoactGender || '').trim()) {
    errors.rdoactGender = 'Gender is required.';
  }

  // 7.1) Age Range (REQUIRED)
  const minAgeStr = String(payload.txtactMinAge ?? '').trim();
  const maxAgeStr = String(payload.txtactMaxAge ?? '').trim();
  if (!minAgeStr) {
    errors.txtactMinAge = 'Minimum Age is required.';
  }
  if (!maxAgeStr) {
    errors.txtactMaxAge = 'Maximum Age is required.';
  }
  const minAge = Number(minAgeStr);
  const maxAge = Number(maxAgeStr);
  if (!errors.txtactMinAge && (!Number.isFinite(minAge) || minAge < 0)) {
    errors.txtactMinAge = 'Minimum Age must be a number ≥ 0.';
  }
  if (!errors.txtactMaxAge && (!Number.isFinite(maxAge) || maxAge <= 0)) {
    errors.txtactMaxAge = 'Maximum Age must be a number > 0.';
  }
  if (!errors.txtactMinAge && !errors.txtactMaxAge && maxAge < minAge) {
    errors.txtactMaxAge = 'Maximum Age must be greater than or equal to Minimum Age.';
  }

  // 7.2) Rating (REQUIRED, 1..10)
  const ratingStr = String(payload.actRating ?? '').trim();
  if (!ratingStr) {
    errors.actRating = 'Activity Rating is required (1–10).';
  } else {
    const ratingNum = Number(ratingStr);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      errors.actRating = 'Activity Rating must be between 1 and 10.';
    }
  }

  // 8) Capacity (REQUIRED)
  const minStuStr = String(payload.txtactMinStudent ?? '').trim();
  const maxStuStr = String(payload.txtactMaxStudent ?? '').trim();
  if (!minStuStr) {
    errors.txtactMinStudent = 'Minimum Students is required.';
  }
  if (!maxStuStr) {
    errors.txtactMaxStudent = 'Maximum Students is required.';
  }
  const minStu = Number(minStuStr);
  const maxStu = Number(maxStuStr);
  if (!errors.txtactMinStudent && (!Number.isFinite(minStu) || minStu < 1)) {
    errors.txtactMinStudent = 'Minimum Students must be a number ≥ 1.';
  }
  if (!errors.txtactMaxStudent && (!Number.isFinite(maxStu) || maxStu < 1)) {
    errors.txtactMaxStudent = 'Maximum Students must be a number ≥ 1.';
  }
  if (!errors.txtactMinStudent && !errors.txtactMaxStudent && maxStu < minStu) {
    errors.txtactMaxStudent = 'Maximum Students must be ≥ Minimum Students.';
  }

  // 9) Price Per Student (at least one price > 0; each filled price > 0)
  const ranges = Array.isArray(payload.priceRanges) ? payload.priceRanges : [];
  const anyPricePositive = ranges.some((r) => Number(r.price) > 0);
  if (!anyPricePositive) {
    errors.price = 'Enter at least one Price Per Student greater than 0.';
  } else {
    for (const r of ranges) {
      if (String(r.price || '').trim() !== '' && Number(r.price) <= 0) {
        errors.price = 'Price Per Student must be greater than 0.';
        break;
      }
    }
  }

  // 10) Availability: at least one valid slot required
  const days = payload.days || {};
  const dayNames = Object.keys(days);
  let validSlotCount = 0;

  for (const d of dayNames) {
    const day = days[d];
    if (!day || day.closed) continue;

    const times = Array.isArray(day.times) ? day.times : [];
    for (let i = 0; i < times.length; i++) {
      const t = times[i] || {};
      const sRaw = String(t.start || '').trim();
      const eRaw = String(t.end || '').trim();

      if (!sRaw && !eRaw) continue; // empty row

      if (!sRaw || !eRaw) {
        errors.availability = `Start and End time are required for ${d} (row ${i + 1}).`;
        break;
      }

      const sMin = parseFlexibleTimeToMinutes(sRaw);
      const eMin = parseFlexibleTimeToMinutes(eRaw);
      if (sMin === null || eMin === null) {
        errors.availability = `Invalid time format on ${d} (row ${i + 1}). Use "7:08 am" or "21:05".`;
        break;
      }

      if (eMin <= sMin) {
        errors.availability = `End time must be after Start time on ${d} (row ${i + 1}).`;
        break;
      }

      validSlotCount += 1;
    }
    if (errors.availability) break;
  }

  if (!errors.availability && validSlotCount === 0) {
    errors.availability = 'Please add at least one availability time slot (start & end).';
  }

  // 11) Food: include -> price = 0; no negatives
  const foods = Array.isArray(payload.foods) ? payload.foods : [];
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i] || {};
    if (f.include === true) {
      foods[i].price = 0;
    } else if (f.price != null && Number(f.price) < 0) {
      errors.foods = 'Extra price cannot be negative.';
      break;
    }
  }

  // 12) Terms and Conditions
  if (!String(payload.txtactAdminNotes || '').trim()) {
    errors.txtactAdminNotes = 'Terms and Conditions are required.';
  }

  const ok = Object.keys(errors).length === 0
  return {
    ok,
    message: ok ? 'OK' : 'Please fix the highlighted fields.',
    errors,
  }
}
