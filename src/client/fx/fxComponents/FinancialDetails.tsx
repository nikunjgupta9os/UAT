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
}) => {
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

        {/* Base Currency (disabled) */}
        <div className="flex flex-col">
          <label className="text-sm text-secondary-text mb-1">
            Base Currency
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
            Quote Currency
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
          },
          { key: "spotRate", label: "Spot Rate" },
          { key: "forwardPoints", label: "Forward Points" },
          { key: "bankMargin", label: "Bank Margin" },
          { key: "totalRate", label: "Total Rate" },
          { key: "valueQuoteCurrency", label: "Value (Quote Currency)" },
          {
            key: "interveningRateQuoteToLocal",
            label: "Intervening Rate (Quote to Local)",
          },
          {
            key: "inputValue",
            label: "Booking Amount",
          },
          {
            key: "valueLocalCurrency",
            label: "Value (Local Currency)",
          },
        ].map((field, idx) => (
          <div key={idx} className="flex flex-col">
            <label className="text-sm text-secondary-text mb-1">
              {field.label}
            </label>
            <input
              type="number"
              className="h-[37px] border p-2 text-secondary-text-dark rounded border-border"
              value={formData[field.key as keyof FinancialDetailsResponse] ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [field.key]:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              required
              disabled={isLoading}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

export default FinancialDetails;
