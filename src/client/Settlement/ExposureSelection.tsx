import React, { useEffect, useState, useMemo } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Draggable } from "../common/Draggable";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Droppable } from "../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import type { ColumnDef } from "@tanstack/react-table";
import Layout from "../common/Layout";
import CustomSelect from "../common/SearchSelect";
import Button from "../ui/Button";
import { useNavigate } from "react-router-dom";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

const cURLHOST = "https://backend-slqi.onrender.com/api";

const fallbackRenderVars: IfPayload["renderVars"] = {
  isLoadable: true,
  allExposuresTab: false,
  pendingApprovalTab: true,
  uploadingTab: false,
  btnApprove: false,
  buAccessible: ["Finance", "Sales"],
  pageData: [
    {
      exposure_header_id: "1",
      company_code: "C001",
      entity: "Test Entity",
      entity1: "SubEntity1",
      entity2: "SubEntity2",
      entity3: null,
      exposure_type: "PO",
      document_id: "PO0001",
      document_date: "2025-07-31T00:00:00.000Z",
      counterparty_type: "High",
      counterparty_code: "V001",
      counterparty_name: "Test Vendor",
      currency: "USD",
      total_original_amount: "1000.0000",
      total_open_amount: "1000.0000",
      value_date: "2025-08-31T00:00:00.000Z",
      status: "Open",
      is_active: true,
      created_at: "2025-07-31T00:00:00.000Z",
      updated_at: "2025-07-31T00:00:00.000Z",
      approval_status: "pending",
      approval_comment: null,
      approved_by: null,
      delete_comment: null,
      requested_by: null,
      rejection_comment: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      line_item_id: "line-1",
      line_number: "1",
      product_id: "PROD001",
      product_description: "Test Product",
      quantity: "1.0000",
      unit_of_measure: "PCS",
      unit_price: "1000.0000",
      line_item_amount: "1000.0000",
      plant_code: "P001",
      delivery_date: "2025-08-31T00:00:00.000Z",
      payment_terms: "NET30",
      inco_terms: "FOB",
    },
  ],
};

async function fetchRenderVars(): Promise<IfPayload["renderVars"]> {
  const res = await fetch(`${cURLHOST}/exposureUpload/headers-lineitems`);
  if (!res.ok) throw new Error("Failed to fetch renderVars");
  return res.json();
}

interface Message {
  date: string;
  priority: number;
  deadline: string;
  text: string;
}

interface IfPayload {
  userVars: {
    roleName: string;
    firstName: string;
    secondName: string;
    dateLoggedIn: string;
    timeLoggedIn: string;
    isLoggedIn: boolean;
    userEmailId: string;
    notification: {
      messages: Message[];
    };
  };
  renderVars: {
    isLoadable: boolean;
    allExposuresTab: boolean;
    pendingApprovalTab: boolean;
    uploadingTab: boolean;
    btnApprove: boolean;
    buAccessible: string[];
    pageData: ExposureRequest[];
  };
  userJourney: {
    process: string;
    nextPageToCall: string;
    actionCalledFrom: string;
  };
}

interface ExposureRequest {
  exposure_header_id: string;
  company_code: string | null;
  entity: string;
  entity1: string | null;
  entity2: string | null;
  entity3: string | null;
  exposure_type: string;
  document_id: string;
  document_date: string;
  counterparty_type: "High" | "Medium" | "Low" | null;
  counterparty_code: string | null;
  counterparty_name: string;
  currency: string;
  total_original_amount: string;
  total_open_amount: string;
  value_date: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  approval_status: string;
  approval_comment: string | null;
  approved_by: string | null;
  delete_comment: string | null;
  requested_by: string | null;
  rejection_comment: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  line_item_id: string;
  line_number: string;
  product_id: string;
  product_description: string;
  quantity: string;
  unit_of_measure: string | null;
  unit_price: string;
  line_item_amount: string;
  plant_code: string | null;
  delivery_date: string;
  payment_terms: string | null;
  inco_terms: string | null;
}

type ColumnFilter = {
  id: string;
  value: string;
};

const nonDraggableColumns = ["expand", "select"];

// type TabVisibility = {
//     delete: boolean;
//     view: boolean;
//   };

const ExposureSelection = () => {
  const [renderVars, setRenderVars] = useState<IfPayload["renderVars"] | null>(
    null
  );
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "action",
    "exposure_header_id",
    "company_code",
    "entity",
    "exposure_type",
    "document_id",
    "document_date",
    "counterparty_name",
    "currency",
    "total_original_amount",
    "total_open_amount",
    "value_date",
    "status",
    "approval_status",
    "requested_by",
    "approved_by",
    "rejected_by",
    "approval_comment",
    "rejection_comment",
    "line_item_id",
    "line_number",
    "product_id",
    "product_description",
    "quantity",
    "unit_price",
    "line_item_amount",
    "plant_code",
    "delivery_date",
    "payment_terms",
    "inco_terms",
    "created_at",
    "updated_at",
    "expand",
  ]);

  const renderField = (
    key: keyof ExposureRequest,
    value: any
    // originalValue: any
  ) => {
    return (
      <div key={key} className="flex flex-col space-y-1">
        <label className="font-bold text-secondary-text capitalize">
          {key}
        </label>
        <span className="font-medium text-primary-lt">
          {typeof value === "number"
            ? value.toLocaleString()
            : String(value ?? "—")}
        </span>
      </div>
    );
  };

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<ExposureRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  );
  //   const roleName = localStorage.getItem("userRole");
  //     const [Visibility, setVisibility] = useState<TabVisibility>({
  //       view: true,
  //       delete: true,
  //     });

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((user) => {
      if (user.approval_status) options.add(user.approval_status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply columnFilters (from CustomSelects)
    columnFilters.forEach((filter) => {
      if (filter.value) {
        result = result.filter((item) =>
          (item[filter.id as keyof ExposureRequest] || "")
            .toString()
            .toLowerCase()
            .includes(filter.value.toLowerCase())
        );
      }
    });

    // Apply searchTerm
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) =>
        Object.values(item)
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(lowerSearch))
      );
    }

    // Apply statusFilter
    if (statusFilter !== "All") {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Apply filters from the filters state (e.g., settlementDate, bank)
    // if (filters.settlementDate) {
    //   result = result.filter(
    //     (item) =>
    //       item.value_date &&
    //       new Date(item.value_date).toISOString().slice(0, 10) === filters.settlementDate
    //   );
    // }
    // if (filters.bank) {
    //   result = result.filter(
    //     (item) =>
    //       (item.bank || "")
    //         .toString()
    //         .toLowerCase()
    //         .includes(filters.bank.toLowerCase())
    //   );
    // }

    return result;
  }, [data, searchTerm, statusFilter, columnFilters]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

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

  const [entityOptions, setEntityOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [currencyOptions, setCurrencyOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    setIsLoading(true);

    fetchRenderVars()
      .then((renderVarsRes) => {
        setRenderVars(renderVarsRes);
        if (Array.isArray(renderVarsRes.pageData)) {
          setData(renderVarsRes.pageData);

          // Entity options
          const uniqueEntities = [
            ...new Set(renderVarsRes.pageData.map((item) => item.entity)),
          ].filter(Boolean);

          setEntityOptions(
            uniqueEntities.map((entity) => ({
              label: entity,
              value: entity,
            }))
          );

          // Currency options
          const uniqueCurrencies = [
            ...new Set(renderVarsRes.pageData.map((item) => item.currency)),
          ].filter(Boolean);

          setCurrencyOptions(
            uniqueCurrencies.map((currency) => ({
              label: currency,
              value: currency,
            }))
          );
        } else {
          setData([]);
          setEntityOptions([]);
          setCurrencyOptions([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching renderVars:", err);
        setRenderVars(fallbackRenderVars);
      })
      .finally(() => setIsLoading(false));
  }, []);

  //   useEffect(() => {
  //     setIsLoading(true);

  //     fetchRenderVars()
  //       .then((renderVarsRes) => {
  //         setRenderVars(renderVarsRes);
  //         if (Array.isArray(renderVarsRes.pageData)) {
  //           setData(renderVarsRes.pageData);
  //         } else {
  //           setData([]);
  //         }
  //       })
  //       .catch((err) => {
  //         console.error("Error fetching renderVars:", err);
  //         setRenderVars(fallbackRenderVars);
  //       });
  //   }, []);
  const columns = useMemo<ColumnDef<ExposureRequest>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
          />
        ),
        size: 50,
      },
      {
        accessorKey: "exposure_header_id",
        header: "Exposure ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">
            {getValue() as string}
          </span>
        ),
      },

      {
        accessorKey: "document_id",
        header: "Document ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "exposure_type",
        header: "Type",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
        meta: {
          filterVariant: "select",
        },
      },
      {
        accessorKey: "counterparty_name",
        header: "Counterparty",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
        meta: {
          filterVariant: "select",
        },
      },
      {
        accessorKey: "total_original_amount",
        header: "Original Amount",
        cell: ({ getValue, row }) => {
          const amount = Number(getValue());
          const currency = row.original.currency;
          return (
            <span className="font-medium text-gray-900">
              {isNaN(amount)
                ? "-"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency || "USD",
                  }).format(amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "total_open_amount",
        header: "Open Amount",
        cell: ({ getValue, row }) => {
          const amount = Number(getValue());
          const currency = row.original.currency;
          return (
            <span className="font-medium text-gray-900">
              {isNaN(amount)
                ? "-"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency || "USD",
                  }).format(amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "document_date",
        header: "Document Date",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-gray-700">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "value_date",
        header: "Value Date",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-gray-700">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
          );
        },
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
            Open: "bg-green-100 text-green-800",
            Closed: "bg-gray-100 text-gray-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Approved: "bg-blue-100 text-blue-800",
            Rejected: "bg-red-100 text-red-800",
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
        accessorKey: "approval_status",
        header: "Approval Status",
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
        accessorKey: "company_code",
        header: "Company Code",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "counterparty_type",
        header: "Counterparty Type",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "counterparty_code",
        header: "Counterparty Code",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "entity1",
        header: "Entity 1",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "entity2",
        header: "Entity 2",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "entity3",
        header: "Entity 3",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "product_id",
        header: "Product ID",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "product_description",
        header: "Product Description",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "unit_of_measure",
        header: "UOM",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "unit_price",
        header: "Unit Price",
        cell: ({ getValue, row }) => {
          const price = Number(getValue());
          const currency = row.original.currency;
          return (
            <span className="text-gray-700">
              {isNaN(price)
                ? "—"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency || "USD",
                  }).format(price)}
            </span>
          );
        },
      },
      {
        accessorKey: "line_item_amount",
        header: "Line Amount",
        cell: ({ getValue, row }) => {
          const amount = Number(getValue());
          const currency = row.original.currency;
          return (
            <span className="text-gray-700">
              {isNaN(amount)
                ? "—"
                : new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: currency || "USD",
                  }).format(amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "delivery_date",
        header: "Delivery Date",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-gray-700">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "payment_terms",
        header: "Payment Terms",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "inco_terms",
        header: "Inco Terms",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "plant_code",
        header: "Plant Code",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "approved_by",
        header: "Approved By",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "rejected_by",
        header: "Rejected By",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "requested_by",
        header: "Requested By",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-gray-700">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "updated_at",
        header: "Updated At",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-gray-700">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
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
            onClick={() => {
              const newExpandedId = expandedRowId === row.id ? null : row.id;
              setExpandedRowId(newExpandedId);
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
      },
    ],
    [expandedRowId]
  );

  const defaultVisibility: Record<string, boolean> = {
    select: true,
    document_id: true,
    exposure_type: true,
    entity: true,
    counterparty_name: true,
    total_original_amount: true,
    total_open_amount: true,
    currency: true,
    document_date: true,
    value_date: false,
    exposure_header_id: false,
    status: false,
    approval_status: false,
    company_code: false,
    counterparty_type: false,
    counterparty_code: false,
    entity1: false,
    entity2: false,
    entity3: false,
    product_id: false,
    expand: true,
    product_description: false,
    quantity: false,
    unit_of_measure: false,
    unit_price: false,
    line_item_amount: false,
    delivery_date: false,
    payment_terms: false,
    inco_terms: false,
    plant_code: false,
    actions: false,
    approved_by: false,
    rejected_by: false,
    requested_by: false,
    created_at: false,
    updated_at: false,
  };

  const [columnVisibility, setColumnVisibility] =
    useState<Record<string, boolean>>(defaultVisibility);

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

  type OptionType = { label: string; value: string };
  const [filters, setFilters] = useState({
    businessUnit: "",
    currency: "",
    type: "",
    bank: "",
    maturityMonths: "",
  });

  //   const entityOptions: OptionType[] = [
  //     { label: "Bank A", value: "bankA" },
  //     { label: "Bank B", value: "bankB" },
  //   ];

  const handleFilterChange = (key: string, value: string): void => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const selectedRows = table.getSelectedRowModel().rows;

  const totalOriginalAmount = selectedRows.reduce(
    (sum, row) => sum + parseFloat(row.original.total_original_amount || "0"),
    0
  );

  const totalOpenAmount = selectedRows.reduce(
    (sum, row) => sum + parseFloat(row.original.total_open_amount || "0"),
    0
  );

  const navigate = useNavigate();

  const handlePaymentClick = () => {
    // 1. Get selected exposure_header_ids as an array
    const selectedExposureIDs = table.getSelectedRowModel().rows.map(
      (row) => row.original.exposure_header_id
    );

    // 2. Get selected currency and entity from columnFilters
    const selectedCurrency =
      columnFilters.find((f) => f.id === "currency")?.value || "";
    const selectedEntity =
      columnFilters.find((f) => f.id === "entity")?.value || "";

    // 3. Get total open amount of selected rows
    const totalOpenAmount = table
      .getSelectedRowModel()
      .rows.reduce(
        (sum, row) => sum + parseFloat(row.original.total_open_amount || "0"),
        0
      );

    // 4. Navigate with state, passing exposure_header_ids as an array
    navigate("/settlement", {
      state: {
        exposure_header_ids: selectedExposureIDs, // <-- This is an array
        currency: selectedCurrency,
        entity: selectedEntity,
        total_open_amount: totalOpenAmount.toLocaleString(),
      },
    });
  };

  return (
    <Layout title="Exposure Selection">
      <div className="space-y-6">
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <CustomSelect
            label="Entity"
            options={entityOptions}
            selectedValue={
              columnFilters.find((f) => f.id === "entity")?.value || ""
            }
            onChange={(value: string): void => {
              setColumnFilters((prev) =>
                value
                  ? [
                      ...prev.filter((f) => f.id !== "entity"),
                      { id: "entity", value },
                    ]
                  : prev.filter((f) => f.id !== "entity")
              );
            }}
            placeholder="Select entity"
            isClearable={true}
          />

          <CustomSelect
            label="Import/Export"
            options={[
              { label: "Import", value: "import" },
              { label: "Export", value: "export" },
            ]}
            selectedValue={
              columnFilters.find((f) => f.id === "tradeType")?.value || ""
            }
            onChange={(value: string): void => {
              setColumnFilters((prev) =>
                value
                  ? [
                      ...prev.filter((f) => f.id !== "tradeType"),
                      { id: "tradeType", value },
                    ]
                  : prev.filter((f) => f.id !== "tradeType")
              );
            }}
            placeholder="Select type"
            isClearable={true}
          />

          <CustomSelect
            label="Currency"
            options={currencyOptions}
            selectedValue={
              columnFilters.find((f) => f.id === "currency")?.value || ""
            }
            onChange={(value: string): void => {
              setColumnFilters((prev) =>
                value
                  ? [
                      ...prev.filter((f) => f.id !== "currency"),
                      { id: "currency", value },
                    ]
                  : prev.filter((f) => f.id !== "currency")
              );
            }}
            placeholder="Select currency"
            isClearable={true}
          />

          <CustomSelect
            label="Counterparty Risk"
            options={[
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ]}
            selectedValue={
              columnFilters.find((f) => f.id === "counterparty_type")?.value ||
              ""
            }
            onChange={(value: string): void => {
              setColumnFilters((prev) =>
                value
                  ? [
                      ...prev.filter((f) => f.id !== "counterparty_type"),
                      { id: "counterparty_type", value },
                    ]
                  : prev.filter((f) => f.id !== "counterparty_type")
              );
            }}
            placeholder="Select risk"
            isClearable={true}
          />

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">
              Settlement Date
            </label>
            <input
              type="date"
              className="max-h-[36px] border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              //   value={filters.settlementDate || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                handleFilterChange("settlementDate", e.target.value)
              }
            />
          </div>

          <CustomSelect
            label="Bank"
            options={entityOptions}
            selectedValue={filters.bank}
            onChange={(value: string): void =>
              handleFilterChange("bank", value)
            }
            placeholder="Select bank"
            isClearable={false}
            isDisabled={true}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="w-15rem">
            <Button onClick={handlePaymentClick}>Payment</Button>
          </div>
          <div className="w-15rem">
            <Button>Rollover</Button>
          </div>
          <div className="w-15rem">
            <Button>Cancellation</Button>
          </div>
        </div>

        {/* Search and Action Buttons */}

        <div className="shadow-lg border border-border rounded-lg">
          <DndContext
            onDragEnd={handleDragEnd}
            modifiers={[restrictToFirstScrollableAncestor]}
          >
            <table className="min-w-[800px] w-full table-auto">
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
                          className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border sticky top-0 bg-secondary-color z-10"
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
                              <div className="mb-6">
                                <div className="font-semibold mb-2 text-primary-lt">
                                  Header Details
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                                  {(
                                    [
                                      "bu",
                                      "type",
                                      "currency",
                                      "maturity",
                                      "company_code",
                                      "counterparty_type",
                                      "counterparty_code",
                                      "value_date",
                                    ] as (keyof ExposureRequest)[]
                                  ).map((key) =>
                                    renderField(
                                      key,
                                      row.original[key]
                                      //   row.original[key]
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="mb-6">
                                <div className="font-semibold mb-2 text-primary-lt">
                                  Line Item Details
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                                  {(
                                    [
                                      "product_id",
                                      "product_description",
                                      "quantity",
                                      "unit_price",
                                      "line_item_amount",
                                      "delivery_date",
                                    ] as (keyof ExposureRequest)[]
                                  ).map((key) =>
                                    renderField(key, row.original[key])
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
                        total_original_amount:
                          totalOriginalAmount.toLocaleString(),
                        total_open_amount: totalOpenAmount.toLocaleString(),
                      }[col.id] ?? null}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </DndContext>
        </div>
      </div>
    </Layout>
  );
};

export default ExposureSelection;
