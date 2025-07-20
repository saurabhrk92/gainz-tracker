'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();

  const smartSignIn = () => {
    // For new users, this will get refresh token automatically with access_type=offline
    // For existing users without refresh token, we detect and handle appropriately
    signIn('google');
  };

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    accessToken: session?.accessToken,
    hasRefreshToken: !!session?.refreshToken,
    signIn: smartSignIn,
    signOut,
  };
}