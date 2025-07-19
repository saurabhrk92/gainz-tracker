import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';
import { authOptions } from '@/lib/auth/authOptions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Set up Google Drive client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth });

    // Ensure backup folder exists
    const folderId = await ensureBackupFolder(drive);
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and name contains 'gainz-backup'`,
      orderBy: 'createdTime desc',
      fields: 'files(id,name,createdTime)',
      pageSize: 10,
    });

    return NextResponse.json({ 
      success: true, 
      backups: response.data.files || [] 
    });
  } catch (error) {
    console.error('Failed to list backups:', error);
    return NextResponse.json({ 
      error: 'Failed to list backups' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { fileId } = await request.json();

    // Set up Google Drive client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth });

    await drive.files.delete({
      fileId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return NextResponse.json({ 
      error: 'Failed to delete backup' 
    }, { status: 500 });
  }
}

async function ensureBackupFolder(drive: any): Promise<string> {
  // Check if folder exists
  const response = await drive.files.list({
    q: "name='Gainz Tracker Backups' and mimeType='application/vnd.google-apps.folder'",
    fields: 'files(id,name)',
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  // Create folder if it doesn't exist
  const folderResponse = await drive.files.create({
    requestBody: {
      name: 'Gainz Tracker Backups',
      mimeType: 'application/vnd.google-apps.folder',
    },
  });

  return folderResponse.data.id;
}