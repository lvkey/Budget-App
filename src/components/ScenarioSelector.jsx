import { useState } from 'react';
import { Copy, Pencil, Trash2, Plus, Check, X, ChevronDown } from 'lucide-react';
import { MoneyInput } from './MoneyInput';

const PAGE_COPY = {
  dashboard: {
    title: 'Ledgr',
    subtitle: 'Enter your income and expenses to project your savings',
  },
  income: {
    title: 'Income vs Expenses',
    subtitle: 'See how your income splits across savings and each expense category',
  },
};

export function ScenarioSelector({
  page,
  income,
  onChangeIncome,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onCreateScenario,
  onCopyScenario,
  onRenameScenario,
  onDeleteScenario,
}) {
  const { title, subtitle } = PAGE_COPY[page] || PAGE_COPY.dashboard;
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [error, setError] = useState('');

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId);

  const startRename = () => {
    setDraftName(currentScenario?.name || '');
    setError('');
    setRenaming(true);
  };

  const commitRename = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      return;
    }
    const duplicate = scenarios.some((s) => s.id !== selectedScenarioId && s.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) {
      setError('A scenario with this name already exists');
      return;
    }
    onRenameScenario(selectedScenarioId, trimmed);
    setRenaming(false);
  };

  const inputBorder = error
    ? 'border-red-400 focus:ring-red-300'
    : 'border-slate-300 dark:border-white/20 focus:ring-blue-400';

  return (
    <div className="bg-white dark:bg-[#1e1e1e] p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-3 items-start md:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-white/90">{title}</h1>
          <p className="text-slate-500 dark:text-white/60 mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-col items-start md:items-center gap-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider">Gross Annual Income</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-slate-800 dark:text-white/90">$</span>
            <MoneyInput
              value={income}
              onChange={onChangeIncome}
              className="w-32 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-lg px-2 py-1 text-lg font-bold text-slate-800 dark:text-white/90 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1 w-full md:items-end">
          <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider">Scenario</label>
          {renaming ? (
            <div className="flex items-start gap-1.5">
              <div className="flex flex-col">
                <input
                  type="text"
                  autoFocus
                  value={draftName}
                  onChange={(e) => {
                    setDraftName(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenaming(false);
                  }}
                  className={`bg-slate-50 dark:bg-white/5 border rounded-lg px-2.5 py-2 text-sm text-slate-800 dark:text-white/90 focus:outline-none focus:ring-2 ${inputBorder}`}
                />
                {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
              </div>
              <button
                type="button"
                onClick={commitRename}
                className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg p-2.5 transition-colors"
                aria-label="Save name"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                onClick={() => setRenaming(false)}
                className="text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg p-2.5 transition-colors"
                aria-label="Cancel rename"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="relative">
                <select
                  value={selectedScenarioId}
                  onChange={(e) => onSelectScenario(e.target.value)}
                  aria-label="Scenario"
                  className="appearance-none bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 text-slate-800 dark:text-white/90 text-sm font-medium rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 block pl-3 pr-9 py-2.5 transition-colors min-w-[170px] max-w-full"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-[#1e1e1e] text-slate-800 dark:text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-white/60" />
              </div>
              <button
                type="button"
                onClick={startRename}
                className="text-slate-500 dark:text-white/60 hover:text-slate-600 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg p-2.5 transition-colors"
                aria-label="Rename scenario"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => onCopyScenario(selectedScenarioId)}
                className="text-slate-500 dark:text-white/60 hover:text-slate-600 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg p-2.5 transition-colors"
                aria-label="Copy scenario"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                onClick={onCreateScenario}
                className="text-slate-500 dark:text-white/60 hover:text-slate-600 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg p-2.5 transition-colors"
                aria-label="New scenario"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDeleteScenario(selectedScenarioId)}
                disabled={scenarios.length <= 1}
                className="text-slate-500 dark:text-white/60 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400 dark:disabled:hover:text-white/40 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg p-2.5 transition-colors"
                aria-label="Delete scenario"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
