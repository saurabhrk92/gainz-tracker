import { showToast } from '@/lib/utils/toast';

// Client-side service that manages tokens via IndexedDB with KV fallback
export class GoogleDriveService {
  private async getValidAccessToken(): Promise<string | null> {
    try {
      // Get current session
      const session = await fetch('/api/auth/session').then(r => r.json());
      if (!session?.user?.email) {
        return null;
      }

      // First check IndexedDB (fast, local)
      const { tokenStore } = await import('@/lib/auth/tokenStore');
      const localTokens = await tokenStore.getTokens(session.user.email);
      
      if (localTokens) {
        // Check if token is expired or about to expire (5 min buffer)
        const now = Date.now();
        const bufferTime = 5 * 60 * 1000; // 5 minutes
        
        if (localTokens.expiresAt - bufferTime > now) {
          // Token is still valid
          return localTokens.accessToken;
        }

        // Token expired, refresh via API and update IndexedDB
        if (localTokens.refreshToken) {
          console.log('Access token expired, refreshing via API...');
          const newToken = await this.refreshAccessToken();
          if (newToken) {
            // Update local cache with new token
            await tokenStore.updateAccessToken(session.user.email, newToken, 3600);
          }
          return newToken;
        }
      }

      // Fallback to KV store if IndexedDB doesn't have tokens
      console.log('No valid tokens in IndexedDB, checking KV...');
      const tokenResponse = await fetch('/api/auth/tokens/store');
      const tokenData = await tokenResponse.json();
      
      if (!tokenData.tokens) {
        throw new Error('No tokens found for user');
      }

      const tokens = tokenData.tokens;

      // Sync tokens to IndexedDB for future use
      await tokenStore.saveTokens(
        session.user.email,
        tokens.accessToken,
        tokens.refreshToken,
        Math.floor((tokens.expiresAt - Date.now()) / 1000)
      );
      console.log('Synced tokens from KV to IndexedDB');

      // Check if token is expired or about to expire (5 min buffer)
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes
      
      if (tokens.expiresAt - bufferTime > now) {
        // Token is still valid
        return tokens.accessToken;
      }

      // Token expired or about to expire, try to refresh
      console.log('Access token expired, attempting refresh via API...');
      return await this.refreshAccessToken();
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }


  private async refreshAccessToken(): Promise<string> {
    try {
      const response = await fetch('/api/auth/tokens/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsReconnect) {
          throw new Error('User needs to reconnect to Google Drive');
        }
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  async uploadBackup(data: any): Promise<string> {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        showToast('Please connect to Google Drive in Settings to backup your data', 'warning');
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/sync/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ data }),
      });

      if (response.status === 401) {
        showToast('Please connect to Google Drive in Settings to backup your data', 'warning');
        throw new Error('Authentication expired. Please sign in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload backup');
      }

      const result = await response.json();
      return result.fileId;
    } catch (error) {
      console.error('Failed to upload backup:', error);
      if (error instanceof Error && error.message.includes('Authentication expired')) {
        throw error; // Pass through auth errors
      }
      throw new Error('Failed to upload backup to Google Drive');
    }
  }

  async downloadLatestBackup(): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        showToast('Please connect to Google Drive in Settings to backup your data', 'warning');
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/sync/restore', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        showToast('Please connect to Google Drive in Settings to backup your data', 'warning');
        throw new Error('Authentication expired. Please sign in again.');
      }

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download backup');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to download backup:', error);
      if (error instanceof Error && error.message.includes('Authentication expired')) {
        throw error; // Pass through auth errors
      }
      throw new Error('Failed to download backup from Google Drive');
    }
  }

  async downloadBackup(fileId: string): Promise<any> {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/sync/restore?fileId=${fileId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download backup');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to download backup:', error);
      throw new Error('Failed to download backup from Google Drive');
    }
  }

  async listBackups(): Promise<Array<{ id: string; name: string; createdTime: string }>> {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/sync/list', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to list backups');
      }

      const result = await response.json();
      return result.backups || [];
    } catch (error) {
      console.error('Failed to list backups:', error);
      throw new Error('Failed to list backups from Google Drive');
    }
  }

  async deleteBackup(fileId: string): Promise<void> {
    try {
      const accessToken = await this.getValidAccessToken();
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/sync/list', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete backup');
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw new Error('Failed to delete backup from Google Drive');
    }
  }
}

// Sync service that coordinates local and cloud data
export class SyncService {
  private driveService: GoogleDriveService;

  constructor() {
    this.driveService = new GoogleDriveService();
  }

  async uploadBackup(triggerReason?: string): Promise<string | null> {
    try {
      // Get all local data
      const { getDB } = await import('@/lib/storage/indexedDB');
      const db = await getDB();
      const data = await db.exportData();

      // Add metadata
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        triggerReason: triggerReason || 'manual',
        data,
      };

      const fileId = await this.driveService.uploadBackup(backupData);
      
      // Clean up old backups to maintain max 20 files
      await this.cleanupOldBackups();
      
      return fileId;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const MAX_BACKUPS = 20;
      const backups = await this.driveService.listBackups();
      
      if (backups.length > MAX_BACKUPS) {
        // Sort by creation time (newest first)
        const sortedBackups = backups.sort((a, b) => 
          new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
        );
        
        // Delete oldest backups beyond the limit
        const backupsToDelete = sortedBackups.slice(MAX_BACKUPS);
        
        console.log(`Cleaning up ${backupsToDelete.length} old backups`);
        
        for (const backup of backupsToDelete) {
          try {
            await this.driveService.deleteBackup(backup.id);
            console.log(`Deleted old backup: ${backup.name}`);
          } catch (error) {
            console.error(`Failed to delete backup ${backup.id}:`, error);
            // Continue with other deletions even if one fails
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      // Don't throw - cleanup failure shouldn't break the backup process
    }
  }

  async restoreFromBackup(backupId?: string): Promise<void> {
    try {
      let backupData;
      
      if (backupId) {
        // Download specific backup
        backupData = await this.driveService.downloadBackup(backupId);
      } else {
        // Download latest backup
        backupData = await this.driveService.downloadLatestBackup();
      }

      if (!backupData) {
        throw new Error('No backup found');
      }

      // Handle nested data structure - actual data might be in backupData.data.data
      const actualData = backupData.data?.data || backupData.data;
      
      console.log('Backup data received:', {
        hasData: !!actualData,
        exercises: actualData?.exercises?.length || 0,
        templates: actualData?.templates?.length || 0,
        workouts: actualData?.workouts?.length || 0
      });

      // Restore to local database
      const { getDB } = await import('@/lib/storage/indexedDB');
      const db = await getDB();
      
      console.log('Clearing existing data...');
      await db.clearAll();
      
      console.log('Importing backup data...');
      await db.importData(actualData);
      
      // Verify data was imported
      const importedData = await db.exportData();
      console.log('Data imported successfully:', {
        exercises: importedData.exercises?.length || 0,
        templates: importedData.templates?.length || 0,
        workouts: importedData.workouts?.length || 0
      });
      
      // Update sync metadata
      await db.updateSyncMeta({
        lastSyncTime: new Date(),
        fileId: backupId || 'latest',
        lastSyncStatus: 'success',
      });
      
      console.log('Backup restoration completed successfully');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  async getBackupList() {
    return await this.driveService.listBackups();
  }

  async deleteBackup(fileId: string) {
    return await this.driveService.deleteBackup(fileId);
  }

  async autoSync(): Promise<void> {
    try {
      // Check if auto-sync is enabled and enough time has passed
      const { getDB } = await import('@/lib/storage/indexedDB');
      const db = await getDB();
      const syncMeta = await db.getSyncMeta();
      
      if (!syncMeta) {
        return;
      }

      const lastSync = syncMeta.lastSyncTime ? new Date(syncMeta.lastSyncTime) : new Date(0);
      const now = new Date();
      const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

      // Auto-sync every 24 hours
      if (hoursSinceSync >= 24) {
        await this.uploadBackup('daily_backup');
        
        await db.updateSyncMeta({
          ...syncMeta,
          lastSyncTime: now,
          lastSyncStatus: 'success',
        });
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
      // Don't throw - auto-sync should fail silently
    }
  }

  // Smart sync for workout events - only sync if significant changes  
  async syncWorkoutEvent(triggerReason: string): Promise<void> {
    try {
      const { getDB } = await import('@/lib/storage/indexedDB');
      const db = await getDB();
      
      // Get sync metadata to check last sync time
      const syncMeta = await db.getSyncMeta();
      const lastSync = syncMeta?.lastSyncTime ? new Date(syncMeta.lastSyncTime) : new Date(0);
      const now = new Date();
      const minutesSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60);
      
      // Only sync if enough time has passed to avoid excessive syncing
      const shouldSync = this.shouldSyncForTrigger(triggerReason, minutesSinceSync);
      
      if (shouldSync) {
        console.log(`Background sync triggered: ${triggerReason}`);
        
        // Run sync in background without blocking UI
        this.uploadBackup(triggerReason).then(async () => {
          await db.updateSyncMeta({
            lastSyncTime: now,
            lastSyncStatus: 'success',
            fileId: 'auto-sync',
          });
          console.log(`Background sync completed: ${triggerReason}`);
        }).catch((error) => {
          console.error(`Background sync failed for ${triggerReason}:`, error);
          
          // Only show toast for auth errors, not all sync failures
          if (error.message && error.message.includes('Authentication expired')) {
            // Already shown toast in GoogleDriveService, no need to show again
          }
          
          // Update sync metadata with error status
          db.updateSyncMeta({
            lastSyncTime: now,
            lastSyncStatus: 'failed',
            fileId: 'auto-sync',
          }).catch(() => {}); // Ignore metadata update errors
        });
      }
    } catch (error) {
      console.error(`Workout sync setup failed for ${triggerReason}:`, error);
      // Don't throw - sync failure shouldn't break workout flow
    }
  }

  private shouldSyncForTrigger(triggerReason: string, minutesSinceLastSync: number): boolean {
    switch (triggerReason) {
      case 'workout_completed':
      case 'workout_ended_early':
      case 'workout_auto_timeout':
        // Always sync when workout finishes (but not more than once per minute)
        return minutesSinceLastSync >= 1;
      
      case 'sets_batched':
        // Sync after batched sets, but not more than once every 10 minutes
        return minutesSinceLastSync >= 10;
      
      case 'workout_template_modified':
        // Sync workout template changes, but not more than once every 5 minutes
        return minutesSinceLastSync >= 5;
      
      default:
        // For other triggers, sync if it's been at least 30 minutes
        return minutesSinceLastSync >= 30;
    }
  }
}