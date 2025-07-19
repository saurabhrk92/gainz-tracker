'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { SyncService } from '@/lib/services/googleDrive';

export function useSync() {
  const { isAuthenticated } = useAuth();
  const [syncService, setSyncService] = useState<SyncService | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isAuthenticated) {
      setSyncService(new SyncService());
    } else {
      setSyncService(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (syncService) {
      // Auto-sync on app startup
      performAutoSync();
      
      // Set up interval for periodic auto-sync (every 30 minutes)
      const interval = setInterval(() => {
        performAutoSync();
      }, 30 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [syncService]);

  const performAutoSync = async () => {
    if (!syncService) return;

    try {
      setSyncStatus('syncing');
      await syncService.autoSync();
      setLastSyncTime(new Date());
      setSyncStatus('success');
    } catch (error) {
      console.error('Auto-sync failed:', error);
      setSyncStatus('error');
    }
  };

  const manualSync = async () => {
    if (!syncService) return;

    try {
      setSyncStatus('syncing');
      await syncService.uploadBackup();
      setLastSyncTime(new Date());
      setSyncStatus('success');
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus('error');
      throw error;
    }
  };

  return {
    syncService,
    lastSyncTime,
    syncStatus,
    manualSync,
    isAuthenticated,
  };
}