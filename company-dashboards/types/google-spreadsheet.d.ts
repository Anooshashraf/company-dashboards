// types/google-spreadsheet.d.ts
declare module 'google-spreadsheet' {
    export class GoogleSpreadsheet {
        constructor(sheetId: string);
        useServiceAccountAuth(credentials: {
            client_email: string;
            private_key: string;
        }): Promise<void>;
        loadInfo(): Promise<void>;
        sheetsById: { [key: string]: GoogleSpreadsheetWorksheet };
        sheetsByIndex: GoogleSpreadsheetWorksheet[];
        sheetsByTitle: { [key: string]: GoogleSpreadsheetWorksheet };
    }

    export class GoogleSpreadsheetWorksheet {
        getRows(): Promise<GoogleSpreadsheetRow[]>;
        headerValues: string[];
        title: string;
    }

    export class GoogleSpreadsheetRow {
        get(header: string): any;
        set(header: string, value: any): void;
        save(): Promise<void>;
    }
}