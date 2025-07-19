'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { SyncService } from '@/lib/services/googleDrive';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  const [syncService, setSyncService] = useState<SyncService | null>(null);
  const [backups, setBackups] = useState<Array<{ id: string; name: string; createdTime: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

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
    
    try {
      setLoading(true);
      setSyncStatus('Creating backup...');
      await syncService.uploadBackup();
      setSyncStatus('Backup created successfully!');
      await loadBackups();
    } catch (error) {
      console.error('Backup failed:', error);
      setSyncStatus('Backup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupId?: string) => {
    if (!syncService) return;
    
    const confirmed = confirm('This will replace all your current data. Are you sure?');
    if (!confirmed) return;
    
    try {
      setLoading(true);
      setSyncStatus('Restoring data...');
      await syncService.restoreFromBackup(backupId);
      setSyncStatus('Data restored successfully!');
      // Refresh the page to show restored data
      window.location.reload();
    } catch (error) {
      console.error('Restore failed:', error);
      setSyncStatus('Restore failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!syncService) return;
    
    const confirmed = confirm('Are you sure you want to delete this backup?');
    if (!confirmed) return;
    
    try {
      setLoading(true);
      await syncService.deleteBackup(backupId);
      await loadBackups();
      setSyncStatus('Backup deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      setSyncStatus('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-primary text-white p-4 safe-top relative overflow-hidden rounded-b-3xl mb-4 mx-[-16px] mt-[-16px]">
        <div className="relative z-10 px-2">
          <h1 className="text-xl font-bold font-display">⚙️ Settings</h1>
          <p className="text-white/90 mt-1 text-sm">Manage your account and data</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-6 translate-x-6 pointer-events-none"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        {/* Account Section */}
        <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-display">👤 Account</h2>
          
          {isAuthenticated ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  {user?.image && (
                    <img 
                      src={user.image} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-2xl shadow-md border-2 border-white"
                    />
                  )}
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{user?.name}</p>
                    <p className="text-sm text-gray-600 font-medium">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-semibold">Connected</span>
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
                🚪 Sign Out
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="text-6xl opacity-50">🔒</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-display">Sign in to unlock cloud features</h3>
                <p className="text-gray-600 text-lg">Enable cloud sync and backup for your workout data</p>
              </div>
              <Button
                onClick={() => signIn()}
                className="w-full"
                size="lg"
              >
                🔗 Sign In with Google
              </Button>
            </div>
          )}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-primary opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
        </Card>

        {/* Sync & Backup Section */}
        {isAuthenticated && (
          <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-display">☁️ Sync & Backup</h2>
            
            {syncStatus && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-2xl shadow-sm">
                <p className="text-blue-800 font-medium flex items-center gap-2">
                  <span className="text-lg">ℹ️</span>
                  {syncStatus}
                </p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={handleBackup}
                    disabled={loading}
                    className="flex-1"
                    size="lg"
                  >
                    {loading ? '⏳ Creating...' : '💾 Create Backup'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => handleRestore()}
                    disabled={loading || backups.length === 0}
                    className="flex-1"
                    size="lg"
                  >
                    📥 Restore Latest
                  </Button>
                </div>
                
                <div className="text-center bg-white/60 rounded-xl p-3">
                  <p className="text-sm text-gray-600 font-medium flex items-center justify-center gap-2">
                    <span className="text-lg">🔄</span>
                    Automatic backup happens every 24 hours
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-secondary opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          </Card>
        )}

        {/* Backup History */}
        {isAuthenticated && backups.length > 0 && (
          <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-display">📋 Backup History</h2>
            
            <div className="space-y-4">
              {backups.map((backup, index) => (
                <div
                  key={backup.id}
                  className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-accent rounded-2xl flex items-center justify-center text-white font-bold shadow-md">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-lg">
                          {formatDate(new Date(backup.createdTime), 'MMM d, yyyy h:mm a')}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">{backup.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleRestore(backup.id)}
                        disabled={loading}
                      >
                        📥 Restore
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.id)}
                        disabled={loading}
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-accent opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
          </Card>
        )}

        {/* App Info */}
        <Card className="relative overflow-hidden transform hover:scale-[1.01] transition-all duration-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 font-display">ℹ️ About</h2>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 space-y-4">
            <div className="space-y-4 text-gray-700">
              <div className="flex justify-between items-center bg-white/60 rounded-xl p-3">
                <span className="font-semibold flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  Version
                </span>
                <span className="font-bold text-gray-800">1.0.0</span>
              </div>
              <div className="flex justify-between items-center bg-white/60 rounded-xl p-3">
                <span className="font-semibold flex items-center gap-2">
                  <span className="text-lg">🔨</span>
                  Build
                </span>
                <span className="font-bold text-gray-800">2025.07.19</span>
              </div>
              <div className="flex justify-between items-center bg-white/60 rounded-xl p-3">
                <span className="font-semibold flex items-center gap-2">
                  <span className="text-lg">💾</span>
                  Storage
                </span>
                <span className="font-bold text-gray-800">Local + Google Drive</span>
              </div>
            </div>
            
            <div className="text-center bg-gradient-warm rounded-xl p-4 text-white shadow-md">
              <p className="font-bold flex items-center justify-center gap-2">
                <span className="text-lg">❤️</span>
                Made with love for fitness enthusiasts
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-warm opacity-5 rounded-full -translate-y-4 translate-x-4"></div>
        </Card>
      </main>

    </div>
  );
}