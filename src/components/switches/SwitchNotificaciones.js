import React, { useState, useEffect, useRef } from 'react';
import { Animated, View, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ContextoTematica';

import {
  programarNotificacion,
  cancelarNotificaciones
} from '../../services/notificationService';

export function SwitchNotificaciones({
  label = 'Notificaciones',
  value,
  onToggle
}) {
  const { theme } = useTheme();

  const [activo, setActivo] = useState(value);
  const width = 50;
  const height = 30;
  const borderWidth = 2;
  const thumbSize = 26;

  const offset = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    setActivo(value);
    Animated.timing(offset, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const thumbTranslateX = offset.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - thumbSize],
  });

  const trackColor = activo ? '#FFA500' : '#6B7280';

  const manejarToggle = async () => {
    const nuevoValor = !activo;

    setActivo(nuevoValor);
    onToggle?.(nuevoValor);

    if (nuevoValor) {
      await programarNotificacion();
    } else {
      await cancelarNotificaciones();
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>
          {label}
        </Text>
      )}

      <Pressable onPress={manejarToggle}>
        <View
          style={[
            styles.track,
            {
              width,
              height,
              borderRadius: height / 2,
              borderWidth,
              borderColor: trackColor,
              overflow: 'hidden',
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
  },
});
