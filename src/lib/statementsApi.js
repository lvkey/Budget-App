import { supabase } from './supabaseClient';

export async function fetchProfiles(userId) {
  const { data, error } = await supabase.from('actual_profiles').select('*').eq('user_id', userId).order('created_at');
  if (error) throw error;
  return data;
}

export async function insertProfile({ userId, name }) {
  const { data, error } = await supabase.from('actual_profiles').insert({ user_id: userId, name }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(id) {
  const { error } = await supabase.from('actual_profiles').delete().eq('id', id);
  if (error) throw error;
}

export async function insertImportBatch({ userId, profileId, filename, rowCount }) {
  const { data, error } = await supabase
    .from('import_batches')
    .insert({ user_id: userId, profile_id: profileId, filename, row_count: rowCount })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteImportBatch(id) {
  const { error } = await supabase.from('import_batches').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchImportBatches(userId, profileId) {
  const { data, error } = await supabase
    .from('import_batches')
    .select('*')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .order('created_at');
  if (error) throw error;
  return data;
}

// Transactions belong to a batch, which belongs to a profile - joined through
// import_batches so callers can fetch "everything in this profile" directly.
export async function fetchTransactions(userId, profileId) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, import_batches!inner(profile_id)')
    .eq('user_id', userId)
    .eq('import_batches.profile_id', profileId)
    .order('txn_date');
  if (error) throw error;
  return data.map(({ import_batches, ...row }) => row);
}

export async function insertTransactions(rows) {
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from('transactions').insert(rows).select();
  if (error) throw error;
  return data;
}

export async function updateTransaction(id, fields) {
  const { error } = await supabase.from('transactions').update(fields).eq('id', id);
  if (error) throw error;
}

export async function fetchMerchantRules(userId) {
  const { data, error } = await supabase.from('merchant_rules').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

// One rule per (user, merchant) - reassigning a merchant just overwrites its rule.
export async function upsertMerchantRule({ userId, merchantKey, matchedExpenseId, category }) {
  const { error } = await supabase.from('merchant_rules').upsert(
    {
      user_id: userId,
      merchant_key: merchantKey,
      matched_expense_id: matchedExpenseId ?? null,
      category: category ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,merchant_key' }
  );
  if (error) throw error;
}
