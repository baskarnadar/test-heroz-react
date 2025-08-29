// /src/admindata/vendor/validation/fieldvalidation.js

// Accepts formats like: "3:7:am", "3:07 am", "12:5:PM", "11:09PM"
// Rules:
// - Hour: 1-12 (no leading zero required)
// - Minutes: 0-59 (1 or 2 digits)
// - Delimiter before am/pm can be ":" or whitespace
// - am/pm case-insensitive
const TIME12H_REGEX = /^\s*(1[0-2]|[1-9])\s*:\s*([0-5]?\d)\s*([:\s])\s*([aApP][mM])\s*$/;

export const isValidTime12h = (s) => {
  if (typeof s !== 'string') return false;
  return TIME12H_REGEX.test(s);
};

// Normalize to "h:mm am/pm" (lowercase am/pm; minute zero-padded)
export const normalizeTime12h = (s) => {
  const m = s && s.match(TIME12H_REGEX);
  if (!m) return null;
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const ampm = m[4].toLowerCase(); // "am" | "pm"
  const mm = String(minute).padStart(2, '0');
  return `${hour}:${mm} ${ampm}`;
};

// Convert "h:mm am/pm" (our normalized form) OR any accepted input into minutes since midnight
export const time12hToMinutes = (s) => {
  const norm = normalizeTime12h(s);
  if (!norm) return null;
  const [, hStr, mStr, ampm] = norm.match(/^(\d{1,2}):(\d{2})\s*([ap]m)$/);
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (ampm === 'pm' && h !== 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return h * 60 + m;
};

// Returns { day, index, which } if a row is half-filled (start only or end only)
export const findIncompleteRange = (days) => {
  for (const [dayName, dayData] of Object.entries(days)) {
    if (dayData.closed) continue;
    for (let i = 0; i < (dayData.times || []).length; i++) {
      const t = dayData.times[i] || {};
      const hasStart = !!t.start;
      const hasEnd = !!t.end;
      if (hasStart && !hasEnd) return { day: dayName, index: i, which: 'end' };
      if (!hasStart && hasEnd) return { day: dayName, index: i, which: 'start' };
    }
  }
  return null;
};

// Returns { day, index, which } if any provided time string is invalid format
export const findInvalidTimeFormat = (days) => {
  for (const [dayName, dayData] of Object.entries(days)) {
    if (dayData.closed) continue;
    for (let i = 0; i < (dayData.times || []).length; i++) {
      const t = dayData.times[i] || {};
      if (t.start && !isValidTime12h(t.start)) {
        return { day: dayName, index: i, which: 'start' };
      }
      if (t.end && !isValidTime12h(t.end)) {
        return { day: dayName, index: i, which: 'end' };
      }
    }
  }
  return null;
};

// Returns { day, index } if any complete range has start >= end
export const findStartNotBeforeEnd = (days) => {
  for (const [dayName, dayData] of Object.entries(days)) {
    if (dayData.closed) continue;
    for (let i = 0; i < (dayData.times || []).length; i++) {
      const t = dayData.times[i] || {};
      if (!t.start || !t.end) continue;
      if (!isValidTime12h(t.start) || !isValidTime12h(t.end)) continue;
      const sMins = time12hToMinutes(t.start);
      const eMins = time12hToMinutes(t.end);
      if (sMins == null || eMins == null) continue;
      if (sMins >= eMins) return { day: dayName, index: i };
    }
  }
  return null;
};

// Overlap check across ranges within the same day
export const hasOverlap = (days) => {
  for (const [dayName, dayData] of Object.entries(days)) {
    if (dayData.closed) continue;
    const complete = (dayData.times || []).filter(t => t?.start && t?.end && isValidTime12h(t.start) && isValidTime12h(t.end));
    // sort by start minutes to make overlap detection easier
    const enriched = complete.map(t => ({
      ...t,
      _s: time12hToMinutes(t.start),
      _e: time12hToMinutes(t.end),
    })).filter(x => x._s != null && x._e != null);

    for (let i = 0; i < enriched.length; i++) {
      for (let j = i + 1; j < enriched.length; j++) {
        if (enriched[i]._s < enriched[j]._e && enriched[i]._e > enriched[j]._s) {
          return { day: dayName, range1: { start: enriched[i].start, end: enriched[i].end }, range2: { start: enriched[j].start, end: enriched[j].end } };
        }
      }
    }
  }
  return null;
};

// Build payload; normalize times to "h:mm am/pm"
export const buildOpeningHoursPayload = (days, getUserId, OfficeOpenHoursVal = null) => {
  const rows = [];
  const userId = typeof getUserId === 'function' ? getUserId() : null;

  Object.entries(days).forEach(([dayName, dayData]) => {
    if (dayData.closed) return;

    (dayData.times || []).forEach((range) => {
      if (!range?.start || !range?.end) return;
      if (!isValidTime12h(range.start) || !isValidTime12h(range.end)) return;

      const startNorm = normalizeTime12h(range.start);
      const endNorm = normalizeTime12h(range.end);

      rows.push({
        DayName: dayName,
        StartTime: startNorm, // normalized as "h:mm am/pm"
        EndTime: endNorm,
        Note: range.note || '',
        Total: range.total || '0.00',
        CreatedBy: userId,
        ModifyBy: userId,
      });
    });
  });

  return { OfficeOpenHours: OfficeOpenHoursVal, rows };
};
