import React from 'react';

type MetricType = 'sales' | 'revenue' | 'profit' | 'expenses';

interface InputPanelProps {
  selectedMetric: MetricType;
  setSelectedMetric: React.Dispatch<React.SetStateAction<MetricType>>;
  dateRange: string;
  setDateRange: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  regionFilter: string;
  setRegionFilter: (value: string) => void;
  categories: string[];
  regions: string[];
}

const InputPanel: React.FC<InputPanelProps> = ({
  selectedMetric, setSelectedMetric,
  dateRange, setDateRange,
  categoryFilter, setCategoryFilter,
  regionFilter, setRegionFilter,
  categories, regions
}) => {
  const metrics = ['revenue', 'cash', 'burn', 'expenses', 'profit', 'loss', 'purchaseOrders', 'sales'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mx-10">
      <select
        value={selectedMetric}
        onChange={e => setSelectedMetric(e.target.value as MetricType)}
        className="p-2 rounded-2xl bg-gray-100 text-black border-2 border-gray-500"
      >
        {metrics.map(metric => (
          <option key={metric} value={metric}>
            {metric}
          </option>
        ))}
      </select>
      <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="p-2 rounded-2xl bg-gray-100 text-black border-2 border-gray-500">
        <option value="all">All Time</option>
        {/* <option value="24m">Last 24 Months</option>
        <option value="12m">Last 12 Months</option>
        <option value="9m">Last 9 Months</option> */}
        <option value="6m">Last 6 Months</option>
        <option value="3m">Last 3 Months</option>
      </select>
      <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="p-2 rounded-2xl bg-gray-100 text-black border-2 border-gray-500">
        <option value="all">All Categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="p-2 rounded-2xl bg-gray-100 text-black border-2 border-gray-500">
        <option value="all">All Regions</option>
        {regions.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  );
};

export default InputPanel;