import { MoneyInput } from './MoneyInput';

export function IncomeEditor({ income, onChangeIncome }) {
  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6">
      <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">Annual Income</label>
      <div className="flex items-center gap-1 max-w-xs">
        <span className="text-xl font-bold text-slate-800 dark:text-white/90">$</span>
        <MoneyInput
          value={income}
          onChange={onChangeIncome}
          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-xl font-bold text-slate-800 dark:text-white/90 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </div>
  );
}
