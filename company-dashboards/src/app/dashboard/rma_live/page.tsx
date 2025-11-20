// 'use client';
// import React, { useEffect, useMemo, useState, useCallback } from 'react';
// import { useAuth } from '../../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import * as XLSX from 'xlsx';
// import './rma_live_styles.css';
// // RMA Live uses a plain CSS file so class names are global and avoid CSS module parsing issues

// type Row = { [k: string]: string | undefined };

// interface RMARecord {
//     // Common fields
//     "DM COMMENTS": string;
//     "DM Comments": string;
//     "BO COMMENTS": string;
//     "Market": string;
//     "DISTRICT": string;
//     "DM NAME": string;
//     "Store ID": string;
//     "Store Name": string;
//     "Door Code": string;
//     "Model Number": string;
//     "Description": string;
//     "Customer IMEI": string;
//     "Employee Name NTID": string;
//     "Assurant IMEI": string;
//     "Processed Date": string;
//     "Label Type": string;
//     "RMA #": string;
//     "RMA Date": string;
//     "Count of Devices": string;
//     "Tracking Details": string;
//     "Date & Time": string;
//     "Shipping Status": string;
//     "COST": string;
//     "AGE": string;
//     "Error": string;

//     // Type-specific fields
//     "RMA Number"?: string;
//     "XBM Number"?: string;
//     ""?: string;
//     "APPROVED/NOT"?: string;

//     // Computed fields
//     "RecordType": "RMA" | "XBM" | "TRADE_IN";
//     "Status": string;
//     "Amount": number;
//     "DaysOld": number;
// }

// interface AggregatedGroup {
//     key: string;
//     count: number;
//     devices: number;
//     cost: number;
//     pending: number;
//     rows: RMARecord[];
//     AGE: string[];
// }

// interface SummaryStats {
//     totalRecords: number;
//     totalCost: number;
//     rmaCount: number;
//     xbmCount: number;
//     tradeInCount: number;
//     pendingCount: number;
//     devicesWithIMEI: number;
//     AGE: string[];
// }

// export default function RMALivePage() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [rmaData, setRmaData] = useState<RMARecord[]>([]);
//     const [xbmData, setXbmData] = useState<RMARecord[]>([]);
//     const [tradeInData, setTradeInData] = useState<RMARecord[]>([]);
//     const [combinedData, setCombinedData] = useState<RMARecord[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage] = useState(50);
//     const [expandedRow, setExpandedRow] = useState<string | null>(null);
//     const [selectedRecord, setSelectedRecord] = useState<RMARecord | null>(null);
//     const [exportLoading, setExportLoading] = useState(false);

//     const [currentView, setCurrentView] = useState<'markets' | 'dm' | 'types' | 'detailed'>('markets');
//     const [currentData, setCurrentData] = useState<RMARecord[]>([]);
//     const [selectedMarket, setSelectedMarket] = useState<string>('');
//     const [selectedDM, setSelectedDM] = useState<string>('');
//     const [selectedType, setSelectedType] = useState<string>('');
//     const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([
//         { level: 'Markets' }
//     ]);

//     const [imeiFilter, setImeiFilter] = useState('');
//     const [productFilter, setProductFilter] = useState('');

//     const dataSources = [
//         {
//             id: 'RMA',
//             name: 'RMA',
//             gid: '1825921334',
//             description: 'RMA Data',
//             type: 'rma',
//             url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=1825921334&single=true&output=csv'
//         },
//         {
//             id: 'TRADE_IN',
//             name: 'Trade IN',
//             gid: '1934446761',
//             description: 'Trade IN Data',
//             type: 'trade_in',
//             url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=1934446761&single=true&output=csv'
//         },
//         {
//             id: 'XBM',
//             name: 'XBM',
//             gid: '166966411',
//             description: 'XBM Data',
//             type: 'xbm',
//             url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=166966411&single=true&output=csv'
//         }
//     ];

//     // const isValidIMEI = (imei: string): boolean => {
//     //     if (!imei || imei === 'Unknown' || imei === 'N/A' || imei === '' || imei === 'null') {
//     //         return false;
//     //     }

//     //     const lowerIMEI = imei.toLowerCase();
//     //     if (lowerIMEI.includes('no imei') ||
//     //         lowerIMEI.includes('none') ||
//     //         lowerIMEI.includes('pending') ||
//     //         lowerIMEI.includes('n/a') ||
//     //         lowerIMEI.includes('unknown') ||
//     //         lowerIMEI.includes('to be filled') ||
//     //         lowerIMEI.trim().length < 8) {
//     //         return false;
//     //     }

//     //     const numericIMEI = imei.replace(/\D/g, '');
//     //     if (numericIMEI.length < 8) {
//     //         return false;
//     //     }

//     //     return true;
//     // };
//     const isValidIMEI = (imei: string): boolean => {
//         if (!imei ||
//             imei === 'Unknown' ||
//             imei === 'N/A' ||
//             imei === '' ||
//             imei === 'null' ||
//             imei === ' ' ||
//             imei === 'undefined') {
//             return false;
//         }

//         const lowerIMEI = imei.toLowerCase().trim();
//         if (lowerIMEI.includes('no imei') ||
//             lowerIMEI.includes('none') ||
//             lowerIMEI.includes('pending') ||
//             lowerIMEI.includes('n/a') ||
//             lowerIMEI.includes('unknown') ||
//             lowerIMEI.includes('to be filled') ||
//             lowerIMEI.includes('tbd') ||
//             lowerIMEI === '' ||
//             lowerIMEI.length < 8) {
//             return false;
//         }

//         const numericIMEI = imei.replace(/\D/g, '');
//         return numericIMEI.length >= 8;
//     };
//     useEffect(() => {
//         if (!isLoading && !isAuthenticated) {
//             router.push('/login');
//         }
//     }, [isAuthenticated, isLoading, router]);

//     useEffect(() => {
//         if (isAuthenticated) {
//             fetchRMAData();
//         }
//     }, [isAuthenticated]);

//     useEffect(() => {
//         if (rmaData.length > 0 || xbmData.length > 0 || tradeInData.length > 0) {
//             combineData();
//         }
//     }, [rmaData, xbmData, tradeInData]);

//     useEffect(() => {
//         setCurrentData(combinedData);
//     }, [combinedData]);

//     // Prevent background scrolling while modal is open
//     useEffect(() => {
//         const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
//         if (selectedRecord) {
//             document.body.style.overflow = 'hidden';
//         } else {
//             document.body.style.overflow = prev;
//         }
//         return () => {
//             if (typeof document !== 'undefined') document.body.style.overflow = prev;
//         };
//     }, [selectedRecord]);

//     useEffect(() => {
//         setImeiFilter("");
//         setProductFilter("");
//         setCurrentPage(1);
//     }, [currentView, searchTerm]);

//     const splitCsvLine = (line: string): string[] => {
//         const result: string[] = [];
//         let current = '';
//         let inQuotes = false;

//         for (let i = 0; i < line.length; i++) {
//             const char = line[i];
//             if (char === '"') {
//                 inQuotes = !inQuotes;
//             } else if (char === ',' && !inQuotes) {
//                 result.push(current.trim());
//                 current = '';
//             } else {
//                 current += char;
//             }
//         }
//         result.push(current.trim());
//         return result.map(field => field.replace(/^"|"$/g, ''));
//     };

//     const parseCSV = (csvText: string): Row[] => {
//         try {
//             const text = csvText.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
//             const lines = text.split('\n').filter((l) => l.trim().length > 0);
//             if (lines.length < 2) return [];

//             const headers = splitCsvLine(lines[0]).map((h) => h.trim());
//             const data = lines.slice(1).map((line) => {
//                 try {
//                     const vals = splitCsvLine(line);
//                     const obj: Row = {};
//                     headers.forEach((h, i) => {
//                         obj[h] = (vals[i] ?? '').trim();
//                     });
//                     return obj;
//                 } catch (rowError) {
//                     console.error('Error parsing row:', rowError);
//                     return {};
//                 }
//             }).filter(row => Object.keys(row).length > 0);

//             return data;
//         } catch (parseError) {
//             console.error('Error parsing CSV:', parseError);
//             return [];
//         }
//     };
//     const filterDataAtSource = (rows: Row[], sourceType: string): Row[] => {
//         return rows.filter(row => {
//             // Condition 1: Valid IMEI
//             const imei = String(row['Customer IMEI'] || '').trim();
//             if (!isValidIMEI(imei)) {
//                 return false;
//             }

//             // Condition 2: Status = Pending ONLY
//             const status = getStatusFromRow(row, sourceType);
//             const normalizedStatus = normalizeStatus(status);

//             // ONLY allow records with exactly "Pending" status
//             if (normalizedStatus !== 'Pending') {
//                 return false;
//             }

//             return true;
//         });
//     };

//     const getStatusFromRow = (row: Row, sourceType: string): string => {
//         // Try to get status from explicit status field first
//         const statusFields = ['Status', 'Shipping Status', 'APPROVED/NOT'];
//         for (const field of statusFields) {
//             if (row[field] !== undefined && String(row[field]).trim() !== '') {
//                 return String(row[field]).trim();
//             }
//         }

//         // Fallback for different source types
//         if (sourceType === 'xbm') {
//             return String(row[''] || '').trim() || 'Pending';
//         } else if (sourceType === 'trade_in') {
//             return String(row['APPROVED/NOT'] || '').trim() || 'Pending';
//         }

//         return 'Pending';
//     };

//     const normalizeStatus = (raw: any): string => {
//         if (raw == null) return 'Pending';

//         const s = String(raw).toLowerCase().trim();

//         // STRICT: Only return "Pending" for actual pending status
//         // Everything else is considered NOT pending
//         if (s === 'pending' ||
//             s.includes('pending') ||
//             s.includes('not available') ||
//             s.includes('awaiting') ||
//             s.includes('to be filled') ||
//             s === '') {
//             return 'Pending';
//         }

//         // Any other status (shipped, approved, etc.) is NOT pending
//         return 'NotPending';
//     };

//     const fetchDataSource = async (source: any): Promise<Row[]> => {
//         try {
//             const response = await fetch(source.url);
//             if (!response.ok) throw new Error(`HTTP ${response.status}`);
//             const csvText = await response.text();
//             if (!csvText || csvText.trim().length === 0) throw new Error('Empty response');
//             const parsedData = parseCSV(csvText);
//             if (parsedData.length === 0) throw new Error('No data parsed');

//             // Filter data at source level - only valid IMEI + pending status
//             const filteredData = filterDataAtSource(parsedData, source.type);

//             console.log(`📊 ${source.name} - Source filtering:`, {
//                 raw: parsedData.length,
//                 filtered: filteredData.length,
//                 removed: parsedData.length - filteredData.length
//             });

//             return filteredData;
//         } catch (err) {
//             console.error(`Error fetching ${source.name}:`, err);
//             return [];
//         }
//     };

//     const parseCurrency = useCallback((value: any): number => {
//         if (value == null || value === '' || value === undefined) {
//             return 0;
//         }

//         const str = String(value).trim();
//         if (str === '' || str === '-' || str === 'N/A' || str === 'null' || str === ' ' || str === '#DIV/0!') {
//             return 0;
//         }

//         const cleaned = str
//             .replace(/\$/g, '')
//             .replace(/,/g, '')
//             .replace(/\s+/g, '')
//             .replace(/[^\d.-]/g, '');

//         const parts = cleaned.split('.');
//         let finalNumber = parts[0];
//         if (parts.length > 1) {
//             finalNumber += '.' + parts.slice(1).join('');
//         }

//         const n = parseFloat(finalNumber);
//         return isNaN(n) ? 0 : n;
//     }, []);

//     const parseIntSafe = useCallback((v: any): number => {
//         if (v == null || v === '' || v === undefined) return 0;
//         const str = String(v).trim();
//         if (str === '' || str === '-' || str === 'N/A' || str === 'null' || str === ' ' || str === '#DIV/0!') {
//             return 0;
//         }
//         const n = parseInt(str);
//         return isNaN(n) ? 0 : n;
//     }, []);

//     // const transformToRMARecord = (row: Row, type: "RMA" | "XBM" | "TRADE_IN"): RMARecord => {
//     //     const getValue = (keys: string[]): string => {
//     //         for (const key of keys) {
//     //             if (row[key] !== undefined && String(row[key]).trim() !== '') {
//     //                 return String(row[key]).trim();
//     //             }
//     //         }
//     //         return '';
//     //     };

//     //     let cost = 0;
//     //     const costFields = ['COST', 'Cost', 'AMOUNT', 'Amount', 'TOTAL COST', 'Total Cost'];

//     //     for (const field of costFields) {
//     //         const costValue = parseCurrency(getValue([field]));
//     //         if (costValue > 0) {
//     //             cost = costValue;
//     //             break;
//     //         }
//     //     }

//     //     if (cost === 0) {
//     //         Object.keys(row).forEach(key => {
//     //             if (key && (key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount'))) {
//     //                 const potentialCost = parseCurrency(row[key]);
//     //                 if (potentialCost > 0) {
//     //                     cost = potentialCost;
//     //                 }
//     //             }
//     //         });
//     //     }

//     //     const age = parseIntSafe(getValue(['AGE', 'Age'])) || 0;

//     //     let status = 'Pending';
//     //     if (type === 'XBM') {
//     //         status = getValue(['', 'Status']) || 'Pending';
//     //     } else if (type === 'TRADE_IN') {
//     //         status = getValue(['APPROVED/NOT']) || 'Pending';
//     //     } else {
//     //         status = getValue(['Shipping Status']) === 'Not available' ? 'Pending' : 'Shipped';
//     //     }

//     //     const record: RMARecord = {
//     //         "DM COMMENTS": getValue(['DM COMMENTS', 'DM Comments']),
//     //         "DM Comments": getValue(['DM Comments', 'DM COMMENTS']),
//     //         "BO COMMENTS": getValue(['BO COMMENTS']),
//     //         "Market": getValue(['Market']),
//     //         "DISTRICT": getValue(['DISTRICT', 'District']),
//     //         "DM NAME": getValue(['DM NAME', 'DM Name']),
//     //         "Store ID": getValue(['Store ID']),
//     //         "Store Name": getValue(['Store Name']),
//     //         "Door Code": getValue(['Door Code']),
//     //         "Model Number": getValue(['Model Number']),
//     //         "Description": getValue(['Description']),
//     //         "Customer IMEI": getValue(['Customer IMEI']),
//     //         "Employee Name NTID": getValue(['Employee Name NTID']),
//     //         "Assurant IMEI": getValue(['Assurant IMEI']),
//     //         "Processed Date": getValue(['Processed Date']),
//     //         "Label Type": getValue(['Label Type']),
//     //         "RMA #": getValue(['RMA #', 'RMA Number']),
//     //         "RMA Date": getValue(['RMA Date']),
//     //         "Count of Devices": getValue(['Count of Devices']),
//     //         "Tracking Details": getValue(['Tracking Details']),
//     //         "Date & Time": getValue(['Date & Time']),
//     //         "Shipping Status": getValue(['Shipping Status']),
//     //         "COST": getValue(['COST']),
//     //         "AGE": getValue(['AGE']),
//     //         "Error": getValue(['Error']),
//     //         "RMA Number": type === 'RMA' ? getValue(['RMA #']) : undefined,
//     //         "XBM Number": type === 'XBM' ? getValue(['XBM Number']) : undefined,
//     //         "": type === 'XBM' ? getValue(['']) : undefined,
//     //         "APPROVED/NOT": type === 'TRADE_IN' ? getValue(['APPROVED/NOT']) : undefined,
//     //         "RecordType": type,
//     //         "Status": status,
//     //         "Amount": cost,
//     //         "DaysOld": age
//     //     };

//     //     return record;
//     // };
//     const transformToRMARecord = (row: Row, type: "RMA" | "XBM" | "TRADE_IN"): RMARecord => {
//         const getValue = (keys: string[]): string => {
//             for (const key of keys) {
//                 if (row[key] !== undefined && String(row[key]).trim() !== '') {
//                     return String(row[key]).trim();
//                 }
//             }
//             return '';
//         };

//         let cost = 0;
//         const costFields = ['COST', 'Cost', 'AMOUNT', 'Amount', 'TOTAL COST', 'Total Cost'];

//         for (const field of costFields) {
//             const costValue = parseCurrency(getValue([field]));
//             if (costValue > 0) {
//                 cost = costValue;
//                 break;
//             }
//         }

//         if (cost === 0) {
//             Object.keys(row).forEach(key => {
//                 if (key && (key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount'))) {
//                     const potentialCost = parseCurrency(row[key]);
//                     if (potentialCost > 0) {
//                         cost = potentialCost;
//                     }
//                 }
//             });
//         }

//         const age = parseIntSafe(getValue(['AGE', 'Age'])) || 0;

//         // Use the same status detection logic as in filterDataAtSource
//         const status = getStatusFromRow(row, type.toLowerCase());
//         const normalizedStatus = normalizeStatus(status);

//         const record: RMARecord = {
//             "DM COMMENTS": getValue(['DM COMMENTS', 'DM Comments']),
//             "DM Comments": getValue(['DM Comments', 'DM COMMENTS']),
//             "BO COMMENTS": getValue(['BO COMMENTS']),
//             "Market": getValue(['Market']),
//             "DISTRICT": getValue(['DISTRICT', 'District']),
//             "DM NAME": getValue(['DM NAME', 'DM Name']),
//             "Store ID": getValue(['Store ID']),
//             "Store Name": getValue(['Store Name']),
//             "Door Code": getValue(['Door Code']),
//             "Model Number": getValue(['Model Number']),
//             "Description": getValue(['Description']),
//             "Customer IMEI": getValue(['Customer IMEI']),
//             "Employee Name NTID": getValue(['Employee Name NTID']),
//             "Assurant IMEI": getValue(['Assurant IMEI']),
//             "Processed Date": getValue(['Processed Date']),
//             "Label Type": getValue(['Label Type']),
//             "RMA #": getValue(['RMA #', 'RMA Number']),
//             "RMA Date": getValue(['RMA Date']),
//             "Count of Devices": getValue(['Count of Devices']),
//             "Tracking Details": getValue(['Tracking Details']),
//             "Date & Time": getValue(['Date & Time']),
//             "Shipping Status": getValue(['Shipping Status']),
//             "COST": getValue(['COST']),
//             "AGE": getValue(['AGE']),
//             "Error": getValue(['Error']),
//             "RMA Number": type === 'RMA' ? getValue(['RMA #']) : undefined,
//             "XBM Number": type === 'XBM' ? getValue(['XBM Number']) : undefined,
//             "": type === 'XBM' ? getValue(['']) : undefined,
//             "APPROVED/NOT": type === 'TRADE_IN' ? getValue(['APPROVED/NOT']) : undefined,
//             "RecordType": type,
//             "Status": normalizedStatus, // Use the normalized status
//             "Amount": cost,
//             "DaysOld": age
//         };

//         return record;
//     };

//     const fetchRMAData = async () => {
//         try {
//             setLoading(true);
//             setError(null);
//             console.log('🔄 Starting RMA data fetch from Google Sheets...');

//             const [rmaRows, tradeInRows, xbmRows] = await Promise.all([
//                 fetchDataSource(dataSources[0]),
//                 fetchDataSource(dataSources[1]),
//                 fetchDataSource(dataSources[2])
//             ]);

//             console.log('📊 RMA Data loaded:', {
//                 rma: rmaRows.length,
//                 tradeIn: tradeInRows.length,
//                 xbm: xbmRows.length
//             });

//             const transformedRMA = rmaRows.map(row => transformToRMARecord(row, "RMA"));
//             const transformedTradeIN = tradeInRows.map(row => transformToRMARecord(row, "TRADE_IN"));
//             const transformedXBM = xbmRows.map(row => transformToRMARecord(row, "XBM"));

//             setRmaData(transformedRMA);
//             setTradeInData(transformedTradeIN);
//             setXbmData(transformedXBM);

//         } catch (err) {
//             setError('Failed to load RMA data');
//             console.error('Error fetching RMA data:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // const combineData = () => {
//     //     const allData = [...rmaData, ...xbmData, ...tradeInData];

//     //     // STRICT FILTERING: Only valid IMEI + exactly "pending" status
//     //     const filteredData = allData.filter(record => 
//     //         record && 
//     //         record.Status && 
//     //         String(record.Status).toLowerCase() === 'pending' && 
//     //         isValidIMEI(record["Customer IMEI"] || '')
//     //     );

//     //     console.log('🔄 Combined RMA data (strict filtering):', {
//     //         totalRecords: allData.length,
//     //         pendingWithValidIMEI: filteredData.length,
//     //         totalCost: filteredData.reduce((sum, r) => sum + r.Amount, 0)
//     //     });

//     //     setCombinedData(filteredData);
//     // };

//     const combineData = () => {
//         const allData = [...rmaData, ...xbmData, ...tradeInData];

//         // STRICT FILTERING: Only valid IMEI + exactly "pending" status
//         const filteredData = allData.filter(record =>
//             record &&
//             record.Status &&
//             String(record.Status).toLowerCase() === 'pending' &&
//             isValidIMEI(record["Customer IMEI"] || '')
//         );

//         console.log('🔄 Combined RMA data (strict filtering):', {
//             totalRecords: allData.length,
//             pendingWithValidIMEI: filteredData.length,
//             totalCost: filteredData.reduce((sum, r) => sum + r.Amount, 0)
//         });

//         setCombinedData(filteredData);
//     };

//     // Search function
//     const searchData = useCallback((data: RMARecord[], searchTerm: string): RMARecord[] => {
//         if (!searchTerm.trim()) return data;
//         const searchLower = searchTerm.toLowerCase().trim();

//         return data.filter((record) => {
//             const searchableFields = [
//                 record.Market,
//                 record["Store Name"],
//                 record["Store ID"],
//                 record["RMA #"],
//                 record["XBM Number"],
//                 record["Tracking Details"],
//                 record["Model Number"],
//                 record["Description"],
//                 record["DM NAME"],
//                 record["Customer IMEI"],
//                 record["Assurant IMEI"],
//                 record["Door Code"],
//                 record["Employee Name NTID"]
//             ].filter((field) => field && field !== "" && field !== "Unknown");

//             return searchableFields.some((field) =>
//                 String(field).toLowerCase().includes(searchLower)
//             );
//         });
//     }, []);

//     // const filteredData = useMemo(() => {
//     //     let data = currentData;

//     //     if (searchTerm.trim()) {
//     //         data = searchData(data, searchTerm);
//     //     }

//     //     if (currentView === 'detailed') {
//     //         if (imeiFilter.trim()) {
//     //             const imeiLower = imeiFilter.toLowerCase().trim();
//     //             data = data.filter(record =>
//     //                 record["Customer IMEI"]?.toLowerCase().includes(imeiLower) ||
//     //                 record["Assurant IMEI"]?.toLowerCase().includes(imeiLower)
//     //             );
//     //         }

//     //         if (productFilter.trim()) {
//     //             const productLower = productFilter.toLowerCase().trim();
//     //             data = data.filter(record =>
//     //                 record["Model Number"]?.toLowerCase().includes(productLower) ||
//     //                 record["Description"]?.toLowerCase().includes(productLower) ||
//     //                 (record["Model Number"] + " " + record["Description"])?.toLowerCase().includes(productLower)
//     //             );
//     //         }
//     //     }

//     //     return data.filter(record => isValidIMEI(record["Customer IMEI"]));
//     // }, [currentData, searchTerm, currentView, imeiFilter, productFilter, searchData]);
//     const filteredData = useMemo(() => {
//         let data = currentData;

//         if (searchTerm.trim()) {
//             data = searchData(data, searchTerm);
//         }

//         if (currentView === 'detailed') {
//             if (imeiFilter.trim()) {
//                 const imeiLower = imeiFilter.toLowerCase().trim();
//                 data = data.filter(record =>
//                     record["Customer IMEI"]?.toLowerCase().includes(imeiLower) ||
//                     record["Assurant IMEI"]?.toLowerCase().includes(imeiLower)
//                 );
//             }

//             if (productFilter.trim()) {
//                 const productLower = productFilter.toLowerCase().trim();
//                 data = data.filter(record =>
//                     record["Model Number"]?.toLowerCase().includes(productLower) ||
//                     record["Description"]?.toLowerCase().includes(productLower)
//                 );
//             }
//         }

//         // REMOVE this line since combinedData already has valid IMEI only
//         // return data.filter(record => isValidIMEI(record["Customer IMEI"]));

//         return data; // Data is already filtered at source
//     }, [currentData, searchTerm, currentView, imeiFilter, productFilter, searchData]);

//     const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//     const paginatedData = useMemo(() => {
//         const startIndex = (currentPage - 1) * itemsPerPage;
//         return filteredData.slice(startIndex, startIndex + itemsPerPage);
//     }, [filteredData, currentPage, itemsPerPage]);

//     // const aggregateData = (data: RMARecord[], level: 'markets' | 'dm' | 'types'): AggregatedGroup[] => {
//     //     const groups: { [key: string]: AggregatedGroup } = {};

//     //     if (level === 'markets') {
//     //         const markets = Array.from(new Set(data.map(record => record.Market))).filter(m => m && m !== 'Unknown');

//     //         markets.forEach(market => {
//     //             const marketData = data.filter(record => record.Market === market);
//     //             const totalCost = marketData.reduce((sum, record) => sum + record.Amount, 0);
//     //             const pendingCount = marketData.length;

//     //             groups[market] = {
//     //                 key: market,
//     //                 count: marketData.length,
//     //                 devices: marketData.length,
//     //                 cost: totalCost,
//     //                 pending: pendingCount,
//     //                 rows: marketData
//     //             };
//     //         });
//     //     } else if (level === 'dm') {
//     //         const dms = Array.from(new Set(data.map(record => record["DM NAME"]))).filter(dm => dm && dm !== 'Unknown');

//     //         dms.forEach(dm => {
//     //             const dmData = data.filter(record => record["DM NAME"] === dm);
//     //             const totalCost = dmData.reduce((sum, record) => sum + record.Amount, 0);
//     //             const pendingCount = dmData.filter(record =>
//     //                 record.Status.toLowerCase().includes('pending') ||
//     //                 record["Shipping Status"] === "Not available"
//     //             ).length;

//     //             groups[dm] = {
//     //                 key: dm,
//     //                 count: dmData.length,
//     //                 devices: dmData.length,
//     //                 cost: totalCost,
//     //                 pending: pendingCount,
//     //                 rows: dmData
//     //             };
//     //         });
//     //     } else if (level === 'types') {
//     //         const types = Array.from(new Set(data.map(record => record.RecordType)));

//     //         types.forEach(type => {
//     //             const typeData = data.filter(record => record.RecordType === type);
//     //             const totalCost = typeData.reduce((sum, record) => sum + record.Amount, 0);
//     //             const pendingCount = typeData.filter(record =>
//     //                 record.Status.toLowerCase().includes('pending') ||
//     //                 record["Shipping Status"] === "Not available"
//     //             ).length;

//     //             groups[type] = {
//     //                 key: type,
//     //                 count: typeData.length,
//     //                 devices: typeData.length,
//     //                 cost: totalCost,
//     //                 pending: pendingCount,
//     //                 rows: typeData
//     //             };
//     //         });
//     //     }

//     //     return Object.values(groups).sort((a, b) => b.cost - a.cost);
//     // };
//     const aggregateData = (data: RMARecord[], level: 'markets' | 'dm' | 'types'): AggregatedGroup[] => {
//         const groups: { [key: string]: AggregatedGroup } = {};

//         if (level === 'markets') {
//             const markets = Array.from(new Set(data.map(record => record.Market))).filter(m => m && m !== 'Unknown');

//             markets.forEach(market => {
//                 const marketData = data.filter(record => record.Market === market);
//                 const totalCost = marketData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = marketData.length;

//                 // Collect unique age values from AGE field
//                 const ageSet = new Set<string>();
//                 marketData.forEach(record => {
//                     if (record.DaysOld && record.DaysOld > 0) {
//                         ageSet.add(`${record.DaysOld}d`);
//                     }
//                 });

//                 groups[market] = {
//                     key: market,
//                     count: marketData.length,
//                     devices: marketData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days: Array.from(ageSet), // Use age values
//                     rows: marketData
//                 };
//             });
//         } else if (level === 'dm') {
//             const dms = Array.from(new Set(data.map(record => record["DM NAME"]))).filter(dm => dm && dm !== 'Unknown');

//             dms.forEach(dm => {
//                 const dmData = data.filter(record => record["DM NAME"] === dm);
//                 const totalCost = dmData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = dmData.length;

//                 // Collect unique age values from AGE field
//                 const ageSet = new Set<string>();
//                 dmData.forEach(record => {
//                     if (record.DaysOld && record.DaysOld > 0) {
//                         ageSet.add(`${record.DaysOld}d`);
//                     }
//                 });

//                 groups[dm] = {
//                     key: dm,
//                     count: dmData.length,
//                     devices: dmData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days: Array.from(ageSet), // Use age values
//                     rows: dmData
//                 };
//             });
//         } else if (level === 'types') {
//             const types = Array.from(new Set(data.map(record => record.RecordType)));

//             types.forEach(type => {
//                 const typeData = data.filter(record => record.RecordType === type);
//                 const totalCost = typeData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = typeData.length;

//                 // Collect unique age values from AGE field
//                 const ageSet = new Set<string>();
//                 typeData.forEach(record => {
//                     if (record.DaysOld && record.DaysOld > 0) {
//                         ageSet.add(`${record.DaysOld}d`);
//                     }
//                 });

//                 groups[type] = {
//                     key: type,
//                     count: typeData.length,
//                     devices: typeData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days: Array.from(ageSet), // Use age values
//                     rows: typeData
//                 };
//             });
//         }

//         return Object.values(groups).sort((a, b) => b.cost - a.cost);
//     };
//     const handleMarketClick = (market: AggregatedGroup) => {
//         setCurrentData(market.rows);
//         setCurrentView('dm');
//         setSelectedMarket(market.key);
//         setHistoryStack([
//             { level: 'Markets' },
//             { level: 'District Managers', selected: market.key }
//         ]);
//         setSearchTerm('');
//         setCurrentPage(1);
//     };

//     const handleDMClick = (dm: AggregatedGroup) => {
//         setCurrentData(dm.rows);
//         setCurrentView('types');
//         setSelectedDM(dm.key);
//         setHistoryStack([
//             { level: 'Markets' },
//             { level: 'District Managers', selected: selectedMarket },
//             { level: 'Record Types', selected: dm.key }
//         ]);
//         setSearchTerm('');
//         setCurrentPage(1);
//     };

//     const handleTypeClick = (type: AggregatedGroup) => {
//         setCurrentData(type.rows);
//         setCurrentView('detailed');
//         setSelectedType(type.key);
//         setHistoryStack([
//             { level: 'Markets' },
//             { level: 'District Managers', selected: selectedMarket },
//             { level: 'Record Types', selected: selectedDM },
//             { level: 'Detailed', selected: type.key }
//         ]);
//         setSearchTerm('');
//         setCurrentPage(1);
//     };

//     const handleBackClick = () => {
//         if (historyStack.length <= 1) {
//             setCurrentData(combinedData);
//             setCurrentView('markets');
//             setHistoryStack([{ level: 'Markets' }]);
//             setSelectedMarket('');
//             setSelectedDM('');
//             setSelectedType('');
//             setSearchTerm('');
//             setCurrentPage(1);
//         } else {
//             const newStack = historyStack.slice(0, -1);
//             setHistoryStack(newStack);
//             const previousLevel = newStack[newStack.length - 1];

//             if (previousLevel.level === 'Markets') {
//                 setCurrentData(combinedData);
//                 setCurrentView('markets');
//                 setSelectedMarket('');
//                 setSearchTerm('');
//                 setCurrentPage(1);
//             } else if (previousLevel.level === 'District Managers') {
//                 const marketData = combinedData.filter(record => record.Market === selectedMarket);
//                 setCurrentData(marketData);
//                 setCurrentView('dm');
//                 setSelectedDM('');
//                 setSearchTerm('');
//                 setCurrentPage(1);
//             } else if (previousLevel.level === 'Record Types') {
//                 const dmData = combinedData.filter(
//                     record => record.Market === selectedMarket && record["DM NAME"] === selectedDM
//                 );
//                 setCurrentData(dmData);
//                 setCurrentView('types');
//                 setSelectedType('');
//                 setSearchTerm('');
//                 setCurrentPage(1);
//             }
//         }
//     };

//     const exportToXLSX = useCallback(async () => {
//         try {
//             setExportLoading(true);
//             const workbook = XLSX.utils.book_new();

//             if (rmaData.length > 0) {
//                 const rmaWorksheet = XLSX.utils.json_to_sheet(rmaData);
//                 XLSX.utils.book_append_sheet(workbook, rmaWorksheet, 'RMA Data');
//             }
//             if (xbmData.length > 0) {
//                 const xbmWorksheet = XLSX.utils.json_to_sheet(xbmData);
//                 XLSX.utils.book_append_sheet(workbook, xbmWorksheet, 'XBM Data');
//             }
//             if (tradeInData.length > 0) {
//                 const tradeInWorksheet = XLSX.utils.json_to_sheet(tradeInData);
//                 XLSX.utils.book_append_sheet(workbook, tradeInWorksheet, 'Trade IN Data');
//             }
//             if (filteredData.length > 0) {
//                 const currentWorksheet = XLSX.utils.json_to_sheet(filteredData);
//                 XLSX.utils.book_append_sheet(workbook, currentWorksheet, 'Current View');
//             }

//             const fileName = `rma_live_data_${new Date().toISOString().split('T')[0]}.xlsx`;
//             XLSX.writeFile(workbook, fileName);
//         } catch (error) {
//             console.error('Error exporting to XLSX:', error);
//             setError('Failed to export XLSX file');
//         } finally {
//             setExportLoading(false);
//         }
//     }, [rmaData, xbmData, tradeInData, filteredData]);

//     const handleExport = useCallback(() => {
//         exportToXLSX();
//     }, [exportToXLSX]);

//     const getStatusColor = (status: string): string => {
//         const statusColors: { [key: string]: string } = {
//             'pending': 'yellow',
//             'shipped': 'blue',
//             'delivered': 'green',
//             'cancelled': 'red',
//             'approved': 'green',
//             'rejected': 'red',
//             'completed': 'green'
//         };
//         return statusColors[status.toLowerCase()] || 'gray';
//     };

//     const getRecordTypeColor = (type: string): string => {
//         const typeColors: { [key: string]: string } = {
//             'rma': 'blue',
//             'xbm': 'purple',
//             'trade_in': 'orange'
//         };
//         return typeColors[type.toLowerCase()] || 'gray';
//     };

//     const toggleRowExpansion = (id: string) => {
//         setExpandedRow(expandedRow === id ? null : id);
//     };

//     const showDetails = (record: RMARecord) => {
//         setSelectedRecord(record);
//     };

//     const closeDetails = () => {
//         setSelectedRecord(null);
//     };

//     // const summaryStats = useMemo((): SummaryStats => {
//     //     const dataToUse = filteredData.length > 0 ? filteredData : combinedData.filter(record => isValidIMEI(record["Customer IMEI"]));

//     //     const totalRecords = dataToUse.length;
//     //     const totalCost = dataToUse.reduce((sum, record) => sum + record.Amount, 0);

//     //     const rmaCount = dataToUse.filter(record => record.RecordType === 'RMA').length;
//     //     const xbmCount = dataToUse.filter(record => record.RecordType === 'XBM').length;
//     //     const tradeInCount = dataToUse.filter(record => record.RecordType === 'TRADE_IN').length;

//     //     const pendingCount = dataToUse.filter(record =>
//     //         record.Status.toLowerCase().includes('pending') ||
//     //         record["Shipping Status"] === "Not available"
//     //     ).length;

//     //     return {
//     //         totalRecords,
//     //         totalCost,
//     //         rmaCount,
//     //         xbmCount,
//     //         tradeInCount,
//     //         pendingCount,
//     //         devicesWithIMEI: totalRecords
//     //     };
//     // }, [filteredData, combinedData]);

//     const summaryStats = useMemo((): SummaryStats => {
//         const dataToUse = filteredData.length > 0 ? filteredData : combinedData;

//         const totalRecords = dataToUse.length;
//         const totalCost = dataToUse.reduce((sum, record) => sum + record.Amount, 0);

//         const rmaCount = dataToUse.filter(record => record.RecordType === 'RMA').length;
//         const xbmCount = dataToUse.filter(record => record.RecordType === 'XBM').length;
//         const tradeInCount = dataToUse.filter(record => record.RecordType === 'TRADE_IN').length;
//         // Calculate age statistics
//         const ages = dataToUse.map(record => record.DaysOld).filter(age => age > 0);
//         const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
//         const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

//         // All records are pending now, so:
//         const pendingCount = totalRecords;

//         return {
//             totalRecords,
//             totalCost,
//             rmaCount,
//             xbmCount,
//             tradeInCount,
//             pendingCount,
//             devicesWithIMEI: totalRecords, // Same as total since all have valid IMEI
//             averageAge,
//             maxAge
//         };
//     }, [filteredData, combinedData]);

//     // Update the hierarchical table to remove shipped column
//     const renderHierarchicalTable = (data: RMARecord[], level: 'markets' | 'dm' | 'types', onRowClick: (group: AggregatedGroup) => void) => {
//         const aggregated = aggregateData(data, level);
//         const maxCost = Math.max(...aggregated.map(a => a.cost), 1);
//         const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

//         let title = '';
//         switch (level) {
//             case 'markets':
//                 title = 'Markets';
//                 break;
//             case 'dm':
//                 title = 'District Managers';
//                 break;
//             case 'types':
//                 title = 'Record Types';
//                 break;
//         }

//         return (
//             <div className="rma-table-block">
//                 <div className="rma-table-header">
//                     <h2>{title}</h2>
//                     <div className="rma-meta">
//                         {aggregated.length} groups — {data.length} total records — total value ${totalCost.toLocaleString()}
//                         {searchTerm && ` • Filtered by: "${searchTerm}"`}
//                     </div>
//                 </div>

//                 <div className="rma-table-wrapper">
//                     <table className="rma-table">
//                         <thead>
//                             <tr>
//                                 <th>{title}</th>
//                                 <th className="rma-col-right">Records</th>
//                                 <th className="rma-col-right">Devices</th>
//                                 <th>Age</th> {/* Add this column */}
//                                 <th className="rma-col-right">Pending</th>
//                                 <th className="rma-col-right">Total Cost</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         {/* <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass = pct >= 70 ? "rma-fill-green" : pct >= 40 ? "rma-fill-amber" : "rma-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//                                         <td>{group.key}</td>
//                                         <td className="rma-col-right">{group.count}</td>
//                                         <td className="rma-col-right">{group.devices}</td>
//                                         <td className="rma-col-right">{group.pending}</td>
//                                         <td className="rma-col-right">${group.cost.toLocaleString()}</td>
//                                         <td>
//                                             <div className="rma-bar-cell">
//                                                 <div className="rma-bar-track">
//                                                     <div className={`rma-bar-fill ${fillClass}`} style={{ width: `${pct}%` }}></div>
//                                                 </div>
//                                                 <div style={{ minWidth: "52px", textAlign: "right" }}>{pct}%</div>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody> */}
//                         // In renderHierarchicalTable function, update the tbody:
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass = pct >= 70 ? "rma-fill-green" : pct >= 40 ? "rma-fill-amber" : "rma-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//                                         <td>{group.key}</td>
//                                         <td className="rma-col-right">{group.count}</td>
//                                         <td className="rma-col-right">{group.devices}</td>
//                                         <td className="rma-col-right">{group.pending}</td>
//                                         <td className="rma-col-right">${group.cost.toLocaleString()}</td>
//                                         <td> {/* Add Age column */}
//                                             {group.days.map((age, i) => (
//                                                 <span key={i} className="rma-days-pill">
//                                                     {age}
//                                                 </span>
//                                             ))}
//                                         </td>
//                                         <td>
//                                             <div className="rma-bar-cell">
//                                                 <div className="rma-bar-track">
//                                                     <div className={`rma-bar-fill ${fillClass}`} style={{ width: `${pct}%` }}></div>
//                                                 </div>
//                                                 <div style={{ minWidth: "52px", textAlign: "right" }}>{pct}%</div>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         );
//     };

//     // Render hierarchy table
//     // const renderHierarchicalTable = (data: RMARecord[], level: 'markets' | 'dm' | 'types', onRowClick: (group: AggregatedGroup) => void) => {
//     //     const aggregated = aggregateData(data, level);
//     //     const maxCost = Math.max(...aggregated.map(a => a.cost), 1);
//     //     const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

//     //     let title = '';
//     //     switch (level) {
//     //         case 'markets':
//     //             title = 'Markets';
//     //             break;
//     //         case 'dm':
//     //             title = 'District Managers';
//     //             break;
//     //         case 'types':
//     //             title = 'Record Types';
//     //             break;
//     //     }

//     //     return (
//     //         <div className="rma-table-block">
//     //             <div className="rma-table-header">
//     //                 <h2>{title}</h2>
//     //                 <div className="rma-meta">
//     //                     {aggregated.length} groups — {data.length} total records — total value ${totalCost.toLocaleString()}
//     //                     {searchTerm && ` • Filtered by: "${searchTerm}"`}
//     //                 </div>
//     //             </div>

//     //             <div className="rma-table-wrapper">
//     //                 <table className="rma-table">
//     //                     <thead>
//     //                         <tr>
//     //                             <th>{title}</th>
//     //                             <th className="rma-col-right">Records</th>
//     //                             <th className="rma-col-right">Devices</th>
//     //                             <th className="rma-col-right">Pending</th>
//     //                             <th className="rma-col-right">Shipped</th>
//     //                             <th className="rma-col-right">Total Cost</th>
//     //                             <th>Value Distribution</th>
//     //                         </tr>
//     //                     </thead>
//     //                     <tbody>
//     //                         {aggregated.map((group, index) => {
//     //                             const pct = Math.round((group.cost / maxCost) * 100);
//     //                             const fillClass = pct >= 70 ? "rma-fill-green" : pct >= 40 ? "rma-fill-amber" : "rma-fill-red";

//     //                             return (
//     //                                 <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//     //                                     <td>{group.key}</td>
//     //                                     <td className="rma-col-right">{group.count}</td>
//     //                                     <td className="rma-col-right">{group.devices}</td>
//     //                                     <td className="rma-col-right">{group.pending}</td>
//     //                                     <td className="rma-col-right">{group.shipped}</td>
//     //                                     <td className="rma-col-right">${group.cost.toLocaleString()}</td>
//     //                                     <td>
//     //                                         <div className="rma-bar-cell">
//     //                                             <div className="rma-bar-track">
//     //                                                 <div className={`rma-bar-fill ${fillClass}`} style={{ width: `${pct}%` }}></div>
//     //                                             </div>
//     //                                             <div style={{ minWidth: "52px", textAlign: "right" }}>{pct}%</div>
//     //                                         </div>
//     //                                     </td>
//     //                                 </tr>
//     //                             );
//     //                         })}
//     //                     </tbody>
//     //                 </table>
//     //             </div>
//     //         </div>
//     //     );
//     // };

//     // Render detailed table
//     const renderDetailedTable = () => {
//         const shouldShowPagination = filteredData.length > itemsPerPage;

//         return (
//             <div className="rma-table-block">
//                 <div className="rma-table-header">
//                     <h2>
//                         {historyStack[historyStack.length - 1]?.level === 'Search Results'
//                             ? `Search Results for "${searchTerm}"`
//                             : `Detailed Report - ${selectedType}`
//                         }
//                     </h2>
//                     <div className="rma-meta">
//                         {filteredData.length} RMA records
//                         {searchTerm && ` matching "${searchTerm}"`}
//                         {(imeiFilter || productFilter) && (
//                             <span className="filter-indicator">
//                                 {imeiFilter && ` • IMEI: "${imeiFilter}"`}
//                                 {productFilter && ` • Product: "${productFilter}"`}
//                             </span>
//                         )}
//                     </div>
//                 </div>

//                 {/* FILTER CONTROLS - Search by IMEI and Product/Model */}
//                 <div className="rma-filter-controls">
//                     <div className="filter-group">
//                         <label htmlFor="imei-filter">Search by IMEI:</label>
//                         <input
//                             id="imei-filter"
//                             type="text"
//                             placeholder="e.g., 123456789012345, 987654321098765..."
//                             value={imeiFilter}
//                             onChange={(e) => setImeiFilter(e.target.value)}
//                             className="filter-input"
//                         />
//                         {imeiFilter && (
//                             <button
//                                 onClick={() => setImeiFilter("")}
//                                 className="clear-filter"
//                                 title="Clear IMEI filter"
//                             >
//                                 ✕
//                             </button>
//                         )}
//                     </div>

//                     <div className="filter-group">
//                         <label htmlFor="product-filter">Search by Product/Model:</label>
//                         <input
//                             id="product-filter"
//                             type="text"
//                             placeholder="e.g., iPhone 16, Samsung, Moto G, XT24191..."
//                             value={productFilter}
//                             onChange={(e) => setProductFilter(e.target.value)}
//                             className="filter-input"
//                         />
//                         {productFilter && (
//                             <button
//                                 onClick={() => setProductFilter("")}
//                                 className="clear-filter"
//                                 title="Clear product filter"
//                             >
//                                 ✕
//                             </button>
//                         )}
//                     </div>

//                     {(imeiFilter || productFilter) && (
//                         <button
//                             onClick={() => {
//                                 setImeiFilter('');
//                                 setProductFilter('');
//                             }}
//                             className="clear-all-filters"
//                         >
//                             Clear All Filters
//                         </button>
//                     )}
//                 </div>

//                 <div className="rma-table-wrapper">
//                     <table className="rma-table detailed-view">
//                         <thead>
//                             <tr>
//                                 <th>Type</th>
//                                 <th>Market</th>
//                                 <th>Store</th>
//                                 <th>Reference #</th>
//                                 <th>Model</th>
//                                 <th>Status</th>
//                                 <th>Customer IMEI</th>
//                                 <th>Assurant IMEI</th>
//                                 <th className="rma-col-right">Cost</th>
//                                 <th className="rma-col-right">Age</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {paginatedData.map((record, index) => {
//                                 const uniqueId = `${record.RecordType}-${record["RMA #"] || record["XBM Number"]}-${index}`;
//                                 const referenceNumber = record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"];

//                                 return (
//                                     <React.Fragment key={uniqueId}>
//                                         <tr className="clickable-row">
//                                             <td>
//                                                 <span className={`record-type-badge type-${getRecordTypeColor(record.RecordType)}`}>
//                                                     {record.RecordType}
//                                                 </span>
//                                             </td>
//                                             <td>{record.Market}</td>
//                                             <td>
//                                                 <div className="store-info">
//                                                     <div className="store-name">{record["Store Name"]}</div>
//                                                     <div className="store-id">{record["Store ID"]}</div>
//                                                 </div>
//                                             </td>
//                                             <td>
//                                                 <div>
//                                                     <div>{referenceNumber}</div>
//                                                     {record["Tracking Details"] && (
//                                                         <div>Track: {record["Tracking Details"]}</div>
//                                                     )}
//                                                 </div>
//                                             </td>
//                                             <td>
//                                                 <div className="product-info">
//                                                     <div className="product-name">{record["Model Number"]}</div>
//                                                     <div className="product-model">{record.Description}</div>
//                                                 </div>
//                                             </td>
//                                             <td>
//                                                 <span className={`status-badge status-${getStatusColor(record.Status)}`}>
//                                                     {record.Status}
//                                                 </span>
//                                             </td>
//                                             <td>
//                                                 <div className="sku-info">
//                                                     <div className="sku-code">{record["Customer IMEI"] || 'N/A'}</div>
//                                                 </div>
//                                             </td>
//                                             <td>
//                                                 <div className="sku-info">
//                                                     <div className="sku-code">{record["Assurant IMEI"] || 'N/A'}</div>
//                                                 </div>
//                                             </td>
//                                             <td className="rma-col-right">${record.Amount.toLocaleString()}</td>
//                                             <td className="rma-col-right">{record.DaysOld}d</td>
//                                             <td>
//                                                 <button
//                                                     onClick={() => showDetails(record)}
//                                                     className="details-btn"
//                                                 >
//                                                     Details
//                                                 </button>
//                                                 <button
//                                                     onClick={() => toggleRowExpansion(uniqueId)}
//                                                     className="expand-btn"
//                                                 >
//                                                     {expandedRow === uniqueId ? '▼' : '►'} More
//                                                 </button>
//                                             </td>
//                                         </tr>

//                                         {expandedRow === uniqueId && (
//                                             <tr className="detail-row">
//                                                 <td colSpan={11}>
//                                                     <div className="detail-panel">
//                                                         <div className="detail-section">
//                                                             <h4>Device Information</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>Customer IMEI:</strong> {record["Customer IMEI"]}</div>
//                                                                 <div><strong>Assurant IMEI:</strong> {record["Assurant IMEI"]}</div>
//                                                                 <div><strong>Employee NTID:</strong> {record["Employee Name NTID"]}</div>
//                                                                 <div><strong>Door Code:</strong> {record["Door Code"]}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Process Details</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>Processed Date:</strong> {record["Processed Date"]}</div>
//                                                                 <div><strong>RMA Date:</strong> {record["RMA Date"]}</div>
//                                                                 <div><strong>Label Type:</strong> {record["Label Type"]}</div>
//                                                                 <div><strong>Count of Devices:</strong> {record["Count of Devices"]}</div>
//                                                                 <div><strong>Shipping Status:</strong> {record["Shipping Status"]}</div>
//                                                                 <div><strong>Tracking Details:</strong> {record["Tracking Details"]}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Additional Information</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>DM:</strong> {record["DM NAME"]}</div>
//                                                                 <div><strong>District:</strong> {record.DISTRICT}</div>
//                                                                 <div><strong>Date & Time:</strong> {record["Date & Time"]}</div>
//                                                                 {record.Error && <div><strong>Error:</strong> <span className="error-box">{record.Error}</span></div>}
//                                                             </div>
//                                                         </div>

//                                                         {(record["DM COMMENTS"] || record["BO COMMENTS"]) && (
//                                                             <div className="detail-section">
//                                                                 <h4>Comments</h4>
//                                                                 <div className="detail-grid">
//                                                                     {record["DM COMMENTS"] && <div><strong>DM Comments:</strong> {record["DM COMMENTS"]}</div>}
//                                                                     {record["BO COMMENTS"] && <div><strong>BO Comments:</strong> {record["BO COMMENTS"]}</div>}
//                                                                 </div>
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         )}
//                                     </React.Fragment>
//                                 );
//                             })}
//                         </tbody>
//                     </table>

//                     {paginatedData.length === 0 && (
//                         <div className="no-data">
//                             {searchTerm || imeiFilter || productFilter
//                                 ? `No RMA records found matching your filters.`
//                                 : "No RMA records found matching your criteria."
//                             }
//                             {(imeiFilter || productFilter) && (
//                                 <button
//                                     onClick={() => {
//                                         setImeiFilter('');
//                                         setProductFilter('');
//                                     }}
//                                     className="clear-filters-btn"
//                                 >
//                                     Clear Filters
//                                 </button>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 {shouldShowPagination && (
//                     <div className="pagination">
//                         <button
//                             onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                             disabled={currentPage === 1}
//                             className="pagination-btn"
//                         >
//                             Previous
//                         </button>
//                         <span className="page-info">
//                             Page {currentPage} of {totalPages}
//                         </span>
//                         <button
//                             onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                             disabled={currentPage === totalPages}
//                             className="pagination-btn"
//                         >
//                             Next
//                         </button>
//                     </div>
//                 )}
//             </div>
//         );
//     };

//     const renderBreadcrumb = () => {
//         return historyStack.map((item, index) => (
//             <span key={index} className="rma-breadcrumb">
//                 {item.selected ? `${item.level} — ${item.selected}` : item.level}
//                 {index < historyStack.length - 1 && <span className="mx-2 text-gray-400"> › </span>}
//             </span>
//         ));
//     };

//     const renderSummaryCards = () => (
//         <section className="dashboard-grid">
//             <div className="dashboard-card card-blue">
//                 <div className="card-icon">📊</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Total Records</h3>
//                     <p className="card-description">{summaryStats.totalRecords}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-purple">
//                 <div className="card-icon">💰</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Total Cost</h3>
//                     <p className="card-description">${summaryStats.totalCost.toLocaleString()}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-orange">
//                 <div className="card-icon">📦</div>
//                 <div className="card-content">
//                     <h3 className="card-title">RMA Records</h3>
//                     <p className="card-description">{summaryStats.rmaCount}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-red">
//                 <div className="card-icon">🔄</div>
//                 <div className="card-content">
//                     <h3 className="card-title">XBM Records</h3>
//                     <p className="card-description">{summaryStats.xbmCount}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-yellow">
//                 <div className="card-icon">🤝</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Trade IN</h3>
//                     <p className="card-description">{summaryStats.tradeInCount}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-teal">
//                 <div className="card-icon">⏳</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Pending</h3>
//                     <p className="card-description">{summaryStats.pendingCount}</p>
//                 </div>
//             </div>
//         </section>
//     );

//     if (isLoading) {
//         return (
//             <div className="app-loading">
//                 <div className="loading-spinner"></div>
//                 <p>Loading RMA Live Data...</p>
//             </div>
//         );
//     }

//     if (!isAuthenticated) return null;

//     if (error) {
//         return (
//             <div className={`home-page-content rma-page`}>
//                 <div className="error-container">
//                     <h2>Error Loading Data</h2>
//                     <p>{error}</p>
//                     <button onClick={fetchRMAData} className="retry-btn">
//                         Retry
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className={`home-page-content rma-page`}>
//             <div className="main-content">
//                 <div className="content-wrapper">
//                     <header className="topbar">
//                         <div className="brand">
//                             <div className="logo">📦</div>
//                             <div className="title">
//                                 <div className="main">RMA Live Dashboard</div>
//                                 <div className="sub">Return Merchandise Authorization - Live Tracking</div>
//                             </div>
//                         </div>
//                     </header>

//                     <main className="main-area">
//                         {/* Controls Section */}
//                         <div className="rma-controls-section">
//                             <div className="rma-controls-grid">
//                                 {/* Search Bar on Left */}
//                                 <div className="search-box">
//                                     <input
//                                         type="text"
//                                         placeholder="Search by Market, Store, RMA#, Tracking, IMEI..."
//                                         value={searchTerm}
//                                         onChange={(e) => setSearchTerm(e.target.value)}
//                                         className="search-input"
//                                     />
//                                     <span className="search-icon">🔍</span>
//                                     {searchTerm && (
//                                         <button
//                                             onClick={() => setSearchTerm("")}
//                                             className="clear-filter"
//                                             title="Clear search"
//                                         >
//                                             ✕
//                                         </button>
//                                     )}
//                                 </div>

//                                 {/* Buttons on Right */}
//                                 <div className="rma-action-buttons">
//                                     <button
//                                         onClick={handleExport}
//                                         className="btn btn-success"
//                                         disabled={exportLoading}
//                                     >
//                                         {exportLoading ? '⏳ Exporting...' : '📊 Export XLSX'}
//                                     </button>
//                                     <button
//                                         className="btn btn-primary"
//                                         onClick={fetchRMAData}
//                                     >
//                                         🔄 Refresh Data
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>

//                         {renderSummaryCards()}

//                         {/* Navigation */}
//                         <div className="rma-nav-row">
//                             {historyStack.length > 1 && (
//                                 <button className="btn" onClick={handleBackClick}>
//                                     ← Back
//                                 </button>
//                             )}
//                             <div className="rma-breadcrumb">{renderBreadcrumb()}</div>
//                         </div>

//                         {/* Table Content */}
//                         <section className="rma-stacked">
//                             {currentView === 'markets' && renderHierarchicalTable(currentData, 'markets', handleMarketClick)}
//                             {currentView === 'dm' && renderHierarchicalTable(currentData, 'dm', handleDMClick)}
//                             {currentView === 'types' && renderHierarchicalTable(currentData, 'types', handleTypeClick)}
//                             {currentView === 'detailed' && renderDetailedTable()}
//                         </section>

//                         {exportLoading && (
//                             <div className="export-loading">
//                                 <div className="loading-spinner"></div>
//                                 <p>Preparing XLSX export with all data...</p>
//                             </div>
//                         )}

//                         {selectedRecord && (
//                             <div className="modal-overlay" onClick={closeDetails}>
//                                 <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                                     <div className="modal-header">
//                                         <h3>Record Details - {selectedRecord.RecordType}</h3>
//                                         <button className="close-btn" onClick={closeDetails}>×</button>
//                                     </div>
//                                     <div className="modal-body">
//                                         <div className="modal-detail-grid">
//                                             <div><strong>Store:</strong> {selectedRecord["Store Name"]}</div>
//                                             <div><strong>Market:</strong> {selectedRecord.Market}</div>
//                                             <div><strong>DM:</strong> {selectedRecord["DM NAME"]}</div>
//                                             <div><strong>Reference #:</strong> {selectedRecord.RecordType === 'XBM' ? selectedRecord["XBM Number"] : selectedRecord["RMA #"]}</div>
//                                             <div><strong>Model:</strong> {selectedRecord["Model Number"]}</div>
//                                             <div><strong>Description:</strong> {selectedRecord.Description}</div>
//                                             <div><strong>Status:</strong>
//                                                 <span className={`status-badge status-${getStatusColor(selectedRecord.Status)}`}>
//                                                     {selectedRecord.Status}
//                                                 </span>
//                                             </div>
//                                             <div><strong>Customer IMEI:</strong> {selectedRecord["Customer IMEI"]}</div>
//                                             <div><strong>Assurant IMEI:</strong> {selectedRecord["Assurant IMEI"]}</div>
//                                             <div><strong>Cost:</strong> ${selectedRecord.Amount.toLocaleString()}</div>
//                                             <div><strong>Age:</strong> {selectedRecord.DaysOld} days</div>
//                                             <div><strong>Tracking:</strong> {selectedRecord["Tracking Details"] || 'Not available'}</div>
//                                             <div><strong>Shipping Status:</strong> {selectedRecord["Shipping Status"]}</div>
//                                             {selectedRecord.Error && <div><strong>Error:</strong> <span className="error-text">{selectedRecord.Error}</span></div>}
//                                         </div>
//                                     </div>
//                                     <div className="modal-actions">
//                                         <button className="btn btn-primary modal-close-cta" onClick={closeDetails}>Close</button>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//                     </main>
//                 </div>
//             </div>
//         </div>
//     );
// }   









'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import './rma_live_styles.css';

type Row = { [k: string]: string | undefined };

interface RMARecord {
    "DM COMMENTS": string;
    "DM Comments": string;
    "BO COMMENTS": string;
    "Market": string;
    "DISTRICT": string;
    "DM NAME": string;
    "Store ID": string;
    "Store Name": string;
    "Door Code": string;
    "Model Number": string;
    "Description": string;
    "Customer IMEI": string;
    "Employee Name NTID": string;
    "Assurant IMEI": string;
    "Processed Date": string;
    "Label Type": string;
    "RMA #": string;
    "RMA Date": string;
    "Count of Devices": string;
    "Tracking Details": string;
    "Date & Time": string;
    "Shipping Status": string;
    "COST": string;
    "AGE": string;
    "Error": string;
    "RMA Number"?: string;
    "XBM Number"?: string;
    ""?: string;
    "APPROVED/NOT"?: string;
    "RecordType": "RMA" | "XBM" | "TRADE_IN";
    "Status": string;
    "Amount": number;
    "DaysOld": number;
}

interface AggregatedGroup {
    key: string;
    count: number;
    devices: number;
    cost: number;
    pending: number;
    rows: RMARecord[];
    days7: number;
    days14: number;
    days14Plus: number;
}

interface SummaryStats {
    totalRecords: number;
    totalCost: number;
    rmaCount: number;
    xbmCount: number;
    tradeInCount: number;
    pendingCount: number;
    devicesWithIMEI: number;
    averageAge: number;
    maxAge: number;
}

export default function RMALivePage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [rmaData, setRmaData] = useState<RMARecord[]>([]);
    const [xbmData, setXbmData] = useState<RMARecord[]>([]);
    const [tradeInData, setTradeInData] = useState<RMARecord[]>([]);
    const [combinedData, setCombinedData] = useState<RMARecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<RMARecord | null>(null);
    const [exportLoading, setExportLoading] = useState(false);

    const [currentView, setCurrentView] = useState<'markets' | 'dm' | 'types' | 'detailed'>('markets');
    const [currentData, setCurrentData] = useState<RMARecord[]>([]);
    const [selectedMarket, setSelectedMarket] = useState<string>('');
    const [selectedDM, setSelectedDM] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([
        { level: 'Markets' }
    ]);

    const [imeiFilter, setImeiFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');

    const dataSources = [
        {
            id: 'RMA',
            name: 'RMA',
            gid: '1825921334',
            description: 'RMA Data',
            type: 'rma',
            url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=1825921334&single=true&output=csv'
        },
        {
            id: 'TRADE_IN',
            name: 'Trade IN',
            gid: '1934446761',
            description: 'Trade IN Data',
            type: 'trade_in',
            url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=1934446761&single=true&output=csv'
        },
        {
            id: 'XBM',
            name: 'XBM',
            gid: '166966411',
            description: 'XBM Data',
            type: 'xbm',
            url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=166966411&single=true&output=csv'
        }
    ];

    const isValidIMEI = (imei: string): boolean => {
        if (!imei ||
            imei === 'Unknown' ||
            imei === 'N/A' ||
            imei === '' ||
            imei === 'null' ||
            imei === ' ' ||
            imei === 'undefined') {
            return false;
        }

        const lowerIMEI = imei.toLowerCase().trim();
        if (lowerIMEI.includes('no imei') ||
            lowerIMEI.includes('none') ||
            lowerIMEI.includes('pending') ||
            lowerIMEI.includes('n/a') ||
            lowerIMEI.includes('unknown') ||
            lowerIMEI.includes('to be filled') ||
            lowerIMEI.includes('tbd') ||
            lowerIMEI === '' ||
            lowerIMEI.length < 8) {
            return false;
        }

        const numericIMEI = imei.replace(/\D/g, '');
        return numericIMEI.length >= 8;
    };

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRMAData();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (rmaData.length > 0 || xbmData.length > 0 || tradeInData.length > 0) {
            combineData();
        }
    }, [rmaData, xbmData, tradeInData]);

    useEffect(() => {
        setCurrentData(combinedData);
    }, [combinedData]);

    useEffect(() => {
        const prev = typeof document !== 'undefined' ? document.body.style.overflow : '';
        if (selectedRecord) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = prev;
        }
        return () => {
            if (typeof document !== 'undefined') document.body.style.overflow = prev;
        };
    }, [selectedRecord]);

    useEffect(() => {
        setImeiFilter("");
        setProductFilter("");
        setCurrentPage(1);
    }, [currentView, searchTerm]);

    const splitCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result.map(field => field.replace(/^"|"$/g, ''));
    };

    const parseCSV = (csvText: string): Row[] => {
        try {
            const text = csvText.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
            const lines = text.split('\n').filter((l) => l.trim().length > 0);
            if (lines.length < 2) return [];

            const headers = splitCsvLine(lines[0]).map((h) => h.trim());
            const data = lines.slice(1).map((line) => {
                try {
                    const vals = splitCsvLine(line);
                    const obj: Row = {};
                    headers.forEach((h, i) => {
                        obj[h] = (vals[i] ?? '').trim();
                    });
                    return obj;
                } catch (rowError) {
                    console.error('Error parsing row:', rowError);
                    return {};
                }
            }).filter(row => Object.keys(row).length > 0);

            return data;
        } catch (parseError) {
            console.error('Error parsing CSV:', parseError);
            return [];
        }
    };

    const filterDataAtSource = (rows: Row[], sourceType: string): Row[] => {
        return rows.filter(row => {
            const imei = String(row['Customer IMEI'] || '').trim();
            if (!isValidIMEI(imei)) {
                return false;
            }

            const status = getStatusFromRow(row, sourceType);
            const normalizedStatus = normalizeStatus(status);

            if (normalizedStatus !== 'Pending') {
                return false;
            }

            return true;
        });
    };

    const getStatusFromRow = (row: Row, sourceType: string): string => {
        const statusFields = ['Status', 'Shipping Status', 'APPROVED/NOT'];
        for (const field of statusFields) {
            if (row[field] !== undefined && String(row[field]).trim() !== '') {
                return String(row[field]).trim();
            }
        }

        if (sourceType === 'xbm') {
            return String(row[''] || '').trim() || 'Pending';
        } else if (sourceType === 'trade_in') {
            return String(row['APPROVED/NOT'] || '').trim() || 'Pending';
        }

        return 'Pending';
    };

    const normalizeStatus = (raw: any): string => {
        if (raw == null) return 'Pending';

        const s = String(raw).toLowerCase().trim();

        if (s === 'pending' ||
            s.includes('pending') ||
            s.includes('not available') ||
            s.includes('awaiting') ||
            s.includes('to be filled') ||
            s === '') {
            return 'Pending';
        }

        return 'NotPending';
    };

    const fetchDataSource = async (source: any): Promise<Row[]> => {
        try {
            const response = await fetch(source.url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const csvText = await response.text();
            if (!csvText || csvText.trim().length === 0) throw new Error('Empty response');
            const parsedData = parseCSV(csvText);
            if (parsedData.length === 0) throw new Error('No data parsed');

            const filteredData = filterDataAtSource(parsedData, source.type);

            console.log(`📊 ${source.name} - Source filtering:`, {
                raw: parsedData.length,
                filtered: filteredData.length,
                removed: parsedData.length - filteredData.length
            });

            return filteredData;
        } catch (err) {
            console.error(`Error fetching ${source.name}:`, err);
            return [];
        }
    };

    const parseCurrency = useCallback((value: any): number => {
        if (value == null || value === '' || value === undefined) {
            return 0;
        }

        const str = String(value).trim();
        if (str === '' || str === '-' || str === 'N/A' || str === 'null' || str === ' ' || str === '#DIV/0!') {
            return 0;
        }

        const cleaned = str
            .replace(/\$/g, '')
            .replace(/,/g, '')
            .replace(/\s+/g, '')
            .replace(/[^\d.-]/g, '');

        const parts = cleaned.split('.');
        let finalNumber = parts[0];
        if (parts.length > 1) {
            finalNumber += '.' + parts.slice(1).join('');
        }

        const n = parseFloat(finalNumber);
        return isNaN(n) ? 0 : n;
    }, []);

    const parseIntSafe = useCallback((v: any): number => {
        if (v == null || v === '' || v === undefined) return 0;
        const str = String(v).trim();
        if (str === '' || str === '-' || str === 'N/A' || str === 'null' || str === ' ' || str === '#DIV/0!') {
            return 0;
        }
        const n = parseInt(str);
        return isNaN(n) ? 0 : n;
    }, []);

    const transformToRMARecord = (row: Row, type: "RMA" | "XBM" | "TRADE_IN"): RMARecord => {
        const getValue = (keys: string[]): string => {
            for (const key of keys) {
                if (row[key] !== undefined && String(row[key]).trim() !== '') {
                    return String(row[key]).trim();
                }
            }
            return '';
        };

        let cost = 0;
        const costFields = ['COST', 'Cost', 'AMOUNT', 'Amount', 'TOTAL COST', 'Total Cost'];

        for (const field of costFields) {
            const costValue = parseCurrency(getValue([field]));
            if (costValue > 0) {
                cost = costValue;
                break;
            }
        }

        if (cost === 0) {
            Object.keys(row).forEach(key => {
                if (key && (key.toLowerCase().includes('cost') || key.toLowerCase().includes('amount'))) {
                    const potentialCost = parseCurrency(row[key]);
                    if (potentialCost > 0) {
                        cost = potentialCost;
                    }
                }
            });
        }

        const age = parseIntSafe(getValue(['AGE', 'Age'])) || 0;

        const status = getStatusFromRow(row, type.toLowerCase());
        const normalizedStatus = normalizeStatus(status);

        const record: RMARecord = {
            "DM COMMENTS": getValue(['DM COMMENTS', 'DM Comments']),
            "DM Comments": getValue(['DM Comments', 'DM COMMENTS']),
            "BO COMMENTS": getValue(['BO COMMENTS']),
            "Market": getValue(['Market']),
            "DISTRICT": getValue(['DISTRICT', 'District']),
            "DM NAME": getValue(['DM NAME', 'DM Name']),
            "Store ID": getValue(['Store ID']),
            "Store Name": getValue(['Store Name']),
            "Door Code": getValue(['Door Code']),
            "Model Number": getValue(['Model Number']),
            "Description": getValue(['Description']),
            "Customer IMEI": getValue(['Customer IMEI']),
            "Employee Name NTID": getValue(['Employee Name NTID']),
            "Assurant IMEI": getValue(['Assurant IMEI']),
            "Processed Date": getValue(['Processed Date']),
            "Label Type": getValue(['Label Type']),
            "RMA #": getValue(['RMA #', 'RMA Number']),
            "RMA Date": getValue(['RMA Date']),
            "Count of Devices": getValue(['Count of Devices']),
            "Tracking Details": getValue(['Tracking Details']),
            "Date & Time": getValue(['Date & Time']),
            "Shipping Status": getValue(['Shipping Status']),
            "COST": getValue(['COST']),
            "AGE": getValue(['AGE']),
            "Error": getValue(['Error']),
            "RMA Number": type === 'RMA' ? getValue(['RMA #']) : undefined,
            "XBM Number": type === 'XBM' ? getValue(['XBM Number']) : undefined,
            "": type === 'XBM' ? getValue(['']) : undefined,
            "APPROVED/NOT": type === 'TRADE_IN' ? getValue(['APPROVED/NOT']) : undefined,
            "RecordType": type,
            "Status": normalizedStatus,
            "Amount": cost,
            "DaysOld": age
        };

        return record;
    };

    const fetchRMAData = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('🔄 Starting RMA data fetch from Google Sheets...');

            const [rmaRows, tradeInRows, xbmRows] = await Promise.all([
                fetchDataSource(dataSources[0]),
                fetchDataSource(dataSources[1]),
                fetchDataSource(dataSources[2])
            ]);

            console.log('📊 RMA Data loaded:', {
                rma: rmaRows.length,
                tradeIn: tradeInRows.length,
                xbm: xbmRows.length
            });

            const transformedRMA = rmaRows.map(row => transformToRMARecord(row, "RMA"));
            const transformedTradeIN = tradeInRows.map(row => transformToRMARecord(row, "TRADE_IN"));
            const transformedXBM = xbmRows.map(row => transformToRMARecord(row, "XBM"));

            setRmaData(transformedRMA);
            setTradeInData(transformedTradeIN);
            setXbmData(transformedXBM);

        } catch (err) {
            setError('Failed to load RMA data');
            console.error('Error fetching RMA data:', err);
        } finally {
            setLoading(false);
        }
    };

    const combineData = () => {
        const allData = [...rmaData, ...xbmData, ...tradeInData];

        const filteredData = allData.filter(record =>
            record &&
            record.Status &&
            String(record.Status).toLowerCase() === 'pending' &&
            isValidIMEI(record["Customer IMEI"] || '')
        );

        console.log('🔄 Combined RMA data (strict filtering):', {
            totalRecords: allData.length,
            pendingWithValidIMEI: filteredData.length,
            totalCost: filteredData.reduce((sum, r) => sum + r.Amount, 0)
        });

        setCombinedData(filteredData);
    };

    const searchData = useCallback((data: RMARecord[], searchTerm: string): RMARecord[] => {
        if (!searchTerm.trim()) return data;
        const searchLower = searchTerm.toLowerCase().trim();

        return data.filter((record) => {
            const searchableFields = [
                record.Market,
                record["Store Name"],
                record["Store ID"],
                record["RMA #"],
                record["XBM Number"],
                record["Tracking Details"],
                record["Model Number"],
                record["Description"],
                record["DM NAME"],
                record["Customer IMEI"],
                record["Assurant IMEI"],
                record["Door Code"],
                record["Employee Name NTID"]
            ].filter((field) => field && field !== "" && field !== "Unknown");

            return searchableFields.some((field) =>
                String(field).toLowerCase().includes(searchLower)
            );
        });
    }, []);

    const filteredData = useMemo(() => {
        let data = currentData;

        if (searchTerm.trim()) {
            data = searchData(data, searchTerm);
        }

        if (currentView === 'detailed') {
            if (imeiFilter.trim()) {
                const imeiLower = imeiFilter.toLowerCase().trim();
                data = data.filter(record =>
                    record["Customer IMEI"]?.toLowerCase().includes(imeiLower) ||
                    record["Assurant IMEI"]?.toLowerCase().includes(imeiLower)
                );
            }

            if (productFilter.trim()) {
                const productLower = productFilter.toLowerCase().trim();
                data = data.filter(record =>
                    record["Model Number"]?.toLowerCase().includes(productLower) ||
                    record["Description"]?.toLowerCase().includes(productLower)
                );
            }
        }

        return data;
    }, [currentData, searchTerm, currentView, imeiFilter, productFilter, searchData]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const aggregateData = (data: RMARecord[], level: 'markets' | 'dm' | 'types'): AggregatedGroup[] => {
        const groups: { [key: string]: AggregatedGroup } = {};

        if (level === 'markets') {
            const markets = Array.from(new Set(data.map(record => record.Market))).filter(m => m && m !== 'Unknown');

            markets.forEach(market => {
                const marketData = data.filter(record => record.Market === market);
                const totalCost = marketData.reduce((sum, record) => sum + record.Amount, 0);
                const pendingCount = marketData.length;

                // Count devices by age categories
                let days7 = 0;
                let days14 = 0;
                let days14Plus = 0;

                marketData.forEach(record => {
                    if (record.DaysOld <= 7) {
                        days7++;
                    } else if (record.DaysOld <= 14) {
                        days14++;
                    } else {
                        days14Plus++;
                    }
                });

                groups[market] = {
                    key: market,
                    count: marketData.length,
                    devices: marketData.length,
                    cost: totalCost,
                    pending: pendingCount,
                    days7: days7,
                    days14: days14,
                    days14Plus: days14Plus,
                    rows: marketData
                };
            });
        } else if (level === 'dm') {
            const dms = Array.from(new Set(data.map(record => record["DM NAME"]))).filter(dm => dm && dm !== 'Unknown');

            dms.forEach(dm => {
                const dmData = data.filter(record => record["DM NAME"] === dm);
                const totalCost = dmData.reduce((sum, record) => sum + record.Amount, 0);
                const pendingCount = dmData.length;

                // Count devices by age categories
                let days7 = 0;
                let days14 = 0;
                let days14Plus = 0;

                dmData.forEach(record => {
                    if (record.DaysOld <= 7) {
                        days7++;
                    } else if (record.DaysOld <= 14) {
                        days14++;
                    } else {
                        days14Plus++;
                    }
                });

                groups[dm] = {
                    key: dm,
                    count: dmData.length,
                    devices: dmData.length,
                    cost: totalCost,
                    pending: pendingCount,
                    days7: days7,
                    days14: days14,
                    days14Plus: days14Plus,
                    rows: dmData
                };
            });
        } else if (level === 'types') {
            const types = Array.from(new Set(data.map(record => record.RecordType)));

            types.forEach(type => {
                const typeData = data.filter(record => record.RecordType === type);
                const totalCost = typeData.reduce((sum, record) => sum + record.Amount, 0);
                const pendingCount = typeData.length;

                // Count devices by age categories
                let days7 = 0;
                let days14 = 0;
                let days14Plus = 0;

                typeData.forEach(record => {
                    if (record.DaysOld <= 7) {
                        days7++;
                    } else if (record.DaysOld <= 14) {
                        days14++;
                    } else {
                        days14Plus++;
                    }
                });

                groups[type] = {
                    key: type,
                    count: typeData.length,
                    devices: typeData.length,
                    cost: totalCost,
                    pending: pendingCount,
                    days7: days7,
                    days14: days14,
                    days14Plus: days14Plus,
                    rows: typeData
                };
            });
        }

        return Object.values(groups).sort((a, b) => b.cost - a.cost);
    };

    const handleMarketClick = (market: AggregatedGroup) => {
        setCurrentData(market.rows);
        setCurrentView('dm');
        setSelectedMarket(market.key);
        setHistoryStack([
            { level: 'Markets' },
            { level: 'District Managers', selected: market.key }
        ]);
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleDMClick = (dm: AggregatedGroup) => {
        setCurrentData(dm.rows);
        setCurrentView('types');
        setSelectedDM(dm.key);
        setHistoryStack([
            { level: 'Markets' },
            { level: 'District Managers', selected: selectedMarket },
            { level: 'Record Types', selected: dm.key }
        ]);
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleTypeClick = (type: AggregatedGroup) => {
        setCurrentData(type.rows);
        setCurrentView('detailed');
        setSelectedType(type.key);
        setHistoryStack([
            { level: 'Markets' },
            { level: 'District Managers', selected: selectedMarket },
            { level: 'Record Types', selected: selectedDM },
            { level: 'Detailed', selected: type.key }
        ]);
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handleBackClick = () => {
        if (historyStack.length <= 1) {
            setCurrentData(combinedData);
            setCurrentView('markets');
            setHistoryStack([{ level: 'Markets' }]);
            setSelectedMarket('');
            setSelectedDM('');
            setSelectedType('');
            setSearchTerm('');
            setCurrentPage(1);
        } else {
            const newStack = historyStack.slice(0, -1);
            setHistoryStack(newStack);
            const previousLevel = newStack[newStack.length - 1];

            if (previousLevel.level === 'Markets') {
                setCurrentData(combinedData);
                setCurrentView('markets');
                setSelectedMarket('');
                setSearchTerm('');
                setCurrentPage(1);
            } else if (previousLevel.level === 'District Managers') {
                const marketData = combinedData.filter(record => record.Market === selectedMarket);
                setCurrentData(marketData);
                setCurrentView('dm');
                setSelectedDM('');
                setSearchTerm('');
                setCurrentPage(1);
            } else if (previousLevel.level === 'Record Types') {
                const dmData = combinedData.filter(
                    record => record.Market === selectedMarket && record["DM NAME"] === selectedDM
                );
                setCurrentData(dmData);
                setCurrentView('types');
                setSelectedType('');
                setSearchTerm('');
                setCurrentPage(1);
            }
        }
    };

    const exportToXLSX = useCallback(async () => {
        try {
            setExportLoading(true);
            const workbook = XLSX.utils.book_new();

            if (rmaData.length > 0) {
                const rmaWorksheet = XLSX.utils.json_to_sheet(rmaData);
                XLSX.utils.book_append_sheet(workbook, rmaWorksheet, 'RMA Data');
            }
            if (xbmData.length > 0) {
                const xbmWorksheet = XLSX.utils.json_to_sheet(xbmData);
                XLSX.utils.book_append_sheet(workbook, xbmWorksheet, 'XBM Data');
            }
            if (tradeInData.length > 0) {
                const tradeInWorksheet = XLSX.utils.json_to_sheet(tradeInData);
                XLSX.utils.book_append_sheet(workbook, tradeInWorksheet, 'Trade IN Data');
            }
            if (filteredData.length > 0) {
                const currentWorksheet = XLSX.utils.json_to_sheet(filteredData);
                XLSX.utils.book_append_sheet(workbook, currentWorksheet, 'Current View');
            }

            const fileName = `rma_live_data_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error('Error exporting to XLSX:', error);
            setError('Failed to export XLSX file');
        } finally {
            setExportLoading(false);
        }
    }, [rmaData, xbmData, tradeInData, filteredData]);

    const handleExport = useCallback(() => {
        exportToXLSX();
    }, [exportToXLSX]);

    const getStatusColor = (status: string): string => {
        const statusColors: { [key: string]: string } = {
            'pending': 'yellow',
            'shipped': 'blue',
            'delivered': 'green',
            'cancelled': 'red',
            'approved': 'green',
            'rejected': 'red',
            'completed': 'green'
        };
        return statusColors[status.toLowerCase()] || 'gray';
    };

    const getRecordTypeColor = (type: string): string => {
        const typeColors: { [key: string]: string } = {
            'rma': 'blue',
            'xbm': 'purple',
            'trade_in': 'orange'
        };
        return typeColors[type.toLowerCase()] || 'gray';
    };

    const toggleRowExpansion = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const showDetails = (record: RMARecord) => {
        setSelectedRecord(record);
    };

    const closeDetails = () => {
        setSelectedRecord(null);
    };

    const summaryStats = useMemo((): SummaryStats => {
        const dataToUse = filteredData.length > 0 ? filteredData : combinedData;

        const totalRecords = dataToUse.length;
        const totalCost = dataToUse.reduce((sum, record) => sum + record.Amount, 0);

        const rmaCount = dataToUse.filter(record => record.RecordType === 'RMA').length;
        const xbmCount = dataToUse.filter(record => record.RecordType === 'XBM').length;
        const tradeInCount = dataToUse.filter(record => record.RecordType === 'TRADE_IN').length;

        const ages = dataToUse.map(record => record.DaysOld).filter(age => age > 0);
        const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
        const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

        const pendingCount = totalRecords;

        return {
            totalRecords,
            totalCost,
            rmaCount,
            xbmCount,
            tradeInCount,
            pendingCount,
            devicesWithIMEI: totalRecords,
            averageAge,
            maxAge
        };
    }, [filteredData, combinedData]);

    const renderHierarchicalTable = (data: RMARecord[], level: 'markets' | 'dm' | 'types', onRowClick: (group: AggregatedGroup) => void) => {
        const aggregated = aggregateData(data, level);
        const maxCost = Math.max(...aggregated.map(a => a.cost), 1);
        const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

        let title = '';
        switch (level) {
            case 'markets':
                title = 'Markets';
                break;
            case 'dm':
                title = 'District Managers';
                break;
            case 'types':
                title = 'Record Types';
                break;
        }

        return (
            <div className="rma-table-block">
                <div className="rma-table-header">
                    <h2>{title}</h2>
                    <div className="rma-meta">
                        {aggregated.length} groups — {data.length} total records — total value ${totalCost.toLocaleString()}
                        {searchTerm && ` • Filtered by: "${searchTerm}"`}
                    </div>
                </div>

                <div className="rma-table-wrapper">
                    <table className="rma-table">
                        <thead>
                            <tr>
                                <th>{title}</th>
                                {/* <th className="rma-col-right">Records</th> */}
                                <th className="rma-col-right">Devices</th>
                                <th className="rma-col-right">Pending</th>
                                <th className="rma-col-right">Total Cost</th>
                                <th className="rma-col-right">7 Days</th>
                                <th className="rma-col-right">14 Days</th>
                                <th className="rma-col-right">14+ Days</th>
                                <th>Value Distribution</th>
                            </tr>
                        </thead>


                        <tbody>
                            {aggregated.map((group, index) => {
                                const pct = Math.round((group.cost / maxCost) * 100);
                                const fillClass = pct >= 70 ? "rma-fill-green" : pct >= 40 ? "rma-fill-amber" : "rma-fill-red";

                                return (
                                    <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
                                        <td>{group.key}</td>
                                        {/* <td className="rma-col-right">{group.count}</td> */}
                                        <td className="rma-col-right">{group.devices}</td>
                                        <td className="rma-col-right">{group.pending}</td>
                                        <td className="rma-col-right">${group.cost.toLocaleString()}</td>
                                        <td className="rma-col-right">
                                            <span className={`age-badge ${group.days7 > 0 ? 'age-badge-7' : 'age-badge-empty'}`}>
                                                {group.days7}
                                            </span>
                                        </td>
                                        <td className="rma-col-right">
                                            <span className={`age-badge ${group.days14 > 0 ? 'age-badge-14' : 'age-badge-empty'}`}>
                                                {group.days14}
                                            </span>
                                        </td>
                                        <td className="rma-col-right">
                                            <span className={`age-badge ${group.days14Plus > 0 ? 'age-badge-14plus' : 'age-badge-empty'}`}>
                                                {group.days14Plus}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="rma-bar-cell">
                                                <div className="rma-bar-track">
                                                    <div className={`rma-bar-fill ${fillClass}`} style={{ width: `${pct}%` }}></div>
                                                </div>
                                                <div style={{ minWidth: "52px", textAlign: "right" }}>{pct}%</div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderDetailedTable = () => {
        const shouldShowPagination = filteredData.length > itemsPerPage;

        return (
            <div className="rma-table-block">
                <div className="rma-table-header">
                    <h2>
                        {historyStack[historyStack.length - 1]?.level === 'Search Results'
                            ? `Search Results for "${searchTerm}"`
                            : `Detailed Report - ${selectedType}`
                        }
                    </h2>
                    <div className="rma-meta">
                        {filteredData.length} RMA records
                        {searchTerm && ` matching "${searchTerm}"`}
                        {(imeiFilter || productFilter) && (
                            <span className="filter-indicator">
                                {imeiFilter && ` • IMEI: "${imeiFilter}"`}
                                {productFilter && ` • Product: "${productFilter}"`}
                            </span>
                        )}
                    </div>
                </div>

                <div className="rma-filter-controls">
                    <div className="filter-group">
                        <label htmlFor="imei-filter">Search by IMEI:</label>
                        <input
                            id="imei-filter"
                            type="text"
                            placeholder="e.g., 123456789012345, 987654321098765..."
                            value={imeiFilter}
                            onChange={(e) => setImeiFilter(e.target.value)}
                            className="filter-input"
                        />
                        {imeiFilter && (
                            <button
                                onClick={() => setImeiFilter("")}
                                className="clear-filter"
                                title="Clear IMEI filter"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="filter-group">
                        <label htmlFor="product-filter">Search by Product/Model:</label>
                        <input
                            id="product-filter"
                            type="text"
                            placeholder="e.g., iPhone 16, Samsung, Moto G, XT24191..."
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            className="filter-input"
                        />
                        {productFilter && (
                            <button
                                onClick={() => setProductFilter("")}
                                className="clear-filter"
                                title="Clear product filter"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {(imeiFilter || productFilter) && (
                        <button
                            onClick={() => {
                                setImeiFilter('');
                                setProductFilter('');
                            }}
                            className="clear-all-filters"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>

                <div className="rma-table-wrapper">
                    <table className="rma-table detailed-view">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Market</th>
                                <th>Store</th>
                                <th>Reference #</th>
                                <th>Model</th>
                                <th>Status</th>
                                <th>Customer IMEI</th>
                                <th>Assurant IMEI</th>
                                <th className="rma-col-right">Cost</th>
                                <th className="rma-col-right">Age</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((record, index) => {
                                const uniqueId = `${record.RecordType}-${record["RMA #"] || record["XBM Number"]}-${index}`;
                                const referenceNumber = record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"];

                                return (
                                    <React.Fragment key={uniqueId}>
                                        <tr className="clickable-row">
                                            <td>
                                                <span className={`record-type-badge type-${getRecordTypeColor(record.RecordType)}`}>
                                                    {record.RecordType}
                                                </span>
                                            </td>
                                            <td>{record.Market}</td>
                                            <td>
                                                <div className="store-info">
                                                    <div className="store-name">{record["Store Name"]}</div>
                                                    <div className="store-id">{record["Store ID"]}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div>{referenceNumber}</div>
                                                    {record["Tracking Details"] && (
                                                        <div>Track: {record["Tracking Details"]}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="product-info">
                                                    <div className="product-name">{record["Model Number"]}</div>
                                                    <div className="product-model">{record.Description}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${getStatusColor(record.Status)}`}>
                                                    {record.Status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="sku-info">
                                                    <div className="sku-code">{record["Customer IMEI"] || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="sku-info">
                                                    <div className="sku-code">{record["Assurant IMEI"] || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td className="rma-col-right">${record.Amount.toLocaleString()}</td>
                                            <td className="rma-col-right">{record.DaysOld}d</td>
                                            <td>
                                                <button
                                                    onClick={() => showDetails(record)}
                                                    className="details-btn"
                                                >
                                                    Details
                                                </button>
                                                <button
                                                    onClick={() => toggleRowExpansion(uniqueId)}
                                                    className="expand-btn"
                                                >
                                                    {expandedRow === uniqueId ? '▼' : '►'} More
                                                </button>
                                            </td>
                                        </tr>

                                        {expandedRow === uniqueId && (
                                            <tr className="detail-row">
                                                <td colSpan={11}>
                                                    <div className="detail-panel">
                                                        <div className="detail-section">
                                                            <h4>Device Information</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>Customer IMEI:</strong> {record["Customer IMEI"]}</div>
                                                                <div><strong>Assurant IMEI:</strong> {record["Assurant IMEI"]}</div>
                                                                <div><strong>Employee NTID:</strong> {record["Employee Name NTID"]}</div>
                                                                <div><strong>Door Code:</strong> {record["Door Code"]}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Process Details</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>Processed Date:</strong> {record["Processed Date"]}</div>
                                                                <div><strong>RMA Date:</strong> {record["RMA Date"]}</div>
                                                                <div><strong>Label Type:</strong> {record["Label Type"]}</div>
                                                                <div><strong>Count of Devices:</strong> {record["Count of Devices"]}</div>
                                                                <div><strong>Shipping Status:</strong> {record["Shipping Status"]}</div>
                                                                <div><strong>Tracking Details:</strong> {record["Tracking Details"]}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Additional Information</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>DM:</strong> {record["DM NAME"]}</div>
                                                                <div><strong>District:</strong> {record.DISTRICT}</div>
                                                                <div><strong>Date & Time:</strong> {record["Date & Time"]}</div>
                                                                {record.Error && <div><strong>Error:</strong> <span className="error-box">{record.Error}</span></div>}
                                                            </div>
                                                        </div>

                                                        {(record["DM COMMENTS"] || record["BO COMMENTS"]) && (
                                                            <div className="detail-section">
                                                                <h4>Comments</h4>
                                                                <div className="detail-grid">
                                                                    {record["DM COMMENTS"] && <div><strong>DM Comments:</strong> {record["DM COMMENTS"]}</div>}
                                                                    {record["BO COMMENTS"] && <div><strong>BO Comments:</strong> {record["BO COMMENTS"]}</div>}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>

                    {paginatedData.length === 0 && (
                        <div className="no-data">
                            {searchTerm || imeiFilter || productFilter
                                ? `No RMA records found matching your filters.`
                                : "No RMA records found matching your criteria."
                            }
                            {(imeiFilter || productFilter) && (
                                <button
                                    onClick={() => {
                                        setImeiFilter('');
                                        setProductFilter('');
                                    }}
                                    className="clear-filters-btn"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {shouldShowPagination && (
                    <div className="pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="pagination-btn"
                        >
                            Previous
                        </button>
                        <span className="page-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderBreadcrumb = () => {
        return historyStack.map((item, index) => (
            <span key={index} className="rma-breadcrumb">
                {item.selected ? `${item.level} — ${item.selected}` : item.level}
                {index < historyStack.length - 1 && <span className="mx-2 text-gray-400"> › </span>}
            </span>
        ));
    };

    const renderSummaryCards = () => (
        <section className="dashboard-grid">
            <div className="dashboard-card card-blue">
                <div className="card-icon">📊</div>
                <div className="card-content">
                    <h3 className="card-title">Total Records</h3>
                    <p className="card-description">{summaryStats.totalRecords}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">💰</div>
                <div className="card-content">
                    <h3 className="card-title">Total Cost</h3>
                    <p className="card-description">${summaryStats.totalCost.toLocaleString()}</p>
                </div>
            </div>
            <div className="dashboard-card card-orange">
                <div className="card-icon">📦</div>
                <div className="card-content">
                    <h3 className="card-title">RMA Records</h3>
                    <p className="card-description">{summaryStats.rmaCount}</p>
                </div>
            </div>
            <div className="dashboard-card card-red">
                <div className="card-icon">🔄</div>
                <div className="card-content">
                    <h3 className="card-title">XBM Records</h3>
                    <p className="card-description">{summaryStats.xbmCount}</p>
                </div>
            </div>
            <div className="dashboard-card card-yellow">
                <div className="card-icon">🤝</div>
                <div className="card-content">
                    <h3 className="card-title">Trade IN</h3>
                    <p className="card-description">{summaryStats.tradeInCount}</p>
                </div>
            </div>
            <div className="dashboard-card card-teal">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                    <h3 className="card-title">Pending</h3>
                    <p className="card-description">{summaryStats.pendingCount}</p>
                </div>
            </div>
        </section>
    );

    if (isLoading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner"></div>
                <p>Loading RMA Live Data...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (error) {
        return (
            <div className={`home-page-content rma-page`}>
                <div className="error-container">
                    <h2>Error Loading Data</h2>
                    <p>{error}</p>
                    <button onClick={fetchRMAData} className="retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`home-page-content rma-page`}>
            <div className="main-content">
                <div className="content-wrapper">
                    <header className="topbar">
                        <div className="brand">
                            <div className="logo">📦</div>
                            <div className="title">
                                <div className="main">RMA Live Dashboard</div>
                                <div className="sub">Return Merchandise Authorization - Live Tracking</div>
                            </div>
                        </div>
                    </header>

                    <main className="main-area">
                        <div className="rma-controls-section">
                            <div className="rma-controls-grid">
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Search by Market, Store, RMA#, Tracking, IMEI..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                    <span className="search-icon">🔍</span>
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="clear-filter"
                                            title="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="rma-action-buttons">
                                    <button
                                        onClick={handleExport}
                                        className="btn btn-success"
                                        disabled={exportLoading}
                                    >
                                        {exportLoading ? '⏳ Exporting...' : '📊 Export XLSX'}
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={fetchRMAData}
                                    >
                                        🔄 Refresh Data
                                    </button>
                                </div>
                            </div>
                        </div>

                        {renderSummaryCards()}

                        <div className="rma-nav-row">
                            {historyStack.length > 1 && (
                                <button className="btn" onClick={handleBackClick}>
                                    ← Back
                                </button>
                            )}
                            <div className="rma-breadcrumb">{renderBreadcrumb()}</div>
                        </div>

                        <section className="rma-stacked">
                            {currentView === 'markets' && renderHierarchicalTable(currentData, 'markets', handleMarketClick)}
                            {currentView === 'dm' && renderHierarchicalTable(currentData, 'dm', handleDMClick)}
                            {currentView === 'types' && renderHierarchicalTable(currentData, 'types', handleTypeClick)}
                            {currentView === 'detailed' && renderDetailedTable()}
                        </section>

                        {exportLoading && (
                            <div className="export-loading">
                                <div className="loading-spinner"></div>
                                <p>Preparing XLSX export with all data...</p>
                            </div>
                        )}

                        {selectedRecord && (
                            <div className="modal-overlay" onClick={closeDetails}>
                                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>Record Details - {selectedRecord.RecordType}</h3>
                                        <button className="close-btn" onClick={closeDetails}>×</button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="modal-detail-grid">
                                            <div><strong>Store:</strong> {selectedRecord["Store Name"]}</div>
                                            <div><strong>Market:</strong> {selectedRecord.Market}</div>
                                            <div><strong>DM:</strong> {selectedRecord["DM NAME"]}</div>
                                            <div><strong>Reference #:</strong> {selectedRecord.RecordType === 'XBM' ? selectedRecord["XBM Number"] : selectedRecord["RMA #"]}</div>
                                            <div><strong>Model:</strong> {selectedRecord["Model Number"]}</div>
                                            <div><strong>Description:</strong> {selectedRecord.Description}</div>
                                            <div><strong>Status:</strong>
                                                <span className={`status-badge status-${getStatusColor(selectedRecord.Status)}`}>
                                                    {selectedRecord.Status}
                                                </span>
                                            </div>
                                            <div><strong>Customer IMEI:</strong> {selectedRecord["Customer IMEI"]}</div>
                                            <div><strong>Assurant IMEI:</strong> {selectedRecord["Assurant IMEI"]}</div>
                                            <div><strong>Cost:</strong> ${selectedRecord.Amount.toLocaleString()}</div>
                                            <div><strong>Age:</strong> {selectedRecord.DaysOld} days</div>
                                            <div><strong>Tracking:</strong> {selectedRecord["Tracking Details"] || 'Not available'}</div>
                                            <div><strong>Shipping Status:</strong> {selectedRecord["Shipping Status"]}</div>
                                            {selectedRecord.Error && <div><strong>Error:</strong> <span className="error-text">{selectedRecord.Error}</span></div>}
                                        </div>
                                    </div>
                                    <div className="modal-actions">
                                        <button className="btn btn-primary modal-close-cta" onClick={closeDetails}>Close</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}