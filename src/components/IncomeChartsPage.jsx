import { PieChart, BarChart3 } from 'lucide-react';
import { IncomeExpensePie } from './IncomeExpensePie';
import { ExpenseBarChart } from './ExpenseBarChart';

export function IncomeChartsPage({ chartView, onChangeChartView, pieProps, barProps }) {
  const periodLabel = barProps.viewFrequency.adjective.toLowerCase();
  const subtitle = chartView === 'pie'
    ? `How your ${periodLabel} income splits across savings and each expense category`
    : `Ranked by ${periodLabel} cost, highest first`;

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white/90">Income vs Expenses</h2>
          <p className="text-sm text-slate-500 dark:text-white/50 mt-1">{subtitle}</p>
        </div>
        <div className="inline-flex bg-slate-100 dark:bg-white/5 rounded-lg p-1 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onChangeChartView('pie')}
            className={`flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-1.5 transition-colors ${
              chartView === 'pie'
                ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80'
            }`}
          >
            <PieChart size={15} />
            Pie
          </button>
          <button
            type="button"
            onClick={() => onChangeChartView('bar')}
            className={`flex items-center gap-1.5 text-sm font-medium rounded-md px-3 py-1.5 transition-colors ${
              chartView === 'bar'
                ? 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80'
            }`}
          >
            <BarChart3 size={15} />
            Bar
          </button>
        </div>
      </div>
      {chartView === 'pie' ? <IncomeExpensePie {...pieProps} periodLabel={barProps.viewFrequency.adjective} /> : <ExpenseBarChart {...barProps} />}
    </div>
  );
}
