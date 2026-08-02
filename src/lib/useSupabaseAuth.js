import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useSupabaseAuth() {
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setUserId(session.user.id);
        setAuthLoading(false);
      }
    });

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        setUserId(session.user.id);
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
      setAuthLoading(false);
    })();

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { userId, authLoading, authError };
}
