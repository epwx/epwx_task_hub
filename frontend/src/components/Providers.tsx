'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { ReactNode } from 'react';

const config = createConfig(
  getDefaultConfig({
    chains: [base],
    transports: {
      [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'),
    },
    // Use a placeholder WalletConnect project ID if not set
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a01e2f3b4c5d6e7f8g9h0i1j2k3l4m5n',
    appName: 'EPWX Task Platform',
    appDescription: 'Earn EPWX by completing campaigns and claiming rewards',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    appIcon: 'https://epowex.com/logo.png',
  })
);

const queryClient = new QueryClient();

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
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
