// import { useState, useMemo } from "react";
// import CustomSelect from "../common/SearchSelect";
// import Layout from "../common/Layout";
// import Button from "../ui/Button";
// import {
//   flexRender,
//   getCoreRowModel,
//   // getPaginationRowModel,
//   useReactTable,
//   type ColumnDef,
// } from "@tanstack/react-table";
// import { Link } from "lucide-react";
// import { Draggable } from "../common/Draggable";
// import { Droppable } from "../common/Droppable";
// import { DndContext, type DragEndEvent } from "@dnd-kit/core";
// import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
// import { mockLinkedSummaryData } from "./utils";
// import AvailableForwards from "./availableForwards";
// import UnlinkedExposure from "./UnlinkedExposure";
// type LinkedSummaryData = {
//   srNo: number;
//   exposureId: string;
//   forwardId: string;
//   linkedAmount: number;
// };

// const nonDraggableColumns = ["srNo", "actions"];
// const entityOptions = [
//   { value: "entity1", label: "Entity 1" },
//   { value: "entity2", label: "Entity 2" },
// ];

// const typeOptions = [
//   { value: "manual", label: "Manual" },
//   { value: "auto", label: "Auto" },
// ];

// const LinkingScreen = () => {
//   const [selectedEntity, setSelectedEntity] = useState("");
//   const [selectedType, setSelectedType] = useState("");

//   // State for resizable tables
//   const [activeTable, setActiveTable] = useState<"left" | "right" | null>(null);
//   // const [activeTable, setActiveTable] = useState<"left" | "right">("null");

//   const [data, setData] = useState<LinkedSummaryData[]>(mockLinkedSummaryData);
//   const [columnOrder, setColumnOrder] = useState<string[]>([
//     "srNo",
//     "exposureId",
//     "forwardId",
//     "linkedAmount",
//     "actions",
//   ]);

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

//   const handleTableClick = (tableId: "left" | "right") => {
//     setActiveTable((prev) => (prev === tableId ? null : tableId));
//   };

//   const getTableWidth = (tableId: "left" | "right") => {
//     if (activeTable === null) {
//       return "w-1/2";
//     }
//     return activeTable === tableId ? "w-3/4" : "w-1/4";
//   };  

//   // Handle table resize click
//   // const handleTableClick = (tableId: "left" | "right") => {
//   //   if (activeTable !== tableId) {
//   //     setActiveTable(tableId);
//   //   }
//   // };

//   // // Calculate table width based on active state
//   // const getTableWidth = (tableId: "left" | "right") => {
//   //   return activeTable === tableId ? "w-3/4" : "w-1/4";
//   // };

//   const columns = useMemo<ColumnDef<LinkedSummaryData>[]>(
//     () => [
//       {
//         accessorKey: "srNo",
//         header: "Sr No.",
//         cell: ({ row }) => (
//           <span className="text-sm text-gray-700">{row.index + 1}</span>
//         ),
//       },

//       {
//         accessorKey: "exposureId",
//         header: "Exposure ID",
//         cell: ({ getValue }) => (
//           <span className="text-sm text-gray-700">{getValue() as string}</span>
//         ),
//       },

//       {
//         accessorKey: "forwardId",
//         header: "Forward ID",
//         cell: ({ getValue }) => (
//           <span className="text-sm text-gray-700">{getValue() as string}</span>
//         ),
//       },

//       {
//         accessorKey: "linkedAmount",
//         header: "Linked Amount",
//         cell: ({ getValue }) => (
//           <span className="text-sm text-gray-700">{getValue() as number}</span>
//         ),
//       },

//       {
//         accessorKey: "actions",
//         header: "Actions",
//         cell: ({ row }) => (
//           <div className="flex items-center space-x-1">
//             <button className="p-1.5 hover:bg-primary-xl rounded transition-colors">
//               <Link size={16} strokeWidth={2} />
//             </button>
//           </div>
//         ),
//       },
//     ],
//     []
//   );

//   const table = useReactTable({
//     data,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     onColumnOrderChange: setColumnOrder,
//     state: {
//       columnOrder,
//     },
//   });

//   return (
//     <Layout title="Manual / Auto Exposure-to-Forward Linkage">
//       <div className="space-y-4">
//         {/* All the Select Components */}
//         <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
//           <CustomSelect
//             label="Business Unit"
//             options={typeOptions}
//             selectedValue={selectedType}
//             onChange={(value) => setSelectedType(value)}
//             placeholder="Select type"
//             isClearable={false}
//           />

//           <CustomSelect
//             label="Currency"
//             options={entityOptions}
//             selectedValue={selectedEntity}
//             onChange={(value) => setSelectedEntity(value)}
//             placeholder="Select entity"
//             isClearable={false}
//           />

//           <CustomSelect
//             label="Type"
//             options={typeOptions}
//             selectedValue={selectedType}
//             onChange={(value) => setSelectedType(value)}
//             placeholder="Select type"
//             isClearable={false}
//           />

//           <CustomSelect
//             label="Bank"
//             options={entityOptions}
//             selectedValue={selectedEntity}
//             onChange={(value) => setSelectedEntity(value)}
//             placeholder="Select entity"
//             isClearable={false}
//           />
//         </div>

//         {/* Maturity Input and Link Button */}
//         <div className="mt-4 flex flex-wrap justify-end gap-4 items-end">
//           <input
//             type="number"
//             step={1}
//             placeholder="Maturity < (months)"
//             className="border border-gray-300 rounded px-4 py-2 w-[240px] md:w-[260px] lg:w-[280px]"
//           />

//           <div className="bg-primary text-white rounded px-4 w-[200px] md:w-[200px] lg:w-[200px] flex items-center justify-center">
//             <Button>Apply Filter</Button>
//           </div>
//         </div>

//         {/* Resizable Tables */}
//         <div className="flex justify-between gap-4">
//           <div
//             className={`h-full transition-all duration-500 ease-in-out cursor-pointer rounded-lg ${getTableWidth(
//               "left"
//             )} ${
//               activeTable === "left"
//                 ? "ring-2 ring-blue-500 ring-opacity-50"
//                 : "hover:ring-1 hover:ring-gray-300"
//             }`}
//             onClick={() => handleTableClick("left")}
//           >
//             <div className="h-full overflow-hidden rounded-lg border border-gray-200">
//               <UnlinkedExposure />
//             </div>
//           </div>

//           <div
//             className={`h-full transition-all duration-500 ease-in-out cursor-pointer rounded-lg ${getTableWidth(
//               "right"
//             )} ${
//               activeTable === "right"
//                 ? "ring-2 ring-blue-500 ring-opacity-50"
//                 : "hover:ring-1 hover:ring-gray-300"
//             }`}
//             onClick={() => handleTableClick("right")}
//           >
//             <div className="h-full overflow-hidden rounded-lg border border-gray-200">
//               <AvailableForwards />
//             </div>
//           </div>
//         </div>

//         {/* Linked Summary */}
//         <div className="w-full space-y-4 pt-6">
//           <h2 className="text-2xl font-bold text-secondary-text">
//             Linking Summary
//           </h2>

//           <div className=" shadow-lg border border-border">
//             <DndContext
//               onDragEnd={handleDragEnd}
//               modifiers={[restrictToFirstScrollableAncestor]}
//             >
//               <table className="min-w-[800px] w-full table-auto">
//                 <colgroup>
//                   {table.getVisibleLeafColumns().map((col) => (
//                     <col key={col.id} className="font-medium min-w-full" />
//                   ))}
//                 </colgroup>
//                 <thead className="bg-secondary-color rounded-xl">
//                   {table.getHeaderGroups().map((headerGroup) => (
//                     <tr key={headerGroup.id}>
//                       {headerGroup.headers.map((header) => {
//                         const isDraggable = !nonDraggableColumns.includes(
//                           header.column.id
//                         );

//                         return (
//                           <th
//                             key={header.id}
//                             className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
//                             style={{ width: header.getSize() }}
//                           >
//                             {isDraggable ? (
//                               <Droppable id={header.column.id}>
//                                 <Draggable id={header.column.id}>
//                                   <div className="cursor-move rounded py-1 transition duration-150 ease-in-out">
//                                     {flexRender(
//                                       header.column.columnDef.header,
//                                       header.getContext()
//                                     )}
//                                   </div>
//                                 </Draggable>
//                               </Droppable>
//                             ) : (
//                               <div className="px-1">
//                                 {flexRender(
//                                   header.column.columnDef.header,
//                                   header.getContext()
//                                 )}
//                               </div>
//                             )}
//                           </th>
//                         );
//                       })}
//                     </tr>
//                   ))}
//                 </thead>
//                 <tbody className="divide-y">
//                   {table.getRowModel().rows.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={columns.length}
//                         className="px-6 py-12 text-left text-gray-500"
//                       >
//                         <div className="flex flex-col items-center">
//                           <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
//                             <svg
//                               className="w-6 h-6 text-gray-400"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                               />
//                             </svg>
//                           </div>
//                           <p className="text-lg font-medium text-gray-900 mb-1">
//                             No Data available
//                           </p>
//                           <p className="text-sm text-primary">
//                             There are no data to display at the moment.
//                           </p>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     table.getRowModel().rows.map((row) => (
//                       <tr
//                         key={row.id}
//                         className={
//                           row.index % 2 === 0
//                             ? "bg-primary-md"
//                             : "bg-secondary-color-lt"
//                         }
//                       >
//                         {row.getVisibleCells().map((cell) => (
//                           <td
//                             key={cell.id}
//                             className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
//                           >
//                             {flexRender(
//                               cell.column.columnDef.cell,
//                               cell.getContext()
//                             )}
//                           </td>
//                         ))}
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </DndContext>
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// };

// export default LinkingScreen;

// // import { useState, useMemo } from "react";
// // import CustomSelect from "../common/SearchSelect";
// // import Layout from "../common/Layout";
// // import Button from "../ui/Button";
// // import {
// //   flexRender,
// //   getCoreRowModel,
// //   // getPaginationRowModel,
// //   useReactTable,
// //   type ColumnDef,
// // } from "@tanstack/react-table";
// // import { Link } from "lucide-react";
// // import { Draggable } from "../common/Draggable";
// // import { Droppable } from "../common/Droppable";
// // import { DndContext, type DragEndEvent } from "@dnd-kit/core";
// // import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
// // import { mockLinkedSummaryData } from "./utils";
// // import AvailableForwards from "./availableForwards";

// // type LinkedSummaryData = {
// //   srNo: number;
// //   exposureId: string;
// //   forwardId: string;
// //   linkedAmount: number;
// // };

// // const nonDraggableColumns = ["srNo", "actions"];
// // const entityOptions = [
// //   { value: "entity1", label: "Entity 1" },
// //   { value: "entity2", label: "Entity 2" },
// // ];

// // const typeOptions = [
// //   { value: "manual", label: "Manual" },
// //   { value: "auto", label: "Auto" },
// // ];

// // const LinkingScreen = () => {
// //   const [selectedEntity, setSelectedEntity] = useState("");

// //   const [selectedType, setSelectedType] = useState("");

// //   const [data, setData] = useState<LinkedSummaryData[]>(mockLinkedSummaryData);
// //   const [columnOrder, setColumnOrder] = useState<string[]>([
// //     "srNo",
// //     "exposureId",
// //     "forwardId",
// //     "linkedAmount",
// //     "actions",
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
// //         accessorKey: "srNo",
// //         header: "Sr No.",
// //         cell: ({ row }) => (
// //           <span className="text-sm text-gray-700">{row.index + 1}</span>
// //         ),
// //       },

// //       {
// //         accessorKey: "exposureId",
// //         header: "Exposure ID",
// //         cell: ({ getValue }) => (
// //           <span className="text-sm text-gray-700">{getValue() as string}</span>
// //         ),
// //       },

// //       {
// //         accessorKey: "forwardId",
// //         header: "Forward ID",
// //         cell: ({ getValue }) => (
// //           <span className="text-sm text-gray-700">{getValue() as string}</span>
// //         ),
// //       },

// //       {
// //         accessorKey: "linkedAmount",
// //         header: "Linked Amount",
// //         cell: ({ getValue }) => (
// //           <span className="text-sm text-gray-700">{getValue() as number}</span>
// //         ),
// //       },

// //       {
// //         accessorKey: "actions",
// //         header: "Actions",
// //         cell: ({ row }) => (
// //           <div className="flex items-center space-x-1">
// //             <button className="p-1.5 hover:bg-primary-xl rounded transition-colors">
// //               <Link size={16} strokeWidth={2} />
// //             </button>
// //           </div>
// //         ),
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

// //   return (
// //     <Layout title="Manual / Auto Exposure-to-Forward Linkage">
// //       <div className="space-y-4">
// //         {/* All the Select Components */}
// //         <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
// //           <CustomSelect
// //             label="Business Unit"
// //             options={typeOptions}
// //             selectedValue={selectedType}
// //             onChange={(value) => setSelectedType(value)}
// //             placeholder="Select type"
// //             isClearable={false}
// //           />

// //           <CustomSelect
// //             label="Currency"
// //             options={entityOptions}
// //             selectedValue={selectedEntity}
// //             onChange={(value) => setSelectedEntity(value)}
// //             placeholder="Select entity"
// //             isClearable={false}
// //           />

// //           <CustomSelect
// //             label="Type"
// //             options={typeOptions}
// //             selectedValue={selectedType}
// //             onChange={(value) => setSelectedType(value)}
// //             placeholder="Select type"
// //             isClearable={false}
// //           />

// //           <CustomSelect
// //             label="Bank"
// //             options={entityOptions}
// //             selectedValue={selectedEntity}
// //             onChange={(value) => setSelectedEntity(value)}
// //             placeholder="Select entity"
// //             isClearable={false}
// //           />
// //         </div>

// //         {/* Maturity Input and Link Button */}
// //         <div className="mt-4 flex flex-wrap justify-end gap-4 items-end">
// //           <input
// //             type="number"
// //             step={1}
// //             placeholder="Maturity < (months)"
// //             className="border border-gray-300 rounded px-4 py-2 w-[240px] md:w-[260px] lg:w-[280px]"
// //           />

// //           <div className="bg-primary text-white rounded px-4 w-[200px] md:w-[200px] lg:w-[200px] flex items-center justify-center">
// //             <Button>Apply Filter</Button>
// //           </div>
// //         </div>

// //         {/* Tables */}
// //         <div className="flex justify-between gap-2">
// //           <div className="w-full h-[400px]">
// //             <AvailableForwards />
// //           </div>

// //           <div className="w-full h-[400px]">
// //             <AvailableForwards />
// //           </div>

// //         </div>

// //         {/* Linked Summary */}
// //         <div className="w-full space-y-4 pt-6">
// //           <h2 className="text-2xl font-bold text-secondary-text">
// //             Linking Summary
// //           </h2>

// //           <div className=" shadow-lg border border-border">
// //             <DndContext
// //               onDragEnd={handleDragEnd}
// //               modifiers={[restrictToFirstScrollableAncestor]}
// //             >
// //               <table className="min-w-[800px] w-full table-auto">
// //                 <colgroup>
// //                   {table.getVisibleLeafColumns().map((col) => (
// //                     <col key={col.id} className="font-medium min-w-full" />
// //                   ))}
// //                 </colgroup>
// //                 <thead className="bg-secondary-color rounded-xl">
// //                   {table.getHeaderGroups().map((headerGroup) => (
// //                     <tr key={headerGroup.id}>
// //                       {headerGroup.headers.map((header) => {
// //                         const isDraggable = !nonDraggableColumns.includes(
// //                           header.column.id
// //                         );

// //                         return (
// //                           <th
// //                             key={header.id}
// //                             className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
// //                             style={{ width: header.getSize() }}
// //                           >
// //                             {isDraggable ? (
// //                               <Droppable id={header.column.id}>
// //                                 <Draggable id={header.column.id}>
// //                                   <div className="cursor-move rounded py-1 transition duration-150 ease-in-out">
// //                                     {flexRender(
// //                                       header.column.columnDef.header,
// //                                       header.getContext()
// //                                     )}
// //                                   </div>
// //                                 </Draggable>
// //                               </Droppable>
// //                             ) : (
// //                               <div className="px-1">
// //                                 {flexRender(
// //                                   header.column.columnDef.header,
// //                                   header.getContext()
// //                                 )}
// //                               </div>
// //                             )}
// //                           </th>
// //                         );
// //                       })}
// //                     </tr>
// //                   ))}
// //                 </thead>
// //                 <tbody className="divide-y">
// //                   {table.getRowModel().rows.length === 0 ? (
// //                     <tr>
// //                       <td
// //                         colSpan={columns.length}
// //                         className="px-6 py-12 text-left text-gray-500"
// //                       >
// //                         <div className="flex flex-col items-center">
// //                           <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
// //                             <svg
// //                               className="w-6 h-6 text-gray-400"
// //                               fill="none"
// //                               stroke="currentColor"
// //                               viewBox="0 0 24 24"
// //                             >
// //                               <path
// //                                 strokeLinecap="round"
// //                                 strokeLinejoin="round"
// //                                 strokeWidth={2}
// //                                 d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
// //                               />
// //                             </svg>
// //                           </div>
// //                           <p className="text-lg font-medium text-gray-900 mb-1">
// //                             No Data available
// //                           </p>
// //                           <p className="text-sm text-primary">
// //                             There are no data to display at the moment.
// //                           </p>
// //                         </div>
// //                       </td>
// //                     </tr>
// //                   ) : (
// //                     table.getRowModel().rows.map((row) => (
// //                       <tr
// //                         key={row.id}
// //                         className={
// //                           row.index % 2 === 0
// //                             ? "bg-primary-md"
// //                             : "bg-secondary-color-lt"
// //                         }
// //                       >
// //                         {row.getVisibleCells().map((cell) => (
// //                           <td
// //                             key={cell.id}
// //                             className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
// //                           >
// //                             {flexRender(
// //                               cell.column.columnDef.cell,
// //                               cell.getContext()
// //                             )}
// //                           </td>
// //                         ))}
// //                       </tr>
// //                     ))
// //                   )}
// //                 </tbody>
// //               </table>
// //             </DndContext>
// //           </div>
// //         </div>
// //       </div>
// //     </Layout>
// //   );
// // };

// // export default LinkingScreen;
