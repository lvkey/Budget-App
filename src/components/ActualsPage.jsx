import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Plus, Trash2 } from 'lucide-react';
import { AccountUpgradeGate } from './AccountUpgradeGate';
import { ColumnMapper } from './ColumnMapper';
import { TransactionReview } from './TransactionReview';
import { VarianceView } from './VarianceView';
import { parseCsvFile, applyColumnMapping } from '../lib/csvParser';
import { matchTransaction, normalizeMerchantKey } from '../lib/transactionMatcher';
import {
  fetchProfiles,
  insertProfile,
  deleteProfile,
  insertImportBatch,
  fetchTransactions,
  insertTransactions,
  updateTransaction,
  fetchMerchantRules,
  upsertMerchantRule,
} from '../lib/statementsApi';

const inputClass =
  'bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-lg px-2.5 py-2 text-sm text-slate-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400';

export function ActualsPage({ userId, isAnonymous, upgradeAccount, scenarios }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [showNewProfile, setShowNewProfile] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [merchantRules, setMerchantRules] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pendingFile, setPendingFile] = useState(null); // { headers, rows }
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const [comparisonScenarioId, setComparisonScenarioId] = useState(scenarios?.[0]?.id ?? null);
  const comparisonScenario = scenarios?.find((s) => s.id === comparisonScenarioId) ?? scenarios?.[0];

  useEffect(() => {
    if (isAnonymous || !userId) return;
    fetchProfiles(userId).then((rows) => {
      setProfiles(rows);
      if (rows.length > 0 && !selectedProfileId) setSelectedProfileId(rows[0].id);
    });
    fetchMerchantRules(userId).then(setMerchantRules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isAnonymous]);

  useEffect(() => {
    if (!selectedProfileId || !userId) {
      setTransactions([]);
      return;
    }
    setLoading(true);
    fetchTransactions(userId, selectedProfileId)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [selectedProfileId, userId]);

  if (isAnonymous) {
    return <AccountUpgradeGate onUpgrade={upgradeAccount} />;
  }

  async function handleCreateProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    const profile = await insertProfile({ userId, name });
    setProfiles((prev) => [...prev, profile]);
    setSelectedProfileId(profile.id);
    setNewProfileName('');
    setShowNewProfile(false);
  }

  async function handleDeleteProfile(id) {
    const target = profiles.find((p) => p.id === id);
    if (!window.confirm(`Delete profile "${target?.name}" and every imported transaction in it? This cannot be undone.`)) return;
    await deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (selectedProfileId === id) setSelectedProfileId(null);
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportError('');
    try {
      const { headers, rows } = await parseCsvFile(file);
      setPendingFile({ file, headers, rows });
    } catch (err) {
      setImportError(err.message || 'Could not read that file.');
    }
  }

  async function handleMappingConfirm(mapping) {
    if (!pendingFile || !selectedProfileId) return;
    setImporting(true);
    setImportError('');
    try {
      const parsed = applyColumnMapping(pendingFile.rows, mapping);
      const batch = await insertImportBatch({
        userId,
        profileId: selectedProfileId,
        filename: pendingFile.file.name,
        rowCount: parsed.length,
      });

      const matches = parsed.map((t) => matchTransaction(t.description, { merchantRules, expenses: comparisonScenario?.expenses || [] }));
      const rows = parsed.map((t, i) => ({
        user_id: userId,
        import_batch_id: batch.id,
        txn_date: t.txnDate,
        description: t.description,
        amount: t.amount,
        // Only a previously-confirmed merchant is applied without the user
        // seeing it - everything else (however confident the guess) goes
        // through review at least once.
        matched_expense_id: matches[i].confidence === 'remembered' ? matches[i].matchedExpenseId : null,
        category: matches[i].confidence === 'remembered' ? matches[i].category : null,
      }));

      const inserted = await insertTransactions(rows);
      setTransactions((prev) => [...prev, ...inserted].sort((a, b) => a.txn_date.localeCompare(b.txn_date)));
      setPendingFile(null);
    } catch (err) {
      setImportError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  async function handleConfirmMatch(transaction, { matchedExpenseId, category }) {
    await updateTransaction(transaction.id, { matched_expense_id: matchedExpenseId, category });
    const merchantKey = normalizeMerchantKey(transaction.description);
    try {
      await upsertMerchantRule({ userId, merchantKey, matchedExpenseId, category });
      setMerchantRules((prev) => [...prev.filter((r) => r.merchant_key !== merchantKey), { merchant_key: merchantKey, matched_expense_id: matchedExpenseId, category }]);
    } catch {
      // Best-effort: matching still works this session even if the memory write fails.
    }
    setTransactions((prev) =>
      prev.map((t) => (t.id === transaction.id ? { ...t, matched_expense_id: matchedExpenseId, category } : t))
    );
  }

  async function handleExcludeTransaction(transaction) {
    await updateTransaction(transaction.id, { excluded: true });
    setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? { ...t, excluded: true } : t)));
  }

  async function handleBulkConfirm(items) {
    await Promise.all(
      items.map(({ transaction, suggestion }) =>
        handleConfirmMatch(transaction, { matchedExpenseId: suggestion.matchedExpenseId, category: suggestion.category })
      )
    );
  }

  const needsReview = useMemo(
    () => transactions.filter((t) => !t.excluded && !t.matched_expense_id && !t.category),
    [transactions]
  );
  // Re-matched fresh on every render (cheap, pure) rather than cached from
  // import time - a transaction confirmed elsewhere in the same batch
  // immediately reclassifies anything else from that merchant too, and a
  // page reload doesn't lose the suggestion for anything still pending.
  const reviewGroups = useMemo(() => {
    const groups = { confident: [], likely: [], unmatched: [] };
    for (const transaction of needsReview) {
      const suggestion = matchTransaction(transaction.description, { merchantRules, expenses: comparisonScenario?.expenses || [] });
      const tier = suggestion.confidence === 'remembered' ? 'confident' : suggestion.confidence;
      groups[tier].push({ transaction, suggestion });
    }
    return groups;
  }, [needsReview, merchantRules, comparisonScenario]);
  const forComparison = useMemo(() => transactions.filter((t) => !t.excluded), [transactions]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white/90">Actuals</h1>
            <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
              Import bank/credit card statements and see how real spending tracks against a budget.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-white/50">Profile</span>
            <select
              value={selectedProfileId || ''}
              onChange={(e) => setSelectedProfileId(e.target.value || null)}
              className={`mt-1 min-w-[180px] ${inputClass}`}
            >
              <option value="">Select a profile…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          {selectedProfileId && (
            <button
              type="button"
              onClick={() => handleDeleteProfile(selectedProfileId)}
              aria-label="Delete profile"
              className="text-slate-400 dark:text-white/40 hover:text-red-500 rounded-lg p-2.5 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}

          {showNewProfile ? (
            <div className="flex items-end gap-1.5">
              <label className="block">
                <span className="text-xs font-medium text-slate-500 dark:text-white/50">New profile name</span>
                <input
                  type="text"
                  autoFocus
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                  placeholder="2026 Actuals"
                  className={`mt-1 ${inputClass}`}
                />
              </label>
              <button
                type="button"
                onClick={handleCreateProfile}
                className="text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 transition-colors"
              >
                Create
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewProfile(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg px-3 py-2.5 transition-colors"
            >
              <Plus size={15} />
              New profile
            </button>
          )}

          {scenarios?.length > 0 && (
            <label className="block">
              <span className="text-xs font-medium text-slate-500 dark:text-white/50">Compare against</span>
              <select
                value={comparisonScenarioId || ''}
                onChange={(e) => setComparisonScenarioId(e.target.value)}
                className={`mt-1 min-w-[180px] ${inputClass}`}
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {selectedProfileId && (
          <div className="pt-2 border-t border-slate-100 dark:border-white/10">
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelected} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors"
            >
              <Upload size={15} />
              Upload statement (CSV)
            </button>
            {importError && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{importError}</p>}
          </div>
        )}
      </div>

      {pendingFile && (
        <ColumnMapper
          headers={pendingFile.headers}
          rows={pendingFile.rows}
          onConfirm={handleMappingConfirm}
          onCancel={() => setPendingFile(null)}
        />
      )}
      {importing && <p className="text-sm text-slate-500 dark:text-white/60 text-center py-4">Importing…</p>}

      {!selectedProfileId ? (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 p-8 text-center text-sm text-slate-500 dark:text-white/50">
          Pick or create a profile to start importing statements.
        </div>
      ) : loading ? (
        <p className="text-sm text-slate-500 dark:text-white/60 text-center py-8">Loading…</p>
      ) : (
        <>
          <TransactionReview
            groups={reviewGroups}
            expenses={comparisonScenario?.expenses || []}
            onConfirm={handleConfirmMatch}
            onExclude={handleExcludeTransaction}
            onBulkConfirm={handleBulkConfirm}
          />
          <VarianceView transactions={forComparison} scenario={comparisonScenario} />
        </>
      )}
    </div>
  );
}
