import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/tabs/HomeScreen';
import { RankingScreen } from '../screens/tabs/RankingScreen';
import { Ajustes } from '../screens/tabs/Ajustes';
import { PerfilScreen } from '../screens/tabs/PerfilScreen';

import { useTheme } from '../context/ContextoTematica';

const Tab = createBottomTabNavigator();

export default function NavegacionTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A3D91',
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: '#FF8C42',
        tabBarInactiveTintColor: '#8FAADC',
        tabBarIcon: ({ focused, size, color }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Perfil':
              iconName = focused
                ? 'stats-chart'
                : 'stats-chart-outline';
              break;
            case 'Ranking':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Ajustes':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen name="Ajustes" component={Ajustes} />
    </Tab.Navigator>
  );
}
