'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();
  const [hasStoredTokens, setHasStoredTokens] = useState<boolean | null>(null);

  // Check token status when session changes
  useEffect(() => {
    const checkTokenStatus = async () => {
      console.log('useAuth session check:', {
        hasSession: !!session,
        isNewSignIn: session?.isNewSignIn,
        hasStoredTokens: session?.hasStoredTokens,
        needsReconnect: session?.needsReconnect,
        hasEmail: !!session?.user?.email,
      });

      if (session?.user?.email) {
        if (session.hasStoredTokens) {
          console.log('Session indicates tokens are stored in KV');
          setHasStoredTokens(true);
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('needs_token_refresh');
          }
        } else if (session.needsReconnect) {
          console.log('Session indicates user needs to reconnect for refresh token');
          setHasStoredTokens(false);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('needs_token_refresh', 'true');
          }
        } else {
          // Check server-side token status
          try {
            const response = await fetch('/api/auth/tokens/store');
            const data = await response.json();
            
            if (data.tokens) {
              console.log('Found tokens in KV store');
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