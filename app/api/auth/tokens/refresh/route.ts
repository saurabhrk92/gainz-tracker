import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../../lib/auth/authOptions';
import { kvTokenStore } from '../../../../../lib/auth/kvTokenStore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const refreshedToken = await kvTokenStore.refreshAccessToken(session.user.email);
    
    if (!refreshedToken) {
      return NextResponse.json({ 
        error: 'Unable to refresh token. User may need to reconnect.',
        needsReconnect: true 
      }, { status: 401 });
    }

    return NextResponse.json({ 
      accessToken: refreshedToken,
      success: true 
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh token',
      needsReconnect: true 
    }, { status: 500 });
  }
}