import React, { useState, useMemo, useEffect } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import Pagination from "../../ui/Pagination";
import Button from "../../ui/Button";
import { useNotification } from "../../Notification/Notification";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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

const nonDraggableColumns = ["expand", "action", "select"];

const TransactionTable: React.FC = () => {
  const { notify, confirm } = useNotification();
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  // const [data, setData] = useState<Transaction[]>(mockTransactionData);
  const [data, setData] = useState<Transaction[]>([]);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    
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
    "action",
    "expand",
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState<Transaction>({} as Transaction);

  // Helper function to get changed fields
  const getChangedFields = (original: Transaction, edited: Transaction): Record<string, any> => {
    const changes: Record<string, any> = {};
    
    // Map camelCase to snake_case for API
    const fieldMapping: Record<string, string> = {
      orderType: 'order_type',
      transactionType: 'transaction_type',
      modeOfDelivery: 'mode_of_delivery',
      deliveryPeriod: 'delivery_period',
      settlementDate: 'settlement_date',
      maturityDate: 'maturity_date',
      deliveryDate: 'delivery_date',
      spotRate: 'spot_rate',
      forwardPoints: 'forward_points',
      bankMargin: 'bank_margin',
      totalRate: 'total_rate',
      inputValue: 'booking_amount',
      valueType: 'value_type',
      internalDealer: 'internal_dealer',
      counterpartyDealer: 'counterparty_dealer',
      bankTransactionId: 'bank_transaction_id',
      swiftUniqueId: 'swift_unique_id',
      bankConfirmationDate: 'bank_confirmation_date',
      status: 'processing_status',
      entityLevel0: 'entity_level_0',
      entityLevel1: 'entity_level_1',
      entityLevel2: 'entity_level_2',
      entityLevel3: 'entity_level_3',
      localCurrency: 'local_currency',
      currencyPair: 'currency_pair',
      baseCurrency: 'base_currency',
      quoteCurrency: 'quote_currency',
      actualValueBaseCurrency: 'actual_value_base_currency',
      valueQuoteCurrency: 'value_quote_currency',
      interveningRateQuoteToLocal: 'intervening_rate_quote_to_local',
      valueLocalCurrency: 'value_local_currency',
      counterparty: 'counterparty',
      remarks: 'remarks',
      narration: 'narration'
    };

    // Check for changed fields
    Object.keys(edited).forEach(key => {
      const originalValue = original[key as keyof Transaction];
      const newValue = edited[key as keyof Transaction];
      
      if (originalValue !== newValue) {
        const apiKey = fieldMapping[key] || key;
        changes[apiKey] = newValue;
      }
    });

    return changes;
  };

  // Handle forward edit operations
  const handleForwardEditToggle = async (row: any) => {
    if (isEditing) {
      const changedFields = getChangedFields(row.original, editValues);
      if (Object.keys(changedFields).length === 0) {
        setIsEditing(false);
        return;
      }

      try {
        setIsSaving(true);
        console.log("Sending update payload:", changedFields);

        // Make PATCH request to update forward
        const response = await axios.post(
          `https://backend-slqi.onrender.com/api/forwards/${row.original.systemTransactionId}/update`,
          changedFields,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        console.log("Update response:", response.data);

        if (response.data?.success || response.status === 200) {
          // Update local data
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index
                ? { ...item, ...editValues }
                : item
            )
          );
          
          setIsEditing(false);
          notify("Forward updated successfully!", "success");
        } else {
          throw new Error(response.data?.message || "Update failed");
        }
      } catch (error) {
        console.error("Forward update error:", error);
        notify("An error occurred while updating the forward.", "error");
        // Don't exit edit mode on error
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as Transaction);
      }
    } else {
      setEditValues({ ...row.original });
      setIsEditing(true);
    }
  };

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
    originalValue: any,
    isFieldEditable: boolean = false
  ) => {
    const nonEditableFields = [
      "systemTransactionId",
      "transactionTimestamp",
      "addDate",
      "baseCurrency",
      "quoteCurrency",
      "currencyPair",
      "actualValueBaseCurrency",
      "valueLocalCurrency",
      "valueQuoteCurrency",
    ];

    const isEditable = !nonEditableFields.includes(key) && isFieldEditable;

    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-bold text-secondary-text capitalize">
          {key.replace(/([A-Z])/g, " $1").trim()}
        </label>
        {isEditing && isEditable ? (
          <>
            <input
              className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
              value={String(value ?? "")}
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
              Old: {String(originalValue ?? "—")}
            </span>
          </>
        ) : (
          <span className="font-medium text-primary-lt">
            {key === "transactionTimestamp"
              ? new Date(value).toLocaleString()
              : typeof value === "number"
              ? value.toLocaleString()
              : String(value ?? "—")}
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
          <div className="flex items-center justify-center gap-1">
            <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-red-600 hover:bg-blue-100">
              <Trash2 className="w-4 h-4" />
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
    action: true,
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
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
      notify("Please select at least one transaction to update.", "warning");
      return;
    }

    const confirmation = await confirm(
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
        notify(`Successfully ${status.toLowerCase()} transactions.`, "success");

        setData((prevData) =>
          prevData.map((row) =>
            selectedSystemTransactionIds.includes(row.systemTransactionId)
              ? { ...row, status }
              : row
          )
        );

        setSelectedRowIds({});
      } else {
        notify("Status update failed. Please try again.", "error");
      }
    } catch (error) {
      console.error("Status update error:", error);
      notify("An error occurred while updating status.", "error");
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

  // Calculate pagination values
  const pagination = table.getState().pagination;
  const totalItems = data.length;
  const startIndex = pagination.pageIndex * pagination.pageSize + 1;
  const endIndex = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalItems
  );
  const currentPageItems = table.getRowModel().rows.length;

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
                            {/* Edit/Save Button */}
                            <div className="flex justify-end mb-4">
                              <button
                                onClick={() => handleForwardEditToggle(row)}
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
                                    isEditing
                                      ? editValues[key] ?? row.original[key]
                                      : row.original[key],
                                    row.original[key],
                                    isEditing && ["orderType", "transactionType", "counterparty", "status"].includes(key)
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
                                    isEditing
                                      ? editValues[key] ?? row.original[key]
                                      : row.original[key],
                                    row.original[key],
                                    isEditing
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
                                    isEditing
                                      ? editValues[key] ?? row.original[key]
                                      : row.original[key],
                                    row.original[key],
                                    isEditing && ["spotRate", "forwardPoints", "bankMargin", "totalRate"].includes(key)
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
                                    isEditing
                                      ? editValues[key] ?? row.original[key]
                                      : row.original[key],
                                    row.original[key],
                                    isEditing && ["inputValue", "valueType"].includes(key)
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
                                    isEditing
                                      ? editValues[key] ?? row.original[key]
                                      : row.original[key],
                                    row.original[key],
                                    isEditing && ["settlementDate", "maturityDate", "deliveryDate", "modeOfDelivery", "deliveryPeriod"].includes(key)
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
                                    isEditing
                                      ? editValues[key] ?? row.original[key]
                                      : row.original[key],
                                    row.original[key],
                                    isEditing
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

      {/* Add Pagination Component */}
      <Pagination
        table={table}
        totalItems={totalItems}
        currentPageItems={currentPageItems}
        startIndex={startIndex}
        endIndex={endIndex}
      />
    </div>
  );
};

export default TransactionTable;
