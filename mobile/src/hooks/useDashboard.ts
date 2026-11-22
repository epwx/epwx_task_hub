import { useCallback, useEffect, useState } from 'react';

import { api, Campaign, DailyClaimSummary, DailyDraw } from '../api';

type DashboardState = {
  summary?: DailyClaimSummary;
  draw: DailyDraw | null;
  campaigns: Campaign[];
};

export function useDashboard() {
  const [data, setData] = useState<DashboardState>({ draw: null, campaigns: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summary, latestDraw, campaigns] = await Promise.all([
        api.getDailyClaimSummary(),
        api.getLatestDraw(),
        api.getCampaigns(),
      ]);
      setData({ summary, draw: latestDraw.draw, campaigns });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load EPWX data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { ...data, loading, error, refresh };
}
