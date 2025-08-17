import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";

export const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
};

type CurrencyRow = {
  bu: string;
  maturity: string;
  currency: string;
  payable: number;
  receivable: number;
  forwardBuy: number;
  forwardSell: number;
};

interface Props {
  maturity: string;
  rows: CurrencyRow[];
  expanded: boolean;
  toggleExpand: () => void;
}

const MaturityTable: React.FC<Props> = ({ maturity, rows, expanded, toggleExpand }) => {
  const navigate = useNavigate();

  const columns: ColumnDef<CurrencyRow>[] = [
    {
      header: "Business Unit",
      accessorKey: "bu",
    },
    {
      header: "Currency",
      accessorKey: "currency",
    },
    {
      header: "Exposure",
      columns: [
        {
          header: "Payable",
          accessorKey: "payable",
          cell: (info) => formatCurrency(info.getValue() as number),
        },
        {
          header: "Receivable",
          accessorKey: "receivable",
          cell: (info) => formatCurrency(info.getValue() as number),
        },
        {
          header: "Net (R - P)",
          cell: ({ row }) =>
            formatCurrency(row.original.receivable - row.original.payable),
        },
      ],
    },
    {
      header: "Forward",
      columns: [
        {
          header: "Buy",
          accessorKey: "forwardBuy",
          cell: (info) => formatCurrency(info.getValue() as number),
        },
        {
          header: "Sell",
          accessorKey: "forwardSell",
          cell: (info) => formatCurrency(info.getValue() as number),
        },
        {
          header: "Net (B - S)",
          cell: ({ row }) =>
            formatCurrency(row.original.forwardBuy - row.original.forwardSell),
        },
      ],
    },
    {
      header: "Diff (Net Exp - Net Fwd)",
      cell: ({ row }) => {
        const netExp = row.original.receivable - row.original.payable;
        const netFwd = row.original.forwardBuy - row.original.forwardSell;
        const diff = netExp - netFwd;
        const color =
          diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-600";

        return (
          <button
            className={color}
            onClick={() =>
              navigate("/fxbooking", { state: row.original })
            }
          >
            {formatCurrency(diff)}
          </button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.payable += row.payable;
      acc.receivable += row.receivable;
      acc.forwardBuy += row.forwardBuy;
      acc.forwardSell += row.forwardSell;
      return acc;
    },
    { payable: 0, receivable: 0, forwardBuy: 0, forwardSell: 0 }
  );

  const netExp = totals.receivable - totals.payable;
  const netFwd = totals.forwardBuy - totals.forwardSell;
  const diff = netExp - netFwd;
  const diffColor =
    diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-600";

  return (
    <div className="mb-8 border border-border shadow">
      <button
        className="w-full text-center font-semibold text-primary px-4 py-2 bg-primary-xl"
        onClick={toggleExpand}
      >
      {maturity}
      </button>
      {expanded && (
        <div className="overflow-auto">
          <table className="w-full text-sm text-center ">
            <thead className="text-center font-medium ">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2 border text-secondary-text border-border"
                      colSpan={header.colSpan}
                    >
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
                    <td key={cell.id} className="px-3 py-2 border text-secondary-text border-border">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-primary-lt shadow-md font-semibold">
                <td className="px-3 py-2 text-white border border-border text-center">
                  Total
                </td>
                <td className="px-3 py-2 text-white border border-border text-center">
                  {maturity}
                </td>
                <td className="px-3 py-2 border border-border text-white ">
                  {formatCurrency(totals.payable)}
                </td>
                <td className="px-3 py-2 border border-border text-white ">
                  {formatCurrency(totals.receivable)}
                </td>
                <td className="px-3 py-2 border border-border text-white ">
                  {formatCurrency(netExp)}
                </td>
                <td className="px-3 py-2 border border-border text-white ">
                  {formatCurrency(totals.forwardBuy)}
                </td>
                <td className="px-3 py-2 border border-border text-white ">
                  {formatCurrency(totals.forwardSell)}
                </td>
                <td className="px-3 py-2 border border-border text-white ">
                  {formatCurrency(netFwd)}
                </td>
                <td className={`px-3 py-2 border border-border text-white font-semibold ${diffColor}`}>
                  {formatCurrency(diff)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MaturityTable;
