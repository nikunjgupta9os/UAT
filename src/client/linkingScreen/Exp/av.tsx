import React, { useState, useMemo, useEffect } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

type AvailableForwardsData = {
  bu: string;
  type: string;
  currency: string;
  fcyExposure: number;
  rate: number;
  lcyExposure: number;
  maturity: string;
  pctToHedge: string;
  hedged: number;
  exposure_header_id: string;
  available: number;
};

interface TableProps {
  filters?: {
    businessUnit: string;
    currency: string;
    type: string;
    bank: string;
    maturityMonths: string;
  };
  hedgedValue?: number | null; // <-- add this
  selectedExposureHeaderId?: string | null; // <-- add this

  onSelectExposureHeaderId?: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  onEditHedged?: React.Dispatch<React.SetStateAction<number | null>>;
  setBuOptions: React.Dispatch<
    React.SetStateAction<{ value: string; label: string }[]>
  >;
  setCurrencyOptions: React.Dispatch<
    React.SetStateAction<{ value: string; label: string }[]>
  >;
}

const nonDraggableColumns = ["expand", "select"];

const UnlinkedExposure: React.FC<TableProps> = ({
  onEditHedged,
  filters,
  hedgedValue,
  selectedExposureHeaderId,
  onSelectExposureHeaderId,
  setBuOptions,
  setCurrencyOptions,
}) => {
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [data, setData] = useState<AvailableForwardsData[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "action",
    "bu",
    "type",
    "currency",
    "fcyExposure",
    "rate",
    "lcyExposure",
    "maturity",
    "pctToHedge",
    "exposure_header_id",
    "hedged",
    "available",
    "expand",
  ]);
  // New state for editing functionality
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<AvailableForwardsData>(
    {} as AvailableForwardsData
  );

  const filteredData = useMemo(() => {
    if (!data) return [];

    // Return all data if no filters are provided or all filters are empty
    const hasFilters =
      filters && Object.values(filters).some((val) => val !== "");
    if (!hasFilters) return data;

    return data.filter((item) => {
      // Safe property access with optional chaining
      if (filters?.businessUnit && item.bu !== filters.businessUnit)
        return false;
      if (filters?.currency && item.currency !== filters.currency) return false;
      if (
        filters?.type &&
        item.type.toLowerCase() !== filters.type.toLowerCase()
      )
        return false;

      if (filters?.maturityMonths) {
        try {
          const maturityDate = new Date(item.maturity);
          const currentDate = new Date();
          const monthsDiff =
            (maturityDate.getFullYear() - currentDate.getFullYear()) * 12 +
            (maturityDate.getMonth() - currentDate.getMonth());

          if (monthsDiff >= parseInt(filters.maturityMonths)) return false;
        } catch (e) {
          console.error("Invalid date format", e);
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  const transformApiData = (apiData: any[]): AvailableForwardsData[] => {
    return apiData.map((item) => {
      const fcyExposure = parseFloat(item.amount);
      const hedged = item.hedge_amount;
      const rate = 1; // Replace with actual rate if available
      const lcyExposure = fcyExposure * rate;
      const available = fcyExposure - hedged;

      return {
        bu: item.bu,
        type: item.type,
        currency: item.currency,
        fcyExposure,
        rate,
        lcyExposure,
        exposure_header_id: item.exposure_header_id,
        maturity: item.maturity_date.split("T")[0],
        pctToHedge: "80%", // Placeholder or logic if available
        hedged,
        available,
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        "https://backend-slqi.onrender.com/api/exposureUpload/expfwdLinking"
      );
      const transformed = transformApiData(response.data);
      setData((prev) => [...prev, ...transformed]);

      // Extract unique business units
      const uniqueBUs = Array.from(
        new Set(response.data.map((item: any) => item.bu))
      );
      const buOptions = uniqueBUs.map((bu: string) => ({
        value: bu,
        label: bu,
      }));

      // Extract unique currencies
      const uniqueCurrencies = Array.from(
        new Set(response.data.map((item: any) => item.currency))
      );
      const currencyOptions = uniqueCurrencies.map((currency: string) => ({
        value: currency,
        label: currency,
      }));

      setBuOptions([{ value: "", label: "Select" }, ...buOptions]);
      setCurrencyOptions([{ value: "", label: "Select" }, ...currencyOptions]);
    };

    fetchData();
  }, [setBuOptions, setCurrencyOptions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  const renderField = (
    key: keyof AvailableForwardsData,
    value: any,
    originalValue: any,
    isEditable: boolean = false
  ) => {
    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-bold text-secondary-text capitalize">
          {key}
        </label>
        {isEditing && isEditable ? (
          <>
            <input
              className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
              value={String(value ?? "")}
              type={typeof originalValue === "number" ? "number" : "text"}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [key]:
                    typeof originalValue === "number"
                      ? parseFloat(e.target.value)
                      : e.target.value,
                }))
              }
            />
            <span className="text-xs text-gray-500">
              Old: {String(originalValue ?? "—")}
            </span>
          </>
        ) : (
          <span className="font-medium text-primary-lt">
            {typeof value === "number"
              ? value.toLocaleString()
              : String(value ?? "—")}
          </span>
        )}
      </div>
    );
  };

  const columns = useMemo<ColumnDef<AvailableForwardsData>[]>(
    () => [
      {
        id: "expand",
        header: () => (
          <div className="p-2 flex items-center justify-start">
            <ChevronDown className="w-4 h-4 text-primary" />
          </div>
        ),
        cell: ({ row }) => (
          <button
            onClick={() => {
              const newExpandedId = expandedRowId === row.id ? null : row.id;
              setExpandedRowId(newExpandedId);
              if (newExpandedId !== row.id) {
                setIsEditing(false);
                setEditValues({} as AvailableForwardsData);
              }
            }}
            className="p-2 hover:bg-primary-xl text-primary rounded-md transition-colors"
            aria-label={
              expandedRowId === row.id ? "Collapse row" : "Expand row"
            }
          >
            {expandedRowId === row.id ? (
              <ChevronUp className="w-4 h-4 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-primary" />
            )}
          </button>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },

      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },

      {
        accessorKey: "action",
        header: "Action",
        cell: () => (
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-blue-600 hover:bg-blue-100">
              <Eye className="w-4 h-4" />
            </button>
            {/* <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-green-600 hover:bg-green-100">
              <Pencil className="w-4 h-4" />
            </button> */}
          </div>
        ),
      },

      {
        accessorKey: "bu",
        header: "BU",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "fcyExposure",
        header: "FCY Exposure",
        cell: ({ getValue }) => (
          <span>{(getValue() as number).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "exposure_header_id",
        header: "System Transaction ID",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "rate",
        header: "Rate",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "lcyExposure",
        header: "LCY Exposure",
        cell: ({ getValue }) => (
          <span>{(getValue() as number).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "maturity",
        header: "Maturity",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "pctToHedge",
        header: "% to Hedge",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "hedged",
        header: "Hedged",
        cell: ({ getValue }) => (
          <span>{(getValue() as number).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "available",
        header: "Available",
        cell: ({ getValue }) => (
          <span>{(getValue() as number).toLocaleString()}</span>
        ),
      },
    ],
    [expandedRowId]
  );

  const defaultColumnVisibility: Record<string, boolean> = {
    select: true,
    action: false,
    bu: true,
    type: true,
    currency: false,
    fcyExposure: true,
    rate: false,
    lcyExposure: true,
    exposure_header_id: false,
    maturity: false, // hidden by default
    pctToHedge: false, // hidden by default
    hedged: false,
    available: false,
    expand: true,
  };

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);

  const table = useReactTable({
    data: filteredData,
    columns,
    enableRowSelection: true,
    onRowSelectionChange: setSelectedRowIds,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnOrder,
      rowSelection: selectedRowIds,
      columnVisibility,
    },
  });

  useEffect(() => {
    const selectedRows = table.getSelectedRowModel().rows;

    if (selectedRows.length === 1) {
      const row = selectedRows[0].original;

      if (onSelectExposureHeaderId && row.exposure_header_id) {
        onSelectExposureHeaderId(row.exposure_header_id);
      }

      if (onEditHedged && typeof row.hedged === "number") {
        onEditHedged(row.hedged);
      }
    }
  }, [selectedRowIds, onSelectExposureHeaderId, onEditHedged]);

  const selectedRows = table.getSelectedRowModel().rows;

  const totalFcyExposure = selectedRows.reduce(
    (sum, row) => sum + (row.original.fcyExposure || 0),
    0
  );
  const totalLcyExposure = selectedRows.reduce(
    (sum, row) => sum + (row.original.lcyExposure || 0),
    0
  );

  return (
    <div className="w-full space-y-4 pt-6">
      <h2 className="text-2xl font-bold text-secondary-text pl-4">
        UnLinked Exposure
      </h2>

      <div className="shadow-lg border border-border rounded-lg max-h-[400px] overflow-auto">
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <table className="min-w-[800px] w-full table-auto max-h-[400px] overflow-auto">
            <thead className="bg-secondary-color rounded-xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isDraggable = !nonDraggableColumns.includes(
                      header.column.id
                    );

                    return (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border sticky top-0 bg-secondary-color z-1"
                        style={{ width: header.getSize() }}
                      >
                        {isDraggable ? (
                          <Droppable id={header.column.id}>
                            <Draggable id={header.column.id}>
                              <div className="cursor-move rounded py-1">
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
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No Data Available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className={
                        row.index % 2 === 0
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

                    {/* Enhanced expanded editable row */}
                    {expandedRowId === row.id && (
                      <tr key={`${row.id}-expanded`}>
                        <td
                          colSpan={table.getVisibleLeafColumns().length}
                          className="px-6 py-4 bg-primary-md"
                        >
                          <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
                            <div className="flex justify-end mb-4">
                              <button
                                onClick={() => {
                                  if (isEditing) {
                                    setIsSaving(true);
                                    setTimeout(() => {
                                      setData((prev) =>
                                        prev.map((item, idx) =>
                                          idx === row.index
                                            ? { ...item, ...editValues }
                                            : item
                                        )
                                      );
                                      setIsEditing(false);
                                      setIsSaving(false);
                                      if (
                                        onEditHedged &&
                                        typeof editValues.hedged === "number"
                                      ) {
                                        onEditHedged(editValues.hedged);
                                      }
                                    }, 500);
                                  } else {
                                    setEditValues(row.original);
                                    setIsEditing(true);
                                  }
                                }}
                                className="bg-primary text-white px-4 py-1 rounded shadow hover:bg-primary-dark disabled:opacity-60"
                                disabled={isSaving}
                              >
                                {isEditing
                                  ? isSaving
                                    ? "Saving..."
                                    : "Save"
                                  : "Edit"}
                              </button>
                            </div>
                            <div className="mb-6">
                              <div className="font-semibold mb-2 text-primary-lt">
                                Forward Contract Details
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {(
                                  [
                                    "bu",
                                    "type",
                                    "currency",
                                    "maturity",
                                  ] as (keyof AvailableForwardsData)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    isEditing && key === "hedged"
                                      ? editValues[key]
                                      : row.original[key],
                                    row.original[key],
                                    isEditing && key === "hedged" // Editable only if key is 'hedged' and isEditing is true
                                  )
                                )}
                              </div>
                            </div>
                            <div className="mb-6">
                              <div className="font-semibold mb-2 text-primary-lt">
                                Amount Details
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {(
                                  [
                                    "rate",
                                    "pctToHedge",
                                    "hedged",
                                    "available",
                                  ] as (keyof AvailableForwardsData)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    isEditing && key === "hedged"
                                      ? editValues[key]
                                      : row.original[key],
                                    row.original[key],
                                    isEditing && key === "hedged" // Editable only if key is 'hedged' and isEditing is true
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold sticky bottom-0 z-10">
              <tr>
                {table.getVisibleLeafColumns().map((col) => (
                  <td
                    key={col.id}
                    className="px-6 py-2 text-sm text-start border-t border-border "
                  >
                    {{
                      select: "Total",
                      fcyExposure: totalFcyExposure,
                      lcyExposure: totalLcyExposure,
                    }[col.id] ?? null}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </DndContext>
      </div>
    </div>
  );
};

export default UnlinkedExposure;
