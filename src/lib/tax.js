// Australian resident individual tax, 2026-27 rates (ATO). Kept intentionally
// simple - no Low Income Tax Offset, and HELP repayment income is
// approximated as taxable income (no fringe benefits / super add-backs).
// Good enough for budgeting, not for lodging a return.
// Reference: https://paycalculator.com.au/

const INCOME_TAX_BRACKETS = [
  { upTo: 18200, rate: 0 },
  { upTo: 45000, rate: 0.15 },
  { upTo: 135000, rate: 0.3 },
  { upTo: 190000, rate: 0.37 },
  { upTo: Infinity, rate: 0.45 },
];

export function calculateIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let lowerBound = 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableIncome <= lowerBound) break;
    tax += (Math.min(taxableIncome, bracket.upTo) - lowerBound) * bracket.rate;
    lowerBound = bracket.upTo;
  }
  return tax;
}

// Medicare levy: nil below the low-income threshold, phases in at 10c per
// dollar, then a flat 2% once fully phased in.
const MEDICARE_LEVY_RATE = 0.02;
const MEDICARE_LEVY_LOWER_THRESHOLD = 28011;
const MEDICARE_LEVY_UPPER_THRESHOLD = 35013;

export function calculateMedicareLevy(taxableIncome) {
  if (taxableIncome <= MEDICARE_LEVY_LOWER_THRESHOLD) return 0;
  if (taxableIncome <= MEDICARE_LEVY_UPPER_THRESHOLD) {
    return (taxableIncome - MEDICARE_LEVY_LOWER_THRESHOLD) * 0.1;
  }
  return taxableIncome * MEDICARE_LEVY_RATE;
}

// HELP/HECS compulsory repayment, marginal system in effect since 1 July 2025.
const HELP_THRESHOLD_1 = 69528;
const HELP_THRESHOLD_2 = 129717;
const HELP_THRESHOLD_3 = 186050;
const HELP_BASE_AT_THRESHOLD_2 = (HELP_THRESHOLD_2 - HELP_THRESHOLD_1) * 0.15;

export function calculateHelpRepayment(taxableIncome) {
  if (taxableIncome < HELP_THRESHOLD_1) return 0;
  if (taxableIncome <= HELP_THRESHOLD_2) return (taxableIncome - HELP_THRESHOLD_1) * 0.15;
  if (taxableIncome <= HELP_THRESHOLD_3) return HELP_BASE_AT_THRESHOLD_2 + (taxableIncome - HELP_THRESHOLD_2) * 0.17;
  return taxableIncome * 0.1;
}

// Medicare Levy Surcharge: an extra 1% / 1.25% / 1.5% on top of the base levy
// for higher earners without private hospital cover. Eligibility and rate are
// assessed on combined household income against the family thresholds when a
// partner income is present, otherwise against the single thresholds - but
// the resulting rate is applied to each person's own income separately, same
// as how the ATO assesses couples. 2026-27 ATO thresholds; the family
// threshold rises $1,500 for each dependent child after the first. "Family"
// status here is simplified to "has partner income entered" - the ATO's
// definition is broader (e.g. single parents), which this doesn't model.
const MLS_SINGLE_TIERS = [
  { upTo: 105000, rate: 0 },
  { upTo: 123000, rate: 0.01 },
  { upTo: 164000, rate: 0.0125 },
  { upTo: Infinity, rate: 0.015 },
];
const MLS_FAMILY_TIERS = [
  { upTo: 210000, rate: 0 },
  { upTo: 246000, rate: 0.01 },
  { upTo: 328000, rate: 0.0125 },
  { upTo: Infinity, rate: 0.015 },
];
const MLS_DEPENDENT_CHILD_THRESHOLD_INCREASE = 1500;

export function calculateMedicareLevySurcharge(combinedIncome, { isFamily = false, dependentChildren = 0 } = {}) {
  const income = Math.max(Number(combinedIncome) || 0, 0);
  const childAdjustment = isFamily ? Math.max(0, dependentChildren - 1) * MLS_DEPENDENT_CHILD_THRESHOLD_INCREASE : 0;
  const tiers = (isFamily ? MLS_FAMILY_TIERS : MLS_SINGLE_TIERS).map((t) => ({
    ...t,
    upTo: t.upTo === Infinity ? Infinity : t.upTo + childAdjustment,
  }));
  const tier = tiers.find((t) => income <= t.upTo) ?? tiers[tiers.length - 1];
  return { rate: tier.rate, thresholds: tiers };
}

function personTax(income, { medicareLevy, hecsHelp, surchargeRate }) {
  const incomeTax = calculateIncomeTax(income);
  const medicare = medicareLevy ? calculateMedicareLevy(income) : 0;
  const helpRepayment = hecsHelp ? calculateHelpRepayment(income) : 0;
  const surcharge = income * surchargeRate;
  const totalTax = incomeTax + medicare + helpRepayment + surcharge;
  return { grossIncome: income, incomeTax, medicareLevy: medicare, helpRepayment, surcharge, totalTax, netIncome: income - totalTax };
}

export function calculateHousehold(primaryIncome, partnerIncome, {
  medicareLevy = true,
  primaryHecsHelp = false,
  partnerHecsHelp = false,
  hasPrivateCover = true,
  dependentChildren = 0,
} = {}) {
  const primaryIncomeAmount = Math.max(Number(primaryIncome) || 0, 0);
  const partnerIncomeAmount = Math.max(Number(partnerIncome) || 0, 0);
  const hasPartner = partnerIncomeAmount > 0;
  const combinedIncome = primaryIncomeAmount + partnerIncomeAmount;

  const mls = hasPrivateCover
    ? { rate: 0, thresholds: null }
    : calculateMedicareLevySurcharge(combinedIncome, { isFamily: hasPartner, dependentChildren });

  const primary = personTax(primaryIncomeAmount, { medicareLevy, hecsHelp: primaryHecsHelp, surchargeRate: mls.rate });
  const partner = hasPartner
    ? personTax(partnerIncomeAmount, { medicareLevy, hecsHelp: partnerHecsHelp, surchargeRate: mls.rate })
    : null;

  return {
    primary,
    partner,
    combinedIncome,
    surchargeRate: mls.rate,
    surchargeApplies: mls.rate > 0,
    totalSurcharge: primary.surcharge + (partner?.surcharge ?? 0),
    totalTax: primary.totalTax + (partner?.totalTax ?? 0),
    netIncome: primary.netIncome + (partner?.netIncome ?? 0),
  };
}
