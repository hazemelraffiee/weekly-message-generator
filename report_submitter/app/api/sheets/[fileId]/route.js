import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { getGoogleAuth, getSheetsClient } from '@/lib/google-auth';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { fileId } = params;
    const auth = getGoogleAuth(session.accessToken);
    const sheets = getSheetsClient(auth);
    
    // Get spreadsheet metadata
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: fileId,
    });
    
    // Get all sheets data
    const sheetsData = {};
    
    for (const sheet of metadata.data.sheets) {
      const sheetName = sheet.properties.title;
      const range = `${sheetName}!A1:ZZ1000`; // Adjust range as needed
      
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: fileId,
          range: range,
        });
        
        sheetsData[sheetName] = response.data.values || [];
      } catch (error) {
        console.error(`Error reading sheet ${sheetName}:`, error);
        sheetsData[sheetName] = [];
      }
    }
    
    return NextResponse.json({
      metadata: {
        title: metadata.data.properties.title,
        sheets: metadata.data.sheets.map(s => s.properties.title),
      },
      data: sheetsData,
    });
  } catch (error) {
    console.error('Error reading spreadsheet:', error);
    return NextResponse.json(
      { error: 'Failed to read spreadsheet' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { fileId } = params;
    const body = await request.json();
    const { updates } = body; // Array of { range, values } objects
    
    const auth = getGoogleAuth(session.accessToken);
    const sheets = getSheetsClient(auth);
    
    // Batch update
    const response = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: fileId,
      requestBody: {
        data: updates.map(update => ({
          range: update.range,
          values: update.values,
        })),
        valueInputOption: 'USER_ENTERED',
      },
    });
    
    return NextResponse.json({
      success: true,
      updatedCells: response.data.totalUpdatedCells,
    });
  } catch (error) {
    console.error('Error updating spreadsheet:', error);
    return NextResponse.json(
      { error: 'Failed to update spreadsheet' },
      { status: 500 }
    );
  }
}