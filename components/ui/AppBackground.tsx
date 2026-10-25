import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { COLORS } from '@/constants/colors';

export default function AppBackground({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <View style={[styles.root, style]}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="appBg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#05080F" />
            <Stop offset="0.55" stopColor="#070D18" />
            <Stop offset="1" stopColor="#0A1322" />
          </LinearGradient>
          <RadialGradient id="appGlowCyan" cx="12%" cy="4%" r="62%">
            <Stop offset="0" stopColor="#22D3EE" stopOpacity="0.18" />
            <Stop offset="0.55" stopColor="#22D3EE" stopOpacity="0.05" />
            <Stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="appGlowViolet" cx="92%" cy="92%" r="65%">
            <Stop offset="0" stopColor="#8B5CF6" stopOpacity="0.16" />
            <Stop offset="0.6" stopColor="#8B5CF6" stopOpacity="0.04" />
            <Stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#appBg)" />
        <Rect width="100%" height="100%" fill="url(#appGlowCyan)" />
        <Rect width="100%" height="100%" fill="url(#appGlowViolet)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
