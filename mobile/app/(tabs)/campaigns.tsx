import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageHeader } from '../../src/components/PageHeader';
import { useCampaigns } from '../../src/hooks/useCampaigns';
import { colors, spacing } from '../../src/theme';

export default function CampaignsScreen() {
  const { campaigns, loading, error, refresh } = useCampaigns();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />}
      >
        <PageHeader eyebrow="Community rewards" title="Active campaigns" subtitle="Complete social tasks and submit proof on the EPWX website." />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && campaigns.length === 0 ? (
          <Text style={styles.empty}>No active campaigns are available right now.</Text>
        ) : null}
        {campaigns.map((campaign) => (
          <View key={campaign.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.taskType}>{campaign.taskType.toUpperCase()}</Text>
              <View style={styles.activeBadge}><Text style={styles.activeText}>ACTIVE</Text></View>
            </View>
            <Text style={styles.title}>{campaign.title}</Text>
            <Text style={styles.reward}>{Number(campaign.rewardAmount || 0).toLocaleString()} EPWX</Text>
            <Text style={styles.description}>
              {campaign.expiresAt ? `Expires ${new Date(campaign.expiresAt).toLocaleDateString()}` : 'No expiry set'}
            </Text>
            <Pressable style={styles.button} onPress={() => Linking.openURL(campaign.tweetUrl)}>
              <Text style={styles.buttonText}>Open campaign</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, padding: spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskType: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  activeBadge: { backgroundColor: colors.accentSurface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  activeText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 12 },
  reward: { color: colors.warning, fontSize: 18, fontWeight: '800', marginTop: 8 },
  description: { color: colors.muted, fontSize: 13, marginTop: 5 },
  button: { backgroundColor: colors.accent, borderRadius: 12, marginTop: 18, padding: 14 },
  buttonText: { color: colors.background, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  error: { color: colors.danger, lineHeight: 20 },
  empty: { color: colors.muted, textAlign: 'center', padding: spacing.xl },
});
