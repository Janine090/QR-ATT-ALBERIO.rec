import { StyleSheet, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants/colors';
import { RADIUS, SHADOWS } from '@/constants/theme';
import { ProfileProvider, useProfile } from '@/components/ProfileProvider';

function TabIcon({
  name,
  focused,
  color,
  scan,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: ColorValue;
  scan?: boolean;
}) {
  if (scan) {
    return (
      <View style={[styles.scanIcon, focused && styles.scanIconActive]}>
        <Ionicons
          name={focused ? 'qr-code' : 'qr-code-outline'}
          size={21}
          color={focused ? COLORS.textOnPrimary : color}
        />
      </View>
    );
  }
  return <Ionicons name={name} size={21} color={color} />;
}

function TabNavigator() {
  const { role } = useProfile();
  const hideTeacher = role !== null && role !== 'teacher';
  const hideScan = role === 'teacher';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
        sceneStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'grid' : 'grid-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          href: hideScan ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="qr-code-outline"
              focused={focused}
              color={color}
              scan
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'time' : 'time-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="teacher"
        options={{
          title: 'Events',
          href: hideTeacher ? null : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'calendar' : 'calendar-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <ProfileProvider>
      <TabNavigator />
    </ProfileProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    height: 68,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    backgroundColor: '#0A1322F2',
    ...SHADOWS.raised,
  },
  tabItem: {
    borderRadius: RADIUS.lg,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  scanIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  scanIconActive: {
    backgroundColor: COLORS.primary,
    borderColor: '#67E8F9',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
});
