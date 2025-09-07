// src/admindata/vendor/validation/fieldvalidation.js

// === Keep your other helpers (regex/time validators) if you already have them ===
// The key functions referenced by VendorEdit.jsx are findIncompleteRange, hasOverlap, buildOpeningHoursPayload.

// Example minimal stubs (replace with your existing real ones if you have them):
export const findIncompleteRange = (days) => {
  const order = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (const day of order) {
    const d = days?.[day];
    if (!d || d.closed) continue;
    const times = d.times || [];
    for (let i = 0; i < times.length; i++) {
      const t = times[i] || {};
      const hasStart = (t.start || '').trim();
      const hasEnd = (t.end || '').trim();
      if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
        return { day, index: i, which: hasStart ? 'end' : 'start' };
      }
    }
  }
  return null;
};

export const hasOverlap = (days) => {
  const toMin = (s) => {
    const [h, m] = String(s || '').split(':').map(Number);
    return (isNaN(h) || isNaN(m)) ? null : (h * 60 + m);
  };
  const order = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (const day of order) {
    const d = days?.[day];
    if (!d || d.closed) continue;
    const ranges = (d.times || [])
      .filter(t => (t.start || '').trim() && (t.end || '').trim())
      .map(t => ({ ...t, s: toMin(t.start), e: toMin(t.end) }))
      .filter(t => t.s != null && t.e != null && t.s < t.e)
      .sort((a,b) => a.s - b.s);
    for (let i = 1; i < ranges.length; i++) {
      if (ranges[i].s < ranges[i-1].e) {
        return { day, range1: ranges[i-1], range2: ranges[i] };
      }
    }
  }
  return null;
};

/**
 * Bulletproof builder:
 * - Accepts `getUser` as function or string
 * - Preserves OpeningHrsID if present
 * - Filters out empty/closed rows
 * - ALWAYS returns an array (possibly empty)
 */
export function buildOpeningHoursPayload(days, getUser, existingRows = null) {
  const userId = typeof getUser === 'function' ? (getUser() || '') : (getUser || '');
  const result = [];
  const dayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  dayOrder.forEach((dayKey) => {
    const d = days?.[dayKey];
    if (!d || d.closed) return;

    (d.times || []).forEach((t) => {
      const start = (t.start || '').trim();
      const end   = (t.end || '').trim();
      if (!start || !end) return; // ignore incomplete rows

      result.push({
        vdrDayName: dayKey,
        vdrStartTime: start,
        vdrEndTime: end,
        vdrNote: (t.note || '').trim(),
        OpeningHrsID: t.OpeningHrsID || '',
        CreatedBy: userId,
        ModifyBy: userId,
      });
    });
  });

  return result;
}
