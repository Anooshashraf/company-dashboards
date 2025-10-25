// "use client";
// import { useAuth } from "../../../components/AuthProvider";
// import { useRouter } from "next/navigation";
// import { useEffect, useState, useCallback } from "react";
// import "./audit-styles.css";

// interface AuditItem {
//     [key: string]: string | number;
// }

// interface AggregatedGroup {
//     key: string;
//     count: number;
//     devices: number;
//     cost: number;
//     rows: AuditItem[];
// }

// interface StatusSummary {
//     status: string;
//     count: number;
//     devices: number;
//     cost: number;
//     color: string;
// }

// export default function AuditDashboard() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [rawData, setRawData] = useState<AuditItem[]>([]);
//     const [filteredData, setFilteredData] = useState<AuditItem[]>([]);
//     const [fromDate, setFromDate] = useState<string>("");
//     const [toDate, setToDate] = useState<string>("");
//     const [sheetUrl] = useState<string>(
//         "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhKMtyCA2gB3lHwcP9hGLhDgmCUUqXVNmthUsFggsgaFeFuOYOPzjctQmkHMZ4ZA/pub?gid=259016646&single=true&output=csv"
//     );
//     const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
//     const [currentView, setCurrentView] = useState<
//         "regions" | "market" | "status" | "detailed"
//     >("regions");
//     const [currentData, setCurrentData] = useState<AuditItem[]>([]);
//     const [selectedRegion, setSelectedRegion] = useState<string>("");
//     const [selectedMarket, setSelectedMarket] = useState<string>("");
//     const [selectedStatus, setSelectedStatus] = useState<string>("");
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

//     const parseDateMDY = (s: string): Date | null => {
//         if (!s) return null;
//         if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
//             const [mm, dd, yy] = s.split("/");
//             return new Date(Number(yy), Number(mm) - 1, Number(dd));
//         }
//         const d = new Date(s);
//         return isNaN(d.getTime()) ? null : d;
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

//     const getField = (obj: AuditItem, candidates: string[]): string => {
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

//     const countNonEmptyIMEI = (row: AuditItem): number => {
//         const imeiValue = getField(row, [
//             "FullIMEI#",
//             "IMEI",
//             "imei",
//             "CUSTOMER IMEI",
//         ]);
//         return imeiValue &&
//             String(imeiValue).trim() !== "" &&
//             imeiValue !== "Unknown" &&
//             imeiValue !== "0"
//             ? 1
//             : 0;
//     };

//     const detectKey = (candidates: string[]): string => {
//         if (!filteredData || filteredData.length === 0) return candidates[0];

//         const allKeys = Object.keys(filteredData[0] || {});

//         for (const candidate of candidates) {
//             const hasKey = filteredData.some((row) => {
//                 const value = getField(row, [candidate]);
//                 return value && value !== "Unknown" && value !== "";
//             });
//             if (hasKey) return candidate;
//         }

//         for (const candidate of candidates) {
//             const matchedKey = allKeys.find((key) =>
//                 key.toLowerCase().includes(candidate.toLowerCase())
//             );
//             if (matchedKey) {
//                 const hasData = filteredData.some((row) => {
//                     const value = String(row[matchedKey] || "").trim();
//                     return value && value !== "Unknown" && value !== "";
//                 });
//                 if (hasData) return matchedKey;
//             }
//         }

//         return candidates[0];
//     };

//     const aggregate = (data: AuditItem[], keyField: string, level: string = ""): AggregatedGroup[] => {
//         const groups: {
//             [key: string]: {
//                 count: number;
//                 devices: number;
//                 cost: number;
//                 rows: AuditItem[];
//             };
//         } = {};

//         const validRegions = ["Aleem Ghori Region", "Hasnain Mustaqeem Region"];

//         data.forEach((row) => {
//             const keyRaw = getField(row, [keyField]);
//             const key = String(keyRaw || "").trim();

//             if (!key || key === "Unknown" || key === "") return;

//             if (level === "regions" && keyField.toLowerCase().includes("region")) {
//                 const isValidRegion = validRegions.some(region =>
//                     region.toLowerCase() === key.toLowerCase()
//                 );
//                 if (!isValidRegion) {
//                     console.log("Filtering out invalid region:", key);
//                     return;
//                 }
//             }

//             if (!groups[key])
//                 groups[key] = {
//                     count: 0,
//                     devices: 0,
//                     cost: 0,
//                     rows: [],
//                 };

//             groups[key].count += 1;
//             groups[key].devices += countNonEmptyIMEI(row);
//             groups[key].cost += parseCurrency(
//                 getField(row, ["Cost", "COST", "cost"])
//             );
//             groups[key].rows.push(row);
//         });

//         const result = Object.keys(groups)
//             .map((k) => ({
//                 key: k,
//                 count: groups[k].count,
//                 devices: groups[k].devices,
//                 cost: groups[k].cost,
//                 rows: groups[k].rows,
//             }))
//             .sort((a, b) => b.cost - a.cost);

//         return result;
//     };

//     const buildStatusSummary = (data: AuditItem[]): StatusSummary[] => {
//         const statusGroups: { [key: string]: StatusSummary } = {};

//         data.forEach((row) => {
//             const status = getField(row, ["Status", "STATUS", "status"]);
//             const cost = parseCurrency(getField(row, ["Cost", "COST", "cost"]));
//             const devices = countNonEmptyIMEI(row);

//             if (!statusGroups[status]) {
//                 statusGroups[status] = {
//                     status,
//                     count: 0,
//                     devices: 0,
//                     cost: 0,
//                     color: getStatusColor(status)
//                 };
//             }

//             statusGroups[status].count += 1;
//             statusGroups[status].devices += devices;
//             statusGroups[status].cost += cost;
//         });

//         return Object.values(statusGroups).sort((a, b) => b.cost - a.cost);
//     };

//     const getStatusColor = (status: string): string => {
//         const statusColors: { [key: string]: string } = {
//             'Active': 'green',
//             'Sold': 'blue',
//             'Demo': 'purple',
//             'Adjustment': 'orange',
//             'Returned': 'red',
//             'Damaged': 'red',
//             'Lost': 'gray'
//         };

//         return statusColors[status] || 'gray';
//     };

//     const fetchCSV = async (url: string): Promise<AuditItem[]> => {
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
//                     const obj: AuditItem = {};
//                     headers.forEach((header, index) => {
//                         obj[header] = values[index] || "";
//                     });
//                     return obj;
//                 })
//                 .filter((row) => Object.values(row).some((val) => val !== ""));

//             if (data.length > 0) {
//                 console.log("Available CSV fields:", Object.keys(data[0]));
//                 console.log("Sample data:", data.slice(0, 3));
//             }

//             return data;
//         } catch (err) {
//             console.warn("Fetching CSV failed:", err);
//             return [];
//         }
//     };

//     const applyFilters = (data: AuditItem[]): AuditItem[] => {
//         const from = fromDate ? new Date(fromDate) : null;
//         const to = toDate ? new Date(toDate) : null;
//         if (!from && !to) return data;

//         return data.filter((row) => {
//             const raw = getField(row, [
//                 "SerialDate",
//                 "Date",
//                 "ProcessedDate",
//             ]);
//             const d = parseDateMDY(raw);
//             if (!d) return false;
//             if (from && d < from) return false;
//             if (to) {
//                 const toEnd = new Date(
//                     to.getFullYear(),
//                     to.getMonth(),
//                     to.getDate(),
//                     23,
//                     59,
//                     59
//                 );
//                 if (d > toEnd) return false;
//             }
//             return true;
//         });
//     };

//     const buildSummaryCards = (data: AuditItem[]) => {
//         const totalAudits = data.length;
//         const totalDevices = data.reduce((s, r) => s + countNonEmptyIMEI(r), 0);
//         const totalCost = data.reduce(
//             (s, r) => s + parseCurrency(getField(r, ["Cost", "COST", "cost"])),
//             0
//         );
//         const uniqueStatuses = new Set(data.map(r => getField(r, ["Status", "STATUS", "status"]))).size;

//         const cards = [
//             { label: "Total Audits", value: totalAudits, icon: "📋" },
//             { label: "Total Devices", value: totalDevices, icon: "📱" },
//             { label: "Total Value", value: formatCurrency(totalCost), icon: "💰" },
//             { label: "Status Types", value: uniqueStatuses, icon: "🏷️" },
//         ];

//         return cards;
//     };

//     const initData = async () => {
//         setIsLoadingData(true);
//         const data = await fetchCSV(sheetUrl);
//         if (data && data.length > 0) {
//             setRawData(data);
//             const filtered = applyFilters(data);
//             setFilteredData(filtered);
//             setCurrentData(filtered);

//             const dateVals = data
//                 .map((r) => parseDateMDY(getField(r, ["SerialDate", "Date"])))
//                 .filter(Boolean) as Date[];
//             if (dateVals.length) {
//                 const minD = new Date(Math.min(...dateVals.map((d) => d.getTime())));
//                 const maxD = new Date(Math.max(...dateVals.map((d) => d.getTime())));
//                 setFromDate(minD.toISOString().slice(0, 10));
//                 setToDate(maxD.toISOString().slice(0, 10));
//             }

//             setHistoryStack([{ level: "Regions" }]);
//         } else {
//             setFilteredData([]);
//             setCurrentData([]);
//         }
//         setIsLoadingData(false);
//     };

//     const handleApplyFilters = () => {
//         const filtered = applyFilters(rawData);
//         setFilteredData(filtered);
//         setCurrentData(filtered);
//         setCurrentView("regions");
//         setHistoryStack([{ level: "Regions" }]);
//         setSelectedRegion("");
//         setSelectedMarket("");
//         setSelectedStatus("");
//     };

//     const handleResetFilters = () => {
//         setFromDate("");
//         setToDate("");
//         setFilteredData(rawData);
//         setCurrentData(rawData);
//         setCurrentView("regions");
//         setHistoryStack([{ level: "Regions" }]);
//         setSelectedRegion("");
//         setSelectedMarket("");
//         setSelectedStatus("");
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
//         a.download = "audit_export.csv";
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//     };

//     const handleRegionClick = (region: AggregatedGroup) => {
//         const marketData = region.rows;
//         setCurrentData(marketData);
//         setCurrentView("market");
//         setSelectedRegion(region.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Market", selected: region.key },
//         ]);
//     };

//     const handleMarketClick = (market: AggregatedGroup) => {
//         const statusData = market.rows;
//         setCurrentData(statusData);
//         setCurrentView("status");
//         setSelectedMarket(market.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Market", selected: selectedRegion },
//             { level: "Status", selected: market.key },
//         ]);
//     };

//     const handleStatusClick = (status: AggregatedGroup) => {
//         const detailedData = status.rows;
//         setCurrentData(detailedData);
//         setCurrentView("detailed");
//         setSelectedStatus(status.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Market", selected: selectedRegion },
//             { level: "Status", selected: selectedMarket },
//             { level: "Detailed", selected: status.key },
//         ]);
//     };

//     const handleBackClick = () => {
//         if (historyStack.length <= 1) {
//             setCurrentData(filteredData);
//             setCurrentView("regions");
//             setHistoryStack([{ level: "Regions" }]);
//             setSelectedRegion("");
//             setSelectedMarket("");
//             setSelectedStatus("");
//         } else {
//             const newStack = historyStack.slice(0, -1);
//             setHistoryStack(newStack);

//             const previousLevel = newStack[newStack.length - 1];

//             if (previousLevel.level === "Regions") {
//                 setCurrentData(filteredData);
//                 setCurrentView("regions");
//                 setSelectedRegion("");
//             } else if (previousLevel.level === "Market") {
//                 const regionKey = detectKey(["Regions", "Region", "REGIONS"]);
//                 const regionData = filteredData.filter(
//                     (row) => getField(row, [regionKey]) === previousLevel.selected
//                 );
//                 setCurrentData(regionData);
//                 setCurrentView("market");
//                 setSelectedMarket("");
//             } else if (previousLevel.level === "Status") {
//                 const regionKey = detectKey(["Regions", "Region", "REGIONS"]);
//                 const marketKey = detectKey(["Market", "Market Name", "MARKET"]);
//                 const statusData = filteredData.filter(
//                     (row) =>
//                         getField(row, [regionKey]) === selectedRegion &&
//                         getField(row, [marketKey]) === previousLevel.selected
//                 );
//                 setCurrentData(statusData);
//                 setCurrentView("status");
//                 setSelectedStatus("");
//             }
//         }
//     };

//     const renderBreadcrumb = () => {
//         return historyStack.map((item, index) => (
//             <span key={index} className="audit-breadcrumb">
//                 {item.selected ? `${item.level} — ${item.selected}` : item.level}
//                 {index < historyStack.length - 1 && (
//                     <span className="mx-2 text-gray-400">›</span>
//                 )}
//             </span>
//         ));
//     };

//     // const renderStatusSummary = (data: AuditItem[]) => {
//     //     const statusSummary = buildStatusSummary(data);
//     //     const totalCost = statusSummary.reduce((sum, item) => sum + item.cost, 0);

//     //     return (
//     //         <div className="audit-table-block">
//     //             <div className="audit-table-header">
//     //                 <h2>Status Summary - {selectedMarket}</h2>
//     //                 <div className="audit-meta">
//     //                     {statusSummary.length} status types — total value {formatCurrency(totalCost)}
//     //                 </div>
//     //             </div>

//     //             <div className="audit-table-wrapper">
//     //                 <table className="audit-table">
//     //                     <thead>
//     //                         <tr>
//     //                             <th>Status</th>
//     //                             <th className="audit-col-right">Audit Count</th>
//     //                             <th className="audit-col-right">Devices</th>
//     //                             <th className="audit-col-right">Total Value</th>
//     //                             <th>Value Distribution</th>
//     //                         </tr>
//     //                     </thead>
//     //                     <tbody>
//     //                         {statusSummary.map((status, index) => {
//     //                             const pct = totalCost > 0 ? Math.round((status.cost / totalCost) * 100) : 0;
//     //                             const fillClass = `audit-fill-${status.color}`;

//     //                             return (
//     //                                 <tr key={index} onClick={() => handleStatusClick({
//     //                                     key: status.status,
//     //                                     count: status.count,
//     //                                     devices: status.devices,
//     //                                     cost: status.cost,
//     //                                     rows: data.filter(row => getField(row, ["Status"]) === status.status)
//     //                                 })}>
//     //                                     <td>
//     //                                         <span className={`status-indicator status-${status.color}`}>
//     //                                             {status.status}
//     //                                         </span>
//     //                                     </td>
//     //                                     <td className="audit-col-right">{status.count}</td>
//     //                                     <td className="audit-col-right">{status.devices}</td>
//     //                                     <td className="audit-col-right">{formatCurrency(status.cost)}</td>
//     //                                     <td>
//     //                                         <div className="audit-bar-cell">
//     //                                             <div className="audit-bar-track">
//     //                                                 <div
//     //                                                     className={`audit-bar-fill ${fillClass}`}
//     //                                                     style={{ width: `${pct}%` }}
//     //                                                 ></div>
//     //                                             </div>
//     //                                             <div style={{ minWidth: "52px", textAlign: "right" }}>
//     //                                                 {pct}%
//     //                                             </div>
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
//     const renderStatusSummary = (data: AuditItem[]) => {
//         const statusSummary = buildStatusSummary(data);
//         const totalCost = statusSummary.reduce((sum, item) => sum + item.cost, 0);

//         return (
//             <div className="audit-table-block">
//                 <div className="audit-table-header">
//                     <h2>Status Summary - {selectedMarket}</h2>
//                     <div className="audit-meta">
//                         {statusSummary.length} status types — total value {formatCurrency(totalCost)}
//                     </div>
//                 </div>

//                 <div className="audit-table-wrapper">
//                     <table className="audit-table">
//                         <thead>
//                             <tr>
//                                 <th>Status</th>
//                                 <th className="audit-col-right">Audit Count</th>
//                                 <th className="audit-col-right">Devices</th>
//                                 <th className="audit-col-right">Total Value</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {statusSummary.map((status, index) => {
//                                 const pct = totalCost > 0 ? Math.round((status.cost / totalCost) * 100) : 0;


//                                 let barColor = '';
//                                 if (pct >= 50) {
//                                     barColor = 'audit-fill-green';
//                                 } else if (pct >= 20) {
//                                     barColor = 'audit-fill-amber';
//                                 } else {
//                                     barColor = 'audit-fill-red';
//                                 }

//                                 return (
//                                     <tr key={index} onClick={() => handleStatusClick({
//                                         key: status.status,
//                                         count: status.count,
//                                         devices: status.devices,
//                                         cost: status.cost,
//                                         rows: data.filter(row => getField(row, ["Status"]) === status.status)
//                                     })}>
//                                         <td>
//                                             <span className={`status-indicator status-${status.color}`}>
//                                                 {status.status}
//                                             </span>
//                                         </td>
//                                         <td className="audit-col-right">{status.count}</td>
//                                         <td className="audit-col-right">{status.devices}</td>
//                                         <td className="audit-col-right">{formatCurrency(status.cost)}</td>
//                                         <td>
//                                             <div className="audit-bar-cell">
//                                                 <div className="audit-bar-track">
//                                                     <div
//                                                         className={`audit-bar-fill ${barColor}`}
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
//     const renderTable = (
//         data: AuditItem[],
//         level: string,
//         onRowClick: (group: AggregatedGroup) => void
//     ) => {
//         let keyField = "";
//         let title = "";

//         switch (level) {
//             case "regions":
//                 keyField = detectKey(["Regions", "Region", "REGIONS"]);
//                 title = "Regions";
//                 break;
//             case "market":
//                 keyField = detectKey(["Market", "Market Name", "MARKET"]);
//                 title = "Markets";
//                 break;
//             case "status":
//                 return renderStatusSummary(data);
//             case "detailed":
//                 return renderDetailedTable(data);
//             default:
//                 keyField = "Unknown";
//                 title = "Data";
//         }

//         const aggregated = aggregate(data, keyField, level);
//         const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);
//         const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

//         return (
//             <div className="audit-table-block">
//                 <div className="audit-table-header">
//                     <h2>{title}</h2>
//                     <div className="audit-meta">
//                         {aggregated.length} groups — total value {formatCurrency(totalCost)}
//                     </div>
//                 </div>

//                 <div className="audit-table-wrapper">
//                     <table className="audit-table">
//                         <thead>
//                             <tr>
//                                 <th>{title}</th>
//                                 <th className="audit-col-right">Audit Count</th>
//                                 <th className="audit-col-right">Devices</th>
//                                 <th className="audit-col-right">Total Value</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass =
//                                     pct >= 70 ? "audit-fill-green" : pct >= 40 ? "audit-fill-amber" : "audit-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)}>
//                                         <td>{group.key}</td>
//                                         <td className="audit-col-right">{group.count}</td>
//                                         <td className="audit-col-right">{group.devices}</td>
//                                         <td className="audit-col-right">{formatCurrency(group.cost)}</td>
//                                         <td>
//                                             <div className="audit-bar-cell">
//                                                 <div className="audit-bar-track">
//                                                     <div
//                                                         className={`audit-bar-fill ${fillClass}`}
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

//     const renderDetailedTable = (data: AuditItem[]) => {
//         return (
//             <div className="audit-table-block">
//                 <div className="audit-table-header">
//                     <h2>Detailed Audit - {selectedStatus}</h2>
//                     <div className="audit-meta">{data.length} audit records</div>
//                 </div>

//                 <div className="audit-table-wrapper">
//                     <table className="audit-table">
//                         <thead>
//                             <tr>
//                                 <th>Serial Date</th>
//                                 <th>Market</th>
//                                 <th>Store</th>
//                                 <th>Tech ID</th>
//                                 <th>SKU Description</th>
//                                 <th>Full IMEI</th>
//                                 <th className="audit-col-right">Cost</th>
//                                 <th>Status</th>
//                                 <th>Final Comments</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {data.map((row, index) => {
//                                 const serialDate = getField(row, ["SerialDate", "Date"]);
//                                 const market = getField(row, ["Market", "Market Name"]);
//                                 const store = getField(row, ["Store"]);
//                                 const techId = getField(row, ["TechID"]);
//                                 const sku = getField(row, ["SKUDescription"]);
//                                 const imei = getField(row, ["FullIMEI#"]);
//                                 const cost = formatCurrency(parseCurrency(getField(row, ["Cost", "COST"])));
//                                 const status = getField(row, ["Status", "STATUS"]);
//                                 const comments = getField(row, ["FinalComments"]);

//                                 return (
//                                     <tr key={index}>
//                                         <td>{serialDate}</td>
//                                         <td>{market}</td>
//                                         <td>{store}</td>
//                                         <td>{techId}</td>
//                                         <td>{sku.split('|').pop() || sku}</td>
//                                         <td>{imei}</td>
//                                         <td className="audit-col-right">{cost}</td>
//                                         <td>
//                                             <span className={`status-indicator status-${getStatusColor(status)}`}>
//                                                 {status}
//                                             </span>
//                                         </td>
//                                         <td>{comments}</td>
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
//                         <div className="logo">🔍</div>
//                         <div className="title">
//                             <div className="main">Audit Dashboard</div>
//                             <div className="sub">
//                                 Device audit tracking and status analytics
//                             </div>
//                         </div>
//                     </div>
//                 </header>

//                 <main className="main-area">
//                     {/* Controls Section */}
//                     <div className="audit-controls-section">
//                         <div className="audit-controls-grid">
//                             <div className="audit-date-inputs">
//                                 <input
//                                     type="date"
//                                     value={fromDate}
//                                     onChange={(e) => setFromDate(e.target.value)}
//                                     className="audit-input"
//                                     placeholder="From Date"
//                                 />
//                                 <input
//                                     type="date"
//                                     value={toDate}
//                                     onChange={(e) => setToDate(e.target.value)}
//                                     className="audit-input"
//                                     placeholder="To Date"
//                                 />
//                             </div>
//                             <div className="audit-action-buttons">
//                                 <button
//                                     className="btn btn-primary"
//                                     onClick={handleApplyFilters}
//                                 >
//                                     Apply Filters
//                                 </button>
//                                 <button
//                                     className="btn"
//                                     onClick={handleResetFilters}
//                                 >
//                                     Reset
//                                 </button>
//                                 <button
//                                     className="btn btn-success"
//                                     onClick={handleExportCSV}
//                                 >
//                                     Export CSV
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
//                     <div className="audit-nav-row">
//                         <button
//                             className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
//                             onClick={handleBackClick}
//                         >
//                             ← Back
//                         </button>
//                         <div className="audit-breadcrumb">
//                             {renderBreadcrumb()}
//                         </div>
//                     </div>

//                     <section className="audit-stacked">
//                         {currentView === "regions" &&
//                             renderTable(currentData, "regions", handleRegionClick)}
//                         {currentView === "market" &&
//                             renderTable(currentData, "market", handleMarketClick)}
//                         {currentView === "status" &&
//                             renderTable(currentData, "status", handleStatusClick)}
//                         {currentView === "detailed" && renderDetailedTable(currentData)}
//                     </section>

//                     {/* Loading State */}
//                     {isLoadingData && (
//                         <div className="audit-loading">
//                             <div className="loading-spinner"></div>
//                             <p>Loading audit data...</p>
//                         </div>
//                     )}
//                 </main>
//             </div>
//         </div>
//     );
// }











// "use client";
// import { useAuth } from "../../../components/AuthProvider";
// import { useRouter } from "next/navigation";
// import { useEffect, useState, useCallback } from "react";
// import "./audit-styles.css";

// interface AuditItem {
//     [key: string]: string | number;
// }

// interface AggregatedGroup {
//     key: string;
//     count: number;
//     devices: number;
//     cost: number;
//     rows: AuditItem[];
// }

// interface StatusSummary {
//     status: string;
//     count: number;
//     devices: number;
//     cost: number;
//     color: string;
// }

// export default function AuditDashboard() {
//     const { isAuthenticated, isLoading } = useAuth();
//     const router = useRouter();
//     const [rawData, setRawData] = useState<AuditItem[]>([]);
//     const [filteredData, setFilteredData] = useState<AuditItem[]>([]);
//     const [fromDate, setFromDate] = useState<string>("");
//     const [toDate, setToDate] = useState<string>("");
//     const [sheetUrl] = useState<string>(
//         "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhKMtyCA2gB3lHwcP9hGLhDgmCUUqXVNmthUsFggsgaFeFuOYOPzjctQmkHMZ4ZA/pub?gid=259016646&single=true&output=csv"
//     );
//     const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
//     const [currentView, setCurrentView] = useState<
//         "regions" | "market" | "status" | "detailed"
//     >("regions");
//     const [currentData, setCurrentData] = useState<AuditItem[]>([]);
//     const [selectedRegion, setSelectedRegion] = useState<string>("");
//     const [selectedMarket, setSelectedMarket] = useState<string>("");
//     const [selectedStatus, setSelectedStatus] = useState<string>("");
//     const [historyStack, setHistoryStack] = useState<
//         { level: string; selected?: string }[]
//     >([{ level: "Regions" }]);
//     const [detectedFields, setDetectedFields] = useState<{ [key: string]: string }>({});

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

//     const parseDateMDY = (s: string): Date | null => {
//         if (!s) return null;
//         if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
//             const [mm, dd, yy] = s.split("/");
//             return new Date(Number(yy), Number(mm) - 1, Number(dd));
//         }
//         const d = new Date(s);
//         return isNaN(d.getTime()) ? null : d;
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

//     const getField = (obj: AuditItem, candidates: string[]): string => {
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

//     const countNonEmptyIMEI = (row: AuditItem): number => {
//         const imeiValue = getField(row, [
//             "FullIMEI#",
//             "IMEI",
//             "imei",
//             "CUSTOMER IMEI",
//         ]);
//         return imeiValue &&
//             String(imeiValue).trim() !== "" &&
//             imeiValue !== "Unknown" &&
//             imeiValue !== "0"
//             ? 1
//             : 0;
//     };

//     const detectKey = (candidates: string[], data: AuditItem[]): string => {
//         if (!data || data.length === 0) return candidates[0];

//         const allKeys = Object.keys(data[0] || {});
//         console.log("🔍 Available keys for detection:", allKeys);

//         // First try: exact match
//         for (const candidate of candidates) {
//             if (allKeys.includes(candidate)) {
//                 console.log(`✅ Exact match found: ${candidate}`);
//                 return candidate;
//             }
//         }

//         // Second try: case-insensitive match
//         for (const candidate of candidates) {
//             const matchedKey = allKeys.find((key) =>
//                 key.toLowerCase() === candidate.toLowerCase()
//             );
//             if (matchedKey) {
//                 console.log(`✅ Case-insensitive match found: ${matchedKey} for ${candidate}`);
//                 return matchedKey;
//             }
//         }

//         // Third try: partial match with validation
//         for (const candidate of candidates) {
//             const matchedKey = allKeys.find((key) =>
//                 key.toLowerCase().includes(candidate.toLowerCase())
//             );
//             if (matchedKey) {
//                 // Validate that this field actually contains appropriate data
//                 const sampleValues = data.slice(0, 10).map(row => String(row[matchedKey] || "").trim());
//                 const hasValidData = sampleValues.some(val => val && val !== "" && val !== "Unknown");

//                 if (hasValidData) {
//                     console.log(`✅ Partial match found: ${matchedKey} for ${candidate}`);
//                     return matchedKey;
//                 } else {
//                     console.log(`❌ Partial match found but no valid data: ${matchedKey} for ${candidate}`);
//                 }
//             }
//         }

//         console.log(`❌ No match found for candidates: ${candidates}, using first candidate: ${candidates[0]}`);
//         return candidates[0];
//     };

//     const detectAllFields = (data: AuditItem[]) => {
//         console.log("🎯 DETECTING ALL FIELDS...");

//         const fields = {
//             status: detectKey(["Status", "STATUS", "status"], data),
//             cost: detectKey(["Cost", "COST", "cost"], data),
//             region: detectKey(["Regions", "Region", "REGIONS"], data),
//             market: detectKey(["Market", "Market Name", "MARKET"], data),
//             date: detectKey(["SerialDate", "Date", "ProcessedDate"], data),
//             store: detectKey(["Store", "STORE"], data),
//             techId: detectKey(["TechID", "Tech ID", "TECHID"], data),
//             sku: detectKey(["SKUDescription", "SKU", "sku"], data),
//             imei: detectKey(["FullIMEI#", "IMEI", "imei"], data),
//             comments: detectKey(["FinalComments", "Comments", "COMMENTS"], data)
//         };

//         console.log("✅ DETECTED FIELDS:", fields);
//         setDetectedFields(fields);
//         return fields;
//     };

//     const validateFieldDetection = (data: AuditItem[], fields: any) => {
//         console.log("🔍 VALIDATING FIELD DETECTION...");

//         // Validate Status field
//         const statusSample = data.slice(0, 10).map(row => ({
//             raw: row[fields.status],
//             cleaned: String(row[fields.status] || "").trim()
//         }));
//         console.log("Status field sample:", statusSample);

//         // Validate Cost field
//         const costSample = data.slice(0, 10).map(row => ({
//             raw: row[fields.cost],
//             parsed: parseCurrency(row[fields.cost])
//         }));
//         console.log("Cost field sample:", costSample);

//         // Check if status field contains cost values
//         const statusContainsNumbers = data.slice(0, 20).some(row => {
//             const statusVal = String(row[fields.status] || "");
//             return /^\$?\d+\.?\d*$/.test(statusVal.trim()); // Matches numbers and currency
//         });

//         console.log("Status field contains numbers/currency:", statusContainsNumbers);

//         if (statusContainsNumbers) {
//             console.log("❌ PROBLEM: Status field appears to contain cost values!");
//             console.log("This means the wrong field is being detected as Status.");
//         }
//     };

//     const aggregate = (data: AuditItem[], keyField: string, level: string = ""): AggregatedGroup[] => {
//         console.log(`🔄 Aggregating data by ${keyField} for level ${level}`);

//         const groups: {
//             [key: string]: {
//                 count: number;
//                 devices: number;
//                 cost: number;
//                 rows: AuditItem[];
//             };
//         } = {};

//         const validRegions = ["Aleem Ghori Region", "Hasnain Mustaqeem Region"];

//         data.forEach((row) => {
//             const keyRaw = getField(row, [keyField]);
//             const key = String(keyRaw || "").trim();

//             if (!key || key === "Unknown" || key === "") return;

//             if (level === "regions" && keyField.toLowerCase().includes("region")) {
//                 const isValidRegion = validRegions.some(region =>
//                     region.toLowerCase() === key.toLowerCase()
//                 );
//                 if (!isValidRegion) {
//                     console.log("Filtering out invalid region:", key);
//                     return;
//                 }
//             }

//             if (!groups[key])
//                 groups[key] = {
//                     count: 0,
//                     devices: 0,
//                     cost: 0,
//                     rows: [],
//                 };

//             groups[key].count += 1;
//             groups[key].devices += countNonEmptyIMEI(row);
//             groups[key].cost += parseCurrency(
//                 row[detectedFields.cost] || getField(row, ["Cost", "COST", "cost"])
//             );
//             groups[key].rows.push(row);
//         });

//         const result = Object.keys(groups)
//             .map((k) => ({
//                 key: k,
//                 count: groups[k].count,
//                 devices: groups[k].devices,
//                 cost: groups[k].cost,
//                 rows: groups[k].rows,
//             }))
//             .sort((a, b) => b.cost - a.cost);

//         console.log(`✅ Aggregation complete: ${result.length} groups created`);
//         return result;
//     };

//     const getStatusColor = (status: string): string => {
//         const statusColors: { [key: string]: string } = {
//             'scanning': 'blue',
//             'rma': 'orange',
//             'resolved': 'green',
//             'chargeback': 'red',
//             'active': 'green',
//             'sold': 'purple',
//             'demo': 'purple',
//             'adjustment': 'orange',
//             'returned': 'red',
//             'damaged': 'red',
//             'lost': 'gray',
//             'in stock': 'green',
//             'shipped': 'blue',
//             'pending': 'orange',
//             'completed': 'green',
//             'cancelled': 'red',
//             'refunded': 'orange',
//             'in progress': 'blue',
//             'waiting for parts': 'orange',
//             'repaired': 'green'
//         };

//         const normalizedStatus = status.toLowerCase().trim();
//         return statusColors[normalizedStatus] || 'gray';
//     };

//     const buildStatusSummary = (data: AuditItem[]): StatusSummary[] => {
//         console.log("=== BUILDING STATUS SUMMARY ===");
//         console.log("Input data records:", data.length);

//         const statusGroups: { [key: string]: StatusSummary } = {};
//         const statusField = detectedFields.status;
//         const costField = detectedFields.cost;

//         console.log("Using detected status field:", statusField);
//         console.log("Using detected cost field:", costField);

//         let totalRecordsProcessed = 0;
//         let recordsWithEmptyStatus = 0;
//         let recordsWithMalformedStatus = 0;
//         let recordsWithCostAsStatus = 0;

//         data.forEach((row, index) => {
//             // Get the raw status value from the correct field
//             const rawStatus = String(row[statusField] || "").trim();
//             const rawCost = row[costField];
//             const cost = parseCurrency(rawCost);
//             const devices = countNonEmptyIMEI(row);

//             // Skip empty status
//             if (!rawStatus || rawStatus === "Unknown" || rawStatus === "" || rawStatus === "N/A") {
//                 recordsWithEmptyStatus++;
//                 return;
//             }

//             // Check if status value is actually a cost/number (wrong field detection)
//             const isCostValue = /^\$?\d+\.?\d*$/.test(rawStatus);
//             if (isCostValue) {
//                 recordsWithCostAsStatus++;
//                 console.log(`❌ Cost value detected as status: "${rawStatus}" in record ${index}`);
//                 return;
//             }

//             // Clean and normalize the status
//             const cleanStatus = rawStatus
//                 .trim()
//                 .replace(/\s+/g, ' ') // Replace multiple spaces with single space
//                 .replace(/^\s+|\s+$/g, ''); // Trim start/end whitespace

//             if (!cleanStatus) {
//                 recordsWithMalformedStatus++;
//                 return;
//             }

//             if (!statusGroups[cleanStatus]) {
//                 statusGroups[cleanStatus] = {
//                     status: cleanStatus,
//                     count: 0,
//                     devices: 0,
//                     cost: 0,
//                     color: getStatusColor(cleanStatus)
//                 };
//             }

//             statusGroups[cleanStatus].count += 1;
//             statusGroups[cleanStatus].devices += devices;
//             statusGroups[cleanStatus].cost += cost;
//             totalRecordsProcessed++;
//         });

//         const result = Object.values(statusGroups).sort((a, b) => b.cost - a.cost);

//         console.log("=== STATUS SUMMARY RESULTS ===");
//         console.log("Total records processed:", totalRecordsProcessed);
//         console.log("Records with empty status:", recordsWithEmptyStatus);
//         console.log("Records with malformed status:", recordsWithMalformedStatus);
//         console.log("Records with cost as status:", recordsWithCostAsStatus);
//         console.log("Total status groups:", result.length);
//         console.log("All status values found:", result.map(s => s.status).sort());
//         console.log("Total records accounted for:", result.reduce((sum, item) => sum + item.count, 0));

//         return result;
//     };

//     const fetchCSV = async (url: string): Promise<AuditItem[]> => {
//         try {
//             console.log("📥 Fetching CSV from:", url);
//             const res = await fetch(url);
//             if (!res.ok) throw new Error("fetch error " + res.status);
//             const txt = await res.text();
//             console.log("✅ CSV fetched successfully, length:", txt.length);

//             const lines = txt.split("\n").filter((line) => line.trim());
//             console.log("📊 CSV lines found:", lines.length);

//             if (lines.length < 2) return [];

//             const headers = lines[0]
//                 .split(",")
//                 .map((h) => h.trim().replace(/"/g, ""));
//             console.log("📋 CSV headers:", headers);

//             const data = lines
//                 .slice(1)
//                 .map((line, index) => {
//                     const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
//                     const obj: AuditItem = {};
//                     headers.forEach((header, index) => {
//                         obj[header] = values[index] || "";
//                     });
//                     return obj;
//                 })
//                 .filter((row) => Object.values(row).some((val) => val !== ""));

//             console.log("✅ Processed records:", data.length);

//             if (data.length > 0) {
//                 console.log("🔍 Available CSV fields:", Object.keys(data[0]));
//                 console.log("📄 Sample data (first 3 records):", data.slice(0, 3));
//             }

//             return data;
//         } catch (err) {
//             console.error("❌ Fetching CSV failed:", err);
//             return [];
//         }
//     };

//     const applyFilters = (data: AuditItem[]): AuditItem[] => {
//         const from = fromDate ? new Date(fromDate) : null;
//         const to = toDate ? new Date(toDate) : null;

//         console.log("🔄 Applying filters:", { fromDate, toDate, from, to });

//         if (!from && !to) {
//             console.log("✅ No date filters applied");
//             return data;
//         }

//         const filtered = data.filter((row) => {
//             const raw = getField(row, [
//                 "SerialDate",
//                 "Date",
//                 "ProcessedDate",
//             ]);
//             const d = parseDateMDY(raw);
//             if (!d) return false;
//             if (from && d < from) return false;
//             if (to) {
//                 const toEnd = new Date(
//                     to.getFullYear(),
//                     to.getMonth(),
//                     to.getDate(),
//                     23,
//                     59,
//                     59
//                 );
//                 if (d > toEnd) return false;
//             }
//             return true;
//         });

//         console.log(`✅ Filtering complete: ${data.length} -> ${filtered.length} records`);
//         return filtered;
//     };

//     const buildSummaryCards = (data: AuditItem[]) => {
//         const totalAudits = data.length;
//         const totalDevices = data.reduce((s, r) => s + countNonEmptyIMEI(r), 0);
//         const totalCost = data.reduce(
//             (s, r) => s + parseCurrency(r[detectedFields.cost] || getField(r, ["Cost", "COST", "cost"])),
//             0
//         );

//         // Use the same logic as buildStatusSummary to count unique statuses
//         const statusSummary = buildStatusSummary(data);
//         const uniqueStatuses = statusSummary.length;

//         const cards = [
//             { label: "Total Audits", value: totalAudits, icon: "📋" },
//             { label: "Total Devices", value: totalDevices, icon: "📱" },
//             { label: "Total Value", value: formatCurrency(totalCost), icon: "💰" },
//             { label: "Status Types", value: uniqueStatuses, icon: "🏷️" },
//         ];

//         console.log("📊 Summary cards built - Unique statuses:", uniqueStatuses);
//         return cards;
//     };

//     const initData = async () => {
//         setIsLoadingData(true);
//         console.log("🚀 Initializing data...");

//         const data = await fetchCSV(sheetUrl);
//         console.log("=== INITIAL DATA LOAD COMPLETE ===");
//         console.log("Raw data loaded:", data.length, "records");

//         if (data && data.length > 0) {
//             setRawData(data);
//             const filtered = applyFilters(data);
//             console.log("After filtering:", filtered.length, "records");
//             setFilteredData(filtered);
//             setCurrentData(filtered);

//             // Detect all fields and validate
//             const fields = detectAllFields(filtered);
//             validateFieldDetection(filtered, fields);

//             const dateVals = data
//                 .map((r) => parseDateMDY(getField(r, ["SerialDate", "Date"])))
//                 .filter(Boolean) as Date[];
//             if (dateVals.length) {
//                 const minD = new Date(Math.min(...dateVals.map((d) => d.getTime())));
//                 const maxD = new Date(Math.max(...dateVals.map((d) => d.getTime())));
//                 setFromDate(minD.toISOString().slice(0, 10));
//                 setToDate(maxD.toISOString().slice(0, 10));
//             }

//             setHistoryStack([{ level: "Regions" }]);
//         } else {
//             console.log("❌ No data loaded");
//             setFilteredData([]);
//             setCurrentData([]);
//         }
//         setIsLoadingData(false);
//     };

//     const debugFieldDetection = () => {
//         if (!filteredData.length) {
//             console.log("❌ No filtered data available for debugging");
//             return;
//         }

//         console.log("=== FIELD DETECTION DEBUG ===");
//         console.log("Total records:", filteredData.length);
//         console.log("All available fields:", Object.keys(filteredData[0]));
//         console.log("Currently detected fields:", detectedFields);

//         // Re-detect fields
//         const fields = detectAllFields(filteredData);
//         validateFieldDetection(filteredData, fields);
//     };

//     const debugStatusField = () => {
//         if (!filteredData.length) return;

//         console.log("=== STATUS FIELD DEBUG ===");
//         const statusField = detectedFields.status;
//         console.log("Detected status field:", statusField);

//         // Get ALL raw status values
//         const allRawStatusValues = filteredData.map(row => row[statusField]);
//         const allStatusValues = filteredData.map(row => String(row[statusField] || "").trim());

//         console.log("First 50 raw status values:", allRawStatusValues.slice(0, 50));
//         console.log("First 50 cleaned status values:", allStatusValues.slice(0, 50));

//         // Count occurrences of each status
//         const statusCounts: { [key: string]: number } = {};
//         allStatusValues.forEach(status => {
//             if (status && status !== "Unknown" && status !== "") {
//                 statusCounts[status] = (statusCounts[status] || 0) + 1;
//             }
//         });

//         console.log("Status counts:", statusCounts);
//         console.log("Number of unique status values:", Object.keys(statusCounts).length);
//         console.log("All unique status values:", Object.keys(statusCounts).sort());

//         // Check for cost values in status field
//         const costValuesInStatus = allStatusValues.filter(val => /^\$?\d+\.?\d*$/.test(val));
//         console.log("Cost values found in status field:", costValuesInStatus);
//         console.log("Number of cost values in status field:", costValuesInStatus.length);
//     };

//     const handleApplyFilters = () => {
//         console.log("🔄 Applying filters...");
//         const filtered = applyFilters(rawData);
//         setFilteredData(filtered);
//         setCurrentData(filtered);
//         setCurrentView("regions");
//         setHistoryStack([{ level: "Regions" }]);
//         setSelectedRegion("");
//         setSelectedMarket("");
//         setSelectedStatus("");

//         // Re-detect fields after filtering
//         detectAllFields(filtered);
//     };

//     const handleResetFilters = () => {
//         console.log("🔄 Resetting filters...");
//         setFromDate("");
//         setToDate("");
//         setFilteredData(rawData);
//         setCurrentData(rawData);
//         setCurrentView("regions");
//         setHistoryStack([{ level: "Regions" }]);
//         setSelectedRegion("");
//         setSelectedMarket("");
//         setSelectedStatus("");

//         // Re-detect fields after reset
//         detectAllFields(rawData);
//     };

//     const handleExportCSV = () => {
//         if (!filteredData.length) return;

//         console.log("💾 Exporting CSV...");
//         console.log("Exporting data:", {
//             totalRecords: filteredData.length,
//             sampleRecord: filteredData[0],
//             allFields: Object.keys(filteredData[0])
//         });

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
//         a.download = "audit_export.csv";
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//     };

//     const handleRegionClick = (region: AggregatedGroup) => {
//         const marketData = region.rows;
//         setCurrentData(marketData);
//         setCurrentView("market");
//         setSelectedRegion(region.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Market", selected: region.key },
//         ]);
//     };

//     const handleMarketClick = (market: AggregatedGroup) => {
//         const statusData = market.rows;
//         setCurrentData(statusData);
//         setCurrentView("status");
//         setSelectedMarket(market.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Market", selected: selectedRegion },
//             { level: "Status", selected: market.key },
//         ]);
//     };

//     const handleStatusClick = (status: AggregatedGroup) => {
//         const detailedData = status.rows;
//         setCurrentData(detailedData);
//         setCurrentView("detailed");
//         setSelectedStatus(status.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Market", selected: selectedRegion },
//             { level: "Status", selected: selectedMarket },
//             { level: "Detailed", selected: status.key },
//         ]);
//     };

//     const handleBackClick = () => {
//         if (historyStack.length <= 1) {
//             setCurrentData(filteredData);
//             setCurrentView("regions");
//             setHistoryStack([{ level: "Regions" }]);
//             setSelectedRegion("");
//             setSelectedMarket("");
//             setSelectedStatus("");
//         } else {
//             const newStack = historyStack.slice(0, -1);
//             setHistoryStack(newStack);

//             const previousLevel = newStack[newStack.length - 1];

//             if (previousLevel.level === "Regions") {
//                 setCurrentData(filteredData);
//                 setCurrentView("regions");
//                 setSelectedRegion("");
//             } else if (previousLevel.level === "Market") {
//                 const regionKey = detectedFields.region;
//                 const regionData = filteredData.filter(
//                     (row) => getField(row, [regionKey]) === previousLevel.selected
//                 );
//                 setCurrentData(regionData);
//                 setCurrentView("market");
//                 setSelectedMarket("");
//             } else if (previousLevel.level === "Status") {
//                 const regionKey = detectedFields.region;
//                 const marketKey = detectedFields.market;
//                 const statusData = filteredData.filter(
//                     (row) =>
//                         getField(row, [regionKey]) === selectedRegion &&
//                         getField(row, [marketKey]) === previousLevel.selected
//                 );
//                 setCurrentData(statusData);
//                 setCurrentView("status");
//                 setSelectedStatus("");
//             }
//         }
//     };

//     const renderBreadcrumb = () => {
//         return historyStack.map((item, index) => (
//             <span key={index} className="audit-breadcrumb">
//                 {item.selected ? `${item.level} — ${item.selected}` : item.level}
//                 {index < historyStack.length - 1 && (
//                     <span className="mx-2 text-gray-400">›</span>
//                 )}
//             </span>
//         ));
//     };

//     const renderStatusSummary = (data: AuditItem[]) => {
//         const statusSummary = buildStatusSummary(data);
//         const totalCost = statusSummary.reduce((sum, item) => sum + item.cost, 0);

//         return (
//             <div className="audit-table-block">
//                 <div className="audit-table-header">
//                     <h2>Status Summary - {selectedMarket}</h2>
//                     <div className="audit-meta">
//                         {statusSummary.length} status types — total value {formatCurrency(totalCost)}
//                     </div>
//                 </div>

//                 <div className="audit-table-wrapper">
//                     <table className="audit-table">
//                         <thead>
//                             <tr>
//                                 <th>Status</th>
//                                 <th className="audit-col-right">Audit Count</th>
//                                 <th className="audit-col-right">Devices</th>
//                                 <th className="audit-col-right">Total Value</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {statusSummary.map((status, index) => {
//                                 const pct = totalCost > 0 ? Math.round((status.cost / totalCost) * 100) : 0;

//                                 // Determine color based on percentage - Red/Yellow/Green
//                                 let barColor = '';
//                                 if (pct >= 50) {
//                                     barColor = 'audit-fill-red'; // High percentage - Red
//                                 } else if (pct >= 20) {
//                                     barColor = 'audit-fill-amber'; // Medium percentage - Yellow/Amber
//                                 } else {
//                                     barColor = 'audit-fill-green'; // Low percentage - Green
//                                 }

//                                 return (
//                                     <tr key={index} onClick={() => handleStatusClick({
//                                         key: status.status,
//                                         count: status.count,
//                                         devices: status.devices,
//                                         cost: status.cost,
//                                         rows: data.filter(row => row[detectedFields.status] === status.status)
//                                     })}>
//                                         <td>
//                                             <span className={`status-indicator status-${status.color}`}>
//                                                 {status.status}
//                                             </span>
//                                         </td>
//                                         <td className="audit-col-right">{status.count}</td>
//                                         <td className="audit-col-right">{status.devices}</td>
//                                         <td className="audit-col-right">{formatCurrency(status.cost)}</td>
//                                         <td>
//                                             <div className="audit-bar-cell">
//                                                 <div className="audit-bar-track">
//                                                     <div
//                                                         className={`audit-bar-fill ${barColor}`}
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

//     const renderTable = (
//         data: AuditItem[],
//         level: string,
//         onRowClick: (group: AggregatedGroup) => void
//     ) => {
//         let keyField = "";
//         let title = "";

//         switch (level) {
//             case "regions":
//                 keyField = detectedFields.region;
//                 title = "Regions";
//                 break;
//             case "market":
//                 keyField = detectedFields.market;
//                 title = "Markets";
//                 break;
//             case "status":
//                 return renderStatusSummary(data);
//             case "detailed":
//                 return renderDetailedTable(data);
//             default:
//                 keyField = "Unknown";
//                 title = "Data";
//         }

//         const aggregated = aggregate(data, keyField, level);
//         const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);
//         const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

//         return (
//             <div className="audit-table-block">
//                 <div className="audit-table-header">
//                     <h2>{title}</h2>
//                     <div className="audit-meta">
//                         {aggregated.length} groups — total value {formatCurrency(totalCost)}
//                     </div>
//                 </div>

//                 <div className="audit-table-wrapper">
//                     <table className="audit-table">
//                         <thead>
//                             <tr>
//                                 <th>{title}</th>
//                                 <th className="audit-col-right">Audit Count</th>
//                                 <th className="audit-col-right">Devices</th>
//                                 <th className="audit-col-right">Total Value</th>
//                                 <th>Value Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = Math.round((group.cost / maxCost) * 100);
//                                 const fillClass =
//                                     pct >= 70 ? "audit-fill-green" : pct >= 40 ? "audit-fill-amber" : "audit-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)}>
//                                         <td>{group.key}</td>
//                                         <td className="audit-col-right">{group.count}</td>
//                                         <td className="audit-col-right">{group.devices}</td>
//                                         <td className="audit-col-right">{formatCurrency(group.cost)}</td>
//                                         <td>
//                                             <div className="audit-bar-cell">
//                                                 <div className="audit-bar-track">
//                                                     <div
//                                                         className={`audit-bar-fill ${fillClass}`}
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

//     const renderDetailedTable = (data: AuditItem[]) => {
//         return (
//             <div className="audit-table-block">
//                 <div className="audit-table-header">
//                     <h2>Detailed Audit - {selectedStatus}</h2>
//                     <div className="audit-meta">{data.length} audit records</div>
//                 </div>

//                 <div className="audit-table-wrapper">
//                     <table className="audit-table">
//                         <thead>
//                             <tr>
//                                 <th>Serial Date</th>
//                                 <th>Market</th>
//                                 <th>Store</th>
//                                 <th>Tech ID</th>
//                                 <th>SKU Description</th>
//                                 <th>Full IMEI</th>
//                                 <th className="audit-col-right">Cost</th>
//                                 <th>Status</th>
//                                 <th>Final Comments</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {data.map((row, index) => {
//                                 const serialDate = getField(row, ["SerialDate", "Date"]);
//                                 const market = getField(row, ["Market", "Market Name"]);
//                                 const store = getField(row, ["Store"]);
//                                 const techId = getField(row, ["TechID"]);
//                                 const sku = getField(row, ["SKUDescription"]);
//                                 const imei = getField(row, ["FullIMEI#"]);
//                                 const cost = formatCurrency(parseCurrency(row[detectedFields.cost] || getField(row, ["Cost", "COST"])));
//                                 const status = row[detectedFields.status];
//                                 const comments = getField(row, ["FinalComments"]);

//                                 return (
//                                     <tr key={index}>
//                                         <td>{serialDate}</td>
//                                         <td>{market}</td>
//                                         <td>{store}</td>
//                                         <td>{techId}</td>
//                                         <td>{sku.split('|').pop() || sku}</td>
//                                         <td>{imei}</td>
//                                         <td className="audit-col-right">{cost}</td>
//                                         <td>
//                                             <span className={`status-indicator status-${getStatusColor(String(status))}`}>
//                                                 {status}
//                                             </span>
//                                         </td>
//                                         <td>{comments}</td>
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
//                         <div className="logo">🔍</div>
//                         <div className="title">
//                             <div className="main">Audit Dashboard</div>
//                             <div className="sub">
//                                 Device audit tracking and status analytics
//                             </div>
//                         </div>
//                     </div>
//                 </header>

//                 <main className="main-area">
//                     {/* Controls Section */}
//                     <div className="audit-controls-section">
//                         <div className="audit-controls-grid">
//                             <div className="audit-date-inputs">
//                                 <input
//                                     type="date"
//                                     value={fromDate}
//                                     onChange={(e) => setFromDate(e.target.value)}
//                                     className="audit-input"
//                                     placeholder="From Date"
//                                 />
//                                 <input
//                                     type="date"
//                                     value={toDate}
//                                     onChange={(e) => setToDate(e.target.value)}
//                                     className="audit-input"
//                                     placeholder="To Date"
//                                 />
//                             </div>
//                             <div className="audit-action-buttons">
//                                 <button
//                                     className="btn btn-primary"
//                                     onClick={handleApplyFilters}
//                                 >
//                                     Apply Filters
//                                 </button>
//                                 <button
//                                     className="btn"
//                                     onClick={handleResetFilters}
//                                 >
//                                     Reset
//                                 </button>
//                                 <button
//                                     className="btn btn-success"
//                                     onClick={handleExportCSV}
//                                 >
//                                     Export CSV
//                                 </button>
//                                 {/* Debug buttons */}
//                                 <button
//                                     className="btn btn-warning"
//                                     onClick={debugFieldDetection}
//                                 >
//                                     Debug Fields
//                                 </button>
//                                 <button
//                                     className="btn btn-warning"
//                                     onClick={debugStatusField}
//                                 >
//                                     Debug Status
//                                 </button>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Detected Fields Display */}
//                     {Object.keys(detectedFields).length > 0 && (
//                         <div className="audit-detected-fields">
//                             <h3>Detected Fields:</h3>
//                             <pre>{JSON.stringify(detectedFields, null, 2)}</pre>
//                         </div>
//                     )}

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
//                     <div className="audit-nav-row">
//                         <button
//                             className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
//                             onClick={handleBackClick}
//                         >
//                             ← Back
//                         </button>
//                         <div className="audit-breadcrumb">
//                             {renderBreadcrumb()}
//                         </div>
//                     </div>

//                     <section className="audit-stacked">
//                         {currentView === "regions" &&
//                             renderTable(currentData, "regions", handleRegionClick)}
//                         {currentView === "market" &&
//                             renderTable(currentData, "market", handleMarketClick)}
//                         {currentView === "status" &&
//                             renderTable(currentData, "status", handleStatusClick)}
//                         {currentView === "detailed" && renderDetailedTable(currentData)}
//                     </section>

//                     {/* Loading State */}
//                     {isLoadingData && (
//                         <div className="audit-loading">
//                             <div className="loading-spinner"></div>
//                             <p>Loading audit data...</p>
//                         </div>
//                     )}
//                 </main>
//             </div>
//         </div>
//     );
// }



"use client";
import { useAuth } from "../../../components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import "./audit-styles.css";

interface AuditItem {
    [key: string]: string | number;
}

interface AggregatedGroup {
    key: string;
    count: number;
    devices: number;
    cost: number;
    rows: AuditItem[];
}

interface StatusSummary {
    status: string;
    count: number;
    devices: number;
    cost: number;
    color: string;
}

export default function AuditDashboard() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [rawData, setRawData] = useState<AuditItem[]>([]);
    const [filteredData, setFilteredData] = useState<AuditItem[]>([]);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [sheetUrl] = useState<string>(
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhKMtyCA2gB3lHwcP9hGLhDgmCUUqXVNmthUsFggsgaFeFuOYOPzjctQmkHMZ4ZA/pub?gid=259016646&single=true&output=csv"
    );
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [currentView, setCurrentView] = useState<
        "regions" | "market" | "status" | "detailed"
    >("regions");
    const [currentData, setCurrentData] = useState<AuditItem[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [selectedMarket, setSelectedMarket] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [historyStack, setHistoryStack] = useState<
        { level: string; selected?: string }[]
    >([{ level: "Regions" }]);
    const [detectedFields, setDetectedFields] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated) {
            initData();
        }
    }, [isAuthenticated]);

    const parseCurrency = (v: any): number => {
        if (v == null) return 0;
        const s = String(v).replace(/[^0-9.\-]/g, "");
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    };

    const parseDateMDY = (s: string): Date | null => {
        if (!s) return null;
        if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
            const [mm, dd, yy] = s.split("/");
            return new Date(Number(yy), Number(mm) - 1, Number(dd));
        }
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    };

    const formatCurrency = (v: number): string => {
        return (
            "$" +
            Number(v || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        );
    };

    const getField = (obj: AuditItem, candidates: string[]): string => {
        for (const k of candidates) {
            if (k in obj && obj[k] !== "" && obj[k] != null) return String(obj[k]);
            const matched = Object.keys(obj).find(
                (x) => x.toLowerCase() === k.toLowerCase()
            );
            if (matched && obj[matched] !== "" && obj[matched] != null)
                return String(obj[matched]);
        }
        return "Unknown";
    };

    const countNonEmptyIMEI = (row: AuditItem): number => {
        const imeiValue = getField(row, [
            "FullIMEI#",
            "IMEI",
            "imei",
            "CUSTOMER IMEI",
        ]);
        return imeiValue &&
            String(imeiValue).trim() !== "" &&
            imeiValue !== "Unknown" &&
            imeiValue !== "0"
            ? 1
            : 0;
    };

    const detectKey = (candidates: string[], data: AuditItem[]): string => {
        if (!data || data.length === 0) return candidates[0];

        const allKeys = Object.keys(data[0] || {});

        // First try: exact match
        for (const candidate of candidates) {
            if (allKeys.includes(candidate)) {
                return candidate;
            }
        }

        // Second try: case-insensitive match
        for (const candidate of candidates) {
            const matchedKey = allKeys.find((key) =>
                key.toLowerCase() === candidate.toLowerCase()
            );
            if (matchedKey) {
                return matchedKey;
            }
        }

        // Third try: partial match with validation
        for (const candidate of candidates) {
            const matchedKey = allKeys.find((key) =>
                key.toLowerCase().includes(candidate.toLowerCase())
            );
            if (matchedKey) {
                const sampleValues = data.slice(0, 10).map(row => String(row[matchedKey] || "").trim());
                const hasValidData = sampleValues.some(val => val && val !== "" && val !== "Unknown");

                if (hasValidData) {
                    return matchedKey;
                }
            }
        }

        return candidates[0];
    };

    const detectAllFields = (data: AuditItem[]) => {
        const fields = {
            status: detectKey(["Status", "STATUS", "status"], data),
            cost: detectKey(["Cost", "COST", "cost"], data),
            region: detectKey(["Regions", "Region", "REGIONS"], data),
            market: detectKey(["Market", "Market Name", "MARKET"], data),
            date: detectKey(["SerialDate", "Date", "ProcessedDate"], data),
            store: detectKey(["Store", "STORE"], data),
            techId: detectKey(["TechID", "Tech ID", "TECHID"], data),
            sku: detectKey(["SKUDescription", "SKU", "sku"], data),
            imei: detectKey(["FullIMEI#", "IMEI", "imei"], data),
            comments: detectKey(["FinalComments", "Comments", "COMMENTS"], data)
        };

        setDetectedFields(fields);
        return fields;
    };

    const aggregate = (data: AuditItem[], keyField: string, level: string = ""): AggregatedGroup[] => {
        const groups: {
            [key: string]: {
                count: number;
                devices: number;
                cost: number;
                rows: AuditItem[];
            };
        } = {};

        const validRegions = ["Aleem Ghori Region", "Hasnain Mustaqeem Region"];

        data.forEach((row) => {
            const keyRaw = row[keyField];
            const key = String(keyRaw || "").trim();

            if (!key || key === "Unknown" || key === "") return;

            if (level === "regions" && keyField.toLowerCase().includes("region")) {
                const isValidRegion = validRegions.some(region =>
                    region.toLowerCase() === key.toLowerCase()
                );
                if (!isValidRegion) return;
            }

            if (!groups[key])
                groups[key] = {
                    count: 0,
                    devices: 0,
                    cost: 0,
                    rows: [],
                };

            groups[key].count += 1;
            groups[key].devices += countNonEmptyIMEI(row);
            groups[key].cost += parseCurrency(
                row[detectedFields.cost] || getField(row, ["Cost", "COST", "cost"])
            );
            groups[key].rows.push(row);
        });

        const result = Object.keys(groups)
            .map((k) => ({
                key: k,
                count: groups[k].count,
                devices: groups[k].devices,
                cost: groups[k].cost,
                rows: groups[k].rows,
            }))
            .sort((a, b) => b.cost - a.cost);

        return result;
    };

    const getStatusColor = (status: string): string => {
        const statusColors: { [key: string]: string } = {
            'scanning': 'blue',
            'rma': 'orange',
            'resolved': 'green',
            'chargeback': 'red',
            'active': 'green',
            'sold': 'purple',
            'demo': 'purple',
            'adjustment': 'orange',
            'returned': 'red',
            'damaged': 'red',
            'lost': 'gray',
            'in stock': 'green',
            'shipped': 'blue',
            'pending': 'orange',
            'completed': 'green',
            'cancelled': 'red',
            'refunded': 'orange',
            'in progress': 'blue',
            'waiting for parts': 'orange',
            'repaired': 'green'
        };

        const normalizedStatus = status.toLowerCase().trim();
        return statusColors[normalizedStatus] || 'gray';
    };

    const buildStatusSummary = (data: AuditItem[]): StatusSummary[] => {
        const statusGroups: { [key: string]: StatusSummary } = {};
        const statusField = detectedFields.status;
        const costField = detectedFields.cost;

        data.forEach((row) => {
            const rawStatus = String(row[statusField] || "").trim();
            const rawCost = row[costField];
            const cost = parseCurrency(rawCost);
            const devices = countNonEmptyIMEI(row);

            // Skip empty status
            if (!rawStatus || rawStatus === "Unknown" || rawStatus === "" || rawStatus === "N/A") {
                return;
            }

            // Check if status value is actually a cost/number
            const isCostValue = /^\$?\d+\.?\d*$/.test(rawStatus);
            if (isCostValue) {
                return;
            }

            // Clean and normalize the status
            const cleanStatus = rawStatus
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/^\s+|\s+$/g, '');

            if (!cleanStatus) return;

            if (!statusGroups[cleanStatus]) {
                statusGroups[cleanStatus] = {
                    status: cleanStatus,
                    count: 0,
                    devices: 0,
                    cost: 0,
                    color: getStatusColor(cleanStatus)
                };
            }

            statusGroups[cleanStatus].count += 1;
            statusGroups[cleanStatus].devices += devices;
            statusGroups[cleanStatus].cost += cost;
        });

        const result = Object.values(statusGroups).sort((a, b) => b.cost - a.cost);
        return result;
    };

    const fetchCSV = async (url: string): Promise<AuditItem[]> => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("fetch error " + res.status);
            const txt = await res.text();

            const lines = txt.split("\n").filter((line) => line.trim());
            if (lines.length < 2) return [];

            const headers = lines[0]
                .split(",")
                .map((h) => h.trim().replace(/"/g, ""));
            const data = lines
                .slice(1)
                .map((line) => {
                    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
                    const obj: AuditItem = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || "";
                    });
                    return obj;
                })
                .filter((row) => Object.values(row).some((val) => val !== ""));

            return data;
        } catch (err) {
            console.error("Fetching CSV failed:", err);
            return [];
        }
    };

    const applyFilters = (data: AuditItem[]): AuditItem[] => {
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        if (!from && !to) return data;

        return data.filter((row) => {
            const raw = getField(row, [
                "SerialDate",
                "Date",
                "ProcessedDate",
            ]);
            const d = parseDateMDY(raw);
            if (!d) return false;
            if (from && d < from) return false;
            if (to) {
                const toEnd = new Date(
                    to.getFullYear(),
                    to.getMonth(),
                    to.getDate(),
                    23,
                    59,
                    59
                );
                if (d > toEnd) return false;
            }
            return true;
        });
    };

    const buildSummaryCards = (data: AuditItem[]) => {
        const totalAudits = data.length;
        const totalDevices = data.reduce((s, r) => s + countNonEmptyIMEI(r), 0);
        const totalCost = data.reduce(
            (s, r) => s + parseCurrency(r[detectedFields.cost] || getField(r, ["Cost", "COST", "cost"])),
            0
        );

        // Use the same logic as buildStatusSummary to count unique statuses
        const statusSummary = buildStatusSummary(data);
        const uniqueStatuses = statusSummary.length;

        const cards = [
            { label: "Total Audits", value: totalAudits, icon: "📋" },
            { label: "Total Devices", value: totalDevices, icon: "📱" },
            { label: "Total Value", value: formatCurrency(totalCost), icon: "💰" },
            { label: "Status Types", value: uniqueStatuses, icon: "🏷️" },
        ];

        return cards;
    };

    const initData = async () => {
        setIsLoadingData(true);
        const data = await fetchCSV(sheetUrl);

        if (data && data.length > 0) {
            setRawData(data);
            const filtered = applyFilters(data);
            setFilteredData(filtered);
            setCurrentData(filtered);

            // Detect all fields
            detectAllFields(filtered);

            const dateVals = data
                .map((r) => parseDateMDY(getField(r, ["SerialDate", "Date"])))
                .filter(Boolean) as Date[];
            if (dateVals.length) {
                const minD = new Date(Math.min(...dateVals.map((d) => d.getTime())));
                const maxD = new Date(Math.max(...dateVals.map((d) => d.getTime())));
                setFromDate(minD.toISOString().slice(0, 10));
                setToDate(maxD.toISOString().slice(0, 10));
            }

            setHistoryStack([{ level: "Regions" }]);
        } else {
            setFilteredData([]);
            setCurrentData([]);
        }
        setIsLoadingData(false);
    };

    const handleApplyFilters = () => {
        const filtered = applyFilters(rawData);
        setFilteredData(filtered);
        setCurrentData(filtered);
        setCurrentView("regions");
        setHistoryStack([{ level: "Regions" }]);
        setSelectedRegion("");
        setSelectedMarket("");
        setSelectedStatus("");
    };

    const handleResetFilters = () => {
        setFromDate("");
        setToDate("");
        setFilteredData(rawData);
        setCurrentData(rawData);
        setCurrentView("regions");
        setHistoryStack([{ level: "Regions" }]);
        setSelectedRegion("");
        setSelectedMarket("");
        setSelectedStatus("");
    };

    const handleExportCSV = () => {
        if (!filteredData.length) return;

        const keys = Object.keys(filteredData[0]);
        const csv = [keys.join(",")]
            .concat(
                filteredData.map((r) =>
                    keys
                        .map((k) => `"${String(r[k] || "").replace(/"/g, '""')}"`)
                        .join(",")
                )
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "audit_export.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRegionClick = (region: AggregatedGroup) => {
        const marketData = region.rows;
        setCurrentData(marketData);
        setCurrentView("market");
        setSelectedRegion(region.key);
        setHistoryStack([
            { level: "Regions" },
            { level: "Market", selected: region.key },
        ]);
    };

    const handleMarketClick = (market: AggregatedGroup) => {
        const statusData = market.rows;
        setCurrentData(statusData);
        setCurrentView("status");
        setSelectedMarket(market.key);
        setHistoryStack([
            { level: "Regions" },
            { level: "Market", selected: selectedRegion },
            { level: "Status", selected: market.key },
        ]);
    };

    const handleStatusClick = (status: AggregatedGroup) => {
        const detailedData = status.rows;
        setCurrentData(detailedData);
        setCurrentView("detailed");
        setSelectedStatus(status.key);
        setHistoryStack([
            { level: "Regions" },
            { level: "Market", selected: selectedRegion },
            { level: "Status", selected: selectedMarket },
            { level: "Detailed", selected: status.key },
        ]);
    };

    const handleBackClick = () => {
        if (historyStack.length <= 1) {
            setCurrentData(filteredData);
            setCurrentView("regions");
            setHistoryStack([{ level: "Regions" }]);
            setSelectedRegion("");
            setSelectedMarket("");
            setSelectedStatus("");
        } else {
            const newStack = historyStack.slice(0, -1);
            setHistoryStack(newStack);

            const previousLevel = newStack[newStack.length - 1];

            if (previousLevel.level === "Regions") {
                setCurrentData(filteredData);
                setCurrentView("regions");
                setSelectedRegion("");
            } else if (previousLevel.level === "Market") {
                const regionKey = detectedFields.region;
                const regionData = filteredData.filter(
                    (row) => getField(row, [regionKey]) === previousLevel.selected
                );
                setCurrentData(regionData);
                setCurrentView("market");
                setSelectedMarket("");
            } else if (previousLevel.level === "Status") {
                const regionKey = detectedFields.region;
                const marketKey = detectedFields.market;
                const statusData = filteredData.filter(
                    (row) =>
                        getField(row, [regionKey]) === selectedRegion &&
                        getField(row, [marketKey]) === previousLevel.selected
                );
                setCurrentData(statusData);
                setCurrentView("status");
                setSelectedStatus("");
            }
        }
    };

    const renderBreadcrumb = () => {
        return historyStack.map((item, index) => (
            <span key={index} className="audit-breadcrumb">
                {item.selected ? `${item.level} — ${item.selected}` : item.level}
                {index < historyStack.length - 1 && (
                    <span className="mx-2 text-gray-400">›</span>
                )}
            </span>
        ));
    };

    const renderStatusSummary = (data: AuditItem[]) => {
        const statusSummary = buildStatusSummary(data);
        const totalCost = statusSummary.reduce((sum, item) => sum + item.cost, 0);

        return (
            <div className="audit-table-block">
                <div className="audit-table-header">
                    <h2>Status Summary - {selectedMarket}</h2>
                    <div className="audit-meta">
                        {statusSummary.length} status types — total value {formatCurrency(totalCost)}
                    </div>
                </div>

                <div className="audit-table-wrapper">
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th className="audit-col-right">Audit Count</th>
                                <th className="audit-col-right">Devices</th>
                                <th className="audit-col-right">Total Value</th>
                                <th>Value Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {statusSummary.map((status, index) => {
                                const pct = totalCost > 0 ? Math.round((status.cost / totalCost) * 100) : 0;


                                let barColor = '';
                                if (pct >= 50) {
                                    barColor = 'audit-fill-green';
                                } else if (pct >= 20) {
                                    barColor = 'audit-fill-amber';
                                } else {
                                    barColor = 'audit-fill-red';
                                }

                                return (
                                    <tr key={index} onClick={() => handleStatusClick({
                                        key: status.status,
                                        count: status.count,
                                        devices: status.devices,
                                        cost: status.cost,
                                        rows: data.filter(row => row[detectedFields.status] === status.status)
                                    })}>
                                        <td>
                                            <span className={`status-indicator status-${status.color}`}>
                                                {status.status}
                                            </span>
                                        </td>
                                        <td className="audit-col-right">{status.count}</td>
                                        <td className="audit-col-right">{status.devices}</td>
                                        <td className="audit-col-right">{formatCurrency(status.cost)}</td>
                                        <td>
                                            <div className="audit-bar-cell">
                                                <div className="audit-bar-track">
                                                    <div
                                                        className={`audit-bar-fill ${barColor}`}
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

    const renderTable = (
        data: AuditItem[],
        level: string,
        onRowClick: (group: AggregatedGroup) => void
    ) => {
        let keyField = "";
        let title = "";

        switch (level) {
            case "regions":
                keyField = detectedFields.region;
                title = "Regions";
                break;
            case "market":
                keyField = detectedFields.market;
                title = "Markets";
                break;
            case "status":
                return renderStatusSummary(data);
            case "detailed":
                return renderDetailedTable(data);
            default:
                keyField = "Unknown";
                title = "Data";
        }

        const aggregated = aggregate(data, keyField, level);
        const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);
        const totalCost = aggregated.reduce((sum, group) => sum + group.cost, 0);

        return (
            <div className="audit-table-block">
                <div className="audit-table-header">
                    <h2>{title}</h2>
                    <div className="audit-meta">
                        {aggregated.length} groups — total value {formatCurrency(totalCost)}
                    </div>
                </div>

                <div className="audit-table-wrapper">
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>{title}</th>
                                <th className="audit-col-right">Audit Count</th>
                                <th className="audit-col-right">Devices</th>
                                <th className="audit-col-right">Total Value</th>
                                <th>Value Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aggregated.map((group, index) => {
                                const pct = Math.round((group.cost / maxCost) * 100);
                                const fillClass =
                                    pct >= 70 ? "audit-fill-green" : pct >= 40 ? "audit-fill-amber" : "audit-fill-red";

                                return (
                                    <tr key={index} onClick={() => onRowClick(group)}>
                                        <td>{group.key}</td>
                                        <td className="audit-col-right">{group.count}</td>
                                        <td className="audit-col-right">{group.devices}</td>
                                        <td className="audit-col-right">{formatCurrency(group.cost)}</td>
                                        <td>
                                            <div className="audit-bar-cell">
                                                <div className="audit-bar-track">
                                                    <div
                                                        className={`audit-bar-fill ${fillClass}`}
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

    const renderDetailedTable = (data: AuditItem[]) => {
        return (
            <div className="audit-table-block">
                <div className="audit-table-header">
                    <h2>Detailed Audit - {selectedStatus}</h2>
                    <div className="audit-meta">{data.length} audit records</div>
                </div>

                <div className="audit-table-wrapper">
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th>Serial Date</th>
                                <th>Market</th>
                                <th>Store</th>
                                <th>Tech ID</th>
                                <th>SKU Description</th>
                                <th>Full IMEI</th>
                                <th className="audit-col-right">Cost</th>
                                <th>Status</th>
                                <th>Final Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => {
                                const serialDate = getField(row, ["SerialDate", "Date"]);
                                const market = getField(row, ["Market", "Market Name"]);
                                const store = getField(row, ["Store"]);
                                const techId = getField(row, ["TechID"]);
                                const sku = getField(row, ["SKUDescription"]);
                                const imei = getField(row, ["FullIMEI#"]);
                                const cost = formatCurrency(parseCurrency(row[detectedFields.cost] || getField(row, ["Cost", "COST"])));
                                const status = row[detectedFields.status];
                                const comments = getField(row, ["FinalComments"]);

                                return (
                                    <tr key={index}>
                                        <td>{serialDate}</td>
                                        <td>{market}</td>
                                        <td>{store}</td>
                                        <td>{techId}</td>
                                        <td>{sku.split('|').pop() || sku}</td>
                                        <td>{imei}</td>
                                        <td className="audit-col-right">{cost}</td>
                                        <td>
                                            <span className={`status-indicator status-${getStatusColor(String(status))}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td>{comments}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const summaryCards = buildSummaryCards(filteredData);

    if (isLoading) {
        return (
            <div className="app-loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <div className="main-content">
            <div className="content-wrapper">
                <header className="topbar">
                    <div className="brand">
                        <div className="logo">🔍</div>
                        <div className="title">
                            <div className="main">Audit Dashboard</div>
                            <div className="sub">
                                Device audit tracking and status analytics
                            </div>
                        </div>
                    </div>
                </header>

                <main className="main-area">
                    {/* Controls Section */}
                    <div className="audit-controls-section">
                        <div className="audit-controls-grid">
                            <div className="audit-date-inputs">
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="audit-input"
                                    placeholder="From Date"
                                />
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="audit-input"
                                    placeholder="To Date"
                                />
                            </div>
                            <div className="audit-action-buttons">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleApplyFilters}
                                >
                                    Apply Filters
                                </button>
                                <button
                                    className="btn"
                                    onClick={handleResetFilters}
                                >
                                    Reset
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleExportCSV}
                                >
                                    Export CSV
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <section className="dashboard-grid">
                        {summaryCards.map((card, index) => (
                            <div key={index} className="dashboard-card card-purple">
                                <div className="card-icon">{card.icon}</div>
                                <div className="card-content">
                                    <h3 className="card-title">{card.label}</h3>
                                    <p className="card-description">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </section>

                    {/* Navigation */}
                    <div className="audit-nav-row">
                        <button
                            className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
                            onClick={handleBackClick}
                        >
                            ← Back
                        </button>
                        <div className="audit-breadcrumb">
                            {renderBreadcrumb()}
                        </div>
                    </div>

                    <section className="audit-stacked">
                        {currentView === "regions" &&
                            renderTable(currentData, "regions", handleRegionClick)}
                        {currentView === "market" &&
                            renderTable(currentData, "market", handleMarketClick)}
                        {currentView === "status" &&
                            renderTable(currentData, "status", handleStatusClick)}
                        {currentView === "detailed" && renderDetailedTable(currentData)}
                    </section>

                    {/* Loading State */}
                    {isLoadingData && (
                        <div className="audit-loading">
                            <div className="loading-spinner"></div>
                            <p>Loading audit data...</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}