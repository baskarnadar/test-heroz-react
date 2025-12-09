// tripsummary.js
import React, { useMemo } from "react";
import icon5 from "../../assets/icon/icon5.png";
import PaymentMethodPicker from "../component/paymentpicker";
import FoodInfo from "../component/foodinfo";

const TrupSummary = ({
  dict,
  priceTotal,
  grandTotalWithTax,
  validKidsCount,
  ActivityData,
  TripData,
  checkedFoodItems,
  handleCheckboxChange,
  foodQty,
  handleExtraQtyChange,
  lang,
  paymentAmount,
  apiBase,
  onPaymentMethodSelect,
  onSubmit,
}) => {
  // ✅ Only show food block if there is any food at all
  const hasAnyFood = useMemo(
    () =>
      Array.isArray(ActivityData?.foodList) &&
      ActivityData.foodList.length > 0,
    [ActivityData]
  );

  return (
    <div className="card pricing">
      <h3 className="card-title trip-gradient-color fontsize40">
        {dict.tripsPricing}
      </h3>

      {/* Base Trip Cost */}
      <div className="price-row">
        <span className="price-label fontsize20">
          {dict.baseTripCost}
        </span>
        <span className="price-value fontsize20">
          {priceTotal.toFixed(2)} <img src={icon5} alt="HEROZ" />
        </span>
      </div>

      <div className="divider" />

      {/* ✅ Food block (Included / Extra) comes fully from FoodInfo */}
      {hasAnyFood && (
        <>
          <div className="food-wrap">
            <FoodInfo
              ActivityData={ActivityData}
              checkedFoodItems={checkedFoodItems}
              handleCheckboxChange={handleCheckboxChange}
              schoolReqFoodPrice={TripData?.schoolreqfoodprice ?? []}
              foodQty={foodQty}
              onQtyChange={handleExtraQtyChange}
              lang={lang}
            />
          </div>
          <div className="divider" />
        </>
      )}

      {/* ❌ VAT + Subtotal HIDDEN – as requested */}

      {/* Total (per student) */}
      <div className="summary-row total trip-gradient-color">
        <span>
          <div>{dict.totalPayable}</div>
          <div>({dict.ar_inc_vat})</div>
        </span>
        <span>
          {grandTotalWithTax.toFixed(2)}{" "}
          <img src={icon5} alt="HEROZ" />
        </span>
      </div>

      {/* Net payable for multiple kids */}
      {validKidsCount > 1 && (
        <div className="summary-row total net-payable trip-gradient-color">
          <span>
            {dict.netPayableAmount.replace("{count}", validKidsCount)}  <div>({dict.ar_inc_vat})</div>
          </span>
          <span>
            {(grandTotalWithTax * validKidsCount).toFixed(2)}{" "}
            <img src={icon5} alt="HEROZ" />
          </span>
        </div>
      )}

      {/* Payment methods */}
      <div style={{ marginTop: 16 }}>
        <PaymentMethodPicker
          amount={paymentAmount}
          apiBase={apiBase}
          currency="SAR"
          onSelect={onPaymentMethodSelect}
          autoFetch
          lang={lang}
        />
      </div>

      <div className="divider" />

      {/* Continue button */}
      <div className="payment-group">
        <button className="btn-primary" onClick={onSubmit}>
          {dict.continueToPayment}
        </button>
      </div>
    </div>
  );
};

export default TrupSummary;
