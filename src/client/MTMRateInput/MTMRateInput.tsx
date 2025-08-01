import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import RateTable from "./RateTable";
import LoadingSpinner from "../ui/LoadingSpinner";
import type { Bank, CurrencyPair, Tenor, RateRow, FilterState } from "./Data.d";

// Constants and Mock Data
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const MOCK_DATA = {
  banks: [
    { id: 'axis', name: 'Axis Bank' },
    { id: 'hdfc', name: 'HDFC Bank' },
    { id: 'icici', name: 'ICICI Bank' },
    { id: 'sbi', name: 'SBI Bank' }
  ] as Bank[],
  
  currencyPairs: [
    { id: 'usd-inr', pair: 'USD/INR' },
    { id: 'eur-usd', pair: 'EUR/USD' },
    { id: 'gbp-usd', pair: 'GBP/USD' },
    { id: 'jpy-inr', pair: 'JPY/INR' }
  ] as CurrencyPair[],
  
  tenors: [
    { id: 'spot', name: 'Spot' },
    { id: '1m', name: '1 Month' },
    { id: '3m', name: '3 Month' },
    { id: '6m', name: '6 Month' },
    { id: '1y', name: '1 Year' }
  ] as Tenor[],
  
  // Bank-specific currency pairs
  bankCurrencyPairs: {
    'axis': [
      { id: 'usd-inr', pair: 'USD/INR' },
      { id: 'eur-usd', pair: 'EUR/USD' },
      { id: 'jpy-inr', pair: 'JPY/INR' }
    ],
    'hdfc': [
      { id: 'usd-inr', pair: 'USD/INR' },
      { id: 'gbp-usd', pair: 'GBP/USD' },
      { id: 'jpy-inr', pair: 'JPY/INR' }
    ],
    'icici': [
      { id: 'usd-inr', pair: 'USD/INR' },
      { id: 'eur-usd', pair: 'EUR/USD' },
      { id: 'gbp-usd', pair: 'GBP/USD' }
    ],
    'sbi': [
      { id: 'usd-inr', pair: 'USD/INR' },
      { id: 'eur-usd', pair: 'EUR/USD' },
      { id: 'jpy-inr', pair: 'JPY/INR' }
    ]
  } as Record<string, CurrencyPair[]>,
  
  // Bank-specific sample rates
  bankRateData: {
    'axis': [
      {
        currencyPair: 'USD/INR',
        tenor: '1 Month',
        bidRate: 83.5000,
        offerRate: 83.6000,
        midRate: 83.5500
      },
      {
        currencyPair: 'EUR/USD',
        tenor: 'Spot',
        bidRate: 1.0820,
        offerRate: 1.0840,
        midRate: 1.0830
      }
    ],
    'hdfc': [
      {
        currencyPair: 'USD/INR',
        tenor: '3 Month',
        bidRate: 83.7500,
        offerRate: 83.8500,
        midRate: 83.8000
      },
      {
        currencyPair: 'GBP/USD',
        tenor: 'Spot',
        bidRate: 1.2650,
        offerRate: 1.2670,
        midRate: 1.2660
      }
    ],
    'icici': [
      {
        currencyPair: 'USD/INR',
        tenor: '6 Month',
        bidRate: 84.0000,
        offerRate: 84.1000,
        midRate: 84.0500
      }
    ],
    'sbi': [
      {
        currencyPair: 'USD/INR',
        tenor: '1 Year',
        bidRate: 84.5000,
        offerRate: 84.7000,
        midRate: 84.6000
      }
    ]
  } as Record<string, any[]>,
  
  sampleRates: [
    {
      currencyPair: 'USD/INR',
      tenor: '1 Month',
      bidRate: 83.5000,
      offerRate: 83.6000,
      midRate: 83.5500
    },
    {
      currencyPair: 'USD/INR',
      tenor: '3 Month',
      bidRate: 83.7500,
      offerRate: 83.8500,
      midRate: 83.8000
    },
    {
      currencyPair: 'EUR/USD',
      tenor: 'Spot',
      bidRate: 1.0820,
      offerRate: 1.0840,
      midRate: 1.0830
    }
  ]
};

// Utility Functions
const getCurrentDate = (): string => new Date().toISOString().split('T')[0];
const generateId = (): string => `rate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const MTMRateInput: React.FC = () => {
  // State Management
  const [banks, setBanks] = useState<Bank[]>([]);
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([]);
  const [tenors, setTenors] = useState<Tenor[]>([]);
  const [rateData, setRateData] = useState<RateRow[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    selectedBank: '',
    selectedDate: getCurrentDate(),
    selectedCurrencyPair: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper Functions
  const createNewRow = (): RateRow => ({
    id: generateId(),
    currencyPair: '',
    tenor: '',
    bidRate: '',
    offerRate: '',
    midRate: '',
    isEditing: true,
    isNew: true
  });

  const createSampleData = (): RateRow[] => {
    // If a bank is selected, use bank-specific data, otherwise use general sample data
    const dataToUse = filters.selectedBank && MOCK_DATA.bankRateData[filters.selectedBank] 
      ? MOCK_DATA.bankRateData[filters.selectedBank] 
      : MOCK_DATA.sampleRates;
      
    return dataToUse.map(data => ({
      ...data,
      id: generateId(),
      isEditing: false,
      isNew: false
    }));
  };

  const fetchDataWithFallback = async <T,>(
    endpoint: string,
    fallbackData: T[]
  ): Promise<T[]> => {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      return response?.data && Array.isArray(response.data) ? response.data : fallbackData;
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
          fetchDataWithFallback('/banks', MOCK_DATA.banks),
          fetchDataWithFallback('/currency-pairs', MOCK_DATA.currencyPairs),
          fetchDataWithFallback('/tenors', MOCK_DATA.tenors)
        ]);

        setBanks(banksData);
        setCurrencyPairs(currencyPairsData);
        setTenors(tenorsData);

        // Initialize with empty data since no bank is selected initially
        setRateData([createNewRow()]);
      } catch (err) {
        setError('Failed to initialize data. Using offline mode.');
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
      setFilters(prev => ({ ...prev, selectedCurrencyPair: '' }));
    } else {
      // If no bank selected, show only new row
      setRateData([createNewRow()]);
    }
  }, [filters.selectedBank]);

  // Event Handlers
  const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleDataChange = useCallback((newData: RateRow[]) => {
    setRateData(newData);
  }, []);

  const handleSaveRow = useCallback(async (row: RateRow) => {
    try {
      const response = await axios.post(`${BASE_URL}/rates`, {
        ...row,
        bankId: filters.selectedBank,
        rateDate: filters.selectedDate
      });

      if (response.data?.success) {
        setRateData(prev => prev.map(r => 
          r.id === row.id ? { ...r, isEditing: false } : r
        ));
      } else {
        setError('Failed to save rate');
      }
    } catch (err) {
      setError('Failed to save rate');
    }
  }, [filters]);

  const handleDeleteRow = useCallback(async (id: string) => {
    try {
      const row = rateData.find(r => r.id === id);
      if (!row?.isNew) {
        await axios.delete(`${BASE_URL}/rates/${id}`);
      }
      setRateData(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError('Failed to delete rate');
    }
  }, [rateData]);

  const handleAddRow = useCallback(() => {
    // Check if bank is selected first
    if (!filters.selectedBank) {
      setError('Please select a bank first before adding rate data');
      return;
    }

    const currentNewRow = rateData.find(r => r.isNew);
    if (!currentNewRow?.currencyPair || !currentNewRow?.tenor || 
        currentNewRow.bidRate === '' || currentNewRow.offerRate === '') {
      setError('Please fill all required fields before adding a new row');
      return;
    }

    setRateData(prev => [
      ...prev.map(r => r.isNew ? { ...r, isNew: false, isEditing: false } : r),
      createNewRow()
    ]);
    setError(null);
  }, [rateData, filters.selectedBank]);

  const handleSaveAllRates = useCallback(async () => {
    const unsavedRows = rateData.filter(r => !r.isNew && r.isEditing);
    try {
      await Promise.all(unsavedRows.map(handleSaveRow));
    } catch (err) {
      setError('Failed to save some rates');
    }
  }, [rateData, handleSaveRow]);

  const handleClearForm = useCallback(() => {
    setRateData([createNewRow()]);
    setError(null);
  }, []);

  // Filter data based on selected currency pair
  const availableCurrencyPairs = getAvailableCurrencyPairs();
  
  const filteredRateData = filters.selectedCurrencyPair 
    ? rateData.filter(row => {
        if (row.isNew) return true;
        const selectedPair = availableCurrencyPairs.find(cp => cp.id === filters.selectedCurrencyPair);
        return selectedPair?.pair === row.currencyPair;
      })
    : rateData;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
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

      <div className="bg-green-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-green-700 mb-4">Header Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              Bank Name:
            </label>
            <select
              value={filters.selectedBank}
              onChange={(e) => handleFilterChange('selectedBank', e.target.value)}
              className="w-full px-3 py-2 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select Bank</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              Rate Date:
            </label>
            <input
              type="date"
              value={filters.selectedDate}
              onChange={(e) => handleFilterChange('selectedDate', e.target.value)}
              className="w-full px-3 py-2 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">
              Currency Pair (Filter):
            </label>
            <select
              value={filters.selectedCurrencyPair}
              onChange={(e) => handleFilterChange('selectedCurrencyPair', e.target.value)}
              disabled={!filters.selectedBank}
              className="w-full px-3 py-2 border border-green-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {filters.selectedBank ? 'All Currency Pairs' : 'Select Bank First'}
              </option>
              {availableCurrencyPairs.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.pair}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!filters.selectedBank && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Please select a bank from the dropdown above to view and manage MTM rates for that specific bank.
                </p>
              </div>
            </div>
          </div>
        )}

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
          onImportRates={() => console.log('Import rates functionality to be implemented')}
          onViewHistory={() => console.log('View history functionality to be implemented')}
        />
      </div>
    </div>
  );
};

export default MTMRateInput;