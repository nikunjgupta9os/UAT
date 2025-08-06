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

// import React, { useState } from 'react';
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import type { Table } from "@tanstack/react-table";

// interface PaginationProps<T> {
//   table: Table<T>;
//   totalItems: number;
//   currentPageItems: number;
//   startIndex: number;
//   endIndex: number;
// }

// function Pagination<T>({ 
//   table, 
//   totalItems, 
//   currentPageItems, 
//   startIndex, 
//   endIndex 
// }: PaginationProps<T>) {
//   const pagination = table.getState().pagination;
//   const currentPage = pagination.pageIndex;
//   const totalPages = table.getPageCount();
//   const [hoveredSection, setHoveredSection] = useState<string | null>(null);

//   const handlePageChange = (page: number) => {
//     table.setPageIndex(page);
//   };

//   // Generate page numbers with ellipsis
//   const pageNumbers: (number | "...")[] = [];
//   if (totalPages <= 6) {
//     for (let i = 0; i < totalPages; i++) pageNumbers.push(i);
//   } else {
//     pageNumbers.push(0, 1, "...", totalPages - 2, totalPages - 1);
//   }

//   return (
//     <div className="w-full">
//       {/* Page size selector and entries info */}
//       <div className="flex items-center justify-between bg-gray-50 px-4 py-2 text-sm text-gray-700">
//         {/* Left side - Page size selector */}
//         <div className="flex items-center gap-2">
//           <span>Show</span>
//           <select
//             className="border rounded px-2 py-1"
//             value={pagination.pageSize}
//             onChange={(e) => {
//               table.setPageSize(Number(e.target.value));
//             }}
//           >
//             {[5, 10, 20, 50, 100].map((size) => (
//               <option key={size} value={size}>
//                 {size}
//               </option>
//             ))}
//           </select>
//           <span>entries</span>
//         </div>

//         {/* Right side - Items info */}
//         <div>
//           Showing{" "}
//           <span className="font-medium">
//             {totalItems === 0 ? 0 : startIndex}
//           </span> to{" "}
//           <span className="font-medium">
//             {endIndex}
//           </span>{" "}
//           of <span className="font-medium">{totalItems}</span> entries
//         </div>
//       </div>

//       {/* Pagination controls with enhanced styling */}
//       <div className="w-full mx-auto px-6 pb-6 pt-4">
//         <div className="w-full h-[1px] bg-primary-xl mb-4 relative top-2 flex">
//           <div 
//             className={`flex-none transition-colors duration-200 ${
//               hoveredSection === 'prev' ? 'bg-primary-lt' : 'bg-primary-xl'
//             }`}
//             style={{ width: '120px' }}
//           />
//           <div 
//             className={`flex-1 transition-colors duration-200 ${
//               hoveredSection === 'pages' ? 'bg-primary' : 'bg-primary-xl'
//             }`}
//           />
//           <div 
//             className={`flex-none transition-colors duration-200 ${
//               hoveredSection === 'next' ? 'bg-primary-lt' : 'bg-primary-xl'
//             }`}
//             style={{ width: '120px' }}
//           />
//         </div>

//         <div className="flex items-center justify-between w-full">
//           {/* Previous button */}
//           <button
//             onClick={() => table.previousPage()}
//             disabled={!table.getCanPreviousPage()}
//             onMouseEnter={() => setHoveredSection('prev')}
//             onMouseLeave={() => setHoveredSection(null)}
//             className="flex ml-4 items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <ChevronLeft className="text-primary w-4 h-4" />
//             <span className="text-primary text-sm">Previous</span>
//           </button>

//           {/* Page numbers */}
//           <div 
//             className="flex items-center gap-1 mt-4"
//             onMouseEnter={() => setHoveredSection('pages')}
//             onMouseLeave={() => setHoveredSection(null)}
//           >
//             {pageNumbers.map((page, idx) =>
//               page === "..." ? (
//                 <span
//                   key={`ellipsis-${idx}`}
//                   className="text-primary text-sm px-2"
//                 >
//                   ...
//                 </span>
//               ) : (
//                 <button
//                   key={page}
//                   className={`w-8 h-8 flex items-center justify-center text-sm rounded-2xl transition-colors ${
//                     currentPage === page
//                       ? "bg-primary text-white font-medium"
//                       : "text-gray-700 hover:bg-gray-50"
//                   }`}
//                   onClick={() => handlePageChange(page)}
//                 >
//                   {page + 1}
//                 </button>
//               )
//             )}
//           </div>

//           {/* Next button */}
//           <button
//             onClick={() => table.nextPage()}
//             disabled={!table.getCanNextPage()}
//             onMouseEnter={() => setHoveredSection('next')}
//             onMouseLeave={() => setHoveredSection(null)}
//             className="flex mr-4 items-center gap-1.5 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <span className="text-sm text-primary">Next</span>
//             <ChevronRight className="text-primary w-4 h-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Pagination;