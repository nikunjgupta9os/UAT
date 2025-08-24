import React from "react";
import Select from "react-select";

type OptionType = {
  value: string;
  label: string;
};

interface CustomSelectPropsBase {
  label: string;
  options: OptionType[];
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isRequired?: boolean;
  isSearchable?: boolean;
  menuPlacement?: "auto" | "top" | "bottom";
}

interface CustomSelectSingleProps extends CustomSelectPropsBase {
  isMulti?: false;
  selectedValue?: string;
  onChange: (value: string) => void;
}

interface CustomSelectMultiProps extends CustomSelectPropsBase {
  isMulti: true;
  selectedValue?: string[];
  onChange: (value: string[]) => void;
}

type CustomSelectProps = CustomSelectSingleProps | CustomSelectMultiProps;

const CustomSelect: React.FC<CustomSelectProps> = (props) => {
  const {
    label,
    options,
    placeholder = "Select...",
    isDisabled = false,
    isClearable = true,
    isSearchable = true,
    isRequired = false,
    menuPlacement = "auto",
  } = props;

  // isMulti, selectedValue, onChange are discriminated
  const isMulti = (props as CustomSelectMultiProps).isMulti === true;

  let selectedOption: OptionType | OptionType[] | null = null;
  if (isMulti) {
    const selectedValue = (props as CustomSelectMultiProps).selectedValue;
    selectedOption = Array.isArray(selectedValue)
      ? options.filter((opt) => selectedValue.includes(opt.value))
      : [];
  } else {
    const selectedValue = (props as CustomSelectSingleProps).selectedValue;
    selectedOption =
      typeof selectedValue === "string"
        ? options.find((opt) => opt.value === selectedValue) || null
        : null;
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-secondary-text mb-1">
        {label}
      </label>
      <Select
        className="w-full text-sm rounded z-39 hover:z-auto h-[36px] hover:border-black"
        classNamePrefix="react-select"
        options={options}
        value={selectedOption}
        isMulti={isMulti}
        onChange={(selectedOption) => {
          if (isMulti) {
            const handler = (props as CustomSelectMultiProps).onChange;
            if (Array.isArray(selectedOption)) {
              handler(selectedOption.map((opt) => opt.value));
            } else {
              handler([]);
            }
          } else {
            const handler = (props as CustomSelectSingleProps).onChange;
            handler((selectedOption as OptionType)?.value || "");
          }
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        required={isRequired}
        // menuPlacement={menuPlacement}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({
            ...base,
            zIndex: 99999, // make sure it's on top
          }),
          menu: (base) => ({
            ...base,
            zIndex: 99999,
          }),
        }}
      />
    </div>
  );
};

export default CustomSelect;
