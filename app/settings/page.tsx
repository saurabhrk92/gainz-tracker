'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { SyncService } from '@/lib/services/googleDrive';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const [syncService, setSyncService] = useState<SyncService | null>(null);
  const [backups, setBackups] = useState<Array<{ id: string; name: string; createdTime: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingBackupId, setPendingBackupId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isAuthenticated) {
      setSyncService(new SyncService());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (syncService && isAuthenticated) {
      loadBackups();
      checkAutoSync();
    }
  }, [syncService, isAuthenticated]);

  const loadBackups = async () => {
    if (!syncService) return;
    
    try {
      setLoading(true);
      const backupList = await syncService.getBackupList();
      setBackups(backupList);
    } catch (error) {
      console.error('Failed to load backups:', error);
      setSyncStatus('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const checkAutoSync = async () => {
    if (!syncService) return;
    
    try {
      await syncService.autoSync();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  };

  const handleBackup = async () => {
    if (!syncService) return;
    
    // Show immediate feedback and run backup in background
    setSyncStatus('Creating backup...');
    
    // Use setTimeout to ensure UI updates immediately
    setTimeout(async () => {
      try {
        await syncService.uploadBackup('manual');
        setSyncStatus('Backup created successfully!');
        await loadBackups();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSyncStatus('');
        }, 3000);
      } catch (error) {
        console.error('Backup failed:', error);
        setSyncStatus('Backup failed');
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setSyncStatus('');
        }, 5000);
      }
    }, 100); // Small delay to ensure UI responsiveness
  };

  const handleRestore = async (backupId?: string) => {
    if (!syncService) return;
    
    setPendingBackupId(backupId);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    if (!syncService) return;
    
    const backupToRestore = pendingBackupId;
    
    // Show immediate feedback and clear modal
    setSyncStatus('Restoring data...');
    setPendingBackupId(undefined);
    
    try {
      setLoading(true);
      await syncService.restoreFromBackup(backupToRestore);
      setSyncStatus('Data restored successfully!');
      // Refresh the page to show restored data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Restore failed:', error);
      setSyncStatus('Restore failed');
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!syncService) return;
    
    setPendingBackupId(backupId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBackup = async () => {
    if (!syncService || !pendingBackupId) return;
    
    const backupToDelete = pendingBackupId;
    
    // Show immediate feedback and clear modal
    setSyncStatus('Deleting backup...');
    setPendingBackupId(undefined);
    
    // Run delete asynchronously
    setTimeout(async () => {
      try {
        await syncService.deleteBackup(backupToDelete);
        await loadBackups();
        setSyncStatus('Backup deleted');
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setSyncStatus('');
        }, 3000);
      } catch (error) {
        console.error('Delete failed:', error);
        setSyncStatus('Delete failed');
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setSyncStatus('');
        }, 5000);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="pt-12 pb-8">
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and data</p>
      </div>

      {/* Main Content */}
      <main className="space-y-6">
        {/* Account Section */}
        <Card>
          <h2 className="text-lg font-bold text-black mb-4">Account</h2>
          
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {user?.image && (
                    <img 
                      src={user.image} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-lg border border-gray-200"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-black">{user?.name}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button
                variant="secondary"
                onClick={() => signOut()}
                className="w-full"
                size="lg"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-bold text-black mb-2">Sign in to unlock cloud features</h3>
              <p className="text-gray-600 text-sm mb-4">Enable cloud sync and backup for your workout data</p>
              <Button
                onClick={() => signIn()}
                className="w-full"
                size="lg"
              >
                Sign In with Google
              </Button>
            </div>
          )}
        </Card>

        {/* Sync & Backup Section */}
        {isAuthenticated && (
          <Card>
            <h2 className="text-lg font-bold text-black mb-4">Sync & Backup</h2>
            
            {syncStatus && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm font-medium">{syncStatus}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex gap-3">
                  <Button
                    onClick={handleBackup}
                    className="flex-1"
                    size="md"
                  >
                    Create Backup
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => handleRestore()}
                    disabled={loading || backups.length === 0}
                    className="flex-1"
                    size="md"
                  >
                    Restore Latest
                  </Button>
                </div>
                
                <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Automatic backup happens every 24 hours
                  </p>
                </div>
              </div>
            </div>
        </Card>
        )}

        {/* Backup History */}
        {isAuthenticated && backups.length > 0 && (
          <Card>
            <h2 className="text-lg font-bold text-black mb-4">Backup History</h2>
            
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <div key={backup.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-black">
                        {formatDate(new Date(backup.createdTime), 'MMM d, yyyy h:mm a')}
                      </p>
                      <p className="text-sm text-gray-600">{backup.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => handleRestore(backup.id)}
                      disabled={loading}
                      className="px-4 py-1 text-xs"
                    >
                      Restore
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteBackup(backup.id)}
                      disabled={loading}
                      className="px-4 py-1 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* App Info */}
        <Card>
          <h2 className="text-lg font-bold text-black mb-4">About</h2>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-200">
                <span className="font-medium text-gray-700">Version</span>
                <span className="font-semibold text-black">1.0.0</span>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-200">
                <span className="font-medium text-gray-700">Build</span>
                <span className="font-semibold text-black">2025.07.19</span>
              </div>
              <div className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-200">
                <span className="font-medium text-gray-700">Storage</span>
                <span className="font-semibold text-black">Local + Google Drive</span>
              </div>
            </div>
            
            <div className="text-center bg-gradient-primary rounded-lg p-4 text-white">
              <p className="font-semibold">Made with ❤️ for fitness enthusiasts</p>
            </div>
          </div>
        </Card>
      </main>

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={confirmRestore}
        title="Restore Backup"
        message="This will replace all your current data. Are you sure?"
        confirmText="Restore"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Delete Backup Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteBackup}
        title="Delete Backup"
        message="Are you sure you want to delete this backup?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}