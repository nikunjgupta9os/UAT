import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Layout from "../common/Layout";
import CustomSelect from "../common/SearchSelect";
import Button from "../ui/Button";
import RateTable from "./RateTable";
import LoadingSpinner from "../ui/LoadingSpinner";
import type { Bank, CurrencyPair, Tenor, RateRow, FilterState } from "./Data.d";

// Constants and Mock Data
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const MOCK_DATA = {
  banks: [
    { id: "axis", name: "Axis Bank" },
    { id: "hdfc", name: "HDFC Bank" },
    { id: "icici", name: "ICICI Bank" },
    { id: "sbi", name: "SBI Bank" },
  ] as Bank[],

  currencyPairs: [
    { id: "usd-inr", pair: "USD/INR" },
    { id: "eur-usd", pair: "EUR/USD" },
    { id: "gbp-usd", pair: "GBP/USD" },
    { id: "jpy-inr", pair: "JPY/INR" },
  ] as CurrencyPair[],

  tenors: [
    { id: "spot", name: "Spot" },
    { id: "1m", name: "1 Month" },
    { id: "3m", name: "3 Month" },
    { id: "6m", name: "6 Month" },
    { id: "1y", name: "1 Year" },
  ] as Tenor[],

  // Bank-specific currency pairs
  bankCurrencyPairs: {
    axis: [
      { id: "usd-inr", pair: "USD/INR" },
      { id: "eur-usd", pair: "EUR/USD" },
      { id: "jpy-inr", pair: "JPY/INR" },
    ],
    hdfc: [
      { id: "usd-inr", pair: "USD/INR" },
      { id: "gbp-usd", pair: "GBP/USD" },
      { id: "jpy-inr", pair: "JPY/INR" },
    ],
    icici: [
      { id: "usd-inr", pair: "USD/INR" },
      { id: "eur-usd", pair: "EUR/USD" },
      { id: "gbp-usd", pair: "GBP/USD" },
    ],
    sbi: [
      { id: "usd-inr", pair: "USD/INR" },
      { id: "eur-usd", pair: "EUR/USD" },
      { id: "jpy-inr", pair: "JPY/INR" },
    ],
  } as Record<string, CurrencyPair[]>,

  // Bank-specific sample rates
  bankRateData: {
    axis: [
      {
        currencyPair: "USD/INR",
        tenor: "1 Month",
        bidRate: 83.5,
        offerRate: 83.6,
        midRate: 83.55,
      },
      {
        currencyPair: "EUR/USD",
        tenor: "Spot",
        bidRate: 1.082,
        offerRate: 1.084,
        midRate: 1.083,
      },
    ],
    hdfc: [
      {
        currencyPair: "USD/INR",
        tenor: "3 Month",
        bidRate: 83.75,
        offerRate: 83.85,
        midRate: 83.8,
      },
      {
        currencyPair: "GBP/USD",
        tenor: "Spot",
        bidRate: 1.265,
        offerRate: 1.267,
        midRate: 1.266,
      },
    ],
    icici: [
      {
        currencyPair: "USD/INR",
        tenor: "6 Month",
        bidRate: 84.0,
        offerRate: 84.1,
        midRate: 84.05,
      },
    ],
    sbi: [
      {
        currencyPair: "USD/INR",
        tenor: "1 Year",
        bidRate: 84.5,
        offerRate: 84.7,
        midRate: 84.6,
      },
    ],
  } as Record<string, any[]>,

  sampleRates: [
    {
      currencyPair: "USD/INR",
      tenor: "1 Month",
      bidRate: 83.5,
      offerRate: 83.6,
      midRate: 83.55,
    },
    {
      currencyPair: "USD/INR",
      tenor: "3 Month",
      bidRate: 83.75,
      offerRate: 83.85,
      midRate: 83.8,
    },
    {
      currencyPair: "EUR/USD",
      tenor: "Spot",
      bidRate: 1.082,
      offerRate: 1.084,
      midRate: 1.083,
    },
  ],
};

// Utility Functions
const getCurrentDate = (): string => new Date().toISOString().split("T")[0];
const generateId = (): string =>
  `rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const MTMRateInput: React.FC = () => {
  // State Management
  const [banks, setBanks] = useState<Bank[]>([]);
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([]);
  const [tenors, setTenors] = useState<Tenor[]>([]);
  const [rateData, setRateData] = useState<RateRow[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    selectedBank: "",
    selectedDate: getCurrentDate(),
    selectedCurrencyPair: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper Functions
  const createNewRow = (): RateRow => ({
    id: generateId(),
    currencyPair: "",
    tenor: "",
    bidRate: "",
    offerRate: "",
    midRate: "",
    isEditing: true,
    isNew: true,
  });

  const createSampleData = (): RateRow[] => {
    // If a bank is selected, use bank-specific data, otherwise use general sample data
    const dataToUse =
      filters.selectedBank && MOCK_DATA.bankRateData[filters.selectedBank]
        ? MOCK_DATA.bankRateData[filters.selectedBank]
        : MOCK_DATA.sampleRates;

    return dataToUse.map((data) => ({
      ...data,
      id: generateId(),
      isEditing: false,
      isNew: false,
    }));
  };

  const fetchDataWithFallback = async <T,>(
    endpoint: string,
    fallbackData: T[]
  ): Promise<T[]> => {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      return response?.data && Array.isArray(response.data)
        ? response.data
        : fallbackData;
    } catch (error) {
      console.warn(`API fetch failed for ${endpoint}, using fallback data`);
      return fallbackData;
    }
  };

  // Get bank-specific currency pairs
  const getAvailableCurrencyPairs = (): CurrencyPair[] => {
    if (!filters.selectedBank) {
      return []; // No currency pairs if no bank is selected
    }

    return MOCK_DATA.bankCurrencyPairs[filters.selectedBank] || [];
  };

  // Initialize Data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [banksData, currencyPairsData, tenorsData] = await Promise.all([
          fetchDataWithFallback("/banks", MOCK_DATA.banks),
          fetchDataWithFallback("/currency-pairs", MOCK_DATA.currencyPairs),
          fetchDataWithFallback("/tenors", MOCK_DATA.tenors),
        ]);

        setBanks(banksData);
        setCurrencyPairs(currencyPairsData);
        setTenors(tenorsData);

        // Initialize with empty data since no bank is selected initially
        setRateData([createNewRow()]);
      } catch (err) {
        setError("Failed to initialize data. Using offline mode.");
        setBanks(MOCK_DATA.banks);
        setCurrencyPairs(MOCK_DATA.currencyPairs);
        setTenors(MOCK_DATA.tenors);
        setRateData([createNewRow()]);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // Load bank-specific data when bank is selected
  useEffect(() => {
    if (filters.selectedBank) {
      const bankSpecificData = createSampleData();
      const initialData = [...bankSpecificData, createNewRow()];
      setRateData(initialData);

      // Reset currency pair filter when bank changes
      setFilters((prev) => ({ ...prev, selectedCurrencyPair: "" }));
    } else {
      // If no bank selected, show only new row
      setRateData([createNewRow()]);
    }
  }, [filters.selectedBank]);

  // Event Handlers
  const handleFilterChange = useCallback(
    (field: keyof FilterState, value: string) => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleDataChange = useCallback((newData: RateRow[]) => {
    setRateData(newData);
  }, []);

  const handleSaveRow = useCallback(
    async (row: RateRow) => {
      try {
        const response = await axios.post(`${BASE_URL}/rates`, {
          ...row,
          bankId: filters.selectedBank,
          rateDate: filters.selectedDate,
        });

        if (response.data?.success) {
          setRateData((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, isEditing: false } : r))
          );
        } else {
          setError("Failed to save rate");
        }
      } catch (err) {
        setError("Failed to save rate");
      }
    },
    [filters]
  );

  const handleDeleteRow = useCallback(
    async (id: string) => {
      try {
        const row = rateData.find((r) => r.id === id);
        if (!row?.isNew) {
          await axios.delete(`${BASE_URL}/rates/${id}`);
        }
        setRateData((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        setError("Failed to delete rate");
      }
    },
    [rateData]
  );

  const handleAddRow = useCallback(() => {
    // Check if bank is selected first
    if (!filters.selectedBank) {
      setError("Please select a bank first before adding rate data");
      return;
    }

    const currentNewRow = rateData.find((r) => r.isNew);
    if (
      !currentNewRow?.currencyPair ||
      !currentNewRow?.tenor ||
      currentNewRow.bidRate === "" ||
      currentNewRow.offerRate === ""
    ) {
      setError("Please fill all required fields before adding a new row");
      return;
    }

    setRateData((prev) => [
      ...prev.map((r) =>
        r.isNew ? { ...r, isNew: false, isEditing: false } : r
      ),
      createNewRow(),
    ]);
    setError(null);
  }, [rateData, filters.selectedBank]);

  const handleSaveAllRates = useCallback(async () => {
    const unsavedRows = rateData.filter((r) => !r.isNew && r.isEditing);
    try {
      await Promise.all(unsavedRows.map(handleSaveRow));
    } catch (err) {
      setError("Failed to save some rates");
    }
  }, [rateData, handleSaveRow]);

  const handleClearForm = useCallback(() => {
    setRateData([createNewRow()]);
    setError(null);
  }, []);

  // Filter data based on selected currency pair
  const availableCurrencyPairs = getAvailableCurrencyPairs();
  const filteredRateData = filters.selectedCurrencyPair
    ? rateData.filter((row) => {
        if (row.isNew) return true;
        const selectedPair = availableCurrencyPairs.find(
          (cp) => cp.id === filters.selectedCurrencyPair
        );
        return selectedPair?.pair === row.currencyPair;
      })
    : rateData;

  // if (loading) {
  //   return <LoadingSpinner />;
  // }

  // For CustomSelect options
  const bankOptions = banks.map((bank) => ({
    value: bank.id,
    label: bank.name,
  }));
  const currencyPairOptions = availableCurrencyPairs.map((pair) => ({
    value: pair.id,
    label: pair.pair,
  }));

  return (
    <Layout title="MTM Rate Input">
      <div className="space-y-2">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 items-end">
          {/* Rate Date */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-secondary-text mb-2">
              Rate Date:
            </label>
            <input
              type="date"
              value={filters.selectedDate}
              onChange={(e) =>
                handleFilterChange("selectedDate", e.target.value)
              }
              className="w-full h-[37px] px-2 pr-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            />
          </div>

          {/* Bank Name */}
          <div className="flex flex-col">
            <CustomSelect
              label="Bank Name"
              options={bankOptions}
              selectedValue={filters.selectedBank}
              onChange={(val) => handleFilterChange("selectedBank", val)}
              placeholder="Select Bank"
              isClearable={false}
            />
          </div>

          {/* Currency Pair */}
          <div className="flex flex-col">
            <CustomSelect
              label="Currency Pair (Filter)"
              options={currencyPairOptions}
              selectedValue={filters.selectedCurrencyPair}
              onChange={(val) =>
                handleFilterChange("selectedCurrencyPair", val)
              }
              placeholder={
                filters.selectedBank
                  ? "All Currency Pairs"
                  : "Select Bank First"
              }
              isClearable={false}
              isDisabled={!filters.selectedBank}
            />
          </div>

          {/* Clear Form Button */}
          <div className="w-1/2">
            <div className="flex items-start ">
              <Button onClick={handleClearForm}>Clear Form</Button>
            </div>
          </div>
        </div>

        <div className="relative top-6 flex items-center justify-end gap-4">
          <div className="w-15rem">
            <Button onClick={handleSaveAllRates}>Save All Rates</Button>
          </div>
          <div className="w-15rem">
            <Button onClick={handleAddRow}>Add New Rate</Button>
          </div>
        </div>

        <RateTable
          data={filteredRateData}
          currencyPairs={availableCurrencyPairs}
          tenors={tenors}
          onDataChange={handleDataChange}
          onSaveRow={handleSaveRow}
          onDeleteRow={handleDeleteRow}
          onAddRow={handleAddRow}
          onSaveAllRates={handleSaveAllRates}
          onClearForm={handleClearForm}
          onImportRates={() =>
            console.log("Import rates functionality to be implemented")
          }
          onViewHistory={() =>
            console.log("View history functionality to be implemented")
          }
        />
      </div>
    </Layout>
  );
};

export default MTMRateInput;
