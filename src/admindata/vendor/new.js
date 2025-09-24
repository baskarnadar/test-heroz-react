// src/pages/admin/Vendor.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import Select from 'react-select'
import { API_BASE_URL } from '../../config';
import { DspToastMessage } from '../../utils/operation';
import FilePreview from '../../views/widgets/FilePreview';
import { getFileNameFromUrl, getCurrentLoggedUserID, getAuthHeaders } from '../../utils/operation';
import { checkVdrUserEmailExists } from '../../utils/auth';

// Opening hours helpers
import {
  findIncompleteRange,
  hasOverlap,
  buildOpeningHoursPayload,
} from '../../admindata/vendor/validation/fieldvalidation';

const Req = () => <span style={{ color: 'red', fontSize: 18 }}>*</span>;

const Vendor = () => {
  const navigate = useNavigate();

  // UX + server status
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // Inline/persistent errors
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [availabilityErr, setAvailabilityErr] = useState('');
  const [existErr, setExistErr] = useState(''); // username/email exists

  // Inputs
  const [txtvdrName, setVdrName] = useState('');
  const [txtvdrClubName, setClubName] = useState('');

  const [vdrImageName, setVdrImageName] = useState(null);
  const [vdrTaxFileName, setVdrTaxFileName] = useState(null);
  const [vdrCRFileName, setvdrCRCertificateFileName] = useState(null);

  const [txtvdrEmailAddress, setVdrEmailAddress] = useState('');
  const [txtvdrMobileNo1, setVdrMobileNo1] = useState('');
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

  // Lookups
  const [cityList, setCityList] = useState([]);
  const [countries, setCountries] = useState([]);

  // Categories
  const [fetchCategories, setFetchCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Birthday service
  const [chkvdrIsBirthDayService, setBirthDayService] = useState('');

  // Opening hours
  const [days, setDays] = useState({
    sunday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    monday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    tuesday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    wednesday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    thursday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    friday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    saturday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
  });

  // ===== Helpers =====
  const sanitizeMobile = (v) => v.replace(/\D+/g, '').slice(0, 10);
  const isValidMobile = (m) => /^05\d{8}$/.test(m || '');

  const focusFirstError = (errs) => {
    const order = [
      'txtvdrName','txtvdrClubName','vdrImageName','txtvdrEmailAddress','txtvdrMobileNo1',
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
      txtvdrMobileNo1: 'input[name="txtvdrMobileNo1"]',
      categories: 'input[name="txtvdrCategoryID"]',
      txtvdrAddress1: 'input[name="txtvdrAddress1"]',
      txtvdrGoogleMap: 'input[name="txtvdrGoogleMap"]',
      txtvdrGlan: 'input[name="txtvdrGLan"]',
      txtvdrGlat: 'input[name="txtvdrGLat"]',
      txtvdrAdminNotes: 'textarea[name="txtvdrAdminNotes"]',
    };
    const el = document.querySelector(selectorMap[firstKey] || 'body');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el && el.focus) setTimeout(() => el.focus(), 250);
  };

  const buildToastFromErrors = (errs) => {
    const msgs = Object.values(errs).filter(Boolean);
    if (!msgs.length) return '';
    // Keep it short but helpful (first 3 items)
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

  const handleTimeChange = (day, index, field, value) => {
    setDays((prev) => {
      const updatedTimes = [...prev[day].times];
      updatedTimes[index] = { ...updatedTimes[index], [field]: value };
      const updated = { ...prev, [day]: { ...prev[day], times: updatedTimes } };
      if (submitted) validateOpeningHours(updated);
      return updated;
    });
  };

  const handleAddMore = (day) => {
    setDays((prev) => {
      const existingTimes = prev[day].times || [];
      const updated = { ...prev, [day]: { ...prev[day], times: [...existingTimes, { start: '', end: '' }] } };
      if (submitted) validateOpeningHours(updated);
      return updated;
    });
  };

  const handleRemoveTimeRange = (day, index) => {
    setDays((prev) => {
      const updatedTimes = (prev[day].times || []).filter((_, i) => i !== index);
      const updated = {
        ...prev,
        [day]: { ...prev[day], times: updatedTimes.length ? updatedTimes : [{ start: '', end: '' }] },
      };
      if (submitted) validateOpeningHours(updated);
      return updated;
    });
  };

  const handleFileUpload = (setter) => (e) => {
    const file = e.target.files?.[0];
    setter(file || null);
    if (submitted) {
      setErrors((old) => ({ ...old, vdrImageName: !(file instanceof File) ? 'Vendor Image is required.' : '' }));
    }
  };

  const getOpeningHoursTableData = (OfficeOpenHoursVal = null) =>
    buildOpeningHoursPayload(days, getCurrentLoggedUserID, OfficeOpenHoursVal);

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

  // ===== Validation =====
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

  const validateAll = () => {
    const newErrs = {};

    if (!txtvdrName.trim()) newErrs.txtvdrName = 'Vendor Name is required.';
    if (!txtvdrClubName.trim()) newErrs.txtvdrClubName = 'Club Name is required.';
    if (!(vdrImageName instanceof File)) newErrs.vdrImageName = 'Vendor Image is required.';
    if (!txtvdrEmailAddress.trim()) newErrs.txtvdrEmailAddress = 'Email Address is required.';

    if (!txtvdrMobileNo1.trim()) {
      newErrs.txtvdrMobileNo1 = 'Mobile Number 1 (username) is required.';
    } else if (!isValidMobile(txtvdrMobileNo1)) {
      newErrs.txtvdrMobileNo1 = 'Must start with 05 and be exactly 10 digits.';
    }

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

  // ===== Submit =====
  const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitted(true);
  setToastMessage('');
  setToastType('info');
  setExistErr('');
  setLoading(true);

  try {
    // Client-side validation (persistent)
    const newErrs = validateAll();
    setErrors(newErrs);
    validateOpeningHours(days);

    if (Object.keys(newErrs).length) {
      const msg = buildToastFromErrors(newErrs);
      console.warn('Blocked submit. Validation errors:', newErrs);
      setToastMessage(msg || 'Please fix the highlighted errors.');
      setToastType('fail');
      focusFirstError(newErrs);
      setLoading(false);
      return;
    }

    // Server-side username/email existence
    let exists = false;
    try {
      setChecking(true);
      exists = await checkVdrUserEmailExists(txtvdrMobileNo1, txtvdrEmailAddress);
    } catch (ex) {
      console.error('User/email existence check failed:', ex);
      setToastMessage('Could not verify username/email availability. Please try again.');
      setToastType('fail');
      setLoading(false);
      return;
    } finally {
      setChecking(false);
    }

    if (exists) {
      setExistErr('Username or Email Address already exists. Enter a different Mobile 1 or Email.');
      setToastMessage('Username or Email already exists.');
      setToastType('fail');
      focusFirstError({ txtvdrMobileNo1: 'exists' });
      setLoading(false);
      return;
    }

    // ===== File uploads =====
    const uploadFile = async (file) => {
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
      return '';
    };

    const vdrImageNameVal = await uploadFile(vdrImageName);
    const vdrTaxFileNameVal = await uploadFile(vdrTaxFileName);
    const vdrCRFileNameVal = await uploadFile(vdrCRFileName);

    // Payload
    const payload = {
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
      vdrCertificateName: txtvdrCRNumber || '',
      vdrCertificateFileName: null,
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
      vdrIsBirthDayService: chkvdrIsBirthDayService || '',
      vdrCapacity: [],
      vdrPricePerPerson: [],
      OfficeOpenHours: getOpeningHoursTableData(),
      IsDataStatus: 1,
      CreatedBy: getCurrentLoggedUserID(),
      ModifyBy: getCurrentLoggedUserID(),
    };

    const response = await fetch(`${API_BASE_URL}/vendorinfo/vendor/createVendor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });


     const jsonResponse = await response.json();
    console.log(JSON.stringify(jsonResponse, null, 2));

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

    // ✅ Parse and display JSON response
   
    console.log('createVendor API Response:', jsonResponse);
   // alert(JSON.stringify(jsonResponse, null, 2)); // pretty-print JSON in alert
    setToastMessage('Vendor added successfully!');
    setToastType('success');

    setTimeout(() => navigate('/admindata/vendor/list'), 1500);
  } catch (err) {
    console.error('Error adding Vendor:', err);
    setToastMessage('Failed to add Vendor Logout and Login.');
    setToastType('fail');
  } finally {
    setLoading(false);
  }
};

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

  // Clear server existence error on user edits
  useEffect(() => {
    if (existErr) setExistErr('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txtvdrMobileNo1, txtvdrEmailAddress]);

  // Revalidate single fields on change after first submit
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
        case 'txtvdrMobileNo1':
          if (!value.trim()) next.txtvdrMobileNo1 = 'Mobile Number 1 (username) is required.';
          else next.txtvdrMobileNo1 = isValidMobile(value) ? '' : 'Must start with 05 and be exactly 10 digits.';
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

  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId];
      if (submitted) {
        setErrors((old) => ({ ...old, categories: updated.length ? '' : 'Select at least one Category.' }));
      }
      return updated;
    });
  };

  // ===== Render =====
  return (
    <div>
      <div className="divhbg">
        <div className="txtheadertitle">Add New Vendor</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSubmit} disabled={loading || checking}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" className="admin-buttonv1" onClick={() => navigate('/admindata/vendor/list')}>
            Return
          </button>
        </div>
      </div>

      <div className="txtsubtitle">Vendor Information</div>

      <div className="divbox">
        <div className="form-group">
          <label>Vendor Name <Req /></label>
          <input
            name="txtvdrName"
            className="admin-txt-box"
            placeholder="Enter Vendor Name"
            type="text"
            value={txtvdrName}
            onChange={(e) => { setVdrName(e.target.value); revalidateField('txtvdrName', e.target.value); }}
            required
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
            value={txtvdrClubName}
            onChange={(e) => { setClubName(e.target.value); revalidateField('txtvdrClubName', e.target.value); }}
            required
            aria-invalid={!!errors.txtvdrClubName}
          />
          {errors.txtvdrClubName && <div className="ErrorMsg">{errors.txtvdrClubName}</div>}
        </div>

        <div className="form-group">
          <label>Vendor Image <Req /></label>
          <input
            name="txtvdrImageName"
            className="admin-txt-box"
            type="file"
            onChange={handleFileUpload(setVdrImageName)}
            required
            aria-invalid={!!errors.vdrImageName}
          />
          {errors.vdrImageName && <div className="ErrorMsg">{errors.vdrImageName}</div>}
          <FilePreview file={vdrImageName} />
        </div>

        <div className="form-group">
          <label>Email Address <Req /></label>
          <input
            name="txtvdrEmailAddress"
            placeholder="Enter Email Address"
            className="admin-txt-box"
            type="email"
            value={txtvdrEmailAddress}
            onChange={(e) => { setVdrEmailAddress(e.target.value); revalidateField('txtvdrEmailAddress', e.target.value); }}
            required
            aria-invalid={!!errors.txtvdrEmailAddress}
          />
          {errors.txtvdrEmailAddress && <div className="ErrorMsg">{errors.txtvdrEmailAddress}</div>}
        </div>

        <div className="form-group">
          <label>
            Mobile Number 1 <span style={{ color: 'red' }}>[username]</span> <Req />
          </label>
          <div className="mobile-input-group">
            <input
              name="txtvdrMobileNo1"
              className="admin-txt-box"
              type="text"
              inputMode="numeric"
              maxLength={10}
              pattern="05[0-9]{8}"
              placeholder="05XXXXXXXX"
              value={txtvdrMobileNo1}
              onChange={(e) => {
                const v = sanitizeMobile(e.target.value);
                setVdrMobileNo1(v);
                if (submitted) revalidateField('txtvdrMobileNo1', v);
              }}
              required
              aria-invalid={!!errors.txtvdrMobileNo1}
            />
          </div>
          {errors.txtvdrMobileNo1 && <div className="ErrorMsg">{errors.txtvdrMobileNo1}</div>}
          {existErr && <div className="ErrorMsg">{existErr}</div>}
        </div>

        <div className="form-group">
          <label>Mobile Number 2</label>
          <div className="mobile-input-group">
            <input
              name="txtvdrMobileNo2"
              className="admin-txt-box"
              type="text"
              placeholder="Enter mobile number 2"
              value={txtvdrMobileNo2}
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
            value={txtvdrDesc}
            onChange={(e) => setVdrDesc(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Select Categories <Req />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {fetchCategories.map((item) => (
              <label key={item.CategoryID} style={{ width: '33.33%', marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  name="txtvdrCategoryID"
                  value={item.CategoryID}
                  checked={selectedCategories.includes(item.CategoryID)}
                  onChange={() => handleCheckboxChange(item.CategoryID)}
                  style={{ marginRight: 8 }}
                />
                {item.EnCategoryName}
              </label>
            ))}
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
                className="vendor-input"
                placeholder="Enter Street Address1"
                value={txtvdrAddress1}
                onChange={(e) => { setAddress1(e.target.value); revalidateField('txtvdrAddress1', e.target.value); }}
                required
                aria-invalid={!!errors.txtvdrAddress1}
              />
              {errors.txtvdrAddress1 && <div className="ErrorMsg">{errors.txtvdrAddress1}</div>}
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
                name="txtvdrAddress2"
                className="vendor-input"
                placeholder="Enter Street Address2"
                value={txtvdrAddress2}
                onChange={(e) => setAddress2(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Country</label>
              <select
                name="txtvdrCountryID"
                style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
                value={txtvdrCountryID}
                onChange={(e) => setCountryID(e.target.value)}
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
                className="admin-txt-box"
                value={txtvdrCityID}
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
                name="txtvdrRegionName"
                className="vendor-input"
                placeholder="Enter Region"
                value={txtvdrRegionName}
                onChange={(e) => setRegionName(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Zip Code</label>
              <input
                name="txtvdrZipCode"
                className="vendor-input"
                placeholder="Enter Zip Code"
                value={txtvdrZipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Google Map Location <Req /></label>
              <input
                name="txtvdrGoogleMap"
                className="vendor-input"
                placeholder="Enter Google Map Location"
                value={txtvdrGoogleMap}
                onChange={(e) => { setVdrGoogleMap(e.target.value); revalidateField('txtvdrGoogleMap', e.target.value); }}
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
                name="txtvdrGLan"
                className="vendor-input"
                placeholder="Enter Longitude"
                value={txtvdrGlan}
                onChange={(e) => { setGlan(e.target.value); revalidateField('txtvdrGlan', e.target.value); }}
                required
                aria-invalid={!!errors.txtvdrGlan}
              />
              {errors.txtvdrGlan && <div className="ErrorMsg">{errors.txtvdrGlan}</div>}
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Vendor Latitude <Req /></label>
              <input
                name="txtvdrGLat"
                className="vendor-input"
                placeholder="Enter Latitude"
                value={txtvdrGlat}
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
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Instagram</label>
              <input
                name="txtvdrInstagram"
                className="vendor-input"
                placeholder="Enter Instagram"
                value={txtvdrInstagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">FaceBook</label>
              <input
                name="txtvdrFaceBook"
                className="vendor-input"
                placeholder="Enter FaceBook"
                value={txtvdrFaceBook}
                onChange={(e) => setFaceBook(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">X</label>
              <input
                name="txtvdrX"
                className="vendor-input"
                placeholder="Enter X"
                value={txtvdrX}
                onChange={(e) => setX(e.target.value)}
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">SnapChat</label>
              <input
                name="txtvdrSnapChat"
                className="vendor-input"
                placeholder="Enter SnapChat"
                value={txtvdrSnapChat}
                onChange={(e) => setSnapChat(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">TikTok</label>
              <input
                name="txtvdrTikTok"
                className="vendor-input"
                placeholder="Enter TikTok"
                value={txtvdrTikTok}
                onChange={(e) => setTikTok(e.target.value)}
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Youtube</label>
              <input
                name="txtvdrYouTube"
                className="vendor-input"
                placeholder="Enter Youtube"
                value={txtvdrYouTube}
                onChange={(e) => setYouTube(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Birth Day Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label className="vendor-label">Are you offering Birth Day?</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <input
                    type="radio"
                    name="chkvdrIsBirthDayService"
                    value="Yes"
                    checked={chkvdrIsBirthDayService === 'Yes'}
                    onChange={(e) => setBirthDayService(e.target.value)}
                    style={{ width: 24, height: 24 }}
                  />
                  Yes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <input
                    type="radio"
                    name="chkvdrIsBirthDayService"
                    value="No"
                    checked={chkvdrIsBirthDayService === 'No'}
                    onChange={(e) => setBirthDayService(e.target.value)}
                    style={{ width: 24, height: 24 }}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Opening Hours Information</div>
      <div className="divbox">
        <div style={{ margin: '20px auto' }}>
          {['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map((day) => (
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
                {days[day].times.map((range, index) => (
                  <div key={index} style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label>
                      Start Time:{' '}
                      <input
                        className="admin-txt-box"
                        type="time"
                        value={range.start}
                        onChange={(e) => handleTimeChange(day, index, 'start', e.target.value)}
                      />
                    </label>

                    <label>
                      End Time:{' '}
                      <input
                        className="admin-txt-box"
                        type="time"
                        value={range.end}
                        onChange={(e) => handleTimeChange(day, index, 'end', e.target.value)}
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
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <div style={{ marginTop: 10 }}>
                  <button type="button" className="admin-buttonv1" onClick={() => handleAddMore(day)}>
                    Add More
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Opening hours errors */}
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

      <div className="txtsubtitle">Banking Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Bank Name</label>
              <input
                name="txtvdrBankName"
                className="vendor-input"
                placeholder="Enter Bank Name"
                value={txtvdrBankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Name of Account Holder</label>
              <input
                name="txtvdrAccHolderName"
                className="vendor-input"
                placeholder="Enter Name of Account Holder"
                value={txtvdrAccHolderName}
                onChange={(e) => setAccHolderName(e.target.value)}
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">IBAN Account Number</label>
              <input
                name="txtvdrAccIBANNo"
                className="vendor-input"
                placeholder="Enter IBAN Account Number"
                value={txtvdrAccIBANNo}
                onChange={(e) => setIBANNo(e.target.value)}
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
                name="txtvdrCRNumber"
                className="vendor-input"
                placeholder="Enter Commercial Registration Number"
                value={txtvdrCRNumber}
                onChange={(e) => setCRNumber(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Upload CR No Certificate</label>
              <input
                name="txtvdrCRCertificateFileName"
                type="file"
                onChange={handleFileUpload(setvdrCRCertificateFileName)}
                className="vendor-input"
              />
              {vdrCRFileName && <FilePreview file={vdrCRFileName} />}
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Tax Name</label>
              <input
                name="txtvdrTaxName"
                className="vendor-input"
                placeholder="Tax Document Information"
                value={txtvdrTaxName}
                onChange={(e) => setTaxName(e.target.value)}
              />
            </div>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Upload Document</label>
              <input
                name="txtvdrTaxFileName"
                type="file"
                onChange={handleFileUpload(setVdrTaxFileName)}
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
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Enter Admin Notes <Req /></label>
              <textarea
                name="txtvdrAdminNotes"
                className="vendor-input"
                placeholder="Enter Admin Notes"
                rows={4}
                value={txtvdrAdminNotes}
                onChange={(e) => { setAdminNotes(e.target.value); revalidateField('txtvdrAdminNotes', e.target.value); }}
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
        <button type="button" className="admin-buttonv1" onClick={() => navigate('/admindata/vendor/list')}>
          Cancel
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </div>
  );
};

export default Vendor;
