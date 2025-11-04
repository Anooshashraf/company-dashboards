// app/dashboard/isr/page.tsx
// 'use client';
// import { useAuth } from "../../../components/AuthProvider";
// import { useRouter } from "next/navigation";
// import { useEffect, useState, useCallback } from "react";
// import "./ias-styles.css";

// interface IASItem {
//     [key: string]: string | number;
// }

// interface AggregatedGroup {
//     key: string;
//     count: number;
//     instock: number;
//     total: number;
//     cost: number;
//     rows: IASItem[];
// }

// export default function IASReportsPage() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [rawData, setRawData] = useState<IASItem[]>([]);
//     const [filteredData, setFilteredData] = useState<IASItem[]>([]);
//     const [sheetUrl] = useState<string>(
//         "https://docs.google.com/spreadsheets/d/e/2PACX-1vQKK1tiOHJrphkxuRXH6p4i4l-caCCo4dAbNrb8p4TCIHztwB-V2fLK7v2yLNl04Q/pub?gid=2112869718&single=true&output=csv"
//     );
//     const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
//     const [currentView, setCurrentView] = useState<
//         "regions" | "markets" | "stores" | "detailed"
//     >("regions");
//     const [currentData, setCurrentData] = useState<IASItem[]>([]);
//     const [selectedRegion, setSelectedRegion] = useState<string>("");
//     const [selectedMarket, setSelectedMarket] = useState<string>("");
//     const [selectedStore, setSelectedStore] = useState<string>("");
//     const [historyStack, setHistoryStack] = useState<
//         { level: string; selected?: string }[]
//     >([{ level: "Regions" }]);

//     useEffect(() => {
//         if (!isLoading && !isAuthenticated) {
//             router.push("/login");
//         }
//     }, [isAuthenticated, isLoading, router]);

//     useEffect(() => {
//         if (isAuthenticated) {
//             initData();
//         }
//     }, [isAuthenticated]);

//     const parseCurrency = (v: any): number => {
//         if (v == null) return 0;
//         const s = String(v).replace(/[^0-9.\-]/g, "");
//         const n = parseFloat(s);
//         return isNaN(n) ? 0 : n;
//     };

//     const formatCurrency = (v: number): string => {
//         return (
//             "$" +
//             Number(v || 0).toLocaleString(undefined, {
//                 minimumFractionDigits: 2,
//                 maximumFractionDigits: 2
//             })
//         );
//     };

//     const parseNumber = (v: any): number => {
//         if (v == null) return 0;
//         const s = String(v).replace(/[^0-9.\-]/g, "");
//         const n = parseFloat(s);
//         return isNaN(n) ? 0 : n;
//     };

//     const getField = (obj: IASItem, candidates: string[]): string => {
//         for (const k of candidates) {
//             if (k in obj && obj[k] !== "" && obj[k] != null) return String(obj[k]);
//             const matched = Object.keys(obj).find(
//                 (x) => x.toLowerCase() === k.toLowerCase()
//             );
//             if (matched && obj[matched] !== "" && obj[matched] != null)
//                 return String(obj[matched]);
//         }
//         return "Unknown";
//     };

//     // Create regions dynamically from your data
//     const getRegions = (data: IASItem[]) => {
//         const regions: { [key: string]: IASItem[] } = {
//             "Aleem Ghori Region": [],
//             "Hasnain Mustaqeem Region": []
//         };

//         // Get all unique markets
//         const markets = Array.from(new Set(data.map(row => getField(row, ["Market", "MARKET"])))).filter(m => m && m !== "Unknown");

//         // Distribute markets between regions
//         markets.forEach((market, index) => {
//             const regionName = index % 2 === 0 ? "Aleem Ghori Region" : "Hasnain Mustaqeem Region";
//             const marketData = data.filter(row => getField(row, ["Market", "MARKET"]) === market);
//             regions[regionName].push(...marketData);
//         });

//         return regions;
//     };

//     const aggregate = (data: IASItem[], level: string): AggregatedGroup[] => {
//         const groups: { [key: string]: AggregatedGroup } = {};

//         if (level === "regions") {
//             const regions = getRegions(data);
//             Object.entries(regions).forEach(([regionName, regionData]) => {
//                 const totalInstock = regionData.reduce((sum, row) => sum + parseNumber(row.INSTOCK), 0);
//                 const totalInventory = regionData.reduce((sum, row) => sum + parseNumber(row.TOTAL), 0);
//                 const totalCost = regionData.reduce((sum, row) => sum + parseCurrency(row.Cost), 0);

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
//             // Group by market within the selected region
//             const markets = Array.from(new Set(data.map(row => getField(row, ["Market", "MARKET"])))).filter(m => m && m !== "Unknown");

//             markets.forEach(market => {
//                 const marketData = data.filter(row => getField(row, ["Market", "MARKET"]) === market);
//                 const totalInstock = marketData.reduce((sum, row) => sum + parseNumber(row.INSTOCK), 0);
//                 const totalInventory = marketData.reduce((sum, row) => sum + parseNumber(row.TOTAL), 0);
//                 const totalCost = marketData.reduce((sum, row) => sum + parseCurrency(row.Cost), 0);

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
//             // Group by store within the selected market
//             const stores = Array.from(new Set(data.map(row => getField(row, ["Store Name", "Store", "STORE"])))).filter(s => s && s !== "Unknown");

//             stores.forEach(store => {
//                 const storeData = data.filter(row => getField(row, ["Store Name", "Store", "STORE"]) === store);
//                 const totalInstock = storeData.reduce((sum, row) => sum + parseNumber(row.INSTOCK), 0);
//                 const totalInventory = storeData.reduce((sum, row) => sum + parseNumber(row.TOTAL), 0);
//                 const totalCost = storeData.reduce((sum, row) => sum + parseCurrency(row.Cost), 0);

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

//     const fetchCSV = async (url: string): Promise<IASItem[]> => {
//         try {
//             const res = await fetch(url);
//             if (!res.ok) throw new Error("fetch error " + res.status);
//             const txt = await res.text();

//             const lines = txt.split("\n").filter((line) => line.trim());
//             if (lines.length < 2) return [];

//             const headers = lines[0]
//                 .split(",")
//                 .map((h) => h.trim().replace(/"/g, ""));
//             const data = lines
//                 .slice(1)
//                 .map((line) => {
//                     const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
//                     const obj: IASItem = {};
//                     headers.forEach((header, index) => {
//                         obj[header] = values[index] || "";
//                     });
//                     return obj;
//                 })
//                 .filter((row) => Object.values(row).some((val) => val !== ""));

//             return data;
//         } catch (err) {
//             console.error("Fetching CSV failed:", err);
//             return [];
//         }
//     };

//     const buildSummaryCards = (data: IASItem[]) => {
//         const totalStores = data.length;
//         const totalInstock = data.reduce((s, r) => s + parseNumber(r.INSTOCK), 0);
//         const totalInventory = data.reduce((s, r) => s + parseNumber(r.TOTAL), 0);
//         const totalCost = data.reduce((s, r) => s + parseCurrency(r.Cost), 0);

//         const cards = [
//             { label: "Total Stores", value: totalStores, icon: "🏪" },
//             { label: "IN STOCK", value: totalInstock, icon: "📦" },
//             { label: "Total Inventory", value: totalInventory, icon: "📊" },
//             { label: "Total Value", value: formatCurrency(totalCost), icon: "💰" },
//         ];

//         return cards;
//     };

//     const initData = async () => {
//         setIsLoadingData(true);
//         const data = await fetchCSV(sheetUrl);

//         if (data && data.length > 0) {
//             setRawData(data);
//             setFilteredData(data);
//             setCurrentData(data);
//             setHistoryStack([{ level: "Regions" }]);
//         } else {
//             setFilteredData([]);
//             setCurrentData([]);
//         }
//         setIsLoadingData(false);
//     };

//     const handleExportCSV = () => {
//         if (!filteredData.length) return;

//         const keys = Object.keys(filteredData[0]);
//         const csv = [keys.join(",")]
//             .concat(
//                 filteredData.map((r) =>
//                     keys
//                         .map((k) => `"${String(r[k] || "").replace(/"/g, '""')}"`)
//                         .join(",")
//                 )
//             )
//             .join("\n");

//         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "ias_export.csv";
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//     };

//     // Navigation handlers - EXACTLY like RMA dashboard
//     const handleRegionClick = (region: AggregatedGroup) => {
//         setCurrentData(region.rows);
//         setCurrentView("markets");
//         setSelectedRegion(region.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: region.key },
//         ]);
//     };

//     const handleMarketClick = (market: AggregatedGroup) => {
//         setCurrentData(market.rows);
//         setCurrentView("stores");
//         setSelectedMarket(market.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: selectedRegion },
//             { level: "Stores", selected: market.key },
//         ]);
//     };

//     const handleStoreClick = (store: AggregatedGroup) => {
//         setCurrentData(store.rows);
//         setCurrentView("detailed");
//         setSelectedStore(store.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: selectedRegion },
//             { level: "Stores", selected: selectedMarket },
//             { level: "Detailed", selected: store.key },
//         ]);
//     };

//     const handleBackClick = () => {
//         if (historyStack.length <= 1) {
//             setCurrentData(filteredData);
//             setCurrentView("regions");
//             setHistoryStack([{ level: "Regions" }]);
//             setSelectedRegion("");
//             setSelectedMarket("");
//             setSelectedStore("");
//         } else {
//             const newStack = historyStack.slice(0, -1);
//             setHistoryStack(newStack);

//             const previousLevel = newStack[newStack.length - 1];

//             if (previousLevel.level === "Regions") {
//                 setCurrentData(filteredData);
//                 setCurrentView("regions");
//                 setSelectedRegion("");
//             } else if (previousLevel.level === "Markets") {
//                 const regions = getRegions(filteredData);
//                 const regionData = regions[previousLevel.selected!] || [];
//                 setCurrentData(regionData);
//                 setCurrentView("markets");
//                 setSelectedMarket("");
//             } else if (previousLevel.level === "Stores") {
//                 const regions = getRegions(filteredData);
//                 const regionData = regions[selectedRegion] || [];
//                 const marketData = regionData.filter(row =>
//                     getField(row, ["Market", "MARKET"]) === previousLevel.selected
//                 );
//                 setCurrentData(marketData);
//                 setCurrentView("stores");
//                 setSelectedStore("");
//             }
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

//     const renderTable = (
//         data: IASItem[],
//         level: string,
//         onRowClick: (group: AggregatedGroup) => void
//     ) => {
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
//             case "detailed":
//                 return renderDetailedTable(data);
//         }

//         return (
//             <div className="ias-table-block">
//                 <div className="ias-table-header">
//                     <h2>{title}</h2>
//                     <div className="ias-meta">
//                         {aggregated.length} groups — total value {formatCurrency(totalCost)}
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
//                                 <th style={{ width: "36%" }}>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass =
//                                     pct >= 70 ? "ias-fill-green" : pct >= 40 ? "ias-fill-amber" : "ias-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)}>
//                                         <td>{group.key}</td>
//                                         <td className="ias-col-right">{group.count}</td>
//                                         <td className="ias-col-right">{group.instock}</td>
//                                         <td className="ias-col-right">{group.total}</td>
//                                         <td className="ias-col-right">{formatCurrency(group.cost)}</td>
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

//     const renderDetailedTable = (data: IASItem[]) => {
//         return (
//             <div className="ias-table-block">
//                 <div className="ias-table-header">
//                     <h2>Detailed Report - {selectedStore}</h2>
//                     <div className="ias-meta">{data.length} inventory records</div>
//                 </div>

//                 <div className="ias-table-wrapper">
//                     <table className="ias-table">
//                         <thead>
//                             <tr>
//                                 <th>Store Name</th>
//                                 <th>Market</th>
//                                 <th>Status</th>
//                                 <th>SKU</th>
//                                 <th>Model</th>
//                                 <th>Product</th>
//                                 <th className="ias-col-right">IN STOCK</th>
//                                 <th className="ias-col-right">TOTAL</th>
//                                 <th className="ias-col-right">Cost</th>
//                                 <th className="ias-col-right">Net Worth</th>
//                                 <th>Address</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {data.map((row, index) => {
//                                 const storeName = getField(row, ["Store Name", "Store"]);
//                                 const market = getField(row, ["Market", "MARKET"]);
//                                 const status = getField(row, ["Status", "STATUS"]);
//                                 const sku = getField(row, ["SKU", "sku"]);
//                                 const model = getField(row, ["Model", "MODEL"]);
//                                 const product = getField(row, ["Product", "PRODUCT"]);
//                                 const instock = parseNumber(row.INSTOCK);
//                                 const total = parseNumber(row.TOTAL);
//                                 const cost = formatCurrency(parseCurrency(row.Cost));
//                                 const netWorth = formatCurrency(parseCurrency(row["Net Worth"]));
//                                 const address = getField(row, ["Store Address", "Address"]);

//                                 return (
//                                     <tr key={index}>
//                                         <td>{storeName}</td>
//                                         <td>{market}</td>
//                                         <td>{status}</td>
//                                         <td>{sku}</td>
//                                         <td>{model}</td>
//                                         <td>{product}</td>
//                                         <td className="ias-col-right">{instock}</td>
//                                         <td className="ias-col-right">{total}</td>
//                                         <td className="ias-col-right">{cost}</td>
//                                         <td className="ias-col-right">{netWorth}</td>
//                                         <td>{address}</td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         );
//     };

//     const summaryCards = buildSummaryCards(filteredData);

//     if (isLoading) {
//         return (
//             <div className="app-loading">
//                 <div className="loading-spinner"></div>
//                 <p>Loading...</p>
//             </div>
//         );
//     }

//     if (!isAuthenticated) return null;

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
//                                     onClick={handleExportCSV}
//                                 >
//                                     Export CSV
//                                 </button>
//                                 <button
//                                     className="btn btn-primary"
//                                     onClick={initData}
//                                 >
//                                     Refresh Data
//                                 </button>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Summary Cards */}
//                     <section className="dashboard-grid">
//                         {summaryCards.map((card, index) => (
//                             <div key={index} className="dashboard-card card-purple">
//                                 <div className="card-icon">{card.icon}</div>
//                                 <div className="card-content">
//                                     <h3 className="card-title">{card.label}</h3>
//                                     <p className="card-description">{card.value}</p>
//                                 </div>
//                             </div>
//                         ))}
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

//                     <section className="ias-stacked">
//                         {currentView === "regions" &&
//                             renderTable(currentData, "regions", handleRegionClick)}
//                         {currentView === "markets" &&
//                             renderTable(currentData, "markets", handleMarketClick)}
//                         {currentView === "stores" &&
//                             renderTable(currentData, "stores", handleStoreClick)}
//                         {currentView === "detailed" && renderDetailedTable(currentData)}
//                     </section>

//                     {/* Loading State */}
//                     {isLoadingData && (
//                         <div className="ias-loading">
//                             <div className="loading-spinner"></div>
//                             <p>Loading IAS data...</p>
//                         </div>
//                     )}
//                 </main>
//             </div>
//         </div>
//     );
// }




// app/dashboard/isr/page.tsx
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
//     const [filterMarket, setFilterMarket] = useState('all');
//     const [filterStatus, setFilterStatus] = useState('all');
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(50);
//     const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

//     // Create regions dynamically from markets
//     const getRegions = (data: IASReport[]) => {
//         const regions: { [key: string]: IASReport[] } = {
//             "Aleem Ghori Region": [],
//             "Hasnain Mustaqeem Region": []
//         };

//         const markets = Array.from(new Set(data.map(report => report.Market))).filter(m => m && m !== "Unknown");

//         // Distribute markets between regions
//         markets.forEach((market, index) => {
//             const regionName = index % 2 === 0 ? "Aleem Ghori Region" : "Hasnain Mustaqeem Region";
//             const marketData = data.filter(report => report.Market === market);
//             regions[regionName].push(...marketData);
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

//             const matchesMarket = filterMarket === 'all' || report.Market === filterMarket;
//             const matchesStatus = filterStatus === 'all' || report.Status === filterStatus;

//             return matchesSearch && matchesMarket && matchesStatus;
//         });
//     }, [currentData, searchTerm, filterMarket, filterStatus]);

//     // Pagination for detailed view
//     const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
//     const paginatedReports = useMemo(() => {
//         const startIndex = (currentPage - 1) * itemsPerPage;
//         return filteredReports.slice(startIndex, startIndex + itemsPerPage);
//     }, [filteredReports, currentPage, itemsPerPage]);

//     // Get unique values for filters
//     const markets = useMemo(() =>
//         Array.from(new Set(reports.map(report => report.Market))).filter(Boolean),
//         [reports]
//     );

//     const statuses = useMemo(() =>
//         Array.from(new Set(reports.map(report => report.Status))).filter(Boolean),
//         [reports]
//     );

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

//     // Toggle row expansion for details
//     const toggleRowExpansion = (id: string) => {
//         const newExpanded = new Set(expandedRows);
//         if (newExpanded.has(id)) {
//             newExpanded.delete(id);
//         } else {
//             newExpanded.add(id);
//         }
//         setExpandedRows(newExpanded);
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
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: region.key },
//         ]);
//     };

//     const handleMarketClick = (market: AggregatedGroup) => {
//         setCurrentData(market.rows);
//         setCurrentView('stores');
//         setSelectedMarket(market.key);
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
//                                     <tr key={index} onClick={() => onRowClick(group)}>
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

//     // Render detailed table (ORIGINAL STRUCTURE)
//     const renderDetailedTable = () => {
//         return (
//             <div className="table-container">
//                 {/* Filters and Controls */}
//                 <div className="controls-section">
//                     <div className="filters-row">
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

//                         <select
//                             value={filterMarket}
//                             onChange={(e) => setFilterMarket(e.target.value)}
//                             className="filter-select"
//                         >
//                             <option value="all">All Markets</option>
//                             {markets.map(market => (
//                                 <option key={market} value={market}>{market}</option>
//                             ))}
//                         </select>

//                         <select
//                             value={filterStatus}
//                             onChange={(e) => setFilterStatus(e.target.value)}
//                             className="filter-select"
//                         >
//                             <option value="all">All Statuses</option>
//                             {statuses.map(status => (
//                                 <option key={status} value={status}>{status}</option>
//                             ))}
//                         </select>

//                         <select
//                             value={itemsPerPage}
//                             onChange={(e) => setItemsPerPage(Number(e.target.value))}
//                             className="filter-select"
//                         >
//                             <option value={20}>20 per page</option>
//                             <option value={50}>50 per page</option>
//                             <option value={100}>100 per page</option>
//                         </select>

//                         <button onClick={fetchIASData} className="refresh-btn">
//                             🔄 Refresh
//                         </button>
//                     </div>
//                 </div>

//                 {/* Results Count */}
//                 <div className="results-info">
//                     Showing {paginatedReports.length} of {filteredReports.length} records
//                     {searchTerm && ` for "${searchTerm}"`}
//                 </div>

//                 {/* Main Table */}
//                 <table className="ias-table">
//                     <thead>
//                         <tr>
//                             <th>Store</th>
//                             <th>Market</th>
//                             <th>Status</th>
//                             <th>Product</th>
//                             <th>IN STOCK</th>
//                             <th>TOTAL</th>
//                             <th>Cost</th>
//                             <th>Net Worth</th>
//                             <th>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {paginatedReports.map((report, index) => (
//                             <React.Fragment key={`${report.ID}-${index}`}>
//                                 <tr className="main-row">
//                                     <td>
//                                         <div className="store-info">
//                                             <div className="store-name">{report['Store Name']}</div>
//                                             <div className="store-id">{report.ID}</div>
//                                         </div>
//                                     </td>
//                                     <td>{report.Market}</td>
//                                     <td>
//                                         <span className={`status-badge ${getStatusColor(report.Status)}`}>
//                                             {report.Status}
//                                         </span>
//                                     </td>
//                                     <td>
//                                         <div className="product-info">
//                                             <div className="product-name">{report.Product}</div>
//                                             <div className="product-sku">SKU: {report.SKU}</div>
//                                         </div>
//                                     </td>
//                                     <td className={parseInt(report.INSTOCK) > 0 ? 'in-stock' : 'out-of-stock'}>
//                                         {report.INSTOCK}
//                                     </td>
//                                     <td>{report.TOTAL}</td>
//                                     <td>{report.Cost}</td>
//                                     <td>{report['Net Worth']}</td>
//                                     <td>
//                                         <button
//                                             onClick={() => showDetails(report)}
//                                             className="details-btn"
//                                         >
//                                             Details
//                                         </button>
//                                         <button
//                                             onClick={() => toggleRowExpansion(report.ID || `${index}`)}
//                                             className="expand-btn"
//                                         >
//                                             {expandedRows.has(report.ID || `${index}`) ? '▼' : '►'} More
//                                         </button>
//                                     </td>
//                                 </tr>

//                                 {expandedRows.has(report.ID || `${index}`) && (
//                                     <tr className="detail-row">
//                                         <td colSpan={9}>
//                                             <div className="detail-panel">
//                                                 <div className="detail-section">
//                                                     <h4>Inventory Details</h4>
//                                                     <div className="detail-grid">
//                                                         <div><strong>ON TRANSFER:</strong> {report['ON TRANSFER']}</div>
//                                                         <div><strong>IN Transit:</strong> {report['IN Transit']}</div>
//                                                         <div><strong>BACKDATED:</strong> {report.BACKDATED}</div>
//                                                         <div><strong>GROUND:</strong> {report.GROUND}</div>
//                                                     </div>
//                                                 </div>

//                                                 <div className="detail-section">
//                                                     <h4>Sales Performance</h4>
//                                                     <div className="detail-grid">
//                                                         <div><strong>New Activation:</strong> {report['New Activation']}</div>
//                                                         <div><strong>SWITCHER:</strong> {report.SWITCHER}</div>
//                                                         <div><strong>UPGRADE:</strong> {report.UPGRADE}</div>
//                                                         <div><strong>Performance:</strong> {report['%']}</div>
//                                                     </div>
//                                                 </div>

//                                                 <div className="detail-section">
//                                                     <h4>Shipping & Allocation</h4>
//                                                     <div className="detail-grid">
//                                                         <div><strong>SUG QTY:</strong> {report['SUG QTY']}</div>
//                                                         <div><strong>ALLOCATION:</strong> {report.ALLOCATION}</div>
//                                                         <div><strong>Total ACC Sale:</strong> {report['Total ACC Sale']}</div>
//                                                         <div><strong>PPD:</strong> {report.PPD}</div>
//                                                     </div>
//                                                 </div>

//                                                 <div className="detail-section">
//                                                     <h4>Store Information</h4>
//                                                     <div className="store-address">{report['Store Address']}</div>
//                                                     <div><strong>Sub Market:</strong> {report['Sub Market']}</div>
//                                                 </div>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 )}
//                             </React.Fragment>
//                         ))}
//                     </tbody>
//                 </table>

//                 {paginatedReports.length === 0 && (
//                     <div className="no-data">
//                         No records found matching your criteria.
//                     </div>
//                 )}

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
//             <div className="ias-page">
//                 <div className="loading-container">
//                     <div className="loading-spinner"></div>
//                     <p>Loading IAS Reports...</p>
//                 </div>
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
//         <div className="ias-page">
//             <div className="ias-header">
//                 <h1>IAS Reports - Inventory Analytics</h1>
//                 <p>Comprehensive inventory and sales performance tracking</p>
//             </div>

//             {/* Summary Stats */}
//             <div className="stats-grid">
//                 <div className="stat-card">
//                     <div className="stat-value">{summaryStats.totalStores}</div>
//                     <div className="stat-label">Total Stores</div>
//                 </div>
//                 <div className="stat-card">
//                     <div className="stat-value">{summaryStats.totalInventory}</div>
//                     <div className="stat-label">Total Inventory</div>
//                 </div>
//                 <div className="stat-card">
//                     <div className="stat-value">${summaryStats.totalValue.toLocaleString()}</div>
//                     <div className="stat-label">Inventory Value</div>
//                 </div>
//                 <div className="stat-card">
//                     <div className="stat-value">{summaryStats.activeStores}</div>
//                     <div className="stat-label">Active Stores</div>
//                 </div>
//             </div>

//             {/* Navigation */}
//             <div className="ias-nav-row">
//                 <button
//                     className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
//                     onClick={handleBackClick}
//                 >
//                     ← Back
//                 </button>
//                 <div className="ias-breadcrumb">
//                     {renderBreadcrumb()}
//                 </div>
//             </div>

//             {/* Hierarchical Views */}
//             {currentView === "regions" &&
//                 renderHierarchicalTable(currentData, "regions", handleRegionClick)}
//             {currentView === "markets" &&
//                 renderHierarchicalTable(currentData, "markets", handleMarketClick)}
//             {currentView === "stores" &&
//                 renderHierarchicalTable(currentData, "stores", handleStoreClick)}
//             {currentView === "detailed" && renderDetailedTable()}

//             {/* Details Modal */}
//             {selectedDetails && (
//                 <div className="modal-overlay" onClick={closeDetails}>
//                     <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//                         <div className="modal-header">
//                             <h3>SKU Details</h3>
//                             <button className="close-btn" onClick={closeDetails}>×</button>
//                         </div>
//                         <div className="modal-body">
//                             <div className="detail-grid">
//                                 <div><strong>Store:</strong> {selectedDetails['Store Name']}</div>
//                                 <div><strong>Market:</strong> {selectedDetails.Market}</div>
//                                 <div><strong>SKU:</strong> {selectedDetails.SKU}</div>
//                                 <div><strong>Model:</strong> {selectedDetails.Model}</div>
//                                 <div><strong>Product:</strong> {selectedDetails.Product}</div>
//                                 <div><strong>Status:</strong> {selectedDetails.Status}</div>
//                                 <div><strong>IN STOCK:</strong> {selectedDetails.INSTOCK}</div>
//                                 <div><strong>TOTAL:</strong> {selectedDetails.TOTAL}</div>
//                                 <div><strong>Cost:</strong> {selectedDetails.Cost}</div>
//                                 <div><strong>Net Worth:</strong> {selectedDetails['Net Worth']}</div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
//}





















// app/dashboard/isr/page.tsx
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
//     const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

//     // Create regions dynamically from markets
//     const getRegions = (data: IASReport[]) => {
//         const regions: { [key: string]: IASReport[] } = {
//             "Aleem Ghori Region": [],
//             "Hasnain Mustaqeem Region": []
//         };

//         const markets = Array.from(new Set(data.map(report => report.Market))).filter(m => m && m !== "Unknown");

//         // Distribute markets between regions
//         markets.forEach((market, index) => {
//             const regionName = index % 2 === 0 ? "Aleem Ghori Region" : "Hasnain Mustaqeem Region";
//             const marketData = data.filter(report => report.Market === market);
//             regions[regionName].push(...marketData);
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

//     // Toggle row expansion for details
//     const toggleRowExpansion = (id: string) => {
//         const newExpanded = new Set(expandedRows);
//         if (newExpanded.has(id)) {
//             newExpanded.delete(id);
//         } else {
//             newExpanded.add(id);
//         }
//         setExpandedRows(newExpanded);
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
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Markets", selected: region.key },
//         ]);
//     };

//     const handleMarketClick = (market: AggregatedGroup) => {
//         setCurrentData(market.rows);
//         setCurrentView('stores');
//         setSelectedMarket(market.key);
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

//     // Render detailed table (ORIGINAL STRUCTURE with consistent styling)
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

//                 {/* Search Box Only - No Market/Status Filters */}
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
//                             {paginatedReports.map((report, index) => (
//                                 <React.Fragment key={`${report.ID}-${index}`}>
//                                     <tr className="main-row">
//                                         <td>
//                                             <div className="store-info">
//                                                 <div className="store-name">{report['Store Name']}</div>
//                                                 <div className="store-id">{report.ID}</div>
//                                             </div>
//                                         </td>
//                                         <td>{report.Market}</td>
//                                         <td>
//                                             <span className={`status-indicator status-${getStatusColor(report.Status)}`}>
//                                                 {report.Status}
//                                             </span>
//                                         </td>
//                                         <td>
//                                             <div className="product-info">
//                                                 <div className="product-name">{report.Product}</div>
//                                                 <div className="product-sku">SKU: {report.SKU}</div>
//                                             </div>
//                                         </td>
//                                         <td className={`ias-col-right ${parseInt(report.INSTOCK) > 0 ? 'in-stock' : 'out-of-stock'}`}>
//                                             {report.INSTOCK}
//                                         </td>
//                                         <td className="ias-col-right">{report.TOTAL}</td>
//                                         <td className="ias-col-right">{report.Cost}</td>
//                                         <td className="ias-col-right">{report['Net Worth']}</td>
//                                         <td>
//                                             <button
//                                                 onClick={() => showDetails(report)}
//                                                 className="details-btn"
//                                             >
//                                                 Details
//                                             </button>
//                                             <button
//                                                 onClick={() => toggleRowExpansion(report.ID || `${index}`)}
//                                                 className="expand-btn"
//                                             >
//                                                 {expandedRows.has(report.ID || `${index}`) ? '▼' : '►'} More
//                                             </button>
//                                         </td>
//                                     </tr>

//                                     {expandedRows.has(report.ID || `${index}`) && (
//                                         <tr className="detail-row">
//                                             <td colSpan={9}>
//                                                 <div className="detail-panel">
//                                                     <div className="detail-section">
//                                                         <h4>Inventory Details</h4>
//                                                         <div className="detail-grid">
//                                                             <div><strong>ON TRANSFER:</strong> {report['ON TRANSFER']}</div>
//                                                             <div><strong>IN Transit:</strong> {report['IN Transit']}</div>
//                                                             <div><strong>BACKDATED:</strong> {report.BACKDATED}</div>
//                                                             <div><strong>GROUND:</strong> {report.GROUND}</div>
//                                                         </div>
//                                                     </div>

//                                                     <div className="detail-section">
//                                                         <h4>Sales Performance</h4>
//                                                         <div className="detail-grid">
//                                                             <div><strong>New Activation:</strong> {report['New Activation']}</div>
//                                                             <div><strong>SWITCHER:</strong> {report.SWITCHER}</div>
//                                                             <div><strong>UPGRADE:</strong> {report.UPGRADE}</div>
//                                                             <div><strong>Performance:</strong> {report['%']}</div>
//                                                         </div>
//                                                     </div>

//                                                     <div className="detail-section">
//                                                         <h4>Shipping & Allocation</h4>
//                                                         <div className="detail-grid">
//                                                             <div><strong>SUG QTY:</strong> {report['SUG QTY']}</div>
//                                                             <div><strong>ALLOCATION:</strong> {report.ALLOCATION}</div>
//                                                             <div><strong>Total ACC Sale:</strong> {report['Total ACC Sale']}</div>
//                                                             <div><strong>PPD:</strong> {report.PPD}</div>
//                                                         </div>
//                                                     </div>

//                                                     <div className="detail-section">
//                                                         <h4>Store Information</h4>
//                                                         <div className="store-address">{report['Store Address']}</div>
//                                                         <div><strong>Sub Market:</strong> {report['Sub Market']}</div>
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     )}
//                                 </React.Fragment>
//                             ))}
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
    Region?: string; // Add Region field if it exists in your sheet
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
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedDetails, setSelectedDetails] = useState<IASReport | null>(null);

    // Hierarchical navigation state
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

            // Log available fields to help debug
            if (parsedData.length > 0) {
                console.log('Available fields:', Object.keys(parsedData[0]));
                console.log('Sample markets:', Array.from(new Set(parsedData.map(r => r.Market))).slice(0, 10));
            }
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

    // Create regions based on actual market data from your sheet
    const getRegions = (data: IASReport[]) => {
        const regions: { [key: string]: IASReport[] } = {
            "Aleem Ghori Region": [],
            "Hasnain Mustaqeem Region": []
        };

        // Get all unique markets from your actual data
        const markets = Array.from(new Set(data.map(report => report.Market))).filter(m => m && m !== "Unknown");

        console.log('All markets found:', markets);

        // Define which markets belong to which region based on your actual data
        // You'll need to update this mapping based on your actual market-region relationships
        const regionMarketMapping: { [key: string]: string[] } = {
            "Aleem Ghori Region": [],
            "Hasnain Mustaqeem Region": []
        };

        // Auto-detect region assignment based on common patterns
        // This is a fallback - you should update this with your actual market-region mapping
        markets.forEach(market => {
            // Simple heuristic - you should replace this with your actual mapping
            const marketUpper = market.toUpperCase();

            if (
                marketUpper.includes('ARIZONA') ||
                marketUpper.includes('TEXAS') ||
                marketUpper.includes('CALIFORNIA') ||
                marketUpper.includes('PHOENIX') ||
                marketUpper.includes('DALLAS') ||
                marketUpper.includes('HOUSTON') ||
                marketUpper.includes('LOS ANGELES') ||
                marketUpper.includes('SAN DIEGO')
            ) {
                regionMarketMapping["Aleem Ghori Region"].push(market);
            } else if (
                marketUpper.includes('FLORIDA') ||
                marketUpper.includes('GEORGIA') ||
                marketUpper.includes('NEW YORK') ||
                marketUpper.includes('MIAMI') ||
                marketUpper.includes('ORLANDO') ||
                marketUpper.includes('ATLANTA') ||
                marketUpper.includes('BROOKLYN') ||
                marketUpper.includes('BUFFALO')
            ) {
                regionMarketMapping["Hasnain Mustaqeem Region"].push(market);
            } else {
                // Default assignment for unknown markets
                const randomAssignment = Math.random() > 0.5 ? "Aleem Ghori Region" : "Hasnain Mustaqeem Region";
                regionMarketMapping[randomAssignment].push(market);
            }
        });

        console.log('Region mapping:', regionMarketMapping);

        // Assign data to regions based on the mapping
        data.forEach(report => {
            const market = report.Market;
            let assigned = false;

            for (const [regionName, marketList] of Object.entries(regionMarketMapping)) {
                if (marketList.includes(market)) {
                    regions[regionName].push(report);
                    assigned = true;
                    break;
                }
            }

            // If no assignment found, use default
            if (!assigned) {
                const defaultRegion = Math.random() > 0.5 ? "Aleem Ghori Region" : "Hasnain Mustaqeem Region";
                regions[defaultRegion].push(report);
            }
        });

        return regions;
    };

    // Get store region for display in detailed view
    const getStoreRegion = (report: IASReport): string => {
        const regions = getRegions([report]);
        for (const [regionName, regionData] of Object.entries(regions)) {
            if (regionData.some(r => r.Market === report.Market && r['Store Name'] === report['Store Name'])) {
                return regionName;
            }
        }
        return "Unknown Region";
    };

    // Aggregate data for hierarchical views
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
                    count: regionData.length,
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
                    count: marketData.length,
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
                    count: storeData.length,
                    instock: totalInstock,
                    total: totalInventory,
                    cost: totalCost,
                    rows: storeData
                };
            });
        }

        return Object.values(groups).sort((a, b) => b.cost - a.cost);
    };

    // Filter and search logic for detailed view
    const filteredReports = useMemo(() => {
        return currentData.filter(report => {
            const matchesSearch =
                report['Store Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['Product']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['SKU']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report['ID']?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesSearch;
        });
    }, [currentData, searchTerm]);

    // Pagination for detailed view
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReports, currentPage, itemsPerPage]);

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        const totalStores = reports.length;
        const totalInventory = reports.reduce((sum, report) => sum + (parseInt(report.INSTOCK) || 0), 0);
        const totalValue = reports.reduce((sum, report) => {
            const cost = parseFloat(report.Cost?.replace(/[^\d.-]/g, '') || '0');
            const instock = parseInt(report.INSTOCK) || 0;
            return sum + (cost * instock);
        }, 0);

        const activeStores = reports.filter(report =>
            parseInt(report.INSTOCK) > 0 || parseInt(report['ON TRANSFER']) > 0
        ).length;

        return { totalStores, totalInventory, totalValue, activeStores };
    }, [reports]);

    // Toggle row expansion for details
    const toggleRowExpansion = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Show details modal
    const showDetails = (report: IASReport) => {
        setSelectedDetails(report);
    };

    // Close details modal
    const closeDetails = () => {
        setSelectedDetails(null);
    };

    // Hierarchical navigation handlers
    const handleRegionClick = (region: AggregatedGroup) => {
        setCurrentData(region.rows);
        setCurrentView('markets');
        setSelectedRegion(region.key);
        setHistoryStack([
            { level: "Regions" },
            { level: "Markets", selected: region.key },
        ]);
    };

    const handleMarketClick = (market: AggregatedGroup) => {
        setCurrentData(market.rows);
        setCurrentView('stores');
        setSelectedMarket(market.key);
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
        } else {
            const newStack = historyStack.slice(0, -1);
            setHistoryStack(newStack);

            const previousLevel = newStack[newStack.length - 1];

            if (previousLevel.level === "Regions") {
                setCurrentData(reports);
                setCurrentView('regions');
                setSelectedRegion('');
            } else if (previousLevel.level === "Markets") {
                const regions = getRegions(reports);
                const regionData = regions[previousLevel.selected!] || [];
                setCurrentData(regionData);
                setCurrentView('markets');
                setSelectedMarket('');
            } else if (previousLevel.level === "Stores") {
                const regions = getRegions(reports);
                const regionData = regions[selectedRegion] || [];
                const marketData = regionData.filter(report => report.Market === previousLevel.selected);
                setCurrentData(marketData);
                setCurrentView('stores');
                setSelectedStore('');
            }
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

    // Status badge color
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

    // Render hierarchical tables
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
                        {aggregated.length} groups — total value ${totalCost.toLocaleString()}
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

    // Render detailed table
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

                {/* Search Box Only */}
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
                            <button onClick={fetchIASData} className="btn btn-primary">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="ias-table-wrapper">
                    <table className="ias-table">
                        <thead>
                            <tr>
                                <th>Store</th>
                                <th>Market</th>
                                <th>Region</th>
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
                            {paginatedReports.map((report, index) => (
                                <React.Fragment key={`${report.ID}-${index}`}>
                                    <tr className="main-row">
                                        <td>
                                            <div className="store-info">
                                                <div className="store-name">{report['Store Name']}</div>
                                                <div className="store-id">{report.ID}</div>
                                            </div>
                                        </td>
                                        <td>{report.Market}</td>
                                        <td>
                                            <span className="region-badge">{getStoreRegion(report)}</span>
                                        </td>
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
                                                onClick={() => toggleRowExpansion(report.ID || `${index}`)}
                                                className="expand-btn"
                                            >
                                                {expandedRows.has(report.ID || `${index}`) ? '▼' : '►'} More
                                            </button>
                                        </td>
                                    </tr>

                                    {expandedRows.has(report.ID || `${index}`) && (
                                        <tr className="detail-row">
                                            <td colSpan={10}>
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
                                                        <div><strong>Region:</strong> {getStoreRegion(report)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>

                    {paginatedReports.length === 0 && (
                        <div className="no-data">
                            No records found matching your criteria.
                        </div>
                    )}
                </div>

                {/* Pagination */}
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
                            <div className="main">IAS Reports</div>
                            <div className="sub">
                                Inventory Analytics System - Store Performance
                            </div>
                        </div>
                    </div>
                </header>

                <main className="main-area">
                    {/* Controls Section */}
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
                                <button
                                    className="btn btn-primary"
                                    onClick={fetchIASData}
                                >
                                    Refresh Data
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
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

                    {/* Navigation */}
                    <div className="ias-nav-row">
                        <button
                            className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
                            onClick={handleBackClick}
                        >
                            ← Back
                        </button>
                        <div className="ias-breadcrumb">
                            {renderBreadcrumb()}
                        </div>
                    </div>

                    {/* Hierarchical Views */}
                    <section className="ias-stacked">
                        {currentView === "regions" &&
                            renderHierarchicalTable(currentData, "regions", handleRegionClick)}
                        {currentView === "markets" &&
                            renderHierarchicalTable(currentData, "markets", handleMarketClick)}
                        {currentView === "stores" &&
                            renderHierarchicalTable(currentData, "stores", handleStoreClick)}
                        {currentView === "detailed" && renderDetailedTable()}
                    </section>

                    {/* Loading State */}
                    {loading && (
                        <div className="ias-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading IAS data...</p>
                        </div>
                    )}

                    {/* Details Modal */}
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
                                        <div><strong>Region:</strong> {getStoreRegion(selectedDetails)}</div>
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