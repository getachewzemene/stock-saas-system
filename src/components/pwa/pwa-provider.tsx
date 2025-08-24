'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  };

  // Expose PWA functionality to window for global access
  useEffect(() => {
    (window as any).pwa = {
      install: installPWA,
      canInstall: !!deferredPrompt,
      isInstalled,
      isOnline,
    };
  }, [deferredPrompt, isInstalled, isOnline]);

  return null;
}

// Hook to use PWA features
export function usePWA() {
  const [pwa, setPwa] = useState({
    canInstall: false,
    isInstalled: false,
    isOnline: true,
    install: () => {},
  });

  useEffect(() => {
    const updatePwa = () => {
      setPwa({
        canInstall: !!(window as any).pwa?.canInstall,
        isInstalled: !!(window as any).pwa?.isInstalled,
        isOnline: !!(window as any).pwa?.isOnline,
        install: (window as any).pwa?.install || (() => {}),
      });
    };

    updatePwa();
    const interval = setInterval(updatePwa, 1000);

    return () => clearInterval(interval);
  }, []);

  return pwa;
}