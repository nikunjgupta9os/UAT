import { useState, useMemo } from 'react';
import { financeData } from '../../data/financeData';
import type { FinanceEntry } from '../../types/finance';
import InputPanel from './InputPanel';
import ChartToolbar from './ChartToolbar';
import StatsSummary from './StatsSummary';
import ChartRenderer from './ChartRenderer';
// import ChartCanvas from './ChartCanvas';
// import ChartBuilderPanel from './ChartBuilderPanel';
import { Filter } from 'lucide-react';

import { profileFinanceData } from './dataProfiler';
import { chartMetadata } from './chartMetadata';
import type { ChartType } from './chartMetadata';

// import { useDashboardStore } from './useDashboardStore';

const DashboardDemo = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartType>('line');
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'revenue' | 'profit' | 'expenses'>('sales');
  const [dateRange, setDateRange] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // const { charts, addChart, updateLayout, removeChart, reset } = useDashboardStore();

  const filteredData: FinanceEntry[] = useMemo(() => {
    let filtered = [...financeData];
    if (categoryFilter !== 'all') filtered = filtered.filter(item => item.category === categoryFilter);
    if (regionFilter !== 'all') filtered = filtered.filter(item => item.region === regionFilter);
    if (dateRange !== 'all') {
      const take = dateRange === '6m' ? 6 : 3;
      filtered = filtered.slice(-take);
    }
    return filtered;
  }, [categoryFilter, regionFilter, dateRange]);

  const chartSuitability: Record<ChartType, boolean> = useMemo(() => {
    const profile = profileFinanceData(filteredData);
    const suitabilityMap: Record<ChartType, boolean> = {} as Record<ChartType, boolean>;

    Object.keys(chartMetadata).forEach((type) => {
      const chartType = type as ChartType;
      suitabilityMap[chartType] = chartMetadata[chartType].isSuitable(profile);
    });

    return suitabilityMap;
  }, [filteredData]);

  const categories = [...new Set(financeData.map(item => item.category))];
  const regions = [...new Set(financeData.map(item => item.region))];

  return (
    <div className="w-full h-full mr-3 p-4 pb-6 border-2 border-primary-lg text-white rounded-lg">
      {/* Top Toolbar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            className="px-4 py-2 bg-primary-lt text-white rounded flex items-center gap-2 hover:bg-primary transition"
          >
            <Filter size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <InputPanel
          selectedMetric={selectedMetric}
          setSelectedMetric={setSelectedMetric}
          dateRange={dateRange}
          setDateRange={setDateRange}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
          categories={categories}
          regions={regions}
        />
      )}

      <StatsSummary data={filteredData} selectedMetric={selectedMetric} />

      <ChartToolbar
        activeChart={activeChart}
        setActiveChart={setActiveChart}
        chartSuitability={chartSuitability}
      />

      <ChartRenderer
        chartType={activeChart}
        data={filteredData}
        metric={selectedMetric}
      />
    </div>
  );
};

export default DashboardDemo;
