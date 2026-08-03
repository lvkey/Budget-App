import { useMemo } from 'react';
import { convertCost } from '../lib/data';
import { formatCurrency } from '../lib/format';
import { categorizeExpenseName } from '../lib/expenseCategories';

function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
}

// Rows come from three sources: budgeted expense lines (actuals rolled up by
// matched_expense_id), category-only matches (grouped under the category,
// "budgeted" is the sum of any expenses that happen to fall in that category),
// and a catch-all "Unmatched" row for anything with neither - nothing gets
// silently dropped from the comparison.
function buildRows(transactions, expenses) {
  const lineRows = expenses.map((e) => ({
    key: e.id,
    label: e.name || 'Untitled expense',
    budgetedMonthly: convertCost(Number(e.cost) || 0, e.freq, 'Month'),
    actualByMonth: {},
  }));
  const lineByExpenseId = new Map(lineRows.map((r) => [r.key, r]));
  const categoryRows = new Map();
  const unmatchedByMonth = {};

  for (const t of transactions) {
    if (t.excluded || t.amount >= 0) continue;
    const mk = monthKey(t.txn_date);
    const spend = Math.abs(t.amount);

    if (t.matched_expense_id && lineByExpenseId.has(t.matched_expense_id)) {
      const row = lineByExpenseId.get(t.matched_expense_id);
      row.actualByMonth[mk] = (row.actualByMonth[mk] || 0) + spend;
    } else if (t.category) {
      if (!categoryRows.has(t.category)) {
        const budgetedMonthly = expenses
          .filter((e) => categorizeExpenseName(e.name) === t.category)
          .reduce((sum, e) => sum + convertCost(Number(e.cost) || 0, e.freq, 'Month'), 0);
        categoryRows.set(t.category, { key: `category-${t.category}`, label: `${t.category} (uncategorized)`, budgetedMonthly, actualByMonth: {} });
      }
      const row = categoryRows.get(t.category);
      row.actualByMonth[mk] = (row.actualByMonth[mk] || 0) + spend;
    } else {
      unmatchedByMonth[mk] = (unmatchedByMonth[mk] || 0) + spend;
    }
  }

  return {
    lineRows: [...lineRows, ...categoryRows.values()],
    unmatchedRow: Object.keys(unmatchedByMonth).length > 0 ? { label: 'Unmatched', actualByMonth: unmatchedByMonth } : null,
  };
}

export function VarianceView({ transactions, scenario }) {
  const expenses = scenario?.expenses || [];

  const months = useMemo(() => [...new Set(transactions.map((t) => monthKey(t.txn_date)))].sort(), [transactions]);
  const { lineRows, unmatchedRow } = useMemo(() => buildRows(transactions, expenses), [transactions, expenses]);

  if (months.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-8 text-center text-sm text-slate-500 dark:text-white/50">
        No imported transactions yet for this profile.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/10">
        <h2 className="font-semibold text-slate-800 dark:text-white/90">Actual vs Budgeted</h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          Compared against "{scenario?.name}", each line converted to a monthly figure. Red means that month ran over budget.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50 border-b border-slate-200 dark:border-white/10">
            <tr>
              <th className="px-4 py-3 font-semibold">Line</th>
              {months.map((m) => (
                <th key={m} className="px-4 py-3 font-semibold text-right whitespace-nowrap">
                  {monthLabel(m)}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-right whitespace-nowrap">Budgeted / mo</th>
            </tr>
          </thead>
          <tbody>
            {lineRows.map((row) => (
              <tr key={row.key} className="border-b border-slate-100 dark:border-white/10">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-white/90">{row.label}</td>
                {months.map((m) => {
                  const actual = row.actualByMonth[m] || 0;
                  const over = actual > row.budgetedMonthly;
                  return (
                    <td
                      key={m}
                      className={`px-4 py-3 text-right tabular-nums ${over ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-600 dark:text-white/70'}`}
                    >
                      {actual > 0 ? formatCurrency(actual) : '—'}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-white/50">{formatCurrency(row.budgetedMonthly)}</td>
              </tr>
            ))}
            {unmatchedRow && (
              <tr className="bg-slate-50 dark:bg-white/5">
                <td className="px-4 py-3 font-medium text-slate-500 dark:text-white/50">{unmatchedRow.label}</td>
                {months.map((m) => (
                  <td key={m} className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-white/50">
                    {unmatchedRow.actualByMonth[m] ? formatCurrency(unmatchedRow.actualByMonth[m]) : '—'}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-slate-400 dark:text-white/40">—</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
