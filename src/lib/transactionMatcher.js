import { categorizeExpenseName } from './expenseCategories';
import { lookupCuratedMerchant } from './merchantDatabase';

// A bare merchant name like "WOOLWORTHS 2841 SYDNEY" strips down to
// "woolworths sydney" - stable across repeat visits to the same store, but
// deliberately not smart enough to guess a category from the name alone
// (that's the point: an ambiguous merchant should ask once, then remember).
export function normalizeMerchantKey(description) {
  const words = (description || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 3).join(' ');
}

// Confidence tiers, in the order they're checked:
//   'remembered' - a merchant you've personally confirmed before. Auto-applies,
//                   never shown again.
//   'confident'  - a well-known merchant from the curated database (src/lib/
//                   merchantDatabase.js). Pre-filled and easy to bulk-confirm,
//                   but still shown once so a rare miscategorization can be caught.
//   'likely'     - matches one of your own expense line names, or a generic
//                   category keyword. A reasonable guess, worth a glance.
//   'unmatched'  - no signal at all. Needs manual assignment.
// Only 'remembered' is ever applied without the user seeing it.
export function matchTransaction(description, { merchantRules = [], expenses = [] } = {}) {
  const merchantKey = normalizeMerchantKey(description);

  const rule = merchantRules.find((r) => r.merchant_key === merchantKey);
  if (rule) {
    return {
      confidence: 'remembered',
      merchantKey,
      matchedExpenseId: rule.matched_expense_id ?? null,
      category: rule.category ?? null,
    };
  }

  const curatedCategory = lookupCuratedMerchant(description);
  if (curatedCategory) {
    return {
      confidence: 'confident',
      merchantKey,
      matchedExpenseId: null,
      category: curatedCategory,
      suggestionReason: 'known-merchant',
    };
  }

  const lowerDescription = description.toLowerCase();
  const expenseMatch = expenses.find((e) => e.name && lowerDescription.includes(e.name.toLowerCase()));
  if (expenseMatch) {
    return {
      confidence: 'likely',
      merchantKey,
      matchedExpenseId: expenseMatch.id,
      category: null,
      suggestionReason: 'expense-name',
    };
  }

  const category = categorizeExpenseName(description);
  if (category) {
    return {
      confidence: 'likely',
      merchantKey,
      matchedExpenseId: null,
      category,
      suggestionReason: 'category-keyword',
    };
  }

  return { confidence: 'unmatched', merchantKey, matchedExpenseId: null, category: null, suggestionReason: 'none' };
}
