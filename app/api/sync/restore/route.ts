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

    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');

    // Set up Google Drive client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth });

    if (fileId) {
      // Download specific backup
      const fileData = await drive.files.get({
        fileId,
        alt: 'media',
      });

      return NextResponse.json({ 
        success: true, 
        data: JSON.parse(fileData.data as string) 
      });
    } else {
      // Get latest backup
      const folderId = await ensureBackupFolder(drive);
      
      const response = await drive.files.list({
        q: `'${folderId}' in parents and name contains 'gainz-backup'`,
        orderBy: 'createdTime desc',
        pageSize: 1,
        fields: 'files(id)',
      });

      if (!response.data.files || response.data.files.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'No backups found' 
        }, { status: 404 });
      }

      const latestFileId = response.data.files[0].id;
      if (!latestFileId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid backup file' 
        }, { status: 404 });
      }
      
      const fileData = await drive.files.get({
        fileId: latestFileId,
        alt: 'media',
      });

      return NextResponse.json({ 
        success: true, 
        data: JSON.parse(fileData.data as string) 
      });
    }
  } catch (error) {
    console.error('Restore failed:', error);
    return NextResponse.json({ 
      error: 'Failed to restore backup' 
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