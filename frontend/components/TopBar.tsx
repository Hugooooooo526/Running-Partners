import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme';

interface TopBarProps {
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
  hasNotifications?: boolean;
  notificationCount?: number;
}

const TopBar: React.FC<TopBarProps> = ({
  onMenuPress,
  onNotificationsPress,
  hasNotifications,
  notificationCount,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RUNNING PARTNERS</Text>

      <View style={styles.notificationWrap}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onNotificationsPress}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>🔔</Text>
        </TouchableOpacity>
        {(hasNotifications || (notificationCount ?? 0) > 0) && (
          <View style={styles.badge}>
            {notificationCount != null && notificationCount > 1 && (
              <Text style={styles.badgeText}>{notificationCount}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: 64,
    backgroundColor: 'rgba(18, 19, 23, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 40,
  },
  notificationWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#ff4d4d',
    borderWidth: 1.5,
    borderColor: '#121317',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
    color: Colors.onSurfaceVariant,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.primaryContainer,
  },
});

export default TopBar;
