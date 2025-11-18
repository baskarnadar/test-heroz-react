// src/vendordata/activityinfo/activity/additional.js
import React from "react";
import { CRow, CCol } from "@coreui/react";
import { AppColors } from "../_shared/colors";

// Small util: read current document direction
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

/**
 * AdditionalMeals
 * Props:
 *  - includedMeals: Array<{ name?, FoodName?, desc?, foodPrice? }>
 *  - excludedMeals: Array<{ name?, FoodName?, desc?, foodPrice? }>
 *  - header?: string
 * Notes:
 *  - We’ll render price if `foodPrice` exists (> 0), suffix “SAR”.
 */
const AdditionalMeals = ({ includedMeals = [], excludedMeals = [], header = "Additional" }) => {
  const dir = useDocDir();
  if (includedMeals.length === 0 && excludedMeals.length === 0) return null;

  const Box = ({ title, items, tone }) => (
    <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 14, padding: 14 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "grid", gap: 6 }}>
        {items.map((m, i) => {
          const label = m?.name ?? m?.FoodName ?? "Meal";
          const price = Number.parseFloat(m?.foodPrice ?? 0);
          return (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontWeight: 600 }}>{label}</span>
                {m?.desc ? <span style={{ color: "#666", marginInlineStart: 8 }}>{m.desc}</span> : null}
              </div>
              {price > 0 && <div style={{ whiteSpace: "nowrap" }}>{price.toFixed(2)} SAR</div>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div dir={dir}>
      <div style={{ fontWeight: 700, color: AppColors.onTxtStyle1, marginBottom: 8 }}>{header}</div>
      <CRow>
        {includedMeals.length > 0 && (
          <CCol xs={12} md={6} className="mb-3">
            <Box
              title="Included Meals"
              items={includedMeals}
              tone={{ border: "#a5d6a7", bg: "rgba(165,214,167,0.2)" }}
            />
          </CCol>
        )}
        {excludedMeals.length > 0 && (
          <CCol xs={12} md={6} className="mb-3">
            <Box
              title="Extra (Not Included)"
              items={excludedMeals}
              tone={{ border: "#ffcc80", bg: "rgba(255,204,128,0.2)" }}
            />
          </CCol>
        )}
      </CRow>
    </div>
  );
};

export default AdditionalMeals;
