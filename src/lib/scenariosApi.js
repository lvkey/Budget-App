import { supabase } from './supabaseClient';
import { DEFAULT_SCENARIOS } from './data';

const LOCAL_SCENARIOS_KEY = 'budget-scenarios';
const LOCAL_SELECTED_KEY = 'budget-selected-scenario';

function expenseRowToLocal(row) {
  return {
    id: row.id,
    name: row.name,
    freq: row.freq,
    cost: Number(row.cost),
    ...(row.details ? { details: row.details } : {}),
  };
}

export async function fetchScenarios(userId) {
  const [{ data: scenarioRows, error: scenarioError }, { data: expenseRows, error: expenseError }] = await Promise.all([
    supabase.from('scenarios').select('*').eq('user_id', userId).order('position'),
    supabase.from('expenses').select('*').eq('user_id', userId).order('position'),
  ]);
  if (scenarioError) throw scenarioError;
  if (expenseError) throw expenseError;

  return scenarioRows.map((s) => ({
    id: s.id,
    name: s.name,
    income: Number(s.income),
    medicareLevy: s.medicare_levy ?? true,
    hecsHelp: s.hecs_help ?? false,
    partnerIncome: s.partner_income === null ? null : Number(s.partner_income),
    partnerHecsHelp: s.partner_hecs_help ?? false,
    hasPrivateHospitalCover: s.has_private_hospital_cover,
    dependentChildren: s.dependent_children ?? 0,
    expenses: expenseRows.filter((e) => e.scenario_id === s.id).map(expenseRowToLocal),
  }));
}

export async function fetchSelectedScenarioId(userId) {
  const { data, error } = await supabase.from('user_settings').select('selected_scenario_id').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.selected_scenario_id ?? null;
}

export async function setSelectedScenarioId(userId, scenarioId) {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, selected_scenario_id: scenarioId, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function insertExpense({ id, scenarioId, userId, name, freq, cost, details, position }) {
  const { error } = await supabase
    .from('expenses')
    .insert({ id, scenario_id: scenarioId, user_id: userId, name, freq, cost, details: details ?? null, position });
  if (error) throw error;
}

export async function updateExpense(id, fields) {
  const { error } = await supabase.from('expenses').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteExpense(id) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function clearScenarioCosts(scenarioId) {
  const { error } = await supabase.from('expenses').update({ cost: 0 }).eq('scenario_id', scenarioId);
  if (error) throw error;
}

export async function insertScenarioWithExpenses(scenario, userId, position) {
  const { error: scenarioError } = await supabase.from('scenarios').insert({
    id: scenario.id,
    user_id: userId,
    name: scenario.name,
    income: scenario.income,
    medicare_levy: scenario.medicareLevy ?? true,
    hecs_help: scenario.hecsHelp ?? false,
    partner_income: scenario.partnerIncome ?? null,
    partner_hecs_help: scenario.partnerHecsHelp ?? false,
    has_private_hospital_cover: scenario.hasPrivateHospitalCover ?? null,
    dependent_children: scenario.dependentChildren ?? 0,
    position,
  });
  if (scenarioError) throw scenarioError;

  if (scenario.expenses.length === 0) return;
  const rows = scenario.expenses.map((e, index) => ({
    id: e.id,
    scenario_id: scenario.id,
    user_id: userId,
    name: e.name,
    freq: e.freq,
    cost: e.cost,
    details: e.details ?? null,
    position: index,
  }));
  const { error: expensesError } = await supabase.from('expenses').insert(rows);
  if (expensesError) throw expensesError;
}

export async function updateScenario(id, fields) {
  const { error } = await supabase.from('scenarios').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteScenario(id) {
  const { error } = await supabase.from('scenarios').delete().eq('id', id);
  if (error) throw error;
}

// Brand-new anonymous user with zero scenario rows: seed from this browser's existing
// localStorage data if present (it's a live app, not a fresh scaffold), otherwise the defaults.
export async function seedNewUser(userId) {
  let sourceScenarios = DEFAULT_SCENARIOS;
  let sourceSelectedId = DEFAULT_SCENARIOS[0].id;

  try {
    const stored = window.localStorage.getItem(LOCAL_SCENARIOS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sourceScenarios = parsed;
        sourceSelectedId = window.localStorage.getItem(LOCAL_SELECTED_KEY) || parsed[0].id;
      }
    }
  } catch {
    // localStorage unavailable or corrupt - fall back to defaults
  }

  const idMap = new Map();
  const remappedScenarios = sourceScenarios.map((s) => {
    const newScenarioId = crypto.randomUUID();
    idMap.set(s.id, newScenarioId);
    return {
      id: newScenarioId,
      name: s.name,
      income: Number(s.income) || 0,
      medicareLevy: s.medicareLevy ?? true,
      hecsHelp: s.hecsHelp ?? false,
      partnerIncome: s.partnerIncome ?? null,
      partnerHecsHelp: s.partnerHecsHelp ?? false,
      hasPrivateHospitalCover: s.hasPrivateHospitalCover ?? null,
      dependentChildren: s.dependentChildren ?? 0,
      expenses: (s.expenses || []).map((e) => ({
        id: crypto.randomUUID(),
        name: e.name,
        freq: e.freq,
        cost: Number(e.cost) || 0,
        ...(e.details ? { details: e.details } : {}),
      })),
    };
  });

  for (let i = 0; i < remappedScenarios.length; i += 1) {
    const scenario = remappedScenarios[i];
    const { error: scenarioError } = await supabase.from('scenarios').insert({
      id: scenario.id,
      user_id: userId,
      name: scenario.name,
      income: scenario.income,
      medicare_levy: scenario.medicareLevy,
      hecs_help: scenario.hecsHelp,
      partner_income: scenario.partnerIncome,
      partner_hecs_help: scenario.partnerHecsHelp,
      has_private_hospital_cover: scenario.hasPrivateHospitalCover,
      dependent_children: scenario.dependentChildren,
      position: i,
    });
    if (scenarioError) throw scenarioError;

    if (scenario.expenses.length === 0) continue;
    const rows = scenario.expenses.map((e, index) => ({
      id: e.id,
      scenario_id: scenario.id,
      user_id: userId,
      name: e.name,
      freq: e.freq,
      cost: e.cost,
      details: e.details ?? null,
      position: index,
    }));
    const { error: expensesError } = await supabase.from('expenses').insert(rows);
    if (expensesError) throw expensesError;
  }

  const newSelectedId = idMap.get(sourceSelectedId) || remappedScenarios[0].id;
  await setSelectedScenarioId(userId, newSelectedId);
}
