// app/dashboard/ias/page.tsx
// 'use client';
// import React, { useState, useEffect, useMemo } from 'react';
// import { useAuth } from '../../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import './ias-styles.css';

// interface IASReport {
//     Market: string;
//     'Net Worth': string;
//     'Store Name': string;
//     Status: string;
//     SKU: string;
//     Model: string;
//     Product: string;
//     INSTOCK: string;
//     'ON TRANSFER': string;
//     'IN Transit': string;
//     BACKDATED: string;
//     Friday: string;
//     Monday: string;
//     GROUND: string;
//     TOTAL: string;
//     Cost: string;
//     QUOTA: string;
//     '2days': string;
//     LWS: string;
//     L2WS: string;
//     L3WS: string;
//     L4WS: string;
//     L5WS: string;
//     'New Activation': string;
//     SWITCHER: string;
//     UPGRADE: string;
//     '3W ACT': string;
//     '3W UPG': string;
//     '%': string;
//     'SUG QTY': string;
//     'OVERNIGHT QTY': string;
//     '2nd DAY': string;
//     'GROUND QTY': string;
//     ALLOCATION: string;
//     'Total ACC Sale': string;
//     PPD: string;
//     'ACC Per BOX': string;
//     'TOTAL COST': string;
//     '#': string;
//     ID: string;
//     'Store Address': string;
//     'Sub Market': string;
// }

// interface AggregatedGroup {
//     key: string;
//     count: number;
//     instock: number;
//     total: number;
//     cost: number;
//     rows: IASReport[];
// }

// export default function IASReportsPage() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [reports, setReports] = useState<IASReport[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(50);
//     const [expandedRow, setExpandedRow] = useState<string | null>(null); // Single row expansion
//     const [selectedDetails, setSelectedDetails] = useState<IASReport | null>(null);

//     // Hierarchical navigation state
//     const [currentView, setCurrentView] = useState<'regions' | 'markets' | 'stores' | 'detailed'>('regions');
//     const [currentData, setCurrentData] = useState<IASReport[]>([]);
//     const [selectedRegion, setSelectedRegion] = useState<string>('');
//     const [selectedMarket, setSelectedMarket] = useState<string>('');
//     const [selectedStore, setSelectedStore] = useState<string>('');
//     const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([{ level: "Regions" }]);

//     const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK1tiOHJrphkxuRXH6p4i4l-caCCo4dAbNrb8p4TCIHztwB-V2fLK7v2yLNl04Q/pub?gid=2112869718&single=true&output=csv';

//     useEffect(() => {
//         if (!isLoading && !isAuthenticated) {
//             router.push('/login');
//         }
//     }, [isAuthenticated, isLoading, router]);

//     useEffect(() => {
//         if (isAuthenticated) {
//             fetchIASData();
//         }
//     }, [isAuthenticated]);

//     const fetchIASData = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             const response = await fetch(GOOGLE_SHEETS_URL);
//             if (!response.ok) {
//                 throw new Error('Failed to fetch data from Google Sheets');
//             }

//             const csvText = await response.text();
//             const parsedData = parseCSV(csvText);
//             setReports(parsedData);
//             setCurrentData(parsedData);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to load data');
//             console.error('Error fetching IAS data:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const parseCSV = (csvText: string): IASReport[] => {
//         const lines = csvText.split('\n').filter(line => line.trim());
//         if (lines.length < 2) return [];

//         const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

//         return lines.slice(1).map(line => {
//             const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
//             const report: any = {};

//             headers.forEach((header, index) => {
//                 report[header] = values[index] || '';
//             });

//             return report as IASReport;
//         });
//     };

//     // Create regions dynamically from Market column
//     const getRegions = (data: IASReport[]) => {
//         const regions: { [key: string]: IASReport[] } = {
//             "Aleem Ghori Region": [],
//             "Hasnain Mustaqeem Region": []
//         };

//         // Get all unique markets from the Market column
//         const markets = Array.from(new Set(data.map(report => report.Market))).filter(m => m && m !== "Unknown");

//         console.log('Markets found in sheet:', markets);

//         // Distribute markets between the two regions dynamically
//         // This evenly splits markets between the two regions
//         markets.forEach((market, index) => {
//             const regionName = index % 2 === 0 ? "Aleem Ghori Region" : "Hasnain Mustaqeem Region";
//             const marketData = data.filter(report => report.Market === market);
//             regions[regionName].push(...marketData);
//         });

//         // Log the distribution for debugging
//         console.log('Region distribution:', {
//             'Aleem Ghori Region': regions["Aleem Ghori Region"].length,
//             'Hasnain Mustaqeem Region': regions["Hasnain Mustaqeem Region"].length
//         });

//         return regions;
//     };

//     // Get store region for display (if needed)
//     const getStoreRegion = (report: IASReport): string => {
//         const regions = getRegions([report]);
//         for (const [regionName, regionData] of Object.entries(regions)) {
//             if (regionData.some(r => r.Market === report.Market && r['Store Name'] === report['Store Name'])) {
//                 return regionName;
//             }
//         }
//         return "Unknown Region";
//     };

//     // Aggregate data for hierarchical views
//     const aggregate = (data: IASReport[], level: string): AggregatedGroup[] => {
//         const groups: { [key: string]: AggregatedGroup } = {};

//         if (level === "regions") {
//             const regions = getRegions(data);
//             Object.entries(regions).forEach(([regionName, regionData]) => {
//                 const totalInstock = regionData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = regionData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = regionData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[regionName] = {
//                     key: regionName,
//                     count: regionData.length,
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: regionData
//                 };
//             });
//         } else if (level === "markets") {
//             const markets = Array.from(new Set(data.map(report => report.Market))).filter(m => m && m !== "Unknown");

//             markets.forEach(market => {
//                 const marketData = data.filter(report => report.Market === market);
//                 const totalInstock = marketData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = marketData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = marketData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[market] = {
//                     key: market,
//                     count: marketData.length,
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: marketData
//                 };
//             });
//         } else if (level === "stores") {
//             const stores = Array.from(new Set(data.map(report => report['Store Name']))).filter(s => s && s !== "Unknown");

//             stores.forEach(store => {
//                 const storeData = data.filter(report => report['Store Name'] === store);
//                 const totalInstock = storeData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = storeData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = storeData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[store] = {
//                     key: store,
//                     count: storeData.length,
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: storeData
//                 };
//             });
//         }

//         return Object.values(groups).sort((a, b) => b.cost - a.cost);
//     };

//     // Filter and search logic for detailed view
//     const filteredReports = useMemo(() => {
//         return currentData.filter(report => {
//             const matchesSearch =
//                 report['Store Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['Product']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['SKU']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['ID']?.toLowerCase().includes(searchTerm.toLowerCase());

//             return matchesSearch;
//         });
//     }, [currentData, searchTerm]);

//     // Pagination for detailed view
//     const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
//     const paginatedReports = useMemo(() => {
//         const startIndex = (currentPage - 1) * itemsPerPage;
//         return filteredReports.slice(startIndex, startIndex + itemsPerPage);
//     }, [filteredReports, currentPage, itemsPerPage]);

//     // Calculate summary statistics
//     const summaryStats = useMemo(() => {
//         const totalStores = reports.length;
//         const totalInventory = reports.reduce((sum, report) => sum + (parseInt(report.INSTOCK) || 0), 0);
//         const totalValue = reports.reduce((sum, report) => {
//             const cost = parseFloat(report.Cost?.replace(/[^\d.-]/g, '') || '0');
//             const instock = parseInt(report.INSTOCK) || 0;
//             return sum + (cost * instock);
//         }, 0);

//         const activeStores = reports.filter(report =>
//             parseInt(report.INSTOCK) > 0 || parseInt(report['ON TRANSFER']) > 0
//         ).length;

//         return { totalStores, totalInventory, totalValue, activeStores };
//     }, [reports]);

//     // Toggle row expansion for details - SINGLE ROW ONLY
//     const toggleRowExpansion = (id: string) => {
//         if (expandedRow === id) {
//             setExpandedRow(null); // Collapse if same row clicked
//         } else {
//             setExpandedRow(id); // Expand new row
//         }
//     };

//     // Show details modal
//     const showDetails = (report: IASReport) => {
//         setSelectedDetails(report);
//     };

//     // Close details modal
//     const closeDetails = () => {
//         setSelectedDetails(null);
//     };

//     // Hierarchical navigation handlers
//     const handleRegionClick = (region: AggregatedGroup) => {
//         setCurrentData(region.rows);
//         setCurrentView('markets');
//         setSelectedRegion(region.key);
//         setExpandedRow(null); // Reset expansion when changing views
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: region.key },
//         ]);
//     };

//     const handleMarketClick = (market: AggregatedGroup) => {
//         setCurrentData(market.rows);
//         setCurrentView('stores');
//         setSelectedMarket(market.key);
//         setExpandedRow(null); // Reset expansion when changing views
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: selectedRegion },
//             { level: "Stores", selected: market.key },
//         ]);
//     };

//     const handleStoreClick = (store: AggregatedGroup) => {
//         setCurrentData(store.rows);
//         setCurrentView('detailed');
//         setSelectedStore(store.key);
//         setExpandedRow(null); // Reset expansion when changing views
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: selectedRegion },
//             { level: "Stores", selected: selectedMarket },
//             { level: "Detailed", selected: store.key },
//         ]);
//     };

//     const handleBackClick = () => {
//         if (historyStack.length <= 1) {
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
//             } else if (previousLevel.level === "Markets") {
//                 const regions = getRegions(reports);
//                 const regionData = regions[previousLevel.selected!] || [];
//                 setCurrentData(regionData);
//                 setCurrentView('markets');
//                 setSelectedMarket('');
//             } else if (previousLevel.level === "Stores") {
//                 const regions = getRegions(reports);
//                 const regionData = regions[selectedRegion] || [];
//                 const marketData = regionData.filter(report => report.Market === previousLevel.selected);
//                 setCurrentData(marketData);
//                 setCurrentView('stores');
//                 setSelectedStore('');
//             }
//             setExpandedRow(null);
//         }
//     };

//     const renderBreadcrumb = () => {
//         return historyStack.map((item, index) => (
//             <span key={index} className="ias-breadcrumb">
//                 {item.selected ? `${item.level} — ${item.selected}` : item.level}
//                 {index < historyStack.length - 1 && (
//                     <span className="mx-2 text-gray-400">›</span>
//                 )}
//             </span>
//         ));
//     };

//     // Status badge color
//     const getStatusColor = (status: string): string => {
//         const statusColors: { [key: string]: string } = {
//             'new/ regular': 'green',
//             'active': 'green',
//             'inactive': 'red',
//             'pending': 'orange',
//             'completed': 'blue',
//             'closed': 'gray'
//         };

//         const normalizedStatus = status.toLowerCase().trim();
//         return statusColors[normalizedStatus] || 'gray';
//     };

//     // Render hierarchical tables
//     const renderHierarchicalTable = (data: IASReport[], level: string, onRowClick: (group: AggregatedGroup) => void) => {
//         const aggregated = aggregate(data, level);
//         const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);
//         const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

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
//             <div className="ias-table-block">
//                 <div className="ias-table-header">
//                     <h2>{title}</h2>
//                     <div className="ias-meta">
//                         {aggregated.length} groups — total value ${totalCost.toLocaleString()}
//                     </div>
//                 </div>

//                 <div className="ias-table-wrapper">
//                     <table className="ias-table">
//                         <thead>
//                             <tr>
//                                 <th>{title}</th>
//                                 <th className="ias-col-right">Store Count</th>
//                                 <th className="ias-col-right">IN STOCK</th>
//                                 <th className="ias-col-right">Total Inventory</th>
//                                 <th className="ias-col-right">Total Value</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass = pct >= 70 ? "ias-fill-green" : pct >= 40 ? "ias-fill-amber" : "ias-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//                                         <td>{group.key}</td>
//                                         <td className="ias-col-right">{group.count}</td>
//                                         <td className="ias-col-right">{group.instock}</td>
//                                         <td className="ias-col-right">{group.total}</td>
//                                         <td className="ias-col-right">${group.cost.toLocaleString()}</td>
//                                         <td>
//                                             <div className="ias-bar-cell">
//                                                 <div className="ias-bar-track">
//                                                     <div
//                                                         className={`ias-bar-fill ${fillClass}`}
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

//     // Render detailed table - WITHOUT REGION COLUMN
//     const renderDetailedTable = () => {
//         return (
//             <div className="ias-table-block">
//                 <div className="ias-table-header">
//                     <h2>Detailed Report - {selectedStore}</h2>
//                     <div className="ias-meta">
//                         {filteredReports.length} inventory records
//                         {searchTerm && ` for "${searchTerm}"`}
//                     </div>
//                 </div>

//                 {/* Search Box Only */}
//                 <div className="ias-controls-section">
//                     <div className="ias-controls-grid">
//                         <div className="search-box">
//                             <input
//                                 type="text"
//                                 placeholder="Search stores, products, SKU..."
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="search-input"
//                             />
//                             <span className="search-icon">🔍</span>
//                         </div>
//                         <div className="ias-action-buttons">
//                             <button onClick={fetchIASData} className="btn btn-primary">
//                                 🔄 Refresh
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="ias-table-wrapper">
//                     <table className="ias-table">
//                         <thead>
//                             <tr>
//                                 <th>Store</th>
//                                 <th>Market</th>
//                                 <th>Status</th>
//                                 <th>Product</th>
//                                 <th className="ias-col-right">IN STOCK</th>
//                                 <th className="ias-col-right">TOTAL</th>
//                                 <th className="ias-col-right">Cost</th>
//                                 <th className="ias-col-right">Net Worth</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {paginatedReports.map((report, index) => {
//                                 const uniqueId = `${report.ID}-${index}`;
//                                 return (
//                                     <React.Fragment key={uniqueId}>
//                                         <tr className="main-row">
//                                             <td>
//                                                 <div className="store-info">
//                                                     <div className="store-name">{report['Store Name']}</div>
//                                                     <div className="store-id">{report.ID}</div>
//                                                 </div>
//                                             </td>
//                                             <td>{report.Market}</td>
//                                             <td>
//                                                 <span className={`status-indicator status-${getStatusColor(report.Status)}`}>
//                                                     {report.Status}
//                                                 </span>
//                                             </td>
//                                             <td>
//                                                 <div className="product-info">
//                                                     <div className="product-name">{report.Product}</div>
//                                                     <div className="product-sku">SKU: {report.SKU}</div>
//                                                 </div>
//                                             </td>
//                                             <td className={`ias-col-right ${parseInt(report.INSTOCK) > 0 ? 'in-stock' : 'out-of-stock'}`}>
//                                                 {report.INSTOCK}
//                                             </td>
//                                             <td className="ias-col-right">{report.TOTAL}</td>
//                                             <td className="ias-col-right">{report.Cost}</td>
//                                             <td className="ias-col-right">{report['Net Worth']}</td>
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
//                                                 <td colSpan={9}>
//                                                     <div className="detail-panel">
//                                                         <div className="detail-section">
//                                                             <h4>Inventory Details</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>ON TRANSFER:</strong> {report['ON TRANSFER']}</div>
//                                                                 <div><strong>IN Transit:</strong> {report['IN Transit']}</div>
//                                                                 <div><strong>BACKDATED:</strong> {report.BACKDATED}</div>
//                                                                 <div><strong>GROUND:</strong> {report.GROUND}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Sales Performance</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>New Activation:</strong> {report['New Activation']}</div>
//                                                                 <div><strong>SWITCHER:</strong> {report.SWITCHER}</div>
//                                                                 <div><strong>UPGRADE:</strong> {report.UPGRADE}</div>
//                                                                 <div><strong>Performance:</strong> {report['%']}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Shipping & Allocation</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>SUG QTY:</strong> {report['SUG QTY']}</div>
//                                                                 <div><strong>ALLOCATION:</strong> {report.ALLOCATION}</div>
//                                                                 <div><strong>Total ACC Sale:</strong> {report['Total ACC Sale']}</div>
//                                                                 <div><strong>PPD:</strong> {report.PPD}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Store Information</h4>
//                                                             <div className="store-address">{report['Store Address']}</div>
//                                                             <div><strong>Sub Market:</strong> {report['Sub Market']}</div>
//                                                         </div>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         )}
//                                     </React.Fragment>
//                                 );
//                             })}
//                         </tbody>
//                     </table>

//                     {paginatedReports.length === 0 && (
//                         <div className="no-data">
//                             No records found matching your criteria.
//                         </div>
//                     )}
//                 </div>

//                 {/* Pagination */}
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

//     if (isLoading || loading) {
//         return (
//             <div className="app-loading">
//                 <div className="loading-spinner"></div>
//                 <p>Loading...</p>
//             </div>
//         );
//     }

//     if (!isAuthenticated) return null;

//     if (error) {
//         return (
//             <div className="ias-page">
//                 <div className="error-container">
//                     <h2>Error Loading Data</h2>
//                     <p>{error}</p>
//                     <button onClick={fetchIASData} className="retry-btn">
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
//                         <div className="logo">📈</div>
//                         <div className="title">
//                             <div className="main">IAS Reports</div>
//                             <div className="sub">
//                                 Inventory Analytics System - Store Performance
//                             </div>
//                         </div>
//                     </div>
//                 </header>

//                 <main className="main-area">
//                     {/* Controls Section */}
//                     <div className="ias-controls-section">
//                         <div className="ias-controls-grid">
//                             <div className="ias-action-buttons">
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
//                                                             .map((k) => `"${String(r[k as keyof IASReport] || "").replace(/"/g, '""')}"`)
//                                                             .join(",")
//                                                     )
//                                                 )
//                                                 .join("\n");

//                                             const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//                                             const url = URL.createObjectURL(blob);
//                                             const a = document.createElement("a");
//                                             a.href = url;
//                                             a.download = "ias_export.csv";
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
//                                     onClick={fetchIASData}
//                                 >
//                                     Refresh Data
//                                 </button>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Summary Cards */}
//                     <section className="dashboard-grid">
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">🏪</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Stores</h3>
//                                 <p className="card-description">{summaryStats.totalStores}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">📦</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">IN STOCK</h3>
//                                 <p className="card-description">{summaryStats.totalInventory}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">📊</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Inventory</h3>
//                                 <p className="card-description">{summaryStats.totalInventory}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">💰</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Value</h3>
//                                 <p className="card-description">${summaryStats.totalValue.toLocaleString()}</p>
//                             </div>
//                         </div>
//                     </section>

//                     {/* Navigation */}
//                     <div className="ias-nav-row">
//                         <button
//                             className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
//                             onClick={handleBackClick}
//                         >
//                             ← Back
//                         </button>
//                         <div className="ias-breadcrumb">
//                             {renderBreadcrumb()}
//                         </div>
//                     </div>

//                     {/* Hierarchical Views */}
//                     <section className="ias-stacked">
//                         {currentView === "regions" &&
//                             renderHierarchicalTable(currentData, "regions", handleRegionClick)}
//                         {currentView === "markets" &&
//                             renderHierarchicalTable(currentData, "markets", handleMarketClick)}
//                         {currentView === "stores" &&
//                             renderHierarchicalTable(currentData, "stores", handleStoreClick)}
//                         {currentView === "detailed" && renderDetailedTable()}
//                     </section>

//                     {/* Loading State */}
//                     {loading && (
//                         <div className="ias-loading">
//                             <div className="loading-spinner"></div>
//                             <p>Loading IAS data...</p>
//                         </div>
//                     )}

//                     {/* Details Modal */}
//                     {selectedDetails && (
//                         <div className="modal-overlay" onClick={closeDetails}>
//                             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                                 <div className="modal-header">
//                                     <h3>SKU Details - {selectedDetails.SKU}</h3>
//                                     <button className="close-btn" onClick={closeDetails}>×</button>
//                                 </div>
//                                 <div className="modal-body">
//                                     <div className="detail-grid">
//                                         <div><strong>Store:</strong> {selectedDetails['Store Name']}</div>
//                                         <div><strong>Market:</strong> {selectedDetails.Market}</div>
//                                         <div><strong>Model:</strong> {selectedDetails.Model}</div>
//                                         <div><strong>Product:</strong> {selectedDetails.Product}</div>
//                                         <div><strong>Status:</strong>
//                                             <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
//                                                 {selectedDetails.Status}
//                                             </span>
//                                         </div>
//                                         <div><strong>IN STOCK:</strong> {selectedDetails.INSTOCK}</div>
//                                         <div><strong>TOTAL:</strong> {selectedDetails.TOTAL}</div>
//                                         <div><strong>Cost:</strong> {selectedDetails.Cost}</div>
//                                         <div><strong>Net Worth:</strong> {selectedDetails['Net Worth']}</div>
//                                         <div><strong>Address:</strong> {selectedDetails['Store Address']}</div>
//                                         <div><strong>Sub Market:</strong> {selectedDetails['Sub Market']}</div>
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

// app/dashboard/ias/page.tsx
// 'use client';
// import React, { useState, useEffect, useMemo } from 'react';
// import { useAuth } from '../../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import './ias-styles.css';

// interface IASReport {
//     Region: string; // Added Region field
//     Market: string;
//     'Net Worth': string;
//     'Store Name': string;
//     Status: string;
//     SKU: string;
//     Model: string;
//     Product: string;
//     INSTOCK: string;
//     'ON TRANSFER': string;
//     'IN Transit': string;
//     BACKDATED: string;
//     Friday: string;
//     Monday: string;
//     GROUND: string;
//     TOTAL: string;
//     Cost: string;
//     QUOTA: string;
//     '2days': string;
//     LWS: string;
//     L2WS: string;
//     L3WS: string;
//     L4WS: string;
//     L5WS: string;
//     'New Activation': string;
//     SWITCHER: string;
//     UPGRADE: string;
//     '3W ACT': string;
//     '3W UPG': string;
//     '%': string;
//     'SUG QTY': string;
//     'OVERNIGHT QTY': string;
//     '2nd DAY': string;
//     'GROUND QTY': string;
//     ALLOCATION: string;
//     'Total ACC Sale': string;
//     PPD: string;
//     'ACC Per BOX': string;
//     'TOTAL COST': string;
//     '#': string;
//     ID: string;
//     'Store Address': string;
//     'Sub Market': string;
// }

// interface AggregatedGroup {
//     key: string;
//     count: number;
//     instock: number;
//     total: number;
//     cost: number;
//     rows: IASReport[];
// }

// export default function IASReportsPage() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [reports, setReports] = useState<IASReport[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(50);
//     const [expandedRow, setExpandedRow] = useState<string | null>(null); // Single row expansion
//     const [selectedDetails, setSelectedDetails] = useState<IASReport | null>(null);

//     // Hierarchical navigation state
//     const [currentView, setCurrentView] = useState<'regions' | 'markets' | 'stores' | 'detailed'>('regions');
//     const [currentData, setCurrentData] = useState<IASReport[]>([]);
//     const [selectedRegion, setSelectedRegion] = useState<string>('');
//     const [selectedMarket, setSelectedMarket] = useState<string>('');
//     const [selectedStore, setSelectedStore] = useState<string>('');
//     const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([{ level: "Regions" }]);

//     const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK1tiOHJrphkxuRXH6p4i4l-caCCo4dAbNrb8p4TCIHztwB-V2fLK7v2yLNl04Q/pub?gid=2112869718&single=true&output=csv';

//     useEffect(() => {
//         if (!isLoading && !isAuthenticated) {
//             router.push('/login');
//         }
//     }, [isAuthenticated, isLoading, router]);

//     useEffect(() => {
//         if (isAuthenticated) {
//             fetchIASData();
//         }
//     }, [isAuthenticated]);

//     const fetchIASData = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             const response = await fetch(GOOGLE_SHEETS_URL);
//             if (!response.ok) {
//                 throw new Error('Failed to fetch data from Google Sheets');
//             }

//             const csvText = await response.text();
//             const parsedData = parseCSV(csvText);
//             setReports(parsedData);
//             setCurrentData(parsedData);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to load data');
//             console.error('Error fetching IAS data:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const parseCSV = (csvText: string): IASReport[] => {
//         const lines = csvText.split('\n').filter(line => line.trim());
//         if (lines.length < 2) return [];

//         const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

//         return lines.slice(1).map(line => {
//             const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
//             const report: any = {};

//             headers.forEach((header, index) => {
//                 report[header] = values[index] || '';
//             });

//             return report as IASReport;
//         });
//     };

//     // Use the actual Region column from your sheet
//     const getRegions = (data: IASReport[]) => {
//         const regions: { [key: string]: IASReport[] } = {
//             "Aleem Ghori Region": [],
//             "Hasnain Mustaqeem Region": []
//         };

//         // Simply group by the existing Region column
//         data.forEach(report => {
//             const region = report.Region;

//             if (region === "Aleem Ghori Region") {
//                 regions["Aleem Ghori Region"].push(report);
//             } else if (region === "Hasnain Mustaqeem Region") {
//                 regions["Hasnain Mustaqeem Region"].push(report);
//             } else {
//                 // Fallback for any data without region
//                 console.warn('Unknown region:', region, 'for store:', report['Store Name']);
//             }
//         });

//         return regions;
//     };

//     // Aggregate data for hierarchical views
//     const aggregate = (data: IASReport[], level: string): AggregatedGroup[] => {
//         const groups: { [key: string]: AggregatedGroup } = {};

//         if (level === "regions") {
//             const regions = getRegions(data);
//             Object.entries(regions).forEach(([regionName, regionData]) => {
//                 const totalInstock = regionData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = regionData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = regionData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[regionName] = {
//                     key: regionName,
//                     count: regionData.length,
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: regionData
//                 };
//             });
//         } else if (level === "markets") {
//             const markets = Array.from(new Set(data.map(report => report.Market))).filter(m => m && m !== "Unknown");

//             markets.forEach(market => {
//                 const marketData = data.filter(report => report.Market === market);
//                 const totalInstock = marketData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = marketData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = marketData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[market] = {
//                     key: market,
//                     count: marketData.length,
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: marketData
//                 };
//             });
//         } else if (level === "stores") {
//             const stores = Array.from(new Set(data.map(report => report['Store Name']))).filter(s => s && s !== "Unknown");

//             stores.forEach(store => {
//                 const storeData = data.filter(report => report['Store Name'] === store);
//                 const totalInstock = storeData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = storeData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = storeData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[store] = {
//                     key: store,
//                     count: storeData.length,
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: storeData
//                 };
//             });
//         }

//         return Object.values(groups).sort((a, b) => b.cost - a.cost);
//     };

//     // Filter and search logic for detailed view
//     const filteredReports = useMemo(() => {
//         return currentData.filter(report => {
//             const matchesSearch =
//                 report['Store Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['Product']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['SKU']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['ID']?.toLowerCase().includes(searchTerm.toLowerCase());

//             return matchesSearch;
//         });
//     }, [currentData, searchTerm]);

//     // Pagination for detailed view
//     const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
//     const paginatedReports = useMemo(() => {
//         const startIndex = (currentPage - 1) * itemsPerPage;
//         return filteredReports.slice(startIndex, startIndex + itemsPerPage);
//     }, [filteredReports, currentPage, itemsPerPage]);

//     // Calculate summary statistics
//     const summaryStats = useMemo(() => {
//         const totalStores = reports.length;
//         const totalInventory = reports.reduce((sum, report) => sum + (parseInt(report.INSTOCK) || 0), 0);
//         const totalValue = reports.reduce((sum, report) => {
//             const cost = parseFloat(report.Cost?.replace(/[^\d.-]/g, '') || '0');
//             const instock = parseInt(report.INSTOCK) || 0;
//             return sum + (cost * instock);
//         }, 0);

//         const activeStores = reports.filter(report =>
//             parseInt(report.INSTOCK) > 0 || parseInt(report['ON TRANSFER']) > 0
//         ).length;

//         return { totalStores, totalInventory, totalValue, activeStores };
//     }, [reports]);

//     // Toggle row expansion for details - SINGLE ROW ONLY
//     const toggleRowExpansion = (id: string) => {
//         if (expandedRow === id) {
//             setExpandedRow(null); // Collapse if same row clicked
//         } else {
//             setExpandedRow(id); // Expand new row
//         }
//     };

//     // Show details modal
//     const showDetails = (report: IASReport) => {
//         setSelectedDetails(report);
//     };

//     // Close details modal
//     const closeDetails = () => {
//         setSelectedDetails(null);
//     };

//     // Hierarchical navigation handlers
//     const handleRegionClick = (region: AggregatedGroup) => {
//         setCurrentData(region.rows);
//         setCurrentView('markets');
//         setSelectedRegion(region.key);
//         setExpandedRow(null); // Reset expansion when changing views
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: region.key },
//         ]);
//     };

//     const handleMarketClick = (market: AggregatedGroup) => {
//         setCurrentData(market.rows);
//         setCurrentView('stores');
//         setSelectedMarket(market.key);
//         setExpandedRow(null); // Reset expansion when changing views
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: selectedRegion },
//             { level: "Stores", selected: market.key },
//         ]);
//     };

//     const handleStoreClick = (store: AggregatedGroup) => {
//         setCurrentData(store.rows);
//         setCurrentView('detailed');
//         setSelectedStore(store.key);
//         setExpandedRow(null); // Reset expansion when changing views
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: selectedRegion },
//             { level: "Stores", selected: selectedMarket },
//             { level: "Detailed", selected: store.key },
//         ]);
//     };

//     const handleBackClick = () => {
//         if (historyStack.length <= 1) {
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
//             } else if (previousLevel.level === "Markets") {
//                 // Filter by the actual region from the data
//                 const regionData = reports.filter(report => report.Region === previousLevel.selected);
//                 setCurrentData(regionData);
//                 setCurrentView('markets');
//                 setSelectedMarket('');
//             } else if (previousLevel.level === "Stores") {
//                 // Filter by the actual market from the data
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
//             <span key={index} className="ias-breadcrumb">
//                 {item.selected ? `${item.level} — ${item.selected}` : item.level}
//                 {index < historyStack.length - 1 && (
//                     <span className="mx-2 text-gray-400">›</span>
//                 )}
//             </span>
//         ));
//     };

//     // Status badge color
//     const getStatusColor = (status: string): string => {
//         const statusColors: { [key: string]: string } = {
//             'new/ regular': 'green',
//             'active': 'green',
//             'inactive': 'red',
//             'pending': 'orange',
//             'completed': 'blue',
//             'closed': 'gray'
//         };

//         const normalizedStatus = status.toLowerCase().trim();
//         return statusColors[normalizedStatus] || 'gray';
//     };

//     // Render hierarchical tables
//     const renderHierarchicalTable = (data: IASReport[], level: string, onRowClick: (group: AggregatedGroup) => void) => {
//         const aggregated = aggregate(data, level);
//         const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);
//         const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

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
//             <div className="ias-table-block">
//                 <div className="ias-table-header">
//                     <h2>{title}</h2>
//                     <div className="ias-meta">
//                         {aggregated.length} groups — total value ${totalCost.toLocaleString()}
//                     </div>
//                 </div>

//                 <div className="ias-table-wrapper">
//                     <table className="ias-table">
//                         <thead>
//                             <tr>
//                                 <th>{title}</th>
//                                 <th className="ias-col-right">Store Count</th>
//                                 <th className="ias-col-right">IN STOCK</th>
//                                 <th className="ias-col-right">Total Inventory</th>
//                                 <th className="ias-col-right">Total Value</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass = pct >= 70 ? "ias-fill-green" : pct >= 40 ? "ias-fill-amber" : "ias-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//                                         <td>{group.key}</td>
//                                         <td className="ias-col-right">{group.count}</td>
//                                         <td className="ias-col-right">{group.instock}</td>
//                                         <td className="ias-col-right">{group.total}</td>
//                                         <td className="ias-col-right">${group.cost.toLocaleString()}</td>
//                                         <td>
//                                             <div className="ias-bar-cell">
//                                                 <div className="ias-bar-track">
//                                                     <div
//                                                         className={`ias-bar-fill ${fillClass}`}
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

//     // Render detailed table
//     const renderDetailedTable = () => {
//         return (
//             <div className="ias-table-block">
//                 <div className="ias-table-header">
//                     <h2>Detailed Report - {selectedStore}</h2>
//                     <div className="ias-meta">
//                         {filteredReports.length} inventory records
//                         {searchTerm && ` for "${searchTerm}"`}
//                     </div>
//                 </div>

//                 {/* Search Box Only */}
//                 <div className="ias-controls-section">
//                     <div className="ias-controls-grid">
//                         <div className="search-box">
//                             <input
//                                 type="text"
//                                 placeholder="Search stores, products, SKU..."
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="search-input"
//                             />
//                             <span className="search-icon">🔍</span>
//                         </div>
//                         <div className="ias-action-buttons">
//                             <button onClick={fetchIASData} className="btn btn-primary">
//                                 🔄 Refresh
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="ias-table-wrapper">
//                     <table className="ias-table">
//                         <thead>
//                             <tr>
//                                 <th>Store</th>
//                                 <th>Market</th>
//                                 <th>Status</th>
//                                 <th>Product</th>
//                                 <th className="ias-col-right">IN STOCK</th>
//                                 <th className="ias-col-right">TOTAL</th>
//                                 <th className="ias-col-right">Cost</th>
//                                 <th className="ias-col-right">Net Worth</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {paginatedReports.map((report, index) => {
//                                 const uniqueId = `${report.ID}-${index}`;
//                                 return (
//                                     <React.Fragment key={uniqueId}>
//                                         <tr className="main-row">
//                                             <td>
//                                                 <div className="store-info">
//                                                     <div className="store-name">{report['Store Name']}</div>
//                                                     <div className="store-id">{report.ID}</div>
//                                                 </div>
//                                             </td>
//                                             <td>{report.Market}</td>
//                                             <td>
//                                                 <span className={`status-indicator status-${getStatusColor(report.Status)}`}>
//                                                     {report.Status}
//                                                 </span>
//                                             </td>
//                                             <td>
//                                                 <div className="product-info">
//                                                     <div className="product-name">{report.Product}</div>
//                                                     <div className="product-sku">SKU: {report.SKU}</div>
//                                                 </div>
//                                             </td>
//                                             <td className={`ias-col-right ${parseInt(report.INSTOCK) > 0 ? 'in-stock' : 'out-of-stock'}`}>
//                                                 {report.INSTOCK}
//                                             </td>
//                                             <td className="ias-col-right">{report.TOTAL}</td>
//                                             <td className="ias-col-right">{report.Cost}</td>
//                                             <td className="ias-col-right">{report['Net Worth']}</td>
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
//                                                 <td colSpan={9}>
//                                                     <div className="detail-panel">
//                                                         <div className="detail-section">
//                                                             <h4>Inventory Details</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>ON TRANSFER:</strong> {report['ON TRANSFER']}</div>
//                                                                 <div><strong>IN Transit:</strong> {report['IN Transit']}</div>
//                                                                 <div><strong>BACKDATED:</strong> {report.BACKDATED}</div>
//                                                                 <div><strong>GROUND:</strong> {report.GROUND}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Sales Performance</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>New Activation:</strong> {report['New Activation']}</div>
//                                                                 <div><strong>SWITCHER:</strong> {report.SWITCHER}</div>
//                                                                 <div><strong>UPGRADE:</strong> {report.UPGRADE}</div>
//                                                                 <div><strong>Performance:</strong> {report['%']}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Shipping & Allocation</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>SUG QTY:</strong> {report['SUG QTY']}</div>
//                                                                 <div><strong>ALLOCATION:</strong> {report.ALLOCATION}</div>
//                                                                 <div><strong>Total ACC Sale:</strong> {report['Total ACC Sale']}</div>
//                                                                 <div><strong>PPD:</strong> {report.PPD}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Store Information</h4>
//                                                             <div className="store-address">{report['Store Address']}</div>
//                                                             <div><strong>Sub Market:</strong> {report['Sub Market']}</div>
//                                                         </div>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         )}
//                                     </React.Fragment>
//                                 );
//                             })}
//                         </tbody>
//                     </table>

//                     {paginatedReports.length === 0 && (
//                         <div className="no-data">
//                             No records found matching your criteria.
//                         </div>
//                     )}
//                 </div>

//                 {/* Pagination */}
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

//     if (isLoading || loading) {
//         return (
//             <div className="app-loading">
//                 <div className="loading-spinner"></div>
//                 <p>Loading...</p>
//             </div>
//         );
//     }

//     if (!isAuthenticated) return null;

//     if (error) {
//         return (
//             <div className="ias-page">
//                 <div className="error-container">
//                     <h2>Error Loading Data</h2>
//                     <p>{error}</p>
//                     <button onClick={fetchIASData} className="retry-btn">
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
//                         <div className="logo">📈</div>
//                         <div className="title">
//                             <div className="main">IAS Reports</div>
//                             <div className="sub">
//                                 Inventory Analytics System - Store Performance
//                             </div>
//                         </div>
//                     </div>
//                 </header>

//                 <main className="main-area">
//                     {/* Controls Section */}
//                     <div className="ias-controls-section">
//                         <div className="ias-controls-grid">
//                             <div className="ias-action-buttons">
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
//                                                             .map((k) => `"${String(r[k as keyof IASReport] || "").replace(/"/g, '""')}"`)
//                                                             .join(",")
//                                                     )
//                                                 )
//                                                 .join("\n");

//                                             const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//                                             const url = URL.createObjectURL(blob);
//                                             const a = document.createElement("a");
//                                             a.href = url;
//                                             a.download = "ias_export.csv";
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
//                                     onClick={fetchIASData}
//                                 >
//                                     Refresh Data
//                                 </button>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Summary Cards */}
//                     <section className="dashboard-grid">
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">🏪</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Stores</h3>
//                                 <p className="card-description">{summaryStats.totalStores}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">📦</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">IN STOCK</h3>
//                                 <p className="card-description">{summaryStats.totalInventory}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">📊</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Inventory</h3>
//                                 <p className="card-description">{summaryStats.totalInventory}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">💰</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Value</h3>
//                                 <p className="card-description">${summaryStats.totalValue.toLocaleString()}</p>
//                             </div>
//                         </div>
//                     </section>

//                     {/* Navigation */}
//                     <div className="ias-nav-row">
//                         <button
//                             className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
//                             onClick={handleBackClick}
//                         >
//                             ← Back
//                         </button>
//                         <div className="ias-breadcrumb">
//                             {renderBreadcrumb()}
//                         </div>
//                     </div>

//                     {/* Hierarchical Views */}
//                     <section className="ias-stacked">
//                         {currentView === "regions" &&
//                             renderHierarchicalTable(currentData, "regions", handleRegionClick)}
//                         {currentView === "markets" &&
//                             renderHierarchicalTable(currentData, "markets", handleMarketClick)}
//                         {currentView === "stores" &&
//                             renderHierarchicalTable(currentData, "stores", handleStoreClick)}
//                         {currentView === "detailed" && renderDetailedTable()}
//                     </section>

//                     {/* Loading State */}
//                     {loading && (
//                         <div className="ias-loading">
//                             <div className="loading-spinner"></div>
//                             <p>Loading IAS data...</p>
//                         </div>
//                     )}

//                     {/* Details Modal */}
//                     {selectedDetails && (
//                         <div className="modal-overlay" onClick={closeDetails}>
//                             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                                 <div className="modal-header">
//                                     <h3>SKU Details - {selectedDetails.SKU}</h3>
//                                     <button className="close-btn" onClick={closeDetails}>×</button>
//                                 </div>
//                                 <div className="modal-body">
//                                     <div className="detail-grid">
//                                         <div><strong>Store:</strong> {selectedDetails['Store Name']}</div>
//                                         <div><strong>Market:</strong> {selectedDetails.Market}</div>
//                                         <div><strong>Model:</strong> {selectedDetails.Model}</div>
//                                         <div><strong>Product:</strong> {selectedDetails.Product}</div>
//                                         <div><strong>Status:</strong>
//                                             <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
//                                                 {selectedDetails.Status}
//                                             </span>
//                                         </div>
//                                         <div><strong>IN STOCK:</strong> {selectedDetails.INSTOCK}</div>
//                                         <div><strong>TOTAL:</strong> {selectedDetails.TOTAL}</div>
//                                         <div><strong>Cost:</strong> {selectedDetails.Cost}</div>
//                                         <div><strong>Net Worth:</strong> {selectedDetails['Net Worth']}</div>
//                                         <div><strong>Address:</strong> {selectedDetails['Store Address']}</div>
//                                         <div><strong>Sub Market:</strong> {selectedDetails['Sub Market']}</div>
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

// // app/dashboard/ias/page.tsx
// 'use client';
// import React, { useState, useEffect, useMemo } from 'react';
// import { useAuth } from '../../../components/AuthProvider';
// import { useRouter } from 'next/navigation';
// import './ias-styles.css';

// interface IASReport {
//     Region: string;
//     Market: string;
//     'Net Worth': string;
//     'Store Name': string;
//     Status: string;
//     SKU: string;
//     Model: string;
//     Product: string;
//     INSTOCK: string;
//     'ON TRANSFER': string;
//     'IN Transit': string;
//     BACKDATED: string;
//     Friday: string;
//     Monday: string;
//     GROUND: string;
//     TOTAL: string;
//     Cost: string;
//     QUOTA: string;
//     '2days': string;
//     LWS: string;
//     L2WS: string;
//     L3WS: string;
//     L4WS: string;
//     L5WS: string;
//     'New Activation': string;
//     SWITCHER: string;
//     UPGRADE: string;
//     '3W ACT': string;
//     '3W UPG': string;
//     '%': string;
//     'SUG QTY': string;
//     'OVERNIGHT QTY': string;
//     '2nd DAY': string;
//     'GROUND QTY': string;
//     ALLOCATION: string;
//     'Total ACC Sale': string;
//     PPD: string;
//     'ACC Per BOX': string;
//     'TOTAL COST': string;
//     '#': string;
//     ID: string;
//     'Store Address': string;
//     'Sub Market': string;
//     Date?: string;
// }

// interface AggregatedGroup {
//     key: string;
//     count: number;
//     instock: number;
//     total: number;
//     cost: number;
//     rows: IASReport[];
// }

// export default function IASReportsPage() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [reports, setReports] = useState<IASReport[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage] = useState(50);
//     const [expandedRow, setExpandedRow] = useState<string | null>(null);
//     const [selectedDetails, setSelectedDetails] = useState<IASReport | null>(null);

//     const [dateFilter, setDateFilter] = useState({
//         startDate: '',
//         endDate: ''
//     });

//     const [currentView, setCurrentView] = useState<'regions' | 'markets' | 'stores' | 'detailed'>('regions');
//     const [currentData, setCurrentData] = useState<IASReport[]>([]);
//     const [selectedRegion, setSelectedRegion] = useState<string>('');
//     const [selectedMarket, setSelectedMarket] = useState<string>('');
//     const [selectedStore, setSelectedStore] = useState<string>('');
//     const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([{ level: "Regions" }]);

//     const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK1tiOHJrphkxuRXH6p4i4l-caCCo4dAbNrb8p4TCIHztwB-V2fLK7v2yLNl04Q/pub?gid=2112869718&single=true&output=csv';

//     useEffect(() => {
//         if (!isLoading && !isAuthenticated) {
//             router.push('/login');
//         }
//     }, [isAuthenticated, isLoading, router]);

//     useEffect(() => {
//         if (isAuthenticated) {
//             fetchIASData();
//         }
//     }, [isAuthenticated]);

//     const fetchIASData = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             const response = await fetch(GOOGLE_SHEETS_URL);
//             if (!response.ok) {
//                 throw new Error('Failed to fetch data from Google Sheets');
//             }

//             const csvText = await response.text();
//             const parsedData = parseCSV(csvText);
//             setReports(parsedData);
//             setCurrentData(parsedData);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : 'Failed to load data');
//             console.error('Error fetching IAS data:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const parseCSV = (csvText: string): IASReport[] => {
//         const lines = csvText.split('\n').filter(line => line.trim());
//         if (lines.length < 2) return [];

//         const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

//         return lines.slice(1).map(line => {
//             const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
//             const report: any = {};

//             headers.forEach((header, index) => {
//                 report[header] = values[index] || '';
//             });

//             return report as IASReport;
//         });
//     };

//     const getRegions = (data: IASReport[]) => {
//         const regions: { [key: string]: IASReport[] } = {
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

//     const getUniqueStoreCount = (data: IASReport[]): number => {
//         const uniqueStores = new Set(data.map(report => report['Store Name']));
//         return uniqueStores.size;
//     };

//     const filterByDate = (data: IASReport[]): IASReport[] => {
//         if (!dateFilter.startDate && !dateFilter.endDate) {
//             return data;
//         }

//         return data.filter(report => {
//             const reportDate = report.Date || '';
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

//     const aggregate = (data: IASReport[], level: string): AggregatedGroup[] => {
//         const groups: { [key: string]: AggregatedGroup } = {};

//         if (level === "regions") {
//             const regions = getRegions(data);
//             Object.entries(regions).forEach(([regionName, regionData]) => {
//                 const totalInstock = regionData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = regionData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = regionData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[regionName] = {
//                     key: regionName,
//                     count: getUniqueStoreCount(regionData),
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: regionData
//                 };
//             });
//         } else if (level === "markets") {
//             const markets = Array.from(new Set(data.map(report => report.Market))).filter(m => m && m !== "Unknown");

//             markets.forEach(market => {
//                 const marketData = data.filter(report => report.Market === market);
//                 const totalInstock = marketData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = marketData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = marketData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[market] = {
//                     key: market,
//                     count: getUniqueStoreCount(marketData),
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: marketData
//                 };
//             });
//         } else if (level === "stores") {
//             const stores = Array.from(new Set(data.map(report => report['Store Name']))).filter(s => s && s !== "Unknown");

//             stores.forEach(store => {
//                 const storeData = data.filter(report => report['Store Name'] === store);
//                 const totalInstock = storeData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
//                 const totalInventory = storeData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
//                 const totalCost = storeData.reduce((sum, row) => {
//                     const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
//                     return sum + cost;
//                 }, 0);

//                 groups[store] = {
//                     key: store,
//                     count: 1,
//                     instock: totalInstock,
//                     total: totalInventory,
//                     cost: totalCost,
//                     rows: storeData
//                 };
//             });
//         }

//         return Object.values(groups).sort((a, b) => b.cost - a.cost);
//     };

//     const filteredByDateData = useMemo(() => {
//         return filterByDate(currentData);
//     }, [currentData, dateFilter]);

//     const filteredReports = useMemo(() => {
//         return filteredByDateData.filter(report => {
//             const matchesSearch =
//                 report['Store Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['Product']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['SKU']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 report['ID']?.toLowerCase().includes(searchTerm.toLowerCase());

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
//         const totalInventory = reports.reduce((sum, report) => sum + (parseInt(report.INSTOCK) || 0), 0);
//         const totalValue = reports.reduce((sum, report) => {
//             const cost = parseFloat(report.Cost?.replace(/[^\d.-]/g, '') || '0');
//             const instock = parseInt(report.INSTOCK) || 0;
//             return sum + (cost * instock);
//         }, 0);

//         const activeStores = new Set(
//             reports.filter(report =>
//                 parseInt(report.INSTOCK) > 0 || parseInt(report['ON TRANSFER']) > 0
//             ).map(report => report['Store Name'])
//         ).size;

//         return { totalStores, totalInventory, totalValue, activeStores };
//     }, [reports]);

//     const toggleRowExpansion = (id: string) => {
//         if (expandedRow === id) {
//             setExpandedRow(null);
//         } else {
//             setExpandedRow(id);
//         }
//     };

//     const showDetails = (report: IASReport) => {
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
//         setCurrentData(market.rows);
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
//         setCurrentData(store.rows);
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

//     const handleBackClick = () => {
//         if (historyStack.length <= 1) {
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
//             } else if (previousLevel.level === "Markets") {
//                 const regionData = reports.filter(report => report.Region === previousLevel.selected);
//                 setCurrentData(regionData);
//                 setCurrentView('markets');
//                 setSelectedMarket('');
//             } else if (previousLevel.level === "Stores") {
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
//             <span key={index} className="ias-breadcrumb">
//                 {item.selected ? `${item.level} — ${item.selected}` : item.level}
//                 {index < historyStack.length - 1 && (
//                     <span className="mx-2 text-gray-400">›</span>
//                 )}
//             </span>
//         ));
//     };

//     const getStatusColor = (status: string): string => {
//         const statusColors: { [key: string]: string } = {
//             'new/ regular': 'green',
//             'active': 'green',
//             'inactive': 'red',
//             'pending': 'orange',
//             'completed': 'blue',
//             'closed': 'gray'
//         };

//         const normalizedStatus = status.toLowerCase().trim();
//         return statusColors[normalizedStatus] || 'gray';
//     };

//     const renderDateFilters = () => (
//         <div className="ias-date-filters">
//             <div className="filter-group">
//                 <label>Start Date:</label>
//                 <input
//                     type="date"
//                     value={dateFilter.startDate}
//                     onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
//                     className="ias-input"
//                 />
//             </div>
//             <div className="filter-group">
//                 <label>End Date:</label>
//                 <input
//                     type="date"
//                     value={dateFilter.endDate}
//                     onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
//                     className="ias-input"
//                 />
//             </div>
//             {(dateFilter.startDate || dateFilter.endDate) && (
//                 <button onClick={clearDateFilters} className="btn btn-secondary">
//                     Clear Dates
//                 </button>
//             )}
//         </div>
//     );

//     const renderHierarchicalTable = (data: IASReport[], level: string, onRowClick: (group: AggregatedGroup) => void) => {
//         const aggregated = aggregate(data, level);
//         const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);
//         const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

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
//             <div className="ias-table-block">
//                 <div className="ias-table-header">
//                     <h2>{title}</h2>
//                     <div className="ias-meta">
//                         {aggregated.length} groups — {getUniqueStoreCount(data)} unique stores — total value ${totalCost.toLocaleString()}
//                     </div>
//                 </div>

//                 <div className="ias-table-wrapper">
//                     <table className="ias-table">
//                         <thead>
//                             <tr>
//                                 <th>{title}</th>
//                                 <th className="ias-col-right">Store Count</th>
//                                 <th className="ias-col-right">IN STOCK</th>
//                                 <th className="ias-col-right">Total Inventory</th>
//                                 <th className="ias-col-right">Total Value</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {/* {
//                                 "Cost": "$948.99",
//                                 "INSTOCK": 3,
//                                 // Total Value = $948.99 × 3 = $2,846.97
//                                 // }
//                             */}
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass = pct >= 70 ? "ias-fill-green" : pct >= 40 ? "ias-fill-amber" : "ias-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
//                                         <td>{group.key}</td>
//                                         <td className="ias-col-right">{group.count}</td>
//                                         <td className="ias-col-right">{group.instock}</td>
//                                         <td className="ias-col-right">{group.total}</td>
//                                         <td className="ias-col-right">${group.cost.toLocaleString()}</td>
//                                         <td>
//                                             <div className="ias-bar-cell">
//                                                 <div className="ias-bar-track">
//                                                     <div
//                                                         className={`ias-bar-fill ${fillClass}`}
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
//         return (
//             <div className="ias-table-block">
//                 <div className="ias-table-header">
//                     <h2>Detailed Report - {selectedStore}</h2>
//                     <div className="ias-meta">
//                         {filteredReports.length} inventory records
//                         {searchTerm && ` for "${searchTerm}"`}
//                         {(dateFilter.startDate || dateFilter.endDate) && ' (date filtered)'}
//                     </div>
//                 </div>

//                 <div className="ias-controls-section">
//                     <div className="ias-controls-grid">
//                         <div className="search-box">
//                             <input
//                                 type="text"
//                                 placeholder="Search stores, products, SKU..."
//                                 value={searchTerm}
//                                 onChange={(e) => setSearchTerm(e.target.value)}
//                                 className="search-input"
//                             />
//                             <span className="search-icon">🔍</span>
//                         </div>
//                         <div className="ias-action-buttons">
//                             {/* Refresh button removed from detailed view */}
//                         </div>
//                     </div>
//                     {renderDateFilters()}
//                 </div>

//                 <div className="ias-table-wrapper">
//                     <table className="ias-table">
//                         <thead>
//                             <tr>
//                                 <th>Store</th>
//                                 <th>Market</th>
//                                 <th>Status</th>
//                                 <th>Product</th>
//                                 <th className="ias-col-right">IN STOCK</th>
//                                 <th className="ias-col-right">TOTAL</th>
//                                 <th className="ias-col-right">Cost</th>
//                                 <th className="ias-col-right">Net Worth</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {paginatedReports.map((report, index) => {
//                                 const uniqueId = `${report.ID}-${index}`;
//                                 return (
//                                     <React.Fragment key={uniqueId}>
//                                         <tr className="main-row">
//                                             <td>
//                                                 <div className="store-info">
//                                                     <div className="store-name">{report['Store Name']}</div>
//                                                     <div className="store-id">{report.ID}</div>
//                                                 </div>
//                                             </td>
//                                             <td>{report.Market}</td>
//                                             <td>
//                                                 <span className={`status-indicator status-${getStatusColor(report.Status)}`}>
//                                                     {report.Status}
//                                                 </span>
//                                             </td>
//                                             <td>
//                                                 <div className="product-info">
//                                                     <div className="product-name">{report.Product}</div>
//                                                     <div className="product-sku">SKU: {report.SKU}</div>
//                                                 </div>
//                                             </td>
//                                             <td className={`ias-col-right ${parseInt(report.INSTOCK) > 0 ? 'in-stock' : 'out-of-stock'}`}>
//                                                 {report.INSTOCK}
//                                             </td>
//                                             <td className="ias-col-right">{report.TOTAL}</td>
//                                             <td className="ias-col-right">{report.Cost}</td>
//                                             <td className="ias-col-right">{report['Net Worth']}</td>
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
//                                                 <td colSpan={9}>
//                                                     <div className="detail-panel">
//                                                         <div className="detail-section">
//                                                             <h4>Inventory Details</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>ON TRANSFER:</strong> {report['ON TRANSFER']}</div>
//                                                                 <div><strong>IN Transit:</strong> {report['IN Transit']}</div>
//                                                                 <div><strong>BACKDATED:</strong> {report.BACKDATED}</div>
//                                                                 <div><strong>GROUND:</strong> {report.GROUND}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Sales Performance</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>New Activation:</strong> {report['New Activation']}</div>
//                                                                 <div><strong>SWITCHER:</strong> {report.SWITCHER}</div>
//                                                                 <div><strong>UPGRADE:</strong> {report.UPGRADE}</div>
//                                                                 <div><strong>Performance:</strong> {report['%']}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Shipping & Allocation</h4>
//                                                             <div className="detail-grid">
//                                                                 <div><strong>SUG QTY:</strong> {report['SUG QTY']}</div>
//                                                                 <div><strong>ALLOCATION:</strong> {report.ALLOCATION}</div>
//                                                                 <div><strong>Total ACC Sale:</strong> {report['Total ACC Sale']}</div>
//                                                                 <div><strong>PPD:</strong> {report.PPD}</div>
//                                                             </div>
//                                                         </div>

//                                                         <div className="detail-section">
//                                                             <h4>Store Information</h4>
//                                                             <div className="store-address">{report['Store Address']}</div>
//                                                             <div><strong>Sub Market:</strong> {report['Sub Market']}</div>
//                                                         </div>
//                                                     </div>
//                                                 </td>
//                                             </tr>
//                                         )}
//                                     </React.Fragment>
//                                 );
//                             })}
//                         </tbody>
//                     </table>

//                     {paginatedReports.length === 0 && (
//                         <div className="no-data">
//                             No records found matching your criteria.
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

//     if (isLoading || loading) {
//         return (
//             <div className="app-loading">
//                 <div className="loading-spinner"></div>
//                 <p>Loading...</p>
//             </div>
//         );
//     }

//     if (!isAuthenticated) return null;

//     if (error) {
//         return (
//             <div className="ias-page">
//                 <div className="error-container">
//                     <h2>Error Loading Data</h2>
//                     <p>{error}</p>
//                     <button onClick={fetchIASData} className="retry-btn">
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
//                         <div className="logo">📈</div>
//                         <div className="title">
//                             <div className="main">IAS Report</div>
//                             <div className="sub">
//                                 Inventory Analytics System - Store Performance
//                             </div>
//                         </div>
//                     </div>
//                 </header>

//                 <main className="main-area">

//                     <div className="ias-controls-section">
//                         <div className="ias-controls-grid">
//                             <div className="ias-action-buttons">
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
//                                                             .map((k) => `"${String(r[k as keyof IASReport] || "").replace(/"/g, '""')}"`)
//                                                             .join(",")
//                                                     )
//                                                 )
//                                                 .join("\n");

//                                             const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//                                             const url = URL.createObjectURL(blob);
//                                             const a = document.createElement("a");
//                                             a.href = url;
//                                             a.download = "ias_export.csv";
//                                             document.body.appendChild(a);
//                                             a.click();
//                                             document.body.removeChild(a);
//                                             URL.revokeObjectURL(url);
//                                         }
//                                     }}
//                                 >
//                                     Export CSV
//                                 </button>
//                             </div>
//                             <div className="ias-date-filters">
//                                 <div className="filter-group">

//                                     <input
//                                         type="date"
//                                         value={dateFilter.startDate}
//                                         onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
//                                         className="ias-input"
//                                     />
//                                 </div>
//                                 <div className="filter-group">

//                                     <input
//                                         type="date"
//                                         value={dateFilter.endDate}
//                                         onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
//                                         className="ias-input"
//                                     />
//                                 </div>
//                                 <button
//                                     onClick={() => { }} // Filters apply automatically
//                                     className="btn btn-primary"
//                                 >
//                                     Apply Filters
//                                 </button>
//                                 {(dateFilter.startDate || dateFilter.endDate) && (
//                                     <button onClick={clearDateFilters} className="btn btn-secondary">
//                                         Clear Dates
//                                     </button>
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     <section className="dashboard-grid">
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">🏪</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Stores</h3>
//                                 <p className="card-description">{summaryStats.totalStores}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">📦</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">IN STOCK</h3>
//                                 <p className="card-description">{summaryStats.totalInventory}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">📊</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Inventory</h3>
//                                 <p className="card-description">{summaryStats.totalInventory}</p>
//                             </div>
//                         </div>
//                         <div className="dashboard-card card-purple">
//                             <div className="card-icon">💰</div>
//                             <div className="card-content">
//                                 <h3 className="card-title">Total Value</h3>
//                                 <p className="card-description">${summaryStats.totalValue.toLocaleString()}</p>
//                             </div>
//                         </div>
//                     </section>

//                     <div className="ias-nav-row">
//                         <button
//                             className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
//                             onClick={handleBackClick}
//                         >
//                             ← Back
//                         </button>

//                     </div>

//                     <section className="ias-stacked">
//                         {currentView === "regions" &&
//                             renderHierarchicalTable(currentData, "regions", handleRegionClick)}
//                         {currentView === "markets" &&
//                             renderHierarchicalTable(currentData, "markets", handleMarketClick)}
//                         {currentView === "stores" &&
//                             renderHierarchicalTable(currentData, "stores", handleStoreClick)}
//                         {currentView === "detailed" && renderDetailedTable()}
//                     </section>

//                     {loading && (
//                         <div className="ias-loading">
//                             <div className="loading-spinner"></div>
//                             <p>Loading IAS data...</p>
//                         </div>
//                     )}

//                     {selectedDetails && (
//                         <div className="modal-overlay" onClick={closeDetails}>
//                             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                                 <div className="modal-header">
//                                     <h3>SKU Details - {selectedDetails.SKU}</h3>
//                                     <button className="close-btn" onClick={closeDetails}>×</button>
//                                 </div>
//                                 <div className="modal-body">
//                                     <div className="detail-grid">
//                                         <div><strong>Store:</strong> {selectedDetails['Store Name']}</div>
//                                         <div><strong>Market:</strong> {selectedDetails.Market}</div>
//                                         <div><strong>Model:</strong> {selectedDetails.Model}</div>
//                                         <div><strong>Product:</strong> {selectedDetails.Product}</div>
//                                         <div><strong>Status:</strong>
//                                             <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
//                                                 {selectedDetails.Status}
//                                             </span>
//                                         </div>
//                                         <div><strong>IN STOCK:</strong> {selectedDetails.INSTOCK}</div>
//                                         <div><strong>TOTAL:</strong> {selectedDetails.TOTAL}</div>
//                                         <div><strong>Cost:</strong> {selectedDetails.Cost}</div>
//                                         <div><strong>Net Worth:</strong> {selectedDetails['Net Worth']}</div>
//                                         <div><strong>Address:</strong> {selectedDetails['Store Address']}</div>
//                                         <div><strong>Sub Market:</strong> {selectedDetails['Sub Market']}</div>
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

// "use client";
// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { useAuth } from "../../../components/AuthProvider";
// import { useRouter } from "next/navigation";
// import "./ias-styles.css";

// interface IASReport {
//   Region: string;
//   Market: string;
//   "Net Worth": string;
//   "Store Name": string;
//   Status: string;
//   SKU: string;
//   Model: string;
//   Product: string;
//   INSTOCK: string;
//   "ON TRANSFER": string;
//   "IN Transit": string;
//   BACKDATED: string;
//   Friday: string;
//   Monday: string;
//   GROUND: string;
//   TOTAL: string;
//   Cost: string;
//   QUOTA: string;
//   "2days": string;
//   LWS: string;
//   L2WS: string;
//   L3WS: string;
//   L4WS: string;
//   L5WS: string;
//   "New Activation": string;
//   SWITCHER: string;
//   UPGRADE: string;
//   "3W ACT": string;
//   "3W UPG": string;
//   "%": string;
//   "SUG QTY": string;
//   "OVERNIGHT QTY": string;
//   "2nd DAY": string;
//   "GROUND QTY": string;
//   ALLOCATION: string;
//   "Total ACC Sale": string;
//   PPD: string;
//   "ACC Per BOX": string;
//   "TOTAL COST": string;
//   "#": string;
//   ID: string;
//   "Store Address": string;
//   "Sub Market": string;
// }

// interface AggregatedGroup {
//   key: string;
//   count: number;
//   instock: number;
//   total: number;
//   cost: number;
//   rows: IASReport[];
// }

// export default function IASReportsPage() {
//   const { isAuthenticated, isLoading } = useAuth();
//   const router = useRouter();
//   const [reports, setReports] = useState<IASReport[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(50);
//   const [expandedRow, setExpandedRow] = useState<string | null>(null);
//   const [selectedDetails, setSelectedDetails] = useState<IASReport | null>(
//     null
//   );

//   const [currentView, setCurrentView] = useState<
//     "regions" | "markets" | "stores" | "detailed"
//   >("regions");
//   const [currentData, setCurrentData] = useState<IASReport[]>([]);
//   const [selectedRegion, setSelectedRegion] = useState<string>("");
//   const [selectedMarket, setSelectedMarket] = useState<string>("");
//   const [selectedStore, setSelectedStore] = useState<string>("");
//   const [historyStack, setHistoryStack] = useState<
//     { level: string; selected?: string }[]
//   >([{ level: "Regions" }]);

//   const GOOGLE_SHEETS_URL =
//     "https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK1tiOHJrphkxuRXH6p4i4l-caCCo4dAbNrb8p4TCIHztwB-V2fLK7v2yLNl04Q/pub?gid=2112869718&single=true&output=csv";

//   useEffect(() => {
//     if (!isLoading && !isAuthenticated) {
//       router.push("/login");
//     }
//   }, [isAuthenticated, isLoading, router]);

//   useEffect(() => {
//     if (isAuthenticated) {
//       fetchIASData();
//     }
//   }, [isAuthenticated]);

//   // Enhanced currency parsing
//   const parseCurrency = useCallback((v: any): number => {
//     if (v == null || v === "" || v === undefined || v === "0") {
//       console.log("Empty/zero value detected:", v);
//       return 0;
//     }

//     const str = String(v).trim();
//     console.log("Parsing currency value:", { original: v, trimmed: str });

//     if (
//       str === "" ||
//       str === "-" ||
//       str === "N/A" ||
//       str === "null" ||
//       str === " " ||
//       str === "0"
//     ) {
//       return 0;
//     }

//     const cleaned = str
//       .replace(/\$/g, "")
//       .replace(/,/g, "")
//       .replace(/\s+/g, "")
//       .replace(/[^\d.-]/g, "");

//     console.log("Cleaned value:", cleaned);

//     const parts = cleaned.split(".");
//     let finalNumber = parts[0];
//     if (parts.length > 1) {
//       finalNumber += "." + parts.slice(1).join("");
//     }

//     const n = parseFloat(finalNumber);

//     console.log("Final parsed number:", n);

//     if (isNaN(n)) {
//       console.warn("Failed to parse currency:", {
//         original: v,
//         cleaned,
//         finalNumber,
//       });
//       return 0;
//     }

//     return n;
//   }, []);

//   const calculateTotalCost = useCallback(
//     (report: IASReport): number => {
//       const totalCost = parseCurrency(report["Cost"]);

//       // If TOTAL COST is empty/zero, calculate it from INSTOCK * Cost
//       if (totalCost === 0) {
//         const instock = parseInt(report.INSTOCK) || 0;
//         const cost = parseCurrency(report.Cost) || 0;
//         const calculated = instock * cost;

//         if (calculated > 0) {
//           console.log("Calculated total cost:", {
//             store: report["Store Name"],
//             instock,
//             cost,
//             calculated,
//           });
//           return calculated;
//         }
//       }

//       return totalCost;
//     },
//     [parseCurrency]
//   );

//   // FIXED: Robust CSV parsing that handles commas in fields
//   const parseCSV = useCallback((csvText: string): IASReport[] => {
//     try {
//       console.log("Starting CSV parsing...");

//       // Clean the text
//       const cleanText = csvText.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "");
//       const lines = cleanText
//         .split("\n")
//         .filter((line) => line.trim().length > 0);

//       console.log(`Total lines: ${lines.length}`);

//       if (lines.length < 2) {
//         console.warn("CSV has insufficient lines");
//         return [];
//       }

//       // Parse headers with proper CSV parsing
//       const headerLine = lines[0];
//       const headers: string[] = [];
//       let currentHeader = "";
//       let inQuotes = false;

//       for (let i = 0; i < headerLine.length; i++) {
//         const char = headerLine[i];
//         if (char === '"') {
//           inQuotes = !inQuotes;
//         } else if (char === "," && !inQuotes) {
//           headers.push(currentHeader.trim().replace(/"/g, ""));
//           currentHeader = "";
//         } else {
//           currentHeader += char;
//         }
//       }
//       headers.push(currentHeader.trim().replace(/"/g, ""));

//       console.log("Headers found:", headers);
//       console.log("Number of headers:", headers.length);

//       const data: IASReport[] = [];
//       let skippedRows = 0;
//       let processedRows = 0;

//       // Process data rows with proper CSV parsing
//       for (let i = 1; i < lines.length; i++) {
//         const line = lines[i].trim();
//         if (!line) continue;

//         const values: string[] = [];
//         let currentValue = "";
//         let inQuotes = false;

//         for (let j = 0; j < line.length; j++) {
//           const char = line[j];
//           if (char === '"') {
//             inQuotes = !inQuotes;
//           } else if (char === "," && !inQuotes) {
//             values.push(currentValue.trim().replace(/"/g, ""));
//             currentValue = "";
//           } else {
//             currentValue += char;
//           }
//         }
//         values.push(currentValue.trim().replace(/"/g, ""));

//         // Handle rows with different column counts by truncating or padding
//         const processedValues = [...values];
//         if (processedValues.length > headers.length) {
//           // Truncate extra columns
//           processedValues.length = headers.length;
//         } else if (processedValues.length < headers.length) {
//           // Pad missing columns with empty strings
//           while (processedValues.length < headers.length) {
//             processedValues.push("");
//           }
//         }

//         const obj: any = {};
//         let hasData = false;

//         headers.forEach((header, index) => {
//           const value = processedValues[index] || "";
//           obj[header] = value;
//           if (value && value !== "") {
//             hasData = true;
//           }
//         });

//         // Only add rows that have actual data in key columns
//         const hasKeyData =
//           obj["Store Name"] &&
//           obj["Store Name"] !== "" &&
//           obj["Market"] &&
//           obj["Market"] !== "";

//         if (hasKeyData) {
//           data.push(obj as IASReport);
//           processedRows++;
//         } else {
//           skippedRows++;
//           if (skippedRows <= 5) {
//             // Only log first few skipped rows
//             console.warn(`Skipping row ${i} - missing key data:`, {
//               store: obj["Store Name"],
//               market: obj["Market"],
//               instock: obj["INSTOCK"],
//             });
//           }
//         }
//       }

//       console.log(
//         `Parsing complete: ${processedRows} valid rows, ${skippedRows} skipped rows`
//       );

//       if (data.length > 0) {
//         console.log("First parsed row:", data[0]);
//         console.log("Sample values from first row:", {
//           "Store Name": data[0]["Store Name"],
//           INSTOCK: data[0]["INSTOCK"],
//           "TOTAL COST": data[0]["TOTAL COST"],
//           Region: data[0]["Region"],
//           Market: data[0]["Market"],
//         });
//       }

//       return data;
//     } catch (parseError) {
//       console.error("Error parsing CSV:", parseError);
//       return [];
//     }
//   }, []);

//   // Enhanced data fetching
//   const fetchIASData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       console.log("Starting IAS data fetch...");

//       const response = await fetch(GOOGLE_SHEETS_URL);
//       if (!response.ok) {
//         throw new Error(
//           `Failed to fetch data from Google Sheets: ${response.status} ${response.statusText}`
//         );
//       }

//       const csvText = await response.text();

//       if (!csvText || csvText.trim().length === 0) {
//         throw new Error("Empty response from server");
//       }

//       console.log("Raw CSV text length:", csvText.length);

//       const parsedData = parseCSV(csvText);

//       if (parsedData.length === 0) {
//         throw new Error(
//           "No valid data could be parsed from the CSV. Check console for details."
//         );
//       }

//       console.log(`Successfully parsed ${parsedData.length} rows`);

//       // Debug: Check first few rows for data
//       parsedData.slice(0, 3).forEach((row, index) => {
//         console.log(`Row ${index}:`, {
//           store: row["Store Name"],
//           market: row["Market"],
//           instock: row["INSTOCK"],
//           totalCost: row["TOTAL COST"],
//           region: row["Region"],
//         });
//       });

//       setReports(parsedData);
//       setCurrentData(parsedData);
//     } catch (err) {
//       const errorMessage =
//         err instanceof Error ? err.message : "Failed to load data";
//       setError(errorMessage);
//       console.error("Error fetching IAS data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getRegions = (data: IASReport[]) => {
//     const regions: { [key: string]: IASReport[] } = {
//       "Aleem Ghori Region": [],
//       "Hasnain Mustaqeem Region": [],
//     };

//     console.log("Getting regions from data...");

//     data.forEach((report) => {
//       const region = report.Region;

//       if (region === "Aleem Ghori Region") {
//         regions["Aleem Ghori Region"].push(report);
//       } else if (region === "Hasnain Mustaqeem Region") {
//         regions["Hasnain Mustaqeem Region"].push(report);
//       } else if (region && region !== "") {
//         // If region has a value but doesn't match expected, log it but still assign
//         console.warn(
//           "Unexpected region:",
//           region,
//           "for store:",
//           report["Store Name"]
//         );
//         regions["Aleem Ghori Region"].push(report);
//       } else {
//         // No region specified - assign based on market or other logic
//         const market = report.Market;
//         if (
//           market &&
//           (market.includes("DALLAS") ||
//             market.includes("HOUSTON") ||
//             market.includes("TEXAS"))
//         ) {
//           regions["Aleem Ghori Region"].push(report);
//         } else {
//           regions["Hasnain Mustaqeem Region"].push(report);
//         }
//       }
//     });

//     console.log("Region distribution:", {
//       "Aleem Ghori Region": regions["Aleem Ghori Region"].length,
//       "Hasnain Mustaqeem Region": regions["Hasnain Mustaqeem Region"].length,
//     });

//     return regions;
//   };

//   const getUniqueStoreCount = (data: IASReport[]): number => {
//     const uniqueStores = new Set(
//       data
//         .map((report) => report["Store Name"])
//         .filter((name) => name && name !== "")
//     );
//     console.log("Unique stores count:", uniqueStores.size);
//     return uniqueStores.size;
//   };

//   // SIMPLIFIED: No date filtering
//   const filterByDate = (data: IASReport[]): IASReport[] => {
//     return data;
//   };

//   const aggregate = (data: IASReport[], level: string): AggregatedGroup[] => {
//     console.log(`Aggregating ${level} with ${data.length} rows`);

//     const groups: { [key: string]: AggregatedGroup } = {};

//     if (level === "regions") {
//       const regions = getRegions(data);
//       Object.entries(regions).forEach(([regionName, regionData]) => {
//         // Debug: Check first few TOTAL COST values
//         console.log(`=== DEBUGGING COST VALUES FOR ${regionName} ===`);
//         regionData.slice(0, 10).forEach((row, index) => {
//           const totalCost = row["TOTAL COST"];
//           const calculatedCost = calculateTotalCost(row);
//           console.log(`Row ${index}:`, {
//             store: row["Store Name"],
//             instock: row.INSTOCK,
//             cost: row.Cost,
//             totalCost: totalCost,
//             parsedTotalCost: parseCurrency(totalCost),
//             calculatedCost: calculatedCost,
//           });
//         });

//         // Total Inventory = Sum of INSTOCK column
//         const totalInventory = regionData.reduce((sum, row) => {
//           const instock = parseInt(row.INSTOCK) || 0;
//           return sum + instock;
//         }, 0);

//         // Total Value - use calculated cost if TOTAL COST is empty
//         const totalCost = regionData.reduce((sum, row) => {
//           return sum + calculateTotalCost(row);
//         }, 0);

//         const storeCount = getUniqueStoreCount(regionData);

//         console.log(`Region ${regionName} Summary:`, {
//           storeCount,
//           totalInventory,
//           totalCost,
//           sampleRows: regionData.length,
//         });

//         groups[regionName] = {
//           key: regionName,
//           count: storeCount,
//           instock: totalInventory,
//           total: totalInventory,
//           cost: totalCost,
//           rows: regionData,
//         };
//       });
//     } else if (level === "markets") {
//       const markets = Array.from(
//         new Set(data.map((report) => report.Market))
//       ).filter((m) => m && m !== "Unknown");

//       markets.forEach((market) => {
//         const marketData = data.filter((report) => report.Market === market);
//         const totalInventory = marketData.reduce(
//           (sum, row) => sum + (parseInt(row.INSTOCK) || 0),
//           0
//         );
//         const totalCost = marketData.reduce(
//           (sum, row) => sum + parseCurrency(row["TOTAL COST"]),
//           0
//         );
//         const storeCount = getUniqueStoreCount(marketData);

//         groups[market] = {
//           key: market,
//           count: storeCount,
//           instock: totalInventory,
//           total: totalInventory,
//           cost: totalCost,
//           rows: marketData,
//         };
//       });
//     } else if (level === "stores") {
//       const stores = Array.from(
//         new Set(data.map((report) => report["Store Name"]))
//       ).filter((s) => s && s !== "Unknown");

//       stores.forEach((store) => {
//         const storeData = data.filter(
//           (report) => report["Store Name"] === store
//         );
//         const totalInventory = storeData.reduce(
//           (sum, row) => sum + (parseInt(row.INSTOCK) || 0),
//           0
//         );
//         const totalCost = storeData.reduce(
//           (sum, row) => sum + parseCurrency(row["TOTAL COST"]),
//           0
//         );

//         groups[store] = {
//           key: store,
//           count: 1,
//           instock: totalInventory,
//           total: totalInventory,
//           cost: totalCost,
//           rows: storeData,
//         };
//       });
//     }

//     console.log(`Aggregation complete: ${Object.keys(groups).length} groups`);
//     return Object.values(groups).sort((a, b) => b.cost - a.cost);
//   };

//   const filteredByDateData = useMemo(() => {
//     return filterByDate(currentData);
//   }, [currentData]);

//   const filteredReports = useMemo(() => {
//     return filteredByDateData.filter((report) => {
//       const matchesSearch =
//         report["Store Name"]
//           ?.toLowerCase()
//           .includes(searchTerm.toLowerCase()) ||
//         report["Product"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         report["SKU"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         report["ID"]?.toLowerCase().includes(searchTerm.toLowerCase());

//       return matchesSearch;
//     });
//   }, [filteredByDateData, searchTerm]);

//   const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
//   const paginatedReports = useMemo(() => {
//     const startIndex = (currentPage - 1) * itemsPerPage;
//     return filteredReports.slice(startIndex, startIndex + itemsPerPage);
//   }, [filteredReports, currentPage, itemsPerPage]);

//   // FIXED: Enhanced summary stats with better debugging
//   const summaryStats = useMemo(() => {
//     const totalStores = getUniqueStoreCount(reports);

//     // Total Inventory = Sum of INSTOCK column
//     const totalInventory = reports.reduce((sum, report) => {
//       const instock = parseInt(report.INSTOCK) || 0;
//       return sum + instock;
//     }, 0);

//     // Total Value = Sum of TOTAL COST column
//     const totalValue = reports.reduce((sum, report) => {
//       const cost = parseCurrency(report["TOTAL COST"]);
//       return sum + cost;
//     }, 0);

//     console.log("SUMMARY STATS DEBUG:", {
//       totalStores,
//       totalInventory,
//       totalValue,
//     });

//     return { totalStores, totalInventory, totalValue };
//   }, [reports, parseCurrency]);

//   const toggleRowExpansion = (id: string) => {
//     if (expandedRow === id) {
//       setExpandedRow(null);
//     } else {
//       setExpandedRow(id);
//     }
//   };

//   const showDetails = (report: IASReport) => {
//     setSelectedDetails(report);
//   };

//   const closeDetails = () => {
//     setSelectedDetails(null);
//   };

//   const handleRegionClick = (region: AggregatedGroup) => {
//     setCurrentData(region.rows);
//     setCurrentView("markets");
//     setSelectedRegion(region.key);
//     setExpandedRow(null);
//     setHistoryStack([
//       { level: "Regions" },
//       { level: "Markets", selected: region.key },
//     ]);
//   };

//   const handleMarketClick = (market: AggregatedGroup) => {
//     setCurrentData(market.rows);
//     setCurrentView("stores");
//     setSelectedMarket(market.key);
//     setExpandedRow(null);
//     setHistoryStack([
//       { level: "Regions" },
//       { level: "Markets", selected: selectedRegion },
//       { level: "Stores", selected: market.key },
//     ]);
//   };

//   const handleStoreClick = (store: AggregatedGroup) => {
//     setCurrentData(store.rows);
//     setCurrentView("detailed");
//     setSelectedStore(store.key);
//     setExpandedRow(null);
//     setHistoryStack([
//       { level: "Regions" },
//       { level: "Markets", selected: selectedRegion },
//       { level: "Stores", selected: selectedMarket },
//       { level: "Detailed", selected: store.key },
//     ]);
//   };

//   const handleBackClick = () => {
//     if (historyStack.length <= 1) {
//       setCurrentData(reports);
//       setCurrentView("regions");
//       setHistoryStack([{ level: "Regions" }]);
//       setSelectedRegion("");
//       setSelectedMarket("");
//       setSelectedStore("");
//       setExpandedRow(null);
//     } else {
//       const newStack = historyStack.slice(0, -1);
//       setHistoryStack(newStack);

//       const previousLevel = newStack[newStack.length - 1];

//       if (previousLevel.level === "Regions") {
//         setCurrentData(reports);
//         setCurrentView("regions");
//         setSelectedRegion("");
//       } else if (previousLevel.level === "Markets") {
//         const regionData = reports.filter(
//           (report) => report.Region === previousLevel.selected
//         );
//         setCurrentData(regionData);
//         setCurrentView("markets");
//         setSelectedMarket("");
//       } else if (previousLevel.level === "Stores") {
//         const marketData = reports.filter(
//           (report) => report.Market === previousLevel.selected
//         );
//         setCurrentData(marketData);
//         setCurrentView("stores");
//         setSelectedStore("");
//       }
//       setExpandedRow(null);
//     }
//   };

//   const renderBreadcrumb = () => {
//     return historyStack.map((item, index) => (
//       <span key={index} className="ias-breadcrumb">
//         {item.selected ? `${item.level} — ${item.selected}` : item.level}
//         {index < historyStack.length - 1 && (
//           <span className="mx-2 text-gray-400">›</span>
//         )}
//       </span>
//     ));
//   };

//   const getStatusColor = (status: string): string => {
//     const statusColors: { [key: string]: string } = {
//       "new/ regular": "green",
//       active: "green",
//       inactive: "red",
//       pending: "orange",
//       completed: "blue",
//       closed: "gray",
//     };

//     const normalizedStatus = status.toLowerCase().trim();
//     return statusColors[normalizedStatus] || "gray";
//   };

//   const renderHierarchicalTable = (
//     data: IASReport[],
//     level: string,
//     onRowClick: (group: AggregatedGroup) => void
//   ) => {
//     const aggregated = aggregate(data, level);
//     const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);
//     const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

//     let title = "";
//     switch (level) {
//       case "regions":
//         title = "Regions";
//         break;
//       case "markets":
//         title = "Markets";
//         break;
//       case "stores":
//         title = "Stores";
//         break;
//     }

//     return (
//       <div className="ias-table-block">
//         <div className="ias-table-header">
//           <h2>{title}</h2>
//           <div className="ias-meta">
//             {aggregated.length} groups — {getUniqueStoreCount(data)} unique
//             stores — total value ${totalCost.toLocaleString()}
//           </div>
//         </div>

//         <div className="ias-table-wrapper">
//           <table className="ias-table">
//             <thead>
//               <tr>
//                 <th>{title}</th>
//                 <th className="ias-col-right">Store Count</th>
//                 <th className="ias-col-right">IN STOCK</th>
//                 <th className="ias-col-right">Total Inventory</th>
//                 <th className="ias-col-right">Total Value</th>
//                 <th>Value Distribution</th>
//               </tr>
//             </thead>
//             <tbody>
//               {aggregated.map((group, index) => {
//                 const pct = Math.round((group.cost / maxCost) * 100);
//                 const fillClass =
//                   pct >= 70
//                     ? "ias-fill-green"
//                     : pct >= 40
//                     ? "ias-fill-amber"
//                     : "ias-fill-red";

//                 return (
//                   <tr
//                     key={index}
//                     onClick={() => onRowClick(group)}
//                     className="clickable-row"
//                   >
//                     <td>{group.key}</td>
//                     <td className="ias-col-right">{group.count}</td>
//                     <td className="ias-col-right">{group.instock}</td>
//                     <td className="ias-col-right">{group.total}</td>
//                     <td className="ias-col-right">
//                       ${group.cost.toLocaleString()}
//                     </td>
//                     <td>
//                       <div className="ias-bar-cell">
//                         <div className="ias-bar-track">
//                           <div
//                             className={`ias-bar-fill ${fillClass}`}
//                             style={{ width: `${pct}%` }}
//                           ></div>
//                         </div>
//                         <div style={{ minWidth: "52px", textAlign: "right" }}>
//                           {pct}%
//                         </div>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   const renderDetailedTable = () => {
//     return (
//       <div className="ias-table-block">
//         <div className="ias-table-header">
//           <h2>Detailed Report - {selectedStore}</h2>
//           <div className="ias-meta">
//             {filteredReports.length} inventory records
//             {searchTerm && ` for "${searchTerm}"`}
//           </div>
//         </div>

//         <div className="ias-controls-section">
//           <div className="ias-controls-grid">
//             <div className="search-box">
//               <input
//                 type="text"
//                 placeholder="Search stores, products, SKU..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="search-input"
//               />
//               <span className="search-icon">🔍</span>
//             </div>
//           </div>
//         </div>

//         <div className="ias-table-wrapper">
//           <table className="ias-table">
//             <thead>
//               <tr>
//                 <th>Store</th>
//                 <th>Market</th>
//                 <th>Status</th>
//                 <th>Product</th>
//                 <th className="ias-col-right">IN STOCK</th>
//                 <th className="ias-col-right">TOTAL</th>
//                 <th className="ias-col-right">Cost</th>
//                 <th className="ias-col-right">Net Worth</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedReports.map((report, index) => {
//                 const uniqueId = `${report.ID}-${index}`;
//                 return (
//                   <React.Fragment key={uniqueId}>
//                     <tr className="main-row">
//                       <td>
//                         <div className="store-info">
//                           <div className="store-name">
//                             {report["Store Name"]}
//                           </div>
//                           <div className="store-id">{report.ID}</div>
//                         </div>
//                       </td>
//                       <td>{report.Market}</td>
//                       <td>
//                         <span
//                           className={`status-indicator status-${getStatusColor(
//                             report.Status
//                           )}`}
//                         >
//                           {report.Status}
//                         </span>
//                       </td>
//                       <td>
//                         <div className="product-info">
//                           <div className="product-name">{report.Product}</div>
//                           <div className="product-sku">SKU: {report.SKU}</div>
//                         </div>
//                       </td>
//                       <td
//                         className={`ias-col-right ${
//                           parseInt(report.INSTOCK) > 0
//                             ? "in-stock"
//                             : "out-of-stock"
//                         }`}
//                       >
//                         {report.INSTOCK}
//                       </td>
//                       <td className="ias-col-right">{report.TOTAL}</td>
//                       <td className="ias-col-right">{report.Cost}</td>
//                       <td className="ias-col-right">{report["Net Worth"]}</td>
//                       <td>
//                         <button
//                           onClick={() => showDetails(report)}
//                           className="details-btn"
//                         >
//                           Details
//                         </button>
//                         <button
//                           onClick={() => toggleRowExpansion(uniqueId)}
//                           className="expand-btn"
//                         >
//                           {expandedRow === uniqueId ? "▼" : "►"} More
//                         </button>
//                       </td>
//                     </tr>

//                     {expandedRow === uniqueId && (
//                       <tr className="detail-row">
//                         <td colSpan={9}>
//                           <div className="detail-panel">
//                             <div className="detail-section">
//                               <h4>Inventory Details</h4>
//                               <div className="detail-grid">
//                                 <div>
//                                   <strong>ON TRANSFER:</strong>{" "}
//                                   {report["ON TRANSFER"]}
//                                 </div>
//                                 <div>
//                                   <strong>IN Transit:</strong>{" "}
//                                   {report["IN Transit"]}
//                                 </div>
//                                 <div>
//                                   <strong>BACKDATED:</strong> {report.BACKDATED}
//                                 </div>
//                                 <div>
//                                   <strong>GROUND:</strong> {report.GROUND}
//                                 </div>
//                               </div>
//                             </div>

//                             <div className="detail-section">
//                               <h4>Sales Performance</h4>
//                               <div className="detail-grid">
//                                 <div>
//                                   <strong>New Activation:</strong>{" "}
//                                   {report["New Activation"]}
//                                 </div>
//                                 <div>
//                                   <strong>SWITCHER:</strong> {report.SWITCHER}
//                                 </div>
//                                 <div>
//                                   <strong>UPGRADE:</strong> {report.UPGRADE}
//                                 </div>
//                                 <div>
//                                   <strong>Performance:</strong> {report["%"]}
//                                 </div>
//                               </div>
//                             </div>

//                             <div className="detail-section">
//                               <h4>Shipping & Allocation</h4>
//                               <div className="detail-grid">
//                                 <div>
//                                   <strong>SUG QTY:</strong> {report["SUG QTY"]}
//                                 </div>
//                                 <div>
//                                   <strong>ALLOCATION:</strong>{" "}
//                                   {report.ALLOCATION}
//                                 </div>
//                                 <div>
//                                   <strong>Total ACC Sale:</strong>{" "}
//                                   {report["Total ACC Sale"]}
//                                 </div>
//                                 <div>
//                                   <strong>PPD:</strong> {report.PPD}
//                                 </div>
//                               </div>
//                             </div>

//                             <div className="detail-section">
//                               <h4>Store Information</h4>
//                               <div className="store-address">
//                                 {report["Store Address"]}
//                               </div>
//                               <div>
//                                 <strong>Sub Market:</strong>{" "}
//                                 {report["Sub Market"]}
//                               </div>
//                             </div>
//                           </div>
//                         </td>
//                       </tr>
//                     )}
//                   </React.Fragment>
//                 );
//               })}
//             </tbody>
//           </table>

//           {paginatedReports.length === 0 && (
//             <div className="no-data">
//               No records found matching your criteria.
//             </div>
//           )}
//         </div>

//         {totalPages > 1 && (
//           <div className="pagination">
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//               disabled={currentPage === 1}
//               className="pagination-btn"
//             >
//               Previous
//             </button>

//             <span className="page-info">
//               Page {currentPage} of {totalPages}
//             </span>

//             <button
//               onClick={() =>
//                 setCurrentPage((prev) => Math.min(prev + 1, totalPages))
//               }
//               disabled={currentPage === totalPages}
//               className="pagination-btn"
//             >
//               Next
//             </button>
//           </div>
//         )}
//       </div>
//     );
//   };

//   if (isLoading || loading) {
//     return (
//       <div className="app-loading">
//         <div className="loading-spinner"></div>
//         <p>Loading IAS Reports...</p>
//       </div>
//     );
//   }

//   if (!isAuthenticated) return null;

//   if (error) {
//     return (
//       <div className="ias-page">
//         <div className="error-container">
//           <h2>Error Loading Data</h2>
//           <p>{error}</p>
//           <button onClick={fetchIASData} className="retry-btn">
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="main-content">
//       <div className="content-wrapper">
//         <header className="topbar">
//           <div className="brand">
//             <div className="logo">📈</div>
//             <div className="title">
//               <div className="main">IAS Report</div>
//               <div className="sub">
//                 Inventory Analytics System - Store Performance
//               </div>
//             </div>
//           </div>
//         </header>

//         <main className="main-area">
//           <div className="ias-controls-section">
//             <div className="ias-controls-grid">
//               <div className="ias-action-buttons">
//                 <button
//                   className="btn btn-success"
//                   onClick={() => {
//                     const csvData =
//                       currentView === "detailed"
//                         ? filteredReports
//                         : currentData;
//                     if (csvData.length) {
//                       const keys = Object.keys(csvData[0]);
//                       const csv = [keys.join(",")]
//                         .concat(
//                           csvData.map((r) =>
//                             keys
//                               .map(
//                                 (k) =>
//                                   `"${String(
//                                     r[k as keyof IASReport] || ""
//                                   ).replace(/"/g, '""')}"`
//                               )
//                               .join(",")
//                           )
//                         )
//                         .join("\n");

//                       const blob = new Blob([csv], {
//                         type: "text/csv;charset=utf-8;",
//                       });
//                       const url = URL.createObjectURL(blob);
//                       const a = document.createElement("a");
//                       a.href = url;
//                       a.download = "ias_export.csv";
//                       document.body.appendChild(a);
//                       a.click();
//                       document.body.removeChild(a);
//                       URL.revokeObjectURL(url);
//                     }
//                   }}
//                 >
//                   Export CSV
//                 </button>
//                 <button className="btn btn-primary" onClick={fetchIASData}>
//                   Refresh Data
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Debug Info */}
//           <div
//             style={{
//               background: "#f3f4f6",
//               padding: "10px",
//               margin: "10px 0",
//               borderRadius: "5px",
//               fontSize: "14px",
//             }}
//           >
//             <strong>Debug Info:</strong> Stores: {summaryStats.totalStores} |
//             Inventory: {summaryStats.totalInventory} | Value: $
//             {summaryStats.totalValue.toLocaleString()}
//             <br />
//             <small>
//               Data Rows: {reports.length} | Last Fetch:{" "}
//               {new Date().toLocaleTimeString()}
//             </small>
//           </div>

//           <section className="dashboard-grid">
//             <div className="dashboard-card card-purple">
//               <div className="card-icon">🏪</div>
//               <div className="card-content">
//                 <h3 className="card-title">Total Stores</h3>
//                 <p className="card-description">{summaryStats.totalStores}</p>
//               </div>
//             </div>
//             <div className="dashboard-card card-purple">
//               <div className="card-icon">📦</div>
//               <div className="card-content">
//                 <h3 className="card-title">IN STOCK</h3>
//                 <p className="card-description">
//                   {summaryStats.totalInventory}
//                 </p>
//               </div>
//             </div>
//             <div className="dashboard-card card-purple">
//               <div className="card-icon">📊</div>
//               <div className="card-content">
//                 <h3 className="card-title">Total Inventory</h3>
//                 <p className="card-description">
//                   {summaryStats.totalInventory}
//                 </p>
//               </div>
//             </div>
//             <div className="dashboard-card card-purple">
//               <div className="card-icon">💰</div>
//               <div className="card-content">
//                 <h3 className="card-title">Total Value</h3>
//                 <p className="card-description">
//                   ${summaryStats.totalValue.toLocaleString()}
//                 </p>
//               </div>
//             </div>
//           </section>

//           <div className="ias-nav-row">
//             <button
//               className={`btn ${historyStack.length <= 1 ? "hidden" : ""}`}
//               onClick={handleBackClick}
//             >
//               ← Back
//             </button>
//             <div className="ias-breadcrumb">{renderBreadcrumb()}</div>
//           </div>

//           <section className="ias-stacked">
//             {currentView === "regions" &&
//               renderHierarchicalTable(
//                 currentData,
//                 "regions",
//                 handleRegionClick
//               )}
//             {currentView === "markets" &&
//               renderHierarchicalTable(
//                 currentData,
//                 "markets",
//                 handleMarketClick
//               )}
//             {currentView === "stores" &&
//               renderHierarchicalTable(currentData, "stores", handleStoreClick)}
//             {currentView === "detailed" && renderDetailedTable()}
//           </section>

//           {loading && (
//             <div className="ias-loading">
//               <div className="loading-spinner"></div>
//               <p>Loading IAS data...</p>
//             </div>
//           )}

//           {selectedDetails && (
//             <div className="modal-overlay" onClick={closeDetails}>
//               <div
//                 className="modal-content"
//                 onClick={(e) => e.stopPropagation()}
//               >
//                 <div className="modal-header">
//                   <h3>SKU Details - {selectedDetails.SKU}</h3>
//                   <button className="close-btn" onClick={closeDetails}>
//                     ×
//                   </button>
//                 </div>
//                 <div className="modal-body">
//                   <div className="detail-grid">
//                     <div>
//                       <strong>Store:</strong> {selectedDetails["Store Name"]}
//                     </div>
//                     <div>
//                       <strong>Market:</strong> {selectedDetails.Market}
//                     </div>
//                     <div>
//                       <strong>Model:</strong> {selectedDetails.Model}
//                     </div>
//                     <div>
//                       <strong>Product:</strong> {selectedDetails.Product}
//                     </div>
//                     <div>
//                       <strong>Status:</strong>
//                       <span
//                         className={`status-indicator status-${getStatusColor(
//                           selectedDetails.Status
//                         )}`}
//                       >
//                         {selectedDetails.Status}
//                       </span>
//                     </div>
//                     <div>
//                       <strong>IN STOCK:</strong> {selectedDetails.INSTOCK}
//                     </div>
//                     <div>
//                       <strong>TOTAL:</strong> {selectedDetails.TOTAL}
//                     </div>
//                     <div>
//                       <strong>Cost:</strong> {selectedDetails.Cost}
//                     </div>
//                     <div>
//                       <strong>Net Worth:</strong> {selectedDetails["Net Worth"]}
//                     </div>
//                     <div>
//                       <strong>Total Cost:</strong>{" "}
//                       {selectedDetails["TOTAL COST"]}
//                     </div>
//                     <div>
//                       <strong>Allocation:</strong> {selectedDetails.ALLOCATION}
//                     </div>
//                     <div>
//                       <strong>Performance:</strong> {selectedDetails["%"]}
//                     </div>
//                   </div>
//                   <div className="modal-actions">
//                     <button className="btn btn-primary" onClick={closeDetails}>
//                       Close
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { useRouter } from "next/navigation";
import "./ias-styles.css";

interface IASReport {
  Region: string;
  Market: string;
  "Net Worth": string;
  "Store Name": string;
  Status: string;
  SKU: string;
  Model: string;
  Product: string;
  INSTOCK: string;
  "ON TRANSFER": string;
  "IN Transit": string;
  BACKDATED: string;
  Friday: string;
  Monday: string;
  GROUND: string;
  TOTAL: string;
  Cost: string;
  QUOTA: string;
  "2days": string;
  LWS: string;
  L2WS: string;
  L3WS: string;
  L4WS: string;
  L5WS: string;
  "New Activation": string;
  SWITCHER: string;
  UPGRADE: string;
  "3W ACT": string;
  "3W UPG": string;
  "%": string;
  "SUG QTY": string;
  "OVERNIGHT QTY": string;
  "2nd DAY": string;
  "GROUND QTY": string;
  ALLOCATION: string;
  "Total ACC Sale": string;
  PPD: string;
  "ACC Per BOX": string;
  "TOTAL COST": string;
  "#": string;
  ID: string;
  "Store Address": string;
  "Sub Market": string;
}

interface AggregatedGroup {
  key: string;
  count: number;
  instock: number;
  onTransfer: number;
  inTransit: number;
  backdated: number;
  total: number;
  cost: number;
  rows: IASReport[];
}

interface SummaryStats {
  totalStores: number;
  totalInventory: number;
  totalOnTransfer: number;
  totalInTransit: number;
  totalBackdated: number;
  totalValue: number;
}

export default function IASReportsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<IASReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<IASReport | null>(
    null
  );

  const [currentView, setCurrentView] = useState<
    "regions" | "markets" | "stores" | "detailed"
  >("regions");
  const [currentData, setCurrentData] = useState<IASReport[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [historyStack, setHistoryStack] = useState<
    { level: string; selected?: string }[]
  >([{ level: "Regions" }]);

  const GOOGLE_SHEETS_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK1tiOHJrphkxuRXH6p4i4l-caCCo4dAbNrb8p4TCIHztwB-V2fLK7v2yLNl04Q/pub?gid=2112869718&single=true&output=csv";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchIASData();
    }
  }, [isAuthenticated]);

  // Enhanced currency parsing
  const parseCurrency = useCallback((v: any): number => {
    if (v == null || v === "" || v === undefined || v === "0") {
      return 0;
    }

    const str = String(v).trim();

    if (
      str === "" ||
      str === "-" ||
      str === "N/A" ||
      str === "null" ||
      str === " " ||
      str === "0" ||
      str === "#DIV/0!"
    ) {
      return 0;
    }

    const cleaned = str
      .replace(/\$/g, "")
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .replace(/[^\d.-]/g, "");

    const parts = cleaned.split(".");
    let finalNumber = parts[0];
    if (parts.length > 1) {
      finalNumber += "." + parts.slice(1).join("");
    }

    const n = parseFloat(finalNumber);
    return isNaN(n) ? 0 : n;
  }, []);

  // Parse integer values
  const parseIntSafe = useCallback((v: any): number => {
    if (v == null || v === "" || v === undefined) return 0;
    const str = String(v).trim();
    if (
      str === "" ||
      str === "-" ||
      str === "N/A" ||
      str === "null" ||
      str === " " ||
      str === "#DIV/0!"
    ) {
      return 0;
    }
    const n = parseInt(str);
    return isNaN(n) ? 0 : n;
  }, []);

  // Enhanced cost calculation
  const calculateTotalCost = useCallback(
    (report: IASReport): number => {
      // First try to use TOTAL COST column directly
      const totalCostFromColumn = parseCurrency(report["Cost"]);
      if (totalCostFromColumn > 0) {
        return totalCostFromColumn;
      }

      // If TOTAL COST is empty/zero, calculate it from INSTOCK * Cost
      const instock = parseIntSafe(report.INSTOCK);
      const costPerUnit = parseCurrency(report.Cost);
      const calculated = instock * costPerUnit;

      return calculated;
    },
    [parseCurrency, parseIntSafe]
  );

  // FIXED: Enhanced CSV parsing that handles duplicate columns
  const parseCSV = useCallback((csvText: string): IASReport[] => {
    try {
      console.log("Starting CSV parsing...");

      // Clean the text
      const cleanText = csvText.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "");
      const lines = cleanText
        .split("\n")
        .filter((line) => line.trim().length > 0);

      console.log(`Total lines: ${lines.length}`);

      if (lines.length < 2) {
        console.warn("CSV has insufficient lines");
        return [];
      }

      // Parse headers and handle duplicates
      const headerLine = lines[0];
      const headers: string[] = [];
      let currentHeader = "";
      let inQuotes = false;

      for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          const trimmedHeader = currentHeader.trim().replace(/"/g, "");
          headers.push(trimmedHeader);
          currentHeader = "";
        } else {
          currentHeader += char;
        }
      }
      headers.push(currentHeader.trim().replace(/"/g, ""));

      console.log("Original headers:", headers);

      // Handle duplicate columns by renaming them
      const headerCount: { [key: string]: number } = {};
      const uniqueHeaders = headers.map((header) => {
        headerCount[header] = (headerCount[header] || 0) + 1;
        if (headerCount[header] > 1) {
          return `${header}_${headerCount[header]}`;
        }
        return header;
      });

      console.log("Unique headers:", uniqueHeaders);

      const data: IASReport[] = [];
      let skippedRows = 0;
      let processedRows = 0;

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values: string[] = [];
        let currentValue = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(currentValue.trim().replace(/"/g, ""));
            currentValue = "";
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim().replace(/"/g, ""));

        // Handle rows with different column counts
        const processedValues = [...values];
        if (processedValues.length > uniqueHeaders.length) {
          processedValues.length = uniqueHeaders.length;
        } else if (processedValues.length < uniqueHeaders.length) {
          while (processedValues.length < uniqueHeaders.length) {
            processedValues.push("");
          }
        }

        const obj: any = {};
        let hasData = false;

        uniqueHeaders.forEach((header, index) => {
          // Remove the suffix for duplicate columns to match our interface
          const cleanHeader = header.replace(/_\d+$/, "");
          const value = processedValues[index] || "";
          obj[cleanHeader] = value;
          if (value && value !== "") {
            hasData = true;
          }
        });

        // Only add rows that have actual data in key columns
        const hasKeyData =
          obj["Store Name"] &&
          obj["Store Name"] !== "" &&
          obj["Market"] &&
          obj["Market"] !== "";

        if (hasKeyData) {
          data.push(obj as IASReport);
          processedRows++;
        } else {
          skippedRows++;
          if (skippedRows <= 5) {
            console.warn(`Skipping row ${i} - missing key data:`, {
              store: obj["Store Name"],
              market: obj["Market"],
              instock: obj["INSTOCK"],
            });
          }
        }
      }

      console.log(
        `Parsing complete: ${processedRows} valid rows, ${skippedRows} skipped rows`
      );

      if (data.length > 0) {
        console.log("First parsed row sample:", {
          store: data[0]["Store Name"],
          instock: data[0]["INSTOCK"],
          onTransfer: data[0]["ON TRANSFER"],
          inTransit: data[0]["IN Transit"],
          backdated: data[0]["BACKDATED"],
          totalCost: data[0]["TOTAL COST"],
          cost: data[0]["Cost"],
        });
      }

      return data;
    } catch (parseError) {
      console.error("Error parsing CSV:", parseError);
      return [];
    }
  }, []);

  // Enhanced data fetching
  const fetchIASData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Starting IAS data fetch...");

      const response = await fetch(GOOGLE_SHEETS_URL);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch data from Google Sheets: ${response.status} ${response.statusText}`
        );
      }

      const csvText = await response.text();

      if (!csvText || csvText.trim().length === 0) {
        throw new Error("Empty response from server");
      }

      console.log("Raw CSV text length:", csvText.length);

      const parsedData = parseCSV(csvText);

      if (parsedData.length === 0) {
        throw new Error(
          "No valid data could be parsed from the CSV. Check console for details."
        );
      }

      console.log(`Successfully parsed ${parsedData.length} rows`);

      setReports(parsedData);
      setCurrentData(parsedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      setError(errorMessage);
      console.error("Error fetching IAS data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRegions = (data: IASReport[]) => {
    const regions: { [key: string]: IASReport[] } = {
      "Aleem Ghori Region": [],
      "Hasnain Mustaqeem Region": [],
    };

    data.forEach((report) => {
      const region = report.Region;

      if (region === "Aleem Ghori Region") {
        regions["Aleem Ghori Region"].push(report);
      } else if (region === "Hasnain Mustaqeem Region") {
        regions["Hasnain Mustaqeem Region"].push(report);
      } else if (region && region !== "") {
        regions["Aleem Ghori Region"].push(report);
      } else {
        const market = report.Market;
        if (
          market &&
          (market.includes("DALLAS") ||
            market.includes("HOUSTON") ||
            market.includes("TEXAS"))
        ) {
          regions["Aleem Ghori Region"].push(report);
        } else {
          regions["Hasnain Mustaqeem Region"].push(report);
        }
      }
    });

    return regions;
  };

  const getUniqueStoreCount = (data: IASReport[]): number => {
    const uniqueStores = new Set(
      data
        .map((report) => report["Store Name"])
        .filter((name) => name && name !== "")
    );
    return uniqueStores.size;
  };

  // No date filtering
  const filterByDate = (data: IASReport[]): IASReport[] => {
    return data;
  };

  // Enhanced aggregation with all required sums
  const aggregate = (data: IASReport[], level: string): AggregatedGroup[] => {
    const groups: { [key: string]: AggregatedGroup } = {};

    if (level === "regions") {
      const regions = getRegions(data);
      Object.entries(regions).forEach(([regionName, regionData]) => {
        const totalInventory = regionData.reduce(
          (sum, row) => sum + parseIntSafe(row.INSTOCK),
          0
        );
        const totalOnTransfer = regionData.reduce(
          (sum, row) => sum + parseIntSafe(row["ON TRANSFER"]),
          0
        );
        const totalInTransit = regionData.reduce(
          (sum, row) => sum + parseIntSafe(row["IN Transit"]),
          0
        );
        const totalBackdated = regionData.reduce(
          (sum, row) => sum + parseIntSafe(row.BACKDATED),
          0
        );
        const totalCost = regionData.reduce(
          (sum, row) => sum + calculateTotalCost(row),
          0
        );
        const storeCount = getUniqueStoreCount(regionData);

        groups[regionName] = {
          key: regionName,
          count: storeCount,
          instock: totalInventory,
          onTransfer: totalOnTransfer,
          inTransit: totalInTransit,
          backdated: totalBackdated,
          total: totalInventory,
          cost: totalCost,
          rows: regionData,
        };
      });
    } else if (level === "markets") {
      const markets = Array.from(
        new Set(data.map((report) => report.Market))
      ).filter((m) => m && m !== "Unknown");

      markets.forEach((market) => {
        const marketData = data.filter((report) => report.Market === market);
        const totalInventory = marketData.reduce(
          (sum, row) => sum + parseIntSafe(row.INSTOCK),
          0
        );
        const totalOnTransfer = marketData.reduce(
          (sum, row) => sum + parseIntSafe(row["ON TRANSFER"]),
          0
        );
        const totalInTransit = marketData.reduce(
          (sum, row) => sum + parseIntSafe(row["IN Transit"]),
          0
        );
        const totalBackdated = marketData.reduce(
          (sum, row) => sum + parseIntSafe(row.BACKDATED),
          0
        );
        const totalCost = marketData.reduce(
          (sum, row) => sum + calculateTotalCost(row),
          0
        );
        const storeCount = getUniqueStoreCount(marketData);

        groups[market] = {
          key: market,
          count: storeCount,
          instock: totalInventory,
          onTransfer: totalOnTransfer,
          inTransit: totalInTransit,
          backdated: totalBackdated,
          total: totalInventory,
          cost: totalCost,
          rows: marketData,
        };
      });
    } else if (level === "stores") {
      const stores = Array.from(
        new Set(data.map((report) => report["Store Name"]))
      ).filter((s) => s && s !== "Unknown");

      stores.forEach((store) => {
        const storeData = data.filter(
          (report) => report["Store Name"] === store
        );
        const totalInventory = storeData.reduce(
          (sum, row) => sum + parseIntSafe(row.INSTOCK),
          0
        );
        const totalOnTransfer = storeData.reduce(
          (sum, row) => sum + parseIntSafe(row["ON TRANSFER"]),
          0
        );
        const totalInTransit = storeData.reduce(
          (sum, row) => sum + parseIntSafe(row["IN Transit"]),
          0
        );
        const totalBackdated = storeData.reduce(
          (sum, row) => sum + parseIntSafe(row.BACKDATED),
          0
        );
        const totalCost = storeData.reduce(
          (sum, row) => sum + calculateTotalCost(row),
          0
        );

        groups[store] = {
          key: store,
          count: 1,
          instock: totalInventory,
          onTransfer: totalOnTransfer,
          inTransit: totalInTransit,
          backdated: totalBackdated,
          total: totalInventory,
          cost: totalCost,
          rows: storeData,
        };
      });
    }

    return Object.values(groups).sort((a, b) => b.cost - a.cost);
  };

  const filteredByDateData = useMemo(() => {
    return filterByDate(currentData);
  }, [currentData]);

  const filteredReports = useMemo(() => {
    return filteredByDateData.filter((report) => {
      const matchesSearch =
        report["Store Name"]
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        report["Product"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report["SKU"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report["ID"]?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [filteredByDateData, searchTerm]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  // Enhanced summary stats with all required sums
  const summaryStats = useMemo((): SummaryStats => {
    if (reports.length === 0) {
      return {
        totalStores: 0,
        totalInventory: 0,
        totalOnTransfer: 0,
        totalInTransit: 0,
        totalBackdated: 0,
        totalValue: 0,
      };
    }

    const totalStores = getUniqueStoreCount(reports);
    const totalInventory = reports.reduce(
      (sum, report) => sum + parseIntSafe(report.INSTOCK),
      0
    );
    const totalOnTransfer = reports.reduce(
      (sum, report) => sum + parseIntSafe(report["ON TRANSFER"]),
      0
    );
    const totalInTransit = reports.reduce(
      (sum, report) => sum + parseIntSafe(report["IN Transit"]),
      0
    );
    const totalBackdated = reports.reduce(
      (sum, report) => sum + parseIntSafe(report.BACKDATED),
      0
    );
    const totalValue = reports.reduce(
      (sum, report) => sum + calculateTotalCost(report),
      0
    );

    console.log("Summary Stats:", {
      totalStores,
      totalInventory,
      totalOnTransfer,
      totalInTransit,
      totalBackdated,
      totalValue,
    });

    return {
      totalStores,
      totalInventory,
      totalOnTransfer,
      totalInTransit,
      totalBackdated,
      totalValue,
    };
  }, [reports, calculateTotalCost, parseIntSafe]);

  const toggleRowExpansion = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  const showDetails = (report: IASReport) => {
    setSelectedDetails(report);
  };

  const closeDetails = () => {
    setSelectedDetails(null);
  };

  const handleRegionClick = (region: AggregatedGroup) => {
    setCurrentData(region.rows);
    setCurrentView("markets");
    setSelectedRegion(region.key);
    setExpandedRow(null);
    setHistoryStack([
      { level: "Regions" },
      { level: "Markets", selected: region.key },
    ]);
  };

  const handleMarketClick = (market: AggregatedGroup) => {
    setCurrentData(market.rows);
    setCurrentView("stores");
    setSelectedMarket(market.key);
    setExpandedRow(null);
    setHistoryStack([
      { level: "Regions" },
      { level: "Markets", selected: selectedRegion },
      { level: "Stores", selected: market.key },
    ]);
  };

  const handleStoreClick = (store: AggregatedGroup) => {
    setCurrentData(store.rows);
    setCurrentView("detailed");
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
      setCurrentView("regions");
      setHistoryStack([{ level: "Regions" }]);
      setSelectedRegion("");
      setSelectedMarket("");
      setSelectedStore("");
      setExpandedRow(null);
    } else {
      const newStack = historyStack.slice(0, -1);
      setHistoryStack(newStack);

      const previousLevel = newStack[newStack.length - 1];

      if (previousLevel.level === "Regions") {
        setCurrentData(reports);
        setCurrentView("regions");
        setSelectedRegion("");
      } else if (previousLevel.level === "Markets") {
        const regionData = reports.filter(
          (report) => report.Region === previousLevel.selected
        );
        setCurrentData(regionData);
        setCurrentView("markets");
        setSelectedMarket("");
      } else if (previousLevel.level === "Stores") {
        const marketData = reports.filter(
          (report) => report.Market === previousLevel.selected
        );
        setCurrentData(marketData);
        setCurrentView("stores");
        setSelectedStore("");
      }
      setExpandedRow(null);
    }
  };

  const renderBreadcrumb = () => {
    return historyStack.map((item, index) => (
      <span key={index} className="ias-breadcrumb">
        {item.selected ? `${item.level} — ${item.selected}` : item.level}
        {index < historyStack.length - 1 && (
          <span className="mx-2 text-gray-400">›</span>
        )}
      </span>
    ));
  };

  const getStatusColor = (status: string): string => {
    const statusColors: { [key: string]: string } = {
      "new/ regular": "green",
      active: "green",
      inactive: "red",
      pending: "orange",
      completed: "blue",
      closed: "gray",
    };

    const normalizedStatus = status.toLowerCase().trim();
    return statusColors[normalizedStatus] || "gray";
  };

  const renderHierarchicalTable = (
    data: IASReport[],
    level: string,
    onRowClick: (group: AggregatedGroup) => void
  ) => {
    const aggregated = aggregate(data, level);
    const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);
    const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

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
      <div className="ias-table-block">
        <div className="ias-table-header">
          <h2>{title}</h2>
          <div className="ias-meta">
            {aggregated.length} groups — {getUniqueStoreCount(data)} unique
            stores — total value ${totalCost.toLocaleString()}
          </div>
        </div>

        <div className="ias-table-wrapper">
          <table className="ias-table">
            <thead>
              <tr>
                <th>{title}</th>
                <th className="ias-col-right">Store Count</th>
                <th className="ias-col-right">IN STOCK</th>
                <th className="ias-col-right">ON TRANSFER</th>
                <th className="ias-col-right">IN TRANSIT</th>
                <th className="ias-col-right">BACKDATED</th>
                <th className="ias-col-right">Total Value</th>
                <th>Value Distribution</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((group, index) => {
                const pct = Math.round((group.cost / maxCost) * 100);
                const fillClass =
                  pct >= 70
                    ? "ias-fill-green"
                    : pct >= 40
                    ? "ias-fill-amber"
                    : "ias-fill-red";

                return (
                  <tr
                    key={index}
                    onClick={() => onRowClick(group)}
                    className="clickable-row"
                  >
                    <td>{group.key}</td>
                    <td className="ias-col-right">{group.count}</td>
                    <td className="ias-col-right">
                      {group.instock.toLocaleString()}
                    </td>
                    <td className="ias-col-right">
                      {group.onTransfer.toLocaleString()}
                    </td>
                    <td className="ias-col-right">
                      {group.inTransit.toLocaleString()}
                    </td>
                    <td className="ias-col-right">
                      {group.backdated.toLocaleString()}
                    </td>
                    <td className="ias-col-right">
                      ${group.cost.toLocaleString()}
                    </td>
                    <td>
                      <div className="ias-bar-cell">
                        <div className="ias-bar-track">
                          <div
                            className={`ias-bar-fill ${fillClass}`}
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
    return (
      <div className="ias-table-block">
        <div className="ias-table-header">
          <h2>Detailed Report - {selectedStore}</h2>
          <div className="ias-meta">
            {filteredReports.length} inventory records
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </div>

        <div className="ias-controls-section">
          <div className="ias-controls-grid">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search stores, products, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
        </div>

        <div className="ias-table-wrapper">
          <table className="ias-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Market</th>
                <th>Status</th>
                <th>Product</th>
                <th className="ias-col-right">IN STOCK</th>
                <th className="ias-col-right">ON TRANSFER</th>
                <th className="ias-col-right">IN TRANSIT</th>
                <th className="ias-col-right">BACKDATED</th>
                <th className="ias-col-right">Unit Cost</th>
                <th className="ias-col-right">Total Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((report, index) => {
                const uniqueId = `${report.ID}-${index}`;
                const totalValue = calculateTotalCost(report);

                return (
                  <React.Fragment key={uniqueId}>
                    <tr className="main-row">
                      <td>
                        <div className="store-info">
                          <div className="store-name">
                            {report["Store Name"]}
                          </div>
                          <div className="store-id">{report.ID}</div>
                        </div>
                      </td>
                      <td>{report.Market}</td>
                      <td>
                        <span
                          className={`status-indicator status-${getStatusColor(
                            report.Status
                          )}`}
                        >
                          {report.Status}
                        </span>
                      </td>
                      <td>
                        <div className="product-info">
                          <div className="product-name">{report.Product}</div>
                          <div className="product-sku">SKU: {report.SKU}</div>
                        </div>
                      </td>
                      <td
                        className={`ias-col-right ${
                          parseIntSafe(report.INSTOCK) > 0
                            ? "in-stock"
                            : "out-of-stock"
                        }`}
                      >
                        {report.INSTOCK}
                      </td>
                      <td className="ias-col-right">{report["ON TRANSFER"]}</td>
                      <td className="ias-col-right">{report["IN Transit"]}</td>
                      <td className="ias-col-right">{report.BACKDATED}</td>
                      <td className="ias-col-right">
                        ${parseCurrency(report.Cost).toLocaleString()}
                      </td>
                      <td className="ias-col-right">
                        ${totalValue.toLocaleString()}
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
                          {expandedRow === uniqueId ? "▼" : "►"} More
                        </button>
                      </td>
                    </tr>

                    {expandedRow === uniqueId && (
                      <tr className="detail-row">
                        <td colSpan={11}>
                          <div className="detail-panel">
                            <div className="detail-section">
                              <h4>Inventory Details</h4>
                              <div className="detail-grid">
                                <div>
                                  <strong>Friday:</strong> {report.Friday}
                                </div>
                                <div>
                                  <strong>Monday:</strong> {report.Monday}
                                </div>
                                <div>
                                  <strong>GROUND:</strong> {report.GROUND}
                                </div>
                                <div>
                                  <strong>TOTAL:</strong> {report.TOTAL}
                                </div>
                              </div>
                            </div>

                            <div className="detail-section">
                              <h4>Sales Performance</h4>
                              <div className="detail-grid">
                                <div>
                                  <strong>New Activation:</strong>{" "}
                                  {report["New Activation"]}
                                </div>
                                <div>
                                  <strong>SWITCHER:</strong> {report.SWITCHER}
                                </div>
                                <div>
                                  <strong>UPGRADE:</strong> {report.UPGRADE}
                                </div>
                                <div>
                                  <strong>Performance:</strong> {report["%"]}
                                </div>
                              </div>
                            </div>

                            <div className="detail-section">
                              <h4>Shipping & Allocation</h4>
                              <div className="detail-grid">
                                <div>
                                  <strong>SUG QTY:</strong> {report["SUG QTY"]}
                                </div>
                                <div>
                                  <strong>OVERNIGHT QTY:</strong>{" "}
                                  {report["OVERNIGHT QTY"]}
                                </div>
                                <div>
                                  <strong>2nd DAY:</strong> {report["2nd DAY"]}
                                </div>
                                <div>
                                  <strong>GROUND QTY:</strong>{" "}
                                  {report["GROUND QTY"]}
                                </div>
                                <div>
                                  <strong>ALLOCATION:</strong>{" "}
                                  {report.ALLOCATION}
                                </div>
                                <div>
                                  <strong>Total ACC Sale:</strong>{" "}
                                  {report["Total ACC Sale"]}
                                </div>
                              </div>
                            </div>

                            <div className="detail-section">
                              <h4>Store Information</h4>
                              <div className="store-address">
                                {report["Store Address"]}
                              </div>
                              <div>
                                <strong>Sub Market:</strong>{" "}
                                {report["Sub Market"]}
                              </div>
                              <div>
                                <strong>Net Worth:</strong>{" "}
                                {report["Net Worth"]}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {paginatedReports.length === 0 && (
            <div className="no-data">
              No records found matching your criteria.
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>

            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
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

  if (isLoading || loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading IAS Reports...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (error) {
    return (
      <div className="ias-page">
        <div className="error-container">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchIASData} className="retry-btn">
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
            <div className="logo">📈</div>
            <div className="title">
              <div className="main">IAS Report</div>
              <div className="sub">
                Inventory Analytics System - Store Performance
              </div>
            </div>
          </div>
        </header>

        <main className="main-area">
          <div className="ias-controls-section">
            <div className="ias-controls-grid">
              <div className="ias-action-buttons">
                <button
                  className="btn btn-success"
                  onClick={() => {
                    const csvData =
                      currentView === "detailed"
                        ? filteredReports
                        : currentData;
                    if (csvData.length) {
                      const keys = Object.keys(csvData[0]);
                      const csv = [keys.join(",")]
                        .concat(
                          csvData.map((r) =>
                            keys
                              .map(
                                (k) =>
                                  `"${String(
                                    r[k as keyof IASReport] || ""
                                  ).replace(/"/g, '""')}"`
                              )
                              .join(",")
                          )
                        )
                        .join("\n");

                      const blob = new Blob([csv], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "ias_export.csv";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                >
                  Export CSV
                </button>
                <button className="btn btn-primary" onClick={fetchIASData}>
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Debug Info */}
          <div
            style={{
              background: "#f3f4f6",
              padding: "10px",
              margin: "10px 0",
              borderRadius: "5px",
              fontSize: "14px",
            }}
          >
            <strong>Debug Info:</strong> Stores: {summaryStats.totalStores} | IN
            STOCK: {summaryStats.totalInventory.toLocaleString()} | ON TRANSFER:{" "}
            {summaryStats.totalOnTransfer.toLocaleString()} | IN TRANSIT:{" "}
            {summaryStats.totalInTransit.toLocaleString()} | BACKDATED:{" "}
            {summaryStats.totalBackdated.toLocaleString()} | Value: $
            {summaryStats.totalValue.toLocaleString()}
            <br />
            <small>
              Data Rows: {reports.length} | Last Fetch:{" "}
              {new Date().toLocaleTimeString()}
            </small>
          </div>

          {/* Enhanced Dashboard Cards */}
          <section className="dashboard-grid">
            <div className="dashboard-card card-purple">
              <div className="card-icon">🏪</div>
              <div className="card-content">
                <h3 className="card-title">Total Stores</h3>
                <p className="card-description">{summaryStats.totalStores}</p>
              </div>
            </div>
            <div className="dashboard-card card-blue">
              <div className="card-icon">📦</div>
              <div className="card-content">
                <h3 className="card-title">IN STOCK</h3>
                <p className="card-description">
                  {summaryStats.totalInventory.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="dashboard-card card-orange">
              <div className="card-icon">🔄</div>
              <div className="card-content">
                <h3 className="card-title">ON TRANSFER</h3>
                <p className="card-description">
                  {summaryStats.totalOnTransfer.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="dashboard-card card-yellow">
              <div className="card-icon">🚚</div>
              <div className="card-content">
                <h3 className="card-title">IN TRANSIT</h3>
                <p className="card-description">
                  {summaryStats.totalInTransit.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="dashboard-card card-red">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <h3 className="card-title">BACKDATED</h3>
                <p className="card-description">
                  {summaryStats.totalBackdated.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="dashboard-card card-green">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3 className="card-title">Total Value</h3>
                <p className="card-description">
                  ${summaryStats.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          <div className="ias-nav-row">
            <button
              className={`btn ${historyStack.length <= 1 ? "hidden" : ""}`}
              onClick={handleBackClick}
            >
              ← Back
            </button>
            <div className="ias-breadcrumb">{renderBreadcrumb()}</div>
          </div>

          <section className="ias-stacked">
            {currentView === "regions" &&
              renderHierarchicalTable(
                currentData,
                "regions",
                handleRegionClick
              )}
            {currentView === "markets" &&
              renderHierarchicalTable(
                currentData,
                "markets",
                handleMarketClick
              )}
            {currentView === "stores" &&
              renderHierarchicalTable(currentData, "stores", handleStoreClick)}
            {currentView === "detailed" && renderDetailedTable()}
          </section>

          {loading && (
            <div className="ias-loading">
              <div className="loading-spinner"></div>
              <p>Loading IAS data...</p>
            </div>
          )}

          {selectedDetails && (
            <div className="modal-overlay" onClick={closeDetails}>
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h3>SKU Details - {selectedDetails.SKU}</h3>
                  <button className="close-btn" onClick={closeDetails}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="detail-grid">
                    <div>
                      <strong>Store:</strong> {selectedDetails["Store Name"]}
                    </div>
                    <div>
                      <strong>Market:</strong> {selectedDetails.Market}
                    </div>
                    <div>
                      <strong>Model:</strong> {selectedDetails.Model}
                    </div>
                    <div>
                      <strong>Product:</strong> {selectedDetails.Product}
                    </div>
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`status-indicator status-${getStatusColor(
                          selectedDetails.Status
                        )}`}
                      >
                        {selectedDetails.Status}
                      </span>
                    </div>
                    <div>
                      <strong>IN STOCK:</strong> {selectedDetails.INSTOCK}
                    </div>
                    <div>
                      <strong>ON TRANSFER:</strong>{" "}
                      {selectedDetails["ON TRANSFER"]}
                    </div>
                    <div>
                      <strong>IN TRANSIT:</strong>{" "}
                      {selectedDetails["IN Transit"]}
                    </div>
                    <div>
                      <strong>BACKDATED:</strong> {selectedDetails.BACKDATED}
                    </div>
                    <div>
                      <strong>Unit Cost:</strong> {selectedDetails.Cost}
                    </div>
                    <div>
                      <strong>Net Worth:</strong> {selectedDetails["Net Worth"]}
                    </div>
                    <div>
                      <strong>Total Cost:</strong>{" "}
                      {selectedDetails["TOTAL COST"]}
                    </div>
                    <div>
                      <strong>Calculated Value:</strong> $
                      {calculateTotalCost(selectedDetails).toLocaleString()}
                    </div>
                    <div>
                      <strong>Allocation:</strong> {selectedDetails.ALLOCATION}
                    </div>
                    <div>
                      <strong>Performance:</strong> {selectedDetails["%"]}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary" onClick={closeDetails}>
                      Close
                    </button>
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
