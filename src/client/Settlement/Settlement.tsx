import React, { useState, useMemo, useEffect } from "react";
import Layout from "../common/Layout";
import CustomSelect from "../common/SearchSelect";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  getPaginationRowModel,
} from "@tanstack/react-table";
import Button from "../ui/Button";

import { Mail, FileText, Download } from "lucide-react";

interface settlementData {
  select: string;
  exposureDetails: string;
  exposureAmount: number;
  counterpartyRiskRating: string;
  bank: string;
}

const DateInput = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
      />
    </div>
  );
};

const entityOptions = [];
const typeOptions = [];

const dealOption = [
  { value: "active", label: "Active" },
  { value: "settled", label: "Settled" },
  { value: "outstanding", label: "Outstanding" },
];

const companyOption = [
  { value: "companyA", label: "Company A" },
  { value: "companyB", label: "Company B" },
];

const mockSettlementData: settlementData[] = [];

function Settlement() {
  const [calculationDate, setCalculationDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectDeal, setSelectDeal] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [data, setData] = useState<settlementData[]>(mockSettlementData);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
  const [columnVisibility, setColumnVisibility] = useState({
    srno: true,
    type: true,
    moduleName: true,
    categoryName: true,
    message: true,
    sourceApplication: true,
    code: true,
    createdDate: true,
  });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "select",
    "exposureDetails",
    "exposureAmount",
    "counterpartyRiskRating",
    "bank",
  ]);

  const columns = useMemo<ColumnDef<settlementData>[]>(
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
        accessorKey: "exposureDetails",
        header: "Exposure Details",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "exposureAmount",
        header: "Exposure Amount",
        cell: ({ getValue }) => <span>{getValue() as number}</span>,
      },
      {
        accessorKey: "counterpartyRiskRating",
        header: "Counterparty Risk Rating",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
      {
        accessorKey: "bank",
        header: "Bank",
        cell: ({ getValue }) => <span>{getValue() as string}</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnOrder,
      pagination,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    manualPagination: false,
    pageCount: Math.ceil(data.length / pagination.pageSize),
  });

  useEffect(() => {
    // Filter data based on selections
    const filteredData = mockSettlementData.filter((row) => {
      const matchBank =
        selectedType === "" ||
        selectedType === "all" ||
        row.bank === selectedType;
      return matchBank;
    });
    setData(filteredData);
  }, [selectedType, selectedEntity, selectDeal, calculationDate]);

  const totalAmount = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.exposureAmount || 0), 0);
  }, [data]);

  return (
    <Layout title="Settlement">
      <div className="space-y-4">
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <CustomSelect
            label="Company"
            options={companyOption}
            selectedValue={selectedType}
            onChange={(value) => {
              setSelectedType(value);
              setShowSummary(false);
            }}
            placeholder="Select company"
            isClearable={false}
          />

          <CustomSelect
            label="Entity Name"
            options={companyOption}
            selectedValue={selectedType}
            onChange={(value) => {
              setSelectedType(value);
              setShowSummary(false);
            }}
            placeholder="Select entity name"
            isClearable={false}
          />

          <CustomSelect
            label="Business"
            options={typeOptions}
            selectedValue={selectedType}
            onChange={(value) => {
              setSelectedType(value);
              setShowSummary(false);
            }}
            placeholder="Select business type"
            isClearable={false}
          />

          <CustomSelect
            label="Import/Export"
            options={entityOptions}
            selectedValue={selectedEntity}
            onChange={(value) => {
              setSelectedEntity(value);
              setShowSummary(false);
            }}
            placeholder="Select import/export"
            isClearable={false}
          />

          <DateInput
            label="Settlement Date:"
            value={calculationDate}
            onChange={(val) => {
              setCalculationDate(val);
              setShowSummary(false);
            }}
          />

          <CustomSelect
            label="Currency"
            options={dealOption}
            selectedValue={selectDeal}
            onChange={(value) => {
              setSelectDeal(value);
              setShowSummary(false);
            }}
            placeholder="Select currency"
            isClearable={false}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-primary-lt pt-6">
            Exposure List
          </h2>
        </div>
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
        <div className="flex items-center justify-between bg-gray-100 px-6 py-3 shadow-sm">
          <div className="text-lg font-semibold text-gray-700">
            Total Amount :{" "}
            <span className="text-primary font-bold text-xl">
              $
              {totalAmount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-end gap-x-4 gap-2">
            <div className="w-15rem">
              <Button>Payment</Button>
            </div>
            <div className="w-15rem">
              <Button>Rollover</Button>
            </div>

            <div className="w-15rem">
              <Button onClick={() => setShowSummary(true)}>
                cancellation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settlement;
