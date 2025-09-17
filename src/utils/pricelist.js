// src/vendordata/activityinfo/activity/pricelist.js
import React from "react";
import { CCard, CCardBody, CCardHeader } from "@coreui/react";
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
 * PriceListCard
 * Props:
 *  - prices: Array<{ PriceTitle?, PriceDesc?, PriceAmount? }>
 *  - title: string (e.g., "Vendor Price.")
 */
const PriceListCard = ({ prices = [], title = "Prices" }) => {
  const dir = useDocDir();
  if (!Array.isArray(prices) || prices.length === 0) return null;

  return (
    <div dir={dir}>
      <CCard style={{ borderRadius: 12 }}>
        <CCardHeader style={{ backgroundColor: AppColors.onHeaderBarColor }}>
          <b>{title}</b>
        </CCardHeader>
        <CCardBody>
          <div style={{ display: "grid", gap: 12 }}>
            {prices.map((p, idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid ${AppColors.onPinkBorderColor}`,
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{p?.PriceTitle || "Price"}</div>
                  {p?.PriceDesc && (
                    <div style={{ color: "#666", marginTop: 4, whiteSpace: "pre-wrap" }}>
                      {p.PriceDesc}
                    </div>
                  )}
                </div>
                <div style={{ alignSelf: "center", fontWeight: 700 }}>
                  {p?.PriceAmount ?? "--"}
                </div>
              </div>
            ))}
          </div>
        </CCardBody>
      </CCard>
    </div>
  );
};

export default PriceListCard;
