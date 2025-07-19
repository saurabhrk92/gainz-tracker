// Client-side service that calls our API endpoints
export class GoogleDriveService {
  constructor() {
    // No longer need access token on client side
  }

  async uploadBackup(data: any): Promise<string> {
    try {
      const response = await fetch('/api/sync/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload backup');
      }

      const result = await response.json();
      return result.fileId;
    } catch (error) {
      console.error('Failed to upload backup:', error);
      throw new Error('Failed to upload backup to Google Drive');
    }
  }

  async downloadLatestBackup(): Promise<any> {
    try {
      const response = await fetch('/api/sync/restore');

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to download backup');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to download backup:', error);
      throw new Error('Failed to download backup from Google Drive');
    }
  }

  async downloadBackup(fileId: string): Promise<any> {
    try {
      const response = await fetch(`/api/sync/restore?fileId=${fileId}`);

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
      const response = await fetch('/api/sync/list');

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
      const response = await fetch('/api/sync/list', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
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

  async uploadBackup(): Promise<string | null> {

    try {
      // Get all local data
      const { getDB } = await import('@/lib/storage/indexedDB');
      const db = await getDB();
      const data = await db.exportData();

      // Add metadata
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data,
      };

      return await this.driveService.uploadBackup(backupData);
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
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

      // Restore to local database
      const { getDB } = await import('@/lib/storage/indexedDB');
      const db = await getDB();
      
      // Clear existing data and import backup
      await db.clearAll();
      await db.importData(backupData.data);
      
      // Update sync metadata
      await db.updateSyncMeta({
        lastSyncTime: new Date(),
        fileId: backupId || 'latest',
        lastSyncStatus: 'success',
      });
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
        await this.uploadBackup();
        
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
}