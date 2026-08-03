import { useState } from 'react';
import { MoneyInput } from './MoneyInput';
import { formatCurrency } from '../lib/format';
import { calculateMedicareLevySurcharge } from '../lib/tax';
import { categorizeExpenseName } from '../lib/expenseCategories';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-700 dark:text-white/80">{label}</div>
        {description && <div className="text-xs text-slate-500 dark:text-white/60">{description}</div>}
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

function PersonTaxBreakdown({ label, breakdown, medicareLevy, hecsHelp, showSurcharge }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider">{label}</div>
      <TaxLine label="Income tax" amount={breakdown.incomeTax} />
      {medicareLevy && <TaxLine label="Medicare levy" amount={breakdown.medicareLevy} />}
      {hecsHelp && <TaxLine label="HECS/HELP repayment" amount={breakdown.helpRepayment} />}
      {showSurcharge && breakdown.surcharge > 0 && <TaxLine label="Medicare levy surcharge" amount={breakdown.surcharge} />}
      <div className="flex justify-between font-medium text-slate-700 dark:text-white/80">
        <span>Net income</span>
        <span className="tabular-nums">{formatCurrency(breakdown.netIncome)}</span>
      </div>
    </div>
  );
}

export function IncomeEditor({
  income,
  onChangeIncome,
  medicareLevy,
  hecsHelp,
  onToggleMedicareLevy,
  onToggleHecsHelp,
  partnerIncome,
  onChangePartnerIncome,
  partnerHecsHelp,
  onTogglePartnerHecsHelp,
  hasPrivateHospitalCover,
  onToggleHasPrivateHospitalCover,
  dependentChildren,
  onChangeDependentChildren,
  expenses,
  taxBreakdown,
}) {
  const [showPartner, setShowPartner] = useState(partnerIncome != null);

  const hasPartner = showPartner && partnerIncome != null;
  const combinedIncome = (Number(income) || 0) + (hasPartner ? Number(partnerIncome) || 0 : 0);
  const mlsCheck = calculateMedicareLevySurcharge(combinedIncome, { isFamily: hasPartner, dependentChildren });
  const inSurchargeRange = mlsCheck.rate > 0;

  const hasHealthExpense = (expenses || []).some((e) => categorizeExpenseName(e.name) === 'Health & Fitness');

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-6 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">
          {hasPartner ? 'Your Annual Income (Gross)' : 'Annual Income (Gross)'}
        </label>
        <div className="flex items-center gap-1 max-w-xs">
          <span className="text-xl font-bold text-slate-800 dark:text-white/90">$</span>
          <MoneyInput
            value={income}
            onChange={onChangeIncome}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-xl font-bold text-slate-800 dark:text-white/90 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700 dark:text-white/80">
        <input
          type="checkbox"
          checked={showPartner}
          onChange={(e) => {
            const checked = e.target.checked;
            setShowPartner(checked);
            if (!checked) onChangePartnerIncome(null);
            else if (partnerIncome == null) onChangePartnerIncome(0);
          }}
          className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-blue-500 focus:ring-blue-400"
        />
        Add partner income
      </label>

      {hasPartner && (
        <div className="pl-6 space-y-3 border-l-2 border-slate-100 dark:border-white/10">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">
              Partner's Annual Income (Gross)
            </label>
            <div className="flex items-center gap-1 max-w-xs">
              <span className="text-xl font-bold text-slate-800 dark:text-white/90">$</span>
              <MoneyInput
                value={partnerIncome}
                onChange={onChangePartnerIncome}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-xl font-bold text-slate-800 dark:text-white/90 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <ToggleRow
            label="Partner has HECS / HELP debt"
            description="Compulsory study loan repayment, calculated on their own income"
            checked={partnerHecsHelp}
            onChange={onTogglePartnerHecsHelp}
          />
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">
              Number of dependent children
            </label>
            <input
              type="number"
              min="0"
              value={dependentChildren}
              onChange={(e) => onChangeDependentChildren(Math.max(0, Number(e.target.value) || 0))}
              className="w-24 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white/90 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      )}

      <div className="border-t border-slate-100 dark:border-white/10 pt-4 divide-y divide-slate-100 dark:divide-white/10">
        <ToggleRow label="Medicare Levy" description="2% of taxable income" checked={medicareLevy} onChange={onToggleMedicareLevy} />
        <ToggleRow label="HECS / HELP repayment" description="Compulsory study loan repayment" checked={hecsHelp} onChange={onToggleHecsHelp} />
      </div>

      {inSurchargeRange && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {hasPartner ? 'Your combined income' : 'Your income'} of {formatCurrency(combinedIncome)} is in the Medicare
            Levy Surcharge range. Do you have private hospital cover?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onToggleHasPrivateHospitalCover(true)}
              className={`text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ${
                hasPrivateHospitalCover === true
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-white/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onToggleHasPrivateHospitalCover(false)}
              className={`text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ${
                hasPrivateHospitalCover === false
                  ? 'bg-amber-500 text-white'
                  : 'bg-white dark:bg-white/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
              }`}
            >
              No
            </button>
          </div>
          {hasPrivateHospitalCover === true && !hasHealthExpense && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Make sure your budget includes a private health insurance expense to match.
            </p>
          )}
        </div>
      )}

      <div className="border-t border-slate-100 dark:border-white/10 pt-4 space-y-4 text-sm">
        <PersonTaxBreakdown
          label={hasPartner ? 'Your Tax' : 'Tax'}
          breakdown={taxBreakdown.primary}
          medicareLevy={medicareLevy}
          hecsHelp={hecsHelp}
          showSurcharge={taxBreakdown.surchargeApplies}
        />
        {hasPartner && taxBreakdown.partner && (
          <PersonTaxBreakdown
            label="Partner's Tax"
            breakdown={taxBreakdown.partner}
            medicareLevy={medicareLevy}
            hecsHelp={partnerHecsHelp}
            showSurcharge={taxBreakdown.surchargeApplies}
          />
        )}
        <div className="flex justify-between font-semibold text-slate-800 dark:text-white/90 pt-2.5 mt-1 border-t border-slate-100 dark:border-white/10">
          <span>{hasPartner ? 'Household Net Annual Income' : 'Net Annual Income'}</span>
          <span className="tabular-nums">{formatCurrency(taxBreakdown.netIncome)}</span>
        </div>
      </div>
    </div>
  );
}
