import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/ui/AppBackground';
import AppButton from '@/components/AppButton';
import LogoMark from '@/components/ui/LogoMark';
import { COLORS } from '@/constants/colors';
import { SPACING, TYPOGRAPHY } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <LogoMark size={62} />
          <View style={styles.icon}>
            <Ionicons
              name="compass-outline"
              size={26}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.eyebrow}>404 · route not found</Text>
          <Text style={styles.title}>This screen is off the grid.</Text>
          <Text style={styles.subtitle}>
            The page you tried to open does not exist in QR-ATT.
          </Text>
          <View style={styles.action}>
            <AppButton
              variant="primary"
              title="Back to Home"
              icon="home-outline"
              onPress={() => router.replace('/(tabs)')}
            />
          </View>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xl,
  },
  eyebrow: {
    ...TYPOGRAPHY.eyebrow,
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    alignSelf: 'stretch',
    marginTop: SPACING.lg,
  },
});
