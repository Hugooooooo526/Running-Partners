import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme';

interface TopBarProps {
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
  hasNotifications?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  onMenuPress,
  onNotificationsPress,
  hasNotifications,
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
        {hasNotifications && <View style={styles.badge} />}
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
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4d4d',
    borderWidth: 1.5,
    borderColor: '#121317',
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
