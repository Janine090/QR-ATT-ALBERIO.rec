import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/ui/AppBackground';
import AppButton from '@/components/AppButton';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import FadeIn from '@/components/ui/FadeIn';
import LogoMark from '@/components/ui/LogoMark';
import ActionTile from '@/components/ui/ActionTile';
import SectionHeader from '@/components/ui/SectionHeader';
import StatCard from '@/components/ui/StatCard';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/components/ProfileProvider';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';

function formatShort(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, role, refresh } = useProfile();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<TeacherEventAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    if (role === 'teacher') {
      const next = await getTeacherEventAttendance(user.id);
      setEvents(next);
      setRecords([]);
    } else {
      const next = await getAttendanceHistory(user.id);
      setRecords(next);
      setEvents([]);
    }
    setLoading(false);
  }, [user, role]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    await loadData();
    setRefreshing(false);
  }, [refresh, loadData]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadData();
    }, [refresh, loadData])
  );

  const displayName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 18
        ? 'Good afternoon'
        : 'Good evening';

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthCount = records.filter(
    (item) => new Date(item.scannedAt) >= monthStart
  ).length;
  const totalScans = events.reduce((sum, event) => sum + event.attendeeCount, 0);
  const now = Date.now();
  const liveCount = events.filter(
    (event) =>
      event.startTime &&
      event.endTime &&
      new Date(event.startTime).getTime() <= now &&
      new Date(event.endTime).getTime() >= now
  ).length;

  const isTeacher = role === 'teacher';
  const accent = isTeacher ? COLORS.violet : COLORS.primary;
  const recentEvents = events.slice(0, 3);
  const recentRecords = records.slice(0, 3);

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
              progressBackgroundColor={COLORS.card}
            />
          }
        >
          <FadeIn>
            <View style={styles.topBar}>
              <View style={styles.brand}>
                <LogoMark size={38} />
                <View>
                  <Text style={styles.brandName}>QR-ATT</Text>
                  <Text style={styles.brandTag}>Campus attendance</Text>
                </View>
              </View>
              <Pressable
                onPress={() => router.push('/profile')}
                hitSlop={8}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Avatar
                  name={profile?.full_name}
                  email={user?.email}
                  color={accent}
                />
              </Pressable>
            </View>
          </FadeIn>

          <FadeIn delay={60}>
            <Text style={styles.greeting}>
              {greeting}, {displayName}
            </Text>
            <Text style={styles.greetingSub}>
              {isTeacher
                ? 'Your attendance control room is ready.'
                : 'Your check-in dashboard is up to date.'}
            </Text>
          </FadeIn>

          <FadeIn delay={120}>
            <Card style={styles.hero} glow={accent}>
              <Ionicons
                name="qr-code"
                size={170}
                color={accent}
                style={styles.heroWatermark}
              />
              <Badge
                label={isTeacher ? 'Teacher mode' : 'Student mode'}
                tone={isTeacher ? 'violet' : 'info'}
                icon={isTeacher ? 'easel-outline' : 'school-outline'}
              />
              <Text style={styles.heroTitle}>
                {isTeacher ? 'Run your next session.' : 'Ready to check in?'}
              </Text>
              <Text style={styles.heroText}>
                {isTeacher
                  ? 'Create an event, generate a QR, and monitor check-ins from one console.'
                  : 'Point your camera at an event QR code and your attendance is recorded instantly.'}
              </Text>
              <View style={styles.heroAction}>
                <AppButton
                  variant="primary"
                  title={isTeacher ? 'Create Event' : 'Scan QR Code'}
                  icon={isTeacher ? 'add-circle-outline' : 'scan-outline'}
                  onPress={() =>
                    router.push(isTeacher ? '/teacher' : '/scan')
                  }
                />
              </View>
            </Card>
          </FadeIn>

          <FadeIn delay={180}>
            <View style={styles.statsRow}>
              {isTeacher ? (
                <>
                  <StatCard
                    icon="calendar-outline"
                    value={loading ? '—' : events.length}
                    label="Events"
                    accent={COLORS.primary}
                  />
                  <StatCard
                    icon="people-outline"
                    value={loading ? '—' : totalScans}
                    label="Total scans"
                    accent={COLORS.success}
                  />
                  <StatCard
                    icon="radio-outline"
                    value={loading ? '—' : liveCount}
                    label="Live now"
                    accent={COLORS.violet}
                  />
                </>
              ) : (
                <>
                  <StatCard
                    icon="checkmark-done-outline"
                    value={loading ? '—' : records.length}
                    label="Check-ins"
                    accent={COLORS.primary}
                  />
                  <StatCard
                    icon="calendar-outline"
                    value={loading ? '—' : monthCount}
                    label="This month"
                    accent={COLORS.success}
                  />
                  <StatCard
                    icon="time-outline"
                    value={
                      loading
                        ? '—'
                        : recentRecords[0]
                          ? formatShort(recentRecords[0].scannedAt)
                          : 'None'
                    }
                    label="Last scan"
                    accent={COLORS.violet}
                  />
                </>
              )}
            </View>
          </FadeIn>

          <FadeIn delay={240}>
            <SectionHeader title="Quick actions" caption="One tap to go" />
            <View style={styles.actionsRow}>
              {isTeacher ? (
                <>
                  <ActionTile
                    icon="add-circle-outline"
                    label="New event"
                    caption="Generate QR"
                    accent={COLORS.primary}
                    onPress={() => router.push('/teacher')}
                  />
                  <ActionTile
                    icon="analytics-outline"
                    label="Attendance"
                    caption="View logs"
                    accent={COLORS.success}
                    onPress={() => router.push('/history')}
                  />
                  <ActionTile
                    icon="person-outline"
                    label="Profile"
                    caption="Account"
                    accent={COLORS.violet}
                    onPress={() => router.push('/profile')}
                  />
                </>
              ) : (
                <>
                  <ActionTile
                    icon="scan-outline"
                    label="Scan QR"
                    caption="Check in"
                    accent={COLORS.primary}
                    onPress={() => router.push('/scan')}
                  />
                  <ActionTile
                    icon="time-outline"
                    label="History"
                    caption="View logs"
                    accent={COLORS.success}
                    onPress={() => router.push('/history')}
                  />
                  <ActionTile
                    icon="person-outline"
                    label="Profile"
                    caption="Account"
                    accent={COLORS.violet}
                    onPress={() => router.push('/profile')}
                  />
                </>
              )}
            </View>
          </FadeIn>

          <FadeIn delay={300}>
            <SectionHeader
              title={isTeacher ? 'Recent sessions' : 'Recent activity'}
              caption={
                isTeacher
                  ? 'Latest events you created'
                  : 'Your latest check-ins'
              }
              actionLabel="View all"
              onAction={() => router.push('/history')}
            />

            {isTeacher ? (
              recentEvents.length === 0 ? (
                <Card style={styles.emptyCard}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={22}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.emptyText}>
                    <Text style={styles.emptyTitle}>No sessions yet</Text>
                    <Text style={styles.emptyMessage}>
                      Create your first event to generate a scannable QR.
                    </Text>
                  </View>
                </Card>
              ) : (
                <View style={styles.activityList}>
                  {recentEvents.map((event) => (
                    <Card key={event.eventId} style={styles.activityCard}>
                      <View style={styles.activityIcon}>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={COLORS.violet}
                        />
                      </View>
                      <View style={styles.activityBody}>
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text style={styles.activityMeta} numberOfLines={1}>
                          {event.eventCode}
                          {event.startTime
                            ? ` · ${formatWhen(event.startTime)}`
                            : ''}
                        </Text>
                      </View>
                      <Badge
                        label={`${event.attendeeCount}`}
                        tone={event.attendeeCount > 0 ? 'success' : 'neutral'}
                        icon="people-outline"
                      />
                    </Card>
                  ))}
                </View>
              )
            ) : recentRecords.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="qr-code-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.emptyText}>
                  <Text style={styles.emptyTitle}>No check-ins yet</Text>
                  <Text style={styles.emptyMessage}>
                    Scan an event QR to start building your attendance log.
                  </Text>
                </View>
              </Card>
            ) : (
              <View style={styles.activityList}>
                {recentRecords.map((record) => (
                  <Card key={record.id} style={styles.activityCard}>
                    <View style={styles.activityIcon}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={COLORS.success}
                      />
                    </View>
                    <View style={styles.activityBody}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {record.eventTitle}
                      </Text>
                      <Text style={styles.activityMeta} numberOfLines={1}>
                        {record.eventId} · {formatWhen(record.scannedAt)}
                      </Text>
                    </View>
                    <Badge label="Present" tone="success" />
                  </Card>
                ))}
              </View>
            )}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  brandTag: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: COLORS.textPrimary,
  },
  greetingSub: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  hero: {
    overflow: 'hidden',
    gap: SPACING.sm,
    paddingVertical: SPACING.xl,
    marginTop: SPACING.xs,
  },
  heroWatermark: {
    position: 'absolute',
    right: -34,
    bottom: -40,
    opacity: 0.06,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
  },
  heroText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    maxWidth: 290,
  },
  heroAction: {
    marginTop: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  activityList: {
    gap: SPACING.sm,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  activityBody: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  activityMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptyMessage: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bottomSpace: {
    height: 120,
  },
});
