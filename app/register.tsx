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
import { RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { signUp, authErrorMessage } from '@/lib/auth';

type Role = 'student' | 'teacher';

const ROLE_OPTIONS: {
  value: Role;
  label: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'student',
    label: 'Student',
    caption: 'Scan & track',
    icon: 'school-outline',
  },
  {
    value: 'teacher',
    label: 'Teacher',
    caption: 'Create events',
    icon: 'easel-outline',
  },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(email.trim(), password, {
        full_name: fullName.trim(),
        role,
      });

      if (authError) {
        setError(authErrorMessage(authError.message));
      } else if (data.session) {
        router.replace('/(tabs)');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
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
                  <LogoMark size={44} />
                  <View>
                    <Text style={styles.brandName}>QR-ATT</Text>
                    <Text style={styles.brandTag}>Campus Attendance OS</Text>
                  </View>
                </View>
                <Badge label="v1.0" tone="neutral" icon="git-branch-outline" />
              </View>
            </FadeIn>

            <FadeIn delay={70}>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>Get started</Text>
                <Text style={styles.title}>Create your{'\n'}account.</Text>
                <Text style={styles.subtitle}>
                  Choose a role, verify your details, and join the attendance
                  network.
                </Text>
              </View>
            </FadeIn>

            {success ? (
              <FadeIn delay={120}>
                <Card style={styles.successCard} glow={COLORS.success}>
                  <View style={styles.successIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={44}
                      color={COLORS.success}
                    />
                  </View>
                  <Text style={styles.successTitle}>Check your email</Text>
                  <Text style={styles.successText}>
                    We sent a confirmation link to {email}. Verify your account,
                    then return to sign in.
                  </Text>
                  <AppButton
                    variant="secondary"
                    title="Back to Sign In"
                    icon="arrow-back-outline"
                    onPress={() => router.replace('/login')}
                  />
                </Card>
              </FadeIn>
            ) : (
              <FadeIn delay={120}>
                <Card style={styles.formCard} glow={COLORS.primary}>
                  <Text style={styles.formEyebrow}>New identity</Text>
                  <Text style={styles.formTitle}>Register</Text>

                  <View style={styles.fields}>
                    <FormField
                      label="Full name"
                      icon="person-outline"
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Juan Dela Cruz"
                      autoComplete="name"
                      editable={!loading}
                    />
                    <FormField
                      label="Email address"
                      icon="mail-outline"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your.email@school.edu"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!loading}
                    />
                    <FormField
                      label="Password"
                      icon="lock-closed-outline"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 6 characters"
                      secure
                      editable={!loading}
                    />
                    <FormField
                      label="Confirm password"
                      icon="shield-checkmark-outline"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter your password"
                      secure
                      editable={!loading}
                    />

                    <View style={styles.roleSection}>
                      <Text style={styles.roleLabel}>I am a...</Text>
                      <View style={styles.roleRow}>
                        {ROLE_OPTIONS.map((option) => {
                          const active = role === option.value;
                          return (
                            <Pressable
                              key={option.value}
                              onPress={() => setRole(option.value)}
                              style={({ pressed }) => [
                                styles.roleCard,
                                active && styles.roleCardActive,
                                pressed && styles.pressed,
                              ]}
                            >
                              <View
                                style={[
                                  styles.roleIcon,
                                  active && styles.roleIconActive,
                                ]}
                              >
                                <Ionicons
                                  name={option.icon}
                                  size={20}
                                  color={
                                    active
                                      ? COLORS.textOnPrimary
                                      : COLORS.textSecondary
                                  }
                                />
                              </View>
                              <View style={styles.roleText}>
                                <Text
                                  style={[
                                    styles.roleTitle,
                                    active && styles.roleTitleActive,
                                  ]}
                                >
                                  {option.label}
                                </Text>
                                <Text style={styles.roleCaption}>
                                  {option.caption}
                                </Text>
                              </View>
                              {active ? (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={18}
                                  color={COLORS.primary}
                                />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
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
                      title="Create Account"
                      icon="person-add-outline"
                      onPress={handleRegister}
                      loading={loading}
                    />
                  </View>
                </Card>
              </FadeIn>
            )}

            {!success ? (
              <FadeIn delay={190}>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already registered?</Text>
                  <Link href="/login" asChild>
                    <Pressable>
                      <Text style={styles.footerLink}>Sign in</Text>
                    </Pressable>
                  </Link>
                </View>
              </FadeIn>
            ) : null}
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
    marginBottom: SPACING.xxl,
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
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.4,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    maxWidth: 340,
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
  roleSection: {
    gap: SPACING.sm,
  },
  roleLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
  },
  roleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#22D3EE10',
  },
  roleIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  roleIconActive: {
    backgroundColor: COLORS.primary,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roleTitleActive: {
    color: COLORS.primary,
  },
  roleCaption: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.8,
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
  successCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xxl,
  },
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#34D39914',
    borderWidth: 1,
    borderColor: '#34D39940',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  successTitle: {
    ...TYPOGRAPHY.section,
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  successText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});
