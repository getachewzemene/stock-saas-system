# PWA and Electron Setup Guide

This guide explains how to use the Progressive Web App (PWA) and Electron desktop application features of the Stock SaaS System.

## PWA Features

### What's Included
- **Offline Support**: The app works without internet connection
- **Installable**: Users can install the app on their devices
- **Responsive Design**: Works on all screen sizes
- **Push Notifications**: Ready for notification support
- **Service Worker**: Caches assets for offline use

### How to Install as PWA
1. Open the app in a modern browser (Chrome, Firefox, Safari, Edge)
2. Look for the install button in the header (appears when installable)
3. Click "Install App" to add to your device
4. The app will appear on your home screen/desktop

### PWA Features in the App
- **Install Button**: Appears in the header when the app can be installed
- **Status Indicator**: Shows online/offline status
- **Offline Support**: App continues to work with cached data
- **App-like Experience**: Full-screen mode with no browser chrome

## Electron Desktop App

### What's Included
- **Native Desktop Application**: Runs as a standalone app
- **Cross-Platform**: Windows, macOS, and Linux support
- **Native Features**: File dialogs, system menus, notifications
- **Offline Capabilities**: Works without internet connection
- **Auto-Updates**: Ready for update functionality

### Development Commands

#### Run in Development Mode
```bash
npm run electron-dev
```
This starts both the Next.js development server and the Electron app.

#### Build for Production
```bash
npm run electron-dist
```
This builds the Next.js app and packages it as a desktop application.

#### Package Only (No Installer)
```bash
npm run electron-pack
```
This creates the packaged app without installers.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run electron` | Run Electron app (requires built Next.js app) |
| `npm run electron-dev` | Run in development mode with hot reload |
| `npm run electron-build` | Build Next.js app and package with Electron |
| `npm run electron-dist` | Create distributable packages |
| `npm run electron-pack` | Create unpackaged app |
| `npm run pwa-build` | Build PWA version |

### Desktop App Features
- **Native Menu**: File, Edit, View, Window, Help menus
- **Keyboard Shortcuts**: Common shortcuts for actions
- **File Operations**: Native file dialogs for import/export
- **System Notifications**: Desktop notifications
- **Window Management**: Minimize, maximize, close functionality
- **Theme Support**: Respects system dark/light mode

### Native Features Available
- **File Dialogs**: Open/save files with native dialogs
- **System Notifications**: Desktop notifications
- **Menu Bar**: Native application menu
- **Keyboard Shortcuts**: Platform-specific shortcuts
- **Window Controls**: Native window management
- **System Integration**: Taskbar/dock integration

## Building for Distribution

### Windows
```bash
npm run electron-dist
```
Creates an NSIS installer in the `dist` directory.

### macOS
```bash
npm run electron-dist
```
Creates a DMG file in the `dist` directory.

### Linux
```bash
npm run electron-dist
```
Creates an AppImage in the `dist` directory.

## Configuration

### PWA Configuration
- **Manifest**: `public/manifest.json`
- **Service Worker**: `public/sw.js`
- **Icons**: `public/icons/` directory
- **Offline Page**: `public/offline.html`

### Electron Configuration
- **Main Process**: `main.js`
- **Preload Script**: `preload.js`
- **Package Config**: `package.json` (build section)
- **Icons**: `public/icons/` directory

## Troubleshooting

### PWA Issues
1. **Install button not showing**: Make sure you're using a supported browser
2. **Offline not working**: Check service worker registration in browser dev tools
3. **Icons not loading**: Verify icon files exist in `public/icons/`

### Electron Issues
1. **App won't start**: Check console for errors, ensure Node.js is installed
2. **Build fails**: Verify all dependencies are installed
3. **Menu not working**: Check main.js for menu configuration

### Development Tips
- Use `npm run electron-dev` for development with hot reload
- Test PWA features in Chrome's DevTools Application tab
- Use Electron DevTools for debugging desktop app issues
- Check `dist/` directory after building for distribution

## Requirements

### PWA
- Modern web browser (Chrome 70+, Firefox 63+, Safari 11.3+, Edge 79+)
- HTTPS connection (or localhost for development)

### Electron
- Node.js 16+ 
- npm or yarn
- Operating system: Windows 10+, macOS 10.14+, or Linux

## Future Enhancements

### PWA
- Background sync for data updates
- Push notifications integration
- More sophisticated offline caching
- Home screen widgets support

### Electron
- Auto-update functionality
- System tray icon
- Global shortcuts
- Deep linking support
- Native file associations