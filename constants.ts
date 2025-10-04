
import type { Node, Edge, Scenario, Asset } from './types.ts';

export const DEFAULT_ASSETS: Asset[] = [
  { ticker: 'NVDA', weight: 30, sector: 'Technology' },
  { ticker: 'MSFT', weight: 25, sector: 'Technology' },
  { ticker: 'MCD', weight: 20, sector: 'Consumer Discretionary' },
  { ticker: 'CVX', weight: 15, sector: 'Energy' },
  { ticker: 'GS', weight: 10, sector: 'Financials' },
];

export const INITIAL_NODES: Node[] = [
  // Macroeconomic (Column 1)
  { id: 'interestRate', label: 'Interest Rate', type: 'risk', states: ['Cut', 'Hold', 'Hike'], currentState: 'Hold', position: { x: 2, y: 10 }, dependencies: [] },
  { id: 'inflation', label: 'Inflation Rate', type: 'risk', states: ['Low', 'Medium', 'High'], currentState: 'Medium', position: { x: 2, y: 32 }, dependencies: ['oilPrice'] },
  { id: 'gdpGrowth', label: 'GDP Growth', type: 'risk', states: ['Recession', 'Slow', 'Robust'], currentState: 'Slow', position: { x: 2, y: 54 }, dependencies: ['interestRate'] },
  { id: 'oilPrice', label: 'Oil Price', type: 'risk', states: ['Low', 'Stable', 'High'], currentState: 'Stable', position: { x: 2, y: 76 }, dependencies: ['geopolitical'] },
  // Geopolitical (Column 2)
  { id: 'geopolitical', label: 'Geopolitical Stability', type: 'risk', states: ['Stable', 'Tense', 'Conflict'], currentState: 'Stable', position: { x: 27, y: 25 }, dependencies: [] },
  { id: 'supplyChain', label: 'Supply Chain Disruption', type: 'risk', states: ['None', 'Moderate', 'Severe'], currentState: 'None', position: { x: 27, y: 55 }, dependencies: ['geopolitical'] },
  // Sector-Specific (Column 3)
  { id: 'techSentiment', label: 'Tech Sector Sentiment', type: 'risk', states: ['Bearish', 'Neutral', 'Bullish'], currentState: 'Neutral', position: { x: 52, y: 25 }, dependencies: ['interestRate', 'supplyChain'] },
  { id: 'consumerSpending', label: 'Consumer Spending', type: 'risk', states: ['Weak', 'Normal', 'Strong'], currentState: 'Normal', position: { x: 52, y: 55 }, dependencies: ['gdpGrowth', 'inflation'] },
  // Assets will be added dynamically in Column 4
];

export const INITIAL_EDGES: Edge[] = [
    { from: 'interestRate', to: 'gdpGrowth' },
    { from: 'interestRate', to: 'techSentiment' },
    { from: 'oilPrice', to: 'inflation' },
    { from: 'geopolitical', to: 'oilPrice' },
    { from: 'geopolitical', to: 'supplyChain' },
    { from: 'supplyChain', to: 'techSentiment' },
    { from: 'gdpGrowth', to: 'consumerSpending' },
    { from: 'inflation', to: 'consumerSpending' },
];

export const SCENARIOS: Scenario[] = [
  {
    name: '2008-style Financial Crisis',
    description: 'Simulates a severe global recession with frozen credit markets.',
    settings: {
      gdpGrowth: 'Recession',
      interestRate: 'Cut',
      consumerSpending: 'Weak',
    },
  },
  {
    name: 'Stagflation Shock',
    description: 'High inflation combined with stagnant economic growth.',
    settings: {
      inflation: 'High',
      gdpGrowth: 'Recession',
      interestRate: 'Hike',
    },
  },
  {
    name: 'Geopolitical Supply Shock',
    description: 'A major geopolitical event disrupts supply chains and spikes commodity prices.',
    settings: {
      geopolitical: 'Conflict',
      supplyChain: 'Severe',
      oilPrice: 'High',
    },
  },
];