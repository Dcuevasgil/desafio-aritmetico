const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Agregar soporte para archivos .cjs usados internamente por Firebase
config.resolver.sourceExts.push('cjs');

// Desactivar package exports para compatibilidad
config.resolver.unstable_enablePackageExports = false;

module.exports = config;