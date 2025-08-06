import React, { useEffect, useState, useMemo } from "react";
import CustomSelect from "../../common/SearchSelect";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";

interface ExposureRequest {
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
}

const mockData: ExposureRequest[] = [
  {
    exposure_header_id: "1",
    deal_id: "DL-001",
    fx_pair: "USD/INR",
    original_amount: "100000",
    amount_to_cancel_rollover: "0",
    original_rate: "83.25",
    maturity: "2025-08-31",
    counterparty: "Bank A",
    order_type: "Spot",
    company: "Company A",
    entity: "Entity 1",
  },
  // Add more mock rows as needed
];

const companyOptions = [
  { label: "Company A", value: "Company A" },
  { label: "Company B", value: "Company B" },
];
const entityOptions = [
  { label: "Entity 1", value: "Entity 1" },
  { label: "Entity 2", value: "Entity 2" },
];
const actionOptions = [
  { label: "Cancel", value: "Cancel" },
  { label: "Rollover", value: "Rollover" },
];
const orderTypeOptions = [
  { label: "Spot", value: "Spot" },
  { label: "Forward", value: "Forward" },
];

interface ForwardContractSelectionProps {
  setSelectedUsers: (rows: ExposureRequest[]) => void;
}

const ForwardContractSelection: React.FC<ForwardContractSelectionProps> = ({
  setSelectedUsers,
}) => {
  const [company, setCompany] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [actionDate, setActionDate] = useState(""); 
  const [data, setData] = useState<ExposureRequest[]>(mockData);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  // Filter data based on selects (optional)
  const filteredData = useMemo(() => {
    return data.filter(
      (row) =>
        (!company || row.company === company) &&
        (!entity || row.entity === entity)
      // You can add action filter here if needed
    );
  }, [data, company, entity]);

  // Update parent with selected users array whenever selectedRows changes
  useEffect(() => {
    const selected = filteredData.filter(
      (row) => selectedRows[row.exposure_header_id]
    );
    setSelectedUsers(selected);
  }, [selectedRows, filteredData, setSelectedUsers]);

  const handleAmountChange = (id: string, value: string) => {
    setData((prev) =>
      prev.map((row) =>
        row.exposure_header_id === id
          ? { ...row, amount_to_cancel_rollover: value }
          : row
      )
    );
  };

  const handleOrderTypeChange = (id: string, value: string) => {
    setData((prev) =>
      prev.map((row) =>
        row.exposure_header_id === id ? { ...row, order_type: value } : row
      )
    );
  };

  const columns = useMemo<ColumnDef<ExposureRequest>[]>(
    () => [
      {
        id: "select",
        header: "",
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={!!selectedRows[row.original.exposure_header_id]}
            onChange={(e) => {
              setSelectedRows((prev) => ({
                ...prev,
                [row.original.exposure_header_id]: e.target.checked,
              }));
            }}
            className="w-4 h-4 accent-primary"
          />
        ),
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: "deal_id",
        header: "Deal ID",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "fx_pair",
        header: "FX Pair",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "original_amount",
        header: "Original Amount",
        cell: ({ getValue }) => (
          <span className="font-medium text-gray-900">
            {Number(getValue()).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        ),
      },
      {
        id: "amount_to_cancel_rollover",
        header: "Amount to Cancel/Rollover",
        cell: ({ row }) =>
          selectedRows[row.original.exposure_header_id] ? (
            <input
              type="number"
              className="border rounded px-2 py-1 w-32"
              value={row.original.amount_to_cancel_rollover}
              min={0}
              max={row.original.original_amount}
              onChange={(e) =>
                handleAmountChange(
                  row.original.exposure_header_id,
                  e.target.value
                )
              }
            />
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        accessorKey: "original_rate",
        header: "Original Rate",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "maturity",
        header: "Maturity",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-gray-700">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "counterparty",
        header: "Counterparty",
        cell: ({ getValue }) => (
          <span className="text-gray-700">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "order_type",
        header: "Order Type Select",
        cell: ({ row }) => (
          <select
            className="border rounded px-2 py-1"
            value={row.original.order_type}
            onChange={(e) =>
              handleOrderTypeChange(
                row.original.exposure_header_id,
                e.target.value
              )
            }
          >
            {orderTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ),
      },
    ],
    [selectedRows]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <React.Fragment>
      <div className="space-y-6">
       
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <CustomSelect
            label="Company"
            options={companyOptions}
            selectedValue={company}
            onChange={setCompany}
            placeholder="Select company"
            isClearable={true}
          />
          <CustomSelect
            label="Entity"
            options={entityOptions}
            selectedValue={entity}
            onChange={setEntity}
            placeholder="Select entity"
            isClearable={true}
          />
          {/* Replace Action dropdown with Action Date input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Date
            </label>
            <input
              type="date"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Select action date"
            />
          </div>
        </div>

        <h3 className="mb-2 text-lg font-semibold text-primary">
          Select Forward Contracts (for Cancellation/Rollover)
        </h3>

        <div className="shadow-lg border border-border rounded-lg">
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
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No Data Available
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
      </div>
    </React.Fragment>
  );
};

export default ForwardContractSelection;
