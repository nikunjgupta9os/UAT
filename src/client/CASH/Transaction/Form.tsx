import React, { useState, useMemo } from "react";
import axios from "axios";
import Layout from "../../common/Layout";
import GridMasterOSTable from "../GridMasterOSTable";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import Button from "../../ui/Button";
import CustomSelect from "../../common/SearchSelect";
import { useNotification } from "../../Notification/Notification";
// Dropdown options (mocked – replace with API fetch later)
const entryTypes = ["Payables", "Receivables"];
const currencyOptions = ["USD", "INR", "EUR", "GBP"]; // Should come from Currency Master
const counterpartyMaster = ["Amazon", "Google", "Microsoft", "Reliance", "TCS"]; // Mock for auto-suggest

type ManualEntryRow = {
  Type: "Payables" | "Receivables" | "";
  Counterparty: string;
  InvoiceNumber: string;
  InvoiceDate: string;
  DueDate: string;
  Amount: number | "";
  Currency: string;
};

const defaultRow: ManualEntryRow = {
  Type: "",
  Counterparty: "",
  InvoiceNumber: "",
  InvoiceDate: "",
  DueDate: "",
  Amount: "",
  Currency: "",
};

const ManualEntryGrid: React.FC = () => {
  const { notify } = useNotification();

  const validateRows = () => {
    for (const [i, row] of rows.entries()) {
      if (!row.Type) return false;
      if (!row.Counterparty) return false;
      if (!row.InvoiceNumber) return false;
      if (!row.InvoiceDate) return false;
      if (new Date(row.InvoiceDate) > new Date()) return false;
      if (!row.DueDate) return false;
      if (new Date(row.DueDate) < new Date(row.InvoiceDate)) return false;
      if (!row.Amount || Number(row.Amount) <= 0) return false;
      if (!row.Currency) return false;
    }
    return true;
  };

  const [rows, setRows] = useState<ManualEntryRow[]>([defaultRow]);

  const handleReset = () => {
    setRows([defaultRow]);
  };

  const handleAddRow = () => {
    if (!validateRows()) {
      notify(
        "Please fill all fields correctly before adding a new row.",
        "warning"
      );
      return;
    }
    setRows([
      ...rows,
      {
        Type: "",
        Counterparty: "",
        InvoiceNumber: "",
        InvoiceDate: "",
        DueDate: "",
        Amount: "",
        Currency: "",
      },
    ]);
  };

  const handleInputChange = (
    idx: number,
    field: keyof ManualEntryRow,
    value: any
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = async () => {
    // No validation here
    try {
      const response = await axios.post("/api/manual-entries", rows, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Save success:", response.data);
      notify("Manual entries saved ✅");
    } catch (error) {
      console.error("Save failed:", error);
      notify("Error saving manual entries ❌", "error");
    }
  };

  const entryTypeOptions = entryTypes.map((t) => ({ value: t, label: t }));
  const currencySelectOptions = currencyOptions.map((c) => ({
    value: c,
    label: c,
  }));
  const counterpartyOptions = counterpartyMaster.map((c) => ({
    value: c,
    label: c,
  }));

  const columns = useMemo(
    () => [
      {
        accessorKey: "Type",
        header: "Type",
        cell: ({ row }: any) => (
          <CustomSelect
            label=""
            options={entryTypeOptions}
            selectedValue={row.original.Type}
            onChange={(value) => handleInputChange(row.index, "Type", value)}
            placeholder="Select type"
            isClearable
            isSearchable
          />
        ),
      },
      {
        accessorKey: "Counterparty",
        header: () => (
          <span>
            {rows[0]?.Type === "Receivables"
              ? "Customer Name"
              : "Vendor Name"}
          </span>
        ),
        cell: ({ row }: any) => (
          <CustomSelect
            label=""
            options={counterpartyOptions}
            selectedValue={row.original.Counterparty}
            onChange={(value) =>
              handleInputChange(row.index, "Counterparty", value)
            }
            placeholder={
              row.original.Type === "Receivables"
                ? "Enter customer name"
                : "Enter vendor name"
            }
            isClearable
            isSearchable
          />
        ),
      },
      {
        accessorKey: "InvoiceNumber",
        header: "Invoice",
        cell: ({ row }: any) => (
          <input
            type="text"
            defaultValue={row.original.InvoiceNumber} // ✅ use defaultValue instead of value
            onBlur={(e) =>
              handleInputChange(row.index, "InvoiceNumber", e.target.value)
            }
            className="border rounded px-2 py-1 w-full h-[37px]"
            placeholder="Invoice Number"
          />
        ),
      },
      {
        accessorKey: "InvoiceDate",
        header: "Invoice Date",
        cell: ({ row }: any) => {
          const today = new Date().toISOString().split("T")[0];
          return (
            <input
              type="date"
              value={row.original.InvoiceDate}
              max={today}
              onChange={(e) =>
                handleInputChange(row.index, "InvoiceDate", e.target.value)
              }
              className="border rounded px-2 py-1 w-full h-[37px]"
            />
          );
        },
      },
      {
        accessorKey: "DueDate",
        header: "Due Date",
        cell: ({ row }: any) => (
          <input
            type="date"
            value={row.original.DueDate}
            onChange={(e) =>
              handleInputChange(row.index, "DueDate", e.target.value)
            }
            className="border rounded px-2 py-1 w-full h-[37px]"
          />
        ),
      },
      {
        accessorKey: "Amount",
        header: "Amount",
        cell: ({ row }: any) => (
          <input
            type="number"
            defaultValue={row.original.Amount} // uncontrolled input
            onBlur={
              (e) => handleInputChange(row.index, "Amount", e.target.value) // commit only when leaving
            }
            className="border rounded px-2 py-1 w-full h-[36px]"
            min="0"
            step="any"
          />
        ),
      },
      {
        accessorKey: "Currency",
        header: "Currency",
        cell: ({ row }: any) => (
          <CustomSelect
            label=""
            options={currencySelectOptions}
            selectedValue={row.original.Currency}
            onChange={(value) =>
              handleInputChange(row.index, "Currency", value)
            }
            placeholder="Select currency"
            isClearable
            isSearchable
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

  return (
    <>
      <div className="flex items-center justify-end py-3 gap-x-4 gap-2">
        <div>
          <Button onClick={handleSave}>Save Manual Entries</Button>
        </div>
        <div>
          <Button onClick={handleReset} color="Fade">
            Reset
          </Button>
        </div>
      </div>

      <GridMasterOSTable<ManualEntryRow> table={table} />

      <div className="mt-4">
        <button
          onClick={handleAddRow}
          className="px-6 py-2 bg-primary text-white rounded font-semibold"
        >
          Add Row
        </button>
      </div>
    </>
  );
};

export default ManualEntryGrid;
