# Desafío Aritmético

Aplicación multiplataforma desarrollada con **Expo + React Native**, enfocada a mejorar la agilidad mental mediante operaciones matemáticas, con sistema de ranking, perfiles y persistencia de datos en Firebase.

El proyecto cuenta con **versión web desplegada en Vercel**.

---

## Demo

**Aplicación en producción:**  
https://desafio-aritmetico-ja6n.vercel.app/

---

## Tecnologías utilizadas

### Frontend
- React Native
- Expo
- React Navigation
- React Native Web

### Backend / Servicios
- Firebase (Authentication + Firestore)
- Cloudinary (gestión de imágenes)

### Despliegue
- Vercel (build web con Expo)

---

## Funcionalidades principales

- Registro de usuarios
- Sistema de nicks únicos
- Ranking global
- Perfil de usuario
- Notificaciones
- Persistencia de datos en la nube
- Versión web funcional desde navegador

---

## Estructura del proyecto

```bash
DESAFIO-ARITMETICO/
├── .expo/
├── .vscode/
├── assets/
├── node_modules/
├── scripts/
│ └── importarLocalizaciones.js
├── src/
│ ├── assets/
│ ├── components/
│ ├── config/
│ ├── context/
│ ├── json/
│ ├── navegacion/
│ ├── screens/
│ └── services/
├── .env
├── .env.example
├── .gitignore
├── App.js
├── app.json
├── babel.config.js
├── index.js
├── metro.config.js
├── package-lock.json
├── package.json
├── README.md
└── serviceAccountKey.json
```

---

## Variables de entorno

El proyecto utiliza variables de entorno para Firebase y Cloudinary.

Ejemplo de `.env`:

```env
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_UPLOAD_PRESET=xxxx


FIREBASE_PROJECT_ID=xxxx
FIREBASE_CLIENT_EMAIL=xxxx
FIREBASE_PRIVATE_KEY=xxxx

EXPO_PUBLIC_FIREBASE_API_KEY=xxxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxxx
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=xxxx
```

---

## Estado del proyecto

Activo
El proyecto se encuentra funcional y desplegado.
Se seguirán implementando mejoras y nuevas funcionalidades.

---

## Próximas mejoras

- ☐ Sistema de notificaciones push bien hecho

- ☐ Sistema de Reto Diario

- ☐ Estadísticas avanzadas

- ☐ Modos de juego adicionales

- ☐ Mejora de UX/UI

- ☐ Optimización de rendimiento web

- ☐ Sistema de logros

---

## Autor

David Cuevas Gil
Estudiante de Desarrollo de Aplicaciones Web (DAW)

Proyecto personal con enfoque formativo y profesional.

---

## Licencia

Este proyecto se distribuye bajo la licencia MIT.  
Consulta el archivo LICENSE para más información.

---
