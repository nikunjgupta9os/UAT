import { ChevronDown, ChevronUp, Download } from "lucide-react";
import Pagination from "../../ui/Pagination";
import LoadingSpinner from '../../ui/LoadingSpinner';
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useNotification } from "../../Notification/Notification";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import ExpandedRow from "../../common/RenderExpandedCell";
import Button from "../../ui/Button";
import { exportToExcel } from "../../ui/exportToExcel";
// import LoadingSpinner from "../../ui/LoadingSpinner";
import {useCallback} from 'react';

const roleFieldLabels: Record<string, string> = {
  id: "Role ID",
  name: "Role Name",
  role_code: "Role Code",
  description: "Description",
  startTime: "Start Time",
  endTime: "End Time",
  createdAt: "Created At",
  status: "Status",
  createdBy: "Created By",
  // approvedBy: "Approved By",
  // approveddate: "Approved Date",
};

type BackendResponse = {
  showCreateButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showApproveButton?: boolean;
  showRejectButton?: boolean;
  roleData?: Role[];
};



const AwaitingApproval: React.FC = () => {
  // const [data] = useState<UserType[]>(sampleUsers);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editStates, setEditStates] = useState<
    Record<string, Partial<UserType>>
  >({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  // const [showSelected, setShowSelected] = useState<boolean>(true);
  const [data, setData] = useState<Role[]>([]);
  
  // const [actionVisibility, setActionVisibility] = useState({
  //   showCreateButton: false,
  //   showEditButton: false,
  //   showDeleteButton: false,
  //   showApproveButton: false,
  //   showRejectButton: false,
  // });
  type TabVisibility = {
    // add:boolean,
    // edit:boolean,
    // delete: boolean;
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
  });
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionjson",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["roles"];

        if (userTabs) {
          setVisibility({
            approve: userTabs?.tabs?.allTab?.showApproveButton,
            reject: userTabs?.tabs?.allTab?.showRejectButton,
            view: userTabs?.tabs?.allTab?.hasAccess,
            // delete: userTabs?.allTab?.showDeleteButton || false,
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
      .get<BackendResponse>(
        "https://backend-slqi.onrender.com/api/roles/awaitingData?nocache=${Date.now()}"
      )
      .then(({ data }) => {
        if (!data || !data.roleData) {
          setLoading(false);
           console.error("Invalid payload structure or empty response:", data);
          return;
        }

        // const {
        //   showCreateButton,
        //   showEditButton,
        //   showDeleteButton,
        //   showApproveButton,
        //   showRejectButton,
        //   roleData,
        // } = data;

        // setActionVisibility({
        //   showCreateButton: !!showCreateButton,
        //   showEditButton: !!showEditButton,
        //   showDeleteButton: !!showDeleteButton,
        //   showApproveButton: !!showApproveButton,
        //   showRejectButton: !!showRejectButton,
        // });

        setData(data.roleData);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);

         console.error("Error fetching roles:", err);
      });
  }, []);

  const handleBulkApprove = () => {
    const selectedRoleIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);
    if (selectedRoleIds.length === 0) return notify("No roles selected", "warning");

    axios
      .post("https://backend-slqi.onrender.com/roles/bulk-approve", {
        roleIds: selectedRoleIds,
        approved_by: localStorage.getItem("userEmail"), // or username/email depending on your system
        approval_comment: "Bulk approved",
      })
      .then((response) => {
        // alert("Roles approved successfully");
        notify("Roles approved successfully", "success");
        const updatedIds = response.data.updated.map(
          (r: { id: number }) => r.id
        );
        setData((prev) =>
          prev.map((role) =>
            updatedIds.includes(role.id)
              ? { ...role, status: "approved" }
              : role
          )
        );
      })
      .catch(() => {
        //  console.error("Bulk approve error:", error);
        // notify("Failed to approve selected roles.", "error");
        // alert("Failed to approve selected roles.");
      });
  };

  const handleBulkReject = () => {
    const selectedRoleIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    if (selectedRoleIds.length === 0) return notify("No roles selected", "warning");  

    axios
      .post("https://backend-slqi.onrender.com/roles/bulk-reject", {
        roleIds: selectedRoleIds,
        rejected_by: localStorage.getItem("userEmail"),
        rejection_comment: "Bulk rejected",
      })
      .then((response) => {
        // alert("Roles rejected successfully");
        notify("Roles rejected successfully", "success");
        const rejectedIds = response.data.updated.map(
          (r: { id: number }) => r.id
        );
        setData((prev) =>
          prev.map((role) =>
            rejectedIds.includes(role.id)
              ? { ...role, status: "rejected" }
              : role
          )
        );
      })
      .catch(() => {
        //  console.error("Bulk reject error:", error);
        // alert("Failed to reject selected roles.");
        notify("Failed to reject selected roles.", "error");
      });
  };

  // function handleDelete(roleId: number) {
  //   if (!window.confirm("Are you sure you want to delete this role?")) return;

  //   axios
  //     .post(`https://backend-slqi.onrender.com/roles/${roleId}/delete`)
  //     .then((response) => {
  //       const data = response.data;
  //       alert(
  //         `Role deleted successfully: ${data.deleted?.name || "Unnamed Role"}`
  //       );
  //       setData((prevRoles) => prevRoles.filter((role) => role.id !== roleId));
  //     })
  //     .catch((error) => {
  //        console.error("Delete error:", error);
  //       const message =
  //         error.response?.data?.message ||
  //         error.response?.data?.error ||
  //         "An error occurred while deleting the role.";
  //       alert(`Error: ${message}`);
  //     });
  // }

  const toggleRowExpansion = useCallback(
    (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  },[]
  )

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const lowerSearch = searchTerm.toLowerCase();

    return data.filter((user) => {
      return Object.entries(user)
        .flatMap(([ value]) => {
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

  const columns = useMemo<ColumnDef<Role>[]>(() => {
    const baseColumns: ColumnDef<Role>[] = [
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
        accessorKey: "id",
        header: "ID",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as number}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Role Name",
        cell: (info) => (
          <span className="font-medium text-secondary-text-dark">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "role_code",
        header: "Role Code",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "startTime",
        header: "Start Time",
        cell: (info) => (
          <span className="text-secondary-text">
            {(info.getValue() as string) ?? "N/A"}
          </span>
        ),
      },
      {
        accessorKey: "endTime",
        header: "End Time",
        cell: (info) => (
          <span className="text-secondary-text">
            {(info.getValue() as string) ?? "N/A"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: (info) => {
          const value = info.getValue() as string;
          const date = new Date(value);
          return (
            <span className="text-secondary-text">
              {isNaN(date.getTime()) ? value : date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue() as string;
          const statusColors: Record<string, string> = {
            Approved: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            "Delete-Approval": "bg-yellow-100 text-yellow-800",
            "Awaiting-Approval": "bg-yellow-100 text-yellow-800",
            "Delete-approval": "bg-yellow-100 text-yellow-800",
            "delete-approval": "bg-yellow-100 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
            approved: "bg-green-100 text-green-800",
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
        accessorKey: "createdBy",
        header: "Created By",
        cell: (info) => (
          <span className="text-secondary-text">
            {(info.getValue() as string) ?? "—"}
          </span>
        ),
      },
      // {
      //   accessorKey: "approvedBy",
      //   header: "Approved By",
      //   cell: (info) => (
      //     <span className="text-secondary-text">
      //       {(info.getValue() as string) ?? "—"}
      //     </span>
      //   ),
      // },
      {
        accessorKey: "approveddate",
        header: "Approved Date",
        cell: (info) => {
          const value = info.getValue() as string;
          const date = new Date(value);
          return (
            <span className="text-gray-700">
              {value
                ? isNaN(date.getTime())
                  ? value
                  : date.toLocaleDateString()
                : "—"}
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
                  `Role_${row.original.name || row.original.id}`
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

    

    return baseColumns;
  }, [expandedRows, toggleRowExpansion, data]);

  const defaultVisibility: Record<string, boolean> = {
    srNo: true,
    select: true,
    id: false,
    name: true,
    role_code: false,
    description: true,
    startTime: true,
    endTime: true,
    createdAt: true,
    status: true,
    createdBy: false,
    approvedBy: false,
    approveddate: false,
    actions: true,
    details: Visibility.view,
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
        pageSize: 10, // Add default page size
      },
    },
    state: {
      columnOrder,
      columnVisibility,
    },
    enableRowSelection: true, // Add this for row selection
  });
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
    <>

      <div className="space-y-6">
        <div className="mt-14 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left side: Approve / Reject */}
          <div className="flex items-center gap-2 min-w-[12rem]">
            {filteredData.length > 0 && Visibility.approve && (
              <Button onClick={handleBulkApprove}>Approve</Button>
            )}
            {filteredData.length > 0 && Visibility.reject && (
              <Button color="Fade" onClick={handleBulkReject}>Reject</Button>
            )}
          </div>

          {/* Right side: Download, Refresh, Search */}
          <div className="flex items-center gap-4 w-full md:w-auto">
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

        <div className="w-full overflow-x-auto">
          <div className="shadow-lg border border-border">
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
                    <col
                      key={col.id}
                      className={
                        col.id === "select"
                          ? "font-medium min-w-[20px]"
                          : "font-medium min-w-[150px]"
                      }
                    />
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
                          No role found
                        </p>
                        <p className="text-sm text-gray-500">
                          There are no role to display at the moment.
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
                          fieldLabels={roleFieldLabels}
                          visibleColumnCount={
                            table.getVisibleLeafColumns().length
                          }
                          // editableKeys={["address", "mobile"]}
                          detailsFields={[
                            // "Role ID",
                            "name",
                            "description",
                            "startTime",
                            "endTime",
                            // "status",
                          ]}
                          approvalFields={[
                            "createdBy",
                            "createdAt",
                            // "approvedBy",
                            // "approveddate",
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
            {/* <PaginationFooter table={table} /> */}
          </div>
        </div>
        <Pagination
          table={table}
          totalItems={totalItems}
          currentPageItems={currentPageItems}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>
    </>
  );
};
export default AwaitingApproval;
