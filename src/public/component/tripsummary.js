// src/public/component/tripsummary.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import icon5 from "../../assets/icon/icon5.png";
import FoodInfo from "../component/foodinfo";
import { API_BASE_URL } from "../../config";

// Apple Pay Method IDs (as MyFatoorah support says: unique ids)
const MF_APPLEPAY_VISA_MASTER_ID = 11; // Apple Pay (Visa/Master)
const MF_APPLEPAY_MADA_ID = 13;        // Apple Pay (Mada)

// Other common method IDs you already use
const MF_VISA_MASTER_ID = 2;
const MF_STC_ID = 14;
const MF_MADA_ID = 6;

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
  apiBase, // passed from program.jsx
  onPaymentMethodSelect,
  onSubmit,
  tripPriceInclVat = 0,
  extraPriceInclVat = 0,
}) => {
  const isArabic = lang === "ar";

  const to2 = (v) => {
    const n = Number(v || 0);
    if (!Number.isFinite(n)) return "0.00";
    const scaled = Math.round((n + Number.EPSILON) * 100);
    return (scaled / 100).toFixed(2);
  };

  const hasAnyFood = useMemo(
    () => Array.isArray(ActivityData?.foodList) && ActivityData.foodList.length > 0,
    [ActivityData]
  );

  const basePerStudent = Number(tripPriceInclVat) || 0;
  const extraTotal = Number(extraPriceInclVat) || 0;
  const totalPayable = Number(grandTotalWithTax) || basePerStudent + extraTotal;

  const netForKids =
    validKidsCount > 0 ? basePerStudent * validKidsCount + extraTotal : totalPayable;

  const tripPriceDisplay = basePerStudent;

  // --------------------------
  // ✅ Clean payment UI state
  // --------------------------
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [methodsErr, setMethodsErr] = useState("");
  const [availableIds, setAvailableIds] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);

  const reqIdRef = useRef(0);

  const safeParse = async (r) => {
    const txt = await r.text();
    try {
      return JSON.parse(txt);
    } catch {
      return { raw: txt };
    }
  };

  // Fetch methods once (so we can show/hide based on availability)
  useEffect(() => {
    const run = async () => {
      setMethodsErr("");
      setLoadingMethods(true);
      const myReqId = ++reqIdRef.current;

      try {
        const r = await fetch(`${apiBase || API_BASE_URL}/myfatrooahdata/pay/initiate-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Number(paymentAmount) || 0, currency: "SAR" }),
        });

        const data = await safeParse(r);
        if (myReqId !== reqIdRef.current) return;

        if (!r.ok) {
          setMethodsErr(
            data?.Message ||
              data?.error?.Message ||
              (typeof data === "string" ? data : JSON.stringify(data)).slice(0, 500)
          );
          setAvailableIds(new Set());
          return;
        }

        const list = data?.Data?.PaymentMethods || [];
        const ids = new Set(list.map((m) => Number(m?.PaymentMethodId)).filter((x) => Number.isFinite(x)));
        setAvailableIds(ids);

        // ✅ default selection (prefer Mada -> Visa/Master -> STC)
        const defaultId =
          (ids.has(MF_MADA_ID) && MF_MADA_ID) ||
          (ids.has(MF_VISA_MASTER_ID) && MF_VISA_MASTER_ID) ||
          (ids.has(MF_STC_ID) && MF_STC_ID) ||
          null;

        if (defaultId != null) {
          setSelectedId(defaultId);
          onPaymentMethodSelect?.(defaultId, { PaymentMethodId: defaultId });
        }
      } catch (e) {
        if (myReqId !== reqIdRef.current) return;
        setMethodsErr(String(e));
        setAvailableIds(new Set());
      } finally {
        if (myReqId === reqIdRef.current) setLoadingMethods(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentAmount, apiBase]);

  const selectMethod = (id) => {
    const nid = Number(id);
    if (!Number.isFinite(nid) || nid <= 0) return;
    setSelectedId(nid);
    onPaymentMethodSelect?.(nid, { PaymentMethodId: nid });
  };

  // ✅ ONE Apple Pay button handler:
  // Ask the user 1 question so fees are correct:
  // Mada => 13, Visa/Master => 11
  const handleApplePayClick = () => {
    // If one of them is not available, fall back to the available one automatically
    const hasMada = availableIds.has(MF_APPLEPAY_MADA_ID);
    const hasVisa = availableIds.has(MF_APPLEPAY_VISA_MASTER_ID);

    if (!hasMada && !hasVisa) {
      setMethodsErr(isArabic ? "Apple Pay غير متاح حالياً." : "Apple Pay is not available right now.");
      return;
    }

    // If only one is available, use it without asking
    if (hasMada && !hasVisa) {
      selectMethod(MF_APPLEPAY_MADA_ID);
      return;
    }
    if (!hasMada && hasVisa) {
      selectMethod(MF_APPLEPAY_VISA_MASTER_ID);
      return;
    }

    // Both exist => ask user
    const msg = isArabic
      ? "هل بطاقة Apple Pay الخاصة بك (مدى)؟\n\nموافق = Apple Pay مدى (رسوم أقل)\nإلغاء = Apple Pay فيزا/ماستر"
      : "Is your Apple Pay card MADA?\n\nOK = Apple Pay MADA (lower fee)\nCancel = Apple Pay Visa/Master";

    const isMada = window.confirm(msg);
    selectMethod(isMada ? MF_APPLEPAY_MADA_ID : MF_APPLEPAY_VISA_MASTER_ID);
  };

  const showMethod = (id) => availableIds.size === 0 || availableIds.has(id);

  return (
    <div className="card pricing">
      <h3 className="card-title trip-gradient-color fontsize40">{dict.tripsPricing}</h3>

      {/* Trip Price (ONE amount INCLUDING VAT per student) */}
      <div className="price-row">
        <span className="price-label fontsize20">{dict.baseTripCost}</span>
        <span className="price-value fontsize20">
          {to2(tripPriceDisplay)} <img src={icon5} alt="HEROZ" />
        </span>
      </div>

      <div className="divider" />

      {/* Food block */}
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

      {/* Total Payable – trip (1 kid) + ALL extras (Inc VAT) */}
      <div className="summary-row total trip-gradient-color">
        <span>
          <div>{dict.totalPayable}</div>
          <div>({dict.ar_inc_vat})</div>
        </span>
        <span>
          {to2(totalPayable)} <img src={icon5} alt="HEROZ" />
        </span>
      </div>

      {/* Net payable for multiple kids – trip * kids + extra once */}
      {validKidsCount > 1 && (
        <div className="summary-row total net-payable trip-gradient-color">
          <span>
            {dict.netPayableAmount.replace("{count}", validKidsCount)} <div>({dict.ar_inc_vat})</div>
          </span>
          <span>
            {to2(netForKids)} <img src={icon5} alt="HEROZ" />
          </span>
        </div>
      )}

      <div className="divider" />

      {/* ✅ Payment methods (simple, clean) */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          {dict.ar_choose_method || (isArabic ? "اختر طريقة الدفع:" : "Choose payment method:")}
          <span style={{ color: "red", fontSize: 22, marginInlineStart: 6 }}>*</span>
        </div>

        {loadingMethods && (
          <div style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
            {dict.loadingPaymentMethods || "Loading payment methods…"}
          </div>
        )}

        {/* ✅ ONE Apple Pay button */}
        <button
          type="button"
          onClick={handleApplePayClick}
          disabled={loadingMethods}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #000",
            background: "#000",
            color: "#fff",
            fontWeight: 700,
            cursor: loadingMethods ? "not-allowed" : "pointer",
            marginBottom: 10,
          }}
        >
          {isArabic ? "Apple Pay" : "Apple Pay"}
          {selectedId === MF_APPLEPAY_MADA_ID || selectedId === MF_APPLEPAY_VISA_MASTER_ID ? " ✅" : ""}
        </button>

        {/* Other methods as radios */}
        <div style={{ display: "grid", gap: 8 }}>
          {showMethod(MF_MADA_ID) && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 8,
                border: selectedId === MF_MADA_ID ? "2px solid #1976d2" : "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="mf-method-simple"
                checked={selectedId === MF_MADA_ID}
                onChange={() => selectMethod(MF_MADA_ID)}
              />
              <span>{isArabic ? "مدى" : "MADA"}</span>
            </label>
          )}

          {showMethod(MF_VISA_MASTER_ID) && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 8,
                border: selectedId === MF_VISA_MASTER_ID ? "2px solid #1976d2" : "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="mf-method-simple"
                checked={selectedId === MF_VISA_MASTER_ID}
                onChange={() => selectMethod(MF_VISA_MASTER_ID)}
              />
              <span>{isArabic ? "فيزا / ماستر" : "VISA / MasterCard"}</span>
            </label>
          )}

          {showMethod(MF_STC_ID) && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 8,
                border: selectedId === MF_STC_ID ? "2px solid #1976d2" : "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="mf-method-simple"
                checked={selectedId === MF_STC_ID}
                onChange={() => selectMethod(MF_STC_ID)}
              />
              <span>{isArabic ? "STC Pay" : "STC Pay"}</span>
            </label>
          )}
        </div>

        {/* Terms (Program.jsx validates by id="termsAgree") */}
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            border: "1px solid rgba(255, 221, 87, 0.8)",
            backgroundColor: "rgba(255, 249, 196, 0.5)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "red", fontSize: 22 }}>*</span>
          <input type="checkbox" id="termsAgree" style={{ width: 18, height: 18 }} />
          <label htmlFor="termsAgree" style={{ margin: 0, cursor: "pointer" }}>
            {dict.ar_terms_agree || (isArabic ? "أوافق على الشروط والأحكام" : "I agree to terms & conditions")}
          </label>
        </div>

        {!!methodsErr && (
          <div
            style={{
              marginTop: 10,
              background: "#ffe6e6",
              border: "1px solid #f5a9a9",
              color: "#a40000",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <strong>{dict.errorTitle || "Error"}:</strong> {methodsErr}
          </div>
        )}
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
