import React from 'react';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import type { ChartType } from '../types/dashboard';
import type { FinanceEntry } from '../types/finance';

interface PlacedChartProps {
  id: string;
  chartType: ChartType;
  metric: 'sales' | 'revenue' | 'profit' | 'expenses';
  data: FinanceEntry[];
  title: string;
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void;
}

const PlacedChart: React.FC<PlacedChartProps> = ({
  id,
  chartType,
  metric,
  data,
  title,
  onRemove,
  onEdit
}) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this chart?')) {
      onRemove(id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    }
  };

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">
      {/* Draggable Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-move">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
          <h4 className="font-medium text-gray-800 truncate text-sm">
            {title}
          </h4>
        </div>
        
        <div className="flex items-center gap-1 no-drag">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit chart"
              aria-label="Edit chart"
            >
              <Edit size={14} />
            </button>
          )}
          <button
            onClick={handleRemove}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Remove chart"
            aria-label="Remove chart"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 p-3 chart-content overflow-hidden">
        {data.length > 0 ? (
          <div className="w-full h-full">
            <ChartRenderer
              chartType={chartType}
              data={data}
              metric={metric}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Info Footer */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 no-drag">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="capitalize">{chartType} Chart</span>
          <span>{data.length} records</span>
        </div>
      </div>
    </div>
  );
};

export default PlacedChart;