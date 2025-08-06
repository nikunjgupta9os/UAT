import React, { useMemo } from "react";
import Button from "../../ui/Button";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

type Voucher = {
  voucherType: string;
  date: string;
  account: string;
  debit: string;
  credit: string;
  narration: string;
  reference: string;
};

const voucherData: Voucher[] = [
  {
    voucherType: "Journal",
    date: "2025-08-03",
    account: "Bank Account",
    debit: "1,000,000",
    credit: "",
    narration: "Settlement of forward contract",
    reference: "REF-001",
  },
  {
    voucherType: "Journal",
    date: "2025-08-03",
    account: "FX Gain/Loss",
    debit: "",
    credit: "1,000,000",
    narration: "FX gain on settlement",
    reference: "REF-002",
  },
  // Add more rows as needed
];

const AccountingVoucher: React.FC = () => {
  const columns = useMemo<ColumnDef<Voucher>[]>(
    () => [
      {
        accessorKey: "voucherType",
        header: "Voucher Type",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "account",
        header: "Account",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "debit",
        header: "Debit",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "credit",
        header: "Credit",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "narration",
        header: "Narration",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "reference",
        header: "Reference",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data: voucherData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = columns
      .map((col) =>
        typeof col.header === "string" ? col.header.replace(/,/g, "") : ""
      )
      .join(",");
    const rows = voucherData.map((row) =>
      [
        row.voucherType,
        row.date,
        row.account,
        row.debit,
        row.credit,
        row.narration,
        row.reference,
      ]
        .map((val) => `"${val}"`)
        .join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "accounting_voucher.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-secondary-text">
          Accounting Voucher (IND AS)
        </h3>

        <div className="flex justify-end">
          <Button onClick={handleExportCSV}>Export to CSV</Button>
        </div>
      </div>
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
    </div>
  );
};

export default AccountingVoucher;
