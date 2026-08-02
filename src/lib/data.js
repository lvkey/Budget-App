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
  return { id, name, income, expenses };
}

const HM_EXPENSES = [
  { id: 'rent', name: 'Rent', freq: 'Week', cost: 400 },
  { id: 'water', name: 'Water', freq: 'Quarter', cost: 150 },
  { id: 'electricity', name: 'Electricity', freq: 'Month', cost: 100 },
  { id: 'private_health', name: 'Private Health', freq: 'Month', cost: 175 },
  { id: 'groceries', name: 'Groceries', details: 'Includes takeout, beer, pets', freq: 'Week', cost: 200 },
  { id: 'internet', name: 'Internet', freq: 'Month', cost: 50 },
  { id: 'phone', name: 'Phone', freq: 'Month', cost: 125 },
  { id: 'streaming', name: 'Streaming', freq: 'Month', cost: 30 },
  { id: 'youtube', name: 'YouTube', freq: 'Year', cost: 159.99 },
  { id: 'icloud', name: 'Apple iCloud', freq: 'Month', cost: 2.5 },
  { id: 'rego', name: 'Rego', freq: 'Year', cost: 847.7 },
  { id: 'car_insurance', name: 'Car Insurance', freq: 'Month', cost: 175 },
  { id: 'car_payment', name: 'Car Payment', freq: 'Month', cost: 462.65 },
  { id: 'fuel', name: 'Fuel', freq: 'Week', cost: 100 },
  { id: 'car_services', name: 'Car Services', freq: 'Year', cost: 700 },
  { id: 'gym', name: 'Gym', freq: 'Week', cost: 27.95 },
  { id: 'language_school', name: 'SNG Language School', freq: 'Quarter', cost: 400 },
  { id: 'tutor', name: 'Tutor', freq: 'Month', cost: 100 },
  { id: 'misc', name: 'Misc spending', details: 'Includes fun', freq: 'Week', cost: 150 },
  { id: 'health', name: 'Health (Physio/Psych)', freq: 'Month', cost: 200 },
];

function soloExpenses(miscCost) {
  return HM_EXPENSES.map((item) => {
    if (item.id === 'rent') return { ...item, cost: 650 };
    if (item.id === 'internet') return { ...item, cost: 100 };
    if (item.id === 'misc') return { ...item, cost: miscCost };
    return { ...item };
  });
}

export const DEFAULT_SCENARIOS = [
  scenario('scenario-hm-110k', 'Sharehousing ($110k)', 110000, HM_EXPENSES.map((e) => ({ ...e }))),
  scenario('scenario-hm-150k', 'Sharehousing ($150k)', 150000, HM_EXPENSES.map((e) => ({ ...e }))),
  scenario('scenario-solo-110k', 'Living Solo ($110k)', 110000, soloExpenses(100)),
  scenario('scenario-solo-150k', 'Living Solo ($150k)', 150000, soloExpenses(150)),
];
