import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
          access_type: 'offline',
          // Only prompt for consent if we don't have stored tokens
          prompt: 'select_account',
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
        console.log('New sign-in detected, checking tokens in KV');
        
        let hasValidTokens = false;
        
        // Only store tokens if we have a refresh token, or if no tokens exist yet
        if (account.access_token && user.email) {
          try {
            const { kvTokenStore } = await import('./kvTokenStore');
            
            // Check if we already have tokens
            const existingTokens = await kvTokenStore.getTokens(user.email);
            
            if (account.refresh_token) {
              // We have a refresh token - store it
              await kvTokenStore.saveTokens(
                user.email,
                account.access_token,
                account.refresh_token,
                account.expires_in || 3600
              );
              console.log('Tokens with refresh token stored in Vercel KV successfully');
              hasValidTokens = true;
            } else if (existingTokens?.refreshToken) {
              // No refresh token from Google, but we have existing ones - keep them
              console.log('No refresh token from Google, but existing tokens found in KV - keeping existing');
              hasValidTokens = true;
            } else {
              // No refresh token and no existing tokens
              console.log('No refresh token available and no existing tokens');
              hasValidTokens = false;
            }
          } catch (error) {
            console.error('Failed to handle tokens in KV:', error);
            hasValidTokens = false;
          }
        }

        const newToken = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          },
          hasStoredTokens: hasValidTokens,
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
        hasStoredTokens: token.hasStoredTokens,
        token: token
      });

      // Pass user info and sign-in status to client
      session.user = token.user;
      session.isNewSignIn = token.isNewSignIn || false;
      session.hasStoredTokens = token.hasStoredTokens || false;
      
      // Check if user needs to reconnect (no stored tokens)
      if (!token.hasStoredTokens && !token.isNewSignIn) {
        session.needsReconnect = true;
      }
      
      console.log('Final session object:', session);
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};