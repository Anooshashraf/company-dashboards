// "use client";
// import { useAuth } from "../../../components/AuthProvider";
// import { useRouter } from "next/navigation";
// import { useEffect, useState, useCallback, useMemo } from "react";
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

//     // Sheet URLs for both regions
//     const sheetUrls = [
//         "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhKMtyCA2gB3lHwcP9hGLhDgmCUUqXVNmthUsFggsgaFeFuOYOPzjctQmkHMZ4ZA/pub?gid=259016646&single=true&output=csv",
//         "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhKMtyCA2gB3lHwcP9hGLhDgmCUUqXVNmthUsFggsgaFeFuOYOPzjctQmkHMZ4ZA/pub?gid=1286573647&single=true&output=csv"
//     ];

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

//     // FIXED: Enhanced CSV parsing to handle line breaks and scientific notation
//     const parseCSV = useCallback((text: string): AuditItem[] => {
//         const lines = text.split('\n').filter(line => line.trim().length > 0);
//         if (lines.length < 2) return [];

//         // Get headers from first line
//         const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ""));

//         const data: AuditItem[] = [];
//         let currentRow: string[] = [];
//         let inQuotes = false;
//         let currentField = '';

//         // Process all lines except header
//         for (let i = 1; i < lines.length; i++) {
//             const line = lines[i];

//             for (let j = 0; j < line.length; j++) {
//                 const char = line[j];

//                 if (char === '"') {
//                     inQuotes = !inQuotes;
//                 } else if (char === ',' && !inQuotes) {
//                     currentRow.push(currentField.trim());
//                     currentField = '';
//                 } else {
//                     currentField += char;
//                 }
//             }

//             // If we're still in quotes, continue to next line
//             if (!inQuotes) {
//                 currentRow.push(currentField.trim());

//                 // Only process if we have the right number of columns
//                 if (currentRow.length === headers.length) {
//                     const obj: AuditItem = {};
//                     headers.forEach((header, index) => {
//                         let value = currentRow[index] || "";

//                         // Clean up the value
//                         value = value.replace(/"/g, "").trim();

//                         // Handle scientific notation in IMEI
//                         if (header.toLowerCase().includes('imei') || header.toLowerCase().includes('fullimei')) {
//                             if (value.includes('E+') || value.includes('e+')) {
//                                 try {
//                                     // Convert scientific notation to full number
//                                     const num = Number(value);
//                                     if (!isNaN(num)) {
//                                         value = BigInt(num).toString();
//                                     }
//                                 } catch (e) {
//                                     console.warn('Could not convert IMEI:', value);
//                                 }
//                             }
//                         }

//                         obj[header] = value;
//                     });

//                     // Only add row if it has valid data
//                     if (Object.values(obj).some(val => val !== "" && val !== undefined)) {
//                         data.push(obj);
//                     }
//                 } else {
//                     console.warn('Skipping row with incorrect column count:', currentRow.length, 'expected:', headers.length);
//                 }

//                 currentRow = [];
//                 currentField = '';
//             } else {
//                 // Continue field to next line
//                 currentField += '\n';
//             }
//         }

//         console.log(`Parsed ${data.length} rows from CSV`);
//         return data;
//     }, []);

//     // Enhanced currency parsing
//     const parseCurrency = useCallback((v: any): number => {
//         if (v == null || v === "" || v === undefined) return 0;

//         const str = String(v).trim();

//         if (str === "" || str === "-" || str === "N/A" || str === "null" || str === " ") {
//             return 0;
//         }

//         const cleaned = str
//             .replace(/\$/g, '')
//             .replace(/,/g, '')
//             .replace(/\s+/g, '')
//             .replace(/[^\d.-]/g, "");

//         const parts = cleaned.split('.');
//         let finalNumber = parts[0];
//         if (parts.length > 1) {
//             finalNumber += '.' + parts.slice(1).join('');
//         }

//         const n = parseFloat(finalNumber);
//         return isNaN(n) ? 0 : n;
//     }, []);

//     const parseDateMDY = useCallback((s: string): Date | null => {
//         if (!s || s.trim() === "") return null;
//         const str = String(s).trim();

//         // Handle MM/DD/YYYY format
//         const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
//         if (mdyMatch) {
//             const month = parseInt(mdyMatch[1]) - 1;
//             const day = parseInt(mdyMatch[2]);
//             const year = parseInt(mdyMatch[3]);
//             const date = new Date(year, month, day);
//             if (!isNaN(date.getTime())) {
//                 return date;
//             }
//         }

//         const d = new Date(str);
//         return isNaN(d.getTime()) ? null : d;
//     }, []);

//     const formatCurrency = useCallback((v: number): string => {
//         return "$" + Number(v || 0).toLocaleString(undefined, {
//             minimumFractionDigits: 2,
//             maximumFractionDigits: 2
//         });
//     }, []);

//     const getField = useCallback((obj: AuditItem, candidates: string[]): string => {
//         if (!obj) return "Unknown";

//         for (const k of candidates) {
//             if (k in obj && obj[k] !== "" && obj[k] != null) return String(obj[k]);
//             const matched = Object.keys(obj).find(
//                 (x) => x.toLowerCase() === k.toLowerCase()
//             );
//             if (matched && obj[matched] !== "" && obj[matched] != null)
//                 return String(obj[matched]);
//         }
//         return "Unknown";
//     }, []);

//     // Enhanced IMEI counting with scientific notation handling
//     const countNonEmptyIMEI = useCallback((row: AuditItem): number => {
//         const imeiValue = getField(row, [
//             "FullIMEI#",
//             "IMEI",
//             "imei",
//             "CUSTOMER IMEI",
//         ]);

//         if (!imeiValue) return 0;

//         let cleanedIMEI = String(imeiValue).trim();

//         // Handle scientific notation
//         if (cleanedIMEI.includes('E+') || cleanedIMEI.includes('e+')) {
//             try {
//                 const num = Number(cleanedIMEI);
//                 if (!isNaN(num)) {
//                     cleanedIMEI = BigInt(num).toString();
//                 }
//             } catch (e) {
//                 console.warn('Could not convert IMEI from scientific notation:', cleanedIMEI);
//             }
//         }

//         // More inclusive IMEI validation
//         if (!cleanedIMEI ||
//             cleanedIMEI === "Unknown" ||
//             cleanedIMEI === "0" ||
//             cleanedIMEI === "N/A" ||
//             cleanedIMEI === "null" ||
//             cleanedIMEI === "NULL" ||
//             cleanedIMEI.length < 5
//         ) {
//             return 0;
//         }

//         return 1;
//     }, [getField]);

//     // Enhanced field detection
//     const detectKey = useCallback((candidates: string[], data: AuditItem[]): string => {
//         if (!data || data.length === 0) return candidates[0];

//         const allKeys = Object.keys(data[0] || {});

//         for (const candidate of candidates) {
//             if (allKeys.includes(candidate)) {
//                 return candidate;
//             }
//         }

//         for (const candidate of candidates) {
//             const matchedKey = allKeys.find((key) =>
//                 key.toLowerCase() === candidate.toLowerCase()
//             );
//             if (matchedKey) {
//                 return matchedKey;
//             }
//         }

//         for (const candidate of candidates) {
//             const matchedKey = allKeys.find((key) =>
//                 key.toLowerCase().includes(candidate.toLowerCase())
//             );
//             if (matchedKey) {
//                 const sampleValues = data.slice(0, 10).map(row => String(row[matchedKey] || "").trim());
//                 const hasValidData = sampleValues.some(val => val && val !== "" && val !== "Unknown");

//                 if (hasValidData) {
//                     return matchedKey;
//                 }
//             }
//         }

//         return candidates[0];
//     }, []);

//     const detectAllFields = useCallback((data: AuditItem[]) => {
//         const fields = {
//             status: detectKey(["Status", "STATUS", "status"], data),
//             cost: detectKey(["Cost", "COST", "cost", " Total Cost"], data),
//             region: detectKey(["Regions", "Region", "REGIONS"], data),
//             market: detectKey(["Market", "Market Name", "MARKET"], data),
//             date: detectKey(["SerialDate", "Date", "ProcessedDate"], data),
//             store: detectKey(["Store", "STORE", "Store Name"], data),
//             techId: detectKey(["TechID", "Tech ID", "TECHID"], data),
//             sku: detectKey(["SKUDescription", "SKU", "sku"], data),
//             imei: detectKey(["FullIMEI#", "IMEI", "imei"], data),
//             comments: detectKey(["FinalComments", "Comments", "COMMENTS"], data)
//         };

//         console.log("Detected fields:", fields);
//         setDetectedFields(fields);
//         return fields;
//     }, [detectKey]);

//     const fetchCSV = useCallback(async (url: string): Promise<AuditItem[]> => {
//         try {
//             const res = await fetch(url);
//             if (!res.ok) throw new Error("fetch error " + res.status);
//             const txt = await res.text();

//             console.log(`Raw CSV text length: ${txt.length}`);
//             console.log("First 500 chars of CSV:", txt.substring(0, 500));

//             const data = parseCSV(txt);
//             console.log(`Parsed ${data.length} rows from ${url}`);

//             if (data.length > 0) {
//                 console.log("Sample parsed row:", data[0]);
//                 console.log("All columns in sample:", Object.keys(data[0]));
//             }

//             return data;
//         } catch (err) {
//             console.error("Fetching CSV failed:", err);
//             return [];
//         }
//     }, [parseCSV]);

//     // Fetch data from all sheets and combine
//     const fetchAllData = useCallback(async (): Promise<AuditItem[]> => {
//         try {
//             console.log("Fetching data from both regions...");

//             const fetchPromises = sheetUrls.map(url => fetchCSV(url));
//             const results = await Promise.all(fetchPromises);

//             const allData = results.flat();
//             console.log(`Combined data: ${allData.length} total rows from ${results.length} sheets`);

//             return allData;
//         } catch (err) {
//             console.error("Error fetching data from multiple sheets:", err);
//             return [];
//         }
//     }, [fetchCSV]);

//     const applyFilters = useCallback((data: AuditItem[]): AuditItem[] => {
//         const from = fromDate ? new Date(fromDate) : null;
//         const to = toDate ? new Date(toDate) : null;
//         if (!from && !to) return data;

//         return data.filter((row) => {
//             const raw = getField(row, ["SerialDate", "Date", "ProcessedDate"]);
//             const d = parseDateMDY(raw);
//             if (!d) return false;
//             if (from && d < from) return false;
//             if (to) {
//                 const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59);
//                 if (d > toEnd) return false;
//             }
//             return true;
//         });
//     }, [fromDate, toDate, getField, parseDateMDY]);

//     const getStatusColor = useCallback((status: string): string => {
//         const statusColors: { [key: string]: string } = {
//             'scanning': 'purple',
//             'rma': 'purple',
//             'resolved': 'purple',
//             'chargeback': 'purple',
//             'active': 'purple',
//             'sold': 'purple',
//             'demo': 'purple',
//             'adjustment': 'purple',
//             'returned': 'purple',
//             'damaged': 'purple',
//             'lost': 'purple',
//             'in stock': 'purple',
//             'shipped': 'purple',
//             'pending': 'purple',
//             'completed': 'purple',
//             'cancelled': 'purple',
//             'refunded': 'purple',
//             'in progress': 'purple',
//             'waiting for parts': 'purple',
//             'sold (glitch)': 'purple',
//             'repaired': 'purple',
//             'overage': 'purple',
//             'audit': 'purple',
//             'verified': 'purple'
//         };

//         const normalizedStatus = status.toLowerCase().trim();
//         return statusColors[normalizedStatus] || 'gray';
//     }, []);

//     // FIXED: Enhanced status detection with better filtering
//     const isValidStatus = useCallback((status: string): boolean => {
//         if (!status || status.trim() === "") return false;

//         const cleanStatus = status.trim().toLowerCase();

//         // Skip cost values that appear in status column
//         if (/^\$?\d+\.?\d*\s*$/.test(cleanStatus)) {
//             return false;
//         }

//         // Skip numeric values
//         if (/^\d+\s*$/.test(cleanStatus)) {
//             return false;
//         }

//         // Skip common invalid status values
//         const invalidValues = ['unknown', 'n/a', 'null', 'undefined', '-', ''];
//         if (invalidValues.includes(cleanStatus)) {
//             return false;
//         }

//         // Valid status patterns
//         const validPatterns = [
//             'scanning', 'rma', 'resolved', 'chargeback', 'active', 'sold',
//             'demo', 'adjustment', 'returned', 'damaged', 'lost', 'in stock',
//             'shipped', 'pending', 'completed', 'cancelled', 'refunded',
//             'in progress', 'waiting for parts', 'repaired', 'overage',
//             'audit', 'verified'
//         ];

//         return validPatterns.some(pattern => cleanStatus.includes(pattern));
//     }, []);

//     // FIXED: Build status summary with proper filtering
//     const buildStatusSummary = useCallback((data: AuditItem[]): StatusSummary[] => {
//         const statusGroups: { [key: string]: StatusSummary } = {};
//         const statusField = detectedFields.status;
//         const costField = detectedFields.cost;

//         console.log("🔍 Building status summary...");
//         console.log(`Status field: ${statusField}`);
//         console.log(`Cost field: ${costField}`);
//         console.log("First few status values:", data.slice(0, 5).map(row => ({
//             status: row[statusField],
//             cost: row[costField]
//         })));

//         let validStatusCount = 0;
//         let invalidStatusCount = 0;

//         data.forEach((row, index) => {
//             const rawStatus = String(row[statusField] || "").trim();
//             const rawCost = row[costField];
//             const cost = parseCurrency(rawCost);
//             const devices = countNonEmptyIMEI(row);

//             // Skip empty status
//             if (!rawStatus || rawStatus === "" || rawStatus === "N/A") {
//                 invalidStatusCount++;
//                 return;
//             }

//             // Use enhanced status validation
//             if (!isValidStatus(rawStatus)) {
//                 invalidStatusCount++;
//                 return;
//             }

//             // Clean and normalize the status
//             const cleanStatus = rawStatus.trim().replace(/\s+/g, ' ');
//             if (!cleanStatus) {
//                 invalidStatusCount++;
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
//             validStatusCount++;
//         });

//         const result = Object.values(statusGroups).sort((a, b) => b.cost - a.cost);

//         // Debug logging
//         console.log("📊 STATUS SUMMARY DEBUG:");
//         console.log(`- Total rows processed: ${data.length}`);
//         console.log(`- Valid status rows: ${validStatusCount}`);
//         console.log(`- Invalid status rows: ${invalidStatusCount}`);
//         console.log(`- Unique status types: ${result.length}`);
//         console.log(`- Total audits in summary: ${result.reduce((sum, s) => sum + s.count, 0)}`);
//         console.log(`- Total devices in summary: ${result.reduce((sum, s) => sum + s.devices, 0)}`);
//         console.log(`- Total cost in summary: ${result.reduce((sum, s) => sum + s.cost, 0)}`);
//         console.log("Status groups found:", result.map(s => ({ status: s.status, count: s.count })));

//         return result;
//     }, [detectedFields, parseCurrency, countNonEmptyIMEI, getStatusColor, isValidStatus]);

//     // Enhanced aggregation with perfect counts
//     const aggregate = useCallback((data: AuditItem[], keyField: string, level: string = ""): AggregatedGroup[] => {
//         console.log(`🔍 AGGREGATING ${level}`);
//         console.log(`Total input rows: ${data.length}`);
//         console.log(`Key field: ${keyField}`);

//         const groups: { [key: string]: AggregatedGroup } = {};
//         let totalRowsProcessed = 0;
//         let totalRowsSkipped = 0;

//         data.forEach((row) => {
//             totalRowsProcessed++;

//             if (!row) {
//                 totalRowsSkipped++;
//                 return;
//             }

//             const keyRaw = row[keyField];
//             const key = String(keyRaw || "").trim();

//             if (!key || key === "Unknown" || key === "" || key === "N/A") {
//                 totalRowsSkipped++;
//                 return;
//             }

//             if (level === "regions") {
//                 const validRegions = ["Aleem Ghori Region", "Hasnain Mustaqeem Region"];
//                 const isValidRegion = validRegions.some(region =>
//                     region.toLowerCase() === key.toLowerCase()
//                 );
//                 if (!isValidRegion) {
//                     totalRowsSkipped++;
//                     return;
//                 }
//             }

//             if (!groups[key]) {
//                 groups[key] = {
//                     key: key,
//                     count: 0,
//                     devices: 0,
//                     cost: 0,
//                     rows: [],
//                 };
//             }

//             groups[key].count += 1;
//             groups[key].devices += countNonEmptyIMEI(row);

//             const costValue = row[detectedFields.cost] || getField(row, ["Cost", "COST", "cost"]);
//             const cost = parseCurrency(costValue);
//             groups[key].cost += cost;

//             groups[key].rows.push(row);
//         });

//         const result = Object.values(groups).sort((a, b) => b.cost - a.cost);

//         console.log(`📊 AGGREGATION SUMMARY for ${level}:`);
//         console.log(`   Total Rows: ${data.length}`);
//         console.log(`   Processed: ${totalRowsProcessed}`);
//         console.log(`   Skipped: ${totalRowsSkipped}`);
//         console.log(`   Groups: ${result.length}`);

//         // Log specific group details for debugging
//         result.forEach((group, index) => {
//             console.log(`   Group ${index + 1}: ${group.key} - Count: ${group.count}, Devices: ${group.devices}, Cost: ${group.cost}`);
//         });

//         return result;
//     }, [countNonEmptyIMEI, parseCurrency, detectedFields, getField]);

//     // Summary cards calculation
//     const summaryCards = useMemo(() => {
//         if (filteredData.length === 0) {
//             return [
//                 { label: "Total Audits", value: 0, icon: "📋" },
//                 { label: "Total Devices", value: 0, icon: "📱" },
//                 { label: "Total Value", value: formatCurrency(0), icon: "💰" },
//                 { label: "Status Types", value: 0, icon: "🏷️" },
//             ];
//         }

//         const totalAudits = filteredData.length;
//         const totalDevices = filteredData.reduce((s, r) => s + countNonEmptyIMEI(r), 0);
//         const totalCost = filteredData.reduce(
//             (s, r) => s + parseCurrency(r[detectedFields.cost] || getField(r, ["Cost", "COST", "cost"])),
//             0
//         );

//         const statusSummary = buildStatusSummary(filteredData);
//         const uniqueStatuses = statusSummary.length;

//         console.log("🎯 SUMMARY CARDS CALCULATION:");
//         console.log(`- Total Audits: ${totalAudits}`);
//         console.log(`- Total Devices: ${totalDevices}`);
//         console.log(`- Total Cost: ${totalCost}`);
//         console.log(`- Unique Statuses: ${uniqueStatuses}`);

//         const cards = [
//             { label: "Total Audits", value: totalAudits, icon: "📋" },
//             { label: "Total Devices", value: totalDevices, icon: "📱" },
//             { label: "Total Value", value: formatCurrency(totalCost), icon: "💰" },
//             { label: "Status Types", value: uniqueStatuses, icon: "🏷️" },
//         ];

//         return cards;
//     }, [filteredData, detectedFields, parseCurrency, getField, countNonEmptyIMEI, buildStatusSummary, formatCurrency]);

//     // Initialize data from multiple sheets
//     const initData = async () => {
//         setIsLoadingData(true);
//         const data = await fetchAllData();

//         if (data && data.length > 0) {
//             console.log("📥 Initial data loaded:", data.length, "rows");
//             console.log("Sample row:", data[0]);

//             setRawData(data);
//             const filtered = applyFilters(data);
//             setFilteredData(filtered);
//             setCurrentData(filtered);

//             detectAllFields(filtered);

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
//             console.error("❌ No data loaded");
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
//         const regionData = region.rows;
//         setCurrentData(regionData);
//         setCurrentView("market");
//         setSelectedRegion(region.key);
//         setHistoryStack([
//             { level: "Regions" },
//             { level: "Market", selected: region.key },
//         ]);
//     };

//     const handleMarketClick = (market: AggregatedGroup) => {
//         const marketData = market.rows;
//         setCurrentData(marketData);
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

//     const renderStatusSummary = useCallback((data: AuditItem[]) => {
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
//     }, [selectedMarket, buildStatusSummary, formatCurrency, detectedFields]);

//     const renderTable = useCallback((
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
//     }, [detectedFields, renderStatusSummary, aggregate, formatCurrency]);

//     const renderDetailedTable = useCallback((data: AuditItem[]) => {
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
//     }, [selectedStatus, getField, formatCurrency, parseCurrency, detectedFields, getStatusColor]);

//     const renderSummaryCards = () => (
//         <section className="dashboard-grid">
//             {summaryCards.map((card, index) => (
//                 <div key={index} className="dashboard-card card-purple">
//                     <div className="card-icon">{card.icon}</div>
//                     <div className="card-content">
//                         <h3 className="card-title">{card.label}</h3>
//                         <p className="card-description">{card.value}</p>
//                     </div>
//                 </div>
//             ))}
//         </section>
//     );

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
import { useEffect, useState, useCallback, useMemo } from "react";
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

    // New state for search and pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(100); // 100 lines per page

    // Sheet URLs for both regions
    const sheetUrls = [
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhKMtyCA2gB3lHwcP9hGLhDgmCUUqXVNmthUsFggsgaFeFuOYOPzjctQmkHMZ4ZA/pub?gid=259016646&single=true&output=csv",
        "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhKMtyCA2gB3lHwcP9hGLhDgmCUUqXVNmthUsFggsgaFeFuOYOPzjctQmkHMZ4ZA/pub?gid=1286573647&single=true&output=csv"
    ];

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






    const getField = useCallback((obj: AuditItem, candidates: string[]): string => {
        if (!obj) return "Unknown";

        for (const k of candidates) {
            if (k in obj && obj[k] !== "" && obj[k] != null) return String(obj[k]);
            const matched = Object.keys(obj).find(
                (x) => x.toLowerCase() === k.toLowerCase()
            );
            if (matched && obj[matched] !== "" && obj[matched] != null)
                return String(obj[matched]);
        }
        return "Unknown";
    }, []);

    const searchData = useCallback((data: AuditItem[], searchTerm: string): AuditItem[] => {
        if (!searchTerm.trim()) {
            return data;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        console.log(`🔍 Searching audit data for: "${searchLower}" in ${data.length} records`);

        const results = data.filter((row) => {
            // Search across key audit fields
            const searchableFields = [
                getField(row, ["Market", "Market Name", "MARKET"]),
                getField(row, ["TechID", "Tech ID", "TECHID"]),
                getField(row, ["Store", "STORE", "Store Name"]),
                getField(row, ["FullIMEI#", "IMEI", "imei", "CUSTOMER IMEI"]),
                getField(row, ["SKUDescription", "SKU", "sku"]),
                getField(row, ["Status", "STATUS", "status"]),
                getField(row, ["FinalComments", "Comments", "COMMENTS"]),
                getField(row, ["Regions", "Region", "REGIONS"])
            ].filter((field) => field && field !== "" && field !== "Unknown");

            return searchableFields.some((field) =>
                String(field).toLowerCase().includes(searchLower)
            );
        });

        console.log(`✅ Found ${results.length} audit results for: "${searchLower}"`);
        return results;
    }, [getField]); // Make sure getField is in the dependency array

    // Apply search filter to data
    const searchedData = useMemo(() => {
        if (searchTerm.trim()) {
            return searchData(filteredData, searchTerm);
        }
        return filteredData;
    }, [filteredData, searchTerm, searchData]);

    // Apply pagination
    const totalPages = Math.ceil(searchedData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return searchedData.slice(startIndex, startIndex + itemsPerPage);
    }, [searchedData, currentPage, itemsPerPage]);

    // Real-time search effect - navigate to detailed view when searching
    useEffect(() => {
        if (searchTerm.trim()) {
            const searchResults = searchData(filteredData, searchTerm);

            // Always navigate to detailed view with search results
            setCurrentData(searchResults);
            setCurrentView("detailed");
            setSelectedStatus(`Search: "${searchTerm}"`);
            setHistoryStack([
                { level: "Regions" },
                { level: "Search Results", selected: searchTerm },
            ]);
            setCurrentPage(1);

        } else if (searchTerm === "") {
            // Only reset when search is explicitly cleared
            setCurrentData(filteredData);
            setCurrentView("regions");
            setSelectedStatus("");
            setHistoryStack([{ level: "Regions" }]);
            setCurrentPage(1);
        }
    }, [searchTerm, filteredData, searchData]);



    // FIXED: Enhanced CSV parsing to handle line breaks and scientific notation
    const parseCSV = useCallback((text: string): AuditItem[] => {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        if (lines.length < 2) return [];

        // Get headers from first line
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ""));

        const data: AuditItem[] = [];
        let currentRow: string[] = [];
        let inQuotes = false;
        let currentField = '';

        // Process all lines except header
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];

            for (let j = 0; j < line.length; j++) {
                const char = line[j];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    currentRow.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }

            // If we're still in quotes, continue to next line
            if (!inQuotes) {
                currentRow.push(currentField.trim());

                // Only process if we have the right number of columns
                if (currentRow.length === headers.length) {
                    const obj: AuditItem = {};
                    headers.forEach((header, index) => {
                        let value = currentRow[index] || "";

                        // Clean up the value
                        value = value.replace(/"/g, "").trim();

                        // Handle scientific notation in IMEI
                        if (header.toLowerCase().includes('imei') || header.toLowerCase().includes('fullimei')) {
                            if (value.includes('E+') || value.includes('e+')) {
                                try {
                                    // Convert scientific notation to full number
                                    const num = Number(value);
                                    if (!isNaN(num)) {
                                        value = BigInt(num).toString();
                                    }
                                } catch (e) {
                                    console.warn('Could not convert IMEI:', value);
                                }
                            }
                        }

                        obj[header] = value;
                    });

                    // Only add row if it has valid data
                    if (Object.values(obj).some(val => val !== "" && val !== undefined)) {
                        data.push(obj);
                    }
                } else {
                    console.warn('Skipping row with incorrect column count:', currentRow.length, 'expected:', headers.length);
                }

                currentRow = [];
                currentField = '';
            } else {
                // Continue field to next line
                currentField += '\n';
            }
        }

        console.log(`Parsed ${data.length} rows from CSV`);
        return data;
    }, []);

    // Enhanced currency parsing
    const parseCurrency = useCallback((v: any): number => {
        if (v == null || v === "" || v === undefined) return 0;

        const str = String(v).trim();

        if (str === "" || str === "-" || str === "N/A" || str === "null" || str === " ") {
            return 0;
        }

        const cleaned = str
            .replace(/\$/g, '')
            .replace(/,/g, '')
            .replace(/\s+/g, '')
            .replace(/[^\d.-]/g, "");

        const parts = cleaned.split('.');
        let finalNumber = parts[0];
        if (parts.length > 1) {
            finalNumber += '.' + parts.slice(1).join('');
        }

        const n = parseFloat(finalNumber);
        return isNaN(n) ? 0 : n;
    }, []);

    const parseDateMDY = useCallback((s: string): Date | null => {
        if (!s || s.trim() === "") return null;
        const str = String(s).trim();

        // Handle MM/DD/YYYY format
        const mdyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mdyMatch) {
            const month = parseInt(mdyMatch[1]) - 1;
            const day = parseInt(mdyMatch[2]);
            const year = parseInt(mdyMatch[3]);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    }, []);

    const formatCurrency = useCallback((v: number): string => {
        return "$" + Number(v || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }, []);

    // const getField = useCallback((obj: AuditItem, candidates: string[]): string => {
    //     if (!obj) return "Unknown";

    //     for (const k of candidates) {
    //         if (k in obj && obj[k] !== "" && obj[k] != null) return String(obj[k]);
    //         const matched = Object.keys(obj).find(
    //             (x) => x.toLowerCase() === k.toLowerCase()
    //         );
    //         if (matched && obj[matched] !== "" && obj[matched] != null)
    //             return String(obj[matched]);
    //     }
    //     return "Unknown";
    // }, []);

    // Enhanced IMEI counting with scientific notation handling
    const countNonEmptyIMEI = useCallback((row: AuditItem): number => {
        const imeiValue = getField(row, [
            "FullIMEI#",
            "IMEI",
            "imei",
            "CUSTOMER IMEI",
        ]);

        if (!imeiValue) return 0;

        let cleanedIMEI = String(imeiValue).trim();

        // Handle scientific notation
        if (cleanedIMEI.includes('E+') || cleanedIMEI.includes('e+')) {
            try {
                const num = Number(cleanedIMEI);
                if (!isNaN(num)) {
                    cleanedIMEI = BigInt(num).toString();
                }
            } catch (e) {
                console.warn('Could not convert IMEI from scientific notation:', cleanedIMEI);
            }
        }

        // More inclusive IMEI validation
        if (!cleanedIMEI ||
            cleanedIMEI === "Unknown" ||
            cleanedIMEI === "0" ||
            cleanedIMEI === "N/A" ||
            cleanedIMEI === "null" ||
            cleanedIMEI === "NULL" ||
            cleanedIMEI.length < 5
        ) {
            return 0;
        }

        return 1;
    }, [getField]);

    // Enhanced field detection
    const detectKey = useCallback((candidates: string[], data: AuditItem[]): string => {
        if (!data || data.length === 0) return candidates[0];

        const allKeys = Object.keys(data[0] || {});

        for (const candidate of candidates) {
            if (allKeys.includes(candidate)) {
                return candidate;
            }
        }

        for (const candidate of candidates) {
            const matchedKey = allKeys.find((key) =>
                key.toLowerCase() === candidate.toLowerCase()
            );
            if (matchedKey) {
                return matchedKey;
            }
        }

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
    }, []);

    const detectAllFields = useCallback((data: AuditItem[]) => {
        const fields = {
            status: detectKey(["Status", "STATUS", "status"], data),
            cost: detectKey(["Cost", "COST", "cost", " Total Cost"], data),
            region: detectKey(["Regions", "Region", "REGIONS"], data),
            market: detectKey(["Market", "Market Name", "MARKET"], data),
            date: detectKey(["SerialDate", "Date", "ProcessedDate"], data),
            store: detectKey(["Store", "STORE", "Store Name"], data),
            techId: detectKey(["TechID", "Tech ID", "TECHID"], data),
            sku: detectKey(["SKUDescription", "SKU", "sku"], data),
            imei: detectKey(["FullIMEI#", "IMEI", "imei"], data),
            comments: detectKey(["FinalComments", "Comments", "COMMENTS"], data)
        };

        console.log("Detected fields:", fields);
        setDetectedFields(fields);
        return fields;
    }, [detectKey]);

    const fetchCSV = useCallback(async (url: string): Promise<AuditItem[]> => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("fetch error " + res.status);
            const txt = await res.text();

            console.log(`Raw CSV text length: ${txt.length}`);
            console.log("First 500 chars of CSV:", txt.substring(0, 500));

            const data = parseCSV(txt);
            console.log(`Parsed ${data.length} rows from ${url}`);

            if (data.length > 0) {
                console.log("Sample parsed row:", data[0]);
                console.log("All columns in sample:", Object.keys(data[0]));
            }

            return data;
        } catch (err) {
            console.error("Fetching CSV failed:", err);
            return [];
        }
    }, [parseCSV]);

    // Fetch data from all sheets and combine
    const fetchAllData = useCallback(async (): Promise<AuditItem[]> => {
        try {
            console.log("Fetching data from both regions...");

            const fetchPromises = sheetUrls.map(url => fetchCSV(url));
            const results = await Promise.all(fetchPromises);

            const allData = results.flat();
            console.log(`Combined data: ${allData.length} total rows from ${results.length} sheets`);

            return allData;
        } catch (err) {
            console.error("Error fetching data from multiple sheets:", err);
            return [];
        }
    }, [fetchCSV]);

    const applyFilters = useCallback((data: AuditItem[]): AuditItem[] => {
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        if (!from && !to) return data;

        return data.filter((row) => {
            const raw = getField(row, ["SerialDate", "Date", "ProcessedDate"]);
            const d = parseDateMDY(raw);
            if (!d) return false;
            if (from && d < from) return false;
            if (to) {
                const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59);
                if (d > toEnd) return false;
            }
            return true;
        });
    }, [fromDate, toDate, getField, parseDateMDY]);

    const getStatusColor = useCallback((status: string): string => {
        const statusColors: { [key: string]: string } = {
            'scanning': 'purple',
            'rma': 'purple',
            'resolved': 'purple',
            'chargeback': 'purple',
            'active': 'purple',
            'sold': 'purple',
            'demo': 'purple',
            'adjustment': 'purple',
            'returned': 'purple',
            'damaged': 'purple',
            'lost': 'purple',
            'in stock': 'purple',
            'shipped': 'purple',
            'pending': 'purple',
            'completed': 'purple',
            'cancelled': 'purple',
            'refunded': 'purple',
            'in progress': 'purple',
            'waiting for parts': 'purple',
            'sold (glitch)': 'purple',
            'repaired': 'purple',
            'overage': 'purple',
            'audit': 'purple',
            'verified': 'purple'
        };

        const normalizedStatus = status.toLowerCase().trim();
        return statusColors[normalizedStatus] || 'gray';
    }, []);

    // FIXED: Enhanced status detection with better filtering
    const isValidStatus = useCallback((status: string): boolean => {
        if (!status || status.trim() === "") return false;

        const cleanStatus = status.trim().toLowerCase();

        // Skip cost values that appear in status column
        if (/^\$?\d+\.?\d*\s*$/.test(cleanStatus)) {
            return false;
        }

        // Skip numeric values
        if (/^\d+\s*$/.test(cleanStatus)) {
            return false;
        }

        // Skip common invalid status values
        const invalidValues = ['unknown', 'n/a', 'null', 'undefined', '-', ''];
        if (invalidValues.includes(cleanStatus)) {
            return false;
        }

        // Valid status patterns
        const validPatterns = [
            'scanning', 'rma', 'resolved', 'chargeback', 'active', 'sold',
            'demo', 'adjustment', 'returned', 'damaged', 'lost', 'in stock',
            'shipped', 'pending', 'completed', 'cancelled', 'refunded',
            'in progress', 'waiting for parts', 'repaired', 'overage',
            'audit', 'verified'
        ];

        return validPatterns.some(pattern => cleanStatus.includes(pattern));
    }, []);

    // FIXED: Build status summary with proper filtering
    const buildStatusSummary = useCallback((data: AuditItem[]): StatusSummary[] => {
        const statusGroups: { [key: string]: StatusSummary } = {};
        const statusField = detectedFields.status;
        const costField = detectedFields.cost;

        console.log("🔍 Building status summary...");
        console.log(`Status field: ${statusField}`);
        console.log(`Cost field: ${costField}`);
        console.log("First few status values:", data.slice(0, 5).map(row => ({
            status: row[statusField],
            cost: row[costField]
        })));

        let validStatusCount = 0;
        let invalidStatusCount = 0;

        data.forEach((row, index) => {
            const rawStatus = String(row[statusField] || "").trim();
            const rawCost = row[costField];
            const cost = parseCurrency(rawCost);
            const devices = countNonEmptyIMEI(row);

            // Skip empty status
            if (!rawStatus || rawStatus === "" || rawStatus === "N/A") {
                invalidStatusCount++;
                return;
            }

            // Use enhanced status validation
            if (!isValidStatus(rawStatus)) {
                invalidStatusCount++;
                return;
            }

            // Clean and normalize the status
            const cleanStatus = rawStatus.trim().replace(/\s+/g, ' ');
            if (!cleanStatus) {
                invalidStatusCount++;
                return;
            }

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
            validStatusCount++;
        });

        const result = Object.values(statusGroups).sort((a, b) => b.cost - a.cost);

        // Debug logging
        console.log("📊 STATUS SUMMARY DEBUG:");
        console.log(`- Total rows processed: ${data.length}`);
        console.log(`- Valid status rows: ${validStatusCount}`);
        console.log(`- Invalid status rows: ${invalidStatusCount}`);
        console.log(`- Unique status types: ${result.length}`);
        console.log(`- Total audits in summary: ${result.reduce((sum, s) => sum + s.count, 0)}`);
        console.log(`- Total devices in summary: ${result.reduce((sum, s) => sum + s.devices, 0)}`);
        console.log(`- Total cost in summary: ${result.reduce((sum, s) => sum + s.cost, 0)}`);
        console.log("Status groups found:", result.map(s => ({ status: s.status, count: s.count })));

        return result;
    }, [detectedFields, parseCurrency, countNonEmptyIMEI, getStatusColor, isValidStatus]);

    // Enhanced aggregation with perfect counts
    const aggregate = useCallback((data: AuditItem[], keyField: string, level: string = ""): AggregatedGroup[] => {
        console.log(`🔍 AGGREGATING ${level}`);
        console.log(`Total input rows: ${data.length}`);
        console.log(`Key field: ${keyField}`);

        const groups: { [key: string]: AggregatedGroup } = {};
        let totalRowsProcessed = 0;
        let totalRowsSkipped = 0;

        data.forEach((row) => {
            totalRowsProcessed++;

            if (!row) {
                totalRowsSkipped++;
                return;
            }

            const keyRaw = row[keyField];
            const key = String(keyRaw || "").trim();

            if (!key || key === "Unknown" || key === "" || key === "N/A") {
                totalRowsSkipped++;
                return;
            }

            if (level === "regions") {
                const validRegions = ["Aleem Ghori Region", "Hasnain Mustaqeem Region"];
                const isValidRegion = validRegions.some(region =>
                    region.toLowerCase() === key.toLowerCase()
                );
                if (!isValidRegion) {
                    totalRowsSkipped++;
                    return;
                }
            }

            if (!groups[key]) {
                groups[key] = {
                    key: key,
                    count: 0,
                    devices: 0,
                    cost: 0,
                    rows: [],
                };
            }

            groups[key].count += 1;
            groups[key].devices += countNonEmptyIMEI(row);

            const costValue = row[detectedFields.cost] || getField(row, ["Cost", "COST", "cost"]);
            const cost = parseCurrency(costValue);
            groups[key].cost += cost;

            groups[key].rows.push(row);
        });

        const result = Object.values(groups).sort((a, b) => b.cost - a.cost);

        console.log(`📊 AGGREGATION SUMMARY for ${level}:`);
        console.log(`   Total Rows: ${data.length}`);
        console.log(`   Processed: ${totalRowsProcessed}`);
        console.log(`   Skipped: ${totalRowsSkipped}`);
        console.log(`   Groups: ${result.length}`);

        // Log specific group details for debugging
        result.forEach((group, index) => {
            console.log(`   Group ${index + 1}: ${group.key} - Count: ${group.count}, Devices: ${group.devices}, Cost: ${group.cost}`);
        });

        return result;
    }, [countNonEmptyIMEI, parseCurrency, detectedFields, getField]);

    // Summary cards calculation
    const summaryCards = useMemo(() => {
        const dataToUse = searchTerm.trim() ? searchedData : filteredData;

        if (dataToUse.length === 0) {
            return [
                { label: "Total Audits", value: 0, icon: "📋" },
                { label: "Total Devices", value: 0, icon: "📱" },
                { label: "Total Value", value: formatCurrency(0), icon: "💰" },
                { label: "Status Types", value: 0, icon: "🏷️" },
            ];
        }

        const totalAudits = dataToUse.length;
        const totalDevices = dataToUse.reduce((s, r) => s + countNonEmptyIMEI(r), 0);
        const totalCost = dataToUse.reduce(
            (s, r) => s + parseCurrency(r[detectedFields.cost] || getField(r, ["Cost", "COST", "cost"])),
            0
        );

        const statusSummary = buildStatusSummary(dataToUse);
        const uniqueStatuses = statusSummary.length;

        console.log("🎯 SUMMARY CARDS CALCULATION:");
        console.log(`- Total Audits: ${totalAudits}`);
        console.log(`- Total Devices: ${totalDevices}`);
        console.log(`- Total Cost: ${totalCost}`);
        console.log(`- Unique Statuses: ${uniqueStatuses}`);

        const cards = [
            { label: "Total Audits", value: totalAudits, icon: "📋" },
            { label: "Total Devices", value: totalDevices, icon: "📱" },
            { label: "Total Value", value: formatCurrency(totalCost), icon: "💰" },
            { label: "Status Types", value: uniqueStatuses, icon: "🏷️" },
        ];

        return cards;
    }, [filteredData, searchedData, searchTerm, detectedFields, parseCurrency, getField, countNonEmptyIMEI, buildStatusSummary, formatCurrency]);

    // Initialize data from multiple sheets
    const initData = async () => {
        setIsLoadingData(true);
        const data = await fetchAllData();

        if (data && data.length > 0) {
            console.log("📥 Initial data loaded:", data.length, "rows");
            console.log("Sample row:", data[0]);

            setRawData(data);
            const filtered = applyFilters(data);
            setFilteredData(filtered);
            setCurrentData(filtered);

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
            console.error("❌ No data loaded");
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
        setSearchTerm("");
        setCurrentPage(1);
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
        setSearchTerm("");
        setCurrentPage(1);
    };

    const handleExportCSV = () => {
        const dataToExport = searchTerm.trim() ? searchedData : filteredData;
        if (!dataToExport.length) return;

        const keys = Object.keys(dataToExport[0]);
        const csv = [keys.join(",")]
            .concat(
                dataToExport.map((r) =>
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
        const regionData = region.rows;
        setCurrentData(regionData);
        setCurrentView("market");
        setSelectedRegion(region.key);
        setHistoryStack([
            { level: "Regions" },
            { level: "Market", selected: region.key },
        ]);
        setSearchTerm("");
        setCurrentPage(1);
    };

    const handleMarketClick = (market: AggregatedGroup) => {
        const marketData = market.rows;
        setCurrentData(marketData);
        setCurrentView("status");
        setSelectedMarket(market.key);
        setHistoryStack([
            { level: "Regions" },
            { level: "Market", selected: selectedRegion },
            { level: "Status", selected: market.key },
        ]);
        setSearchTerm("");
        setCurrentPage(1);
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
        setSearchTerm("");
        setCurrentPage(1);
    };

    const handleBackClick = () => {
        if (historyStack.length <= 1) {
            setCurrentData(filteredData);
            setCurrentView("regions");
            setHistoryStack([{ level: "Regions" }]);
            setSelectedRegion("");
            setSelectedMarket("");
            setSelectedStatus("");
            setSearchTerm("");
            setCurrentPage(1);
        } else {
            const newStack = historyStack.slice(0, -1);
            setHistoryStack(newStack);

            const previousLevel = newStack[newStack.length - 1];

            if (previousLevel.level === "Regions") {
                setCurrentData(filteredData);
                setCurrentView("regions");
                setSelectedRegion("");
                setSearchTerm("");
                setCurrentPage(1);
            } else if (previousLevel.level === "Market") {
                const regionKey = detectedFields.region;
                const regionData = filteredData.filter(
                    (row) => getField(row, [regionKey]) === previousLevel.selected
                );
                setCurrentData(regionData);
                setCurrentView("market");
                setSelectedMarket("");
                setSearchTerm("");
                setCurrentPage(1);
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
                setSearchTerm("");
                setCurrentPage(1);
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

    const renderStatusSummary = useCallback((data: AuditItem[]) => {
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
    }, [selectedMarket, buildStatusSummary, formatCurrency, detectedFields]);

    const renderTable = useCallback((
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
                        {searchTerm && ` • Filtered by: "${searchTerm}"`}
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
    }, [detectedFields, renderStatusSummary, aggregate, formatCurrency, searchTerm]);

    const renderDetailedTable = useCallback((data: AuditItem[]) => {
        // Use paginatedData for the table, but show total count from searchedData
        const displayData = searchTerm.trim() ? paginatedData : data;
        const totalRecords = searchTerm.trim() ? searchedData.length : data.length;

        return (
            <div className="audit-table-block">
                <div className="audit-table-header">
                    <h2>Detailed Audit - {selectedStatus}</h2>
                    <div className="audit-meta">
                        {totalRecords} audit records
                        {searchTerm && ` matching "${searchTerm}"`}
                        {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                    </div>
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
                            {displayData.map((row, index) => {
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

                    {/* No data message */}
                    {displayData.length === 0 && (
                        <div className="no-data">
                            {searchTerm
                                ? `No audit records found matching "${searchTerm}"`
                                : "No audit records found matching your criteria."
                            }
                        </div>
                    )}
                </div>

                {/* Pagination */}
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
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="pagination-btn"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        );
    }, [selectedStatus, getField, formatCurrency, parseCurrency, detectedFields, getStatusColor, searchTerm, paginatedData, searchedData, totalPages, currentPage]);

    const renderSummaryCards = () => (
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
    );

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
                    {/* Controls Section with Search */}
                    <div className="audit-controls-section">
                        <div className="audit-controls-grid">


                            {/* Date Filters and Buttons on Right */}
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
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search by Market, Tech ID, Store, IMEI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="clear-search"
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}

                    </div>

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