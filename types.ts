export interface Asset {
  ticker: string;
  weight: number;
  sector: string;
}

export interface Node {
  id: string;
  label: string;
  type: 'risk' | 'asset';
  states: string[];
  currentState: string;
  position: { x: number; y: number };
  dependencies: string[];
  impact?: number; // Probability of >5% drop, from 0 to 1
}

export interface Edge {
  from: string;
  to: string;
}

export interface Scenario {
  name: string;
  description: string;
  settings: { [nodeId: string]: string };
}

export interface AnalysisResult {
  assetImpacts: { ticker: string; probabilityOfDrop: number }[];
  portfolioDrawdown: number;
  vulnerableAssets: string[];
  summary: string;
  hedgingSuggestions?: string;
  causalFactors?: { factor: string; probability: number }[];
}

export interface AssetDetails {
  historicalVolatility: number;
  correlationMatrix: {
    ticker: string;
    correlation: number;
  }[];
  insight: string;
}
