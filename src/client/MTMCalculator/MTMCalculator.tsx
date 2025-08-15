
import React, { useState, useMemo } from "react";
import Layout from "../common/Layout";
import CustomSelect from "../common/SearchSelect";
import Button from "../ui/Button";
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
  bank: string;
  forwardId: string;
  dealDate: string;
  maturityDate: string;
  currencyPair: string;
  buySell: string;
  notionalAmt: number;
  contractRate: number;
  mtmRate?: number;
  mtmValue?: number;
  daysToMaturity?: number;
  status: "Outstanding" | "Settled" | "Active";
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
      <label className="text-sm font-medium text-secondary-text-dark mb-1">{label}</label>
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
  const days = getDaysToMaturity(row.maturityDate, calculationDate);
  const tenor = getTenorForDays(days);
  const bankRates = rateData.find((b) => b.bank === row.bank);
  if (!bankRates) return undefined;
  const pairRates = bankRates.currencyPairs.find(
    (p) => p.currencyPair === row.currencyPair
  );
  if (!pairRates) return undefined;
  // Try to find the exact tenor, else fallback to the highest available
  let rateObj = pairRates.rates.find((r) => r.tenor === tenor);
  if (!rateObj) {
    // fallback to last (highest tenor)
    rateObj = pairRates.rates[pairRates.rates.length - 1];
  }
  if (!rateObj) return undefined;
  if (row.buySell.toLowerCase() === "buy") {
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

const mockForwardTableColumns: ForwardTableColumns[] = [
  {
    bank: "Axis Bank",
    forwardId: "FX1001",
    dealDate: "2024-12-15",
    maturityDate: "2025-08-15",
    currencyPair: "USD/INR",
    buySell: "Buy",
    notionalAmt: 1000000,
    contractRate: 83.25,
    status: "Outstanding",
  },
  {
    bank: "Axis Bank",
    forwardId: "FX1002",
    dealDate: "2025-01-20",
    maturityDate: "2025-08-31",
    currencyPair: "USD/INR",
    buySell: "Sell",
    notionalAmt: 500000,
    contractRate: 83.7,
    status: "Outstanding",
  },
  {
    bank: "Axis Bank",
    forwardId: "FX1003",
    dealDate: "2025-02-10",
    maturityDate: "2025-09-25",
    currencyPair: "EUR/USD",
    buySell: "Buy",
    notionalAmt: 250000,
    contractRate: 1.085,
    status: "Outstanding",
  },
  {
    bank: "HDFC Bank",
    forwardId: "FX1004",
    dealDate: "2025-03-05",
    maturityDate: "2025-11-30",
    currencyPair: "USD/INR",
    buySell: "Buy",
    notionalAmt: 750000,
    contractRate: 83.8,
    status: "Outstanding",
  },
];

const AvailableForwards: React.FC<{
  data: ForwardTableColumns[];
  calculationDate: string;
  showSummary: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<React.SetStateAction<{ pageIndex: number; pageSize: number }>>;
}> = ({ data, calculationDate, showSummary, pagination, setPagination }) => {
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "forwardId",
    "dealDate",
    "maturityDate",
    "currencyPair",
    "buySell",
    "notionalAmt",
    "contractRate",
    "mtmRate",
    "mtmValue",
    "daysToMaturity",
    "status",
  ]);

  const columns = useMemo<ColumnDef<ForwardTableColumns>[]>(
    () => [

      {
        accessorKey: "forwardId",
        header: "Forward ID",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "dealDate",
        header: "Deal Date",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "maturityDate",
        header: "Maturity Date",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "currencyPair",
        header: "Currency Pair",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "buySell",
        header: "Buy/Sell",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "notionalAmt",
        header: "Notional Amount",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "contractRate",
        header: "Contract Rate",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "mtmRate",
        header: "MTM Rate",
        cell: ({ row }) => {
          const rate = getMTMRate(row.original, calculationDate, mockRateData);
          return rate !== undefined ? rate.toFixed(4) : "-";
        },
      },
      {
        accessorKey: "mtmValue",
        header: "MTM Value",
        cell: ({ row }) => {
          const mtmRate = getMTMRate(
            row.original,
            calculationDate,
            mockRateData
          );
          const notional = row.original.notionalAmt;
          const contract = row.original.contractRate;
          if (mtmRate === undefined) return "-";
          const value = notional * mtmRate - notional * contract;
          const currency = row.original.currencyPair.split("/")[1] || "";
          const color =
            value > 0 ? "text-green-600" : value < 0 ? "text-red-600" : "";
          return (
            <span className={`font-semibold ${color}`}>
              {value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              {currency}
            </span>
          );
        },
      },
      {
        accessorKey: "daysToMaturity",
        header: "Days to Maturity",
        cell: ({ row }) => {
          const maturityDate = row.original.maturityDate;
          const days = getDaysToMaturity(maturityDate, calculationDate);
          return <span>{days} days</span>;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
    ],
    [calculationDate]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnOrderChange: setColumnOrder,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      columnOrder,
      pagination,
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

  const totalMTMValueINR = table.getRowModel().rows.reduce((sum, row) => {
    const mtmRate = getMTMRate(row.original, calculationDate, mockRateData);
    const notional = row.original.notionalAmt;
    const contract = row.original.contractRate;
    if (mtmRate === undefined) return sum;
    const value = notional * mtmRate - notional * contract;
    const currency = row.original.currencyPair.split("/")[1] || "INR";
    const inrValue = value * (conversionRates[currency] || 1);
    return sum + inrValue;
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
                    className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
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
                  <p className="text-lg font-medium text-primary mb-1">
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
                    className="px-6 py-4 text-secondary-text-dark font-normal whitespace-nowrap text-sm border-b border-border"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                if (col.id === "mtmValue") {
                  content = (
                    <span
                      className={
                        totalMTMValueINR > 0
                          ? "text-green-600 font-bold"
                          : totalMTMValueINR < 0
                          ? "text-red-600 font-bold"
                          : "font-bold"
                      }
                    >
                      {totalMTMValueINR > 0 ? "+" : totalMTMValueINR < 0 ? "-" : ""} {Math.abs(totalMTMValueINR).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                    </span>
                  );
                } else if (col.id === "forwardId") {
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
    return mockForwardTableColumns.filter((row) => {
      const matchBank =
        selectedType === "" ||
        selectedType === "all" ||
        row.bank === selectedType;
      const matchCurrency =
        selectedEntity === "" ||
        selectedEntity === "all" ||
        row.currencyPair === selectedEntity;
      const matchStatus =
        selectDeal === "" ||
        selectDeal === "all" ||
        row.status.toLowerCase() === selectDeal.toLowerCase();

      return matchBank && matchCurrency && matchStatus;
    });
  }, [selectedType, selectedEntity, selectDeal]);

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
            <Button color="Fade">Export Results</Button>
          </div>
          <div className="w-15rem">
            <Button color="Fade">Save MTM Report</Button>
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
