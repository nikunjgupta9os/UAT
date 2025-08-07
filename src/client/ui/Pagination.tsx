import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Table } from "@tanstack/react-table";

interface PaginationProps<T> {
  table: Table<T>;
  totalItems: number;
  currentPageItems: number;
  startIndex: number;
  endIndex: number;
}

function Pagination<T>({ 
  table, 
  totalItems, 
  currentPageItems, 
  startIndex, 
  endIndex 
}: PaginationProps<T>) {
  const pagination = table.getState().pagination;

  return (
    <div className="flex items-center justify-between bg-gray-50 px-4 py-2 text-sm text-gray-700">
      {/* Left side - Page size selector */}
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

      {/* Center - Navigation controls */}
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

      {/* Right side - Items info */}
      <div>
        Showing{" "}
        <span className="font-medium">
          {totalItems === 0 ? 0 : startIndex}
        </span> to{" "}
        <span className="font-medium">
          {endIndex}
        </span>{" "}
        of <span className="font-medium">{totalItems}</span> entries
      </div>
    </div>
  );
}

export default Pagination;
