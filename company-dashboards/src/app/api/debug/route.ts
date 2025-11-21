import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';

export async function GET() {
    try {
        const sheetId = process.env.MAIN_SHEET_ID;

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !sheetId) {
            return NextResponse.json({
                error: 'Missing environment variables',
                hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
                hasSheetId: !!sheetId
            }, { status: 500 });
        }

        const doc = new GoogleSpreadsheet(sheetId);
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });

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