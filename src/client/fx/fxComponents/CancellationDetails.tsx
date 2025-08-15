import React from "react";
import SectionCard from "./SectionCard";
import CustomSelect from "../../common/SearchSelect";

const reasonOptions = [
  { value: "Early Settlement", label: "Early Settlement" },
  { value: "Exposure Change", label: "Exposure Change" },
  { value: "Market Movement", label: "Market Movement" },
  { value: "Stategic Rollover", label: "Stategic Rollover" },
  { value: "Other", label: "Other" },
];

const InputField = ({ label, value, onChange, step = "any", required = false }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-secondary-text mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      step={step}
      required={required}
      className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
    />
  </div>
);

type FormType = {
  currentSpotRate: string;
  currentForwardRate: string;
  bankCharges: string;
  discountRate: string;
  reason: string;
};

type CancellationDetailsProps = {
  form?: FormType;
  setForm?: React.Dispatch<React.SetStateAction<FormType>>;
};

const CancellationDetailsOldForwards: React.FC<CancellationDetailsProps> = ({ form, setForm }) => {
  // Provide default values if form is undefined
  const safeForm = form ?? {
    currentSpotRate: "",
    currentForwardRate: "",
    bankCharges: "",
    discountRate: "",
    reason: "",
  };

  const handleChange = (field: string) => (value: string) => {
    setForm?.((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SectionCard title="Cancellation Details (for Old Forwards)">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InputField
          label="Current Spot Rate (for Old Forwards)"
          value={safeForm.currentSpotRate}
          onChange={handleChange("currentSpotRate")}
          step="0.0001"
          required
        />
        <InputField
          label="Current Forward Rate (for Old Forwards ED Calc)"
          value={safeForm.currentForwardRate}
          onChange={handleChange("currentForwardRate")}
          step="0.0001"
          required
        />
        <InputField
          label="Bank Charges (Total, for Old Forwards)"
          value={safeForm.bankCharges}
          onChange={handleChange("bankCharges")}
          step="0.01"
        />
        <InputField
          label="Discount Rate (for ED NPV)"
          value={safeForm.discountRate}
          onChange={handleChange("discountRate")}
          step="0.01"
          required
        />
        <div className="flex flex-col z-30">
          <CustomSelect
            label="Reason for Action *"
            options={reasonOptions}
            selectedValue={safeForm.reason}
            onChange={handleChange("reason")}
            placeholder="Select reason"
            isClearable={true}
          />
        </div>
      </div>
    </SectionCard>
  );
};

export default CancellationDetailsOldForwards;
