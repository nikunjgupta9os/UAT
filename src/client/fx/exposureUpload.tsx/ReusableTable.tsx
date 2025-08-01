import React, { useState, useEffect } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import axios from "axios";
import { useNotification } from "../../Notification/Notification.tsx";
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
// import { exportToExcel } from "../../ui/exportToExcel";
import { Download } from "lucide-react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import {
  ChevronDown,
  ChevronUp,
  CircleArrowUp,
  Trash2,
  CircleArrowDown,
} from "lucide-react";
import Button from "../../../client/ui/Button";
import "../../styles/theme.css";

interface EditableRowData {
  exposure_header_id: string; // Changed from 'id' to 'exposure_header_id'
  [key: string]: any;
}

interface ExpandedRowConfig {
  sections: {
    title: string;
    fields: string[];
  }[];
  editableFields?: string[];
  fieldLabels?: Record<string, string>;
}

interface TableProps<T extends EditableRowData> {
  data ? : T[];
  filter?: T[];
  columns ?: ColumnDef<T>[];
  defaultColumnVisibility?: Record<string, boolean>;
  draggableColumns?: string[];
  sortableColumns?: string[];
  expandedRowConfig?: ExpandedRowConfig;
  onUpdate?: (rowId: string, changes: Partial<T>) => Promise<boolean>;
  className?: string;
  edit?: boolean;
  setData?: (data: T[]) => void;
}

interface ExpandedRowProps<T extends EditableRowData> {
  row: Row<T>;
  config: ExpandedRowConfig;
  onUpdate?: (rowId: string, changes: Partial<T>) => Promise<boolean>;
  visibleColumnCount: number;
  edit?: boolean;
}

function ExpandedRow<T extends EditableRowData>({
  row,
  config,
  onUpdate,
  edit,
  visibleColumnCount,
}: ExpandedRowProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Partial<T>>({});

  const handleChange = (key: keyof T, value: any) => {
    setEditValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getChangedFields = (original: T, edited: Partial<T>): Partial<T> => {
    const changes: Partial<T> = {};
    for (const key in edited) {
      if (edited[key] !== original[key]) {
        changes[key] = edited[key];
      }
    }
    return changes;
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      const changedFields = getChangedFields(row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }
      if (onUpdate) {
        const success = await onUpdate(
          row.original.exposure_header_id,
          changedFields
        ); // Changed from id to exposure_header_id
        if (success) {
          // Update the original row data
          Object.assign(row.original, changedFields);
          setIsEditing(false);
        }
      } else {
        setIsEditing(false);
      }
    } else {
      setEditValues({ ...row.original });
      setIsEditing(true);
    }
  };

  const renderField = (key: string) => {
    const label = config.fieldLabels?.[key] ?? key;
    const isEditable = config.editableFields?.includes(key) ?? false;
    let value: any = isEditing
      ? editValues[key as keyof T]
      : row.original[key as keyof T];

    if (!isEditing && key.toLowerCase().includes("date")) {
      const date = new Date(value as string);
      value = isNaN(date.getTime()) ? value : date.toLocaleDateString();
    }

    if (!isEditing && typeof value === "boolean") {
      value = value ? "Yes" : "No";
    }

    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-bold text-secondary-text">{label}</label>
        {isEditing && isEditable ? (
          typeof row.original[key as keyof T] === "boolean" ? (
            <select
              className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
              value={String(editValues[key as keyof T])}
              onChange={(e) =>
                handleChange(key as keyof T, e.target.value === "true")
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : (
            <input
              className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
              value={String(value || "")}
              onChange={(e) => handleChange(key as keyof T, e.target.value)}
            />
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
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-secondary-text">
              Additional Information
            </h4>
            {edit && (
              <div>
                <Button onClick={handleEditToggle}>
                  {isEditing ? "Save" : "Edit"}
                </Button>
              </div>
            )}
          </div>
          {config.sections.map((section) => (
            <div key={section.title} className="mb-6">
              <h5 className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
                {section.title}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                {section.fields.map(renderField)}
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
function NyneOSTable<T extends EditableRowData>({
  data,
  filter,
  columns,
  defaultColumnVisibility = {},
  draggableColumns = [],
  sortableColumns = [],
  expandedRowConfig,
  onUpdate,
  edit,
  setData,
  className = "",
}: TableProps<T>) {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState(
    defaultColumnVisibility
  );
  const [sorting, setSorting] = useState<any[]>([]);

  // Enhanced columns with sorting capability
  const enhancedColumns: ColumnDef<T>[] = columns.map((col) => {
    const columnId = col.id || (col as any).accessorKey;
    if (sortableColumns.includes(columnId)) {
      return {
        ...col,
        enableSorting: true,
        sortDescFirst: false,
        header: ({ column }: HeaderContext<T, unknown>) => (
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
      } as ColumnDef<T>;
    }
    return col;
  });

  const finalColumns: ColumnDef<T>[] = expandedRowConfig
    ? [
        ...enhancedColumns,
        {
          accessorKey: "actions",
          header: "Action",
          cell: ({ row }) => {
            return (
              <div className="flex items-center space-x-2">
                <button
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            );
          },
        },
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

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: filter ? filter : data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: expandedRowConfig ? getExpandedRowModel() : undefined,
    getRowCanExpand: expandedRowConfig ? () => true : undefined,
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnOrder,
      columnVisibility,
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    getRowId: (row) => row.exposure_header_id, // Add this to specify the unique row identifier
  });

  const { notify } = useNotification();

  const handleDelete = async () => {
    const selectedExposureIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.exposure_header_id);
    const selectedUserIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    if (selectedUserIds.length === 0) {
      // alert("No users selected");
      notify("No users selected", "warning");
      return;
    }

    try {
      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/exposureUpload/delete-exposure-headers",
        {
          exposureHeaderIds: selectedExposureIds,
          requested_by: localStorage.getItem("userEmail"),
          // delete_comment: "Bulk delete requested", // Optional, you can replace or omit
        }
      );

      if (response.data.success) {
        if (setData) {
        const updatedData = data.map((item) =>
          selectedExposureIds.includes(item.exposure_header_id)
            ? { ...item, approval_status: "Delete-approval" }
            : item
        );
        setData(updatedData);
      }
      setRowSelection({}); // Clear selection

        // alert(`${selectedUserIds.length} item(s) approved successfully`);
        notify(
          `${selectedUserIds.length} item(s) deleted successfully`,
          "success"
        );
      } else {
        throw new Error(response.data.message || "Delete failed");
      }
    } catch (error) {
      //  console.error("Delete error:", error);
      // alert("Failed to delete selected items");
      notify("Failed to delete selected items", "error");
    }
  };
  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  return (
    <>
      <div className="flex items-center justify-end"></div>

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
                          className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
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
                          edit={edit} // Always allow editing in expanded row
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
// import React, { useState, useEffect } from "react";
// import type { RowSelectionState } from "@tanstack/react-table";
// import axios from "axios";
// import {
//   useReactTable,
//   getCoreRowModel,
//   flexRender,
//   getExpandedRowModel,
//   getSortedRowModel,
//   type ColumnDef,
//   type Row,
//   type HeaderContext,
// } from "@tanstack/react-table";
// import { exportToExcel } from "../../ui/exportToExcel";
// import { Download, Trash2 } from "lucide-react";
// import { DndContext, type DragEndEvent } from "@dnd-kit/core";
// import { Draggable } from "../../common/Draggable";
// import { Droppable } from "../../common/Droppable";
// import PaginationFooter from "../../ui/PaginationFooter";
// import {
//   ChevronDown,
//   ChevronUp,
//   CircleArrowUp,
//   CircleArrowDown,
// } from "lucide-react";
// import Button from "../../../client/ui/Button";
// import "../../styles/theme.css";
// import { useNotification } from "../../Notification/Notification.tsx";
// interface EditableRowData {
//   id: string;
//   [key: string]: any;
// }

// interface ExpandedRowConfig {
//   sections: {
//     title: string;
//     fields: string[];
//   }[];
//   editableFields?: string[];
//   fieldLabels?: Record<string, string>;
// }

// interface TableProps<T extends EditableRowData> {
//   data: T[];
//   filter?: T[];
//   columns: ColumnDef<T>[];
//   defaultColumnVisibility?: Record<string, boolean>;
//   draggableColumns?: string[];
//   sortableColumns?: string[];
//   expandedRowConfig?: ExpandedRowConfig;
//   onUpdate?: (rowId: string, changes: Partial<T>) => Promise<boolean>;
//   className?: string;
//   edit?: boolean;
//   setData?: (data: T[]) => void;
// }

// interface ExpandedRowProps<T extends EditableRowData> {
//   row: Row<T>;
//   config: ExpandedRowConfig;
//   onUpdate?: (rowId: string, changes: Partial<T>) => Promise<boolean>;
//   visibleColumnCount: number;
//   edit?: boolean;
// }

// function ExpandedRow<T extends EditableRowData>({
//   row,
//   config,
//   onUpdate,
//   edit,
//   visibleColumnCount,
// }: ExpandedRowProps<T>) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [editValues, setEditValues] = useState<Partial<T>>({});
//   //   const [ed, seted] = useState(true);
//   const handleChange = (key: keyof T, value: any) => {
//     setEditValues((prev) => ({
//       ...prev,
//       [key]: value,
//     }));
//   };

//   const getChangedFields = (original: T, edited: Partial<T>): Partial<T> => {
//     const changes: Partial<T> = {};
//     for (const key in edited) {
//       if (edited[key] !== original[key]) {
//         changes[key] = edited[key];
//       }
//     }
//     return changes;
//   };

//   const handleEditToggle = async () => {
//     if (isEditing) {
//       const changedFields = getChangedFields(row.original, editValues);

//       if (Object.keys(changedFields).length === 0) {
//         setIsEditing(false);
//         return;
//       }

//       if (onUpdate) {
//         const success = await onUpdate(row.original.id, changedFields);
//         if (success) {
//           // Update the original row data
//           Object.assign(row.original, changedFields);
//           setIsEditing(false);
//         }
//       } else {
//         setIsEditing(false);
//       }
//     } else {
//       setEditValues({ ...row.original });
//       setIsEditing(true);
//     }
//   };

//   const renderField = (key: string) => {
//     const label = config.fieldLabels?.[key] ?? key;
//     const isEditable = config.editableFields?.includes(key) ?? false;
//     let value: any = isEditing
//       ? editValues[key as keyof T]
//       : row.original[key as keyof T];

//     if (!isEditing && key.toLowerCase().includes("date")) {
//       const date = new Date(value as string);
//       value = isNaN(date.getTime()) ? value : date.toLocaleDateString();
//     }

//     if (!isEditing && typeof value === "boolean") {
//       value = value ? "Yes" : "No";
//     }

//     return (
//       <div key={key} className="flex flex-col space-y-1">
//         <label className="font-bold text-secondary-text">{label}</label>
//         {isEditing && isEditable ? (
//           typeof row.original[key as keyof T] === "boolean" ? (
//             <select
//               className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
//               value={String(editValues[key as keyof T])}
//               onChange={(e) =>
//                 handleChange(key as keyof T, e.target.value === "true")
//               }
//             >
//               <option value="true">Yes</option>
//               <option value="false">No</option>
//             </select>
//           ) : (
//             <input
//               className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
//               value={String(value || "")}
//               onChange={(e) => handleChange(key as keyof T, e.target.value)}
//             />
//           )
//         ) : (
//           <span className="font-medium text-primary-lt">
//             {String(value ?? "—")}
//           </span>
//         )}
//       </div>
//     );
//   };

//   return (
//     <tr key={`${row.id}-expanded`}>
//       <td colSpan={visibleColumnCount} className="px-6 py-4 bg-primary-md">
//         <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
//           <div className="flex justify-between items-center mb-4">
//             <h4 className="text-lg font-semibold text-secondary-text">
//               Additional Information
//             </h4>
//             {edit && (
//               <div>
//                 <Button onClick={handleEditToggle}>
//                   {isEditing ? "Save" : "Edit"}
//                 </Button>
//               </div>
//             )}
//           </div>

//           {config.sections.map((section) => (
//             <div key={section.title} className="mb-6">
//               <h5 className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
//                 {section.title}
//               </h5>
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 {section.fields.map(renderField)}
//               </div>
//             </div>
//           ))}

//           {config.sections.length === 0 && (
//             <div className="text-center text-gray-500 py-4">
//               No additional information to display
//             </div>
//           )}
//         </div>
//       </td>
//     </tr>
//   );
// }

// // Main Table Component
// function NyneOSTable<T extends EditableRowData>({
//   data,
//   filter,
//   columns,
//   defaultColumnVisibility = {},
//   draggableColumns = [],
//   sortableColumns = [],
//   expandedRowConfig,
//   onUpdate,
//   edit,
//   setData,
//   className = "",
// }: TableProps<T>) {
//   const [columnOrder, setColumnOrder] = useState<string[]>([]);
//   const [columnVisibility, setColumnVisibility] = useState(
//     defaultColumnVisibility
//   );
//   const [sorting, setSorting] = useState<any[]>([]);
//   const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

//   // Enhanced columns with sorting capability
//   const enhancedColumns: ColumnDef<T>[] = columns.map((col) => {
//     const columnId = col.id || (col as any).accessorKey;

//     if (sortableColumns.includes(columnId)) {
//       return {
//         ...col,
//         enableSorting: true,
//         sortDescFirst: false,
//         header: ({ column }: HeaderContext<T, unknown>) => (
//           <div className="flex items-center space-x-2">
//             <span>
//               {typeof col.header === "function"
//                 ? "Sort"
//                 : (col.header as React.ReactNode)}
//             </span>
//             <button
//               onClick={() => {
//                 const currentSort = column.getIsSorted();
//                 if (currentSort === false) {
//                   column.toggleSorting(false);
//                 } else if (currentSort === "asc") {
//                   column.toggleSorting(true);
//                 } else {
//                   column.toggleSorting(false);
//                 }
//               }}
//               className="flex items-center"
//             >
//               {column.getIsSorted() === "asc" ? (
//                 <CircleArrowUp className="text-primary w-4 h-4" />
//               ) : column.getIsSorted() === "desc" ? (
//                 <CircleArrowDown className="w-4 h-4" />
//               ) : (
//                 <div className="flex flex-col">
//                   <CircleArrowUp className="text-primary w-4 h-4 mb-[-2px] opacity-50" />
//                 </div>
//               )}
//             </button>
//           </div>
//         ),
//       } as ColumnDef<T>;
//     }
//     return col;
//   });

//   const finalColumns: ColumnDef<T>[] = expandedRowConfig
//     ? [
//         ...enhancedColumns,
//          {
//         accessorKey: "actions",
//         header: "Action",
//         cell: ({ row }) => {
//           const item = row.original;
//           return (
//             <div className="flex items-center space-x-2">
//               <button
//                 className="p-1.5 hover:bg-gray-100 rounded transition-colors"
//                 onClick={() =>
//                   exportToExcel(
//                     [row.original], // wrap in array for xlsx
//                     `Role_${row.original.id}`
//                   )
//                 }
//               >
//                 <Download className="w-4 h-4 text-[#129990]" />
//               </button>
//               <button
//                 className="p-1.5 hover:bg-gray-100 rounded transition-colors"
//                 onClick={handleDelete}
//               >
//                 <Trash2 className="w-4 h-4 text-red-600" />
//               </button>
//             </div>
//           );
//         },
//       },
//         {
//           id: "expand",
//           header: () => (
//             <div className="p-2 flex items-center justify-start">
//               <ChevronDown className="w-4 h-4 text-primary" />
//             </div>
//           ),
//           cell: ({ row }) => (
//             <button
//               onClick={() => row.getToggleExpandedHandler()()}
//               className="p-2 hover:bg-primary-xl text-primary rounded-md transition-colors"
//               aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
//             >
//               {row.getIsExpanded() ? (
//                 <ChevronUp className="w-4 h-4 text-primary" />
//               ) : (
//                 <ChevronDown className="w-4 h-4 text-primary" />
//               )}
//             </button>
//           ),
//         },
//       ]
//     : enhancedColumns;

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;
//     if (
//       active.id !== over?.id &&
//       draggableColumns.includes(active.id as string)
//     ) {
//       const oldIndex = columnOrder.indexOf(active.id as string);
//       const newIndex = columnOrder.indexOf(over?.id as string);
//       const newOrder = [...columnOrder];
//       newOrder.splice(oldIndex, 1);
//       newOrder.splice(newIndex, 0, active.id as string);
//       setColumnOrder(newOrder);
//     }
//   };

//   const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

//   const table = useReactTable({
//     data: filter ? filter : data,
//     columns: finalColumns,
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getExpandedRowModel: expandedRowConfig ? getExpandedRowModel() : undefined,
//     getRowCanExpand: expandedRowConfig ? () => true : undefined,
//     onColumnOrderChange: setColumnOrder,
//     onSortingChange: setSorting,
//     onColumnVisibilityChange: setColumnVisibility,
//     onRowSelectionChange: setRowSelection,
//     state: {
//       columnOrder,
//       columnVisibility,
//       pagination,
//       sorting,
//       rowSelection,
//     },
//     enableRowSelection: true,
//   });

//   const {notify} = useNotification();

//   // Add these functions inside your NyneOSTable component, before the return statement
//   // Add these functions inside your NyneOSTable component, before the return statement
//   const handleDelete = async () => {
//   const selectedUserIds = table
//     .getSelectedRowModel()
//     .rows.map((row) => row.original.id);

//   if (selectedUserIds.length === 0) {
//     // alert("No users selected");
//     notify("No users selected", "warning");
//     return;
//   }

//   try {
//     const response = await axios.post(
//       "https://backend-5n7t.onrender.com/api/exposureUpload/deleteExposure",
//       {
//         id: selectedUserIds,
//         requested_by: localStorage.getItem("userEmail"),
//         // delete_comment: "Bulk delete requested", // Optional, you can replace or omit
//       }
//     );

//     if (response.data.success) {
//         if (setData) {
//           const updatedData = data.map((item) => {
//             // Update status if item id is in selectedUserIds
//             if (selectedUserIds.includes(item.id)) {
//               return { ...item, status: "Delete-Approval" }; // Update status or your relevant field
//             }
//             return item;
//           });
//           setData(updatedData);
//         }

//         setRowSelection({}); // Clear selection

//         // alert(`${selectedUserIds.length} item(s) approved successfully`);
//         notify(`${selectedUserIds.length} item(s) deleted successfully`, "success");
//       } else {
//         throw new Error(response.data.message || "Delete failed");
//       }
//     } catch (error) {
//       //  console.error("Delete error:", error);
//       // alert("Failed to delete selected items");
//       notify("Failed to delete selected items", "error");
//     }
// };

//   useEffect(() => {
//     if (columnOrder.length === 0) {
//       setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
//     }
//   }, [table, columnOrder]);

//   return (
//     <>

//       <div className="flex items-center justify-end"></div>
//       <div className="flex items-center justify-end">
//         {/* <div className="flex items-center gap-2 min-w-[12rem]">
//           <Button onClick={handleApprove}>Approve</Button>
//           <Button onClick={handleReject}>Reject</Button>
//         </div> */}
//       </div>

//       <div className={`w-full overflow-x-auto ${className}`}>
//         <div className=" shadow-lg border border-border">
//           <DndContext onDragEnd={handleDragEnd}>
//             <table className="min-w-full">
//               <colgroup>
//                 {table.getVisibleLeafColumns().map((col) => (
//                   <col key={col.id} className="font-medium" />
//                 ))}
//               </colgroup>
//               <thead className="bg-secondary-color rounded-xl">
//                 {table.getHeaderGroups().map((headerGroup) => (
//                   <tr key={headerGroup.id}>
//                     {headerGroup.headers.map((header, index) => {
//                       const isFirst = index === 0;
//                       const isLast = index === headerGroup.headers.length - 1;
//                       const isDraggable = draggableColumns.includes(
//                         header.column.id
//                       );

//                       return (
//                         <th
//                           key={header.id}
//                           className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
//                           style={{ width: header.getSize() }}
//                         >
//                           <Droppable id={header.column.id}>
//                             {isFirst || isLast || !isDraggable ? (
//                               <div className="px-1">
//                                 {flexRender(
//                                   header.column.columnDef.header,
//                                   header.getContext()
//                                 )}
//                               </div>
//                             ) : (
//                               <Draggable id={header.column.id}>
//                                 <div className="cursor-move border-border text-header-color hover:bg-blue-100 rounded px-1 py-1 transition duration-150 ease-in-out">
//                                   {flexRender(
//                                     header.column.columnDef.header,
//                                     header.getContext()
//                                   )}
//                                 </div>
//                               </Draggable>
//                             )}
//                           </Droppable>
//                         </th>
//                       );
//                     })}
//                   </tr>
//                 ))}
//               </thead>
//               <tbody className="divide-y">
//                 {table.getRowModel().rows.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={finalColumns.length}
//                       className="px-6 py-12 text-center text-gray-500"
//                     >
//                       <div className="flex flex-col items-center">
//                         <p className="text-lg font-medium text-primary mb-1">
//                           No data found
//                         </p>
//                         <p className="text-sm text-gray-500">
//                           There is no data to display at the moment.
//                         </p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   table.getRowModel().rows.map((row, idx) => (
//                     <React.Fragment key={row.id}>
//                       <tr
//                         className={
//                           idx % 2 === 0
//                             ? "bg-primary-md"
//                             : "bg-secondary-color-lt"
//                         }
//                       >
//                         {row.getVisibleCells().map((cell) => (
//                           <td
//                             key={cell.id}
//                             className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
//                           >
//                             {flexRender(
//                               cell.column.columnDef.cell,
//                               cell.getContext()
//                             )}
//                           </td>
//                         ))}
//                       </tr>
//                       {row.getIsExpanded() && expandedRowConfig && (
//                         <ExpandedRow
//                           row={row}
//                           config={expandedRowConfig}
//                           onUpdate={onUpdate}
//                           visibleColumnCount={row.getVisibleCells().length}
//                           edit={edit} // Always allow editing in expanded row
//                         />
//                       )}
//                     </React.Fragment>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </DndContext>

//         </div>

//       </div>
//       <PaginationFooter table={table}/>
//     </>
//   );
// }

// export default NyneOSTable;
