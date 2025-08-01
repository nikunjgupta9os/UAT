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

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getPaginationRowModel,
} from "@tanstack/react-table";
import Button from "../ui/Button";


import axios from "axios";

// Fallback mock data in case API fails
const mockLinkedSummaryDataByCategory = {
  "Fwd Booking": [],
  "Fwd Rollovers": [],
  "Fwd Cancellation": [],
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

  // Fetch API data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("https://backend-slqi.onrender.com/api/forwards/linked-summary-by-category");
        if (response.data && typeof response.data === "object") {
          setLinkedSummaryData(response.data);
        }
      } catch (err) {
        // fallback to mock data
        setLinkedSummaryData(mockLinkedSummaryDataByCategory);
      }
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

  function getColumnsFromData(
    data: Record<string, any>[]
  ): ColumnDef<Record<string, any>>[] {
    if (!data || data.length === 0) return [];

    return Object.keys(data[0]).map((key) => ({
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
        return val === undefined || val === null ? "" : <span>{val as string}</span>;
      },
    }));
  }

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnOrder,
      pagination,
      columnVisibility,
    },
    onPaginationChange: setPagination,
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

      const defaultVisibility = newColumnOrder.reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
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
  const entityOptions = useMemo(() => getUniqueOptions(data, "entity_level_3"), [data]);
  const bankOptions = useMemo(() => getUniqueOptions(data, "counterparty"), [data]);

  // Filtering logic
  const handleSearch = () => {
    let filtered = [...data];
    if (filters.orderType) filtered = filtered.filter(row => row.order_type === filters.orderType);
    if (filters.currencyPair) filtered = filtered.filter(row => row.currency_pair === filters.currencyPair);
    if (filters.entity) filtered = filtered.filter(row => row.entity_level_3 === filters.entity);
    if (filters.bank) filtered = filtered.filter(row => row.counterparty === filters.bank);
    setFilteredData(filtered);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleReset = () => {
    setFilters({ orderType: null, currencyPair: null, entity: null, bank: null });
    setFilteredData(data);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const getVisibleRows = () =>
    table.getPaginationRowModel().rows.map((row) => row.original);

  const handleExportExcel = () => {
    exportToExcel(getVisibleRows(), `reports_${selectedType || "all"}`);
  };

  const handleExportPDF = () => {
    // Use the actual visible columns from the table
    const pdfColumns = table.getVisibleLeafColumns().map(col => ({
      header: col.columnDef.header,
      accessorKey: col.id
    }));
    exportToPDF(
      getVisibleRows(),
      `reports_${selectedType || "all"}`,
      pdfColumns,
      selectedType // Pass selectedType as fxType for the PDF title
    );
  };

  const handleEmail = () => {
    console.log("Email functionality would go here");
  };

  return (
    <Layout title="Reports">
      <div className="space-y-4">

        {/* FX Type Selector (above filters) */}
        <div className="grid z-50 grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-24">
          <CustomSelect
            label="Select FX Type"
            options={typeOptions}
            selectedValue={selectedType}
            onChange={(value) => setSelectedType(value)}
            placeholder="Select type"
            isClearable={false}
          />
        </div>

        <div className="flex gap-4 py-4 items-end max-w-5xl">
            <CustomSelect
              label="Order type"
              options={orderTypeOptions}
              selectedValue={filters.orderType}
              onChange={(value) => setFilters((f) => ({ ...f, orderType: value }))}
              placeholder="Order type"
              isClearable={true}
            />
            <CustomSelect
              label="Currency pair"
              options={currencyPairOptions}
              selectedValue={filters.currencyPair}
              onChange={(value) => setFilters((f) => ({ ...f, currencyPair: value }))}
              placeholder="Currency pair"
              isClearable={true}
            />
            <CustomSelect
              label="Entity"
              options={entityOptions}
              selectedValue={filters.entity}
              onChange={(value) => setFilters((f) => ({ ...f, entity: value }))}
              placeholder="Entity"
              isClearable={true}
            />
            <CustomSelect
              label="Bank"
              options={bankOptions}
              selectedValue={filters.bank}
              onChange={(value) => setFilters((f) => ({ ...f, bank: value }))}
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
                <table className="w-full table-auto">
                  <colgroup>
                    {table.getVisibleLeafColumns().map((col) => (
                      <col key={col.id} className="font-medium min-w-full" />
                    ))}
                  </colgroup>
                  <thead className="bg-secondary-color rounded-xl">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const isDraggable = !nonDraggableColumns.includes(
                            header.column.id
                          );

                          return (
                            <th
                              key={header.id}
                              className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
                              style={{ width: header.getSize() }}
                            >
                              {isDraggable ? (
                                <Droppable id={header.column.id}>
                                  <Draggable id={header.column.id}>
                                    <div className="cursor-move rounded py-1 transition duration-150 ease-in-out">
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
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y">
                    {table.getPaginationRowModel().rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-6 py-12 text-left text-gray-500"
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
                              No Data available
                            </p>
                            <p className="text-sm text-primary">
                              There are no data to display at the moment.
                            </p>
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
                    )}
                  </tbody>
                </table>
              </div>
            </DndContext>
          </div>
        </div>
        
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
            </span> to
            <span className="font-medium">
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredData.length)}
            </span>
            of <span className="font-medium">{filteredData.length}</span> entries
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Reports;
