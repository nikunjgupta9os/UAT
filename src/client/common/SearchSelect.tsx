import React from "react";
import Select from "react-select";

type OptionType = {
  value: string;
  label: string;
};

interface CustomSelectProps {
  label: string;
  options: OptionType[];
  selectedValue?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isRequired?: boolean;
  isSearchable?: boolean;
  menuPlacement?: "auto" | "top" | "bottom";
  isMulti?: boolean;
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
  isMulti = false,
}) => {
  let selectedOption: OptionType | OptionType[] | null = null;
  if (isMulti && Array.isArray(selectedValue)) {
    selectedOption = options.filter((opt) => selectedValue.includes(opt.value));
  } else if (!isMulti && typeof selectedValue === 'string') {
    selectedOption = options.find((opt) => opt.value === selectedValue) || null;
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-secondary-text mb-1">
        {label}
      </label>
      <Select
        className="w-full text-sm rounded z-21"
        classNamePrefix="react-select"
        options={options}
        value={selectedOption}
        isMulti={isMulti}
        onChange={(selectedOption) => {
          if (isMulti) {
            if (Array.isArray(selectedOption)) {
              onChange(selectedOption.map((opt) => opt.value));
            } else {
              onChange([]);
            }
          } else {
            onChange((selectedOption as OptionType)?.value || "");
          }
        }}
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
