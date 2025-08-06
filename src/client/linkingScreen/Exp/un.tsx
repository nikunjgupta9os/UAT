import React, { useState, useMemo, useEffect } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Pencil, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { it } from "date-fns/locale";
// import type AvailableForwards from "../availableForwards";

type LinkedSummaryData = {
  bank: string;
  fwdType: string;
  maturity: string;
  currency: string;
  fcyAmt: number;
  rate: number;
  lcyAmt: number;
  linked: number;
  system_transaction_id: string;
  available: number;
};

interface TableProps {
  filters: {
    businessUnit: string;
    currency: string;
    type: string;
    bank: string;
    maturityMonths: string;
  };
  selectedSystemTransactionId: string | null;
  setSelectedSystemTransactionId: React.Dispatch<React.SetStateAction<string | null>>;

  setEntityOptions: React.Dispatch<React.SetStateAction<{ value: string; label: string }[]>>;
}


const nonDraggableColumns = ["expand", "select"];


const AvailableForward: React.FC<TableProps> = ({ filters , setEntityOptions, selectedSystemTransactionId, setSelectedSystemTransactionId,}) => {
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [data, setData] = useState<LinkedSummaryData[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "action",
    "bank",
    "fwdType",
    "maturity",
    "currency",
    "fcyAmt",
    "rate",
    "lcyAmt",
    "system_transaction_id",
    "linked",
    "available",
    "expand",
  ]);

  // New state for editing functionality
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<LinkedSummaryData>(
    {} as LinkedSummaryData
  );

  
  const transformApiData = (apiData: any[]): LinkedSummaryData[] => {
    return apiData.map((item) => ({
      bank: item.Bank,
      fwdType: "—", // Assuming not available in API
      maturity: item.maturity_date.split("T")[0], // trim to YYYY-MM-DD
      currency: item.currency,
      fcyAmt: parseFloat(item.amount),
      rate: 0, // Placeholder if not available
      lcyAmt: 0, // Placeholder if not available
      linked: item.linked_amount,
      system_transaction_id : item.system_transaction_id, // Assuming this is the correct field
      available: parseFloat(item.amount) - item.linked_amount,
    }));
  };
  

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get("https://backend-slqi.onrender.com/api/exposureUpload/expfwdLinkingBookings");
      const transformed = transformApiData(response.data);
      setData(transformed);

      
      const uniqueBanks = Array.from(new Set(response.data.map((item: any) => item.Bank)));
      const bankOptions = uniqueBanks.map((bank: string) => ({
        value: bank,
        label: bank,
      }));

     

      setEntityOptions([{ value: "", label: "Select" }, ...bankOptions]);
    };

    fetchData();
  }, [setEntityOptions]);



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

  const filteredData = useMemo(() => {
    let result = [...data];

    // Currency filter
    if (filters?.currency) {
      result = result.filter((item) => item.currency === filters.currency);
    }

    // Bank filter (case insensitive)
    if (filters?.bank) {
      const lowerBank = filters.bank.toLowerCase();
      result = result.filter((item) =>
        item.bank.toLowerCase().includes(lowerBank)
      );
    }

    // Maturity months filter
    if (filters?.maturityMonths) {
      try {
        const monthsThreshold = parseInt(filters.maturityMonths);
        if (!isNaN(monthsThreshold)) {
          result = result.filter((item) => {
            const maturityDate = new Date(item.maturity);
            if (isNaN(maturityDate.getTime())) return false;

            const currentDate = new Date();
            const monthsDiff =
              (maturityDate.getFullYear() - currentDate.getFullYear()) * 12 +
              (maturityDate.getMonth() - currentDate.getMonth());

            return monthsDiff < monthsThreshold;
          });
        }
      } catch (e) {
        console.error("Error processing maturity filter:", e);
      }
    }
    return result;
  }, [data]);

  

  const renderField = (
    key: keyof LinkedSummaryData,
    value: any,
    originalValue: any
  ) => {
    const isEditable = true;
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
            {String(value ?? "—")}
          </span>
        )}
      </div>
    );
  };

  const columns = useMemo<ColumnDef<LinkedSummaryData>[]>(
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
                setEditValues({} as LinkedSummaryData);
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
          <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-blue-600 hover:bg-blue-100">
            <Pencil className="w-4 h-4" />
          </button>
        ),
      },
      {
        accessorKey: "bank",
        header: "Bank",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "fwdType",
        header: "Fwd Type",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "maturity",
        header: "Maturity",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey:"system_transaction_id",
        header: "System Transaction ID",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "fcyAmt",
        header: "FCY Amt",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "rate",
        header: "Rate",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "lcyAmt",
        header: "LCY Amt",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "linked",
        header: "Linked",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "available",
        header: "Available",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
    ],
    [expandedRowId]
  );

  const defaultColumnVisibility: Record<string, boolean> = {
    expand: true,
    select: true,
    action: false,
    bank: true,
    fwdType: false,
    maturity: false,
    currency: true,
    fcyAmt: true,
    rate: true,
    system_transaction_id: false, // hidden by default
    lcyAmt: true,
    linked: false,
    available: false, // hidden by default
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
      setSelectedSystemTransactionId(selectedRows[0].original.system_transaction_id);
    }
  }, [selectedRowIds, setSelectedSystemTransactionId]);
  


  const selectedRows = table.getSelectedRowModel().rows;

  const totalFcyAmt = selectedRows.reduce(
    (sum, row) => sum + (row.original.fcyAmt || 0),
    0
  );
  const totalLcyAmt = selectedRows.reduce(
    (sum, row) => sum + (row.original.lcyAmt || 0),
    0
  );

  return (
    <div className="w-full space-y-4 pt-6">
      <h2 className="text-2xl font-bold text-secondary-text pl-4">
        Avaliable Forward
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
                                Additional Details
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {(
                                  [
                                    "fwdType",
                                    "maturity",
                                    "linked",
                                    "available",
                                  ] as (keyof LinkedSummaryData)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    isEditing
                                      ? editValues[key]
                                      : row.original[key],
                                    row.original[key]
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
                    className="px-6 py-2 text-sm text-start border-t border-border"
                  >
                    {{
                      select: "Total",
                      fcyAmt: totalFcyAmt,
                      lcyAmt: totalLcyAmt,
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

export default AvailableForward;
