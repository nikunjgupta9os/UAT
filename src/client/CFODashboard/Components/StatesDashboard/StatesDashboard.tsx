import { CreditCard, TrendingUp, RotateCcw, Building2 } from 'lucide-react';
import React, { useEffect, useState } from "react";
import axios from "axios";

type CurrencyData = {
  currency: string;
  amount: string; // assuming backend sends plain number like 89200000
};
const FinancialDashboard = () => {
  const [payablesData, setPayablesData] = useState<CurrencyData[]>([]);
  const [receivablesData, setReceivablesData] = useState<CurrencyData[]>([]);
  const [forwardsData, setForwardsData] = useState<any[]>([]);

  // Function to parse formatted currency string back to number (only for calculations)
  const parseCurrencyString = (currencyStr: string): number => {
    if (!currencyStr || typeof currencyStr !== 'string') return 0;
    // Remove $ symbol and get the numeric part
    const cleanStr = currencyStr.replace('$', '').trim();
    // Handle negative values
    const isNegative = cleanStr.startsWith('-');
    const positiveStr = cleanStr.replace('-', '');
    // Parse based on suffix
    let value = 0;
    if (positiveStr.endsWith('K')) {
      value = parseFloat(positiveStr.replace('K', '')) * 1000;
    } else if (positiveStr.endsWith('M')) {
      value = parseFloat(positiveStr.replace('M', '')) * 1000000;
    } else {
      value = parseFloat(positiveStr) || 0;
    }
    return isNegative ? -value : value;
  };

  // Function to format numbers with K, M prefixes
  const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (absAmount >= 1000000) {
      return `${sign}$${(absAmount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
      return `${sign}$${(absAmount / 1000).toFixed(1)}K`;
    } else {
      return `${sign}$${absAmount.toFixed(0)}`;
    }
  };

  // Calculate totals by parsing the formatted strings
  const totalPayables = payablesData.reduce((sum, item) => sum + parseCurrencyString(item.amount), 0);
  const totalReceivables = receivablesData.reduce((sum, item) => sum + parseCurrencyString(item.amount), 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payablesRes, receivablesRes, forwardsRes] = await Promise.all([
          axios.get("https://backend-slqi.onrender.com/api/exposureUpload/payables-headers"),
          axios.get("https://backend-slqi.onrender.com/api/exposureUpload/receivables-headers"),
          axios.get("https://backend-slqi.onrender.com/api/forwardDash/bank-trades"),
        ]);

        setPayablesData(payablesRes.data);
        setReceivablesData(receivablesRes.data);
        setForwardsData(forwardsRes.data);
      } catch (error) {
        console.error("Error fetching exposure data:", error);
      }
    };
    fetchData();
  }, []);

  const rolloversData = [
    { label: 'Total Rollovers:', value: '5' },
    { label: 'USD Rollovers:', value: '3' },
    { label: 'EUR Rollovers:', value: '2' },
    { label: 'JPY Rollovers:', value: '1' },
  ];



  return (
    <div className="grid grid-cols-4 gap-x-6">
      {/* Total Payables Card - Enhanced with Scroll */}
      <div className="bg-gradient-to-br from-[#bdf6e1] to-[#90cbb5] border border-primary-lt rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden max-h-[500px] flex flex-col">
        {/* Complex Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="payables-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#3b82f6" fillOpacity="0.3" />
                <circle cx="40" cy="20" r="1" fill="#3b82f6" fillOpacity="0.3" />
                <circle cx="20" cy="40" r="1" fill="#3b82f6" fillOpacity="0.3" />
                <circle cx="40" cy="40" r="1" fill="#3b82f6" fillOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#payables-pattern)" />
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-12 h-12 bg-primary-xl rounded-xl flex items-center justify-center group-hover:bg-primary-lg transition-colors shadow-inner">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div className='text-left'>
              <span className="text-slate-600 text-lg font-semibold">Total Payables</span>
              <div className="text-sm font-medium text-primary">Outstanding liabilities</div>
            </div>
          </div>
          <div className="flex justify-center my-2">
            <span className="inline-flex text-4xl font-bold text-primary bg-white/30 px-8 py-2 rounded-xl shadow-lg">
              {formatCurrency(totalPayables)}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto mt-2 pr-2 custom-scrollbar">
            <div className="space-y-1">
              {payablesData.map((item, _) => (
                <div key={item.currency} className="flex justify-between items-center py-1 px-3 bg-white/70 rounded-lg hover:bg-white/50 transition-colors shadow-sm">
                  <span className="text-slate-600 text-md font-medium flex items-center">
                    <span className="w-3 h-3 bg-primary-lt rounded-full mr-2"></span>
                    {item.currency}
                  </span>
                  <span className="text-slate-700 text-md font-semibold bg-primary-lg px-2 py-1 rounded text-center" style={{ width: '6.5rem', display: 'inline-block' }}>
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Total Receivables Card - Enhanced with Scroll */}
      <div className="bg-gradient-to-br from-[#93DA97] to-green-600 border border-green-400 rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden h-[500px] flex flex-col">
        {/* Diagonal Stripe Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="receivables-pattern" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="20" stroke="#f97316" strokeWidth="1" strokeOpacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#receivables-pattern)" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-12 h-12 bg-[#06923E4D] rounded-xl flex items-center justify-center group-hover:bg-[#06923E8C] transition-colors shadow-inner">
              <TrendingUp className="w-6 h-6 text-green-700" />
            </div>
            <div className='text-left'>
              <span className="text-slate-600 text-lg font-semibold">Total Receivables</span>
              <div className="text-sm font-medium text-green-700">Expected income</div>
            </div>
          </div>
          <div className="flex justify-center my-2">
            <span className="inline-flex text-4xl font-bold text-green-600 bg-white/30 px-8 py-2 rounded-xl shadow-lg">
              {formatCurrency(totalReceivables)}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto mt-2 pr-2 custom-scrollbar">
            <div className="space-y-1">
              {receivablesData.map((item, _) => (
                <div key={item.currency} className="flex justify-between items-center py-1 px-3 bg-white/70 rounded-lg hover:bg-[#b9e6cbd0] transition-colors shadow-sm">
                  <span className="text-slate-700 text-md font-medium flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    {item.currency}
                  </span>
                  <span className="text-slate-700 text-md font-semibold bg-green-400 px-2 py-1 rounded text-center" style={{ width: '6.5rem', display: 'inline-block' }}>
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#A3DC9A] to-[#4A9782] border border-teal-400 rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden h-[500px] flex flex-col">
        {/* Wave Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="forwards-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20 Q10 10 20 20 T40 20" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.3" fill="none" />
                <path d="M0 30 Q10 20 20 30 T40 30" stroke="#8b5cf6" strokeWidth="1" strokeOpacity="0.3" fill="none" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#forwards-pattern)" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#7ac295] rounded-xl flex items-center justify-center group-hover:bg-[#4A97823D] transition-colors shadow-inner">
              <Building2 className="w-6 h-6 text-teal-600" />
            </div>
            <div className='text-left'>
              <span className="text-slate-600 text-lg font-semibold">Bank Wise Forwards</span>
              <div className="text-sm font-medium text-teal-700">Active Positions by Counterparty</div>
            </div>
          </div>
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto pr-2 mt-2 custom-scrollbar">
            <div className="space-y-3">
              {forwardsData.map((bank, index) => (
                <div 
                  key={index} 
                  className="bg-white/30 backdrop-blur-sm border border-teal-200/50 rounded-lg py-6 px-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="text-md font-semibold text-slate-600 mb-2 pb-1 border-b border-teal-200/30 flex items-center">
                    <div className="w-3 h-3 bg-teal-400 rounded-full mr-2"></div>
                    {bank.bank}
                  </div>
                  <div className="space-y-1">
                    {bank.trades.map((trade, tradeIndex) => (
                      <div 
                        key={tradeIndex} 
                        className="flex justify-between items-center py-1 px-2 bg-white/50 rounded hover:bg-white/70 transition-colors"
                      >
                        <span className="text-sm font-semibold text-slate-700">{trade}</span>
                        <span className="text-md font-semibold text-[#2d6341] bg-white/50 px-2 py-0.5 rounded" style={{ width: '6rem', display: 'inline-block' }}>
                          {bank.amounts[tradeIndex]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Forward Rollovers Card - Enhanced with Scroll */}
      <div className="bg-gradient-to-br from-emerald-200 to-teal-200 border border-emerald-200 rounded-xl p-6 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden h-[500px] flex flex-col">
        {/* Dot Grid Background */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="rollovers-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="#10b981" fillOpacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#rollovers-pattern)" />
          </svg>
        </div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors shadow-inner">
              <RotateCcw className="w-6 h-6 text-emerald-600" />
            </div>
            <div className='text-left'>
              <span className="text-slate-600 text-lg font-semibold">Forward Rollovers</span>
              <div className="text-sm font-medium text-emerald-500">For Current Period (YTD)</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 mt-2 custom-scrollbar">
            <div className="space-y-1">
              {rolloversData.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-1 px-3 bg-white/70 rounded-lg hover:bg-white transition-colors shadow-sm">
                  <span className="text-slate-700 text-sm font-semibold flex items-center">
                    {index === 0 ? (
                      <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                    ) : (
                      <span className="w-3 h-3 bg-emerald-300 rounded-full mr-2"></span>
                    )}
                    {item.label}
                  </span>
                  <span className={`text-md font-semibold ${
                    index === 0 ? 'text-white bg-emerald-400 text-base' : 'text-slate-800 bg-emerald-200'
                  } px-2 py-0.5 rounded`} style={{ width: '4rem', display: 'inline-block' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default FinancialDashboard;