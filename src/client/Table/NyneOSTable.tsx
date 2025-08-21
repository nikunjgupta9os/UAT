import React, { useRef, useEffect, useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import {
  flexRender,
  type Row,
  type Table,
  type ColumnDef,
} from "@tanstack/react-table";
import Button from "../../ui/Button";
import RenderField from "./renderFeild";

type Section<T> = {
  title: string;
  fields: (keyof T)[];
  editableKeys?: (keyof T)[];
};

type NyneOSTableProps<T> = {
  table: Table<T>;
  columns: ColumnDef<T>[];
  nonDraggableColumns: string[];
  nonSortingColumns: string[];
  sections: Section<T>[];
  isEditing: boolean;
  isSaving: boolean;
  editValues: T;
  setIsEditing: (v: boolean) => void;
  setEditValues: (v: T) => void;
  onChange?: (field: keyof T, value: T[keyof T]) => void;
  handleForwardEditToggle: (row: Row<T>) => void;
  Visibility: boolean;
};

function NyneOSTable<T>({
  table,
  columns,
  nonDraggableColumns,
  nonSortingColumns,
  sections,
  isEditing,
  isSaving,
  editValues,
  setIsEditing,
  setEditValues,
  onChange,
  handleForwardEditToggle,
  Visibility,
}: NyneOSTableProps<T>) {
  const safeOnChange = onChange ?? (() => {});
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>(
    table.getAllLeafColumns().map((col) => col.id)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (
      nonDraggableColumns.includes(active.id as string) ||
      nonDraggableColumns.includes(over.id as string)
    ) {
      return;
    }
    if (active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };
  useEffect(() => {
    table.setColumnOrder(columnOrder);
  }, [columnOrder]);

  return (
    <div className="shadow-lg border border-border lg:overflow-x-visible md:overflow-x-auto">
      <DndContext
        onDragEnd={handleDragEnd}
        modifiers={[restrictToFirstScrollableAncestor]}
      >
        <table className="w-full table-auto">
          <thead className="bg-secondary-color rounded-xl">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isDraggable = !nonDraggableColumns.includes(
                    header.column.id
                  );
                  const canSort = !nonSortingColumns.includes(header.column.id);
                  const isSorted = header.column.getIsSorted?.() as
                    | false
                    | "asc"
                    | "desc";
                  return (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border select-none group "
                      style={{ width: header.getSize() }}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className={canSort ? "cursor-pointer" : ""}
                          onClick={
                            canSort
                              ? (e) =>
                                  header.column.toggleSorting?.(
                                    undefined,
                                    (e as React.MouseEvent).shiftKey
                                  )
                              : undefined
                          }
                          tabIndex={canSort ? 0 : undefined}
                          onKeyDown={
                            canSort
                              ? (e) => {
                                  if (
                                    (e as React.KeyboardEvent).key ===
                                      "Enter" ||
                                    (e as React.KeyboardEvent).key === " "
                                  ) {
                                    header.column.toggleSorting?.(
                                      undefined,
                                      (e as React.KeyboardEvent).shiftKey
                                    );
                                  }
                                }
                              : undefined
                          }
                          role={canSort ? "button" : undefined}
                          aria-label={canSort ? "Sort column" : undefined}
                        >
                          {isDraggable ? (
                            <Droppable id={header.column.id}>
                              <Draggable id={header.column.id}>
                                <div className="cursor-move rounded p-1 transition duration-150 ease-in-out hover:bg-primary-lg">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </div>
                              </Draggable>
                            </Droppable>
                          ) : (
                            <div className="px-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                          )}
                          {canSort && (
                            <span className="ml-1 text-xs">
                              {isSorted === "asc" ? (
                                "▲"
                              ) : isSorted === "desc" ? (
                                "▼"
                              ) : (
                                <span className="opacity-30">▲▼</span>
                              )}
                            </span>
                          )}
                        </span>
                      </div>
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
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-primary"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      {/* You can use an icon here */}
                      <span className="text-primary text-2xl">—</span>
                    </div>
                    <p className="text-xl font-medium text-primary mb-1">
                      No Transactions Available
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, idx: number) => (
                <React.Fragment key={row.id}>
                  <tr
                    className={
                      idx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-secondary-text-dark font-normal whitespace-nowrap text-sm border-b border-border"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && (
                    <tr
                      key={`${row.id}-expanded`}
                      ref={(el) => {
                        rowRefs.current[row.id] = el;
                      }}
                    >
                      <td
                        colSpan={table.getVisibleLeafColumns().length}
                        className="px-6 py-4 bg-primary-md"
                      >
                        <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
                          {/* Edit/Save Button */}
                          {Visibility && (
                            <div className="flex justify-end mb-4">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleForwardEditToggle(row)}
                                  color={
                                    isEditing
                                      ? isSaving
                                        ? "Fade"
                                        : "Green"
                                      : "Fade"
                                  }
                                  disabled={isSaving}
                                >
                                  {isEditing
                                    ? isSaving
                                      ? "Saving..."
                                      : "Save"
                                    : "Edit"}
                                </Button>
                                {isEditing && !isSaving && (
                                  <Button
                                    color="Fade"
                                    onClick={() => {
                                      setIsEditing(false);
                                      setEditValues({} as T);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Render sections and fields using RenderField */}
                          {sections.map(({ title, fields, editableKeys }) => (
                            <div key={title} className="mb-6">
                              <div className="text-md font-medium text-primary mb-3 pb-2">
                                {title}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {fields.map((key) => (
                                  <RenderField
                                    key={String(key)}
                                    field={key}
                                    value={
                                      isEditing
                                        ? editValues[key] ?? row.original[key]
                                        : row.original[key]
                                    }
                                    originalValue={row.original[key]}
                                    editableFields={editableKeys ?? []}
                                    isEditing={isEditing}
                                    onChange={safeOnChange}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </DndContext>
    </div>
  );
}

export default NyneOSTable;
