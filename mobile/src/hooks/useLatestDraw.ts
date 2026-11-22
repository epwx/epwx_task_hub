import { useCallback, useEffect, useState } from 'react';

import { api, DailyDraw, DailyDrawWinner } from '../api';

export function useLatestDraw() {
  const [draw, setDraw] = useState<DailyDraw | null>(null);
  const [winners, setWinners] = useState<DailyDrawWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getLatestDraw();
      setDraw(result.draw);
      setWinners(result.winners);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load the latest draw.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { draw, winners, loading, error, refresh };
}
