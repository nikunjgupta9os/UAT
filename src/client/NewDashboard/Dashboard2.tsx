import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, FileSpreadsheet } from "lucide-react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Draggable } from "../common/Draggable";
import { Droppable } from "../common/Droppable";
import CustomSelect from "../common/SearchSelect";
import Layout from "../common/Layout";
import * as XLSX from "xlsx";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type GroupingState,
  type ColumnOrderState,
} from "@tanstack/react-table";

// Define the new Dashboard data type
export type Dashboard = {
  id: string;
  bu: string;
  currency: string;
  debitors: number;
  creditors: number;
  lc: number;
  grn: number;
  total_payable_exposure: number;
  cover_taken_export: number;
  cover_taken_import: number;
  outstanding_cover_export: number;
  outstanding_cover_import: number;
};

const nonDraggableColumns = ["bu", "currency"];
// Define some custom Tailwind colors for the theme
const customColors = {
  "primary-md": "bg-gray-100",
  "secondary-color": "bg-gray-200",
  "secondary-color-lt": "bg-white",
  "header-color": "text-gray-700",
  border: "border-gray-300",
  "primary-text": "text-gray-800",
};

// Helper function to generate mock Dashboard data.
const makeData = (len: number): Dashboard[] => {
  const currencies = ["USD", "EUR", "JPY", "INR"];
  const buNames = ["North America", "Europe", "Asia", "South America"];
  const data: Dashboard[] = [];
  for (let i = 0; i < len; i++) {
    const debitors = Math.floor(Math.random() * 500000) + 10000;
    const creditors = Math.floor(Math.random() * 600000) + 5000;
    const lc = Math.floor(Math.random() * 200000);
    const grn = Math.floor(Math.random() * 150000);

    data.push({
      id: `dashboard-${i}`,
      bu: buNames[Math.floor(Math.random() * buNames.length)],
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      debitors,
      creditors,
      lc,
      grn,
      total_payable_exposure: debitors + creditors,
      cover_taken_export: Math.floor(Math.random() * 100000),
      cover_taken_import: Math.floor(Math.random() * 120000),
      outstanding_cover_export: Math.floor(Math.random() * 80000),
      outstanding_cover_import: Math.floor(Math.random() * 90000),
    });
  }
  return data;
};

// Format a number with commas
const formatNumber = (num: number) => {
  if (num === null || num === undefined) return "";
  return num.toLocaleString();
};

const defaultColumns: ColumnDef<Dashboard>[] = [
  {
    accessorKey: "bu",
    header: "Business Unit",
    enableSorting: true,
    // enableDragging: true,
    cell: ({ getValue }) => String(getValue()),
  },
  {
    accessorKey: "currency",
    header: "Currency",
    enableSorting: true,
    // enableDragging: true,
    cell: ({ getValue }) => String(getValue()),
  },
  {
    accessorKey: "debitors",
    header: "Debitors",
    enableSorting: true,
    // enableDragging: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "creditors",
    header: "Creditors",
    enableSorting: true,
    // enableDragging: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "lc",
    header: "LC",
    enableSorting: true,
    // enableDragging: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "grn",
    header: "GRN",
    enableSorting: true,
    // enableDragging: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "total_payable_exposure",
    header: "Total Payable Exposure",
    enableSorting: true,
    // enableDragging: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "cover_taken_export",
    header: "Export Cover",
    enableSorting: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "cover_taken_import",
    header: "Import Cover",
    enableSorting: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "outstanding_cover_export",
    header: "Outstanding Export",
    enableSorting: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: "outstanding_cover_import",
    header: "Outstanding Import",
    enableSorting: true,
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
];

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-text"></div>
  </div>
);

// Custom grouping logic (no sortData)

// Main App component
export default function App() {
  const [data] = useState(() => makeData(100));
  const [sorting, setSorting] = useState<SortingState>([]);
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    defaultColumns.map((col) =>
      typeof (col as any).accessorKey === "string"
        ? typeof (col as any).accessorKey
        : ""
    )
  );
  const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  // Dynamically load the XLSX library
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/xlsx/dist/xlsx.full.min.js";
    script.onload = () => {
      console.log("XLSX library loaded successfully.");
      setIsXLSXLoaded(true);
    };
    script.onerror = (e) => {
      console.error("Failed to load XLSX library:", e);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const table = useReactTable({
    data,
    columns: defaultColumns,
    state: {
      sorting,
      grouping,
      columnOrder,
    },
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    enableGrouping: true,
  });

  // const getVisibleColumns = () => {
  //     return columnOrder
  //       .map((key) => defaultColumns.find((col) => typeof (col as any).accessorKey === key))
  //       .filter(Boolean);
  //   };columnOrder

  // const renderedColumns = getVisibleColumns();

  // // Helper to sum numeric columns for a group
  function getSumRow(rows: Dashboard[]) {
    const sum: Partial<Dashboard> = {};
    if (!rows.length) return sum;

    for (const key in rows[0]) {
      // Check if the property is a number
      if (typeof rows[0][key] === "number") {
        // Narrow the key type to a number-only key of Dashboard
        type NumberKey = {
          [K in keyof Dashboard]: Dashboard[K] extends number ? K : never;
        }[keyof Dashboard];

        const numberKey = key as NumberKey;

        sum[numberKey] = rows.reduce(
          (acc, row) => acc + (row[numberKey] as number),
          0
        );
      }
    }
    return sum;
  }

  const groupByOptions = useMemo(() => {
    if (!defaultColumns.length) return [];
    // Add a clear option at the top
    return [
      { value: "", label: "Ungroup (Show All)" },
      ...defaultColumns
        .filter((col) => typeof (col as any).accessorKey === "string")
        .map((col) => ({
          value: (col as any).accessorKey as string,
          label:
            typeof col.header === "string" ? col.header : String(col.header),
        })),
    ];
  }, [defaultColumns]);

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const exportData: any[] = [];
    const headers = table
      .getAllLeafColumns()
      .map((col) => col.columnDef.header as string);
    exportData.push(headers);

    // Flatten all rows including grouped ones
    const flattenRows = (rows: any[]) => {
      const result: any[] = [];

      rows.forEach((row) => {
        if (row.getIsGrouped()) {
          // Add group header
          result.push({
            isGroup: true,
            value: row.getValue(row.groupingColumnId as string),
            depth: row.depth,
          });
          // Add child rows
          result.push(...flattenRows(row.subRows));
        } else {
          // Add regular row data
          const rowData: Record<string, any> = {};
          table.getAllLeafColumns().forEach((col) => {
            rowData[col.id] = row.getValue(col.id);
          });
          result.push(rowData);
        }
      });

      return result;
    };

    const flattened = flattenRows(table.getRowModel().rows);

    flattened.forEach((item) => {
      if (item.isGroup) {
        // Add group header row with indentation
        const indent = "  ".repeat(item.depth);
        exportData.push([`${indent}${item.value}`]);
      } else {
        // Add data row
        const rowData = headers.map((header) => {
          const col = table
            .getAllLeafColumns()
            .find((c) => c.columnDef.header === header);
          return item[col?.id as string] || "";
        });
        exportData.push(rowData);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Auto-fit columns
    const wscols = headers.map(() => ({ wch: 20 }));
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Dashboard Data");
    XLSX.writeFile(wb, "Dashboard_Export.xlsx");
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (
      nonDraggableColumns.includes(active.id as string) ||
      nonDraggableColumns.includes(over.id as string)
    ) {
      return;
    }
    if (active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };
  const handleExportAsExcelSheets = () => {
    if (grouping.length === 0) {
      handleExportToExcel();
      return;
    }

    const wb = XLSX.utils.book_new();
    const exportDataKeys = table.getAllLeafColumns().map((col) => col.id);

    const processAndAddSheet = (rows: any[], sheetName: string) => {
      const sheetData = rows.map((row) => {
        const obj: Record<string, any> = {};
        exportDataKeys.forEach((key) => {
          obj[table.getColumn(key).columnDef.header as string] =
            row.getValue(key);
        });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
    };

    const groupAndExport = (
      rows: any[],
      depth: number,
      groupNames: string[]
    ) => {
      if (depth >= grouping.length) {
        const sheetName = groupNames.join(" - ").substring(0, 31) || "Data";
        if (rows.length > 0) {
          processAndAddSheet(rows, sheetName);
        }
        return;
      }

      const groupKey = grouping[depth];
      const grouped = rows.reduce((acc, row) => {
        const value = row.getValue(groupKey);
        const key = String(value);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as Record<string, any[]>);

      Object.entries(grouped).forEach(([groupValue, groupRows]) => {
        groupAndExport(groupRows as any[], depth + 1, [
          ...groupNames,
          groupValue,
        ]);
      });
    };

    groupAndExport(table.getRowModel().rows, 0, []);
    XLSX.writeFile(wb, "Dashboard_Grouped_Export.xlsx");
  };

  // const toggleGroupExpansion = (rowId: string) => {
  //   setCollapsedGroups((prev) => ({
  //     ...prev,
  //     [rowId]: !prev[rowId],
  //   }));
  // };

  const getVisibleColumns = () => {
    return columnOrder
      .map((key) =>
        defaultColumns.find((col) => typeof (col as any).accessorKey === key)
      )
      .filter(Boolean);
  };

  const getGroupedData = (data: Dashboard[]) => {
    if (grouping.length === 0) return data;
    const sortedData: Dashboard[] = table
      .getSortedRowModel()
      .rows.map((r) => r.original);
    const result: any[] = [];

    const renderGroupedRows = (
      rows: Dashboard[],
      depth: number,
      parentGroupValues: string[]
    ) => {
      if (depth === grouping.length) {
        return rows.forEach((row) =>
          result.push({ ...row, id: `row-${row.id}` })
        );
      }

      const groupKey = grouping[depth];
      const grouped = rows.reduce((acc, row) => {
        const value = row[groupKey as keyof Dashboard];
        const key = String(value);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as Record<string, Dashboard[]>);

      if (depth === grouping.length - 1) {
        // Final level of grouping, create a single group header
        Object.entries(grouped).forEach(([groupValue, groupRows]) => {
          const fullGroupKeys = [...parentGroupValues, groupValue];
          const groupId = fullGroupKeys.join("-");
          const isCollapsed = !!collapsedGroups[groupId];
          const fullGroupLabel = fullGroupKeys
            .map(
              (v, i) =>
                `${
                  defaultColumns.find(
                    (c) => typeof (c as any).accessorKey === grouping[i]
                  )?.header || grouping[i]
                }: ${v}`
            )
            .join(" - ");

          result.push({
            isGrouped: true,
            id: groupId,
            fullGroupLabel,
            isCollapsed,
            count: groupRows.length,
          });

          if (!isCollapsed) {
            groupRows.forEach((row) =>
              result.push({ ...row, id: `sub-${row.id}` })
            );
          }
        });
      } else {
        // Intermediate levels, continue recursion
        Object.entries(grouped).forEach(([groupValue, groupRows]) => {
          renderGroupedRows(groupRows, depth + 1, [
            ...parentGroupValues,
            groupValue,
          ]);
        });
      }
    };

    renderGroupedRows(sortedData, 0, []);
    return result;
  };

  const currentData = getGroupedData(data);
  const renderedColumns = getVisibleColumns();

  return (
    <Layout title="Dashboard">
      <div className="p-4 bg-gray-50 min-h-screen font-inter">
        <div className="flex gap-4 items-end mb-4">
          <div style={{ minWidth: 180, maxWidth: 320 }}>
            <CustomSelect
              label="Group By"
              options={groupByOptions}
              selectedValue={grouping}
              onChange={(vals) => {
                if (!vals || (Array.isArray(vals) && vals.length === 0)) {
                  setGrouping([]);
                } else {
                  setGrouping(Array.isArray(vals) ? vals : [vals]);
                }
              }}
              placeholder="Select column(s) to group by"
              isClearable={true}
              isMulti={true}
            />
          </div>
          <button
            onClick={handleExportToExcel}
            disabled={!isXLSXLoaded}
            className={`flex items-center px-4 py-2 text-white rounded-md shadow-sm transition-colors duration-150 ease-in-out ${
              isXLSXLoaded
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isXLSXLoaded ? (
              <>
                <FileSpreadsheet size={16} className="mr-2" /> Export to Excel
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            )}
          </button>
          {grouping.length > 0 && (
            <button
              onClick={handleExportAsExcelSheets}
              disabled={!isXLSXLoaded}
              className={`flex items-center px-4 py-2 text-white rounded-md shadow-sm transition-colors duration-150 ease-in-out ${
                isXLSXLoaded
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {isXLSXLoaded ? (
                <>
                  <FileSpreadsheet size={16} className="mr-2" /> Export as Excel
                  Sheets
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              )}
            </button>
          )}
        </div>
        <div className="w-full space-y-4">
          <div className="shadow-lg border border-border overflow-x-auto">
            <div className="min-w-[800px] w-full">
              {data.length === 0 ? (
                <div className="w-full h-64 flex justify-center items-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  <DndContext
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToFirstScrollableAncestor]}
                  >
                    <table className="w-full table-auto">
                      <colgroup>
                        {table.getAllLeafColumns().map((col) => (
                          <col
                            key={col.id}
                            className="font-medium min-w-full"
                          />
                        ))}
                      </colgroup>
                      <thead
                        className={`${customColors["secondary-color"]} rounded-xl`}
                      >
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                              const canSort = header.column.getCanSort();
                              const isSorted = header.column.getIsSorted();
                              const isDraggable = !nonDraggableColumns.includes(
                                header.column.id
                              );
                              return (
                                <th
                                  key={header.id}
                                  style={{ width: 160 }}
                                  className={`px-6 py-4 text-left text-xs font-semibold ${customColors["header-color"]} uppercase tracking-wider border-b ${customColors.border} select-none group`}
                                  colSpan={header.colSpan}
                                >
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={
                                        canSort ? "cursor-pointer" : ""
                                      }
                                      onClick={() =>
                                        canSort && header.column.toggleSorting()
                                      }
                                      tabIndex={canSort ? 0 : undefined}
                                      onKeyDown={
                                        canSort
                                          ? (e) => {
                                              if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                              ) {
                                                header.column.toggleSorting();
                                              }
                                            }
                                          : undefined
                                      }
                                      role={canSort ? "button" : undefined}
                                      aria-label={
                                        canSort ? "Sort column" : undefined
                                      }
                                    >
                                      {isDraggable ? (
                                        <Droppable id={header.column.id}>
                                          <Draggable id={header.column.id}>
                                            <div className="cursor-move rounded p-1 transition duration-150 ease-in-out hover:bg-primary-lg">
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
                                      {canSort && (
                                        <span className="ml-1 text-xs">
                                          {isSorted === "asc" ? (
                                            "▲"
                                          ) : isSorted === "desc" ? (
                                            "▼"
                                          ) : (
                                            <span className="opacity-30">
                                              ▲▼
                                            </span>
                                          )}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        ))}
                      </thead>
                      <tbody className="divide-y">
                        {currentData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={renderedColumns.length}
                              className="px-6 py-12 text-left text-gray-500"
                            >
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                  <span className="text-gray-700 text-2xl">
                                    —
                                  </span>
                                </div>
                                <p className="text-lg font-medium text-gray-900 mb-1">
                                  No Data available
                                </p>
                                <p className="text-sm text-gray-700">
                                  There are no data to display at the moment.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          currentData.map((row) => {
                            const isGrouped = !!row.isGrouped;
                            const sumRow = isGrouped
                              ? getSumRow(
                                  data.filter((d) => {
                                    const groupValues = grouping
                                      .map((key) => d[key as keyof Dashboard])
                                      .join("-");
                                    return groupValues === row.id;
                                  })
                                )
                              : {};

                            return (
                              <React.Fragment key={row.id}>
                                {isGrouped ? (
                                  <>
                                    <tr
                                      className="bg-gray-100 cursor-pointer"
                                      onClick={() =>
                                        setCollapsedGroups((prev) => ({
                                          ...prev,
                                          [row.id]: !prev[row.id],
                                        }))
                                      }
                                    >
                                      <td
                                        colSpan={renderedColumns.length}
                                        className="px-6 py-2 font-bold text-gray-800 flex items-center"
                                      >
                                        <span className="mr-2">
                                          {row.isCollapsed ? (
                                            <ChevronRight size={18} />
                                          ) : (
                                            <ChevronDown size={18} />
                                          )}
                                        </span>
                                        {row.fullGroupLabel}
                                        {row.count ? (
                                          <span className="ml-2 text-xs text-gray-500">
                                            ({row.count})
                                          </span>
                                        ) : null}
                                      </td>
                                    </tr>
                                  </>
                                ) : (
                                  <tr
                                    className={
                                      row.id.includes("sub-") &&
                                      row.subRowIndex % 2 === 0
                                        ? customColors["primary-md"]
                                        : customColors["secondary-color-lt"]
                                    }
                                  >
                                    {renderedColumns.map((col, colIndex) => {
                                      const accessor = (col as any).accessorKey as keyof Dashboard;
                                      const cellValue = row[accessor];
                                      const isNumberCol =
                                        typeof accessor === "string" &&
                                        typeof cellValue === "number";
                                      return (
                                        <td
                                          key={accessor}
                                          className={`px-6 py-4 whitespace-nowrap text-sm border-b ${customColors.border}`}
                                        >
                                          {isNumberCol
                                            ? formatNumber(cellValue)
                                            : String(cellValue ?? "—")}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                )}
                                {isGrouped &&
                                  !row.isCollapsed &&
                                  Object.keys(sumRow).length > 0 && (
                                    <tr
                                      key={`${row.id}-sum`}
                                      className="bg-gray-200 font-semibold"
                                    >
                                      {renderedColumns.map((col, colIdx) => (
                                        <td
                                          key={typeof (col as any).accessorKey}
                                          className={`px-6 py-2 border-b border-border ${
                                            colIdx === 0
                                              ? "text-left font-bold"
                                              : "text-right"
                                          }`}
                                        >
                                          {colIdx === 0
                                            ? "Total"
                                            : sumRow[
                                                typeof (col as any).accessorKey
                                              ] !== undefined
                                            ? formatNumber(
                                                sumRow[
                                                  typeof (col as any)
                                                    .accessorKey
                                                ]
                                              )
                                            : ""}
                                        </td>
                                      ))}
                                    </tr>
                                  )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </DndContext>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
