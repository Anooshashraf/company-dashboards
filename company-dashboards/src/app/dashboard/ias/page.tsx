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







// app/dashboard/ias/page.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import './ias-styles.css';

interface IASReport {
    Region: string;
    Market: string;
    'Net Worth': string;
    'Store Name': string;
    Status: string;
    SKU: string;
    Model: string;
    Product: string;
    INSTOCK: string;
    'ON TRANSFER': string;
    'IN Transit': string;
    BACKDATED: string;
    Friday: string;
    Monday: string;
    GROUND: string;
    TOTAL: string;
    Cost: string;
    QUOTA: string;
    '2days': string;
    LWS: string;
    L2WS: string;
    L3WS: string;
    L4WS: string;
    L5WS: string;
    'New Activation': string;
    SWITCHER: string;
    UPGRADE: string;
    '3W ACT': string;
    '3W UPG': string;
    '%': string;
    'SUG QTY': string;
    'OVERNIGHT QTY': string;
    '2nd DAY': string;
    'GROUND QTY': string;
    ALLOCATION: string;
    'Total ACC Sale': string;
    PPD: string;
    'ACC Per BOX': string;
    'TOTAL COST': string;
    '#': string;
    ID: string;
    'Store Address': string;
    'Sub Market': string;
    Date?: string;
}

interface AggregatedGroup {
    key: string;
    count: number;
    instock: number;
    total: number;
    cost: number;
    rows: IASReport[];
}

export default function IASReportsPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<IASReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [selectedDetails, setSelectedDetails] = useState<IASReport | null>(null);

    const [dateFilter, setDateFilter] = useState({
        startDate: '',
        endDate: ''
    });

    const [currentView, setCurrentView] = useState<'regions' | 'markets' | 'stores' | 'detailed'>('regions');
    const [currentData, setCurrentData] = useState<IASReport[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedMarket, setSelectedMarket] = useState<string>('');
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([{ level: "Regions" }]);

    const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK1tiOHJrphkxuRXH6p4i4l-caCCo4dAbNrb8p4TCIHztwB-V2fLK7v2yLNl04Q/pub?gid=2112869718&single=true&output=csv';

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchIASData();
        }
    }, [isAuthenticated]);

    const fetchIASData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(GOOGLE_SHEETS_URL);
            if (!response.ok) {
                throw new Error('Failed to fetch data from Google Sheets');
            }

            const csvText = await response.text();
            const parsedData = parseCSV(csvText);
            setReports(parsedData);
            setCurrentData(parsedData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
            console.error('Error fetching IAS data:', err);
        } finally {
            setLoading(false);
        }
    };

    const parseCSV = (csvText: string): IASReport[] => {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

        return lines.slice(1).map(line => {
            const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
            const report: any = {};

            headers.forEach((header, index) => {
                report[header] = values[index] || '';
            });

            return report as IASReport;
        });
    };

    const getRegions = (data: IASReport[]) => {
        const regions: { [key: string]: IASReport[] } = {
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

    const getUniqueStoreCount = (data: IASReport[]): number => {
        const uniqueStores = new Set(data.map(report => report['Store Name']));
        return uniqueStores.size;
    };

    const filterByDate = (data: IASReport[]): IASReport[] => {
        if (!dateFilter.startDate && !dateFilter.endDate) {
            return data;
        }

        return data.filter(report => {
            const reportDate = report.Date || '';
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

    const aggregate = (data: IASReport[], level: string): AggregatedGroup[] => {
        const groups: { [key: string]: AggregatedGroup } = {};

        if (level === "regions") {
            const regions = getRegions(data);
            Object.entries(regions).forEach(([regionName, regionData]) => {
                const totalInstock = regionData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
                const totalInventory = regionData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
                const totalCost = regionData.reduce((sum, row) => {
                    const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
                    return sum + cost;
                }, 0);

                groups[regionName] = {
                    key: regionName,
                    count: getUniqueStoreCount(regionData),
                    instock: totalInstock,
                    total: totalInventory,
                    cost: totalCost,
                    rows: regionData
                };
            });
        } else if (level === "markets") {
            const markets = Array.from(new Set(data.map(report => report.Market))).filter(m => m && m !== "Unknown");

            markets.forEach(market => {
                const marketData = data.filter(report => report.Market === market);
                const totalInstock = marketData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
                const totalInventory = marketData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
                const totalCost = marketData.reduce((sum, row) => {
                    const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
                    return sum + cost;
                }, 0);

                groups[market] = {
                    key: market,
                    count: getUniqueStoreCount(marketData),
                    instock: totalInstock,
                    total: totalInventory,
                    cost: totalCost,
                    rows: marketData
                };
            });
        } else if (level === "stores") {
            const stores = Array.from(new Set(data.map(report => report['Store Name']))).filter(s => s && s !== "Unknown");

            stores.forEach(store => {
                const storeData = data.filter(report => report['Store Name'] === store);
                const totalInstock = storeData.reduce((sum, row) => sum + (parseInt(row.INSTOCK) || 0), 0);
                const totalInventory = storeData.reduce((sum, row) => sum + (parseInt(row.TOTAL) || 0), 0);
                const totalCost = storeData.reduce((sum, row) => {
                    const cost = parseFloat(row.Cost?.replace(/[^\d.-]/g, '') || '0');
                    return sum + cost;
                }, 0);

                groups[store] = {
                    key: store,
                    count: 1,
                    instock: totalInstock,
                    total: totalInventory,
                    cost: totalCost,
                    rows: storeData
                };
            });
        }

        return Object.values(groups).sort((a, b) => b.cost - a.cost);
    };

    const filteredByDateData = useMemo(() => {
        return filterByDate(currentData);
    }, [currentData, dateFilter]);

    const filteredReports = useMemo(() => {
        return filteredByDateData.filter(report => {
            const matchesSearch =
                report['Store Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['Product']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['SKU']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['ID']?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });
    }, [filteredByDateData, searchTerm]);

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReports, currentPage, itemsPerPage]);

    const summaryStats = useMemo(() => {
        const totalStores = getUniqueStoreCount(reports);
        const totalInventory = reports.reduce((sum, report) => sum + (parseInt(report.INSTOCK) || 0), 0);
        const totalValue = reports.reduce((sum, report) => {
            const cost = parseFloat(report.Cost?.replace(/[^\d.-]/g, '') || '0');
            const instock = parseInt(report.INSTOCK) || 0;
            return sum + (cost * instock);
        }, 0);

        const activeStores = new Set(
            reports.filter(report =>
                parseInt(report.INSTOCK) > 0 || parseInt(report['ON TRANSFER']) > 0
            ).map(report => report['Store Name'])
        ).size;

        return { totalStores, totalInventory, totalValue, activeStores };
    }, [reports]);

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
        setCurrentData(market.rows);
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
        setCurrentData(store.rows);
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
            } else if (previousLevel.level === "Markets") {
                const regionData = reports.filter(report => report.Region === previousLevel.selected);
                setCurrentData(regionData);
                setCurrentView('markets');
                setSelectedMarket('');
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
            'new/ regular': 'green',
            'active': 'green',
            'inactive': 'red',
            'pending': 'orange',
            'completed': 'blue',
            'closed': 'gray'
        };

        const normalizedStatus = status.toLowerCase().trim();
        return statusColors[normalizedStatus] || 'gray';
    };

    const renderDateFilters = () => (
        <div className="ias-date-filters">
            <div className="filter-group">
                <label>Start Date:</label>
                <input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                    className="ias-input"
                />
            </div>
            <div className="filter-group">
                <label>End Date:</label>
                <input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                    className="ias-input"
                />
            </div>
            {(dateFilter.startDate || dateFilter.endDate) && (
                <button onClick={clearDateFilters} className="btn btn-secondary">
                    Clear Dates
                </button>
            )}
        </div>
    );

    const renderHierarchicalTable = (data: IASReport[], level: string, onRowClick: (group: AggregatedGroup) => void) => {
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
                        {aggregated.length} groups — {getUniqueStoreCount(data)} unique stores — total value ${totalCost.toLocaleString()}
                    </div>
                </div>

                <div className="ias-table-wrapper">
                    <table className="ias-table">
                        <thead>
                            <tr>
                                <th>{title}</th>
                                <th className="ias-col-right">Store Count</th>
                                <th className="ias-col-right">IN STOCK</th>
                                <th className="ias-col-right">Total Inventory</th>
                                <th className="ias-col-right">Total Value</th>
                                <th>Value Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* {
                                "Cost": "$948.99",
                                "INSTOCK": 3,
                                // Total Value = $948.99 × 3 = $2,846.97
                                // }
                            */}
                            {aggregated.map((group, index) => {
                                const pct = Math.round((group.cost / maxCost) * 100);
                                const fillClass = pct >= 70 ? "ias-fill-green" : pct >= 40 ? "ias-fill-amber" : "ias-fill-red";

                                return (
                                    <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
                                        <td>{group.key}</td>
                                        <td className="ias-col-right">{group.count}</td>
                                        <td className="ias-col-right">{group.instock}</td>
                                        <td className="ias-col-right">{group.total}</td>
                                        <td className="ias-col-right">${group.cost.toLocaleString()}</td>
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
                        {(dateFilter.startDate || dateFilter.endDate) && ' (date filtered)'}
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
                        <div className="ias-action-buttons">
                            {/* Refresh button removed from detailed view */}
                        </div>
                    </div>
                    {renderDateFilters()}
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
                                <th className="ias-col-right">TOTAL</th>
                                <th className="ias-col-right">Cost</th>
                                <th className="ias-col-right">Net Worth</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedReports.map((report, index) => {
                                const uniqueId = `${report.ID}-${index}`;
                                return (
                                    <React.Fragment key={uniqueId}>
                                        <tr className="main-row">
                                            <td>
                                                <div className="store-info">
                                                    <div className="store-name">{report['Store Name']}</div>
                                                    <div className="store-id">{report.ID}</div>
                                                </div>
                                            </td>
                                            <td>{report.Market}</td>
                                            <td>
                                                <span className={`status-indicator status-${getStatusColor(report.Status)}`}>
                                                    {report.Status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="product-info">
                                                    <div className="product-name">{report.Product}</div>
                                                    <div className="product-sku">SKU: {report.SKU}</div>
                                                </div>
                                            </td>
                                            <td className={`ias-col-right ${parseInt(report.INSTOCK) > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                                {report.INSTOCK}
                                            </td>
                                            <td className="ias-col-right">{report.TOTAL}</td>
                                            <td className="ias-col-right">{report.Cost}</td>
                                            <td className="ias-col-right">{report['Net Worth']}</td>
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
                                                <td colSpan={9}>
                                                    <div className="detail-panel">
                                                        <div className="detail-section">
                                                            <h4>Inventory Details</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>ON TRANSFER:</strong> {report['ON TRANSFER']}</div>
                                                                <div><strong>IN Transit:</strong> {report['IN Transit']}</div>
                                                                <div><strong>BACKDATED:</strong> {report.BACKDATED}</div>
                                                                <div><strong>GROUND:</strong> {report.GROUND}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Sales Performance</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>New Activation:</strong> {report['New Activation']}</div>
                                                                <div><strong>SWITCHER:</strong> {report.SWITCHER}</div>
                                                                <div><strong>UPGRADE:</strong> {report.UPGRADE}</div>
                                                                <div><strong>Performance:</strong> {report['%']}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Shipping & Allocation</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>SUG QTY:</strong> {report['SUG QTY']}</div>
                                                                <div><strong>ALLOCATION:</strong> {report.ALLOCATION}</div>
                                                                <div><strong>Total ACC Sale:</strong> {report['Total ACC Sale']}</div>
                                                                <div><strong>PPD:</strong> {report.PPD}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Store Information</h4>
                                                            <div className="store-address">{report['Store Address']}</div>
                                                            <div><strong>Sub Market:</strong> {report['Sub Market']}</div>
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

    if (isLoading || loading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
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
                                        const csvData = currentView === 'detailed' ? filteredReports : currentData;
                                        if (csvData.length) {
                                            const keys = Object.keys(csvData[0]);
                                            const csv = [keys.join(",")]
                                                .concat(
                                                    csvData.map((r) =>
                                                        keys
                                                            .map((k) => `"${String(r[k as keyof IASReport] || "").replace(/"/g, '""')}"`)
                                                            .join(",")
                                                    )
                                                )
                                                .join("\n");

                                            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
                            </div>
                            <div className="ias-date-filters">
                                <div className="filter-group">

                                    <input
                                        type="date"
                                        value={dateFilter.startDate}
                                        onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                                        className="ias-input"
                                    />
                                </div>
                                <div className="filter-group">

                                    <input
                                        type="date"
                                        value={dateFilter.endDate}
                                        onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                                        className="ias-input"
                                    />
                                </div>
                                <button
                                    onClick={() => { }} // Filters apply automatically
                                    className="btn btn-primary"
                                >
                                    Apply Filters
                                </button>
                                {(dateFilter.startDate || dateFilter.endDate) && (
                                    <button onClick={clearDateFilters} className="btn btn-secondary">
                                        Clear Dates
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <section className="dashboard-grid">
                        <div className="dashboard-card card-purple">
                            <div className="card-icon">🏪</div>
                            <div className="card-content">
                                <h3 className="card-title">Total Stores</h3>
                                <p className="card-description">{summaryStats.totalStores}</p>
                            </div>
                        </div>
                        <div className="dashboard-card card-purple">
                            <div className="card-icon">📦</div>
                            <div className="card-content">
                                <h3 className="card-title">IN STOCK</h3>
                                <p className="card-description">{summaryStats.totalInventory}</p>
                            </div>
                        </div>
                        <div className="dashboard-card card-purple">
                            <div className="card-icon">📊</div>
                            <div className="card-content">
                                <h3 className="card-title">Total Inventory</h3>
                                <p className="card-description">{summaryStats.totalInventory}</p>
                            </div>
                        </div>
                        <div className="dashboard-card card-purple">
                            <div className="card-icon">💰</div>
                            <div className="card-content">
                                <h3 className="card-title">Total Value</h3>
                                <p className="card-description">${summaryStats.totalValue.toLocaleString()}</p>
                            </div>
                        </div>
                    </section>

                    <div className="ias-nav-row">
                        <button
                            className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
                            onClick={handleBackClick}
                        >
                            ← Back
                        </button>

                    </div>

                    <section className="ias-stacked">
                        {currentView === "regions" &&
                            renderHierarchicalTable(currentData, "regions", handleRegionClick)}
                        {currentView === "markets" &&
                            renderHierarchicalTable(currentData, "markets", handleMarketClick)}
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
                            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h3>SKU Details - {selectedDetails.SKU}</h3>
                                    <button className="close-btn" onClick={closeDetails}>×</button>
                                </div>
                                <div className="modal-body">
                                    <div className="detail-grid">
                                        <div><strong>Store:</strong> {selectedDetails['Store Name']}</div>
                                        <div><strong>Market:</strong> {selectedDetails.Market}</div>
                                        <div><strong>Model:</strong> {selectedDetails.Model}</div>
                                        <div><strong>Product:</strong> {selectedDetails.Product}</div>
                                        <div><strong>Status:</strong>
                                            <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
                                                {selectedDetails.Status}
                                            </span>
                                        </div>
                                        <div><strong>IN STOCK:</strong> {selectedDetails.INSTOCK}</div>
                                        <div><strong>TOTAL:</strong> {selectedDetails.TOTAL}</div>
                                        <div><strong>Cost:</strong> {selectedDetails.Cost}</div>
                                        <div><strong>Net Worth:</strong> {selectedDetails['Net Worth']}</div>
                                        <div><strong>Address:</strong> {selectedDetails['Store Address']}</div>
                                        <div><strong>Sub Market:</strong> {selectedDetails['Sub Market']}</div>
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


