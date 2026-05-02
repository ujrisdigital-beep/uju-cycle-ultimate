export default function ConfidenceMeter({ confidence }: { confidence?: number }) {
  const value = confidence || 0;
  const color = value > 0.8 ? '#10b981' : value > 0.5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-gray-800/30 backdrop-blur rounded-xl p-6 border border-purple-500/20">
      <h2 className="text-xl font-semibold text-purple-400 mb-4">📊 Confidence Calibration</h2>
      <div className="flex items-center gap-4">
        <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${value * 100}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-2xl font-bold" style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <p className="text-gray-400 text-sm mt-2">Bayesian Posterior Probability</p>
    </div>
  );
}
