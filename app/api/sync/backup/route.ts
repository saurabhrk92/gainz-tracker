import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';
import { authOptions } from '@/lib/auth/authOptions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data } = await request.json();

    // Set up Google Drive client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth });

    // Ensure backup folder exists
    const folderId = await ensureBackupFolder(drive);

    // Create backup file
    const fileName = `gainz-backup-${new Date().toISOString()}.json`;
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data,
    };

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json',
      },
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(backupData, null, 2),
      },
    });

    return NextResponse.json({ 
      success: true, 
      fileId: response.data.id,
      fileName 
    });
  } catch (error) {
    console.error('Backup failed:', error);
    return NextResponse.json({ 
      error: 'Failed to create backup' 
    }, { status: 500 });
  }
}

async function ensureBackupFolder(drive: any): Promise<string> {
  try {
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
  } catch (error) {
    console.error('Failed to ensure backup folder:', error);
    throw new Error('Failed to create backup folder in Google Drive');
  }
}