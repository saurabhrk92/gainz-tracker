import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    isNewSignIn?: boolean;
    needsTokenStorage?: boolean;
    needsReconnect?: boolean;
    hasStoredTokens?: boolean;
    tokens?: {
      accessToken: string;
      refreshToken?: string;
      expiresAt: number;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    error?: string;
    isNewSignIn?: boolean;
    hasStoredTokens?: boolean;
    expiresAt?: number;
  }
}