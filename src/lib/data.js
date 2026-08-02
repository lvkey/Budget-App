export const FREQ_OPTIONS = ['Week', 'Month', 'Quarter', 'Year'];

// Every frequency is normalized through its length in days, so conversions between
// frequencies that don't divide evenly (e.g. weekly -> monthly) use the actual
// calendar year (365 days) rather than a rough 52-week approximation.
export const DAYS_IN_PERIOD = {
  Week: 7,
  Fortnight: 14,
  Month: 365 / 12,
  Quarter: 365 / 4,
  Year: 365,
};

export function convertCost(amount, fromFreq, toFreq) {
  const dailyRate = amount / DAYS_IN_PERIOD[fromFreq];
  return dailyRate * DAYS_IN_PERIOD[toFreq];
}

export const OVERVIEW_KEY = 'Overview';

export const VIEW_FREQUENCIES = [
  { key: OVERVIEW_KEY, label: 'Overview', adjective: 'Overview' },
  { key: 'Week', label: 'Weekly', adjective: 'Weekly' },
  { key: 'Fortnight', label: 'Fortnightly', adjective: 'Fortnightly' },
  { key: 'Month', label: 'Monthly', adjective: 'Monthly' },
  { key: 'Quarter', label: 'Quarterly', adjective: 'Quarterly' },
  { key: 'Year', label: 'Annually', adjective: 'Annual' },
];

// A short starter list of the main expense categories, used as the template
// for any newly-created scenario. Costs start at $0 for the user to fill in.
export const EXAMPLE_EXPENSE_TEMPLATE = [
  { id: 'rent', name: 'Rent', freq: 'Week', cost: 0 },
  { id: 'utilities', name: 'Utilities', freq: 'Month', cost: 0 },
  { id: 'groceries', name: 'Groceries', freq: 'Week', cost: 0 },
  { id: 'vehicle', name: 'Vehicle Expenses', freq: 'Month', cost: 0 },
  { id: 'insurance', name: 'Insurance', freq: 'Month', cost: 0 },
];

function scenario(id, name, income, expenses) {
  return { id, name, income, expenses, medicareLevy: true, hecsHelp: false };
}

// Generic placeholder numbers for brand-new visitors — not anyone's real budget.
const EXAMPLE_EXPENSES = [
  { id: 'rent', name: 'Rent', freq: 'Month', cost: 650 },
  { id: 'utilities', name: 'Utilities', freq: 'Month', cost: 150 },
  { id: 'groceries', name: 'Groceries', freq: 'Week', cost: 120 },
  { id: 'vehicle', name: 'Vehicle Expenses', freq: 'Month', cost: 200 },
  { id: 'insurance', name: 'Insurance', freq: 'Month', cost: 100 },
];

export const DEFAULT_SCENARIOS = [
  scenario('scenario-example', 'Example Budget', 60000, EXAMPLE_EXPENSES.map((e) => ({ ...e }))),
];
