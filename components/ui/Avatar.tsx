import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/colors';

export function initialsFrom(name?: string | null, email?: string | null) {
  const source = (name ?? '').trim();
  if (source) {
    const parts = source.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return `${first}${last}`.toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export default function Avatar({
  name,
  email,
  size = 44,
  color = COLORS.primary,
}: {
  name?: string | null;
  email?: string | null;
  size?: number;
  color?: string;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: `${color}66`,
          backgroundColor: `${color}14`,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color, fontSize: size * 0.34 },
        ]}
      >
        {initialsFrom(name, email)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
