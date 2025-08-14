import {
  // Filter,
  // RotateCcw,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { exportToExcel } from "../../ui/exportToExcel";
import Button from "../../ui/Button";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import React from "react";
// import LoadingSpinner from '../../ui/LoadingSpinner';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import ExpandedRow from "./RenderExpandedCell";
import axios from "axios";
import { useNotification } from "../../Notification/Notification";
import Pagination from "../../ui/Pagination";
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

const Awaitinguser: React.FC = () => {
  // const [data] = useState<UserType[]>(sampleUsers);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editStates, setEditStates] = useState<
    Record<string, Partial<UserType>>
  >({});

  const [searchTerm, setSearchTerm] = useState("");
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  // const [showSelected, setShowSelected] = useState<boolean>(true);
  const [data, setData] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  type TabVisibility = {
    // add:boolean,
    // edit:boolean,
    // delete:boolean,
    approve: boolean;
    reject: boolean;
    view: boolean;
    // upload:boolean,
  };
  const roleName = localStorage.getItem("userRole");
  const [Visibility, setVisibility] = useState<TabVisibility>({
    approve: true,
    reject: true,
    view: true,
    // delete: true,
  });
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionJSON",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["user-creation"];

        if (userTabs) {
          setVisibility({
            approve: userTabs?.tabs?.allTab?.showApproveButton,
            reject: userTabs?.tabs?.allTab?.showRejectButton,
            view: userTabs?.tabs?.allTab?.hasAccess,
            // delete: userTabs?.allTab?.showDeletebutton || false,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, []);

  const { notify } = useNotification();
  useEffect(() => {
    axios
      .get("https://backend-slqi.onrender.com/api/users/awaitingdata")
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
          setLoading(false);

          console.error("Failed to load users:", response.data.error);
        }
      })
      .catch((error) => {
        setLoading(false);

        console.error("Error fetching users:", error);
      });
  }, []);

  const toggleRowExpansion = useCallback((rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const lowerSearch = searchTerm.toLowerCase();

    return data.filter((user) => {
      return Object.entries(user)
        .flatMap(([value]) => {
          if (typeof value === "object" && value !== null) {
            // Handle nested object (e.g., role.name)
            return Object.values(value);
          }
          return value;
        })
        .filter(Boolean) // remove undefined/null
        .some((field) => String(field).toLowerCase().includes(lowerSearch));
    });
  }, [searchTerm, data]);

  const handleBulkUserReject = () => {
    const selectedUserIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedUserIds.length === 0)
      return notify("No users selected", "warning");

    axios
      .post("https://backend-slqi.onrender.com/api/users/bulk-reject", {
        userIds: selectedUserIds,
        rejected_by: localStorage.getItem("userEmail"),
        rejection_comment: "Bulk user rejection",
      })
      .then((response) => {
        notify("Users rejected successfully", "success");
        const rejectedIds = response.data.updated.map(
          (u: { id: number }) => u.id
        );
        setData((prev) =>
          prev.map((user) =>
            rejectedIds.includes(user.id)
              ? { ...user, status: "rejected" }
              : user
          )
        );
      })
      .catch(() => {
        //  console.error("Bulk user reject error:", error);
        // alert("Failed to reject selected users.");
        notify("Failed to reject selected users.", "error");
      });
  };
  const handleBulkUserApprove = () => {
    const selectedUserIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedUserIds.length === 0)
      return notify("No users selected", "warning");

    axios
      .post("https://backend-slqi.onrender.com/api/users/bulk-approve", {
        userIds: selectedUserIds,
        approved_by: localStorage.getItem("userEmail"),
        approval_comment: "Bulk user approval",
      })
      .then((response) => {
        // alert("Users processed successfully");
        notify("Users processed successfully", "success");

        const approvedIds =
          response.data.approved?.map((u: { id: number }) => u.id) || [];
        const deletedIds =
          response.data.deleted?.map((u: { id: number }) => u.id) || [];

        setData((prev) =>
          prev
            .filter((user) => !deletedIds.includes(user.id))
            .map((user) =>
              approvedIds.includes(user.id)
                ? { ...user, status: "approved" }
                : user
            )
        );
      })
      .catch(() => {
        //  console.error("Bulk user approve error:", error);
        // alert("Failed to approve selected users.");
        notify("Failed to approve selected users.", "error");
      });
  };

  const columns = useMemo<ColumnDef<UserType>[]>(() => {
    const baseColumns: ColumnDef<UserType>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-start">
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-start">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={row.getToggleSelectedHandler()}
              className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
            />
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
      // {
      //   accessorKey: "role.name",
      //   header: "Role",
      //   cell: ({ row }) => (
      //     <span className="text-gray-700">
      //       {row.original.role?.name ?? "—"}
      //     </span>
      //   ),
      // },
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
      // {
      //   accessorKey: "officeStartTime",
      //   header: "Start Time",
      //   cell: (info) => (
      //     <span className="text-gray-700">{info.getValue() as string}</span>
      //   ),
      // },
      // {
      //   accessorKey: "officeEndTime",
      //   header: "End Time",
      //   cell: (info) => (
      //     <span className="text-gray-700">{info.getValue() as string}</span>
      //   ),
      // },
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
          <span className="text-secondary-text">
            {info.getValue() ? "Yes" : "No"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue() as string;

          const statusColors: Record<string, string> = {
            approved: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            "delete-approval": "bg-orange-100 text-orange-800",
            "awaiting-approval": "bg-yellow-100 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
            inactive: "bg-gray-200 text-gray-700",
          };

          const normalizedStatus = status.toLowerCase();

          const toPascalCase = (str: string) =>
            str.replace(
              /\w+/g,
              (word) => word[0].toUpperCase() + word.substring(1).toLowerCase()
            );

          const displayStatus = toPascalCase(status);

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
        accessorKey: "actions",
        header: "Action",
        cell: ({ row }) => (
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

            {/* <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
              <Trash2 className="w-4 h-4 text-red-600" />
            </button> */}
          </div>
        ),
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
            className="p-2 hover:bg-primary-xl rounded-md transition-colors"
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

    return baseColumns;
  }, [expandedRows, toggleRowExpansion, data]);

  const defaultVisibility: Record<string, boolean> = {
    srNo: true,
    select: true,
    authenticationType: false,
    employeeName: true,
    username: true,
    email: false,
    mobile: false,
    address: false,
    businessUnitName: false,
    // officeStartTime: false,
    // officeEndTime: false,
    createdBy: false,
    createdDate: true,
    statusChangeRequest: false,
    status: true,
    actions: true,
    details: Visibility.view,
  };

  const [columnVisibility, setColumnVisibility] = useState(defaultVisibility);

  const table = useReactTable({
    data: filteredData,
    columns,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnOrder,
      columnVisibility,
    },
  });
  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="space-y-6">
        <div className="mt-14 flex flex-col gap-6 w-full">
          <div className="flex justify-end w-full">
            <div className="flex items-center gap-4 w-2xl justify-end">
              <button
                type="button"
                className="text-primary group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
                title="Download All Roles"
                onClick={() => exportToExcel(filteredData, "All_Roles")}
              >
                <Download className="flex items-center justify-center text-primary group-hover:text-white" />
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
                className="relative flex items-center w-full md:w-64"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-4 pr-10 py-2 text-secondary-text bg-secondary-color-lt border border-border rounded-lg focus:outline-none w-full hover:border hover:border-primary"
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
                    className="w-4 h-4 accent-primary"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {filteredData.length > 0 &&
            (Visibility.approve || Visibility.reject) && (
              <div className="flex justify-end w-full">
                <div className="flex items-center gap-2 w-2xl justify-end">
                  {Visibility.approve && (
                    <Button onClick={handleBulkUserApprove}>Approve</Button>
                  )}
                  {Visibility.reject && (
                    <Button color="Fade" onClick={handleBulkUserReject}>Reject</Button>
                  )}
                </div>
              </div>
            )}
        </div>

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
                                  <div className="cursor-move border-border text-header-color hover:bg-primary-lg rounded px-1 py-1 transition duration-150 ease-in-out">
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
                          edit={false}
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
                            // "status",
                            // "approvedBy",
                            // "approvedAt",
                            // "rejectedBy",
                            // "rejectedAt",
                            // "approvalComment",
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Component */}
        <Pagination
          table={table}
          totalItems={filteredData.length}
          currentPageItems={table.getRowModel().rows.length}
          startIndex={
            table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
            1
          }
          endIndex={Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            filteredData.length
          )}
        />
      </div>
    </>
  );
};
export default Awaitinguser;
