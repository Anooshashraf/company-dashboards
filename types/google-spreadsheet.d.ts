// // types/google-spreadsheet.d.ts
// declare module 'google-spreadsheet' {
//     export class GoogleSpreadsheet {
//         constructor(sheetId: string);
//         useServiceAccountAuth(credentials: {
//             client_email: string;
//             private_key: string;
//         }): Promise<void>;
//         loadInfo(): Promise<void>;
//         sheetsById: { [key: string]: GoogleSpreadsheetWorksheet };
//         sheetsByIndex: GoogleSpreadsheetWorksheet[];
//         sheetsByTitle: { [key: string]: GoogleSpreadsheetWorksheet };
//     }

//     export class GoogleSpreadsheetWorksheet {
//         getRows(): Promise<GoogleSpreadsheetRow[]>;
//         headerValues: string[];
//         title: string;
//     }

//     export class GoogleSpreadsheetRow {
//         get(header: string): any;
//         set(header: string, value: any): void;
//         save(): Promise<void>;
//     }
// }


// types/google-spreadsheet.d.ts - FOR v3.3.0
declare module 'google-spreadsheet' {
    export class GoogleSpreadsheet {
      constructor(sheetId: string);
      useServiceAccountAuth(credentials: {
        client_email: string;
        private_key: string;
      }): Promise<void>;
      loadInfo(): Promise<void>;
      
      // v3.3.0 properties
      sheetsById: { [key: string]: GoogleSpreadsheetWorksheet };
      sheetsByIndex: GoogleSpreadsheetWorksheet[];
      sheetsByTitle: { [key: string]: GoogleSpreadsheetWorksheet };
      
      // v3.3.0 methods
      updateProperties(properties: any): Promise<void>;
    }
  
    export class GoogleSpreadsheetWorksheet {
      // Properties
      title: string;
      index: number;
      sheetId: string;
      rowCount: number;
      columnCount: number;
      headerValues: string[];
      
      // Methods
      getRows(options?: { offset?: number; limit?: number }): Promise<GoogleSpreadsheetRow[]>;
      addRow(data: any): Promise<GoogleSpreadsheetRow>;
      addRows(rows: any[]): Promise<void>;
      loadHeaderRow(): Promise<void>;
      setHeaderRow(headers: string[]): Promise<void>;
      clear(): Promise<void>;
      delete(): Promise<void>;
      
      // Internal properties (accessed via casting)
      _properties?: any;
      _cells?: any;
    }
  
    export class GoogleSpreadsheetRow {
      // Core methods - v3.3.0
      save(): Promise<void>;
      delete(): Promise<void>;
      
      // Data access - v3.3.0
      get(key: string): any;
      set(key: string, value: any): void;
      
      // IMPORTANT: toObject() exists in v3.3.0
      toObject(): Record<string, any>;
      
      // Properties
      readonly _sheet: GoogleSpreadsheetWorksheet;
      readonly _rawData: any[];
      readonly _rowNumber: number;
      readonly _rawDataOriginal?: any[];
      
      // Index signature for dynamic access
      [key: string]: any;
    }
  }

