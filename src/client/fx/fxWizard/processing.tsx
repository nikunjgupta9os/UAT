import React, { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

type OldForward = {
  dealId: string;
  originalRate: string;
  currentSpotRate: string;
  currentFwdRate: string;
  amountProcessed: string;
  gainLossSpot: string;
  edImpact: string;
};

const oldForwardsData: OldForward[] = [
  {
    dealId: "DL-001",
    originalRate: "83.25",
    currentSpotRate: "83.50",
    currentFwdRate: "83.60",
    amountProcessed: "100,000",
    gainLossSpot: "2,500",
    edImpact: "1,800",
  },
  // Add more rows as needed
];

const Processing: React.FC = () => {
  const columns = useMemo<ColumnDef<OldForward>[]>(
    () => [
      {
        accessorKey: "dealId",
        header: "Deal ID",
        cell: ({ getValue }) => <span className="font-medium text-gray-900">{getValue() as string}</span>,
      },
      {
        accessorKey: "originalRate",
        header: "Original Rate",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "currentSpotRate",
        header: "Current Spot Rate",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "currentFwdRate",
        header: "Current Fwd Rate",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "amountProcessed",
        header: "Amount Processed",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "gainLossSpot",
        header: "Gain/Loss (Spot)",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "edImpact",
        header: "ED Impact (Net of Charges)",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: oldForwardsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalGainLossSpot = useMemo(
    () =>
      oldForwardsData.reduce(
        (sum, row) => sum + Number(row.gainLossSpot.replace(/,/g, "")),
        0
      ),
    []
  );
  const totalEDImpact = useMemo(
    () =>
      oldForwardsData.reduce(
        (sum, row) => sum + Number(row.edImpact.replace(/,/g, "")),
        0
      ),
    []
  );

  return (
    <div className="space-y-6">

      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold text-primary">Impact of Old Forwards</h3>
        <div className="overflow-x-auto rounded border border-border bg-white">
          <table className="min-w-[900px] w-full table-auto">
            <thead className="bg-secondary-color">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No Data Available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={idx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 border-b border-border"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-8 mt-4">
          <span className="font-bold text-lg">
            Total Net Gain/Loss (Spot):&nbsp;
            <span className="text-primary">{totalGainLossSpot.toLocaleString()}</span>
          </span>
          <span className="font-bold text-lg">
            Total ED Impact (Net of Charges):&nbsp;
            <span className="text-primary">{totalEDImpact.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Processing;