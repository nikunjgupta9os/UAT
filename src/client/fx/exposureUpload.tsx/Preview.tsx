import React, { useState, useEffect } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
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
import { X, ChevronDown, ChevronUp, CircleArrowUp, CircleArrowDown } from "lucide-react";
// import PaginationFooter from "../../ui/PaginationFooter";
import Button from "../../../client/ui/Button";
import "../../styles/theme.css";

interface EditableRowData {
  id: string;
  [key: string]: any;
}

interface PreviewRowData {
  id: string;
  originalIndex: number;
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

interface PreviewTableProps {
  headers: string[];
  rows: string[][];
  onRemoveRow: (index: number) => void;
  onUpdateRow?: (index: number, updatedRowObj: any) => void;
  defaultColumnVisibility?: Record<string, boolean>;
  draggableColumns?: string[];
  sortableColumns?: string[];
  expandedRowConfig?: ExpandedRowConfig;
  onUpdate?: (rowId: string, changes: Partial<PreviewRowData>) => Promise<boolean>;
  className?: string;
  edit?: boolean;
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
        const success = await onUpdate(row.original.id, changedFields);
        if (success) {
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

const PreviewTable: React.FC<PreviewTableProps> = ({
  headers,
  rows,
  onRemoveRow,
  onUpdateRow,
  defaultColumnVisibility = {},
  expandedRowConfig,
  sortableColumns = [],
  onUpdate,
  edit = true,
}) => {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState(defaultColumnVisibility);
  const [sorting, setSorting] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const data: PreviewRowData[] = React.useMemo(() => {
    return rows.map((row, index) => {
      const obj: PreviewRowData = {
        id: `row_${index}`,
        originalIndex: index,
      };

      row.forEach((value, colIndex) => {
        obj[`col_${colIndex}`] = value || "";
      });

      return obj;
    });
  }, [rows]);

  const defaultVisibility = React.useMemo(() => {
    const visibility: Record<string, boolean> = {};
    headers.forEach((_, index) => {
      visibility[`col_${index}`] = index < 4;
    });
    visibility["actions"] = true;
    return visibility;
  }, [headers]);

  const expandedRowConfigMemo = React.useMemo(() => {
    const hiddenColumns = headers
      .map((header, index) => ({ header, index }))
      .filter((_, index) => index >= 4);

    if (hiddenColumns.length === 0) return expandedRowConfig;

    return {
      sections: [
        {
          title: "Additional Columns",
          fields: hiddenColumns.map(({ index }) => `col_${index}`),
        },
      ],
      fieldLabels: hiddenColumns.reduce((acc, { header, index }) => {
        acc[`col_${index}`] = header.trim() || `Column ${index + 1}`;
        return acc;
      }, {} as Record<string, string>),
      ...expandedRowConfig,
    };
  }, [headers, expandedRowConfig]);

  const baseColumns: ColumnDef<PreviewRowData>[] = React.useMemo(() => {
    const dataColumns = headers.map((header, index) => ({
      id: `col_${index}`,
      accessorKey: `col_${index}`,
      header: () => (
        <span
          className={`font-semibold ${
            !header.trim() ? "text-red-500" : "text-gray-700"
          }`}
        >
          {header.trim() || `Missing Header (${index + 1})`}
        </span>
      ),
      cell: ({ getValue, row, column }) => {
        const value = getValue() as string;
        const isMissing =
          !value || value.trim() === "" || value.trim() === '""';

        const [editingValue, setEditingValue] = React.useState(value || "");

        const handleBlur = () => {
          if (onUpdateRow) {
            const updatedRow = { ...row.original, [column.id]: editingValue.trim() };
            onUpdateRow(row.original.originalIndex, updatedRow);
          }
        };

        if (isMissing) {
          return (
            <input
              type="text"
              className="text-sm bg-red-50 border border-red-300 text-red-800 rounded px-2 py-1 w-full"
              placeholder="Enter value"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleBlur}
            />
          );
        }

        return <span className="text-sm text-gray-900">{value}</span>;
      },
    }));

    const actionsColumn: ColumnDef<PreviewRowData> = {
      id: "actions",
      header: () => (
        <div className="flex items-center justify-center">
          <span className="text-gray-700 font-semibold">Actions</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors duration-150"
            onClick={() => onRemoveRow(row.original.originalIndex)}
            aria-label="Remove row"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
    };

    return [...dataColumns, actionsColumn];
  }, [headers, onRemoveRow, onUpdateRow]);

  // Enhanced columns with sorting capability
  const enhancedColumns: ColumnDef<PreviewRowData>[] = baseColumns.map((col) => {
    const columnId = col.id || (col as any).accessorKey;

    if (sortableColumns.includes(columnId)) {
      return {
        ...col,
        enableSorting: true,
        sortDescFirst: false,
        header: ({ column }: HeaderContext<PreviewRowData, unknown>) => (
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
      } as ColumnDef<PreviewRowData>;
    }
    return col;
  });

  const finalColumns: ColumnDef<PreviewRowData>[] = expandedRowConfigMemo
    ? [
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

  

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: expandedRowConfigMemo ? getExpandedRowModel() : undefined,
    getRowCanExpand: expandedRowConfigMemo ? () => true : undefined,
    // onColumnOrderChange: setColumnOrder,
    // onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      columnOrder,
      columnVisibility: Object.keys(defaultVisibility).length > 0 ? defaultVisibility : columnVisibility,
      pagination,
      // sorting,
      rowSelection,
    },
    enableRowSelection: true,
  });

  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  if (!headers.length || !rows.length) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="text-center py-12 text-gray-500">
            <div className="flex flex-col items-center">
              <p className="text-lg font-medium text-gray-900 mb-1">
                No data to preview
              </p>
              <p className="text-sm text-gray-500">
                Upload a file or add data to see the preview.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

 return (
  <div className="space-y-4">
    <div className="w-full overflow-x-auto">
      <div className="shadow-lg border border-border">
        <table className="min-w-full">
          <colgroup>
            {table.getVisibleLeafColumns().map((col) => (
              <col key={col.id} className="font-medium" />
            ))}
          </colgroup>
          <thead className="bg-secondary-color rounded-xl">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
                    style={{ width: header.getSize() }}
                  >
                    <div className="px-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </div>
                  </th>
                ))}
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
                  {row.getIsExpanded() && expandedRowConfigMemo && (
                    <ExpandedRow
                      row={row}
                      config={expandedRowConfigMemo}
                      onUpdate={onUpdate}
                      visibleColumnCount={row.getVisibleCells().length}
                      edit={edit}
                    />
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
        {/* <PaginationFooter table={table} /> */}
      </div>
    </div>

     <div className="bg-gray-50 px-6 py-3 border border-gray-200 rounded-xl">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {rows.length > 50
              ? `Showing first 50 rows of ${rows.length} total rows`
              : `Showing ${rows.length} row${rows.length !== 1 ? "s" : ""}`}
          </span>
          <span className="text-xs text-gray-500">
            {headers.length} column{headers.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
  </div>

 
    );
};


export default PreviewTable;
