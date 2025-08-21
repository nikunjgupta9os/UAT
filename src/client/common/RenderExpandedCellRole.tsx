import React from "react";
import Button from "../ui/Button";
import axios from "axios";
import type { Row } from "@tanstack/react-table";
import { useNotification } from "../Notification/Notification"; // Add this import

type ExpandedRowProps = {
  row: Row<Role>;
  columnVisibility: Record<string, boolean>;
  editStates: Record<string, Record<string, any>>;
  setEditStates: React.Dispatch<
    React.SetStateAction<Record<string, Record<string, any>>>
  >;
  editingRows: Set<string>;
  setEditingRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  fieldLabels: Record<string, string>;
  visibleColumnCount: number;
  editableKeys?: string[];
  timeFields?: string[];
  detailsFields: string[];
  approvalFields: string[];
  showDetailsSection?: boolean;
  showApprovalSection?: boolean;
  canEdit?: boolean;
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
  timeFields = [],
  detailsFields,
  approvalFields,
  showDetailsSection = true,
  showApprovalSection = true,
}) => {
  const rowId = row.id;
  const { notify } = useNotification(); // Add this hook

  const isEditing = editingRows.has(rowId);
  const editValues = editStates[rowId] || {};

  const visibleDetailsKeys = detailsFields.filter(
    (key) => key !== "select" && key !== "actions"
  );

  const visibleApprovalKeys = approvalFields.filter(
    (key) => key !== "select" && key !== "actions"
  );

  const handleChange = (key: string, value: string | boolean | number) => {
    console.log(`Changing ${key} to:`, value);
    setEditStates((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [key]: value,
      },
    }));
  };

  // Helper function to format time for display
  const formatTimeForDisplay = (timeValue: any): string => {
    if (!timeValue) return "—";

    // If it's already in HH:MM format, return as is
    if (typeof timeValue === "string" && timeValue.match(/^\d{2}:\d{2}$/)) {
      return timeValue;
    }

    // If it's a full datetime string, extract time
    if (typeof timeValue === "string") {
      try {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (e) {
        // If parsing fails, return original value
        return timeValue;
      }
    }

    return String(timeValue);
  };

  // Helper function to format time for input
  const formatTimeForInput = (timeValue: any): string => {
    if (!timeValue) return "";

    // If it's already in HH:MM format, return as is
    if (typeof timeValue === "string" && timeValue.match(/^\d{2}:\d{2}$/)) {
      return timeValue;
    }

    // If it's a full datetime string, extract time
    if (typeof timeValue === "string") {
      try {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (e) {
        return "";
      }
    }

    return "";
  };

  const getChangedFields = (
    original: Role,
    edited: Record<string, any>
  ): Record<string, any> => {
    const changes: Record<string, any> = {};

    console.log("Original data:", original);
    console.log("Edited data:", edited);

    for (const key in edited) {
      const originalValue = (original as any)[key];
      const editedValue = edited[key];

      console.log(
        `Comparing ${key}: original="${originalValue}" vs edited="${editedValue}"`
      );

      if (editedValue !== originalValue) {
        changes[key] = editedValue;
        console.log(
          `Field ${key} changed from "${originalValue}" to "${editedValue}"`
        );
      }
    }

    console.log("Final changes:", changes);
    return changes;
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      console.log("isEditing:", isEditing);
      const changedFields = getChangedFields(row.original, editValues);
      console.log("Changed fields:", changedFields);

      if (Object.keys(changedFields).length === 0) {
        // No changes made
        setEditingRows((prev) => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
        return;
      }

      try {
        const res = await axios.post(
          `https://backend-slqi.onrender.com/api/roles/${row.original.id}/update`,
          changedFields
        );
        if (res.data.success) {
          notify("Role updated successfully!", "success"); // Now this will work
          console.log("Updated successfully:", res.data.role);

          // Replace original with updated role
          row.original = res.data.role;

          // Exit editing mode
          setEditingRows((prev) => {
            const newSet = new Set(prev);
            newSet.delete(rowId);
            return newSet;
          });
        } else {
          notify("Update failed: " + res.data.message, "error"); // Add error notification
          console.error("Update failed:", res.data.message);
        }
      } catch (error) {
        notify("Error updating role. Please try again.", "error"); // Add error notification
        console.error("Error updating role:", error);
      }
    } else {
      setEditStates((prev) => ({
        ...prev,
        [rowId]: { ...row.original },
      }));
      setEditingRows((prev) => new Set(prev).add(rowId));
    }
  };

  const renderField = (key: string) => {
    const label = fieldLabels[key] ?? key;
    const isEditable = editableKeys.includes(key);
    const isTimeField = timeFields.includes(key);

    let value = isEditing ? editValues[key] : (row.original as any)[key];

    // Format time fields for display
    if (!isEditing && isTimeField) {
      value = formatTimeForDisplay(value);
    }

    // Format boolean
    if (!isEditing && typeof value === "boolean") {
      value = value ? "Yes" : "No";
    }

    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="text-sm font-semibold text-secondary-text">
          {label}
        </label>
        {isEditing && isEditable ? (
          isTimeField ? (
            // Render time input for time fields
            <input
              type="time"
              className="border rounded px-2 py-1 text-sm bg-secondary-color-lt border-border shadow-sm text-secondary-text"
              value={formatTimeForInput(editValues[key]) || ""}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          ) : typeof (row.original as any)[key] === "boolean" ? (
            // Render select for boolean fields
            <select
              className="border rounded px-2 py-1 text-sm bg-secondary-color-lt border-border shadow-sm text-secondary-text"
              value={editValues[key] ? "true" : "false"}
              onChange={(e) => handleChange(key, e.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : (
            // Render regular text input for other fields
            <input
              className="border rounded px-2 py-1 text-sm bg-secondary-color-lt border-border shadow-sm text-secondary-text"
              value={(value as string) || ""}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          )
        ) : (
          <span className="text-sm font-medium text-primary-lt">
            {value ?? "—"}
          </span>
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
