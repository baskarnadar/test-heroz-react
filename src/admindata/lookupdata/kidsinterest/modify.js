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

  // ✅ keep original stored image file name
  const [OrgkidsinterestImageName, setOrgkidsinterestImageName] = useState('');

  // ✅ preview url only
  const [OrgkidsinterestImageUrl, setOrgkidsinterestImageUrl] = useState('');

  // ✅ can be File or preview URL string
  const [kidsinterestImageName, setKidsinterestImageName] = useState(null);

  const [imageTypeError, setImageTypeError] = useState('');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  // ✅ Admin login validation
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
      return {
        ok: false,
        msg: 'Only PNG / JPG / JPEG files are allowed.',
      };
    }

    return { ok: true, msg: '' };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];

    setImageTypeError('');

    if (!file) {
      // ✅ if user clears file input, show old image preview again
      setKidsinterestImageName(OrgkidsinterestImageUrl || null);
      return;
    }

    const check = isAllowedImage(file);
    if (!check.ok) {
      try {
        e.target.value = '';
      } catch {}

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

        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }

        const result = await res.json();
        const kidsinterest = result?.data;

        console.log('getkidsinterest result:', result);

        if (kidsinterest) {
          setEnkidsinterestName(kidsinterest.EnkidsinterestName || '');
          setArkidsinterestName(kidsinterest.ArkidsinterestName || '');

          // ✅ store old image file name exactly for update payload
          setOrgkidsinterestImageName(kidsinterest.kidsinterestImageName || '');

          // ✅ store image URL for preview
          const imageUrl = kidsinterest.kidsinterestImageNameUrl || '';
          setOrgkidsinterestImageUrl(imageUrl);

          // ✅ preview should use URL only
          if (imageUrl) {
            setKidsinterestImageName(imageUrl);
          } else {
            setKidsinterestImageName(null);
          }
        }
      } catch (err) {
        console.error('Error fetching kidsinterest:', err);
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
      // ✅ IMPORTANT:
      // if no new image selected, keep same old image name
      let finalkidsinterestImageName = OrgkidsinterestImageName || '';

      // ✅ upload only new selected file
      if (kidsinterestImageName instanceof File) {
        const formData = new FormData();
        formData.append('image', kidsinterestImageName);
        formData.append('foldername', 'activity');

        const uploadResponse = await fetch(`${API_BASE_URL}/product/upload/uploadImage`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Image upload failed: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('kidsinterest image upload result:', uploadResult);

        finalkidsinterestImageName = getFileNameFromUrlLocal(
          uploadResult?.data?.key || uploadResult?.data?.Key || ''
        );
      }

      const payload = {
        kidsinterestID,
        EnkidsinterestName,
        ArkidsinterestName,
        kidsinterestImageName: finalkidsinterestImageName,
        ModifyDate: new Date(),
        ModifyBy: 'USER',
      };

      console.log('updatekidsinterest payload:', payload);

      const response = await fetch(`${API_BASE_URL}/lookupdata/kidsinterest/updatekidsinterest`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const result = await response.json();
      console.log('updatekidsinterest result:', result);

      setToastMessage('kidsinterest updated successfully!');
      setToastType('success');
      setTimeout(() => navigate('/admindata/kidsinterest/list'), 2000);
    } catch (err) {
      console.error('Error updating kidsinterest:', err);
      setToastMessage('Failed to update kidsinterest.');
      setToastType('fail');
    }

    setLoading(false);
  };

  const renderPreview = () => {
    if (!kidsinterestImageName) return null;

    if (kidsinterestImageName instanceof File) {
      return (
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '6px' }}>{kidsinterestImageName.name}</div>
          <img
            src={URL.createObjectURL(kidsinterestImageName)}
            alt="kidsinterest preview"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}
          />
        </div>
      );
    }

    if (typeof kidsinterestImageName === 'string' && kidsinterestImageName.trim()) {
      return (
        <div style={{ marginTop: '10px' }}>
          <div style={{ marginBottom: '6px' }}>
            {OrgkidsinterestImageName || 'Current Image'}
          </div>
          <img
            src={kidsinterestImageName}
            alt="kidsinterest preview"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '1px solid #ddd',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="page-title">
        <h3>{kidsinterestID ? 'Edit' : 'Add'} kidsinterest</h3>
        <button
          type="button"
          onClick={() => navigate('/admindata/kidsinterest/list')}
          className="admin-buttonv1"
        >
          Return
        </button>
      </div>

      <div className="form-group">
        <label>English kidsinterest Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={EnkidsinterestName}
          onChange={(e) => setEnkidsinterestName(e.target.value)}
          placeholder="Enter English kidsinterest Name"
          required
        />
      </div>

      <div className="form-group">
        <label>Arabic kidsinterest Name</label>
        <input
          className="admin-txt-box"
          type="text"
          value={ArkidsinterestName}
          onChange={(e) => setArkidsinterestName(e.target.value)}
          placeholder="Enter Arabic kidsinterest Name"
          required
        />
      </div>

      <div className="form-group">
        <label>kidsinterest Image</label>
        <input
          name="kidsinterestImageName"
          className="admin-txt-box"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileUpload}
        />

        {imageTypeError && (
          <div style={{ color: 'red', fontSize: '13px', marginTop: '5px' }}>
            {imageTypeError}
          </div>
        )}

        {renderPreview()}
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading}>
          {loading ? 'Saving...' : kidsinterestID ? 'Update kidsinterest' : 'Submit'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default OfferForm;