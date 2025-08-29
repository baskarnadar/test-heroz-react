// Simple, dependency-free validator for your Vendor activity form.
// Returns: { ok: boolean, message: string }

/**
 * Parse flexible time strings into minutes-from-midnight.
 * Accepts:
 *  - "h:mm am/pm" (case-insensitive, minutes can be 1 or 2 digits)
 *  - "h:m: am/pm" (tolerates an extra colon before am/pm, e.g., "9:5: pm")
 *  - "HH:MM" 24-hour
 * Returns number of minutes, or null if invalid.
 */
function parseFlexibleTimeToMinutes(str) {
  if (!str) return null;
  const raw = String(str).trim().toLowerCase();

  // 12-hour with am/pm (tolerate extra colon before meridiem)
  // Examples: "7:8 pm", "7:08 pm", "9:5: pm", "12:30 am", "12:05pm"
  const re12h = /^(\d{1,2})\s*:\s*(\d{1,2})\s*:?\s*(am|pm)$/i;
  const m12 = raw.match(re12h);
  if (m12) {
    let hour = parseInt(m12[1], 10);
    let minute = parseInt(m12[2], 10);
    const mer = m12[3].toLowerCase();

    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    if (hour < 1 || hour > 12) return null;
    if (minute < 0 || minute > 59) return null;

    if (mer === 'am') {
      if (hour === 12) hour = 0;
    } else { // pm
      if (hour !== 12) hour += 12;
    }
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
  // 1) Activity Name
  if (!String(payload.txtactName || '').trim()) {
    return { ok: false, message: 'Activity Name is required.' };
  }

  // 2) Activity Type
  if (!String(payload.selectedType || '').trim()) {
    return { ok: false, message: 'Activity Type is required.' };
  }

  // 3) Activity Categories
  if (!Array.isArray(payload.selectedCategories) || payload.selectedCategories.length === 0) {
    return { ok: false, message: 'Select at least one Activity Category.' };
  }

  // 4) Activity Description
  if (!String(payload.txtactDesc || '').trim()) {
    return { ok: false, message: 'Activity Description is required.' };
  }

  // 5) Activity Images: at least one of the three must be provided
  const hasImg1 = !!payload.txtactImageName1;
  const hasImg2 = !!payload.txtactImageName2;
  const hasImg3 = !!payload.txtactImageName3;
  if (!hasImg1 && !hasImg2 && !hasImg3) {
    return { ok: false, message: 'Upload at least one Activity Image.' };
  }

  // 6) Activity Location
  if (!String(payload.txtactGoogleMap || '').trim()) {
    return { ok: false, message: 'Google Map Location is required.' };
  }
  if (!String(payload.txtactGlat || '').trim()) {
    return { ok: false, message: 'Google Latitude is required.' };
  }
  if (!String(payload.txtactGlan || '').trim()) {
    return { ok: false, message: 'Google Longitude is required.' };
  }
  if (!String(payload.ddactCountryID || '').trim()) {
    return { ok: false, message: 'Country is required.' };
  }
  if (!String(payload.ddactCityID || '').trim()) {
    return { ok: false, message: 'City is required.' };
  }
  if (!String(payload.txtactAddress1 || '').trim()) {
    return { ok: false, message: 'Address1 is required.' };
  }

  // 7) Gender
  if (!String(payload.rdoactGender || '').trim()) {
    return { ok: false, message: 'Gender is required.' };
  }

  // 8) Price Per Student (at least one price > 0; each filled price must be > 0)
  const ranges = Array.isArray(payload.priceRanges) ? payload.priceRanges : [];
  const anyPricePositive = ranges.some((r) => Number(r.price) > 0);
  if (!anyPricePositive) {
    return { ok: false, message: 'Enter at least one Price Per Student greater than 0.' };
  }
  for (const r of ranges) {
    if (String(r.price || '').trim() !== '' && Number(r.price) <= 0) {
      return { ok: false, message: 'Price Per Student must be greater than 0.' };
    }
  }

  // 9) Set Availability (UPDATED)
  // - Do NOT require any day to have time ranges.
  // - If a row has any value, it must have BOTH start & end,
  //   must parse as valid time (flexible formats), and End > Start.
  const days = payload.days || {};
  const dayNames = Object.keys(days);

  for (const d of dayNames) {
    const day = days[d];
    if (!day || day.closed) continue;

    const times = Array.isArray(day.times) ? day.times : [];
    for (let i = 0; i < times.length; i++) {
      const t = times[i] || {};
      const sRaw = String(t.start || '').trim();
      const eRaw = String(t.end || '').trim();

      // If nothing entered, skip
      if (!sRaw && !eRaw) continue;

      // If one side filled, both required
      if (!sRaw || !eRaw) {
        return {
          ok: false,
          message: `Start and End time are required for ${d} (row ${i + 1}). Expected like "7:08 am" or "9:05 pm".`,
        };
      }

      // Parse flexible formats
      const sMin = parseFlexibleTimeToMinutes(sRaw);
      const eMin = parseFlexibleTimeToMinutes(eRaw);
      if (sMin === null || eMin === null) {
        return {
          ok: false,
          message: `Invalid time format on ${d} (row ${i + 1}). Use "7:08 am", "9:5 pm", or "21:05".`,
        };
      }

      if (eMin <= sMin) {
        return { ok: false, message: `End time must be after Start time on ${d} (row ${i + 1}).` };
      }
    }
  }

  // 10) Food: if Include == true, force price = 0 (mutates payload.foods)
  const foods = Array.isArray(payload.foods) ? payload.foods : [];
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i] || {};
    if (f.include === true) {
      foods[i].price = 0;
    } else if (f.price != null && Number(f.price) < 0) {
      return { ok: false, message: `Food "${f.name || ''}" price cannot be negative.` };
    }
  }

  // 11) Terms and Conditions
  if (!String(payload.txtactAdminNotes || '').trim()) {
    return { ok: false, message: 'Terms and Conditions are required.' };
  }

  return { ok: true, message: 'OK' };
}
