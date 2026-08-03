import { useState } from 'react';
import { Check, X, CheckCheck } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { EXPENSE_CATEGORY_GROUPS } from '../lib/expenseCategories';
import { InfoTooltip } from './InfoTooltip';

const CATEGORY_NAMES = EXPENSE_CATEGORY_GROUPS.map((g) => g.name);

const SECTION_META = {
  confident: {
    label: 'Looks right',
    description: 'Well-known merchants — a quick glance is all these need.',
    badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  likely: {
    label: 'Worth a check',
    description: 'A reasonable guess — double-check before confirming.',
    badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    dot: 'bg-amber-500',
  },
  unmatched: {
    label: 'Needs your input',
    description: "We don't have a guess for these yet.",
    badge: 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10',
    dot: 'bg-slate-400 dark:bg-white/40',
  },
};

function ReviewRow({ transaction, expenses, suggestion, onConfirm, onExclude }) {
  const [expenseId, setExpenseId] = useState(transaction.matched_expense_id || suggestion?.matchedExpenseId || '');
  const [category, setCategory] = useState(transaction.category || suggestion?.category || '');

  const canConfirm = Boolean(expenseId || category);

  return (
    <tr className="border-b border-slate-100 dark:border-white/10 last:border-b-0">
      <td className="px-4 py-3 text-sm text-slate-500 dark:text-white/50 whitespace-nowrap">{transaction.txn_date}</td>
      <td className="px-4 py-3 text-sm text-slate-800 dark:text-white/90 max-w-[220px] truncate" title={transaction.description}>
        {transaction.description}
      </td>
      <td className="px-4 py-3 text-sm text-right font-medium tabular-nums text-slate-700 dark:text-white/90 whitespace-nowrap">
        {formatCurrency(transaction.amount)}
      </td>
      <td className="px-4 py-3">
        <select
          value={expenseId}
          onChange={(e) => {
            setExpenseId(e.target.value);
            if (e.target.value) setCategory('');
          }}
          className="w-full text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 py-1.5 text-slate-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">No specific line…</option>
          {expenses.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name || 'Untitled expense'}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            if (e.target.value) setExpenseId('');
          }}
          className="w-full text-sm rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-2 py-1.5 text-slate-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">No category…</option>
          {CATEGORY_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm(transaction, { matchedExpenseId: expenseId || null, category: expenseId ? null : category || null })}
          aria-label={`Confirm ${transaction.description}`}
          className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-30 rounded-lg p-2 transition-colors"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={() => onExclude(transaction)}
          aria-label={`Exclude ${transaction.description}`}
          className="text-slate-400 dark:text-white/40 hover:text-red-500 rounded-lg p-2 transition-colors"
        >
          <X size={16} />
        </button>
      </td>
    </tr>
  );
}

function ReviewSection({ tier, items, expenses, onConfirm, onExclude, onBulkConfirm }) {
  if (items.length === 0) return null;
  const meta = SECTION_META[tier];
  const bulkable = items.filter((i) => i.suggestion.matchedExpenseId || i.suggestion.category);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-50/60 dark:bg-white/[0.03] border-b border-t border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
          <span className={`text-xs font-semibold rounded-full border px-2 py-0.5 shrink-0 ${meta.badge}`}>{meta.label}</span>
          <span className="text-xs text-slate-500 dark:text-white/50 truncate">{meta.description}</span>
        </div>
        {bulkable.length > 1 && (
          <button
            type="button"
            onClick={() => onBulkConfirm(bulkable)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            <CheckCheck size={13} />
            Confirm all {bulkable.length}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs uppercase bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Date</th>
              <th className="px-4 py-2.5 font-semibold">Description</th>
              <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
              <th className="px-4 py-2.5 font-semibold">
                <span className="inline-flex items-center">
                  Match an expense
                  <InfoTooltip text="Link this to one of your own budgeted expenses (e.g. Rent, Netflix) for exact, line-by-line tracking." />
                </span>
              </th>
              <th className="px-4 py-2.5 font-semibold">
                <span className="inline-flex items-center">
                  Or a category
                  <InfoTooltip text="No specific expense fits? Just file it under a general category (e.g. Groceries, Dining) instead." />
                </span>
              </th>
              <th className="px-4 py-2.5 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ transaction, suggestion }) => (
              <ReviewRow
                key={transaction.id}
                transaction={transaction}
                expenses={expenses}
                suggestion={suggestion}
                onConfirm={onConfirm}
                onExclude={onExclude}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// groups: { confident: [{transaction, suggestion}], likely: [...], unmatched: [...] }
export function TransactionReview({ groups, expenses, onConfirm, onExclude, onBulkConfirm }) {
  const total = groups.confident.length + groups.likely.length + groups.unmatched.length;
  if (total === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/10">
        <h2 className="font-semibold text-slate-800 dark:text-white/90">Needs a quick check ({total})</h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          Grouped by how confident the guess is. For each one, either match it to one of your own expenses for exact
          tracking, or just pick a general category if nothing specific fits. Confirming remembers the merchant, so
          it's never asked again.
        </p>
      </div>
      <ReviewSection tier="confident" items={groups.confident} expenses={expenses} onConfirm={onConfirm} onExclude={onExclude} onBulkConfirm={onBulkConfirm} />
      <ReviewSection tier="likely" items={groups.likely} expenses={expenses} onConfirm={onConfirm} onExclude={onExclude} onBulkConfirm={onBulkConfirm} />
      <ReviewSection tier="unmatched" items={groups.unmatched} expenses={expenses} onConfirm={onConfirm} onExclude={onExclude} onBulkConfirm={onBulkConfirm} />
    </div>
  );
}
