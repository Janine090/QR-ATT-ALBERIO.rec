import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';

import LogoMark from '@/components/ui/LogoMark';
import { COLORS } from '@/constants/colors';
import { TYPOGRAPHY } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync(COLORS.background).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    const path = segments?.[0];
    const inAuthGroup = path === 'login' || path === 'register';
    const inTabsGroup = path === '(tabs)';

    if (!session && inTabsGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!segments?.length && !session) {
      router.replace('/login');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <LogoMark size={64} />
        <Text style={styles.brand}>QR-ATT</Text>
        <Text style={styles.tag}>Campus Attendance OS</Text>
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={styles.spinner}
        />
        <Text style={styles.status}>Establishing secure session...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
        initialRouteName="login"
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  brand: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.textPrimary,
  },
  tag: {
    ...TYPOGRAPHY.eyebrow,
    fontSize: 9,
    color: COLORS.muted,
  },
  spinner: {
    marginTop: 28,
  },
  status: {
    marginTop: 12,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
});
