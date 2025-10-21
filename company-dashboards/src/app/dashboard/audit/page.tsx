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
//     cost?: number; // Make optional or remove
//     rows: AuditItem[];
// }

// interface StatusSummary {
//     status: string;
//     count: number;
//     devices: number;
//     cost?: number; // Make optional or remove
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

//     // const aggregate = (data: AuditItem[], keyField: string, level: string = ""): AggregatedGroup[] => {
//     //     const groups: {
//     //         [key: string]: {
//     //             count: number;
//     //             devices: number;
//     //             cost: number;
//     //             rows: AuditItem[];
//     //         };
//     //     } = {};

//     //     const validRegions = ["Aleem Ghori Region", "Hasnain Mustaqeem Region"];

//     //     data.forEach((row) => {
//     //         const keyRaw = getField(row, [keyField]);
//     //         const key = String(keyRaw || "").trim();

//     //         if (!key || key === "Unknown" || key === "") return;

//     //         if (level === "regions" && keyField.toLowerCase().includes("region")) {
//     //             const isValidRegion = validRegions.some(region =>
//     //                 region.toLowerCase() === key.toLowerCase()
//     //             );
//     //             if (!isValidRegion) {
//     //                 console.log("Filtering out invalid region:", key);
//     //                 return;
//     //             }
//     //         }

//     //         if (!groups[key])
//     //             groups[key] = {
//     //                 count: 0,
//     //                 devices: 0,
//     //                 cost: 0,
//     //                 rows: [],
//     //             };

//     //         groups[key].count += 1;
//     //         groups[key].devices += countNonEmptyIMEI(row);
//     //         groups[key].cost += parseCurrency(
//     //             getField(row, ["Cost", "COST", "cost"])
//     //         );
//     //         groups[key].rows.push(row);
//     //     });

//     //     const result = Object.keys(groups)
//     //         .map((k) => ({
//     //             key: k,
//     //             count: groups[k].count,
//     //             devices: groups[k].devices,
//     //             cost: groups[k].cost,
//     //             rows: groups[k].rows,
//     //         }))
//     //         .sort((a, b) => b.cost - a.cost);

//     //     return result;
//     // };
//     const aggregate = (data: AuditItem[], keyField: string, level: string = ""): AggregatedGroup[] => {
//         const groups: {
//             [key: string]: {
//                 count: number;
//                 devices: number;
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
//                     rows: [],
//                 };

//             groups[key].count += 1;
//             groups[key].devices += countNonEmptyIMEI(row);
//             groups[key].rows.push(row);
//         });

//         const result = Object.keys(groups)
//             .map((k) => ({
//                 key: k,
//                 count: groups[k].count,
//                 devices: groups[k].devices,
//                 cost: 0, // Remove cost from aggregation
//                 rows: groups[k].rows,
//             }))
//             .sort((a, b) => b.count - a.count); // Sort by count instead of cost

//         return result;
//     };
//     // const buildStatusSummary = (data: AuditItem[]): StatusSummary[] => {
//     //     const statusGroups: { [key: string]: StatusSummary } = {};

//     //     data.forEach((row) => {
//     //         const status = getField(row, ["Status", "STATUS", "status"]);
//     //         const cost = parseCurrency(getField(row, ["Cost", "COST", "cost"]));
//     //         const devices = countNonEmptyIMEI(row);

//     //         if (!statusGroups[status]) {
//     //             statusGroups[status] = {
//     //                 status,
//     //                 count: 0,
//     //                 devices: 0,
//     //                 cost: 0,
//     //                 color: getStatusColor(status)
//     //             };
//     //         }

//     //         statusGroups[status].count += 1;
//     //         statusGroups[status].devices += devices;
//     //         statusGroups[status].cost += cost;
//     //     });

//     //     return Object.values(statusGroups).sort((a, b) => b.cost - a.cost);
//     // };
//     const buildStatusSummary = (data: AuditItem[]): StatusSummary[] => {
//         const statusGroups: { [key: string]: StatusSummary } = {};

//         data.forEach((row) => {
//             const status = getField(row, ["Status", "STATUS", "status"]);
//             const devices = countNonEmptyIMEI(row);

//             if (!statusGroups[status]) {
//                 statusGroups[status] = {
//                     status,
//                     count: 0,
//                     devices: 0,
//                     cost: 0, // Remove cost
//                     color: getStatusColor(status)
//                 };
//             }

//             statusGroups[status].count += 1;
//             statusGroups[status].devices += devices;
//             // Remove cost accumulation
//         });

//         return Object.values(statusGroups).sort((a, b) => b.count - a.count); // Sort by count
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

//     // Drill-down handlers
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
//     // const renderStatusSummary = (data: AuditItem[]) => {
//     //     const statusSummary = buildStatusSummary(data);

//     //     return (
//     //         <div className="audit-table-block">
//     //             <div className="audit-table-header">
//     //                 <h2>Status Summary - {selectedMarket}</h2>
//     //                 <div className="audit-meta">
//     //                     {statusSummary.length} status types — {data.length} total audits
//     //                 </div>
//     //             </div>

//     //             <div className="audit-table-wrapper">
//     //                 <table className="audit-table">
//     //                     <thead>
//     //                         <tr>
//     //                             <th>Status</th>
//     //                             <th className="audit-col-right">Audit Count</th>
//     //                             <th className="audit-col-right">Devices</th>
//     //                             <th>Distribution</th>
//     //                         </tr>
//     //                     </thead>
//     //                     <tbody>
//     //                         {statusSummary.map((status, index) => {
//     //                             const totalAudits = data.length;
//     //                             const pct = totalAudits > 0 ? Math.round((status.count / totalAudits) * 100) : 0;
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
//     // const renderTable = (
//     //     data: AuditItem[],
//     //     level: string,
//     //     onRowClick: (group: AggregatedGroup) => void
//     // ) => {
//     //     let keyField = "";
//     //     let title = "";

//     //     switch (level) {
//     //         case "regions":
//     //             keyField = detectKey(["Regions", "Region", "REGIONS"]);
//     //             title = "Regions";
//     //             break;
//     //         case "market":
//     //             keyField = detectKey(["Market", "Market Name", "MARKET"]);
//     //             title = "Markets";
//     //             break;
//     //         case "status":
//     //             return renderStatusSummary(data);
//     //         case "detailed":
//     //             return renderDetailedTable(data);
//     //         default:
//     //             keyField = "Unknown";
//     //             title = "Data";
//     //     }

//     //     const aggregated = aggregate(data, keyField, level);
//     //     const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);

//     //     return (
//     //         <div className="audit-table-block">
//     //             <div className="audit-table-header">
//     //                 <h2>{title}</h2>
//     //                 <div className="audit-meta">
//     //                     {aggregated.length} groups — total value{" "}
//     //                     {formatCurrency(aggregated.reduce((s, a) => s + a.cost, 0))}
//     //                 </div>
//     //             </div>

//     //             <div className="audit-table-wrapper">
//     //                 <table className="audit-table">
//     //                     <thead>
//     //                         <tr>
//     //                             <th>{title}</th>
//     //                             <th className="audit-col-right">Audit Count</th>
//     //                             <th className="audit-col-right">Devices</th>
//     //                             <th className="audit-col-right">Total Value</th>
//     //                             <th>Value Distribution</th>
//     //                         </tr>
//     //                     </thead>
//     //                     <tbody>
//     //                         {aggregated.map((group, index) => {
//     //                             const pct = Math.round((group.cost / maxCost) * 100);
//     //                             const fillClass =
//     //                                 pct >= 70 ? "audit-fill-green" : pct >= 40 ? "audit-fill-amber" : "audit-fill-red";

//     //                             return (
//     //                                 <tr key={index} onClick={() => onRowClick(group)}>
//     //                                     <td>{group.key}</td>
//     //                                     <td className="audit-col-right">{group.count}</td>
//     //                                     <td className="audit-col-right">{group.devices}</td>
//     //                                     <td className="audit-col-right">{formatCurrency(group.cost)}</td>
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

//         return (
//             <div className="audit-table-block">
//                 <div className="audit-table-header">
//                     <h2>Status Summary - {selectedMarket}</h2>
//                     <div className="audit-meta">
//                         {statusSummary.length} status types — {data.length} total audits
//                     </div>
//                 </div>

//                 <div className="audit-table-wrapper">
//                     <table className="audit-table">
//                         <thead>
//                             <tr>
//                                 <th>Status</th>
//                                 <th className="audit-col-right">Audit Count</th>
//                                 <th className="audit-col-right">Devices</th>
//                                 <th>Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {statusSummary.map((status, index) => {
//                                 const totalAudits = data.length;
//                                 const pct = totalAudits > 0 ? Math.round((status.count / totalAudits) * 100) : 0;
//                                 const fillClass = `audit-fill-${status.color}`;

//                                 return (
//                                     <tr key={index} onClick={() => handleStatusClick({
//                                         key: status.status,
//                                         count: status.count,
//                                         devices: status.devices,
//                                         rows: data.filter(row => getField(row, ["Status"]) === status.status)
//                                     })}>
//                                         <td>
//                                             <span className="status-indicator">
//                                                 {status.status}
//                                             </span>
//                                         </td>
//                                         <td className="audit-col-right">{status.count}</td>
//                                         <td className="audit-col-right">{status.devices}</td>
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
//         const totalCount = aggregated.reduce((sum, group) => sum + group.count, 0);

//         return (
//             <div className="audit-table-block">
//                 <div className="audit-table-header">
//                     <h2>{title}</h2>
//                     <div className="audit-meta">
//                         {aggregated.length} groups — {totalCount} total audits
//                     </div>
//                 </div>

//                 <div className="audit-table-wrapper">
//                     <table className="audit-table">
//                         <thead>
//                             <tr>
//                                 <th>{title}</th>
//                                 <th className="audit-col-right">Audit Count</th>
//                                 <th className="audit-col-right">Devices</th>
//                                 <th>Distribution</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {aggregated.map((group, index) => {
//                                 const pct = totalCount > 0 ? Math.round((group.count / totalCount) * 100) : 0;
//                                 const fillClass =
//                                     pct >= 70 ? "audit-fill-green" : pct >= 40 ? "audit-fill-amber" : "audit-fill-red";

//                                 return (
//                                     <tr key={index} onClick={() => onRowClick(group)}>
//                                         <td>{group.key}</td>
//                                         <td className="audit-col-right">{group.count}</td>
//                                         <td className="audit-col-right">{group.devices}</td>
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

    const detectKey = (candidates: string[]): string => {
        if (!filteredData || filteredData.length === 0) return candidates[0];

        const allKeys = Object.keys(filteredData[0] || {});

        for (const candidate of candidates) {
            const hasKey = filteredData.some((row) => {
                const value = getField(row, [candidate]);
                return value && value !== "Unknown" && value !== "";
            });
            if (hasKey) return candidate;
        }

        for (const candidate of candidates) {
            const matchedKey = allKeys.find((key) =>
                key.toLowerCase().includes(candidate.toLowerCase())
            );
            if (matchedKey) {
                const hasData = filteredData.some((row) => {
                    const value = String(row[matchedKey] || "").trim();
                    return value && value !== "Unknown" && value !== "";
                });
                if (hasData) return matchedKey;
            }
        }

        return candidates[0];
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
            const keyRaw = getField(row, [keyField]);
            const key = String(keyRaw || "").trim();

            if (!key || key === "Unknown" || key === "") return;

            if (level === "regions" && keyField.toLowerCase().includes("region")) {
                const isValidRegion = validRegions.some(region =>
                    region.toLowerCase() === key.toLowerCase()
                );
                if (!isValidRegion) {
                    console.log("Filtering out invalid region:", key);
                    return;
                }
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
                getField(row, ["Cost", "COST", "cost"])
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

    const buildStatusSummary = (data: AuditItem[]): StatusSummary[] => {
        const statusGroups: { [key: string]: StatusSummary } = {};

        data.forEach((row) => {
            const status = getField(row, ["Status", "STATUS", "status"]);
            const cost = parseCurrency(getField(row, ["Cost", "COST", "cost"]));
            const devices = countNonEmptyIMEI(row);

            if (!statusGroups[status]) {
                statusGroups[status] = {
                    status,
                    count: 0,
                    devices: 0,
                    cost: 0,
                    color: getStatusColor(status)
                };
            }

            statusGroups[status].count += 1;
            statusGroups[status].devices += devices;
            statusGroups[status].cost += cost;
        });

        return Object.values(statusGroups).sort((a, b) => b.cost - a.cost);
    };

    const getStatusColor = (status: string): string => {
        const statusColors: { [key: string]: string } = {
            'Active': 'green',
            'Sold': 'blue',
            'Demo': 'purple',
            'Adjustment': 'orange',
            'Returned': 'red',
            'Damaged': 'red',
            'Lost': 'gray'
        };

        return statusColors[status] || 'gray';
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

            if (data.length > 0) {
                console.log("Available CSV fields:", Object.keys(data[0]));
                console.log("Sample data:", data.slice(0, 3));
            }

            return data;
        } catch (err) {
            console.warn("Fetching CSV failed:", err);
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
            (s, r) => s + parseCurrency(getField(r, ["Cost", "COST", "cost"])),
            0
        );
        const uniqueStatuses = new Set(data.map(r => getField(r, ["Status", "STATUS", "status"]))).size;

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
                const regionKey = detectKey(["Regions", "Region", "REGIONS"]);
                const regionData = filteredData.filter(
                    (row) => getField(row, [regionKey]) === previousLevel.selected
                );
                setCurrentData(regionData);
                setCurrentView("market");
                setSelectedMarket("");
            } else if (previousLevel.level === "Status") {
                const regionKey = detectKey(["Regions", "Region", "REGIONS"]);
                const marketKey = detectKey(["Market", "Market Name", "MARKET"]);
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

    // const renderStatusSummary = (data: AuditItem[]) => {
    //     const statusSummary = buildStatusSummary(data);
    //     const totalCost = statusSummary.reduce((sum, item) => sum + item.cost, 0);

    //     return (
    //         <div className="audit-table-block">
    //             <div className="audit-table-header">
    //                 <h2>Status Summary - {selectedMarket}</h2>
    //                 <div className="audit-meta">
    //                     {statusSummary.length} status types — total value {formatCurrency(totalCost)}
    //                 </div>
    //             </div>

    //             <div className="audit-table-wrapper">
    //                 <table className="audit-table">
    //                     <thead>
    //                         <tr>
    //                             <th>Status</th>
    //                             <th className="audit-col-right">Audit Count</th>
    //                             <th className="audit-col-right">Devices</th>
    //                             <th className="audit-col-right">Total Value</th>
    //                             <th>Value Distribution</th>
    //                         </tr>
    //                     </thead>
    //                     <tbody>
    //                         {statusSummary.map((status, index) => {
    //                             const pct = totalCost > 0 ? Math.round((status.cost / totalCost) * 100) : 0;
    //                             const fillClass = `audit-fill-${status.color}`;

    //                             return (
    //                                 <tr key={index} onClick={() => handleStatusClick({
    //                                     key: status.status,
    //                                     count: status.count,
    //                                     devices: status.devices,
    //                                     cost: status.cost,
    //                                     rows: data.filter(row => getField(row, ["Status"]) === status.status)
    //                                 })}>
    //                                     <td>
    //                                         <span className={`status-indicator status-${status.color}`}>
    //                                             {status.status}
    //                                         </span>
    //                                     </td>
    //                                     <td className="audit-col-right">{status.count}</td>
    //                                     <td className="audit-col-right">{status.devices}</td>
    //                                     <td className="audit-col-right">{formatCurrency(status.cost)}</td>
    //                                     <td>
    //                                         <div className="audit-bar-cell">
    //                                             <div className="audit-bar-track">
    //                                                 <div
    //                                                     className={`audit-bar-fill ${fillClass}`}
    //                                                     style={{ width: `${pct}%` }}
    //                                                 ></div>
    //                                             </div>
    //                                             <div style={{ minWidth: "52px", textAlign: "right" }}>
    //                                                 {pct}%
    //                                             </div>
    //                                         </div>
    //                                     </td>
    //                                 </tr>
    //                             );
    //                         })}
    //                     </tbody>
    //                 </table>
    //             </div>
    //         </div>
    //     );
    // };
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

                                // Determine color based on percentage
                                let barColor = '';
                                if (pct >= 50) {
                                    barColor = 'audit-fill-green'; // High percentage - Red
                                } else if (pct >= 20) {
                                    barColor = 'audit-fill-amber'; // Medium percentage - Yellow/Amber
                                } else {
                                    barColor = 'audit-fill-red'; // Low percentage - Green
                                }

                                return (
                                    <tr key={index} onClick={() => handleStatusClick({
                                        key: status.status,
                                        count: status.count,
                                        devices: status.devices,
                                        cost: status.cost,
                                        rows: data.filter(row => getField(row, ["Status"]) === status.status)
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
                keyField = detectKey(["Regions", "Region", "REGIONS"]);
                title = "Regions";
                break;
            case "market":
                keyField = detectKey(["Market", "Market Name", "MARKET"]);
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
                                const cost = formatCurrency(parseCurrency(getField(row, ["Cost", "COST"])));
                                const status = getField(row, ["Status", "STATUS"]);
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
                                            <span className={`status-indicator status-${getStatusColor(status)}`}>
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


