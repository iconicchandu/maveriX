'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker with better error handling
    const registerSW = () => {
      try {
        navigator.serviceWorker
          .register('/sw.js', {
            scope: '/',
            updateViaCache: 'none', // Always check for updates
          })
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration);
            
            // Check for updates periodically (only if registration is valid)
            if (registration) {
              const updateInterval = setInterval(() => {
                try {
                  registration.update().catch((error) => {
                    console.warn('[PWA] Service Worker update check failed:', error);
                  });
                } catch (error) {
                  console.warn('[PWA] Service Worker update check error:', error);
                  clearInterval(updateInterval);
                }
              }, 60 * 60 * 1000); // Check every hour
            }

            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
              console.log('[PWA] Service Worker update found');
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] New Service Worker installed, reloading...');
                    // Optionally show a notification to the user before reloading
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  }
                });
              }
            });
          })
          .catch((error) => {
            // Don't show error to user, just log it
            console.warn('[PWA] Service Worker registration failed (this is normal on some browsers/devices):', error);
            // On iOS, service workers might not be fully supported, so this is expected
          });
      } catch (error) {
        console.warn('[PWA] Service Worker registration error:', error);
      }
    };

    // Handle service worker controller changes
    const handleControllerChange = () => {
      try {
        // Only reload if we're not already reloading
        if (document.visibilityState === 'visible') {
          window.location.reload();
        }
      } catch (error) {
        console.warn('[PWA] Controller change handler error:', error);
      }
    };

    // Register immediately if page is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // Small delay to ensure everything is ready
      setTimeout(registerSW, 100);
    } else {
      // Register on load
      window.addEventListener('load', registerSW, { once: true });
    }

    // Handle service worker updates
    try {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    } catch (error) {
      console.warn('[PWA] Failed to add controllerchange listener:', error);
    }

    // Cleanup
    return () => {
      try {
        window.removeEventListener('load', registerSW);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  return null; // This component doesn't render anything
}

