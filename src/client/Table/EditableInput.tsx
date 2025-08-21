import React from "react";

type EditableInputProps = {
  value: any;
  originalValue: any;
  onChange: (newValue: any) => void;
  type?: string;
  step?: string;
};

const EditableInput: React.FC<EditableInputProps> = ({
  value,
  originalValue,
  onChange,
  type,
  step,
}) => {
  return (
    <div className="w-full">
      <input
        className="w-full border rounded px-2 py-1 text-sm bg-white shadow-sm h-8"
        value={String(value ?? "")}
        type={type}
        step={step}
        onChange={(e) => {
          const newValue =
            type === "number"
              ? parseFloat(e.target.value) || 0
              : e.target.value;
          onChange(newValue);
        }}
      />
      <span className="text-xs text-gray-500 block mt-0.5">
        Old: {String(originalValue ?? "—")}
      </span>
    </div>
  );
};

export default EditableInput;