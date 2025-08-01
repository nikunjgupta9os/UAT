import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { forwardData, format } from "./sharedData";

const forwardColumns: ColumnDef<any>[] = [
  { header: "Deal ID", accessorKey: "dealId" },
  { header: "Bank", accessorKey: "bank" },
  { header: "BU", accessorKey: "bu" },
  { header: "FCY", accessorKey: "fcy" },
  { header: "LCY", accessorKey: "lcy" },
  {
    header: "FCY Amount",
    accessorKey: "fcyAmount",
    cell: (info) => format(info.getValue() as number),
  },
  { header: "Spot Rate", accessorKey: "spotRate" },
  { header: "Forward Rate", accessorKey: "forwardRate" },
  { header: "Bank Margin (bps)", accessorKey: "marginBps" },
  {
    header: "LCY Value",
    accessorKey: "lcyValue",
    cell: (info) => format(info.getValue() as number, "INR"),
  },
  { header: "Maturity Date", accessorKey: "maturityDate" },
  { header: "Deal Date", accessorKey: "dealDate" },
];

const ForwardsDetails: React.FC = () => {
  const grouped = useMemo(() => {
    const map: Record<string, typeof forwardData> = {};
    forwardData.forEach((row) => {
      if (!map[row.bu]) map[row.bu] = [];
      map[row.bu].push(row);
    });
    return map;
  }, []);

  return (
    <div className="overflow-auto p-4">
      {Object.entries(grouped).map(([bu, rows]) => {
        const table = useReactTable({
          data: rows,
          columns: forwardColumns,
          getCoreRowModel: getCoreRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
        });

        const subtotal = rows.reduce((acc, row) => acc + row.lcyValue, 0);

        return (
          <div key={bu} className="mb-8">
            <h4 className="text-md font-semibold text-left text-secondary-text mb-2">
              Business Unit: {bu}
            </h4>
            <table className="min-w-full text-sm text-center border border-primary mb-1">
              <thead className="text-center font-medium bg-primary-lt">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="border border-border text-secondary-text px-2 py-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="border border-border text-secondary-text px-2 py-1">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-primary-xl text-secondary-text-dark border border-border font-semibold shadow-sm">
                    <td colSpan={9} className="text-right px-2 py-1">
                    Subtotal for {bu} (LCY):
                  </td>
                  <td className="border border-border px-2 py-1 text-left">
                    {format(subtotal, "INR")}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default ForwardsDetails;
