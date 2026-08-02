export const formatCurrency = (amount) => new Intl.NumberFormat('en-AU', {
  style: 'currency', currency: 'AUD',
}).format(amount);

export const formatIncome = (amount) => new Intl.NumberFormat('en-AU', {
  style: 'currency', currency: 'AUD', maximumFractionDigits: 0,
}).format(amount);

export function formatCompactCurrency(amount) {
  if (amount === 0) return '$0';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${+(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${+(amount / 1_000).toFixed(1)}k`;
  return formatCurrency(amount);
}
