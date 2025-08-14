import React, { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import Pagination from "../../ui/Pagination";

type OldForward = {
  dealId: string;
  originalRate: string;
  currentSpotRate: string;
  currentFwdRate: string;
  amountProcessed: string;
  gainLossSpot: string;
  edImpact: string;
};

interface ProcessingProps {
  selectedUsers?: SelectedForwardContract[];
  form?: {
    currentSpotRate: string;
    currentForwardRate: string;
    bankCharges: string;
    discountRate: string;
    reason: string;
  };
  setOldForwardsData?: React.Dispatch<React.SetStateAction<OldForward[]>>; // <-- Add this line
}

// Add the type definition at the top of the file
type SelectedForwardContract = {
  exposure_header_id: string;
  deal_id: string;
  fx_pair: string;
  original_amount: string;
  amount_to_cancel_rollover: string;
  original_rate: string;
  maturity: string;
  counterparty: string;
  order_type: string;
  company: string;
  entity: string;
};

const Processing: React.FC<ProcessingProps> = ({ selectedUsers, form, setOldForwardsData }) => {
  // Helper to parse numbers safely
  const parseNum = (val: string) => Number(val?.replace(/,/g, "")) || 0;

  // Calculate oldForwardsData
  const oldForwardsData: OldForward[] = useMemo(() => {
    return selectedUsers.map((user) => {
      const originalRate = parseNum(user.original_rate);
      const currentFwdRate = parseNum(form.currentForwardRate);
      const amountProcessed = parseNum(user.amount_to_cancel_rollover);
      const discountRate = parseNum(form.discountRate) / 100;
      const bankCharges = parseNum(form.bankCharges);
      const maturityDate = new Date(user.maturity);
      const today = new Date();
      const daysToMaturity = Math.max(
        0,
        Math.round(
          (maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      let rateDiff = 0;
      if (user.order_type?.toLowerCase() === "buy") {
        rateDiff = originalRate - currentFwdRate;
      } else if (user.order_type?.toLowerCase() === "sell") {
        rateDiff = currentFwdRate - originalRate;
      }
      const pvFactor = 1 / (1 + discountRate * (daysToMaturity / 365));
      const edGainLossNPV = rateDiff * amountProcessed * pvFactor;
      const edImpact = edGainLossNPV - bankCharges;

      return {
        dealId: user.deal_id || "",
        originalRate: user.original_rate || "",
        currentSpotRate: form.currentSpotRate || "",
        currentFwdRate: form.currentForwardRate || "",
        amountProcessed: user.amount_to_cancel_rollover || "",
        gainLossSpot: edGainLossNPV.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        }),
        edImpact: edImpact.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        }),
      };
    });
  }, [selectedUsers, form]);

  // FIX: Move setOldForwardsData to useEffect
  React.useEffect(() => {
    if (setOldForwardsData) setOldForwardsData(oldForwardsData);
  }, [oldForwardsData, setOldForwardsData]);

  const columns = useMemo<ColumnDef<OldForward>[]>(
    () => [
      {
        accessorKey: "dealId",
        header: "Deal ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">
            {getValue() as string}
          </span>
        ),
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
        pageIndex: 0,
      },
    },
  });

  const totalItems = oldForwardsData.length;
  const pageSize = table.getState().pagination.pageSize;
  const pageIndex = table.getState().pagination.pageIndex;
  const currentPageItems = table.getRowModel().rows.length;
  const startIndex = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  const endIndex = Math.min((pageIndex + 1) * pageSize, totalItems);

  const totalGainLossSpot = useMemo(
    () =>
      oldForwardsData.reduce(
        (sum, row) => sum + Number(row.gainLossSpot.replace(/,/g, "")),
        0
      ),
    [oldForwardsData]
  );

  const totalEDImpact = useMemo(
    () =>
      oldForwardsData.reduce(
        (sum, row) => sum + Number(row.edImpact.replace(/,/g, "")),
        0
      ),
    [oldForwardsData]
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-semibold text-primary">
          Impact of Old Forwards
        </h3>
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
          <Pagination
            table={table}
            totalItems={totalItems}
            currentPageItems={currentPageItems}
            startIndex={startIndex}
            endIndex={endIndex}
          />
        </div>
        <div className="flex justify-end gap-8 mt-4">
          <span className="font-bold text-lg">
            Total Net Gain/Loss (Spot):&nbsp;
            <span className="text-primary">
              {totalGainLossSpot.toLocaleString()}
            </span>
          </span>
          <span className="font-bold text-lg">
            Total ED Impact (Net of Charges):&nbsp;
            <span className="text-primary">
              {totalEDImpact.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Processing;
