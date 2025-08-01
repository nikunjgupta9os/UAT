import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import PlacedChart from './PlacedChart';
import html2canvas from 'html2canvas';
import type { DashboardChart } from '../types/dashboard';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface ChartCanvasProps {
  charts: DashboardChart[];
  onLayoutChange: (layout: any) => void;
  onRemoveChart: (id: string) => void;
  onEditChart?: (id: string) => void;
}

const ChartCanvas: React.FC<ChartCanvasProps> = ({
  charts,
  onLayoutChange,
  onRemoveChart,
  onEditChart
}) => {
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
        ignoreElements: (element) => {
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
        }
      });

      const link = document.createElement('a');
      link.download = `dashboard-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error generating download:', error);
      alert('Unable to download dashboard. Please try again or use a different browser.');
    }
  };

  // Function to find the next available position for new charts
  const getNextPosition = (existingCharts: DashboardChart[], newChartWidth = 6, newChartHeight = 4) => {
    if (existingCharts.length === 0) {
      return { x: 0, y: 0 };
    }

    // Sort charts by y position, then by x position
    const sortedCharts = [...existingCharts].sort((a, b) => {
      if (a.layout.y === b.layout.y) {
        return a.layout.x - b.layout.x;
      }
      return a.layout.y - b.layout.y;
    });

    // Try to find space in existing rows first
    for (let row = 0; row < 20; row++) { // Check up to 20 rows
      const chartsInRow = sortedCharts.filter(chart => 
        chart.layout.y <= row && chart.layout.y + chart.layout.h > row
      );

      if (chartsInRow.length === 0) {
        return { x: 0, y: row };
      }

      // Sort charts in this row by x position
      chartsInRow.sort((a, b) => a.layout.x - b.layout.x);

      // Check for gaps between charts
      let currentX = 0;
      for (const chart of chartsInRow) {
        if (chart.layout.x >= currentX + newChartWidth) {
          return { x: currentX, y: row };
        }
        currentX = Math.max(currentX, chart.layout.x + chart.layout.w);
      }

      // Check if there's space at the end of the row
      if (currentX + newChartWidth <= 12) { // Assuming 12 columns
        return { x: currentX, y: row };
      }
    }

    // If no space found, add to bottom
    const maxY = Math.max(...sortedCharts.map(chart => chart.layout.y + chart.layout.h));
    return { x: 0, y: maxY };
  };

  // Validate and fix layout data
  const validatedCharts = charts.map((chart, index) => {
    const layout = chart.layout;
    
    // If layout is incomplete, calculate next available position
    if (!layout || typeof layout.x !== 'number' || typeof layout.y !== 'number') {
      const position = getNextPosition(
        charts.slice(0, index).filter(c => c.layout && typeof c.layout.x === 'number' && typeof c.layout.y === 'number'),
        layout?.w || 6,
        layout?.h || 4
      );
      
      return {
        ...chart,
        layout: {
          i: chart.id,
          x: position.x,
          y: position.y,
          w: typeof layout?.w === 'number' ? layout.w : 6,
          h: typeof layout?.h === 'number' ? layout.h : 4,
          minW: 2,
          minH: 2,
          maxW: 12,
          maxH: 10
        }
      };
    }

    return {
      ...chart,
      layout: {
        i: chart.id,
        x: layout.x,
        y: layout.y,
        w: typeof layout.w === 'number' ? layout.w : 6,
        h: typeof layout.h === 'number' ? layout.h : 4,
        minW: 2,
        minH: 2,
        maxW: 12,
        maxH: 10
      }
    };
  });

  const handleLayoutChange = (layout: any[]) => {
    // Update the charts with new layout information
    const updatedCharts = validatedCharts.map(chart => {
      const newLayout = layout.find(l => l.i === chart.id);
      return newLayout ? { ...chart, layout: newLayout } : chart;
    });
    onLayoutChange(updatedCharts);
  };

  return (
    <div className="bg-secondary-color-lt border-2 border-border rounded-xl p-4 min-h-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-secondary-text-dark">
          📊 Chart Canvas ({charts.length} chart{charts.length !== 1 ? 's' : ''})
        </h3>
        <button 
          onClick={handleDownload}
          className="px-4 py-2 bg-primary-lt text-white rounded hover:bg-primary transition-colors flex items-center gap-2"
          aria-label="Download dashboard as PNG"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PNG
        </button>
      </div>

      {charts.length === 0 ? (
        <div className="flex bg-white/65 items-center justify-center min-h-[500px] h-full border-2 border-dashed border-primary-lt rounded-lg">
          <div className="text-center text-primary">
            <svg className="mx-auto h-12 w-12 text-primary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium ">No charts yet</p>
            <p className="mt-2">Click "Add Chart" to create your first chart</p>
          </div>
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={{ 
            lg: validatedCharts.map(chart => chart.layout),
            md: validatedCharts.map(chart => ({ ...chart.layout, w: Math.min(chart.layout.w, 8) })),
            sm: validatedCharts.map(chart => ({ ...chart.layout, w: Math.min(chart.layout.w, 6) })),
            xs: validatedCharts.map(chart => ({ ...chart.layout, w: 4 }))
          }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={true}
          isResizable={true}
          compactType="vertical" // This helps with auto-arrangement
          preventCollision={false} // Allow overlapping during drag
          onLayoutChange={handleLayoutChange}
          draggableCancel=".no-drag, .chart-content, button, input, select" // Prevent dragging from interactive elements
          resizeHandles={['se', 'sw', 'ne', 'nw', 's', 'n', 'e', 'w']} // All resize handles
        >
          {validatedCharts.map(chart => (
            <div key={chart.id} data-grid={chart.layout}>
              <PlacedChart
                id={chart.id}
                chartType={chart.chartType}
                metric={chart.metric as 'sales' | 'revenue' | 'profit' | 'expenses'}
                data={chart.data}
                title={chart.title || `${chart.metric} (${chart.chartType})`}
                onRemove={onRemoveChart}
                onEdit={onEditChart}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {/* Instructions for users */}
      {charts.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium mb-1">How to use:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Drag:</strong> Click and hold the chart header to move charts around</li>
                <li>• <strong>Resize:</strong> Drag the corners or edges of charts to resize them</li>
                <li>• <strong>Edit:</strong> Click the edit button on any chart to change its title</li>
                <li>• <strong>Remove:</strong> Click the trash button to delete a chart</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartCanvas;