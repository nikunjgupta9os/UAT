import React, { useEffect, useState, useMemo } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import NyneOSTable from "./ReusableTable";
import type { ColumnDef } from "@tanstack/react-table";
import "../../styles/theme.css";
import axios from "axios";
const cURLHOST = "https://backend-slqi.onrender.com/api";

async function fetchRenderVars(): Promise<IfPayload["renderVars"]> {
  const res = await fetch(`${cURLHOST}/exposureBucketing/joined-exposures`);
  if (!res.ok) throw new Error("Failed to fetch renderVars");
  return res.json();
}

interface Message {
  date: string;
  priority: number;
  deadline: string;
  text: string;
}

interface ExposureBucketing {
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
  status_bucketing: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
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
  product_id: string | null;
  product_description: string | null;
  quantity: string;
  unit_of_measure: string | null;
  unit_price: string;
  line_item_amount: string;
  plant_code: string | null;
  delivery_date: string | null;
  payment_terms: string | null;
  inco_terms: string | null;
  reference_no: string | null;
  date: string | null;
  time: string | null;
  advance: number | null;
  month_1: number | null;
  month_2: number | null;
  month_3: number | null;
  month_4: number | null;
  month_4_6: number | null;
  month_6plus: number | null;
  old_month1: number | null;
  old_month2: number | null;
  old_month3: number | null;
  old_month4: number | null;
  old_month4to6: number | null;
  old_month6plus: number | null;
  comments: string | null;
  updated_by: string | null;
}

type TabVisibility = {
  edit : boolean;
  approve : boolean;
  reject : boolean; 
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
    pageData: ExposureBucketing[];
  };
  userJourney: {
    process: string;
    nextPageToCall: string;
    actionCalledFrom: string;
  };
}

const ExposureBucketing: React.FC = () => {
  const [data, setData] = useState<ExposureBucketing[]>([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    data.forEach((item) => {
      if (item.approval_status) options.add(item.approval_status);
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
      result = result.filter((item) => item.approval_status === statusFilter);
    }

    return result;
  }, [data, searchTerm, statusFilter]);

   const [Visibility,setVisibility]= useState<TabVisibility>({
      edit : false,
      approve : false,
      reject : false,
    })
    const roleName = localStorage.getItem("userRole") ;
   

  useEffect(() => {
    fetchRenderVars()
      .then((renderVarsRes) => {
        if (Array.isArray(renderVarsRes.pageData)) {
          // Add a unique identifier for each row since exposure_header_id can be null
          const dataWithIds = renderVarsRes.pageData.map(
            (item: any, index: number) => ({
              ...item,
              exposure_header_id:
                item.exposure_header_id || `temp-${item.line_item_id || index}`,
            })
          );
          setData(dataWithIds);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching renderVars:", err);
      });
    
     const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionJSON",
          { roleName }
        );
        console.log("Permissions response:", response.data);
        const pages = response.data?.pages;
        const userTabs = pages?.["exposure-bucketing"]?.tabs;
        //  console.log(userTabs.allTab.hasAccess);
        if (userTabs) {
          setVisibility({
            edit : userTabs.default.showEditButton || false,
            approve : userTabs.default.showApproveButton || false,
            reject : userTabs.default.showRejectButton || false,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    fetchPermissions(); 
  }, []);



  const columns = useMemo<ColumnDef<ExposureBucketing>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
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
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
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
        accessorKey: "status_bucketing",
        header: "Status",
        cell: (info) => {
          let status_bucketing = info.getValue() as string;

          if (!status_bucketing) {
            status_bucketing = "Pending";
          }

          const statusColors: Record<string, string> = {
            Approved: "bg-green-100 text-green-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Rejected: "bg-red-100 text-red-800",
            Inactive: "bg-gray-200 text-gray-700",
          };

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[status_bucketing] || "bg-gray-100 text-gray-800"
              }`}
            >
              {status_bucketing}
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
            <span className="text-secondary-text">
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
            <span className="text-secondary-text">
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
        accessorKey: "advance",
        header: "Advance",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as number) || 0}
          </span>
        ),
      },
      {
        accessorKey: "month_1",
        header: "Month 1",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as number) || 0}
          </span>
        ),
      },
      {
        accessorKey: "month_2",
        header: "Month 2",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as number) || 0}
          </span>
        ),
      },
      {
        accessorKey: "month_3",
        header: "Month 3",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as number) || 0}
          </span>
        ),
      },
      {
        accessorKey: "month_4_6",
        header: "Month 4-6",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as number) || 0}
          </span>
        ),
      },
      {
        accessorKey: "month_6plus",
        header: "Month 6+",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as number) || 0}
          </span>
        ),
      },
      {
        accessorKey: "payment_terms",
        header: "Payment Terms",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "inco_terms",
        header: "Inco Terms",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "approved_by",
        header: "Approved By",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      {
        accessorKey: "approved_at",
        header: "Approved At",
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
        accessorKey: "created_at",
        header: "Created At",
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
        accessorKey: "updated_at",
        header: "Updated At",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-secondary-text">
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
    document_date: true,
    value_date: false,
    status_bucketing: true,
    approval_status: false,
    company_code: false,
    counterparty_code: false,
    entity1: false,
    entity2: false,
    entity3: false,
    quantity: false,
    unit_of_measure: false,
    unit_price: false,
    line_item_amount: false,
    advance: false,
    month_1: false,
    month_2: false,
    month_3: false,
    month_4_6: false,
    month_6plus: false,
    payment_terms: false,
    inco_terms: false,
    approved_by: false,
    approved_at: false,
    created_at: false,
    updated_at: false,
    actions: true,
    expand: true,
  };

  const expandedRowConfig = {
    sections: [
      {
        title: "Header Details",
        fields: [
          "company_code",
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
          "payment_terms",
          "inco_terms",
        ],
      },
      {
        title: "Exposure Payment Breakdown",
        fields: [
          "advance",
          "month_1",
          "month_2",
          "month_3",
          "month_4_6",
          "month_6plus",
          "remaining_percentage",
        ],
      },
      {
        title: "Approval Information",
        fields: [
          "approved_by",
          "approved_at",
          "approval_comment",
          "rejection_comment",
          "comments",
          "updated_by",
          "created_at",
          "updated_at",
        ],
      },
    ],
    editableFields: [
      "advance",
      "month_1",
      "month_2",
      "month_3",
      "month_4_6",
      "month_6plus",
      "comments",
      "approval_comment",
      "rejection_comment",
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
      // status: "Status",
      status_bucketing: "Status Bucketing",
      approval_status: "Approval Status",
      approval_comment: "Approval Comment",
      approved_by: "Approved By",
      approved_at: "Approved At",
      product_id: "Product ID",
      product_description: "Product Description",
      quantity: "Quantity",
      unit_of_measure: "Unit of Measure",
      unit_price: "Unit Price",
      line_item_amount: "Line Item Amount",
      payment_terms: "Payment Terms",
      inco_terms: "Inco Terms",
      advance: "Advance",
      month_1: "Month 1",
      month_2: "Month 2",
      month_3: "Month 3",
      month_4_6: "Month 4-6",
      month_6plus: "Month 6+",
      comments: "Comments",
      updated_by: "Updated By",
      created_at: "Created At",
      updated_at: "Updated At",
      remaining_percentage: "Remaining %",
    },
    customRenderPerField: {
      remaining_percentage: (row: any) => {
        const {
          total_original_amount = "0",
          advance = 0,
          month_1 = 0,
          month_2 = 0,
          month_3 = 0,
          month_4_6 = 0,
          month_6plus = 0,
        } = row.original;

        const totalAmount = Number(total_original_amount);
        const totalPaid =
          Number(advance) +
          Number(month_1) +
          Number(month_2) +
          Number(month_3) +
          Number(month_4_6) +
          Number(month_6plus);

        const remaining = totalAmount - totalPaid;
        const percentage = totalAmount ? (remaining / totalAmount) * 100 : 0;

        let color = "text-green-600";
        if (percentage > 50) {
          color = "text-red-600";
        } else if (percentage > 20) {
          color = "text-yellow-600";
        } else if (percentage > 0) {
          color = "text-blue-600";
        } else {
          color = "text-red-600";
        }

        return (
          <span className={`text-sm font-semibold ${color}`}>
            {percentage.toFixed(2)}%
          </span>
        );
      },
    },
  };

  const handleUpdate = async (
    rowId: string,
    changes: Partial<ExposureBucketing>
  ) => {
    try {
      // console.log("Updating row:", rowId, "with changes:", changes);

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
    <div className="space-y-6">
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* status_bucketing Filter */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-secondary-text-dark">
            Status
          </label>
          <select
            className="border border-border bg-secondary-color-lt text-secondary-text rounded-md px-3 py-2 focus:outline-none"
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

        <div></div>
        <div></div>

        {/* Search */}
        <div className="flex items-center justify-end gap-4">
          <form
            className="relative flex items-center"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              placeholder="Search"
              className="pl-4 pr-10 py-2 border border-border rounded-lg focus:outline-none bg-secondary-color-lt text-secondary-text-dark min-w-full"
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

      <NyneOSTable
        data={data}
        filter={filteredData}
        columns={columns}
        setData={setData}
        defaultColumnVisibility={defaultVisibility}
        draggableColumns={[
          "document_id",
          "exposure_type",
          "entity",
          "counterparty_name",
          "total_original_amount",
          "currency",
          "document_date",
          "status_bucketing",
        ]}
        sortableColumns={[
          "document_id",
          "exposure_type",
          "entity",
          "counterparty_name",
          "total_original_amount",
          "document_date",
          "value_date",
          "status_bucketing",
        ]}
        expandedRowConfig={expandedRowConfig}
        onUpdate={handleUpdate}
        className="mb-8"
        edit={Visibility.edit}
        approve={Visibility.approve}
        reject={Visibility.reject}
      />
    </div>
  );
};

export default ExposureBucketing;
