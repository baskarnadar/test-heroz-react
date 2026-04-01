import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../../../config';
import { checkLogin } from '../../../utils/auth';
import '../../../scss/toast.css';
import { DspToastMessage, getAuthHeaders, IsAdminLoginIsValid } from '../../../utils/operation';

const OfferForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const kidsinterestID = queryParams.get('kidsinterestID');

  const [loading, setLoading] = useState(false);

  const [EnkidsinterestName, setEnkidsinterestName] = useState('');
  const [ArkidsinterestName, setArkidsinterestName] = useState('');
  const [EnkidsinterestDesc, setEnkidsinterestDesc] = useState('');

  const [OrgkidsinterestImageName, setOrgkidsinterestImageName] = useState('');
  const [OrgkidsinterestImageUrl, setOrgkidsinterestImageUrl] = useState('');
  const [kidsinterestImageName, setKidsinterestImageName] = useState(null);

  const [imageTypeError, setImageTypeError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  useEffect(() => {
    IsAdminLoginIsValid();
  }, []);

  const getFileNameFromUrlLocal = (input) => {
    if (!input) return '';
    const str = String(input);
    const cleanStr = str.split('?')[0];
    const parts = cleanStr.split('/');
    return parts[parts.length - 1] || '';
  };

  const isAllowedImage = (file) => {
    if (!(file instanceof File)) return { ok: true, msg: '' };

    const type = String(file.type || '').toLowerCase();
    const name = String(file.name || '').toLowerCase();

    const allowedMime = ['image/png', 'image/jpeg', 'image/jpg'];
    const allowedExt = ['.png', '.jpg', '.jpeg'];

    const mimeOk = allowedMime.includes(type);
    const extOk = allowedExt.some((ext) => name.endsWith(ext));

    if (!mimeOk && !extOk) {
      return { ok: false, msg: 'Only PNG / JPG / JPEG files are allowed.' };
    }

    return { ok: true, msg: '' };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    setImageTypeError('');

    if (!file) {
      setKidsinterestImageName(OrgkidsinterestImageUrl || null);
      return;
    }

    const check = isAllowedImage(file);
    if (!check.ok) {
      try { e.target.value = ''; } catch {}
      setKidsinterestImageName(OrgkidsinterestImageUrl || null);
      setImageTypeError(check.msg);
      setToastMessage(check.msg);
      setToastType('fail');
      return;
    }

    setKidsinterestImageName(file);
  };

  useEffect(() => {
    const fetchkidsinterestData = async () => {
      if (!kidsinterestID) return;

      try {
        const res = await fetch(`${API_BASE_URL}/lookupdata/kidsinterest/getkidsinterest`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ kidsinterestID }),
        });

        const result = await res.json();
        const kidsinterest = result?.data;

        if (kidsinterest) {
          setEnkidsinterestName(kidsinterest.EnkidsinterestName || '');
          setArkidsinterestName(kidsinterest.ArkidsinterestName || '');
          setEnkidsinterestDesc(kidsinterest.EnkidsinterestDesc || '');

          setOrgkidsinterestImageName(kidsinterest.kidsinterestImageName || '');
          const imageUrl = kidsinterest.kidsinterestImageNameUrl || '';
          setOrgkidsinterestImageUrl(imageUrl);

          if (imageUrl) setKidsinterestImageName(imageUrl);
        }
      } catch (err) {
        setToastMessage('Error fetching kidsinterest details.');
        setToastType('fail');
      }
    };

    fetchkidsinterestData();
  }, [kidsinterestID]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage('');

    if (!EnkidsinterestName.trim() || !ArkidsinterestName.trim()) {
      setToastMessage('Please fill in all required fields.');
      setToastType('fail');
      setLoading(false);
      return;
    }

    if (imageTypeError) {
      setToastMessage('Please fix the image file type.');
      setToastType('fail');
      setLoading(false);
      return;
    }

    try {
      let finalkidsinterestImageName = OrgkidsinterestImageName || '';

      if (kidsinterestImageName instanceof File) {
        const formData = new FormData();
        formData.append('image', kidsinterestImageName);
        formData.append('foldername', 'activity');

        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        finalkidsinterestImageName = getFileNameFromUrlLocal(
          uploadResult?.data?.key || uploadResult?.data?.Key || ''
        );
      }

      const payload = {
        kidsinterestID,
        EnkidsinterestName,
        ArkidsinterestName,
        EnkidsinterestDesc,
        kidsinterestImageName: finalkidsinterestImageName,
        ModifyDate: new Date(),
        ModifyBy: 'USER',
      };

      const response = await fetch(`${API_BASE_URL}/lookupdata/kidsinterest/updatekidsinterest`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      await response.json();

      setToastMessage('kidsinterest updated successfully!');
      setToastType('success');
      setTimeout(() => navigate('/admindata/kidsinterest/list'), 2000);
    } catch (err) {
      setToastMessage('Failed to update kidsinterest.');
      setToastType('fail');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{kidsinterestID ? 'Edit' : 'Add'} kidsinterest</h3>
        <button type="button" onClick={() => navigate('/admindata/kidsinterest/list')} className="admin-buttonv1">
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English kidsinterest Name</label>
        <input className="admin-txt-box" type="text" value={EnkidsinterestName}
          onChange={(e) => setEnkidsinterestName(e.target.value)} required />
      </div>

      <div className="form-group">
        <label>Arabic kidsinterest Name</label>
        <input className="admin-txt-box" type="text" value={ArkidsinterestName}
          onChange={(e) => setArkidsinterestName(e.target.value)} required />
      </div>

      {/* ✅ IMPROVED MULTI-LINE DESCRIPTION */}
      <div className="form-group">
        <label>English kidsinterest Description</label>
        <textarea
          className="admin-txt-box"
          value={EnkidsinterestDesc}
          onChange={(e) => setEnkidsinterestDesc(e.target.value)}
          placeholder="Enter Description (multiple lines allowed)"
          rows={6}
          style={{
            minHeight: '120px',
            resize: 'vertical',
            lineHeight: '1.5',
            padding: '10px'
          }}
        />
      </div>

      <div className="form-group">
        <label>kidsinterest Image</label>
        <input type="file" onChange={handleFileUpload} />
        {imageTypeError && <div style={{ color: 'red' }}>{imageTypeError}</div>}
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : 'Update kidsinterest'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default OfferForm;