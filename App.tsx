
import React, { useState, useCallback, useEffect } from 'react';
import type { Asset, Node, Edge, Scenario, AnalysisResult } from './types.ts';
import { INITIAL_NODES, INITIAL_EDGES, DEFAULT_ASSETS } from './constants.ts';
import * as geminiService from './services/geminiService.ts';

import Header from './components/Header.tsx';
import PortfolioView from './components/PortfolioView.tsx';
import DependencyCanvas from './components/DependencyCanvas.tsx';
import ScenarioControls from './components/ScenarioControls.tsx';
import AnalysisReport from './components/AnalysisReport.tsx';
import AssetDetailView from './components/AssetDetailView.tsx';
import Loader from './components/Loader.tsx';

const App: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedAssetNodeId, setSelectedAssetNodeId] = useState<string | null>(null);

  const isPortfolioLoaded = assets.length > 0;
  const isAnalysisDone = analysisResult !== null && !analysisResult.causalFactors;
  
  const runAnalysis = useCallback(async (analysisFn: (p: Asset[], n: Node[]) => Promise<AnalysisResult>, message: string, currentNodes: Node[], currentAssets: Asset[]) => {
    if (currentAssets.length === 0) return;
    setIsLoading(true);
    setLoadingMessage(message);
    setAnalysisResult(null);
    setSelectedAssetNodeId(null);
    try {
      const result = await analysisFn(currentAssets, currentNodes);
      setAnalysisResult(result);
      
      if (result.assetImpacts && result.assetImpacts.length > 0) {
        setNodes(prevNodes => {
          // Use currentNodes from the argument for consistency
          return currentNodes.map(node => {
            if (node.type === 'asset') {
              const impact = result.assetImpacts.find(a => a.ticker === node.id);
              return { ...node, impact: impact?.probabilityOfDrop ?? 0 };
            }
            return node;
          });
        });
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePortfolioLoad = useCallback((loadedAssets: Asset[]) => {
    setAssets(loadedAssets);
    setAnalysisResult(null);
    setSelectedAssetNodeId(null);
    
    const riskNodes = INITIAL_NODES;

    // Enhanced asset node positioning
    const y_start = 10;
    const available_y = 90 - y_start;
    const y_spacing = loadedAssets.length > 1 ? available_y / (loadedAssets.length -1) : 0;
    const MAX_SPACING = 18;
    const effective_spacing = Math.min(y_spacing, MAX_SPACING);


    const assetNodes: Node[] = loadedAssets.map((asset, index) => ({
      id: asset.ticker,
      label: asset.ticker,
      type: 'asset',
      states: [],
      currentState: '',
      position: { x: 80, y: y_start + (index * effective_spacing) },
      dependencies: [
        asset.sector === 'Technology' || asset.sector === 'Consumer Discretionary' ? 'techSentiment' : 'consumerSpending',
        asset.sector === 'Energy' ? 'oilPrice' : 'gdpGrowth'
      ].filter((v, i, a) => a.indexOf(v) === i), // Simplified & unique dependencies
    }));

    const newNodes = [...riskNodes, ...assetNodes];
    setNodes(newNodes);

    const newEdges = [...INITIAL_EDGES];
    assetNodes.forEach(assetNode => {
      assetNode.dependencies.forEach(depId => {
        newEdges.push({ from: depId, to: assetNode.id });
      });
    });
    setEdges(newEdges);
    
    // Return the newly created nodes for immediate analysis
    return newNodes;
  }, []);
  
  // Effect for initial load
  useEffect(() => {
    const initialLoad = async () => {
      setLoadingMessage('Loading portfolio and running initial analysis...');
      const initialNodes = handlePortfolioLoad(DEFAULT_ASSETS);
      await runAnalysis(geminiService.analyzeRisk, 'Analyzing initial state...', initialNodes, DEFAULT_ASSETS);
    };
    initialLoad();
  }, [handlePortfolioLoad, runAnalysis]);


  const handleNodeStateChange = useCallback((nodeId: string, newState: string) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId ? { ...node, currentState: newState } : node
      )
    );
  }, []);

  const handleAnalyze = useCallback(() => {
    runAnalysis(geminiService.analyzeRisk, 'Analyzing risk...', nodes, assets);
  }, [nodes, runAnalysis, assets]);

  const handleDiagnose = useCallback(() => {
    runAnalysis(geminiService.diagnosePortfolioDrop, 'Diagnosing portfolio drop...', nodes, assets);
  }, [nodes, runAnalysis, assets]);

  const handleHedge = useCallback(async () => {
    if (!analysisResult) return;
    setIsLoading(true);
    setLoadingMessage('Generating hedging suggestions...');
    try {
      const suggestions = await geminiService.suggestHedges(assets, analysisResult);
      setAnalysisResult(prev => prev ? { ...prev, hedgingSuggestions: suggestions } : null);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [assets, analysisResult]);
  
  const handleScenarioSelect = useCallback((scenario: Scenario) => {
    const newNodes = nodes.map(node => {
        if (scenario.settings[node.id]) {
          return { ...node, currentState: scenario.settings[node.id] };
        }
        return node;
      });
    setNodes(newNodes);
    runAnalysis(geminiService.analyzeRisk, `Analyzing scenario: ${scenario.name}...`, newNodes, assets);
  }, [nodes, runAnalysis, assets]);

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.type === 'asset') {
        setSelectedAssetNodeId(nodeId);
    } else {
        setSelectedAssetNodeId(null);
    }
  };

  const selectedAsset = assets.find(a => a.ticker === selectedAssetNodeId);

  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 font-sans">
      {isLoading && <Loader message={loadingMessage} />}
      <Header />
      <main className="container mx-auto p-4 space-y-4">
        
        {isPortfolioLoaded && <PortfolioView assets={assets} />}
        
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
           <h3 className="text-lg font-semibold mb-4 text-black">Risk Dependency Network</h3>
            <div className="w-full h-[350px] lg:h-[450px] bg-gray-50 border border-gray-200 rounded-lg relative">
              <DependencyCanvas
                nodes={nodes}
                edges={edges}
                onNodeStateChange={handleNodeStateChange}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedAssetNodeId}
              />
            </div>
        </div>

        {selectedAsset && (
            <AssetDetailView 
                asset={selectedAsset}
                portfolio={assets}
                onClose={() => setSelectedAssetNodeId(null)}
            />
        )}
        
        <ScenarioControls 
          onScenarioSelect={handleScenarioSelect}
          onAnalyze={handleAnalyze}
          onDiagnose={handleDiagnose}
          onHedge={handleHedge}
          isPortfolioLoaded={isPortfolioLoaded}
          isAnalysisDone={isAnalysisDone}
        />
        
        <AnalysisReport result={analysisResult} />

      </main>
    </div>
  );
};

export default App;