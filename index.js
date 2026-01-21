import 'react-native-reanimated';
import { registerRootComponent } from 'expo';

import App from './App';

if (typeof document !== 'undefined') {
  import('./src/index.css');
}

registerRootComponent(App);
