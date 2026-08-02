// Picks a round step (1/2/5 x 10^n) so a chart's axis reads in clean blocks
// (e.g. $5k, $10k, $25k) that scale with the magnitude of the data.
export function niceTicks(maxValue, targetCount = 5) {
  if (maxValue <= 0) return { ticks: [0], step: 1, niceMax: 1 };

  const rawStep = maxValue / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;

  let niceFraction;
  if (normalized <= 1) niceFraction = 1;
  else if (normalized <= 2) niceFraction = 2;
  else if (normalized <= 5) niceFraction = 5;
  else niceFraction = 10;

  const step = niceFraction * magnitude;
  const niceMax = Math.ceil(maxValue / step) * step;

  const ticks = [];
  for (let t = 0; t <= niceMax + step / 2; t += step) {
    ticks.push(Math.round(t * 100) / 100);
  }

  return { ticks, step, niceMax };
}
