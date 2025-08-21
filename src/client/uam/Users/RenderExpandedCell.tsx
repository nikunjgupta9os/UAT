import React, { useState, useEffect } from "react";
import Button from "../../ui/Button";
import axios from "axios";
import { useNotification } from "../../Notification/Notification";

type ExpandedRowProps = {
  row: any;
  columnVisibility: Record<string, boolean>;
  editStates: Record<string, Partial<UserType>>;
  setEditStates: React.Dispatch<
    React.SetStateAction<Record<string, Partial<UserType>>>
  >;
  editingRows: Set<string>;
  setEditingRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  fieldLabels: Record<string, string>;
  visibleColumnCount: number;
  editableKeys?: string[];
  detailsFields: string[];
  approvalFields: string[];
  showDetailsSection?: boolean;
  showApprovalSection?: boolean;
  canEdit?: boolean; // Add this new prop
};

const ExpandedRow: React.FC<ExpandedRowProps> = ({
  row,
  editStates,
  setEditStates,
  editingRows,
  canEdit,
  setEditingRows,
  fieldLabels,
  visibleColumnCount,
  editableKeys = [],
  detailsFields,
  approvalFields,
  showDetailsSection = true,
  showApprovalSection = true,
}) => {
  const rowId = row.id;
  const isEditing = editingRows.has(rowId);
  const editValues = editStates[rowId] || {};

  // Permission state

  // const roleName = localStorage.getItem("userRole");

  // console.log("Role Name:", roleName);

  const { notify } = useNotification();

  // Filter visible keys
  const visibleDetailsKeys = detailsFields.filter(
    (key) => key !== "select" && key !== "actions"
  );

  const visibleApprovalKeys = approvalFields.filter(
    (key) => key !== "select" && key !== "actions"
  );

  const handleChange = (key: keyof UserType, value: string | boolean) => {
    setEditStates((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [key]: value,
      },
    }));
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      const updatedFields = {
        ...row.original,
        ...editStates[rowId],
        status: "Awaiting-Approval",
      };

      console.log("Sending update payload:", updatedFields);

      try {
        const response = await fetch(
          `https://backend-slqi.onrender.com/api/users/${row.original.id}/update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedFields),
          }
        );

        const text = await response.text();
        console.log("Raw response:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          notify("Update failed: Invalid JSON from server", "error");
          return;
        }

        if (data.success) {
          notify("User updated successfully!", "success");
          setEditStates((prev) => {
            const updated = { ...prev };
            delete updated[rowId];
            return updated;
          });
          setEditingRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(rowId);
            return newSet;
          });
        } else {
          notify(
            "Update failed: " + (data.message || "Unknown error"),
            "error"
          );
        }
      } catch (err) {
        notify("Update error: " + (err as Error).message, "error");
      }
    } else {
      // Entering edit mode
      setEditStates((prev) => ({
        ...prev,
        [rowId]: { ...row.original },
      }));
      setEditingRows((prev) => new Set(prev).add(rowId));
    }
  };

  const renderField = (key: string) => {
    const typedKey = key as keyof UserType;
    const label = fieldLabels[key] ?? key;
    const isEditable = editableKeys.includes(key);
    let value =
      key === "role.name"
        ? row.original.role?.name ?? "—"
        : isEditing
        ? editValues[typedKey]
        : row.original[typedKey];

    // Format date
    if (!isEditing && typedKey === "createdDate") {
      const date = new Date(value as string);
      value = isNaN(date.getTime()) ? value : date.toLocaleDateString();
    }

    // Format boolean
    if (!isEditing && typeof value === "boolean") {
      value = value ? "Yes" : "No";
    }

    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="text-sm font-semibold text-secondary-text">{label}</label>
        {isEditing && isEditable ? (
          typeof row.original[typedKey] === "boolean" ? (
            <div>
              <select
                className="border rounded px-2 py-1 text-sm bg-secondary-color-lt border-border shadow-sm text-secondary-text"
                value={(editValues[typedKey] ? "true" : "false") as string}
                onChange={(e) =>
                  handleChange(typedKey, e.target.value === "true")
                }
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          ) : (
            <input
              className="border rounded px-2 py-1 text-sm bg-secondary-color-lt border-border shadow-sm text-secondary-text"
              value={(value as string) || ""}
              onChange={(e) => handleChange(typedKey, e.target.value)}
            />
          )
        ) : (
          <span className="text-sm font-medium text-primary-lt">{value ?? "—"}</span>
        )}
      </div>
    );
  };

  return (
    <tr key={`${rowId}-expanded`}>
      <td colSpan={visibleColumnCount} className="px-6 py-4 bg-primary-md">
        <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-secondary-text">
              Additional Information
            </h4>
            {/* Show edit button only if both edit prop and Visibility.edit are true */}
            {canEdit && (
              <div>
                <Button
                  onClick={handleEditToggle}
                  color={isEditing ? "Green" : "Fade"}
                >
                  {isEditing ? "Save" : "Edit"}
                </Button>
              </div>
            )}
          </div>

          {/* Details Section */}
          {showDetailsSection && visibleDetailsKeys.length > 0 && (
            <div className="mb-6">
              <h5 className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
                Details
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {visibleDetailsKeys.map(renderField)}
              </div>
            </div>
          )}

          {/* Approval Information Section */}
          {showApprovalSection && visibleApprovalKeys.length > 0 && (
            <div>
              <h5 className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
                Approval Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {visibleApprovalKeys.map(renderField)}
              </div>
            </div>
          )}

          {/* Show message if no fields are hidden */}
          {visibleDetailsKeys.length === 0 && (
            <div className="text-center text-primary py-4">
              No additional information to display
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default ExpandedRow;
