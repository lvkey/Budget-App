import { useState } from 'react';
import { useLocalStorageState } from '../lib/useLocalStorageState';
import { headerSignature } from '../lib/csvParser';

const inputClass =
  'bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-lg px-2.5 py-2 text-sm text-slate-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400';

function ColumnSelect({ label, headers, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 dark:text-white/50">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`mt-1 w-full ${inputClass}`}>
        <option value="">Select column…</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ColumnMapper({ headers, rows, onConfirm, onCancel }) {
  const signature = headerSignature(headers);
  const [savedMappings, setSavedMappings] = useLocalStorageState('ledgr-csv-mappings', {});
  const savedMapping = savedMappings[signature];

  const [useSaved, setUseSaved] = useState(Boolean(savedMapping));
  const [amountMode, setAmountMode] = useState(savedMapping?.amountMode || 'single');
  const [dateColumn, setDateColumn] = useState(savedMapping?.dateColumn || '');
  const [descriptionColumn, setDescriptionColumn] = useState(savedMapping?.descriptionColumn || '');
  const [amountColumn, setAmountColumn] = useState(savedMapping?.amountColumn || '');
  const [debitColumn, setDebitColumn] = useState(savedMapping?.debitColumn || '');
  const [creditColumn, setCreditColumn] = useState(savedMapping?.creditColumn || '');

  if (useSaved && savedMapping) {
    return (
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-4">
        <p className="text-sm text-slate-600 dark:text-white/70">
          This file's columns match a format you've mapped before — reusing that mapping.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onConfirm(savedMapping)}
            className="text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => setUseSaved(false)}
            className="text-sm font-medium text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/90 rounded-lg px-3 py-2 transition-colors"
          >
            Change mapping
          </button>
        </div>
      </div>
    );
  }

  const isValid = dateColumn && descriptionColumn && (amountMode === 'single' ? amountColumn : debitColumn && creditColumn);

  const handleConfirm = () => {
    const mapping = { dateColumn, descriptionColumn, amountMode, amountColumn, debitColumn, creditColumn };
    setSavedMappings((prev) => ({ ...prev, [signature]: mapping }));
    onConfirm(mapping);
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="font-semibold text-slate-800 dark:text-white/90">Map columns</h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          Tell us which column is which — this is only asked once per file format.
        </p>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/50">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-white/10 text-slate-600 dark:text-white/70">
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 whitespace-nowrap">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColumnSelect label="Date column" headers={headers} value={dateColumn} onChange={setDateColumn} />
        <ColumnSelect label="Description column" headers={headers} value={descriptionColumn} onChange={setDescriptionColumn} />
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 text-sm text-slate-700 dark:text-white/80">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={amountMode === 'single'} onChange={() => setAmountMode('single')} />
            Single signed amount column
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" checked={amountMode === 'split'} onChange={() => setAmountMode('split')} />
            Separate debit/credit columns
          </label>
        </div>
        {amountMode === 'single' ? (
          <ColumnSelect label="Amount column (negative = spend)" headers={headers} value={amountColumn} onChange={setAmountColumn} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ColumnSelect label="Debit column (money out)" headers={headers} value={debitColumn} onChange={setDebitColumn} />
            <ColumnSelect label="Credit column (money in)" headers={headers} value={creditColumn} onChange={setCreditColumn} />
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={!isValid}
          onClick={handleConfirm}
          className="text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 text-white rounded-lg px-4 py-2 transition-colors"
        >
          Continue
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-slate-500 dark:text-white/60 hover:text-slate-700 dark:hover:text-white/90 rounded-lg px-3 py-2 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
