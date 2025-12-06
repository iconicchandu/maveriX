'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function PushNotificationManager() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // Request permission if not granted
    if (Notification.permission === 'default' && session) {
      // Auto-request permission after a short delay
      const timer = setTimeout(async () => {
        try {
          const result = await Notification.requestPermission();
          setPermission(result);
          
          if (result === 'granted') {
            await registerPushSubscription();
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      }, 2000); // Wait 2 seconds after page load

      return () => clearTimeout(timer);
    } else if (Notification.permission === 'granted' && session) {
      registerPushSubscription();
    }
  }, [session]);

  const registerPushSubscription = async () => {
    // Push notifications work via Notification API directly
    // No service worker or push subscription needed
    // Notifications are handled by GlobalNotificationListener
    return;
  };

  // Notifications are handled by GlobalNotificationListener
  // No service worker message listener needed

  return null; // This component doesn't render anything
}

