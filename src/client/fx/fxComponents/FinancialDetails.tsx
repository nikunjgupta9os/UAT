import React, { useEffect, useMemo } from "react";
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
  inputValue: number | null; // Added inputValue for booking amount
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
  orderType?: string; // Changed to string type
}

const valueTypeOptions: OptionType[] = [
  { value: "Actual", label: "Actual" },
  { value: "Millions", label: "Millions" },
  { value: "Thousands", label: "Thousands" },
];

// Mock currency pairs
const mockCurrencyPairs: OptionType[] = [
  { value: "USDINR", label: "USD/INR" },
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
];

const FinancialDetails: React.FC<FinancialDetailsProps> = ({
  formData,
  setFormData,
  // currencyPairs = mockCurrencyPairs,
  isLoading,
  orderType,
}) => {
  // Function to get multiplier based on value type
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

  // Extract base and quote currency from currency pair
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

  // Auto-calculate Total Rate based on order type
  useEffect(() => {
    const { spotRate, forwardPoints, bankMargin } = formData;
    
    // Only calculate if we have all required values and orderType is provided
    if (orderType && spotRate !== null && forwardPoints !== null && bankMargin !== null) {
      let totalRate: number;
      
      if (orderType.toLowerCase() === "buy") {
        // Buy: Spot Rate + Forward Points + Bank Margin
        totalRate = spotRate + forwardPoints + bankMargin;
      } else if (orderType.toLowerCase() === "sell") {
        // Sell: Spot Rate + Forward Points - Bank Margin
        totalRate = spotRate + forwardPoints - bankMargin;
      } else {
        // Default case - no calculation
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        totalRate: totalRate,
      }));
    }
  }, [formData.spotRate, formData.forwardPoints, formData.bankMargin, orderType, setFormData]);

  // Auto-calculate Value (Local Currency)
  useEffect(() => {
    const { inputValue, valueQuoteCurrency } = formData;
    
    // Only calculate if both values are provided and not null
    if (inputValue !== null && valueQuoteCurrency !== null && inputValue !== 0 && valueQuoteCurrency !== 0) {
      const valueLocalCurrency = inputValue * valueQuoteCurrency;
      
      setFormData((prev) => ({
        ...prev,
        valueLocalCurrency: valueLocalCurrency,
      }));
    }
  }, [formData.inputValue, formData.valueQuoteCurrency, setFormData]);

  return (
    <SectionCard title="Financial Details">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Currency Pair */}
        <CustomSelect
          label="Currency Pair"
          options={mockCurrencyPairs}
          selectedValue={formData.currencyPair}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, currencyPair: val }))
          }
          isDisabled={isLoading}
          isClearable={false}
          placeholder="Choose..."
        />

        {/* Value Type */}
        <CustomSelect
          label="Value Type"
          options={valueTypeOptions}
          selectedValue={formData.valueType}
          onChange={(val) =>
            setFormData((prev) => ({ ...prev, valueType: val }))
          }
          isDisabled={isLoading}
          isClearable={false}
          isRequired={true}
          placeholder="Choose..."
        />

        {/* Value Type Multiplier Info */}
        {formData.valueType && (
          <div className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">
              Multiplier Applied
            </label>
            <input
              type="text"
              value={`×${getValueTypeMultiplier(formData.valueType).toLocaleString()}`}
              className="h-[37px] border p-2 bg-blue-50 text-blue-800 rounded border-border"
              disabled
              placeholder="Multiplier"
            />
          </div>
        )}

        {/* Base Currency (disabled) */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Base Currency (Auto-calculated)
          </label>
          <input
            type="text"
            value={formData.baseCurrency || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                baseCurrency: e.target.value,
              }))
            }
            className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
            disabled
            placeholder="Auto-filled"
          />
        </div>

        {/* Quote Currency (disabled) */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Quote Currency (Auto-calculated)
          </label>
          <input
            type="text"
            value={formData.quoteCurrency || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                quoteCurrency: e.target.value,
              }))
            }
            className="h-[37px] border p-2 bg-secondary-color-lt text-secondary-text-dark rounded border-border"
            disabled
            placeholder="Auto-filled"
          />
        </div>

        {/* Other fields */}
        {[
          {
            key: "actualValueBaseCurrency",
            label: "Actual Value (Base Currency)",
            disabled: false,
            isMultiplied: true,
          },
          { key: "spotRate", label: "Spot Rate", disabled: false, isMultiplied: false },
          { key: "forwardPoints", label: "Forward Points", disabled: false, isMultiplied: false },
          { key: "bankMargin", label: "Bank Margin", disabled: false, isMultiplied: false },
          { key: "totalRate", label: "Total Rate", disabled: true, isMultiplied: false }, // Auto-calculated
          { key: "valueQuoteCurrency", label: "Value (Quote Currency)", disabled: false, isMultiplied: true },
          {
            key: "interveningRateQuoteToLocal",
            label: "Intervening Rate (Quote to Local)",
            disabled: false,
            isMultiplied: false,
          },
          {
            key: "inputValue",
            label: "Booking Amount",
            disabled: false,
            isMultiplied: true,
          },
          {
            key: "valueLocalCurrency",
            label: "Value (Local Currency)",
            disabled: true, // Auto-calculated
            isMultiplied: true,
          },
        ].map((field, idx) => (
          <div key={idx} className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">
              {field.label}
              {field.disabled && " (Auto-calculated)"}
              {field.isMultiplied && formData.valueType && (
                <span className="text-blue-600 text-xs ml-1">
                  (×{getValueTypeMultiplier(formData.valueType).toLocaleString()})
                </span>
              )}
            </label>
            <input
              type="number"
              className={`h-[37px] border p-2 rounded border-border ${
                field.disabled 
                  ? "bg-secondary-color-lt text-secondary-text-dark" 
                  : "text-secondary-text-dark"
              }`}
              value={formData[field.key as keyof FinancialDetailsResponse] ?? ""}
              onChange={(e) =>
                !field.disabled &&
                setFormData((prev) => ({
                  ...prev,
                  [field.key]:
                    e.target.value === "" ? null : Number(e.target.value),
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
