import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { getGoogleAuth, getDriveClient } from '@/lib/google-auth';

export async function GET(request) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    
    const auth = getGoogleAuth(session.accessToken);
    const drive = getDriveClient(auth);
    
    // Query for Excel files
    let query = "mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.google-apps.spreadsheet'";
    if (folderId) {
      query = `'${folderId}' in parents and (${query})`;
    }
    
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, modifiedTime, parents)',
      orderBy: 'modifiedTime desc',
    });
    
    return NextResponse.json({ files: response.data.files });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}