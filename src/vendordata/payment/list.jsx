// src/vendordata/activityinfo/activity/ViewActivityScreen.jsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CCard, CCardBody, CButton } from "@coreui/react";
import { AppColors } from "../../_shared/colors";

// ---------- Small helpers ----------
const ts = (fontSize, extra = {}) => ({ fontSize, ...extra });

// Detect current document direction (LTR/RTL)
const useDocDir = () => {
  const [dir, setDir] = React.useState(document?.documentElement?.dir || "ltr");
  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setDir(document?.documentElement?.dir || "ltr");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => obs.disconnect();
  }, []);
  return dir;
};

const ViewActivityScreen = () => {
  const navigate = useNavigate();
  const dir = useDocDir();
  const [params] = useSearchParams();
  const RequestID = params.get("RequestID") || "";

  return (
    <div dir={dir} style={{ padding: 16 }}>
      <CCard
        style={{
          borderRadius: 20,
          border: `1px solid ${AppColors?.onPinkBorderColor || "#e5e7eb"}`,
        }}
      >
        <CCardBody>
          <div style={{ textAlign: "center", padding: "48px 12px" }}>
            {/* Title */}
            <div
              style={{
                ...ts(28, { fontWeight: 800 }),
                color: AppColors?.onTextName || "#111827",
                letterSpacing: 0.2,
              }}
            >
              Coming Soon
            </div>

            {/* Subtitle (EN) */}
            <div style={{ marginTop: 8, color: "#6b7280", ...ts(16) }}>
              This page is under construction and will be available shortly.
            </div>

            {/* Subtitle (AR) */}
            <div style={{ marginTop: 6, color: "#6b7280", ...ts(16), direction: "rtl" }}>
              قادم قريبًا — هذه الصفحة قيد التطوير.
            </div>

            {/* Optional: show incoming RequestID if present */}
            {RequestID && (
              <div
                style={{
                  marginTop: 16,
                  display: "inline-block",
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  ...ts(13),
                }}
              >
                Ref: {RequestID}
              </div>
            )}
 
           
          </div>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default ViewActivityScreen;
