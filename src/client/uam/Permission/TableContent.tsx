import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useNotification } from "../../Notification/Notification";
import axios from "axios";
import { Download } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import Button from "../../ui/Button";
import { exportToExcel } from "../../ui/exportToExcel";

// Types
// interface PermissionData {
//   srNo?: number;
//   RoleName: string;
//   UpdatedBy: string;
//   UpdatedDate: string;
//   Status: string;
// }

const TableContent: React.FC<{
  data: PermissionData[];
  searchTerm: string;
  showSelected: boolean;
  onSearchChange: (term: string) => void;
}> = ({ data, searchTerm, showSelected, onSearchChange }) => {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  // Track selected rows
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const roleName = localStorage.getItem("userRole");

  const [Visibility, setVisibility] = useState<TabVisibility>({
    allTab: false,
    uploadTab:false,
    pendingTab: false,
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionJSON",
          { roleName }
        );

        const pages = response.data?.pages;
        const userTabs = pages?.["permissions"];

        if (userTabs) {
          setVisibility({
            allTab: userTabs?.allTab?.hasAccess || false,
            uploadTab: userTabs?.uploadTab?.hasAccess || false,
            pendingTab: userTabs?.pendingTab?.hasAccess || false,
          });
        }
      } catch (error) {
        //  console.error("Error fetching permissions:", error);
      }
    };

    fetchPermissions();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return data;
    const lowerSearch = searchTerm.toLowerCase().trim();
    return data.filter((user) =>
      Object.values(user)
        .flatMap((value) =>
          typeof value === "object" && value !== null
            ? Object.values(value)
            : [value]
        )
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(lowerSearch))
    );
  }, [searchTerm, data]);

  const columns = useMemo<ColumnDef<PermissionData>[]>(() => {
    const baseColumns: ColumnDef<PermissionData>[] = [
      {
        accessorKey: "srNo",
        header: "Sr No",
        cell: ({ row }) => (
          <span className="text-secondary-text">{row.index + 1}</span>
        ),
      },
      {
        accessorKey: "roleName",
        header: "roleName",
        cell: (info) => (
          <span className="text-secondary-text">
            {info.getValue() as string}
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
            rejected: "bg-red-100 text-red-800",

            "awaiting-approval": "bg-yellow-100 text-yellow-800",
            inactive: "bg-gray-200 text-gray-700",
          };

          return (
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                statusColors[status.toLowerCase()] ||
                "bg-gray-100 text-gray-800"
              }`}
            >
              {status}
            </span>
          );
        },
      },
    ];

    if (showSelected) {
      baseColumns.unshift({
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
      });
    }

    return baseColumns;
  }, [showSelected]);

  const defaultVisibility: Record<string, boolean> = {
    select: true,
    srNo: true,
    RoleName: true,
    // UpdatedBy: true,
    // UpdatedDate: true,
    Status: true,
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

  useEffect(() => {
    if (columnOrder.length === 0) {
      setColumnOrder(table.getAllLeafColumns().map((col) => col.id));
    }
  }, [table, columnOrder]);

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

  const { notify } = useNotification();

  // Update selectedRows when selection changes
  useEffect(() => {
    if (table) {
      const selected = table.getSelectedRowModel().rows.map((row) => {
        // Use roleName as unique identifier
        return row.original.roleName;
      });
      setSelectedRows(selected);
    }
  }, [table.getSelectedRowModel().rows]);

  const handleApprove = async () => {
    if (selectedRows.length === 0) {
      // alert("Please select at least one role to approve.");
      notify("Please select at least one role to approve.", "warning");
      return;
    }
    try {
      for (const roleName of selectedRows) {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/update-role-permissions-status-by-name",
          {
            roleName,
            status: "Approved",
          }
        );
        //  console.log("Approve Response for", roleName, response.data);
      }
      // alert("Selected role permissions approved successfully.");
      notify("Selected role permissions approved successfully.", "success");
      // window.location.reload();
    } catch (error) {
      //  console.error("Error approving role permissions:", error);
      // alert("Failed to approve role permissions.");
      notify("Failed to approve role permissions.", "error");
    }
  };

  const handleReject = async () => {
    if (selectedRows.length === 0) {
      // alert("Please select at least one role to reject.");
      notify("Please select at least one role to reject.", "warning");
      return;
    }
    try {
      for (const roleName of selectedRows) {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/update-role-permissions-status-by-name",
          {
            roleName,
            status: "Rejected",
          }
        );
        //  console.log("Reject Response for", roleName, response.data);
      }
      // alert("Selected role permissions rejected successfully.");
      notify("Selected role permissions rejected successfully.", "success");
      // window.location.reload();
    } catch (error) {
      //  console.error("Error rejecting role permissions:", error);
      // alert("Failed to reject role permissions.");
      notify("Failed to reject role permissions.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div></div>
        <div></div>
        <div></div>
        <div className="mt-10 flex items-center justify-end gap-4">
          <button
            type="button"
            className="flex items-center justify-center border border-border rounded-lg px-2 h-10 text-sm transition"
            title="Download All Roles"
            onClick={() => exportToExcel(filteredData, "All_Roles")}
          >
            <Download className="flex item-center justify-center text-primary" />
          </button>
          <button
            type="button"
            className="flex items-center text-primary justify-center border border-border rounded-lg w-10 h-10 hover:bg-[#e6f7f5] transition"
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
              className="pl-4 pr-10 text-secondary-text bg-secondary-color-lt py-2 border border-border rounded-lg focus:outline-none min-w-full"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
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

      {/* Action Buttons */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 min-w-[12rem]">
          <Button onClick={handleApprove}>Approve</Button>
          <Button onClick={handleReject}>Reject</Button>
        </div>
      </div>

      {/* Table with DndContext properly positioned */}
      <div className="w-full overflow-x-auto">
        <div className=" shadow-lg border border-border">
          <DndContext onDragEnd={handleDragEnd}>
            <table className="min-w-full">
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
              <tbody className="divide-y ">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
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
                    <tr
                      key={row.id}
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
                  ))
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default TableContent;
