import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const REVIEW_ACCESS_KEY = 'epwx.review.access';

export const REVIEW_MODE = process.env.EXPO_PUBLIC_REVIEW_MODE === 'true';
const REVIEW_USERNAME = process.env.EXPO_PUBLIC_REVIEW_USERNAME || 'play-reviewer';
const REVIEW_PASSWORD = process.env.EXPO_PUBLIC_REVIEW_PASSWORD || '';

type ReviewAccessContextValue = {
  enabled: boolean;
  authenticate: (username: string, password: string) => boolean;
  clear: () => Promise<void>;
};

const ReviewAccessContext = createContext<ReviewAccessContextValue | null>(null);

export function ReviewAccessProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!REVIEW_MODE) return;
    void AsyncStorage.getItem(REVIEW_ACCESS_KEY).then((value) => setEnabled(value === 'enabled'));
  }, []);

  const authenticate = useCallback((username: string, password: string) => {
    const valid = REVIEW_MODE
      && Boolean(REVIEW_PASSWORD)
      && username.trim() === REVIEW_USERNAME
      && password === REVIEW_PASSWORD;
    if (valid) {
      setEnabled(true);
      void AsyncStorage.setItem(REVIEW_ACCESS_KEY, 'enabled');
    }
    return valid;
  }, []);

  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(REVIEW_ACCESS_KEY);
    setEnabled(false);
  }, []);

  const value = useMemo(
    () => ({ enabled: REVIEW_MODE && enabled, authenticate, clear }),
    [authenticate, clear, enabled],
  );

  return <ReviewAccessContext.Provider value={value}>{children}</ReviewAccessContext.Provider>;
}

export function useReviewAccess() {
  const context = useContext(ReviewAccessContext);
  if (!context) throw new Error('useReviewAccess must be used within ReviewAccessProvider.');
  return context;
}
