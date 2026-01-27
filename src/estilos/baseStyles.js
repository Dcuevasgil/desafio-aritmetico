import { StyleSheet, Platform } from 'react-native';

export const layout = StyleSheet.create({
    contenedor: {
        flex: 1,
        alignItems: 'center',
    },

    pantalla: {
        width: '100%',
        maxWidth: 390,
        paddingHorizontal: 16,
    },

    paddingWeb: {
        paddingTop: Platform.OS === 'web' ? 20 : 0,
    },
});