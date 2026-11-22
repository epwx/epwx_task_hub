import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../src/theme';

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ color: focused ? colors.accent : colors.muted, fontSize: 11, fontWeight: '700' }}>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 58 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarShowLabel: true,
        tabBarItemStyle: { paddingTop: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: () => null, tabBarLabel: ({ focused }) => <TabLabel label="HOME" focused={focused} /> }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{ title: 'Campaigns', tabBarIcon: () => null, tabBarLabel: ({ focused }) => <TabLabel label="TASKS" focused={focused} /> }}
      />
      <Tabs.Screen
        name="winners"
        options={{ title: 'Winners', tabBarIcon: () => null, tabBarLabel: ({ focused }) => <TabLabel label="DRAW" focused={focused} /> }}
      />
      <Tabs.Screen
        name="wallet"
        options={{ title: 'Wallet', tabBarIcon: () => null, tabBarLabel: ({ focused }) => <TabLabel label="WALLET" focused={focused} /> }}
      />
    </Tabs>
  );
}
