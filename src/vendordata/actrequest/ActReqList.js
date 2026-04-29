// src/pages/vendor/ActivityRequestList.js
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CSpinner,
  CAlert,
  CBadge,
  CButton,
  CInputGroup,
  CInputGroupText,
  CFormInput,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilSearch,
  cilList,
  cilCheckCircle,
  cilArrowRight,
  cilChevronLeft,
  cilChevronRight,
} from "@coreui/icons";
import { API_BASE_URL } from "../../config";
import {
  getAuthHeaders,
  getCurrentLoggedUserID,
  IsVendorLoginIsValid,
} from "../../utils/operation";
import "./../../scss/style.css";
 

// 🔤 i18n packs
import enPack from "../../i18n/enloc100.json";
import arPack from "../../i18n/arloc100.json";

const GET_ACTIVITY_REQUESTS = `${API_BASE_URL}/vendordata/activityinfo/activity/getAllActivityRequest`;
const PAGE_SIZE = 10;

const toStr = (v) => (v ?? "").toString();

function mapItem(json) {
  return {
    // 🔧 include ActivityID so onClick works
    ActivityID: toStr(json.ActivityID),
    RequestID: toStr(json.RequestID),
    SchoolID: toStr(json.SchoolID),
    VendorID: toStr(json.VendorID),
    actName: toStr(json.actName),
    actRequestRefNo: toStr(json.actRequestRefNo),
    actRequestDate: toStr(json.actRequestDate),
    actRequestTime: toStr(json.actRequestTime),
    actRequestStatus: toStr(json.actRequestStatus),
    actRequestMessage: toStr(json.actRequestMessage),
    actTypeID: toStr(json.actTypeID),
    totalPaidStudent:
      Number.parseInt(json.totalPaidStudent ?? 0, 10) || 0,
    actTotalNoStudents:
      Number.parseInt(json.actTotalNoStudents ?? 0, 10) || 0,

    // ✅ NEW: map reject reason (with robust fallbacks)
    RequestRejectReason: toStr(
      json.RequestRejectReason ??
        json.requestRejectReason ??
        json.RejectReason ??
        json.rejectReason ??
        ""
    ),
  };
}

function statusColor(status) {
  const s = (status || "").toUpperCase();
  if (s === "TRIP-BOOKED") return "success";
  if (s === "APPROVED") return "primary";
  if (s === "WAITING-FOR-APPROVAL") return "warning";
  if (s === "REJECTED") return "danger";
  if (s === "COMPLETED") return "info";
  return "secondary";
}

function StatusPill({ status, t = (x) => x }) {
  const s = (status || "").toUpperCase();
  const label =
    s === "TRIP-BOOKED"
      ? t("list.status_trip_booked")
      : s === "APPROVED"
      ? t("list.status_approved")
      : s === "WAITING-FOR-APPROVAL"
      ? t("list.status_waiting_for_approval")
      : s === "REJECTED"
      ? t("list.status_rejected")
      : s === "COMPLETED"
      ? t("list.status_completed")
      : status || "-";

  return (
    <CBadge color={statusColor(status)} shape="rounded-pill" className="modern-status-pill">
      <CIcon icon={cilCheckCircle} className="modern-status-icon modern-status-icon-visible" />
      {label}
    </CBadge>
  );
}

function InfoRow({
  label,
  value,
  color,
  trailing,
  highlight = false,
  statusNode = null,
}) {
  return (
    <div className={`modern-info-row ${highlight ? "modern-reference-row" : ""}`}>
      <div className="modern-info-label">
        <span className="text-body" style={{ color }}>
          {label}
        </span>
      </div>

      <div className={`modern-info-value ${highlight ? "modern-reference-value" : ""}`}>
        <span className="text-body" style={{ color }}>
          {value}
        </span>
      </div>

      {statusNode ? (
        <div className="modern-reference-status">
          {statusNode}
        </div>
      ) : null}

      {trailing ? <div className="modern-info-action">{trailing}</div> : null}
    </div>
  );
}

// 🆕 accept optional t() to localize button labels (fallback to identity)
function TrailingByStatus({
  status,
  onViewPaid,
  onApprove,
  onWaiting,
  t = (x) => x,
}) {
  const s = (status || "").toUpperCase();

  if (s === "TRIP-BOOKED") {
    return (
      <CButton
        color="primary"
        size="sm"
        className="modern-view-action-btn"
        title={t("list.view_paid_students")}
        aria-label={t("list.view_paid_students")}
        onClick={onViewPaid}
      >
        <span>{t("list.view")}</span>
        <span className="modern-view-action-circle">
          <CIcon icon={cilArrowRight} className="modern-view-action-icon" />
        </span>
      </CButton>
    );
  }

  if (s === "WAITING-FOR-APPROVAL") {
    return (
      <CButton
        color="primary"
        size="sm"
        className="modern-view-action-btn"
        title={t("list.waiting_for_approval_button")}
        aria-label={t("list.waiting_for_approval_button")}
        onClick={onWaiting}
      >
        <span>{t("list.view")}</span>
        <span className="modern-view-action-circle">
          <CIcon icon={cilArrowRight} className="modern-view-action-icon" />
        </span>
      </CButton>
    );
  }

  if (s === "APPROVED") {
    return (
      <CButton
        color="primary"
        size="sm"
        className="modern-view-action-btn"
        title={t("list.approved_request_button")}
        aria-label={t("list.approved_request_button")}
        onClick={onApprove}
      >
        <span>{t("list.view")}</span>
        <span className="modern-view-action-circle">
          <CIcon icon={cilArrowRight} className="modern-view-action-icon" />
        </span>
      </CButton>
    );
  }

  return null;
}

/* =========================
   🔤 Light i18n glue (aligned with your pattern)
   Priority:
   1) localStorage('heroz_lang')
   2) <html lang>
   3) default "ar"
========================= */
const normalizeLang = (raw) => {
  const v = (raw || "").toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("ar")) return "ar";
  return null;
};

const getLangNow = () => {
  try {
    const stored = normalizeLang(localStorage.getItem("heroz_lang"));
    if (stored) return stored;
  } catch {
    // ignore localStorage errors
  }

  const htmlLang = normalizeLang(
    document?.documentElement?.lang || ""
  );
  if (htmlLang) return htmlLang;

  // default
  return "ar";
};

const useLang = () => {
  const [lang, setLang] = useState(getLangNow());

  useEffect(() => {
    const onEvt = (e) => {
      const next = normalizeLang(e?.detail?.lang);
      if (next) {
        setLang(next);
        return;
      }
      setLang(getLangNow());
    };

    window.addEventListener("heroz_lang_changed", onEvt);

    const obs = new MutationObserver(() => {
      setLang(getLangNow());
    });

    if (document?.documentElement) {
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["lang"],
      });
    }

    return () => {
      window.removeEventListener("heroz_lang_changed", onEvt);
      obs.disconnect();
    };
  }, []);

  return lang;
};
// =========================

const ActivityRequestList = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const actRequestStatus = params.get("status") || "ALL";

  // ✅ Vendor login guard
  useEffect(() => {
    IsVendorLoginIsValid(); // will redirect to BaseURL if token/usertype invalid
  }, []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ NEW: search + pagination state
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 🌐 language + dictionary (static packs)
  const lang = useLang();
  const dict = lang === "ar" ? arPack : enPack;
  const t = useCallback(
    (k) =>
      Object.prototype.hasOwnProperty.call(dict, k) ? dict[k] : k,
    [dict]
  );

  const pageTitle = useMemo(() => {
    const s = (actRequestStatus || "").toUpperCase();
    if (s === "TRIP-BOOKED")
      return t("list.page_title_trip_booked");
    if (s === "WAITING-FOR-APPROVAL")
      return t("list.page_title_waiting_for_approval");
    if (s === "APPROVED")
      return t("list.page_title_approved");
    if (s === "REJECTED")
      return t("list.page_title_rejected");
    if (s === "COMPLETED")
      return t("list.page_title_completed");
    return t("list.page_title_all");
  }, [actRequestStatus, t]);

  // ✅ NEW: filtered records
  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    if (!q) return items;

    return items.filter((req) => {
      const searchable = [
        req.actName,
        req.actRequestRefNo,
        req.actRequestDate,
        req.actRequestTime,
        req.actRequestStatus,
        req.RequestID,
        req.ActivityID,
        req.SchoolID,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [items, searchText]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  }, [filteredItems.length]);

  const pagedItems = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, currentPage, totalPages]);

  const pageStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, filteredItems.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, actRequestStatus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToRequest = useCallback(
    (req) => {
      // 🔒 robust fallback: prefer ActivityID, else use RequestID path
      if (req.ActivityID) {
        navigate(
          `/vendordata/actrequest/actreqinfo/${encodeURIComponent(
            req.ActivityID
          )}`
        );
      } else if (req.RequestID) {
        navigate(
          `/vendordata/actrequest/actreqinfo/by-request/${encodeURIComponent(
            req.RequestID
          )}`
        );
      } else {
        console.warn(
          "No ActivityID/RequestID available for navigation",
          req
        );
      }
    },
    [navigate]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const url = GET_ACTIVITY_REQUESTS;
        const payload = {
          VendorID: getCurrentLoggedUserID(),
          actRequestStatus,
        };

        const resp = await fetch(url, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        const json = await resp.json();

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }

        // Accept multiple response shapes
        let listRaw = [];
        if (Array.isArray(json?.data)) listRaw = json.data;
        else if (Array.isArray(json)) listRaw = json;
        else if (json && typeof json === "object") listRaw = [json];

        const mapped = listRaw.map(mapItem);
        if (alive) setItems(mapped);
      } catch (e) {
        if (alive) setError(e.message || "Failed to load requests");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [actRequestStatus]);

  return (
    <div className="modern-request-page">
      <div className="modern-request-shell">
        <CRow className="justify-content-center">
          <CCol xs={12}>
            <CCard className="modern-main-card">
              <CCardHeader className="modern-card-header">
                {/* ✅ Header is now inline / one line on desktop */}
                <div className="modern-inline-header">
                  <div className="modern-title-area">
                    <h3 className="modern-page-title">{pageTitle}</h3>
                  </div>

                  <div className="modern-search-area">
                    <CInputGroup className="modern-search-group">
                      <CInputGroupText className="modern-search-icon-wrap">
                        <CIcon icon={cilSearch} className="modern-search-icon" />
                      </CInputGroupText>
                      <CFormInput
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder={t("list.search_placeholder")}
                        className="modern-search-input"
                      />
                    </CInputGroup>
                  </div>

                  <div className="modern-record-summary">
                    <div className="modern-total-card">
                      <CIcon icon={cilList} className="modern-total-icon" />
                      <div>
                        <div className="modern-total-label">{t("list.total_records")}</div>
                        <div className="modern-total-value">{filteredItems.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CCardHeader>

              <CCardBody className="p-4">
                {loading && (
                  <div className="modern-loading-box">
                    <CSpinner />
                  </div>
                )}

                {!loading && error && (
                  <CAlert color="danger" className="rounded-4 mb-0">
                    {error}
                  </CAlert>
                )}

                {!loading && !error && filteredItems.length === 0 && (
                  <div className="modern-empty-box">
                    {searchText.trim()
                      ? t("list.no_search_result")
                      : t("list.no_activity_found")}
                  </div>
                )}

                {!loading && !error && filteredItems.length > 0 && (
                  <>
                    <div className="modern-list-wrap">
                      {pagedItems.map((req) => (
                        <div
                          key={req.RequestID || req.ActivityID}
                          className="modern-request-card"
                          role="button"
                          onClick={() => goToRequest(req)}
                        >
                          <div className="modern-request-top">
                            <div className="modern-activity-name">
                              {req.actName || "-"}
                            </div>
                          </div>

                          <div className="modern-info-grid">
                            <InfoRow
                              label={t("kv.trip_no")}
                              value={req.actRequestRefNo || "-"}
                              color="#444"
                              highlight
                              statusNode={
                                <StatusPill
                                  status={req.actRequestStatus}
                                  t={t}
                                />
                              }
                            />

                            <InfoRow
                              label={t("kv.trip_date")}
                              value={req.actRequestDate || "-"}
                              color="#444"
                            />

                            <InfoRow
                              label={t("kv.trip_time")}
                              value={req.actRequestTime || "-"}
                              color="#444"
                            />

                            {/* ✅ NEW: Reject reason block */}
                            {req.RequestRejectReason &&
                              req.RequestRejectReason.trim() !== "" && (
                                <div
                                  className="modern-reject-box"
                                  onClick={(e) => e.stopPropagation()} // don't trigger card navigation
                                >
                                  <div className="modern-reject-title">
                                    {t("list.reject_reason")}
                                  </div>
                                  {req.RequestRejectReason}
                                </div>
                              )}

                            <InfoRow
                              label={t("list.total_expected")}
                              value={String(req.actTotalNoStudents || 0)}
                              color="#444"
                              trailing={
                                <TrailingByStatus
                                  status={req.actRequestStatus}
                                  t={t}
                                  onViewPaid={(e) => {
                                    e.stopPropagation();
                                    goToRequest(req);
                                  }}
                                  onApprove={(e) => {
                                    e.stopPropagation();
                                    goToRequest(req);
                                  }}
                                  onWaiting={(e) => {
                                    e.stopPropagation();
                                    goToRequest(req);
                                  }}
                                />
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredItems.length > PAGE_SIZE && (
                      <div className="modern-pagination-wrap">
                        <div className="modern-pagination-info">
                          {t("list.showing")} {pageStart} - {pageEnd} {t("list.of")} {filteredItems.length}
                        </div>

                        <div className="modern-pagination-buttons">
                          <CButton
                            className="modern-pagination-btn"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          >
                            <CIcon icon={cilChevronLeft} />
                          </CButton>

                          <span className="modern-pagination-current">
                            {currentPage} / {totalPages}
                          </span>

                          <CButton
                            className="modern-pagination-btn"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          >
                            <CIcon icon={cilChevronRight} />
                          </CButton>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </div>
    </div>
  );
};

export default ActivityRequestList;
