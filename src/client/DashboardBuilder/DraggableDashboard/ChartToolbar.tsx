import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  ScatterChart,
  Radar,
  TreesIcon,
  Workflow,
  Gauge,
  CircleDot,
} from 'lucide-react';
import React from 'react';

export type ChartType =
  | 'line'
  | 'bar'
  | 'area'
  | 'pie'
  | 'scatter'
  | 'radar'
  | 'funnel'
  | 'treemap'
  | 'sankey'
  | 'radialBar';

interface ChartToolbarProps {
  activeChart: ChartType;
  setActiveChart: React.Dispatch<React.SetStateAction<ChartType>>;
  chartSuitability?: Record<ChartType, boolean>; // Optional: for highlighting/fading in future
}

const chartTypes: {
  id: ChartType;
  label: string;
  icon: React.FC<{ size?: number }>;
}[] = [
  { id: 'line', label: 'Line', icon: TrendingUp },
  { id: 'bar', label: 'Bar', icon: BarChart3 },
  { id: 'area', label: 'Area', icon: Activity },
  { id: 'pie', label: 'Pie', icon: PieChart },
  { id: 'scatter', label: 'Scatter', icon: ScatterChart },
  { id: 'radar', label: 'Radar', icon: Radar },
  { id: 'funnel', label: 'Funnel', icon: Workflow },
  { id: 'treemap', label: 'Treemap', icon: TreesIcon },
  { id: 'sankey', label: 'Sankey', icon: Gauge },
  { id: 'radialBar', label: 'Radial Bar', icon: CircleDot },
];

const ChartToolbar: React.FC<ChartToolbarProps> = ({ activeChart, setActiveChart, chartSuitability }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-4 mx-auto mt-10 justify-center">
      {chartTypes.map(({ id, label, icon: Icon }) => {
        const isActive = activeChart === id;
        const isSuitable = chartSuitability ? chartSuitability[id] : true;

        return (
          <button
            key={id}
            onClick={() => isSuitable && setActiveChart(id)}
            disabled={!isSuitable}
            className={`flex items-center gap-2 border-primary-lg px-4 py-2 rounded-md border transition ${
              isActive
                ? 'bg-primary-lt text-white '
                : isSuitable
                ? 'bg-primary-xl text-secondary-text-dark hover:bg-primary-lt hover:text-white'
                : 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed'
            }`}
          >
            <Icon size={18} /> {label}
          </button>
        );
      })}
    </div>
  );
};

export default ChartToolbar;
