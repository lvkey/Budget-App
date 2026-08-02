import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from './components/PageHeader';
import { ScenarioSelector } from './components/ScenarioSelector';
import { ViewFrequencyToggle } from './components/ViewFrequencyToggle';
import { SummaryCards } from './components/SummaryCards';
import { IncomeEditor } from './components/IncomeEditor';
import { ExpenseTable } from './components/ExpenseTable';
import { IncomeChartsPage } from './components/IncomeChartsPage';
import { DEFAULT_SCENARIOS, EXAMPLE_EXPENSE_TEMPLATE, DAYS_IN_PERIOD, VIEW_FREQUENCIES, OVERVIEW_KEY } from './lib/data';
import { useLocalStorageState } from './lib/useLocalStorageState';
import { useDarkMode } from './lib/useDarkMode';

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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

  const [scenarios, setScenarios] = useLocalStorageState('budget-scenarios', DEFAULT_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useLocalStorageState('budget-selected-scenario', DEFAULT_SCENARIOS[0].id);

  useEffect(() => {
    if (!scenarios.some((s) => s.id === selectedScenarioId) && scenarios.length > 0) {
      setSelectedScenarioId(scenarios[0].id);
    }
  }, [scenarios, selectedScenarioId]);

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const incomeAmount = Number(currentScenario?.income) || 0;

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
  };

  const handleChangeField = (expenseId, field, value) => {
    updateCurrentScenario((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === expenseId ? { ...e, [field]: value } : e)),
    }));
  };

  const handleAddExpense = () => {
    updateCurrentScenario((s) => ({
      ...s,
      expenses: [...s.expenses, { id: makeId('expense'), name: '', freq: 'Month', cost: 0 }],
    }));
  };

  const handleRemoveExpense = (expenseId) => {
    const item = currentScenario?.expenses.find((e) => e.id === expenseId);
    if (window.confirm(`Remove "${item?.name || 'this expense'}"?`)) {
      updateCurrentScenario((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== expenseId) }));
    }
  };

  const handleChangeIncome = (value) => {
    updateCurrentScenario((s) => ({ ...s, income: value }));
  };

  const handleClearCosts = () => {
    if (window.confirm('Clear all cost amounts back to $0.00 for this scenario? Expense names and frequencies are kept. This cannot be undone.')) {
      updateCurrentScenario((s) => ({ ...s, expenses: s.expenses.map((e) => ({ ...e, cost: 0 })) }));
    }
  };

  const handleSelectScenario = (id) => setSelectedScenarioId(id);

  const handleCreateScenario = () => {
    const existingNames = scenarios.map((s) => s.name);
    const name = uniqueScenarioName('New Scenario', existingNames);
    const id = makeId('scenario');
    setScenarios((prev) => [
      ...prev,
      { id, name, income: 0, expenses: EXAMPLE_EXPENSE_TEMPLATE.map((e) => ({ ...e, id: makeId('expense') })) },
    ]);
    setSelectedScenarioId(id);
  };

  const handleCopyScenario = (sourceId) => {
    const source = scenarios.find((s) => s.id === sourceId);
    if (!source) return;
    const existingNames = scenarios.map((s) => s.name);
    const name = uniqueScenarioName(`${source.name} copy`, existingNames);
    const id = makeId('scenario');
    setScenarios((prev) => [
      ...prev,
      { ...source, id, name, expenses: source.expenses.map((e) => ({ ...e, id: makeId('expense') })) },
    ]);
    setSelectedScenarioId(id);
  };

  const handleRenameScenario = (id, name) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleDeleteScenario = (id) => {
    if (scenarios.length <= 1) return;
    const target = scenarios.find((s) => s.id === id);
    if (window.confirm(`Delete scenario "${target?.name}"? This cannot be undone.`)) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
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
  const annualExpenseItems = useMemo(
    () => processedData.map((item) => ({ id: item.id, name: item.name, value: item.dailyCost * DAYS_IN_PERIOD.Year })),
    [processedData]
  );
  const totalAnnualExpenses = annualExpenseItems.reduce((sum, item) => sum + item.value, 0);
  // Savings is derived, not tracked independently, so it always reconciles with
  // income and expenses instead of drifting out of sync with them.
  const annualSavings = incomeAmount - totalAnnualExpenses;
  const weeklySavings = annualSavings / 52;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] text-slate-900 dark:text-white/90 p-3 sm:p-4 md:p-8 font-sans transition-colors">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <PageHeader page={page} onSelectPage={setPage} isDark={isDark} onToggleDark={setIsDark} />
        <ScenarioSelector
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={handleSelectScenario}
          onCreateScenario={handleCreateScenario}
          onCopyScenario={handleCopyScenario}
          onRenameScenario={handleRenameScenario}
          onDeleteScenario={handleDeleteScenario}
        />
        <SummaryCards income={incomeAmount} weeklySavings={weeklySavings} viewFrequencyKey={viewFrequencyKey} />
        <ViewFrequencyToggle value={viewFrequencyKey} onChange={setViewFrequencyKey} />
        {page === 'dashboard' && (
          <>
            {editing && <IncomeEditor income={incomeAmount} onChangeIncome={handleChangeIncome} />}
            <ExpenseTable
              data={processedData}
              totalDisplayed={totalDisplayed}
              viewFrequency={viewFrequency}
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
            pieProps={{ income: incomeAmount, savings: annualSavings, expenses: annualExpenseItems }}
            barProps={{ data: processedData, viewFrequency, totalDisplayed }}
          />
        )}
      </div>
    </div>
  );
}
