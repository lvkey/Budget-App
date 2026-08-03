import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const SITE_URL = 'https://bgt.lukeswift.net';

export function useSupabaseAuth() {
  const [userId, setUserId] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setUserId(session.user.id);
        setIsAnonymous(Boolean(session.user.is_anonymous));
        setAuthLoading(false);
      }
    });

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setUserId(session.user.id);
        setIsAnonymous(Boolean(session.user.is_anonymous));
        setAuthLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (cancelled) return;
      if (error) {
        setAuthError(error);
        setAuthLoading(false);
        return;
      }
      setUserId(data.user.id);
      setIsAnonymous(true);
      setAuthLoading(false);
    })();

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Converts the current anonymous session into a permanent one, keeping the
  // same auth.uid() - existing data needs no migration. Sends a magic link;
  // the account only actually becomes permanent once that link is confirmed.
  async function upgradeAccount(email) {
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: SITE_URL });
    if (error) throw error;
  }

  return { userId, isAnonymous, authLoading, authError, upgradeAccount };
}
