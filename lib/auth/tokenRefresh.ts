import { google } from 'googleapis';

export interface SessionToken {
  accessToken: string;
  refreshToken: string;
  error?: string;
}

export async function createAuthenticatedDriveClient(session: SessionToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!
  );

  // Set initial credentials
  auth.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });

  // Set up automatic token refresh
  auth.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // Update session with new tokens (this happens automatically with googleapis)
      console.log('Tokens refreshed automatically');
    }
  });

  const drive = google.drive({ version: 'v3', auth });
  
  return { drive, auth };
}

export async function refreshAccessTokenIfNeeded(session: SessionToken): Promise<SessionToken> {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    );

    auth.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });

    // Try to refresh the token
    const { credentials } = await auth.refreshAccessToken();
    
    return {
      accessToken: credentials.access_token || session.accessToken,
      refreshToken: credentials.refresh_token || session.refreshToken,
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    return {
      ...session,
      error: 'RefreshAccessTokenError',
    };
  }
}