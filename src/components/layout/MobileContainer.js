import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

export function MobileContainer({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 80 : 0,
  },
});