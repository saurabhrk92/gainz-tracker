import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { createAuthenticatedDriveClient } from '@/lib/auth/tokenRefresh';

export async function GET(request: NextRequest) {
  try {
    console.log('Restore endpoint called');
    const session = await getServerSession(authOptions);
    console.log('Session exists:', !!session);
    console.log('Access token exists:', !!session?.accessToken);
    
    if (!session?.accessToken) {
      console.log('No access token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    console.log('File ID requested:', fileId);

    // Set up Google Drive client - use refresh if available, otherwise fallback to simple auth
    console.log('Setting up Google Drive client');
    let drive;
    if (session.refreshToken) {
      const { drive: refreshDrive } = await createAuthenticatedDriveClient({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      drive = refreshDrive;
    } else {
      // Fallback to simple auth without refresh
      const { google } = await import('googleapis');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: session.accessToken });
      drive = google.drive({ version: 'v3', auth });
    }

    if (fileId) {
      // Read specific backup content
      console.log('Reading specific backup file:', fileId);
      const fileData = await drive.files.get({
        fileId,
        alt: 'media',
      });

      // The response should be readable stream, let's convert it properly
      let content = '';
      if (typeof fileData.data === 'string') {
        content = fileData.data;
      } else if (fileData.data && typeof fileData.data === 'object') {
        content = JSON.stringify(fileData.data);
      }
      
      console.log('File content length:', content.length);
      
      return NextResponse.json({ 
        success: true, 
        data: JSON.parse(content) 
      });
    } else {
      // Get latest backup
      console.log('Getting latest backup');
      const folderId = await ensureBackupFolder(drive);
      console.log('Backup folder ID:', folderId);
      
      const response = await drive.files.list({
        q: `'${folderId}' in parents and name contains 'gainz-backup'`,
        orderBy: 'createdTime desc',
        pageSize: 1,
        fields: 'files(id)',
      });
      console.log('Files found:', response.data.files?.length || 0);

      if (!response.data.files || response.data.files.length === 0) {
        console.log('No backups found in Drive');
        return NextResponse.json({ 
          success: false, 
          error: 'No backups found' 
        }, { status: 404 });
      }

      const latestFileId = response.data.files[0].id;
      console.log('Latest file ID:', latestFileId);
      if (!latestFileId) {
        console.log('Invalid backup file ID');
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid backup file' 
        }, { status: 404 });
      }
      
      console.log('Reading backup file content');
      const fileData = await drive.files.get({
        fileId: latestFileId,
        alt: 'media',
      });
      console.log('File read successfully');

      // The response should be readable stream, let's convert it properly
      let content = '';
      if (typeof fileData.data === 'string') {
        content = fileData.data;
      } else if (fileData.data && typeof fileData.data === 'object') {
        content = JSON.stringify(fileData.data);
      }
      
      console.log('File content length:', content.length);

      return NextResponse.json({ 
        success: true, 
        data: JSON.parse(content) 
      });
    }
  } catch (error) {
    console.error('Restore failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      response: error && typeof error === 'object' && 'response' in error ? error.response : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to restore backup',
      details: error instanceof Error ? error.message : 'Unknown error'
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