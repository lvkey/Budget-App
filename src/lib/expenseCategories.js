// Reference list used by the Income vs Expenses pie chart to lump small
// (below-threshold) expense slices into a shared category instead of one
// generic "Other Expenses" bucket. Matching is a case-insensitive substring
// check against the expense name, so custom expense names (e.g. "Netflix")
// still get grouped without needing an exact match against a fixed list.
// Add more keywords/groups here as new kinds of recurring expenses come up.
export const EXPENSE_CATEGORY_GROUPS = [
  {
    name: 'Groceries',
    keywords: ['groceries', 'grocery', 'supermarket'],
  },
  {
    name: 'Dining',
    keywords: ['restaurant', 'cafe', 'coffee', 'takeaway', 'take-away', 'dining', 'lunch', 'dinner'],
  },
  {
    name: 'Utilities',
    keywords: ['water', 'electric', 'gas', 'internet', 'phone', 'mobile', 'utilit', 'broadband'],
  },
  {
    name: 'Vehicle',
    keywords: ['car', 'vehicle', 'rego', 'registration', 'fuel', 'petrol', 'parking', 'toll'],
  },
  {
    name: 'Transport',
    keywords: ['transport', 'rideshare', 'taxi', 'train', 'bus', 'tram', 'flight', 'travel'],
  },
  {
    name: 'Shopping',
    keywords: ['shopping', 'retail', 'clothing', 'homewares'],
  },
  {
    name: 'Subscriptions',
    keywords: ['netflix', 'youtube', 'spotify', 'disney', 'hulu', 'prime video', 'icloud', 'streaming', 'subscription', 'apple music'],
  },
  {
    name: 'Health & Fitness',
    keywords: ['health', 'medical', 'physio', 'psych', 'dental', 'doctor', 'gym', 'fitness', 'pharmacy'],
  },
  {
    name: 'Education',
    keywords: ['school', 'tutor', 'course', 'education', 'training', 'language'],
  },
];

export function categorizeExpenseName(name) {
  const lower = (name || '').toLowerCase();
  const group = EXPENSE_CATEGORY_GROUPS.find((g) => g.keywords.some((kw) => lower.includes(kw)));
  return group ? group.name : null;
}
