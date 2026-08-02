import { useEffect, useRef, useState } from 'react';
import { fetchSelectedScenarioId } from './scenariosApi';

export function useSelectedScenarioId(userId, scenarios) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchedForUserId = useRef(null);

  // Waits for scenarios to be loaded (not just userId) because a brand-new anonymous
  // user has no user_settings row until seeding finishes inside useScenariosState.
  // Fetches only once per userId (via the ref guard) - after that, selection changes
  // are handled locally by the caller, so editing scenarios doesn't re-trigger a fetch.
  useEffect(() => {
    if (!userId || scenarios.length === 0 || fetchedForUserId.current === userId) return;
    fetchedForUserId.current = userId;
    let cancelled = false;

    (async () => {
      try {
        const stored = await fetchSelectedScenarioId(userId);
        if (cancelled) return;
        const isValid = stored && scenarios.some((s) => s.id === stored);
        setSelectedScenarioId(isValid ? stored : scenarios[0].id);
      } catch {
        if (!cancelled) setSelectedScenarioId(scenarios[0].id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, scenarios]);

  return { selectedScenarioId, setSelectedScenarioId, loading };
}
