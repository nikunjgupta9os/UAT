import React, { useState } from "react";
import SectionCard from "./SectionCard";
import CustomSelect from "../../../common/SearchSelect"; // Adjust the path as needed

type OptionType = { value: string; label: string };

const orderTypeOptions: OptionType[] = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
];

const transactionTypeOptions: OptionType[] = [
  { value: "Swap", label: "Swap" },
  { value: "Outright", label: "Outright" },
];

const fxPairOptions: OptionType[] = [
  { value: "USD/INR", label: "USD/INR" },
  { value: "EUR/INR", label: "EUR/INR" },
  { value: "GBP/INR", label: "GBP/INR" },
  { value: "JPY/INR", label: "JPY/INR" },
  { value: "EUR/USD", label: "EUR/USD" },
  { value: "GBP/USD", label: "GBP/USD" },
  { value: "EUR/GBP", label: "EUR/GBP" },
];

const cancelReasonOptions: OptionType[] = [
  { value: "Early Settlement", label: "Early Settlement" },
  { value: "Exposure Change", label: "Exposure Change" },
  { value: "Market Movement", label: "Market Movement" },
];

const DealDetails: React.FC = () => {
  const [orderType, setOrderType] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [fxPair, setFxPair] = useState("");
  const [cancelDate, setCancelDate] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [spotRate, setSpotRate] = useState("");
  const [premiumDiscount, setPremiumDiscount] = useState("");
  const [marginRate, setMarginRate] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const parseFloatOrZero = (val: string) => parseFloat(val) || 0;

  const totalEffectiveRate =
    parseFloatOrZero(spotRate) +
    parseFloatOrZero(premiumDiscount) +
    parseFloatOrZero(marginRate);

  const derivedAmount =
    parseFloatOrZero(baseAmount) * totalEffectiveRate;

  const today = new Date().toISOString().split("T")[0];

  return (
    <SectionCard title="Deal Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomSelect
          label="Order Type"
          options={orderTypeOptions}
          selectedValue={orderType}
          onChange={setOrderType}
          placeholder="Select..."
        />

        <CustomSelect
          label="Transaction Type"
          options={transactionTypeOptions}
          selectedValue={transactionType}
          onChange={setTransactionType}
          placeholder="Select..."
        />

        <CustomSelect
          label="FX Pair"
          options={fxPairOptions}
          selectedValue={fxPair}
          onChange={setFxPair}
          placeholder="Select..."
        />

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Cancel Date</label>
          <input
            type="date"
            className="border h-[37px] px-2 rounded border-border bg-white text-secondary-text-dark"
            min={today}
            value={cancelDate}
            onChange={(e) => setCancelDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Base Amount</label>
          <input
            type="number"
            min="0"
            className="border h-[37px] px-2 rounded border-border bg-white text-secondary-text-dark"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Spot Rate</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            className="border h-[37px] px-2 rounded border-border bg-white text-secondary-text-dark"
            value={spotRate}
            onChange={(e) => setSpotRate(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Premium / Discount</label>
          <input
            type="number"
            step="0.0001"
            className="border h-[37px] px-2 rounded border-border bg-white text-secondary-text-dark"
            value={premiumDiscount}
            onChange={(e) => setPremiumDiscount(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Margin Rate</label>
          <input
            type="number"
            step="0.0001"
            className="border h-[37px] px-2 rounded border-border bg-white text-secondary-text-dark"
            value={marginRate}
            onChange={(e) => setMarginRate(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Total Effective Rate</label>
          <input
            type="number"
            className="border h-[37px] px-2 rounded border-border bg-gray-100 text-secondary-text-dark"
            value={totalEffectiveRate.toFixed(4)}
            disabled
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Derived Amount</label>
          <input
            type="number"
            className="border h-[37px] px-2 rounded border-border bg-gray-100 text-secondary-text-dark"
            value={derivedAmount.toFixed(2)}
            disabled
          />
        </div>

        <CustomSelect
          label="Reason for Cancellation"
          options={cancelReasonOptions}
          selectedValue={cancelReason}
          onChange={setCancelReason}
          placeholder="Select..."
        />
      </div>
    </SectionCard>
  );
};

export default DealDetails;
