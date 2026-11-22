import { useCallback, useEffect, useState } from 'react';

import { api, Campaign } from '../api';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCampaigns(await api.getCampaigns());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { campaigns, loading, error, refresh };
}
