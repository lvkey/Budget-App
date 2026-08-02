// Australian resident individual tax, 2026-27 rates (ATO). Kept intentionally
// simple - no Low Income Tax Offset, no Medicare Levy Surcharge, and HELP
// repayment income is approximated as taxable income (no fringe benefits /
// super add-backs). Good enough for budgeting, not for lodging a return.
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

export function calculateAfterTaxIncome(grossIncome, { medicareLevy = true, hecsHelp = false } = {}) {
  const income = Math.max(Number(grossIncome) || 0, 0);
  const incomeTax = calculateIncomeTax(income);
  const medicare = medicareLevy ? calculateMedicareLevy(income) : 0;
  const helpRepayment = hecsHelp ? calculateHelpRepayment(income) : 0;
  const totalTax = incomeTax + medicare + helpRepayment;
  return { grossIncome: income, incomeTax, medicareLevy: medicare, helpRepayment, totalTax, netIncome: income - totalTax };
}
