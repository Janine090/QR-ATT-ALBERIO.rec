import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import AppBackground from '@/components/ui/AppBackground';
import AppButton from '@/components/AppButton';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import FadeIn from '@/components/ui/FadeIn';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import StatCard from '@/components/ui/StatCard';
import { COLORS } from '@/constants/colors';
import { FONT_MONO, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuth, signOut } from '@/lib/auth';
import { useProfile } from '@/components/ProfileProvider';
import { updateProfile } from '@/lib/profiles';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
} from '@/lib/attendance';

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={COLORS.textSecondary} />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text
          style={[styles.infoValue, mono && styles.mono]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, role, refresh } = useProfile();
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [checkIns, setCheckIns] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [totalScans, setTotalScans] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    const next = await refresh();
    setDraftName(next?.full_name ?? '');
    if (role === 'teacher') {
      const events = await getTeacherEventAttendance(user.id);
      setSessions(events.length);
      setTotalScans(events.reduce((sum, event) => sum + event.attendeeCount, 0));
    } else {
      const records = await getAttendanceHistory(user.id);
      setCheckIns(records.length);
    }
  }, [user, role, refresh]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const { error } = await updateProfile(user.id, {
      full_name: draftName.trim(),
    });
    if (error) {
      setSaving(false);
      setMessage('Could not save your name. Please try again.');
      return;
    }
    await refresh();
    setDraftName(draftName.trim());
    setSaving(false);
    setEditing(false);
    setMessage('Profile updated.');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out',
      'You will need your email and password to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setSigningOut(true);
            try {
              await signOut();
              router.replace('/login');
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const isTeacher = role === 'teacher';
  const accent = isTeacher ? COLORS.violet : COLORS.primary;
  const displayName = profile?.full_name || 'Add your name';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently';
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FadeIn>
            <ScreenHeader
              eyebrow="Account"
              title="Profile"
              subtitle="Your identity, role, and secure session details."
              right={
                <Badge
                  label={isTeacher ? 'Teacher' : 'Student'}
                  tone={isTeacher ? 'violet' : 'info'}
                  icon={isTeacher ? 'easel-outline' : 'school-outline'}
                />
              }
            />
          </FadeIn>

          <FadeIn delay={60}>
            <Card style={styles.hero} glow={accent}>
              <Ionicons
                name="finger-print"
                size={150}
                color={accent}
                style={styles.heroWatermark}
              />
              <Avatar
                name={profile?.full_name}
                email={user?.email}
                size={72}
                color={accent}
              />
              <Text style={styles.name} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email ?? profile?.email}
              </Text>
              <View style={styles.heroMeta}>
                <Badge
                  label={`${isTeacher ? 'Teacher' : 'Student'} account`}
                  tone={isTeacher ? 'violet' : 'info'}
                />
                <Text style={styles.memberSince}>Since {memberSince}</Text>
              </View>
            </Card>
          </FadeIn>

          <FadeIn delay={110}>
            <View style={styles.statsRow}>
              {isTeacher ? (
                <>
                  <StatCard
                    icon="calendar-outline"
                    value={sessions}
                    label="Sessions"
                    accent={COLORS.violet}
                  />
                  <StatCard
                    icon="people-outline"
                    value={totalScans}
                    label="Total scans"
                    accent={COLORS.success}
                  />
                </>
              ) : (
                <>
                  <StatCard
                    icon="checkmark-done-outline"
                    value={checkIns}
                    label="Check-ins"
                    accent={COLORS.primary}
                  />
                  <StatCard
                    icon="shield-checkmark-outline"
                    value="Active"
                    label="Session"
                    accent={COLORS.success}
                  />
                </>
              )}
            </View>
          </FadeIn>

          <FadeIn delay={160}>
            <SectionHeader title="Display name" caption="Shown to teachers" />
            <Card style={styles.editCard}>
              <View style={styles.editRow}>
                <View style={styles.infoIcon}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </View>
                {editing ? (
                  <TextInput
                    style={styles.nameInput}
                    value={draftName}
                    onChangeText={setDraftName}
                    placeholder="Your full name"
                    placeholderTextColor={COLORS.muted}
                    selectionColor={COLORS.primary}
                    editable={!saving}
                    autoFocus
                  />
                ) : (
                  <Text style={styles.editValue} numberOfLines={1}>
                    {profile?.full_name || 'Tap edit to add your name'}
                  </Text>
                )}
                {editing ? (
                  <Pressable
                    onPress={handleSaveName}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.saveButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={saving ? 'sync-outline' : 'checkmark'}
                      size={18}
                      color={COLORS.textOnPrimary}
                    />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      setDraftName(profile?.full_name ?? '');
                      setEditing(true);
                      setMessage(null);
                    }}
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.editText}>Edit</Text>
                  </Pressable>
                )}
              </View>
              {message ? (
                <Text
                  style={[
                    styles.message,
                    message.startsWith('Could not') && styles.messageError,
                  ]}
                >
                  {message}
                </Text>
              ) : null}
            </Card>
          </FadeIn>

          <FadeIn delay={210}>
            <SectionHeader title="Account details" caption="Cloud profile" />
            <Card style={styles.infoCard}>
              <InfoRow
                icon="mail-outline"
                label="Email"
                value={user?.email ?? profile?.email ?? '—'}
              />
              <View style={styles.divider} />
              <InfoRow
                icon="shield-checkmark-outline"
                label="Role"
                value={isTeacher ? 'Teacher' : 'Student'}
              />
              <View style={styles.divider} />
              <InfoRow
                icon="finger-print-outline"
                label="User ID"
                value={user?.id ?? '—'}
                mono
              />
            </Card>
          </FadeIn>

          <FadeIn delay={260}>
            <SectionHeader title="System" caption="Under the hood" />
            <Card style={styles.infoCard}>
              <InfoRow
                icon="cloud-done-outline"
                label="Backend"
                value="Supabase · PostgreSQL"
              />
              <View style={styles.divider} />
              <InfoRow
                icon="lock-closed-outline"
                label="Session storage"
                value="Encrypted device keychain"
              />
              <View style={styles.divider} />
              <InfoRow
                icon="git-branch-outline"
                label="App version"
                value={`QR-ATT v${version}`}
                mono
              />
            </Card>
          </FadeIn>

          <FadeIn delay={310}>
            <View style={styles.signOut}>
              <AppButton
                variant="danger"
                title="Sign Out"
                icon="log-out-outline"
                onPress={handleSignOut}
                loading={signingOut}
              />
              <Text style={styles.signOutHint}>
                Session tokens are removed from this device.
              </Text>
            </View>
          </FadeIn>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.sm,
    overflow: 'hidden',
    paddingVertical: SPACING.xxl,
  },
  heroWatermark: {
    position: 'absolute',
    right: -30,
    bottom: -34,
    opacity: 0.05,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  email: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  memberSince: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  editCard: {
    gap: SPACING.sm,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  editValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  nameInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#22D3EE33',
    backgroundColor: '#22D3EE0F',
  },
  editText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  pressed: {
    opacity: 0.75,
  },
  message: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  messageError: {
    color: COLORS.danger,
  },
  infoCard: {
    paddingVertical: SPACING.sm,
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  infoBody: {
    flex: 1,
    minWidth: 0,
  },
  infoLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mono: {
    fontFamily: FONT_MONO,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderSoft,
    marginLeft: 46,
  },
  signOut: {
    marginTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  signOutHint: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
  },
  bottomSpace: {
    height: 120,
  },
});
