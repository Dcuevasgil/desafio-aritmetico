import React, { createContext, useContext, useMemo, useState } from 'react';
import { Appearance } from 'react-native';

const ContextoTematica = createContext(null);

const light = {
  mode: 'light',
  text: '#111',
  bg: '#FFF',
  card: '#F5F5F5',
  primary: '#2563eb',
};

const dark = {
  mode: 'dark',
  text: '#EEE',
  bg: '#111',
  card: '#1A1A1A',
  primary: '#60a5fa',
};

export function ContextoTematicaProvider({ children }) {
  const system = Appearance.getColorScheme();
  const [mode, setMode] = useState(system || 'light');

  const theme = useMemo(
    () => (mode === 'dark' ? dark : light),
    [mode]
  );

  const toggle = () => {
    setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ContextoTematica.Provider value={{ theme, mode, toggle }}>
      {children}
    </ContextoTematica.Provider>
  );
}

export function useTheme() {
  return useContext(ContextoTematica);
}
