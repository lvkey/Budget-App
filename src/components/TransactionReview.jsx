import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { formatCurrency } from '../lib/format';
import { EXPENSE_CATEGORY_GROUPS } from '../lib/expenseCategories';

const CATEGORY_NAMES = EXPENSE_CATEGORY_GROUPS.map((g) => g.name);

function ReviewRow({ transaction, expenses, suggestion, onConfirm, onExclude }) {
  const [expenseId, setExpenseId] = useState(transaction.matched_expense_id || suggestion?.matchedExpenseId || '');
  const [category, setCategory] = useState(transaction.category || suggestion?.category || '');

  const canConfirm = Boolean(expenseId || category);

  return (
    <tr className="border-b border-slate-100 dark:border-white/10">
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

export function TransactionReview({ transactions, expenses, suggestions = {}, onConfirm, onExclude }) {
  if (transactions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/10">
        <h2 className="font-semibold text-slate-800 dark:text-white/90">Needs a quick check ({transactions.length})</h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          These merchants weren't confidently matched. Pick an expense line or category once, and it's remembered next time.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-xs uppercase bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold">Expense line</th>
              <th className="px-4 py-3 font-semibold">Or category</th>
              <th className="px-4 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <ReviewRow
                key={t.id}
                transaction={t}
                expenses={expenses}
                suggestion={suggestions[t.id]}
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
