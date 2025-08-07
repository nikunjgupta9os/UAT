
import React from "react";
import Select from "react-select";

type OptionType = {
  value: string;
  label: string;
};

interface CustomSelectProps {
  label: string;
  options: OptionType[];
  selectedValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isRequired?: boolean;
  isSearchable?: boolean;
  menuPlacement?: "auto" | "top" | "bottom";
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = "Select...",
  isDisabled = false,
  isClearable = true,
  isSearchable = true,
  isRequired = false,
  menuPlacement = "auto",
}) => {
  // Find the selected option or return null if not found (which will show placeholder)
  const selectedOption = selectedValue ? options.find((opt) => opt.value === selectedValue) : null;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-secondary-text mb-1">
        {label}
      </label>
      <Select
        className="w-full text-sm rounded z-39"
        classNamePrefix="react-select"
        options={options}
        value={selectedOption}
        onChange={(selectedOption) =>
          onChange(selectedOption?.value || "")
        }
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        required={isRequired}
        menuPlacement={menuPlacement}
      />
    </div>
  );
};

export default CustomSelect;
