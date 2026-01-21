import { Platform } from 'react-native';

export const IS_DEV = __DEV__;
export const USE_EMULATORS = __DEV__;

export const EMULATOR_HOST = Platform.select({
  ios: 'localhost',
  android: '10.0.2.2',
  default: 'localhost',
});
