// MobileContainer.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

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
    backgroundColor: '#0B66E8', // fondo web
  },

  mobileFrame: {
    width: '100%',
    maxWidth: 420,              // 🔴 CLAVE
    minHeight: '100%',
    alignSelf: 'center',
  },
});
