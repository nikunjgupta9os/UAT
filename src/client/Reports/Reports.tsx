import { useState, useEffect, useMemo } from "react";
import { Draggable } from "../common/Draggable";
import { Droppable } from "../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import Layout from "../common/Layout";
import CustomSelect from "../common/SearchSelect";
import { Mail, FileText, Download } from "lucide-react";
import { exportToExcel, exportToPDF } from "../ui/exportToExcel";
import { ColumnPicker } from "../common/ColumnPicker";
import { ChevronLeft, ChevronRight } from "lucide-react";
// import LoadingSpinner from "../ui/LoadingSpinner";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import Button from "../ui/Button";


import axios from "axios";
import LoadingSpinner from '../ui/LoadingSpinner';

// Fallback mock data in case API fails
const mockLinkedSummaryDataByCategory = {
  "Fwd Booking": [],
  "Fwd Rollovers": [],
  "Fwd Cancellation": [],
  "Exposure Positions": [],
};


const getFxTypeOptions = (
  dataByCategory: Record<string, Record<string, any>[]>
) => {
  return Object.keys(dataByCategory).map((key) => ({
    value: key,
    label: key,
  }));
};



// We'll set typeOptions after fetching data

// Helper to extract unique values for dropdowns
function getUniqueOptions(data: Record<string, any>[], key: string) {
  const set = new Set<string>();
  data.forEach((row) => {
    if (row[key]) set.add(row[key]);
  });
  return Array.from(set).map((v) => ({ value: v, label: v }));
}

const nonDraggableColumns = ["actions", "select"];


function Reports() {
  const [linkedSummaryData, setLinkedSummaryData] = useState<Record<string, Record<string, any>[]>>(mockLinkedSummaryDataByCategory);
  const [selectedType, setSelectedType] = useState("Fwd Booking");
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [filteredData, setFilteredData] = useState<Record<string, any>[]>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [loading, setLoading] = useState(false);
  // Filter states
  const [filters, setFilters] = useState({
    orderType: null as string | null,
    currencyPair: null as string | null,
    entity: null as string | null,
    bank: null as string | null,
  });

  // These states are now always in sync with the current data
  const [columns, setColumns] = useState<ColumnDef<Record<string, any>>[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Grouping state
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Helper to group data by multiple keys
  function groupData(data: Record<string, any>[], keys: string[] = []) {
    if (!keys.length) return null;
    const groupRecursive = (rows: Record<string, any>[], depth: number): any => {
      if (depth >= keys.length) return rows;
      const key = keys[depth];
      const groups: Record<string, any> = {};
      rows.forEach(row => {
        const groupVal = row[key] ?? "(Blank)";
        if (!groups[groupVal]) groups[groupVal] = [];
        groups[groupVal].push(row);
      });
      // Recursively group subgroups
      Object.keys(groups).forEach(g => {
        groups[g] = groupRecursive(groups[g], depth + 1);
      });
      return groups;
    };
    return groupRecursive(data, 0);
  }

  // Grouped data memoized
  const groupedData = useMemo(() => {
    if (!groupBy.length) return null;
    return groupData(filteredData, groupBy);
  }, [filteredData, groupBy]);

  // When groupBy changes, reset pagination to first page
  useEffect(() => {
    if (groupBy.length) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }
  }, [groupBy]);
  // Group By options (all columns except nonDraggableColumns)
  const groupByOptions = useMemo(() => {
    if (!columns.length) return [];
    // Add a clear option at the top
    return [
      { value: '', label: 'Ungroup (Show All)' },
      ...columns
        .filter(col => typeof (col as any).accessorKey === 'string' && !nonDraggableColumns.includes((col as any).accessorKey))
        .map(col => ({ value: (col as any).accessorKey as string, label: (typeof col.header === 'string' ? col.header : String(col.header)) }))
    ];
  }, [columns]);

  // Fetch API data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch main reports
        const response = await axios.get("https://backend-slqi.onrender.com/api/forwards/linked-summary-by-category");
        let data: Record<string, any[]> = response.data && typeof response.data === "object" ? response.data : {};

        // Fetch exposure positions report
        try {
          const exposureRes = await axios.get("https://backend-slqi.onrender.com/api/forwards/exposure/summary");
          if (
            exposureRes.data &&
            Array.isArray(exposureRes.data.summary)
          ) {
            data["Exposure Positions"] = exposureRes.data.summary;
          } else if (Array.isArray(exposureRes.data)) {
            data["Exposure Positions"] = exposureRes.data;
          } else {
            data["Exposure Positions"] = [];
          }
        } catch (exposureErr) {
          // fallback: leave as empty array
          data["Exposure Positions"] = [];
        }

        setLinkedSummaryData({ ...mockLinkedSummaryDataByCategory, ...data });
      } catch (err) {
        // fallback to mock data
        setLinkedSummaryData(mockLinkedSummaryDataByCategory);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Handle drag and drop for column reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...columnOrder];
        newOrder.splice(oldIndex, 1);
        newOrder.splice(newIndex, 0, active.id as string);
        setColumnOrder(newOrder);
      }
    }
  };

  // Helper to check if a value is a valid date string (ISO or YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  function isDateString(val: any) {
    if (typeof val !== "string") return false;
    // Accepts YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ssZ
    return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z)?)?$/.test(val);
  }

  // Format date to DD-MM-YYYY
  function formatDate(val: string) {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Helper: format numbers to 3-4 decimal places
  function formatNumber(val: number | string, decimals = 3) {
    if (typeof val === 'number') {
      return val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    if (typeof val === 'string' && !isNaN(Number(val))) {
      return Number(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    return val;
  }

  // Helper: render grouped rows recursively and show sum row for numeric and specified columns
  function renderGroupedRows(groups: any, depth: number, parentKeys: string[]) {
    const groupKey = groupBy[depth];
    const isLastLevel = depth === groupBy.length - 1;

    // Columns to always sum (by accessorKey)
    const alwaysSumColumns = [
      // "entity_level_0",
      // "entity_level_1",
      // "entity_level_2",
      // "entity_level_3",
      // "local_currency",
      // "order_type",
      // "transaction_type",
      // "counterparty",
      // "mode_of_delivery",
      // "delivery_period",
      // "add_date",
      // "settlement_date",
      // "maturity_date",
      // "delivery_date",
      // "currency_pair",
      // "base_currency",
      // "quote_currency",
      "booking_amount",
      "value_type",
      "actual_value_base_currency",
      "total_original_amount",
      "total_open_amount",
      // "spot_rate",
      // "forward_points",
      "bank_margin",
      "total_rate",
      "value_quote_currency",
      // "intervening_rate_quote_to_local"
    ];

    return Object.entries(groups).map(([group, rowsOrSubgroups]) => {
      const groupId = [...parentKeys, group].join("__");
      const isCollapsed = collapsedGroups[groupId];
      // If last level, rowsOrSubgroups is array of rows
      let rows: Record<string, any>[] = [];
      if (isLastLevel) {
        rows = rowsOrSubgroups as Record<string, any>[];
      }
      // Compute sum for numeric columns and alwaysSumColumns
      let sumRow: Record<string, number | string> = {};
      if (isLastLevel && rows.length) {
        visibleColumns.forEach((col, colIdx) => {
          const values = rows.map(r => r[col.id]);
          // Sum if all values are numbers, or if col.id is in alwaysSumColumns and values are numbers
          if (values.every(v => typeof v === 'number')) {
            sumRow[col.id] = values.reduce((a, b) => a + b, 0);
          } else if (alwaysSumColumns.includes(col.id)) {
            // Try to sum if possible (e.g. string numbers)
            const numericValues = values.map(v => typeof v === 'number' ? v : (typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : null)).filter(v => typeof v === 'number');
            if (numericValues.length === values.length && numericValues.length > 0) {
              sumRow[col.id] = numericValues.reduce((a, b) => a + b, 0);
            } else {
              sumRow[col.id] = '';
            }
          }
        });
      }
      // Find the first visible column index for alignment
      const firstColIdx = 0;
      return (
        <>
          <tr key={groupId} className="bg-gray-100 cursor-pointer" onClick={() => setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))}>
            <td colSpan={visibleColumns.length} className="px-6 py-2 font-bold text-primary flex items-center">
              <span className="mr-2">{isCollapsed ? '+' : '-'}</span>
              {groupKey ? `${columns.find(c => (c as any).accessorKey === groupKey)?.header || groupKey}: ` : ''}{group}
              {isLastLevel && rows.length ? <span className="ml-2 text-xs text-gray-500">({rows.length})</span> : null}
            </td>
          </tr>
          {!isCollapsed && (
            isLastLevel ? (
              <>
                {rows.map((row, rowIdx) => (
                  <tr key={groupId + '-' + rowIdx} className={rowIdx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"}>
                    {visibleColumns.map((col) => {
                      const val = row[col.id];
                      const colDef = columns.find(c => (c as any).accessorKey === col.id);
                      let cellContent = val;
                      if (colDef && colDef.cell) {
                        cellContent = (colDef.cell as any)({ getValue: () => val });
                      }
                      return (
                        <td key={col.id} className="px-6 py-4 whitespace-nowrap text-sm border-b border-border">
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Sum row for numeric columns and alwaysSumColumns */}
                {Object.keys(sumRow).length > 0 && (
                  <tr key={groupId + '-sum'} className="bg-gray-200 font-semibold">
                    {visibleColumns.map((col, colIdx) => {
                      if (colIdx === firstColIdx) {
                        return (
                          <td key={col.id} className="px-6 py-2 border-b border-border text-left font-bold">
                            Total
                          </td>
                        );
                      }
                      return (
                        <td key={col.id} className="px-6 py-2 border-b border-border text-right">
                          {sumRow[col.id] !== undefined && sumRow[col.id] !== '' ? formatNumber(sumRow[col.id]) : ''}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </>
            ) : (
              renderGroupedRows(rowsOrSubgroups, depth + 1, [...parentKeys, group])
            )
          )}
        </>
      );
    });
  }

  function getColumnsFromData(
    data: Record<string, any>[]
  ): ColumnDef<Record<string, any>>[] {
    if (!data || data.length === 0) return [];

    // Default columns for Fwd Booking
    const allKeys = Object.keys(data[0]);
    let defaultVisible: Set<string>;
    if (selectedType === "Fwd Booking") {
      defaultVisible = new Set([
        "entity_level_0",
        "order_type",
        "counterparty",
        "currency_pair",
        "booking_amount",
        "settlement_date"
      ]);
    } else {
      defaultVisible = new Set(allKeys.slice(0, 4));
    }
    return allKeys.map((key) => ({
      accessorKey: key,
      header: key
        .replace(/_/g, " ") // optional: makes headers more readable
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      cell: ({ getValue }) => {
        const val = getValue();
        if (isDateString(val)) {
          const formatted = formatDate(val as string);
          return <span>{formatted}</span>;
        }
        // Format numbers for booking_amount and other numeric columns
        if (["booking_amount", "actual_value_base_currency", "bank_margin", "total_rate", "value_quote_currency"].includes(key) && val !== undefined && val !== null && val !== "") {
          return <span>{formatNumber(val as number | string)}</span>;
        }
        return val === undefined || val === null ? "" : <span>{val as string}</span>;
      },
      enableHiding: !defaultVisible.has(key),
    }));
  }

  // Sorting state for react-table
  const [sorting, setSorting] = useState([]);
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnOrder,
      pagination,
      columnVisibility,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    manualPagination: false,
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
  });

  // Update data and columns when selectedType or linkedSummaryData changes
  useEffect(() => {
    if (selectedType && linkedSummaryData) {
      const newData =
        linkedSummaryData[
          selectedType as keyof typeof linkedSummaryData
        ] ?? [];
      setData(newData);
      setFilteredData(newData);

      const newColumns = getColumnsFromData(newData);
      setColumns(newColumns);

      const newColumnOrder = newData.length > 0 ? Object.keys(newData[0]) : [];
      setColumnOrder(newColumnOrder);

      // Set default column visibility for Fwd Booking
      let defaultVisibility: Record<string, boolean> = {};
      if (selectedType === "Fwd Booking") {
        const defaultCols = [
          "entity_level_0",
          "order_type",
          "counterparty",
          "currency_pair",
          "booking_amount",
          "settlement_date",
          "maturity_date"
        ];
        defaultVisibility = newColumnOrder.reduce(
          (acc, key) => ({ ...acc, [key]: defaultCols.includes(key) }),
          {}
        );
      } else {
        defaultVisibility = newColumnOrder.reduce(
          (acc, key, idx) => ({ ...acc, [key]: idx < 4 }),
          {}
        );
      }
      setColumnVisibility(defaultVisibility);

      setPagination((prev) => ({ ...prev, pageIndex: 0 }));

      // Reset filters on type change
      setFilters({ orderType: null, currencyPair: null, entity: null, bank: null });
    }
  }, [selectedType, linkedSummaryData]);

  // Type options and filter options for dropdowns (dynamically from data)
  const typeOptions = useMemo(() => getFxTypeOptions(linkedSummaryData), [linkedSummaryData]);
  const orderTypeOptions = useMemo(() => getUniqueOptions(data, "order_type"), [data]);
  const currencyPairOptions = useMemo(() => getUniqueOptions(data, "currency_pair"), [data]);
  // Entity dropdown: use correct key for Exposure Positions, fallback to entity_level_3 for others
  const entityOptions = useMemo(() => {
    if (selectedType === "Exposure Positions") {
      // Try to find a suitable entity key in the data
      // Common keys: entity, entity_name, entity_level_3, etc.
      const possibleKeys = ["entity", "entity_name", "entity_level_3", "entity_level_2", "entity_level_0"];
      const key = data.length > 0 ? possibleKeys.find(k => k in data[0]) : "entity";
      return getUniqueOptions(data, key || "entity");
    } else {
      return getUniqueOptions(data, "entity_level_3");
    }
  }, [data, selectedType]);
  const bankOptions = useMemo(() => getUniqueOptions(data, "counterparty"), [data]);

  // Filtering logic
  const handleSearch = () => {
    let filtered = [...data];
    if (filters.orderType) filtered = filtered.filter(row => row.order_type === filters.orderType);
    if (filters.currencyPair) filtered = filtered.filter(row => row.currency_pair === filters.currencyPair);
    // Entity filter: use correct key for Exposure Positions
    if (filters.entity) {
      if (selectedType === "Exposure Positions") {
        const possibleKeys = ["entity", "entity_name", "entity_level_3", "entity_level_2", "entity_level_0"];
        const key = data.length > 0 ? possibleKeys.find(k => k in data[0]) : "entity";
        filtered = filtered.filter(row => row[key || "entity"] === filters.entity);
      } else {
        filtered = filtered.filter(row => row.entity_level_3 === filters.entity);
      }
    }
    if (filters.bank) filtered = filtered.filter(row => row.counterparty === filters.bank);
    setFilteredData(filtered);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleReset = () => {
    setFilters({ orderType: null, currencyPair: null, entity: null, bank: null });
    setFilteredData(data);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setGroupBy([]);
    setCollapsedGroups({});
  };
  // (Unused) Toggle collapse for a group (can be removed, logic is now inline)
  // const toggleGroupCollapse = (group: string) => {
  //   setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  // };

  // Get visible columns (as per column picker)
  const visibleColumns = table.getVisibleLeafColumns();

  // Get visible data (grouped or ungrouped)
 function flattenGroupedData(groups: any, depth = 0): Record<string, any>[] {
  if (!groups) return [];
  if (Array.isArray(groups)) return groups;
  let rows: Record<string, any>[] = [];
  Object.entries(groups).forEach(([group, sub]) => {
    if (Array.isArray(sub)) {
      rows = rows.concat(sub);
    } else {
      rows = rows.concat(flattenGroupedData(sub, depth + 1));
    }
  });
  return rows;
}

// ...existing code...

// Get visible data (grouped or ungrouped)
const getVisibleRows = () => {
  if (groupBy && groupedData) {
    // Flatten all visible group rows recursively
    return flattenGroupedData(groupedData);
  } else {
    return table.getPaginationRowModel().rows.map((row) => row.original);
  }
};

  const handleExportExcel = () => {
    // Only export visible columns and visible data
    const rows = getVisibleRows();
    const cols = visibleColumns;
    // Map rows to only visible columns
    const exportRows = rows.map(row => {
      const obj: Record<string, any> = {};
      cols.forEach(col => {
        obj[col.id] = row[col.id];
      });
      return obj;
    });
    // Add sum row at the end
    if (rows.length) {
      let sumRow: Record<string, number | string> = {};
      cols.forEach((col, colIdx) => {
        const values = rows.map(r => r[col.id]);
        if (colIdx === 0) {
          sumRow[col.id] = 'Total';
        } else if (values.every(v => typeof v === 'number')) {
          sumRow[col.id] = values.reduce((a, b) => a + b, 0);
        } else {
          // Try to sum if possible (e.g. string numbers)
          const numericValues = values.map(v => typeof v === 'number' ? v : (typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : null)).filter(v => typeof v === 'number');
          if (numericValues.length === values.length && numericValues.length > 0) {
            sumRow[col.id] = numericValues.reduce((a, b) => a + b, 0);
          } else {
            sumRow[col.id] = '';
          }
        }
      });
      exportRows.push(sumRow);
    }
    exportToExcel(exportRows, `reports_${selectedType || "all"}`);
  };

  const handleExportPDF = () => {
    // Only export visible columns and visible data
    const rows = getVisibleRows();
    const pdfColumns = visibleColumns.map(col => ({
      header: col.columnDef.header,
      accessorKey: col.id
    }));
    // Add sum row at the end
    let sumRow: Record<string, number | string> = {};
    if (rows.length) {
      visibleColumns.forEach((col, colIdx) => {
        const values = rows.map(r => r[col.id]);
        if (colIdx === 0) {
          sumRow[col.id] = 'Total';
        } else if (values.every(v => typeof v === 'number')) {
          sumRow[col.id] = values.reduce((a, b) => a + b, 0);
        } else {
          // Try to sum if possible (e.g. string numbers)
          const numericValues = values.map(v => typeof v === 'number' ? v : (typeof v === 'string' && !isNaN(Number(v)) ? Number(v) : null)).filter(v => typeof v === 'number');
          if (numericValues.length === values.length && numericValues.length > 0) {
            sumRow[col.id] = numericValues.reduce((a, b) => a + b, 0);
          } else {
            sumRow[col.id] = '';
          }
        }
      });
    }
    exportToPDF(
      [...rows, Object.keys(sumRow).length > 0 ? sumRow : {}],
      `reports_${selectedType || "all"}`,
      pdfColumns,
      selectedType // Pass selectedType as fxType for the PDF title
    );
  };

  const handleEmail = () => {
// console.log("Email functionality would go here")
  };

  return(
  <Layout title="Reports">
    <div className="space-y-4">
      {/* FX Type Selector (above filters) */}
      <div className="grid z-50 grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-24">
        <CustomSelect
          label="Select FX Type"
          options={typeOptions}
          selectedValue={selectedType}
          onChange={(value) => setSelectedType(Array.isArray(value) ? value[0] : value as string)}
          placeholder="Select type"
          isClearable={false}
        />
      </div>

      <div className="flex gap-4 py-4 items-end max-w-5xl">
        <CustomSelect
          label="Order type"
          options={orderTypeOptions}
          selectedValue={filters.orderType}
          onChange={(value) => setFilters((f) => ({ ...f, orderType: Array.isArray(value) ? value[0] : value as string }))}
          placeholder="Order type"
          isClearable={true}
        />
        <CustomSelect
          label="Currency pair"
          options={currencyPairOptions}
          selectedValue={filters.currencyPair}
          onChange={(value) => setFilters((f) => ({ ...f, currencyPair: Array.isArray(value) ? value[0] : value as string }))}
          placeholder="Currency pair"
          isClearable={true}
        />
        <CustomSelect
          label="Entity"
          options={entityOptions}
          selectedValue={filters.entity}
          onChange={(value) => setFilters((f) => ({ ...f, entity: Array.isArray(value) ? value[0] : value as string }))}
          placeholder="Entity"
          isClearable={true}
        />
        <CustomSelect
          label="Bank"
          options={bankOptions}
          selectedValue={filters.bank}
          onChange={(value) => setFilters((f) => ({ ...f, bank: Array.isArray(value) ? value[0] : value as string }))}
          placeholder="Bank"
          isClearable={true}
        />
        <div className="flex gap-4 ml-4">  
          <Button
            categories="Large"
            onClick={handleSearch}
          >
            Search
          </Button>
          <Button
            categories="Large"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Group By Dropdown */}
      <div className="flex gap-4 items-end max-w-5xl mb-2">
        <div style={{ minWidth: 180, maxWidth: 320 }}>
          <CustomSelect
            label="Group By"
            options={groupByOptions}
            selectedValue={groupBy}
            onChange={(vals) => {
              if (!vals || (Array.isArray(vals) && vals.length === 0)) {
                setGroupBy([]);
                setCollapsedGroups({});
              } else {
                setGroupBy(Array.isArray(vals) ? vals : [vals]);
              }
            }}
            placeholder="Select column(s) to group by"
            isClearable={true}
            isMulti={true}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <ColumnPicker table={table} />
        </div>
        <div className="flex items-center justify-end gap-x-6">
          <div className="flex items-center justify-end gap-x-6">
            <button
              type="button"
              className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
              title="Export to Excel"
              onClick={handleExportExcel}
            >
              <Download className="flex items-center justify-center text-primary group-hover:text-white" />
            </button>
            <button
              type="button"
              className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
              title="Export to PDF"
              onClick={handleExportPDF}
            >
              <FileText className="flex items-center justify-center text-primary group-hover:text-white" />
            </button>
            <button
              type="button"
              className="group flex items-center justify-center border border-primary rounded-lg px-2 h-10 text-sm transition hover:bg-primary hover:text-white"
              title="Email Report"
              onClick={handleEmail}
            >
              <Mail className="flex items-center justify-center text-primary group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4">
        <div className="shadow-lg border border-border overflow-x-auto">
          <DndContext
            onDragEnd={handleDragEnd}
            modifiers={[restrictToFirstScrollableAncestor]}
          >
            <div className="min-w-[800px] w-full">
              {loading ? (
                <div className="w-full h-64 flex justify-center items-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  <table className="w-full table-auto">
                    <colgroup>
                      {visibleColumns.map((col) => (
                        <col key={col.id} className="font-medium min-w-full" />
                      ))}
                    </colgroup>
                    <thead className="bg-secondary-color rounded-xl">
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers
                            .filter(header => visibleColumns.some(col => col.id === header.column.id))
                            .map((header) => {
                              const isDraggable = !nonDraggableColumns.includes(header.column.id);
                              const canSort = !nonDraggableColumns.includes(header.column.id);
                              const isSorted = header.column.getIsSorted?.();
                              return (
                                <th
                                  key={header.id}
                                  className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border select-none group"
                                  style={{ width: header.getSize() }}
                                >
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={canSort ? "cursor-pointer" : ""}
                                      onClick={canSort ? () => header.column.toggleSorting?.() : undefined}
                                    >
                                      {isDraggable ? (
                                        <Droppable id={header.column.id}>
                                          <Draggable id={header.column.id}>
                                            <div className="cursor-move rounded py-1 transition duration-150 ease-in-out">
                                              {flexRender(header.column.columnDef.header, header.getContext())}
                                            </div>
                                          </Draggable>
                                        </Droppable>
                                      ) : (
                                        <div className="px-1">
                                          {flexRender(header.column.columnDef.header, header.getContext())}
                                        </div>
                                      )}
                                      {canSort && (
                                        <span className="ml-1 text-xs">
                                          {isSorted === 'asc' ? '▲' : isSorted === 'desc' ? '▼' : <span className="opacity-30">▲▼</span>}
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
                      {groupBy.length && groupedData ? (
                        Object.entries(groupedData).length === 0 ? (
                          <tr>
                            <td colSpan={visibleColumns.length} className="px-6 py-12 text-left text-gray-500">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <p className="text-lg font-medium text-gray-900 mb-1">No Data available</p>
                                <p className="text-sm text-primary">There are no data to display at the moment.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          renderGroupedRows(groupedData, 0, [])
                        )
                      ) : (
                        table.getPaginationRowModel().rows.length === 0 ? (
                          <tr>
                            <td colSpan={visibleColumns.length} className="px-6 py-12 text-left text-gray-500">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <p className="text-lg font-medium text-gray-900 mb-1">No Data available</p>
                                <p className="text-sm text-primary">There are no data to display at the moment.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          table.getPaginationRowModel().rows.map((row) => (
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
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DndContext>
        </div>
      </div>
      
      {/* Pagination controls: hide when grouped */}
      {!loading && groupBy.length === 0 && (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              className="border rounded px-2 py-1"
              value={pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
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

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex items-center gap-1 px-3 py-1 border border-primary-lt rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="flex items-center gap-1">
                <span>Page</span>
                <strong className="text-primary">
                  {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </strong>
              </span>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex items-center gap-1 px-3 py-1 border border-primary-lt rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            Showing{" "}
            <span className="font-medium">
              {filteredData.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredData.length)}
            </span>{" "}
            of <span className="font-medium">{filteredData.length}</span> entries
          </div>
        </div>
      )}
    </div>
  </Layout>
);
}

export default Reports;
