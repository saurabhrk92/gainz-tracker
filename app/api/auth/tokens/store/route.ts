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

    const { accessToken, refreshToken, expiresIn } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    await kvTokenStore.saveTokens(
      session.user.email,
      accessToken,
      refreshToken,
      expiresIn || 3600
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing tokens:', error);
    return NextResponse.json({ error: 'Failed to store tokens' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tokens = await kvTokenStore.getTokens(session.user.email);
    
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Error retrieving tokens:', error);
    return NextResponse.json({ error: 'Failed to retrieve tokens' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await kvTokenStore.removeTokens(session.user.email);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing tokens:', error);
    return NextResponse.json({ error: 'Failed to remove tokens' }, { status: 500 });
  }
}