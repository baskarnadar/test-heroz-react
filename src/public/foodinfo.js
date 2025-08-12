import React, { useMemo } from "react";
import { CRow, CCol } from "@coreui/react";

const FoodInfo = ({
  ActivityData,
  checkedFoodItems,
  handleCheckboxChange,
  schoolReqFoodPrice = [],
}) => {
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
  <CCol sm={9} xs={9}>Name</CCol> 
    <CCol sm={2}  style={{display:"none"}}>School</CCol>
    <CCol sm={2}  style={{display:"none"}}>Vendor</CCol>
    <CCol sm={2}  style={{display:"none"}}>Heroz</CCol>
  <CCol sm={2} xs={2}>Total</CCol>
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
              title={foodItem?.Include === true ? "Included option" : "Extra option"}
            />
          </CCol>
  <CCol sm={2} xs={2} style={{display:"none"}} className="text-end">
            {schoolPrice.toFixed(2)}
          </CCol>

          <CCol sm={2} xs={2} style={{display:"none"}} className="text-end">
            {vendorPrice.toFixed(2)}
          </CCol>

          <CCol sm={2} xs={2} style={{display:"none"}} className="text-end">
            {herozPrice.toFixed(2)}
          </CCol>
          <CCol sm={9} xs={9}>
            <div>{foodItem?.FoodName}</div>
          </CCol> 
          <CCol sm={2} xs={2}  >
            {total.toFixed(2)}
          </CCol>
        </CRow>
      );
    });

  return (
    <>
      <div>
        {/* Included (free) */}
        {freeFoodList.length > 0 && (
          <>
            {renderHeader()}
            {renderFoodRows(freeFoodList)}
          </>
        )}

        {/* Extra */}
        {extraFoodList.length > 0 && (
          <>
            <h5 style={{ marginTop: 30, marginBottom: 10 }} className="foodline">
              Extra
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
