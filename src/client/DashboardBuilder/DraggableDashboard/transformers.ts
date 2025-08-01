import type { FinanceEntry } from '../types/finance';

export function transformToTreemapData(
  data: FinanceEntry[],
  metric: keyof FinanceEntry = 'revenue'
) {
  const result: any = {
    name: 'All Regions',
    children: [],
  };

  const regionMap: Record<string, Record<string, number>> = {};

  data.forEach(entry => {
    const region = entry.region;
    const category = entry.category;
    const value = typeof entry[metric] === 'number' ? entry[metric] : 0;

    if (!regionMap[region]) {
      regionMap[region] = {};
    }
    if (!regionMap[region][category]) {
      regionMap[region][category] = 0;
    }

    regionMap[region][category] += value;
  });

  for (const [region, categories] of Object.entries(regionMap)) {
    const children = Object.entries(categories).map(([cat, val]) => ({
      name: cat,
      value: val,
    }));
    result.children.push({
      name: region,
      children,
    });
  }

  return result;
}
