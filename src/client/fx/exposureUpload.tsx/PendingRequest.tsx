import React, { useEffect, useState, useMemo } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Download, Trash2, Upload } from "lucide-react";
import NyneOSTable from "./pending";
import type { ColumnDef } from "@tanstack/react-table";
import { exportToExcel } from "../../ui/exportToExcel";

const cURLHOST = "https://backend-slqi.onrender.com/api";

const fallbackUserVars: IfPayload["userVars"] = {
  roleName: "Guest",
  firstName: "John",
  secondName: "Doe",
  dateLoggedIn: "2025-07-14",
  timeLoggedIn: "10:00",
  userEmailId: "guest@example.com",
  isLoggedIn: true,
  notification: {
    messages: [],
  },
};

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
      counterparty_type: "Vendor",
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

const fallbackUserJourney: IfPayload["userJourney"] = {
  process: "Init",
  nextPageToCall: "/dashboard",
  actionCalledFrom: "login",
};

async function fetchRenderVars(): Promise<IfPayload["renderVars"]> {
  const res = await fetch(
    `${cURLHOST}/exposureUpload/pending-headers-lineitems`
  );
  if (!res.ok) throw new Error("Failed to fetch renderVars");
  return res.json();
}

// async function fetchUserVars(): Promise<IfPayload["userVars"]> {
//   const res = await fetch(`${cURLHOST}/exposureUpload/userVars`);
//   if (!res.ok) throw new Error("Failed to fetch userVars");
//   return res.json();
// }

// async function fetchUserJourney(): Promise<IfPayload["userJourney"]> {
//   const res = await fetch(`${cURLHOST}/exposureUpload/userJourney`);
//   if (!res.ok) throw new Error("Failed to fetch userJourney");
//   return res.json();
// }

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
  counterparty_type: string | null;
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

type TabVisibility = {
  delete: boolean;
  view: boolean;
};

const AllExposureRequest: React.FC = () => {
  const [renderVars, setRenderVars] = useState<IfPayload["renderVars"] | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [userVars, setUserVars] = useState<IfPayload["userVars"] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [userJourney, setUserJourney] = useState<
    IfPayload["userJourney"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<ExposureRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");

  const roleName = localStorage.getItem("userRole");
  const [Visibility, setVisibility] = useState<TabVisibility>({
    view: true,
    delete: true,
  });

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((user) => {
      if (user.approval_status) options.add(user.approval_status);
    });
    return ["All", ...Array.from(options)];
  }, [data]);

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
      result = result.filter((item) => item.status === statusFilter);
    }

    return result;
  }, [data, searchTerm, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
    setIsLoading(true);

    fetchRenderVars()
      .then((renderVarsRes) => {
        setRenderVars(renderVarsRes);
        setVisibility({
          view: renderVarsRes.btnApprove,
          delete: renderVarsRes.btnApprove,
        });
        if (Array.isArray(renderVarsRes.pageData)) {
          setData(renderVarsRes.pageData);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching renderVars:", err);
        setRenderVars(fallbackRenderVars);
      });

    // fetchUserVars()
    //   .then((userVarsRes) => {
    //     setUserVars(userVarsRes);
    //     if (!userVarsRes?.isLoggedIn) {
    //       setRenderVars((prev) =>
    //         prev ? { ...prev, isLoadable: false } : prev
    //       );
    //     }
    //   })
    //   .catch((err: any) => {
    //      console.error("Error fetching userVars:", err);
    //     setUserVars(fallbackUserVars);
    //   });

    // fetchUserJourney()
    //   .then((userJourneyRes) => setUserJourney(userJourneyRes))
    //   .catch((err) => {
    //      console.error("Error fetching userJourney:", err);
    //     setUserJourney(fallbackUserJourney);
    //   });
  }, []);

  const columns = useMemo<ColumnDef<ExposureRequest>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
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
        size: 50,
      },
      {
        accessorKey: "document_id",
        header: "Document ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "exposure_type",
        header: "Type",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "counterparty_name",
        header: "Counterparty",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "total_original_amount",
        header: "Original Amount",
        cell: ({ getValue, row }) => {
          const amount = Number(getValue());
          const currency = row.original.currency;
          return (
            <span className="font-medium text-secondary-text-dark">
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
            <span className="font-medium text-secondary-text-dark">
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
          <span className="text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "document_date",
        header: "Document Date",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-secondary-text-dark">
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
            <span className="text-secondary-text-dark">
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
          console.log(rawStatus);

          if (!rawStatus || typeof rawStatus !== "string") {
            return (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                —
              </span>
            );
          }

          const normalizedStatus = rawStatus.toLowerCase();

          const statusColors: Record<string, string> = {
            open: "bg-green-100 text-green-800",
            closed: "bg-gray-100 text-gray-800",
            pending: "bg-yellow-100 text-yellow-800",
            approved: "bg-blue-100 text-blue-800",
            rejected: "bg-red-100 text-red-800",
            "delete-approval": "bg-orange-100 text-orange-800",
          };

          const toPascalCase = (str: string) =>
            str.replace(
              /\w+/g,
              (word) => word[0].toUpperCase() + word.substring(1).toLowerCase()
            );

          const displayStatus = toPascalCase(normalizedStatus);

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[normalizedStatus] || "bg-gray-100 text-gray-800"
              }`}
            >
              {displayStatus}
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

          const normalizedStatus = rawStatus.toLowerCase();

          const statusColors: Record<string, string> = {
            approved: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            "delete-approval": "bg-orange-100 text-orange-800",
            rejected: "bg-red-100 text-red-800",
          };

          const toPascalCase = (str: string) =>
            str.replace(
              /\w+/g,
              (word) => word[0].toUpperCase() + word.substring(1).toLowerCase()
            );

          const displayStatus = toPascalCase(normalizedStatus);

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[normalizedStatus] || "bg-gray-100 text-gray-800"
              }`}
            >
              {displayStatus}
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
    ],
    []
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
    document_date: false,
    value_date: false,
    status: false,
    approval_status: true,
    company_code: false,
    counterparty_type: false,
    counterparty_code: false,
    entity1: false,
    entity2: false,
    entity3: false,
    product_id: false,
    product_description: false,
    quantity: false,
    unit_of_measure: false,
    unit_price: false,
    line_item_amount: false,
    delivery_date: false,
    payment_terms: false,
    inco_terms: false,
    plant_code: false,
    approved_by: false,
    rejected_by: false,
    requested_by: false,
    created_at: false,
    updated_at: false,
  };

  const expandedRowConfig = {
    sections: [
      {
        title: "Header Details",
        fields: [
          "company_code",
          "counterparty_type",
          "counterparty_code",
          "entity1",
          "entity2",
          "entity3",
          "value_date",
        ],
      },
      {
        title: "Line Item Details",
        fields: [
          "product_id",
          "product_description",
          "quantity",
          "unit_of_measure",
          "unit_price",
          "line_item_amount",
          "delivery_date",
          "payment_terms",
          "inco_terms",
          "plant_code",
        ],
      },
      {
        title: "Approval Information",
        fields: [
          "approved_by",
          "rejected_by",
          "requested_by",
          "approval_comment",
          "rejection_comment",
          "delete_comment",
          "created_at",
          "updated_at",
        ],
      },
    ],
    editableFields: [
      "approval_comment",
      "rejection_comment",
      "delete_comment",
      "status",
      "approval_status",
    ],
    fieldLabels: {
      exposure_header_id: "Exposure Header ID",
      company_code: "Company Code",
      entity: "Entity",
      entity1: "Entity 1",
      entity2: "Entity 2",
      entity3: "Entity 3",
      exposure_type: "Exposure Type",
      document_id: "Document ID",
      document_date: "Document Date",
      counterparty_type: "Counterparty Type",
      counterparty_code: "Counterparty Code",
      counterparty_name: "Counterparty Name",
      currency: "Currency",
      total_original_amount: "Total Original Amount",
      total_open_amount: "Total Open Amount",
      value_date: "Value Date",
      status: "Status",
      is_active: "Is Active",
      created_at: "Created At",
      updated_at: "Updated At",
      approval_status: "Approval Status",
      approval_comment: "Approval Comment",
      approved_by: "Approved By",
      delete_comment: "Delete Comment",
      requested_by: "Requested By",
      rejection_comment: "Rejection Comment",
      approved_at: "Approved At",
      rejected_by: "Rejected By",
      rejected_at: "Rejected At",
      line_item_id: "Line Item ID",
      line_number: "Line Number",
      product_id: "Product ID",
      product_description: "Product Description",
      quantity: "Quantity",
      unit_of_measure: "Unit of Measure",
      unit_price: "Unit Price",
      line_item_amount: "Line Item Amount",
      plant_code: "Plant Code",
      delivery_date: "Delivery Date",
      payment_terms: "Payment Terms",
      inco_terms: "Inco Terms",
    },
  };

  const handleUpdate = async (
    rowId: string,
    changes: Partial<ExposureRequest>
  ) => {
    try {
      console.log("Updating row:", rowId, "with changes:", changes);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state
      setData((prevData) =>
        prevData.map((item) =>
          item.exposure_header_id === rowId ? { ...item, ...changes } : item
        )
      );

      return true;
    } catch (error) {
      console.error("Error updating:", error);
      return false;
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <button
            type="button"
            className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
            title="Download All Exposures"
            onClick={() => exportToExcel(filteredData, "All_Exposures")}
          >
            <Download className="flex item-center justify-center text-primary group-hover:text-white" />
          </button>
          <button
            type="button"
            className="text-primary group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
            title="Refresh"
            onClick={() => window.location.reload()}
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

      <NyneOSTable<ExposureRequest>
        data={data}
        filter={filteredData}
        columns={columns}
        defaultColumnVisibility={defaultVisibility}
        draggableColumns={[
          "document_id",
          "exposure_type",
          "entity",
          "counterparty_name",
          "total_original_amount",
          "total_open_amount",
          "currency",
          "document_date",
          "status",
          "approval_status",
        ]}
        sortableColumns={[
          "document_id",
          "exposure_type",
          "entity",
          "counterparty_name",
          "total_original_amount",
          "total_open_amount",
          "document_date",
          "value_date",
          "status",
          "approval_status",
          "created_at",
        ]}
        expandedRowConfig={expandedRowConfig}
        onUpdate={handleUpdate}
        className="mb-8"
        setData={setData}
      />
    </div>
  );
};

export default AllExposureRequest;
