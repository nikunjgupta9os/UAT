// types/chartMetadata.ts

export interface DataProfile {
  hasTimeField: boolean;
  hasNumericField: boolean;
  hasCategoryField: boolean;
  numericFieldCount: number;
  categoryFieldCount: number;
  hasXYPair: boolean;
  hasHierarchy: boolean;
  hasSourceTargetFlow: boolean;
  hasStepSequence: boolean;
}

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

interface ChartMetadata {
  label: string;
  requiredStructure: string[];
  isSuitable: (profile: DataProfile) => boolean;
}

export const chartMetadata: Record<ChartType, ChartMetadata> = {
  line: {
    label: 'Line Chart',
    requiredStructure: ['Time series (x: time, y: numeric)'],
    isSuitable: profile => profile.hasTimeField && profile.hasNumericField,
  },
  bar: {
    label: 'Bar Chart',
    requiredStructure: ['Categorical (x) + Numeric (y)'],
    isSuitable: profile => profile.hasCategoryField && profile.hasNumericField,
  },
  area: {
    label: 'Area Chart',
    requiredStructure: ['Time series + Numeric'],
    isSuitable: profile => profile.hasTimeField && profile.hasNumericField,
  },
  pie: {
    label: 'Pie Chart',
    requiredStructure: ['Category + Summable numeric'],
    isSuitable: profile => profile.hasCategoryField && profile.hasNumericField,
  },
  scatter: {
    label: 'Scatter Plot',
    requiredStructure: ['Two numeric axes'],
    isSuitable: profile => profile.hasXYPair,
  },
  radar: {
    label: 'Radar Chart',
    requiredStructure: ['One category with multiple numeric metrics'],
    isSuitable: profile =>
      profile.hasCategoryField && profile.numericFieldCount >= 3,
  },
  funnel: {
    label: 'Funnel Chart',
    requiredStructure: ['Step-wise numeric sequence'],
    isSuitable: profile => profile.hasStepSequence,
  },
  treemap: {
    label: 'Treemap',
    requiredStructure: ['Hierarchical categories + numeric value'],
    isSuitable: profile =>
        (profile.categoryFieldCount >= 2 || profile.hasHierarchy) &&
        profile.hasNumericField,
  },
  sankey: {
    label: 'Sankey Diagram',
    requiredStructure: ['Source + Target + Flow value'],
    isSuitable: profile => profile.hasSourceTargetFlow,
  },
  radialBar: {
    label: 'Radial Bar',
    requiredStructure: ['Category + Numeric'],
    isSuitable: profile => profile.hasCategoryField && profile.hasNumericField,
  },
};
