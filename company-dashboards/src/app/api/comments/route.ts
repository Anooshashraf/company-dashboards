import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { recordType, recordIdentifier, dmComments, boComments } = body;

        if (!recordType || !recordIdentifier) {
            return NextResponse.json({ error: 'Record type and identifier are required' }, { status: 400 });
        }

        const sheetId = process.env.MAIN_SHEET_ID;

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !sheetId) {
            return NextResponse.json({
                error: 'Missing environment variables'
            }, { status: 500 });
        }

        console.log(`📝 Updating comments for ${recordType}: ${recordIdentifier}`);

        const doc = new GoogleSpreadsheet(sheetId);

        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });

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

        // Find the row to update
        let rowToUpdate = null;
        let rowIndex = -1;

        if (recordType === 'XBM') {
            rowToUpdate = rows.find((row: any, index: number) => {
                const xbmNumber = row.get ? row.get('XBM Number') : row['XBM Number'];
                if (xbmNumber === recordIdentifier) {
                    rowIndex = index;
                    return true;
                }
                return false;
            });
        } else {
            rowToUpdate = rows.find((row: any, index: number) => {
                const rmaNumber = row.get ? row.get('RMA #') : row['RMA #'];
                if (rmaNumber === recordIdentifier) {
                    rowIndex = index;
                    return true;
                }
                return false;
            });
        }

        if (!rowToUpdate) {
            return NextResponse.json({
                error: `Record not found: ${recordIdentifier}`
            }, { status: 404 });
        }

        console.log(`✅ Found record at row ${rowIndex + 2}`);

        // Update the comments
        const rowAny = rowToUpdate as any;

        if (typeof rowAny.set === 'function') {
            // For v3.3.0
            if (dmComments !== undefined) {
                rowAny.set('DM COMMENTS', dmComments);
                rowAny.set('DM Comments', dmComments);
            }
            if (boComments !== undefined) {
                rowAny.set('BO COMMENTS', boComments);
            }
        } else {
            // For v4.x - direct property access
            if (dmComments !== undefined) {
                rowAny['DM COMMENTS'] = dmComments;
                rowAny['DM Comments'] = dmComments;
            }
            if (boComments !== undefined) {
                rowAny['BO COMMENTS'] = boComments;
            }
        }

        // Save the changes
        await rowAny.save();

        console.log(`✅ Comments updated successfully for ${recordIdentifier}`);

        return NextResponse.json({
            success: true,
            message: `Comments updated for ${recordIdentifier}`,
            rowUpdated: rowIndex + 2,
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