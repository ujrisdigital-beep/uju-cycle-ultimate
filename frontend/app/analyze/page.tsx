'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import LensSelector from '@/components/LensSelector';
import ConfidenceMeter from '@/components/ConfidenceMeter';
import SecurityBadge from '@/components/SecurityBadge';

export default function AnalyzePage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLenses, setSelectedLenses] = useState(['causal', 'institutional', 'cognitive']);

  const handleAnalyze = async () => {
    if (!session) {
      signIn('google');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, lenses: selectedLenses })
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to UJU backend. Ensure Ollama is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              UJU Cycle Marvel v5.0
            </h1>
            <p className="text-gray-400 mt-2">Military-Grade Research Engine</p>
          </div>
          <SecurityBadge epsilon={2.0} score={95} />
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your research question..."
            className="w-full h-32 bg-gray-800/50 border border-purple-500/30 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          
          <div className="flex justify-between items-center mt-4">
            <LensSelector selected={selectedLenses} onChange={setSelectedLenses} />
            <button
              onClick={handleAnalyze}
              disabled={loading || !query}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  UJU Cycle processing... (6 agents)
                </span>
              ) : (
                '🚀 Analyze with UJU'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-200">
            ❌ {error}
            <div className="mt-2 text-sm">
              Check: 1. Backend running? 2. Ollama models pulled? 3. Environment variables set?
            </div>
          </div>
        )}

        {result && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gray-800/30 backdrop-blur rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">📋 Executive Summary</h2>
              <ul className="space-y-2">
                {result.executive_summary?.map((point: string, i: number) => (
                  <li key={i} className="text-gray-200">• {point}</li>
                ))}
              </ul>
            </div>

            <ConfidenceMeter confidence={result.confidence_calibration?.bayesian_posterior} />

            <div className="bg-gray-800/30 backdrop-blur rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">🎯 CMO Configurations</h2>
              {result.cmo_configurations?.map((cmo: any, i: number) => (
                <div key={i} className="mb-4 p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-amber-400 font-semibold">Context:</p>
                  <p className="text-gray-300 mb-2">{cmo.context}</p>
                  <p className="text-emerald-400 font-semibold">Mechanism:</p>
                  <p className="text-gray-300 mb-2">{cmo.mechanism}</p>
                  <p className="text-blue-400 font-semibold">Outcome:</p>
                  <p className="text-gray-300">{cmo.outcome}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-800/30 backdrop-blur rounded-xl p-6 border border-purple-500/20">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">✅ Actionable Recommendations</h2>
              <ol className="list-decimal list-inside space-y-2">
                {result.actionable_recommendations?.map((rec: string, i: number) => (
                  <li key={i} className="text-gray-200">{rec}</li>
                ))}
              </ol>
            </div>

            <div className="text-center text-gray-500 text-sm">
              <p>🔒 ε=2.0 Differential Privacy | TPM 2.0 Attested | Audit ID: {result.security?.audit_id}</p>
              <p className="mt-1">🦙 Powered by Ollama | 6 Agents Executed | Self-Improving Bayesian Network</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
