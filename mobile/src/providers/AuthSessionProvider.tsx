import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getCurrentUser, MobileUser } from '../auth';

const SESSION_KEY = 'epwx.mobile.accessToken';

type AuthSessionContextValue = {
  token: string | null;
  user: MobileUser | null;
  restoring: boolean;
  setAuthenticatedSession: (token: string, user: MobileUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(SESSION_KEY);
        if (!storedToken) return;

        const restored = await getCurrentUser(storedToken);
        if (active) {
          setToken(storedToken);
          setUser(restored.data);
        }
      } catch {
        await SecureStore.deleteItemAsync(SESSION_KEY);
      } finally {
        if (active) setRestoring(false);
      }
    })();

    return () => { active = false; };
  }, []);

  const setAuthenticatedSession = useCallback(async (nextToken: string, nextUser: MobileUser) => {
    await SecureStore.setItemAsync(SESSION_KEY, nextToken, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, restoring, setAuthenticatedSession, signOut }),
    [restoring, setAuthenticatedSession, signOut, token, user],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error('useAuthSession must be used within AuthSessionProvider.');
  return context;
}
