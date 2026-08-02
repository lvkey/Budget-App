import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from './components/PageHeader';
import { ScenarioSelector } from './components/ScenarioSelector';
import { ViewFrequencyToggle } from './components/ViewFrequencyToggle';
import { SummaryCards } from './components/SummaryCards';
import { IncomeEditor } from './components/IncomeEditor';
import { ExpenseTable } from './components/ExpenseTable';
import { IncomeChartsPage } from './components/IncomeChartsPage';
import { EXAMPLE_EXPENSE_TEMPLATE, DAYS_IN_PERIOD, VIEW_FREQUENCIES, OVERVIEW_KEY, convertCost } from './lib/data';
import { calculateAfterTaxIncome } from './lib/tax';
import { useSupabaseAuth } from './lib/useSupabaseAuth';
import { useScenariosState } from './lib/useScenariosState';
import { useSelectedScenarioId } from './lib/useSelectedScenarioId';
import {
  insertExpense,
  updateExpense,
  deleteExpense,
  clearScenarioCosts,
  insertScenarioWithExpenses,
  updateScenario,
  deleteScenario,
  setSelectedScenarioId as persistSelectedScenarioId,
} from './lib/scenariosApi';
import { useDarkMode } from './lib/useDarkMode';

function uniqueScenarioName(base, existingNames) {
  if (!existingNames.includes(base)) return base;
  let n = 2;
  while (existingNames.includes(`${base} (${n})`)) n += 1;
  return `${base} (${n})`;
}

export default function App() {
  const [isDark, setIsDark] = useDarkMode();
  const [page, setPage] = useState('dashboard');
  const [chartView, setChartView] = useState('pie');
  const [viewFrequencyKey, setViewFrequencyKey] = useState(OVERVIEW_KEY);
  const [sortConfig, setSortConfig] = useState({ key: 'displayCost', direction: 'desc' });
  const [editing, setEditing] = useState(false);

  // The expense table/chart always need a concrete frequency to convert costs into,
  // so "Overview" (which has no cost conversion of its own) falls back to Weekly.
  const effectiveFreqKey = viewFrequencyKey === OVERVIEW_KEY ? 'Week' : viewFrequencyKey;
  const viewFrequency = VIEW_FREQUENCIES.find((f) => f.key === effectiveFreqKey);

  const { userId, authLoading, authError } = useSupabaseAuth();
  const { scenarios, setScenarios, loading: scenariosLoading, error: scenariosError, retry } = useScenariosState(userId);
  const { selectedScenarioId, setSelectedScenarioId, loading: selectedLoading } = useSelectedScenarioId(userId, scenarios);

  useEffect(() => {
    if (selectedScenarioId && !scenarios.some((s) => s.id === selectedScenarioId) && scenarios.length > 0) {
      setSelectedScenarioId(scenarios[0].id);
    }
  }, [scenarios, selectedScenarioId]);

  // "Overview" is a Dashboard-only concept (it shows multi-year horizons rather
  // than a single period), so the charts page always needs a concrete time frame.
  useEffect(() => {
    if (page === 'income' && viewFrequencyKey === OVERVIEW_KEY) {
      setViewFrequencyKey('Week');
    }
  }, [page, viewFrequencyKey]);

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const incomeAmount = Number(currentScenario?.income) || 0;
  const medicareLevy = currentScenario?.medicareLevy ?? true;
  const hecsHelp = currentScenario?.hecsHelp ?? false;
  // Every downstream figure (savings, charts, summary cards) works off the
  // after-tax income - the gross amount is only used for editing.
  const taxBreakdown = calculateAfterTaxIncome(incomeAmount, { medicareLevy, hecsHelp });
  const netIncomeAmount = taxBreakdown.netIncome;

  const updateCurrentScenario = (updater) => {
    setScenarios((prev) => prev.map((s) => (s.id === selectedScenarioId ? updater(s) : s)));
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleChangeAmount = (expenseId, rawValue) => {
    updateCurrentScenario((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === expenseId ? { ...e, cost: rawValue } : e)),
    }));
    updateExpense(expenseId, { cost: rawValue }).catch(console.error);
  };

  const handleChangeField = (expenseId, field, value) => {
    updateCurrentScenario((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === expenseId ? { ...e, [field]: value } : e)),
    }));
    updateExpense(expenseId, { [field]: value }).catch(console.error);
  };

  const handleAddExpense = () => {
    const id = crypto.randomUUID();
    updateCurrentScenario((s) => ({
      ...s,
      expenses: [...s.expenses, { id, name: '', freq: 'Month', cost: 0 }],
    }));
    insertExpense({
      id,
      scenarioId: selectedScenarioId,
      userId,
      name: '',
      freq: 'Month',
      cost: 0,
      position: currentScenario?.expenses.length || 0,
    }).catch(console.error);
  };

  const handleRemoveExpense = (expenseId) => {
    const item = currentScenario?.expenses.find((e) => e.id === expenseId);
    if (window.confirm(`Remove "${item?.name || 'this expense'}"?`)) {
      updateCurrentScenario((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== expenseId) }));
      deleteExpense(expenseId).catch(console.error);
    }
  };

  const handleChangeIncome = (value) => {
    updateCurrentScenario((s) => ({ ...s, income: value }));
    updateScenario(selectedScenarioId, { income: value }).catch(console.error);
  };

  const handleToggleMedicareLevy = (value) => {
    updateCurrentScenario((s) => ({ ...s, medicareLevy: value }));
    updateScenario(selectedScenarioId, { medicare_levy: value }).catch(console.error);
  };

  const handleToggleHecsHelp = (value) => {
    updateCurrentScenario((s) => ({ ...s, hecsHelp: value }));
    updateScenario(selectedScenarioId, { hecs_help: value }).catch(console.error);
  };

  const handleClearCosts = () => {
    if (window.confirm('Clear all cost amounts back to $0.00 for this scenario? Expense names and frequencies are kept. This cannot be undone.')) {
      updateCurrentScenario((s) => ({ ...s, expenses: s.expenses.map((e) => ({ ...e, cost: 0 })) }));
      clearScenarioCosts(selectedScenarioId).catch(console.error);
    }
  };

  const handleSelectScenario = (id) => {
    setSelectedScenarioId(id);
    persistSelectedScenarioId(userId, id).catch(console.error);
  };

  const handleCreateScenario = () => {
    const existingNames = scenarios.map((s) => s.name);
    const name = uniqueScenarioName('New Scenario', existingNames);
    const id = crypto.randomUUID();
    const newScenario = {
      id,
      name,
      income: 0,
      medicareLevy: true,
      hecsHelp: false,
      expenses: EXAMPLE_EXPENSE_TEMPLATE.map((e) => ({ ...e, id: crypto.randomUUID() })),
    };
    setScenarios((prev) => [...prev, newScenario]);
    setSelectedScenarioId(id);
    insertScenarioWithExpenses(newScenario, userId, scenarios.length)
      .then(() => persistSelectedScenarioId(userId, id))
      .catch(console.error);
  };

  const handleCopyScenario = (sourceId) => {
    const source = scenarios.find((s) => s.id === sourceId);
    if (!source) return;
    const existingNames = scenarios.map((s) => s.name);
    const name = uniqueScenarioName(`${source.name} copy`, existingNames);
    const id = crypto.randomUUID();
    const newScenario = { ...source, id, name, expenses: source.expenses.map((e) => ({ ...e, id: crypto.randomUUID() })) };
    setScenarios((prev) => [...prev, newScenario]);
    setSelectedScenarioId(id);
    insertScenarioWithExpenses(newScenario, userId, scenarios.length)
      .then(() => persistSelectedScenarioId(userId, id))
      .catch(console.error);
  };

  const handleRenameScenario = (id, name) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
    updateScenario(id, { name }).catch(console.error);
  };

  const handleDeleteScenario = (id) => {
    if (scenarios.length <= 1) return;
    const target = scenarios.find((s) => s.id === id);
    if (window.confirm(`Delete scenario "${target?.name}"? This cannot be undone.`)) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      deleteScenario(id).catch(console.error);
    }
  };

  const processedData = useMemo(() => {
    const data = (currentScenario?.expenses || []).map((item) => {
      const baseCost = Number(item.cost) || 0;
      const dailyCost = baseCost / DAYS_IN_PERIOD[item.freq];
      const displayCost = dailyCost * DAYS_IN_PERIOD[effectiveFreqKey];
      return { ...item, baseCost, dailyCost, displayCost };
    });
    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [currentScenario, effectiveFreqKey, sortConfig]);

  const totalDisplayed = processedData.reduce((sum, item) => sum + item.displayCost, 0);
  const totalAnnualExpenses = processedData.reduce((sum, item) => sum + item.dailyCost * DAYS_IN_PERIOD.Year, 0);
  // Savings is derived, not tracked independently, so it always reconciles with
  // income and expenses instead of drifting out of sync with them. Uses net
  // (after-tax) income, since that's what's actually available to spend.
  const annualSavings = netIncomeAmount - totalAnnualExpenses;
  // Income and savings both convert to whichever time frame is selected, so the
  // cards and charts always describe the same period as the expense table.
  const periodIncome = convertCost(netIncomeAmount, 'Year', effectiveFreqKey);
  const periodSavings = periodIncome - totalDisplayed;

  if (authError || scenariosError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white/90 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-500 dark:text-white/60">Couldn't load your budget data.</p>
          <button
            type="button"
            onClick={retry}
            className="text-sm font-medium text-blue-500 dark:text-blue-400 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || scenariosLoading || selectedLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white/90 flex items-center justify-center p-4">
        <p className="text-sm text-slate-500 dark:text-white/60">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white/90 p-3 sm:p-4 md:p-8 font-sans transition-colors">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <PageHeader page={page} onSelectPage={setPage} isDark={isDark} onToggleDark={setIsDark} />
        <ScenarioSelector
          page={page}
          income={incomeAmount}
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={handleSelectScenario}
          onCreateScenario={handleCreateScenario}
          onCopyScenario={handleCopyScenario}
          onRenameScenario={handleRenameScenario}
          onDeleteScenario={handleDeleteScenario}
        />
        <SummaryCards
          isOverview={viewFrequencyKey === OVERVIEW_KEY}
          income={netIncomeAmount}
          periodIncome={periodIncome}
          periodSavings={periodSavings}
          annualSavings={annualSavings}
          periodLabel={viewFrequency.adjective}
        />
        <ViewFrequencyToggle value={viewFrequencyKey} onChange={setViewFrequencyKey} hideOverview={page === 'income'} />
        {page === 'dashboard' && (
          <>
            {editing && (
              <IncomeEditor
                income={incomeAmount}
                onChangeIncome={handleChangeIncome}
                medicareLevy={medicareLevy}
                hecsHelp={hecsHelp}
                onToggleMedicareLevy={handleToggleMedicareLevy}
                onToggleHecsHelp={handleToggleHecsHelp}
                taxBreakdown={taxBreakdown}
              />
            )}
            <ExpenseTable
              data={processedData}
              totalDisplayed={totalDisplayed}
              totalAnnual={totalAnnualExpenses}
              viewFrequency={viewFrequency}
              isOverview={viewFrequencyKey === OVERVIEW_KEY}
              editing={editing}
              onToggleEdit={() => setEditing((e) => !e)}
              onChangeAmount={handleChangeAmount}
              onChangeField={handleChangeField}
              onAddExpense={handleAddExpense}
              onRemoveExpense={handleRemoveExpense}
              onClearCosts={handleClearCosts}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </>
        )}
        {page === 'income' && (
          <IncomeChartsPage
            chartView={chartView}
            onChangeChartView={setChartView}
            pieProps={{
              income: periodIncome,
              savings: periodSavings,
              expenses: processedData.map((item) => ({ id: item.id, name: item.name, value: item.displayCost })),
            }}
            barProps={{ data: processedData, viewFrequency, totalDisplayed }}
          />
        )}
      </div>
    </div>
  );
}
