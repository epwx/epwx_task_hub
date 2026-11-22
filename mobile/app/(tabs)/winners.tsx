import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '../../src/components/PageHeader';
import { useLatestDraw } from '../../src/hooks/useLatestDraw';
import { colors, spacing } from '../../src/theme';

export default function WinnersScreen() {
  const { draw, winners, loading, error, refresh } = useLatestDraw();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
      >
        <PageHeader eyebrow="Transparent results" title="Latest winners" subtitle="Public draw winners from the existing EPWX audit data." />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {draw ? (
          <View style={styles.summary}>
            <Text style={styles.date}>{draw.drawDate}</Text>
            <Text style={styles.summaryText}>{winners.length} winners · {Number(draw.prizeAmount || 0).toLocaleString()} EPWX each</Text>
          </View>
        ) : null}
        {winners.map((winner) => (
          <View key={winner.id} style={styles.card}>
            <View>
              <Text style={styles.rank}>WINNER #{winner.rank}</Text>
              <Text style={styles.wallet}>{shortenWallet(winner.wallet)}</Text>
            </View>
            <Text style={[styles.status, winner.status === 'paid' ? styles.paid : styles.pending]}>
              {winner.status.toUpperCase()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function shortenWallet(wallet: string) {
  return wallet.length > 14 ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : wallet;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  summary: { backgroundColor: colors.accentSurface, borderRadius: 18, padding: spacing.lg },
  date: { color: colors.text, fontSize: 24, fontWeight: '900' },
  summaryText: { color: colors.muted, fontSize: 14, marginTop: 5 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  rank: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  wallet: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 5 },
  status: { borderRadius: 999, fontSize: 10, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  paid: { backgroundColor: colors.accentSurface, color: colors.accent },
  pending: { backgroundColor: colors.warningSurface, color: colors.warning },
  error: { color: colors.danger, lineHeight: 20 },
});
