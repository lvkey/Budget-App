import { useState } from 'react';
import { formatCurrency, formatCompactCurrency } from '../lib/format';
import { niceTicks } from '../lib/ticks';
import { InfoTooltip } from './InfoTooltip';

const ROW_TEMPLATE = 'minmax(90px, 240px) 1fr minmax(64px, 96px)';

export function ExpenseBarChart({ data, totalDisplayed }) {
  const [hoveredId, setHoveredId] = useState(null);

  const rows = [...data].sort((a, b) => b.displayCost - a.displayCost);

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-white/50">
        No expenses yet. Add one from the dashboard to see it here
      </div>
    );
  }

  const maxValue = Math.max(...rows.map((r) => r.displayCost), 0);
  const { ticks, niceMax } = niceTicks(maxValue);
  const compactLabels = ticks.length > 1 && ticks[1] >= 1000;

  return (
    <div className="w-full min-w-0">
      <div className="grid gap-y-3 w-full min-w-0" style={{ gridTemplateColumns: ROW_TEMPLATE }}>
        {rows.map((item) => {
          const pct = niceMax > 0 ? (item.displayCost / niceMax) * 100 : 0;
          const shareOfTotal = totalDisplayed > 0 ? (item.displayCost / totalDisplayed) * 100 : 0;
          const isHovered = hoveredId === item.id;
          return (
            <div className="contents" key={item.id}>
              <div className="flex min-w-0 items-center text-xs sm:text-sm font-medium text-slate-700 dark:text-white/80">
                <span className="truncate">{item.name || 'Untitled expense'}</span>
                <InfoTooltip text={item.details} />
              </div>
              <div
                className="relative h-6 self-center rounded bg-slate-100 dark:bg-white/5 min-w-0"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId((id) => (id === item.id ? null : id))}
              >
                <div className="absolute inset-0 pointer-events-none">
                  {ticks.slice(1, -1).map((t) => (
                    <span key={t} className="absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-white/10" style={{ left: `${(t / niceMax) * 100}%` }} />
                  ))}
                </div>
                <div
                  className={`h-full rounded-r transition-colors ${isHovered ? 'bg-blue-600 dark:bg-blue-400' : 'bg-blue-500 dark:bg-blue-500'}`}
                  style={{ width: `${Math.max(pct, 1.5)}%` }}
                />
                {isHovered && (
                  <div className="absolute -top-9 left-0 z-20 whitespace-nowrap rounded-lg bg-slate-800 dark:bg-black px-2.5 py-1.5 text-xs text-white shadow-lg">
                    {formatCurrency(item.displayCost)} &middot; {shareOfTotal.toFixed(1)}% of total
                  </div>
                )}
              </div>
              <div className="self-center text-right text-xs sm:text-sm font-semibold text-slate-700 dark:text-white/90 tabular-nums truncate">
                {formatCurrency(item.displayCost)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid w-full min-w-0" style={{ gridTemplateColumns: ROW_TEMPLATE }}>
        <div />
        <div className="relative h-4 text-[10px] sm:text-[11px] text-slate-500 dark:text-white/60">
          {ticks.map((t, i) => {
            const style =
              i === 0
                ? { left: 0 }
                : i === ticks.length - 1
                ? { right: 0 }
                : { left: `${(i / (ticks.length - 1)) * 100}%`, transform: 'translateX(-50%)' };
            return (
              <span key={i} className="absolute tabular-nums" style={style}>
                {compactLabels ? formatCompactCurrency(t) : formatCurrency(t)}
              </span>
            );
          })}
        </div>
        <div />
      </div>
    </div>
  );
}
