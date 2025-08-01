// utils/dataProfiler.ts

import type { FinanceEntry } from '../types/finance';
import type { DataProfile } from '../types/chartMetadata';

export function profileFinanceData(data: FinanceEntry[]): DataProfile {
  if (!data || data.length === 0) {
    return {
      hasTimeField: false,
      hasNumericField: false,
      hasCategoryField: false,
      numericFieldCount: 0,
      categoryFieldCount: 0,
      hasXYPair: false,
      hasHierarchy: false,
      hasSourceTargetFlow: false,
      hasStepSequence: false,
    };
  }

  const sample = data[0];
  const keys = Object.keys(sample);

  let numericFieldCount = 0;
  let categoryFieldCount = 0;
  let hasTimeField = false;
  let hasXYPair = false;
  let hasSourceTargetFlow = false;
  let hasStepSequence = false;
  let hasHierarchy = false;

  const timeKeywords = ['date', 'month', 'time', 'year'];
//   const sourceTargetKeys = ['source', 'target'];
  const hierarchyKeys = ['parent', 'children', 'level'];
  const categoryHints = ['category', 'region', 'type', 'group'];

  for (const key of keys) {
    const value = sample[key as keyof FinanceEntry];

    // Detect numeric fields
    if (typeof value === 'number') numericFieldCount++;

    // Detect time-based field
    if (
      typeof value === 'string' &&
      timeKeywords.some(keyword => key.toLowerCase().includes(keyword))
    ) {
      hasTimeField = true;
    }

    // Detect category fields
    if (
      typeof value === 'string' &&
      categoryHints.some(keyword => key.toLowerCase().includes(keyword))
    ) {
      categoryFieldCount++;
    }

    // Detect XY pair (two numeric values)
    if (numericFieldCount >= 2) hasXYPair = true;
  }

  // Detect flow data structure (sankey)
  const hasSource = keys.includes('source');
  const hasTarget = keys.includes('target');
  hasSourceTargetFlow = hasSource && hasTarget;

  // Detect hierarchy
  hasHierarchy = hierarchyKeys.some(hint => keys.includes(hint));

  // Detect step sequence (funnel) — fake heuristic: data length is short and values decrease
  const metricKeys = keys.filter(
    k => typeof sample[k as keyof FinanceEntry] === 'number'
  );
  hasStepSequence =
    data.length <= 6 &&
    metricKeys.some(key => {
      const values = data.map(d => d[key as keyof FinanceEntry] as number);
      return values.every((v, i, arr) => i === 0 || v <= arr[i - 1]);
    });

  return {
    hasTimeField,
    hasNumericField: numericFieldCount > 0,
    hasCategoryField: categoryFieldCount > 0,
    numericFieldCount,
    categoryFieldCount,
    hasXYPair,
    hasHierarchy,
    hasSourceTargetFlow,
    hasStepSequence,
  };
}
