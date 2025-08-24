import React from "react";

interface DropdownGroupProps {
  label: string;
  name: string;
  options: string[];
  register: any;
  required?: boolean;
  errors?: Record<string, any>;
  watch?: any;
}

const DropdownGroup: React.FC<DropdownGroupProps> = ({
  label,
  name,
  options,
  register,
  required = false,
  errors,
  watch,
}) => (
  <div>
    <label className="text-secondary-text">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <select
      {...register(name, {
        required: required ? `${label} is required` : false,
      })}
      className="w-full p-2 border border-border bg-secondary-color-lt text-secondary-text outline-none rounded"
    >
      <option value="" disabled hidden>
        Select {label}
      </option>
      {options.map((opt: string, idx: number) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {errors?.[name] && (
      <p className="text-red-500 text-sm mt-1">{errors[name]?.message}</p>
    )}
  </div>
);

export default DropdownGroup;