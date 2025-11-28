import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export async function GET() {
    try {
        const sheetId = process.env.MAIN_SHEET_ID;

        const hasEmail = !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const hasKey = !!process.env.GOOGLE_PRIVATE_KEY || !!process.env.GOOGLE_PRIVATE_KEY_BASE64;
        const hasSheetId = !!sheetId;

        if (!hasEmail || !hasKey || !hasSheetId) {
            return NextResponse.json({
                error: 'Missing environment variables',
                hasEmail,
                hasKey,
                hasSheetId
            }, { status: 500 });
        }

        const doc = new GoogleSpreadsheet(sheetId);
        // Build privateKey from raw or base64 env so Windows newline handling and quoting won't break OpenSSL
        let privateKey = '';
        if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
            try {
                privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
            } catch (err) {
                console.error('❌ Failed to decode GOOGLE_PRIVATE_KEY_BASE64:', (err as any)?.message || err);
                return NextResponse.json({ error: 'Invalid base64 private key' }, { status: 500 });
            }
        } else {
            privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
            if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
                privateKey = privateKey.slice(1, -1);
            }
            privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '').trim();
        }

        console.log('🔐 Debug: private key present:', !!privateKey, 'length:', privateKey.length, 'hasHeader:', privateKey.includes('-----BEGIN'));

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
            console.error('❌ Google auth failure (debug):', authError?.message || authError);
            return NextResponse.json({ error: 'Google auth failure', message: authError?.message || String(authError) }, { status: 500 });
        }

        await doc.loadInfo();

        // Use type assertions
        const docAny = doc as any;

        return NextResponse.json({
            success: true,
            title: docAny.title,
            sheetCount: docAny.sheetCount,
            sheets: Object.keys(docAny.sheetsById).map((id: string) => ({
                id,
                title: docAny.sheetsById[id].title,
                gid: docAny.sheetsById[id].sheetId
            }))
        });
    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}