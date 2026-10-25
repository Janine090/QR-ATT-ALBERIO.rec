import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import AppBackground from '@/components/ui/AppBackground';
import AppButton from '@/components/AppButton';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import LogoMark from '@/components/ui/LogoMark';
import ScanFrame from '@/components/ui/ScanFrame';
import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useProfile } from '@/components/ProfileProvider';
import { registerAttendance } from '@/lib/attendance';

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const { profile, role, loading: identityLoading } = useProfile();
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );

  const frameSize = Math.min(width - 76, 256, height * 0.32);
  const topSpace = Math.max(insets.top + 122, (height - frameSize) / 2 - 28);

  const resetScan = () => {
    setScanned(false);
    setMessage(null);
    setSuccess(false);
    setEventTitle(null);
  };

  if (!permission) {
    return <AppBackground />;
  }

  if (!permission.granted) {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.permission}>
            <LogoMark size={64} />
            <Text style={styles.permissionEyebrow}>Camera required</Text>
            <Text style={styles.permissionTitle}>Enable QR scanning</Text>
            <Text style={styles.permissionText}>
              QR-ATT uses your camera only to read event QR codes. Nothing is
              recorded or uploaded.
            </Text>
            <View style={styles.permissionPoints}>
              {[
                { icon: 'qr-code-outline' as const, text: 'Instant QR detection' },
                { icon: 'shield-checkmark-outline' as const, text: 'No photos stored' },
                { icon: 'flash-outline' as const, text: 'Works in low light' },
              ].map((point) => (
                <View key={point.text} style={styles.permissionPoint}>
                  <Ionicons
                    name={point.icon}
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.permissionPointText}>{point.text}</Text>
                </View>
              ))}
            </View>
            <AppButton
              variant="primary"
              title="Grant Camera Access"
              icon="camera-outline"
              onPress={requestPermission}
            />
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  if (role === 'teacher') {
    return (
      <AppBackground>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.permission}>
            <View style={styles.lockIcon}>
              <Ionicons
                name="person-circle-outline"
                size={34}
                color={COLORS.primary}
              />
            </View>
            <Text style={styles.permissionTitle}>Student check-in only</Text>
            <Text style={styles.permissionText}>
              You are signed in as a teacher. Teachers create events and monitor
              attendance instead of scanning.
            </Text>
            <View style={styles.permissionActions}>
              <AppButton
                variant="primary"
                title="Open Event Console"
                icon="calendar-outline"
                onPress={() => router.push('/teacher')}
              />
              <AppButton
                variant="ghost"
                title="Back to Home"
                icon="arrow-back-outline"
                onPress={() => router.push('/(tabs)')}
              />
            </View>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  const identityName =
    profile?.full_name ?? user?.email ?? 'Student account';

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setMessage(null);
    setEventTitle(null);

    if (!user) {
      setSuccess(false);
      setMessage('Please sign in before scanning.');
      return;
    }
    if (identityLoading) {
      setSuccess(false);
      setMessage('Preparing your account. Tap Scan Again in a moment.');
      return;
    }

    registerAttendance(data, user.id)
      .then((result) => {
        setMessage(result.message);
        setSuccess(result.success);
        setEventTitle(result.eventTitle ?? null);
      })
      .catch(() => {
        setSuccess(false);
        setMessage('Network error. Check your connection and try again.');
      });
  };

  return (
    <View style={styles.container}>
      {focused ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
      ) : (
        <View style={styles.cameraPlaceholder} />
      )}

      <View style={[styles.shadeTop, { height: topSpace }]} />
      <View
        style={[
          styles.shadeSide,
          { top: topSpace, left: 0, width: (width - frameSize) / 2, height: frameSize },
        ]}
      />
      <View
        style={[
          styles.shadeSide,
          {
            top: topSpace,
            right: 0,
            width: (width - frameSize) / 2,
            height: frameSize,
          },
        ]}
      />
      <View style={[styles.shadeBottom, { top: topSpace + frameSize }]} />

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.headerPill}>
            <View style={styles.headerDot} />
            <View>
              <Text style={styles.headerEyebrow}>Scan mode</Text>
              <Text style={styles.headerTitle}>Attendance check-in</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setTorch((value) => !value)}
            style={[styles.iconButton, torch && styles.iconButtonActive]}
            accessibilityLabel={torch ? 'Turn flashlight off' : 'Turn flashlight on'}
          >
            <Ionicons
              name={torch ? 'flash' : 'flash-outline'}
              size={20}
              color={torch ? COLORS.textOnPrimary : COLORS.textPrimary}
            />
          </Pressable>
        </View>

        <View style={styles.identityPill}>
          <Avatar
            name={profile?.full_name}
            email={user?.email}
            size={30}
          />
          <View style={styles.identityText}>
            <Text style={styles.identityLabel}>Scanning as</Text>
            <Text style={styles.identityName} numberOfLines={1}>
              {identityName}
            </Text>
          </View>
          <Badge label="Student" tone="info" />
        </View>
      </SafeAreaView>

      <View
        style={[
          styles.scanFrame,
          {
            top: topSpace,
            left: (width - frameSize) / 2,
            width: frameSize,
            height: frameSize,
          },
        ]}
        pointerEvents="none"
      >
        <ScanFrame size={frameSize} />
      </View>

      {!message ? (
        <View
          style={[styles.hintWrap, { top: topSpace + frameSize + 14 }]}
          pointerEvents="none"
        >
          <Ionicons name="scan-outline" size={14} color={COLORS.primary} />
          <Text style={styles.hintText}>
            Align the event QR inside the frame
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.sheetWrap,
          { bottom: 92 + Math.max(insets.bottom, 8) },
        ]}
        pointerEvents="box-none"
      >
        <Card style={styles.sheet} glow={message ? (success ? COLORS.success : COLORS.danger) : COLORS.primary}>
          {message ? (
            <>
              <View style={styles.resultHeader}>
                <View
                  style={[
                    styles.resultIcon,
                    {
                      backgroundColor: success
                        ? '#34D39914'
                        : '#FB718514',
                      borderColor: success ? '#34D39940' : '#FB718540',
                    },
                  ]}
                >
                  <Ionicons
                    name={success ? 'checkmark-circle' : 'alert-circle'}
                    size={26}
                    color={success ? COLORS.success : COLORS.danger}
                  />
                </View>
                <View style={styles.resultText}>
                  <Text
                    style={[
                      styles.resultTitle,
                      { color: success ? COLORS.success : COLORS.danger },
                    ]}
                  >
                    {success ? 'Attendance recorded' : 'Scan failed'}
                  </Text>
                  {eventTitle ? (
                    <Text style={styles.resultEvent} numberOfLines={1}>
                      {eventTitle}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Text style={styles.resultMessage}>{message}</Text>
              <AppButton
                variant="primary"
                title="Scan Again"
                icon="refresh-outline"
                onPress={resetScan}
              />
            </>
          ) : (
            <View style={styles.readyRow}>
              <View style={styles.readyPulse}>
                <View style={styles.readyDot} />
              </View>
              <View style={styles.readyText}>
                <Text style={styles.readyTitle}>Camera ready</Text>
                <Text style={styles.readyMessage}>
                  {identityLoading
                    ? 'Preparing your account...'
                    : 'Hold steady and fill the frame with the QR code.'}
                </Text>
              </View>
              <Ionicons
                name="expand-outline"
                size={18}
                color={COLORS.muted}
              />
            </View>
          )}
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  permissionEyebrow: {
    ...TYPOGRAPHY.eyebrow,
    color: COLORS.primary,
    marginTop: SPACING.lg,
  },
  permissionTitle: {
    ...TYPOGRAPHY.title,
    fontSize: 26,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  permissionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  permissionPoints: {
    alignSelf: 'stretch',
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  permissionPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  permissionPointText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  permissionActions: {
    alignSelf: 'stretch',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  lockIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  shadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(3,6,12,0.48)',
  },
  shadeSide: {
    position: 'absolute',
    backgroundColor: 'rgba(3,6,12,0.62)',
  },
  shadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3,6,12,0.74)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: SPACING.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#0A1322E6',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  headerEyebrow: {
    ...TYPOGRAPHY.label,
    fontSize: 8,
    color: COLORS.muted,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1322E6',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: '#67E8F9',
  },
  identityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'center',
    backgroundColor: '#0A1322E6',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    marginTop: SPACING.md,
    maxWidth: '92%',
  },
  identityText: {
    maxWidth: 170,
  },
  identityLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },
  identityName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scanFrame: {
    position: 'absolute',
  },
  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sheetWrap: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
  },
  sheet: {
    gap: SPACING.md,
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  readyPulse: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22D3EE14',
    borderWidth: 1,
    borderColor: '#22D3EE44',
  },
  readyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  readyText: {
    flex: 1,
  },
  readyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  readyMessage: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  resultEvent: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  resultMessage: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
