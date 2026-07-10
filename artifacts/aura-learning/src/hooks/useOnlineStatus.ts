import { useState, useEffect } from 'react';
import { requestBackgroundSync } from '@/lib/offlineDB';

/**
 * Returns true when the browser has a network connection.
 * Also triggers a background sync flush whenever the device comes back online.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      // Flush any queued progress / notes
      requestBackgroundSync().catch(() => {});
    }
    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
