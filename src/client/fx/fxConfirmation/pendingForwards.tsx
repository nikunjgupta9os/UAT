import React, { useState, useMemo, useEffect } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import Button from "../../ui/Button";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

interface Transaction {
  systemTransactionId: string;
  internalReferenceId: string;
  entityLevel0: string;
  entityLevel1: string;
  entityLevel2: string;
  entityLevel3: string;
  localCurrency: string;
  orderType: string;
  transactionType: string;
  counterparty: string;
  modeOfDelivery: string;
  deliveryPeriod: string;
  addDate: string;
  settlementDate: string;
  maturityDate: string;
  deliveryDate: string;
  currencyPair: string;
  baseCurrency: string;
  quoteCurrency: string;
  inputValue: number;
  valueType: string;
  actualValueBaseCurrency: number;
  spotRate: number;
  forwardPoints: number;
  bankMargin: number;
  totalRate: number;
  valueQuoteCurrency: number;
  interveningRateQuoteToLocal: number;
  valueLocalCurrency: number;
  internalDealer: string;
  counterpartyDealer: string;
  remarks: string;
  narration: string;
  transactionTimestamp: Date;
  bankTransactionId: string;
  swiftUniqueId: string;
  bankConfirmationDate: string;
  status: string;
}

  const formatDateForApi = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

// const mockTransactionData: Transaction[] = [
//   {
//     systemTransactionId: "SYS001",
//     internalReferenceId: "INT001",
//     entityLevel0: "Corporate",
//     entityLevel1: "Treasury",
//     entityLevel2: "FX Desk",
//     entityLevel3: "Spot Trading",
//     localCurrency: "INR",
//     orderType: "Buy",
//     transactionType: "Spot",
//     counterparty: "Bank ABC",
//     modeOfDelivery: "Electronic",
//     deliveryPeriod: "T+2",
//     addDate: "2025-01-15",
//     settlementDate: "2025-01-17",
//     maturityDate: "2025-01-17",
//     deliveryDate: "2025-01-17",
//     currencyPair: "USD/INR",
//     baseCurrency: "USD",
//     quoteCurrency: "INR",
//     inputValue: 100000,
//     valueType: "Actual",
//     actualValueBaseCurrency: 100000,
//     spotRate: 83.25,
//     forwardPoints: 0.15,
//     bankMargin: 0.05,
//     totalRate: 83.45,
//     valueQuoteCurrency: 8345000,
//     interveningRateQuoteToLocal: 1.0,
//     valueLocalCurrency: 8345000,
//     internalDealer: "John Doe",
//     counterpartyDealer: "Jane Smith",
//     remarks: "Regular spot transaction",
//     narration: "Monthly forex requirement",
//     transactionTimestamp: new Date(),
//     bankTransactionId: "BANK123",
//     swiftUniqueId: "SWIFT456",
//     bankConfirmationDate: "2025-01-15",
//     status: "approved",
//   },
// ];

const nonDraggableColumns = ["expand", "select"];

const TransactionTable: React.FC = () => {
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  // const [data, setData] = useState<Transaction[]>(mockTransactionData);
  const [data, setData] = useState<Transaction[]>([]);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "action",
    "systemTransactionId",
    "internalReferenceId",
    "orderType",
    "transactionType",
    "currencyPair",
    "inputValue",
    "spotRate",
    "totalRate",
    "counterparty",
    "settlementDate",
    "status",
    "expand",
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<Transaction>({} as Transaction);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          "https://backend-slqi.onrender.com/api/forwards/forward-bookings/forwardDetails"
        );
        const apiData = response.data?.data ?? [];

        // Map snake_case to camelCase
        const transformedData: Transaction[] = apiData.map((item: any) => ({
          systemTransactionId: item.system_transaction_id,
          internalReferenceId: item.internal_reference_id,
          entityLevel0: item.entity_level_0,
          entityLevel1: item.entity_level_1,
          entityLevel2: item.entity_level_2,
          entityLevel3: item.entity_level_3,
          localCurrency: item.local_currency,
          orderType: item.order_type,
          transactionType: item.transaction_type,
          counterparty: item.counterparty,
          modeOfDelivery: item.mode_of_delivery,
          deliveryPeriod: item.delivery_period,
          addDate: item.add_date,
          settlementDate: formatDateForApi(item.settlement_date),
          maturityDate: formatDateForApi(item.maturity_date),
          deliveryDate: formatDateForApi(item.delivery_date),
          currencyPair: item.currency_pair,
          baseCurrency: item.base_currency,
          quoteCurrency: item.quote_currency,
          inputValue: parseFloat(item.booking_amount),
          valueType: item.value_type,
          actualValueBaseCurrency: parseFloat(item.actual_value_base_currency),
          spotRate: parseFloat(item.spot_rate),
          forwardPoints: parseFloat(item.forward_points),
          bankMargin: parseFloat(item.bank_margin),
          totalRate: parseFloat(item.total_rate),
          valueQuoteCurrency: parseFloat(item.value_quote_currency),
          interveningRateQuoteToLocal: parseFloat(
            item.intervening_rate_quote_to_local
          ),
          valueLocalCurrency: parseFloat(item.value_local_currency),
          internalDealer: item.internal_dealer,
          counterpartyDealer: item.counterparty_dealer,
          remarks: item.remarks,
          narration: item.narration,
          transactionTimestamp: new Date(item.transaction_timestamp),
          bankTransactionId: item.bank_transaction_id || "",
          swiftUniqueId: item.swift_unique_id || "",
          bankConfirmationDate: item.bank_confirmation_date || "",
          status: item.processing_status,
        }));

        setData(transformedData);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
    };

    fetchData();
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

  const renderField = (
    key: keyof Transaction,
    value: any,
    originalValue: any
  ) => {
    const isEditable = ![
      "systemTransactionId",
      "transactionTimestamp",
      "addDate",
      "baseCurrency",
      "quoteCurrency",
      "currencyPair",
      "actualValueBaseCurrency",
      "valueLocalCurrency",
      "valueQuoteCurrency",
    ].includes(key);

    // Use originalValue if editValues doesn't have the key or if not editing
    const displayValue = isEditing
      ? editValues[key] ?? originalValue
      : originalValue;

    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-bold text-secondary-text capitalize">
          {key.replace(/([A-Z])/g, " $1").trim()}
        </label>
        {isEditing && isEditable ? (
          <>
            <input
              className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
              value={String(editValues[key] ?? originalValue ?? "")}
              type={
                typeof originalValue === "number"
                  ? "number"
                  : key.includes("Date")
                  ? "date"
                  : "text"
              }
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
              Original: {String(originalValue ?? "—")}
            </span>
          </>
        ) : (
          <span className="font-medium text-primary-lt">
            {key === "transactionTimestamp"
              ? new Date(displayValue).toLocaleString()
              : String(displayValue ?? "—")}
          </span>
        )}
      </div>
    );
  };

  const columns = useMemo<ColumnDef<Transaction>[]>(
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
                setEditValues({} as Transaction);
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
          </div>
        ),
      },
      {
        accessorKey: "systemTransactionId",
        header: "System TX ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "internalReferenceId",
        header: "Internal Ref ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "orderType",
        header: "Order Type",
        cell: ({ getValue }) => (
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              getValue() === "Buy"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "transactionType",
        header: "TX Type",
        cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue() as string}</span>,
      },
      {
        accessorKey: "currencyPair",
        header: "Currency Pair",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "inputValue",
        header: "Input Value",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{(getValue() as number).toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "spotRate",
        header: "Spot Rate",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">{(getValue() as number).toFixed(4)}</span>
        ),
      },
      {
        accessorKey: "totalRate",
        header: "Total Rate",
        cell: ({ getValue }) => (
          <span className="font-medium font-semibold">
            {(getValue() as number).toFixed(4)}
          </span>
        ),
      },
      {
        accessorKey: "settlementDate",
        header: "Settlement Date",
        cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue() as string}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const rawStatus = info.getValue();
          if (!rawStatus || typeof rawStatus !== "string") {
            return (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                —
              </span>
            );
          }

          const status =
            rawStatus.charAt(0).toUpperCase() +
            rawStatus.slice(1).toLowerCase();
          const statusColors: Record<string, string> = {
            Approved: "bg-green-100 text-green-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Rejected: "bg-red-100 text-red-800",
            Inactive: "bg-gray-200 text-gray-700",
          };

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "counterparty",
        header: "Counterparty",
        cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue() as string}</span>,
      },
      {
        accessorKey: "internalDealer",
        header: "Internal Dealer",
        cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue() as string}</span>,
      },
    ],
    [expandedRowId]
  );

  const defaultColumnVisibility: Record<string, boolean> = {
    select: true,
    action: false,
    systemTransactionId: false,
    internalReferenceId: true,
    orderType: true,
    transactionType: true,
    currencyPair: true,
    inputValue: true,
    spotRate: true,
    totalRate: true,
    settlementDate: true,
    status: true,
    counterparty:true,
    internalDealer: false,
    expand: true,
  };

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(defaultColumnVisibility);

  const table = useReactTable({
    data,
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

  const handleStatusUpdate = async (status: "Approved" | "Rejected") => {
    const selectedSystemTransactionIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.systemTransactionId);

    console.log("Selected IDs:", selectedSystemTransactionIds);

    if (selectedSystemTransactionIds.length === 0) {
      alert("Please select at least one transaction to update.");
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to ${status.toLowerCase()} the selected transaction(s)?`
    );
    if (!confirmation) return;

    try {
      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/forwards/forward-bookings/bulk-update-processing-status",
        {
          system_transaction_ids: selectedSystemTransactionIds,
          processing_status: status,
        }
      );

      if (response.data?.success) {
        alert(`Successfully ${status.toLowerCase()} transactions.`);

        setData((prevData) =>
          prevData.map((row) =>
            selectedSystemTransactionIds.includes(row.systemTransactionId)
              ? { ...row, status }
              : row
          )
        );

        setSelectedRowIds({});
      } else {
        alert("Status update failed. Please try again.");
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("An error occurred while updating status.");
    }
  };

  //  const handleStatusUpdate = async (status: "Approved" | "Rejected") => {
  //   const selectedSystemTransactionIds = data
  //     .filter((row) => selectedRowIds[row.systemTransactionId])
  //     .map((row) => row.systemTransactionId);
  //   console.log("Selected IDs:", selectedSystemTransactionIds);
  //   if (selectedSystemTransactionIds.length === 0) {
  //     alert("Please select at least one transaction to update.");
  //     return;
  //   }

  //   const confirmation = window.confirm(
  //     `Are you sure you want to ${status.toLowerCase()} the selected transaction(s)?`
  //   );

  //   if (!confirmation) return;
  //   console.log("Updating status for:", selectedSystemTransactionIds);
  //   try {
  //     const response = await axios.post(
  //       "https://backend-slqi.onrender.com/api/forwards/forward-bookings/bulk-update-processing-status",
  //       {
  //         system_transaction_ids: selectedSystemTransactionIds,
  //         processing_status: status, // ✅ Corrected key
  //       }
  //     );

  //     if (response.data?.success) {
  //       alert(`Successfully ${status.toLowerCase()} transactions.`);

  //       setData((prevData) =>
  //         prevData.map((row) =>
  //           selectedSystemTransactionIds.includes(row.systemTransactionId)
  //             ? { ...row, status }
  //             : row
  //         )
  //       );

  //       setSelectedRowIds({});
  //     } else {
  //       alert("Status update failed. Please try again.");
  //     }
  //   } catch (error) {
  //     console.error("Status update error:", error);
  //     alert("An error occurred while updating status.");
  //   }
  // };

  const selectedRows = table.getSelectedRowModel().rows;
  const totalInputValue = selectedRows.reduce(
    (sum, row) => sum + (row.original.inputValue || 0),
    0
  );
  const totalBaseValue = selectedRows.reduce(
    (sum, row) => sum + (row.original.actualValueBaseCurrency || 0),
    0
  );

  return (
    <div className="w-full space-y-4 pt-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 min-w-[12rem]">
          <Button onClick={() => handleStatusUpdate("Approved")}>
            Approve
          </Button>
          <Button onClick={() => handleStatusUpdate("Rejected")}>Reject</Button>
        </div>
      </div>

      <div className="shadow-lg border border-border">
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <table className="min-w-[1200px] w-full table-auto">
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
                          className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider borCder-b border-border"
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
                    No Transactions Available
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

                    {/* Expanded editable row */}
                    {expandedRowId === row.id && (
                      <tr key={`${row.id}-expanded`}>
                        <td
                          colSpan={table.getVisibleLeafColumns().length}
                          className="px-6 py-4 bg-primary-md"
                        >
                          <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
                            {/* Basic Information */}
                            <div className="mb-6">
                              <div className="font-semibold mb-2 text-primary-lt">
                                Basic Information
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7    gap-4">
                                {(
                                  [
                                    "systemTransactionId",
                                    "internalReferenceId",
                                    "orderType",
                                    "transactionType",
                                    "counterparty",
                                    "status",
                                  ] as (keyof Transaction)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    row.original[key],
                                    row.original[key]
                                  )
                                )}
                              </div>
                            </div>

                            {/* Entity Hierarchy */}
                            <div className="mb-6">
                              <div className="font-semibold mb-2 text-primary-lt">
                                Entity Hierarchy
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {(
                                  [
                                    "entityLevel0",
                                    "entityLevel1",
                                    "entityLevel2",
                                    "entityLevel3",
                                  ] as (keyof Transaction)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    row.original[key],
                                    row.original[key]
                                  )
                                )}
                              </div>
                            </div>

                            {/* Currency & Rates */}
                            <div className="mb-6">
                              <div className="font-semibold mb-2 text-primary-lt">
                                Currency & Rates
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {(
                                  [
                                    "currencyPair",
                                    "baseCurrency",
                                    "quoteCurrency",
                                    "spotRate",
                                    "forwardPoints",
                                    "bankMargin",
                                    "totalRate",
                                  ] as (keyof Transaction)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    row.original[key],
                                    row.original[key]
                                  )
                                )}
                              </div>
                            </div>

                            {/* Values */}
                            <div className="mb-6">
                              <div className="font-semibold mb-2 text-primary-lt">
                                Values
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {(
                                  [
                                    "inputValue",
                                    "valueType",
                                    "actualValueBaseCurrency",
                                    "valueQuoteCurrency",
                                    "valueLocalCurrency",
                                  ] as (keyof Transaction)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    row.original[key],
                                    row.original[key]
                                  )
                                )}
                              </div>
                            </div>

                            {/* Dates & Settlement */}
                            <div className="mb-6">
                              <div className="font-semibold mb-2 text-primary-lt">
                                Dates & Settlement
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {(
                                  [
                                    "addDate",
                                    "settlementDate",
                                    "maturityDate",
                                    "deliveryDate",
                                    "modeOfDelivery",
                                    "deliveryPeriod",
                                  ] as (keyof Transaction)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    row.original[key],
                                    row.original[key]
                                  )
                                )}
                              </div>
                            </div>

                            {/* Additional Details */}
                            <div className="mb-6">
                              <div className="font-semibold mb-2 text-primary-lt">
                                Additional Details
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                {(
                                  [
                                    "remarks",
                                    "narration",
                                    "internalDealer",
                                    "counterpartyDealer",
                                    "bankTransactionId",
                                    "swiftUniqueId",
                                    "bankConfirmationDate",
                                  ] as (keyof Transaction)[]
                                ).map((key) =>
                                  renderField(
                                    key,
                                    row.original[key],
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
          </table>
        </DndContext>
      </div>
    </div>
  );
};

export default TransactionTable;
