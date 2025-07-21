// Server-side token storage using Vercel KV
import { kv } from '@vercel/kv';

interface StoredTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  lastUpdated: number;
}

export class KVTokenStore {
  private getKey(email: string): string {
    return `tokens:${email}`;
  }

  async saveTokens(email: string, accessToken: string, refreshToken?: string, expiresIn: number = 3600): Promise<void> {
    try {
      const key = this.getKey(email);
      const tokens: StoredTokens = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (expiresIn * 1000),
        lastUpdated: Date.now()
      };

      await kv.set(key, tokens);
      console.log('Tokens saved to Vercel KV for user:', email);
    } catch (error) {
      console.warn('KV not available - skipping token storage:', error);
    }
  }

  async getTokens(email: string): Promise<StoredTokens | null> {
    try {
      const key = this.getKey(email);
      const tokens = await kv.get<StoredTokens>(key);
      
      if (!tokens) {
        console.log('No tokens found in Vercel KV for user:', email);
        return null;
      }

      return tokens;
    } catch (error) {
      console.warn('KV not available - returning null tokens:', error);
      return null;
    }
  }

  async updateAccessToken(email: string, accessToken: string, expiresIn: number = 3600): Promise<void> {
    try {
      const key = this.getKey(email);
      const existingTokens = await kv.get<StoredTokens>(key);
      
      if (!existingTokens) {
        throw new Error('No existing tokens found to update');
      }

      const updatedTokens: StoredTokens = {
        ...existingTokens,
        accessToken,
        expiresAt: Date.now() + (expiresIn * 1000),
        lastUpdated: Date.now()
      };

      await kv.set(key, updatedTokens);
      console.log('Access token updated in Vercel KV for user:', email);
    } catch (error) {
      console.warn('KV not available - skipping token update:', error);
    }
  }

  async removeTokens(email: string): Promise<void> {
    try {
      const key = this.getKey(email);
      await kv.del(key);
      console.log('Tokens removed from Vercel KV for user:', email);
    } catch (error) {
      console.warn('KV not available - skipping token removal:', error);
    }
  }

  async hasValidTokens(email: string): Promise<boolean> {
    try {
      const tokens = await this.getTokens(email);
      if (!tokens) return false;
      
      // Check if access token is still valid (with 5 minute buffer)
      const bufferTime = 5 * 60 * 1000;
      return tokens.expiresAt > (Date.now() + bufferTime);
    } catch (error) {
      console.warn('KV not available - returning false for hasValidTokens:', error);
      return false;
    }
  }

  async refreshAccessToken(email: string): Promise<string | null> {
    try {
      const tokens = await this.getTokens(email);
      if (!tokens?.refreshToken) {
        console.log('No refresh token available for user:', email);
        return null;
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: tokens.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        console.error('Failed to refresh token:', await response.text());
        return null;
      }

      const data = await response.json();
      
      // Update stored access token
      await this.updateAccessToken(email, data.access_token, data.expires_in);
      
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return null;
    }
  }
}

export const kvTokenStore = new KVTokenStore();