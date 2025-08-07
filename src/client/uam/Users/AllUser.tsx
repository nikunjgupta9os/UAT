import {
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  Calendar,
} from "lucide-react";

import { DateRange } from "react-date-range";
import { useNotification } from "../../Notification/Notification";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { exportToExcel } from "../../ui/exportToExcel";

import { useMemo, useState, useEffect } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import ExpandedRow from "./RenderExpandedCell";
import axios from "axios";
import Pagination from "../../ui/Pagination"; // Add this import
import LoadingSpinner from "../../ui/LoadingSpinner";

const fieldLabels: Record<string, string> = {
  id: "ID",
  authenticationType: "Auth Type",
  employeeName: "Employee Name",
  username: "Username",
  email: "Email",
  mobile: "Mobile",
  address: "Address",
  businessUnitName: "Business Unit",
  createdBy: "Created By",
  createdDate: "Created Date",
  approvedBy: "Approved By",
  approvedAt: "Approved At",
  rejectedBy: "Rejected By",
  rejectedAt: "Rejected At",
  approvalComment: "Approval Comment",
  status: "Status",
  actions: "Actions",
};

const AllUser: React.FC = () => {
  // const [data] = useState<UserType[]>(sampleUsers);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editStates, setEditStates] = useState<
    Record<string, Partial<UserType>>
  >({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [originalData, setOriginalData] = useState<UserType[]>([]); // Store original unfiltered data
  const [statusFilter, setStatusFilter] = useState<string>("all"); // For status dropdown
  const [showDatePicker, setShowDatePicker] = useState(false); // Control date picker visibility
  const [dateRange, setDateRange] = useState([
    // For date range selection
    {
      startDate: null as Date | null,
      endDate: null as Date | null,
      key: "selection",
    },
  ]);

  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  // const [showSelected, setShowSelected] = useState<boolean>(false);
  const [data, setData] = useState<UserType[]>([]);

  type TabVisibility = {
    // add:boolean,
    // edit:boolean,
    delete: boolean;
    // approve:boolean,
    // reject:boolean,
    view: boolean;
    // upload:boolean,
  };
  const roleName = localStorage.getItem("userRole");
  const [Visibility, setVisibility] = useState<TabVisibility>({
    view: true,
    delete: true,
  });
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionjson",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["user-creation"];

        if (userTabs) {
          setVisibility({
            view: userTabs?.tabs?.allTab?.hasAccess || false,
            delete: userTabs?.tabs?.allTab?.showDeleteButton || false,
          });
        }
      } catch (error) {
         console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, []);

  useEffect(() => {
    axios
      .get("https://backend-slqi.onrender.com/api/users/approvedusers")
      .then((response) => {
        if (response.data.success) {
          setLoading(false);
          const transformedUsers: UserType[] = response.data.users.map(
            (user) => ({
              authenticationType: user.authentication_type,
              employeeName: user.employee_name,
              username: user.username_or_employee_id,
              email: user.email,
              mobile: user.mobile,
              role: { name: user.role_name || "—" }, // fallback for missing role
              address: user.address,
              businessUnitName: user.business_unit_name,
              createdBy: user.created_by,
              createdDate: user.created_at,
              status: user.status,
              statusChangeRequest: false, // You can add actual flag if backend supports
            })
          );
          setData(transformedUsers);
        } else {
           console.error("Failed to load users:", response.data.error);
          setLoading(false);
        }
      })
      .catch((error) => {
         console.error("Error fetching users:", error);
        setLoading(false);
      });
  }, []);

  const { notify } = useNotification();

  useEffect(() => {
    axios
      .get("https://backend-slqi.onrender.com/api/users")
      .then((response) => {
        if (response.data.success) {
          setLoading(false);
          const transformedUsers: UserType[] = response.data.users.map(
            (user) => ({
              id: user.id,
              authenticationType: user.authentication_type,
              employeeName: user.employee_name,
              username: user.username_or_employee_id,
              email: user.email,
              mobile: user.mobile,
              role: { name: user.role_name || "—" },
              address: user.address,
              businessUnitName: user.business_unit_name,
              createdBy: user.created_by,
              createdDate: user.created_at,
              status: user.status,
              statusChangeRequest: false,
            })
          );
          setData(transformedUsers);
          setOriginalData(transformedUsers); // Store original data
        } else {
          setLoading(false);
           console.error("Failed to load users:", response.data.error);
        }
      })
      .catch((error) => {
        setLoading(false);
         console.error("Error fetching users:", error);
      });
  }, []);

  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    originalData.forEach((user) => {
      if (user.status) options.add(user.status);
    });
    return ["all", ...Array.from(options)];
  }, [originalData]);

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const handleDelete = (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    axios
      .post(`https://backend-slqi.onrender.com/api/users/${userId}/delete`)
      .then(() => {
        // const data = response.data;
        // alert(`User delete requested successfully`);
        notify(`User delete requested successfully`, "success");

        // Update the users list by removing the deleted user
        setData((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      })
      .catch((error) => {
         console.error("Delete error:", error);
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "An error occurred while deleting the user.";
        // alert(`Error: ${message}`);
        notify(`Error: ${message}`, "error");
      });
  };
  const filteredData = useMemo(() => {
    let result = [...originalData];

    // Apply search filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((user) => {
        return Object.entries(user)
          .flatMap(([value]) => {
            if (typeof value === "object" && value !== null) {
              return Object.values(value);
            }
            return value;
          })
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(lowerSearch));
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((user) => user.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange[0].startDate && dateRange[0].endDate) {
      const start = new Date(dateRange[0].startDate);
      const end = new Date(dateRange[0].endDate);

      // Set time to beginning and end of day for complete coverage
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      result = result.filter((user) => {
        if (!user.createdDate) return false;
        const userDate = new Date(user.createdDate);
        return userDate >= start && userDate <= end;
      });
    }

    return result;
  }, [searchTerm, originalData, statusFilter, dateRange]);

  const columns = useMemo<ColumnDef<UserType>[]>(() => {
    const baseColumns: ColumnDef<UserType>[] = [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-center">
            <input type="checkbox" />
          </div>
        ),
        cell: () => (
          <div className="flex items-center justify-center">
            <input type="checkbox" />
          </div>
        ),
      },
      
      {
        accessorKey: "srNo",
        header: "Sr No",
        cell: ({ row }) => (
          <span className="text-secondary-text">{row.index + 1}</span>
        ),
      },
      {
        accessorKey: "authenticationType",
        header: "Auth Type",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "employeeName",
        header: "Employee Name",
        cell: (info) => (
          <span className="font-medium text-secondary-text-dark">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "address",
        header: "Address",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "businessUnitName",
        header: "Business Unit",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Created By",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "createdDate",
        header: "Created Date",
        cell: (info) => {
          const dateStr = info.getValue() as string;
          const date = new Date(dateStr);
          return (
            <span className="text-secondary-text">
              {isNaN(date.getTime()) ? dateStr : date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "statusChangeRequest",
        header: "Status Change Request",
        cell: (info) => (
          <span className="text-gray-700">
            {info.getValue() ? "Yes" : "No"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const rawStatus = info.getValue();

           console.log("Status Cell:", rawStatus);

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
            pending: "bg-yellow-100 text-yellow-800",
            Pending: "bg-yellow-100 text-yellow-800",
            "Delete-Approval": "bg-yellow-100 text-yellow-800",
            "delete-approval": "bg-yellow-100 text-yellow-800",
            "Delete-approval": "bg-yellow-100 text-yellow-800",
            // "Delete-Approval": "bg-yellow-100 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
            appoved: "bg-green-100 text-green-800",
            Rejected: "bg-red-100 text-red-800",
            "Awaiting-approval": "bg-yellow-100 text-yellow-800", // ✅ Fix: quotes added
            Inactive: "bg-gray-200 text-gray-700",
          };

          const toPascalCase = (str: string) => {
            return str.replace(
              /(\w)(\w*)/g,
              (_, firstChar, rest) =>
                firstChar.toUpperCase() + rest.toLowerCase()
            );
          };

          const displayStatus = toPascalCase(status);

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[status as keyof typeof statusColors] ||
                "bg-gray-100 text-gray-800"
              }`}
            >
              {displayStatus}
            </span>
          );
        },
      },

      {
        accessorKey: "actions",
        header: "Action",
        cell: ({ row }) => {
          const user = row.original as UserType;
          return (
            <div className="flex items-center space-x-1">
              <button
                className="p-1.5 hover:bg-primary-xl rounded transition-colors"
                onClick={() =>
                  exportToExcel(
                    [row.original], // wrap in array for xlsx
                    `Role_${row.original.username || row.original.id}`
                  )
                }
              >
                <Download className="w-4 h-4 text-primary" />
              </button>

              {Visibility.delete && (
                <button
                  className="p-1.5 hover:bg-primary-xl rounded transition-colors"
                  onClick={() => handleDelete(user.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          );
        },
      },
      {
        id: "details",
        header: () => (
          <div className="flex items-center justify-center">
            <button
              type="button"
              className="flex items-center justify-center mx-auto text-primary"
              title={
                expandedRows.size === data.length
                  ? "Collapse all"
                  : "Expand all"
              }
              onClick={() => {
                if (expandedRows.size === data.length) {
                  setExpandedRows(new Set());
                } else {
                  setExpandedRows(
                    new Set(data.map((_, index) => index.toString()))
                  );
                }
              }}
            >
              <ChevronDown
                size={22}
                className={
                  expandedRows.size === data.length
                    ? "rotate-180 transition-transform"
                    : "transition-transform"
                }
              />
            </button>
          </div>
        ),
        cell: ({ row }) => (
          <button
            onClick={() => toggleRowExpansion(row.id)}
            className="p-2 hover:bg-primary-xl rounded transition-colors"
            aria-label={
              expandedRows.has(row.id) ? "Collapse row" : "Expand row"
            }
          >
            {expandedRows.has(row.id) ? (
              <ChevronUp className="w-4 h-4 text-secondary-text" />
            ) : (
              <ChevronDown className="w-4 h-4 text-secondary-text" />
            )}
          </button>
        ),
      },
    ];

    // if (showSelected) {
    //   baseColumns.unshift({
        
    // }

    return baseColumns;
  }, [expandedRows, toggleRowExpansion, data]);

  const defaultVisibility: Record<string, boolean> = {
    select: false,
    srNo: true,
    authenticationType: false,
    employeeName: true,
    username: true,
    email: true,
    mobile: false,
    address: false,
    businessUnitName: false,
    createdBy: false,
    createdDate: false,
    statusChangeRequest: false,
    status: true,
    actions: true,
  };

  const [columnVisibility, setColumnVisibility] = useState(defaultVisibility);

  const table = useReactTable({
    data: filteredData,
    columns,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Keep this
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 10, // Set default page size
      },
    },
    state: {
      columnOrder,
      columnVisibility,
    },
  });

  // Add pagination calculations
  const pagination = table.getState().pagination;
  const totalItems = filteredData.length;
  const startIndex = pagination.pageIndex * pagination.pageSize + 1;
  const endIndex = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalItems
  );
  const currentPageItems = table.getRowModel().rows.length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Filters and Search Row */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="flex flex-col space-y-2">
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

        {/* Date Range Filter */}
        <div className="flex flex-col space-y-2 relative">
          <label className="text-sm font-medium text-secondary-text">
            Created Date
          </label>
          <div
            className="border border-border text-secondary-text rounded-md px-3 py-2 flex items-center justify-between cursor-pointer"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <span>
              {dateRange[0].startDate
                ? `${dateRange[0].startDate.toLocaleDateString()} - ${
                    dateRange[0].endDate?.toLocaleDateString() || ""
                  }`
                : "Select Date Range"}
            </span>
            <Calendar className="w-4 h-4 text-primary" />
          </div>

          {showDatePicker && (
            <div className="absolute z-10 top-16 left-0 bg-white shadow-lg rounded-md">
              <DateRange
                editableDateInputs={true}
                onChange={(item) => {
                  setDateRange([
                    {
                      ...item.selection,
                       key: "selection", // <-- Add this line
                      startDate: item.selection.startDate,
                      endDate: item.selection.endDate,
                    },
                  ]);
                }}
                moveRangeOnFirstSelection={false}
                ranges={dateRange}
              />
              <div className="flex justify-between p-2 border-t">
                <button
                  className="px-3 py-1 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                  onClick={() => setShowDatePicker(false)}
                >
                  Close
                </button>
                <button
                  className="px-3 py-1 bg-[#129990] text-white rounded-md text-sm hover:bg-[#0d7a73]"
                  onClick={() => {
                    if (dateRange[0].startDate && dateRange[0].endDate) {
                      setShowDatePicker(false);
                    }
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty column for spacing */}
        <div></div>

        {/* Search and Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            className="flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition"
            title="Download All Roles"
            onClick={() => exportToExcel(filteredData, "All_Roles")}
          >
            <Download className="flex item-center justify-center text-primary" />
          </button>
          <button
            type="button"
            className="flex items-center text-primary justify-center border border-primary rounded-lg w-10 h-10  transition"
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
              className="w-full text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
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

      {/* Table Section */}
      <div className="w-full overflow-x-auto">
        <div className=" shadow-lg border border-border">
          <table className="min-w-full">
            <DndContext
              onDragEnd={(event: DragEndEvent) => {
                const { active, over } = event;
                if (active.id !== over?.id) {
                  const oldIndex = columnOrder.indexOf(active.id as string);
                  const newIndex = columnOrder.indexOf(over?.id as string);
                  const newOrder = [...columnOrder];
                  newOrder.splice(oldIndex, 1);
                  newOrder.splice(newIndex, 0, active.id as string);
                  setColumnOrder(newOrder);
                }
              }}
            >
              <colgroup>
                {table.getVisibleLeafColumns().map((col) => (
                  <col key={col.id} className="font-medium min-w-[150px]" />
                ))}
              </colgroup>
              <thead className="bg-secondary-color rounded-xl">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      const isFirst = index === 0;
                      const isLast = index === headerGroup.headers.length - 1;

                      return (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
                          style={{ width: header.getSize() }}
                        >
                          <Droppable id={header.column.id}>
                            {isFirst || isLast ? (
                              <div className="px-1">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </div>
                            ) : (
                              <Draggable id={header.column.id}>
                                <div className="cursor-move rounded py-1 transition duration-150 ease-in-out">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </div>
                              </Draggable>
                            )}
                          </Droppable>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
            </DndContext>

            <tbody className="divide-y">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <svg
                          className="w-6 h-6 text-gray-400"
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
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        No users found
                      </p>
                      <p className="text-sm text-primary">
                        There are no users to display at the moment.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      className={
                        expandedRows.has(row.id) && row.index === 0
                          ? "bg-primary-md"
                          : row.index % 2 === 0
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
                    {expandedRows.has(row.id) && (
                      <ExpandedRow
                        row={row}
                        edit={true}
                        columnVisibility={columnVisibility}
                        editStates={editStates}
                        setEditStates={setEditStates}
                        editingRows={editingRows}
                        setEditingRows={setEditingRows}
                        fieldLabels={fieldLabels}
                        visibleColumnCount={
                          table.getVisibleLeafColumns().length
                        }
                        editableKeys={["address", "mobile"]}
                        detailsFields={[
                          "id",
                          "authenticationType",
                          "employeeName",
                          "username",
                          "email",
                          "mobile",
                          "address",
                          "businessUnitName",
                        ]}
                        approvalFields={[
                          "createdBy",
                          "createdDate",
                          "approvedBy",
                          "approvedAt",
                        ]}
                      />
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
};

export default AllUser;
