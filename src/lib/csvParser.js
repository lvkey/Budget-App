import Papa from 'papaparse';

// Runs entirely in the browser - the file is never uploaded anywhere. Returns
// the parsed rows plus detected headers so the caller can build a column
// mapping UI before anything is persisted.
export function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        if (headers.length === 0) {
          reject(new Error('No columns detected - is this a CSV file?'));
          return;
        }
        resolve({ headers, rows: results.data });
      },
      error: (err) => reject(err),
    });
  });
}

// A stable signature for a set of headers, used to remember a column mapping
// per "shape" of file (e.g. per bank export format) rather than per file.
export function headerSignature(headers) {
  return headers.map((h) => h.trim().toLowerCase()).sort().join('|');
}

// Bank exports vary between ISO (2026-08-01), AU day-first (01/08/2026 or
// 1-8-2026), and dotted (01.08.2026) formats. Falls back to whatever Date
// itself can parse if none of those match.
function parseDate(raw) {
  const value = (raw || '').trim();
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const dayFirstMatch = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function parseAmount(raw) {
  if (raw == null || raw === '') return 0;
  const cleaned = String(raw).replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : 0;
}

// Turns raw parsed CSV rows + a confirmed column mapping into the normalized
// { txnDate, description, amount } shape the rest of the import pipeline
// works with. Rows with no parseable date are dropped rather than guessed at.
export function applyColumnMapping(rows, mapping) {
  const result = [];
  for (const row of rows) {
    const txnDate = parseDate(row[mapping.dateColumn]);
    const description = (row[mapping.descriptionColumn] || '').trim();
    if (!txnDate || !description) continue;

    let amount;
    if (mapping.amountMode === 'single') {
      amount = parseAmount(row[mapping.amountColumn]);
    } else {
      const debit = Math.abs(parseAmount(row[mapping.debitColumn]));
      const credit = Math.abs(parseAmount(row[mapping.creditColumn]));
      amount = debit > 0 ? -debit : credit;
    }
    if (amount === 0) continue;

    result.push({ txnDate, description, amount });
  }
  return result;
}
