import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import NumberInput from "./NumberInput"; // Adjust the import path as needed

interface CashSettlement {
  forwardRef: string;
  settlementAmount: number;
  bankName: string;
  spotRate: number;
  fwdPremium: number;
  margin: number;
}

interface CashSettlementTableProps {
  bankName?: string;
  exposure_header_ids?: any;
  currency?: string;
  entity?: string;
  totalSettlementAmount?: number;
  totalAdditionalSettlementAmount?: number;
  total_open_amount?: number;
}

const cleanNumber = (val) =>
    Number((val || "0").toString().replace(/,/g, ""));


const CashSettlementTable: React.FC<CashSettlementTableProps> = ({
  bankName,
  exposure_header_ids,
  currency,
  entity,
  totalSettlementAmount,
  totalAdditionalSettlementAmount,
  total_open_amount,
}) => {
  const [rows, setRows] = useState<CashSettlement[]>([]);

  // Generate next forwardRef like FWD-FX-001, FWD-FX-002, etc.
  const getNextForwardRef = () => {
    const num = rows.length + 1;
    return `FWD-FX-${num.toString().padStart(3, "0")}`;
  };

  const handleAddRow = () => {
    const availableAmount =
      cleanNumber(total_open_amount) -
      cleanNumber(totalSettlementAmount) -
      cleanNumber(totalAdditionalSettlementAmount);

    setRows([
      ...rows,
      {
        forwardRef: getNextForwardRef(),
        settlementAmount: availableAmount > 0 ? availableAmount : 0,
        bankName: bankName || "",
        spotRate: 0,
        fwdPremium: 0,
        margin: 0,
      },
    ]);
  };

  const handleInputChange = (
    idx: number,
    field: keyof Omit<CashSettlement, "forwardRef" | "bankName">,
    value: number
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const columns = useMemo<ColumnDef<CashSettlement>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="w-4 h-4 accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="w-4 h-4 accent-primary"
          />
        ),
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        header: "Forward Ref",
        accessorKey: "forwardRef",
        cell: ({ row }) => (
          <span className="font-bold">{row.original.forwardRef}</span>
        ),
      },
      {
        header: "Settlement Amount",
        accessorKey: "settlementAmount",
        cell: ({ row }) => {
          // Calculate availableAmount using the same logic as your summary
          const availableAmount =
            cleanNumber(total_open_amount) -
            cleanNumber(totalSettlementAmount) -
            cleanNumber(totalAdditionalSettlementAmount);

          return (
            <NumberInput
              value={row.original.settlementAmount}
              onChange={() => {}}
              onBlur={(val) => {
                // Clamp value to availableAmount
                const safeVal = Math.max(0, Math.min(val, availableAmount));
                handleInputChange(row.index, "settlementAmount", safeVal);
              }}
              step={1}
              precision={2}
              min={0}
              max={availableAmount}
            />
          );
        },
      },
      {
        header: "Bank Name",
        accessorKey: "bankName",
        cell: ({ row }) => (
          <span className="font-bold">{row.original.bankName}</span>
        ),
      },
      {
        header: "Spot Rate",
        accessorKey: "spotRate",
        cell: ({ row }) => (
          <NumberInput
            value={row.original.spotRate}
            onChange={() => {}}
            onBlur={(val) => handleInputChange(row.index, "spotRate", val)}
            step={0.0001}
            precision={4}
            min={0}
          />
        ),
      },
      {
        header: "Fwd Premium",
        accessorKey: "fwdPremium",
        cell: ({ row }) => (
          <NumberInput
            value={row.original.fwdPremium}
            onChange={() => {}}
            onBlur={(val) => handleInputChange(row.index, "fwdPremium", val)}
            step={0.0001}
            precision={4}
            min={0}
          />
        ),
      },
      {
        header: "Margin",
        accessorKey: "margin",
        cell: ({ row }) => (
          <NumberInput
            value={row.original.margin}
            onChange={() => {}}
            onBlur={(val) => handleInputChange(row.index, "margin", val)}
            step={0.0001}
            precision={4}
            min={0}
          />
        ),
      },
    ],
    [rows]
  );

 
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  console.log(total_open_amount);
  console.log(totalSettlementAmount);
  console.log(totalAdditionalSettlementAmount);

  return (
    <div className="w-full space-y-4 pt-6">
      <h2 className="text-2xl font-bold text-secondary-text pl-4">
        Cash Settlement
      </h2>

      <div className="shadow-lg border border-border">
        <table className="min-w-[800px] w-full table-auto">
          <thead className="bg-secondary-color rounded-xl">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
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
          <tbody className="divide-y">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  <p className="font-semibold text-base">No row found</p>
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
        </table>
      </div>

      <div className="flex justify-start mb-2">
        <button
          onClick={handleAddRow}
          className="px-6 py-2 bg-primary text-white rounded font-semibold"
        >
          Add Row
        </button>
      </div>
    </div>
  );
};

export default CashSettlementTable;
