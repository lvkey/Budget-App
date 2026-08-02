import { LayoutDashboard, PieChart, Sun, Moon, Home } from 'lucide-react';

const PAGES = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'income', label: 'Income vs Expenses', icon: PieChart },
];

export function PageHeader({ page, onSelectPage, isDark, onToggleDark }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
      <a
        href="https://lukeswift.net"
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/90 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 shadow-sm transition-colors"
      >
        <Home size={15} />
        Home
      </a>
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="inline-flex flex-wrap bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-lg p-1 gap-1 shadow-sm">
          {PAGES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelectPage(key)}
              className={`flex items-center gap-1.5 text-sm font-semibold rounded-md px-3 py-1.5 transition-colors ${
                page === key
                  ? 'bg-blue-500 dark:bg-blue-500 text-white'
                  : 'text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/90 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onToggleDark(!isDark)}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex items-center justify-center w-9 h-9 shrink-0 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/90 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg shadow-sm transition-colors"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
}
