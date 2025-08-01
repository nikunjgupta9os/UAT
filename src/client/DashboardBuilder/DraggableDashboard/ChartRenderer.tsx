import React from 'react';
import { 
  ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, Treemap, Tooltip, Legend,
  CartesianGrid, Label, RadialBarChart, RadialBar, Cell, Text
} from 'recharts';
import { transformToTreemapData } from './transformers';
import type { FinanceEntry } from '../types/finance';
import type { ChartType } from '../types/chartMetadata';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB', '#FFCE56'];

interface ChartRendererProps {
  chartType: ChartType;
  data: FinanceEntry[];
  metric: keyof FinanceEntry;
  title?: string;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartType, data, metric, title }) => {
  // Safe data access helper
  const getNumericValue = (item: FinanceEntry, key: keyof FinanceEntry): number => {
    const value = item[key];
    return typeof value === 'number' ? value : 0;
  };

  // Data transformations
  const pieData = data.reduce((acc: Record<string, number>, item) => {
    const category = item.category;
    acc[category] = (acc[category] || 0) + getNumericValue(item, metric);
    return acc;
  }, {});

  const pieFormatted = Object.entries(pieData).map(([name, value]) => ({ name, value }));

  const maxDataValue = data.length 
    ? Math.max(...data.map(d => getNumericValue(d, metric))) 
    : 0;

  const radarData = data.map(item => ({
    subject: item.region,
    [metric]: getNumericValue(item, metric),
    fullMark: maxDataValue * 1.2
  }));

  const scatterData = data.map((item, index) => ({
    x: index,
    y: getNumericValue(item, metric),
    name: item.month || `Item ${index + 1}`
  }));

  const funnelData = data.length > 3 ? 
    data.slice(0, 4).map((item, idx) => ({
      name: `Stage ${idx + 1}`,
      value: getNumericValue(item, metric)
    })) : [
    { name: 'Stage 1', value: 5000 },
    { name: 'Stage 2', value: 4000 },
    { name: 'Stage 3', value: 2500 },
    { name: 'Stage 4', value: 1000 }
  ];

  const treemapData = transformToTreemapData(data, metric);

  const radialData = data.reduce((acc: Record<string, number>, item) => {
    const key = item.category;
    acc[key] = (acc[key] || 0) + getNumericValue(item, metric);
    return acc;
  }, {});

  const radialFormatted = Object.entries(radialData).map(([name, value]) => ({ name, value }));

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 30 }
    };

    const axisLabelProps = {
      angle: -90,
      position: 'insideLeft' as const,
      style: { textAnchor: 'middle' } as const
    };

    const chartProps = {
      metric,
      title: title || metric.toString(),
      color: '#8884d8',
      fillOpacity: 0.6
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month">
              <Label value="Time Period" offset={-5} position="insideBottom" />
            </XAxis>
            <YAxis>
              <Label 
                value={chartProps.title.toUpperCase()} 
                {...axisLabelProps} 
              />
            </YAxis>
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={chartProps.metric} 
              stroke={chartProps.color} 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month">
              <Label value="Time Period" offset={-5} position="insideBottom" />
            </XAxis>
            <YAxis>
              <Label 
                value={chartProps.title.toUpperCase()} 
                {...axisLabelProps} 
              />
            </YAxis>
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={chartProps.metric} 
              fill={chartProps.color} 
              name={chartProps.title}
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month">
              <Label value="Time Period" offset={-5} position="insideBottom" />
            </XAxis>
            <YAxis>
              <Label 
                value={chartProps.title.toUpperCase()} 
                {...axisLabelProps} 
              />
            </YAxis>
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey={chartProps.metric} 
              stroke={chartProps.color} 
              fill={chartProps.color} 
              fillOpacity={chartProps.fillOpacity}
            />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={pieFormatted}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
              nameKey="name"
            >
              {pieFormatted.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [value, metric]}
              labelFormatter={(label) => `Category: ${label}`}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
            />
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart outerRadius="80%" data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 1000']} />
            <Radar 
              name={chartProps.title} 
              dataKey={chartProps.metric} 
              stroke={chartProps.color} 
              fill={chartProps.color} 
              fillOpacity={chartProps.fillOpacity}
            />
            <Legend />
            <Tooltip />
          </RadarChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Index"
              label={{ value: 'Data Point Index', position: 'insideBottom' }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name={chartProps.metric}
              label={{ value: chartProps.title, ...axisLabelProps }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: number) => [value, metric]}
              labelFormatter={(label) => `Point: ${label}`}
            />
            <Scatter 
              name={chartProps.title} 
              data={scatterData} 
              fill={chartProps.color} 
              shape="circle"
            />
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
            fill={chartProps.color}
          >
            <Tooltip 
              formatter={(value: number) => [value, 'Value']}
              labelFormatter={(label) => `Category: ${label}`}
            />
          </Treemap>
        );

      case 'funnel':
        return (
          <BarChart 
            layout="vertical"
            data={funnelData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number">
              <Label value={chartProps.title} offset={-5} position="insideBottom" />
            </XAxis>
            <YAxis 
              type="category" 
              dataKey="name"
              width={80}
            >
              <Label value="Stage" angle={-90} position="insideLeft" />
            </YAxis>
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="value" 
              fill={chartProps.color} 
              name="Value"
            />
          </BarChart>
        );

      case 'radialBar':
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
              name={chartProps.title}
              fill={chartProps.color}
              label={{ position: 'insideStart' as const, fill: '#fff' }}
            />
            <Legend
              iconSize={10}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              formatter={(value) => <Text>{value}</Text>}
            />
            <Tooltip 
              formatter={(value: number) => [value, 'Value']}
              labelFormatter={(label) => `Category: ${label}`}
            />
          </RadialBarChart>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">The chart type <strong>{chartType}</strong> is not yet implemented.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartRenderer;