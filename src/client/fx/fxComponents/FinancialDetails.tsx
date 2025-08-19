import React, { useEffect } from "react";
import SectionCard from "./SectionCard";
import CustomSelect from "../../common/SearchSelect";

type OptionType = {
  value: string;
  label: string;
};

interface FinancialDetailsResponse {
  currencyPair: string;
  valueType: string;
  actualValueBaseCurrency: number | null;
  spotRate: number | null;
  forwardPoints: number | null;
  inputValue: number | null;
  bankMargin: number | null;
  totalRate: number | null;
  valueQuoteCurrency: number | null;
  interveningRateQuoteToLocal: number | null;
  valueLocalCurrency: number | null;
  baseCurrency: string;
  quoteCurrency: string;
}

interface FinancialDetailsProps {
  formData: FinancialDetailsResponse;
  setFormData: React.Dispatch<React.SetStateAction<FinancialDetailsResponse>>;
  currencyPairs: OptionType[];
  isLoading: boolean;
  orderType?: string;
}

const valueTypeOptions: OptionType[] = [
  { value: "Actual", label: "Actual" },
  { value: "Millions", label: "Millions" },
  { value: "Thousands", label: "Thousands" },
];

const mockCurrencyPairs: OptionType[] = [
  { value: "USDINR", label: "USD/INR" },
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
];

const FinancialDetails: React.FC<FinancialDetailsProps> = ({
  formData,
  setFormData,
  isLoading,
  orderType,
}) => {
  const getValueTypeMultiplier = (valueType: string): number => {
    switch (valueType) {
      case "Actual":
        return 1;
      case "Thousands":
        return 1000;
      case "Millions":
        return 1000000;
      default:
        return 1;
    }
  };

  // Extract base and quote
  useEffect(() => {
    if (formData.currencyPair.length >= 6) {
      const base = formData.currencyPair.slice(0, 3);
      const quote = formData.currencyPair.slice(3, 6);
      setFormData((prev) => ({
        ...prev,
        baseCurrency: base,
        quoteCurrency: quote,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        baseCurrency: "",
        quoteCurrency: "",
      }));
    }
  }, [formData.currencyPair, setFormData]);

  // Calculate total rate
  useEffect(() => {
    const { spotRate, forwardPoints, bankMargin } = formData;
    if (orderType && spotRate !== null && forwardPoints !== null && bankMargin !== null) {
      let totalRate: number;
      if (orderType.toLowerCase() === "buy") {
        totalRate = spotRate + forwardPoints + bankMargin;
      } else if (orderType.toLowerCase() === "sell") {
        totalRate = spotRate + forwardPoints - bankMargin;
      } else return;
      setFormData((prev) => ({ ...prev, totalRate }));
    }
  }, [formData.spotRate, formData.forwardPoints, formData.bankMargin, orderType, setFormData]);

  // Value Quote + Local
  useEffect(() => {
    const { inputValue, spotRate, valueType } = formData;
    if (inputValue && spotRate && valueType) {
      const multiplier = getValueTypeMultiplier(valueType);
      const valueQuoteCurrency = inputValue * multiplier * spotRate;
      const valueLocalCurrency = inputValue * multiplier * valueQuoteCurrency;
      setFormData((prev) => ({ ...prev, valueQuoteCurrency, valueLocalCurrency }));
    }
  }, [formData.inputValue, formData.spotRate, formData.valueType, setFormData]);

  // Booking amount
  useEffect(() => {
    const { actualValueBaseCurrency, totalRate } = formData;
    if (actualValueBaseCurrency && totalRate) {
      const inputValue = actualValueBaseCurrency * totalRate;
      setFormData((prev) => ({ ...prev, inputValue }));
    }
  }, [formData.actualValueBaseCurrency, formData.totalRate, setFormData]);

  return (
    <SectionCard title="Financial Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Currency Pair */}
        <CustomSelect
          label="Currency Pair"
          options={mockCurrencyPairs}
          selectedValue={formData.currencyPair}
          onChange={(val) => setFormData((prev) => ({ ...prev, currencyPair: val }))}
          isDisabled={isLoading}
          isClearable={false}
          placeholder="Choose..."
        />

        {/* Value Type */}
        <CustomSelect
          label="Value Type"
          options={valueTypeOptions}
          selectedValue={formData.valueType}
          onChange={(val) => setFormData((prev) => ({ ...prev, valueType: val }))}
          isDisabled={isLoading}
          isClearable={false}
          isRequired
          placeholder="Choose..."
        />

        {/* Multiplier Applied - stays in grid but empty when no valueType */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Multiplier Applied</label>
          <input
            type="text"
            value={
              formData.valueType
                ? `×${getValueTypeMultiplier(formData.valueType).toLocaleString()}`
                : "—"
            }
            className="h-[37px] border p-2 bg-blue-50 text-blue-800 rounded border-border"
            disabled
          />
        </div>

        {/* Base Currency */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Base Currency</label>
          <input
            type="text"
            value={formData.baseCurrency || ""}
            disabled
            className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
          />
        </div>

        {/* Quote Currency */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">Quote Currency</label>
          <input
            type="text"
            value={formData.quoteCurrency || ""}
            disabled
            className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
          />
        </div>

        {/* Dynamic fields */}
        {[
          { key: "actualValueBaseCurrency", label: "Actual Value", disabled: false, isMultiplied: true },
          { key: "spotRate", label: "Spot Rate", disabled: false, isMultiplied: false },
          { key: "forwardPoints", label: "Forward Points", disabled: false, isMultiplied: false },
          { key: "bankMargin", label: "Bank Margin", disabled: false, isMultiplied: false },
          { key: "totalRate", label: "Total Rate", disabled: true, isMultiplied: false }, // ✅ removed mt-5
          { key: "valueQuoteCurrency", label: "Value (Quote Currency)", disabled: false, isMultiplied: true },
          { key: "interveningRateQuoteToLocal", label: "Intervening Rate (Quote to Local)", disabled: false, isMultiplied: false },
          { key: "inputValue", label: "Booking Amount", disabled: false, isMultiplied: true },
          { key: "valueLocalCurrency", label: "Value (Local Currency)", disabled: true, isMultiplied: true },
        ].map((field, idx) => (
          <div key={idx} className="flex flex-col w-full">
            <label className="text-sm text-secondary-text mb-1 flex items-center justify-between">
              <span>{field.label}</span>
              {field.isMultiplied && formData.valueType && (
                <span className="text-blue-600 text-xs ml-2 whitespace-nowrap">
                  ×{getValueTypeMultiplier(formData.valueType).toLocaleString()}
                </span>
              )}
            </label>
            <input
              type="number"
              className={`h-[37px] border p-2 rounded border-border w-full ${
                field.disabled
                  ? "bg-secondary-color-lt text-secondary-text-dark"
                  : "text-secondary-text-dark"
              }`}
              value={formData[field.key as keyof FinancialDetailsResponse] ?? ""}
              onChange={(e) =>
                !field.disabled &&
                setFormData((prev) => ({
                  ...prev,
                  [field.key]: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              required
              disabled={isLoading || field.disabled}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default FinancialDetails;
