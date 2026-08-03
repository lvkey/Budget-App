import { Wallet, PiggyBank, TrendingUp, CalendarDays, Receipt } from 'lucide-react';
import { formatCurrency, formatIncome } from '../lib/format';

function amountClass(value, base) {
  return value < 0 ? `${base} text-red-500 dark:text-red-400` : base;
}

function Card({ label, icon: Icon, value, hero }) {
  if (hero) {
    return (
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-4 sm:p-6 text-white shadow-md min-w-0">
        <div className="flex justify-between items-start">
          <p className="font-medium text-blue-50 text-sm sm:text-base">{label}</p>
          <Icon size={20} className="text-blue-100 shrink-0" />
        </div>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 truncate">{formatIncome(value)}</p>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm min-w-0">
      <div className="flex justify-between items-start">
        <p className="font-medium text-slate-500 dark:text-white/60 text-sm sm:text-base">{label}</p>
        <Icon size={20} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
      </div>
      <p className={amountClass(value, 'text-lg sm:text-xl lg:text-2xl font-bold mt-2 text-slate-800 dark:text-white/90 truncate')}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

const HORIZON_ICONS = [CalendarDays, PiggyBank, TrendingUp, TrendingUp];

export function SummaryCards({ isOverview, income, periodIncome, periodExpenses, periodSavings, annualSavings, periodLabel }) {
  if (!isOverview) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card label={`${periodLabel} Net Income`} icon={Wallet} value={periodIncome} hero />
        <Card label={`${periodLabel} Expenses`} icon={Receipt} value={periodExpenses} />
        <Card label={`${periodLabel} Savings`} icon={PiggyBank} value={periodSavings} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card label="Net Annual Income" icon={Wallet} value={income} hero />
      {[1, 2, 3, 5].map((years, i) => (
        <Card key={years} label={`${years}-Year Horizon`} icon={HORIZON_ICONS[i]} value={annualSavings * years} />
      ))}
    </div>
  );
}
