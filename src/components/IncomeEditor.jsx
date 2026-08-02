import { MoneyInput } from './MoneyInput';
import { formatCurrency } from '../lib/format';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-700 dark:text-white/80">{label}</div>
        {description && <div className="text-xs text-slate-400 dark:text-white/40">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-slate-300 dark:bg-white/20'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}

function TaxLine({ label, amount }) {
  return (
    <div className="flex justify-between text-slate-500 dark:text-white/50">
      <span>{label}</span>
      <span className="tabular-nums">-{formatCurrency(amount)}</span>
    </div>
  );
}

export function IncomeEditor({ income, onChangeIncome, medicareLevy, hecsHelp, onToggleMedicareLevy, onToggleHecsHelp, taxBreakdown }) {
  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">Annual Income (Gross)</label>
        <div className="flex items-center gap-1 max-w-xs">
          <span className="text-xl font-bold text-slate-800 dark:text-white/90">$</span>
          <MoneyInput
            value={income}
            onChange={onChangeIncome}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-xl font-bold text-slate-800 dark:text-white/90 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-white/10 pt-4 divide-y divide-slate-100 dark:divide-white/10">
        <ToggleRow label="Medicare Levy" description="2% of taxable income" checked={medicareLevy} onChange={onToggleMedicareLevy} />
        <ToggleRow label="HECS / HELP repayment" description="Compulsory study loan repayment" checked={hecsHelp} onChange={onToggleHecsHelp} />
      </div>

      <div className="border-t border-slate-100 dark:border-white/10 pt-4 space-y-1.5 text-sm">
        <TaxLine label="Income tax" amount={taxBreakdown.incomeTax} />
        {medicareLevy && <TaxLine label="Medicare levy" amount={taxBreakdown.medicareLevy} />}
        {hecsHelp && <TaxLine label="HECS/HELP repayment" amount={taxBreakdown.helpRepayment} />}
        <div className="flex justify-between font-semibold text-slate-800 dark:text-white/90 pt-1.5 mt-1.5 border-t border-slate-100 dark:border-white/10">
          <span>Net Annual Income</span>
          <span className="tabular-nums">{formatCurrency(taxBreakdown.netIncome)}</span>
        </div>
      </div>
    </div>
  );
}
