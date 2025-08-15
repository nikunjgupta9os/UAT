import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import axios from "axios";
// import { useNotification } from "../../Notification/Notification";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import ExpandedRow from "../../common/RenderExpandedCellRole";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Pagination from "../../ui/Pagination"; // Add this import
import { exportToExcel } from "../../ui/exportToExcel";
import { useNotification } from "../../Notification/Notification";

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
  approvedBy: "Approved By / Rejected By",
  approveddate: "Approved Date",
};

type BackendResponse = {
  showCreateButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showApproveButton?: boolean;
  showRejectButton?: boolean;
  roleData?: Role[];
};

const AllRoles: React.FC = () => {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editStates, setEditStates] = useState<
    Record<string, Partial<UserType>>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  // const [showSelected, setShowSelected] = useState<boolean>(true);
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState<Role[]>([]); // Store original unfiltered data
  // const [actionVisibility, setActionVisibility] = useState({
  //   showCreateButton: false,
  //   showEditButton: false,
  //   showDeleteButton: false,
  //   showApproveButton: false,
  //   showRejectButton: false,
  // });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: null,
      endDate: null,
      key: "selection",
    },
  ]);
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

  const { notify, confirm } = useNotification();
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

  async function handleDelete(roleId: number) {
    const confirmed = await confirm(
      "Are you sure you want to delete this role?"
    );
    if (!confirmed) return;

    axios
      .post(`https://backend-slqi.onrender.com/roles/${roleId}/delete`)
      .then((response) => {
        const data = response.data;
        notify(
          `Role delete requested successfully: ${
            data.deleted?.name || "Unnamed Role"
          }`,
          "success"
        );
        setData((prevRoles) => prevRoles.filter((role) => role.id !== roleId));
        setOriginalData((prevRoles) =>
          prevRoles.filter((role) => role.id !== roleId)
        );
      })
      .catch((error) => {
        //  console.error("Delete error:", error);
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "An error occurred while deleting the role.";
        // alert(`Error: ${message}`);
        notify(`Error: ${message}`, "error");
      });
  }

  useEffect(() => {
    axios
      .get<BackendResponse>(
        `https://backend-slqi.onrender.com/api/roles/page-data?nocache=${Date.now()}`
      )
      .then(({ data }) => {
        if (!data || !data.roleData) {
          setLoading(false);
          console.error("Invalid payload structure or empty response:", data);
          return;
        }

        setData(data.roleData);
        setLoading(false);

        setOriginalData(data.roleData); // Store original data
      })
      .catch((err) => {
        setLoading(false);

        console.error("Error fetching roles:", err);
      });
  }, []);

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

  // Get unique status values for dropdown
  const statusOptions = useMemo(() => {
    const options = new Set<string>();
    originalData.forEach((role) => {
      if (role.status) options.add(role.status);
    });
    return ["all", ...Array.from(options)];
  }, [originalData]);

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
      result = result.filter((role) => role.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange[0].startDate && dateRange[0].endDate) {
      const start = new Date(dateRange[0].startDate);
      const end = new Date(dateRange[0].endDate);

      result = result.filter((role) => {
        if (!role.createdAt) return false;
        const roleDate = new Date(role.createdAt);
        return roleDate >= start && roleDate <= end;
      });
    }

    return result;
  }, [searchTerm, originalData, statusFilter, dateRange]);

  const columns = useMemo<ColumnDef<Role>[]>(() => {
    const baseColumns: ColumnDef<Role>[] = [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-start">
            <input type="checkbox" />
          </div>
        ),
        cell: () => (
          <div className="flex items-center justify-start">
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
        accessorKey: "id",
        header: "Role ID",
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
        accessorKey: "createdBy",
        header: "Created By",
        cell: (info) => (
          <span className="text-secondary-text">
            {(info.getValue() as string) ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "approvedBy",
        header: "Approved By",
        cell: (info) => (
          <span className="text-gray-700">
            {(info.getValue() as string) ?? "—"}
          </span>
        ),
      },
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
              onClick={() =>
                exportToExcel([row.original], `Role_${row.original.id}`)
              }
              className="p-1.5 hover:bg-primary-xl rounded transition-colors"
            >
              <Download className="w-4 h-4 text-primary" />
            </button>
            {Visibility.delete && (
              <button
                className="p-1.5 hover:bg-primary-xl rounded transition-colors"
                onClick={() => handleDelete(row.original.id)}
              >
                <Trash2 className="w-4 h-4 text-red-color" />
              </button>
            )}
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
    select: false,
    id: true,
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

  // Pagination calculations
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
      <div className="space-y-4">
        {/* Filters Section - Row 1 */}
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

          {/* Date Range Filter */}
          <div className="flex flex-col relative">
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
                        key: "selection",
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
        </div>

        {/* Search and Action Buttons - Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="col-span-1 md:col-span-4 flex items-center justify-end gap-4">
            {/* Download Button */}
            <button
              type="button"
              className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
              title="Download All Roles"
              onClick={() => exportToExcel(filteredData, "All_Roles")}
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
                className="w-full text-secondary-text bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none hover:border hover:border-primary "
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
                    <col key={col.id} className="font-medium min-w-full" />
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
                            className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
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
                      className="px-6 py-12 text-left text-primary"
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
                        <p className="text-xl font-medium text-primary mb-1">
                          No Roles found
                        </p>
                        <p className="text-md font-normal text-primary">
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
                          columnVisibility={columnVisibility}
                          editStates={editStates}
                          setEditStates={setEditStates}
                          editingRows={editingRows}
                          setEditingRows={setEditingRows}
                          fieldLabels={roleFieldLabels}
                          visibleColumnCount={
                            table.getVisibleLeafColumns().length
                          }
                          editableKeys={["startTime", "description", "endTime"]}
                          timeFields={["startTime", "endTime"]} // Add this line for time fields
                          detailsFields={[
                            // "Role ID",
                            "name",
                            "description",
                            "startTime",
                            "endTime",
                            "status",
                          ]}
                          approvalFields={[
                            "createdBy",
                            "createdAt",
                            "approvedBy",
                            "approveddate",
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

export default AllRoles;
