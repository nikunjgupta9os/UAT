import React, { useState } from "react";
import SectionCard from "./SectionCard";
import CustomSelect from "../../../common/SearchSelect";

const DateInput = ({ isDisabled, label, value, onChange }) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
      />
    </div>
  );
};

const InputField = ({ label, value, onChange, isDisabled = false }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isDisabled}
      className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
    />
  </div>
);

const ChargesGainLoss: React.FC = () => {
  const [form, setForm] = useState({
    edCharges: "",
    localRate: "",
    irr: "",
    netGainLoss: "",
    presentValue: "",
    settlementDate: "",
    internalDealer: "",
    counterpartyDealer: "",
    internalRefId: "",
    plConversionRate: "",
    convertedPL: "",
    cancelUtilise: "",
  });

  const internalDealerOptions = [
    { value: "Dealer 1", label: "Dealer 1" },
    { value: "Dealer 2", label: "Dealer 2" },
  ];

  const cancelUtiliseOptions = [
    { value: "Cancel", label: "Cancel" },
    { value: "Utilise", label: "Utilise" },
  ];

  const handleChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SectionCard title="Charges & Gain/Loss">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputField label="ED Charges" value={form.edCharges} onChange={handleChange("edCharges")} />
        <InputField label="Local Rate" value={form.localRate} onChange={handleChange("localRate")} />
        <InputField label="Internal Return Rate" value={form.irr} onChange={handleChange("irr")} />
        <InputField label="Net Gain/Loss" value={form.netGainLoss} onChange={handleChange("netGainLoss")} isDisabled={true} />
        <InputField label="Present Value" value={form.presentValue} onChange={handleChange("presentValue")} isDisabled={true} />
        <DateInput label="Settlement Date" value={form.settlementDate} onChange={handleChange("settlementDate")} isDisabled={false} />
        <CustomSelect
          label="Internal Dealer"
          selectedValue={form.internalDealer}
          options={internalDealerOptions}
          onChange={handleChange("internalDealer")}
        />
        <InputField label="Counterparty Dealer" value={form.counterpartyDealer} onChange={handleChange("counterpartyDealer")} />
        <InputField label="Internal Ref ID" value={form.internalRefId} onChange={handleChange("internalRefId")} />
        <InputField label="PL Conversion Rate" value={form.plConversionRate} onChange={handleChange("plConversionRate")} />
        <InputField label="Converted Profit/Loss" value={form.convertedPL} onChange={handleChange("convertedPL")} isDisabled={true} />
        <CustomSelect
          label="Cancel/Utilise"
          selectedValue={form.cancelUtilise}
          options={cancelUtiliseOptions}
          onChange={handleChange("cancelUtilise")}
        />
      </div>
    </SectionCard>
  );
};

export default ChargesGainLoss;
