import React, { useMemo } from "react";
import { CRow, CCol } from "@coreui/react";
import enPack from "../i18n/enlangpack.json";
import arPack from "../i18n/arlangpack.json";

const FoodInfo = ({
  ActivityData,
  checkedFoodItems,
  handleCheckboxChange,
  schoolReqFoodPrice = [],
  // ✅ optional language prop; falls back to localStorage('heroz_lang') then 'ar'
  lang: langProp,
}) => {
  // ✅ language + dict selection (additive)
  const currentLang = useMemo(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("heroz_lang") : null;
      return (langProp || stored || "ar").toLowerCase() === "ar" ? "ar" : "en";
    } catch {
      return (langProp || "ar");
    }
  }, [langProp]);

  const dict = currentLang === "ar" ? arPack : enPack;
  const tr = (key, fallback) => (dict && dict[key] != null ? dict[key] : fallback || key);

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

  const renderHeader = () => (
    <CRow className="mb-1 fw-bold hbg">
      <CCol sm={1} xs={1}>#</CCol>
      <CCol sm={9} xs={6}>{tr("food_name", "Name")}</CCol>
      <CCol sm={2} style={{ display: "none" }}>{tr("food_school_price", "School")}</CCol>
      <CCol sm={2} style={{ display: "none" }}>{tr("food_vendor_price", "Vendor")}</CCol>
      <CCol sm={2} style={{ display: "none" }}>{tr("food_heroz_price", "Heroz")}</CCol>
      <CCol sm={2} xs={5}>{tr("food_total", "Total")}</CCol>
    </CRow>
  );

  const renderFoodRows = (list) =>
    list.map((foodItem, index) => {
      // Prefer the school-requested price from map, else fallback
      const schoolPrice =
        schoolPriceMap[foodItem.FoodID] ??
        (parseFloat(foodItem?.RequestFoodSchoolPrice) || 0);

      // Treat FoodVendorPrice as primary; fallback to FoodPrice
      const vendorPrice =
        parseFloat(foodItem?.FoodVendorPrice ?? foodItem?.FoodPrice) || 0;

      const herozPrice = parseFloat(foodItem?.FoodHerozPrice) || 0;

      const total = vendorPrice + herozPrice + schoolPrice;

      // ✅ Localized display name if you have Arabic name field available
      const displayName =
        currentLang === "ar"
          ? (foodItem?.FoodNameAr ?? foodItem?.FoodName)
          : (foodItem?.FoodName ?? foodItem?.FoodNameAr);

      return (
        <CRow key={foodItem.FoodID ?? index} className="mb-2 align-items-center">
          <CCol sm={1} xs={1}>
            <input
              className="big-input"
              type={foodItem?.Include === true ? "radio" : "checkbox"}
              name={
                foodItem?.Include === true
                  ? "foodSelect"
                  : `foodCheckbox-${foodItem?.FoodID}`
              }
              value={foodItem.FoodID}
              checked={checkedFoodItems[foodItem.FoodID] || false}
              onChange={() =>
                handleCheckboxChange(foodItem.FoodID, foodItem.Include === true)
              }
              title={
                foodItem?.Include === true
                  ? tr("food_included_option", "Included option")
                  : tr("food_extra_option", "Extra option")
              }
            />
          </CCol>

          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {schoolPrice.toFixed(2)}
          </CCol>

          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {vendorPrice.toFixed(2)}
          </CCol>

          <CCol sm={2} xs={2} style={{ display: "none" }} className="text-end">
            {herozPrice.toFixed(2)}
          </CCol>

          <CCol sm={9} xs={6}>
            <div>{displayName}</div>
          </CCol>

          <CCol sm={2} xs={5}>
            {total.toFixed(2)}
          </CCol>
        </CRow>
      );
    });

  return (
    <>
      {/* ✅ Add RTL/LTR based on current language without removing your structure */}
      <div dir={currentLang === "ar" ? "rtl" : "ltr"}>
        {freeFoodList.length > 0 && (
          <>
            {renderHeader()}
            {renderFoodRows(freeFoodList)}
          </>
        )}

        {extraFoodList.length > 0 && (
          <>
            <h5 style={{ marginTop: 30, marginBottom: 10 }} className="foodline">
              {tr("food_extra", "Extra")}
            </h5>
            <div className="divider" />
            {renderHeader()}
            {renderFoodRows(extraFoodList)}
          </>
        )}
      </div>
    </>
  );
};

export default FoodInfo;
