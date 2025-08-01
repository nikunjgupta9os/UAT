import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getExpandedRowModel,
  getSortedRowModel,
  type ColumnDef,
  type Row,
  type HeaderContext,
} from "@tanstack/react-table";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import {
  ChevronDown,
  ChevronUp,
  CircleArrowUp,
  CircleArrowDown,
} from "lucide-react";
import Button from "../../ui/Button";
import "../../styles/theme.css";
import axios from "axios";
import { useNotification } from "../../Notification/Notification.tsx";
interface WithId {
  exposure_header_id: string;
  // [key: string]: any;
}

interface ExpandedRowConfig {
  sections: {
    title: string;
    fields: string[];
  }[];
  editableFields?: string[];
  fieldLabels?: Record<string, string>;
  customRender?: (row: Row<WithId>) => React.ReactNode;
  customRenderPerField?: Record<string, (row: Row<WithId>) => React.ReactNode>; // ✅ NEW
}

const dropdownOptions: Record<string, string[]> = {
  inco: ["FOB", "CIF", "EXW", "DDP"],
};

interface TableProps<ExposureBucketing extends WithId> {
  data: ExposureBucketing[];
  filter?: ExposureBucketing[];
  columns: ColumnDef<ExposureBucketing>[];
  defaultColumnVisibility?: Record<string, boolean>;
  draggableColumns?: string[];
  sortableColumns?: string[];
  expandedRowConfig?: ExpandedRowConfig;
  onUpdate?: (
    rowId: string,
    changes: Partial<ExposureBucketing>
  ) => Promise<boolean>;
  className?: string;
  setData?: (data: ExposureBucketing[]) => void; // Optional prop to update data
}

interface ExpandedRowProps<ExposureBucketing extends WithId> {
  row: Row<ExposureBucketing>;
  config: ExpandedRowConfig;
  onUpdate?: (
    rowId: string,
    changes: Partial<ExposureBucketing>
  ) => Promise<boolean>;
  visibleColumnCount: number;
}

function ExpandedRow<ExposureBucketing extends WithId>({
  row,
  config,
  onUpdate,
  visibleColumnCount,
}: ExpandedRowProps<ExposureBucketing>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Partial<ExposureBucketing>>({});
  const [isSaving, setIsSaving] = useState(false);

  // const handleChange = (key: keyof ExposureBucketing, value) => {
  //   setEditValues((prev) => ({
  //     ...prev,
  //     [key]: value,
  //   }));
  // };
  const handleChange = (key: keyof ExposureBucketing, value) => {
    setEditValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  function getChangedFields<ExposureBucketing extends WithId>(
    original: ExposureBucketing,
    edited: Partial<ExposureBucketing>
  ): Partial<ExposureBucketing> {
    const changed: Partial<ExposureBucketing> = {};

    for (const key in edited) {
      if (edited[key] !== original[key]) {
        changed[key] = edited[key];
      }
    }

    return changed;
  }
  const { notify } = useNotification();

  const handleEditToggle = async () => {
  if (isEditing) {
    const changedFields = getChangedFields(row.original, editValues);

    // Convert numeric strings to numbers
    Object.keys(changedFields).forEach((key) => {
      const val = changedFields[key];
      if (!isNaN(val) && val !== "") {
        changedFields[key] = Number(val);
      }
    });

    setIsSaving(true);
    let success = false;

    const payload = {
      bucketingFields: {
        ...changedFields,
      },
    };

    console.log(row.original.exposure_header_id);
    console.log(JSON.stringify(payload));

    try {
      const response = await axios.post(
        `https://backend-slqi.onrender.com/api/exposureBucketing/${row.original.exposure_header_id}/update`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      success = response.status === 200 && response.data.success;
    } catch (err) {
      console.error("Update failed:", err);
      success = false;
    }

    setIsSaving(false);
    if (success) {
      setIsEditing(false);
      notify("Update successful", "success");
    }
  } else {
    setEditValues({ ...row.original });
    setIsEditing(true);
  }
};

 
  const renderField = (key: string) => {
    const label = config.fieldLabels?.[key] ?? key;
    const isEditable = config.editableFields?.includes(key) ?? false;
    const originalValue = row.original[key as keyof ExposureBucketing];
    const value = isEditing
      ? editValues[key as keyof ExposureBucketing]
      : originalValue;

    // Dynamic calculation for remaining_percentage
    if (key === "remaining_percentage") {
      // Use index signature to access fields
      const getNum = (field: string): number => {
        const v = isEditing
          ? editValues[field as keyof ExposureBucketing]
          : row.original[field as keyof ExposureBucketing];
        return v === undefined || v === null || v === "" ? 0 : Number(v);
      };
      const amount = getNum("line_item_amount");
      const advance = getNum("advance");
      const month_1 = getNum("month_1");
      const month_2 = getNum("month_2");
      const month_3 = getNum("month_3");
      const month_4_6 = getNum("month_4_6");
      const month_6plus = getNum("month_6plus");
      const totalPaid =
        advance + month_1 + month_2 + month_3 + month_4_6 + month_6plus;
      const remaining = amount - totalPaid;
      const percentage = amount ? (remaining / amount) * 100 : 0;
      let color = "text-green-600";
      if (percentage > 50) color = "text-red-600";
      else if (percentage > 20) color = "text-yellow-600";
      else if (percentage > 0) color = "text-blue-600";
      else color = "text-red-600";
      return (
        <div key={key} className="flex flex-col space-y-1">
          <label className="font-bold text-secondary-text">{label}</label>
          <span className={`text-sm font-semibold ${color}`}>
            {percentage.toFixed(2)}%
          </span>
        </div>
      );
    }

    

    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-bold text-secondary-text">{label}</label>
        {isEditing && isEditable ? (
          key === "inco" ? (
            <>
              <select
                className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
                value={String(editValues[key as keyof ExposureBucketing] ?? "")}
                onChange={(e) =>
                  handleChange(key as keyof ExposureBucketing, e.target.value)
                }
              >
                <option value="">Select</option>
                {dropdownOptions.inco.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                Old: {String(originalValue ?? "—")}
              </span>
            </>
          ) : typeof originalValue === "boolean" ? (
            <>
              <select
                className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
                value={String(editValues[key as keyof ExposureBucketing])}
                onChange={(e) =>
                  handleChange(
                    key as keyof ExposureBucketing,
                    e.target.value === "true"
                  )
                }
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <span className="text-xs text-gray-500">
                Old: {String(originalValue)}
              </span>
            </>
          ) : (
            <>
              <input
                className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
                value={String(value || "")}
                onChange={(e) =>
                  handleChange(key as keyof ExposureBucketing, e.target.value)
                }
                type={typeof originalValue === "number" ? "number" : "text"}
              />
              <span className="text-xs text-gray-500">
                Old: {String(originalValue ?? "—")}
              </span>
            </>
          )
        ) : config.customRenderPerField?.[key] ? (
          config.customRenderPerField[key](row as any) || (
            <span className="text-secondary-text">—</span>
          )
        ) : (
          <span className="font-medium text-primary-lt">
            {String(value ?? "—")}
          </span>
        )}
      </div>
    );
  };

  return (
    <tr key={`${row.id}-expanded`}>
      <td colSpan={visibleColumnCount} className="px-6 py-4 bg-primary-md">
        <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
          <div className="flex justify-end items-end mb-4">
            <button
              onClick={handleEditToggle}
              className="bg-primary text-white px-4 py-1 rounded shadow hover:bg-primary-dark disabled:opacity-60"
              disabled={isSaving}
            >
              {isEditing ? (isSaving ? "Saving..." : "Save") : "Edit"}
            </button>
          </div>
          {config.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="font-semibold mb-2 text-primary-lt">
                {section.title}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                {section.fields.map((field) => renderField(field))}
              </div>
            </div>
          ))}
          {config.sections.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No additional information to display
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// Main Table Component
// Main Table Component
function NyneOSTable<ExposureBucketing extends WithId>({
  data,
  filter,
  columns,
  defaultColumnVisibility = {},
  draggableColumns = [],
  sortableColumns = [],
  expandedRowConfig,
  onUpdate,
  className = "",
  setData,
}: TableProps<ExposureBucketing>) {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState(
    defaultColumnVisibility
  );
  const [sorting, setSorting] = useState<[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Set all rows to be expanded by default when the component mounts or data changes
  useEffect(() => {
    if (expandedRowConfig) {
      const initialExpandedState: Record<string, boolean> = {};
      (filter || data).forEach((item) => {
        initialExpandedState[item.exposure_header_id] = true;
      });
      setExpanded(initialExpandedState);
    }
  }, [data, filter, expandedRowConfig]);

  // Enhanced columns with sorting capability
  const enhancedColumns: ColumnDef<ExposureBucketing>[] = columns.map((col) => {
    const columnId = col.id;

    if (sortableColumns.includes(columnId)) {
      return {
        ...col,
        enableSorting: true,
        sortDescFirst: false,
        header: ({ column }: HeaderContext<ExposureBucketing, unknown>) => (
          <div className="flex items-center space-x-2">
            <span>
              {typeof col.header === "function"
                ? "Sort"
                : (col.header as React.ReactNode)}
            </span>
            <button
              onClick={() => {
                const currentSort = column.getIsSorted();
                if (currentSort === false) {
                  column.toggleSorting(false);
                } else if (currentSort === "asc") {
                  column.toggleSorting(true);
                } else {
                  column.toggleSorting(false);
                }
              }}
              className="flex items-center"
            >
              {column.getIsSorted() === "asc" ? (
                <CircleArrowUp className="text-primary w-4 h-4" />
              ) : column.getIsSorted() === "desc" ? (
                <CircleArrowDown className="w-4 h-4" />
              ) : (
                <div className="flex flex-col">
                  <CircleArrowUp className="text-primary w-4 h-4 mb-[-2px] opacity-50" />
                </div>
              )}
            </button>
          </div>
        ),
      } as ColumnDef<ExposureBucketing>;
    }
    return col;
  });

  const finalColumns: ColumnDef<ExposureBucketing>[] = expandedRowConfig
    ? [
        ...enhancedColumns,
        {
          id: "expand",
          header: () => (
            <div className="p-2 flex items-center justify-start">
              <ChevronDown className="w-4 h-4 text-primary" />
            </div>
          ),
          cell: ({ row }) => (
            <button
              onClick={() => row.getToggleExpandedHandler()()}
              className="p-2 hover:bg-primary-xl text-primary rounded-md transition-colors"
              aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
            >
              {row.getIsExpanded() ? (
                <ChevronUp className="w-4 h-4 text-primary" />
              ) : (
                <ChevronDown className="w-4 h-4 text-primary" />
              )}
            </button>
          ),
        },
      ]
    : enhancedColumns;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (
      active.id !== over?.id &&
      draggableColumns.includes(active.id as string)
    ) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const table = useReactTable({
    data: filter ? filter : data,
    columns: finalColumns,
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: expandedRowConfig ? getExpandedRowModel() : undefined,
    getRowCanExpand: expandedRowConfig ? () => true : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnOrder,
      columnVisibility,
      sorting,
      rowSelection,
      expanded, // Add the expanded state to the table
    },
    enableRowSelection: true, // Enable row selection
    onExpandedChange: setExpanded, // Add handler for expanded state changes
  });

  const { notify } = useNotification();

  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  // Rest of your component remains the same...
  const handleApprove = async () => {
    // Get selected row IDs
    const selectedUserIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.exposure_header_id);

    if (selectedUserIds.length === 0) {
      // alert("No users selected");
      notify("No users selected", "warning");
      return;
    }

    console.log("Selected IDs for approval:", selectedUserIds);

    try {
      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/exposureBucketing/approve",
        {
          exposure_header_ids: selectedUserIds,
          updated_by: localStorage.getItem("userEmail"),
          comments: "Bulk user approval",
        }
      );

      if (response.data.success) {
        if (setData) {
          const updatedData = data.map((item) => {
            // Update status if item id is in selectedUserIds
            if (selectedUserIds.includes(item.exposure_header_id)) {
              return { ...item, status_bucketing: "Approved" }; // Update status or your relevant field
            }
            return item;
          });
          setData(updatedData);
        }

        setRowSelection({}); // Clear selection

        // alert(`${selectedUserIds.length} item(s) approved successfully`);
        notify(
          `${selectedUserIds.length} item(s) approved successfully`,
          "success"
        );
      } else {
        throw new Error(response.data.message || "Approval failed");
      }
    } catch (error) {
      console.error("Approval error:", error);
      // alert("Failed to approve selected items");
      notify("Failed to approve selected items", "error");
    }
  };
  const handleReject = async () => {
    const selectedUserIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.exposure_header_id);

    if (selectedUserIds.length === 0) {
      // alert("No users selected");
      notify("No users selected", "warning");
      return;
    }

    try {
      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/exposureBucketing/reject",
        {
          exposure_header_ids: selectedUserIds,
          updated_by: localStorage.getItem("userEmail"),
          comments: "Bulk user rejection",
        }
      );

      if (response.data.success) {
        if (setData) {
          const updatedData = data.map((item) =>
            selectedUserIds.includes(item.exposure_header_id)
              ? { ...item, status_bucketing: "Rejected" }
              : item
          );
          setData(updatedData);
        }

        setRowSelection({}); // Clear selection

        // alert(`${selectedUserIds.length} item(s) rejected successfully`);
        notify(
          `${selectedUserIds.length} item(s) rejected successfully`,
          "success"
        );
      } else {
        throw new Error(response.data.message || "Rejection failed");
      }
    } 
    catch (error) {
      console.error("Rejection error:", error);
      // alert("Failed to reject selected items");
      notify("Failed to reject selected items", "error");
    }
  };
  return (
    <>
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 min-w-[12rem]">
          <Button onClick={handleApprove}>Approve</Button>
          <Button onClick={handleReject}>Reject</Button>
        </div>
      </div>

      <div className={`w-full overflow-x-auto ${className}`}>
        <div className=" shadow-lg border border-border">
          <DndContext onDragEnd={handleDragEnd}>
            <table className="min-w-full">
              <colgroup>
                {table.getVisibleLeafColumns().map((col) => (
                  <col key={col.id} className="font-medium" />
                ))}
              </colgroup>
              <thead className="bg-secondary-color rounded-xl">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const isFirst = index === 0;
                      const isLast = index === headerGroup.headers.length - 1;
                      const isDraggable = draggableColumns.includes(
                        header.column.id
                      );

                      return (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
                          style={{ width: header.getSize() }}
                        >
                          <Droppable id={header.column.id}>
                            {isFirst || isLast || !isDraggable ? (
                              <div className="px-1">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </div>
                            ) : (
                              <Draggable id={header.column.id}>
                                <div className="cursor-move border-border text-header-color hover:bg-blue-100 rounded px-1 py-1 transition duration-150 ease-in-out">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </div>
                              </Draggable>
                            )}
                          </Droppable>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={finalColumns.length}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <p className="text-lg font-medium text-primary mb-1">
                          No data found
                        </p>
                        <p className="text-sm text-gray-500">
                          There is no data to display at the moment.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, idx) => (
                    <React.Fragment key={row.id}>
                      <tr
                        className={
                          idx % 2 === 0
                            ? "bg-primary-md"
                            : "bg-secondary-color-lt"
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && expandedRowConfig && (
                        <ExpandedRow
                          row={row}
                          config={expandedRowConfig}
                          onUpdate={onUpdate}
                          visibleColumnCount={row.getVisibleCells().length}
                        />
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>
    </>
  );
}

export default NyneOSTable;
