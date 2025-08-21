import React, { useState, useMemo, useEffect } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Receipt,
} from "lucide-react";
import axios from "axios";
import Pagination from "../../ui/Pagination";
import Button from "../../ui/Button";
import { useNotification } from "../../Notification/Notification";
import * as XLSX from "xlsx";
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

type TabVisibility = {
  approve: boolean;
  reject: boolean;
  edit: boolean;
  delete: boolean;
};

const nonDraggableColumns = ["expand", "action", "select"];

const TransactionTable: React.FC = () => {
  const { notify, confirm } = useNotification();
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [data, setData] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [statusFilter, setStatusFilter] = useState("All");

  // Generate available status options from data
  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((transaction) => {
      if (transaction.status) options.add(transaction.status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

  // Filter data based on status filter and search term
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) => {
        return Object.values(item)
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(lowerSearch));
      });
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (item) =>
          item.status &&
          item.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return result;
  }, [data, searchTerm, statusFilter]);

  // Export to Excel functionality
  const exportToExcel = (dataToExport: Transaction[], filename: string) => {
    try {
      // Prepare data for export with readable column names
      const exportData = dataToExport.map((item) => ({
        "System Transaction ID": item.systemTransactionId,
        "Internal Reference ID": item.internalReferenceId,
        "Entity Level 0": item.entityLevel0,
        "Entity Level 1": item.entityLevel1,
        "Entity Level 2": item.entityLevel2,
        "Entity Level 3": item.entityLevel3,
        "Local Currency": item.localCurrency,
        "Order Type": item.orderType,
        "Transaction Type": item.transactionType,
        Counterparty: item.counterparty,
        "Mode of Delivery": item.modeOfDelivery,
        "Delivery Period": item.deliveryPeriod,
        "Add Date": item.addDate,
        "Settlement Date": item.settlementDate,
        "Maturity Date": item.maturityDate,
        "Delivery Date": item.deliveryDate,
        "Currency Pair": item.currencyPair,
        "Base Currency": item.baseCurrency,
        "Quote Currency": item.quoteCurrency,
        "Input Value": item.inputValue,
        "Value Type": item.valueType,
        "Actual Value Base Currency": item.actualValueBaseCurrency,
        "Spot Rate": item.spotRate,
        "Forward Points": item.forwardPoints,
        "Bank Margin": item.bankMargin,
        "Total Rate": item.totalRate,
        "Value Quote Currency": item.valueQuoteCurrency,
        "Intervening Rate Quote to Local": item.interveningRateQuoteToLocal,
        "Value Local Currency": item.valueLocalCurrency,
        "Internal Dealer": item.internalDealer,
        "Counterparty Dealer": item.counterpartyDealer,
        Remarks: item.remarks,
        Narration: item.narration,
        "Transaction Timestamp": item.transactionTimestamp,
        "Bank Transaction ID": item.bankTransactionId,
        "Swift Unique ID": item.swiftUniqueId,
        "Bank Confirmation Date": item.bankConfirmationDate,
        Status: item.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Forwards");

      // Auto-size columns
      const maxWidth = 50;
      const wscols = Object.keys(exportData[0] || {}).map(() => ({
        width: maxWidth,
      }));
      worksheet["!cols"] = wscols;

      XLSX.writeFile(workbook, `${filename}.xlsx`);
      notify("Data exported successfully!", "success");
    } catch (error) {
      console.error("Export error:", error);
      notify("Failed to export data. Please try again.", "error");
    }
  };

  // Refresh functionality
  const handleRefresh = async () => {
    try {
      notify("Refreshing data...", "info");
      const response = await axios.get(
        "https://backend-slqi.onrender.com/api/forwards/forward-bookings/forwardDetails"
      );
      const apiData = response.data?.data ?? [];

      // Transform data (same as in useEffect)
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
      notify("Data refreshed successfully!", "success");
    } catch (error) {
      console.error("Failed to refresh data:", error);
      notify("Failed to refresh data. Please try again.", "error");
    }
  };

  // Helper function to get changed fields
  const getChangedFields = (
    original: Transaction,
    edited: Transaction
  ): Record<string, any> => {
    const changes: Record<string, any> = {};

    // Map camelCase to snake_case for API
    const fieldMapping: Record<string, string> = {
      orderType: "order_type",
      transactionType: "transaction_type",
      modeOfDelivery: "mode_of_delivery",
      deliveryPeriod: "delivery_period",
      settlementDate: "settlement_date",
      maturityDate: "maturity_date",
      deliveryDate: "delivery_date",
      spotRate: "spot_rate",
      forwardPoints: "forward_points",
      bankMargin: "bank_margin",
      totalRate: "total_rate",
      inputValue: "booking_amount",
      valueType: "value_type",
      internalDealer: "internal_dealer",
      counterpartyDealer: "counterparty_dealer",
      bankTransactionId: "bank_transaction_id",
      swiftUniqueId: "swift_unique_id",
      bankConfirmationDate: "bank_confirmation_date",
      status: "processing_status",
      entityLevel0: "entity_level_0",
      entityLevel1: "entity_level_1",
      entityLevel2: "entity_level_2",
      entityLevel3: "entity_level_3",
      localCurrency: "local_currency",
      currencyPair: "currency_pair",
      baseCurrency: "base_currency",
      quoteCurrency: "quote_currency",
      actualValueBaseCurrency: "actual_value_base_currency",
      valueQuoteCurrency: "value_quote_currency",
      interveningRateQuoteToLocal: "intervening_rate_quote_to_local",
      valueLocalCurrency: "value_local_currency",
      counterparty: "counterparty",
      remarks: "remarks",
      narration: "narration",
    };

    // Check for changed fields
    Object.keys(edited).forEach((key) => {
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
        // console.log("Sending update payload:", changedFields);

        // Make PATCH request to update forward
        const response = await axios.post(
          `https://backend-slqi.onrender.com/api/forwards/${row.original.systemTransactionId}/update`,
          changedFields,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // console.log("Update response:", response.data);

        if (response.data?.success || response.status === 200) {
          // Update local data
          setData((prev) =>
            prev.map((item, idx) =>
              idx === row.index ? { ...item, ...editValues } : item
            )
          );

          setIsEditing(false);
          notify("Forward updated successfully!", "success");
        } else {
          throw new Error(response.data?.message || "Update failed");
        }
      } catch (error) {
        // console.error("Forward update error:", error);
        notify("An error occurred while updating the forward.", "error");
        // Don't exit edit mode on error
        return;
      } finally {
        setIsSaving(false);
        setEditValues({} as Transaction);
      }
    } else {
      // Initialize edit values with calculated total rate
      const initialValues = {
        ...row.original,
        totalRate: calculateTotalRate(row.original),
      };
      setEditValues(initialValues);
      setIsEditing(true);
    }
  };

  // Handle forward delete operations
  const handleForwardDelete = async () => {
    const selectedSystemTransactionIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.systemTransactionId);

    if (selectedSystemTransactionIds.length === 0) {
      notify("Please select at least one transaction to delete.", "warning");
      return;
    }

    const confirmation = await confirm(
      `Are you sure you want to delete ${selectedSystemTransactionIds.length} selected transaction(s)?`
    );
    if (!confirmation) return;

    try {
      // Prepare delete payload with array of selected system IDs
      const deletePayload = {
        system_transaction_ids: selectedSystemTransactionIds, // Array of selected IDs
      };

      // console.log("Sending delete payload:", deletePayload);

      // Make API call to delete/update the exposures
      const response = await axios.post(
        `https://backend-slqi.onrender.com/api/forwards/bulk-delete`,
        deletePayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // console.log(response.data);

      // console.log("Delete response:", response.data);

      if (response.data?.success || response.status === 200) {
        // Remove the transactions from local data
        setData((prev) =>
          prev.filter(
            (item) =>
              !selectedSystemTransactionIds.includes(item.systemTransactionId)
          )
        );

        // Clear selection
        setSelectedRowIds({});

        notify(
          `Successfully deleted ${selectedSystemTransactionIds.length} transaction(s)!`,
          "success"
        );
      } else {
        throw new Error(response.data?.message || "Delete failed");
      }
    } catch (error) {
      // console.error("Delete error:", error);
      notify("An error occurred while deleting the transactions.", "error");
    }
  };

  const [Visibility, setVisibility] = useState<TabVisibility>({
    approve: false,
    reject: false,
    edit: false,
    delete: false,
  });
  // const [isLoading, setIsLoading] = useState(true);

  const roleName = localStorage.getItem("userRole");

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        // setIsLoading(true);
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionjson",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["forward-confirmation"]?.tabs;

        if (userTabs) {
          setVisibility({
            approve: userTabs.pendingForward.showApproveButton || false,
            reject: userTabs.pendingForward.showRejectButton || false,
            edit: userTabs.pendingForward.showEditButton || false,
            delete: userTabs.pendingForward.showDeleteButton || false,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        // setIsLoading(false);
      }
    };

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
        // console.error("Failed to fetch transactions:", error);
      }
    };

    fetchPermissions();
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
        <label className="font-semibold text-sm text-secondary-text capitalize">
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
              step={typeof originalValue === "number" ? "0.0001" : undefined}
              onChange={(e) => {
                const newValue =
                  typeof originalValue === "number"
                    ? parseFloat(e.target.value) || 0
                    : e.target.value;

                // Create updated values object
                const updatedValues = {
                  ...editValues,
                  [key]: newValue,
                };

                // If the changed field affects total rate, recalculate it
                if (
                  [
                    "spotRate",
                    "forwardPoints",
                    "bankMargin",
                    "orderType",
                  ].includes(key)
                ) {
                  updatedValues.totalRate = calculateTotalRate(updatedValues);
                }

                setEditValues(updatedValues);
              }}
            />
            <span className="text-xs text-gray-500">
              Old: {String(originalValue ?? "—")}
            </span>
          </>
        ) : (
          <span className="font-medium text-sm text-primary-lt">
            {key === "transactionTimestamp"
              ? new Date(value).toLocaleString()
              : typeof value === "number"
              ? key === "totalRate"
                ? Number(value).toFixed(4)
                : value.toLocaleString()
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
            className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-primary-lt focus:ring-2"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-primary w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-primary-lt focus:ring-2"
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            {Visibility.delete && (
              <button
                onClick={() => handleForwardDelete()}
                className="flex items-center gap-1 px-2 py-2 text-xs font-semibold rounded text-red-600 hover:bg-primary-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
      {
        accessorKey: "systemTransactionId",
        header: "System TX ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "internalReferenceId",
        header: "Internal Ref ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
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
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "currencyPair",
        header: "Currency Pair",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "inputValue",
        header: "Input Value",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {(getValue() as number).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "spotRate",
        header: "Spot Rate",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {(getValue() as number).toFixed(4)}
          </span>
        ),
      },
      {
        accessorKey: "totalRate",
        header: "Total Rate",
        cell: ({ getValue, row }) => {
          // If we're editing this row, show the calculated total rate
          const value =
            expandedRowId === row.id && isEditing
              ? editValues.totalRate || calculateTotalRate(editValues)
              : (getValue() as number);

          return (
            <span className="font-semibold">
              {value ? value.toFixed(4) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "settlementDate",
        header: "Settlement Date",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
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

          const normalized = rawStatus.trim().toLowerCase();

          const statusColors: Record<string, string> = {
            approved: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
            inactive: "bg-gray-200 text-gray-700",
          };

          const toPascalCase = (str: string) =>
            str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[normalized] || "bg-gray-100 text-gray-800"
              }`}
            >
              {toPascalCase(normalized)}
            </span>
          );
        },
      },
      {
        accessorKey: "counterparty",
        header: "Counterparty",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "internalDealer",
        header: "Internal Dealer",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
    ],
    [expandedRowId, isEditing, editValues]
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
    counterparty: true,
    internalDealer: false,
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

    // console.log("Selected IDs:", selectedSystemTransactionIds);

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
        console.log("Status update response:", response.data);

        setSelectedRowIds({});
      } else {
        notify("Status update failed. Please try again.", "error");
      }
    } catch (error) {
      // console.error("Status update error:", error);
      notify("An error occurred while updating status.", "error");
    }
  };

  const pagination = table.getState().pagination;
  const totalItems = filteredData.length;
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

  // Add the calculateTotalRate function
  const calculateTotalRate = (values: Transaction) => {
    const { orderType, spotRate, forwardPoints, bankMargin } = values;
    if (orderType === "Buy") {
      return (spotRate || 0) + (forwardPoints || 0) + (bankMargin || 0);
    } else if (orderType === "Sell") {
      return (spotRate || 0) + (forwardPoints || 0) - (bankMargin || 0);
    }
    return values.totalRate || 0;
  };

  return (
    <div className="w-full space-y-4">
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text">
            Status
          </label>
          <select
            className="border border-border rounded-md px-3 py-2 focus:outline-none bg-secondary-color text-secondary-text"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        <div className="col-span-1 md:col-span-4 flex items-center justify-end gap-4">
          {/* Download Button */}
          <button
            type="button"
            className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
            title="Download All Forwards"
            onClick={() => exportToExcel(filteredData, "Pending_Forwards")}
          >
            <Download className="flex item-center justify-center text-primary group-hover:text-white" />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            className="text-primary group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
            title="Refresh"
            onClick={handleRefresh}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              className="accent-primary"
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>

          {/* Search Field */}
          <form
            className="relative flex items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              placeholder="Search"
              className="w-full text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none hover:border hover:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"
              tabIndex={-1}
              aria-label="Search"
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                className="text-primary"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="flex items-center py-1.5 justify-end">
        <div className="flex items-center gap-2 min-w-[12rem]">
          {Visibility.approve && (
            <Button onClick={() => handleStatusUpdate("Approved")}>
              Approve
            </Button>
          )}
          {Visibility.reject && (
            <Button color="Green" onClick={() => handleStatusUpdate("Rejected")}>
              Reject
            </Button>
          )}
        </div>

        {/* Search Results Info */}
{/*         {searchTerm && (
          <div className="text-sm text-gray-600">
{/*             Found {filteredData.length} result(s) for "{searchTerm}" */}
        //     <button
        //       onClick={() => setSearchTerm("")}
        //       className="ml-2 text-primary hover:underline"
        //     >
        //       Clear
        //     </button>
        //   </div>
        // )} */}
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
                        <Receipt className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-xl font-medium text-primary mb-1">
                        No Transactions Available
                      </p>
                    </div>
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
                          className="px-6 py-4 text-secondary-text-dark font-normal whitespace-nowrap text-sm border-b border-border"
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
                            {Visibility.edit && (
                              <div className="flex justify-end mb-4">
                                <div>
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
                                </div>
                              </div>
                            )}

                            {/* Basic Information */}
                            <div className="mb-6">
                              <div className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
                                Basic Information
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
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
                                    isEditing &&
                                      [
                                        "orderType",
                                        "transactionType",
                                        "counterparty",
                                        "status",
                                      ].includes(key)
                                  )
                                )}
                              </div>
                            </div>

                            {/* Entity Hierarchy */}
                            <div className="mb-6">
                              <div className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
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
                              <div className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
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
                                    isEditing &&
                                      [
                                        "spotRate",
                                        "forwardPoints",
                                        "bankMargin",
                                        "totalRate",
                                      ].includes(key)
                                  )
                                )}
                              </div>
                            </div>

                            {/* Values */}
                            <div className="mb-6">
                              <div className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
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
                                    isEditing &&
                                      ["inputValue", "valueType"].includes(key)
                                  )
                                )}
                              </div>
                            </div>

                            {/* Dates & Settlement */}
                            <div className="mb-6">
                              <div className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
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
                                    isEditing &&
                                      [
                                        "settlementDate",
                                        "maturityDate",
                                        "deliveryDate",
                                        "modeOfDelivery",
                                        "deliveryPeriod",
                                      ].includes(key)
                                  )
                                )}
                              </div>
                            </div>

                            {/* Additional Details */}
                            <div className="mb-6">
                              <div className="text-md font-medium text-primary mb-3 border-b border-primary-md pb-2">
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
      <div className="pt-2">
        <Pagination
          table={table}
          totalItems={totalItems}
          currentPageItems={currentPageItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>
    </div>
  );
};

export default TransactionTable;
