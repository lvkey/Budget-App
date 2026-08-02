import { useState } from 'react';
import { formatCurrency } from '../lib/format';

const R = 80;
const STROKE = 28;
const CIRCUMFERENCE = 2 * Math.PI * R;
const GAP = CIRCUMFERENCE * 0.006;
const OTHER_THRESHOLD = 0.04;
const MAX_CATEGORY_SLICES = 7;

const SAVINGS_COLOR = '#008300';
const OTHER_COLOR = '#94a3b8';
const CATEGORY_PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7', '#e34948'];

function buildSlices(income, savings, expenseItems) {
  const positiveExpenses = expenseItems.filter((e) => e.value > 0);
  const totalExpenses = positiveExpenses.reduce((sum, e) => sum + e.value, 0);
  const overspend = savings < 0 ? -savings : 0;
  const denominator = Math.max(income, totalExpenses, 0.01);

  const threshold = denominator * OTHER_THRESHOLD;
  const sorted = [...positiveExpenses].sort((a, b) => b.value - a.value);
  const above = [];
  const below = [];
  sorted.forEach((e) => (e.value >= threshold ? above : below).push(e));
  while (above.length > MAX_CATEGORY_SLICES) below.push(above.pop());
  const otherValue = below.reduce((sum, e) => sum + e.value, 0);

  const slices = [];
  if (savings > 0) slices.push({ key: 'savings', label: 'Savings', value: savings, color: SAVINGS_COLOR, kind: 'savings' });
  above.forEach((e, i) => slices.push({ key: e.id, label: e.name || 'Untitled expense', value: e.value, color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length], kind: 'expense' }));
  if (otherValue > 0) slices.push({ key: 'other', label: 'Other Expenses', value: otherValue, color: OTHER_COLOR, kind: 'other', items: below });

  let cursor = 0;
  const positioned = slices.map((s) => {
    const pct = (s.value / denominator) * 100;
    const len = Math.max((pct / 100) * CIRCUMFERENCE - GAP, 0);
    const offset = (cursor / 100) * CIRCUMFERENCE;
    cursor += pct;
    return { ...s, pct, len, offset };
  });

  return { slices: positioned, overspend };
}

function OtherExpensesDetail({ items }) {
  return (
    <span className="pointer-events-none absolute z-20 left-0 bottom-full mb-2 hidden group-hover:block group-focus-within:block w-64 rounded-lg bg-slate-800 dark:bg-black px-3 py-2 text-xs text-white shadow-lg">
      <span className="block font-semibold mb-1">Included in Other Expenses</span>
      <span className="block space-y-0.5">
        {items.map((it) => (
          <span key={it.id} className="flex justify-between gap-3">
            <span className="truncate">{it.name || 'Untitled expense'}</span>
            <span className="tabular-nums shrink-0">{formatCurrency(it.value)}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

function LegendRow({ slice, isHovered, onHover, onLeave }) {
  const isOther = slice.kind === 'other';
  return (
    <div
      tabIndex={0}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      className={`group relative flex items-center justify-between rounded-lg px-3 sm:px-4 py-3 outline-none transition-colors ${
        isHovered ? 'bg-slate-100 dark:bg-white/10' : 'bg-slate-50 dark:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
        <span className="text-sm font-medium text-slate-700 dark:text-white/80 truncate">{slice.label}</span>
      </div>
      <div className="text-right shrink-0 pl-2">
        <div className="text-sm font-semibold text-slate-800 dark:text-white/90 tabular-nums">{formatCurrency(slice.value)}</div>
        <div className="text-xs text-slate-400 dark:text-white/40 tabular-nums">{slice.pct.toFixed(1)}%</div>
      </div>
      {isOther && <OtherExpensesDetail items={slice.items} />}
    </div>
  );
}

export function IncomeExpensePie({ income, savings, expenses, periodLabel }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const { slices, overspend } = buildSlices(income, savings, expenses);

  if (income <= 0 && slices.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-white/50">
        Add an income and some expenses to see this chart
      </div>
    );
  }

  const hovered = slices.find((s) => s.key === hoveredKey);

  return (
    <div className="w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        <svg viewBox="0 0 200 200" className="w-44 h-44 sm:w-56 sm:h-56 shrink-0" role="img" aria-label="Income allocation across savings and expense categories">
          <circle cx="100" cy="100" r={R} fill="none" stroke="currentColor" className="text-slate-200 dark:text-white/10" strokeWidth={STROKE} />
          {slices.map((s) => (
            <circle
              key={s.key}
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDasharray={`${s.len} ${CIRCUMFERENCE - s.len}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
              strokeOpacity={hoveredKey && hoveredKey !== s.key ? 0.35 : 1}
              transform="rotate(-90 100 100)"
              className="transition-opacity cursor-pointer"
              onMouseEnter={() => setHoveredKey(s.key)}
              onMouseLeave={() => setHoveredKey((k) => (k === s.key ? null : k))}
            />
          ))}
          {hovered ? (
            <>
              <text x="100" y="94" textAnchor="middle" className="fill-slate-800 dark:fill-white" style={{ fontSize: 15, fontWeight: 700 }}>
                {formatCurrency(hovered.value)}
              </text>
              <text x="100" y="112" textAnchor="middle" className="fill-slate-400 dark:fill-white/50" style={{ fontSize: 10 }}>
                {hovered.label} &middot; {hovered.pct.toFixed(1)}%
              </text>
            </>
          ) : (
            <>
              <text x="100" y="96" textAnchor="middle" className="fill-slate-800 dark:fill-white" style={{ fontSize: 20, fontWeight: 700 }}>
                {formatCurrency(income)}
              </text>
              <text x="100" y="117" textAnchor="middle" className="fill-slate-400 dark:fill-white/50" style={{ fontSize: 11 }}>
                {periodLabel.toLowerCase()} income
              </text>
            </>
          )}
        </svg>
        <div className="flex-1 w-full min-w-0 space-y-2">
          {slices.map((s) => (
            <LegendRow
              key={s.key}
              slice={s}
              isHovered={hoveredKey === s.key}
              onHover={() => setHoveredKey(s.key)}
              onLeave={() => setHoveredKey((k) => (k === s.key ? null : k))}
            />
          ))}
        </div>
      </div>
      {overspend > 0 && (
        <p className="mt-4 text-xs text-red-500 dark:text-red-400">
          Expenses exceed {periodLabel.toLowerCase()} income by {formatCurrency(overspend)}
        </p>
      )}
    </div>
  );
}
