// Well-known merchants mapped directly to a category (matching the names in
// expenseCategories.js), checked before falling back to generic keyword
// guessing. Bare merchant names like "ALDI" or "BP" don't contain any
// category keyword on their own, so without this list they'd always land in
// the lowest-confidence "no idea" bucket - this is what makes common,
// everyday transactions match confidently on the first import. Not
// exhaustive; add more as new merchants come up. Keys are lowercase and
// matched as a substring of the (prefix-stripped) transaction description.
export const MERCHANT_CATEGORIES = {
  // Groceries
  woolworths: 'Groceries',
  'woolies': 'Groceries',
  coles: 'Groceries',
  aldi: 'Groceries',
  iga: 'Groceries',
  foodworks: 'Groceries',
  'harris farm': 'Groceries',
  costco: 'Groceries',
  drakes: 'Groceries',
  spar: 'Groceries',
  supabarn: 'Groceries',

  // Fuel / vehicle
  'bp ': 'Vehicle',
  shell: 'Vehicle',
  caltex: 'Vehicle',
  ampol: 'Vehicle',
  '7-eleven': 'Vehicle',
  '7 eleven': 'Vehicle',
  'united petroleum': 'Vehicle',
  liberty: 'Vehicle',
  'metro petroleum': 'Vehicle',
  linkt: 'Vehicle',
  etoll: 'Vehicle',
  'e-toll': 'Vehicle',
  citylink: 'Vehicle',
  eastlink: 'Vehicle',
  'nrma': 'Vehicle',

  // Dining, takeaway, food delivery
  mcdonalds: 'Dining',
  "mcdonald's": 'Dining',
  'maccas': 'Dining',
  kfc: 'Dining',
  'hungry jacks': 'Dining',
  "hungry jack's": 'Dining',
  subway: 'Dining',
  dominos: 'Dining',
  "domino's": 'Dining',
  'guzman y gomez': 'Dining',
  'guzman': 'Dining',
  "grill'd": 'Dining',
  grilld: 'Dining',
  nandos: 'Dining',
  "nando's": 'Dining',
  'ubereats': 'Dining',
  'uber eats': 'Dining',
  'uber* eats': 'Dining',
  menulog: 'Dining',
  doordash: 'Dining',
  deliveroo: 'Dining',
  starbucks: 'Dining',
  'gloria jeans': 'Dining',
  'gloriajeans': 'Dining',
  'the coffee club': 'Dining',
  'boost juice': 'Dining',
  zambrero: 'Dining',
  'red rooster': 'Dining',
  'oporto': 'Dining',

  // Retail / shopping
  kmart: 'Shopping',
  target: 'Shopping',
  'big w': 'Shopping',
  bigw: 'Shopping',
  myer: 'Shopping',
  'david jones': 'Shopping',
  'jb hi-fi': 'Shopping',
  'jb hifi': 'Shopping',
  officeworks: 'Shopping',
  bunnings: 'Shopping',
  ikea: 'Shopping',
  amazon: 'Shopping',
  'amzn mktp': 'Shopping',
  ebay: 'Shopping',
  temu: 'Shopping',
  'the good guys': 'Shopping',
  'harvey norman': 'Shopping',
  cotton_on: 'Shopping',
  'cotton on': 'Shopping',
  uniqlo: 'Shopping',
  zara: 'Shopping',
  rebel: 'Shopping',

  // Streaming / subscriptions
  netflix: 'Subscriptions',
  stan: 'Subscriptions',
  'disney plus': 'Subscriptions',
  disneyplus: 'Subscriptions',
  binge: 'Subscriptions',
  kayo: 'Subscriptions',
  'paramount plus': 'Subscriptions',
  spotify: 'Subscriptions',
  'apple.com/bill': 'Subscriptions',
  'apple music': 'Subscriptions',
  icloud: 'Subscriptions',
  youtubepremium: 'Subscriptions',
  'youtube premium': 'Subscriptions',
  audible: 'Subscriptions',

  // Health
  'chemist warehouse': 'Health & Fitness',
  priceline: 'Health & Fitness',
  'terry white': 'Health & Fitness',
  bupa: 'Health & Fitness',
  medibank: 'Health & Fitness',
  hcf: 'Health & Fitness',
  ' nib ': 'Health & Fitness',
  ahm: 'Health & Fitness',
  'anytime fitness': 'Health & Fitness',
  'fitness first': 'Health & Fitness',
  'f45': 'Health & Fitness',
  goodlife: 'Health & Fitness',
  'jetts': 'Health & Fitness',

  // Utilities / telco / energy
  telstra: 'Utilities',
  optus: 'Utilities',
  vodafone: 'Utilities',
  ' tpg ': 'Utilities',
  belong: 'Utilities',
  'boost mobile': 'Utilities',
  amaysim: 'Utilities',
  agl: 'Utilities',
  'origin energy': 'Utilities',
  energyaustralia: 'Utilities',
  'energy australia': 'Utilities',
  iinet: 'Utilities',
  'aussie broadband': 'Utilities',

  // Transport
  uber: 'Transport',
  ola: 'Transport',
  didi: 'Transport',
  opal: 'Transport',
  myki: 'Transport',
  'go card': 'Transport',
  qantas: 'Transport',
  jetstar: 'Transport',
  'virgin australia': 'Transport',
};

// Payment-processor prefixes some banks leave in the description, stripped
// before matching so "SQ *CAFE NAME" or "PAYPAL *NETFLIX" still match on the
// real merchant.
const PROCESSOR_PREFIXES = [/^sq\s*\*/i, /^sp\s*\*/i, /^paypal\s*\*/i, /^tst\s*\*/i];

export function lookupCuratedMerchant(description) {
  let cleaned = ` ${(description || '').trim()} `;
  for (const prefix of PROCESSOR_PREFIXES) {
    cleaned = cleaned.replace(prefix, ' ');
  }
  const lower = cleaned.toLowerCase();
  for (const [merchant, category] of Object.entries(MERCHANT_CATEGORIES)) {
    if (lower.includes(merchant.toLowerCase())) return category;
  }
  return null;
}
