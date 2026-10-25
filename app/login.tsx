import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/ui/AppBackground';
import AppButton from '@/components/AppButton';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import FadeIn from '@/components/ui/FadeIn';
import FormField from '@/components/ui/FormField';
import LogoMark from '@/components/ui/LogoMark';
import { COLORS } from '@/constants/colors';
import { SPACING, TYPOGRAPHY } from '@/constants/theme';
import { signIn, authErrorMessage } from '@/lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    setLoading(true);

    try {
      const { error: authError } = await signIn(email.trim(), password);

      if (authError) {
        setError(authErrorMessage(authError.message));
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FadeIn>
              <View style={styles.brandRow}>
                <View style={styles.brand}>
                  <LogoMark size={46} />
                  <View>
                    <Text style={styles.brandName}>QR-ATT</Text>
                    <Text style={styles.brandTag}>Campus Attendance OS</Text>
                  </View>
                </View>
                <Badge label="Secure" tone="success" icon="shield-checkmark" />
              </View>
            </FadeIn>

            <FadeIn delay={70}>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>Welcome back</Text>
                <Text style={styles.title}>Attendance,{'\n'}engineered.</Text>
                <Text style={styles.subtitle}>
                  Sign in to scan event QR codes, track your check-ins, and
                  manage attendance in real time.
                </Text>
              </View>
            </FadeIn>

            <FadeIn delay={130}>
              <View style={styles.features}>
                <Badge label="QR powered" tone="info" icon="qr-code-outline" />
                <Badge label="Cloud sync" tone="violet" icon="cloud-outline" />
                <Badge label="Cloud logs" tone="neutral" icon="cloud-outline" />
              </View>
            </FadeIn>

            <FadeIn delay={190}>
              <Card style={styles.formCard} glow={COLORS.primary}>
                <Text style={styles.formEyebrow}>Secure access</Text>
                <Text style={styles.formTitle}>Sign in</Text>

                <View style={styles.fields}>
                  <FormField
                    label="Email address"
                    icon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@school.edu"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    editable={!loading}
                  />
                  <FormField
                    label="Password"
                    icon="lock-closed-outline"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secure
                    autoComplete="password"
                    textContentType="password"
                    editable={!loading}
                    onSubmitEditing={handleLogin}
                    returnKeyType="go"
                  />
                </View>

                {error ? (
                  <View style={styles.errorBanner}>
                    <Ionicons
                      name="alert-circle"
                      size={17}
                      color={COLORS.danger}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.submit}>
                  <AppButton
                    variant="primary"
                    title="Sign In"
                    icon="log-in-outline"
                    onPress={handleLogin}
                    loading={loading}
                  />
                </View>
              </Card>
            </FadeIn>

            <FadeIn delay={250}>
              <View style={styles.footer}>
                <Text style={styles.footerText}>New to QR-ATT?</Text>
                <Link href="/register" asChild>
                  <Pressable>
                    <Text style={styles.footerLink}>Create an account</Text>
                  </Pressable>
                </Link>
              </View>
              <Text style={styles.legal}>
                Protected by Supabase Auth · Session stored in device keychain
              </Text>
            </FadeIn>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.huge,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  brandTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginTop: 1,
  },
  hero: {
    marginBottom: SPACING.xl,
  },
  eyebrow: {
    ...TYPOGRAPHY.eyebrow,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -1.6,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    maxWidth: 340,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  formCard: {
    gap: SPACING.md,
  },
  formEyebrow: {
    ...TYPOGRAPHY.eyebrow,
    color: COLORS.primary,
  },
  formTitle: {
    ...TYPOGRAPHY.section,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginTop: -SPACING.xs,
  },
  fields: {
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: '#FB718514',
    borderWidth: 1,
    borderColor: '#FB718540',
    borderRadius: 12,
    padding: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.danger,
  },
  submit: {
    marginTop: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xxl,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  legal: {
    marginTop: SPACING.lg,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.3,
    color: COLORS.muted,
    textAlign: 'center',
  },
});
