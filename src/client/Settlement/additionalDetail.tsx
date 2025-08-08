import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import NumberInput from "./NumberInput"; // Adjust import path as needed

interface HedgingDetail {
  link?: string;
  forwardRef: string;
  outstandingAmount: number;
  spot: number;
  fwd: number;
  margin: number;
  netRate: number;
  settlementAmount: number;
  bankName: string;
  maturity: string;
  edRate: number;
  edBenefit: number;
}


interface HedgingDetailsProps {
  exposure_header_ids: any;
  currency: any;
  entity: any;
  total_open_amount: any;
  setTotalSettlementAmount?: (value: number) => void; // <-- add this prop
}

const AdditionalForwardDetail: React.FC<HedgingDetailsProps> = ({
  exposure_header_ids,
  currency,
  entity,
  total_open_amount,
  setTotalSettlementAmount, // <-- receive as prop
}) => {
  const [hedgingData, setHedgingData] = useState<HedgingDetail[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});

  console.log(exposure_header_ids,"   ",
            currency,"  ",
            entity,)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ensure exposure_header_ids is an array
        const payload = {
          currency,
          entity,
        };
        console.log("Payload being sent:", payload);

        const res = await axios.post(
          "https://backend-slqi.onrender.com/api/settlement/forwards-by-entity-currency",
          payload
        );
        if (res.data && res.data.success) {
          console.log("API Data fetch successful:", res.data.data);
          const data = (res.data.data || []).map((item: any) => {
            const spot = Number(item["Spot"] ?? 0);
            const fwd = Number(item["Fwd"] ?? 0);
            const margin = Number(item["Margin"] ?? 0);
            const outstandingAmount = Number(item["Outstanding Amount"] ?? 0);
            const settlementAmount = outstandingAmount; // Initialize with outstanding amount
            const edRate = 0;
            return {
              forwardRef: item["Forward Ref"] ?? "",
              outstandingAmount,
              spot,
              fwd,
              margin,
              netRate: Number((fwd + spot - margin).toFixed(4)),
              settlementAmount,
              bankName: item["Bank Name"] ?? "",
              maturity: item["Maturity"] ?? "",
              edRate,
              edBenefit: Number(((settlementAmount * edRate) / 100).toFixed(2)),
            };
          });
          setHedgingData(data);
        } else {
          setHedgingData([]);
        }
      } catch (error) {
        setHedgingData([]);
      }
    };

    if (
      exposure_header_ids &&
      Array.isArray(exposure_header_ids) &&
      exposure_header_ids.length > 0 &&
      currency &&
      entity
    ) {
      fetchData();
    }
  }, [exposure_header_ids, currency, entity]);

  // Update function
  const updateHedgingDetail = (
    forwardRef: string,
    field: keyof HedgingDetail,
    value: number
  ) => {
    setHedgingData((prev) =>
      prev.map((item) => {
        if (item.forwardRef !== forwardRef) return item;
        const updated = { ...item, [field]: value };
        // Always recalculate netRate and edBenefit
        updated.netRate = Number((updated.fwd + updated.spot - updated.margin).toFixed(4));
        updated.edBenefit = Number(((updated.settlementAmount * updated.edRate) / 100).toFixed(2));
        return updated;
      })
    );
  };

  // Columns
  const hedgingDetailColumns = useMemo<ColumnDef<HedgingDetail>[]>(
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
        header: "Forward Ref",
        accessorKey: "forwardRef",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-700">{getValue<string>()}</span>
        ),
      },
      {
        header: "Outstanding Amount",
        accessorKey: "outstandingAmount",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-700">
            {getValue<number>().toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        header: "Spot",
        accessorKey: "spot",
        cell: ({ row }) => {
          const rowId = row.original.forwardRef;
          const value = row.original.spot;
          return (
            <NumberInput
              value={value}
              onChange={() => {}}
              onBlur={val => updateHedgingDetail(rowId, "spot", val)}
              step={0.0001}
              precision={4}
              min={0}
            />
          );
        },
      },
      {
        header: "Fwd",
        accessorKey: "fwd",
        cell: ({ row }) => {
          const rowId = row.original.forwardRef;
          const value = row.original.fwd;
          return (
            <NumberInput
              value={value}
              onChange={() => {}}
              onBlur={val => updateHedgingDetail(rowId, "fwd", val)}
              step={0.0001}
              precision={4}
              min={0}
            />
          );
        },
      },
      {
        header: "Margin",
        accessorKey: "margin",
        cell: ({ row }) => {
          const rowId = row.original.forwardRef;
          const value = row.original.margin;
          return (
            <NumberInput
              value={value}
              onChange={() => {}}
              onBlur={val => updateHedgingDetail(rowId, "margin", val)}
              step={0.0001}
              precision={4}
              min={0}
            />
          );
        },
      },
      {
        header: "Net Rate",
        accessorKey: "netRate",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-700">
            {getValue<number>().toFixed(4)}
          </span>
        ),
      },
      {
        header: "Settlement Amount",
        accessorKey: "settlementAmount",
        cell: ({ row }) => {
          const rowId = row.original.forwardRef;
          const value = row.original.settlementAmount;
          return (
            <NumberInput
              value={value}
              onChange={() => {}}
              onBlur={val => updateHedgingDetail(rowId, "settlementAmount", val)}
              step={1}
              precision={2}
              min={0}
            />
          );
        }
      },
      {
        header: "Bank Name",
        accessorKey: "bankName",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-700">{getValue<string>()}</span>
        ),
      },
      {
        header: "Maturity",
        accessorKey: "maturity",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-700">
            {new Date(getValue<string>()).toLocaleDateString()}
          </span>
        ),
      },
      {
        header: "ED Rate",
        accessorKey: "edRate",
        cell: ({ row }) => {
          const rowId = row.original.forwardRef;
          const value = row.original.edRate;
          return (
            <NumberInput
              value={value}
              onChange={() => {}}
              onBlur={val => updateHedgingDetail(rowId, "edRate", val)}
              step={0.01}
              precision={2}
              min={0}
            />
          );
        },
      },
      {
        header: "ED Benefit",
        accessorKey: "edBenefit",
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-700">
            {getValue<number>().toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        ),
      },
    ],
    [updateHedgingDetail]
  );

  // Table instance
  const table = useReactTable({
    data: hedgingData,
    columns: hedgingDetailColumns,
    enableRowSelection: true,
    onRowSelectionChange: setSelectedRowIds,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection: selectedRowIds,
    },
  });

  // Calculate total of selected settlement amounts
  const selectedRows = table.getSelectedRowModel().rows;

  const totalSettlementAmount = selectedRows.reduce(
    (sum, row) => sum + (row.original.settlementAmount || 0),
    0
  );
  const totalOutstandingAmount = selectedRows.reduce(
    (sum, row) => sum + (row.original.outstandingAmount || 0),
    0
  );

  // Update parent with totalSettlementAmount when it changes
  useEffect(() => {
    if (setTotalSettlementAmount) {
      setTotalSettlementAmount(totalSettlementAmount);
    }
  }, [totalSettlementAmount, setTotalSettlementAmount]);

  return (
    <div className="w-full space-y-4 pt-6">
      <h2 className="text-2xl font-bold text-secondary-text pl-4">
        Additional Forward Details
      </h2>
      <div className="flex justify-end mb-2">
        <span className="font-bold text-lg">
          Total Selected Settlement Amount:&nbsp;
          <span className="text-primary">
            {totalSettlementAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </span>
      </div>
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
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={hedgingDetailColumns.length}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold sticky bottom-0 z-10">
            <tr>
              {table.getVisibleLeafColumns().map((col) => (
                <td
                  key={col.id}
                  className="px-6 py-2 text-sm text-start border-t border-border"
                >
                  {{
                    select: "Total",
                    outstandingAmount: totalOutstandingAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                    settlementAmount: totalSettlementAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                    // Add more columns as needed
                  }[col.id] ?? null}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AdditionalForwardDetail;
