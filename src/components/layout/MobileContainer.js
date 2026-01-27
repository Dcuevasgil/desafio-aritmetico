// MobileContainer.js
import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export function MobileContainer({ children }) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.webWrapper}>
      <View style={styles.mobileFrame}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B66E8',
  },

  mobileFrame: {
    width: 390,
    height: Math.min(height, 780),
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0B66E8',
  },
});
