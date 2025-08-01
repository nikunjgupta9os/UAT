import React from 'react';
import type { FinanceEntry } from '../../types/finance';

interface StatsSummaryProps {
  data: FinanceEntry[];
  selectedMetric: keyof FinanceEntry;
}

const StatsSummary: React.FC<StatsSummaryProps> = ({ data, selectedMetric }) => {
  const total = data.reduce((sum, item) => {
    const value = item[selectedMetric];
    return typeof value === 'number' ? sum + value : sum;
  }, 0);

  const avg = data.length ? total / data.length : 0;

  const max = Math.max(
    ...data.map(item => {
      const value = item[selectedMetric];
      return typeof value === 'number' ? value : 0;
    })
  );

  const growth =
    data.length > 1 &&
    typeof data[0][selectedMetric] === 'number' &&
    typeof data[data.length - 1][selectedMetric] === 'number'
      ? ((data[data.length - 1][selectedMetric] as number) - (data[0][selectedMetric] as number)) /
        (data[0][selectedMetric] as number) *
        100
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
      <div className=" p-4 flex  flex-col items-center justify-center">
        <p className="text-3xl text-primary font-bold">{total.toLocaleString()}</p>
        <p className='font-normal text-secondary-text-dark'>Total</p>
      </div>
      <div className=" p-4 flex flex-col items-center justify-center">
        <p className="text-3xl text-primary font-bold">{avg.toFixed(2)}</p>
        <p className='font-normal text-secondary-text-dark'>Average</p>
      </div>
      <div className=" p-4 flex flex-col items-center justify-center">
        <p className="text-3xl text-primary font-bold">{growth.toFixed(2)}%</p>
        <p className='font-normal text-secondary-text-dark'>Growth</p>
      </div>
    </div>
  );

};

export default StatsSummary;
