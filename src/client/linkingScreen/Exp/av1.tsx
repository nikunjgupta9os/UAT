// import React, { useState, useMemo } from "react";
// import { Draggable } from "../../common/Draggable";
// import { Droppable } from "../../common/Droppable";
// import { DndContext, type DragEndEvent } from "@dnd-kit/core";
// import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
// import { Pencil, ChevronDown, ChevronUp, Eye } from "lucide-react";

// import {
//   flexRender,
//   getCoreRowModel,
//   useReactTable,
//   type ColumnDef,
// } from "@tanstack/react-table";

// type AvailableForwardsData = {
//   bu: string;
//   type: string;
//   currency: string;
//   fcyExposure: number;
//   rate: number;
//   lcyExposure: number;
//   maturity: string;
//   pctToHedge: string;
//   hedged: number;
//   available: number;
// };

// const mockAvailableForwardsData: AvailableForwardsData[] = [
//   {
//     bu: "BU1",
//     type: "Export",
//     currency: "USD",
//     fcyExposure: 150000,
//     rate: 74.5,
//     lcyExposure: 11175000,
//     maturity: "2025-09-01",
//     pctToHedge: "75%",
//     hedged: 25000,
//     available: 125000,
//   },

// ];

// const nonDraggableColumns = ["expand", "select"];

// const AvailableForwards: React.FC = () => {
//   const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
//     {}
//   );
//   const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
//   const [data, setData] = useState<AvailableForwardsData[]>(mockAvailableForwardsData);
//   const [columnOrder, setColumnOrder] = useState<string[]>([
//     "select",
//     "action",
//     "bu",
//     "type",
//     "currency",
//     "fcyExposure",
//     "rate",
//     "lcyExposure",
//     "maturity",
//     "pctToHedge",
//     "hedged",
//     "available",
//     "expand",
//   ]);

//   // Editing functionality state
//   const [isEditing, setIsEditing] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [editValues, setEditValues] = useState<AvailableForwardsData>(
//     {} as AvailableForwardsData
//   );

//   const handleDragEnd = (event: DragEndEvent) => {
//     const { active, over } = event;
//     if (active.id !== over?.id) {
//       const oldIndex = columnOrder.indexOf(active.id as string);
//       const newIndex = columnOrder.indexOf(over?.id as string);
//       const newOrder = [...columnOrder];
//       newOrder.splice(oldIndex, 1);
//       newOrder.splice(newIndex, 0, active.id as string);
//       setColumnOrder(newOrder);
//     }
//   };

//   const renderField = (
//     key: keyof AvailableForwardsData,
//     value: any,
//     originalValue: any
//   ) => {
//     const isEditable = true;
//     return (
//       <div key={key} className="flex flex-col space-y-1">
//         <label className="font-bold text-secondary-text capitalize">
//           {key === "bu" ? "BU" : 
//            key === "fcyExposure" ? "FCY Exposure" :
//            key === "lcyExposure" ? "LCY Exposure" :
//            key === "pctToHedge" ? "% to Hedge" :
//            key.charAt(0).toUpperCase() + key.slice(1)}
//         </label>
//         {isEditing && isEditable ? (
//           <>
//             <input
//               className="border rounded px-2 py-1 text-sm bg-white shadow-sm"
//               value={String(editValues[key] ?? "")}
//               type={typeof originalValue === "number" ? "number" : "text"}
//               onChange={(e) =>
//                 setEditValues((prev) => ({
//                   ...prev,
//                   [key]:
//                     typeof originalValue === "number"
//                       ? parseFloat(e.target.value)
//                       : e.target.value,
//                 }))
//               }
//             />
//             <span className="text-xs text-gray-500">
//               Old: {String(originalValue ?? "—")}
//             </span>
//           </>
//         ) : (
//           <span className="font-medium text-primary-lt">
//             {String(value ?? "—")}
//           </span>
//         )}
//       </div>
//     );
//   };

//   const columns = useMemo<ColumnDef<AvailableForwardsData>[]>(
//     () => [
//       {
//         id: "expand",
//         header: () => (
//           <div className="p-2 flex items-center justify-start">
//             <ChevronDown className="w-4 h-4 text-primary" />
//           </div>
//         ),
//         cell: ({ row }) => (
//           <button
//             onClick={() => {
//               const newExpandedId = expandedRowId === row.id ? null : row.id;
//               setExpandedRowId(newExpandedId);
//               if (newExpandedId !== row.id) {
//                 setIsEditing(false);
//                 setEditValues({} as AvailableForwardsData);
//               }
//             }}
//             className="p-2 hover:bg-primary-xl text-primary rounded-md transition-colors"
//             aria-label={
//               expandedRowId === row.id ? "Collapse row" : "Expand row"
//             }
//           >
//             {expandedRowId === row.id ? (
//               <ChevronUp className="w-4 h-4 text-primary" />
//             ) : (
//               <ChevronDown className="w-4 h-4 text-primary" />
//             )}
//           </button>
//         ),
//         enableSorting: false,
//         enableColumnFilter: false,
//       },

//       {
//         id: "select",
//         header: ({ table }) => (
//           <input
//             type="checkbox"
//             checked={table.getIsAllRowsSelected()}
//             onChange={table.getToggleAllRowsSelectedHandler()}
//           />
//         ),
//         cell: ({ row }) => (
//           <input
//             type="checkbox"
//             checked={row.getIsSelected()}
//             onChange={row.getToggleSelectedHandler()}
//           />
//         ),
//         enableSorting: false,
//         enableColumnFilter: false,
//       },

//       {
//         accessorKey: "action",
//         header: "Action",
//         cell: () => (
//           <div className="flex items-center gap-1">
//             <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-blue-600 hover:bg-blue-100">
//               <Eye className="w-4 h-4" />
//             </button>
//             <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-green-600 hover:bg-green-100">
//               <Pencil className="w-4 h-4" />
//             </button>
//           </div>
//         ),
//       },

//       {
//         accessorKey: "bu",
//         header: "BU",
//         cell: ({ getValue }) => <span>{getValue() as string}</span>,
//       },
//       {
//         accessorKey: "type",
//         header: "Type",
//         cell: ({ getValue }) => <span>{getValue() as string}</span>,
//       },
//       {
//         accessorKey: "currency",
//         header: "Currency",
//         cell: ({ getValue }) => <span>{getValue() as string}</span>,
//       },
//       {
//         accessorKey: "fcyExposure",
//         header: "FCY Exposure",
//         cell: ({ getValue }) => (
//           <span>{(getValue() as number).toLocaleString()}</span>
//         ),
//       },
//       {
//         accessorKey: "rate",
//         header: "Rate",
//         cell: ({ getValue }) => <span>{getValue() as number}</span>,
//       },
//       {
//         accessorKey: "lcyExposure",
//         header: "LCY Exposure",
//         cell: ({ getValue }) => (
//           <span>{(getValue() as number).toLocaleString()}</span>
//         ),
//       },
//       {
//         accessorKey: "maturity",
//         header: "Maturity",
//         cell: ({ getValue }) => <span>{getValue() as string}</span>,
//       },
//       {
//         accessorKey: "pctToHedge",
//         header: "% to Hedge",
//         cell: ({ getValue }) => <span>{getValue() as string}</span>,
//       },
//       {
//         accessorKey: "hedged",
//         header: "Hedged",
//         cell: ({ getValue }) => (
//           <span>{(getValue() as number).toLocaleString()}</span>
//         ),
//       },
//       {
//         accessorKey: "available",
//         header: "Available",
//         cell: ({ getValue }) => (
//           <span>{(getValue() as number).toLocaleString()}</span>
//         ),
//       },
//     ],
//     [expandedRowId]
//   );

//   // Default column visibility
//   const defaultColumnVisibility: Record<string, boolean> = {
//     expand: true,
//     select: true,
//     action: true,
//     bu: true,
//     type: true,
//     currency: true,
//     fcyExposure: true,
//     rate: true,
//     lcyExposure: true,
//     maturity: false, // hidden by default
//     pctToHedge: false, // hidden by default
//     hedged: true,
//     available: true,
//   };

//   const [columnVisibility, setColumnVisibility] = useState<
//     Record<string, boolean>
//   >(defaultColumnVisibility);

//   const table = useReactTable({
//     data,
//     columns,
//     enableRowSelection: true,
//     onRowSelectionChange: setSelectedRowIds,
//     onColumnOrderChange: setColumnOrder,
//     onColumnVisibilityChange: setColumnVisibility,
//     getCoreRowModel: getCoreRowModel(),
//     state: {
//       columnOrder,
//       rowSelection: selectedRowIds,
//       columnVisibility,
//     },
//   });

//   const selectedRows = table.getSelectedRowModel().rows;

//   const totalFcyExposure = selectedRows.reduce(
//     (sum, row) => sum + (row.original.fcyExposure || 0),
//     0
//   );
//   const totalLcyExposure = selectedRows.reduce(
//     (sum, row) => sum + (row.original.lcyExposure || 0),
//     0
//   );
// //   const totalHedged = selectedRows.reduce(
// //     (sum, row) => sum + (row.original.hedged || 0),
// //     0
// //   );
// //   const totalAvailable = selectedRows.reduce(
// //     (sum, row) => sum + (row.original.available || 0),
// //     0
// //   );

//   return (
//     <div className="w-full space-y-4 pt-6">
//       <h2 className="text-2xl font-bold text-secondary-text pl-4">
//         Available Forwards
//       </h2>

//       {/* Column Visibility Controls */}
//       <div className="px-4">
//         <div className="flex flex-wrap gap-2 mb-4">
//           <span className="text-sm font-medium text-gray-700">Show columns:</span>
//           {Object.entries(columnVisibility).map(([columnId, isVisible]) => (
//             <label key={columnId} className="flex items-center space-x-1 text-sm">
//               <input
//                 type="checkbox"
//                 checked={isVisible}
//                 onChange={(e) =>
//                   setColumnVisibility((prev) => ({
//                     ...prev,
//                     [columnId]: e.target.checked,
//                   }))
//                 }
//                 className="rounded border-gray-300"
//               />
//               <span className="capitalize">
//                 {columnId === "bu" ? "BU" :
//                  columnId === "fcyExposure" ? "FCY Exposure" :
//                  columnId === "lcyExposure" ? "LCY Exposure" :
//                  columnId === "pctToHedge" ? "% to Hedge" :
//                  columnId}
//               </span>
//             </label>
//           ))}
//         </div>
//       </div>

//       <div className="shadow-lg border border-border">
//         <DndContext
//           onDragEnd={handleDragEnd}
//           modifiers={[restrictToFirstScrollableAncestor]}
//         >
//           <table className="min-w-[800px] w-full table-auto">
//             <thead className="bg-secondary-color rounded-xl">
//               {table.getHeaderGroups().map((headerGroup) => (
//                 <tr key={headerGroup.id}>
//                   {headerGroup.headers.map((header) => {
//                     const isDraggable = !nonDraggableColumns.includes(
//                       header.column.id
//                     );

//                     return (
//                       <th
//                         key={header.id}
//                         className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
//                         style={{ width: header.getSize() }}
//                       >
//                         {isDraggable ? (
//                           <Droppable id={header.column.id}>
//                             <Draggable id={header.column.id}>
//                               <div className="cursor-move rounded py-1 transition duration-150 ease-in-out">
//                                 {flexRender(
//                                   header.column.columnDef.header,
//                                   header.getContext()
//                                 )}
//                               </div>
//                             </Draggable>
//                           </Droppable>
//                         ) : (
//                           <div className="px-1">
//                             {flexRender(
//                               header.column.columnDef.header,
//                               header.getContext()
//                             )}
//                           </div>
//                         )}
//                       </th>
//                     );
//                   })}
//                 </tr>
//               ))}
//             </thead>
//             <tbody className="divide-y">
//               {table.getRowModel().rows.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={columns.length}
//                     className="px-6 py-12 text-center text-gray-500"
//                   >
//                     <div className="flex flex-col items-center">
//                       <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
//                         <svg
//                           className="w-6 h-6 text-gray-400"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                           />
//                         </svg>
//                       </div>
//                       <p className="text-lg font-medium text-gray-900 mb-1">
//                         No Data Available
//                       </p>
//                       <p className="text-sm text-primary">
//                         There are no forwards to display at the moment.
//                       </p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 table.getRowModel().rows.map((row) => (
//                   <React.Fragment key={row.id}>
//                     <tr
//                       className={
//                         row.index % 2 === 0
//                           ? "bg-primary-md"
//                           : "bg-secondary-color-lt"
//                       }
//                     >
//                       {row.getVisibleCells().map((cell) => (
//                         <td
//                           key={cell.id}
//                           className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
//                         >
//                           {flexRender(
//                             cell.column.columnDef.cell,
//                             cell.getContext()
//                           )}
//                         </td>
//                       ))}
//                     </tr>

//                     {/* Enhanced expanded editable row */}
//                     {expandedRowId === row.id && (
//                       <tr key={`${row.id}-expanded`}>
//                         <td
//                           colSpan={table.getVisibleLeafColumns().length}
//                           className="px-6 py-4 bg-primary-md"
//                         >
//                           <div className="bg-secondary-color-lt rounded-lg p-4 shadow-md border border-border">
//                             <div className="flex justify-between items-center mb-4">
//                               <h3 className="text-lg font-semibold text-primary-lt">
//                                 Forward Contract Details - {row.original.bu}
//                               </h3>
//                               <div className="flex gap-2">
//                                 {isEditing && (
//                                   <button
//                                     onClick={() => {
//                                       setIsEditing(false);
//                                       setEditValues({} as AvailableForwardsData);
//                                     }}
//                                     className="bg-gray-500 text-white px-4 py-1 rounded shadow hover:bg-gray-600"
//                                   >
//                                     Cancel
//                                   </button>
//                                 )}
//                                 <button
//                                   onClick={() => {
//                                     if (isEditing) {
//                                       setIsSaving(true);
//                                       setTimeout(() => {
//                                         setData((prev) =>
//                                           prev.map((item, idx) =>
//                                             idx === row.index
//                                               ? { ...item, ...editValues }
//                                               : item
//                                           )
//                                         );
//                                         setIsEditing(false);
//                                         setIsSaving(false);
//                                         setEditValues({} as AvailableForwardsData);
//                                       }, 500);
//                                     } else {
//                                       setEditValues(row.original);
//                                       setIsEditing(true);
//                                     }
//                                   }}
//                                   className="bg-primary text-white px-4 py-1 rounded shadow hover:bg-primary-dark disabled:opacity-60"
//                                   disabled={isSaving}
//                                 >
//                                   {isEditing
//                                     ? isSaving
//                                       ? "Saving..."
//                                       : "Save"
//                                     : "Edit"}
//                                 </button>
//                               </div>
//                             </div>

//                             <div className="mb-6">
//                               <div className="font-semibold mb-2 text-primary-lt">
//                                 Basic Information
//                               </div>
//                               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                                 {(
//                                   [
//                                     "bu",
//                                     "type",
//                                     "currency",
//                                     "maturity",
//                                   ] as (keyof AvailableForwardsData)[]
//                                 ).map((key) =>
//                                   renderField(
//                                     key,
//                                     isEditing ? editValues[key] : row.original[key],
//                                     row.original[key]
//                                   )
//                                 )}
//                               </div>
//                             </div>

//                             <div className="mb-6">
//                               <div className="font-semibold mb-2 text-primary-lt">
//                                 Exposure & Rate Information
//                               </div>
//                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                 {(
//                                   [
//                                     "fcyExposure",
//                                     "rate",
//                                     "lcyExposure",
//                                   ] as (keyof AvailableForwardsData)[]
//                                 ).map((key) =>
//                                   renderField(
//                                     key,
//                                     isEditing ? editValues[key] : row.original[key],
//                                     row.original[key]
//                                   )
//                                 )}
//                               </div>
//                             </div>

//                             <div>
//                               <div className="font-semibold mb-2 text-primary-lt">
//                                 Hedging Information
//                               </div>
//                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                 {(
//                                   [
//                                     "pctToHedge",
//                                     "hedged",
//                                     "available",
//                                   ] as (keyof AvailableForwardsData)[]
//                                 ).map((key) =>
//                                   renderField(
//                                     key,
//                                     isEditing ? editValues[key] : row.original[key],
//                                     row.original[key]
//                                   )
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         </td>
//                       </tr>
//                     )}
//                   </React.Fragment>
//                 ))
//               )}
//             </tbody>
//             <tfoot className="bg-gray-50 font-semibold">
//               <tr>
//                 {table.getVisibleLeafColumns().map((col) => (
//                   <td
//                     key={col.id}
//                     className="px-6 py-2 text-sm text-start border-t border-border"
//                   >
//                     {{
//                       action: "Total",
//                       fcyExposure: totalFcyExposure.toLocaleString(),
//                       lcyExposure: totalLcyExposure.toLocaleString(),
//                       hedged: totalHedged.toLocaleString(),
//                       available: totalAvailable.toLocaleString(),
//                     }[col.id] ?? null}
//                   </td>
//                 ))}
//               </tr>
//             </tfoot>
//           </table>
//         </DndContext>
//       </div>

//       {/* Selection Summary */}
//       {selectedRows.length > 0 && (
//         <div className="px-4">
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <h3 className="text-sm font-medium text-blue-800 mb-2">
//               Selection Summary ({selectedRows.length} rows selected)
//             </h3>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//               <div>
//                 <span className="font-medium">Total FCY Exposure:</span>
//                 <div className="text-blue-700">{totalFcyExposure.toLocaleString()}</div>
//               </div>
//               <div>
//                 <span className="font-medium">Total LCY Exposure:</span>
//                 <div className="text-blue-700">{totalLcyExposure.toLocaleString()}</div>
//               </div>
//               {/* <div>
//                 <span className="font-medium">Total Hedged:</span>
//                 <div className="text-blue-700">{totalHedged.toLocaleString()}</div>
//               </div>
//               <div>
//                 <span className="font-medium">Total Available:</span>
//                 <div className="text-blue-700">{totalAvailable.toLocaleString()}</div>
//               </div> */}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AvailableForwards;

// // import React from "react";
// // import { Draggable } from "../../common/Draggable";
// // import { Droppable } from "../../common/Droppable";
// // import { DndContext, type DragEndEvent } from "@dnd-kit/core";
// // import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
// // import { useState, useMemo } from "react";
// // import { Eye } from "lucide-react";
// // import {
// //   flexRender,
// //   getCoreRowModel,
// //   // getPaginationRowModel,
// //   useReactTable,
// //   type ColumnDef,
// // } from "@tanstack/react-table";
// // // import { mockLinkedSummaryData } from "./utils";

// // type LinkedSummaryData = {
// //   // action: string;
// //   bu: string;
// //   type: string;
// //   currency: string;
// //   fcyExposure: number;
// //   rate: number;
// //   lcyExposure: number;
// //   maturity: string;
// //   pctToHedge: string;
// //   hedged: number;
// //   available: number;
// // };

// // const nonDraggableColumns = ["actions"];

// // const mockLinkedSummaryData: LinkedSummaryData[] = [
// //   {
// //     // action: "Edit",
// //     bu: "BU1",
// //     type: "Export",
// //     currency: "USD",
// //     fcyExposure: 10,
// //     rate: 74,
// //     lcyExposure: 7400000,
// //     maturity: "2025-07-01",
// //     pctToHedge: "80%",
// //     hedged: 30000,
// //     available: 70000,
// //   },
// //   {
// //     bu: "BU2",
// //     type: "Import",
// //     currency: "EUR",
// //     fcyExposure: 20,
// //     rate: 85,
// //     lcyExposure: 1700000,
// //     maturity: "2025-08-15",
// //     pctToHedge: "60%",
// //     hedged: 10000,
// //     available: 60000,
// //   },
// // ];

// // const AvailableForwards: React.FC = () => {
// //   const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
// //     {}
// //   );

// //   const [data, setData] = useState<LinkedSummaryData[]>(mockLinkedSummaryData);
// //   const [columnOrder, setColumnOrder] = useState<string[]>([
// //     "select",
// //     "action",
// //     "bu",
// //     "type",
// //     "currency",
// //     "fcyExposure",
// //     "rate",
// //     "lcyExposure",
// //     "maturity",
// //     "pctToHedge",
// //     "hedged",
// //     "available",
// //   ]);

// //   const handleDragEnd = (event: DragEndEvent) => {
// //     const { active, over } = event;
// //     if (active.id !== over?.id) {
// //       const oldIndex = columnOrder.indexOf(active.id as string);
// //       const newIndex = columnOrder.indexOf(over?.id as string);
// //       const newOrder = [...columnOrder];
// //       newOrder.splice(oldIndex, 1);
// //       newOrder.splice(newIndex, 0, active.id as string);
// //       setColumnOrder(newOrder);
// //     }
// //   };

// //   const columns = useMemo<ColumnDef<LinkedSummaryData>[]>(
// //     () => [
// //       {
// //         id: "select",
// //         header: ({ table }) => (
// //           <input
// //             type="checkbox"
// //             checked={table.getIsAllRowsSelected()}
// //             onChange={table.getToggleAllRowsSelectedHandler()}
// //           />
// //         ),
// //         cell: ({ row }) => (
// //           <input
// //             type="checkbox"
// //             checked={row.getIsSelected()}
// //             onChange={row.getToggleSelectedHandler()}
// //           />
// //         ),
// //         enableSorting: false,
// //         enableColumnFilter: false,
// //       },

// //       {
// //         accessorKey: "action",
// //         header: "Action",
// //         cell: () => (
// //           <button className="px-2 py-1 text-xs font-semibold text-blue-600 rounded hover:bg-blue-100">
// //             <Eye className="w-4 h-4" strokeWidth={2} />
// //           </button>
// //         ),
// //       },
// //       {
// //         accessorKey: "bu",
// //         header: "BU",
// //         cell: ({ getValue }) => <span>{getValue() as string}</span>,
// //       },
// //       {
// //         accessorKey: "type",
// //         header: "Type",
// //         cell: ({ getValue }) => <span>{getValue() as string}</span>,
// //       },
// //       {
// //         accessorKey: "currency",
// //         header: "Currency",
// //         cell: ({ getValue }) => <span>{getValue() as string}</span>,
// //       },
// //       {
// //         accessorKey: "fcyExposure",
// //         header: "FCY Exposure",
// //         cell: ({ getValue }) => <span>{getValue() as number}</span>,
// //       },
// //       {
// //         accessorKey: "rate",
// //         header: "Rate",
// //         cell: ({ getValue }) => <span>{getValue() as number}</span>,
// //       },
// //       {
// //         accessorKey: "lcyExposure",
// //         header: "LCY Exposure",
// //         cell: ({ getValue }) => <span>{getValue() as number}</span>,
// //       },
// //       {
// //         accessorKey: "maturity",
// //         header: "Maturity",
// //         cell: ({ getValue }) => <span>{getValue() as string}</span>,
// //       },
// //       {
// //         accessorKey: "pctToHedge",
// //         header: "% to Hedge",
// //         cell: ({ getValue }) => <span>{getValue() as string}</span>,
// //       },
// //       {
// //         accessorKey: "hedged",
// //         header: "Hedged",
// //         cell: ({ getValue }) => <span>{getValue() as number}</span>,
// //       },
// //       {
// //         accessorKey: "available",
// //         header: "Available",
// //         cell: ({ getValue }) => <span>{getValue() as number}</span>,
// //       },
// //     ],
// //     []
// //   );

// //   const table = useReactTable({
// //     data,
// //     columns,
// //     getCoreRowModel: getCoreRowModel(),
// //     onColumnOrderChange: setColumnOrder,
// //     state: {
// //       columnOrder,
// //     },
// //   });

// //   const selectedRows = table.getSelectedRowModel().rows;

// //   const totalFcyAmt = selectedRows.reduce(
// //     (sum, row) => sum + (row.original.fcyExposure || 0),
// //     0
// //   );

// //   const totalLcyAmt = selectedRows.reduce(
// //     (sum, row) => sum + (row.original.lcyExposure || 0),
// //     0
// //   );

// //   return (
// //     <React.Fragment>
// //       <div className="w-full space-y-4 pt-6">
// //         <h2 className="text-2xl font-bold text-secondary-text pl-4">
// //           Available Forwards
// //         </h2>

// //         <div className=" shadow-lg border border-border">
// //           <DndContext
// //             onDragEnd={handleDragEnd}
// //             modifiers={[restrictToFirstScrollableAncestor]}
// //           >
// //             <table className="min-w-[800px] w-full table-auto">
// //               <colgroup>
// //                 {table.getVisibleLeafColumns().map((col) => (
// //                   <col key={col.id} className="font-medium min-w-full" />
// //                 ))}
// //               </colgroup>
// //               <thead className="bg-secondary-color rounded-xl">
// //                 {table.getHeaderGroups().map((headerGroup) => (
// //                   <tr key={headerGroup.id}>
// //                     {headerGroup.headers.map((header) => {
// //                       const isDraggable = !nonDraggableColumns.includes(
// //                         header.column.id
// //                       );

// //                       return (
// //                         <th
// //                           key={header.id}
// //                           className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
// //                           style={{ width: header.getSize() }}
// //                         >
// //                           {isDraggable ? (
// //                             <Droppable id={header.column.id}>
// //                               <Draggable id={header.column.id}>
// //                                 <div className="cursor-move rounded py-1 transition duration-150 ease-in-out">
// //                                   {flexRender(
// //                                     header.column.columnDef.header,
// //                                     header.getContext()
// //                                   )}
// //                                 </div>
// //                               </Draggable>
// //                             </Droppable>
// //                           ) : (
// //                             <div className="px-1">
// //                               {flexRender(
// //                                 header.column.columnDef.header,
// //                                 header.getContext()
// //                               )}
// //                             </div>
// //                           )}
// //                         </th>
// //                       );
// //                     })}
// //                   </tr>
// //                 ))}
// //               </thead>
// //               <tbody className="divide-y">
// //                 {table.getRowModel().rows.length === 0 ? (
// //                   <tr>
// //                     <td
// //                       colSpan={columns.length}
// //                       className="px-6 py-12 text-left text-gray-500"
// //                     >
// //                       <div className="flex flex-col items-center">
// //                         <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
// //                           <svg
// //                             className="w-6 h-6 text-gray-400"
// //                             fill="none"
// //                             stroke="currentColor"
// //                             viewBox="0 0 24 24"
// //                           >
// //                             <path
// //                               strokeLinecap="round"
// //                               strokeLinejoin="round"
// //                               strokeWidth={2}
// //                               d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
// //                             />
// //                           </svg>
// //                         </div>
// //                         <p className="text-lg font-medium text-gray-900 mb-1">
// //                           No Data available
// //                         </p>
// //                         <p className="text-sm text-primary">
// //                           There are no data to display at the moment.
// //                         </p>
// //                       </div>
// //                     </td>
// //                   </tr>
// //                 ) : (
// //                   table.getRowModel().rows.map((row) => (
// //                     <tr
// //                       key={row.id}
// //                       className={
// //                         row.index % 2 === 0
// //                           ? "bg-primary-md"
// //                           : "bg-secondary-color-lt"
// //                       }
// //                     >
// //                       {row.getVisibleCells().map((cell) => (
// //                         <td
// //                           key={cell.id}
// //                           className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
// //                         >
// //                           {flexRender(
// //                             cell.column.columnDef.cell,
// //                             cell.getContext()
// //                           )}
// //                         </td>
// //                       ))}
// //                     </tr>
// //                   ))
// //                 )}
// //               </tbody>

// //               <tfoot className="bg-gray-50 font-semibold">
// //                 <tr>
// //                   {table.getVisibleLeafColumns().map((col) => (
// //                     <td
// //                       key={col.id}
// //                       className="px-6 py-2 text-sm text-start border-t border-border"
// //                     >
// //                       {{
// //                         action: "Total",
// //                         fcyExposure: totalFcyAmt,
// //                         lcyExposure: totalLcyAmt,
// //                       }[col.id] ?? null}
// //                     </td>
// //                   ))}
// //                 </tr>
// //               </tfoot>
// //             </table>
// //           </DndContext>
// //         </div>
// //       </div>
// //     </React.Fragment>
// //   );
// // };

// // export default AvailableForwards;
