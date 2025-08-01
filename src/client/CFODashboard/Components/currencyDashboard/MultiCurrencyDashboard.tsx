import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Euro, PoundSterling } from 'lucide-react';

// --- ChartArea ---
const ChartArea: React.FC = () => {
  const curvePoints = useMemo(() => {
    const points: string[] = [];
    const width = 400;
    const height = 80;
    const numPoints = 50;
    
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * width;
      const y = height - (Math.sin(i * 0.3) * 15 + Math.sin(i * 0.15) * 10 + Math.cos(i * 0.25) * 8 + 30);
      points.push(`${x},${y}`);
    }
    
    return points.join(' ');
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
      {/* <svg width="100%" height="100%" className="absolute bottom-0">
        <defs>
          <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
          </linearGradient>
        </defs>
        
        <polygon
          points={`0,80 ${curvePoints} 400,80`}
          fill="url(#curveGradient)"
        />
        
        <polyline
          points={curvePoints}
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
      </svg> */}
    </div>
  );
};

// --- Types ---
export interface ExchangeRates {
  [key: string]: number;
}

export interface CurrencyAccount {
  currency: string;
  amount: number;
  color: string;
}

const currencyAccounts: CurrencyAccount[] = [
  { currency: 'USD', amount: 2500000, color: 'bg-green-500' },
  { currency: 'EUR', amount: 850000, color: 'bg-blue-500' },
  { currency: 'GBP', amount: 450000, color: 'bg-purple-500' },
  { currency: 'JPY', amount: 125000000, color: 'bg-red-500' },
  { currency: 'INR', amount: 15000000, color: 'bg-orange-500' },
  { currency: 'CAD', amount: 1200000, color: 'bg-indigo-500' },
  { currency: 'AUD', amount: 950000, color: 'bg-yellow-500' },
  { currency: 'CHF', amount: 750000, color: 'bg-pink-500' }
];

// --- TotalBalance ---
interface TotalBalanceProps {
  baseCurrency: string;
  exchangeRates: ExchangeRates;
  accounts: CurrencyAccount[];
}

const TotalBalance: React.FC<TotalBalanceProps> = ({
  baseCurrency,
  exchangeRates,
  accounts,
}) => {
  const calculateTotal = (): number => {
    return accounts.reduce((total, account) => {
      const baseRate = exchangeRates[baseCurrency];
      const accountRate = exchangeRates[account.currency];
      return total + (account.amount / accountRate) * baseRate;
    }, 0);
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalAmount = calculateTotal();
  const monthlyGrowth = 12.45;

  return (
    <div className="relative z-10 mb-6">
      <div className="flex items-center justify-between mx-2 mb-2">
        <span className="text-4xl font-bold font-mono min-w-[12ch] text-left">
          {formatCurrency(totalAmount, baseCurrency)}
        </span>
        <div className=" flex items-center gap-1 text-sm bg-green-500 px-1 py-1 rounded-full">
          <span className="text-green-100 text-sm font-bold">+{monthlyGrowth}%</span>
          <TrendingUp className="w-4 h-4 text-green-200" />
        </div>
      </div>
      <p className="text-white text-sm relative top-4">
        Converted to {baseCurrency} • Last updated: Now
      </p>
    </div>
  );
};

// --- CurrencyAccountItem ---
interface CurrencyAccountItemProps {
  account: CurrencyAccount;
  baseCurrency: string;
  exchangeRates: ExchangeRates;
  accounts: CurrencyAccount[];
}

const CurrencyAccountItem: React.FC<CurrencyAccountItemProps> = ({
  account,
  baseCurrency,
  exchangeRates,
  accounts,
}) => {
  const convertToBase = (amount: number, fromCurrency: string): number => {
    return (amount / exchangeRates[fromCurrency]) * exchangeRates[baseCurrency];
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotal = (): number => {
    return accounts.reduce((total, acc) => {
      const baseRate = exchangeRates[baseCurrency];
      const accountRate = exchangeRates[acc.currency];
      return total + (acc.amount / accountRate) * baseRate;
    }, 0);
  };

  const convertedAmount = convertToBase(account.amount, account.currency);
  const percentage = ((convertedAmount / calculateTotal()) * 100).toFixed(1);

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'USD':
      case 'CAD':
      case 'AUD':
        return <DollarSign className="w-4 h-4" />;
      case 'EUR':
        return <Euro className="w-4 h-4" />;
      case 'GBP':
        return <PoundSterling className="w-4 h-4" />;
      default:
        return <span className="text-xs font-bold">{currency}</span>;
    }
  };

  return (
    <div
      className="flex items-center text-secondary-text-dark bg-secondary-color-lt justify-between p-3 hover:bg-primary-lg rounded-lg transition-colors relative border-b border-border-secondary border-opacity-5 last:border-b-0"
      style={{ minHeight: '60px' }}
    >
      <div className="flex items-center gap-3 relative z-10">
        <div className={`w-3 h-3 rounded-full ${account.color} ring-1 ring-white ring-opacity-20`}></div>
        <div className="flex  items-center gap-2">
          {getCurrencyIcon(account.currency)}
          <span className="font-medium ">{account.currency}</span>
        </div>
        <span className="text-primary-lt font-semibold">
          {formatCurrency(account.amount, account.currency)}
        </span>
      </div>
      <div className="text-right relative z-10 ">
        <div className="text-sm text-primary-lt font-semibold">
          {formatCurrency(convertedAmount, baseCurrency)}
        </div>
        <div className="text-xs text-primary-lt font-semibold">
          {percentage}%
        </div>
      </div>
    </div>
  );
};

// --- CurrencyAccountsList ---
interface CurrencyAccountsListProps {
  baseCurrency: string;
  exchangeRates: ExchangeRates;
  accounts: CurrencyAccount[];
  onCurrencyChange: (currency: string) => void;
}

const CurrencyAccountsList: React.FC<CurrencyAccountsListProps> = ({
  baseCurrency,
  exchangeRates,
  accounts,
  // onCurrencyChange,
}) => {
  return (
    <div className="relative z-10 mb-4">
      <div className="bg-secondary-color-lt rounded-xl p-4 backdrop-blur-sm relative overflow-hidden">
        <div className="flex justify-between items-center mb-3 relative z-10">
          <h3 className="text-sm font-medium text-primary">Currency Breakdown</h3>
          <span className="text-xs text-primary font-mono">{accounts.length} currencies</span>
        </div>

        <div
          className="space-y-2 relative z-10 overflow-y-auto"
          style={{
            height: `${4 * 60}px`,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.3) ',
          }}
        >
          {accounts.map((account) => (
            <CurrencyAccountItem
              key={account.currency}
              account={account}
              baseCurrency={baseCurrency}
              exchangeRates={exchangeRates}
              accounts={accounts}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MultiCurrencyDashboard ---
const MultiCurrencyDashboard: React.FC = () => {
  const [exchangeRates] = useState<ExchangeRates>({
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    CHF: 0.92,
    INR: 74.5,
  });

  const [baseCurrency, setBaseCurrency] = useState<string>('USD');

  return (
    <div className="w-full bg-gradient-to-br from-[#06923E] to-[#67AE6E] rounded-2xl p-6 text-white relative overflow-hidden
      transition duration-200 ease-in-out
      hover:shadow-lg hover:scale-[1.02] hover:bg-opacity-90"
    >      {/* Background Grid */}
      <div className="absolute inset-0 opacity-50">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="mainGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
            </pattern>
            <pattern id="fineGrid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="white" strokeWidth="0.15" opacity="0.3" />
            </pattern>
            <pattern id="diagonalGrid" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <path d="M 0 8 L 16 8" fill="none" stroke="white" strokeWidth="0.1" opacity="0.2" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#fineGrid)" />
          <rect width="100%" height="100%" fill="url(#mainGrid)" />
          <rect width="100%" height="100%" fill="url(#diagonalGrid)" />
        </svg>
      </div>

      {/* Currency Header */}
      <div className="flex justify-between items-start mx-2 mb-6 relative z-10">
        <div className="flex flex-col items-start">
          <h2 className="text-xl font-semibold">Total Company Assets</h2>
          <p className="text-white text-sm mt-1">Multi-Currency Portfolio</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
            className="bg-white/30 backdrop-blur-sm rounded-xl border border-white/30 shadow-sm flex items-center justify-center text-white bg-opacity-20  px-3 py-1 text-sm outline-none"
          >
            {Object.keys(exchangeRates).map((currency) => (
              <option key={currency} value={currency} className="text-gray-800">
                {currency}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TotalBalance baseCurrency={baseCurrency} exchangeRates={exchangeRates} accounts={currencyAccounts} />

      <CurrencyAccountsList
        baseCurrency={baseCurrency}
        exchangeRates={exchangeRates}
        accounts={currencyAccounts}
        onCurrencyChange={setBaseCurrency}
      />

      <ChartArea />
    </div>
  );
};

export default MultiCurrencyDashboard;