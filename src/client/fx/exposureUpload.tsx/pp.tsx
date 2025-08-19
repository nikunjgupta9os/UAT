import React, { useEffect, useState, useMemo } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Download, Trash2, Upload } from "lucide-react";
import NyneOSTable from "./ReusableTable";
import type { ColumnDef } from "@tanstack/react-table";
import { exportToExcel } from "../../ui/exportToExcel";
import LoadingSpinner from "../../ui/LoadingSpinner";
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
      additional_header_details: {
        input_debitors: [
          {
            text: "",
            company: "Tata Ficosa",
            customer: "106118",
            linked_id: "",
            loaded_at: "2025-08-18T14:37:29.486Z",
            reference: "SI2104000011",
            assignment: "939133347",
            currency_2: "EUR",
            gl_account: "252101",
            row_number: 3,
            // company_code: "1100",
            net_due_date: "2020-08-11",
            posting_date: "2020-05-13",
            // document_date: "2020-05-13",
            document_type: "RV",
            bank_reference: "",
            special_gl_ind: "",
            document_number: "939133347",
            upload_batch_id: "7ee1a178-a7e3-445b-9e59-0ea9c5e48c01",
            clearing_document: "",
            document_currency: "EUR",
            processing_status: "Pending",
            amount_in_doc_curr: "90",
            amount_in_local_currency: "7263",
          },
        ],
        input_creditors: [
          {
            payment_block: "",
            business_area: "",
            account: "",
            pann: "",
            gl_account: "",
            net_due_date: "",
            posting_date: "",
            document_type: "",
            posting_key: "",
            amount_in_doc_curr: "",
            document_currency: "",
            local_currency: "",
            currency_2: "",
            bank_reference: "",
            linked_id: "",
          },
        ],
        input_grn: [
          {
            account: "",
            business_area: "",
            document_type: "",
            customer: "",
            assignment: "",
            document_number: "",
            posting_date: "",
            supplier: "",
            reference: "",
            amount_in_doc_curr: "",
            document_currency: "",
            amount_in_local_currency: "",
            text: "",
            clearing_document: "",
            clearing_date: "",
            special_gl_ind: "",
            offsetting_account: "",
            currency_2: "",
            company: "",
            loaded_at: "",
            linked_id: "",
          },
        ],
      },
    },
  ],
};

const fallbackUserJourney: IfPayload["userJourney"] = {
  process: "Init",
  nextPageToCall: "/dashboard",
  actionCalledFrom: "login",
};

async function fetchRenderVars(): Promise<IfPayload["renderVars"]> {
  const res = await fetch(`${cURLHOST}/exposureUpload/headers-lineitems`);
  if (!res.ok) throw new Error("Failed to fetch renderVars");
  return res.json();
}

// async function fetchUserVars(): Promise<IfPayload["userVars"]> {
// const res = await fetch(`${cURLHOST}/exposureUpload/userVars`);
// if (!res.ok) throw new Error("Failed to fetch userVars");
// return res.json();
// }

// async function fetchUserJourney(): Promise<IfPayload["userJourney"]> {
// const res = await fetch(`${cURLHOST}/exposureUpload/userJourney`);
// if (!res.ok) throw new Error("Failed to fetch userJourney");
// return res.json();
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

interface AccountDocumentInfo {
  account: string;
  // company_code: string;
  business_area: string;
  document_type: string;
  customer: string;
  assignment: string;
  document_number: string;
  // document_date: string;
  posting_date: string;
  supplier: string;
  reference: string;
  amount_in_doc_curr: string;
  document_currency: string;
  amount_in_local_currency: string;
  text: string;
  clearing_document: string;
  clearing_date: string;
  special_gl_ind: string;
  offsetting_account: string;
  currency_2: string;
  company: string;
  loaded_at: string;
  linked_id: string;
}

interface CreditorInfo {
  payment_block: string;
  // company_code: string;
  business_area: string;
  account: string;
  pann: string;
  gl_account: string;
  // document_date: string;
  net_due_date: string;
  posting_date: string;
  document_type: string;
  posting_key: string;
  amount_in_doc_curr: string;
  document_currency: string;
  local_currency: string;
  currency_2: string;
  bank_reference: string;
  linked_id: string;
}
interface InputDebitor {
  text: string;
  company: string;
  customer: string;
  linked_id: string;
  loaded_at: string;
  reference: string;
  assignment: string;
  currency_2: string;
  gl_account: string;
  row_number: number;
  // company_code: string;
  net_due_date: string;
  posting_date: string;
  // document_date: string;
  document_type: string;
  bank_reference: string;
  special_gl_ind: string;
  document_number: string;
  upload_batch_id: string;
  clearing_document: string;
  document_currency: string;
  processing_status: string;
  amount_in_doc_curr: string;
  amount_in_local_currency: string;
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
  additional_header_details?: {
    input_debitors?: InputDebitor[];
    input_creditors?: CreditorInfo[];
    input_grn?: AccountDocumentInfo[];
  };
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
  // const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<ExposureRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [creditorInfo, setCreditorInfo] = useState<CreditorInfo[]>([]);
  const [grnInfo, setGrnInfo] = useState<AccountDocumentInfo[]>([]);
  const [debitInfo, setDebitInfo] = useState<InputDebitor[]>([]);

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
      result = result.filter(
        (item) =>
          item.approval_status &&
          item.approval_status.toLowerCase() === statusFilter.toLowerCase()
      );
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
    fetchRenderVars()
      .then((renderVarsRes) => {
        setRenderVars(renderVarsRes);
        setVisibility({
          view: renderVarsRes.btnApprove,
          delete: renderVarsRes.btnApprove,
        });

        if (Array.isArray(renderVarsRes.pageData)) {
          setData(renderVarsRes.pageData);

          // Collect all debitors, creditors, and grn info from the new data
          const allDebitors: InputDebitor[] = [];
          const allCreditors: CreditorInfo[] = [];
          const allGrn: AccountDocumentInfo[] = [];

          renderVarsRes.pageData.forEach((exposure) => {
            const debitors = exposure.additional_header_details?.input_debitors;
            if (Array.isArray(debitors)) {
              allDebitors.push(...debitors);
            } else if (debitors && typeof debitors === "object") {
              allDebitors.push(debitors);
            }

            const creditors =
              exposure.additional_header_details?.input_creditors;
            if (Array.isArray(creditors)) {
              allCreditors.push(...creditors);
            } else if (creditors && typeof creditors === "object") {
              allCreditors.push(creditors);
            }

            const grn = exposure.additional_header_details?.input_grn;
            if (Array.isArray(grn)) {
              allGrn.push(...grn);
            } else if (grn && typeof grn === "object") {
              allGrn.push(grn);
            }
          });

          setDebitInfo(allDebitors);
          setCreditorInfo(allCreditors);
          setGrnInfo(allGrn);
          console.log("Debitor Info:", allDebitors);
          console.log("Creditor Info:", allCreditors);
          console.log("GRN Info:", allGrn);
          setLoading(false);
        } else {
          setData([]);
          setDebitInfo([]);
          setCreditorInfo([]);
          setGrnInfo([]);
          setLoading(false);
        }
      })
      .catch((err) => {
        // console.error("Error fetching renderVars:", err);
        setRenderVars(fallbackRenderVars);
        setLoading(false);
      });

    // fetchUserVars()
    // .then((userVarsRes) => {
    // setUserVars(userVarsRes);
    // if (!userVarsRes?.isLoggedIn) {
    // setRenderVars((prev) =>
    // prev ? { ...prev, isLoadable: false } : prev
    // );
    // }
    // })
    // .catch((err: any) => {
    // console.error("Error fetching userVars:", err);
    // setUserVars(fallbackUserVars);
    // });

    // fetchUserJourney()
    // .then((userJourneyRes) => setUserJourney(userJourneyRes))
    // .catch((err) => {
    // console.error("Error fetching userJourney:", err);
    // setUserJourney(fallbackUserJourney);
    // });
  }, []);

  // Helper to generate columns for array fields
  function arrayFieldColumns(arrayField, fields, sectionTitle) {
    return fields.map((field) => ({
      id: `${arrayField}_${field}`,
      header: `${sectionTitle}: ${field
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())}`,
      cell: ({ row }) => {
        const arrOrObj = row.original.additional_header_details?.[arrayField];
        if (Array.isArray(arrOrObj) && arrOrObj.length > 0) {
          return (
            <span className="text-secondary-text">
              {arrOrObj[0][field] ?? "—"}
            </span>
          );
        }
        if (arrOrObj && typeof arrOrObj === "object") {
          return (
            <span className="text-secondary-text">
              {arrOrObj[field] ?? "—"}
            </span>
          );
        }
        return <span className="text-secondary-text">—</span>;
      },
      enableSorting: false,
    }));
  }

  // Debitor Details columns
  const debitorColumns = arrayFieldColumns(
    "input_debitors",
    [
      // "customer",
      // "company",
      // "document_number",
      // "posting_date",
      // "amount_in_doc_curr",
      "amount_in_local_currency",
      "document_currency",
      "reference",
      "assignment",
      "gl_account",
      "special_gl_ind",
      "bank_reference",
      "processing_status",
    ],
    "Debitor"
  );

  // Creditor Details columns
  const creditorColumns = arrayFieldColumns(
    "input_creditors",
    [
      "account",
      "business_area",
      "document_type",
      "posting_date",
      "net_due_date",
      "amount_in_doc_curr",
      "document_currency",
      "local_currency",
      "currency_2",
      "bank_reference",
      "gl_account",
      "payment_block",
      "posting_key",
      "pann",
    ],
    "Creditor"
  );

  // GRN Details columns
  const grnColumns = arrayFieldColumns(
    "input_grn",
    [
      "account",
      "business_area",
      "document_type",
      "customer",
      "assignment",
      "document_date",
      "posting_date",
      "supplier",
      "reference",
      "amount_in_doc_curr",
      "document_currency",
      "amount_in_local_currency",
      "text",
      "clearing_document",
      "clearing_date",
      "special_gl_ind",
      "offsetting_account",
      "currency_2",
      "company",
      "loaded_at",
      "linked_id",
    ],
    "GRN"
  );

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
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const pascalCaseValue = value
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          return <span className="text-secondary-text">{pascalCaseValue}</span>;
        },
      },
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "counterparty_name",
        header: "Counterparty",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
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
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "document_date",
        header: "Document Date",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-secondary-text">
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
            <span className="text-secondary-text">
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

          // Fallback for missing or invalid status
          if (!rawStatus || typeof rawStatus !== "string") {
            return (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                —
              </span>
            );
          }

          // Normalize status text
          const status =
            rawStatus.charAt(0).toUpperCase() +
            rawStatus.slice(1).toLowerCase();

          // Status → color mapping
          const statusColors: Record<string, string> = {
            Open: "bg-green-100 text-green-800",
            Closed: "bg-gray-100 text-gray-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Approved: "bg-blue-100 text-blue-800",
            Rejected: "bg-red-100 text-red-800",
          };

          // Default style if not found
          const colorClass =
            statusColors[status] || "bg-gray-100 text-secondary-text-dark";

          return (
            <div className="flex justify-end w-full">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}
              >
                {status}
              </span>
            </div>
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

          // Normalize to lowercase for matching
          const normalizedStatus = rawStatus.toLowerCase();

          // Color mapping based on lowercase keys
          const statusColors: Record<string, string> = {
            approved: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
            "delete-approval": "bg-orange-100 text-orange-800",
          };

          // Convert lowercase to PascalCase for display
          const displayStatus = normalizedStatus.replace(
            /\w+/g,
            (word) => word.charAt(0).toUpperCase() + word.slice(1)
          );

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[normalizedStatus] ||
                "bg-gray-100 text-secondary-text"
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
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "counterparty_type",
        header: "Counterparty Type",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "counterparty_code",
        header: "Counterparty Code",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "entity1",
        header: "Entity 1",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "entity2",
        header: "Entity 2",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "entity3",
        header: "Entity 3",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "product_id",
        header: "Product ID",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "product_description",
        header: "Product Description",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "unit_of_measure",
        header: "UOM",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "unit_price",
        header: "Unit Price",
        cell: ({ getValue, row }) => {
          const price = Number(getValue());
          const currency = row.original.currency;
          return (
            <span className="text-secondary-text-dark">
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
            <span className="text-secondary-text-dark">
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
            <span className="text-secondary-text-dark">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "payment_terms",
        header: "Payment Terms",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "inco_terms",
        header: "Inco Terms",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "plant_code",
        header: "Plant Code",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "approved_by",
        header: "Approved By",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "rejected_by",
        header: "Rejected By",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "requested_by",
        header: "Requested By",
        cell: ({ getValue }) => (
          <span className="text-secondary-text-dark">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created At",
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
        accessorKey: "updated_at",
        header: "Updated At",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-secondary-text-dark">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
          );
        },
      },
      ...debitorColumns,
      ...creditorColumns,
      ...grnColumns,
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

    // Debitor Details columns
    input_debitors_customer: true,
    input_debitors_company: true,
    input_debitors_document_number: true,
    input_debitors_posting_date: true,
    input_debitors_amount_in_doc_curr: true,
    input_debitors_amount_in_local_currency: false,
    input_debitors_document_currency: false,
    input_debitors_reference: false,
    input_debitors_assignment: false,
    input_debitors_gl_account: false,
    input_debitors_special_gl_ind: false,
    input_debitors_bank_reference: false,
    input_debitors_processing_status: false,

    // Creditor Details columns
    input_creditors_account: false,
    input_creditors_business_area: false,
    input_creditors_document_type: false,
    input_creditors_posting_date: false,
    input_creditors_net_due_date: false,
    input_creditors_amount_in_doc_curr: false,
    input_creditors_document_currency: false,
    input_creditors_local_currency: false,
    input_creditors_currency_2: false,
    input_creditors_bank_reference: false,
    input_creditors_gl_account: false,
    input_creditors_payment_block: false,
    input_creditors_posting_key: false,
    input_creditors_pann: false,

    // GRN Details columns
    input_grn_account: false,
    input_grn_business_area: false,
    input_grn_document_type: false,
    input_grn_customer: false,
    input_grn_assignment: false,
    input_grn_document_date: false,
    input_grn_posting_date: false,
    input_grn_supplier: false,
    input_grn_reference: false,
    input_grn_amount_in_doc_curr: false,
    input_grn_document_currency: false,
    input_grn_amount_in_local_currency: false,
    input_grn_text: false,
    input_grn_clearing_document: false,
    input_grn_clearing_date: false,
    input_grn_special_gl_ind: false,
    input_grn_offsetting_account: false,
    input_grn_currency_2: false,
    input_grn_company: false,
    input_grn_loaded_at: false,
    input_grn_linked_id: false,
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
      {
        title: "Debitor Details",
        arrayField: "input_debitors",
        fields: [
          "debitor_customer",
          "debitor_company",
          "debitor_document_number",
          "debitor_posting_date",
          "debitor_amount_in_doc_curr",
          "debitor_amount_in_local_currency",
          "debitor_document_currency",
          "debitor_reference",
          "debitor_assignment",
          "debitor_gl_account",
          "debitor_special_gl_ind",
          "debitor_bank_reference",
          "debitor_processing_status",
        ],
      },
      {
        title: "Creditor Details",
        arrayField: "input_creditors",
        fields: [
          "account",
          "business_area",
          "document_type",
          "posting_date",
          "net_due_date",
          "amount_in_doc_curr",
          "document_currency",
          "local_currency",
          "currency_2",
          "bank_reference",
          "gl_account",
          "payment_block",
          "posting_key",
          "pann",
        ],
      },
      {
        title: "GRN Details",
        arrayField: "input_grn",
        fields: [
          "account",
          "business_area",
          "document_type",
          "customer",
          "assignment",
          "document_date",
          "posting_date",
          "supplier",
          "reference",
          "amount_in_doc_curr",
          "document_currency",
          "amount_in_local_currency",
          "text",
          "clearing_document",
          "clearing_date",
          "special_gl_ind",
          "offsetting_account",
          "currency_2",
          "company",
          "loaded_at",
          "linked_id",
        ],
      },
    ],

    editableFields: [
      "approval_comment",
      "rejection_comment",
      "delete_comment",
      "status",
      "approval_status",
      "counterparty_type",
      "company_code",
      "value_date",
      "document_date",
      "counterparty_name",
      "currency",
      "total_original_amount",
      "line_item_amount",
      "counterparty_code",
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

      // Debitor Details
      debitor_customer: "Debitor: Customer",
      debitor_company: "Debitor: Company",
      debitor_document_number: "Debitor: Document Number",
      debitor_posting_date: "Debitor: Posting Date",
      debitor_amount_in_doc_curr: "Debitor: Amount In Doc Curr",
      debitor_amount_in_local_currency: "Debitor: Amount In Local Curr",
      debitor_document_currency: "Debitor: Document Currency",
      debitor_reference: "Debitor: Reference",
      debitor_assignment: "Debitor: Assignment",
      debitor_gl_account: "Debitor: GL Account",
      debitor_special_gl_ind: "Debitor: Special GL Ind",
      debitor_bank_reference: "Debitor: Bank Reference",
      debitor_processing_status: "Debitor: Processing Status",

      // Creditor Details
      account: "Creditor: Account",
      business_area: "Creditor: Business Area",
      document_type: "Creditor: Document Type",
      posting_date: "Creditor: Posting Date",
      net_due_date: "Creditor: Net Due Date",
      c_amount_in_doc_curr: "Creditor: Amount In Doc Curr",
      document_currency: "Creditor: Document Currency",
      local_currency: "Creditor: Local Currency",
      currency_2: "Creditor: Currency 2",
      bank_reference: "Creditor: Bank Reference",
      gl_account: "Creditor: GL Account",
      payment_block: "Creditor: Payment Block",
      posting_key: "Creditor: Posting Key",
      pann: "Creditor: PANN",

      // GRN Details
      customer: "GRN: Customer",
      assignment: "GRN: Assignment",
      supplier: "GRN: Supplier",
      reference: "GRN: Reference",
      amount_in_doc_curr: "GRN: Amount In Doc Curr",
      amount_in_local_currency: "GRN: Amount In Local Curr",
      text: "GRN: Text",
      clearing_document: "GRN: Clearing Document",
      clearing_date: "GRN: Clearing Date",
      special_gl_ind: "GRN: Special GL Ind",
      offsetting_account: "GRN: Offsetting Account",
      company: "GRN: Company",
      loaded_at: "GRN: Loaded At",
      linked_id: "GRN: Linked Id",
      // and so on...
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

  if (loading) {
    return <LoadingSpinner />;
  }

  // Helper to convert snake_case or underscores to Pascal Case
  function toPascalCase(str: string) {
    return str
      .replace(/_/g, " ")
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
  }

  // Render a section for non-array fields
  function renderSection(section, rowData, fieldLabels) {
    const fieldsToShow = section.fields.filter(
      (field) =>
        rowData[field] !== null &&
        rowData[field] !== undefined &&
        rowData[field] !== ""
    );
    if (fieldsToShow.length === 0) return null;
    return (
      <div key={section.title} className="mb-8">
        <div className="text-primary font-semibold text-base mb-2 bg-gray-50 px-2 py-1 rounded">
          {section.title}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-8 px-2">
          {fieldsToShow.map((field) => (
            <div key={field}>
              <span className="block text-xs text-gray-500 mb-1">
                {toPascalCase(fieldLabels[field] || field)}
              </span>
              <span className="font-medium text-secondary-text-dark">
                {rowData[field]}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render a section for array fields (tables)
  function renderArraySection(section, rowData, fieldLabels) {
    let arrayData = rowData.additional_header_details?.[section.arrayField];
    if (!arrayData) return null;
    if (!Array.isArray(arrayData)) arrayData = [arrayData];
    if (arrayData.length === 0) return null;
    const visibleFields = section.fields.filter((field) =>
      arrayData.some(
        (item) =>
          item[field] !== null &&
          item[field] !== undefined &&
          item[field] !== ""
      )
    );
    if (visibleFields.length === 0) return null;
    return (
      <div key={section.title} className="mb-8">
        <div className="text-primary font-semibold text-base mb-2 bg-gray-50 px-2 py-1 rounded">
          {section.title}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="min-w-full text-xs border rounded">
            <thead>
              <tr>
                {visibleFields.map((field) => (
                  <th
                    key={field}
                    className="border px-4 py-2 bg-primary text-white font-bold text-left"
                  >
                    {toPascalCase(fieldLabels[field] || field)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arrayData.map((item, idx) => (
                <tr key={idx}>
                  {visibleFields.map((field) => (
                    <td key={field} className="border px-4 py-2">
                      {item[field] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Only show relevant details section based on exposure_type
  function expandedRowRenderer(rowData) {
    const exposureType = (rowData.exposure_type || "").toLowerCase();
    let detailsSectionTitle = "";
    if (exposureType.includes("debitor"))
      detailsSectionTitle = "Debitor Details";
    else if (exposureType.includes("creditor"))
      detailsSectionTitle = "Creditor Details";
    else if (exposureType.includes("grn")) detailsSectionTitle = "GRN Details";

    const alwaysShow = ["Header Details", "Line Item Details"];
    const approvalSection = expandedRowConfig.sections.find(
      (section) => section.title === "Approval Information"
    );
    const detailsSection = expandedRowConfig.sections.find(
      (section) => section.title === detailsSectionTitle
    );

    const sectionsToShow = [
      ...expandedRowConfig.sections.filter((section) =>
        alwaysShow.includes(section.title)
      ),
      ...(detailsSection ? [detailsSection] : []),
      ...(approvalSection ? [approvalSection] : []),
    ];

    return (
      <div className="px-4 py-4">
        {sectionsToShow.map((section) =>
          section.arrayField
            ? renderArraySection(
                section,
                rowData,
                expandedRowConfig.fieldLabels
              )
            : renderSection(section, rowData, expandedRowConfig.fieldLabels)
        )}
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {/* Row 1 - Status Filter */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-secondary-text">
            Status
          </label>
          <select
            className="text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
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

      {/* Row 2 - Search & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        <div className="col-span-1 md:col-span-4 flex items-center justify-end gap-4">
          {/* Download Button */}
          <button
            type="button"
            className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
            title="Download All Exposures"
            onClick={() => exportToExcel(filteredData, "All_Exposures")}
          >
            <Download className="flex items-center justify-center text-primary group-hover:text-white" />
          </button>

          {/* Refresh Button */}
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

          {/* Search Form */}
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
                className="accent-primary"
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
        edit={true}
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
        expandedRowRenderer={expandedRowRenderer} // <-- Add this line
        onUpdate={handleUpdate}
        className="mb-8"
        setData={setData}
      />
    </div>
  );
};

export default AllExposureRequest;

// Add this above your renderArraySection
const arrayFieldKeyMap = {
  input_debitors_customer: "Customer",
  input_debitors_company: "Company",
  input_debitors_document_number: "Document Number",
  input_debitors_posting_date: "Posting Date",
  input_debitors_amount_in_doc_curr: "Amount in Document Currency",
  input_debitors_amount_in_local_currency: "Amount in Local Currency",
  input_debitors_document_currency: "Document Currency",
  input_debitors_reference: "Reference",
  input_debitors_assignment: "Assignment",
  input_debitors_gl_account: "GL Account",
  input_debitors_special_gl_ind: "Special GL Indicator",
  input_debitors_bank_reference: "Bank Reference",
  input_debitors_processing_status: "Processing Status",
  // ...add for creditors and grn as needed
};
