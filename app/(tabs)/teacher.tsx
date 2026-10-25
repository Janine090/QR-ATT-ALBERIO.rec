import { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';

import AppBackground from '@/components/ui/AppBackground';
import AppButton from '@/components/AppButton';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import FadeIn from '@/components/ui/FadeIn';
import FormField from '@/components/ui/FormField';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import { COLORS } from '@/constants/colors';
import {
  FONT_MONO,
  RADIUS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/components/ProfileProvider';
import { createEvent } from '@/lib/events';
import { buildQRPayload } from '@/lib/qr';
import {
  getTeacherEventAttendance,
  type TeacherEventAttendance,
} from '@/lib/attendance';

type Message = { tone: 'success' | 'danger'; text: string } | null;

function makeEventCode() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EVT-${year}-${random}`;
}

function formatDate(value: Date) {
  return value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value: Date) {
  return value.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function TeacherScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, loading: profileLoading } = useProfile();

  const [title, setTitle] = useState('');
  const [eventCode, setEventCode] = useState(makeEventCode);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 60 * 1000)
  );
  const [editTarget, setEditTarget] = useState<'start' | 'end' | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [creating, setCreating] = useState(false);
  const [events, setEvents] = useState<TeacherEventAttendance[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    const next = await getTeacherEventAttendance(user.id);
    setEvents(next);
    setEventsLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (role !== 'teacher') {
        setEventsLoading(false);
        return;
      }
      setEventsLoading(true);
      loadEvents();
    }, [role, loadEvents])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (event.type === 'dismissed') {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }
    if (selected) {
      if (editTarget === 'start') {
        setStartDate(selected);
        if (selected.getTime() >= endDate.getTime()) {
          setEndDate(new Date(selected.getTime() + 60 * 60 * 1000));
        }
      }
      if (editTarget === 'end') setEndDate(selected);
    }
    if (Platform.OS === 'android' && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const applyQuickDuration = (minutes: number) => {
    setEndDate(new Date(startDate.getTime() + minutes * 60 * 1000));
  };

  const handleCreateEvent = async () => {
    setMessage(null);
    if (!title.trim() || !eventCode.trim()) {
      setMessage({
        tone: 'danger',
        text: 'Event title and code are required.',
      });
      return;
    }
    if (startDate >= endDate) {
      setMessage({
        tone: 'danger',
        text: 'Start time must be before end time.',
      });
      return;
    }
    setCreating(true);
    const code = eventCode.trim().toUpperCase();
    const eventData = {
      eventId: code,
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
    const { error } = await createEvent(eventData);
    setCreating(false);
    if (error) {
      setMessage({
        tone: 'danger',
        text: 'Could not save the event. Check your connection and try again.',
      });
      return;
    }
    setEventCode(code);
    setPayload(buildQRPayload(eventData));
    setMessage({
      tone: 'success',
      text: 'Session created. Show this QR to your students.',
    });
    await loadEvents();
  };

  const shareEvent = async () => {
    if (!payload) return;
    await Share.share({
      message: `QR-ATT session\n${title.trim()}\nEvent code: ${eventCode.trim().toUpperCase()}\n\nOpen QR-ATT and scan the QR code shown by your teacher.`,
    });
  };

  const resetForm = () => {
    setPayload(null);
    setMessage(null);
    setTitle('');
    setEventCode(makeEventCode());
    const start = new Date();
    setStartDate(start);
    setEndDate(new Date(start.getTime() + 60 * 60 * 1000));
  };

  if (profileLoading) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          <Ionicons name="sync-outline" size={30} color={COLORS.primary} />
          <Text style={styles.muted}>Loading event console...</Text>
        </SafeAreaView>
      </AppBackground>
    );
  }

  if (role !== 'teacher') {
    return (
      <AppBackground>
        <SafeAreaView style={styles.centered} edges={['top', 'bottom']}>
          <View style={styles.lockIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.lockTitle}>Teacher access only</Text>
          <Text style={styles.muted}>
            This console is where teachers create events and generate QR codes.
          </Text>
          <View style={styles.lockAction}>
            <AppButton
              variant="secondary"
              title="Back to Home"
              icon="arrow-back-outline"
              onPress={() => router.replace('/(tabs)')}
            />
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            <ScreenHeader
              eyebrow="Teacher console"
              title="Event control"
              subtitle="Create a session, generate the QR, and monitor check-ins."
              right={
                <Badge label="Online" tone="success" icon="wifi-outline" />
              }
            />
          </FadeIn>

          {payload ? (
            <FadeIn delay={60}>
              <Card style={styles.qrCard} glow={COLORS.primary}>
                <View style={styles.qrHeader}>
                  <View style={styles.qrHeaderText}>
                    <Text style={styles.qrEyebrow}>Session ready</Text>
                    <Text style={styles.qrTitle} numberOfLines={2}>
                      {title.trim()}
                    </Text>
                  </View>
                  <Badge label="Ready" tone="success" icon="checkmark" />
                </View>
                <Text style={styles.qrCode}>{eventCode.toUpperCase()}</Text>

                <View style={styles.qrFrame}>
                  <View style={[styles.qrCorner, styles.qrTopLeft]} />
                  <View style={[styles.qrCorner, styles.qrTopRight]} />
                  <View style={[styles.qrCorner, styles.qrBottomLeft]} />
                  <View style={[styles.qrCorner, styles.qrBottomRight]} />
                  <View style={styles.qrWhite}>
                    <QRCode
                      value={payload}
                      size={214}
                      color={COLORS.qrDark}
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                </View>

                <View style={styles.qrMetaRow}>
                  <View style={styles.qrMetaItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={styles.qrMetaText}>
                      {formatDate(startDate)}
                    </Text>
                  </View>
                  <View style={styles.qrMetaItem}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={styles.qrMetaText}>
                      {formatTime(startDate)} – {formatTime(endDate)}
                    </Text>
                  </View>
                </View>

                <View style={styles.qrActions}>
                  <View style={styles.qrActionItem}>
                    <AppButton
                      variant="secondary"
                      title="Share"
                      icon="share-social-outline"
                      onPress={shareEvent}
                    />
                  </View>
                  <View style={styles.qrActionItem}>
                    <AppButton
                      variant="primary"
                      title="New Session"
                      icon="add-outline"
                      onPress={resetForm}
                    />
                  </View>
                </View>
              </Card>
            </FadeIn>
          ) : (
            <FadeIn delay={60}>
              <Card style={styles.formCard}>
                <Text style={styles.cardEyebrow}>New session</Text>
                <Text style={styles.cardTitle}>Event details</Text>

                <View style={styles.fields}>
                  <FormField
                    label="Event title"
                    icon="create-outline"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Founders Day Assembly"
                    editable={!creating}
                  />

                  <View>
                    <FormField
                      label="Event code"
                      icon="barcode-outline"
                      value={eventCode}
                      onChangeText={(value) =>
                        setEventCode(value.toUpperCase())
                      }
                      placeholder="EVT-2026-0001"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!creating}
                    />
                    <Pressable
                      onPress={() => setEventCode(makeEventCode())}
                      style={styles.autoCode}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="flash-outline"
                        size={13}
                        color={COLORS.primary}
                      />
                      <Text style={styles.autoCodeText}>Generate code</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Pressable
                    style={styles.dateCard}
                    onPress={() => {
                      setEditTarget('start');
                      setEditingPart('date');
                    }}
                  >
                    <View style={styles.dateIcon}>
                      <Ionicons
                        name="play-outline"
                        size={16}
                        color={COLORS.success}
                      />
                    </View>
                    <Text style={styles.dateLabel}>Starts</Text>
                    <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
                    <Text style={styles.dateTime}>{formatTime(startDate)}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.dateCard}
                    onPress={() => {
                      setEditTarget('end');
                      setEditingPart('date');
                    }}
                  >
                    <View style={styles.dateIcon}>
                      <Ionicons
                        name="stop-outline"
                        size={16}
                        color={COLORS.warning}
                      />
                    </View>
                    <Text style={styles.dateLabel}>Ends</Text>
                    <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
                    <Text style={styles.dateTime}>{formatTime(endDate)}</Text>
                  </Pressable>
                </View>

                {editTarget ? (
                  <DateTimePicker
                    value={editTarget === 'start' ? startDate : endDate}
                    mode={Platform.OS === 'android' ? editingPart : 'datetime'}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onPickerChange}
                    themeVariant="dark"
                  />
                ) : null}

                <View style={styles.chipRow}>
                  {[30, 60, 120].map((minutes) => (
                    <Pressable
                      key={minutes}
                      onPress={() => applyQuickDuration(minutes)}
                      style={({ pressed }) => [
                        styles.chip,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.chipText}>
                        +{minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {message ? (
                  <View
                    style={[
                      styles.message,
                      message.tone === 'success'
                        ? styles.messageSuccess
                        : styles.messageDanger,
                    ]}
                  >
                    <Ionicons
                      name={
                        message.tone === 'success'
                          ? 'checkmark-circle'
                          : 'alert-circle'
                      }
                      size={17}
                      color={
                        message.tone === 'success'
                          ? COLORS.success
                          : COLORS.danger
                      }
                    />
                    <Text
                      style={[
                        styles.messageText,
                        {
                          color:
                            message.tone === 'success'
                              ? COLORS.success
                              : COLORS.danger,
                        },
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.submit}>
                  <AppButton
                    variant="primary"
                    title="Create & Generate QR"
                    icon="qr-code-outline"
                    onPress={handleCreateEvent}
                    loading={creating}
                  />
                </View>
              </Card>
            </FadeIn>
          )}

          <FadeIn delay={130}>
            <SectionHeader
              title="Recent sessions"
              caption={`${events.length} total`}
              actionLabel="History"
              onAction={() => router.push('/history')}
            />

            {eventsLoading ? (
              <Card style={styles.emptyCard}>
                <Ionicons
                  name="sync-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.muted}>Loading sessions...</Text>
              </Card>
            ) : events.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.eventIcon}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={COLORS.violet}
                  />
                </View>
                <View style={styles.eventBody}>
                  <Text style={styles.eventTitle}>No sessions yet</Text>
                  <Text style={styles.eventMeta}>
                    Your created events will appear here.
                  </Text>
                </View>
              </Card>
            ) : (
              <View style={styles.eventList}>
                {events.slice(0, 5).map((event) => (
                  <Card key={event.eventId} style={styles.eventCard}>
                    <View style={styles.eventIcon}>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={COLORS.violet}
                      />
                    </View>
                    <View style={styles.eventBody}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventMeta} numberOfLines={1}>
                        {event.eventCode}
                        {event.startTime
                          ? ` · ${new Date(
                              event.startTime
                            ).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}`
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.sm,
  },
  lockIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  lockTitle: {
    ...TYPOGRAPHY.section,
    fontSize: 21,
    color: COLORS.textPrimary,
  },
  muted: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  lockAction: {
    alignSelf: 'stretch',
    marginTop: SPACING.lg,
  },
  formCard: {
    gap: SPACING.sm,
  },
  cardEyebrow: {
    ...TYPOGRAPHY.eyebrow,
    color: COLORS.primary,
  },
  cardTitle: {
    ...TYPOGRAPHY.section,
    fontSize: 21,
    color: COLORS.textPrimary,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  fields: {
    gap: SPACING.lg,
  },
  autoCode: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: SPACING.sm,
  },
  autoCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  dateCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 2,
  },
  dateIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    marginBottom: SPACING.xs,
  },
  dateLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    color: COLORS.muted,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  chip: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  pressed: {
    opacity: 0.75,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  messageSuccess: {
    backgroundColor: '#34D39914',
    borderColor: '#34D39940',
  },
  messageDanger: {
    backgroundColor: '#FB718514',
    borderColor: '#FB718540',
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  submit: {
    marginTop: SPACING.md,
  },
  qrCard: {
    gap: SPACING.md,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  qrHeaderText: {
    flex: 1,
  },
  qrEyebrow: {
    ...TYPOGRAPHY.eyebrow,
    color: COLORS.success,
  },
  qrTitle: {
    ...TYPOGRAPHY.section,
    fontSize: 20,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  qrCode: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: FONT_MONO,
    letterSpacing: 1,
    marginTop: -SPACING.sm,
  },
  qrFrame: {
    alignSelf: 'center',
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  qrWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  qrCorner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.primary,
  },
  qrTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  qrTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  qrBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  qrBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  qrMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    flexWrap: 'wrap',
  },
  qrMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  qrMetaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
  },
  qrActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  qrActionItem: {
    flex: 1,
  },
  eventList: {
    gap: SPACING.sm,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  eventBody: {
    flex: 1,
    minWidth: 0,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  eventMeta: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bottomSpace: {
    height: 120,
  },
});
