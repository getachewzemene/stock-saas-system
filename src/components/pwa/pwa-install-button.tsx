'use client';

import { usePWA } from './pwa-provider';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor } from 'lucide-react';

export function PWAInstallButton() {
  const { canInstall, isInstalled, isOnline, install } = usePWA();

  if (isInstalled || !canInstall) return null;

  return (
    <Button
      onClick={install}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Install App</span>
      <span className="sm:hidden">Install</span>
    </Button>
  );
}

export function PWAStatusIndicator() {
  const { isInstalled, isOnline } = usePWA();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="hidden sm:inline">
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {isInstalled && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Smartphone className="h-3 w-3" />
          <span className="hidden sm:inline">Installed</span>
        </div>
      )}
    </div>
  );
}

export function PWAPrompt() {
  const { canInstall, isInstalled, install } = usePWA();

  if (isInstalled || !canInstall) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-background border rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Install Stock SaaS System</h4>
            <p className="text-xs text-muted-foreground">
              Get quick access to your inventory management
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={install} size="sm" className="flex-1">
            Install
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              // Hide the prompt by removing it from DOM temporarily
              const prompt = document.querySelector('[data-pwa-prompt]');
              if (prompt) {
                (prompt as HTMLElement).style.display = 'none';
              }
            }}
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}