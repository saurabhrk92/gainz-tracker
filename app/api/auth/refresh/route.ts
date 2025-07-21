import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
    }

    const url = 'https://oauth2.googleapis.com/token';
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      method: 'POST',
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('Token refresh failed:', refreshedTokens);
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
    }

    return NextResponse.json({
      access_token: refreshedTokens.access_token,
      expires_in: refreshedTokens.expires_in || 3600,
    });
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}