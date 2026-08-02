import { useState } from 'react';
import { formatCurrency } from '../lib/format';
import { categorizeExpenseName } from '../lib/expenseCategories';

const R = 80;
const STROKE = 28;
const CIRCUMFERENCE = 2 * Math.PI * R;
const GAP = CIRCUMFERENCE * 0.006;
const OTHER_THRESHOLD = 0.05;
const MAX_CATEGORY_SLICES = 7;
const FALLBACK_GROUP_NAME = 'Other Expenses';

const SAVINGS_COLOR = '#008300';
const CATEGORY_PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7', '#e34948'];
const GROUP_PALETTE = ['#94a3b8', '#78716c', '#a1a1aa', '#8a8f98', '#71717a', '#9ca3af'];

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

  // Below-threshold expenses are lumped by category (e.g. Utilities, Vehicle)
  // instead of one generic bucket, so the chart stays readable without hiding
  // what those small expenses actually are. Unmatched ones fall back to
  // "Other Expenses".
  const groupOrder = [];
  const groupsByName = new Map();
  below.forEach((e) => {
    const name = categorizeExpenseName(e.name) || FALLBACK_GROUP_NAME;
    if (!groupsByName.has(name)) {
      groupsByName.set(name, []);
      groupOrder.push(name);
    }
    groupsByName.get(name).push(e);
  });
  const groups = groupOrder
    .map((name) => ({ name, items: groupsByName.get(name), value: groupsByName.get(name).reduce((sum, e) => sum + e.value, 0) }))
    .sort((a, b) => (a.name === FALLBACK_GROUP_NAME ? 1 : b.name === FALLBACK_GROUP_NAME ? -1 : b.value - a.value));

  const slices = [];
  if (savings > 0) slices.push({ key: 'savings', label: 'Savings', value: savings, color: SAVINGS_COLOR, kind: 'savings' });
  above.forEach((e, i) => slices.push({ key: e.id, label: e.name || 'Untitled expense', value: e.value, color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length], kind: 'expense' }));
  groups.forEach((g, i) => {
    if (g.value <= 0) return;
    slices.push({ key: `group-${g.name}`, label: g.name, value: g.value, color: GROUP_PALETTE[i % GROUP_PALETTE.length], kind: 'group', items: g.items });
  });

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

function GroupDetail({ label, items }) {
  return (
    <span className="pointer-events-none absolute z-20 left-0 bottom-full mb-2 hidden group-hover:block group-focus-within:block w-64 rounded-lg bg-slate-800 dark:bg-black px-3 py-2 text-xs text-white shadow-lg">
      <span className="block font-semibold mb-1">Included in {label}</span>
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
  const isGroup = slice.kind === 'group';
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
        <div className="text-xs text-slate-500 dark:text-white/60 tabular-nums">{slice.pct.toFixed(1)}%</div>
      </div>
      {isGroup && <GroupDetail label={slice.label} items={slice.items} />}
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
              <text x="100" y="112" textAnchor="middle" className="fill-slate-500 dark:fill-white/60" style={{ fontSize: 10 }}>
                {hovered.label} &middot; {hovered.pct.toFixed(1)}%
              </text>
            </>
          ) : (
            <>
              <text x="100" y="96" textAnchor="middle" className="fill-slate-800 dark:fill-white" style={{ fontSize: 20, fontWeight: 700 }}>
                {formatCurrency(income)}
              </text>
              <text x="100" y="117" textAnchor="middle" className="fill-slate-500 dark:fill-white/60" style={{ fontSize: 11 }}>
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
