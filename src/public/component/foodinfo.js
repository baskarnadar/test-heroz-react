// foodinfo.js
import React, { useMemo } from "react";
import { CRow, CCol } from "@coreui/react";
import enPack from "../../i18n/enlangpack.json";
import arPack from "../../i18n/arlangpack.json";

const FoodInfo = ({
  ActivityData,
  checkedFoodItems,
  handleCheckboxChange,
  schoolReqFoodPrice = [],
  // language prop; falls back to localStorage
  lang: langProp,
  // quantity per FoodID and change handler (for EXTRA items)
  foodQty = {},
  onQtyChange,
}) => {
  // ---------- helpers ----------
  const round2 = (v) => {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return 0;
    const scaled = Math.round((n + Number.EPSILON) * 100);
    return scaled / 100;
  };
  const to2 = (v) => round2(v).toFixed(2);

  // language + dict selection
  const currentLang = useMemo(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("heroz_lang")
          : null;
      return (langProp || stored || "ar").toLowerCase() === "ar" ? "ar" : "en";
    } catch {
      return langProp || "ar";
    }
  }, [langProp]);

  const dict = currentLang === "ar" ? arPack : enPack;
  const tr = (key, fallback) =>
    dict && dict[key] != null ? dict[key] : fallback || key;

  const foodList = ActivityData?.foodList ?? [];

  // Map FoodID -> FoodSchoolPrice from the trip API
  const schoolPriceMap = useMemo(() => {
    const m = {};
    for (const x of schoolReqFoodPrice) {
      if (x?.FoodID) m[x.FoodID] = Number(x.FoodSchoolPrice) || 0;
    }
    return m;
  }, [schoolReqFoodPrice]);

  const freeFoodList = foodList.filter((item) => item?.Include === true);

  // Only extras that exist in schoolReqFoodPrice
  const extraFoodList = foodList
    .filter((item) => item?.Include !== true)
    .filter((item) =>
      Object.prototype.hasOwnProperty.call(schoolPriceMap, item.FoodID)
    );

  const hasFree = freeFoodList.length > 0;
  const hasExtra = extraFoodList.length > 0;

  // If no food at all, render nothing (so no title & no block)
  if (!hasFree && !hasExtra) {
    return null;
  }

  // ---------- price + VAT helper ----------
  const getPrices = (foodItem) => {
    const schoolPrice =
      schoolPriceMap[foodItem.FoodID] ??
      (parseFloat(foodItem?.RequestFoodSchoolPrice) || 0);

    const vendorPrice =
      parseFloat(foodItem?.FoodVendorPrice ?? foodItem?.FoodPrice) || 0;

    const herozPrice = parseFloat(foodItem?.FoodHerozPrice) || 0;

    const totalBase = schoolPrice + vendorPrice + herozPrice;

    // VAT parts
    const schoolVat =
      parseFloat(foodItem?.RequestFoodSchoolPriceVatAmount) || 0;
    const vendorVat = parseFloat(foodItem?.FoodPriceVatAmount) || 0;
    const herozVat = parseFloat(foodItem?.FoodHerozPriceVatAmount) || 0;

    const totalVat = schoolVat + vendorVat + herozVat;
    const totalWithVat = totalBase + totalVat;

    return {
      schoolPrice,
      vendorPrice,
      herozPrice,
      totalBase,
      schoolVat,
      vendorVat,
      herozVat,
      totalVat,
      totalWithVat,
    };
  };

  const getDisplayName = (foodItem) =>
    currentLang === "ar"
      ? foodItem?.FoodNameAr ?? foodItem?.FoodName
      : foodItem?.FoodName ?? foodItem?.FoodNameAr;

  // nice pill-style (similar to "View on map")
  const qtyBtnStyle = {
    minWidth: "50px",
    height: "40px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(90deg,#7c3aed,#c026d3)",
    color: "#fff",
    fontSize: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    margin: 0,
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    userSelect: "none",
    lineHeight: "40px",
    position: "relative",
    zIndex: 10,
    pointerEvents: "auto",
  };

  // ---------- header ----------
  const renderHeader = ({ showQty }) => (
    <CRow className="mb-1 fw-bold hbg">
      <CCol sm={1} xs={1}>
        #
      </CCol>

      {/* Name */}
      <CCol sm={showQty ? 5 : 9} xs={showQty ? 3 : 6}>
        {tr("food_name", "Name")}
      </CCol>

      {/* hidden internal columns (kept for future) */}
      <CCol sm={2} style={{ display: "none" }}>
        {tr("food_school_price", "School")}
      </CCol>
      <CCol sm={2} style={{ display: "none" }}>
        {tr("food_vendor_price", "Vendor")}
      </CCol>
      <CCol sm={2} style={{ display: "none" }}>
        {tr("food_heroz_price", "Heroz")}
      </CCol>

      {showQty && (
        <CCol sm={3} xs={4} className="text-center">
          {tr("food_qty", "Qty")}
        </CCol>
      )}

      <CCol sm={showQty ? 3 : 2} xs={showQty ? 4 : 5} className="text-end">
        {tr("food_total", "Total")}
      </CCol>
    </CRow>
  );

  // ---------- rows for included items ----------
  const renderFreeRows = (list) =>
    list.map((foodItem, index) => {
      const {
        schoolPrice,
        vendorPrice,
        herozPrice,
        totalWithVat,
      } = getPrices(foodItem);
      const displayName = getDisplayName(foodItem);

      return (
        <CRow
          key={foodItem.FoodID ?? index}
          className="mb-2 align-items-center"
        >
          <CCol sm={1} xs={1}>
            <input
              className="big-input"
              type="radio"
              name="foodSelect"
              value={foodItem.FoodID}
              checked={checkedFoodItems[foodItem.FoodID] || false}
              onChange={() => handleCheckboxChange(foodItem.FoodID, true)}
              title={tr("food_included_option", "Included option")}
            />
          </CCol>

          {/* hidden price columns */}
          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {to2(schoolPrice)}
          </CCol>
          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {to2(vendorPrice)}
          </CCol>
          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {to2(herozPrice)}
          </CCol>

          <CCol sm={9} xs={6}>
            <div>{displayName}</div>
          </CCol>

          {/* ONE amount INCLUDING VAT (no VAT text) */}
          <CCol sm={2} xs={5} className="text-end">
            {to2(totalWithVat)}
          </CCol>
        </CRow>
      );
    });

  // ---------- rows for EXTRA items (with +/- qty) ----------
  const renderExtraRows = (list) =>
    list.map((foodItem, index) => {
      const {
        schoolPrice,
        vendorPrice,
        herozPrice,
        totalWithVat: unitIncVat,
      } = getPrices(foodItem);
      const displayName = getDisplayName(foodItem);

      const isChecked = !!checkedFoodItems[foodItem.FoodID];
      const rawQty = Number(foodQty?.[foodItem.FoodID]) || 0;

      const qty = isChecked ? (rawQty > 0 ? rawQty : 1) : 0;

      // Total INCLUDING VAT for this extra line (per booking)
      const lineIncVat = isChecked ? unitIncVat * qty : unitIncVat;

      const handleQtyButton = (delta) => {
        if (!onQtyChange) return;

        // if NOT checked and user taps "+"
        if (!isChecked && delta > 0) {
          handleCheckboxChange(foodItem.FoodID, false);
          onQtyChange(foodItem.FoodID, 1);
          return;
        }

        // if not checked and "-" => ignore
        if (!isChecked) return;

        const newQty = qty + delta;
        const safeNew = newQty < 1 ? 1 : newQty;
        onQtyChange(foodItem.FoodID, safeNew);
      };

      const handleExtraCheckbox = () => {
        const willBeChecked = !isChecked;
        handleCheckboxChange(foodItem.FoodID, false);
        if (willBeChecked && onQtyChange && rawQty <= 0) {
          onQtyChange(foodItem.FoodID, 1);
        }
      };

      return (
        <CRow
          key={foodItem.FoodID ?? index}
          className="mb-2 align-items-center"
        >
          <CCol sm={1} xs={1}>
            <input
              className="big-input"
              type="checkbox"
              name={`foodCheckbox-${foodItem?.FoodID}`}
              value={foodItem.FoodID}
              checked={isChecked}
              onChange={handleExtraCheckbox}
              title={tr("food_extra_option", "Extra option")}
            />
          </CCol>

          {/* hidden price columns */}
          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {to2(schoolPrice)}
          </CCol>
          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {to2(vendorPrice)}
          </CCol>
          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {to2(herozPrice)}
          </CCol>

          {/* Name */}
          <CCol sm={5} xs={3}>
            <div>{displayName}</div>
          </CCol>

          {/* Qty control */}
          <CCol sm={3} xs={4}>
            <div
              className="qty-control d-flex align-items-center"
              style={{ gap: "6px" }}
            >
              <button
                type="button"
                style={qtyBtnStyle}
                onClick={() => handleQtyButton(-1)}
              >
                –
              </button>

              <input
                type="text"
                className="qty-input text-center"
                value={qty}
                readOnly
                style={{
                  width: "50px",
                  height: "36px",
                  border: "1px solid #aaa",
                  borderRadius: "8px",
                  padding: "2px 4px",
                  textAlign: "center",
                  fontSize: "16px",
                }}
              />

              <button
                type="button"
                style={qtyBtnStyle}
                onClick={() => handleQtyButton(1)}
              >
                +
              </button>
            </div>
          </CCol>

          {/* Line total INCLUDING VAT only (no VAT text) */}
          <CCol
            sm={3}
            xs={4}
            className="text-end"
            style={{ position: "relative", zIndex: 1 }}
          >
            {to2(lineIncVat)}
          </CCol>
        </CRow>
      );
    });

  return (
    <div dir={currentLang === "ar" ? "rtl" : "ltr"}>
      {/* Included section – only if free food exists */}
      {hasFree && (
        <>
          <h5
            style={{ marginTop: 10, marginBottom: 10 }}
            className="foodline"
          >
            {tr("food_included", "Included")}
          </h5>
          <div className="divider" />
          {renderHeader({ showQty: false })}
          {renderFreeRows(freeFoodList)}
        </>
      )}

      {/* Extra section – only if extra food exists */}
      {hasExtra && (
        <>
          <h5
            style={{ marginTop: hasFree ? 30 : 10, marginBottom: 10 }}
            className="foodline"
          >
            {tr("food_extra", "Extra")}
          </h5>
          <div className="divider" />
          {renderHeader({ showQty: true })}
          {renderExtraRows(extraFoodList)}
        </>
      )}
    </div>
  );
};

export default FoodInfo;
