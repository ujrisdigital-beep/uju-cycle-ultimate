export default function SecurityBadge({ epsilon, score }: { epsilon: number, score: number }) {
  return (
    <div className="flex items-center gap-3 bg-gray-800/50 border border-green-500/30 rounded-xl px-4 py-2">
      <div className="flex flex-col items-end">
        <span className="text-xs text-gray-400">Privacy ε={epsilon}</span>
        <span className="text-lg font-bold text-green-400">{score}%</span>
      </div>
      <div className="text-2xl">🔒</div>
    </div>
  );
}
