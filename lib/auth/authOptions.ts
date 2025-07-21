import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
          access_type: 'offline', // Important: get refresh token
          prompt: 'consent', // Force consent to get refresh token
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }: any) {
      console.log('authOptions JWT callback:', {
        hasAccount: !!account,
        hasUser: !!user,
        tokenIsNewSignIn: token.isNewSignIn,
        accountTokens: account ? {
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          expiresIn: account.expires_in
        } : null
      });

      // Initial sign in
      if (account && user) {
        console.log('New sign-in detected, creating JWT with tokens');
        const newToken = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          },
          // Include tokens for initial setup
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: Date.now() + ((account.expires_in || 3600) * 1000),
          isNewSignIn: true,
        };
        console.log('Created new JWT token:', newToken);
        return newToken;
      }
      
      // Mark subsequent requests as not new sign-in
      if (token.isNewSignIn) {
        console.log('Marking token as not new sign-in');
        token.isNewSignIn = false;
      }
      
      return token;
    },
    async session({ session, token }: any) {
      console.log('authOptions session callback:', {
        tokenIsNewSignIn: token.isNewSignIn,
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        token: token
      });

      // Pass user info and sign-in status to client
      session.user = token.user;
      session.isNewSignIn = token.isNewSignIn || false;
      
      // Always pass tokens if they exist so client can store them
      if (token.accessToken && token.refreshToken) {
        console.log('Including tokens in session');
        session.tokens = {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
        };
        // Mark as needs storage if we have tokens
        session.needsTokenStorage = true;
      }
      
      console.log('Final session object:', session);
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};