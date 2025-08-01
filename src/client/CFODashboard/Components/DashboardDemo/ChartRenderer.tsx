import React from 'react';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis,
  Treemap, Cell,
  Tooltip, Legend
} from 'recharts';

import { transformToTreemapData } from './transformers';
import type { FinanceEntry } from '../../types/finance';
import type { ChartType } from './chartMetadata';
import { RadialBarChart, RadialBar, Legend as RLegend } from 'recharts';
import { CartesianGrid } from 'recharts';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB', '#FFCE56'];

type MetricType = 'sales' | 'revenue' | 'profit' | 'expenses';

interface ChartRendererProps {
  chartType: ChartType;
  data: FinanceEntry[];
  metric: MetricType;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartType, data, metric }) => {
  const pieData = data.reduce((acc: Record<string, number>, item) => {
    const category = item.category;
    acc[category] = (acc[category] || 0) + (typeof item[metric] === 'number' ? item[metric] : 0);
    return acc;
  }, {});
  const pieFormatted = Object.entries(pieData).map(([name, value]) => ({ name, value }));

  const radarData = data.map(item => ({
    subject: item.region,
    A: item[metric],
    fullMark: 100000,
  }));

  const scatterData = data.map((item, index) => ({
    x: index,
    y: item[metric],
  }));

  const funnelData = [
    { name: 'Stage 1', value: 5000 },
    { name: 'Stage 2', value: 4000 },
    { name: 'Stage 3', value: 2500 },
    { name: 'Stage 4', value: 1000 }
  ];

  const treemapData = transformToTreemapData(data, metric);

  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="text-secondary-text-dark text-sm flex items-center">
            <span
              className="inline-block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };


  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fill: '#129990CC' }} />
            <YAxis tick={{ fill: '#129990CC' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={metric} stroke="#129990" />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fill: '#129990CC' }} />
            <YAxis tick={{ fill: '#129990CC' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey={metric} fill="#129990B3" />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fill: '#129990CC' }} />
            <YAxis tick={{ fill: '#129990CC' }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={metric} stroke="#129990" fill="#129990B3" />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie data={pieFormatted} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
              {pieFormatted.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart outerRadius={90} data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis />
            <Radar name={metric} dataKey="A" stroke="#129990B3" fill="#129990B3" fillOpacity={0.6} />
            <Legend />
          </RadarChart>
        );

      case 'scatter':
        return (
          <ScatterChart>
            <XAxis type="number" dataKey="x" name="Index" tick={{ fill: '#129990CC' }} />
            <YAxis type="number" dataKey="y" name={metric} tick={{ fill: '#129990CC' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name={metric} data={scatterData} fill="#129990" />
          </ScatterChart>
        );

      case 'treemap':
        return (
          <Treemap
            width={730}
            height={400}
            data={treemapData.children}
            dataKey="value"
            nameKey="name"
            stroke="#fff"
            fill="#129990"
          />
        );

      case 'funnel':
        return (
          <BarChart data={funnelData} layout="vertical">
            <XAxis type="number" tick={{ fill: '#129990CC' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#129990CC' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#129990B3" />
          </BarChart>
        );

      case 'radialBar':
        const radialData = data.reduce((acc: Record<string, number>, item) => {
          const key = item.category;
          acc[key] = (acc[key] || 0) + (typeof item[metric] === 'number' ? item[metric] : 0);
          return acc;
        }, {});
        const radialFormatted = Object.entries(radialData).map(([name, value]) => ({ name, value }));

        return (
          <RadialBarChart
            width={500}
            height={300}
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="90%"
            barSize={15}
            data={radialFormatted}
          >
            <RadialBar
              dataKey="value"
              fill="#129990B3"
              label={{ position: 'insideStart', fill: '#ffffff' }}
            />
            <RLegend
              iconSize={10}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              content={renderCustomLegend}
            />
            <Tooltip />
          </RadialBarChart>
        );



      default:
        return (
          <div className="text-secondary-text text-center p-8">
            The chart type <strong>{chartType}</strong> is not yet implemented.
          </div>
        );
    }
  };

  return (
    <div className="h-[417px] bg-secondary-color-dark border border-border p-4 rounded-lg">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartRenderer;
