// src/pages/admin/AgreementForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkLogin } from '../../utils/auth';
import '../../scss/toast.css';
import { DspToastMessage,getAuthHeaders } from '../../utils/operation';
import { API_BASE_URL } from '../../config';

const AGREEMENT_API = `${API_BASE_URL}/commondata/operation/herozagreement`; // Update endpoint
const GET_AGREEMENT_API = `${API_BASE_URL}/commondata/operation/getagree`; // Prefill endpoint

const AgreementForm = () => {
  const navigate = useNavigate();

  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);       // for update button
  const [prefillLoading, setPrefillLoading] = useState(true); // for initial fetch

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info'); // 'success' | 'fail' | 'info'

  useEffect(() => {
    checkLogin(navigate);
  }, [navigate]);

  // 1) Prefill agreement text from GET endpoint
  useEffect(() => {
    const fetchAgreement = async () => {
      setPrefillLoading(true);
      setToastMessage('');

      try {
        // Some backends expect POST with empty body; if your route supports GET, you can switch to GET.
        const res = await fetch(GET_AGREEMENT_API, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({}),
        });

        // Try to parse JSON safely
        let result = null;
        try {
          result = await res.json();
        } catch (_) {
          /* ignore non-JSON responses */
        }

        if (!res.ok) {
          const serverMsg =
            result?.message || 'Failed to fetch current agreement text.';
          setToastMessage(`${serverMsg} (HTTP ${res.status})`);
          setToastType('fail');
          return;
        }

        // Common shapes (support both your sendResponse wrapper and raw payloads)
        const data =
          result?.data ||
          result ||
          {};

        const initialText =
          data?.HerozAgreeDesc ??
          data?.herozAgreeDesc ?? // just in case of casing differences
          '';

        setDesc(String(initialText));
      } catch (err) {
        setToastMessage(`Request failed: ${String(err?.message || err)}`);
        setToastType('fail');
      } finally {
        setPrefillLoading(false);
      }
    };

    fetchAgreement();
  }, []);

  // 2) Update flow (unchanged)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setToastMessage('');

    if (!desc.trim()) {
      setToastMessage('Please enter the agreement text.');
      setToastType('fail');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(AGREEMENT_API, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ HerozAgreeDesc: desc }),
      });

      let result = null;
      try {
        result = await res.json();
      } catch (_) {
        /* ignore */
      }

      if (res.status === 200) {
        setToastMessage('Agreement successfully updated');
        setToastType('success');
      } else {
        const serverMsg = result?.message || 'Failed to update agreement.';
        setToastMessage(`${serverMsg} (HTTP ${res.status})`);
        setToastType('fail');
      }
    } catch (err) {
      setToastMessage(`Request failed: ${String(err?.message || err)}`);
      setToastType('fail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="form-container">
      <div className="page-title">
        <h3>Heroz Agreement</h3>
      </div>

      <div className="form-group">
        <label>Agreement Text</label>
        <textarea
          className="admin-txt-box"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={
            prefillLoading
              ? 'Loading current agreement…'
              : 'Type the agreement text here…'
          }
          rows={14}
          style={{ width: '100%', minHeight: 300, resize: 'vertical' }}
          disabled={prefillLoading}
        />
      </div>

      <div className="submit-container custom-top-5">
        <button type="submit" className="admin-buttonv1" disabled={loading || prefillLoading}>
          {prefillLoading ? 'Loading…' : loading ? 'Updating…' : 'Update'}
        </button>
      </div>

      <DspToastMessage message={toastMessage} type={toastType} />
    </form>
  );
};

export default AgreementForm;
