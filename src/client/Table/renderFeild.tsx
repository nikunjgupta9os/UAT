import React, { useEffect, useState } from "react";

type RenderFieldProps<T> = {
  field: keyof T;
  value: T[keyof T] | null | undefined;
  originalValue?: T[keyof T];
  editableFields: (keyof T)[];
  isEditing: boolean;
  onChange?: (field: keyof T, value: T[keyof T]) => void;
  fieldLabel?: string;
};

function RenderField<T>({
  field,
  value,
  originalValue,
  editableFields,
  isEditing,
  onChange,
  fieldLabel,
}: RenderFieldProps<T>) {
  const isEditable = editableFields.includes(field);

  return (
    <div className="flex flex-col space-y-1" key={String(field)}>
      <label className="font-bold text-secondary-text capitalize">
        {fieldLabel || String(field).replace(/([A-Z])/g, " $1").trim()}
      </label>

      {isEditing && isEditable ? (
        <>
          <input
            className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
            value={String(value ?? "")}
            type={
              typeof originalValue === "number"
                ? "number"
                : String(field).toLowerCase().includes("date")
                ? "date"
                : "text"
            }
            step={typeof originalValue === "number" ? "0.0001" : undefined}
            onChange={(e) => {
              let newValue: T[keyof T];

              if (typeof originalValue === "number") {
                newValue = (parseFloat(e.target.value) || 0) as T[keyof T];
              } else {
                newValue = e.target.value as T[keyof T];
              }

              onChange?.(field, newValue);
            }}
          />
          {originalValue !== undefined && (
            <span className="text-xs text-gray-500">
              Old: {String(originalValue ?? "—")}
            </span>
          )}
        </>
      ) : (
        <span className="font-medium text-primary-lt">
          {String(field) === "transactionTimestamp"
            ? new Date(value as string | number | Date).toLocaleString()
            : typeof value === "number"
            ? String(field) === "totalRate"
              ? Number(value).toFixed(4)
              : value.toLocaleString()
            : String(value ?? "—")}
        </span>
      )}
    </div>
  );
}

export default RenderField;