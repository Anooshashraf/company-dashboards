// 'use client';
// import React, { useEffect, useMemo, useState } from 'react';
// import { useAuth } from '../../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import './ordering-styles.css';

// type Row = { [k: string]: string | undefined };

// interface OrderingReport {
//     Region: string;
//     Market: string;
//     'Store Name': string;
//     'PO Number': string;
//     'PO Date': string;
//     'PO Amount': string;
//     'Received Amount': string;
//     'Open Amount': string;
//     Status: string;
//     Vendor: string;
//     'Order Number': string;
//     'Add Date': string;
//     DM: string;
// }

// interface AggregatedGroup {
//     key: string;
//     count: number; // Store count
//     poCount: number; // From PO Listing
//     poReceived: number; // From Receiving based on remarks
//     poRecAmount: number; // From Receiving - SUM of recamount
//     pendingPOs: number; // Only POs with "pending" in remarks
//     poOpenAmount: number; // From Receiving - SUM of openamount
//     rows: OrderingReport[];
// }

// interface RegionTotals {
//     totalStores: number;
//     totalPOs: number;
//     poReceived: number;
//     poRecAmount: number;
//     pendingPOs: number;
//     poOpenAmount: number;
// }

// export default function OrderingReportsPage() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [reports, setReports] = useState<OrderingReport[]>([]);
//     const [poListingData, setPoListingData] = useState<Row[]>([]);
//     const [receivingData, setReceivingData] = useState<Row[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage] = useState(50);
//     const [expandedRow, setExpandedRow] = useState<string | null>(null);
//     const [selectedDetails, setSelectedDetails] = useState<OrderingReport | null>(null);

//     const [dateFilter, setDateFilter] = useState({
//         startDate: '',
//         endDate: ''
//     });

//     const [currentView, setCurrentView] = useState<'regions' | 'markets' | 'stores' | 'detailed'>('regions');
//     const [currentData, setCurrentData] = useState<OrderingReport[]>([]);
//     const [selectedRegion, setSelectedRegion] = useState<string>('');
//     const [selectedMarket, setSelectedMarket] = useState<string>('');
//     const [selectedStore, setSelectedStore] = useState<string>('');
//     const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([{ level: "Regions" }]);

//     // Data sources configuration
//     const dataSources = [
//         {
//             id: 'PO LISTING',
//             name: 'PO LISTING',
//             gid: '1310303348',
//             description: 'Purchase order listings',
//             type: 'po-listing'
//         },
//         {
//             id: 'RECEIVING',
//             name: 'RECEIVING',
//             gid: '1717319803',
//             description: 'PO receiving data',
//             type: 'receiving'
//         }
//     ];

//     const BASE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR3jaC4nOWrLwS6YzNxoDDRR3gDqj77jjEnPpeQvV1VCAl5pE5qaDs59yz5HVYtxA/pub?output=csv';

//     useEffect(() => {
//         if (!isLoading && !isAuthenticated) {
//             router.push('/login');
//         }
//     }, [isAuthenticated, isLoading, router]);

//     useEffect(() => {
//         if (isAuthenticated) {
//             fetchOrderingData();
//         }
//     }, [isAuthenticated]);

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

//     const getSheetUrl = (gid: string): string => {
//         return `${BASE_SHEET_URL}&gid=${gid}`;
//     };

//     const fetchDataSource = async (source: any): Promise<Row[]> => {
//         try {
//             const url = getSheetUrl(source.gid);
//             const response = await fetch(url);

//             if (!response.ok) throw new Error(`HTTP ${response.status}`);

//             const csvText = await response.text();
//             if (!csvText || csvText.trim().length === 0) throw new Error('Empty response');

//             const parsedData = parseCSV(csvText);
//             if (parsedData.length === 0) throw new Error('No data parsed');

//             return parsedData;

//         } catch (err) {
//             console.error(`Error fetching ${source.name}:`, err);
//             return [];
//         }
//     };

//     // Debug function to check data matching
//     const debugDataMatching = () => {
//         console.log('=== DATA MATCHING DEBUG ===');

//         if (receivingData.length > 0) {
//             console.log('Receiving Data Columns:', Object.keys(receivingData[0]));
//             console.log('Sample Receiving Stores:', Array.from(new Set(receivingData.slice(0, 10).map(row => getValue(row, ['Store Name'])))));
//         }

//         if (reports.length > 0) {
//             console.log('PO Listing Stores:', Array.from(new Set(reports.slice(0, 10).map(report => report['Store Name']))));
//         }

//         console.log('=== END DEBUG ===');
//     };

//     const fetchOrderingData = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             // Fetch both data sources
//             const [poData, receivingData] = await Promise.all([
//                 fetchDataSource(dataSources[0]),
//                 fetchDataSource(dataSources[1])
//             ]);

//             setPoListingData(poData);
//             setReceivingData(receivingData);

//             // Debug column names and data
//             console.log('PO Listing Sample:', poData.slice(0, 3));
//             console.log('Receiving Sample:', receivingData.slice(0, 3));

//             // Transform PO Listing data for basic structure
//             const transformedData: OrderingReport[] = poData.map(row => ({
//                 Region: getValue(row, ['Regions', 'Region']),
//                 Market: getValue(row, ['marketid', 'Market']),
//                 'Store Name': getValue(row, ['storename', 'Store Name']),
//                 'PO Number': getValue(row, ['pono', 'PoNum', 'PO Number']),
//                 'PO Date': getValue(row, ['podate', 'PoDate']),
//                 'PO Amount': '', // Will be populated from receiving data
//                 'Received Amount': '', // Will be populated from receiving data
//                 'Open Amount': '', // Will be populated from receiving data
//                 Status: getValue(row, ['postat', 'Status']),
//                 Vendor: getValue(row, ['vendor', 'Vendor', 'company']),
//                 'Order Number': getValue(row, ['Order No', 'OrderNo', 'vendorpo']),
//                 'Add Date': getValue(row, ['adddate', 'AddDate']),
//                 DM: getValue(row, ['DM', 'Dm', 'dm'])
//             }));

//             setReports(transformedData);
//             setCurrentData(transformedData);

//             // Debug data matching after state update
//             setTimeout(() => {
//                 debugDataMatching();

//                 // Test with Colorado data
//                 if (transformedData.length > 0) {
//                     const coloradoStores = transformedData.filter(report => report.Market === 'COLORADO');
//                     if (coloradoStores.length > 0) {
//                         const testStore = coloradoStores[0]['Store Name'];
//                         const testMarket = coloradoStores[0].Market;
//                         const testAmounts = getReceivingAmounts(testStore, testMarket);
//                         console.log('=== COLORADO TEST ===');
//                         console.log('Test Store:', testStore);
//                         console.log('Test Market:', testMarket);
//                         console.log('Test Amounts:', testAmounts);
//                         console.log('=== END TEST ===');
//                     }
//                 }
//             }, 1000);

//         } catch (err) {
//             setError('Failed to load ordering data');
//             console.error('Error fetching ordering data:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const getValue = (row: Row, possibleKeys: string[]): string => {
//         for (const k of possibleKeys) {
//             // Try exact match first
//             if (row[k] !== undefined && String(row[k]).trim() !== '') {
//                 return String(row[k]).trim();
//             }
//         }

//         // If no exact match, try case-insensitive
//         for (const k of possibleKeys) {
//             const cleanK = k.toLowerCase().replace(/\s+/g, '');
//             for (const actualKey of Object.keys(row)) {
//                 const cleanActualKey = actualKey.toLowerCase().replace(/\s+/g, '');
//                 if (cleanActualKey === cleanK && String(row[actualKey]).trim() !== '') {
//                     return String(row[actualKey]).trim();
//                 }
//             }
//         }
//         return '';
//     };

//     const parseCurrency = (s?: string | number | undefined): number => {
//         if (s === 0) return 0;
//         if (!s && s !== 0) return 0;
//         const str = String(s).trim();
//         if (str === '' || str === '-' || str === '$-' || str === '$ -') return 0;
//         const cleaned = str.replace(/[$,]/g, '').replace(/\s+/g, '');
//         const n = parseFloat(cleaned);
//         return isNaN(n) ? 0 : n;
//     };

//     // Get PO counts from PO Listing data
//     const getPOCounts = (data: OrderingReport[]): { poCount: number; uniquePOs: Set<string> } => {
//         const uniquePOs = new Set(data.map(report => report['PO Number']).filter(po => po));
//         return {
//             poCount: uniquePOs.size,
//             uniquePOs
//         };
//     };

//     const getReceivingAmounts = (storeName: string, market: string): {
//         poRecAmount: number;
//         poOpenAmount: number;
//         poReceived: number;
//         pendingPOs: number;
//     } => {
//         let poRecAmount = 0;
//         let poOpenAmount = 0;

//         // Track unique POs for counting
//         const receivedPOs = new Set<string>();
//         const pendingPOsSet = new Set<string>();
//         const allPOs = new Set<string>();

//         console.log(`🔍 Looking for store: "${storeName}" in market: "${market}"`);

//         // Find ALL matching rows in receiving data for this store/market
//         const receivingRows = receivingData.filter(row => {
//             const rowStore = getValue(row, ['Store Name']);
//             const rowMarket = getValue(row, ['Market']);

//             return rowStore === storeName && rowMarket === market;
//         });

//         console.log(`📊 Found ${receivingRows.length} receiving rows for "${storeName}" in "${market}"`);

//         // Process each row individually
//         receivingRows.forEach(row => {
//             const poNumber = getValue(row, ['PoNum']);
//             if (!poNumber) return;

//             // Use the exact column names from your sheet
//             const recAmount = parseCurrency(getValue(row, ['recamount']));
//             const openAmount = parseCurrency(getValue(row, ['openamount']));
//             const remarks = getValue(row, ['remarks']).toLowerCase();

//             console.log(`📝 Processing - PO: ${poNumber}, Rec: ${recAmount}, Open: ${openAmount}, Remarks: "${remarks}"`);

//             // Add to total amounts (SUM of all recamount and openamount values)
//             poRecAmount += recAmount;
//             poOpenAmount += openAmount;

//             // Track all POs
//             allPOs.add(poNumber);

//             // COUNT AS RECEIVED: Only if recamount > 0
//             if (recAmount > 0) {
//                 receivedPOs.add(poNumber);
//                 console.log(`📦 Added to received: ${poNumber} - Rec Amount: ${recAmount}`);
//             }

//             // COUNT AS PENDING: Only if remarks include "pending" (NOT "in transit") AND recamount = 0
//             if (remarks.includes('pending') && recAmount === 0) {
//                 pendingPOsSet.add(poNumber);
//                 console.log(`⏳ Added to pending: ${poNumber} - Remarks: "${remarks}"`);
//             }
//         });

//         console.log(`🎯 Final totals for "${storeName}" in "${market}":`, {
//             totalPOs: allPOs.size,
//             poRecAmount,
//             poOpenAmount,
//             poReceived: receivedPOs.size,
//             pendingPOs: pendingPOsSet.size,
//             receivedPOs: Array.from(receivedPOs),
//             pendingPOsList: Array.from(pendingPOsSet),
//             allPOsList: Array.from(allPOs)
//         });

//         return {
//             poRecAmount,
//             poOpenAmount,
//             poReceived: receivedPOs.size,
//             pendingPOs: pendingPOsSet.size
//         };
//     };

//     const getCombinedMarketTotals = (market: string) => {
//         console.log(`=== COMBINED MARKET TOTALS FOR: ${market} ===`);

//         // COUNT STORES: From BOTH sheets combined
//         const receivingStores = new Set(
//             receivingData
//                 .filter(row => getValue(row, ['Market']) === market)
//                 .map(row => getValue(row, ['Store Name']))
//                 .filter(s => s)
//         );

//         const poListingStores = new Set(
//             poListingData
//                 .filter(row => getValue(row, ['marketid', 'Market']) === market)
//                 .map(row => getValue(row, ['storename', 'Store Name']))
//                 .filter(s => s)
//         );

//         const allStores = new Set([...receivingStores, ...poListingStores]);

//         // COUNT POS: ONLY from PO LISTING sheet (as per your summary)
//         const poListingPOs = new Set(
//             poListingData
//                 .filter(row => getValue(row, ['marketid', 'Market']) === market)
//                 .map(row => getValue(row, ['pono', 'PoNum', 'PO Number']))
//                 .filter(po => po)
//         );

//         // RECEIVED POs & AMOUNTS: ONLY from RECEIVING sheet
//         let marketRecAmount = 0;
//         let marketOpenAmount = 0;
//         const marketReceivedPOs = new Set<string>();
//         const marketPendingPOs = new Set<string>();

//         const receivingRows = receivingData.filter(row => getValue(row, ['Market']) === market);

//         receivingRows.forEach(row => {
//             const poNumber = getValue(row, ['PoNum']);
//             const recAmount = parseCurrency(getValue(row, ['recamount']));
//             const openAmount = parseCurrency(getValue(row, ['openamount']));
//             const remarks = getValue(row, ['remarks']).toLowerCase();

//             marketRecAmount += recAmount;
//             marketOpenAmount += openAmount;

//             if (recAmount > 0 && !remarks.includes('pending') && !remarks.includes('In Transit') && remarks.includes('received')) {
//                 marketReceivedPOs.add(poNumber);
//             }

//             if (remarks.includes('pending')) {
//                 marketPendingPOs.add(poNumber);
//             }
//         });

//         console.log(`📊 ${market} COUNTS (MATCHING SUMMARY):`, {
//             // Store Count: Combined from both sheets
//             totalStores: allStores.size,
//             receivingStores: receivingStores.size,
//             poListingStores: poListingStores.size,

//             // PO Count: ONLY from PO Listing
//             totalPOs: poListingPOs.size,

//             // Received & Pending: ONLY from Receiving
//             poReceived: marketReceivedPOs.size,
//             pendingPOs: marketPendingPOs.size,
//             poRecAmount: marketRecAmount,
//             poOpenAmount: marketOpenAmount
//         });

//         console.log(`🏪 ${market} STORE BREAKDOWN:`, {
//             storesOnlyInReceiving: Array.from(receivingStores).filter(store => !poListingStores.has(store)),
//             storesOnlyInPOListing: Array.from(poListingStores).filter(store => !receivingStores.has(store)),
//             commonStores: Array.from(receivingStores).filter(store => poListingStores.has(store))
//         });

//         console.log(`📄 ${market} PO BREAKDOWN:`, {
//             poListingPOs: Array.from(poListingPOs),
//             receivedPOs: Array.from(marketReceivedPOs),
//             pendingPOs: Array.from(marketPendingPOs)
//         });

//         return {
//             // Store Count: Combined from both sheets
//             totalStores: allStores.size,

//             // PO Count: ONLY from PO Listing
//             totalPOs: poListingPOs.size,

//             // Received & Pending: ONLY from Receiving
//             poReceived: marketReceivedPOs.size,
//             poRecAmount: marketRecAmount,
//             pendingPOs: marketPendingPOs.size,
//             poOpenAmount: marketOpenAmount
//         };
//     };

//     const getPOStatusFromReceiving = (poNumber: string, storeName: string, market: string): {
//         receivedAmount: number;
//         openAmount: number;
//         status: string;
//         remarks: string;
//     } => {
//         const receivingRows = receivingData.filter(row => {
//             const rowPO = getValue(row, ['PoNum']);
//             const rowStore = getValue(row, ['Store Name']);
//             const rowMarket = getValue(row, ['Market']);

//             return rowPO === poNumber && rowStore === storeName && rowMarket === market;
//         });

//         let totalReceived = 0;
//         let totalOpen = 0;
//         const remarksSet = new Set<string>();

//         receivingRows.forEach(row => {
//             // Use exact column names from your sheet
//             totalReceived += parseCurrency(getValue(row, ['recamount']));
//             totalOpen += parseCurrency(getValue(row, ['openamount']));

//             const rowRemarks = getValue(row, ['remarks']);
//             if (rowRemarks) {
//                 remarksSet.add(rowRemarks);
//             }
//         });

//         const allRemarks = Array.from(remarksSet).join(', ');
//         const remarksLower = allRemarks.toLowerCase();

//         // Determine status based on your sheet data
//         let status = 'Open';
//         if (remarksLower.includes('pending') || remarksLower.includes('in transit')) {
//             status = 'Pending';
//         } else if (totalReceived > 0 && totalOpen === 0) {
//             status = 'Completed';
//         } else if (totalReceived > 0 && totalOpen > 0) {
//             status = 'Partially Received';
//         } else if (remarksLower.includes('received') || remarksLower.includes('complete') || remarksLower.includes('delivered')) {
//             status = 'Received';
//         }

//         return {
//             receivedAmount: totalReceived,
//             openAmount: totalOpen,
//             status,
//             remarks: allRemarks
//         };
//     };

//     const getRegions = (data: OrderingReport[]) => {
//         const regions: { [key: string]: OrderingReport[] } = {
//             "Aleem Ghori Region": [],
//             "Hasnain Mustaqeem Region": []
//         };

//         data.forEach(report => {
//             const region = report.Region;

//             if (region === "Aleem Ghori Region") {
//                 regions["Aleem Ghori Region"].push(report);
//             } else if (region === "Hasnain Mustaqeem Region") {
//                 regions["Hasnain Mustaqeem Region"].push(report);
//             } else {
//                 console.warn('Unknown region:', region, 'for store:', report['Store Name']);
//             }
//         });

//         return regions;
//     };

//     // Add this function to debug market-level calculations
//     const debugMarketCalculations = (market: string) => {
//         console.log(`=== DEBUG MARKET: ${market} ===`);

//         const marketStores = reports.filter(report => report.Market === market);
//         const uniqueStores = new Set(marketStores.map(report => report['Store Name']));

//         let totalRecAmount = 0;
//         let totalOpenAmount = 0;
//         let totalReceivedPOs = 0;
//         let totalPendingPOs = 0;
//         let totalAllPOs = 0;

//         console.log(`Stores in ${market}:`, Array.from(uniqueStores));

//         uniqueStores.forEach(storeName => {
//             const amounts = getReceivingAmounts(storeName, market);
//             totalRecAmount += amounts.poRecAmount;
//             totalOpenAmount += amounts.poOpenAmount;
//             totalReceivedPOs += amounts.poReceived;
//             totalPendingPOs += amounts.pendingPOs;

//             // Count all POs for this store
//             const storePOs = new Set(
//                 receivingData
//                     .filter(row => {
//                         const rowStore = getValue(row, ['Store Name']);
//                         const rowMarket = getValue(row, ['Market']);
//                         return rowStore === storeName && rowMarket === market;
//                     })
//                     .map(row => getValue(row, ['PoNum']))
//                     .filter(po => po)
//             );
//             totalAllPOs += storePOs.size;

//             console.log(`Store "${storeName}":`, {
//                 POs: storePOs.size,
//                 received: amounts.poReceived,
//                 pending: amounts.pendingPOs,
//                 recAmount: amounts.poRecAmount,
//                 openAmount: amounts.poOpenAmount
//             });
//         });

//         console.log(`📈 MARKET ${market} TOTALS:`, {
//             stores: uniqueStores.size,
//             totalPOs: totalAllPOs,
//             poReceived: totalReceivedPOs,
//             poRecAmount: totalRecAmount,
//             pendingPOs: totalPendingPOs,
//             poOpenAmount: totalOpenAmount
//         });

//         console.log(`=== END DEBUG ${market} ===`);
//     };

//     const getUniqueStoreCount = (data: OrderingReport[]): number => {
//         const uniqueStores = new Set(data.map(report => report['Store Name']));
//         return uniqueStores.size;
//     };

//     const filterByDate = (data: OrderingReport[]): OrderingReport[] => {
//         if (!dateFilter.startDate && !dateFilter.endDate) {
//             return data;
//         }

//         return data.filter(report => {
//             const reportDate = report['PO Date'] || report['Add Date'] || '';
//             if (!reportDate) return true;

//             const reportDateObj = new Date(reportDate);
//             const startDateObj = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
//             const endDateObj = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

//             let include = true;
//             if (startDateObj) {
//                 include = include && reportDateObj >= startDateObj;
//             }
//             if (endDateObj) {
//                 include = include && reportDateObj <= endDateObj;
//             }

//             return include;
//         });
//     };
//     const getRegionFromMarket = (market: string): string => {
//         // Try to find the region from receiving data first
//         const marketRow = receivingData.find(row => getValue(row, ['Market']) === market);
//         if (marketRow) {
//             const region = getValue(marketRow, ['Regions', 'Region']);
//             if (region) return region;
//         }

//         // Try to find from PO listing data
//         const poListingRow = poListingData.find(row => getValue(row, ['marketid', 'Market']) === market);
//         if (poListingRow) {
//             const region = getValue(poListingRow, ['Regions', 'Region']);
//             if (region) return region;
//         }

//         // Fallback mapping based on your data structure
//         const regionMapping: { [key: string]: string } = {
//             'COLORADO': 'Aleem Ghori Region',
//             'ARIZONA': 'Aleem Ghori Region',
//             'GEORGIA': 'Hasnain Mustaqeem Region',
//             'DALLAS': 'Aleem Ghori Region',
//             'HOUSTON': 'Aleem Ghori Region',
//             'SAN DIEGO': 'Hasnain Mustaqeem Region',
//             'LOS ANGELES': 'Hasnain Mustaqeem Region',
//             'SAN FRANCISCO': 'Hasnain Mustaqeem Region',
//             'BAY AREA': 'Hasnain Mustaqeem Region',
//             'EAST BAY AREA': 'Hasnain Mustaqeem Region',
//             'NORTH BAY AREA': 'Hasnain Mustaqeem Region',
//             'MEMPHIS': 'Aleem Ghori Region',
//             'NASHVILLE': 'Aleem Ghori Region',
//             'NORTH CAROL': 'Aleem Ghori Region',
//             'EL PASO': 'Aleem Ghori Region',
//             'ARKANSAS': 'Aleem Ghori Region',
//             'OKHLAHOMA': 'Aleem Ghori Region',
//             'OREGON': 'Hasnain Mustaqeem Region',
//             'CHARLOTTE': 'Aleem Ghori Region'
//         };

//         return regionMapping[market] || 'Unknown Region';
//     };

//     const aggregate = (data: OrderingReport[], level: string): AggregatedGroup[] => {
//         const groups: { [key: string]: AggregatedGroup } = {};

//         if (level === "regions") {
//             const allMarkets = new Set(receivingData.map(row => getValue(row, ['Market'])).filter(m => m));

//             const regionsData: { [key: string]: RegionTotals } = {};

//             allMarkets.forEach(market => {
//                 const marketTotals = getCombinedMarketTotals(market);
//                 const region = getRegionFromMarket(market);

//                 if (!regionsData[region]) {
//                     regionsData[region] = {
//                         totalStores: 0,
//                         totalPOs: 0,
//                         poReceived: 0,
//                         poRecAmount: 0,
//                         pendingPOs: 0,
//                         poOpenAmount: 0
//                     };
//                 }

//                 regionsData[region].totalStores += marketTotals.totalStores;
//                 regionsData[region].totalPOs += marketTotals.totalPOs;
//                 regionsData[region].poReceived += marketTotals.poReceived;
//                 regionsData[region].poRecAmount += marketTotals.poRecAmount;
//                 regionsData[region].pendingPOs += marketTotals.pendingPOs;
//                 regionsData[region].poOpenAmount += marketTotals.poOpenAmount;
//             });

//             Object.entries(regionsData).forEach(([regionName, regionTotals]) => {
//                 groups[regionName] = {
//                     key: regionName,
//                     count: regionTotals.totalStores,
//                     poCount: regionTotals.totalPOs,
//                     poReceived: regionTotals.poReceived,
//                     poRecAmount: regionTotals.poRecAmount,
//                     pendingPOs: regionTotals.pendingPOs,
//                     poOpenAmount: regionTotals.poOpenAmount,
//                     rows: [] // We don't need rows for region level
//                 };
//             });
//         } else if (level === "markets") {
//             const allMarkets = new Set(receivingData.map(row => getValue(row, ['Market'])).filter(m => m));
//             const markets = Array.from(allMarkets).filter(m => m && m !== "Unknown");

//             markets.forEach(market => {
//                 const marketTotals = getCombinedMarketTotals(market);

//                 groups[market] = {
//                     key: market,
//                     count: marketTotals.totalStores,
//                     poCount: marketTotals.totalPOs,
//                     poReceived: marketTotals.poReceived,
//                     poRecAmount: marketTotals.poRecAmount,
//                     pendingPOs: marketTotals.pendingPOs,
//                     poOpenAmount: marketTotals.poOpenAmount,
//                     rows: [] // We don't need rows for market level
//                 };
//             });
//         } else if (level === "stores") {
//             // Get the current market from the filtered data
//             const currentMarket = data[0]?.Market || '';
//             if (!currentMarket) return [];

//             // For store level, combine stores from BOTH sheets for this specific market
//             const receivingStores = new Set(
//                 receivingData
//                     .filter(row => getValue(row, ['Market']) === currentMarket)
//                     .map(row => getValue(row, ['Store Name']))
//                     .filter(s => s)
//             );

//             const poListingStores = new Set(
//                 poListingData
//                     .filter(row => getValue(row, ['marketid', 'Market']) === currentMarket)
//                     .map(row => getValue(row, ['storename', 'Store Name']))
//                     .filter(s => s)
//             );

//             // Combine stores from both sources for this market
//             const allStores = new Set([...receivingStores, ...poListingStores]);
//             const stores = Array.from(allStores).filter(s => s && s !== "Unknown");

//             console.log(`🏪 STORES FOR MARKET ${currentMarket}:`, {
//                 receivingStores: Array.from(receivingStores),
//                 poListingStores: Array.from(poListingStores),
//                 combinedStores: Array.from(allStores)
//             });

//             stores.forEach(storeName => {
//                 // Get ALL receiving rows for this store in this market
//                 const storeReceivingRows = receivingData.filter(row =>
//                     getValue(row, ['Store Name']) === storeName &&
//                     getValue(row, ['Market']) === currentMarket
//                 );

//                 // Get ALL PO listing rows for this store in this market
//                 const storePOListingRows = poListingData.filter(row =>
//                     getValue(row, ['storename', 'Store Name']) === storeName &&
//                     getValue(row, ['marketid', 'Market']) === currentMarket
//                 );

//                 // Calculate store-level amounts from receiving data
//                 let storeRecAmount = 0;
//                 let storeOpenAmount = 0;
//                 const storeReceivedPOs = new Set<string>();
//                 const storePendingPOs = new Set<string>();

//                 storeReceivingRows.forEach(row => {
//                     const poNumber = getValue(row, ['PoNum']);
//                     const recAmount = parseCurrency(getValue(row, ['recamount']));
//                     const openAmount = parseCurrency(getValue(row, ['openamount']));
//                     const remarks = getValue(row, ['remarks']).toLowerCase();

//                     storeRecAmount += recAmount;
//                     storeOpenAmount += openAmount;

//                     // Use the same logic as market level
//                     if (recAmount > 0 && !remarks.includes('pending')) {
//                         storeReceivedPOs.add(poNumber);
//                     }

//                     if (remarks.includes('pending')) {
//                         storePendingPOs.add(poNumber);
//                     }
//                 });

//                 // Count POs for this store: ONLY from PO Listing
//                 const storePOs = new Set(
//                     storePOListingRows.map(row => getValue(row, ['pono', 'PoNum', 'PO Number'])).filter(po => po)
//                 );


//                 const storeData = reports.filter(report =>
//                     report['Store Name'] === storeName &&
//                     report.Market === currentMarket
//                 );

//                 groups[storeName] = {
//                     key: storeName,
//                     count: 1,
//                     poCount: storePOs.size,
//                     poReceived: storeReceivedPOs.size,
//                     poRecAmount: storeRecAmount,
//                     pendingPOs: storePendingPOs.size,
//                     poOpenAmount: storeOpenAmount,
//                     rows: storeData
//                 };
//             });
//         }

//         return Object.values(groups).sort((a, b) => b.poRecAmount - a.poRecAmount);
//     };


//     const filteredByDateData = useMemo(() => {
//         return filterByDate(currentData);
//     }, [currentData, dateFilter]);

//     const filteredReports = useMemo(() => {
//         return filteredByDateData.filter(report => {
//             const matchesSearch =
//                 report['Store Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['PO Number']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['Vendor']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['Order Number']?.toLowerCase().includes(searchTerm.toLowerCase());

//             return matchesSearch;
//         });
//     }, [filteredByDateData, searchTerm]);

//     const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
//     const paginatedReports = useMemo(() => {
//         const startIndex = (currentPage - 1) * itemsPerPage;
//         return filteredReports.slice(startIndex, startIndex + itemsPerPage);
//     }, [filteredReports, currentPage, itemsPerPage]);

//     const summaryStats = useMemo(() => {
//         const totalStores = getUniqueStoreCount(reports);
//         const { poCount: totalPOs } = getPOCounts(reports);

//         // Calculate total amounts from receiving data
//         let totalPoRecAmount = 0;
//         let totalPoOpenAmount = 0;
//         let totalPoReceived = 0;
//         let totalPendingPOs = 0;

//         const uniqueStores = new Set(reports.map(report => report['Store Name']));
//         uniqueStores.forEach(storeName => {
//             const storeData = reports.find(report => report['Store Name'] === storeName);
//             if (storeData) {
//                 const amounts = getReceivingAmounts(storeName, storeData.Market);
//                 totalPoRecAmount += amounts.poRecAmount;
//                 totalPoOpenAmount += amounts.poOpenAmount;
//                 totalPoReceived += amounts.poReceived;
//                 totalPendingPOs += amounts.pendingPOs;
//             }
//         });

//         return {
//             totalStores,
//             totalPOs,
//             totalPoRecAmount,
//             totalPoOpenAmount,
//             totalPoReceived,
//             totalPendingPOs
//         };
//     }, [reports, receivingData]);

//     const toggleRowExpansion = (id: string) => {
//         if (expandedRow === id) {
//             setExpandedRow(null);
//         } else {
//             setExpandedRow(id);
//         }
//     };

//     const showDetails = (report: OrderingReport) => {
//         setSelectedDetails(report);
//     };

//     const closeDetails = () => {
//         setSelectedDetails(null);
//     };

//     const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
//         setDateFilter(prev => ({
//             ...prev,
//             [field]: value
//         }));
//     };

//     const clearDateFilters = () => {
//         setDateFilter({
//             startDate: '',
//             endDate: ''
//         });
//     };

//     const handleRegionClick = (region: AggregatedGroup) => {
//         setCurrentData(region.rows);
//         setCurrentView('markets');
//         setSelectedRegion(region.key);
//         setExpandedRow(null);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: region.key },
//         ]);
//     };


//     const handleMarketClick = (market: AggregatedGroup) => {
//         // For market view, we need to show ALL data for stores in this market
//         const marketData = reports.filter(report => report.Market === market.key);
//         setCurrentData(marketData);
//         setCurrentView('stores');
//         setSelectedMarket(market.key);
//         setExpandedRow(null);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: selectedRegion },
//             { level: "Stores", selected: market.key },
//         ]);
//     };



//     const handleStoreClick = (store: AggregatedGroup) => {
//         // For store view, we need to show ALL data for that specific store
//         const storeData = reports.filter(report => report['Store Name'] === store.key);
//         setCurrentData(storeData);
//         setCurrentView('detailed');
//         setSelectedStore(store.key);
//         setExpandedRow(null);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: selectedRegion },
//             { level: "Stores", selected: selectedMarket },
//             { level: "Detailed", selected: store.key },
//         ]);
//     };

//     // Also fix the back navigation to properly restore data
//     const handleBackClick = () => {
//         if (historyStack.length <= 1) {
//             // Go back to regions view with all data
//             setCurrentData(reports);
//             setCurrentView('regions');
//             setHistoryStack([{ level: "Regions" }]);
//             setSelectedRegion('');
//             setSelectedMarket('');
//             setSelectedStore('');
//             setExpandedRow(null);
//         } else {
//             const newStack = historyStack.slice(0, -1);
//             setHistoryStack(newStack);

//             const previousLevel = newStack[newStack.length - 1];

//             if (previousLevel.level === "Regions") {
//                 setCurrentData(reports);
//                 setCurrentView('regions');
//                 setSelectedRegion('');
//                 setSelectedMarket('');
//             } else if (previousLevel.level === "Markets") {
//                 // Go back to markets view for the selected region
//                 const regionData = reports.filter(report => report.Region === previousLevel.selected);
//                 setCurrentData(regionData);
//                 setCurrentView('markets');
//                 setSelectedMarket('');
//                 setSelectedStore('');
//             } else if (previousLevel.level === "Stores") {
//                 // Go back to stores view for the selected market
//                 const marketData = reports.filter(report => report.Market === previousLevel.selected);
//                 setCurrentData(marketData);
//                 setCurrentView('stores');
//                 setSelectedStore('');
//             }
//             setExpandedRow(null);
//         }
//     };

//     const renderBreadcrumb = () => {
//         return historyStack.map((item, index) => (
//             <span key={index} className="ordering-breadcrumb">
//                 {item.selected ? `${item.level} — ${item.selected}` : item.level}
//                 {index < historyStack.length - 1 && (
//                     <span className="mx-2 text-gray-400">›</span>
//                 )}
//             </span>
//         ));
//     };

//     const getStatusColor = (status: string): string => {
//         const statusColors: { [key: string]: string } = {
//             'completed': 'green',
//             'pending': 'orange',
//             'active': 'blue',
//             'closed': 'gray',
//             'received': 'green',
//             'in transit': 'orange',
//             'partially received': 'yellow',
//             'open': 'red'
//         };

//         const normalizedStatus = status.toLowerCase().trim();
//         return statusColors[normalizedStatus] || 'gray';
//     };

//     const renderDateFilters = () => (
//         <div className="ordering-date-filters">
//             <div className="filter-group">
//                 <label>Start Date:</label>
//                 <input
//                     type="date"
//                     value={dateFilter.startDate}
//                     onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
//                     className="ordering-input"
//                 />
//             </div>
//             <div className="filter-group">
//                 <label>End Date:</label>
//                 <input
//                     type="date"
//                     value={dateFilter.endDate}
//                     onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
//                     className="ordering-input"
//                 />
//             </div>
//             {(dateFilter.startDate || dateFilter.endDate) && (
//                 <button onClick={clearDateFilters} className="btn btn-secondary">
//                     Clear Dates
//                 </button>
//             )}
//         </div>
//     );

//     const renderHierarchicalTable = (data: OrderingReport[], level: string, onRowClick: (group: AggregatedGroup) => void) => {
//         const aggregated = aggregate(data, level);
//         const maxAmount = Math.max(...aggregated.map((a) => a.poRecAmount), 1);
//         const totalAmount = aggregated.reduce((sum, group) => sum + group.poRecAmount, 0);

//         let title = "";
//         switch (level) {
//             case "regions":
//                 title = "Regions";
//                 break;
//             case "markets":
//                 title = "Markets";
//                 break;
//             case "stores":
//                 title = "Stores";
//                 break;
//         }

//         return (
//             <div className="ordering-table-block">
//                 <div className="ordering-table-header">
//                     <h2>{title}</h2>
//                     <div className="ordering-meta">
//                         {aggregated.length} groups — {getUniqueStoreCount(data)} unique stores — total received amount ${totalAmount.toLocaleString()}
//                     </div>
//                 </div>

//                 <div className="ordering-table-wrapper">
//                     <table className="ordering-table">
//                         <thead>
//                             <tr>
//                                 <th>{title}</th>
//                                 <th className="ordering-col-right">Store Count</th>
//                                 <th className="ordering-col-right">PO Count</th>
//                                 <th className="ordering-col-right">PO Received</th>
//                                 <th className="ordering-col-right">PO Rec Amount</th>
//                                 <th className="ordering-col-right">Pending POs</th>
//                                 <th className="ordering-col-right">Open Amount</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.poRecAmount / maxAmount) * 100);
//                                 const fillClass = pct >= 70 ? "ordering-fill-green" : pct >= 40 ? "ordering-fill-amber" : "ordering-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//                                         <td>{group.key}</td>
//                                         <td className="ordering-col-right">{group.count}</td>
//                                         <td className="ordering-col-right">{group.poCount}</td>
//                                         <td className="ordering-col-right">{group.poReceived}</td>
//                                         <td className="ordering-col-right">${group.poRecAmount.toLocaleString()}</td>
//                                         <td className="ordering-col-right">{group.pendingPOs}</td>
//                                         <td className="ordering-col-right">${group.poOpenAmount.toLocaleString()}</td>
//                                         <td>
//                                             <div className="ordering-bar-cell">
//                                                 <div className="ordering-bar-track">
//                                                     <div
//                                                         className={`ordering-bar-fill ${fillClass}`}
//                                                         style={{ width: `${pct}%` }}
//                                                     ></div>
//                                                 </div>
//                                                 <div style={{ minWidth: "52px", textAlign: "right" }}>
//                                                     {pct}%
//                                                 </div>
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
//         // Enhance reports with receiving data for detailed view using remarks-based status
//         const enhancedReports = filteredReports.map(report => {
//             const poStatus = getPOStatusFromReceiving(report['PO Number'], report['Store Name'], report.Market);
//             return {
//                 ...report,
//                 'Received Amount': poStatus.receivedAmount.toString(),
//                 'Open Amount': poStatus.openAmount.toString(),
//                 'Status': poStatus.status,
//                 'Remarks': poStatus.remarks
//             };
//         });

//         const paginatedEnhancedReports = enhancedReports.slice(
//             (currentPage - 1) * itemsPerPage,
//             currentPage * itemsPerPage
//         );

//         return (
//             <div className="ordering-table-block">
//                 <div className="ordering-table-header">
//                     <h2>Detailed Report - {selectedStore}</h2>
//                     <div className="ordering-meta">
//                         {enhancedReports.length} purchase orders
//                         {searchTerm && ` for "${searchTerm}"`}
//                         {(dateFilter.startDate || dateFilter.endDate) && ' (date filtered)'}
//                     </div>
//                 </div>

//                 <div className="ordering-controls-section">
//                     <div className="ordering-controls-grid">
//                         <div className="search-box">
//                             <input
//                                 type="text"
//                                 placeholder="Search stores, PO numbers, vendors..."
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="search-input"
//                             />
//                             <span className="search-icon">🔍</span>
//                         </div>
//                     </div>
//                     {renderDateFilters()}
//                 </div>

//                 <div className="ordering-table-wrapper">
//                     <table className="ordering-table">
//                         <thead>
//                             <tr>
//                                 <th>Store</th>
//                                 <th>Market</th>
//                                 <th>PO Number</th>
//                                 <th>PO Date</th>
//                                 <th className="ordering-col-right">Received Amount</th>
//                                 <th className="ordering-col-right">Open Amount</th>
//                                 <th>Status</th>
//                                 <th>Vendor</th>
//                                 <th>Remarks</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {paginatedEnhancedReports.map((report, index) => {
//                                 const uniqueId = `${report['PO Number']}-${index}`;
//                                 const receivedAmount = parseCurrency(report['Received Amount']);
//                                 const openAmount = parseCurrency(report['Open Amount']);

//                                 return (
//                                     <React.Fragment key={uniqueId}>
//                                         <tr className="main-row">
//                                             <td>
//                                                 <div className="store-info">
//                                                     <div className="store-name">{report['Store Name']}</div>
//                                                     <div className="store-dm">DM: {report.DM}</div>
//                                                 </div>
//                                             </td>
//                                             <td>{report.Market}</td>
//                                             <td>
//                                                 <div className="po-info">
//                                                     <div className="po-number">{report['PO Number']}</div>
//                                                     <div className="order-number">Order: {report['Order Number']}</div>
//                                                 </div>
//                                             </td>
//                                             <td>{report['PO Date']}</td>
//                                             <td className={`ordering-col-right ${receivedAmount > 0 ? 'received' : 'not-received'}`}>
//                                                 ${receivedAmount.toLocaleString()}
//                                             </td>
//                                             <td className={`ordering-col-right ${openAmount > 0 ? 'open' : 'closed'}`}>
//                                                 ${openAmount.toLocaleString()}
//                                             </td>
//                                             <td>
//                                                 <span className={`status-indicator status-${getStatusColor(report.Status)}`}>
//                                                     {report.Status}
//                                                 </span>
//                                             </td>
//                                             <td>{report.Vendor}</td>
//                                             <td className="remarks-cell">
//                                                 {report.Remarks || 'No remarks'}
//                                             </td>
//                                             <td>
//                                                 <button
//                                                     onClick={() => showDetails(report)}
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
//                                                 <td colSpan={10}>
//                                                     <div className="detail-panel">
//                                                         <div className="detail-section">
//                                                             <h4>PO Details</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>Add Date:</strong> {report['Add Date']}</div>
//                                                                 <div><strong>Region:</strong> {report.Region}</div>
//                                                                 <div><strong>DM:</strong> {report.DM}</div>
//                                                                 <div><strong>Order Number:</strong> {report['Order Number']}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Amount Breakdown</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>Received Amount:</strong> ${receivedAmount.toLocaleString()}</div>
//                                                                 <div><strong>Open Amount:</strong> ${openAmount.toLocaleString()}</div>
//                                                                 <div><strong>Completion:</strong> {receivedAmount > 0 ? (openAmount > 0 ? 'Partially Received' : 'Fully Received') : 'Not Received'}</div>
//                                                                 <div><strong>Status:</strong> {report.Status}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Vendor Information</h4>
//                                                             <div className="vendor-info">{report.Vendor}</div>
//                                                         </div>

//                                                         {report.Remarks && (
//                                                             <div className="detail-section">
//                                                                 <h4>Remarks</h4>
//                                                                 <div className="remarks-info">{report.Remarks}</div>
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

//                     {paginatedEnhancedReports.length === 0 && (
//                         <div className="no-data">
//                             No purchase orders found matching your criteria.
//                         </div>
//                     )}
//                 </div>

//                 {totalPages > 1 && (
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

//     const renderSummaryCards = () => (
//         <section className="dashboard-grid">
//             <div className="dashboard-card card-blue">
//                 <div className="card-icon">🏪</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Total Stores</h3>
//                     <p className="card-description">{summaryStats.totalStores}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-blue">
//                 <div className="card-icon">📄</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Total POs</h3>
//                     <p className="card-description">{summaryStats.totalPOs}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-blue">
//                 <div className="card-icon">📦</div>
//                 <div className="card-content">
//                     <h3 className="card-title">PO Received</h3>
//                     <p className="card-description">{summaryStats.totalPoReceived}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-blue">
//                 <div className="card-icon">💰</div>
//                 <div className="card-content">
//                     <h3 className="card-title">PO Rec Amount</h3>
//                     <p className="card-description">${summaryStats.totalPoRecAmount.toLocaleString()}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-orange">
//                 <div className="card-icon">⏳</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Pending POs</h3>
//                     <p className="card-description">{summaryStats.totalPendingPOs}</p>
//                 </div>
//             </div>
//             <div className="dashboard-card card-orange">
//                 <div className="card-icon">💳</div>
//                 <div className="card-content">
//                     <h3 className="card-title">Open Amount</h3>
//                     <p className="card-description">${summaryStats.totalPoOpenAmount.toLocaleString()}</p>
//                 </div>
//             </div>
//         </section>
//     );

//     if (isLoading || loading) {
//         return (
//             <div className="app-loading">
//                 <div className="loading-spinner"></div>
//                 <p>Loading Ordering Reports...</p>
//             </div>
//         );
//     }

//     if (!isAuthenticated) return null;

//     if (error) {
//         return (
//             <div className="ordering-page">
//                 <div className="error-container">
//                     <h2>Error Loading Data</h2>
//                     <p>{error}</p>
//                     <button onClick={fetchOrderingData} className="retry-btn">
//                         Retry
//                     </button>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="main-content">
//             <div className="content-wrapper">
//                 <header className="topbar">
//                     <div className="brand">
//                         <div className="logo">📦</div>
//                         <div className="title">
//                             <div className="main">Ordering Reports</div>
//                             <div className="sub">
//                                 Purchase Order Tracking System
//                             </div>
//                         </div>
//                     </div>
//                 </header>

//                 <main className="main-area">
//                     <div className="ordering-controls-section">
//                         <div className="ordering-controls-grid">
//                             <div className="ordering-action-buttons">
//                                 <button
//                                     className="btn btn-success"
//                                     onClick={() => {
//                                         const csvData = currentView === 'detailed' ? filteredReports : currentData;
//                                         if (csvData.length) {
//                                             const keys = Object.keys(csvData[0]);
//                                             const csv = [keys.join(",")]
//                                                 .concat(
//                                                     csvData.map((r) =>
//                                                         keys
//                                                             .map((k) => `"${String(r[k as keyof OrderingReport] || "").replace(/"/g, '""')}"`)
//                                                             .join(",")
//                                                     )
//                                                 )
//                                                 .join("\n");

//                                             const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//                                             const url = URL.createObjectURL(blob);
//                                             const a = document.createElement("a");
//                                             a.href = url;
//                                             a.download = "ordering_export.csv";
//                                             document.body.appendChild(a);
//                                             a.click();
//                                             document.body.removeChild(a);
//                                             URL.revokeObjectURL(url);
//                                         }
//                                     }}
//                                 >
//                                     Export CSV
//                                 </button>
//                                 <button
//                                     className="btn btn-primary"
//                                     onClick={fetchOrderingData}
//                                 >
//                                     Refresh Data
//                                 </button>
//                             </div>
//                             <div className="ordering-date-filters">
//                                 <div className="filter-group">
//                                     <input
//                                         type="date"
//                                         value={dateFilter.startDate}
//                                         onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
//                                         className="ordering-input"
//                                         placeholder="Start Date"
//                                     />
//                                 </div>
//                                 <div className="filter-group">
//                                     <input
//                                         type="date"
//                                         value={dateFilter.endDate}
//                                         onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
//                                         className="ordering-input"
//                                         placeholder="End Date"
//                                     />
//                                 </div>
//                                 {(dateFilter.startDate || dateFilter.endDate) && (
//                                     <button onClick={clearDateFilters} className="btn btn-secondary">
//                                         Clear Dates
//                                     </button>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {renderSummaryCards()}

//                     <div className="ordering-nav-row">
//                         <button
//                             className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
//                             onClick={handleBackClick}
//                         >
//                             ← Back
//                         </button>
//                         <div className="ordering-breadcrumb">
//                             {renderBreadcrumb()}
//                         </div>
//                     </div>

//                     <section className="ordering-stacked">
//                         {currentView === "regions" &&
//                             renderHierarchicalTable(currentData, "regions", handleRegionClick)}
//                         {currentView === "markets" &&
//                             renderHierarchicalTable(currentData, "markets", handleMarketClick)}
//                         {currentView === "stores" &&
//                             renderHierarchicalTable(currentData, "stores", handleStoreClick)}
//                         {currentView === "detailed" && renderDetailedTable()}
//                     </section>

//                     {loading && (
//                         <div className="ordering-loading">
//                             <div className="loading-spinner"></div>
//                             <p>Loading ordering data...</p>
//                         </div>
//                     )}

//                     {selectedDetails && (
//                         <div className="modal-overlay" onClick={closeDetails}>
//                             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                                 <div className="modal-header">
//                                     <h3>PO Details - {selectedDetails['PO Number']}</h3>
//                                     <button className="close-btn" onClick={closeDetails}>×</button>
//                                 </div>
//                                 <div className="modal-body">
//                                     <div className="detail-grid">
//                                         <div><strong>Store:</strong> {selectedDetails['Store Name']}</div>
//                                         <div><strong>Market:</strong> {selectedDetails.Market}</div>
//                                         <div><strong>Region:</strong> {selectedDetails.Region}</div>
//                                         <div><strong>DM:</strong> {selectedDetails.DM}</div>
//                                         <div><strong>PO Date:</strong> {selectedDetails['PO Date']}</div>
//                                         <div><strong>Add Date:</strong> {selectedDetails['Add Date']}</div>
//                                         <div><strong>Order Number:</strong> {selectedDetails['Order Number']}</div>
//                                         <div><strong>Vendor:</strong> {selectedDetails.Vendor}</div>
//                                         <div><strong>Status:</strong>
//                                             <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
//                                                 {selectedDetails.Status || 'Active'}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </main>
//             </div>
//         </div>
//     );
// }









'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import './ordering-styles.css';

type Row = { [k: string]: string | undefined };

interface OrderingReport {
    Region: string;
    Market: string;
    'Store Name': string;
    'PO Number': string;
    'PO Date': string;
    'PO Amount': string;
    'Received Amount': string;
    'Open Amount': string;
    Status: string;
    Vendor: string;
    'Order Number': string;
    'Add Date': string;
    DM: string;
}

interface AggregatedGroup {
    key: string;
    count: number; // Store count
    poCount: number; // From PO Listing
    poReceived: number; // From Receiving based on remarks
    poRecAmount: number; // From Receiving - SUM of recamount
    pendingPOs: number; // Only POs with "pending" in remarks
    poOpenAmount: number; // From Receiving - SUM of openamount
    rows: OrderingReport[];
}

interface RegionTotals {
    totalStores: number;
    totalPOs: number;
    poReceived: number;
    poRecAmount: number;
    pendingPOs: number;
    poOpenAmount: number;
}

export default function OrderingReportsPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<OrderingReport[]>([]);
    const [poListingData, setPoListingData] = useState<Row[]>([]);
    const [receivingData, setReceivingData] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedDetails, setSelectedDetails] = useState<OrderingReport | null>(null);

    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });

    const [currentView, setCurrentView] = useState<'regions' | 'markets' | 'stores' | 'detailed'>('regions');
    const [currentData, setCurrentData] = useState<OrderingReport[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedMarket, setSelectedMarket] = useState<string>('');
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([{ level: "Regions" }]);

    // Data sources configuration
    const dataSources = [
        {
            id: 'PO LISTING',
            name: 'PO LISTING',
            gid: '1310303348',
            description: 'Purchase order listings',
            type: 'po-listing'
        },
        {
            id: 'RECEIVING',
            name: 'RECEIVING',
            gid: '1717319803',
            description: 'PO receiving data',
            type: 'receiving'
        }
    ];

    const BASE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR3jaC4nOWrLwS6YzNxoDDRR3gDqj77jjEnPpeQvV1VCAl5pE5qaDs59yz5HVYtxA/pub?output=csv';

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrderingData();
        }
    }, [isAuthenticated]);

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

    const getSheetUrl = (gid: string): string => {
        return `${BASE_SHEET_URL}&gid=${gid}`;
    };

    const fetchDataSource = async (source: any): Promise<Row[]> => {
        try {
            const url = getSheetUrl(source.gid);
            const response = await fetch(url);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const csvText = await response.text();
            if (!csvText || csvText.trim().length === 0) throw new Error('Empty response');

            const parsedData = parseCSV(csvText);
            if (parsedData.length === 0) throw new Error('No data parsed');

            return parsedData;

        } catch (err) {
            console.error(`Error fetching ${source.name}:`, err);
            return [];
        }
    };

    // Debug function to check data matching
    const debugDataMatching = () => {
        console.log('=== DATA MATCHING DEBUG ===');

        if (receivingData.length > 0) {
            console.log('Receiving Data Columns:', Object.keys(receivingData[0]));
            console.log('Sample Receiving Stores:', Array.from(new Set(receivingData.slice(0, 10).map(row => getValue(row, ['Store Name'])))));
        }

        if (reports.length > 0) {
            console.log('PO Listing Stores:', Array.from(new Set(reports.slice(0, 10).map(report => report['Store Name']))));
        }

        console.log('=== END DEBUG ===');
    };

    const fetchOrderingData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch both data sources
            const [poData, receivingData] = await Promise.all([
                fetchDataSource(dataSources[0]),
                fetchDataSource(dataSources[1])
            ]);

            setPoListingData(poData);
            setReceivingData(receivingData);

            // Debug column names and data
            console.log('PO Listing Sample:', poData.slice(0, 3));
            console.log('Receiving Sample:', receivingData.slice(0, 3));

            // Transform PO Listing data for basic structure
            const transformedData: OrderingReport[] = poData.map(row => ({
                Region: getValue(row, ['Regions', 'Region']),
                Market: getValue(row, ['marketid', 'Market']),
                'Store Name': getValue(row, ['storename', 'Store Name']),
                'PO Number': getValue(row, ['pono', 'PoNum', 'PO Number']),
                'PO Date': getValue(row, ['podate', 'PoDate']),
                'PO Amount': '', // Will be populated from receiving data
                'Received Amount': '', // Will be populated from receiving data
                'Open Amount': '', // Will be populated from receiving data
                Status: getValue(row, ['postat', 'Status']),
                Vendor: getValue(row, ['vendor', 'Vendor', 'company']),
                'Order Number': getValue(row, ['Order No', 'OrderNo', 'vendorpo']),
                'Add Date': getValue(row, ['adddate', 'AddDate']),
                DM: getValue(row, ['DM', 'Dm', 'dm'])
            }));

            setReports(transformedData);
            setCurrentData(transformedData);

            // Debug data matching after state update
            setTimeout(() => {
                debugDataMatching();

                // Test with Colorado data
                if (transformedData.length > 0) {
                    const coloradoStores = transformedData.filter(report => report.Market === 'COLORADO');
                    if (coloradoStores.length > 0) {
                        const testStore = coloradoStores[0]['Store Name'];
                        const testMarket = coloradoStores[0].Market;
                        const testAmounts = getReceivingAmounts(testStore, testMarket);
                        console.log('=== COLORADO TEST ===');
                        console.log('Test Store:', testStore);
                        console.log('Test Market:', testMarket);
                        console.log('Test Amounts:', testAmounts);
                        console.log('=== END TEST ===');
                    }
                }
            }, 1000);

        } catch (err) {
            setError('Failed to load ordering data');
            console.error('Error fetching ordering data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getValue = (row: Row, possibleKeys: string[]): string => {
        for (const k of possibleKeys) {
            // Try exact match first
            if (row[k] !== undefined && String(row[k]).trim() !== '') {
                return String(row[k]).trim();
            }
        }

        // If no exact match, try case-insensitive
        for (const k of possibleKeys) {
            const cleanK = k.toLowerCase().replace(/\s+/g, '');
            for (const actualKey of Object.keys(row)) {
                const cleanActualKey = actualKey.toLowerCase().replace(/\s+/g, '');
                if (cleanActualKey === cleanK && String(row[actualKey]).trim() !== '') {
                    return String(row[actualKey]).trim();
                }
            }
        }
        return '';
    };

    const parseCurrency = (s?: string | number | undefined): number => {
        if (s === 0) return 0;
        if (!s && s !== 0) return 0;
        const str = String(s).trim();
        if (str === '' || str === '-' || str === '$-' || str === '$ -') return 0;
        const cleaned = str.replace(/[$,]/g, '').replace(/\s+/g, '');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
    };

    // Get PO counts from PO Listing data
    const getPOCounts = (data: OrderingReport[]): { poCount: number; uniquePOs: Set<string> } => {
        const uniquePOs = new Set(data.map(report => report['PO Number']).filter(po => po));
        return {
            poCount: uniquePOs.size,
            uniquePOs
        };
    };

    // const getReceivingAmounts = (storeName: string, market: string): {
    //     poRecAmount: number;
    //     poOpenAmount: number;
    //     poReceived: number;
    //     pendingPOs: number;
    // } => {
    //     let poRecAmount = 0;
    //     let poOpenAmount = 0;

    //     // Track unique POs for counting
    //     const receivedPOs = new Set<string>();
    //     const pendingPOsSet = new Set<string>();
    //     const allPOs = new Set<string>();

    //     console.log(`🔍 Looking for store: "${storeName}" in market: "${market}"`);

    //     // Find ALL matching rows in receiving data for this store/market
    //     const receivingRows = receivingData.filter(row => {
    //         const rowStore = getValue(row, ['Store Name']);
    //         const rowMarket = getValue(row, ['Market']);

    //         return rowStore === storeName && rowMarket === market;
    //     });

    //     console.log(`📊 Found ${receivingRows.length} receiving rows for "${storeName}" in "${market}"`);

    //     // Process each row individually
    //     receivingRows.forEach(row => {
    //         const poNumber = getValue(row, ['PoNum']);
    //         if (!poNumber) return;

    //         // Use the exact column names from your sheet
    //         const recAmount = parseCurrency(getValue(row, ['recamount']));
    //         const openAmount = parseCurrency(getValue(row, ['openamount']));
    //         const remarks = getValue(row, ['remarks']).toLowerCase();

    //         console.log(`📝 Processing - PO: ${poNumber}, Rec: ${recAmount}, Open: ${openAmount}, Remarks: "${remarks}"`);

    //         // Add to total amounts (SUM of all recamount and openamount values)
    //         poRecAmount += recAmount;
    //         poOpenAmount += openAmount;

    //         // Track all POs
    //         allPOs.add(poNumber);

    //         // COUNT AS RECEIVED: Only if recamount > 0
    //         if (recAmount > 0) {
    //             receivedPOs.add(poNumber);
    //             console.log(`📦 Added to received: ${poNumber} - Rec Amount: ${recAmount}`);
    //         }

    //         // COUNT AS PENDING: Only if remarks include "pending" (NOT "in transit") AND recamount = 0
    //         if (remarks.includes('pending') && recAmount === 0) {
    //             pendingPOsSet.add(poNumber);
    //             console.log(`⏳ Added to pending: ${poNumber} - Remarks: "${remarks}"`);
    //         }
    //     });

    //     console.log(`🎯 Final totals for "${storeName}" in "${market}":`, {
    //         totalPOs: allPOs.size,
    //         poRecAmount,
    //         poOpenAmount,
    //         poReceived: receivedPOs.size,
    //         pendingPOs: pendingPOsSet.size,
    //         receivedPOs: Array.from(receivedPOs),
    //         pendingPOsList: Array.from(pendingPOsSet),
    //         allPOsList: Array.from(allPOs)
    //     });

    //     return {
    //         poRecAmount,
    //         poOpenAmount,
    //         poReceived: receivedPOs.size,
    //         pendingPOs: pendingPOsSet.size
    //     };
    // };


    const getReceivingAmounts = (storeName: string, market: string): {
        poRecAmount: number;
        poOpenAmount: number;
        poReceived: number;
        pendingPOs: number;
    } => {
        let poRecAmount = 0;
        let poOpenAmount = 0;

        // Track unique POs for counting
        const receivedPOs = new Set<string>();
        const pendingPOsSet = new Set<string>();
        const allPOs = new Set<string>();

        // Find ALL matching rows in receiving data for this store/market
        const receivingRows = receivingData.filter(row => {
            const rowStore = getValue(row, ['Store Name']);
            const rowMarket = getValue(row, ['Market']);
            return rowStore === storeName && rowMarket === market;
        });

        // Process each row individually
        receivingRows.forEach(row => {
            const poNumber = getValue(row, ['PoNum']);
            if (!poNumber) return;

            // Use the exact column names from your sheet
            const recAmount = parseCurrency(getValue(row, ['recamount']));
            const openAmount = parseCurrency(getValue(row, ['openamount']));
            const remarks = getValue(row, ['remarks']).toLowerCase();

            poRecAmount += recAmount;
            poOpenAmount += openAmount;

            // Track all POs
            allPOs.add(poNumber);

            // FIXED: COUNT AS RECEIVED - If ANY amount is received (recAmount > 0)
            if (recAmount > 0) {
                receivedPOs.add(poNumber);
            }

            // FIXED: COUNT AS PENDING - Only if remarks include "pending" (regardless of amount)
            if (remarks.includes('pending')) {
                pendingPOsSet.add(poNumber);
            }
        });

        return {
            poRecAmount,
            poOpenAmount,
            poReceived: receivedPOs.size,
            pendingPOs: pendingPOsSet.size
        };
    };
    // const getCombinedMarketTotals = (market: string) => {
    //     console.log(`=== COMBINED MARKET TOTALS FOR: ${market} ===`);

    //     // COUNT STORES: From BOTH sheets combined
    //     const receivingStores = new Set(
    //         receivingData
    //             .filter(row => getValue(row, ['Market']) === market)
    //             .map(row => getValue(row, ['Store Name']))
    //             .filter(s => s)
    //     );

    //     const poListingStores = new Set(
    //         poListingData
    //             .filter(row => getValue(row, ['marketid', 'Market']) === market)
    //             .map(row => getValue(row, ['storename', 'Store Name']))
    //             .filter(s => s)
    //     );

    //     const allStores = new Set([...receivingStores, ...poListingStores]);

    //     // COUNT POS: ONLY from PO LISTING sheet (as per your summary)
    //     const poListingPOs = new Set(
    //         poListingData
    //             .filter(row => getValue(row, ['marketid', 'Market']) === market)
    //             .map(row => getValue(row, ['pono', 'PoNum', 'PO Number']))
    //             .filter(po => po)
    //     );

    //     // RECEIVED POs & AMOUNTS: ONLY from RECEIVING sheet
    //     let marketRecAmount = 0;
    //     let marketOpenAmount = 0;
    //     const marketReceivedPOs = new Set<string>();
    //     const marketPendingPOs = new Set<string>();

    //     const receivingRows = receivingData.filter(row => getValue(row, ['Market']) === market);

    //     receivingRows.forEach(row => {
    //         const poNumber = getValue(row, ['PoNum']);
    //         const recAmount = parseCurrency(getValue(row, ['recamount']));
    //         const openAmount = parseCurrency(getValue(row, ['openamount']));
    //         const remarks = getValue(row, ['remarks']).toLowerCase();

    //         marketRecAmount += recAmount;
    //         marketOpenAmount += openAmount;

    //         if (recAmount > 0 && !remarks.includes('pending') && !remarks.includes('In Transit') && remarks.includes('received')) {
    //             marketReceivedPOs.add(poNumber);
    //         }

    //         if (remarks.includes('pending')) {
    //             marketPendingPOs.add(poNumber);
    //         }
    //     });

    //     console.log(`📊 ${market} COUNTS (MATCHING SUMMARY):`, {
    //         // Store Count: Combined from both sheets
    //         totalStores: allStores.size,
    //         receivingStores: receivingStores.size,
    //         poListingStores: poListingStores.size,

    //         // PO Count: ONLY from PO Listing
    //         totalPOs: poListingPOs.size,

    //         // Received & Pending: ONLY from Receiving
    //         poReceived: marketReceivedPOs.size,
    //         pendingPOs: marketPendingPOs.size,
    //         poRecAmount: marketRecAmount,
    //         poOpenAmount: marketOpenAmount
    //     });

    //     console.log(`🏪 ${market} STORE BREAKDOWN:`, {
    //         storesOnlyInReceiving: Array.from(receivingStores).filter(store => !poListingStores.has(store)),
    //         storesOnlyInPOListing: Array.from(poListingStores).filter(store => !receivingStores.has(store)),
    //         commonStores: Array.from(receivingStores).filter(store => poListingStores.has(store))
    //     });

    //     console.log(`📄 ${market} PO BREAKDOWN:`, {
    //         poListingPOs: Array.from(poListingPOs),
    //         receivedPOs: Array.from(marketReceivedPOs),
    //         pendingPOs: Array.from(marketPendingPOs)
    //     });

    //     return {
    //         // Store Count: Combined from both sheets
    //         totalStores: allStores.size,

    //         // PO Count: ONLY from PO Listing
    //         totalPOs: poListingPOs.size,

    //         // Received & Pending: ONLY from Receiving
    //         poReceived: marketReceivedPOs.size,
    //         poRecAmount: marketRecAmount,
    //         pendingPOs: marketPendingPOs.size,
    //         poOpenAmount: marketOpenAmount
    //     };
    // };

    // const getCombinedMarketTotals = (market: string) => {
    //     console.log(`=== COMBINED MARKET TOTALS FOR: ${market} ===`);

    //     // COUNT STORES: From BOTH sheets combined
    //     const receivingStores = new Set(
    //         receivingData
    //             .filter(row => getValue(row, ['Market']) === market)
    //             .map(row => getValue(row, ['Store Name']))
    //             .filter(s => s)
    //     );

    //     const poListingStores = new Set(
    //         poListingData
    //             .filter(row => getValue(row, ['marketid', 'Market']) === market)
    //             .map(row => getValue(row, ['storename', 'Store Name']))
    //             .filter(s => s)
    //     );

    //     const allStores = new Set([...receivingStores, ...poListingStores]);

    //     // COUNT POS: ONLY from PO LISTING sheet
    //     const poListingPOs = new Set(
    //         poListingData
    //             .filter(row => getValue(row, ['marketid', 'Market']) === market)
    //             .map(row => getValue(row, ['pono', 'PoNum', 'PO Number']))
    //             .filter(po => po)
    //     );

    //     // RECEIVED POs & AMOUNTS: ONLY from RECEIVING sheet
    //     let marketRecAmount = 0;
    //     let marketOpenAmount = 0;
    //     const marketReceivedPOs = new Set<string>();
    //     const marketPendingPOs = new Set<string>();

    //     // Group receiving rows by PO Number
    //     const receivingRows = receivingData.filter(row => getValue(row, ['Market']) === market);
    //     const poGroups: { [poNumber: string]: { recAmount: number; openAmount: number; remarks: string } } = {};

    //     receivingRows.forEach(row => {
    //         const poNumber = getValue(row, ['PoNum']);
    //         if (!poNumber) return;

    //         if (!poGroups[poNumber]) {
    //             poGroups[poNumber] = {
    //                 recAmount: 0,
    //                 openAmount: 0,
    //                 remarks: getValue(row, ['remarks']).toLowerCase()
    //             };
    //         }

    //         poGroups[poNumber].recAmount += parseCurrency(getValue(row, ['recamount']));
    //         poGroups[poNumber].openAmount += parseCurrency(getValue(row, ['openamount']));
    //     });

    //     // Analyze each PO
    //     Object.entries(poGroups).forEach(([poNumber, poData]) => {
    //         marketRecAmount += poData.recAmount;
    //         marketOpenAmount += poData.openAmount;

    //         // FIXED: Count as RECEIVED only if FULLY received
    //         if (poData.recAmount > 0 && poData.openAmount === 0) {
    //             marketReceivedPOs.add(poNumber);
    //         }

    //         // Count as PENDING based on remarks
    //         if (poData.remarks.includes('pending')) {
    //             marketPendingPOs.add(poNumber);
    //         }
    //     });

    //     console.log(`📊 ${market} COUNTS (MATCHING SUMMARY):`, {
    //         totalStores: allStores.size,
    //         totalPOs: poListingPOs.size,
    //         poReceived: marketReceivedPOs.size,
    //         pendingPOs: marketPendingPOs.size,
    //         poRecAmount: marketRecAmount,
    //         poOpenAmount: marketOpenAmount,
    //         samplePOs: Array.from(marketReceivedPOs).slice(0, 5) // Debug first 5 received POs
    //     });

    //     return {
    //         totalStores: allStores.size,
    //         totalPOs: poListingPOs.size,
    //         poReceived: marketReceivedPOs.size,
    //         poRecAmount: marketRecAmount,
    //         pendingPOs: marketPendingPOs.size,
    //         poOpenAmount: marketOpenAmount
    //     };
    // };

    const getCombinedMarketTotals = (market: string) => {
        console.log(`=== COMBINED MARKET TOTALS FOR: ${market} ===`);

        // COUNT STORES: From BOTH sheets combined
        const receivingStores = new Set(
            receivingData
                .filter(row => getValue(row, ['Market']) === market)
                .map(row => getValue(row, ['Store Name']))
                .filter(s => s)
        );

        const poListingStores = new Set(
            poListingData
                .filter(row => getValue(row, ['marketid', 'Market']) === market)
                .map(row => getValue(row, ['storename', 'Store Name']))
                .filter(s => s)
        );

        const allStores = new Set([...receivingStores, ...poListingStores]);

        // COUNT POS: ONLY from PO LISTING sheet
        const poListingPOs = new Set(
            poListingData
                .filter(row => getValue(row, ['marketid', 'Market']) === market)
                .map(row => getValue(row, ['pono', 'PoNum', 'PO Number']))
                .filter(po => po)
        );

        // RECEIVED POs & AMOUNTS: ONLY from RECEIVING sheet
        let marketRecAmount = 0;
        let marketOpenAmount = 0;
        const marketReceivedPOs = new Set<string>();
        const marketPendingPOs = new Set<string>();

        // Group receiving rows by PO Number for this market
        const receivingRows = receivingData.filter(row => getValue(row, ['Market']) === market);
        const poGroups: { [poNumber: string]: { recAmount: number; openAmount: number; remarks: string } } = {};

        receivingRows.forEach(row => {
            const poNumber = getValue(row, ['PoNum']);
            if (!poNumber) return;

            if (!poGroups[poNumber]) {
                poGroups[poNumber] = {
                    recAmount: 0,
                    openAmount: 0,
                    remarks: getValue(row, ['remarks']).toLowerCase()
                };
            }

            poGroups[poNumber].recAmount += parseCurrency(getValue(row, ['recamount']));
            poGroups[poNumber].openAmount += parseCurrency(getValue(row, ['openamount']));
        });

        // Analyze each PO
        Object.entries(poGroups).forEach(([poNumber, poData]) => {
            marketRecAmount += poData.recAmount;
            marketOpenAmount += poData.openAmount;

            // FIXED: Count as RECEIVED based on your summary logic
            // Your summary shows different counting - let's debug this
            if (poData.recAmount > 0) {
                marketReceivedPOs.add(poNumber);
            }

            // FIXED: Count as PENDING based on your summary counts
            if (poData.remarks.includes('pending')) {
                marketPendingPOs.add(poNumber);
            }
        });

        console.log(`📊 ${market} COUNTS:`, {
            totalStores: allStores.size,
            totalPOs: poListingPOs.size,
            poReceived: marketReceivedPOs.size,
            pendingPOs: marketPendingPOs.size,
            poRecAmount: marketRecAmount,
            poOpenAmount: marketOpenAmount,
            receivedPOs: Array.from(marketReceivedPOs),
            pendingPOsList: Array.from(marketPendingPOs)
        });

        return {
            totalStores: allStores.size,
            totalPOs: poListingPOs.size,
            poReceived: marketReceivedPOs.size,
            poRecAmount: marketRecAmount,
            pendingPOs: marketPendingPOs.size,
            poOpenAmount: marketOpenAmount
        };
    };

    const getRegionTotalsManual = () => {
        console.log('=== MANUAL REGION TOTALS CALCULATION ===');

        // Define which markets belong to which region based on your summary
        const regionMarkets: { [region: string]: string[] } = {
            'Hasnain Mustaqeem Region': [
                'ARIZONA', 'COLORADO', 'SACRAMENTO', 'SAN DIEGO', 'LOS ANGELES',
                'OXNARD', 'PALMDALE', 'SANTA BARBARA', 'PASO ROBLES', 'SAN FRANCISCO',
                'BAY AREA', 'EAST BAY AREA', 'NORTH BAY AREA', 'BOSTON'
            ],
            'Aleem Ghori Region': [
                'DALLAS', 'NORTH CAROL', 'NASHVILLE', 'KENTUCKY', 'HOUSTON',
                'EL PASO', 'FLORIDA', 'MEMPHIS', 'GEORGIA', 'OKHLAHOMA',
                'OREGON', 'ARKANSAS', 'CHARLOTTE'
            ]
        };

        const regionTotals: { [region: string]: RegionTotals } = {};

        Object.entries(regionMarkets).forEach(([region, markets]) => {
            regionTotals[region] = {
                totalStores: 0,
                totalPOs: 0,
                poReceived: 0,
                poRecAmount: 0,
                pendingPOs: 0,
                poOpenAmount: 0
            };

            markets.forEach(market => {
                const marketData = getCombinedMarketTotals(market);

                regionTotals[region].totalStores += marketData.totalStores;
                regionTotals[region].totalPOs += marketData.totalPOs;
                regionTotals[region].poReceived += marketData.poReceived;
                regionTotals[region].poRecAmount += marketData.poRecAmount;
                regionTotals[region].pendingPOs += marketData.pendingPOs;
                regionTotals[region].poOpenAmount += marketData.poOpenAmount;
            });

            console.log(`✅ ${region} MANUAL TOTALS:`, regionTotals[region]);
        });

        return regionTotals;
    };









    const getPOStatusFromReceiving = (poNumber: string, storeName: string, market: string): {
        receivedAmount: number;
        openAmount: number;
        status: string;
        remarks: string;
    } => {
        const receivingRows = receivingData.filter(row => {
            const rowPO = getValue(row, ['PoNum']);
            const rowStore = getValue(row, ['Store Name']);
            const rowMarket = getValue(row, ['Market']);

            return rowPO === poNumber && rowStore === storeName && rowMarket === market;
        });

        let totalReceived = 0;
        let totalOpen = 0;
        const remarksSet = new Set<string>();

        receivingRows.forEach(row => {
            // Use exact column names from your sheet
            totalReceived += parseCurrency(getValue(row, ['recamount']));
            totalOpen += parseCurrency(getValue(row, ['openamount']));

            const rowRemarks = getValue(row, ['remarks']);
            if (rowRemarks) {
                remarksSet.add(rowRemarks);
            }
        });

        const allRemarks = Array.from(remarksSet).join(', ');
        const remarksLower = allRemarks.toLowerCase();

        // Determine status based on your sheet data
        let status = 'Open';
        if (remarksLower.includes('pending') || remarksLower.includes('in transit')) {
            status = 'Pending';
        } else if (totalReceived > 0 && totalOpen === 0) {
            status = 'Completed';
        } else if (totalReceived > 0 && totalOpen > 0) {
            status = 'Partially Received';
        } else if (remarksLower.includes('received') || remarksLower.includes('complete') || remarksLower.includes('delivered')) {
            status = 'Received';
        }

        return {
            receivedAmount: totalReceived,
            openAmount: totalOpen,
            status,
            remarks: allRemarks
        };
    };

    const getRegions = (data: OrderingReport[]) => {
        const regions: { [key: string]: OrderingReport[] } = {
            "Aleem Ghori Region": [],
            "Hasnain Mustaqeem Region": []
        };

        data.forEach(report => {
            const region = report.Region;

            if (region === "Aleem Ghori Region") {
                regions["Aleem Ghori Region"].push(report);
            } else if (region === "Hasnain Mustaqeem Region") {
                regions["Hasnain Mustaqeem Region"].push(report);
            } else {
                console.warn('Unknown region:', region, 'for store:', report['Store Name']);
            }
        });

        return regions;
    };

    // Add this function to debug market-level calculations
    const debugMarketCalculations = (market: string) => {
        console.log(`=== DEBUG MARKET: ${market} ===`);

        const marketStores = reports.filter(report => report.Market === market);
        const uniqueStores = new Set(marketStores.map(report => report['Store Name']));

        let totalRecAmount = 0;
        let totalOpenAmount = 0;
        let totalReceivedPOs = 0;
        let totalPendingPOs = 0;
        let totalAllPOs = 0;

        console.log(`Stores in ${market}:`, Array.from(uniqueStores));

        uniqueStores.forEach(storeName => {
            const amounts = getReceivingAmounts(storeName, market);
            totalRecAmount += amounts.poRecAmount;
            totalOpenAmount += amounts.poOpenAmount;
            totalReceivedPOs += amounts.poReceived;
            totalPendingPOs += amounts.pendingPOs;

            // Count all POs for this store
            const storePOs = new Set(
                receivingData
                    .filter(row => {
                        const rowStore = getValue(row, ['Store Name']);
                        const rowMarket = getValue(row, ['Market']);
                        return rowStore === storeName && rowMarket === market;
                    })
                    .map(row => getValue(row, ['PoNum']))
                    .filter(po => po)
            );
            totalAllPOs += storePOs.size;

            console.log(`Store "${storeName}":`, {
                POs: storePOs.size,
                received: amounts.poReceived,
                pending: amounts.pendingPOs,
                recAmount: amounts.poRecAmount,
                openAmount: amounts.poOpenAmount
            });
        });

        console.log(`📈 MARKET ${market} TOTALS:`, {
            stores: uniqueStores.size,
            totalPOs: totalAllPOs,
            poReceived: totalReceivedPOs,
            poRecAmount: totalRecAmount,
            pendingPOs: totalPendingPOs,
            poOpenAmount: totalOpenAmount
        });

        console.log(`=== END DEBUG ${market} ===`);
    };

    const getUniqueStoreCount = (data: OrderingReport[]): number => {
        const uniqueStores = new Set(data.map(report => report['Store Name']));
        return uniqueStores.size;
    };

    const filterByDate = (data: OrderingReport[]): OrderingReport[] => {
        if (!dateFilter.startDate && !dateFilter.endDate) {
            return data;
        }

        return data.filter(report => {
            const reportDate = report['PO Date'] || report['Add Date'] || '';
            if (!reportDate) return true;

            const reportDateObj = new Date(reportDate);
            const startDateObj = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
            const endDateObj = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

            let include = true;
            if (startDateObj) {
                include = include && reportDateObj >= startDateObj;
            }
            if (endDateObj) {
                include = include && reportDateObj <= endDateObj;
            }

            return include;
        });
    };

    const getRegionFromMarket = (market: string): string => {
        if (!market) return 'Unknown Region';

        const foundRegions = new Set<string>();

        // Check receiving data
        const receivingRows = receivingData.filter(row => getValue(row, ['Market']) === market);
        receivingRows.forEach(row => {
            const region = getValue(row, ['Regions', 'Region']);
            if (region && region !== 'Unknown Region') {
                foundRegions.add(region);
            }
        });

        // Check PO listing data
        const poListingRows = poListingData.filter(row => getValue(row, ['marketid', 'Market']) === market);
        poListingRows.forEach(row => {
            const region = getValue(row, ['Regions', 'Region']);
            if (region && region !== 'Unknown Region') {
                foundRegions.add(region);
            }
        });

        // If we found regions from the data, return the first one
        if (foundRegions.size > 0) {
            return Array.from(foundRegions)[0];
        }

        // Fallback mapping based on your data structure
        const regionMapping: { [key: string]: string } = {
            'COLORADO': 'Hasnain Mustaqeem Region',
            'ARIZONA': 'Hasnain Mustaqeem Region',
            'GEORGIA': 'Aleem Ghori Region',
            'SACRAMENTO': 'Hasnain Mustaqeem Region',
            'OXNARD': 'Hasnain Mustaqeem Region',
            'PALMDALE': 'Hasnain Mustaqeem Region',
            'SANTA BARBARA': 'Hasnain Mustaqeem Region',
            'PASO ROBLES': 'Hasnain Mustaqeem Region',
            'BOSTON': 'Hasnain Mustaqeem Region',
            'DALLAS': 'Aleem Ghori Region',
            'HOUSTON': 'Aleem Ghori Region',
            'SAN DIEGO': 'Hasnain Mustaqeem Region',
            'LOS ANGELES': 'Hasnain Mustaqeem Region',
            'SAN FRANCISCO': 'Hasnain Mustaqeem Region',
            'BAY AREA': 'Hasnain Mustaqeem Region',
            'EAST BAY AREA': 'Hasnain Mustaqeem Region',
            'NORTH BAY AREA': 'Hasnain Mustaqeem Region',
            'MEMPHIS': 'Aleem Ghori Region',
            'KENTUCKY': 'Aleem Ghori Region',
            'FLORIDA': 'Aleem Ghori Region',
            'NASHVILLE': 'Aleem Ghori Region',
            'NORTH CAROL': 'Aleem Ghori Region',
            'EL PASO': 'Aleem Ghori Region',
            'ARKANSAS': 'Aleem Ghori Region',
            'OKHLAHOMA': 'Aleem Ghori Region',
            'OREGON': 'Aleem Ghori Region',
            'CHARLOTTE': 'Aleem Ghori Region'
        };

        return regionMapping[market] || 'Unknown Region';
    };

    // const aggregate = (data: OrderingReport[], level: string): AggregatedGroup[] => {
    //     const groups: { [key: string]: AggregatedGroup } = {};

    //     if (level === "regions") {
    //         // Get markets from BOTH data sources
    //         const receivingMarkets = new Set(
    //             receivingData.map(row => getValue(row, ['Market'])).filter(m => m)
    //         );

    //         const poListingMarkets = new Set(
    //             poListingData.map(row => getValue(row, ['marketid', 'Market'])).filter(m => m)
    //         );

    //         // Combine markets from both sources
    //         const allMarkets = new Set([...receivingMarkets, ...poListingMarkets]);

    //         const regionsData: { [key: string]: RegionTotals } = {};

    //         allMarkets.forEach(market => {
    //             const marketTotals = getCombinedMarketTotals(market);
    //             const region = getRegionFromMarket(market);

    //             // Only process markets that belong to actual regions (filter out "Unknown Region")
    //             if (region === 'Unknown Region') return;

    //             if (!regionsData[region]) {
    //                 regionsData[region] = {
    //                     totalStores: 0,
    //                     totalPOs: 0,
    //                     poReceived: 0,
    //                     poRecAmount: 0,
    //                     pendingPOs: 0,
    //                     poOpenAmount: 0
    //                 };
    //             }

    //             regionsData[region].totalStores += marketTotals.totalStores;
    //             regionsData[region].totalPOs += marketTotals.totalPOs;
    //             regionsData[region].poReceived += marketTotals.poReceived;
    //             regionsData[region].poRecAmount += marketTotals.poRecAmount;
    //             regionsData[region].pendingPOs += marketTotals.pendingPOs;
    //             regionsData[region].poOpenAmount += marketTotals.poOpenAmount;
    //         });

    //         Object.entries(regionsData).forEach(([regionName, regionTotals]) => {
    //             groups[regionName] = {
    //                 key: regionName,
    //                 count: regionTotals.totalStores,
    //                 poCount: regionTotals.totalPOs,
    //                 poReceived: regionTotals.poReceived,
    //                 poRecAmount: regionTotals.poRecAmount,
    //                 pendingPOs: regionTotals.pendingPOs,
    //                 poOpenAmount: regionTotals.poOpenAmount,
    //                 rows: []
    //             };
    //         });
    //     } else if (level === "markets") {
    //         // For market view, only show markets from the selected region
    //         const currentRegion = selectedRegion;

    //         // Get markets from BOTH data sources that belong to the selected region
    //         const receivingMarkets = new Set(
    //             receivingData
    //                 .filter(row => {
    //                     const market = getValue(row, ['Market']);
    //                     const region = getRegionFromMarket(market);
    //                     return region === currentRegion;
    //                 })
    //                 .map(row => getValue(row, ['Market']))
    //                 .filter(m => m)
    //         );

    //         const poListingMarkets = new Set(
    //             poListingData
    //                 .filter(row => {
    //                     const market = getValue(row, ['marketid', 'Market']);
    //                     const region = getRegionFromMarket(market);
    //                     return region === currentRegion;
    //                 })
    //                 .map(row => getValue(row, ['marketid', 'Market']))
    //                 .filter(m => m)
    //         );

    //         // Combine markets from both sources for this region
    //         const allMarkets = new Set([...receivingMarkets, ...poListingMarkets]);
    //         const markets = Array.from(allMarkets).filter(m => m && m !== "Unknown");

    //         console.log(`🏢 MARKETS FOR REGION ${currentRegion}:`, {
    //             receivingMarkets: Array.from(receivingMarkets),
    //             poListingMarkets: Array.from(poListingMarkets),
    //             combinedMarkets: Array.from(allMarkets)
    //         });

    //         markets.forEach(market => {
    //             const marketTotals = getCombinedMarketTotals(market);

    //             groups[market] = {
    //                 key: market,
    //                 count: marketTotals.totalStores,
    //                 poCount: marketTotals.totalPOs,
    //                 poReceived: marketTotals.poReceived,
    //                 poRecAmount: marketTotals.poRecAmount,
    //                 pendingPOs: marketTotals.pendingPOs,
    //                 poOpenAmount: marketTotals.poOpenAmount,
    //                 rows: []
    //             };
    //         });
    //     } else if (level === "stores") {
    //         // Get the current market from the filtered data
    //         const currentMarket = data[0]?.Market || '';
    //         if (!currentMarket) return [];

    //         // For store level, combine stores from BOTH sheets for this specific market
    //         const receivingStores = new Set(
    //             receivingData
    //                 .filter(row => getValue(row, ['Market']) === currentMarket)
    //                 .map(row => getValue(row, ['Store Name']))
    //                 .filter(s => s)
    //         );

    //         const poListingStores = new Set(
    //             poListingData
    //                 .filter(row => getValue(row, ['marketid', 'Market']) === currentMarket)
    //                 .map(row => getValue(row, ['storename', 'Store Name']))
    //                 .filter(s => s)
    //         );

    //         // Combine stores from both sources for this market
    //         const allStores = new Set([...receivingStores, ...poListingStores]);
    //         const stores = Array.from(allStores).filter(s => s && s !== "Unknown");

    //         console.log(`🏪 STORES FOR MARKET ${currentMarket}:`, {
    //             receivingStores: Array.from(receivingStores),
    //             poListingStores: Array.from(poListingStores),
    //             combinedStores: Array.from(allStores)
    //         });

    //         stores.forEach(storeName => {
    //             // Get ALL receiving rows for this store in this market
    //             const storeReceivingRows = receivingData.filter(row =>
    //                 getValue(row, ['Store Name']) === storeName &&
    //                 getValue(row, ['Market']) === currentMarket
    //             );

    //             // Get ALL PO listing rows for this store in this market
    //             const storePOListingRows = poListingData.filter(row =>
    //                 getValue(row, ['storename', 'Store Name']) === storeName &&
    //                 getValue(row, ['marketid', 'Market']) === currentMarket
    //             );

    //             // Calculate store-level amounts from receiving data
    //             let storeRecAmount = 0;
    //             let storeOpenAmount = 0;
    //             const storeReceivedPOs = new Set<string>();
    //             const storePendingPOs = new Set<string>();

    //             storeReceivingRows.forEach(row => {
    //                 const poNumber = getValue(row, ['PoNum']);
    //                 const recAmount = parseCurrency(getValue(row, ['recamount']));
    //                 const openAmount = parseCurrency(getValue(row, ['openamount']));
    //                 const remarks = getValue(row, ['remarks']).toLowerCase();

    //                 storeRecAmount += recAmount;
    //                 storeOpenAmount += openAmount;

    //                 // Use the same logic as market level
    //                 if (recAmount > 0 && !remarks.includes('pending') && !remarks.includes('In Transit') && remarks.includes('received')) {
    //                     storeReceivedPOs.add(poNumber);
    //                 }

    //                 if (remarks.includes('pending')) {
    //                     storePendingPOs.add(poNumber);
    //                 }
    //             });

    //             // Count POs for this store: ONLY from PO Listing
    //             const storePOs = new Set(
    //                 storePOListingRows.map(row => getValue(row, ['pono', 'PoNum', 'PO Number'])).filter(po => po)
    //             );

    //             const storeData = reports.filter(report =>
    //                 report['Store Name'] === storeName &&
    //                 report.Market === currentMarket
    //             );

    //             groups[storeName] = {
    //                 key: storeName,
    //                 count: 1,
    //                 poCount: storePOs.size,
    //                 poReceived: storeReceivedPOs.size,
    //                 poRecAmount: storeRecAmount,
    //                 pendingPOs: storePendingPOs.size,
    //                 poOpenAmount: storeOpenAmount,
    //                 rows: storeData
    //             };
    //         });
    //     }

    //     // FIX: Add the missing return statement
    //     return Object.values(groups).sort((a, b) => b.poRecAmount - a.poRecAmount);
    // };

    const aggregate = (data: OrderingReport[], level: string): AggregatedGroup[] => {
        const groups: { [key: string]: AggregatedGroup } = {};

        if (level === "regions") {
            // Use manual calculation to match your summary exactly
            const regionTotals = getRegionTotalsManual();

            Object.entries(regionTotals).forEach(([regionName, totals]) => {
                groups[regionName] = {
                    key: regionName,
                    count: totals.totalStores,
                    poCount: totals.totalPOs,
                    poReceived: totals.poReceived,
                    poRecAmount: totals.poRecAmount,
                    pendingPOs: totals.pendingPOs,
                    poOpenAmount: totals.poOpenAmount,
                    rows: []
                };
            });

            console.log('🎯 FINAL REGION TOTALS FOR DISPLAY:', groups);
        } else if (level === "markets") {
            // For market view, only show markets from the selected region
            const currentRegion = selectedRegion;

            // Get markets from BOTH data sources that belong to the selected region
            const receivingMarkets = new Set(
                receivingData
                    .filter(row => {
                        const market = getValue(row, ['Market']);
                        const region = getRegionFromMarket(market);
                        return region === currentRegion;
                    })
                    .map(row => getValue(row, ['Market']))
                    .filter(m => m)
            );

            const poListingMarkets = new Set(
                poListingData
                    .filter(row => {
                        const market = getValue(row, ['marketid', 'Market']);
                        const region = getRegionFromMarket(market);
                        return region === currentRegion;
                    })
                    .map(row => getValue(row, ['marketid', 'Market']))
                    .filter(m => m)
            );

            // Combine markets from both sources for this region
            const allMarkets = new Set([...receivingMarkets, ...poListingMarkets]);
            const markets = Array.from(allMarkets).filter(m => m && m !== "Unknown");

            markets.forEach(market => {
                const marketTotals = getCombinedMarketTotals(market);

                groups[market] = {
                    key: market,
                    count: marketTotals.totalStores,
                    poCount: marketTotals.totalPOs,
                    poReceived: marketTotals.poReceived,
                    poRecAmount: marketTotals.poRecAmount,
                    pendingPOs: marketTotals.pendingPOs,
                    poOpenAmount: marketTotals.poOpenAmount,
                    rows: []
                };
            });
        } else if (level === "stores") {
            // ... existing store logic\
            // Get the current market from the filtered data
            const currentMarket = data[0]?.Market || '';
            if (!currentMarket) return [];

            // For store level, combine stores from BOTH sheets for this specific market
            const receivingStores = new Set(
                receivingData
                    .filter(row => getValue(row, ['Market']) === currentMarket)
                    .map(row => getValue(row, ['Store Name']))
                    .filter(s => s)
            );

            const poListingStores = new Set(
                poListingData
                    .filter(row => getValue(row, ['marketid', 'Market']) === currentMarket)
                    .map(row => getValue(row, ['storename', 'Store Name']))
                    .filter(s => s)
            );

            // Combine stores from both sources for this market
            const allStores = new Set([...receivingStores, ...poListingStores]);
            const stores = Array.from(allStores).filter(s => s && s !== "Unknown");

            console.log(`🏪 STORES FOR MARKET ${currentMarket}:`, {
                receivingStores: Array.from(receivingStores),
                poListingStores: Array.from(poListingStores),
                combinedStores: Array.from(allStores)
            });

            stores.forEach(storeName => {
                // Get ALL receiving rows for this store in this market
                const storeReceivingRows = receivingData.filter(row =>
                    getValue(row, ['Store Name']) === storeName &&
                    getValue(row, ['Market']) === currentMarket
                );

                // Get ALL PO listing rows for this store in this market
                const storePOListingRows = poListingData.filter(row =>
                    getValue(row, ['storename', 'Store Name']) === storeName &&
                    getValue(row, ['marketid', 'Market']) === currentMarket
                );

                // Calculate store-level amounts from receiving data
                let storeRecAmount = 0;
                let storeOpenAmount = 0;
                const storeReceivedPOs = new Set<string>();
                const storePendingPOs = new Set<string>();

                storeReceivingRows.forEach(row => {
                    const poNumber = getValue(row, ['PoNum']);
                    const recAmount = parseCurrency(getValue(row, ['recamount']));
                    const openAmount = parseCurrency(getValue(row, ['openamount']));
                    const remarks = getValue(row, ['remarks']).toLowerCase();

                    storeRecAmount += recAmount;
                    storeOpenAmount += openAmount;

                    // Use the same logic as market level
                    if (recAmount > 0 && !remarks.includes('pending') && !remarks.includes('In Transit') && remarks.includes('received')) {
                        storeReceivedPOs.add(poNumber);
                    }

                    if (remarks.includes('pending')) {
                        storePendingPOs.add(poNumber);
                    }
                });

                // Count POs for this store: ONLY from PO Listing
                const storePOs = new Set(
                    storePOListingRows.map(row => getValue(row, ['pono', 'PoNum', 'PO Number'])).filter(po => po)
                );

                const storeData = reports.filter(report =>
                    report['Store Name'] === storeName &&
                    report.Market === currentMarket
                );

                groups[storeName] = {
                    key: storeName,
                    count: 1,
                    poCount: storePOs.size,
                    poReceived: storeReceivedPOs.size,
                    poRecAmount: storeRecAmount,
                    pendingPOs: storePendingPOs.size,
                    poOpenAmount: storeOpenAmount,
                    rows: storeData
                };
            });



        }

        return Object.values(groups).sort((a, b) => b.poRecAmount - a.poRecAmount);
    };
    const filteredByDateData = useMemo(() => {
        return filterByDate(currentData);
    }, [currentData, dateFilter]);

    const filteredReports = useMemo(() => {
        return filteredByDateData.filter(report => {
            const matchesSearch =
                report['Store Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['PO Number']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['Vendor']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['Order Number']?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });
    }, [filteredByDateData, searchTerm]);

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReports, currentPage, itemsPerPage]);

    // const summaryStats = useMemo(() => {
    //     const totalStores = getUniqueStoreCount(reports);
    //     const { poCount: totalPOs } = getPOCounts(reports);

    //     // Calculate total amounts from receiving data
    //     let totalPoRecAmount = 0;
    //     let totalPoOpenAmount = 0;
    //     let totalPoReceived = 0;
    //     let totalPendingPOs = 0;

    //     const uniqueStores = new Set(reports.map(report => report['Store Name']));
    //     uniqueStores.forEach(storeName => {
    //         const storeData = reports.find(report => report['Store Name'] === storeName);
    //         if (storeData) {
    //             const amounts = getReceivingAmounts(storeName, storeData.Market);
    //             totalPoRecAmount += amounts.poRecAmount;
    //             totalPoOpenAmount += amounts.poOpenAmount;
    //             totalPoReceived += amounts.poReceived;
    //             totalPendingPOs += amounts.pendingPOs;
    //         }
    //     });

    //     return {
    //         totalStores,
    //         totalPOs,
    //         totalPoRecAmount,
    //         totalPoOpenAmount,
    //         totalPoReceived,
    //         totalPendingPOs
    //     };
    // }, [reports, receivingData]);

    const summaryStats = useMemo(() => {
        // FIXED: Count stores from BOTH data sources combined
        const receivingStores = new Set(receivingData.map(row => getValue(row, ['Store Name'])).filter(s => s));
        const poListingStores = new Set(poListingData.map(row => getValue(row, ['storename', 'Store Name'])).filter(s => s));
        const allStores = new Set([...receivingStores, ...poListingStores]);
        const totalStores = allStores.size;

        // FIXED: Count POs from PO Listing only
        const poListingPOs = new Set(
            poListingData.map(row => getValue(row, ['pono', 'PoNum', 'PO Number'])).filter(po => po)
        );
        const totalPOs = poListingPOs.size;

        // Calculate total amounts from receiving data
        let totalPoRecAmount = 0;
        let totalPoOpenAmount = 0;
        let totalPoReceived = 0;
        let totalPendingPOs = 0;

        // Group receiving data by PO Number
        const poGroups: { [poNumber: string]: { recAmount: number; openAmount: number; remarks: string } } = {};

        receivingData.forEach(row => {
            const poNumber = getValue(row, ['PoNum']);
            if (!poNumber) return;

            if (!poGroups[poNumber]) {
                poGroups[poNumber] = {
                    recAmount: 0,
                    openAmount: 0,
                    remarks: getValue(row, ['remarks']).toLowerCase()
                };
            }

            poGroups[poNumber].recAmount += parseCurrency(getValue(row, ['recamount']));
            poGroups[poNumber].openAmount += parseCurrency(getValue(row, ['openamount']));
        });

        // Analyze each PO
        Object.entries(poGroups).forEach(([poNumber, poData]) => {
            totalPoRecAmount += poData.recAmount;
            totalPoOpenAmount += poData.openAmount;

            // FIXED: Count as RECEIVED only if FULLY received
            if (poData.recAmount > 0 && poData.openAmount === 0 && poData.remarks.includes('received') && !poData.remarks.includes('pending') && !poData.remarks.includes('in transit')) {
                totalPoReceived++;
            }

            // Count as PENDING based on remarks
            if (poData.remarks.includes('pending')) {
                totalPendingPOs++;
            }
        });

        console.log('📊 FINAL SUMMARY STATS:', {
            totalStores,
            totalPOs,
            totalPoRecAmount,
            totalPoOpenAmount,
            totalPoReceived,
            totalPendingPOs,
            totalPOsAnalyzed: Object.keys(poGroups).length
        });

        return {
            totalStores,
            totalPOs,
            totalPoRecAmount,
            totalPoOpenAmount,
            totalPoReceived,
            totalPendingPOs
        };
    }, [reports, receivingData, poListingData]);



    const toggleRowExpansion = (id: string) => {
        if (expandedRow === id) {
            setExpandedRow(null);
        } else {
            setExpandedRow(id);
        }
    };

    const showDetails = (report: OrderingReport) => {
        setSelectedDetails(report);
    };

    const closeDetails = () => {
        setSelectedDetails(null);
    };

    const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
        setDateFilter(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const clearDateFilters = () => {
        setDateFilter({
            startDate: '',
            endDate: ''
        });
    };

    const handleRegionClick = (region: AggregatedGroup) => {
        setCurrentData(region.rows);
        setCurrentView('markets');
        setSelectedRegion(region.key);
        setExpandedRow(null);
        setHistoryStack([
            { level: "Regions" },
            { level: "Markets", selected: region.key },
        ]);
    };

    const handleMarketClick = (market: AggregatedGroup) => {
        // For market view, we need to show ALL data for stores in this market
        const marketData = reports.filter(report => report.Market === market.key);
        setCurrentData(marketData);
        setCurrentView('stores');
        setSelectedMarket(market.key);
        setExpandedRow(null);
        setHistoryStack([
            { level: "Regions" },
            { level: "Markets", selected: selectedRegion },
            { level: "Stores", selected: market.key },
        ]);
    };

    const handleStoreClick = (store: AggregatedGroup) => {
        // For store view, we need to show ALL data for that specific store
        const storeData = reports.filter(report => report['Store Name'] === store.key);
        setCurrentData(storeData);
        setCurrentView('detailed');
        setSelectedStore(store.key);
        setExpandedRow(null);
        setHistoryStack([
            { level: "Regions" },
            { level: "Markets", selected: selectedRegion },
            { level: "Stores", selected: selectedMarket },
            { level: "Detailed", selected: store.key },
        ]);
    };

    // Also fix the back navigation to properly restore data
    const handleBackClick = () => {
        if (historyStack.length <= 1) {
            // Go back to regions view with all data
            setCurrentData(reports);
            setCurrentView('regions');
            setHistoryStack([{ level: "Regions" }]);
            setSelectedRegion('');
            setSelectedMarket('');
            setSelectedStore('');
            setExpandedRow(null);
        } else {
            const newStack = historyStack.slice(0, -1);
            setHistoryStack(newStack);

            const previousLevel = newStack[newStack.length - 1];

            if (previousLevel.level === "Regions") {
                setCurrentData(reports);
                setCurrentView('regions');
                setSelectedRegion('');
                setSelectedMarket('');
            } else if (previousLevel.level === "Markets") {
                // Go back to markets view for the selected region
                const regionData = reports.filter(report => report.Region === previousLevel.selected);
                setCurrentData(regionData);
                setCurrentView('markets');
                setSelectedMarket('');
                setSelectedStore('');
            } else if (previousLevel.level === "Stores") {
                // Go back to stores view for the selected market
                const marketData = reports.filter(report => report.Market === previousLevel.selected);
                setCurrentData(marketData);
                setCurrentView('stores');
                setSelectedStore('');
            }
            setExpandedRow(null);
        }
    };

    const renderBreadcrumb = () => {
        return historyStack.map((item, index) => (
            <span key={index} className="ordering-breadcrumb">
                {item.selected ? `${item.level} — ${item.selected}` : item.level}
                {index < historyStack.length - 1 && (
                    <span className="mx-2 text-gray-400">›</span>
                )}
            </span>
        ));
    };

    const getStatusColor = (status: string): string => {
        const statusColors: { [key: string]: string } = {
            'completed': 'green',
            'pending': 'orange',
            'active': 'blue',
            'closed': 'gray',
            'received': 'green',
            'in transit': 'orange',
            'partially received': 'yellow',
            'open': 'red'
        };

        const normalizedStatus = status.toLowerCase().trim();
        return statusColors[normalizedStatus] || 'gray';
    };

    const renderDateFilters = () => (
        <div className="ordering-date-filters">
            <div className="filter-group">
                <label>Start Date:</label>
                <input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                    className="ordering-input"
                />
            </div>
            <div className="filter-group">
                <label>End Date:</label>
                <input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                    className="ordering-input"
                />
            </div>
            {(dateFilter.startDate || dateFilter.endDate) && (
                <button onClick={clearDateFilters} className="btn btn-secondary">
                    Clear Dates
                </button>
            )}
        </div>
    );

    const renderHierarchicalTable = (data: OrderingReport[], level: string, onRowClick: (group: AggregatedGroup) => void) => {
        const aggregated = aggregate(data, level);
        const maxAmount = Math.max(...aggregated.map((a) => a.poRecAmount), 1);
        const totalAmount = aggregated.reduce((sum, group) => sum + group.poRecAmount, 0);

        let title = "";
        switch (level) {
            case "regions":
                title = "Regions";
                break;
            case "markets":
                title = "Markets";
                break;
            case "stores":
                title = "Stores";
                break;
        }

        return (
            <div className="ordering-table-block">
                <div className="ordering-table-header">
                    <h2>{title}</h2>
                    <div className="ordering-meta">
                        {aggregated.length} groups — {getUniqueStoreCount(data)} unique stores — total received amount ${totalAmount.toLocaleString()}
                    </div>
                </div>

                <div className="ordering-table-wrapper">
                    <table className="ordering-table">
                        <thead>
                            <tr>
                                <th>{title}</th>
                                <th className="ordering-col-right">Store Count</th>
                                <th className="ordering-col-right">PO Count</th>
                                <th className="ordering-col-right">PO Received</th>
                                <th className="ordering-col-right">PO Rec Amount</th>
                                <th className="ordering-col-right">Pending POs</th>
                                <th className="ordering-col-right">Open Amount</th>
                                <th>Value Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregated.map((group, index) => {
                                const pct = Math.round((group.poRecAmount / maxAmount) * 100);
                                const fillClass = pct >= 70 ? "ordering-fill-green" : pct >= 40 ? "ordering-fill-amber" : "ordering-fill-red";

                                return (
                                    <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
                                        <td>{group.key}</td>
                                        <td className="ordering-col-right">{group.count}</td>
                                        <td className="ordering-col-right">{group.poCount}</td>
                                        <td className="ordering-col-right">{group.poReceived}</td>
                                        <td className="ordering-col-right">${group.poRecAmount.toLocaleString()}</td>
                                        <td className="ordering-col-right">{group.pendingPOs}</td>
                                        <td className="ordering-col-right">${group.poOpenAmount.toLocaleString()}</td>
                                        <td>
                                            <div className="ordering-bar-cell">
                                                <div className="ordering-bar-track">
                                                    <div
                                                        className={`ordering-bar-fill ${fillClass}`}
                                                        style={{ width: `${pct}%` }}
                                                    ></div>
                                                </div>
                                                <div style={{ minWidth: "52px", textAlign: "right" }}>
                                                    {pct}%
                                                </div>
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
        // Enhance reports with receiving data for detailed view using remarks-based status
        const enhancedReports = filteredReports.map(report => {
            const poStatus = getPOStatusFromReceiving(report['PO Number'], report['Store Name'], report.Market);
            return {
                ...report,
                'Received Amount': poStatus.receivedAmount.toString(),
                'Open Amount': poStatus.openAmount.toString(),
                'Status': poStatus.status,
                'Remarks': poStatus.remarks
            };
        });

        const paginatedEnhancedReports = enhancedReports.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );

        return (
            <div className="ordering-table-block">
                <div className="ordering-table-header">
                    <h2>Detailed Report - {selectedStore}</h2>
                    <div className="ordering-meta">
                        {enhancedReports.length} purchase orders
                        {searchTerm && ` for "${searchTerm}"`}
                        {(dateFilter.startDate || dateFilter.endDate) && ' (date filtered)'}
                    </div>
                </div>

                <div className="ordering-controls-section">
                    <div className="ordering-controls-grid">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search stores, PO numbers, vendors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                            <span className="search-icon">🔍</span>
                        </div>
                    </div>
                    {renderDateFilters()}
                </div>

                <div className="ordering-table-wrapper">
                    <table className="ordering-table">
                        <thead>
                            <tr>
                                <th>Store</th>
                                <th>Market</th>
                                <th>PO Number</th>
                                <th>PO Date</th>
                                <th className="ordering-col-right">Received Amount</th>
                                <th className="ordering-col-right">Open Amount</th>
                                <th>Status</th>
                                <th>Vendor</th>
                                <th>Remarks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedEnhancedReports.map((report, index) => {
                                const uniqueId = `${report['PO Number']}-${index}`;
                                const receivedAmount = parseCurrency(report['Received Amount']);
                                const openAmount = parseCurrency(report['Open Amount']);

                                return (
                                    <React.Fragment key={uniqueId}>
                                        <tr className="main-row">
                                            <td>
                                                <div className="store-info">
                                                    <div className="store-name">{report['Store Name']}</div>
                                                    <div className="store-dm">DM: {report.DM}</div>
                                                </div>
                                            </td>
                                            <td>{report.Market}</td>
                                            <td>
                                                <div className="po-info">
                                                    <div className="po-number">{report['PO Number']}</div>
                                                    <div className="order-number">Order: {report['Order Number']}</div>
                                                </div>
                                            </td>
                                            <td>{report['PO Date']}</td>
                                            <td className={`ordering-col-right ${receivedAmount > 0 ? 'received' : 'not-received'}`}>
                                                ${receivedAmount.toLocaleString()}
                                            </td>
                                            <td className={`ordering-col-right ${openAmount > 0 ? 'open' : 'closed'}`}>
                                                ${openAmount.toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`status-indicator status-${getStatusColor(report.Status)}`}>
                                                    {report.Status}
                                                </span>
                                            </td>
                                            <td>{report.Vendor}</td>
                                            <td className="remarks-cell">
                                                {report.Remarks || 'No remarks'}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => showDetails(report)}
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
                                                <td colSpan={10}>
                                                    <div className="detail-panel">
                                                        <div className="detail-section">
                                                            <h4>PO Details</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>Add Date:</strong> {report['Add Date']}</div>
                                                                <div><strong>Region:</strong> {report.Region}</div>
                                                                <div><strong>DM:</strong> {report.DM}</div>
                                                                <div><strong>Order Number:</strong> {report['Order Number']}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Amount Breakdown</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>Received Amount:</strong> ${receivedAmount.toLocaleString()}</div>
                                                                <div><strong>Open Amount:</strong> ${openAmount.toLocaleString()}</div>
                                                                <div><strong>Completion:</strong> {receivedAmount > 0 ? (openAmount > 0 ? 'Partially Received' : 'Fully Received') : 'Not Received'}</div>
                                                                <div><strong>Status:</strong> {report.Status}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Vendor Information</h4>
                                                            <div className="vendor-info">{report.Vendor}</div>
                                                        </div>

                                                        {report.Remarks && (
                                                            <div className="detail-section">
                                                                <h4>Remarks</h4>
                                                                <div className="remarks-info">{report.Remarks}</div>
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

                    {paginatedEnhancedReports.length === 0 && (
                        <div className="no-data">
                            No purchase orders found matching your criteria.
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
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
            <div className="dashboard-card card-blue">
                <div className="card-icon">🏪</div>
                <div className="card-content">
                    <h3 className="card-title">Total Stores</h3>
                    <p className="card-description">{summaryStats.totalStores}</p>
                </div>
            </div>
            <div className="dashboard-card card-blue">
                <div className="card-icon">📄</div>
                <div className="card-content">
                    <h3 className="card-title">Total POs</h3>
                    <p className="card-description">{summaryStats.totalPOs}</p>
                </div>
            </div>
            <div className="dashboard-card card-blue">
                <div className="card-icon">📦</div>
                <div className="card-content">
                    <h3 className="card-title">PO Received</h3>
                    <p className="card-description">{summaryStats.totalPoReceived}</p>
                </div>
            </div>
            <div className="dashboard-card card-blue">
                <div className="card-icon">💰</div>
                <div className="card-content">
                    <h3 className="card-title">PO Rec Amount</h3>
                    <p className="card-description">${summaryStats.totalPoRecAmount.toLocaleString()}</p>
                </div>
            </div>
            <div className="dashboard-card card-orange">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                    <h3 className="card-title">Pending POs</h3>
                    <p className="card-description">{summaryStats.totalPendingPOs}</p>
                </div>
            </div>
            <div className="dashboard-card card-orange">
                <div className="card-icon">💳</div>
                <div className="card-content">
                    <h3 className="card-title">Open Amount</h3>
                    <p className="card-description">${summaryStats.totalPoOpenAmount.toLocaleString()}</p>
                </div>
            </div>
        </section>
    );

    if (isLoading || loading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner"></div>
                <p>Loading Ordering Reports...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    if (error) {
        return (
            <div className="ordering-page">
                <div className="error-container">
                    <h2>Error Loading Data</h2>
                    <p>{error}</p>
                    <button onClick={fetchOrderingData} className="retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="main-content">
            <div className="content-wrapper">
                <header className="topbar">
                    <div className="brand">
                        <div className="logo">📦</div>
                        <div className="title">
                            <div className="main">Ordering Reports</div>
                            <div className="sub">
                                Purchase Order Tracking System
                            </div>
                        </div>
                    </div>
                </header>

                <main className="main-area">
                    <div className="ordering-controls-section">
                        <div className="ordering-controls-grid">
                            <div className="ordering-action-buttons">
                                <button
                                    className="btn btn-success"
                                    onClick={() => {
                                        const csvData = currentView === 'detailed' ? filteredReports : currentData;
                                        if (csvData.length) {
                                            const keys = Object.keys(csvData[0]);
                                            const csv = [keys.join(",")]
                                                .concat(
                                                    csvData.map((r) =>
                                                        keys
                                                            .map((k) => `"${String(r[k as keyof OrderingReport] || "").replace(/"/g, '""')}"`)
                                                            .join(",")
                                                    )
                                                )
                                                .join("\n");

                                            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement("a");
                                            a.href = url;
                                            a.download = "ordering_export.csv";
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }
                                    }}
                                >
                                    Export CSV
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={fetchOrderingData}
                                >
                                    Refresh Data
                                </button>
                            </div>
                            <div className="ordering-date-filters">
                                <div className="filter-group">
                                    <input
                                        type="date"
                                        value={dateFilter.startDate}
                                        onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                                        className="ordering-input"
                                        placeholder="Start Date"
                                    />
                                </div>
                                <div className="filter-group">
                                    <input
                                        type="date"
                                        value={dateFilter.endDate}
                                        onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                                        className="ordering-input"
                                        placeholder="End Date"
                                    />
                                </div>
                                {(dateFilter.startDate || dateFilter.endDate) && (
                                    <button onClick={clearDateFilters} className="btn btn-secondary">
                                        Clear Dates
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {renderSummaryCards()}

                    <div className="ordering-nav-row">
                        <button
                            className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
                            onClick={handleBackClick}
                        >
                            ← Back
                        </button>
                        <div className="ordering-breadcrumb">
                            {renderBreadcrumb()}
                        </div>
                    </div>

                    <section className="ordering-stacked">
                        {currentView === "regions" &&
                            renderHierarchicalTable(currentData, "regions", handleRegionClick)}
                        {currentView === "markets" &&
                            renderHierarchicalTable(currentData, "markets", handleMarketClick)}
                        {currentView === "stores" &&
                            renderHierarchicalTable(currentData, "stores", handleStoreClick)}
                        {currentView === "detailed" && renderDetailedTable()}
                    </section>

                    {loading && (
                        <div className="ordering-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading ordering data...</p>
                        </div>
                    )}

                    {selectedDetails && (
                        <div className="modal-overlay" onClick={closeDetails}>
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>PO Details - {selectedDetails['PO Number']}</h3>
                                    <button className="close-btn" onClick={closeDetails}>×</button>
                                </div>
                                <div className="modal-body">
                                    <div className="detail-grid">
                                        <div><strong>Store:</strong> {selectedDetails['Store Name']}</div>
                                        <div><strong>Market:</strong> {selectedDetails.Market}</div>
                                        <div><strong>Region:</strong> {selectedDetails.Region}</div>
                                        <div><strong>DM:</strong> {selectedDetails.DM}</div>
                                        <div><strong>PO Date:</strong> {selectedDetails['PO Date']}</div>
                                        <div><strong>Add Date:</strong> {selectedDetails['Add Date']}</div>
                                        <div><strong>Order Number:</strong> {selectedDetails['Order Number']}</div>
                                        <div><strong>Vendor:</strong> {selectedDetails.Vendor}</div>
                                        <div><strong>Status:</strong>
                                            <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
                                                {selectedDetails.Status || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}