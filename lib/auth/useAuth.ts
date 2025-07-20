'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();

  // Check for token refresh errors and handle re-authentication
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      console.log('Token refresh failed, signing out user');
      signOut({ callbackUrl: '/auth/signin' });
    }
  }, [session?.error]);

  return {
    user: session?.user,
    isAuthenticated: !!session && !session.error,
    isLoading: status === 'loading',
    accessToken: session?.accessToken,
    hasTokenError: session?.error === 'RefreshAccessTokenError',
    signIn: () => signIn('google'),
    signOut,
  };
}