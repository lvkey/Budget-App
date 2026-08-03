import { categorizeExpenseName } from './expenseCategories';

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

// Matches a transaction description against, in confidence order:
//   1. A remembered merchant_rules hit - high confidence, auto-applies.
//   2. A substring match against the current scenario's own expense names.
//   3. The existing category keyword list (src/lib/expenseCategories.js).
//   4. Nothing - needs confirmation with no suggestion at all.
// Only (1) is ever applied without the user seeing it first.
export function matchTransaction(description, { merchantRules = [], expenses = [] } = {}) {
  const merchantKey = normalizeMerchantKey(description);

  const rule = merchantRules.find((r) => r.merchant_key === merchantKey);
  if (rule) {
    return {
      confidence: 'high',
      merchantKey,
      matchedExpenseId: rule.matched_expense_id ?? null,
      category: rule.category ?? null,
    };
  }

  const lowerDescription = description.toLowerCase();
  const expenseMatch = expenses.find((e) => e.name && lowerDescription.includes(e.name.toLowerCase()));
  if (expenseMatch) {
    return {
      confidence: 'needs_confirmation',
      merchantKey,
      matchedExpenseId: expenseMatch.id,
      category: null,
      suggestionReason: 'expense-name',
    };
  }

  const category = categorizeExpenseName(description);
  if (category) {
    return {
      confidence: 'needs_confirmation',
      merchantKey,
      matchedExpenseId: null,
      category,
      suggestionReason: 'category-keyword',
    };
  }

  return { confidence: 'needs_confirmation', merchantKey, matchedExpenseId: null, category: null, suggestionReason: 'none' };
}
