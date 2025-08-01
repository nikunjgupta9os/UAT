import React from "react";
import { Draggable } from "../common/Draggable";
import { Droppable } from "../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { useState, useMemo } from "react";
import { Pencil } from "lucide-react";

import {
  flexRender,
  getCoreRowModel,
  // getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
// import { mockLinkedSummaryData } from "./utils";

type LinkedSummaryData = {
  bank: string;
  fwdType: string;
  maturity: string;
  currency: string;
  fcyAmt: number;
  rate: number;
  lcyAmt: number;
  linked: number;
  available: number;
};

export const mockLinkedSummaryData: LinkedSummaryData[] = [
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
  {
    bank: "Bank A",
    fwdType: "1M",
    maturity: "2025-07-01",
    currency: "USD",
    fcyAmt: 120000,
    rate: 74,
    lcyAmt: 8880000,
    linked: 20000,
    available: 100000,
  },
];

const nonDraggableColumns = ["action", "select"];
//   {
//     bank: "Bank A",
//     fwdType: "1M",
//     maturity: "2025-07-01",
//     currency: "USD",
//     fcyAmt: 120000,
//     rate: 74,
//     lcyAmt: 8880000,
//     linked: 20000,
//     available: 100000,
//   },
// ];

const UnlinkedExposure: React.FC = () => {
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  );

  const [data, setData] = useState<LinkedSummaryData[]>(mockLinkedSummaryData);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "action",
    "bank",
    "fwdType",
    "maturity",
    "currency",
    "fcyAmt",
    "rate",
    "lcyAmt",
    "linked",
    "available",
  ]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  const columns = useMemo<ColumnDef<LinkedSummaryData>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },

      {
        accessorKey: "action",
        header: "Action",
        cell: () => (
          <button className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded text-blue-600 hover:bg-blue-100">
            <Pencil className="w-4 h-4" />
          </button>
        ),
      },
      {
        accessorKey: "bank",
        header: "Bank",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "fwdType",
        header: "Fwd Type",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "maturity",
        header: "Maturity",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "fcyAmt",
        header: "FCY Amt",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "rate",
        header: "Rate",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "lcyAmt",
        header: "LCY Amt",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "linked",
        header: "Linked",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "available",
        header: "Available",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    enableRowSelection: true,
    onRowSelectionChange: setSelectedRowIds,
    getCoreRowModel: getCoreRowModel(),
    onColumnOrderChange: setColumnOrder,
    state: {
      columnOrder,
      rowSelection: selectedRowIds,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;

  const totalFcyAmt = selectedRows.reduce(
    (sum, row) => sum + (row.original.fcyAmt || 0),
    0
  );

  const totalLcyAmt = selectedRows.reduce(
    (sum, row) => sum + (row.original.lcyAmt || 0),
    0
  );

  return (
    <React.Fragment>
      <div className="w-full space-y-4 pt-6">
        <h2 className="text-2xl font-bold text-secondary-text pl-4">
          UnLinked Exposure
        </h2>

        <div className=" shadow-lg border border-border">
          <DndContext
            onDragEnd={handleDragEnd}
            modifiers={[restrictToFirstScrollableAncestor]}
          >
            <table className="min-w-[800px] w-full table-auto">
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
                {table.getRowModel().rows.length === 0 ? (
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
                  table.getRowModel().rows.map((row) => (
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
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  {table.getVisibleLeafColumns().map((col) => (
                    <td
                      key={col.id}
                      className="px-6 py-2 text-sm text-start border-t border-border"
                    >
                      {{
                        action: "Total",
                        fcyAmt: totalFcyAmt,
                        lcyAmt: totalLcyAmt,
                      }[col.id] ?? null}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </DndContext>
        </div>
      </div>
    </React.Fragment>
  );
};

export default UnlinkedExposure;
