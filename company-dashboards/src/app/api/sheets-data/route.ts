// import { NextRequest, NextResponse } from 'next/server';
// import { GoogleSpreadsheet } from 'google-spreadsheet';

// // Sheet configuration
// const SHEET_CONFIG = {
//   rma: {
//     gid: '1825921334',
//     name: 'RMA'
//   },
//   xbm: {
//     gid: '166966411',
//     name: 'XBM'
//   },
//   trade_in: {
//     gid: '1934446761',
//     name: 'Trade IN'
//   }
// };

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const dataType = searchParams.get('type');

//     if (!dataType) {
//       return NextResponse.json({ error: 'Data type is required' }, { status: 400 });
//     }

//     const config = (SHEET_CONFIG as any)[dataType];
//     if (!config) {
//       return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
//     }

//     const sheetId = process.env.MAIN_SHEET_ID;

//     // Validate environment variables
//     if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !sheetId) {
//       return NextResponse.json({
//         error: 'Missing environment variables',
//         details: 'Check GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and MAIN_SHEET_ID in .env.local'
//       }, { status: 500 });
//     }

//     console.log(`📊 Fetching ${config.name} data using v4.x API...`);

//     // Initialize Google Sheets - v4.x API
//     const doc = new GoogleSpreadsheet(sheetId);

//     // v4.x uses different authentication
//     await doc.useServiceAccountAuth({
//       client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//       private_key: process.env.GOOGLE_PRIVATE_KEY,
//     });

//     await doc.loadInfo();

//     // v4.x properties - use type assertions
//     const docAny = doc as any;
//     console.log(`📄 Loaded document: "${docAny.title}"`);

//     // Get the specific sheet by ID
//     const sheet = docAny.sheetsById[config.gid];
//     if (!sheet) {
//       console.log('Available sheets:', Object.keys(docAny.sheetsById));
//       return NextResponse.json({
//         error: `Sheet tab not found for ${config.name}`,
//         requestedGid: config.gid,
//         availableSheets: Object.keys(docAny.sheetsById).map((id: string) => ({
//           id,
//           title: docAny.sheetsById[id].title
//         }))
//       }, { status: 404 });
//     }

//     const sheetAny = sheet as any;
//     console.log(`✅ Found sheet: "${sheetAny.title}"`);

//     // Load all rows - v4.x API
//     const rows = await sheetAny.getRows();
//     console.log(`📊 Loaded ${rows.length} rows from "${sheetAny.title}"`);

//     // Get headers - v4.x approach
//     let headers: string[] = [];

//     if (rows.length > 0) {
//       const firstRow = rows[0] as any;

//       // Try to get headers from the row object
//       const rowData = firstRow.toObject ? firstRow.toObject() : firstRow;
//       headers = Object.keys(rowData).filter(key => !key.startsWith('_'));
//     }

//     console.log(`📋 Found ${headers.length} headers`);

//     // Process data - v4.x API
//     const data = rows.map((row: any, index: number) => {
//       const obj: any = { _rowIndex: index + 2 };

//       headers.forEach((header: string) => {
//         try {
//           let value = '';
//           const rowAny = row as any;

//           // v4.x method: use toObject()
//           if (typeof rowAny.toObject === 'function') {
//             const rowData = rowAny.toObject();
//             value = String(rowData[header] || '');
//           } else {
//             // Fallback: direct access
//             value = String(rowAny[header] || '');
//           }

//           obj[header] = value.trim();
//         } catch (error) {
//           obj[header] = '';
//         }
//       });

//       return obj;
//     });

//     console.log(`✅ Successfully processed ${data.length} rows for ${config.name}`);

//     return NextResponse.json({
//       success: true,
//       data: data,
//       headers: headers,
//       totalRows: data.length,
//       sheetTitle: sheetAny.title,
//       dataType: config.name,
//       documentTitle: docAny.title,
//       version: 'v4.x'
//     });

//   } catch (error: any) {
//     console.error('❌ Google Sheets API Error (v4.x):', error);

//     return NextResponse.json(
//       {
//         error: 'Failed to fetch sheet data via API',
//         message: error.message,
//         suggestion: 'Check if the sheet is shared with the service account email'
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

const SHEET_CONFIG = {
  rma: {
    gid: '1825921334',
    name: 'RMA'
  },
  xbm: {
    gid: '166966411',
    name: 'XBM'
  },
  trade_in: {
    gid: '1934446761',
    name: 'Trade IN'
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type');

    if (!dataType) {
      return NextResponse.json({ error: 'Data type is required' }, { status: 400 });
    }

    const config = (SHEET_CONFIG as any)[dataType];
    if (!config) {
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    const sheetId = process.env.MAIN_SHEET_ID;

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !sheetId) {
      return NextResponse.json({
        error: 'Missing environment variables'
      }, { status: 500 });
    }

    console.log(`📊 Fetching ${config.name} data using v4.x...`);

    // v4.x initialization
    const doc = new GoogleSpreadsheet(sheetId);

    // v4.x authentication
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();

    // v4.x properties with type assertions
    const docAny = doc as any;
    const sheet = docAny.sheetsById[config.gid];

    if (!sheet) {
      return NextResponse.json({
        error: `Sheet tab not found for ${config.name}`,
        requestedGid: config.gid,
        availableSheets: Object.keys(docAny.sheetsById).map(id => ({
          id,
          title: docAny.sheetsById[id].title
        }))
      }, { status: 404 });
    }

    const sheetAny = sheet as any;
    console.log(`✅ Found sheet: "${sheetAny.title}"`);

    // v4.x - get rows (headers are auto-loaded)
    const rows = await sheetAny.getRows();
    console.log(`📊 Loaded ${rows.length} rows from "${sheetAny.title}"`);

    // v4.x data processing - use toObject() method
    const data = rows.map((row: any, index: number) => {
      const obj: any = { _row: index + 2 };

      try {
        // v4.x method - use toObject() to get all fields
        const rowData = row.toObject();
        Object.keys(rowData).forEach(key => {
          if (!key.startsWith('_')) {
            obj[key] = String(rowData[key] || '').trim();
          }
        });
      } catch (error) {
        console.warn(`Error processing row ${index}:`, error);
        // Fallback: direct property access
        Object.keys(row).forEach(key => {
          if (!key.startsWith('_') && key !== 'toObject') {
            obj[key] = String(row[key] || '').trim();
          }
        });
      }

      return obj;
    });

    console.log(`✅ Successfully processed ${data.length} rows for ${config.name}`);

    return NextResponse.json({
      success: true,
      data: data,
      totalRows: data.length,
      sheetTitle: sheetAny.title,
      dataType: config.name,
      documentTitle: docAny.title,
      version: 'v4.x'
    });

  } catch (error: any) {
    console.error('❌ Google Sheets API Error (v4.x):', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch sheet data via API',
        message: error.message
      },
      { status: 500 }
    );
  }
}

