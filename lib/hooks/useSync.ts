'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { SyncService } from '@/lib/services/googleDrive';

export function useSync() {
  const { isAuthenticated } = useAuth();
  const [syncService, setSyncService] = useState<SyncService | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const prevAuthenticatedRef = useRef<boolean | null>(null);

  useEffect(() => {
    const wasAuthenticated = prevAuthenticatedRef.current;
    const isNowAuthenticated = isAuthenticated;
    
    // Update the ref for next render
    prevAuthenticatedRef.current = isAuthenticated;

    if (isNowAuthenticated) {
      setSyncService(new SyncService());
      
      // Check if this is a fresh login (transition from false to true)
      if (wasAuthenticated === false && isNowAuthenticated === true) {
        handleFreshLogin();
      }
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

  const handleFreshLogin = async () => {
    if (!syncService) return;

    // Check if we've already restored on this session to prevent duplicate restorations
    const sessionKey = 'gainz_restore_attempted';
    const hasAttemptedRestore = sessionStorage.getItem(sessionKey);
    
    if (hasAttemptedRestore) {
      console.log('Restore already attempted this session, skipping');
      return;
    }

    try {
      console.log('Fresh login detected, checking for existing backup...');
      setSyncStatus('syncing');
      
      // Check if there's a backup available
      const backupData = await syncService.getBackupList();
      
      if (backupData && backupData.length > 0) {
        console.log(`Found ${backupData.length} backups, restoring latest...`);
        
        // Restore from the latest backup
        await syncService.restoreFromBackup();
        
        setLastSyncTime(new Date());
        setSyncStatus('success');
        
        console.log('Backup restoration completed successfully');
        
        // Reload the page to refresh all components with restored data
        window.location.reload();
      } else {
        console.log('No backups found, continuing with local data');
        setSyncStatus('success');
      }
    } catch (error) {
      console.error('Backup restoration failed:', error);
      setSyncStatus('error');
      // Don't throw - continue with local data if restoration fails
    } finally {
      // Mark that we've attempted restoration for this session
      sessionStorage.setItem(sessionKey, 'true');
    }
  };

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
      await syncService.uploadBackup('manual');
      setLastSyncTime(new Date());
      setSyncStatus('success');
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus('error');
      throw error;
    }
  };

  const syncWorkoutEvent = async (triggerReason: string) => {
    if (!syncService) return;

    try {
      // Don't update UI status for background workout syncs
      await syncService.syncWorkoutEvent(triggerReason);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Workout sync failed:', error);
      // Don't throw - workout sync should fail silently
    }
  };

  return {
    syncService,
    lastSyncTime,
    syncStatus,
    manualSync,
    syncWorkoutEvent,
    isAuthenticated,
  };
}