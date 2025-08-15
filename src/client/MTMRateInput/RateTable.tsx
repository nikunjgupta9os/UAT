import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import type { RateTableProps, RateRow } from "./Data.d";
import RateInputCell from "./RateInputCell";

interface ExtendedRateTableProps extends RateTableProps {
  onSaveAllRates?: () => void;
  onClearForm?: () => void;
  onImportRates?: () => void;
  onViewHistory?: () => void;
}

// Utility functions specific to RateTable
const calculateMidRate = (
  bidRate: number | "",
  offerRate: number | ""
): number | "" => {
  if (bidRate === "" || offerRate === "") {
    return "";
  }

  const bid = typeof bidRate === "string" ? parseFloat(bidRate) : bidRate;
  const offer =
    typeof offerRate === "string" ? parseFloat(offerRate) : offerRate;

  if (isNaN(bid) || isNaN(offer)) {
    return "";
  }

  return (bid + offer) / 2;
};

const isValidRate = (rate: number | ""): boolean => {
  return rate !== "" && typeof rate === "number" && rate > 0 && !isNaN(rate);
};

const canAddRow = (
  currencyPair: string,
  tenor: string,
  bidRate: number | "",
  offerRate: number | ""
): boolean => {
  return (
    currencyPair !== "" &&
    tenor !== "" &&
    isValidRate(bidRate) &&
    isValidRate(offerRate)
  );
};

const RateTable: React.FC<ExtendedRateTableProps> = ({
  data,
  currencyPairs,
  tenors,
  onDataChange,
  onSaveRow,
  onDeleteRow,
  onAddRow,
  onSaveAllRates,
  onClearForm,
  onImportRates,
  onViewHistory,
}) => {
  const columnHelper = createColumnHelper<RateRow>();

  const updateRowData = (rowId: string, field: keyof RateRow, value: any) => {
    const updatedData = data.map((row) => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: value };

        // Auto-calculate mid rate when bid or offer rate changes
        if (field === "bidRate" || field === "offerRate") {
          const bidRate = field === "bidRate" ? value : row.bidRate;
          const offerRate = field === "offerRate" ? value : row.offerRate;
          updatedRow.midRate = calculateMidRate(bidRate, offerRate);
        }

        return updatedRow;
      }
      return row;
    });
    onDataChange(updatedData);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("currencyPair", {
        header: "CURRENCY PAIR",
        cell: ({ row }) => {
          const rowData = row.original;
          if (rowData.isNew) {
            return (
              <select
                value={rowData.currencyPair}
                onChange={(e) =>
                  updateRowData(rowData.id, "currencyPair", e.target.value)
                }
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select Pair</option>
                {currencyPairs.map((pair) => (
                  <option key={pair.id} value={pair.pair}>
                    {pair.pair}
                  </option>
                ))}
              </select>
            );
          }
          return <span className="font-medium">{rowData.currencyPair}</span>;
        },
      }),

      columnHelper.accessor("tenor", {
        header: "TENOR",
        cell: ({ row }) => {
          const rowData = row.original;
          if (rowData.isNew) {
            return (
              <select
                value={rowData.tenor}
                onChange={(e) =>
                  updateRowData(rowData.id, "tenor", e.target.value)
                }
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="">Select Tenor</option>
                {tenors.map((tenor) => (
                  <option key={tenor.id} value={tenor.name}>
                    {tenor.name}
                  </option>
                ))}
              </select>
            );
          }
          return <span>{rowData.tenor}</span>;
        },
      }),

      columnHelper.accessor("bidRate", {
        header: "BID RATE",
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <RateInputCell
              value={rowData.bidRate}
              onChange={(value) => updateRowData(rowData.id, "bidRate", value)}
              placeholder="Bid Rate"
              disabled={!rowData.isEditing && !rowData.isNew}
            />
          );
        },
      }),

      columnHelper.accessor("offerRate", {
        header: "OFFER RATE",
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <RateInputCell
              value={rowData.offerRate}
              onChange={(value) =>
                updateRowData(rowData.id, "offerRate", value)
              }
              placeholder="Offer Rate"
              disabled={!rowData.isEditing && !rowData.isNew}
            />
          );
        },
      }),

      columnHelper.accessor("midRate", {
        header: "MID RATE",
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <RateInputCell
              value={rowData.midRate}
              onChange={() => {}} // Read-only, auto-calculated
              placeholder="Mid Rate"
              disabled={true}
            />
          );
        },
      }),

      columnHelper.display({
        id: "actions",
        header: "ACTIONS",
        cell: ({ row }) => {
          const rowData = row.original;

          if (rowData.isNew) {
            return (
              <button
                onClick={onAddRow}
                disabled={
                  !canAddRow(
                    rowData.currencyPair,
                    rowData.tenor,
                    rowData.bidRate,
                    rowData.offerRate
                  )
                }
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                Add
              </button>
            );
          }

          return (
            <div className="flex gap-2">
              <button
                onClick={() => onSaveRow(rowData)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Save
              </button>
              <button
                onClick={() => onDeleteRow(rowData.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete
              </button>
            </div>
          );
        },
      }),
    ],
    [currencyPairs, tenors, data]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="">
      <h3 className="text-xl relative top-2 font-semibold text-primary mb-4">
        MTM Rate Entry Grid
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-primary-md">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-semibold text-header-color border border-border"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-primary-xl transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 border border-border align-top"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}

            {/* Show empty state if no data */}
            {table.getRowModel().rows.length === 1 && data[0]?.isNew && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-primary border border-border"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 text-primary"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Please select a bank from the dropdown above to view and
                      manage MTM rates for that specific bank.
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RateTable;
