import { useEffect, useState } from 'react';
import { fetchScenarios, seedNewUser } from './scenariosApi';

export function useScenariosState(userId) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        let data = await fetchScenarios(userId);
        if (data.length === 0) {
          await seedNewUser(userId);
          data = await fetchScenarios(userId);
        }
        if (!cancelled) setScenarios(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return { scenarios, setScenarios, loading, error, retry };
}
