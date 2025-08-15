import React, { useState, useMemo, useEffect } from "react";
import Layout from "../common/Layout";
import CustomSelect from "../common/SearchSelect";
import Button from "../ui/Button";
import { exportToExcel } from "../ui/exportToExcel";
import Pagination from "../ui/Pagination";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

interface RateData {
  bank: string;
  currencyPairs: {
    currencyPair: string;
    rates: {
      tenor: string;
      bidRate: number;
      offerRate: number;
    }[];
  }[];
}

interface ForwardTableColumns {
  mtm_id: string;
  booking_id: string; // intentionally hidden
  deal_date: string;
  maturity_date: string;
  currency_pair: string;
  buy_sell: string;
  notional_amount: string;
  contract_rate: string;
  mtm_rate: string;
  mtm_value: string;
  days_to_maturity: number;
  status: string;
  calculated_at: string;
  internal_reference_id: string;
  entity: string;
}

const mockRateData: RateData[] = [
  {
    bank: "Axis Bank",
    currencyPairs: [
      {
        currencyPair: "USD/INR",
        rates: [
          { tenor: "Spot", bidRate: 83.4, offerRate: 83.5 },
          { tenor: "1M", bidRate: 83.45, offerRate: 83.55 },
          { tenor: "3M", bidRate: 83.5, offerRate: 83.6 },
          { tenor: "6M", bidRate: 83.6, offerRate: 83.7 },
          { tenor: "1Y", bidRate: 83.7, offerRate: 83.8 },
        ],
      },
      {
        currencyPair: "EUR/USD",
        rates: [
          { tenor: "Spot", bidRate: 1.085, offerRate: 1.087 },
          { tenor: "1M", bidRate: 1.086, offerRate: 1.088 },
        ],
      },
    ],
  },
  {
    bank: "HDFC Bank",
    currencyPairs: [
      {
        currencyPair: "USD/INR",
        rates: [
          { tenor: "Spot", bidRate: 83.3, offerRate: 83.4 },
          { tenor: "1M", bidRate: 83.35, offerRate: 83.45 },
        ],
      },
    ],
  },
];

const getBankOptions = (rateData: typeof mockRateData) => {
  const uniqueBanks = Array.from(new Set(rateData.map((item) => item.bank)));

  const dropdownOptions = [
    { value: "all", label: "All" },
    ...uniqueBanks.map((bank) => ({
      value: bank,
      label: bank,
    })),
  ];

  return dropdownOptions;
};

const getCurrencyPairOptions = (rateData: RateData[]) => {
  const currencyPairsSet = new Set<string>();

  rateData.forEach((item) => {
    item.currencyPairs.forEach((pair) => {
      currencyPairsSet.add(pair.currencyPair);
    });
  });

  const dropdownOptions = [
    { value: "all", label: "All" },
    ...Array.from(currencyPairsSet).map((pair) => ({
      value: pair,
      label: pair,
    })),
  ];

  return dropdownOptions;
};

const entityOptions = getCurrencyPairOptions(mockRateData);
const typeOptions = getBankOptions(mockRateData);

const dealOption = [
  { value: "active", label: "Active" },
  { value: "settled", label: "Settled" },
  { value: "outstanding", label: "Outstanding" },
];

const DateInput = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-secondary-text-dark mb-1">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
      />
    </div>
  );
};

const getTenorForDays = (days: number): string => {
  if (days <= 0) return "Spot";
  if (days <= 30) return "1M";
  if (days <= 90) return "3M";
  if (days <= 180) return "6M";
  return "1Y";
};

const getMTMRate = (
  row: ForwardTableColumns,
  calculationDate: string,
  rateData: RateData[]
): number | undefined => {
  const days = getDaysToMaturity(row.maturity_date, calculationDate);
  const tenor = getTenorForDays(days);
  // No 'bank' field in ForwardTableColumns anymore; fallback to entity for matching
  const bankRates = rateData.find((b) => b.bank === row.entity);
  if (!bankRates) return undefined;
  const pairRates = bankRates.currencyPairs.find(
    (p) => p.currencyPair === row.currency_pair
  );
  if (!pairRates) return undefined;
  // Try to find the exact tenor, else fallback to the highest available
  let rateObj = pairRates.rates.find((r) => r.tenor === tenor);
  if (!rateObj) {
    // fallback to last (highest tenor)
    rateObj = pairRates.rates[pairRates.rates.length - 1];
  }
  if (!rateObj) return undefined;
  if (row.buy_sell.toLowerCase() === "buy") {
    return rateObj.bidRate;
  } else {
    return rateObj.offerRate;
  }
};

export function getDaysToMaturity(
  maturityDate: string,
  calculationDate: string
): number {
  if (!maturityDate || !calculationDate) return 0;
  const maturity = new Date(maturityDate);
  const calculation = new Date(calculationDate);
  const diff = maturity.getTime() - calculation.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}


const AvailableForwards: React.FC<{
  data: ForwardTableColumns[];
  calculationDate: string;
  showSummary: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
}> = ({ data, calculationDate, showSummary, pagination, setPagination }) => {
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "mtm_id",
    "internal_reference_id",
    "entity",
    "deal_date",
    "maturity_date",
    "currency_pair",
    "buy_sell",
    "notional_amount",
    "contract_rate",
    "mtm_rate",
    "mtm_value",
    "days_to_maturity",
    "status",
    "calculated_at",
  ]);

  const columns = useMemo<ColumnDef<ForwardTableColumns>[]>(
    () => [
      {
        accessorKey: "mtm_id",
        header: "MTM ID",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
        enableHiding: false,
      },
      // booking_id intentionally hidden
      {
        accessorKey: "internal_reference_id",
        header: "Internal Ref ID",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
        enableHiding: false,
      },
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
        enableHiding: false,
      },
      {
        accessorKey: "deal_date",
        header: "Deal Date",
        cell: ({ getValue }) => (
          <span>{(getValue() as string)?.split("T")[0]}</span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "maturity_date",
        header: "Maturity Date",
        cell: ({ getValue }) => (
          <span>{(getValue() as string)?.split("T")[0]}</span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "currency_pair",
        header: "Currency Pair",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
        enableHiding: false,
      },
      {
        accessorKey: "buy_sell",
        header: "Buy/Sell",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
        enableHiding: false,
      },
      {
        accessorKey: "notional_amount",
        header: "Notional Amount",
        cell: ({ getValue }) => (
          <span>{Number(getValue()).toLocaleString()}</span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "contract_rate",
        header: "Contract Rate",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
        enableHiding: false,
      },
      {
        accessorKey: "mtm_rate",
        header: "MTM Rate",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
        enableHiding: false,
      },
      {
        accessorKey: "mtm_value",
        header: "MTM Value",
        cell: ({ getValue }) => {
          const value = Number(getValue());
          const color = value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "";
          return (
            <span className={`font-semibold ${color}`}>
              {value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "days_to_maturity",
        header: "Days to Maturity",
        cell: ({ getValue }) => <span>{String(getValue())} days</span>,
        enableHiding: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const rawStatus = String(getValue() ?? "");
          const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();
          const statusColors: Record<string, string> = {
            Open: "bg-green-100 text-green-800",
            Closed: "bg-gray-100 text-gray-800",
            Pending: "bg-yellow-100 text-yellow-800",
            Approved: "bg-blue-100 text-blue-800",
            Rejected: "bg-red-100 text-red-800",
          };
          const colorClass = statusColors[status] || "bg-gray-100 text-secondary-text-dark";
          return (
            <div className="flex justify-start w-full">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
                {status}
              </span>
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "calculated_at",
        header: "Calculated At",
        cell: ({ getValue }) => (
          <span>
            {(getValue() as string)?.replace("T", " ").replace(":00.000Z", "")}
          </span>
        ),
        enableHiding: false,
      },
    ],
    [calculationDate]
  );
  const defaultVisibility: Record<string, boolean> = {
    mtm_id: false,
    internal_reference_id: true,
    entity: true,
    deal_date: true,
    maturity_date: true,
    currency_pair: true,
    buy_sell: true,
    notional_amount: true,
    contract_rate: true,
    mtm_rate: true,
    mtm_value: true,
    days_to_maturity: true,
    status: true,
    calculated_at: false,
  };

  const [columnVisibility, setColumnVisibility] = useState(defaultVisibility);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnOrderChange: setColumnOrder,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnOrder,
      pagination,
      columnVisibility,
    },
  });

  const conversionRates: Record<string, number> = {
    INR: 1,
    USD: 83.5,
    EUR: 90,
    GBP: 105.2,
    JPY: 0.58,
    AUD: 55.3,
    CAD: 61.7,
    CHF: 95.8,
    SGD: 62.5,
    HKD: 10.7,
    CNY: 11.5,
    AED: 22.7,
  };

  // Sum of all MTM values (as numbers)
  const totalMTMValue = table.getRowModel().rows.reduce((sum, row) => {
    const val = Number(row.original.mtm_value);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);
  return (
    <>
    <div className="shadow-lg border border-border">
        <table className="min-w-[800px] w-full table-auto">
          <colgroup>
            {table.getVisibleLeafColumns().map((col) => (
              <col key={col.id} className="font-medium min-w-full" />
            ))}
          </colgroup>
          <thead className="bg-secondary-color rounded-xl">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border"
                      style={{ width: header.getSize() }}
                    >
                      <div className="px-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-left text-primary"
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
                      className="px-6 py-4 text-secondary-text-dark font-normal whitespace-nowrap text-sm border-b border-border"
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
          {showSummary && (
            <tfoot className="bg-gray-50 font-semibold text-primary text-sm border-t border-border">
              <tr>
                {table.getVisibleLeafColumns().map((col) => {
                  let content = null;
                  if (col.id === "mtm_value") {
                    content = (
                      <span
                        className={
                          totalMTMValue > 0
                            ? "text-green-600 font-bold"
                            : totalMTMValue < 0
                            ? "text-red-600 font-bold"
                            : "font-bold"
                        }
                      >
                        {totalMTMValue > 0 ? "+" : totalMTMValue < 0 ? "-" : ""} {Math.abs(totalMTMValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    );
                  } else if (col.id === "mtm_id") {
                    content = `Total Contracts: ${table.getRowModel().rows.length}`;
                  }
                  return (
                    <td key={col.id} className="px-6 py-2 text-start">
                      {content}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <Pagination
        table={table}
        totalItems={data.length}
        currentPageItems={table.getRowModel().rows.length}
        startIndex={pagination.pageIndex * pagination.pageSize + 1}
        endIndex={Math.min(
          (pagination.pageIndex + 1) * pagination.pageSize,
          data.length
        )}
      />
    </>
  );
};

const MTMCalculator = () => {
  const [mtmRows, setMtmRows] = React.useState<ForwardTableColumns[]>([]);
  const [mtmLoading, setMtmLoading] = React.useState(false);

  React.useEffect(() => {
    setMtmLoading(true);
    fetch("https://backend-slqi.onrender.com/api/mtm")
      .then((res) => res.json())
      .then((data) => {
        setMtmRows(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => setMtmRows([]))
      .finally(() => setMtmLoading(false));
  }, []);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [calculationDate, setCalculationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectDeal, setSelectDeal] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const filteredData = useMemo(() => {
    return mtmRows.filter((row) => {
      const matchBank =
        selectedType === "" ||
        selectedType === "all" ||
        row.entity === selectedType;
      const matchCurrency =
        selectedEntity === "" ||
        selectedEntity === "all" ||
        row.currency_pair === selectedEntity;
      const matchStatus =
        selectDeal === "" ||
        selectDeal === "all" ||
        (row.status && row.status.toLowerCase() === selectDeal.toLowerCase());
      return matchBank && matchCurrency && matchStatus;
    });
  }, [mtmRows, selectedType, selectedEntity, selectDeal]);

  return (
    <Layout title="MTM Calculator">
      <div className="space-y-6">
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <DateInput
            label="Calculation Date:"
            value={calculationDate}
            onChange={(val) => {
              setCalculationDate(val);
              setShowSummary(false);
            }}
          />

          <CustomSelect
            label="Select Bank"
            options={typeOptions}
            selectedValue={selectedType}
            onChange={(value) => {
              setSelectedType(value);
              setShowSummary(false);
            }}
            placeholder="Select type"
            isClearable={false}
          />

          <CustomSelect
            label="Currency Pair"
            options={entityOptions}
            selectedValue={selectedEntity}
            onChange={(value) => {
              setSelectedEntity(value);
              setShowSummary(false);
            }}
            placeholder="Select entity"
            isClearable={false}
          />

          <CustomSelect
            label="Type"
            options={dealOption}
            selectedValue={selectDeal}
            onChange={(value) => {
              setSelectDeal(value);
              setShowSummary(false);
            }}
            placeholder="Select type"
            isClearable={false}
          />
        </div>

        <div className="flex items-center justify-end pt-4 gap-2">
          
          <div className="w-15rem">
            <Button color="Fade">Save MTM Report</Button>
          </div>

          <div className="w-15rem">
            <Button onClick={() => exportToExcel(filteredData, "MTM_Results")}>Export Results</Button>
          </div>

          <div className="w-15rem">
            <Button onClick={() => setShowSummary(true)}>Calculate MTM</Button>
          </div>
        </div>

        <AvailableForwards
          data={filteredData}
          calculationDate={calculationDate}
          showSummary={showSummary}
          pagination={pagination}
          setPagination={setPagination}
        />
      </div>
    </Layout>
  );
};

export default MTMCalculator;
