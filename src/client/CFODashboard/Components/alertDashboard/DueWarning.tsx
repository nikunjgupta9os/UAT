import React, { useState, useMemo } from 'react';
import { AlertTriangle, DollarSign, TrendingDown, Clock, CreditCard, FileText, AlertCircle, X } from 'lucide-react';

export interface FinanceEntry {
  month: string;
  sales: number;
  revenue: number;
  profit: number;
  expenses: number;
  cashInBank: number;
  burnRate: number;
  dueAmount: number;
  poDueDate: string; // ISO string format
  region: string;
  id?: string;
}

interface Warning {
  id: string;
  type: 'Critical' | 'Warning' | 'Info';
  title: string;
  message: string;
  icon: React.ComponentType<any>;
  value?: string;
  action?: string;
  severity: number; // 1-5, higher is more severe
}

interface DueWarningsProps {
  financeData: FinanceEntry[];
  thresholds?: {
    lowCashMultiplier?: number;
    highExpenseRatio?: number;
    criticalDueAmount?: number;
    overdueDays?: number;
  };
}

const DueWarnings: React.FC<DueWarningsProps> = ({ 
  financeData, 
  thresholds = {
    lowCashMultiplier: 2,
    highExpenseRatio: 0.8,
    criticalDueAmount: 10000,
    overdueDays: 7
  }
}) => {
  const [filterType, setFilterType] = useState<'all' | 'Critical' | 'Warning' | 'Info'>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'date'>('severity');
  const [ignoredWarnings, setIgnoredWarnings] = useState<Set<string>>(new Set());

  const allWarnings = useMemo(() => {
    const warningsList: Warning[] = [];
    const today = new Date();

    financeData.forEach((entry, index) => {
      const entryId = entry.id || `entry-${index}`;
      
      // Critical Warning: Cash in bank is critically low
      if (entry.cashInBank < entry.burnRate * thresholds.lowCashMultiplier!) {
        const daysLeft = Math.floor(entry.cashInBank / (entry.burnRate || 1));
        warningsList.push({
          id: `low-cash-${entryId}`,
          type: 'Critical',
          title: 'Critical Cash Flow Alert',
          message: `Cash reserves critically low for ${entry.region}. Only ${daysLeft} days of operating cash remaining.`,
          icon: DollarSign,
          value: `$${entry.cashInBank.toLocaleString()}`,
          action: 'Secure immediate funding',
          severity: 5
        });
      }

      // Critical Warning: Expenses exceeded revenue
      if (entry.expenses > entry.revenue) {
        const deficit = entry.expenses - entry.revenue;
        warningsList.push({
          id: `expense-exceed-${entryId}`,
          type: 'Critical',
          title: 'Revenue Deficit Alert',
          message: `Operating expenses exceed revenue in ${entry.region}. Monthly deficit of $${deficit.toLocaleString()}.`,
          icon: TrendingDown,
          value: `-$${deficit.toLocaleString()}`,
          action: 'Review cost structure',
          severity: 4
        });
      }

      // Warning: Negative profit
      if (entry.profit < 0) {
        warningsList.push({
          id: `negative-profit-${entryId}`,
          type: 'Warning',
          title: 'Negative Profit Margin',
          message: `${entry.region} showing negative profit for ${entry.month}.`,
          icon: TrendingDown,
          value: `$${entry.profit.toLocaleString()}`,
          action: 'Analyze profit drivers',
          severity: 3
        });
      }

      // Warning: High pending dues
      if (entry.dueAmount > thresholds.criticalDueAmount!) {
        warningsList.push({
          id: `high-dues-${entryId}`,
          type: 'Warning',
          title: 'Outstanding Vendor Payments',
          message: `High pending vendor payments in ${entry.region}.`,
          icon: CreditCard,
          value: `$${entry.dueAmount.toLocaleString()}`,
          action: 'Schedule payments',
          severity: 3
        });
      }

      // Critical Warning: Overdue purchase orders
      const poDueDate = new Date(entry.poDueDate);
      const daysPastDue = Math.floor((today.getTime() - poDueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysPastDue > 0) {
        const severity = daysPastDue > thresholds.overdueDays! ? 4 : 3;
        warningsList.push({
          id: `overdue-po-${entryId}`,
          type: daysPastDue > thresholds.overdueDays! ? 'Critical' : 'Warning',
          title: 'Overdue Purchase Orders',
          message: `Purchase orders overdue by ${daysPastDue} days in ${entry.region}.`,
          icon: Clock,
          value: `${daysPastDue} days`,
          action: 'Contact vendors immediately',
          severity
        });
      }

      // Info: High expense ratio
      const expenseRatio = entry.revenue > 0 ? entry.expenses / entry.revenue : 1;
      if (expenseRatio > thresholds.highExpenseRatio! && expenseRatio <= 1) {
        warningsList.push({
          id: `high-expense-ratio-${entryId}`,
          type: 'Info',
          title: 'High Expense Ratio',
          message: `Expense ratio at ${(expenseRatio * 100).toFixed(1)}% in ${entry.region}.`,
          icon: FileText,
          value: `${(expenseRatio * 100).toFixed(1)}%`,
          action: 'Monitor expenses',
          severity: 2
        });
      }

      // Info: Low cash buffer (but not critical)
      if (entry.cashInBank >= entry.burnRate * thresholds.lowCashMultiplier! && 
          entry.cashInBank < entry.burnRate * 4) {
        const daysLeft = Math.floor(entry.cashInBank / (entry.burnRate || 1));
        warningsList.push({
          id: `low-cash-buffer-${entryId}`,
          type: 'Info',
          title: 'Low Cash Buffer',
          message: `Cash buffer below recommended levels in ${entry.region}. ${daysLeft} days remaining.`,
          icon: DollarSign,
          value: `${daysLeft} days`,
          action: 'Plan cash flow',
          severity: 2
        });
      }
    });

    return warningsList;
  }, [financeData, thresholds]);

  const filteredWarnings = useMemo(() => {
    // Filter out ignored warnings first
    const activeWarnings = allWarnings.filter(warning => !ignoredWarnings.has(warning.id));
    
    // Sort warnings
    const sorted = activeWarnings.sort((a, b) => {
      if (sortBy === 'severity') {
        return b.severity - a.severity;
      }
      return a.title.localeCompare(b.title);
    });

    // Filter warnings by type
    if (filterType === 'all') return sorted;
    return sorted.filter(warning => warning.type === filterType);
  }, [allWarnings, ignoredWarnings, filterType, sortBy]);

  // Calculate counts from all warnings (not just filtered ones)
  const activeWarnings = allWarnings.filter(warning => !ignoredWarnings.has(warning.id));
  const criticalCount = activeWarnings.filter(w => w.type === 'Critical').length;
  const warningCount = activeWarnings.filter(w => w.type === 'Warning').length;
  const infoCount = activeWarnings.filter(w => w.type === 'Info').length;

  const handleIgnoreWarning = (warningId: string) => {
    setIgnoredWarnings(prev => new Set([...prev, warningId]));
  };

  const getWarningStyles = (type: Warning['type']) => {
    switch (type) {
      case 'Critical':
        return 'border-red-500 bg-red-50 text-red-900';
      case 'Warning':
        return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'Info':
        return 'border-blue-500 bg-blue-50 text-blue-900';
      default:
        return 'border-gray-300 bg-gray-50 text-gray-900';
    }
  };

  const getIconStyles = (type: Warning['type']) => {
    switch (type) {
      case 'Critical':
        return 'text-red-600';
      case 'Warning':
        return 'text-yellow-600';
      case 'Info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="w-full border-2 border-border rounded-xl p-4 bg-secondary-color-lt h-[400px] flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-secondary-text mb-2 flex items-center gap-2">
          <AlertTriangle className="text-red-color h-5 w-5" />
          Financial Risk Dashboard
        </h2>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
        <div className="flex gap-1">
          {(['all', 'Critical', 'Warning', 'Info'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === type
                  ? 'bg-primary text-white'
                  : 'bg-primary-xl text-secondary-text hover:bg-primary-lg border border-primary-lg'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type !== 'all' && ` (${type === 'Critical' ? criticalCount : type === 'Warning' ? warningCount : infoCount})`}
            </button>
          ))}
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'severity' | 'date')}
          className="px-2 bg-secondary-color-lt text-secondary-text py-1 border border-primary-lg focus:outline-none rounded-md text-xs"
        >
          <option value="severity">Sort by Severity</option>
          <option value="date">Sort by Title</option>
        </select>
      </div>

      {/* Warnings List - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
        {filteredWarnings.length === 0 ? (
          <div className="text-center py-8 bg-green-50 border border-green-200 rounded-lg">
            <AlertCircle className="mx-auto h-10 w-10 text-green-600 mb-3" />
            <h3 className="text-base font-medium text-green-900 mb-1">All Clear!</h3>
            <p className="text-sm text-green-700">No financial risks detected in your current data.</p>
          </div>
        ) : (
          filteredWarnings.map((warning) => {
            const IconComponent = warning.icon;
            return (
              <div
                key={warning.id}
                className={`border-l-4 rounded-lg p-3 ${getWarningStyles(warning.type)} relative`}
              >
                <button
                  onClick={() => handleIgnoreWarning(warning.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 hover:bg-opacity-10 transition-colors"
                  title="Ignore this warning"
                >
                  <X className="h-4 w-4 opacity-60 hover:opacity-100" />
                </button>
                
                <div className="flex items-start justify-between pr-6">
                  <div className="flex items-start gap-2">
                    <IconComponent className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getIconStyles(warning.type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{warning.title}</h3>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          warning.type === 'Critical' 
                            ? 'bg-red-100 text-red-700' 
                            : warning.type === 'Warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {warning.type}
                        </span>
                      </div>
                      <p className="text-xs mb-2">{warning.message}</p>
                    </div>
                  </div>
                  {warning.value && (
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm">{warning.value}</div>
                      <div className="text-xs opacity-75">
                        {warning.severity}/5
                      </div>
                      {warning.action && (
                        <div className='mt-2'>
                          <p className="text-xs font-medium opacity-75">
                            Action: {warning.action}
                          </p>
                          </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filteredWarnings.length > 0 && (
        <div className="mt-4 p-3 bg-primary-xl border border-primary-lg rounded-lg flex-shrink-0">
          <p className="text-xs text-secondary-text-dark">
            <strong>Note:</strong> These alerts are generated based on your financial data. 
            Click the × to ignore warnings you've addressed.
          </p>
        </div>
      )}
    </div>
  );
};

// Example usage component
const AlertDashboard: React.FC = () => {
  const sampleData: FinanceEntry[] = [
    {
      id: '1',
      month: 'January 2025',
      sales: 150000,
      revenue: 145000,
      profit: 15000,
      expenses: 130000,
      cashInBank: 25000,
      burnRate: 15000,
      dueAmount: 12000,
      poDueDate: '2025-06-10', // Overdue
      region: 'North America'
    },
    {
      id: '2',
      month: 'January 2025',
      sales: 80000,
      revenue: 75000,
      profit: -5000,
      expenses: 80000,
      cashInBank: 8000,
      burnRate: 12000,
      dueAmount: 5000,
      poDueDate: '2025-06-25', // Not yet due
      region: 'Europe'
    },
    {
      id: '3',
      month: 'January 2025',
      sales: 200000,
      revenue: 195000,
      profit: 45000,
      expenses: 150000,
      cashInBank: 120000,
      burnRate: 18000,
      dueAmount: 3000,
      poDueDate: '2025-06-30',
      region: 'Asia Pacific'
    }
  ];

  return (
    <DueWarnings 
      financeData={sampleData}
      thresholds={{
        lowCashMultiplier: 2,
        highExpenseRatio: 0.85,
        criticalDueAmount: 10000,
        overdueDays: 7
      }}
    />
  );
};

export default AlertDashboard;