// Client-side token store using IndexedDB
// Stores OAuth tokens in user's browser for offline-first architecture
import { UserTokens } from '../types';

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

class TokenStore {
  private async getDB() {
    // Dynamic import to avoid SSR issues
    const { getDB } = await import('../storage/indexedDB');
    return getDB();
  }

  async saveTokens(userId: string, accessToken: string, refreshToken?: string, expiresIn: number = 3600): Promise<void> {
    try {
      const db = await this.getDB();
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      const tokens: UserTokens = {
        userId,
        accessToken,
        refreshToken,
        expiresAt,
        lastUpdated: new Date()
      };
      
      await db.saveUserTokens(tokens);
      console.log('Tokens saved to IndexedDB for user:', userId);
    } catch (error) {
      console.error('Failed to save tokens to IndexedDB:', error);
      throw error;
    }
  }

  async getTokens(userId: string): Promise<TokenData | null> {
    try {
      const db = await this.getDB();
      const userTokens = await db.getUserTokens(userId);
      
      if (!userTokens) {
        return null;
      }
      
      return {
        accessToken: userTokens.accessToken,
        refreshToken: userTokens.refreshToken,
        expiresAt: userTokens.expiresAt
      };
    } catch (error) {
      console.error('Failed to get tokens from IndexedDB:', error);
      return null;
    }
  }

  async updateAccessToken(userId: string, accessToken: string, expiresIn: number = 3600): Promise<void> {
    try {
      const db = await this.getDB();
      const expiresAt = Date.now() + (expiresIn * 1000);
      
      await db.updateUserTokens(userId, {
        accessToken,
        expiresAt
      });
      
      console.log('Access token updated in IndexedDB for user:', userId);
    } catch (error) {
      console.error('Failed to update access token in IndexedDB:', error);
      throw error;
    }
  }

  async removeTokens(userId: string): Promise<void> {
    try {
      const db = await this.getDB();
      await db.removeUserTokens(userId);
      console.log('Tokens removed from IndexedDB for user:', userId);
    } catch (error) {
      console.error('Failed to remove tokens from IndexedDB:', error);
      throw error;
    }
  }
}

// Singleton instance
export const tokenStore = new TokenStore();