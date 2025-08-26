import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, FileSpreadsheet } from "lucide-react";
import { DndContext } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Draggable } from "../common/Draggable";
import { Droppable } from "../common/Droppable";
import CustomSelect from "../common/SearchSelect";
import Layout from "../common/Layout";
import * as XLSX from "xlsx";
import axios from "axios"; // Add this import
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

import Button from "../ui/Button";
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

const defaultColumns = [
  {
    accessorKey: "bu",
    header: "Business Unit",
    canSort: true,
    isDraggable: true,
    isNumeric: false,
  },
  {
    accessorKey: "currency",
    header: "Currency",
    canSort: true,
    isDraggable: true,
    isNumeric: false,
  },
  {
    accessorKey: "debitors",
    header: "Debitors",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
  {
    accessorKey: "creditors",
    header: "Creditors",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
  {
    accessorKey: "lc",
    header: "LC",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
  {
    accessorKey: "grn",
    header: "GRN",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
  {
    accessorKey: "total_payable_exposure",
    header: "Total Payable Exposure",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
  {
    accessorKey: "cover_taken_export",
    header: "Export Cover",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
  {
    accessorKey: "cover_taken_import",
    header: "Import Cover",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
  {
    accessorKey: "outstanding_cover_export",
    header: "Outstanding Export",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
  {
    accessorKey: "outstanding_cover_import",
    header: "Outstanding Import",
    canSort: true,
    isDraggable: true,
    isNumeric: true,
    format: formatNumber,
  },
];

// Mock react-select component

const LoadingSpinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-text"></div>
  </div>
);

// Main App component
export default function App() {
  const [data, setData] = useState<Dashboard[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});
  const [columnOrder, setColumnOrder] = useState(
    defaultColumns.map((col) => col.accessorKey)
  );
  const [sorting, setSorting] = useState<
    { id: string; direction: "asc" | "desc" }[]
  >([]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);
  const dragOverRef = useRef<HTMLElement | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

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

  // Fetch data from API on mount
  useEffect(() => {
    axios
      .get<Dashboard[]>("https://backend-slqi.onrender.com/api/forwardDash/newtable")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch dashboard data:", error);
      });
  }, []);

  // Reset pagination when grouping changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setCollapsedGroups({});
  }, [groupBy]);

  const getVisibleColumns = () => {
    return columnOrder
      .map((key) => defaultColumns.find((col) => col.accessorKey === key))
      .filter(Boolean);
  };

  const handleToggleSorting = (columnId: string) => {
    setSorting((prev) => {
      const existingSort = prev.find((s) => s.id === columnId);
      if (existingSort) {
        if (existingSort.direction === "asc") {
          return [{ id: columnId, direction: "desc" }];
        }
        return [];
      }
      return [{ id: columnId, direction: "asc" }];
    });
  };

  const groupByOptions = useMemo(() => {
    return defaultColumns.map((col) => ({
      value: col.accessorKey,
      label: col.header,
    }));
  }, []);

  const sortData = (data: Dashboard[]) => {
    if (sorting.length > 0) {
      const { id, direction } = sorting[0];
      return [...data].sort((a, b) => {
        const valA = a[id as keyof Dashboard];
        const valB = b[id as keyof Dashboard];
        if (typeof valA === "string" && typeof valB === "string") {
          return direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return direction === "asc"
          ? (valA as number) - (valB as number)
          : (valB as number) - (valA as number);
      });
    }
    return data;
  };

  const getGroupedData = (data: Dashboard[]) => {
    if (groupBy.length === 0) return sortData(data); // <-- fix here
    const sortedData = sortData(data);
    const result: any[] = [];

    const renderGroupedRows = (
      rows: Dashboard[],
      depth: number,
      parentGroupValues: string[]
    ) => {
      if (depth === groupBy.length) {
        return rows.forEach((row) =>
          result.push({ ...row, id: `row-${row.id}` })
        );
      }

      const groupKey = groupBy[depth];
      const grouped = rows.reduce((acc, row) => {
        const value = row[groupKey as keyof Dashboard];
        const key = String(value);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as Record<string, Dashboard[]>);

      if (depth === groupBy.length - 1) {
        // Final level of grouping, create a single group header
        Object.entries(grouped).forEach(([groupValue, groupRows]) => {
          const fullGroupKeys = [...parentGroupValues, groupValue];
          const groupId = fullGroupKeys.join("-");
          const isCollapsed = !!collapsedGroups[groupId];
          const fullGroupLabel = fullGroupKeys
            .map(
              (v, i) =>
                `${
                  defaultColumns.find((c) => c.accessorKey === groupBy[i])
                    ?.header || groupBy[i]
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

  const paginatedData = useMemo(() => {
    const currentData = getGroupedData(data);
    if (groupBy.length > 0) {
      // No pagination when grouping
      return currentData;
    }
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return currentData.slice(start, end);
  }, [data, groupBy, sorting, collapsedGroups, pagination]);

  const getExportData = (rows: Dashboard[], groupByKeys: string[]) => {
    const exportData: any[] = [];
    const headers = getVisibleColumns().map((col) => col.header);
    exportData.push(headers);

    const processGroupedData = (
      groupData: Dashboard[],
      depth: number,
      parentGroupValues: string[]
    ) => {
      if (depth >= groupByKeys.length) {
        groupData.forEach((row) => {
          const exportRow = getVisibleColumns().map((col) => {
            const cellValue = row[col.accessorKey as keyof Dashboard];
            return col.format && typeof cellValue === "number"
              ? col.format(cellValue)
              : cellValue;
          });
          exportData.push(exportRow);
        });
        const sumRow = getSumRow(groupData);
        const sumExportRow = getVisibleColumns().map((col, colIdx) => {
          if (colIdx === 0) return "Total";
          if (sumRow[col.accessorKey] !== undefined) {
            return formatNumber(sumRow[col.accessorKey]);
          }
          return "";
        });
        exportData.push(sumExportRow);
        return;
      }

      const groupKey = groupByKeys[depth];
      const grouped = groupData.reduce((acc, row) => {
        const value = row[groupKey as keyof Dashboard];
        const key = String(value);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as Record<string, Dashboard[]>);

      Object.entries(grouped).forEach(([groupValue, groupRows]) => {
        const fullGroupKeys = [...parentGroupValues, groupValue];
        const fullGroupLabel = fullGroupKeys
          .map(
            (v, i) =>
              `${
                defaultColumns.find((c) => c.accessorKey === groupByKeys[i])
                  ?.header || groupByKeys[i]
              }: ${v}`
          )
          .join(" - ");
        exportData.push([fullGroupLabel]); // Add group header row

        processGroupedData(groupRows, depth + 1, fullGroupKeys);
      });
    };

    if (groupByKeys.length > 0) {
      processGroupedData(rows, 0, []);
    } else {
      rows.forEach((row) => {
        const exportRow = getVisibleColumns().map((col) => {
          const cellValue = row[col.accessorKey as keyof Dashboard];
          return col.format && typeof cellValue === "number"
            ? col.format(cellValue)
            : cellValue;
        });
        exportData.push(exportRow);
      });
    }

    return exportData;
  };

  const handleExportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const exportData = getExportData(data, groupBy);
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Auto-fit columns
    const wscols = exportData[0].map(() => ({ wch: 20 }));
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Dashboard Data");
    XLSX.writeFile(wb, "Dashboard_Export.xlsx");
  };

  const handleExportAsExcelSheets = () => {
    if (groupBy.length === 0) {
      // If no grouping, fall back to single sheet export
      handleExportToExcel();
      return;
    }

    const wb = XLSX.utils.book_new();
    const exportDataKeys = getVisibleColumns().map((col) => col.accessorKey);

    const processAndAddSheet = (rows: Dashboard[], sheetName: string) => {
      const sheetData = rows.map((row) => {
        const obj: Record<string, any> = {};
        exportDataKeys.forEach((key) => {
          obj[
            defaultColumns.find((c) => c.accessorKey === key)?.header || key
          ] = row[key as keyof Dashboard];
        });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Truncate sheet name if too long
    };

    const groupAndExport = (
      rows: Dashboard[],
      depth: number,
      groupNames: string[]
    ) => {
      if (depth >= groupBy.length) {
        const sheetName = groupNames.join(" - ").substring(0, 31) || "Data";
        if (rows.length > 0) {
          processAndAddSheet(rows, sheetName);
        }
        return;
      }

      const groupKey = groupBy[depth];
      const grouped = rows.reduce((acc, row) => {
        const value = row[groupKey as keyof Dashboard];
        const key = String(value);
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
        return acc;
      }, {} as Record<string, Dashboard[]>);

      Object.entries(grouped).forEach(([groupValue, groupRows]) => {
        groupAndExport(groupRows, depth + 1, [...groupNames, groupValue]);
      });
    };

    groupAndExport(data, 0, []);

    XLSX.writeFile(wb, "Dashboard_Grouped_Export.xlsx");
  };

  const renderedColumns = getVisibleColumns();

  // Function to calculate sum for a group of rows
  const getSumRow = (rows: Dashboard[]) => {
    const sumRow: Record<string, number> = {};
    renderedColumns.forEach((col) => {
      if (col.isNumeric) {
        sumRow[col.accessorKey] = rows.reduce(
          (sum, row) =>
            sum + (row[col.accessorKey as keyof Dashboard] as number),
          0
        );
      }
    });
    return sumRow;
  };

  return (
    <Layout title="BU-Currency Wise Exposure Dashboard">
      <div className="p-4 bg-gray-50 min-h-screen font-inter">
        <div className="flex gap-4 items-end mb-4 justify-between">
          <div style={{ minWidth: 180, maxWidth: 320 }}>
            <CustomSelect
              label="Group By"
              options={groupByOptions}
              selectedValue={groupBy}
              onChange={(vals) => {
                if (!vals || (Array.isArray(vals) && vals.length === 0)) {
                  setGroupBy([]);
                } else {
                  setGroupBy(Array.isArray(vals) ? vals : [vals]);
                }
              }}
              placeholder="Select column(s) to group by"
              isClearable={true}
              isMulti={true}
            />
          </div>
          <div className="flex flex-row gap-2 h-[40px]">
            <div>
              <Button
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
                    <FileSpreadsheet size={16} className="mr-2" /> Export to
                    Excel
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                )}
              </Button>
            </div>

            <div>
              {groupBy.length > 0 && (
                <Button
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
                      <FileSpreadsheet size={16} className="mr-2" />
                      Excel Sheets
                    </>
                  ) : (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
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
                    onDragEnd={(event) => {
                      const { active, over } = event;
                      if (!over) return;
                      if (active.id !== over.id) {
                        const oldIndex = columnOrder.indexOf(
                          active.id as string
                        );
                        const newIndex = columnOrder.indexOf(over.id as string);
                        const newOrder = [...columnOrder];
                        newOrder.splice(oldIndex, 1);
                        newOrder.splice(newIndex, 0, active.id as string);
                        setColumnOrder(newOrder);
                      }
                    }}
                    modifiers={[restrictToFirstScrollableAncestor]}
                  >
                    <table className="w-full table-auto">
                      <colgroup>
                        {renderedColumns.map((col) => (
                          <col
                            key={col.accessorKey}
                            className="font-medium min-w-full"
                          />
                        ))}
                      </colgroup>
                      <thead
                        className={`${customColors["secondary-color"]} rounded-xl`}
                      >
                        <tr>
                          {renderedColumns.map((col) => {
                            const isDraggable = col.isDraggable;
                            const canSort = col.canSort;
                            const isSorted =
                              sorting.find((s) => s.id === col.accessorKey)
                                ?.direction || false;
                            return (
                              <th
                                key={col.accessorKey}
                                style={{ width: 160 }}
                                className={`px-6 py-4 text-left text-xs font-semibold ${customColors["header-color"]} uppercase tracking-wider border-b ${customColors.border} select-none group`}
                              >
                                <div className="flex items-center gap-1">
                                  <span
                                    className={canSort ? "cursor-pointer" : ""}
                                    onClick={() =>
                                      canSort &&
                                      handleToggleSorting(col.accessorKey)
                                    }
                                    tabIndex={canSort ? 0 : undefined}
                                    onKeyDown={
                                      canSort
                                        ? (e) => {
                                            if (
                                              (e as React.KeyboardEvent).key ===
                                                "Enter" ||
                                              (e as React.KeyboardEvent).key ===
                                                " "
                                            ) {
                                              handleToggleSorting(
                                                col.accessorKey
                                              );
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
                                      <Droppable id={col.accessorKey}>
                                        <Draggable id={col.accessorKey}>
                                          <div className="cursor-move rounded p-1 transition duration-150 ease-in-out hover:bg-primary-lg">
                                            {col.header}
                                          </div>
                                        </Draggable>
                                      </Droppable>
                                    ) : (
                                      <div className="px-1">{col.header}</div>
                                    )}
                                    {canSort && (
                                      <span className="ml-1 text-xs">
                                        {isSorted === "asc" ? (
                                          "▲"
                                        ) : isSorted === "desc" ? (
                                          "▼"
                                        ) : (
                                          <span className="opacity-30">▲▼</span>
                                        )}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedData.length === 0 ? (
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
                          paginatedData.map((row, idx: number) => {
                            const isGrouped = !!row.isGrouped;
                            const sumRow = isGrouped
                              ? getSumRow(
                                  data.filter((d) => {
                                    const groupValues = groupBy
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
                                      idx % 2 === 0
                                        ? "bg-primary-md"
                                        : "bg-secondary-color-lt"
                                    }
                                  >
                                    {renderedColumns.map((col, colIndex) => {
                                      const cellValue =
                                        row[
                                          col.accessorKey as keyof typeof row
                                        ];
                                      return (
                                        <td
                                          key={col.accessorKey}
                                          className={`px-6 py-4 whitespace-nowrap text-sm border-b ${customColors.border}`}
                                        >
                                          {col.format
                                            ? col.format(cellValue)
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
                                          key={col.accessorKey}
                                          className={`px-6 py-2 border-b border-border ${
                                            colIdx === 0
                                              ? "text-left font-bold"
                                              : "text-right"
                                          }`}
                                        >
                                          {colIdx === 0
                                            ? "Total"
                                            : sumRow[col.accessorKey] !==
                                              undefined
                                            ? formatNumber(
                                                sumRow[col.accessorKey]
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
          {groupBy.length === 0 && (
            <div className="flex items-center justify-between bg-secondary-color rounded-sm px-4 py-2 text-sm text-secondary-text-dark mt-4">
              {/* Left side - Page size selector */}
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  className="border bg-secondary-color border-border rounded px-2 py-1"
                  value={pagination.pageSize}
                  onChange={(e) => {
                    setPagination((prev) => ({
                      ...prev,
                      pageSize: Number(e.target.value),
                      pageIndex: 0, // Reset to first page on size change
                    }));
                  }}
                >
                  {[5, 10, 20, 50, 100, 500].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                <span>entries</span>
              </div>

              {/* Center - Navigation controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      pageIndex: Math.max(0, prev.pageIndex - 1),
                    }))
                  }
                  disabled={pagination.pageIndex === 0}
                  className="flex items-center gap-1 px-3 py-1 border border-primary-lt rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-xl"
                >
                  Previous
                </button>

                <span className="flex items-center gap-1">
                  <span>Page</span>
                  <strong className="text-primary">
                    {pagination.pageIndex + 1} of{" "}
                    {Math.ceil(
                      getGroupedData(data).length / pagination.pageSize
                    )}
                  </strong>
                </span>

                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      pageIndex:
                        prev.pageIndex + 1 <
                        Math.ceil(
                          getGroupedData(data).length / pagination.pageSize
                        )
                          ? prev.pageIndex + 1
                          : prev.pageIndex,
                    }))
                  }
                  disabled={
                    pagination.pageIndex + 1 >=
                    Math.ceil(getGroupedData(data).length / pagination.pageSize)
                  }
                  className="flex items-center gap-1 px-3 py-1 border border-primary-lt rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-xl"
                >
                  Next
                </button>
              </div>

              {/* Right side - Items info */}
              <div>
                Showing{" "}
                <span className="font-medium text-primary">
                  {getGroupedData(data).length === 0
                    ? 0
                    : pagination.pageIndex * pagination.pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-primary">
                  {Math.min(
                    (pagination.pageIndex + 1) * pagination.pageSize,
                    getGroupedData(data).length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-primary">
                  {getGroupedData(data).length}
                </span>{" "}
                entries
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
