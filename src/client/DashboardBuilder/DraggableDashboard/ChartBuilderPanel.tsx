import React, { useState, useMemo } from 'react';
import ChartToolbar from './ChartToolbar';
// import InputPanel from './InputPanel';
import { financeData } from '../data/financeData';
import type { ChartType } from '../types/chartMetadata';
import { v4 as uuidv4 } from 'uuid';
import type { DashboardChart } from '../types/dashboard';

interface ChartBuilderPanelProps {
  onAddChart: (chart: DashboardChart) => void;
  onClose: () => void;
  existingCharts?: DashboardChart[];
}

const ChartBuilderPanel: React.FC<ChartBuilderPanelProps> = ({ 
  onAddChart, 
  onClose, 
  existingCharts = [] 
}) => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [metric, setMetric] = useState<'sales' | 'revenue' | 'profit' | 'expenses'>('sales');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [customTitle, setCustomTitle] = useState('');

  const categories = [...new Set(financeData.map(item => item.category))];
  const regions = [...new Set(financeData.map(item => item.region))];

  const filteredData = useMemo(() => {
    let filtered = [...financeData];
    if (categoryFilter !== 'all') filtered = filtered.filter(d => d.category === categoryFilter);
    if (regionFilter !== 'all') filtered = filtered.filter(d => d.region === regionFilter);
    if (dateRange !== 'all') {
      const take = dateRange === '6m' ? 6 : 3;
      filtered = filtered.slice(-take);
    }
    return filtered;
  }, [categoryFilter, regionFilter, dateRange]);

  // Function to find the next available position
  const getNextPosition = (existingCharts: DashboardChart[]) => {
    if (existingCharts.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find the maximum Y position + height
    const maxY = Math.max(...existingCharts.map(chart => (chart.layout?.y || 0) + (chart.layout?.h || 4)));
    
    // Check if there's space in the last row
    const chartsInLastRows = existingCharts.filter(chart => 
      (chart.layout?.y || 0) >= maxY - 4 // Charts that might occupy the last few rows
    );

    let currentX = 0;
    const newChartWidth = 6;
    
    // Sort charts in last rows by x position
    chartsInLastRows.sort((a, b) => (a.layout?.x || 0) - (b.layout?.x || 0));

    for (const chart of chartsInLastRows) {
      const chartX = chart.layout?.x || 0;
      const chartW = chart.layout?.w || 6;
      
      if (chartX >= currentX + newChartWidth) {
        // Found a gap
        return { x: currentX, y: maxY - 4 };
      }
      currentX = Math.max(currentX, chartX + chartW);
    }

    // Check if there's space at the end of the current row
    if (currentX + newChartWidth <= 12) {
      return { x: currentX, y: maxY - 4 };
    }

    // No space in current row, create new row
    return { x: 0, y: maxY };
  };

  const handleAddChart = () => {
    const position = getNextPosition(existingCharts);
    const chartId = uuidv4();
    
    const newChart: DashboardChart = {
      id: chartId,
      chartType,
      metric,
      data: filteredData,
      title: customTitle || `${metric.charAt(0).toUpperCase() + metric.slice(1)} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`,
      layout: {
        i: chartId,
        x: position.x,
        y: position.y,
        w: 6,
        h: 4,
      }
    };
    
    onAddChart(newChart);
    
    // Reset form
    setChartType('line');
    setMetric('sales');
    setCategoryFilter('all');
    setRegionFilter('all');
    setDateRange('all');
    setCustomTitle('');
  };

  const handleClose = () => {
    // Reset form when closing
    setChartType('line');
    setMetric('sales');
    setCategoryFilter('all');
    setRegionFilter('all');
    setDateRange('all');
    setCustomTitle('');
    onClose();
  };

  return (
    <div className="w-[380px] bg-secondary-color-lt h-full shadow-xl flex flex-col border-l border-primary">
      {/* Header */}
      <div className="p-4 border-b border-primary bg-secondary-color">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary">Add New Chart</h2>
          <button
            onClick={handleClose}
            className="text-secondary-text-dark hover:text-primary transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Chart Type Selection */}
        <div>
          <label className="text-sm font-medium block text-secondary-text-dark mb-2">Chart Type</label>
          <ChartToolbar activeChart={chartType} setActiveChart={setChartType} />
        </div>

        {/* Custom Title */}
        <div>
          <label className="text-sm font-medium block text-secondary-text-dark mb-2">
            Chart Title (Optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Enter custom title..."
            className="w-full p-2 border border-border bg-secondary-color-lt rounded-md focus:outline-none text-secondary-text-dark"
          />
          <p className="text-xs text-secondary-text-dark mt-1">
            Leave empty for auto-generated title
          </p>
        </div>

        {/* Metric Selection */}
        <div>
          <label className="text-sm font-medium bg-secondary-color-lt block text-secondary-text-dark mb-2">Metric</label>
          <select
            value={metric}
            onChange={e => setMetric(e.target.value as any)}
            className="w-full p-2 border border-border bg-secondary-color-lt rounded-md focus:outline-none text-secondary-text-dark"
          >
            <option value="sales">Sales</option>
            <option value="revenue">Revenue</option>
            <option value="profit">Profit</option>
            <option value="expenses">Expenses</option>
          </select>
        </div>

        {/* Filters */}
        <div>
          <h3 className="text-sm font-medium text-secondary-text-dark mb-3">Data Filters</h3>
          <div className="space-y-3">
            {/* Date Range */}
            <div>
              <label className="text-xs font-medium block text-secondary-text-dark mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full p-2 text-sm border border-border bg-secondary-color-lt rounded-md focus:outline-none text-secondary-text-dark"
              >
                <option value="all">All Time</option>
                <option value="6m">Last 6 Months</option>
                <option value="3m">Last 3 Months</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-medium block text-secondary-text-dark mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full p-2 text-sm border border-border bg-secondary-color-lt rounded-md focus:outline-none text-secondary-text-dark"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="text-xs font-medium block text-secondary-text-dark mb-1">Region</label>
              <select
                value={regionFilter}
                onChange={e => setRegionFilter(e.target.value)}
                className="w-full p-2 text-sm border border-border bg-secondary-color-lt rounded-md focus:outline-none text-secondary-text-dark"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="bg-secondary-color-lt border border-border p-3 rounded-md">
          <h4 className="text-xs font-medium text-secondary-text-dark mb-2">Data Preview</h4>
          <div className="text-xs text-secondary-text-dark space-y-1">
            <p>• Records: {filteredData.length}</p>
            <p>• Metric: {metric.charAt(0).toUpperCase() + metric.slice(1)}</p>
            <p>• Chart: {chartType.charAt(0).toUpperCase() + chartType.slice(1)}</p>
            {categoryFilter !== 'all' && <p>• Category: {categoryFilter}</p>}
            {regionFilter !== 'all' && <p>• Region: {regionFilter}</p>}
            {dateRange !== 'all' && <p>• Period: {dateRange === '6m' ? 'Last 6 months' : 'Last 3 months'}</p>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-primary bg-secondary-color-lt">
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-primary bg-secondary-color-lt border border-primary rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddChart}
            disabled={filteredData.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Chart
          </button>
        </div>
        {filteredData.length === 0 && (
          <p className="text-xs text-red-500 mt-2 text-center">
            No data available with current filters
          </p>
        )}
      </div>
    </div>
  );
};

export default ChartBuilderPanel;