'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { tokenStore } from './tokenStore';

export function useAuth() {
  const { data: session, status } = useSession();
  const [hasStoredTokens, setHasStoredTokens] = useState<boolean | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Check token status when session changes
  useEffect(() => {
    // Prevent sync loops
    if (syncInProgress) return;
    const checkTokenStatus = async () => {
      console.log('useAuth session check:', {
        hasSession: !!session,
        isNewSignIn: session?.isNewSignIn,
        hasStoredTokens: session?.hasStoredTokens,
        needsReconnect: session?.needsReconnect,
        hasEmail: !!session?.user?.email,
      });

      if (session?.user?.email) {
        try {
          setSyncInProgress(true);
          
          // Handle fresh sign-in with new tokens
          if (session.storeInIndexedDB) {
            console.log('Storing fresh tokens in IndexedDB');
            await tokenStore.saveTokens(
              session.user.email,
              session.storeInIndexedDB.accessToken,
              session.storeInIndexedDB.refreshToken,
              session.storeInIndexedDB.expiresIn
            );
            setHasStoredTokens(true);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('needs_token_refresh');
            }
            setSyncInProgress(false);
            return;
          }

          // First check IndexedDB (fast, local)
          const localTokens = await tokenStore.getTokens(session.user.email);
          
          if (localTokens?.refreshToken) {
            console.log('Found valid tokens in IndexedDB');
            setHasStoredTokens(true);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('needs_token_refresh');
            }
            setSyncInProgress(false);
            return;
          }

          console.log('No valid tokens in IndexedDB, checking KV...');
          
          // Only check KV if IndexedDB doesn't have tokens
          if (session.hasStoredTokens) {
            console.log('Session indicates tokens are stored in KV');
            
            // Sync from KV to IndexedDB for future use
            try {
              const response = await fetch('/api/auth/tokens/store');
              const data = await response.json();
              
              if (data.tokens?.refreshToken) {
                await tokenStore.saveTokens(
                  session.user.email,
                  data.tokens.accessToken,
                  data.tokens.refreshToken,
                  Math.floor((data.tokens.expiresAt - Date.now()) / 1000)
                );
                console.log('Synced tokens from KV to IndexedDB');
              }
            } catch (error) {
              console.log('Could not sync from KV, but session indicates tokens exist');
            }
            
            setHasStoredTokens(true);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('needs_token_refresh');
            }
            setSyncInProgress(false);
          } else if (session.needsReconnect) {
            console.log('Session indicates user needs to reconnect for refresh token');
            setHasStoredTokens(false);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('needs_token_refresh', 'true');
            }
            setSyncInProgress(false);
          } else {
            // Last resort: check KV directly
            try {
              const response = await fetch('/api/auth/tokens/store');
              const data = await response.json();
              
              if (data.tokens?.refreshToken) {
                console.log('Found tokens in KV store, syncing to IndexedDB');
                await tokenStore.saveTokens(
                  session.user.email,
                  data.tokens.accessToken,
                  data.tokens.refreshToken,
                  Math.floor((data.tokens.expiresAt - Date.now()) / 1000)
                );
                setHasStoredTokens(true);
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('needs_token_refresh');
                }
              } else {
                console.log('No tokens found in KV store');
                setHasStoredTokens(false);
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('needs_token_refresh', 'true');
                }
              }
            } catch (error) {
              console.error('Failed to check token status:', error);
              setHasStoredTokens(false);
            }
            setSyncInProgress(false);
          }
        } catch (error) {
          console.error('Error checking token status:', error);
          setHasStoredTokens(false);
          setSyncInProgress(false);
        }
      }
    };

    checkTokenStatus();
  }, [session]);

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    needsReconnect: typeof window !== 'undefined' ? sessionStorage.getItem('needs_token_refresh') === 'true' : false,
    signIn: () => signIn('google'),
    signOut: async () => {
      // Don't clear tokens from KV - keep them for next sign-in
      // Only clear the reconnect flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('needs_token_refresh');
      }
      signOut();
    },
    reconnect: async () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('needs_token_refresh');
        
        // Sign out first to clear session
        await signOut({ redirect: false });
        
        // Wait a moment for sign out to complete
        setTimeout(() => {
          // Sign in with forced consent to get new refresh token
          window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '167211687388-26j9ni8hktae4db78tkci9htlkne4vpn.apps.googleusercontent.com'}&` +
            `redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/callback/google')}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent('openid email profile https://www.googleapis.com/auth/drive.file')}&` +
            `access_type=offline&` +
            `prompt=consent&` +
            `state=${Math.random().toString(36).substring(7)}`;
        }, 500);
      }
    },
  };
}