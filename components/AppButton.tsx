import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type AppButtonProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  theme?: 'primary';
  variant?: Variant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
};

export default function AppButton({
  title,
  icon,
  theme,
  variant,
  onPress,
  disabled,
  loading,
  compact,
}: AppButtonProps) {
  const resolved: Variant = variant ?? (theme === 'primary' ? 'primary' : 'secondary');
  const isPrimary = resolved === 'primary';
  const isDanger = resolved === 'danger';
  const fg = isPrimary
    ? COLORS.textOnPrimary
    : isDanger
      ? COLORS.danger
      : COLORS.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        resolved === 'primary' && styles.primary,
        resolved === 'secondary' && styles.secondary,
        resolved === 'ghost' && styles.ghost,
        resolved === 'danger' && styles.danger,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={19} color={fg} /> : null}
          <Text style={[styles.label, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1,
  },
  compact: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: '#67E8F9',
    ...SHADOWS.cyan,
  },
  secondary: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: COLORS.borderSoft,
  },
  danger: {
    backgroundColor: '#FB718514',
    borderColor: '#FB718544',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
