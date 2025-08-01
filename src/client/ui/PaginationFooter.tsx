import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Table } from "@tanstack/react-table";

interface PaginationFooterProps<T> {
  table: Table<T>;
}

const PaginationFooter = <T,>({ table }: PaginationFooterProps<T>) => {
  const pagination = table.getState().pagination;
  const totalRows = table.getCoreRowModel().rows.length;
  // const firstItem = pagination.pageIndex * pagination.pageSize + 1;
  // const lastItem = Math.min(
  //   (pagination.pageIndex + 1) * pagination.pageSize,
  //   totalRows
  // );
  const pageSize = pagination.pageSize;
  const currentPage = pagination.pageIndex;
  const totalPages = Math.ceil(totalRows / pageSize);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const handlePageChange = (page: number) => {
    table.setPageIndex(page);
  };

  const pageNumbers: (number | "...")[] = [];

  if (totalPages <= 6) {
    for (let i = 0; i < totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(0, 1, "...", totalPages - 2, totalPages - 1);
  }

  return (
    <div className="w-full mx-auto px-6 pb-6 pt-4">
      <div className="w-full h-[1px] bg-primary-xl mb-4 relative top-2 flex">
        <div 
          className={`flex-none transition-colors duration-200 ${
            hoveredSection === 'prev' ? 'bg-primary-lt' : 'bg-primary-xl'
          }`}
          style={{ width: '120px' }}
        />
        <div 
          className={`flex-1 transition-colors duration-200 ${
            hoveredSection === 'pages' ? 'bg-primary' : 'bg-primary-xl'
          }`}
        />
        <div 
          className={`flex-none transition-colors duration-200 ${
            hoveredSection === 'next' ? 'bg-primary-lt' : 'bg-primary-xl'
          }`}
          style={{ width: '120px' }}
        />
      </div>
      <div className="flex items-center justify-between w-full">
        <button
          onClick={() => table.previousPage()}  // Fixed: Use previousPage()
          disabled={!table.getCanPreviousPage()}  // Fixed: Correct disabled state
          onMouseEnter={() => setHoveredSection('prev')}
          onMouseLeave={() => setHoveredSection(null)}
          className="flex ml-4 items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="text-primary w-4 h-4" />
          <span className="text-primary text-sm">Previous</span>
        </button>

        <div className="flex items-center gap-1 mt-4">
          {pageNumbers.map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="text-primary text-sm px-2"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                className={`w-8 h-8 flex items-center justify-center text-sm rounded-2xl transition-colors ${
                  currentPage === page
                    ? "bg-primary text-white font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page + 1}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => table.nextPage()}  // Fixed: Use nextPage()
          disabled={!table.getCanNextPage()}  // Fixed: Correct disabled state
          onMouseEnter={() => setHoveredSection('next')}
          onMouseLeave={() => setHoveredSection(null)}
          className="flex mr-4 items-center gap-1.5 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-sm text-primary">Next</span>
          <ChevronRight className="text-primary w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PaginationFooter;