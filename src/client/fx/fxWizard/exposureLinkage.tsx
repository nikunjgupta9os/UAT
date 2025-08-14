import React, { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import axios from "axios";

type ExposureLinkage = {
  exposureId: string;
  type: string;
  currency: string;
  originalMaturity: string;
  amount: string;
  status: string;
};

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

const ExposureLinkageStatus: React.FC<{ selectedUsers: SelectedForwardContract[] }> = ({
  selectedUsers,
}) => {
  // Create an array of all exposure_header_id values
  const exposureHeaderIds = selectedUsers.map(user => user.exposure_header_id);

  const [data, setData] = useState<ExposureLinkage[]>([]);

  useEffect(() => {
    if (exposureHeaderIds.length === 0) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/settlement/exposuresByBookingIds",
          { system_transaction_ids: exposureHeaderIds },
          { headers: { "Content-Type": "application/json" } }
        );
        const result = response.data;
        if (result.success && Array.isArray(result.data)) {
          const mappedData: ExposureLinkage[] = result.data.map((item: any) => ({
            exposureId: item.document_id,
            type: item.exposure_type,
            currency: item.currency,
            originalMaturity: item.document_date ? new Date(item.document_date).toISOString().split("T")[0] : "",
            amount: item.total_open_amount,
            status: "Linked",
          }));
          setData(mappedData);
        } else {
          setData([]);
        }
      } catch (error) {
        setData([]);
      }
    };

    fetchData();
  }, [selectedUsers]);

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
        accessorKey: "amount",
        header: "Amount",
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
    data: data,
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
