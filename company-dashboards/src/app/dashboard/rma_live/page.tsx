// 'use client';
// import React, { useEffect, useMemo, useState, useCallback } from 'react';
// import { useAuth } from '../../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import * as XLSX from 'xlsx';
// import './rma_live_styles.css';

// type Row = { [k: string]: string | undefined };

// interface RMARecord {
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
//     "RMA Number"?: string;
//     "XBM Number"?: string;
//     ""?: string;
//     "APPROVED/NOT"?: string;
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
//     days7: number;
//     days14: number;
//     days14Plus: number;
// }

// interface SummaryStats {
//     totalRecords: number;
//     totalCost: number;
//     rmaCount: number;
//     xbmCount: number;
//     tradeInCount: number;
//     pendingCount: number;
//     devicesWithIMEI: number;
//     averageAge: number;
//     maxAge: number;
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
//             const imei = String(row['Customer IMEI'] || '').trim();
//             if (!isValidIMEI(imei)) {
//                 return false;
//             }

//             const status = getStatusFromRow(row, sourceType);
//             const normalizedStatus = normalizeStatus(status);

//             if (normalizedStatus !== 'Pending') {
//                 return false;
//             }

//             return true;
//         });
//     };

//     const getStatusFromRow = (row: Row, sourceType: string): string => {
//         const statusFields = ['Status', 'Shipping Status', 'APPROVED/NOT'];
//         for (const field of statusFields) {
//             if (row[field] !== undefined && String(row[field]).trim() !== '') {
//                 return String(row[field]).trim();
//             }
//         }

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

//         if (s === 'pending' ||
//             s.includes('pending') ||
//             s.includes('not available') ||
//             s.includes('awaiting') ||
//             s.includes('to be filled') ||
//             s === '') {
//             return 'Pending';
//         }

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
//             "Status": normalizedStatus,
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

//     const combineData = () => {
//         const allData = [...rmaData, ...xbmData, ...tradeInData];

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

//         return data;
//     }, [currentData, searchTerm, currentView, imeiFilter, productFilter, searchData]);

//     const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//     const paginatedData = useMemo(() => {
//         const startIndex = (currentPage - 1) * itemsPerPage;
//         return filteredData.slice(startIndex, startIndex + itemsPerPage);
//     }, [filteredData, currentPage, itemsPerPage]);

//     const aggregateData = (data: RMARecord[], level: 'markets' | 'dm' | 'types'): AggregatedGroup[] => {
//         const groups: { [key: string]: AggregatedGroup } = {};

//         if (level === 'markets') {
//             const markets = Array.from(new Set(data.map(record => record.Market))).filter(m => m && m !== 'Unknown');

//             markets.forEach(market => {
//                 const marketData = data.filter(record => record.Market === market);
//                 const totalCost = marketData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = marketData.length;

//                 // Count devices by age categories
//                 let days7 = 0;
//                 let days14 = 0;
//                 let days14Plus = 0;

//                 marketData.forEach(record => {
//                     if (record.DaysOld <= 7) {
//                         days7++;
//                     } else if (record.DaysOld <= 14) {
//                         days14++;
//                     } else {
//                         days14Plus++;
//                     }
//                 });

//                 groups[market] = {
//                     key: market,
//                     count: marketData.length,
//                     devices: marketData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days7: days7,
//                     days14: days14,
//                     days14Plus: days14Plus,
//                     rows: marketData
//                 };
//             });
//         } else if (level === 'dm') {
//             const dms = Array.from(new Set(data.map(record => record["DM NAME"]))).filter(dm => dm && dm !== 'Unknown');

//             dms.forEach(dm => {
//                 const dmData = data.filter(record => record["DM NAME"] === dm);
//                 const totalCost = dmData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = dmData.length;

//                 // Count devices by age categories
//                 let days7 = 0;
//                 let days14 = 0;
//                 let days14Plus = 0;

//                 dmData.forEach(record => {
//                     if (record.DaysOld <= 7) {
//                         days7++;
//                     } else if (record.DaysOld <= 14) {
//                         days14++;
//                     } else {
//                         days14Plus++;
//                     }
//                 });

//                 groups[dm] = {
//                     key: dm,
//                     count: dmData.length,
//                     devices: dmData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days7: days7,
//                     days14: days14,
//                     days14Plus: days14Plus,
//                     rows: dmData
//                 };
//             });
//         } else if (level === 'types') {
//             const types = Array.from(new Set(data.map(record => record.RecordType)));

//             types.forEach(type => {
//                 const typeData = data.filter(record => record.RecordType === type);
//                 const totalCost = typeData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = typeData.length;

//                 // Count devices by age categories
//                 let days7 = 0;
//                 let days14 = 0;
//                 let days14Plus = 0;

//                 typeData.forEach(record => {
//                     if (record.DaysOld <= 7) {
//                         days7++;
//                     } else if (record.DaysOld <= 14) {
//                         days14++;
//                     } else {
//                         days14Plus++;
//                     }
//                 });

//                 groups[type] = {
//                     key: type,
//                     count: typeData.length,
//                     devices: typeData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days7: days7,
//                     days14: days14,
//                     days14Plus: days14Plus,
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

//     const summaryStats = useMemo((): SummaryStats => {
//         const dataToUse = filteredData.length > 0 ? filteredData : combinedData;

//         const totalRecords = dataToUse.length;
//         const totalCost = dataToUse.reduce((sum, record) => sum + record.Amount, 0);

//         const rmaCount = dataToUse.filter(record => record.RecordType === 'RMA').length;
//         const xbmCount = dataToUse.filter(record => record.RecordType === 'XBM').length;
//         const tradeInCount = dataToUse.filter(record => record.RecordType === 'TRADE_IN').length;

//         const ages = dataToUse.map(record => record.DaysOld).filter(age => age > 0);
//         const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
//         const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

//         const pendingCount = totalRecords;

//         return {
//             totalRecords,
//             totalCost,
//             rmaCount,
//             xbmCount,
//             tradeInCount,
//             pendingCount,
//             devicesWithIMEI: totalRecords,
//             averageAge,
//             maxAge
//         };
//     }, [filteredData, combinedData]);

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
//                                 {/* <th className="rma-col-right">Records</th> */}
//                                 <th className="rma-col-right">Devices</th>
//                                 <th className="rma-col-right">Pending</th>
//                                 <th className="rma-col-right">Total Cost</th>
//                                 <th className="rma-col-right">7 Days</th>
//                                 <th className="rma-col-right">14 Days</th>
//                                 <th className="rma-col-right">14+ Days</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>


//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass = pct >= 70 ? "rma-fill-green" : pct >= 40 ? "rma-fill-amber" : "rma-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//                                         <td>{group.key}</td>
//                                         {/* <td className="rma-col-right">{group.count}</td> */}
//                                         <td className="rma-col-right">{group.devices}</td>
//                                         <td className="rma-col-right">{group.pending}</td>
//                                         <td className="rma-col-right">${group.cost.toLocaleString()}</td>
//                                         <td className="rma-col-right">
//                                             <span className={`age-badge ${group.days7 > 0 ? 'age-badge-7' : 'age-badge-empty'}`}>
//                                                 {group.days7}
//                                             </span>
//                                         </td>
//                                         <td className="rma-col-right">
//                                             <span className={`age-badge ${group.days14 > 0 ? 'age-badge-14' : 'age-badge-empty'}`}>
//                                                 {group.days14}
//                                             </span>
//                                         </td>
//                                         <td className="rma-col-right">
//                                             <span className={`age-badge ${group.days14Plus > 0 ? 'age-badge-14plus' : 'age-badge-empty'}`}>
//                                                 {group.days14Plus}
//                                             </span>
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
//                         <div className="rma-controls-section">
//                             <div className="rma-controls-grid">
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

//                         <div className="rma-nav-row">
//                             {historyStack.length > 1 && (
//                                 <button className="btn" onClick={handleBackClick}>
//                                     ← Back
//                                 </button>
//                             )}
//                             <div className="rma-breadcrumb">{renderBreadcrumb()}</div>
//                         </div>

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














// 'use client';
// import React, { useEffect, useMemo, useState, useCallback } from 'react';
// import { useAuth } from '../../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import * as XLSX from 'xlsx';
// import './rma_live_styles.css';

// type Row = { [k: string]: string | undefined };

// interface RMARecord {
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
//     "RMA Number"?: string;
//     "XBM Number"?: string;
//     ""?: string;
//     "APPROVED/NOT"?: string;
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
//     days7: number;
//     days14: number;
//     days14Plus: number;
// }

// interface SummaryStats {
//     totalRecords: number;
//     totalCost: number;
//     rmaCount: number;
//     xbmCount: number;
//     tradeInCount: number;
//     pendingCount: number;
//     devicesWithIMEI: number;
//     averageAge: number;
//     maxAge: number;
// }

// export default function RMALivePage() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [sortBy, setSortBy] = useState<'alphabetical' | 'cost'>('alphabetical');
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

//     // New state for comments functionality
//     const [boComment, setBoComment] = useState('');
//     const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
//     const [dmComment, setDmComment] = useState('');
//     const [updatingComments, setUpdatingComments] = useState(false);
//     const [commentsSuccess, setCommentsSuccess] = useState<string | null>(null);

//     const [currentView, setCurrentView] = useState<'markets' | 'dm' | 'types' | 'detailed'>('markets');
//     const [currentData, setCurrentData] = useState<RMARecord[]>([]);
//     const [selectedMarket, setSelectedMarket] = useState<string>('');
//     const [selectedDM, setSelectedDM] = useState<string>('');
//     const [selectedType, setSelectedType] = useState<string>('');
//     const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([
//         { level: 'Markets' }
//     ]);
//     const [searchScope, setSearchScope] = useState<'current' | 'global'>('global');
//     const [imeiFilter, setImeiFilter] = useState('');
//     const [productFilter, setProductFilter] = useState('');

//     // const dataSources = [
//     //     {
//     //         id: 'RMA',
//     //         name: 'RMA',
//     //         gid: '1825921334',
//     //         description: 'RMA Data',
//     //         type: 'rma',
//     //         url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=1825921334&single=true&output=csv'
//     //     },
//     //     {
//     //         id: 'TRADE_IN',
//     //         name: 'Trade IN',
//     //         gid: '1934446761',
//     //         description: 'Trade IN Data',
//     //         type: 'trade_in',
//     //         url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=1934446761&single=true&output=csv'
//     //     },
//     //     {
//     //         id: 'XBM',
//     //         name: 'XBM',
//     //         gid: '166966411',
//     //         description: 'XBM Data',
//     //         type: 'xbm',
//     //         url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=166966411&single=true&output=csv'
//     //     }
//     // ];

//     // Comments functionality - COMPLETE IMPLEMENTATION
//     // const dataSources = [
//     //     {
//     //         id: 'RMA',
//     //         name: 'RMA',
//     //         type: 'rma',
//     //         url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=1825921334&single=true&output=csv'
//     //     },
//     //     {
//     //         id: 'TRADE_IN',
//     //         name: 'Trade IN',
//     //         type: 'trade_in',
//     //         url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=1934446761&single=true&output=csv'
//     //     },
//     //     {
//     //         id: 'XBM',
//     //         name: 'XBM',
//     //         type: 'xbm',
//     //         url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQgSWv_7Vre94EaLAurzp0fko4_qhvyCKY3uJ2yyfqQNt8VQJhjJdmIH4dXr4rcdvV8Muv8i3nQ6hwA/pub?gid=166966411&single=true&output=csv'
//     //     }
//     // ];
//     const dataSources = [
//         {
//             id: 'RMA',
//             name: 'RMA',
//             type: 'rma'
//         },
//         {
//             id: 'TRADE_IN',
//             name: 'Trade IN',
//             type: 'trade_in'
//         },
//         {
//             id: 'XBM',
//             name: 'XBM',
//             type: 'xbm'
//         }
//     ];


//     const updateCommentsInSheet = async (record: RMARecord, boComment: string, dmComment: string) => {
//         try {
//             if (!record || Object.keys(record).length === 0) {
//                 console.warn('updateCommentsInSheet called with empty record');
//                 setError('No record selected to update');
//                 return; // Make sure to return here
//             }

//             setUpdatingComments(true);
//             setCommentsSuccess(null);

//             // Get the record identifier
//             const recordIdentifier = record.RecordType === 'XBM'
//                 ? record["XBM Number"]
//                 : record["RMA #"];

//             if (!recordIdentifier || recordIdentifier.trim() === '') {
//                 console.error('No record identifier found for record:', record);
//                 setError('No reference number found for this record');
//                 setUpdatingComments(false); // Reset here too
//                 return;
//             }

//             console.log('🔄 Updating comments in Google Sheets:', {
//                 recordType: record.RecordType,
//                 identifier: recordIdentifier,
//                 boComment,
//                 dmComment
//             });

//             // Call the API to update comments in Google Sheets
//             const response = await fetch('/api/comments', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     recordType: record.RecordType,
//                     recordIdentifier: recordIdentifier,
//                     dmComments: dmComment,
//                     boComments: boComment
//                 }),
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.error || `HTTP ${response.status}`);
//             }

//             const result = await response.json();

//             if (!result.success) {
//                 throw new Error(result.error || 'Failed to update comments');
//             }

//             console.log('Comments updated in Google Sheets:', result);

//             // Also update the data in state for immediate UI feedback
//             updateRecordComments(record, boComment, dmComment);

//             // Show success message
//             setCommentsSuccess(`Comments updated successfully for ${recordIdentifier}`);

//             // Clear success message after 3 seconds
//             setTimeout(() => setCommentsSuccess(null), 3000);

//         } catch (error: any) {
//             console.error('❌ Error updating comments:', error);
//             setError(`Failed to update comments: ${error.message}`);
//         } finally {
//             setUpdatingComments(false); // This should always run
//         }
//     };


//     const updateRecordComments = (record: RMARecord, boComment: string, dmComment: string) => {
//         if (!record || Object.keys(record).length === 0) {
//             console.warn('updateRecordComments called with empty record');
//             return;
//         }

//         console.log('🔄 updateRecordComments called for:', {
//             type: record.RecordType,
//             identifier: record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"],
//             currentView,
//             currentDataLength: currentData.length
//         });

//         const updateData = (data: RMARecord[]) =>
//             data.map(item => {
//                 if (!item || Object.keys(item).length === 0) return item;

//                 const itemIdentifier = String(
//                     item.RecordType === 'XBM' ? item["XBM Number"] : item["RMA #"] || ''
//                 ).trim();

//                 const recordIdentifier = String(
//                     record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"] || ''
//                 ).trim();

//                 // CRITICAL: Check both identifier AND record type
//                 if (itemIdentifier &&
//                     recordIdentifier &&
//                     itemIdentifier === recordIdentifier &&
//                     item.RecordType === record.RecordType) {

//                     console.log(`✅ Updating ${item.RecordType}: ${itemIdentifier}`);

//                     return {
//                         ...item,
//                         "BO COMMENTS": boComment,
//                         "DM COMMENTS": dmComment,
//                         "DM Comments": dmComment
//                     };
//                 }
//                 return item;
//             });

//         // Update individual data sets
//         switch (record.RecordType) {
//             case 'RMA':
//                 setRmaData(prev => updateData(prev));
//                 break;
//             case 'XBM':
//                 setXbmData(prev => updateData(prev));
//                 break;
//             case 'TRADE_IN':
//                 setTradeInData(prev => updateData(prev));
//                 break;
//         }

//         // IMPORTANT: Update currentData FIRST to preserve the current view
//         setCurrentData(prev => {
//             const updated = updateData(prev);
//             console.log('🔄 Updated currentData:', {
//                 before: prev.length,
//                 after: updated.length,
//                 view: currentView
//             });
//             return updated;
//         });

//         // Then update combinedData
//         setCombinedData(prev => updateData(prev));

//         // Update selected record if it matches
//         if (selectedRecord) {
//             const selectedIdentifier = String(
//                 selectedRecord.RecordType === 'XBM' ? selectedRecord["XBM Number"] : selectedRecord["RMA #"] || ''
//             ).trim();

//             const recordIdentifier = String(
//                 record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"] || ''
//             ).trim();

//             if (selectedIdentifier &&
//                 recordIdentifier &&
//                 selectedIdentifier === recordIdentifier &&
//                 selectedRecord.RecordType === record.RecordType) {

//                 setSelectedRecord({
//                     ...selectedRecord,
//                     "BO COMMENTS": boComment,
//                     "DM COMMENTS": dmComment,
//                     "DM Comments": dmComment
//                 });
//             }
//         }
//     };
//     const deleteComments = async (record: RMARecord) => {
//         if (window.confirm('Are you sure you want to clear all comments for this record?')) {
//             await updateCommentsInSheet(record, '', '');
//         }
//     };

//     const loadExistingComments = (record: RMARecord) => {
//         setBoComment(record["BO COMMENTS"] || '');
//         setDmComment(record["DM COMMENTS"] || '');
//         setCommentsSuccess('Existing comments loaded');
//         setTimeout(() => setCommentsSuccess(null), 2000);
//     };

//     const clearCommentFields = () => {
//         setBoComment('');
//         setDmComment('');
//         setCommentsSuccess('Comment fields cleared');
//         setTimeout(() => setCommentsSuccess(null), 2000);
//     };

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

//     // Initialize/clear comment fields when modal (selectedRecord) changes
//     useEffect(() => {
//         if (selectedRecord) {
//             // pre-fill comment inputs with existing values for easier editing
//             setBoComment(selectedRecord["BO COMMENTS"] || '');
//             setDmComment(selectedRecord["DM COMMENTS"] || selectedRecord["DM Comments"] || '');
//         } else {
//             // modal closed -> clear fields
//             setBoComment('');
//             setDmComment('');
//             setCommentsSuccess(null);
//         }
//     }, [selectedRecord]);

//     useEffect(() => {
//         if (isAuthenticated) {
//             fetchRMAData();
//         }
//     }, [isAuthenticated]);

//     // Fix 1: Combine data only when all sources are loaded
//     useEffect(() => {
//         if (rmaData.length > 0 && xbmData.length > 0 && tradeInData.length > 0) {
//             console.log('🔄 All data loaded, combining...');
//             combineData();
//         }
//     }, [rmaData.length, xbmData.length, tradeInData.length]);

//     // Fix 2: Simplify currentData management
//     useEffect(() => {
//         setCurrentData(prev => {
//             // Only reset to combinedData if we're at the top level
//             if (currentView === 'markets' && historyStack.length === 1) {
//                 console.log('🔄 Setting currentData to combinedData (top level)');
//                 return combinedData;
//             }
//             return prev;
//         });
//     }, [combinedData, currentView, historyStack.length]);

//     // Fix 3: Remove the problematic useEffect that was causing the hook error
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
//             const imei = String(row['Customer IMEI'] || '').trim();
//             if (!isValidIMEI(imei)) {
//                 return false;
//             }

//             const status = getStatusFromRow(row, sourceType);
//             const normalizedStatus = normalizeStatus(status);

//             if (normalizedStatus !== 'Pending') {
//                 return false;
//             }

//             return true;
//         });
//     };

//     const getStatusFromRow = (row: Row, sourceType: string): string => {
//         const statusFields = ['Status', 'Shipping Status', 'APPROVED/NOT'];
//         for (const field of statusFields) {
//             if (row[field] !== undefined && String(row[field]).trim() !== '') {
//                 return String(row[field]).trim();
//             }
//         }

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

//         if (s === 'pending' ||
//             s.includes('pending') ||
//             s.includes('not available') ||
//             s.includes('awaiting') ||
//             s.includes('to be filled') ||
//             s === '') {
//             return 'Pending';
//         }

//         return 'NotPending';
//     };

//     const fetchDataSource = async (source: any): Promise<Row[]> => {
//         try {
//             console.log(`🔄 Fetching ${source.name} data via Google Sheets API v4.x...`);

//             const response = await fetch(`/api/sheets-data?type=${source.type}`);

//             if (!response.ok) {
//                 throw new Error(`HTTP ${response.status}`);
//             }

//             const result = await response.json();

//             if (!result.success) {
//                 throw new Error(result.error || 'API request failed');
//             }

//             console.log(`✅ ${source.name} - v4.x API data:`, {
//                 rows: result.data.length,
//                 sheet: result.sheetTitle,
//                 version: result.version
//             });

//             // Apply your filtering
//             const filteredData = filterDataAtSource(result.data, source.type);

//             console.log(`📊 ${source.name} - Filtered: ${filteredData.length} records`);

//             return filteredData;

//         } catch (err) {
//             console.error(`❌ Failed to fetch ${source.name} via v4.x API:`, err);
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

//     const transformToRMARecord = (row: Row, type: "RMA" | "XBM" | "TRADE_IN"): RMARecord => {
//         // Add validation at the start
//         if (!row || Object.keys(row).length === 0) {
//             console.warn('transformToRMARecord called with empty row for type:', type);
//             // Return a minimal valid record instead of empty object
//             return {
//                 "DM COMMENTS": "",
//                 "DM Comments": "",
//                 "BO COMMENTS": "",
//                 "Market": "",
//                 "DISTRICT": "",
//                 "DM NAME": "",
//                 "Store ID": "",
//                 "Store Name": "",
//                 "Door Code": "",
//                 "Model Number": "",
//                 "Description": "",
//                 "Customer IMEI": "",
//                 "Employee Name NTID": "",
//                 "Assurant IMEI": "",
//                 "Processed Date": "",
//                 "Label Type": "",
//                 "RMA #": "",
//                 "RMA Date": "",
//                 "Count of Devices": "",
//                 "Tracking Details": "",
//                 "Date & Time": "",
//                 "Shipping Status": "",
//                 "COST": "",
//                 "AGE": "",
//                 "Error": "",
//                 "RecordType": type,
//                 "Status": "Pending",
//                 "Amount": 0,
//                 "DaysOld": 0
//             };
//         }

//         const getValue = (keys: string[]): string => {
//             for (const key of keys) {
//                 // More robust checking for the key
//                 if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
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

//         // If cost is still 0, try to find any cost-related field
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
//             "Status": normalizedStatus,
//             "Amount": cost,
//             "DaysOld": age
//         };

//         console.log('✅ Transformed record:', { type, identifier: record["RMA #"] || record["XBM Number"], keys: Object.keys(record) });
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

//             // Add debugging here to see what the API actually returns
//             console.log('🔍 RMA rows sample:', rmaRows.slice(0, 2));
//             console.log('🔍 TradeIn rows sample:', tradeInRows.slice(0, 2));
//             console.log('🔍 XBM rows sample:', xbmRows.slice(0, 2));

//             const transformedRMA = rmaRows.map(row => {
//                 console.log('🔄 Transforming RMA row:', row);
//                 return transformToRMARecord(row, "RMA");
//             });

//             const transformedTradeIN = tradeInRows.map(row => {
//                 console.log('🔄 Transforming TradeIN row:', row);
//                 return transformToRMARecord(row, "TRADE_IN");
//             });

//             const transformedXBM = xbmRows.map(row => {
//                 console.log('🔄 Transforming XBM row:', row);
//                 return transformToRMARecord(row, "XBM");
//             });

//             // Check for empty records after transformation
//             const emptyRMARecords = transformedRMA.filter(record => !record || Object.keys(record).length === 0);
//             const emptyTradeInRecords = transformedTradeIN.filter(record => !record || Object.keys(record).length === 0);
//             const emptyXBMRecords = transformedXBM.filter(record => !record || Object.keys(record).length === 0);

//             console.log('⚠️ Empty records found:', {
//                 rma: emptyRMARecords.length,
//                 tradeIn: emptyTradeInRecords.length,
//                 xbm: emptyXBMRecords.length
//             });

//             // Filter out empty records
//             const validRMA = transformedRMA.filter(record => record && Object.keys(record).length > 0);
//             const validTradeIN = transformedTradeIN.filter(record => record && Object.keys(record).length > 0);
//             const validXBM = transformedXBM.filter(record => record && Object.keys(record).length > 0);

//             setRmaData(validRMA);
//             setTradeInData(validTradeIN);
//             setXbmData(validXBM);

//         } catch (err) {
//             setError('Failed to load RMA data');
//             console.error('Error fetching RMA data:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const combineData = () => {
//         const allData = [...rmaData, ...xbmData, ...tradeInData];

//         // Filter out empty records first
//         const validData = allData.filter(record =>
//             record &&
//             Object.keys(record).length > 0 &&
//             record.RecordType // Ensure it has a record type
//         );

//         const filteredData = validData.filter(record =>
//             record.Status &&
//             String(record.Status).toLowerCase() === 'pending' &&
//             isValidIMEI(record["Customer IMEI"] || '')
//         );

//         console.log('🔄 Combined RMA data:', {
//             totalRecords: allData.length,
//             validRecords: validData.length,
//             emptyRecords: allData.length - validData.length,
//             pendingWithValidIMEI: filteredData.length,
//             totalCost: filteredData.reduce((sum, r) => sum + r.Amount, 0)
//         });

//         setCombinedData(filteredData);
//     };
//     // const searchData = useCallback((data: RMARecord[], searchTerm: string): RMARecord[] => {
//     //     if (!searchTerm.trim()) return data;
//     //     const searchLower = searchTerm.toLowerCase().trim();

//     //     return data.filter((record) => {
//     //         const searchableFields = [
//     //             record.Market,
//     //             record["Store Name"],
//     //             record["Store ID"],
//     //             record["RMA #"],
//     //             record["XBM Number"],
//     //             record["Tracking Details"],
//     //             record["Model Number"],
//     //             record["Description"],
//     //             record["DM NAME"],
//     //             record["Customer IMEI"],
//     //             record["Assurant IMEI"],
//     //             record["Door Code"],
//     //             record["Employee Name NTID"]
//     //         ].filter((field) => field && field !== "" && field !== "Unknown");

//     //         return searchableFields.some((field) =>
//     //             String(field).toLowerCase().includes(searchLower)
//     //         );
//     //     });
//     // }, []);
//     // Enhanced search function with better field coverage


//     const searchData = useCallback((data: RMARecord[], searchTerm: string): RMARecord[] => {
//         if (!searchTerm.trim()) return data;

//         const searchLower = searchTerm.toLowerCase().trim();
//         console.log('🔍 Smart searching for:', searchLower);

//         // First, check if we should navigate to a specific view
//         const shouldNavigate = searchScope === 'global' && currentView !== 'detailed';

//         if (shouldNavigate) {
//             // Check if search term matches a specific market
//             const markets = Array.from(new Set(combinedData.map(record => record.Market))).filter(m => m);
//             const matchedMarket = markets.find(market =>
//                 market.toLowerCase().includes(searchLower)
//             );

//             // Check if search term matches a specific DM
//             const dms = Array.from(new Set(combinedData.map(record => record["DM NAME"]))).filter(dm => dm);
//             const matchedDM = dms.find(dm =>
//                 dm.toLowerCase().includes(searchLower)
//             );

//             // Check if search term matches a record type
//             const recordTypes = ['RMA', 'XBM', 'TRADE_IN'];
//             const matchedType = recordTypes.find(type =>
//                 type.toLowerCase().includes(searchLower)
//             );

//             // Check if search term matches a tech ID (Store ID, RMA#, XBM Number)
//             const matchedTechId = combinedData.find(record =>
//                 record["Store ID"]?.toLowerCase().includes(searchLower) ||
//                 record["RMA #"]?.toLowerCase().includes(searchLower) ||
//                 record["XBM Number"]?.toLowerCase().includes(searchLower) ||
//                 record["Customer IMEI"]?.toLowerCase().includes(searchLower) ||
//                 record["Assurant IMEI"]?.toLowerCase().includes(searchLower)
//             );

//             // Navigate based on what we found
//             if (matchedMarket) {
//                 console.log('📍 Navigating to market:', matchedMarket);
//                 const marketData = combinedData.filter(record => record.Market === matchedMarket);
//                 setCurrentData(marketData);
//                 setCurrentView('dm');
//                 setSelectedMarket(matchedMarket);
//                 setHistoryStack([
//                     { level: 'Markets' },
//                     { level: 'District Managers', selected: matchedMarket }
//                 ]);
//                 return marketData; // Return filtered data for immediate display
//             } else if (matchedDM) {
//                 console.log('📍 Navigating to DM:', matchedDM);
//                 // Find which market this DM belongs to
//                 const dmRecord = combinedData.find(record => record["DM NAME"] === matchedDM);
//                 if (dmRecord) {
//                     const dmData = combinedData.filter(record => record["DM NAME"] === matchedDM);
//                     setCurrentData(dmData);
//                     setCurrentView('types');
//                     setSelectedMarket(dmRecord.Market);
//                     setSelectedDM(matchedDM);
//                     setHistoryStack([
//                         { level: 'Markets' },
//                         { level: 'District Managers', selected: dmRecord.Market },
//                         { level: 'Record Types', selected: matchedDM }
//                     ]);
//                     return dmData;
//                 }
//             } else if (matchedType) {
//                 console.log('📍 Navigating to record type:', matchedType);
//                 const typeData = combinedData.filter(record => record.RecordType === matchedType);
//                 setCurrentData(typeData);
//                 setCurrentView('detailed');
//                 setSelectedType(matchedType);
//                 setHistoryStack([
//                     { level: 'Markets' },
//                     { level: 'Record Types', selected: matchedType }
//                 ]);
//                 return typeData;
//             } else if (matchedTechId) {
//                 console.log('📍 Found specific tech ID, navigating to detailed view');
//                 // For specific tech IDs, go directly to detailed view with filtered results
//                 const filteredResults = combinedData.filter(record =>
//                     record["Store ID"]?.toLowerCase().includes(searchLower) ||
//                     record["RMA #"]?.toLowerCase().includes(searchLower) ||
//                     record["XBM Number"]?.toLowerCase().includes(searchLower) ||
//                     record["Customer IMEI"]?.toLowerCase().includes(searchLower) ||
//                     record["Assurant IMEI"]?.toLowerCase().includes(searchLower)
//                 );

//                 if (filteredResults.length > 0) {
//                     setCurrentData(filteredResults);
//                     setCurrentView('detailed');
//                     setHistoryStack([
//                         { level: 'Markets' },
//                         { level: 'Search Results', selected: `"${searchTerm}"` }
//                     ]);
//                     return filteredResults;
//                 }
//             }
//         }

//         // If no navigation occurred, perform normal search
//         return data.filter((record) => {
//             if (!record || Object.keys(record).length === 0) return false;

//             const searchableFields = [
//                 record.Market,
//                 record["Store Name"],
//                 record["Store ID"],
//                 record["RMA #"],
//                 record["XBM Number"],
//                 record["RMA Number"],
//                 record["Tracking Details"],
//                 record["Model Number"],
//                 record["Description"],
//                 record["DM NAME"],
//                 record["Customer IMEI"],
//                 record["Assurant IMEI"],
//                 record["Door Code"],
//                 record["Employee Name NTID"],
//                 record["DISTRICT"],
//                 record["Label Type"],
//                 record["Shipping Status"],
//                 record.RecordType
//             ].filter(field => field && String(field).trim() !== "");

//             return searchableFields.some((field) =>
//                 String(field).toLowerCase().includes(searchLower)
//             );
//         });
//     }, [combinedData, currentView, searchScope]);

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
//     //                 record["Description"]?.toLowerCase().includes(productLower)
//     //             );
//     //         }
//     //     }

//     //     return data;
//     // }, [currentData, searchTerm, currentView, imeiFilter, productFilter, searchData]);
//     const filteredData = useMemo(() => {
//         let data = currentData;

//         // Use global data for search when in global scope and we're not already in a detailed view
//         if (searchTerm.trim() && searchScope === 'global' && currentView !== 'detailed') {
//             data = combinedData;
//         }

//         if (searchTerm.trim()) {
//             const searchResults = searchData(data, searchTerm);

//             // If we're in detailed view after search, apply additional filters
//             if (currentView === 'detailed') {
//                 let filteredResults = searchResults;

//                 if (imeiFilter.trim()) {
//                     const imeiLower = imeiFilter.toLowerCase().trim();
//                     filteredResults = filteredResults.filter(record =>
//                         record["Customer IMEI"]?.toLowerCase().includes(imeiLower) ||
//                         record["Assurant IMEI"]?.toLowerCase().includes(imeiLower)
//                     );
//                 }

//                 if (productFilter.trim()) {
//                     const productLower = productFilter.toLowerCase().trim();
//                     filteredResults = filteredResults.filter(record =>
//                         record["Model Number"]?.toLowerCase().includes(productLower) ||
//                         record["Description"]?.toLowerCase().includes(productLower)
//                     );
//                 }

//                 return filteredResults;
//             }

//             return searchResults;
//         }

//         // Apply filters for detailed view even without search term
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

//         return data;
//     }, [currentData, combinedData, searchTerm, currentView, imeiFilter, productFilter, searchData, searchScope]);


//     const handleSearch = (term: string) => {
//         setSearchTerm(term);

//         // If clearing search, reset to appropriate view
//         if (!term.trim()) {
//             if (historyStack.some(item => item.level === 'Search Results')) {
//                 // If we were in search results, go back to markets
//                 setCurrentData(combinedData);
//                 setCurrentView('markets');
//                 setHistoryStack([{ level: 'Markets' }]);
//                 setSelectedMarket('');
//                 setSelectedDM('');
//                 setSelectedType('');
//             }
//         }
//     };

//     const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//     const paginatedData = useMemo(() => {
//         const startIndex = (currentPage - 1) * itemsPerPage;
//         return filteredData.slice(startIndex, startIndex + itemsPerPage);
//     }, [filteredData, currentPage, itemsPerPage]);



//     const aggregateData = (data: RMARecord[], level: 'markets' | 'dm' | 'types'): AggregatedGroup[] => {
//         const groups: { [key: string]: AggregatedGroup } = {};

//         if (level === 'markets') {
//             const markets = Array.from(new Set(data.map(record => record.Market))).filter(m => m && m !== 'Unknown');

//             markets.forEach(market => {
//                 const marketData = data.filter(record => record.Market === market);
//                 const totalCost = marketData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = marketData.length;

//                 // Count devices by age categories
//                 let days7 = 0;
//                 let days14 = 0;
//                 let days14Plus = 0;

//                 marketData.forEach(record => {
//                     if (record.DaysOld <= 7) {
//                         days7++;
//                     } else if (record.DaysOld <= 14) {
//                         days14++;
//                     } else {
//                         days14Plus++;
//                     }
//                 });

//                 groups[market] = {
//                     key: market,
//                     count: marketData.length,
//                     devices: marketData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days7: days7,
//                     days14: days14,
//                     days14Plus: days14Plus,
//                     rows: marketData
//                 };
//             });
//         } else if (level === 'dm') {
//             const dms = Array.from(new Set(data.map(record => record["DM NAME"]))).filter(dm => dm && dm !== 'Unknown');

//             dms.forEach(dm => {
//                 const dmData = data.filter(record => record["DM NAME"] === dm);
//                 const totalCost = dmData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = dmData.length;

//                 // Count devices by age categories
//                 let days7 = 0;
//                 let days14 = 0;
//                 let days14Plus = 0;

//                 dmData.forEach(record => {
//                     if (record.DaysOld <= 7) {
//                         days7++;
//                     } else if (record.DaysOld <= 14) {
//                         days14++;
//                     } else {
//                         days14Plus++;
//                     }
//                 });

//                 groups[dm] = {
//                     key: dm,
//                     count: dmData.length,
//                     devices: dmData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days7: days7,
//                     days14: days14,
//                     days14Plus: days14Plus,
//                     rows: dmData
//                 };
//             });
//         } else if (level === 'types') {
//             const types = Array.from(new Set(data.map(record => record.RecordType)));

//             types.forEach(type => {
//                 const typeData = data.filter(record => record.RecordType === type);
//                 const totalCost = typeData.reduce((sum, record) => sum + record.Amount, 0);
//                 const pendingCount = typeData.length;

//                 // Count devices by age categories
//                 let days7 = 0;
//                 let days14 = 0;
//                 let days14Plus = 0;

//                 typeData.forEach(record => {
//                     if (record.DaysOld <= 7) {
//                         days7++;
//                     } else if (record.DaysOld <= 14) {
//                         days14++;
//                     } else {
//                         days14Plus++;
//                     }
//                 });

//                 groups[type] = {
//                     key: type,
//                     count: typeData.length,
//                     devices: typeData.length,
//                     cost: totalCost,
//                     pending: pendingCount,
//                     days7: days7,
//                     days14: days14,
//                     days14Plus: days14Plus,
//                     rows: typeData
//                 };
//             });
//         }

//         // Then modify the return statement:
//         return Object.values(groups).sort((a, b) => {
//             if (sortBy === 'alphabetical') {
//                 return a.key.localeCompare(b.key);
//             } else {
//                 return b.cost - a.cost;
//             }
//         })
//     };


//     const handleMarketClick = (market: AggregatedGroup) => {
//         console.log('📍 Market clicked:', market.key, 'Rows:', market.rows.length);
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
//         console.log('📍 DM clicked:', dm.key, 'Rows:', dm.rows.length);
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
//         console.log('📍 Type clicked:', type.key, 'Rows:', type.rows.length);
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
//         if (!record || Object.keys(record).length === 0) {
//             console.error('Attempted to show details for empty record');
//             setError('Cannot show details for empty record');
//             return;
//         }

//         setSelectedRecord(record);
//         // Load existing comments when opening details
//         setBoComment(record["BO COMMENTS"] || '');
//         setDmComment(record["DM COMMENTS"] || '');
//         setCommentsSuccess(null);
//     };

//     const closeDetails = () => {
//         setSelectedRecord(null);
//         setBoComment('');
//         setDmComment('');
//         setCommentsSuccess(null);
//     };

//     const summaryStats = useMemo((): SummaryStats => {
//         const dataToUse = filteredData.length > 0 ? filteredData : combinedData;

//         const totalRecords = dataToUse.length;
//         const totalCost = dataToUse.reduce((sum, record) => sum + record.Amount, 0);

//         const rmaCount = dataToUse.filter(record => record.RecordType === 'RMA').length;
//         const xbmCount = dataToUse.filter(record => record.RecordType === 'XBM').length;
//         const tradeInCount = dataToUse.filter(record => record.RecordType === 'TRADE_IN').length;

//         const ages = dataToUse.map(record => record.DaysOld).filter(age => age > 0);
//         const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
//         const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

//         const pendingCount = totalRecords;

//         return {
//             totalRecords,
//             totalCost,
//             rmaCount,
//             xbmCount,
//             tradeInCount,
//             pendingCount,
//             devicesWithIMEI: totalRecords,
//             averageAge,
//             maxAge
//         };
//     }, [filteredData, combinedData]);

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
//                                 <th className="rma-col-right">Devices</th>
//                                 <th className="rma-col-right">Pending</th>
//                                 <th className="rma-col-right">Total Cost</th>
//                                 <th className="rma-col-right">7 Days</th>
//                                 <th className="rma-col-right">14 Days</th>
//                                 <th className="rma-col-right">14+ Days</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass = pct >= 70 ? "rma-fill-green" : pct >= 40 ? "rma-fill-amber" : "rma-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//                                         <td>{group.key}</td>
//                                         <td className="rma-col-right">{group.devices}</td>
//                                         <td className="rma-col-right">{group.pending}</td>
//                                         <td className="rma-col-right">${group.cost.toLocaleString()}</td>
//                                         <td className="rma-col-right">
//                                             <span className={`age-badge ${group.days7 > 0 ? 'age-badge-7' : 'age-badge-empty'}`}>
//                                                 {group.days7}
//                                             </span>
//                                         </td>
//                                         <td className="rma-col-right">
//                                             <span className={`age-badge ${group.days14 > 0 ? 'age-badge-14' : 'age-badge-empty'}`}>
//                                                 {group.days14}
//                                             </span>
//                                         </td>
//                                         <td className="rma-col-right">
//                                             <span className={`age-badge ${group.days14Plus > 0 ? 'age-badge-14plus' : 'age-badge-empty'}`}>
//                                                 {group.days14Plus}
//                                             </span>
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

//     const renderDetailedTable = () => {
//         console.log('🔍 Detailed table - paginatedData:', {
//             length: paginatedData.length,
//             sample: paginatedData.slice(0, 3),
//             hasEmptyRecords: paginatedData.some(record => !record || Object.keys(record).length === 0)
//         });

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
//                             {paginatedData
//                                 .filter(record => record && Object.keys(record).length > 0) // FILTER OUT EMPTY RECORDS
//                                 .map((record, index) => {
//                                     const uniqueId = `${record.RecordType}-${record["RMA #"] || record["XBM Number"]}-${index}`;
//                                     const referenceNumber = record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"];

//                                     console.log('✅ Rendering valid record:', {
//                                         index,
//                                         uniqueId,
//                                         referenceNumber,
//                                         recordType: record.RecordType,
//                                         hasRMA: !!record["RMA #"],
//                                         hasXBM: !!record["XBM Number"]
//                                     });

//                                     return (
//                                         <React.Fragment key={uniqueId}>
//                                             <tr className="clickable-row">
//                                                 <td>
//                                                     <span className={`record-type-badge type`}>
//                                                         {record.RecordType}
//                                                     </span>
//                                                 </td>
//                                                 <td>{record.Market}</td>
//                                                 <td>
//                                                     <div className="store-info">
//                                                         <div className="store-name">{record["Store Name"]}</div>
//                                                         <div className="store-id">{record["Store ID"]}</div>
//                                                     </div>
//                                                 </td>
//                                                 <td>
//                                                     <div>
//                                                         <div>{referenceNumber}</div>
//                                                         {record["Tracking Details"] && (
//                                                             <div>Track: {record["Tracking Details"]}</div>
//                                                         )}
//                                                     </div>
//                                                 </td>
//                                                 <td>
//                                                     <div className="product-info">
//                                                         <div className="product-name">{record["Model Number"]}</div>
//                                                         <div className="product-model">{record.Description}</div>
//                                                     </div>
//                                                 </td>
//                                                 <td>
//                                                     <span className={`status-badge status`}>
//                                                         {record.Status}
//                                                     </span>
//                                                 </td>
//                                                 <td>
//                                                     <div className="sku-info">
//                                                         <div className="sku-code">{record["Customer IMEI"] || 'N/A'}</div>
//                                                     </div>
//                                                 </td>
//                                                 <td>
//                                                     <div className="sku-info">
//                                                         <div className="sku-code">{record["Assurant IMEI"] || 'N/A'}</div>
//                                                     </div>
//                                                 </td>
//                                                 <td className="rma-col-right">${record.Amount.toLocaleString()}</td>
//                                                 <td className="rma-col-right">{record.DaysOld}d</td>
//                                                 <td>
//                                                     <button
//                                                         onClick={(e) => {
//                                                             e.stopPropagation();
//                                                             console.log('🔍 Details button clicked:', record);
//                                                             showDetails(record);
//                                                         }}
//                                                         className="details-btn"
//                                                     >
//                                                         Details
//                                                     </button>
//                                                     <button
//                                                         onClick={() => toggleRowExpansion(uniqueId)}
//                                                         className="expand-btn"
//                                                     >
//                                                         {expandedRow === uniqueId ? '▼' : '►'} More
//                                                     </button>
//                                                 </td>
//                                             </tr>

//                                             {expandedRow === uniqueId && (
//                                                 <tr className="detail-row">
//                                                     <td colSpan={11}>
//                                                         <div className="detail-panel">
//                                                             <div className="detail-section">
//                                                                 <h4>Device Information</h4>
//                                                                 <div className="detail-grid">
//                                                                     <div><strong>Customer IMEI:</strong> {record["Customer IMEI"]}</div>
//                                                                     <div><strong>Assurant IMEI:</strong> {record["Assurant IMEI"]}</div>
//                                                                     <div><strong>Employee NTID:</strong> {record["Employee Name NTID"]}</div>
//                                                                     <div><strong>Door Code:</strong> {record["Door Code"]}</div>
//                                                                 </div>
//                                                             </div>

//                                                             <div className="detail-section">
//                                                                 <h4>Process Details</h4>
//                                                                 <div className="detail-grid">
//                                                                     <div><strong>Processed Date:</strong> {record["Processed Date"]}</div>
//                                                                     <div><strong>RMA Date:</strong> {record["RMA Date"]}</div>
//                                                                     <div><strong>Label Type:</strong> {record["Label Type"]}</div>
//                                                                     <div><strong>Count of Devices:</strong> {record["Count of Devices"]}</div>
//                                                                     <div><strong>Shipping Status:</strong> {record["Shipping Status"]}</div>
//                                                                     <div><strong>Tracking Details:</strong> {record["Tracking Details"]}</div>
//                                                                 </div>
//                                                             </div>

//                                                             <div className="detail-section">
//                                                                 <h4>Additional Information</h4>
//                                                                 <div className="detail-grid">
//                                                                     <div><strong>DM:</strong> {record["DM NAME"]}</div>
//                                                                     <div><strong>District:</strong> {record.DISTRICT}</div>
//                                                                     <div><strong>Date & Time:</strong> {record["Date & Time"]}</div>
//                                                                     {record.Error && <div><strong>Error:</strong> <span className="error-box">{record.Error}</span></div>}
//                                                                 </div>
//                                                             </div>

//                                                             {(record["DM COMMENTS"] || record["BO COMMENTS"]) && (
//                                                                 <div className="detail-section">
//                                                                     <h4>Comments</h4>
//                                                                     <div className="detail-grid">
//                                                                         {record["DM COMMENTS"] && <div><strong>DM Comments:</strong> {record["DM COMMENTS"]}</div>}
//                                                                         {record["BO COMMENTS"] && <div><strong>BO Comments:</strong> {record["BO COMMENTS"]}</div>}
//                                                                     </div>
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     </td>
//                                                 </tr>
//                                             )}
//                                         </React.Fragment>
//                                     );
//                                 })}
//                         </tbody>
//                     </table>

//                     {paginatedData.filter(record => record && Object.keys(record).length > 0).length === 0 && (
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
//             <div className="dashboard-card card-purple">
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
//             <div className="dashboard-card card-purple">
//                 <div className="card-icon">📦</div>
//                 <div className="card-content">
//                     <h3 className="card-title">RMA Records</h3>
//                     <p className="card-description">{summaryStats.rmaCount}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-purple">
//                 <div className="card-icon">🔄</div>
//                 <div className="card-content">
//                     <h3 className="card-title">XBM Records</h3>
//                     <p className="card-description">{summaryStats.xbmCount}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-purple">
//                 <div className="card-icon">🤝</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Trade IN</h3>
//                     <p className="card-description">{summaryStats.tradeInCount}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-purple">
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
//                         <div className="rma-controls-section">
//                             <div className="rma-controls-grid">
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

//                         {/* {renderSummaryCards()} */}

//                         <div className="rma-nav-row">
//                             {historyStack.length > 1 && (
//                                 <button className="btn" onClick={handleBackClick}>
//                                     ← Back
//                                 </button>
//                             )}
//                             <div className="rma-breadcrumb">{renderBreadcrumb()}</div>
//                         </div>

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
//                                                 <span className={`status-badge status`}>
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


//                                         {/* Comments Section - FIXED */}
//                                         <div className="comments-section">
//                                             <h4>Comments Management</h4>

//                                             {/* Success Message */}
//                                             {commentsSuccess && (
//                                                 <div className="success-message">
//                                                     ✅ {commentsSuccess}
//                                                 </div>
//                                             )}

//                                             <div className="comments-form">
//                                                 <div className="form-group">
//                                                     <label htmlFor="dm-comments">DM Comments:</label>
//                                                     <textarea
//                                                         id="dm-comments"
//                                                         value={dmComment}
//                                                         onChange={(e) => setDmComment(e.target.value)}
//                                                         placeholder="Enter DM comments here..."
//                                                         rows={3}
//                                                         className="comments-textarea"
//                                                         disabled={updatingComments}
//                                                     />
//                                                 </div>

//                                                 <div className="form-group">
//                                                     <label htmlFor="bo-comments">BO Comments:</label>
//                                                     <textarea
//                                                         id="bo-comments"
//                                                         value={boComment}
//                                                         onChange={(e) => setBoComment(e.target.value)}
//                                                         placeholder="Enter BO comments here..."
//                                                         rows={3}
//                                                         className="comments-textarea"
//                                                         disabled={updatingComments}
//                                                     />
//                                                 </div>

//                                                 <div className="comments-actions">
//                                                     <button
//                                                         onClick={() => updateCommentsInSheet(selectedRecord, boComment, dmComment)}
//                                                         disabled={updatingComments || (!boComment && !dmComment)}
//                                                         className="btn btn-primary"
//                                                     >
//                                                         {updatingComments ? '⏳ Saving...' : '💾 Save Comments'}
//                                                     </button>

//                                                     <button
//                                                         onClick={() => deleteComments(selectedRecord)}
//                                                         disabled={updatingComments}
//                                                         className="btn btn-danger"
//                                                     >
//                                                         🗑️ Clear Comments
//                                                     </button>
//                                                     <button
//                                                         onClick={() => loadExistingComments(selectedRecord)}
//                                                         disabled={updatingComments}
//                                                         className="btn btn-secondary"
//                                                     >
//                                                         📥 Load Existing
//                                                     </button>
//                                                     <button
//                                                         onClick={clearCommentFields}
//                                                         disabled={updatingComments}
//                                                         className="btn btn-outline"
//                                                     >
//                                                         🧹 Clear Fields
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                             {/* Current Comments Display */}
//                                             <div className="current-comments">
//                                                 <h5>Current Comments:</h5>
//                                                 <div className="comments-display">
//                                                     <div className="comment-item">
//                                                         <strong>DM Comments:</strong>
//                                                         <span className={selectedRecord["DM COMMENTS"] ? "comment-text" : "comment-empty"}>
//                                                             {selectedRecord["DM COMMENTS"] || 'No comments'}
//                                                         </span>
//                                                     </div>
//                                                     <div className="comment-item">
//                                                         <strong>BO Comments:</strong>
//                                                         <span className={selectedRecord["BO COMMENTS"] ? "comment-text" : "comment-empty"}>
//                                                             {selectedRecord["BO COMMENTS"] || 'No comments'}
//                                                         </span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                     <div className="modal-actions">
//                                         <button className="btn btn-primary modal-close-cta" onClick={closeDetails}>Close</button>
//                                     </div>
//                                 </div>
//                             </div>
//                         )}
//                         {renderSummaryCards()}
//                         {/* {isLoadingData && (
//                             <div className="rma-loading">
//                                 <div className="loading-spinner"></div>
//                                 <p>Loading data...</p>
//                             </div>
//                         )} */}
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

interface CommentState {
    dmComment: string;
    boComment: string;
    updating: boolean;
    lastSaved: Date | null;
    autoSave: boolean;
}

// Debounce hook for auto-save
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export default function RMALivePage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [sortBy, setSortBy] = useState<'alphabetical' | 'cost' | 'devices' | 'age'>('cost');
    const [searchTerm, setSearchTerm] = useState('');
    const [rmaData, setRmaData] = useState<RMARecord[]>([]);
    const [xbmData, setXbmData] = useState<RMARecord[]>([]);
    const [tradeInData, setTradeInData] = useState<RMARecord[]>([]);
    const [combinedData, setCombinedData] = useState<RMARecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedRecord, setSelectedRecord] = useState<RMARecord | null>(null);
    const [exportLoading, setExportLoading] = useState(false);
    const [comments, setComments] = useState<CommentState>({
        dmComment: '',
        boComment: '',
        updating: false,
        lastSaved: null,
        autoSave: true
    });
    const [commentsSuccess, setCommentsSuccess] = useState<string | null>(null);
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
            type: 'rma'
        },
        {
            id: 'TRADE_IN',
            name: 'Trade IN',
            type: 'trade_in'
        },
        {
            id: 'XBM',
            name: 'XBM',
            type: 'xbm'
        }
    ];

    const debouncedDmComment = useDebounce(comments.dmComment, 2000);
    const debouncedBoComment = useDebounce(comments.boComment, 2000);

    const searchData = useCallback((data: RMARecord[], searchTerm: string): RMARecord[] => {
        if (!searchTerm.trim()) return data;

        const searchLower = searchTerm.toLowerCase().trim();

        return data.filter((record) => {
            if (!record || Object.keys(record).length === 0) return false;

            const searchableFields = [
                record.Market,
                record["Store Name"],
                record["Store ID"],
                record["RMA #"],
                record["XBM Number"],
                record["RMA Number"],
                record["Tracking Details"],
                record["Model Number"],
                record["Description"],
                record["DM NAME"],
                record["Customer IMEI"],
                record["Assurant IMEI"],
                record["Door Code"],
                record["Employee Name NTID"],
                record["DISTRICT"],
                record["Label Type"],
                record["Shipping Status"],
                record.RecordType
            ].filter(field => field && String(field).trim() !== "");

            return searchableFields.some((field) =>
                String(field).toLowerCase().includes(searchLower)
            );
        });
    }, []);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
        setCurrentPage(1);

        if (!term.trim()) {
            setCurrentData(combinedData);
            setCurrentView('markets');
            setHistoryStack([{ level: 'Markets' }]);
            setSelectedMarket('');
            setSelectedDM('');
            setSelectedType('');
            setImeiFilter('');
            setProductFilter('');
        } else {
            const searchResults = searchData(combinedData, term);
            setCurrentData(searchResults);
            setCurrentView('detailed');
            setHistoryStack([
                { level: 'Markets' },
                { level: 'Search Results', selected: `"${term}"` }
            ]);
        }
    }, [combinedData, searchData]);

    // Enhanced comments functions
    const updateCommentsInSheet = async (record: RMARecord, boComment: string, dmComment: string) => {
        try {
            if (!record || Object.keys(record).length === 0) {
                console.warn('updateCommentsInSheet called with empty record');
                setError('No record selected to update');
                return;
            }

            if ((dmComment.length + boComment.length) > 2000) {
                setError('Comments exceed maximum length of 2000 characters');
                return;
            }

            setComments(prev => ({ ...prev, updating: true }));
            setCommentsSuccess(null);

            const recordIdentifier = record.RecordType === 'XBM'
                ? record["XBM Number"]
                : record["RMA #"];

            if (!recordIdentifier || recordIdentifier.trim() === '') {
                console.error('No record identifier found for record:', record);
                setError('No reference number found for this record');
                setComments(prev => ({ ...prev, updating: false }));
                return;
            }

            console.log('🔄 Updating comments in Google Sheets:', {
                recordType: record.RecordType,
                identifier: recordIdentifier,
                boComment,
                dmComment
            });

            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recordType: record.RecordType,
                    recordIdentifier: recordIdentifier,
                    dmComments: dmComment,
                    boComments: boComment
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to update comments');
            }

            console.log('✅ Comments updated in Google Sheets:', result);

            // Update the data in state for immediate UI feedback
            updateRecordComments(record, boComment, dmComment);


            setComments(prev => ({
                ...prev,
                updating: false,
                lastSaved: new Date()
            }));

            setCommentsSuccess(`Comments updated successfully for ${recordIdentifier}`);

            // Clear success message after 3 seconds
            setTimeout(() => setCommentsSuccess(null), 3000);

        } catch (error: any) {
            console.error('❌ Error updating comments:', error);
            setError(`Failed to update comments: ${error.message}`);
            setComments(prev => ({ ...prev, updating: false }));
        }
    };

    // Auto-save effect
    useEffect(() => {
        if (selectedRecord && comments.autoSave && (debouncedDmComment || debouncedBoComment)) {
            const hasChanges =
                debouncedDmComment !== (selectedRecord["DM COMMENTS"] || '') ||
                debouncedBoComment !== (selectedRecord["BO COMMENTS"] || '');

            if (hasChanges && !comments.updating) {
                console.log('🔄 Auto-saving comments...');
                updateCommentsInSheet(selectedRecord, debouncedBoComment, debouncedDmComment);
            }
        }
    }, [debouncedDmComment, debouncedBoComment, selectedRecord, comments.autoSave]);

    const updateRecordComments = (record: RMARecord, boComment: string, dmComment: string) => {
        if (!record || Object.keys(record).length === 0) {
            console.warn('updateRecordComments called with empty record');
            return;
        }

        console.log('🔄 updateRecordComments called for:', {
            type: record.RecordType,
            identifier: record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"],
            currentView,
            currentDataLength: currentData.length
        });

        const updateData = (data: RMARecord[]) =>
            data.map(item => {
                if (!item || Object.keys(item).length === 0) return item;

                const itemIdentifier = String(
                    item.RecordType === 'XBM' ? item["XBM Number"] : item["RMA #"] || ''
                ).trim();

                const recordIdentifier = String(
                    record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"] || ''
                ).trim();

                // CRITICAL: Check both identifier AND record type
                if (itemIdentifier &&
                    recordIdentifier &&
                    itemIdentifier === recordIdentifier &&
                    item.RecordType === record.RecordType) {

                    console.log(`✅ Updating ${item.RecordType}: ${itemIdentifier}`);

                    return {
                        ...item,
                        "BO COMMENTS": boComment,
                        "DM COMMENTS": dmComment,
                        "DM Comments": dmComment
                    };
                }
                return item;
            });

        // Update individual data sets
        switch (record.RecordType) {
            case 'RMA':
                setRmaData(prev => updateData(prev));
                break;
            case 'XBM':
                setXbmData(prev => updateData(prev));
                break;
            case 'TRADE_IN':
                setTradeInData(prev => updateData(prev));
                break;
        }

        // IMPORTANT: Update currentData FIRST to preserve the current view
        setCurrentData(prev => {
            const updated = updateData(prev);
            console.log('🔄 Updated currentData:', {
                before: prev.length,
                after: updated.length,
                view: currentView
            });
            return updated;
        });

        // Then update combinedData
        setCombinedData(prev => updateData(prev));

        // Update selected record if it matches
        if (selectedRecord) {
            const selectedIdentifier = String(
                selectedRecord.RecordType === 'XBM' ? selectedRecord["XBM Number"] : selectedRecord["RMA #"] || ''
            ).trim();

            const recordIdentifier = String(
                record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"] || ''
            ).trim();

            if (selectedIdentifier &&
                recordIdentifier &&
                selectedIdentifier === recordIdentifier &&
                selectedRecord.RecordType === record.RecordType) {

                setSelectedRecord({
                    ...selectedRecord,
                    "BO COMMENTS": boComment,
                    "DM COMMENTS": dmComment,
                    "DM Comments": dmComment
                });
            }
        }
    };

    const deleteComments = async (record: RMARecord) => {
        if (window.confirm('Are you sure you want to clear all comments for this record? This action cannot be undone.')) {
            await updateCommentsInSheet(record, '', '');
        }
    };

    const loadExistingComments = (record: RMARecord) => {
        setComments({
            dmComment: record["DM COMMENTS"] || '',
            boComment: record["BO COMMENTS"] || '',
            updating: false,
            lastSaved: null,
            autoSave: comments.autoSave
        });
        setCommentsSuccess('Existing comments loaded');
        setTimeout(() => setCommentsSuccess(null), 2000);
    };

    const clearCommentFields = () => {
        setComments({
            dmComment: '',
            boComment: '',
            updating: false,
            lastSaved: null,
            autoSave: comments.autoSave
        });
        setCommentsSuccess('Comment fields cleared');
        setTimeout(() => setCommentsSuccess(null), 2000);
    };

    const toggleAutoSave = () => {
        setComments(prev => ({ ...prev, autoSave: !prev.autoSave }));
    };

    // Initialize/clear comment fields when modal (selectedRecord) changes
    useEffect(() => {
        if (selectedRecord) {
            setComments({
                dmComment: selectedRecord["DM COMMENTS"] || selectedRecord["DM Comments"] || '',
                boComment: selectedRecord["BO COMMENTS"] || '',
                updating: false,
                lastSaved: null,
                autoSave: comments.autoSave
            });
        } else {
            setComments({
                dmComment: '',
                boComment: '',
                updating: false,
                lastSaved: null,
                autoSave: comments.autoSave
            });
            setCommentsSuccess(null);
        }
    }, [selectedRecord]);

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

    // Combine data only when all sources are loaded
    useEffect(() => {
        if (rmaData.length > 0 && xbmData.length > 0 && tradeInData.length > 0) {
            console.log('🔄 All data loaded, combining...');
            combineData();
        }
    }, [rmaData.length, xbmData.length, tradeInData.length]);

    // Simplify currentData management
    useEffect(() => {
        setCurrentData(prev => {
            // Only reset to combinedData if we're at the top level
            if (currentView === 'markets' && historyStack.length === 1) {
                console.log('🔄 Setting currentData to combinedData (top level)');
                return combinedData;
            }
            return prev;
        });
    }, [combinedData, currentView, historyStack.length]);

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
    }, [currentView]);

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
            console.log(`🔄 Fetching ${source.name} data via Google Sheets API v4.x...`);

            const response = await fetch(`/api/sheets-data?type=${source.type}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'API request failed');
            }

            console.log(`✅ ${source.name} - v4.x API data:`, {
                rows: result.data.length,
                sheet: result.sheetTitle,
                version: result.version
            });

            const filteredData = filterDataAtSource(result.data, source.type);

            console.log(`📊 ${source.name} - Filtered: ${filteredData.length} records`);

            return filteredData;

        } catch (err) {
            console.error(`❌ Failed to fetch ${source.name} via v4.x API:`, err);
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
        if (!row || Object.keys(row).length === 0) {
            console.warn('transformToRMARecord called with empty row for type:', type);
            return {
                "DM COMMENTS": "",
                "DM Comments": "",
                "BO COMMENTS": "",
                "Market": "",
                "DISTRICT": "",
                "DM NAME": "",
                "Store ID": "",
                "Store Name": "",
                "Door Code": "",
                "Model Number": "",
                "Description": "",
                "Customer IMEI": "",
                "Employee Name NTID": "",
                "Assurant IMEI": "",
                "Processed Date": "",
                "Label Type": "",
                "RMA #": "",
                "RMA Date": "",
                "Count of Devices": "",
                "Tracking Details": "",
                "Date & Time": "",
                "Shipping Status": "",
                "COST": "",
                "AGE": "",
                "Error": "",
                "RecordType": type,
                "Status": "Pending",
                "Amount": 0,
                "DaysOld": 0
            };
        }

        const getValue = (keys: string[]): string => {
            for (const key of keys) {
                if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
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

            // Filter out empty records
            const validRMA = transformedRMA.filter(record => record && Object.keys(record).length > 0);
            const validTradeIN = transformedTradeIN.filter(record => record && Object.keys(record).length > 0);
            const validXBM = transformedXBM.filter(record => record && Object.keys(record).length > 0);

            setRmaData(validRMA);
            setTradeInData(validTradeIN);
            setXbmData(validXBM);

        } catch (err) {
            setError('Failed to load RMA data');
            console.error('Error fetching RMA data:', err);
        } finally {
            setLoading(false);
        }
    };

    const combineData = () => {
        const allData = [...rmaData, ...xbmData, ...tradeInData];

        // Filter out empty records first
        const validData = allData.filter(record =>
            record &&
            Object.keys(record).length > 0 &&
            record.RecordType
        );

        const filteredData = validData.filter(record =>
            record.Status &&
            String(record.Status).toLowerCase() === 'pending' &&
            isValidIMEI(record["Customer IMEI"] || '')
        );

        console.log('🔄 Combined RMA data:', {
            totalRecords: allData.length,
            validRecords: validData.length,
            pendingWithValidIMEI: filteredData.length,
            totalCost: filteredData.reduce((sum, r) => sum + r.Amount, 0)
        });

        setCombinedData(filteredData);
    };

    // Enhanced filteredData with search support
    const filteredData = useMemo(() => {
        let data = currentData;

        // Apply IMEI and product filters for detailed view
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
    }, [currentData, currentView, imeiFilter, productFilter]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // Enhanced aggregateData function with better sorting
    const aggregateData = (data: RMARecord[], level: 'markets' | 'dm' | 'types'): AggregatedGroup[] => {
        const groups: { [key: string]: AggregatedGroup } = {};

        if (level === 'markets') {
            const markets = Array.from(new Set(data.map(record => record.Market))).filter(m => m && m !== 'Unknown');
            markets.forEach(market => {
                const marketData = data.filter(record => record.Market === market);
                const totalCost = marketData.reduce((sum, record) => sum + record.Amount, 0);
                const pendingCount = marketData.length;

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

        // Enhanced sorting logic
        return Object.values(groups).sort((a, b) => {
            switch (sortBy) {
                case 'alphabetical':
                    return a.key.localeCompare(b.key);
                case 'cost':
                    return b.cost - a.cost;
                case 'devices':
                    return b.devices - a.devices;
                case 'age':
                    const avgAgeA = a.rows.reduce((sum, r) => sum + r.DaysOld, 0) / a.rows.length;
                    const avgAgeB = b.rows.reduce((sum, r) => sum + r.DaysOld, 0) / b.rows.length;
                    return avgAgeB - avgAgeA;
                default:
                    return b.cost - a.cost;
            }
        });
    };

    const handleMarketClick = (market: AggregatedGroup) => {
        console.log('📍 Market clicked:', market.key, 'Rows:', market.rows.length);
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
        console.log('📍 DM clicked:', dm.key, 'Rows:', dm.rows.length);
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
        console.log('📍 Type clicked:', type.key, 'Rows:', type.rows.length);
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

    const toggleRowExpansion = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const showDetails = (record: RMARecord) => {
        if (!record || Object.keys(record).length === 0) {
            console.error('Attempted to show details for empty record');
            setError('Cannot show details for empty record');
            return;
        }

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

    // Enhanced breadcrumb for search results
    const renderBreadcrumb = () => {
        return historyStack.map((item, index) => (
            <span key={index} className="rma-breadcrumb">
                {item.level === 'Search Results' ? (
                    <span className="search-breadcrumb">
                        🔍 {item.level}: {item.selected}
                    </span>
                ) : (
                    item.selected ? `${item.level} — ${item.selected}` : item.level
                )}
                {index < historyStack.length - 1 && <span className="mx-2 text-gray-400"> › </span>}
            </span>
        ));
    };

    const renderHierarchicalTable = (data: RMARecord[], level: 'markets' | 'dm' | 'types', onRowClick: (group: AggregatedGroup) => void) => {
        const aggregated = aggregateData(data, level);
        const maxCost = Math.max(...aggregated.map(a => a.cost), 1);
        const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

        let title = '';
        let subtitle = '';

        switch (level) {
            case 'markets':
                title = searchTerm ? `Markets matching "${searchTerm}"` : 'Markets';
                break;
            case 'dm':
                title = `District Managers in ${selectedMarket}`;
                subtitle = searchTerm ? `Filtered by: "${searchTerm}"` : '';
                break;
            case 'types':
                title = `Record Types for ${selectedDM}`;
                subtitle = searchTerm ? `Filtered by: "${searchTerm}"` : '';
                break;
        }

        return (
            <div className="rma-table-block">
                <div className="rma-table-header">
                    <h2>{title}</h2>
                    <div className="rma-meta">
                        {aggregated.length} groups — {data.length} total records — total value ${totalCost.toLocaleString()}
                        {subtitle && ` • ${subtitle}`}
                        {!subtitle && searchTerm && ` • Filtered by: "${searchTerm}"`}
                    </div>
                </div>

                <div className="rma-table-wrapper">
                    <table className="rma-table">
                        <thead>
                            <tr>
                                <th>{title}</th>
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
                            {paginatedData
                                .filter(record => record && Object.keys(record).length > 0)
                                .map((record, index) => {
                                    const uniqueId = `${record.RecordType}-${record["RMA #"] || record["XBM Number"]}-${index}`;
                                    const referenceNumber = record.RecordType === 'XBM' ? record["XBM Number"] : record["RMA #"];

                                    return (
                                        <React.Fragment key={uniqueId}>
                                            <tr className="clickable-row">
                                                <td>
                                                    <span className={`record-type-badge type-${record.RecordType.toLowerCase()}`}>
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
                                                    <span className={`status-badge status-${record.Status.toLowerCase()}`}>
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
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showDetails(record);
                                                        }}
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

                    {paginatedData.filter(record => record && Object.keys(record).length > 0).length === 0 && (
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

    const renderSummaryCards = () => (
        <section className="dashboard-grid">
            <div className="dashboard-card card-purple">
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
            <div className="dashboard-card card-purple">
                <div className="card-icon">📦</div>
                <div className="card-content">
                    <h3 className="card-title">RMA Records</h3>
                    <p className="card-description">{summaryStats.rmaCount}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">🔄</div>
                <div className="card-content">
                    <h3 className="card-title">XBM Records</h3>
                    <p className="card-description">{summaryStats.xbmCount}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">🤝</div>
                <div className="card-content">
                    <h3 className="card-title">Trade IN</h3>
                    <p className="card-description">{summaryStats.tradeInCount}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                    <h3 className="card-title">Pending</h3>
                    <p className="card-description">{summaryStats.pendingCount}</p>
                </div>
            </div>
        </section>
    );

    if (loading) {
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
                        {/* Simplified Search Controls */}
                        <div className="rma-controls-section">
                            <div className="rma-controls-grid">
                                <div className="search-container">
                                    <div className={`search-box-with-navigation ${searchTerm ? 'has-value' : ''}`}>
                                        <input
                                            type="text"
                                            placeholder="Search markets, DMs, record types, RMA#, IMEI, Store ID..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className={`search-input ${searchTerm ? 'has-value' : ''}`}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    // Search is already handled by onChange
                                                }
                                            }}
                                        />
                                        <span className="search-icon">🔍</span>
                                        {searchTerm && (
                                            <button
                                                onClick={() => handleSearch('')}
                                                className="clear-filter"
                                                title="Clear search and go back"
                                                type="button"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {searchTerm && (
                                        <div className="search-info">
                                            <small>
                                                Searching for: "{searchTerm}" • {filteredData.length} results found
                                                <br />
                                                <em>Click ✕ to clear search and return to main view</em>
                                            </small>
                                        </div>
                                    )}
                                </div>

                                <div className="controls-group">
                                    {/* Enhanced Sort Controls */}
                                    <div className="sort-controls">
                                        <label htmlFor="sort-select">Sort by:</label>
                                        <select
                                            id="sort-select"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="sort-select"
                                        >
                                            <option value="cost">Cost (Highest First)</option>
                                            <option value="alphabetical">Alphabetical</option>
                                            <option value="devices">Device Count</option>
                                            <option value="age">Age (Oldest First)</option>
                                        </select>
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
                        </div>

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
                                                <span className={`status-badge status-${selectedRecord.Status.toLowerCase()}`}>
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

                                        {/* Enhanced Comments Section */}
                                        <div className="comments-section">
                                            <div className="comments-header">
                                                <h4>Comments Management</h4>
                                                <div className="comments-meta">
                                                    <label className="auto-save-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={comments.autoSave}
                                                            onChange={toggleAutoSave}
                                                        />
                                                        Auto-save
                                                    </label>
                                                    {comments.lastSaved && (
                                                        <span className="last-saved">
                                                            Last saved: {comments.lastSaved.toLocaleTimeString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Success Message */}
                                            {commentsSuccess && (
                                                <div className="success-message">
                                                    ✅ {commentsSuccess}
                                                </div>
                                            )}

                                            {/* Character Count */}
                                            <div className="character-count">
                                                Total characters: {comments.dmComment.length + comments.boComment.length} / 2000
                                            </div>

                                            <div className="comments-form">
                                                <div className="form-group">
                                                    <label htmlFor="dm-comments">
                                                        DM Comments:
                                                        <span className="comment-length">({comments.dmComment.length})</span>
                                                    </label>
                                                    <textarea
                                                        id="dm-comments"
                                                        value={comments.dmComment}
                                                        onChange={(e) => setComments(prev => ({ ...prev, dmComment: e.target.value }))}
                                                        placeholder="Enter DM comments here..."
                                                        rows={3}
                                                        className="comments-textarea"
                                                        disabled={comments.updating}
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label htmlFor="bo-comments">
                                                        BO Comments:
                                                        <span className="comment-length">({comments.boComment.length})</span>
                                                    </label>
                                                    <textarea
                                                        id="bo-comments"
                                                        value={comments.boComment}
                                                        onChange={(e) => setComments(prev => ({ ...prev, boComment: e.target.value }))}
                                                        placeholder="Enter BO comments here..."
                                                        rows={3}
                                                        className="comments-textarea"
                                                        disabled={comments.updating}
                                                    />
                                                </div>

                                                <div className="comments-actions">
                                                    <button
                                                        onClick={() => updateCommentsInSheet(selectedRecord, comments.boComment, comments.dmComment)}
                                                        disabled={comments.updating || (!comments.boComment && !comments.dmComment)}
                                                        className="btn btn-primary"
                                                    >
                                                        {comments.updating ? '⏳ Saving...' : '💾 Save Comments'}
                                                    </button>

                                                    <button
                                                        onClick={() => deleteComments(selectedRecord)}
                                                        disabled={comments.updating}
                                                        className="btn btn-danger"
                                                    >
                                                        🗑️ Clear Comments
                                                    </button>

                                                    <button
                                                        onClick={() => loadExistingComments(selectedRecord)}
                                                        disabled={comments.updating}
                                                        className="btn btn-secondary"
                                                    >
                                                        📥 Load Existing
                                                    </button>

                                                    <button
                                                        onClick={clearCommentFields}
                                                        disabled={comments.updating}
                                                        className="btn btn-outline"
                                                    >
                                                        🧹 Clear Fields
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Current Comments Display */}
                                            <div className="current-comments">
                                                <h5>Current Comments:</h5>
                                                <div className="comments-display">
                                                    <div className="comment-item">
                                                        <strong>DM Comments:</strong>
                                                        <span className={selectedRecord["DM COMMENTS"] ? "comment-text" : "comment-empty"}>
                                                            {selectedRecord["DM COMMENTS"] || 'No comments'}
                                                        </span>
                                                    </div>
                                                    <div className="comment-item">
                                                        <strong>BO Comments:</strong>
                                                        <span className={selectedRecord["BO COMMENTS"] ? "comment-text" : "comment-empty"}>
                                                            {selectedRecord["BO COMMENTS"] || 'No comments'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-actions">
                                        <button className="btn btn-primary modal-close-cta" onClick={closeDetails}>Close</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {renderSummaryCards()}
                    </main>
                </div>
            </div>
        </div>
    );
}
