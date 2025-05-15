"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }>;
    prompt(): Promise<void>;
  }
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if the app is already installed
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }
    
    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null); // Clear the prompt as it's no longer needed
    });


    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      // window.removeEventListener('appinstalled', ...); // remove if added
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the PWA installation');
        setIsAppInstalled(true);
      } else {
        console.log('User dismissed the PWA installation');
      }
      setDeferredPrompt(null);
    }
  };

  if (isAppInstalled || !deferredPrompt) {
    return null; // Don't show button if already installed or no prompt available
  }

  return (
    <Button onClick={handleInstallClick} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Installer l'App
    </Button>
  );
}
