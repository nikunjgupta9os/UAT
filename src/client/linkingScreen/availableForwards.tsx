import React from "react";
import { Draggable } from "../common/Draggable";
import { Droppable } from "../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  // getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
// import { mockLinkedSummaryData } from "./utils";

type LinkedSummaryData = {
  // action: string;
  bu: string;
  type: string;
  currency: string;
  fcyExposure: number;
  rate: number;
  lcyExposure: number;
  maturity: string;
  pctToHedge: string;
  hedged: number;
  available: number;
};

const nonDraggableColumns = ["actions","select"];

const mockLinkedSummaryData: LinkedSummaryData[] = [
  {
    // action: "Edit",
    bu: "BU1",
    type: "Export",
    currency: "USD",
    fcyExposure: 10,
    rate: 74,
    lcyExposure: 7400000,
    maturity: "2025-07-01",
    pctToHedge: "80%",
    hedged: 30000,
    available: 70000,
  },
  {
    bu: "BU2",
    type: "Import",
    currency: "EUR",
    fcyExposure: 20,
    rate: 85,
    lcyExposure: 1700000,
    maturity: "2025-08-15",
    pctToHedge: "60%",
    hedged: 10000,
    available: 60000,
  },
];

const AvailableForwards: React.FC = () => {
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>(
    {}
  );

  const [data, setData] = useState<LinkedSummaryData[]>(mockLinkedSummaryData);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "action",
    "bu",
    "type",
    "currency",
    "fcyExposure",
    "rate",
    "lcyExposure",
    "maturity",
    "pctToHedge",
    "hedged",
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
          <button className="px-2 py-1 text-xs font-semibold text-blue-600 rounded hover:bg-blue-100">
            <Eye className="w-4 h-4" strokeWidth={2} />
          </button>
        ),
      },
      {
        accessorKey: "bu",
        header: "BU",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "fcyExposure",
        header: "FCY Exposure",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "rate",
        header: "Rate",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "lcyExposure",
        header: "LCY Exposure",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "maturity",
        header: "Maturity",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "pctToHedge",
        header: "% to Hedge",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "hedged",
        header: "Hedged",
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
    getCoreRowModel: getCoreRowModel(),
    onColumnOrderChange: setColumnOrder,
    state: {
      columnOrder,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;

  const totalFcyAmt = selectedRows.reduce(
    (sum, row) => sum + (row.original.fcyExposure || 0),
    0
  );

  const totalLcyAmt = selectedRows.reduce(
    (sum, row) => sum + (row.original.lcyExposure || 0),
    0
  );

  return (
    <React.Fragment>
      <div className="w-full space-y-4 pt-6">
        <h2 className="text-2xl font-bold text-secondary-text pl-4">
          Available Forwards
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
                          className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
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
                      className="px-6 py-12 text-left text-primary"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <svg
                            className="w-6 h-6 text-primary"
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
                        <p className="text-xl font-medium text-primary mb-1">
                          No Data available
                        </p>
                        <p className="text-md font-medium text-primary">
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
                        fcyExposure: totalFcyAmt,
                        lcyExposure: totalLcyAmt,
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

export default AvailableForwards;
