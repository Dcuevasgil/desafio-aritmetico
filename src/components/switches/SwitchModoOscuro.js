import React, { useEffect, useRef } from 'react';
import { Animated, View, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ContextoTematica';

export function SwitchModoOscuro({ label = 'Modo oscuro' }) {
  const { theme, mode, toggle } = useTheme();

  const width = 50;
  const height = 30;
  const thumbSize = 26;

  const offset = useRef(new Animated.Value(mode === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(offset, {
      toValue: mode === 'dark' ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [mode]);

  const thumbTranslateX = offset.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - thumbSize],
  });

  const trackColor = mode === 'dark' ? '#FFA500' : '#6B7280';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>

      <Pressable onPress={toggle}>
        <View
          style={[
            styles.track,
            {
              width,
              height,
              borderRadius: height / 2,
              borderColor: trackColor,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                backgroundColor: trackColor,
                transform: [{ translateX: thumbTranslateX }],
              },
            ]}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  track: {
    borderWidth: 2,
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
  },
});
