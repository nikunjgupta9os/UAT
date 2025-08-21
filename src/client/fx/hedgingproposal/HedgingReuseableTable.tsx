import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type HeaderContext,
  type Row,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  CircleArrowDown,
  CircleArrowUp,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Draggable } from "../../../client/common/Draggable";
import { Droppable } from "../../../client/common/Droppable";
import Button from "../../../client/ui/Button";
import Pagination from "../../../client/ui/Pagination";
import "../../styles/theme.css";

// 👇 Ensure every row has at least an `id`
interface WithId {
  id: string;
}

interface ExpandedRowConfig {
  sections: {
    title: string;
    fields: string[];
  }[];
  editableFields?: string[];
  fieldLabels?: Record<string, string>;
}

interface TableProps<HedgingProposal extends WithId> {
  data: HedgingProposal[];
  filter?: HedgingProposal[];
  columns: ColumnDef<HedgingProposal>[];
  defaultColumnVisibility?: Record<string, boolean>;
  draggableColumns?: string[];
  sortableColumns?: string[];
  expandedRowConfig?: ExpandedRowConfig;
  onUpdate?: (
    rowId: string,
    changes: Partial<HedgingProposal>
  ) => Promise<boolean>;
  className?: string;
  setData?: (data: HedgingProposal[]) => void;
}

interface ExpandedRowProps<HedgingProposal extends WithId> {
  row: Row<HedgingProposal>;
  config: ExpandedRowConfig;
  onUpdate?: (
    rowId: string,
    changes: Partial<HedgingProposal>
  ) => Promise<boolean>;
  visibleColumnCount: number;
}

function ExpandedRow<HedgingProposal extends WithId>({
  row,
  config,
  onUpdate,
  visibleColumnCount,
}: ExpandedRowProps<HedgingProposal>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Partial<HedgingProposal>>({});

  const handleChange = (key: keyof HedgingProposal, value) => {
    setEditValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getChangedFields = (
    original: HedgingProposal,
    edited: Partial<HedgingProposal>
  ): Partial<HedgingProposal> => {
    const changes: Partial<HedgingProposal> = {};
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
          row.original.id,
          changedFields as HedgingProposal
        );
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
    const value = isEditing
      ? editValues[key as keyof HedgingProposal]
      : row.original[key as keyof HedgingProposal];

    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-bold text-secondary-text">{label}</label>
        {isEditing && isEditable ? (
          typeof row.original[key as keyof HedgingProposal] === "boolean" ? (
            <select
              className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
              value={String(editValues[key as keyof HedgingProposal])}
              onChange={(e) =>
                handleChange(
                  key as keyof HedgingProposal,
                  e.target.value === "true"
                )
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : (
            <input
              className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
              value={String(value || "")}
              onChange={(e) =>
                handleChange(key as keyof HedgingProposal, e.target.value)
              }
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
            <Button onClick={handleEditToggle}>
              {isEditing ? "Save" : "Edit"}
            </Button>
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

function NyneOSTable<HedgingProposal extends WithId>({
  data,
  filter,
  columns,
  defaultColumnVisibility = {},
  draggableColumns = [],
  sortableColumns = [],
  expandedRowConfig,
  onUpdate,
  className = "",
}: TableProps<HedgingProposal>) {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState(
    defaultColumnVisibility
  );
  const [sorting, setSorting] = useState<[]>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const enhancedColumns: ColumnDef<HedgingProposal>[] = columns.map((col) => {
    const columnId = col.id;

    if (sortableColumns.includes(columnId)) {
      return {
        ...col,
        enableSorting: true,
        sortDescFirst: false,
        header: ({ column }: HeaderContext<HedgingProposal, unknown>) => (
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
      } as ColumnDef<HedgingProposal>;
    }
    return col;
  });

  const finalColumns: ColumnDef<HedgingProposal>[] = expandedRowConfig
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

  const table = useReactTable({
    data: filter ? filter : data,
    columns: finalColumns,
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: expandedRowConfig ? getExpandedRowModel() : undefined,
    getRowCanExpand: expandedRowConfig ? () => true : undefined,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      columnOrder,
      columnVisibility,
      sorting,
      pagination,
    },
  });

  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

  return (
    <>
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 justify-end">
          <Button onClick={() => table.setColumnVisibility({})}>Submit</Button>
        </div>
      </div>
      <div className={`w-full -mt-0.5 overflow-x-auto ${className}`}>
        <div className="shadow-lg border border-border">
          <DndContext onDragEnd={handleDragEnd}>
            <table className="min-w-full">
              <colgroup>
                {table.getVisibleLeafColumns().map((col) => (
                  <col key={col.id} />
                ))}
              </colgroup>
              <thead className="bg-secondary-color rounded-xl">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isDraggable = draggableColumns.includes(
                        header.column.id
                      );
                      return (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
                        >
                          <Droppable id={header.column.id}>
                            {isDraggable ? (
                              <Draggable id={header.column.id}>
                                <div className="cursor-move border-border text-header-color hover:bg-primary-lg rounded px-1 py-1 transition duration-150 ease-in-out">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </div>
                              </Draggable>
                            ) : (
                              <div className="px-1">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </div>
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
                      className="px-6 py-12 text-center text-primary"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-xl font-medium text-primary mb-1">
                          No users found
                        </p>
                        <p className="text-md font-normal text-primary">
                          There are no users to display at the moment.
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

      {/* Add Pagination Component */}
      <Pagination
        table={table}
        totalItems={(filter || data).length}
        currentPageItems={table.getRowModel().rows.length}
        startIndex={pagination.pageIndex * pagination.pageSize + 1}
        endIndex={Math.min(
          (pagination.pageIndex + 1) * pagination.pageSize,
          (filter || data).length
        )}
      />
    </>
  );
}

export default NyneOSTable;
