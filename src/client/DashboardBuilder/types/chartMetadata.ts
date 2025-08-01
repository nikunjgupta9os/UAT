// types/chartMetadata.ts

/**
 * Describes the structure and characteristics of the dataset
 */
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

/**
 * Supported chart types in the dashboard
 */
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

/**
 * Metadata defining chart characteristics and requirements
 */
export interface ChartMetadata {
  /** Display name for the chart type */
  label: string;
  /** Description of required data structure */
  requiredStructure: string[];
  /** 
   * Function that determines if this chart type is suitable
   * for the given data profile 
   */
  isSuitable: (profile: DataProfile) => boolean;
  /** Default dimensions for this chart type */
  defaultDimensions?: {
    w: number;
    h: number;
  };
}

/**
 * Configuration for all supported chart types
 */
export const chartMetadata: Record<ChartType, ChartMetadata> = {
  line: {
    label: 'Line Chart',
    requiredStructure: ['Time series (x: time, y: numeric)'],
    isSuitable: profile => profile.hasTimeField && profile.hasNumericField,
    defaultDimensions: { w: 8, h: 4 }
  },
  bar: {
    label: 'Bar Chart',
    requiredStructure: ['Categorical (x) + Numeric (y)'],
    isSuitable: profile => profile.hasCategoryField && profile.hasNumericField,
    defaultDimensions: { w: 6, h: 4 }
  },
  area: {
    label: 'Area Chart',
    requiredStructure: ['Time series + Numeric'],
    isSuitable: profile => profile.hasTimeField && profile.hasNumericField,
    defaultDimensions: { w: 8, h: 4 }
  },
  pie: {
    label: 'Pie Chart',
    requiredStructure: ['Category + Summable numeric'],
    isSuitable: profile => profile.hasCategoryField && profile.hasNumericField,
    defaultDimensions: { w: 4, h: 4 }
  },
  scatter: {
    label: 'Scatter Plot',
    requiredStructure: ['Two numeric axes'],
    isSuitable: profile => profile.hasXYPair,
    defaultDimensions: { w: 6, h: 4 }
  },
  radar: {
    label: 'Radar Chart',
    requiredStructure: ['One category with multiple numeric metrics'],
    isSuitable: profile =>
      profile.hasCategoryField && profile.numericFieldCount >= 3,
    defaultDimensions: { w: 6, h: 4 }
  },
  funnel: {
    label: 'Funnel Chart',
    requiredStructure: ['Step-wise numeric sequence'],
    isSuitable: profile => profile.hasStepSequence,
    defaultDimensions: { w: 4, h: 4 }
  },
  treemap: {
    label: 'Treemap',
    requiredStructure: ['Hierarchical categories + numeric value'],
    isSuitable: profile =>
      (profile.categoryFieldCount >= 2 || profile.hasHierarchy) &&
      profile.hasNumericField,
    defaultDimensions: { w: 8, h: 4 }
  },
  sankey: {
    label: 'Sankey Diagram',
    requiredStructure: ['Source + Target + Flow value'],
    isSuitable: profile => profile.hasSourceTargetFlow,
    defaultDimensions: { w: 10, h: 6 }
  },
  radialBar: {
    label: 'Radial Bar',
    requiredStructure: ['Category + Numeric'],
    isSuitable: profile => profile.hasCategoryField && profile.hasNumericField,
    defaultDimensions: { w: 4, h: 4 }
  }
};

/**
 * Helper to get default dimensions for a chart type
 */
export const getDefaultChartDimensions = (chartType: ChartType) => {
  return chartMetadata[chartType].defaultDimensions || { w: 6, h: 4 };
};

/**
 * Helper to get suitable chart types for a data profile
 */
export const getSuitableChartTypes = (profile: DataProfile): ChartType[] => {
  return (Object.keys(chartMetadata) as ChartType[]).filter(
    type => chartMetadata[type].isSuitable(profile)
  );
};