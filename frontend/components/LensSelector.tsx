import React from 'react';

const LENS_OPTIONS = [
  { key: 'causal', label: 'Causal (Pearl)', icon: '🔗' },
  { key: 'institutional', label: 'Institutional (Ostrom)', icon: '🏛️' },
  { key: 'cognitive', label: 'Cognitive (Kahneman)', icon: '🧠' },
  { key: 'signal_detection', label: 'Signal Detection', icon: '📡' },
  { key: 'fault_tree', label: 'Fault-Tree', icon: '🌳' },
  { key: 'linguistic', label: 'Linguistic', icon: '🔤' }
];

export default function LensSelector({ selected, onChange }: { selected: string[], onChange: (lenses: string[]) => void }) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(l => l !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {LENS_OPTIONS.map(lens => (
        <button
          key={lens.key}
          onClick={() => toggle(lens.key)}
          className={`px-3 py-1 rounded-full text-sm border transition ${
            selected.includes(lens.key)
              ? 'bg-purple-500/30 border-purple-400 text-purple-200'
              : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          {lens.icon} {lens.label}
        </button>
      ))}
    </div>
  );
}
