import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { RADIUS, SPACING } from '@/constants/theme';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';

const TONES: Record<Tone, { color: string; background: string }> = {
  success: { color: COLORS.success, background: '#34D3991F' },
  warning: { color: COLORS.warning, background: '#FBBF241F' },
  danger: { color: COLORS.danger, background: '#FB71851F' },
  info: { color: COLORS.primary, background: '#22D3EE1F' },
  violet: { color: COLORS.violet, background: '#8B5CF61F' },
  neutral: { color: COLORS.textSecondary, background: '#9AB0CC14' },
};

export default function Badge({
  label,
  tone = 'info',
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: theme.background }]}>
      {icon ? <Ionicons name={icon} size={12} color={theme.color} /> : null}
      <Text style={[styles.label, { color: theme.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
