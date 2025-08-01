import { useState, useMemo } from 'react';
import { financeData } from '../data/financeData';
import type { FinanceEntry } from '../types/finance';
import InputPanel from './InputPanel';
import ChartToolbar from './ChartToolbar';
import ChartRenderer from './ChartRenderer';
import ChartCanvas from './ChartCanvas';
import ChartBuilderPanel from './ChartBuilderPanel';
import { Filter, Plus, Trash2, Download, Settings } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { ChartType } from '../types/dashboard';

import { profileFinanceData } from './dataProfiler';
import { chartMetadata } from '../types/chartMetadata';

import { useDashboardStore } from './useDashboardStore';

const DraggableDashboardBuilder = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeChart, setActiveChart] = useState<ChartType>('line');
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'revenue' | 'profit' | 'expenses'>('sales');
  const [dateRange, setDateRange] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(true);
  
  const { charts, addChart, updateLayout, removeChart, reset, updateChartTitle } = useDashboardStore();

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

  const handleDownload = async () => {
    try {
      const layoutElement = document.querySelector('.react-grid-layout') as HTMLElement | null;
      if (!layoutElement) {
        throw new Error('Dashboard layout not found');
      }

      const canvas = await html2canvas(layoutElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `dashboard-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating download:', error);
      alert('Unable to download dashboard. Please try again.');
    }
  };

  const handleReset = () => {
    if (charts.length > 0 && confirm('Are you sure you want to clear all charts? This action cannot be undone.')) {
      reset();
    }
  };

  return (
    <div className="bg-secondary-color-lt">
      {/* Header */}
      <div className="bg-secondary-color-lt border-y border-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-secondary-text">Dashboard Builder</h1>
              <p className="text-sm text-secondary-text-dark mt-1">
                Create interactive charts and build custom dashboards
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* <button
                onClick={() => setShowFilters(prev => !prev)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  showFilters 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter size={18} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button> */}

              <button
                onClick={() => setShowPreview(prev => !prev)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  showPreview 
                    ? 'bg-primary-lt text-white ' 
                    : 'bg-secondary-color-lt text-secondary-text border border-border hover:bg-primary-xl'
                }`}
              >
                <Settings size={18} />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>

              <button
                onClick={() => setShowBuilder(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Add Chart
              </button>

              {charts.length > 0 && (
                <>
                  {/* <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
                  >
                    <Download size={18} />
                    Export
                  </button> */}

                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-color text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                    Clear All
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto py-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-secondary-color-lt rounded-lg shadow-sm border border-border p-4">
            <h3 className="text-lg font-semibold text-secondary-text mb-4">Data Filters</h3>
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
          </div>
        )}

        {/* Stats Summary */}
        {/* <div className="mb-6">
          <StatsSummary data={filteredData} selectedMetric={selectedMetric} />
        </div> */}

        {/* Chart Preview Section */}
        {showPreview && (
          <div className="mb-6 bg-secondary-color-lt rounded-lg shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold text-secondary-text-dark mb-4">Chart Preview</h3>
            <p className="text-sm text-secondary-text-dark mb-4">
              Preview different chart types with your current data filters before adding to dashboard
            </p>
            
            <ChartToolbar
              activeChart={activeChart}
              setActiveChart={setActiveChart}
              chartSuitability={chartSuitability}
            />

            <div className="mt-4">
              <ChartRenderer
                chartType={activeChart}
                data={filteredData}
                metric={selectedMetric}
              />
            </div>
          </div>
        )}

        {/* Dashboard Canvas */}
        <div className="bg-secondary-color-lt rounded-lg shadow-sm border border-primary p-6">
          <ChartCanvas
            charts={charts}
            onLayoutChange={updateLayout}
            onRemoveChart={removeChart}
            onEditChart={(id) => {
              const chart = charts.find(c => c.id === id);
              const newTitle = prompt('Enter new title:', chart?.title || '');
              if (newTitle !== null && newTitle.trim() !== '') {
                updateChartTitle(id, newTitle.trim());
              }
            }}
          />
        </div>
      </div>

      {/* Chart Builder Panel (Sliding Sidebar) */}
      {showBuilder && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-opacity-50 z-40 transition-opacity"
            onClick={() => setShowBuilder(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full z-50 transform transition-transform">
            <ChartBuilderPanel
              existingCharts={charts}
              onAddChart={(chart) => {
                addChart(chart);
                setShowBuilder(false);
              }}
              onClose={() => setShowBuilder(false)}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DraggableDashboardBuilder;