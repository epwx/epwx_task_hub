import { useAccount, useProvider } from '@reown/appkit-react-native';
import { BrowserProvider } from 'ethers';
import { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '../../src/components/PageHeader';
import {
  DailyClaimEmailPreference,
  enrollDailyClaimEmail,
  getDailyClaimEmailStatus,
  submitDailyClaim,
  updateDailyClaimEmailPreferences,
} from '../../src/api';
import { useAuthSession } from '../../src/providers/AuthSessionProvider';
import { formatRemainingTime, useDailyClaim } from '../../src/hooks/useDailyClaim';
import { colors, spacing } from '../../src/theme';

export default function HomeScreen() {
  const { address, chainId } = useAccount();
  const { provider, providerType } = useProvider();
  const { user, restoring } = useAuthSession();
  const wallet = address || user?.walletAddress || null;
  const {
    claims,
    latestClaim,
    email,
    telegramVerified,
    loading,
    error: loadError,
    progress,
    refresh,
  } = useDailyClaim(wallet);
  const [accepted, setAccepted] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState('');
  const [claimError, setClaimError] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailPreference, setEmailPreference] = useState<DailyClaimEmailPreference | null>(null);
  const [managingEmail, setManagingEmail] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    setAccepted(false);
    setResult('');
    setClaimError('');
    setEmailPreference(null);
    setManagingEmail(false);
  }, [wallet]);

  const canClaim = Boolean(
    user
      && address
      && user.walletAddress.toLowerCase() === address.toLowerCase()
      && chainId === '8453'
      && progress.remainingCooldownMs === 0
      && email?.verified
      && accepted
      && !claiming,
  );

  const handleClaim = async () => {
    if (!address || !provider || providerType !== 'eip155') {
      setClaimError('Reconnect your wallet on Base before claiming.');
      return;
    }
    if (!canClaim) {
      setClaimError('Complete the wallet, email, terms, and cooldown checks before claiming.');
      return;
    }

    setClaiming(true);
    setClaimError('');
    setResult('');
    try {
      const normalizedWallet = address.toLowerCase();
      const todayUtc = new Date().toISOString().slice(0, 10);
      const message = `EPWX Daily Claim for ${normalizedWallet} on ${todayUtc}\nEligibility policy: daily-reward-draw-eligibility-v1`;
      const browserProvider = new BrowserProvider(provider, 8453);
      const signer = await browserProvider.getSigner(address);
      const signature = await signer.signMessage(message);
      const claim = await submitDailyClaim({
        wallet: normalizedWallet,
        signature,
        ageConfirmed: accepted,
        jurisdictionConfirmed: accepted,
      });
      setResult(
        claim.status === 'paid'
          ? `${Number(claim.amount || 0).toLocaleString()} EPWX paid successfully.`
          : `${Number(claim.amount || 0).toLocaleString()} EPWX claim queued for payout.`,
      );
      setAccepted(false);
      await refresh();
    } catch (caught) {
      setClaimError(caught instanceof Error ? caught.message : 'Daily claim failed.');
    } finally {
      setClaiming(false);
    }
  };

  const handleEmailEnrollment = async () => {
    if (!address || !provider || providerType !== 'eip155' || chainId !== '8453') {
      setClaimError('Reconnect your wallet on Base before enrolling an email.');
      return;
    }

    const normalizedEmail = emailAddress.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setClaimError('Enter a valid email address.');
      return;
    }

    setEmailSending(true);
    setClaimError('');
    setEmailMessage('');
    try {
      const normalizedWallet = address.toLowerCase();
      const todayUtc = new Date().toISOString().slice(0, 10);
      const message = `EPWX Daily Claim Email Enrollment\nWallet: ${normalizedWallet}\nEmail: ${normalizedEmail}\nDate: ${todayUtc}`;
      const browserProvider = new BrowserProvider(provider, 8453);
      const signer = await browserProvider.getSigner(address);
      const signature = await signer.signMessage(message);
      const enrolled = await enrollDailyClaimEmail({
        wallet: normalizedWallet,
        email: normalizedEmail,
        signature,
      });
      setEmailMessage(enrolled.message || 'Check your inbox to verify the email address.');
      await refresh();
    } catch (caught) {
      setClaimError(caught instanceof Error ? caught.message : 'Unable to send verification email.');
    } finally {
      setEmailSending(false);
    }
  };

  const loadEmailPreferences = async () => {
    if (!address || !provider || providerType !== 'eip155' || chainId !== '8453') return;
    setSavingEmail(true);
    setClaimError('');
    try {
      const normalizedWallet = address.toLowerCase();
      const todayUtc = new Date().toISOString().slice(0, 10);
      const message = `EPWX Daily Claim Email Status\nWallet: ${normalizedWallet}\nDate: ${todayUtc}`;
      const browserProvider = new BrowserProvider(provider, 8453);
      const signer = await browserProvider.getSigner(address);
      const signature = await signer.signMessage(message);
      setEmailPreference(await getDailyClaimEmailStatus(normalizedWallet, signature));
      setManagingEmail(true);
    } catch (caught) {
      setClaimError(caught instanceof Error ? caught.message : 'Unable to load email settings.');
    } finally {
      setSavingEmail(false);
    }
  };

  const saveEmailPreferences = async () => {
    if (!address || !provider || providerType !== 'eip155' || !emailPreference) return;
    setSavingEmail(true);
    setClaimError('');
    try {
      const normalizedWallet = address.toLowerCase();
      const remindersEnabled = Boolean(emailPreference.remindersEnabled);
      const successEmailsEnabled = Boolean(emailPreference.successEmailsEnabled);
      const todayUtc = new Date().toISOString().slice(0, 10);
      const message = `EPWX Daily Claim Email Preferences\nWallet: ${normalizedWallet}\nClaim-ready reminders: ${remindersEnabled}\nPayment confirmations: ${successEmailsEnabled}\nDate: ${todayUtc}`;
      const browserProvider = new BrowserProvider(provider, 8453);
      const signer = await browserProvider.getSigner(address);
      const signature = await signer.signMessage(message);
      const updated = await updateDailyClaimEmailPreferences({
        wallet: normalizedWallet,
        signature,
        remindersEnabled,
        successEmailsEnabled,
      });
      setEmailPreference(updated.preference || emailPreference);
      setManagingEmail(false);
      setEmailMessage(updated.message || 'Email preferences updated.');
    } catch (caught) {
      setClaimError(caught instanceof Error ? caught.message : 'Unable to update email settings.');
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
      >
        <PageHeader eyebrow="Base Network rewards" title="Daily Claim" subtitle="Verify eligibility, sign once, and receive your EPWX reward." />

        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
        {claimError ? <Text style={styles.error}>{claimError}</Text> : null}
        {result ? <Text style={styles.success}>{result}</Text> : null}

        {!wallet ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connect your wallet</Text>
            <Text style={styles.body}>Open the Wallet tab, connect a Base wallet, and sign in before claiming.</Text>
          </View>
        ) : (
          <>
            <View style={styles.walletCard}>
              <Text style={styles.eyebrow}>CONNECTED WALLET</Text>
              <Text style={styles.wallet}>{shortenWallet(wallet)}</Text>
              <Text style={styles.body}>
                {user ? 'Authenticated with EPWX' : 'Wallet detected; complete sign-in in the Wallet tab.'}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Claim window</Text>
              <Text style={progress.remainingCooldownMs > 0 ? styles.countdown : styles.ready}>
                {formatRemainingTime(progress.remainingCooldownMs)}
              </Text>
              <Text style={styles.body}>
                {progress.remainingCooldownMs > 0 && progress.readyAt
                  ? `Next claim opens ${new Date(progress.readyAt).toLocaleString()}.`
                  : 'Your 24-hour claim window is open.'}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Eligibility checks</Text>
              <StatusRow label="Wallet authenticated" value={Boolean(user)} />
              <StatusRow label="Base network" value={chainId === '8453'} />
              <StatusRow label="Verified email" value={Boolean(email?.verified)} />
              <StatusRow label="Telegram membership" value={telegramVerified} optional />
              <StatusRow label="24-hour cooldown" value={progress.remainingCooldownMs === 0} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reward streak</Text>
              <Text style={styles.streak}>
                {progress.completedDays ? `Day ${progress.completedDays} complete` : 'Start Day 1'}
              </Text>
              <Text style={styles.body}>
                Your next claim is Day {progress.nextDay} with {progress.nextDrawEntries} reward-draw {progress.nextDrawEntries === 1 ? 'entry' : 'entries'}.
              </Text>
              {progress.remainingStreakMs > 0 ? (
                <Text style={styles.subtle}>
                  Streak expires in {formatRemainingTime(progress.remainingStreakMs)}.
                </Text>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Eligibility confirmation</Text>
              <Text style={styles.body}>
                Confirm that you meet the age and jurisdiction requirements before submitting this reward request.
              </Text>
              <Pressable style={styles.checkboxRow} onPress={() => setAccepted((value) => !value)}>
                <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
                  <Text style={styles.checkboxMark}>{accepted ? '✓' : ''}</Text>
                </View>
                <Text style={styles.checkboxText}>I meet the daily-draw eligibility requirements.</Text>
              </Pressable>
              {!email?.verified ? (
                <View style={styles.emailPanel}>
                  <Text style={styles.emailTitle}>Email verification required</Text>
                  <Text style={styles.emailHelp}>
                    {email?.blocked
                      ? email.error || 'This email is linked to another wallet. Enter a different email.'
                      : 'Add an email for this wallet, approve the wallet signature, then open the verification link sent to your inbox.'}
                  </Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChangeText={setEmailAddress}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.muted}
                    style={styles.emailInput}
                    textContentType="emailAddress"
                    value={emailAddress}
                  />
                  <Pressable
                    disabled={emailSending}
                    onPress={handleEmailEnrollment}
                    style={[styles.secondaryButton, emailSending && styles.claimButtonDisabled]}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {emailSending ? 'Waiting for wallet signature...' : 'Send verification email'}
                    </Text>
                  </Pressable>
                  {emailMessage ? <Text style={styles.emailMessage}>{emailMessage}</Text> : null}
                  {email?.enrolled ? (
                    <Pressable onPress={refresh} style={styles.refreshButton}>
                      <Text style={styles.refreshButtonText}>I verified it — refresh status</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View style={styles.emailPanel}>
                  <Text style={styles.emailTitle}>Email verified</Text>
                  <Text style={styles.emailHelp}>Your wallet can submit Daily Claims. Manage reminder and payment email preferences.</Text>
                  <Pressable
                    disabled={savingEmail}
                    onPress={loadEmailPreferences}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {savingEmail ? 'Waiting for wallet signature...' : 'Manage email settings'}
                    </Text>
                  </Pressable>
                  {emailMessage ? <Text style={styles.emailMessage}>{emailMessage}</Text> : null}
                </View>
              )}
              {managingEmail && emailPreference ? (
                <View style={styles.settingsPanel}>
                  <Text style={styles.emailTitle}>{emailPreference.emailMasked || 'Verified email'}</Text>
                  <Pressable
                    onPress={() => setEmailPreference({
                      ...emailPreference,
                      remindersEnabled: !emailPreference.remindersEnabled,
                    })}
                    style={styles.preferenceRow}
                  >
                    <Text style={styles.preferenceLabel}>Claim-ready reminders</Text>
                    <Text style={emailPreference.remindersEnabled ? styles.preferenceOn : styles.preferenceOff}>
                      {emailPreference.remindersEnabled ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setEmailPreference({
                      ...emailPreference,
                      successEmailsEnabled: !emailPreference.successEmailsEnabled,
                    })}
                    style={styles.preferenceRow}
                  >
                    <Text style={styles.preferenceLabel}>Payment confirmations</Text>
                    <Text style={emailPreference.successEmailsEnabled ? styles.preferenceOn : styles.preferenceOff}>
                      {emailPreference.successEmailsEnabled ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                  <Pressable disabled={savingEmail} onPress={saveEmailPreferences} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>
                      {savingEmail ? 'Saving with wallet signature...' : 'Save email settings'}
                    </Text>
                  </Pressable>
                  <Pressable disabled={savingEmail} onPress={() => setManagingEmail(false)} style={styles.refreshButton}>
                    <Text style={styles.refreshButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                style={[styles.claimButton, !canClaim && styles.claimButtonDisabled]}
                disabled={!canClaim || restoring}
                onPress={handleClaim}
              >
                <Text style={styles.claimButtonText}>
                  {claiming ? 'Waiting for wallet signature...' : 'Claim daily EPWX'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent claims</Text>
              {claims.length === 0 ? (
                <Text style={styles.body}>No daily claims recorded yet.</Text>
              ) : claims.slice(0, 5).map((claim) => (
                <View key={claim.id} style={styles.claimRow}>
                  <View style={styles.claimDetails}>
                    <Text style={styles.claimAmount}>{Number(claim.amount || 0).toLocaleString()} EPWX</Text>
                    <Text style={styles.subtle}>{new Date(claim.claimedAt).toLocaleString()}</Text>
                  </View>
                  <Pressable
                    disabled={!claim.txHash}
                    onPress={() => claim.txHash && Linking.openURL(`https://basescan.org/tx/${claim.txHash}`)}
                  >
                    <Text style={[styles.claimStatus, claim.status === 'paid' ? styles.paid : styles.pending]}>
                      {claim.status.toUpperCase()}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {latestClaim?.txHash ? (
              <Text style={styles.transactionHint}>Tap a paid claim above to view its BaseScan transaction.</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusRow({ label, value, optional = false }: { label: string; value: boolean; optional?: boolean }) {
  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={[styles.statusValue, value ? styles.statusReady : optional ? styles.statusOptional : styles.statusBlocked]}>
        {value ? 'READY' : optional ? 'BONUS' : 'REQUIRED'}
      </Text>
    </View>
  );
}

function shortenWallet(wallet: string) {
  return wallet.length > 14 ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : wallet;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: spacing.lg },
  walletCard: { backgroundColor: colors.accentSurface, borderRadius: 18, padding: spacing.lg },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  wallet: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 8 },
  cardTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  subtle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  countdown: { color: colors.warning, fontSize: 34, fontWeight: '900', marginTop: 10 },
  ready: { color: colors.accent, fontSize: 30, fontWeight: '900', marginTop: 10 },
  statusRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11 },
  statusLabel: { color: colors.text, fontSize: 14 },
  statusValue: { borderRadius: 999, fontSize: 10, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 5 },
  statusReady: { backgroundColor: colors.accentSurface, color: colors.accent },
  statusBlocked: { backgroundColor: colors.dangerSurface, color: colors.danger },
  statusOptional: { backgroundColor: colors.warningSurface, color: colors.warning },
  streak: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 8 },
  checkboxRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: 15 },
  checkbox: { alignItems: 'center', borderColor: colors.border, borderRadius: 6, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkboxMark: { color: colors.background, fontSize: 15, fontWeight: '900' },
  checkboxText: { color: colors.text, flex: 1, fontSize: 14, lineHeight: 20 },
  claimButton: { backgroundColor: colors.accent, borderRadius: 12, marginTop: 18, padding: 15 },
  claimButtonDisabled: { opacity: 0.45 },
  claimButtonText: { color: colors.background, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  secondaryButton: { borderColor: colors.border, borderRadius: 12, borderWidth: 1, marginTop: 16, padding: 13 },
  secondaryButtonText: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  emailPanel: { backgroundColor: colors.background, borderRadius: 14, marginTop: 16, padding: spacing.md },
  emailTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  emailHelp: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  emailInput: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.text, fontSize: 15, marginTop: 12, padding: 13 },
  emailMessage: { color: colors.accent, fontSize: 13, lineHeight: 19, marginTop: 12 },
  refreshButton: { marginTop: 13, paddingVertical: 8 },
  refreshButtonText: { color: colors.accent, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  settingsPanel: { backgroundColor: colors.accentSurface, borderRadius: 14, marginTop: 12, padding: spacing.md },
  preferenceRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  preferenceLabel: { color: colors.text, fontSize: 14 },
  preferenceOn: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  preferenceOff: { color: colors.muted, fontSize: 12, fontWeight: '900' },
  claimRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 12 },
  claimDetails: { flex: 1 },
  claimAmount: { color: colors.text, fontSize: 16, fontWeight: '800' },
  claimStatus: { borderRadius: 999, fontSize: 10, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6 },
  paid: { backgroundColor: colors.accentSurface, color: colors.accent },
  pending: { backgroundColor: colors.warningSurface, color: colors.warning },
  transactionHint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  error: { backgroundColor: colors.dangerSurface, borderRadius: 12, color: colors.danger, padding: spacing.md },
  success: { backgroundColor: colors.accentSurface, borderRadius: 12, color: colors.accent, padding: spacing.md },
});
