import React, { useEffect, useState, useMemo } from "react";
import CustomSelect from "../../common/SearchSelect";
import Pagination from "../../ui/Pagination";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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

interface ApiResponse {
  system_transaction_id: string;
  internal_reference_id: string;
  currency_pair: string;
  booking_amount: string;
  spot_rate: string;
  maturity_date: string;
  order_type: string;
  entity_level_0: string;
  counterparty: string;
}
interface ForwardContractSelectionProps {
  setSelectedUsers: (users: ExposureRequest[]) => void; // Keep as is for full objects
  // OR
  // setSelectedUsers: (userIds: string[]) => void; // Change to this for just IDs
}

const ForwardContractSelection: React.FC<ForwardContractSelectionProps> = ({
  setSelectedUsers,
}) => {
  const [counterparty, setCounterparty] = useState("");
  const [entity, setEntity] = useState("");
  // const [action, setAction] = useState("");
  const [actionDate, setActionDate] = useState("");
  const [data, setData] = useState<ExposureRequest[]>([]);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currencyPair, setCurrencyPair] = useState("");
  const [orderType, setOrderType] = useState("");

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://backend-slqi.onrender.com/api/settlement/bookingList"
        );
        const result = await response.json();

        if (result.success) {
          // Map API data to component interface
          const mappedData: ExposureRequest[] = result.data.map(
            (item: ApiResponse) => ({
              exposure_header_id: item.system_transaction_id,
              deal_id: item.internal_reference_id,
              fx_pair: item.currency_pair,
              original_amount: item.booking_amount,
              amount_to_cancel_rollover: "0",
              original_rate: item.spot_rate,
              maturity: item.maturity_date,
              counterparty: item.counterparty,
              order_type: item.order_type,
              company: item.entity_level_0,
              entity: item.entity_level_0, // Using same as company since entity mapping isn't clear
            })
          );

          setData(mappedData);
        } else {
          setError("Failed to fetch data");
        }
      } catch (err) {
        setError("Error fetching data: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique counterparties and entities for dropdown options
  const counterpartyOptions = useMemo(() => {
    const uniqueCounterparties = [
      ...new Set(data.map((item) => item.counterparty)),
    ];
    return uniqueCounterparties.map((counterparty) => ({
      label: counterparty,
      value: counterparty,
    }));
  }, [data]);

  const entityOptions = useMemo(() => {
    const uniqueEntities = [...new Set(data.map((item) => item.entity))];
    return uniqueEntities.map((entity) => ({ label: entity, value: entity }));
  }, [data]);

  const currencyPairOptions = useMemo(() => {
    const uniquePairs = [...new Set(data.map((item) => item.fx_pair))];
    return uniquePairs.map((pair) => ({ label: pair, value: pair }));
  }, [data]);

  const orderTypeOptions = useMemo(() => {
    const uniqueTypes = [...new Set(data.map((item) => item.order_type))];
    return uniqueTypes.map((type) => ({ label: type, value: type }));
  }, [data]);

  // Filter data based on selects
  const filteredData = useMemo(() => {
    return data.filter(
      (row) =>
        (!counterparty || row.counterparty === counterparty) &&
        (!entity || row.entity === entity) &&
        (!currencyPair || row.fx_pair === currencyPair) &&
        (!orderType || row.order_type === orderType)
    );
  }, [data, counterparty, entity, currencyPair, orderType]);

  // Update parent with selected users array whenever selectedRows changes
  useEffect(() => {
    const selected = filteredData.filter(
      (row) => selectedRows[row.exposure_header_id]
    );

    // If you want just the system_transaction_ids (exposure_header_id):
    // const selectedIds = selected.map(row => row.exposure_header_id);
    // setSelectedUsers(selectedIds);

    // If you want the complete objects (current implementation):
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

              // Set default amount when row is selected
              if (e.target.checked) {
                handleAmountChange(
                  row.original.exposure_header_id,
                  row.original.original_amount
                );
              } else {
                // Reset to 0 when unchecked
                handleAmountChange(row.original.exposure_header_id, "0");
              }
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
          <span className="font-medium text-secondary-text-dark">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "fx_pair",
        header: "FX Pair",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "original_amount",
        header: "Original Amount",
        cell: ({ getValue }) => (
          <span className="font-medium text-secondary-text-dark">
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
              className="border border-border bg-secondary-color-dark text-secondary-text-dark rounded px-2 py-1 w-32"
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
            <span className="text-primary">—</span>
          ),
      },
      {
        accessorKey: "original_rate",
        header: "Original Rate",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "maturity",
        header: "Maturity",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-secondary-text">
              {isNaN(date.getTime()) ? "—" : date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        accessorKey: "counterparty",
        header: "Counterparty",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "order_type",
        header: "Order Type",
        cell: ({ getValue }) => (
          <span className="text-secondary-text">{getValue() as string}</span>
        ),
      },
    ],
    [selectedRows]
  );

  const table = useReactTable({
    data: filteredData,
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

  // Calculate pagination values - Fixed calculation
  const totalItems = filteredData.length;
  const pageSize = table.getState().pagination.pageSize;
  const pageIndex = table.getState().pagination.pageIndex;
  const currentPageItems = table.getRowModel().rows.length;
  const startIndex = totalItems === 0 ? 0 : pageIndex * pageSize + 1;
  const endIndex = Math.min((pageIndex + 1) * pageSize, totalItems);

  return (
    <React.Fragment>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <CustomSelect
            label="Counterparty"
            options={counterpartyOptions}
            selectedValue={counterparty}
            onChange={setCounterparty}
            placeholder="Select counterparty"
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
          <CustomSelect
            label="Currency Pair"
            options={currencyPairOptions}
            selectedValue={currencyPair}
            onChange={setCurrencyPair}
            placeholder="Select currency pair"
            isClearable={true}
          />
          <CustomSelect
            label="Order Type"
            options={orderTypeOptions}
            selectedValue={orderType}
            onChange={setOrderType}
            placeholder="Select order type"
            isClearable={true}
          />
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

        <h3 className="relative top-3 text-2xl font-semibold text-primary pt-4">
          Select Forward Contracts (for Cancellation/Rollover)
        </h3>

        <div className="shadow-lg border border-border">
          {currencyPair && orderType ? (
            <>
              <table className="min-w-[800px] w-full table-auto">
                <thead className="bg-secondary-color rounded-xl">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
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
                        className="px-6 py-12 text-center text-primary"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg
                              className="w-6 h-6 text-primary"
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
                          <p className="text-xl font-medium text-primary mb-1">
                            No Data available
                          </p>
                          <p className="text-md font-medium text-primary">
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
              <div className="pt-2">
                <Pagination
                  table={table}
                  totalItems={totalItems}
                  currentPageItems={currentPageItems}
                  startIndex={startIndex}
                  endIndex={endIndex}
                />
              </div>
            </>
          ) : (
            <div className="text-center text-primary py-12">
              <p className="text-lg">
                Please select both Currency Pair and Order Type.
              </p>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ForwardContractSelection;
