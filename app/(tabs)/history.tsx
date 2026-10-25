import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/ui/AppBackground';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import FadeIn from '@/components/ui/FadeIn';
import ScreenHeader from '@/components/ui/ScreenHeader';
import StatCard from '@/components/ui/StatCard';
import { COLORS } from '@/constants/colors';
import { FONT_MONO, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/components/ProfileProvider';
import {
  getAttendanceHistory,
  getTeacherEventAttendance,
  type AttendanceRecord,
  type TeacherEventAttendance,
} from '@/lib/attendance';

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shortId(id: string) {
  return id ? `…${id.slice(-6)}` : 'unknown';
}

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, refresh } = useProfile();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [events, setEvents] = useState<TeacherEventAttendance[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
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

  useFocusEffect(
    useCallback(() => {
      refresh();
      load();
    }, [refresh, load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    await load();
    setRefreshing(false);
  };

  const toggleExpanded = (eventId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthCount = records.filter(
    (item) => new Date(item.scannedAt) >= monthStart
  ).length;
  const totalScans = events.reduce((sum, event) => sum + event.attendeeCount, 0);
  const isTeacher = role === 'teacher';

  const header = (
    <>
      <FadeIn>
        <ScreenHeader
          eyebrow="History"
          title={isTeacher ? 'Attendance log' : 'Your check-ins'}
          subtitle={
            isTeacher
              ? 'Every session you created and who checked in.'
              : 'A verified timeline of every event you attended.'
          }
          right={
            <Badge
              label={isTeacher ? 'Teacher' : 'Student'}
              tone={isTeacher ? 'violet' : 'info'}
            />
          }
        />
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.statsRow}>
          {isTeacher ? (
            <>
              <StatCard
                icon="calendar-outline"
                value={loading ? '—' : events.length}
                label="Sessions"
                accent={COLORS.violet}
              />
              <StatCard
                icon="people-outline"
                value={loading ? '—' : totalScans}
                label="Total scans"
                accent={COLORS.success}
              />
            </>
          ) : (
            <>
              <StatCard
                icon="checkmark-done-outline"
                value={loading ? '—' : records.length}
                label="Total check-ins"
                accent={COLORS.primary}
              />
              <StatCard
                icon="calendar-outline"
                value={loading ? '—' : monthCount}
                label="This month"
                accent={COLORS.success}
              />
            </>
          )}
        </View>
      </FadeIn>
    </>
  );

  if (loading) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Syncing attendance records...</Text>
        </SafeAreaView>
      </AppBackground>
    );
  }

  if (isTeacher) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <FlatList
            data={events}
            keyExtractor={(item) => item.eventId}
            contentContainerStyle={styles.listContent}
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
            ListHeaderComponent={header}
            ListEmptyComponent={
              <EmptyState
                icon="calendar-outline"
                title="No sessions yet"
                message="Create an event in the Events tab and student check-ins will show up here."
                actionLabel="Create Event"
                onAction={() => router.push('/teacher')}
              />
            }
            renderItem={({ item }) => {
              const open = expanded.has(item.eventId);
              return (
                <FadeIn>
                  <Card style={styles.eventCard}>
                    <Pressable
                      onPress={() => toggleExpanded(item.eventId)}
                      style={styles.eventHeader}
                    >
                      <View style={styles.eventIcon}>
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={COLORS.violet}
                        />
                      </View>
                      <View style={styles.eventBody}>
                        <Text style={styles.eventTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.mono} numberOfLines={1}>
                          {item.eventCode}
                          {item.startTime
                            ? ` · ${formatWhen(item.startTime)}`
                            : ''}
                        </Text>
                      </View>
                      <Badge
                        label={`${item.attendeeCount}`}
                        tone={item.attendeeCount > 0 ? 'success' : 'neutral'}
                        icon="people-outline"
                      />
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.muted}
                      />
                    </Pressable>

                    {open ? (
                      <View style={styles.attendees}>
                        {item.attendees.length === 0 ? (
                          <Text style={styles.emptyAttendees}>
                            No student scans yet.
                          </Text>
                        ) : (
                          item.attendees.map((attendee) => (
                            <View
                              key={`${attendee.studentId}-${attendee.scannedAt}`}
                              style={styles.attendeeRow}
                            >
                              <Avatar
                                name={
                                  attendee.studentName ??
                                  shortId(attendee.studentId)
                                }
                                size={32}
                                color={COLORS.success}
                              />
                              <View style={styles.attendeeBody}>
                                <Text
                                  style={styles.attendeeName}
                                  numberOfLines={1}
                                >
                                  {attendee.studentName ??
                                    shortId(attendee.studentId)}
                                </Text>
                                <Text style={styles.monoSmall}>
                                  {formatWhen(attendee.scannedAt)}
                                </Text>
                              </View>
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color={COLORS.success}
                              />
                            </View>
                          ))
                        )}
                      </View>
                    ) : null}
                  </Card>
                </FadeIn>
              );
            }}
            ListFooterComponent={<View style={styles.bottomSpace} />}
          />
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              icon="qr-code-outline"
              title="No check-ins yet"
              message="Scan an event QR code and your attendance will appear here instantly."
              actionLabel="Scan QR Code"
              onAction={() => router.push('/scan')}
            />
          }
          renderItem={({ item, index }) => (
            <FadeIn delay={Math.min(index * 40, 240)}>
              <Card style={styles.recordCard}>
                <View style={styles.recordTop}>
                  <View style={styles.recordIcon}>
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={COLORS.success}
                    />
                  </View>
                  <View style={styles.recordBody}>
                    <Text style={styles.recordTitle} numberOfLines={1}>
                      {item.eventTitle}
                    </Text>
                    <Text style={styles.mono} numberOfLines={1}>
                      {item.eventId}
                    </Text>
                  </View>
                  <Badge label="Present" tone="success" />
                </View>
                <View style={styles.recordFooter}>
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={COLORS.muted}
                  />
                  <Text style={styles.recordTime}>
                    {formatWhen(item.scannedAt)}
                  </Text>
                </View>
              </Card>
            </FadeIn>
          )}
          ListFooterComponent={<View style={styles.bottomSpace} />}
        />
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  recordCard: {
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  recordTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  recordIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34D39914',
    borderWidth: 1,
    borderColor: '#34D39940',
  },
  recordBody: {
    flex: 1,
    minWidth: 0,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mono: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
    marginTop: 2,
  },
  recordFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    paddingTop: SPACING.sm,
  },
  recordTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  eventCard: {
    marginBottom: SPACING.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  eventIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF614',
    borderWidth: 1,
    borderColor: '#8B5CF640',
  },
  eventBody: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  attendees: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  emptyAttendees: {
    ...TYPOGRAPHY.body,
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingVertical: SPACING.sm,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  attendeeBody: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  monoSmall: {
    fontSize: 10,
    color: COLORS.muted,
    fontFamily: FONT_MONO,
  },
  bottomSpace: {
    height: 120,
  },
});
