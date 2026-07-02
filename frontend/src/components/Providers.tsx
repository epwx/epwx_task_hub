'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { useAccount, useReconnect } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig, useModal } from 'connectkit';
import { ReactNode, useEffect, useRef } from 'react';

const config = createConfig(
  getDefaultConfig({
    chains: [base],
    transports: {
      [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'),
    },
    syncConnectedChain: false,
    // Use a placeholder WalletConnect project ID if not set
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a01e2f3b4c5d6e7f8g9h0i1j2k3l4m5n',
    appName: 'EPWX Task Platform',
    appDescription: 'Earn EPWX by completing campaigns and claiming rewards',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.NEXT_PUBLIC_PORT || 3000}`,
    appIcon: 'https://epowex.com/logo.png',
    enableFamily: false,
  })
);

const queryClient = new QueryClient();

function WalletReturnSync() {
  const { isConnected } = useAccount();
  const { reconnect } = useReconnect();
  const { open, setOpen } = useModal();
  const wasConnectedRef = useRef(isConnected);

  useEffect(() => {
    const syncWalletState = () => {
      void reconnect();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWalletState();
      }
    };

    window.addEventListener('focus', syncWalletState);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', syncWalletState);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [reconnect]);

  useEffect(() => {
    const justConnected = !wasConnectedRef.current && isConnected;
    if (open && justConnected) {
      setOpen(false);
    }
    wasConnectedRef.current = isConnected;
  }, [open, isConnected, setOpen]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          options={{
            // Disable WalletConnect modal to prevent connection errors
            hideNoWalletCTA: true,
            hideQuestionMarkCTA: true,
          }}
        >
          <WalletReturnSync />
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
