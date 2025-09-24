// src/pages/admin/VendorEdit.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import { DspToastMessage } from '../../utils/operation';
import FilePreview from '../../views/widgets/FilePreview';
import { getFileNameFromUrl, getCurrentLoggedUserID, getAuthHeaders } from '../../utils/operation';
import { checkVdrUserEmailExists } from '../../utils/auth';

// Opening hours helpers (same as create page)
import {
  findIncompleteRange,
  hasOverlap,
  buildOpeningHoursPayload, // patched to be bulletproof
} from '../../admindata/vendor/validation/fieldvalidation';

const Req = () => <span style={{ color: 'red', fontSize: 18 }}>*</span>;

/* =========================
   Opening-hours helpers
   ========================= */
const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const makeEmptyDays = () => ({
  sunday:    { times: [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
  monday:    { times: [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
  tuesday:   { times: [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
  wednesday: { times: [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
  thursday:  { times: [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
  friday:    { times: [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
  saturday:  { times: [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
});

const normDay = (s='') => String(s).trim().toLowerCase();

/** HH:mm → HH:mm difference in hours as "H.MM" (e.g., "1.50"). */
const diffHours = (start, end) => {
  if (!start || !end) return '';
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  if ([sh, sm, eh, em].some(Number.isNaN)) return '';
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins = 0; // guard; adjust if overnight allowed
  return (Math.round((mins / 60) * 100) / 100).toFixed(2);
};

/** Map API OfficeOpenHours-like rows (NewOfficeOpenHours or OfficeOpenHours) into the `days` state shape. */
const mapOfficeHoursToDays = (officeHours = []) => {
  const next = makeEmptyDays();
  // default closed until we add a range
  for (const k of DAY_KEYS) next[k].closed = true;

  officeHours.forEach((row) => {
    const d = normDay(row?.vdrDayName);
    if (!DAY_KEYS.includes(d)) return;

    const start = row?.vdrStartTime || '';
    const end   = row?.vdrEndTime   || '';
    const note  = row?.vdrNote      || '';
    const total = diffHours(start, end);

    const rangeObj = {
      start, end, note, total,
      OpeningHrsID: row?.OpeningHrsID || '',
      ChkRemoveDays: false,
    };

    if (next[d].closed) {
      next[d].times = [rangeObj];
      next[d].closed = false;
    } else {
      next[d].times.push(rangeObj);
    }
  });

  // Ensure each day has at least one row
  for (const k of DAY_KEYS) {
    if (!next[k].times?.length) {
      next[k].times = [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }];
    }
  }
  return next;
};

/* =========================
   Debug Panel
   ========================= */
const DebugPanel = ({ title, data }) => {
  if (data == null) return null;
  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{ cursor: 'pointer', color: '#334155', fontWeight: 600 }}>{title}</summary>
      <pre
        style={{
          background: '#0b1020',
          color: '#e9f2ff',
          padding: 12,
          borderRadius: 8,
          overflowX: 'auto',
          marginTop: 8,
          maxHeight: 380
        }}
      >
{JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
};

/* ==========================================
   Read-only hours viewer (shows NewOfficeOpenHours)
   ========================================== */
const OfficeOpenHoursView = ({ rows }) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) {
    return (
      <div className="divbox">
        <div style={{ color: '#666', fontSize: 14 }}>No NewOfficeOpenHours found.</div>
      </div>
    );
  }

  return (
    <div className="divbox">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ background: '#f4f6fb' }}>
              <th style={th}>#</th>
              <th style={th}>Day</th>
              <th style={th}>Start</th>
              <th style={th}>End</th>
              <th style={th}>Note</th>
              <th style={th}>OpeningHrsID</th>
            </tr>
          </thead>
          <tbody>
            {safeRows.map((r, i) => (
              <tr key={(r.OpeningHrsID || r._id || i) + ''} style={{ borderTop: '1px solid #e7e7e7' }}>
                <td style={td}>{i + 1}</td>
                <td style={td}>{r?.vdrDayName || '-'}</td>
                <td style={td}>{r?.vdrStartTime || '-'}</td>
                <td style={td}>{r?.vdrEndTime || '-'}</td>
                <td style={td}>{r?.vdrNote || '-'}</td>
                <td style={td} title={r?.OpeningHrsID || ''}>{r?.OpeningHrsID || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DebugPanel title="Raw NewOfficeOpenHours JSON" data={safeRows} />
    </div>
  );
};

const th = {
  textAlign: 'left',
  padding: '10px 12px',
  fontWeight: 700,
  fontSize: 14,
  color: '#1f2937',
  borderBottom: '1px solid #e7e7e7',
};
const td = {
  padding: '10px 12px',
  fontSize: 14,
  color: '#111827',
};

const Vendor = () => {
  const navigate = useNavigate();

  // ===== Server/original file names (kept) =====
  const [OrgtxtvdrImageName1Val, setOrgsetvdrImageName] = useState('');
  const [OrgtxtvdrTaxFileNameVal, setOrgtxtvdrTaxFileName] = useState('');
  const [OrgtxtvdrCRFileNameVal, setOrgtxtvdrCRFileName] = useState('');

  // ===== UX + server status =====
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // ===== Validation states (match create) =====
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [availabilityErr, setAvailabilityErr] = useState('');
  const [existErr, setExistErr] = useState(''); // username/email exists

  // ===== Vendor fetch/edit =====
  const [VendorIDVal, setVendorID] = useState('');
  const [VendorData, SetVendor] = useState(null);

  // ===== Lookups =====
  const [cityList, setCityList] = useState([]);
  const [countries, setCountries] = useState([]);
  const [fetchcategories, setFetchCategories] = useState([]);

  // ===== Categories selection =====
  const [selectedCategories, setSelectedCategories] = useState([]);

  // ===== Inputs (match create) =====
  const [txtvdrName, setVdrName] = useState('');
  const [txtvdrClubName, setClubName] = useState('');

  const [vdrImageName, setvdrImageName] = useState(null);
  const [vdrTaxFileName, setvdrTaxFileName] = useState(null);
  const [vdrCRFileName, setvdrCRFileName] = useState(null);

  const [txtvdrEmailAddress, setVdrEmailAddress] = useState('');
  const [txtvdrMobileNo1, setVdrMobileNo1] = useState(''); // username (read-only shown at top)
  const [txtvdrMobileNo2, setVdrMobileNo2] = useState('');
  const [txtvdrDesc, setVdrDesc] = useState('');

  const [txtvdrCRNumber, setCRNumber] = useState('');

  const [txtvdrAddress1, setAddress1] = useState('');
  const [txtvdrAddress2, setAddress2] = useState('');
  const [txtvdrCountryID, setCountryID] = useState('');
  const [txtvdrCityID, setSelectedCityID] = useState('');
  const [txtvdrRegionName, setRegionName] = useState('');
  const [txtvdrZipCode, setZipCode] = useState('');
  const [txtvdrWebsiteAddress, setWebsiteAddress] = useState('');
  const [txtvdrGoogleMap, setVdrGoogleMap] = useState('');

  const [txtvdrGlat, setGlat] = useState('');
  const [txtvdrGlan, setGlan] = useState('');

  const [txtvdrInstagram, setInstagram] = useState('');
  const [txtvdrFaceBook, setFaceBook] = useState('');
  const [txtvdrX, setX] = useState('');
  const [txtvdrSnapChat, setSnapChat] = useState('');
  const [txtvdrTikTok, setTikTok] = useState('');
  const [txtvdrYouTube, setYouTube] = useState('');

  const [txtvdrBankName, setBankName] = useState('');
  const [txtvdrAccHolderName, setAccHolderName] = useState('');
  const [txtvdrAccIBANNo, setIBANNo] = useState('');
  const [txtvdrTaxName, setTaxName] = useState('');

  const [txtvdrAdminNotes, setAdminNotes] = useState('');

  // ===== Opening hours (same shape as create) =====
  const [days, setDays] = useState(makeEmptyDays());

  // ===== Debug =====
  const [debugPayload, setDebugPayload] = useState(null);
  const [debugResponse, setDebugResponse] = useState(null);

  // ===== Helpers (same as create) =====
  const sanitizeMobile = (v) => v.replace(/\D+/g, '').slice(0, 10);
  const isValidMobile = (m) => /^05\d{8}$/.test(m || '');

  const focusFirstError = (errs) => {
    const order = [
      'txtvdrName','txtvdrClubName','vdrImageName','txtvdrEmailAddress',
      'categories','txtvdrAddress1','txtvdrGoogleMap','txtvdrGlan','txtvdrGlat',
      'availability','openingHours','openingOverlap','txtvdrAdminNotes'
    ];
    const firstKey = order.find((k) => errs[k]);
    if (!firstKey) return;
    const selectorMap = {
      txtvdrName: 'input[name="txtvdrName"]',
      txtvdrClubName: 'input[name="txtvdrClubName"]',
      vdrImageName: 'input[name="txtvdrImageName"]',
      txtvdrEmailAddress: 'input[name="txtvdrEmailAddress"]',
      categories: 'input[name="txtvdrCategoryID"]',
      txtvdrAddress1: 'input[name="txtvdrAddress1"]',
      txtvdrGoogleMap: 'input[name="txtvdrGoogleMap"]',
      txtvdrGlan: 'input[name="txtvdrGLan"]',
      txtvdrGlat: 'input[name="txtvdrGLat"]',
      txtvdrAdminNotes: 'textarea[name="txtvdrAdminNotes"]',
    };
    const el = document.querySelector(selectorMap[firstKey] || 'body');
    if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el?.focus) setTimeout(() => el.focus(), 250);
  };

  const buildToastFromErrors = (errs) => {
    const msgs = Object.values(errs).filter(Boolean);
    if (!msgs.length) return '';
    const top = msgs.slice(0, 3);
    const more = msgs.length > 3 ? ` (and ${msgs.length - 3} more)` : '';
    return `Please fix: ${top.join(' • ')}${more}`;
  };

  const handleClosedChange = (day, isClosed) => {
    setDays((prev) => {
      const updated = { ...prev, [day]: { ...prev[day], closed: isClosed } };
      if (submitted) validateOpeningHours(updated);
      return updated;
    });
  };

  // recompute per-range "total" when editing times
  const handleTimeChange = (day, index, field, value) => {
    setDays((prev) => {
      const updatedTimes = [...prev[day].times];
      const nextRow = { ...updatedTimes[index], [field]: value };
      nextRow.total = diffHours(nextRow.start, nextRow.end); // recompute
      updatedTimes[index] = nextRow;

      const updated = { ...prev, [day]: { ...prev[day], times: updatedTimes } };
      if (submitted) validateOpeningHours(updated);
      return updated;
    });
  };

  const handleAddMore = (day) => {
    setDays((prev) => {
      const existingTimes = prev[day].times || [];
      const updated = {
        ...prev,
        [day]: {
          ...prev[day],
          times: [
            ...existingTimes,
            { start: '', end: '', note: '', total: '', ChkRemoveDays: false }
          ]
        }
      };
      if (submitted) validateOpeningHours(updated);
      return updated;
    });
  };

  const handleRemoveTimeRange = (day, index) => {
    setDays((prev) => {
      const updatedTimes = (prev[day].times || []).filter((_, i) => i !== index);
      const updated = {
        ...prev,
        [day]: {
          ...prev[day],
          times: updatedTimes.length
            ? updatedTimes
            : [{ start: '', end: '', note: '', total: '', ChkRemoveDays: false }],
        },
      };
      if (submitted) validateOpeningHours(updated);
      return updated;
    });
  };

  const handleFileUpload = (setter) => (e) => {
    const file = e.target.files?.[0];
    setter(file || null);
    if (submitted && setter === setvdrImageName) {
      setErrors((old) => ({ ...old, vdrImageName: !(file instanceof File) && !OrgtxtvdrImageName1Val ? 'Vendor Image is required.' : '' }));
    }
  };

  const hasAtLeastOneCompleteRange = (dys) => {
    for (const key of Object.keys(dys || {})) {
      const day = dys[key];
      if (day.closed) continue;
      for (const t of day.times || []) {
        if ((t.start || '').trim() && (t.end || '').trim()) return true;
      }
    }
    return false;
  };

  const validateOpeningHours = (stateDays = days) => {
    if (!hasAtLeastOneCompleteRange(stateDays)) {
      setAvailabilityErr('Enter start & end for at least one available day.');
    } else {
      setAvailabilityErr('');
    }

    const inc = findIncompleteRange(stateDays);
    if (inc) {
      setErrors((old) => ({
        ...old,
        openingHours: `Please enter the ${inc.which} time for ${inc.day} (row ${inc.index + 1}).`,
      }));
    } else {
      setErrors((old) => {
        const { openingHours, ...rest } = old;
        return rest;
      });
    }

    const overlap = hasOverlap(stateDays);
    if (overlap) {
      setErrors((old) => ({
        ...old,
        openingOverlap:
          `Time range overlap on ${overlap.day}: ` +
          `${overlap.range1.start} - ${overlap.range1.end} overlaps with ` +
          `${overlap.range2.start} - ${overlap.range2.end}`,
      }));
    } else {
      setErrors((old) => {
        const { openingOverlap, ...rest } = old;
        return rest;
      });
    }
  };

  const revalidateField = (name, value) => {
    if (!submitted) return;
    setErrors((old) => {
      const next = { ...old };
      switch (name) {
        case 'txtvdrName':
          next.txtvdrName = value.trim() ? '' : 'Vendor Name is required.';
          break;
        case 'txtvdrClubName':
          next.txtvdrClubName = value.trim() ? '' : 'Club Name is required.';
          break;
        case 'txtvdrEmailAddress':
          next.txtvdrEmailAddress = value.trim() ? '' : 'Email Address is required.';
          break;
        case 'txtvdrAddress1':
          next.txtvdrAddress1 = value.trim() ? '' : 'Address1 is required.';
          break;
        case 'txtvdrGoogleMap':
          next.txtvdrGoogleMap = value.trim() ? '' : 'Google Map Location is required.';
          break;
        case 'txtvdrGlan':
          next.txtvdrGlan = `${value}`.trim() ? '' : 'Vendor Longitude is required.';
          break;
        case 'txtvdrGlat':
          next.txtvdrGlat = `${value}`.trim() ? '' : 'Vendor Latitude is required.';
          break;
        case 'txtvdrAdminNotes':
          next.txtvdrAdminNotes = value.trim() ? '' : 'Admin Notes is required.';
          break;
        default:
          break;
      }
      return next;
    });
  };

  // SAFE wrapper: never return null/undefined even if builder is strict.
  const getOpeningHoursTableDataSafe = (existing = null) => {
    try {
      const out = buildOpeningHoursPayload(
        days,
        getCurrentLoggedUserID, // can be a function or a string; patched impl handles both
        existing
      );
      return Array.isArray(out) ? out : [];
    } catch (e) {
      console.error('buildOpeningHoursPayload crashed:', e);
      return [];
    }
  };

  // ===== Submit (updated with same validation flow) =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setToastMessage('');
    setToastType('info');
    setExistErr('');
    setLoading(true);
    setDebugResponse(null);

    try {
      // Client-side validation (persistent)
      const newErrs = validateAll();
      setErrors(newErrs);
      validateOpeningHours(days);

      if (Object.keys(newErrs).length) {
        const msg = buildToastFromErrors(newErrs);
        setToastMessage(msg || 'Please fix the highlighted errors.');
        setToastType('fail');
        focusFirstError(newErrs);
        setLoading(false);
        return;
      }

      // Server-side username/email existence — skip if unchanged
      const emailChanged =
        (txtvdrEmailAddress || '').trim() !== (VendorData?.vdrEmailAddress || '').trim();
      const mobileChanged =
        (txtvdrMobileNo1 || '').trim() !== (VendorData?.vdrMobileNo1 || '').trim();

      if (emailChanged || mobileChanged) {
        try {
          setChecking(true);
          const exists = await checkVdrUserEmailExists(txtvdrMobileNo1, txtvdrEmailAddress);
          if (exists) {
            setExistErr('Username or Email Address already exists. Enter a different Mobile 1 or Email.');
            setToastMessage('Username or Email already exists.');
            setToastType('fail');
            focusFirstError({ txtvdrEmailAddress: 'exists' });
            setLoading(false);
            return;
          }
        } catch (ex) {
          console.error('User/email existence check failed:', ex);
          setToastMessage('Could not verify username/email availability. Please try again.');
          setToastType('fail');
          setLoading(false);
          return;
        } finally {
          setChecking(false);
        }
      }

      // ===== File uploads =====
      const uploadFile = async (file, originalVal) => {
        if (!file) return originalVal || '';
        if (file instanceof File) {
          const fd = new FormData();
          fd.append('image', file);
          fd.append('foldername', 'vendor');
          const res = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, { method: 'POST', body: fd });
          if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
          const j = await res.json();
          const k = j?.data?.key || j?.data?.Key || '';
          return getFileNameFromUrl(k);
        }
        return originalVal || ''; // already a URL string
      };

      const vdrImageNameVal = await uploadFile(vdrImageName, OrgtxtvdrImageName1Val);
      const vdrTaxFileNameVal = await uploadFile(vdrTaxFileName, OrgtxtvdrTaxFileNameVal);
      const vdrCRFileNameVal = await uploadFile(vdrCRFileName, OrgtxtvdrCRFileNameVal);

      // Build hours from DAYS **safely**
      const officeOpenHoursArr = getOpeningHoursTableDataSafe(
        Array.isArray(VendorData?.OfficeOpenHours) ? VendorData.OfficeOpenHours : null
      );

      // Payload (match create keys), with safe hours
      const payload = {
        VendorID: VendorIDVal,
        vdrName: txtvdrName || '',
        vdrClubName: txtvdrClubName || '',
        vdrImageName: vdrImageNameVal,
        vdrTaxFileName: vdrTaxFileNameVal,
        vdrCRFileName: vdrCRFileNameVal,

        vdrEmailAddress: txtvdrEmailAddress || '',
        vdrMobileNo1: txtvdrMobileNo1 || '',
        vdrMobileNo2: txtvdrMobileNo2 || '',
        vdrDesc: txtvdrDesc || '',

        vdrCategoryID: selectedCategories,

        vdrCRNumber: txtvdrCRNumber || '',
        vdrCvdrCRFileName: null, // (kept as your original field)

        vdrAddress1: txtvdrAddress1 || '',
        vdrAddress2: txtvdrAddress2 || '',
        vdrCountryID: txtvdrCountryID || '',
        vdrCityID: txtvdrCityID || '',
        vdrRegionName: txtvdrRegionName || '',
        vdrZipCode: txtvdrZipCode || '',
        vdrWebsiteAddress: txtvdrWebsiteAddress || '',
        vdrGoogleMap: txtvdrGoogleMap || '',

        vdrGlat: txtvdrGlat || '',
        vdrGlan: txtvdrGlan || '',

        vdrInstagram: txtvdrInstagram || '',
        vdrFaceBook: txtvdrFaceBook || '',
        vdrX: txtvdrX || '',
        vdrSnapChat: txtvdrSnapChat || '',
        vdrTikTok: txtvdrTikTok || '',
        vdrYouTube: txtvdrYouTube || '',

        vdrBankName: txtvdrBankName || '',
        vdrAccHolderName: txtvdrAccHolderName || '',
        vdrAccIBANNo: txtvdrAccIBANNo || '',
        vdrTaxName: txtvdrTaxName || '',

        vdrAdminNotes: txtvdrAdminNotes || '',

        // keep whatever your API expects (string/array). We pass back the same value it had.
        vdrIsBirthDayService: (VendorData?.vdrIsBirthDayService ?? ''),

        vdrCapacity: [],
        vdrPricePerPerson: [],

        OfficeOpenHours: officeOpenHoursArr, // NEVER null

        IsDataStatus: 1,
        CreatedBy: typeof getCurrentLoggedUserID === 'function' ? getCurrentLoggedUserID() : getCurrentLoggedUserID,
        ModifyBy: typeof getCurrentLoggedUserID === 'function' ? getCurrentLoggedUserID() : getCurrentLoggedUserID,
      };

      // Debug snapshot
      setDebugPayload(payload);
      console.log('[VendorEdit] Submitting payload:', payload);

      const response = await fetch(`${API_BASE_URL}/vendorinfo/vendor/updatevendor`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const jsonResponse = await response.json().catch(() => ({}));
      setDebugResponse({ status: response.status, ok: response.ok, body: jsonResponse });
      console.log('[VendorEdit] updatevendor response:', response.status, jsonResponse);

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      setToastMessage('Vendor updated successfully!');
      setToastType('success');

      setTimeout(() => navigate('/admindata/vendor/list'), 1500);
    } catch (err) {
      console.error('Error updating Vendor:', err);
      setToastMessage('Failed to update Vendor.');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  // ===== Validation builder (same rules as create) =====
  const validateAll = () => {
    const newErrs = {};

    if (!txtvdrName.trim()) newErrs.txtvdrName = 'Vendor Name is required.';
    if (!txtvdrClubName.trim()) newErrs.txtvdrClubName = 'Club Name is required.';
    if (!(vdrImageName instanceof File) && !OrgtxtvdrImageName1Val) newErrs.vdrImageName = 'Vendor Image is required.';
    if (!txtvdrEmailAddress.trim()) newErrs.txtvdrEmailAddress = 'Email Address is required.'; // still required, read-only

    // NOTE: Mobile Number 1 is read-only now → no editable validation needed

    if (!selectedCategories?.length) newErrs.categories = 'Select at least one Category.';
    if (!txtvdrAddress1.trim()) newErrs.txtvdrAddress1 = 'Address1 is required.';
    if (!txtvdrGoogleMap.trim()) newErrs.txtvdrGoogleMap = 'Google Map Location is required.';
    if (!`${txtvdrGlan}`.trim()) newErrs.txtvdrGlan = 'Vendor Longitude is required.';
    if (!`${txtvdrGlat}`.trim()) newErrs.txtvdrGlat = 'Vendor Latitude is required.';
    if (!txtvdrAdminNotes.trim()) newErrs.txtvdrAdminNotes = 'Admin Notes is required.';

    // Opening hours validations
    if (!hasAtLeastOneCompleteRange(days)) {
      newErrs.availability = 'Enter start & end for at least one available day.';
    }
    const inc = findIncompleteRange(days);
    if (inc) newErrs.openingHours = `Please enter the ${inc.which} time for ${inc.day} (row ${inc.index + 1}).`;
    const overlap = hasOverlap(days);
    if (overlap) {
      newErrs.openingOverlap =
        `Time range overlap on ${overlap.day}: ` +
        `${overlap.range1.start} - ${overlap.range1.end} overlaps with ` +
        `${overlap.range2.start} - ${overlap.range2.end}`;
    }

    return newErrs;
  };

  // ===== Clear server existence error on edits =====
  useEffect(() => {
    if (existErr) setExistErr('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txtvdrMobileNo1, txtvdrEmailAddress]);

  // ===== Lookups =====
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/city/getcityalllist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (json?.data) setCityList(json.data);
      } catch (e) {
        console.error('Error fetching city list:', e);
      }
    };

    const fetchCountriesList = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/country/getcountrylist`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (json?.data) setCountries(json.data);
      } catch (e) {
        console.error('Error fetching countries:', e);
      }
    };

    const fetchCategoryList = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/category/getCategoryAllList`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (json?.data) setFetchCategories(json.data);
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
    };

    fetchCities();
    fetchCountriesList();
    fetchCategoryList();
  }, []);

  // ===== Vendor fetch =====
  const getSearchParams = () => {
    const search =
      window.location.search ||
      (window.location.hash && window.location.hash.includes('?')
        ? `?${window.location.hash.split('?')[1]}`
        : '');
    return new URLSearchParams(search);
  };

  const fetchVendor = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vendorinfo/vendor/getVendor`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ VendorID: id }),
      });
      if (!response.ok) throw new Error('Failed to fetch Vendor');
      const data = await response.json();
      console.log('[VendorEdit] getVendor data:', data?.data);
      SetVendor(data.data || null);
    } catch (err) {
      console.error(err);
      setError('Error fetching Vendor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = getSearchParams();
    const vid = urlParams.get('VendorID');
    if (vid) {
      setVendorID(vid);
      fetchVendor(vid);
    } else {
      setError('VendorID is missing in URL');
    }
  }, []);

  // Helper: some payloads show vdrIsBirthDayService as [] instead of "Yes"/"No"
  const vdrIsBirthdayYes = (() => {
    const v = VendorData?.vdrIsBirthDayService;
    if (Array.isArray(v)) return false;
    const s = String(v || '').trim().toLowerCase();
    return s === 'yes' || s === 'y' || s === 'true' || s === '1';
  })();
  const vdrIsBirthdayNo = !vdrIsBirthdayYes;

  // ===== Hydrate state from VendorData =====
  useEffect(() => {
    if (!VendorData) return;

    setvdrImageName(VendorData.vdrImageNameUrl);
    setvdrCRFileName(VendorData.vdrCRFileNameUrl);
    setvdrTaxFileName(VendorData.vdrTaxFileNameUrl);

    setOrgsetvdrImageName(VendorData.vdrImageName);
    setOrgtxtvdrTaxFileName(VendorData.vdrTaxFileName);
    setOrgtxtvdrCRFileName(VendorData.vdrCRFileName);

    setVdrName(VendorData.vdrName || '');
    setClubName(VendorData.vdrClubName || '');
    setVdrEmailAddress(VendorData.vdrEmailAddress || '');
    setVdrMobileNo1(VendorData.vdrMobileNo1 || '');
    setVdrMobileNo2(VendorData.vdrMobileNo2 || '');
    setVdrDesc(VendorData.vdrDesc || '');

    setAddress1(VendorData.vdrAddress1 || '');
    setAddress2(VendorData.vdrAddress2 || '');

    setCountryID(VendorData.vdrCountryID || '');
    setSelectedCityID(VendorData.vdrCityID || '');

    setRegionName(VendorData.vdrRegionName || '');
    setZipCode(VendorData.vdrZipCode || '');
    setWebsiteAddress(VendorData.vdrWebsiteAddress || '');
    setVdrGoogleMap(VendorData.vdrGoogleMap || '');
    setGlat(VendorData.vdrGlat || '');
    setGlan(VendorData.vdrGlan || '');

    setInstagram(VendorData.vdrInstagram || '');
    setFaceBook(VendorData.vdrFaceBook || '');
    setX(VendorData.vdrX || '');
    setSnapChat(VendorData.vdrSnapChat || '');
    setTikTok(VendorData.vdrTikTok || '');
    setYouTube(VendorData.vdrYouTube || '');

    setBankName(VendorData.vdrBankName || '');
    setAccHolderName(VendorData.vdrAccHolderName || '');
    setIBANNo(VendorData.vdrAccIBANNo || '');
    setTaxName(VendorData.vdrTaxName || '');

    setAdminNotes(VendorData.vdrAdminNotes || '');
    setCRNumber(VendorData.vdrCRNumber || '');

    if (VendorData?.vdrCategoryID) {
      const ids = VendorData.vdrCategoryID.map((id) => String(id));
      setSelectedCategories(ids);
    }

    // Prefer NewOfficeOpenHours; fallback to legacy OfficeOpenHours
    const hoursRows = Array.isArray(VendorData?.NewOfficeOpenHours)
      ? VendorData.NewOfficeOpenHours
      : Array.isArray(VendorData?.OfficeOpenHours)
        ? VendorData.OfficeOpenHours
        : [];

    if (hoursRows.length) {
      const mapped = mapOfficeHoursToDays(hoursRows);
      setDays(mapped);
      validateOpeningHours(mapped);
    } else {
      const empty = makeEmptyDays();
      setDays(empty);
      validateOpeningHours(empty);
    }
  }, [VendorData]);

  // ===== Precompute day-level overlap for inline display =====
  const dayOverlapInfo = submitted ? hasOverlap(days) : null;

  // ===== Render =====
  return (
    <div>
      <div className="divhbg">
        <div className="txtheadertitle">Edit Vendor</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSubmit} disabled={loading || checking}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-buttonv1"
            onClick={() => navigate('/admindata/vendor/list')}
          >
            Return
          </button>
        </div>
      </div>

      {/* READ-ONLY username + email block */}
      <div className="form-group">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block' }}>
              <span style={{ color: 'red', padding: '10px', fontSize: '22px', fontWeight: 'bold' }}>
                username
              </span>
            </label>
            <div
              className="mobile-input-group"
              style={{
                border: '1px solid #ccc',
                borderRadius: '20px',
                padding: '10px 14px',
                fontSize: '18px',
                fontWeight: 600,
                minWidth: 220,
              }}
            >
              {txtvdrMobileNo1 || '-'}
            </div>
          </div>

          <div>
            <label style={{ display: 'block' }}>
              <span style={{ color: '#444', padding: '10px', fontSize: '18px', fontWeight: 'bold' }}>
                Email
              </span>
            </label>
            <div
              className="mobile-input-group"
              style={{
                border: '1px solid #ccc',
                borderRadius: '20px',
                padding: '10px 14px',
                fontSize: '16px',
                fontWeight: 500,
                minWidth: 260,
                background: '#f7f7f7',
              }}
              title={txtvdrEmailAddress}
            >
              {txtvdrEmailAddress || '-'}
            </div>
          </div>
        </div>

        {/* Inline errors (read-only area) */}
        {existErr && <div className="ErrorMsg" style={{ marginTop: 8 }}>{existErr}</div>}
        {submitted && !txtvdrEmailAddress?.trim() && (
          <div className="ErrorMsg" style={{ marginTop: 8 }}>Email Address is required.</div>
        )}
      </div>

      {/* ==== Raw API response from getVendor ==== */}
      {VendorData && (
        <>
          {/* (debug hidden) */}
        </>
      )}

      {/* DEBUG: Outgoing payload & incoming response (hidden) */}

      <div className="txtsubtitle">Vendor Information</div>

      <div className="divbox">
        <div className="form-group">
          <label>Vendor Name <Req /></label>
          <input
            name="txtvdrName"
            className="admin-txt-box"
            placeholder="Enter Vendor Name"
            type="text"
            required
            value={txtvdrName}
            onChange={(e) => { setVdrName(e.target.value); revalidateField('txtvdrName', e.target.value); }}
            aria-invalid={!!errors.txtvdrName}
          />
          {errors.txtvdrName && <div className="ErrorMsg">{errors.txtvdrName}</div>}
        </div>

        <div className="form-group">
          <label>Club Name <Req /></label>
          <input
            name="txtvdrClubName"
            className="admin-txt-box"
            placeholder="Enter Club Name"
            type="text"
            required
            value={txtvdrClubName}
            onChange={(e) => { setClubName(e.target.value); revalidateField('txtvdrClubName', e.target.value); }}
            aria-invalid={!!errors.txtvdrClubName}
          />
          {errors.txtvdrClubName && <div className="ErrorMsg">{errors.txtvdrClubName}</div>}
        </div>

        {/* ✅ Vendor Image upload (required) */}
        <div className="form-group">
          <label>Vendor Image <Req /></label>
          <input
            name="txtvdrImageName"
            type="file"
            onChange={handleFileUpload(setvdrImageName)}
            className="vendor-input"
          />
          {vdrImageName && <FilePreview file={vdrImageName} />}
          {errors.vdrImageName && <div className="ErrorMsg">{errors.vdrImageName}</div>}
        </div>

        {/* Email stays read-only above; editable Mobile 1 removed */}

        <div className="form-group">
          <label>Mobile Number 2</label>
          <div className="mobile-input-group">
            <input
              name="txtvdrMobileNo2"
              className="admin-txt-box"
              type="text"
              value={txtvdrMobileNo2}
              placeholder="Enter mobile number 2"
              onChange={(e) => setVdrMobileNo2(sanitizeMobile(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Vendor Description</label>
          <textarea
            name="txtvdrDesc"
            className="vendor-input"
            placeholder="Enter Vendor Description"
            rows={4}
            onChange={(e) => setVdrDesc(e.target.value)}
            value={txtvdrDesc}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Select Categories <Req />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {fetchcategories.map((item) => {
              const id = String(item.CategoryID);
              const isChecked = selectedCategories.includes(id);
              return (
                <label key={id} style={{ width: '33.33%', marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    name="txtvdrCategoryID"
                    value={id}
                    checked={isChecked}
                    onChange={() => {
                      setSelectedCategories((prev) => {
                        const updated = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
                        if (submitted) {
                          setErrors((old) => ({ ...old, categories: updated.length ? '' : 'Select at least one Category.' }));
                        }
                        return updated;
                      });
                    }}
                    style={{ marginRight: 8 }}
                  />
                  {item.EnCategoryName}
                </label>
              );
            })}
          </div>
          {errors.categories && <div className="ErrorMsg">{errors.categories}</div>}
        </div>
      </div>

      <div className="txtsubtitle">Vendor Location</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Address1 <Req /></label>
              <input
                name="txtvdrAddress1"
                value={txtvdrAddress1}
                className="vendor-input"
                placeholder="Enter Street Address1"
                onChange={(e) => { setAddress1(e.target.value); revalidateField('txtvdrAddress1', e.target.value); }}
                required
                aria-invalid={!!errors.txtvdrAddress1}
              />
              {errors.txtvdrAddress1 && <div className="ErrorMsg">{errors.txtvdrAddress1}</div>}
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
                value={txtvdrAddress2}
                onChange={(e) => setAddress2(e.target.value)}
                name="txtvdrAddress2"
                className="vendor-input"
                placeholder="Enter Street Address2"
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Country</label>
              <select
                onChange={(e) => setCountryID(e.target.value)}
                name="txtvdrCountryID"
                value={txtvdrCountryID}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.CountryID} value={country.CountryID}>
                    {country.EnCountryName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">City</label>
              <select
                name="txtvdrCityID"
                value={txtvdrCityID}
                className="admin-txt-box"
                onChange={(e) => setSelectedCityID(e.target.value)}
              >
                <option value="">Select City</option>
                {cityList.map((city) => (
                  <option key={city.CityID} value={city.CityID}>
                    {city.EnCityName}
                  </option>
                ))}
              </select>
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Region</label>
              <input
                value={txtvdrRegionName}
                name="txtvdrRegionName"
                className="vendor-input"
                placeholder="Enter Region"
                onChange={(e) => setRegionName(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Zip Code</label>
              <input
                value={txtvdrZipCode}
                name="txtvdrZipCode"
                className="vendor-input"
                placeholder="Enter Zip Code"
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Website Address</label>
              <input
                onChange={(e) => setWebsiteAddress(e.target.value)}
                name="txtvdrWebsiteAddress"
                value={txtvdrWebsiteAddress}
                className="vendor-input"
                placeholder="Enter Website Address"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Google Map Location <Req /></label>
              <input
                value={txtvdrGoogleMap}
                onChange={(e) => { setVdrGoogleMap(e.target.value); revalidateField('txtvdrGoogleMap', e.target.value); }}
                name="txtvdrGoogleMap"
                className="vendor-input"
                placeholder="Enter Google Map Location"
                required
                aria-invalid={!!errors.txtvdrGoogleMap}
              />
              {errors.txtvdrGoogleMap && <div className="ErrorMsg">{errors.txtvdrGoogleMap}</div>}
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Vendor Longitude <Req /></label>
              <input
                value={txtvdrGlan}
                name="txtvdrGLan"
                className="vendor-input"
                placeholder="Enter Longitude"
                onChange={(e) => { setGlan(e.target.value); revalidateField('txtvdrGlan', e.target.value); }}
                required
                aria-invalid={!!errors.txtvdrGlan}
              />
              {errors.txtvdrGlan && <div className="ErrorMsg">{errors.txtvdrGlan}</div>}
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Vendor Latitude <Req /></label>
              <input
                value={txtvdrGlat}
                name="txtvdrGLat"
                className="vendor-input"
                placeholder="Enter Latitude"
                onChange={(e) => { setGlat(e.target.value); revalidateField('txtvdrGlat', e.target.value); }}
                required
                aria-invalid={!!errors.txtvdrGlat}
              />
              {errors.txtvdrGlat && <div className="ErrorMsg">{errors.txtvdrGlat}</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Social Media Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Instagram</label>
              <input
                value={txtvdrInstagram}
                onChange={(e) => setInstagram(e.target.value)}
                name="txtvdrInstagram"
                className="vendor-input"
                placeholder="Enter Instagram"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">FaceBook</label>
              <input
                value={txtvdrFaceBook}
                onChange={(e) => setFaceBook(e.target.value)}
                name="txtvdrFaceBook"
                className="vendor-input"
                placeholder="Enter FaceBook"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">X</label>
              <input
                onChange={(e) => setX(e.target.value)}
                name="txtvdrX"
                value={txtvdrX}
                className="vendor-input"
                placeholder="Enter X"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">SnapChat</label>
              <input
                onChange={(e) => setSnapChat(e.target.value)}
                name="txtvdrSnapChat"
                value={txtvdrSnapChat}
                className="vendor-input"
                placeholder="Enter SnapChat"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">TikTok</label>
              <input
                onChange={(e) => setTikTok(e.target.value)}
                name="txtvdrTikTok"
                value={txtvdrTikTok}
                className="vendor-input"
                placeholder="Enter TikTok"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Youtube</label>
              <input
                value={txtvdrYouTube}
                onChange={(e) => setYouTube(e.target.value)}
                name="txtvdrYouTube"
                className="vendor-input"
                placeholder="Enter Youtube"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Birth Day Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="vendor-column" style={{ flex: 1 }}>
              <label className="vendor-label">Are you offering Birth Day?</label>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="radio"
                    name="chkvdrIsBirthDayService"
                    value="Yes"
                    onChange={() => {}}
                    checked={vdrIsBirthdayYes}
                    style={{ width: '20px', height: '20px' }}
                  />
                  Yes
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input
                    type="radio"
                    name="chkvdrIsBirthDayService"
                    value="No"
                    onChange={() => {}}
                    checked={vdrIsBirthdayNo}
                    style={{ width: '20px', height: '20px' }}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Opening Hours Information <Req /></div>
      <div className="divbox">
        <div style={{ margin: '20px auto' }}>
          {DAY_KEYS.map((day) => (
            <div key={day} style={{ padding: '12px 0', borderBottom: '1px solid #ccc' }}>
              <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 8 }}>
                <label>
                  {day}{' '}
                  <input
                    type="checkbox"
                    checked={!days[day].closed}
                    onChange={(e) => handleClosedChange(day, !e.target.checked)}
                  />{' '}
                  Available
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {days[day].times.map((range, index) => {
                  const startFilled = (range.start || '').trim();
                  const endFilled = (range.end || '').trim();
                  const showRowError = submitted && !days[day].closed && ((startFilled && !endFilled) || (!startFilled && endFilled));
                  const which = startFilled && !endFilled ? 'end' : 'start';
                  return (
                    <div key={index} style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                      <label>
                        Start Time:{' '}
                        <input
                          className="admin-txt-box"
                          type="time"
                          value={range.start}
                          onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)}
                          disabled={days[day].closed}
                        />
                      </label>

                      <label>
                        End Time:{' '}
                        <input
                          className="admin-txt-box"
                          type="time"
                          value={range.end}
                          onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)}
                          disabled={days[day].closed}
                        />
                      </label>

                      <label>
                        Notes:{' '}
                        <input
                          type="text"
                          className="admin-txt-box"
                          value={range.note || ''}
                          onChange={(e) => handleTimeChange(day, index, 'note', e.target.value)}
                          placeholder="Optional notes"
                          disabled={days[day].closed}
                        />
                      </label>

                      <div>
                        Range Hours: <strong>{range.total || '0.00'}</strong>
                      </div>

                      {days[day].times.length > 1 && (
                        <button
                          type="button"
                          style={{ background: 'tomato', color: '#fff', border: 'none', padding: '4px 8px', cursor: 'pointer' }}
                          onClick={() => handleRemoveTimeRange(day, index)}
                          disabled={days[day].closed}
                        >
                          Remove
                        </button>
                      )}

                      {/* 🔴 Inline row-level error: missing start or end */}
                      {showRowError && (
                        <div className="ErrorMsg" style={{ width: '100%' }}>
                          Please enter the {which} time for {day} (row {index + 1}).
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 🔴 Inline day-level overlap error */}
                {dayOverlapInfo && dayOverlapInfo.day === day && (
                  <div className="ErrorMsg">
                    Time range overlap on {day}: {dayOverlapInfo.range1.start} - {dayOverlapInfo.range1.end} overlaps with {dayOverlapInfo.range2.start} - {dayOverlapInfo.range2.end}
                  </div>
                )}

                <div style={{ marginTop: 10 }}>
                  <button type="button" className="admin-buttonv1" onClick={() => handleAddMore(day)} disabled={days[day].closed}>
                    Add More
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(availabilityErr || errors.availability || errors.openingHours || errors.openingOverlap) && (
            <div className="ErrorMsg" style={{ marginTop: 8 }}>
              {availabilityErr || errors.availability || errors.openingHours || errors.openingOverlap}
            </div>
          )}
          <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
            <em><Req /> At least one day must have both Start and End time.</em>
          </div>
        </div>
      </div>

      {/* NewOfficeOpenHours (read-only) */}
      {/* <div className="txtsubtitle">NewOfficeOpenHours (from API)</div>
      <OfficeOpenHoursView rows={VendorData?.NewOfficeOpenHours} /> */}

      <div className="txtsubtitle">Banking Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Bank Name</label>
              <input
                onChange={(e) => setBankName(e.target.value)}
                name="txtvdrBankName"
                value={txtvdrBankName}
                className="vendor-input"
                placeholder="Enter Bank Name"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Name of Account Holder</label>
              <input
                value={txtvdrAccHolderName}
                name="txtvdrAccHolderName"
                className="vendor-input"
                placeholder="Enter Name of Account Holder"
                onChange={(e) => setAccHolderName(e.target.value)}
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">IBAN Account Number</label>
              <input
                value={txtvdrAccIBANNo}
                onChange={(e) => setIBANNo(e.target.value)}
                name="txtvdrAccIBANNo"
                className="vendor-input"
                placeholder="Enter IBAN Account Number"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Document Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">CR Number</label>
              <input
                value={txtvdrCRNumber}
                name="txtvdrCRNumber"
                className="vendor-input"
                placeholder="Enter Commercial Registration Number"
                onChange={(e) => setCRNumber(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Upload CR No Certificate</label>
              <input
                name="txtvdrCRCertificateFileName"
                type="file"
                onChange={handleFileUpload(setvdrCRFileName)}
                className="vendor-input"
              />
              {vdrCRFileName && <FilePreview file={vdrCRFileName} />}
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Tax Name</label>
              <input
                value={txtvdrTaxName}
                onChange={(e) => setTaxName(e.target.value)}
                name="txtvdrTaxName"
                className="vendor-input"
                placeholder="Tax Document Information"
              />
            </div>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Upload Document</label>
              <input
                name="txtvdrTaxFileName"
                type="file"
                onChange={handleFileUpload(setvdrTaxFileName)}
                className="vendor-input"
              />
              {vdrTaxFileName && <FilePreview file={vdrTaxFileName} />}
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Admin Notes Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: '20px' }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Enter Admin Notes <Req /></label>
              <textarea
                value={txtvdrAdminNotes}
                onChange={(e) => { setAdminNotes(e.target.value); revalidateField('txtvdrAdminNotes', e.target.value); }}
                name="txtvdrAdminNotes"
                className="vendor-input"
                placeholder="Enter Admin Notes"
                rows={4}
                required
                aria-invalid={!!errors.txtvdrAdminNotes}
              />
              {errors.txtvdrAdminNotes && <div className="ErrorMsg">{errors.txtvdrAdminNotes}</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSubmit} disabled={loading || checking}>
          {loading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className="admin-buttonv1"
          onClick={() => navigate('/admindata/vendor/list')}
        >
          Cancel
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  );
};

export default Vendor;
