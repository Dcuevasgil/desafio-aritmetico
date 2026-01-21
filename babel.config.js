// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        // opcionalmente puedes usar 'safe': true con .env.example
        allowlist: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_UPLOAD_PRESET']
      }],
      'react-native-worklets/plugin',
    ],
  };
};
