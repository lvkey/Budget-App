import { VIEW_FREQUENCIES, OVERVIEW_KEY } from '../lib/data';

export function ViewFrequencyToggle({ value, onChange, hideOverview }) {
  const options = hideOverview ? VIEW_FREQUENCIES.filter((f) => f.key !== OVERVIEW_KEY) : VIEW_FREQUENCIES;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10">
      <span className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider">Time Frame</span>
      <div className="inline-flex flex-wrap bg-slate-100 dark:bg-white/5 rounded-lg p-1 gap-1">
        {options.map((freq) => (
          <button
            key={freq.key}
            type="button"
            onClick={() => onChange(freq.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              value === freq.key
                ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80'
            }`}
          >
            {freq.label}
          </button>
        ))}
      </div>
    </div>
  );
}
