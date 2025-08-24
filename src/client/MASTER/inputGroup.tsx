import React from "react";

interface InputGroupProps {
  label: string;
  name: string;
  register: any;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  errors?: Record<string, any>;
  pattern?: any;
}

const InputGroup: React.FC<InputGroupProps> = ({
  label,
  name,
  register,
  required = false,
  type = "text",
  placeholder,
  maxLength,
  errors,
  pattern,
}) => (
  <div>
    <label className="text-secondary-text">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </label>
    <input
      type={type}
      maxLength={maxLength}
      {...register(name, {
        required: required ? `${label} is required` : false,
        maxLength: maxLength
          ? { value: maxLength, message: `Max ${maxLength} characters` }
          : undefined,
        pattern: pattern,
      })}
      className="w-full p-2 border border-border bg-secondary-color-lt text-secondary-text outline-none rounded"
      placeholder={placeholder || `Enter ${label.toLowerCase()}`}
    />
    {errors?.[name] && (
      <p className="text-red-500 text-sm mt-1">{errors[name]?.message}</p>
    )}
  </div>
);

export default InputGroup;