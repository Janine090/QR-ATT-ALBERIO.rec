import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS, SPACING } from '@/constants/theme';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  glow?: string;
}>;

export default function Card({
  children,
  style,
  padded = true,
  glow,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        glow
          ? {
              shadowColor: glow,
              shadowOpacity: 0.22,
              shadowRadius: 18,
              elevation: 6,
            }
          : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  padded: {
    padding: SPACING.lg,
  },
});
