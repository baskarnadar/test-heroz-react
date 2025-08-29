// src/pages/admin/Vendor.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import Select from 'react-select' // (not used below; keep if you’ll use it)
import { API_BASE_URL } from '../../config';
import { DspToastMessage } from '../../utils/operation';
import FilePreview from '../../views/widgets/FilePreview';
import { getFileNameFromUrl, getCurrentLoggedUserID } from '../../utils/operation';
import { checkUserExists } from '../../utils/auth';

// ⬇️ Opening hours helpers (separate JS)
import {
  findIncompleteRange,
  hasOverlap,
  buildOpeningHoursPayload,
} from '../../admindata/vendor/validation/fieldvalidation';

const Vendor = () => {
  const navigate = useNavigate();

  const [ErrorUserExistMsg, setUserExists] = useState('');
  const [checking, setChecking] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

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

  // Categories (checkbox list)
  const [fetchCategories, setFetchCategories] = useState([]);  // server list
  const [selectedCategories, setSelectedCategories] = useState([]); // chosen IDs

  // Birthday service (Yes/No)
  const [chkvdrIsBirthDayService, setBirthDayService] = useState('');

  // (Not used in submit here, keep if you’ll wire it later)
  const [vdrCapacity, setCapacity] = useState([]);
  const [vdrPricePerPerson, setPricePerPerson] = useState([]);

  // Opening hours state
  const [days, setDays] = useState({
    sunday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    monday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    tuesday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    wednesday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    thursday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    friday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
    saturday: { times: [{ start: '', end: '', ChkRemoveDays: false }], total: '', closed: false, note: '' },
  });

  const handleClosedChange = (day, isClosed) => {
    setDays((prev) => ({
      ...prev,
      [day]: { ...prev[day], closed: isClosed },
    }));
  };

  const handleTimeChange = (day, index, field, value) => {
    setDays((prev) => {
      const updatedTimes = [...prev[day].times];
      updatedTimes[index] = { ...updatedTimes[index], [field]: value };
      return { ...prev, [day]: { ...prev[day], times: updatedTimes } };
    });
  };

  const handleAddMore = (day) => {
    const existingTimes = days[day].times || [];
    const newTimes = [...existingTimes, { start: '', end: '', ChkRemoveDays: false }];
    setDays({ ...days, [day]: { ...days[day], times: newTimes } });
  };

  const handleRemoveTimeRange = (day, index) => {
    const updatedTimes = (days[day].times || []).filter((_, i) => i !== index);
    const newTotal = updatedTimes.reduce((sum, t) => sum + parseFloat(t.total || 0), 0);

    setDays({
      ...days,
      [day]: {
        ...days[day],
        times: updatedTimes.length > 0 ? updatedTimes : [{ start: '', end: '', total: '' }],
        total: newTotal.toFixed(2),
      },
    });
  };

  const handleFileUpload = (setter) => async (e) => {
    const file = e.target.files?.[0];
    if (file) setter(file);
  };

  // Build opening hours payload using the separate helper
  const getOpeningHoursTableData = (OfficeOpenHoursVal = null) =>
    buildOpeningHoursPayload(days, getCurrentLoggedUserID, OfficeOpenHoursVal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');
    setToastType('info');

    try {
      // Username/mobile check
      setChecking(true);
      const exists = await checkUserExists(txtvdrMobileNo1);
      setChecking(false);

      if (exists) {
        setUserExists('Username is not available. Please enter another mobile number.');
        setLoading(false);
        return;
      } else {
        setUserExists('');
      }

      // Incomplete ranges (start set but end missing OR end set but start missing)
      const incomplete = findIncompleteRange(days);
      if (incomplete) {
        setToastMessage(
          `Please enter the ${incomplete.which} time for ${incomplete.day} (row ${incomplete.index + 1}).`
        );
        setToastType('fail');
        setLoading(false);
        return;
      }

      // Overlap check
      const overlap = hasOverlap(days);
      if (overlap) {
        setToastMessage(
          `Time range overlap on ${overlap.day}: ` +
            `${overlap.range1.start} - ${overlap.range1.end} overlaps with ` +
            `${overlap.range2.start} - ${overlap.range2.end}`
        );
        setToastType('fail');
        setLoading(false);
        return;
      }

      // ===== File uploads (Image, Tax, CR) =====
      let uploadedImageKey = '';
      let vdrImageNameVal = '';
      if (vdrImageName instanceof File) {
        const fd = new FormData();
        fd.append('image', vdrImageName);
        fd.append('foldername', 'vendor');

        const res = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) throw new Error(`Image upload failed: ${res.status}`);
        const j = await res.json();
        uploadedImageKey = j?.data?.key || j?.data?.Key || '';
        vdrImageNameVal = getFileNameFromUrl(uploadedImageKey);
      }

      let uploadedTaxKey = '';
      let vdrTaxFileNameVal = '';
      if (vdrTaxFileName instanceof File) {
        const fd = new FormData();
        fd.append('image', vdrTaxFileName);
        fd.append('foldername', 'vendor');

        const res = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) throw new Error(`Tax file upload failed: ${res.status}`);
        const j = await res.json();
        uploadedTaxKey = j?.data?.key || j?.data?.Key || '';
        vdrTaxFileNameVal = getFileNameFromUrl(uploadedTaxKey);
      }

      let uploadedCRKey = '';
      let vdrCRFileNameVal = '';
      if (vdrCRFileName instanceof File) {
        const fd = new FormData();
        fd.append('image', vdrCRFileName);
        fd.append('foldername', 'vendor');

        const res = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) throw new Error(`CR file upload failed: ${res.status}`);
        const j = await res.json();
        uploadedCRKey = j?.data?.key || j?.data?.Key || '';
        vdrCRFileNameVal = getFileNameFromUrl(uploadedCRKey);
      }

      // ===== Prepare payload =====
      const payload = {
        vdrName: txtvdrName || '',
        vdrClubName: txtvdrClubName || '',
        vdrImageName: vdrImageNameVal,       // uploaded filename
        vdrTaxFileName: vdrTaxFileNameVal,   // uploaded filename
        vdrCRFileName: vdrCRFileNameVal,     // uploaded filename

        vdrEmailAddress: txtvdrEmailAddress || '',
        vdrMobileNo1: txtvdrMobileNo1 || '',
        vdrMobileNo2: txtvdrMobileNo2 || '',
        vdrDesc: txtvdrDesc || '',

        vdrCategoryID: selectedCategories,   // array of IDs

        vdrCertificateName: txtvdrCRNumber || '',
        vdrCertificateFileName: null,        // not used here

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

        vdrCapacity,
        vdrPricePerPerson,

        OfficeOpenHours: getOpeningHoursTableData(), // only complete rows
        IsDataStatus: 1,
        CreatedBy: getCurrentLoggedUserID(),
        ModifyBy: getCurrentLoggedUserID(),
      };

      const response = await fetch(`${API_BASE_URL}/vendorinfo/vendor/createVendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      await response.json();
      setToastMessage('Vendor added successfully!');
      setToastType('success');
      setTimeout(() => navigate('/admindata/vendor/list'), 1500);
    } catch (err) {
      console.error('Error adding Vendor:', err);
      setToastMessage('Failed to add Vendor.');
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  // Lookups
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/city/getcityalllist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (json?.data) {
          setFetchCategories(json.data);
        }
      } catch (e) {
        console.error('Error fetching categories:', e);
      }
    };

    fetchCities();
    fetchCountriesList();
    fetchCategoryList();
  }, []);

  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  return (
    <div>
      <div className="divhbg">
        <div className="txtheadertitle">Add New Vendor</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-buttonv1" onClick={handleSubmit} disabled={loading}>
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
          <label>Vendor Name</label>
          <input
            name="txtvdrName"
            className="admin-txt-box"
            placeholder="Enter Vendor Name"
            type="text"
            required
            onChange={(e) => setVdrName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Club Name</label>
          <input
            name="txtvdrClubName"
            className="admin-txt-box"
            placeholder="Enter Club Name"
            type="text"
            required
            onChange={(e) => setClubName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Vendor Image</label>
          <input
            name="txtvdrImageName"
            className="admin-txt-box"
            type="file"
            onChange={handleFileUpload(setVdrImageName)}
          />
          <FilePreview file={vdrImageName} />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            name="txtvdrEmailAddress"
            placeholder="Enter Email Address"
            className="admin-txt-box"
            type="text"
            required
            onChange={(e) => setVdrEmailAddress(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>
            Mobile Number 1 <span style={{ color: 'red' }}>[username]</span>
          </label>
          <div className="mobile-input-group">
            <input
              name="txtvdrMobileNo1"
              className="admin-txt-box"
              type="text"
              required
              placeholder="Enter mobile number 1"
              onChange={(e) => setVdrMobileNo1(e.target.value)}
            />
          </div>
          <div className="ErrorMsg">{ErrorUserExistMsg}</div>
        </div>

        <div className="form-group">
          <label>Mobile Number 2</label>
          <div className="mobile-input-group">
            <input
              name="txtvdrMobileNo2"
              className="admin-txt-box"
              type="text"
              placeholder="Enter mobile number 2"
              onChange={(e) => setVdrMobileNo2(e.target.value)}
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
            required
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Select Categories
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {fetchCategories.map((item) => (
              <label
                key={item.CategoryID}
                style={{ width: '33.33%', marginBottom: 10, display: 'flex', alignItems: 'center' }}
              >
                <input
                  type="checkbox"
                  name="txtvdrCategoryID"
                  value={item.CategoryID}
                  onChange={() => handleCheckboxChange(item.CategoryID)}
                  style={{ marginRight: 8 }}
                />
                {item.EnCategoryName}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="txtsubtitle">Vendor Location</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Address1</label>
              <input
                name="txtvdrAddress1"
                className="vendor-input"
                placeholder="Enter Street Address1"
                onChange={(e) => setAddress1(e.target.value)}
                required
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Address2</label>
              <input
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
                style={{ width: '100%', padding: 10, borderRadius: 4, border: '1px solid #ccc' }}
                required
                value={txtvdrCountryID}
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
                onChange={(e) => setSelectedCityID(e.target.value)}
                required
                value={txtvdrCityID}
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
                onChange={(e) => setRegionName(e.target.value)}
                required
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Zip Code</label>
              <input
                name="txtvdrZipCode"
                className="vendor-input"
                placeholder="Enter Zip Code"
                onChange={(e) => setZipCode(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Website Address</label>
              <input
                onChange={(e) => setWebsiteAddress(e.target.value)}
                name="txtvdrWebsiteAddress"
                className="vendor-input"
                placeholder="Enter Website Address"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Google Map Location</label>
              <input
                onChange={(e) => setVdrGoogleMap(e.target.value)}
                name="txtvdrGoogleMap"
                className="vendor-input"
                placeholder="Enter Google Map Location"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row">
            <div className="vendor-column">
              <label className="vendor-label">Vendor Longitude</label>
              <input
                name="txtvdrGLan"
                className="vendor-input"
                placeholder="Enter Longitude"
                onChange={(e) => setGlan(e.target.value)}
              />
            </div>

            <div className="vendor-column">
              <label className="vendor-label">Vendor Latitude</label>
              <input
                name="txtvdrGLat"
                className="vendor-input"
                placeholder="Enter Latitude"
                onChange={(e) => setGlat(e.target.value)}
              />
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
                onChange={(e) => setInstagram(e.target.value)}
                name="txtvdrInstagram"
                className="vendor-input"
                placeholder="Enter Instagram"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">FaceBook</label>
              <input
                onChange={(e) => setFaceBook(e.target.value)}
                name="txtvdrFaceBook"
                className="vendor-input"
                placeholder="Enter FaceBook"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">X</label>
              <input
                onChange={(e) => setX(e.target.value)}
                name="txtvdrX"
                className="vendor-input"
                placeholder="Enter X"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">SnapChat</label>
              <input
                onChange={(e) => setSnapChat(e.target.value)}
                name="txtvdrSnapChat"
                className="vendor-input"
                placeholder="Enter SnapChat"
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">TikTok</label>
              <input
                onChange={(e) => setTikTok(e.target.value)}
                name="txtvdrTikTok"
                className="vendor-input"
                placeholder="Enter TikTok"
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Youtube</label>
              <input
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
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label className="vendor-label">Are you offering Birth Day?</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <input
                    type="radio"
                    name="chkvdrIsBirthDayService"
                    value="Yes"
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
        </div>
      </div>

      <div className="txtsubtitle">Banking Information</div>
      <div className="divbox">
        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Bank Name</label>
              <input
                onChange={(e) => setBankName(e.target.value)}
                name="txtvdrBankName"
                className="vendor-input"
                placeholder="Enter Bank Name"
                required
              />
            </div>
          </div>
        </div>

        <div className="vendor-container">
          <div className="vendor-row" style={{ display: 'flex', gap: 20 }}>
            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">Name of Account Holder</label>
              <input
                required
                name="txtvdrAccHolderName"
                className="vendor-input"
                placeholder="Enter Name of Account Holder"
                onChange={(e) => setAccHolderName(e.target.value)}
              />
            </div>

            <div className="vendor-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="vendor-label">IBAN Account Number</label>
              <input
                onChange={(e) => setIBANNo(e.target.value)}
                name="txtvdrAccIBANNo"
                className="vendor-input"
                placeholder="Enter IBAN Account Number"
                required
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
                onChange={(e) => setTaxName(e.target.value)}
                name="txtvdrTaxName"
                className="vendor-input"
                placeholder="Tax Document Information"
                required
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
              <label className="vendor-label">Enter Admin Notes</label>
              <textarea
                onChange={(e) => setAdminNotes(e.target.value)}
                name="txtvdrAdminNotes"
                className="vendor-input"
                placeholder="Enter Admin Notes"
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="button-container">
        <button className="admin-buttonv1" onClick={handleSubmit} disabled={loading}>
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
