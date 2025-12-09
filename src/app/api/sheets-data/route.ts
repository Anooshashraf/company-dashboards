// src/app/api/sheets-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

const SHEET_CONFIG = {
  rma: { gid: '1825921334', name: 'RMA' },
  xbm: { gid: '166966411', name: 'XBM' },
  trade_in: { gid: '1934446761', name: 'Trade IN' },
  market_managers: { gid: '147535632', name: 'Market Managers' }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type');

    if (!dataType || !SHEET_CONFIG[dataType as keyof typeof SHEET_CONFIG]) {
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    const config = SHEET_CONFIG[dataType as keyof typeof SHEET_CONFIG];
    const sheetId = process.env.MAIN_SHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!serviceAccountEmail || !rawPrivateKey || !sheetId) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
    }
    
    console.log(`📊 Fetching ${config.name} data...`);

    // Clean private key
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    const doc = new GoogleSpreadsheet(sheetId);

    await doc.useServiceAccountAuth({
      client_email: serviceAccountEmail,
      private_key: privateKey,
    });

    await doc.loadInfo();
    console.log('✅ Authentication successful');

    // Access sheets
    const docAny = doc as any;
    const sheet = docAny.sheetsById?.[config.gid];

    if (!sheet) {
      console.error(`❌ Sheet not found for GID: ${config.gid}`);
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    console.log(`✅ Found sheet: "${sheet.title}"`);

    const rows = await sheet.getRows();
    console.log(`📊 Loaded ${rows.length} rows`);

    // FIX: Handle both toObject() method and direct property access
    const data = rows.map((row: any, index: number) => {
      try {
        // Try toObject() method first
        if (typeof row.toObject === 'function') {
          return row.toObject();
        } else {
          // Fallback: direct property access
          const rowData: any = {};
          for (const key in row) {
            if (!key.startsWith('_') && typeof row[key] !== 'function') {
              rowData[key] = String(row[key] || '').trim();
            }
          }
          return rowData;
        }
      } catch (error) {
        console.warn(`⚠️ Error processing row ${index}:`, error);
        return { _row: index + 2, _error: 'Failed to process row' };
      }
    });

    console.log(`✅ Successfully processed ${data.length} rows for ${config.name}`);

    // Log first row for debugging
    if (data.length > 0) {
      console.log('📝 First row sample:', data[0]);
    }

    return NextResponse.json({
      success: true,
      data: data,
      totalRows: data.length,
      sheetTitle: sheet.title,
      dataType: config.name,
      version: 'v4.x'
    });

  } catch (error: any) {
    console.error('❌ API Error:', error.message);
    return NextResponse.json(
      {
        error: 'Failed to fetch data',
        message: error.message
      },
      { status: 500 }
    );
  }
}