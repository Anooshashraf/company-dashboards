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
    count: number; // Tracking count (from Tracking sheet)
    poCount: number; // From PO Listing
    poReceived: number; // From Receiving based on remarks
    poRecAmount: number; // From Receiving - SUM of recamount
    pendingPOs: number; // Only POs with "pending" in remarks
    poOpenAmount: number; // From Receiving - SUM of openamount
    orderCount: number; // NEW: Order count from ORDERING sheet
    rows: OrderingReport[];
}

interface RegionTotals {
    totalStores: number;
    totalPOs: number;
    poReceived: number;
    poRecAmount: number;
    pendingPOs: number;
    poOpenAmount: number;
    trackingCount: number;
    orderCount: number; // NEW
}

export default function OrderingReportsPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<OrderingReport[]>([]);
    const [poListingData, setPoListingData] = useState<Row[]>([]);
    const [receivingData, setReceivingData] = useState<Row[]>([]);
    const [trackingData, setTrackingData] = useState<Row[]>([]);
    const [disputesData, setDisputesData] = useState<Row[]>([]);
    const [mainData, setMainData] = useState<Row[]>([]);
    const [orderingData, setOrderingData] = useState<Row[]>([]); // NEW
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
        },
        {
            id: 'TRACKING',
            name: 'TRACKING',
            gid: '2064247208',
            description: 'Tracking data',
            type: 'tracking'
        },
        {
            id: 'DISPUTES',
            name: 'DISPUTES',
            gid: '825813925',
            description: 'Disputes data',
            type: 'disputes'
        },
        {
            id: 'MAIN',
            name: 'MAIN',
            gid: '2039561125',
            description: 'Main data',
            type: 'main'
        },
        {
            id: 'ORDERING',
            name: 'ORDERING',
            gid: '1802340994',
            description: 'Ordering data',
            type: 'ordering'
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

    const fetchOrderingData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data sources
            const [poData, receivingData, trackingData, disputesData, mainData, orderingData] = await Promise.all([
                fetchDataSource(dataSources[0]),
                fetchDataSource(dataSources[1]),
                fetchDataSource(dataSources[2]),
                fetchDataSource(dataSources[3]),
                fetchDataSource(dataSources[4]),
                fetchDataSource(dataSources[5])
            ]);

            setPoListingData(poData);
            setReceivingData(receivingData);
            setTrackingData(trackingData);
            setDisputesData(disputesData);
            setMainData(mainData);
            setOrderingData(orderingData);

            // Debug: Check ordering data structure
            console.log('📋 Ordering data loaded:', orderingData.length, 'rows');
            if (orderingData.length > 0) {
                console.log('🔍 First ordering data row:', orderingData[0]);
                console.log('📋 Ordering data columns:', Object.keys(orderingData[0]));
            }

            // Transform PO Listing data for basic structure
            const transformedData: OrderingReport[] = poData.map(row => ({
                Region: getValue(row, ['Regions', 'Region']),
                Market: getValue(row, ['marketid', 'Market']),
                'Store Name': getValue(row, ['storename', 'Store Name']),
                'PO Number': getValue(row, ['pono', 'PoNum', 'PO Number']),
                'PO Date': getValue(row, ['podate', 'PoDate']),
                'PO Amount': '',
                'Received Amount': '',
                'Open Amount': '',
                Status: getValue(row, ['postat', 'Status']),
                Vendor: getValue(row, ['vendor', 'Vendor', 'company']),
                'Order Number': getValue(row, ['Order No', 'OrderNo', 'vendorpo']),
                'Add Date': getValue(row, ['adddate', 'AddDate']),
                DM: getValue(row, ['DM', 'Dm', 'dm'])
            }));

            setReports(transformedData);
            setCurrentData(transformedData);

        } catch (err) {
            setError('Failed to load ordering data');
            console.error('Error fetching ordering data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getValue = (row: Row, possibleKeys: string[]): string => {
        for (const k of possibleKeys) {
            if (row[k] !== undefined && String(row[k]).trim() !== '') {
                return String(row[k]).trim();
            }
        }

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

    const getReceivingAmounts = (storeName: string, market: string): {
        poRecAmount: number;
        poOpenAmount: number;
        poReceived: number;
        pendingPOs: number;
    } => {
        let poRecAmount = 0;
        let poOpenAmount = 0;

        const receivedPOs = new Set<string>();
        const pendingPOsSet = new Set<string>();

        const receivingRows = receivingData.filter(row => {
            const rowStore = getValue(row, ['Store Name']);
            const rowMarket = getValue(row, ['Market']);
            return rowStore === storeName && rowMarket === market;
        });

        receivingRows.forEach(row => {
            const poNumber = getValue(row, ['PoNum']);
            if (!poNumber) return;

            const recAmount = parseCurrency(getValue(row, ['recamount']));
            const openAmount = parseCurrency(getValue(row, ['openamount']));
            const remarks = getValue(row, ['remarks']).toLowerCase();

            poRecAmount += recAmount;
            poOpenAmount += openAmount;

            // FIXED: Only count as received if recamount > 0 AND remarks include "received"
            if (recAmount > 0 && remarks.includes('received')) {
                receivedPOs.add(poNumber);
            }

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

    const getTrackingCount = (market: string): number => {
        if (!trackingData.length) return 0;

        const matchingTrackingRows = trackingData.filter(row => {
            const rowMarket = getValue(row, ['Market', 'Tracking Market', 'MARKET', 'market', 'TrackingMarket']);
            return rowMarket === market;
        });

        return matchingTrackingRows.length;
    };

    // NEW: Get order count from ORDERING sheet
    const getOrderCount = (market: string): number => {
        if (!orderingData.length) return 0;

        const matchingOrderRows = orderingData.filter(row => {
            const rowMarket = getValue(row, ['Market', 'marketid', 'MARKET', 'market']);
            return rowMarket === market;
        });

        return matchingOrderRows.length;
    };

    const getCombinedMarketTotals = (market: string) => {
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

        const receivingRows = receivingData.filter(row => getValue(row, ['Market']) === market);

        receivingRows.forEach(row => {
            const poNumber = getValue(row, ['PoNum']);
            const recAmount = parseCurrency(getValue(row, ['recamount']));
            const openAmount = parseCurrency(getValue(row, ['openamount']));
            const remarks = getValue(row, ['remarks']).toLowerCase();

            marketRecAmount += recAmount;
            marketOpenAmount += openAmount;

            // FIXED: Only count as received if recamount > 0 AND remarks include "received"
            if (recAmount > 0 && remarks.includes('received')) {
                marketReceivedPOs.add(poNumber);
            }

            if (remarks.includes('pending')) {
                marketPendingPOs.add(poNumber);
            }
        });

        // Get tracking count for this market
        const trackingCount = getTrackingCount(market);

        // NEW: Get order count for this market from ORDERING sheet
        const orderCount = getOrderCount(market);

        return {
            totalStores: allStores.size,
            totalPOs: poListingPOs.size,
            poReceived: marketReceivedPOs.size,
            poRecAmount: marketRecAmount,
            pendingPOs: marketPendingPOs.size,
            poOpenAmount: marketOpenAmount,
            trackingCount,
            orderCount // Add order count
        };
    };

    const getRegionTotalsManual = () => {
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
                poOpenAmount: 0,
                trackingCount: 0,
                orderCount: 0
            };

            markets.forEach(market => {
                const marketData = getCombinedMarketTotals(market);

                regionTotals[region].totalStores += marketData.totalStores;
                regionTotals[region].totalPOs += marketData.totalPOs;
                regionTotals[region].poReceived += marketData.poReceived;
                regionTotals[region].poRecAmount += marketData.poRecAmount;
                regionTotals[region].pendingPOs += marketData.pendingPOs;
                regionTotals[region].poOpenAmount += marketData.poOpenAmount;
                regionTotals[region].trackingCount += marketData.trackingCount;
                regionTotals[region].orderCount += marketData.orderCount;
            });
        });

        return regionTotals;
    };

    // Add function to get movements data from MAIN sheet
    const getMovementsData = (poNumber: string, storeName: string, market: string): string => {
        const movementRow = mainData.find(row => {
            const rowStore = getValue(row, ['Store name  (Market Structure)', 'Store Name', 'Store name', 'storename']);
            const rowMarket = getValue(row, ['MARKET  ((Market Structure)', 'Market', 'marketid', 'MARKET']);
            return rowStore === storeName && rowMarket === market;
        });

        if (movementRow) {
            return getValue(movementRow, ['Movements', 'Movement', 'MOVEMENTS', 'movement']) || '-';
        }

        return '-';
    };

    // Add function to get disputes data
    const getDisputesData = (poNumber: string, storeName: string, market: string): {
        disputeCreated: string;
        disputeResolved: string;
    } => {
        const disputeRow = disputesData.find(row => {
            const rowStore = getValue(row, ['Store Name', 'Store name', 'storename']);
            const rowMarket = getValue(row, ['Market', 'marketid', 'MARKET']);
            return rowStore === storeName && rowMarket === market;
        });

        if (disputeRow) {
            const disputeCreated = getValue(disputeRow, ['Dispute Created', 'DisputeCreated', 'DISPUTE_CREATED']) || '';
            const disputeResolved = getValue(disputeRow, ['Dispute Resolved', 'DisputeResolved', 'DISPUTE_RESOLVED']) || '';

            return {
                disputeCreated: disputeCreated || '-',
                disputeResolved: disputeResolved || '-'
            };
        }

        return {
            disputeCreated: '-',
            disputeResolved: '-'
        };
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
            totalReceived += parseCurrency(getValue(row, ['recamount']));
            totalOpen += parseCurrency(getValue(row, ['openamount']));

            const rowRemarks = getValue(row, ['remarks']);
            if (rowRemarks) {
                remarksSet.add(rowRemarks);
            }
        });

        const allRemarks = Array.from(remarksSet).join(', ');
        const remarksLower = allRemarks.toLowerCase();

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
            }
        });

        return regions;
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

        const receivingRows = receivingData.filter(row => getValue(row, ['Market']) === market);
        receivingRows.forEach(row => {
            const region = getValue(row, ['Regions', 'Region']);
            if (region && region !== 'Unknown Region') {
                foundRegions.add(region);
            }
        });

        const poListingRows = poListingData.filter(row => getValue(row, ['marketid', 'Market']) === market);
        poListingRows.forEach(row => {
            const region = getValue(row, ['Regions', 'Region']);
            if (region && region !== 'Unknown Region') {
                foundRegions.add(region);
            }
        });

        if (foundRegions.size > 0) {
            return Array.from(foundRegions)[0];
        }

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

    const aggregate = (data: OrderingReport[], level: string): AggregatedGroup[] => {
        const groups: { [key: string]: AggregatedGroup } = {};

        if (level === "regions") {
            const regionTotals = getRegionTotalsManual();

            Object.entries(regionTotals).forEach(([regionName, totals]) => {
                groups[regionName] = {
                    key: regionName,
                    count: totals.trackingCount,
                    poCount: totals.totalPOs,
                    poReceived: totals.poReceived,
                    poRecAmount: totals.poRecAmount,
                    pendingPOs: totals.pendingPOs,
                    poOpenAmount: totals.poOpenAmount,
                    orderCount: totals.orderCount, // NEW
                    rows: []
                };
            });
        } else if (level === "markets") {
            const currentRegion = selectedRegion;

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

            const allMarkets = new Set([...receivingMarkets, ...poListingMarkets]);
            const markets = Array.from(allMarkets).filter(m => m && m !== "Unknown");

            markets.forEach(market => {
                const marketTotals = getCombinedMarketTotals(market);

                groups[market] = {
                    key: market,
                    count: marketTotals.trackingCount,
                    poCount: marketTotals.totalPOs,
                    poReceived: marketTotals.poReceived,
                    poRecAmount: marketTotals.poRecAmount,
                    pendingPOs: marketTotals.pendingPOs,
                    poOpenAmount: marketTotals.poOpenAmount,
                    orderCount: marketTotals.orderCount, // NEW
                    rows: []
                };
            });
        } else if (level === "stores") {
            const currentMarket = data[0]?.Market || '';
            if (!currentMarket) return [];

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

            const allStores = new Set([...receivingStores, ...poListingStores]);
            const stores = Array.from(allStores).filter(s => s && s !== "Unknown");

            stores.forEach(storeName => {
                const storeReceivingRows = receivingData.filter(row =>
                    getValue(row, ['Store Name']) === storeName &&
                    getValue(row, ['Market']) === currentMarket
                );

                const storePOListingRows = poListingData.filter(row =>
                    getValue(row, ['storename', 'Store Name']) === storeName &&
                    getValue(row, ['marketid', 'Market']) === currentMarket
                );

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

                    if (recAmount >= 0 && remarks.includes('received')) {
                        storeReceivedPOs.add(poNumber);
                    }

                    if (remarks.includes('pending')) {
                        storePendingPOs.add(poNumber);
                    }
                });

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
                    orderCount: 0, // Store level doesn't need order count
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

    const summaryStats = useMemo(() => {
        const receivingStores = new Set(receivingData.map(row => getValue(row, ['Store Name'])).filter(s => s));
        const poListingStores = new Set(poListingData.map(row => getValue(row, ['storename', 'Store Name'])).filter(s => s));
        const allStores = new Set([...receivingStores, ...poListingStores]);
        const totalStores = allStores.size;

        const poListingPOs = new Set(
            poListingData.map(row => getValue(row, ['pono', 'PoNum', 'PO Number'])).filter(po => po)
        );
        const totalPOs = poListingPOs.size;

        let totalPoRecAmount = 0;
        let totalPoOpenAmount = 0;
        let totalPoReceived = 0;
        let totalPendingPOs = 0;

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

        Object.entries(poGroups).forEach(([poNumber, poData]) => {
            totalPoRecAmount += poData.recAmount;
            totalPoOpenAmount += poData.openAmount;

            if (poData.recAmount >= 0 && poData.remarks.includes('received')) {
                totalPoReceived++;
            }

            if (poData.remarks.includes('pending')) {
                totalPendingPOs++;
            }
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

    const handleBackClick = () => {
        if (historyStack.length <= 1) {
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
                const regionData = reports.filter(report => report.Region === previousLevel.selected);
                setCurrentData(regionData);
                setCurrentView('markets');
                setSelectedMarket('');
                setSelectedStore('');
            } else if (previousLevel.level === "Stores") {
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
        let countLabel = "Tracking";
        switch (level) {
            case "regions":
                title = "Regions";
                break;
            case "markets":
                title = "Markets";
                break;
            case "stores":
                title = "Stores";
                countLabel = "Store Count";
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
                                <th className="ordering-col-right">{countLabel}</th>
                                <th className="ordering-col-right">PO Count</th>
                                <th className="ordering-col-right">PO Received</th>
                                <th className="ordering-col-right">PO Rec Amount</th>
                                <th className="ordering-col-right">Pending POs</th>
                                <th className="ordering-col-right">Open Amount</th>
                                <th className="ordering-col-right">Order Count</th>
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
                                        <td className="ordering-col-right">{group.orderCount}</td>
                                        <td>
                                            <div className="ordering-bar-cell">
                                                <div className="ordering-bar-track">
                                                    <div
                                                        className={`ordering-bar-fill ${fillClass}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
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
        const enhancedReports = filteredReports.map(report => {
            const poStatus = getPOStatusFromReceiving(report['PO Number'], report['Store Name'], report.Market);
            const movements = getMovementsData(report['PO Number'], report['Store Name'], report.Market);
            const disputes = getDisputesData(report['PO Number'], report['Store Name'], report.Market);

            return {
                ...report,
                'Received Amount': poStatus.receivedAmount.toString(),
                'Open Amount': poStatus.openAmount.toString(),
                'Status': poStatus.status,
                'Remarks': poStatus.remarks,
                'Movements': movements,
                'Dispute Created': disputes.disputeCreated,
                'Dispute Resolved': disputes.disputeResolved
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
                                <th>Market</th>
                                <th>PO Number</th>
                                <th>PO Date</th>
                                <th className="ordering-col-right">Received Amount</th>
                                <th className="ordering-col-right">Open Amount</th>
                                <th>Remarks</th>
                                <th>Movements</th>
                                <th>Dispute Created</th>
                                <th>Dispute Resolved</th>
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
                                                <div className="market-info">
                                                    <div className="market-name">{report.Market}</div>
                                                    <div className="store-dm">DM: {report.DM}</div>
                                                </div>
                                            </td>
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
                                            <td className="remarks-cell">
                                                {report.Remarks || 'No remarks'}
                                            </td>
                                            <td className="movements-cell">
                                                {report.Movements}
                                            </td>
                                            <td className="dispute-created-cell">
                                                {report['Dispute Created']}
                                            </td>
                                            <td className="dispute-resolved-cell">
                                                {report['Dispute Resolved']}
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
                                                                <div><strong>Vendor:</strong> {report.Vendor}</div>
                                                                <div><strong>Status:</strong> {report.Status}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Amount Breakdown</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>Received Amount:</strong> ${receivedAmount.toLocaleString()}</div>
                                                                <div><strong>Open Amount:</strong> ${openAmount.toLocaleString()}</div>
                                                                <div><strong>Completion:</strong> {receivedAmount > 0 ? (openAmount > 0 ? 'Partially Received' : 'Fully Received') : 'Not Received'}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Additional Information</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>Movements:</strong> {report.Movements}</div>
                                                                <div><strong>Dispute Created:</strong> {report['Dispute Created']}</div>
                                                                <div><strong>Dispute Resolved:</strong> {report['Dispute Resolved']}</div>
                                                            </div>
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

    // Add this function to calculate total order count
    const getTotalOrderCount = (): number => {
        if (!orderingData.length) return 0;

        // Count all unique markets in ordering data and sum their order counts
        const uniqueMarkets = new Set(
            orderingData.map(row => getValue(row, ['Market', 'marketid', 'MARKET', 'market'])).filter(m => m)
        );

        let totalOrderCount = 0;
        uniqueMarkets.forEach(market => {
            totalOrderCount += getOrderCount(market);
        });

        return totalOrderCount;
    };

    const renderSummaryCards = () => (
        <section className="dashboard-grid">
            <div className="dashboard-card card-purple">
                <div className="card-icon">🏪</div>
                <div className="card-content">
                    <h3 className="card-title">Total Stores</h3>
                    <p className="card-description">{summaryStats.totalStores}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">📄</div>
                <div className="card-content">
                    <h3 className="card-title">Total POs</h3>
                    <p className="card-description">{summaryStats.totalPOs}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">📦</div>
                <div className="card-content">
                    <h3 className="card-title">PO Received</h3>
                    <p className="card-description">{summaryStats.totalPoReceived}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">💰</div>
                <div className="card-content">
                    <h3 className="card-title">PO Rec Amount</h3>
                    <p className="card-description">${summaryStats.totalPoRecAmount.toLocaleString()}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">⏳</div>
                <div className="card-content">
                    <h3 className="card-title">Pending POs</h3>
                    <p className="card-description">{summaryStats.totalPendingPOs}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">💳</div>
                <div className="card-content">
                    <h3 className="card-title">Open Amount</h3>
                    <p className="card-description">${summaryStats.totalPoOpenAmount.toLocaleString()}</p>
                </div>
            </div>
            <div className="dashboard-card card-purple">
                <div className="card-icon">📋</div>
                <div className="card-content">
                    <h3 className="card-title">Order Count</h3>
                    <p className="card-description">{getTotalOrderCount()}</p>
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