module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...config.plugins,
    ['expo-build-properties', {
      android: {
        usesCleartextTraffic: (process.env.EXPO_PUBLIC_API_URL || '').startsWith('http://'),
      },
    }],
  ],
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID
        ? { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID }
        : {}),
    },
  },
});
