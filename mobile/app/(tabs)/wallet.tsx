import { useAccount, useAppKit, useProvider } from '@reown/appkit-react-native';
import { BrowserProvider } from 'ethers';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '../../src/components/PageHeader';
import { connectWallet, requestWalletChallenge } from '../../src/auth';
import { isAppKitConfigured } from '../../src/appKit';
import { useAuthSession } from '../../src/providers/AuthSessionProvider';
import { colors, spacing } from '../../src/theme';

function WalletConfigurationNotice() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>WalletConnect needs configuration</Text>
      <Text style={styles.text}>
        Set EXPO_PUBLIC_REOWN_PROJECT_ID in mobile/.env.local, then restart Expo. Obtain the public ID from the Reown dashboard.
      </Text>
    </View>
  );
}

function ConnectedWalletPanel() {
  const { address, chainId, isConnected } = useAccount();
  const { open, disconnect } = useAppKit();
  const { provider, providerType } = useProvider();
  const { user, restoring, setAuthenticatedSession, signOut } = useAuthSession();
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const authenticate = async () => {
    if (!address || !provider || providerType !== 'eip155' || chainId !== '8453') {
      setError('Connect an EVM wallet on Base before signing in.');
      return;
    }

    setAuthenticating(true);
    setError('');
    try {
      const challenge = await requestWalletChallenge(address);
      const browserProvider = new BrowserProvider(provider, 8453);
      const signer = await browserProvider.getSigner(address);
      const signature = await signer.signMessage(challenge.message);
      const result = await connectWallet(challenge, address, signature);
      await setAuthenticatedSession(result.data.token, result.data.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Wallet authentication failed.');
    } finally {
      setAuthenticating(false);
    }
  };

  const disconnectAll = async () => {
    await signOut();
    disconnect();
  };

  if (restoring) {
    return <ActivityIndicator color={colors.accent} />;
  }

  if (user) {
    return (
      <View style={styles.card}>
        <Text style={styles.eyebrow}>AUTHENTICATED</Text>
        <Text style={styles.title}>{shortenWallet(user.walletAddress)}</Text>
        <Text style={styles.text}>Your one-time wallet signature was verified by the existing EPWX backend.</Text>
        <View style={styles.sessionRow}>
          <Text style={styles.sessionLabel}>Tasks completed</Text>
          <Text style={styles.sessionValue}>{user.tasksCompleted || 0}</Text>
        </View>
        <Pressable style={styles.secondaryButton} onPress={disconnectAll}>
          <Text style={styles.secondaryButtonText}>Disconnect and sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{isConnected ? 'Verify wallet ownership' : 'Connect your wallet'}</Text>
      <Text style={styles.text}>
        {isConnected
          ? `Connected to ${shortenWallet(address || '')}. Sign one nonce message to authenticate securely.`
          : 'Connect using a WalletConnect-compatible Base wallet. Private keys never enter this app.'}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isConnected ? (
        <Pressable style={styles.primaryButton} onPress={() => open()}>
          <Text style={styles.primaryButtonText}>Choose wallet</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.primaryButton} disabled={authenticating} onPress={authenticate}>
          <Text style={styles.primaryButtonText}>{authenticating ? 'Waiting for signature...' : 'Sign in with wallet'}</Text>
        </Pressable>
      )}
      {isConnected ? (
        <Pressable style={styles.secondaryButton} onPress={() => disconnect()}>
          <Text style={styles.secondaryButtonText}>Disconnect wallet</Text>
        </Pressable>
      ) : null}
      <View style={styles.steps}>
        <Text style={styles.step}>1. Backend creates a short-lived nonce</Text>
        <Text style={styles.step}>2. Your wallet signs the nonce message</Text>
        <Text style={styles.step}>3. Backend verifies and creates a session</Text>
      </View>
    </View>
  );
}

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader eyebrow="Secure connection" title="Wallet" subtitle="WalletConnect authentication on Base, without exposing private keys." />
        {isAppKitConfigured ? <ConnectedWalletPanel /> : <WalletConfigurationNotice />}
      </ScrollView>
    </SafeAreaView>
  );
}

function shortenWallet(wallet: string) {
  return wallet.length > 14 ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : wallet;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: spacing.lg },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 21, fontWeight: '900' },
  text: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  error: { backgroundColor: colors.dangerSurface, borderRadius: 10, color: colors.danger, marginTop: 14, padding: 12 },
  primaryButton: { backgroundColor: colors.accent, borderRadius: 12, marginTop: 18, padding: 15 },
  primaryButtonText: { color: colors.background, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  secondaryButton: { borderColor: colors.border, borderRadius: 12, borderWidth: 1, marginTop: 10, padding: 14 },
  secondaryButtonText: { color: colors.text, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  steps: { backgroundColor: colors.background, borderRadius: 14, marginTop: 18, padding: spacing.md, gap: 10 },
  step: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sessionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sessionLabel: { color: colors.muted },
  sessionValue: { color: colors.text, fontWeight: '900' },
});
