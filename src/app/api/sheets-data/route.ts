// // src/app/api/sheets-data/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { GoogleSpreadsheet } from 'google-spreadsheet';

// const SHEET_CONFIG = {
//   rma: { gid: '1825921334', name: 'RMA' },
//   xbm: { gid: '166966411', name: 'XBM' },
//   trade_in: { gid: '1934446761', name: 'Trade IN' },
//   market_managers: { gid: '147535632', name: 'Market Managers' }
// };

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const dataType = searchParams.get('type');

//     if (!dataType || !SHEET_CONFIG[dataType as keyof typeof SHEET_CONFIG]) {
//       return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
//     }

//     const config = SHEET_CONFIG[dataType as keyof typeof SHEET_CONFIG];
//     const sheetId = process.env.MAIN_SHEET_ID;
//     const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
//     const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

//     if (!serviceAccountEmail || !rawPrivateKey || !sheetId) {
//       return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
//     }
    
//     console.log(`📊 Fetching ${config.name} data...`);

//     // Clean private key
//     const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

//     const doc = new GoogleSpreadsheet(sheetId);

//     await doc.useServiceAccountAuth({
//       client_email: serviceAccountEmail,
//       private_key: privateKey,
//     });

//     await doc.loadInfo();
//     console.log('✅ Authentication successful');

//     // Access sheets
//     const docAny = doc as any;
//     const sheet = docAny.sheetsById?.[config.gid];

//     if (!sheet) {
//       console.error(`❌ Sheet not found for GID: ${config.gid}`);
//       return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
//     }

//     console.log(`✅ Found sheet: "${sheet.title}"`);

//     const rows = await sheet.getRows();
//     console.log(`📊 Loaded ${rows.length} rows`);

//     // FIX: Handle both toObject() method and direct property access
//     const data = rows.map((row: any, index: number) => {
//       try {
//         // Try toObject() method first
//         if (typeof row.toObject === 'function') {
//           return row.toObject();
//         } else {
//           // Fallback: direct property access
//           const rowData: any = {};
//           for (const key in row) {
//             if (!key.startsWith('_') && typeof row[key] !== 'function') {
//               rowData[key] = String(row[key] || '').trim();
//             }
//           }
//           return rowData;
//         }
//       } catch (error) {
//         console.warn(`⚠️ Error processing row ${index}:`, error);
//         return { _row: index + 2, _error: 'Failed to process row' };
//       }
//     });

//     console.log(`✅ Successfully processed ${data.length} rows for ${config.name}`);

//     // Log first row for debugging
//     if (data.length > 0) {
//       console.log('📝 First row sample:', data[0]);
//     }

//     return NextResponse.json({
//       success: true,
//       data: data,
//       totalRows: data.length,
//       sheetTitle: sheet.title,
//       dataType: config.name,
//       version: 'v4.x'
//     });

//   } catch (error: any) {
//     console.error('❌ API Error:', error.message);
//     return NextResponse.json(
//       {
//         error: 'Failed to fetch data',
//         message: error.message
//       },
//       { status: 500 }
//     );
//   }
// }

// src/app/api/sheets-data/route.ts - COMPATIBLE WITH v3.3.0
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
    console.log('🚀 Sheets Data API - Google Spreadsheet v3.3.0');
    
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type');

    if (!dataType || !SHEET_CONFIG[dataType as keyof typeof SHEET_CONFIG]) {
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    const config = SHEET_CONFIG[dataType as keyof typeof SHEET_CONFIG];
    const sheetId = process.env.MAIN_SHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

    console.log('🔐 Credentials check:', {
      hasSheetId: !!sheetId,
      hasEmail: !!serviceAccountEmail,
      hasKey: !!rawPrivateKey,
      dataType,
      config
    });

    if (!serviceAccountEmail || !rawPrivateKey || !sheetId) {
      console.error('❌ Missing credentials');
      return NextResponse.json({ 
        error: 'Missing credentials',
        details: {
          hasEmail: !!serviceAccountEmail,
          hasKey: !!rawPrivateKey,
          hasSheetId: !!sheetId
        }
      }, { status: 500 });
    }
    
    console.log(`📊 Fetching ${config.name} data (GID: ${config.gid})...`);

    // Clean private key - Vercel specific fix
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    console.log('🔑 Private key cleaned, length:', privateKey.length);

    const doc = new GoogleSpreadsheet(sheetId);

    await doc.useServiceAccountAuth({
      client_email: serviceAccountEmail,
      private_key: privateKey,
    });

    console.log('✅ Authentication successful');

    await doc.loadInfo();
    
    
    // Access the specific sheet by GID
    // In v3.3.0, we need to find the sheet differently
    let sheet = null;
    
    // Method 1: Try sheetsById (common in v3)
    if ('sheetsById' in doc && typeof doc.sheetsById === 'object') {
      sheet = (doc as any).sheetsById[config.gid];
    }
    
    // Method 2: Find by title if GID doesn't work
    if (!sheet && 'sheetsByTitle' in doc && typeof doc.sheetsByTitle === 'object') {
      // Try to find by config name
      const sheetTitle = config.name;
      sheet = (doc as any).sheetsByTitle[sheetTitle];
      
      if (!sheet) {
        // Try to find any sheet that matches
        const allSheets = Object.values((doc as any).sheetsByTitle || {});
        sheet = allSheets.find((s: any) => s?.title?.includes(config.name));
      }
    }
    
    // Method 3: Try sheetsByIndex
    if (!sheet && 'sheetsByIndex' in doc && Array.isArray(doc.sheetsByIndex)) {
      // Search all sheets for matching GID
      for (const s of doc.sheetsByIndex) {
        const sheetAny = s as any;
        if (sheetAny._properties?.sheetId === parseInt(config.gid) || 
            sheetAny._properties?.sheetId?.toString() === config.gid) {
          sheet = s;
          break;
        }
      }
    }

    if (!sheet) {
      console.error(`❌ Sheet not found for GID: ${config.gid}`);
      console.error('Available sheets:');
      if ('sheetsByIndex' in doc && Array.isArray(doc.sheetsByIndex)) {
        doc.sheetsByIndex.forEach((s: any, i: number) => {
          console.log(`  ${i}: "${s.title}" (ID: ${s._properties?.sheetId})`);
        });
      }
      return NextResponse.json({ 
        error: 'Sheet not found',
        requestedGid: config.gid,
        sheetName: config.name
      }, { status: 404 });
    }

    console.log(`✅ Found sheet: "${sheet.title}" (ID: ${(sheet as any)._properties?.sheetId})`);
    
    // In v3.3.0, loadHeaderRow might not exist or work differently
    let headers: string[] = [];
    try {
      // Try to load headers if method exists
      if (typeof (sheet as any).loadHeaderRow === 'function') {
        await (sheet as any).loadHeaderRow();
        headers = (sheet as any).headerValues || [];
      }
    } catch (headerError) {
      console.warn('⚠️ Could not load headers:', headerError);
    }
    
    console.log(`📋 Headers loaded: ${headers.length}`);

    const rows = await sheet.getRows();
    console.log(`📊 Loaded ${rows.length} rows`);
    
    // DEBUG: Check first row structure in v3.3.0
    if (rows.length > 0) {
      const firstRow = rows[0];
      console.log('🔍 First row in v3.3.0:', {
        hasToObject: typeof firstRow?.toObject === 'function',
        hasGet: typeof firstRow?.get === 'function',
        hasRawData: !!firstRow?._rawData,
        keys: Object.keys(firstRow || {}).filter(k => !k.startsWith('_')),
        rowNumber: firstRow?._rowNumber,
        isRowObject: firstRow?.constructor?.name
      });
      
      // Test toObject() specifically
      if (typeof firstRow?.toObject === 'function') {
        try {
          const testObj = firstRow.toObject();
          console.log('✅ toObject() works, returns keys:', Object.keys(testObj));
        } catch (toObjectError) {
          console.error('❌ toObject() failed:', toObjectError);
        }
      }
    }

    // Process rows - v3.3.0 COMPATIBLE
    const data = rows.map((row: any, index: number) => {
      try {
        // PRIMARY METHOD: Use toObject() - should work in v3.3.0
        if (typeof row.toObject === 'function') {
          return row.toObject();
        }
        
        // FALLBACK 1: Build object from headers using get()
        if (typeof row.get === 'function' && headers.length > 0) {
          const obj: any = {};
          headers.forEach(header => {
            obj[header] = row.get(header) || '';
          });
          return obj;
        }
        
        // FALLBACK 2: Use _rawData with headers
        if (row._rawData && Array.isArray(row._rawData) && headers.length > 0) {
          const obj: any = {};
          headers.forEach((header, idx) => {
            obj[header] = row._rawData[idx] || '';
          });
          return obj;
        }
        
        // FALLBACK 3: Dynamic property discovery
        const obj: any = {};
        for (const key in row) {
          if (!key.startsWith('_') && 
              key !== 'save' && 
              key !== 'delete' && 
              key !== 'toObject' && 
              key !== 'get') {
            const value = row[key];
            if (value !== undefined && value !== null) {
              obj[key] = String(value).trim();
            }
          }
        }
        
        // Add metadata if empty
        if (Object.keys(obj).length === 0) {
          obj._rowIndex = index + 2;
          obj._warning = 'Row processed with limited data';
        }
        
        return obj;
        
      } catch (error) {
        console.error(`❌ Error processing row ${index}:`, error);
        return {
          _rowIndex: index + 2,
          _error: 'Failed to process row',
          _errorDetails: String(error)
        };
      }
    });

    console.log(`✅ Successfully processed ${data.length} rows for ${config.name}`);
    
    // Filter out error rows
    const validData = data.filter((row: any) => !row._error);
    const errorRows = data.filter((row: any) => row._error);
    
    if (errorRows.length > 0) {
      console.warn(`⚠️ ${errorRows.length} rows had processing errors`);
    }

    // Log success info
    if (validData.length > 0) {
      console.log('📝 First valid row keys:', Object.keys(validData[0]));
      console.log('📝 Sample data:', JSON.stringify(validData[0]).substring(0, 200) + '...');
    }

    return NextResponse.json({
      success: true,
      data: validData,
      metadata: {
        sheetTitle: sheet.title,
        dataType: config.name,
        totalRows: validData.length,
        errorRows: errorRows.length,
        headers: headers,
        version: 'google-spreadsheet@3.3.0',
        processedAt: new Date().toISOString(),
        environment: process.env.NODE_ENV
      }
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sheet data',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        version: 'google-spreadsheet@3.3.0'
      },
      { status: 500 }
    );
  }
}