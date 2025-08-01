// components/DraggableDashboard/PlacedChart.tsx

import React from 'react';
import ChartRenderer from './ChartRenderer';
import type { ChartType } from './chartMetadata';
import type { FinanceEntry } from '../../types/finance';

interface PlacedChartProps {
  id: string;
  title?: string;
  chartType: ChartType;
  metric: string;
  data: FinanceEntry[];
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const PlacedChart: React.FC<PlacedChartProps> = ({
  id,
  title,
  chartType,
  metric,
  data,
  onEdit,
  onRemove
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md h-full w-full flex flex-col overflow-hidden border border-gray-200">
      {/* Header with title and optional actions */}
      <div className="flex items-center justify-between bg-blue-100 px-4 py-2 border-b border-gray-300">
        <h2 className="text-sm font-medium text-gray-800 truncate">{title || chartType.toUpperCase()}</h2>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          {onEdit && (
            <button onClick={() => onEdit(id)} title="Edit" className="hover:text-blue-600">✏️</button>
          )}
          {onRemove && (
            <button onClick={() => onRemove(id)} title="Remove" className="hover:text-red-600">🗑️</button>
          )}
        </div>
      </div>

      {/* Chart Body */}
      <div className="flex-grow">
        <ChartRenderer chartType={chartType} data={data} metric={metric as any} />
      </div>
    </div>
  );
};

export default PlacedChart;
