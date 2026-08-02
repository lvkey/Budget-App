import { ArrowUpDown, Pencil, Check, Eraser, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { FREQ_OPTIONS } from '../lib/data';
import { InfoTooltip } from './InfoTooltip';
import { MoneyInput } from './MoneyInput';

export function ExpenseTable({
  data,
  totalDisplayed,
  viewFrequency,
  editing,
  onToggleEdit,
  onChangeAmount,
  onChangeField,
  onAddExpense,
  onRemoveExpense,
  onClearCosts,
  sortConfig,
  onSort,
}) {
  const showFreq = editing || viewFrequency.key === 'Year';
  const columns = [
    ['name', 'Expense'],
    ...(showFreq ? [['freq', 'Frequency']] : []),
    ['baseCost', 'Cost'],
    ['displayCost', `${viewFrequency.adjective} Total`],
  ];
  const totalColSpan = columns.length - 1;
  const inputClass = 'bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-md px-2 py-1.5 text-slate-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400';

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white/90">Dynamic Expense Breakdown</h2>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
            {editing ? 'Editing expenses — changes save automatically' : 'Click column headers to sort the table'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {editing && (
            <>
              <button
                type="button"
                onClick={onAddExpense}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg px-3 py-2 transition-colors"
              >
                <Plus size={15} />
                Add expense
              </button>
              <button
                type="button"
                onClick={onClearCosts}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg px-3 py-2 transition-colors"
              >
                <Eraser size={15} />
                Clear all costs
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onToggleEdit}
            className={`flex items-center gap-1.5 text-sm font-semibold rounded-lg px-4 py-2 transition-colors ${
              editing
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {editing ? <Check size={15} /> : <Pencil size={15} />}
            {editing ? 'Done' : 'Edit expenses'}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 dark:text-white/70">
          <thead className="text-xs uppercase bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 border-b border-slate-200 dark:border-white/10">
            <tr>
              {columns.map(([key, label]) => (
                <th
                  key={key}
                  className={`px-6 py-4 font-semibold transition-colors ${key === 'displayCost' ? 'text-right' : ''} ${
                    editing ? 'cursor-default' : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                  onClick={() => !editing && onSort(key)}
                >
                  <div className={`flex items-center gap-1 ${key === 'displayCost' ? 'justify-end' : ''}`}>
                    {key === 'displayCost' && <ArrowUpDown size={14} className={sortConfig.key === key ? 'opacity-100' : 'opacity-40'} />}
                    {label}
                    {key !== 'displayCost' && <ArrowUpDown size={14} className={sortConfig.key === key ? 'opacity-100' : 'opacity-40'} />}
                  </div>
                </th>
              ))}
              {editing && <th className="px-4 py-4 w-12" />}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 dark:border-white/10 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800 dark:text-white/90">
                  {editing ? (
                    <input
                      type="text"
                      value={item.name}
                      placeholder="Expense name"
                      onChange={(e) => onChangeField(item.id, 'name', e.target.value)}
                      className={`w-full min-w-[160px] ${inputClass}`}
                    />
                  ) : (
                    <span className="inline-flex items-center">
                      {item.name || 'Untitled expense'}
                      <InfoTooltip text={item.details} />
                    </span>
                  )}
                </td>
                {showFreq && (
                  <td className="px-6 py-4">
                    {editing ? (
                      <select
                        value={item.freq}
                        onChange={(e) => onChangeField(item.id, 'freq', e.target.value)}
                        className={inputClass}
                      >
                        {FREQ_OPTIONS.map((f) => (
                          <option key={f} value={f} className="bg-white dark:bg-[#1e1e1e] text-slate-800 dark:text-white">
                            {f}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 px-2 py-1 rounded text-xs font-medium">{item.freq}</span>
                    )}
                  </td>
                )}
                <td className="px-6 py-4">
                  {editing ? (
                    <div className="flex items-center gap-1 max-w-[140px]">
                      <span className="text-slate-400 dark:text-white/40">$</span>
                      <MoneyInput
                        value={item.baseCost}
                        onChange={(value) => onChangeAmount(item.id, value)}
                        className={`w-full tabular-nums ${inputClass}`}
                      />
                    </div>
                  ) : (
                    formatCurrency(item.baseCost)
                  )}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-700 dark:text-white/90">
                  {formatCurrency(item.displayCost)}
                </td>
                {editing && (
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveExpense(item.id)}
                      className="text-slate-400 dark:text-white/40 hover:text-red-500 rounded p-1 transition-colors"
                      aria-label={`Remove ${item.name || 'expense'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={totalColSpan + 1 + (editing ? 1 : 0)} className="px-6 py-10 text-center text-slate-400 dark:text-white/40">
                  No expenses yet
                </td>
              </tr>
            )}
            <tr className="bg-slate-50 dark:bg-white/5 border-t-2 border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-white/90 text-base">
              <td className="px-6 py-4" colSpan={totalColSpan}>Total {viewFrequency.adjective} Expenses</td>
              <td className="px-6 py-4 text-right">{formatCurrency(totalDisplayed)}</td>
              {editing && <td className="px-4 py-4" />}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
