import React, { useState, useMemo, useEffect, useRef } from "react";
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
import Button from "../../ui/Button";

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
  edit: boolean;
  selectedSystemTransactionId: string | null;
  setSelectedSystemTransactionId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  setEntityOptions: React.Dispatch<
    React.SetStateAction<{ value: string; label: string }[]>
  >;
  setCurrencyOptions?: React.Dispatch<
    React.SetStateAction<{ value: string; label: string }[]>
  >;
}

const nonDraggableColumns = ["expand", "select"];

const AvailableForward: React.FC<TableProps> = ({
  filters,
  setEntityOptions,
  selectedSystemTransactionId,
  setSelectedSystemTransactionId,
  setCurrencyOptions,
  edit,
}) => {
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
  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);

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
      system_transaction_id: item.system_transaction_id, // Assuming this is the correct field
      available: parseFloat(item.amount) - item.linked_amount,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        "https://backend-slqi.onrender.com/api/exposureUpload/expfwdLinkingBookings"
      );
      const transformed = transformApiData(response.data);
      setData(transformed);

      // Extract unique banks for bank filter
      const uniqueBanks = Array.from(
        new Set(response.data.map((item: any) => item.Bank))
      );
      const bankOptions = uniqueBanks.map((bank: string) => ({
        value: bank,
        label: bank,
      }));

      // Extract unique currencies for currency filter
      const uniqueCurrencies = Array.from(
        new Set(response.data.map((item: any) => item.currency))
      );
      const currencyOptions = uniqueCurrencies.map((currency: string) => ({
        value: currency,
        label: currency,
      }));

      setEntityOptions([{ value: "", label: "Select" }, ...bankOptions]);

      // Set currency options if the setter is provided
      if (setCurrencyOptions) {
        setCurrencyOptions([
          { value: "", label: "Select" },
          ...currencyOptions,
        ]);
      }
    };

    fetchData();
  }, [setEntityOptions, setCurrencyOptions]);

  // Ensure proper scroll behavior and prevent page scrolling
  useEffect(() => {
    if (tableContainerRef.current) {
      // Prevent any unwanted scroll behavior
      const container = tableContainerRef.current;
      container.style.overscrollBehavior = "contain";
      container.style.scrollBehavior = "smooth";

      // Prevent scroll events from bubbling up
      const preventScrollBubble = (e: Event) => {
        e.stopPropagation();
      };

      container.addEventListener("scroll", preventScrollBubble, {
        passive: false,
      });
      container.addEventListener("wheel", preventScrollBubble, {
        passive: false,
      });

      return () => {
        container.removeEventListener("scroll", preventScrollBubble);
        container.removeEventListener("wheel", preventScrollBubble);
      };
    }
  }, []);

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

    // Currency filter - exact match
    if (filters?.currency) {
      result = result.filter((item) => item.currency === filters.currency);
    }

    // Bank filter - exact match (case insensitive)
    if (filters?.bank) {
      result = result.filter(
        (item) => item.bank.toLowerCase() === filters.bank.toLowerCase()
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
  }, [data, filters]);

  const renderField = (
    key: keyof LinkedSummaryData,
    value: any,
    originalValue: any
  ) => {
    const isEditable = true;
    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-semibold text-sm text-secondary-text capitalize">
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
          <span className="font-medium text-sm text-primary-lt">
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(false);
              setIsSaving(false);
              const newExpandedId = expandedRowId === row.id ? null : row.id;
              setExpandedRowId(newExpandedId);
              if (newExpandedId) {
                // Small delay to ensure the expanded content is rendered
                setTimeout(() => {
                  const rowElement = rowRefs.current[row.id];
                  if (rowElement && tableContainerRef.current) {
                    // Use the table container ref for reliable scrolling
                    const tableContainer = tableContainerRef.current;

                    // Get the row's position relative to the container
                    const rowTop = rowElement.offsetTop;

                    // Get the header height to calculate the exact position below it
                    const headerElement = tableContainer.querySelector("thead");
                    const headerHeight = headerElement
                      ? headerElement.offsetHeight
                      : 0;

                    // Calculate the target scroll position to place the row right below the header
                    // We want the row to appear exactly below the sticky header
                    const targetScrollTop = Math.max(
                      0,
                      rowTop - headerHeight - 2
                    ); // 2px for perfect visual spacing

                    // Smooth scroll within the container only
                    tableContainer.scrollTo({
                      top: targetScrollTop,
                      behavior: "smooth",
                    });
                  }
                }, 50); // 50ms delay to ensure DOM updates
              }
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
            className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
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
        accessorKey: "system_transaction_id",
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
      setSelectedSystemTransactionId(
        selectedRows[0].original.system_transaction_id
      );
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
    <div className="w-full space-y-4 pt-6 overflow-hidden">
      <h2 className="text-2xl font-bold text-secondary-text pl-4">
        Available Forward
      </h2>

      <div
        ref={tableContainerRef}
        className="shadow-lg border border-border rounded-lg max-h-[500px] overflow-auto scroll-smooth relative"
        style={{ scrollBehavior: "smooth" }}
      >
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
                        className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border sticky top-0 bg-secondary-color z-10"
                        style={{ width: header.getSize() }}
                      >
                        {isDraggable ? (
                          <Droppable id={header.column.id}>
                            <Draggable id={header.column.id}>
                              <div className="cursor-move border-border text-header-color hover:bg-primary-lg rounded px-1 py-1 transition duration-150 ease-in-out">
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
                      <p className="text-lg font-medium text-primary mb-1">
                        No Data available
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      ref={(el) => {
                        rowRefs.current[row.id] = el;
                      }}
                      className={`${
                        row.index % 2 === 0
                          ? "bg-primary-md"
                          : "bg-secondary-color-lt"
                      } ${
                        expandedRowId === row.id
                          ? "ring-2 ring-primary ring-opacity-50 shadow-md"
                          : ""
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 text-secondary-text-dark whitespace-nowrap text-sm border-b border-border"
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
                              {edit && (
                                <div>
                                  <Button
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
                                    color={isEditing ? "Green" : "Fade"} // dynamic color
                                    disabled={isSaving} // disables while saving
                                  >
                                    {isSaving
                                      ? "Saving..."
                                      : isEditing
                                      ? "Save"
                                      : "Edit"}
                                  </Button>
                                </div>
                              )}
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
            <tfoot className="bg-primary font-semibold sticky bottom-0 z-10">
              <tr>
                {table.getVisibleLeafColumns().map((col) => (
                  <td
                    key={col.id}
                    className="px-6 py-2 text-white text-sm text-start border-t border-border"
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
