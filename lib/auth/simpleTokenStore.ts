// Simplified token storage that works with Google's limitations
'use client';

interface StoredTokens {
  accessToken: string;
  expiresAt: number;
  lastRefresh: number;
}

class SimpleTokenStore {
  private readonly STORAGE_KEY = 'gainz_google_tokens';

  async saveTokens(email: string, accessToken: string, expiresIn: number = 3600) {
    if (typeof window === 'undefined') return;
    
    const tokens: StoredTokens = {
      accessToken,
      expiresAt: Date.now() + (expiresIn * 1000),
      lastRefresh: Date.now()
    };
    
    localStorage.setItem(`${this.STORAGE_KEY}_${email}`, JSON.stringify(tokens));
  }

  async getTokens(email: string): Promise<StoredTokens | null> {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(`${this.STORAGE_KEY}_${email}`);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  async removeTokens(email: string) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${this.STORAGE_KEY}_${email}`);
  }

  isTokenExpired(tokens: StoredTokens): boolean {
    // Add 5 minute buffer
    return tokens.expiresAt < (Date.now() + 5 * 60 * 1000);
  }
}

export const simpleTokenStore = new SimpleTokenStore();