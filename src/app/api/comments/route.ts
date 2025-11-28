import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { recordType, recordIdentifier, customerImei, dmComments, boComments } = body;

        if (!recordType || !recordIdentifier) {
            return NextResponse.json({ error: 'Record type and identifier are required' }, { status: 400 });
        }

        const sheetId = process.env.MAIN_SHEET_ID;

        const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const hasKey = !!process.env.GOOGLE_PRIVATE_KEY || !!process.env.GOOGLE_PRIVATE_KEY_BASE64;
        const hasSheet = !!sheetId;

        if (!hasEmail || !hasKey || !hasSheet) {
            return NextResponse.json({
                error: 'Missing environment variables',
                diagnostics: { hasEmail, hasKey, hasSheet }
            }, { status: 500 });
        }

        console.log(`📝 Updating comments for ${recordType}: ${recordIdentifier}`);

        const doc = new GoogleSpreadsheet(sheetId);

        // Accept either a base64 private key or a raw one using escaped newlines
        let privateKey = '';
        if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
            try {
                privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
            } catch (err) {
                console.error('❌ Failed to decode GOOGLE_PRIVATE_KEY_BASE64 (comments):', (err as any)?.message || err);
                return NextResponse.json({ error: 'Invalid base64 private key' }, { status: 500 });
            }
        } else {
            privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
            if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
                privateKey = privateKey.slice(1, -1);
            }
            privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
        }

        console.log('🔐 Comments: private key present:', !!privateKey, 'len:', privateKey.length, 'hasHeader:', privateKey.includes('-----BEGIN'));

        if (!privateKey.includes('-----BEGIN') || !privateKey.includes('-----END')) {
            return NextResponse.json({ error: 'Invalid private key format. Expected PEM.' }, { status: 500 });
        }

        const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL as string;

        try {
            await doc.useServiceAccountAuth({
                client_email: serviceEmail,
                private_key: privateKey,
            });
        } catch (authError: any) {
            console.error('❌ Google auth failure (comments):', authError?.message || authError);
            return NextResponse.json({ error: 'Google auth failure', message: authError?.message || String(authError) }, { status: 500 });
        }

        await doc.loadInfo();

        // Determine which sheet to update based on record type
        let sheetGid = '';
        switch (recordType) {
            case 'RMA':
                sheetGid = '1825921334';
                break;
            case 'XBM':
                sheetGid = '166966411';
                break;
            case 'TRADE_IN':
                sheetGid = '1934446761';
                break;
            default:
                return NextResponse.json({ error: 'Invalid record type' }, { status: 400 });
        }

        const docAny = doc as any;
        const sheet = docAny.sheetsById[sheetGid];

        if (!sheet) {
            return NextResponse.json({
                error: `Sheet not found for ${recordType}`
            }, { status: 404 });
        }

        const sheetAny = sheet as any;
        const rows = await sheetAny.getRows();


        // Find the row(s) to update. Prefer matching by customer IMEI if provided because RMA numbers can be non-unique.
        const normalizeImei = (v: any) => String(v || '').replace(/\D/g, '').trim();
        const targetImei = customerImei ? normalizeImei(customerImei) : (recordIdentifier ? normalizeImei(recordIdentifier) : '');

        const rowsToUpdate: any[] = [];
        const rowIndexes: number[] = [];

        if (targetImei) {
            // Search for any columns that might contain an IMEI in the sheet
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const possible = [
                    row.get ? row.get('Customer IMEI') : row['Customer IMEI'],
                    row.get ? row.get('Assurant IMEI') : row['Assurant IMEI'],
                    row.get ? row.get('IMEI') : row['IMEI'],
                ];

                for (const p of possible) {
                    if (p !== undefined && normalizeImei(p) === targetImei) {
                        rowsToUpdate.push(row);
                        rowIndexes.push(i);
                        break; // move to next row
                    }
                }
            }
        }

        // Fallback: if we found nothing by IMEI, try the older identifier-based lookup (RMA / XBM)
        if (rowsToUpdate.length === 0) {
            if (recordType === 'XBM') {
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const xbmNumber = row.get ? row.get('XBM Number') : row['XBM Number'];
                    if (String(xbmNumber || '') === String(recordIdentifier || '')) {
                        rowsToUpdate.push(row);
                        rowIndexes.push(i);
                        break;
                    }
                }
            } else {
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const rmaNumber = row.get ? row.get('RMA #') : row['RMA #'];
                    if (String(rmaNumber || '') === String(recordIdentifier || '')) {
                        rowsToUpdate.push(row);
                        rowIndexes.push(i);
                        break;
                    }
                }
            }
        }


        if (rowsToUpdate.length === 0) {
            return NextResponse.json({
                error: `Record not found: ${recordIdentifier || customerImei || ''}`
            }, { status: 404 });
        }

        console.log(`✅ Found ${rowsToUpdate.length} record(s) to update at rows:`, rowIndexes.map(i => i + 2));

        // Update each matched row and save
        const updatedRows: number[] = [];

        for (let idx = 0; idx < rowsToUpdate.length; idx++) {
            const r = rowsToUpdate[idx] as any;
            const i = rowIndexes[idx];

            if (typeof r.set === 'function') {
                if (dmComments !== undefined) {
                    r.set('DM COMMENTS', dmComments);
                    r.set('DM Comments', dmComments);
                }
                if (boComments !== undefined) {
                    r.set('BO COMMENTS', boComments);
                }
            } else {
                if (dmComments !== undefined) {
                    r['DM COMMENTS'] = dmComments;
                    r['DM Comments'] = dmComments;
                }
                if (boComments !== undefined) {
                    r['BO COMMENTS'] = boComments;
                }
            }

            try {
                await r.save();
                updatedRows.push(i + 2);
            } catch (saveErr: any) {
                console.error('❌ Failed saving row', i + 2, saveErr?.message || saveErr);
            }
        }

        console.log(`✅ Comments updated successfully for ${recordIdentifier || customerImei} (rows: ${updatedRows.join(', ')})`);

        return NextResponse.json({
            success: true,
            message: `Comments updated`,
            rowsUpdated: updatedRows,
            count: updatedRows.length,
            dmComments,
            boComments
        });

    } catch (error: any) {
        console.error('❌ Error updating comments:', error);
        return NextResponse.json(
            {
                error: 'Failed to update comments in Google Sheets',
                message: error.message
            },
            { status: 500 }
        );
    }
}