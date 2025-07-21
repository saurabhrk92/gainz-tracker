'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { tokenStore } from './tokenStore';

export function useAuth() {
  const { data: session, status } = useSession();
  const [hasStoredTokens, setHasStoredTokens] = useState<boolean | null>(null);

  // Handle storing tokens when they're available
  useEffect(() => {
    const storeTokensOnSignIn = async () => {
      console.log('useAuth session check:', {
        hasSession: !!session,
        isNewSignIn: session?.isNewSignIn,
        needsTokenStorage: session?.needsTokenStorage,
        hasTokens: !!session?.tokens,
        hasEmail: !!session?.user?.email,
        session: session
      });

      if (session?.tokens && session?.user?.email) {
        try {
          // Check if tokens are already stored
          const existingTokens = await tokenStore.getTokens(session.user.email);
          
          if (!existingTokens) {
            console.log('Storing tokens for user:', session.user.email);
            console.log('Tokens to store:', session.tokens);
            await tokenStore.saveTokens(
              session.user.email,
              session.tokens.accessToken,
              session.tokens.refreshToken,
              Math.floor((session.tokens.expiresAt - Date.now()) / 1000)
            );
            console.log('Tokens stored successfully in IndexedDB');
            setHasStoredTokens(true);
            sessionStorage.removeItem('needs_token_refresh');
          } else {
            console.log('Tokens already exist for user');
            setHasStoredTokens(true);
            sessionStorage.removeItem('needs_token_refresh');
          }
        } catch (error) {
          console.error('Failed to store tokens in IndexedDB:', error);
          setHasStoredTokens(false);
        }
      } else if (session?.user?.email && !session?.tokens) {
        // Check if we have tokens in IndexedDB for existing session without tokens
        try {
          const existingTokens = await tokenStore.getTokens(session.user.email);
          if (!existingTokens) {
            console.log('No tokens found for existing user - they need to reconnect to enable cloud features');
            sessionStorage.setItem('needs_token_refresh', 'true');
            setHasStoredTokens(false);
          } else {
            console.log('Found existing tokens for user');
            sessionStorage.removeItem('needs_token_refresh');
            setHasStoredTokens(true);
          }
        } catch (error) {
          console.error('Failed to check existing tokens:', error);
          setHasStoredTokens(false);
        }
      }
    };

    storeTokensOnSignIn();
  }, [session]);

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    needsReconnect: sessionStorage.getItem('needs_token_refresh') === 'true',
    signIn: () => signIn('google'),
    signOut: () => {
      // Clear tokens from IndexedDB on sign out
      if (session?.user?.email) {
        tokenStore.removeTokens(session.user.email).catch(console.error);
      }
      // Clear the reconnect flag
      sessionStorage.removeItem('needs_token_refresh');
      signOut();
    },
    reconnect: () => {
      // Force sign out and back in to get fresh tokens
      sessionStorage.removeItem('needs_token_refresh');
      signOut().then(() => {
        // After sign out, automatically trigger sign in
        setTimeout(() => signIn('google'), 100);
      });
    },
  };
}