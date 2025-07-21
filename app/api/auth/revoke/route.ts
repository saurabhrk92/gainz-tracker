import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 });
    }

    // Revoke the token with Google
    const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${accessToken}`;
    
    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Token revoked successfully' });
    } else {
      // Even if revoke fails, we should continue with the flow
      console.log('Token revoke failed, but continuing');
      return NextResponse.json({ success: true, message: 'Proceeding with reconnect' });
    }
  } catch (error) {
    console.error('Error revoking token:', error);
    // Don't fail the whole flow if revoke fails
    return NextResponse.json({ success: true, message: 'Proceeding with reconnect' });
  }
}