import 'react-native-get-random-values';
import '@walletconnect/react-native-compat';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import {
  AppKitNetwork,
  Storage,
  createAppKit,
} from '@reown/appkit-react-native';

const projectId = process.env.EXPO_PUBLIC_REOWN_PROJECT_ID?.trim() || '';

const base: AppKitNetwork = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:8453',
};

const storage: Storage = {
  async getKeys() {
    return [...(await AsyncStorage.getAllKeys())];
  },
  async getEntries<T = unknown>() {
    const keys = await storage.getKeys();
    return Promise.all(
      keys.map(async (key) => {
        const item = await storage.getItem<T>(key);
        return [key, item] as [string, T];
      }),
    );
  },
  async getItem<T = unknown>(key: string) {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return undefined;
    return JSON.parse(value) as T;
  },
  async setItem<T = unknown>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};

export const isAppKitConfigured = projectId.length > 0;

export const appKit = isAppKitConfigured
  ? createAppKit({
      projectId,
      adapters: [new EthersAdapter()],
      networks: [base],
      defaultNetwork: base,
      storage,
      enableAnalytics: false,
      features: {
        swaps: false,
        onramp: false,
        socials: false,
      },
      metadata: {
        name: 'EPWX Tasks',
        description: 'Complete campaigns and view EPWX rewards on Base.',
        url: 'https://tasks.epowex.com',
        icons: ['https://tasks.epowex.com/logo.webp'],
        redirect: {
          native: 'epwxtasks://',
          universal: 'https://tasks.epowex.com',
        },
      },
    })
  : null;
