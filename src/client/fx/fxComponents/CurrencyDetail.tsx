import React, { useState, useEffect } from "react";
import SectionCard from "./SectionCard";
import CustomSelect from "../../common/SearchSelect"; // Adjust path if needed

// Define option type for dropdowns
type OptionType = {
  value: string;
  label: string;
};

// Currency pair option list
const currencyPairOptions: OptionType[] = [
  { value: "USD/INR", label: "USD/INR" },
  { value: "EUR/USD", label: "EUR/USD" },
  { value: "EUR/INR", label: "EUR/INR" },
];

// Define the CurrencyDetails type structure
type CurrencyDetailsType = {
  currencyPair: string;
  baseCurrency: string;
  quoteCurrency: string;
};

const CurrencyDetails: React.FC = () => {
  // State for currency pair
  const [currencyPair, setCurrencyPair] = useState<string>("");

  // State for base and quote currency, derived from currencyPair
  const [baseCurrency, setBaseCurrency] = useState<string>("");
  const [quoteCurrency, setQuoteCurrency] = useState<string>("");

  // Whenever currencyPair changes, update base and quote currencies
  useEffect(() => {
    if (currencyPair) {
      const [base, quote] = currencyPair.split("/");
      setBaseCurrency(base || "");
      setQuoteCurrency(quote || "");
    } else {
      setBaseCurrency("");
      setQuoteCurrency("");
    }
  }, [currencyPair]);

  return (
    <SectionCard title="Currency Details">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Currency Pair Dropdown */}
        <CustomSelect
          label="Currency Pair"
          options={currencyPairOptions}
          selectedValue={currencyPair}
          onChange={setCurrencyPair}
          placeholder="Select Currency Pair"
          isClearable={false}
        />

        {/* Base Currency (disabled select showing first part of pair) */}
        <CustomSelect
          label="Base Currency"
          options={baseCurrency ? [{ value: baseCurrency, label: baseCurrency }] : []}
          selectedValue={baseCurrency}
          onChange={() => {}}
          isDisabled={true}
          isClearable={false}
          isSearchable={false}
          placeholder=""
        />

        {/* Quote Currency (disabled select showing second part of pair) */}
        <CustomSelect
          label="Quote Currency"
          options={quoteCurrency ? [{ value: quoteCurrency, label: quoteCurrency }] : []}
          selectedValue={quoteCurrency}
          onChange={() => {}}
          isDisabled={true}
          isClearable={false}
          isSearchable={false}
          placeholder=""
        />
      </div>
    </SectionCard>
  );
};

export default CurrencyDetails;
