import { AppKit, AppKitProvider } from '@reown/appkit-react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../src/theme';
import { appKit } from '../src/appKit';
import { AuthSessionProvider } from '../src/providers/AuthSessionProvider';

export default function RootLayout() {
  const content = (
    <>
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {appKit ? <AppKit /> : null}
    </>
  );

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthSessionProvider>
        {appKit ? <AppKitProvider instance={appKit}>{content}</AppKitProvider> : content}
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
