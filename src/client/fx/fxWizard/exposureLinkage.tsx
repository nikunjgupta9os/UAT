import React, { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

type ExposureLinkage = {
  exposureId: string;
  type: string;
  currency: string;
  originalMaturity: string;
  newMaturity: string;
  status: string;
};

const exposureLinkageData: ExposureLinkage[] = [
  {
    exposureId: "EXP-001",
    type: "Forward",
    currency: "USD",
    originalMaturity: "2025-08-31",
    newMaturity: "2026-02-28",
    status: "Linked",
  },
  // Add more rows as needed
];

const ExposureLinkageStatus: React.FC = () => {
  const columns = useMemo<ColumnDef<ExposureLinkage>[]>(
    () => [
      {
        accessorKey: "exposureId",
        header: "Exposure ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">
            {getValue() as string}
          </span>
        ),
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
        accessorKey: "originalMaturity",
        header: "Original Maturity",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "newMaturity",
        header: "New Maturity",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: exposureLinkageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-6">
      <h3 className="mb-2 text-lg font-semibold text-primary">
        Exposure Linkage Status
      </h3>
      <div className="mb-6">
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
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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
                    className={
                      idx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 border-b border-border"
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
          </table>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-secondary-text">
        New Forward Details (Post-Rollover)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            New FX Pair:
          </span>
          <span className="font-semibold text-gray-900">N/A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            New Order Type:
          </span>
          <span className="font-semibold text-gray-900">N/A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">New Amount:</span>
          <span className="font-semibold text-gray-900">$1,225,000.00</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            New Maturity Date:
          </span>
          <span className="font-semibold text-gray-900">N/A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            New Spot Rate:
          </span>
          <span className="font-semibold text-gray-900">N/A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            New Premium/Discount:
          </span>
          <span className="font-semibold text-gray-900">N/A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            New Margin Rate:
          </span>
          <span className="font-semibold text-gray-900">N/A</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">
            New Net Rate:
          </span>
          <span className="font-semibold text-gray-900">0.0000</span>
        </div>
      </div>
    </div>
  );
};

export default ExposureLinkageStatus;
