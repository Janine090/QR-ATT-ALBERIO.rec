import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { SPACING } from '@/constants/theme';
import AppBackground from './AppBackground';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  edges?: Edge[];
}>;

export default function Screen({
  children,
  scroll = false,
  padded = true,
  contentContainerStyle,
  style,
  edges = ['top'],
}: ScreenProps) {
  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={edges}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              padded && styles.padded,
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[styles.flex, padded && styles.padded, style]}
          >
            {children}
          </View>
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: SPACING.xl,
  },
});
