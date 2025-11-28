'use client';

import { useEffect, useState } from 'react';

export default function PWARegistration() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration);
        setSwRegistration(registration);

        // Check for updates immediately
        checkForUpdates(registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing || registration.waiting;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[PWA] Update available!');
              setUpdateAvailable(true);
            }
          });
        });

        // Check for updates periodically (every 5 minutes)
        setInterval(() => {
          checkForUpdates(registration);
        }, 5 * 60 * 1000); // 5 minutes

        // Check for updates when page becomes visible (user returns to app)
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            checkForUpdates(registration);
          }
        });

        // Listen for controller change (when new SW takes control)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] New service worker activated, reloading...');
          window.location.reload();
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[PWA] Update message received');
        setUpdateAvailable(true);
      }
    });
  }, []);

  // Function to check for updates
  const checkForUpdates = async (registration: ServiceWorkerRegistration) => {
    try {
      await registration.update();
      
      // Check if there's a waiting service worker
      if (registration.waiting) {
        console.log('[PWA] Waiting service worker found');
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  };

  const handleUpdate = async () => {
    if (!swRegistration) {
      // If no registration, just reload (iOS fallback)
      window.location.reload();
      return;
    }

    if (swRegistration.waiting) {
      // Tell the service worker to skip waiting and activate
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Wait a bit for the message to be processed
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // No waiting worker, just reload (iOS fallback)
      window.location.reload();
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-[10000]">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Update Available</h3>
            <p className="text-xs text-gray-600 mb-3">
              {isIOS 
                ? 'A new version is available. Tap update to refresh the app.'
                : 'A new version of the app is available. Click update to refresh.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => setUpdateAvailable(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

