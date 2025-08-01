import React, { useState } from "react";
import SectionCard from "./SectionCard";

const TextInput = ({ label, value, onChange, type = "text" }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const ExposureInfo: React.FC = () => {
  const [underlyingRef, setUnderlyingRef] = useState("");
  const [amountLinked, setAmountLinked] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [exposureMaturityDate, setExposureMaturityDate] = useState("");

  return (
    <SectionCard title="Exposure Info">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TextInput
          label="Underlying Ref"
          value={underlyingRef}
          onChange={setUnderlyingRef}
        />
        <TextInput
          label="Amount Linked"
          value={amountLinked}
          onChange={setAmountLinked}
          type="number"
        />
        <TextInput
          label="Date of Transaction"
          value={transactionDate}
          onChange={setTransactionDate}
          type="date"
        />
        <TextInput
          label="Exposure Maturity Date"
          value={exposureMaturityDate}
          onChange={setExposureMaturityDate}
          type="date"
        />
      </div>
    </SectionCard>
  );
};

export default ExposureInfo;
