"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { useRouter } from "next/navigation";
import "./ias-styles.css";

// SIMPLIFIED IASReport interface - ignoring extra columns
interface IASReport {
    Region: string;
    Market: string;
    "Sub Market": string;
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
}

interface AggregatedGroup {
    key: string;
    count: number;
    instock: number;
    onTransfer: number;
    inTransit: number;
    backdated: number;
    total: number;
    Cost: number;
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
    const [selectedDetails, setSelectedDetails] = useState<IASReport | null>(null);

    const [currentView, setCurrentView] = useState<"regions" | "markets" | "stores" | "detailed">("regions");
    const [currentData, setCurrentData] = useState<IASReport[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>("");
    const [selectedMarket, setSelectedMarket] = useState<string>("");
    const [selectedStore, setSelectedStore] = useState<string>("");
    const [historyStack, setHistoryStack] = useState<{ level: string; selected?: string }[]>([{ level: "Regions" }]);

    const GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRsue2PGtUQqbSxva6tMyCMWCiwT6YJs8Tge21UTfIX7xOX-BrGh8zTpSnijEp0A/pub?gid=1856448190&single=true&output=csv";

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

        if (str === "" || str === "-" || str === "N/A" || str === "null" || str === " " || str === "0" || str === "#DIV/0!") {
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
        if (str === "" || str === "-" || str === "N/A" || str === "null" || str === " " || str === "#DIV/0!") {
            return 0;
        }
        const n = parseInt(str);
        return isNaN(n) ? 0 : n;
    }, []);

    // Enhanced cost calculation
    const calculateTotalCost = useCallback((report: IASReport): number => {
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
    }, [parseCurrency, parseIntSafe]);

    // SIMPLIFIED CSV parsing based on your working audit code
    const parseCSV = useCallback((csvText: string): IASReport[] => {
        try {
            console.log("=== SIMPLE IAS CSV PARSING ===");

            const cleanText = csvText.replace(/\r\n/g, "\n").replace(/^\uFEFF/, "");
            const lines = cleanText.split('\n').filter(line => line.trim().length > 0);

            if (lines.length < 2) {
                console.warn("CSV has insufficient lines");
                return [];
            }

            // Get headers from first line
            const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ""));

            console.log("Headers found:", headers);

            const data: IASReport[] = [];
            let currentRow: string[] = [];
            let inQuotes = false;
            let currentField = '';

            // Process all lines except header - SIMPLE approach like your audit code
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
                        const obj: any = {};
                        headers.forEach((header, index) => {
                            // DIRECT MAPPING - no transformations like your audit code
                            obj[header] = currentRow[index] || "";
                        });

                        // Only add row if it has valid store data
                        if (obj["Store Name"] && obj["Store Name"] !== "" && obj.Market && obj.Market !== "") {
                            data.push(obj as IASReport);
                        }
                    }

                    currentRow = [];
                    currentField = '';
                } else {
                    // Continue field to next line
                    currentField += '\n';
                }
            }

            console.log(`Simple IAS parsing complete: ${data.length} valid rows`);

            // DEBUG: Check Store ID integrity
            if (data.length > 0) {
                console.log("First 5 Store IDs from parsed data:");
                data.slice(0, 5).forEach((row, index) => {
                    console.log(`Row ${index + 1}:`, {
                        storeName: row["Store Name"],
                        id: row.ID,
                        market: row.Market
                    });
                });
            }

            return data;
        } catch (error) {
            const parseError = error instanceof Error ? error : new Error(String(error));
            console.error("Error in simple IAS CSV parsing:", parseError);
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
                throw new Error(`Failed to fetch data from Google Sheets: ${response.status} ${response.statusText}`);
            }

            const csvText = await response.text();

            if (!csvText || csvText.trim().length === 0) {
                throw new Error("Empty response from server");
            }

            console.log("Raw CSV text length:", csvText.length);

            const parsedData = parseCSV(csvText);

            if (parsedData.length === 0) {
                throw new Error("No valid data could be parsed from the CSV. Check console for details.");
            }

            console.log(`Successfully parsed ${parsedData.length} rows`);

            setReports(parsedData);
            setCurrentData(parsedData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load data";
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
                if (market && (market.includes("DALLAS") || market.includes("HOUSTON") || market.includes("TEXAS"))) {
                    regions["Aleem Ghori Region"].push(report);
                } else {
                    regions["Hasnain Mustaqeem Region"].push(report);
                }
            }
        });

        return regions;
    };

    const getUniqueStoreCount = (data: IASReport[]): number => {
        const uniqueStores = new Set(data.map((report) => report["Store Name"]).filter((name) => name && name !== ""));
        return uniqueStores.size;
    };




    // // Enhanced search function for better results
    // const searchData = useCallback((data: IASReport[], searchTerm: string): IASReport[] => {
    //     if (!searchTerm.trim()) {
    //         return data;
    //     }

    //     const searchLower = searchTerm.toLowerCase().trim();
    //     console.log(`🔍 Searching for: "${searchLower}" in ${data.length} records`);

    //     return data.filter((report) => {
    //         // Search across all relevant fields
    //         return (
    //             report.Market?.toLowerCase().includes(searchLower) ||
    //             report.ID?.toLowerCase().includes(searchLower) ||
    //             report.SKU?.toLowerCase().includes(searchLower) ||
    //             report.Product?.toLowerCase().includes(searchLower) ||
    //             report["Store Name"]?.toLowerCase().includes(searchLower) ||
    //             report.Model?.toLowerCase().includes(searchLower) ||
    //             report.Status?.toLowerCase().includes(searchLower) ||
    //             report["Sub Market"]?.toLowerCase().includes(searchLower) ||
    //             report.Region?.toLowerCase().includes(searchLower) ||
    //             report["Store Address"]?.toLowerCase().includes(searchLower)
    //         );
    //     });
    // }, []);
    // Enhanced search function for comprehensive searching
    const searchData = useCallback((data: IASReport[], searchTerm: string): IASReport[] => {
        if (!searchTerm.trim()) {
            return data;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        console.log(`🔍 Searching for: "${searchLower}" in ${data.length} records`);

        const results = data.filter((report) => {
            // Search across ALL relevant fields
            const searchableFields = [
                report.Market,
                report.ID,
                report.SKU,
                report.Product,
                report["Store Name"],
                report.Model,
                report.Status,
                report["Sub Market"],
                report.Region,
                report["Store Address"],
                report.INSTOCK,
                report["ON TRANSFER"],
                report["IN Transit"],
                report.BACKDATED,
                report.Cost,
                report["TOTAL COST"],
                report["Net Worth"],
                report.ALLOCATION,
                report["New Activation"],
                report.SWITCHER,
                report.UPGRADE,
                report["%"],
                report.Friday,
                report.Monday,
                report.GROUND,
                report.TOTAL,
                report.QUOTA,
                report["2days"],
                report.LWS,
                report.L2WS,
                report.L3WS,
                report.L4WS,
                report.L5WS,
                report["3W ACT"],
                report["3W UPG"],
                report["SUG QTY"],
                report["OVERNIGHT QTY"],
                report["2nd DAY"],
                report["GROUND QTY"],
                report["Total ACC Sale"],
                report.PPD,
                report["ACC Per BOX"],
                report["#"]
            ].filter((field) => field && field !== "" && field !== undefined);

            return searchableFields.some((field) =>
                String(field).toLowerCase().includes(searchLower)
            );
        });

        console.log(`✅ Found ${results.length} results for: "${searchLower}"`);

        // Debug: Show sample of what was found
        if (results.length > 0) {
            console.log("Sample matching records:", results.slice(0, 3).map(r => ({
                store: r["Store Name"],
                id: r.ID,
                market: r.Market,
                sku: r.SKU,
                product: r.Product
            })));
        }

        return results;
    }, []);



    // Enhanced aggregation with all required sums
    const aggregate = (data: IASReport[], level: string): AggregatedGroup[] => {
        const groups: { [key: string]: AggregatedGroup } = {};

        if (level === "regions") {
            const regions = getRegions(data);
            Object.entries(regions).forEach(([regionName, regionData]) => {
                const totalInventory = regionData.reduce((sum, row) => sum + parseIntSafe(row.INSTOCK), 0);
                const totalOnTransfer = regionData.reduce((sum, row) => sum + parseIntSafe(row["ON TRANSFER"]), 0);
                const totalInTransit = regionData.reduce((sum, row) => sum + parseIntSafe(row["IN Transit"]), 0);
                const totalBackdated = regionData.reduce((sum, row) => sum + parseIntSafe(row.BACKDATED), 0);
                const totalCost = regionData.reduce((sum, row) => sum + calculateTotalCost(row), 0);
                const storeCount = getUniqueStoreCount(regionData);

                groups[regionName] = {
                    key: regionName,
                    count: storeCount,
                    instock: totalInventory,
                    onTransfer: totalOnTransfer,
                    inTransit: totalInTransit,
                    backdated: totalBackdated,
                    total: totalInventory,
                    Cost: totalCost,
                    rows: regionData,
                };
            });
        } else if (level === "markets") {
            const markets = Array.from(new Set(data.map((report) => report.Market))).filter((m) => m && m !== "Unknown");

            markets.forEach((market) => {
                const marketData = data.filter((report) => report.Market === market);
                const totalInventory = marketData.reduce((sum, row) => sum + parseIntSafe(row.INSTOCK), 0);
                const totalOnTransfer = marketData.reduce((sum, row) => sum + parseIntSafe(row["ON TRANSFER"]), 0);
                const totalInTransit = marketData.reduce((sum, row) => sum + parseIntSafe(row["IN Transit"]), 0);
                const totalBackdated = marketData.reduce((sum, row) => sum + parseIntSafe(row.BACKDATED), 0);
                const totalCost = marketData.reduce((sum, row) => sum + calculateTotalCost(row), 0);
                const storeCount = getUniqueStoreCount(marketData);

                groups[market] = {
                    key: market,
                    count: storeCount,
                    instock: totalInventory,
                    onTransfer: totalOnTransfer,
                    inTransit: totalInTransit,
                    backdated: totalBackdated,
                    total: totalInventory,
                    Cost: totalCost,
                    rows: marketData,
                };
            });
        } else if (level === "stores") {
            const stores = Array.from(new Set(data.map((report) => report["Store Name"]))).filter((s) => s && s !== "Unknown");

            stores.forEach((store) => {
                const storeData = data.filter((report) => report["Store Name"] === store);
                const totalInventory = storeData.reduce((sum, row) => sum + parseIntSafe(row.INSTOCK), 0);
                const totalOnTransfer = storeData.reduce((sum, row) => sum + parseIntSafe(row["ON TRANSFER"]), 0);
                const totalInTransit = storeData.reduce((sum, row) => sum + parseIntSafe(row["IN Transit"]), 0);
                const totalBackdated = storeData.reduce((sum, row) => sum + parseIntSafe(row.BACKDATED), 0);
                const totalCost = storeData.reduce((sum, row) => sum + calculateTotalCost(row), 0);

                groups[store] = {
                    key: store,
                    count: 1,
                    instock: totalInventory,
                    onTransfer: totalOnTransfer,
                    inTransit: totalInTransit,
                    backdated: totalBackdated,
                    total: totalInventory,
                    Cost: totalCost,
                    rows: storeData,
                };
            });
        }

        return Object.values(groups).sort((a, b) => b.Cost - a.Cost);
    };

    // FIXED: Apply search filter to ALL data when searching
    const filteredData = useMemo(() => {
        if (searchTerm.trim()) {
            return searchData(reports, searchTerm);
        }
        return currentData;
    }, [currentData, searchTerm, reports, searchData]);

    const filteredReports = useMemo(() => {
        return filteredData;
    }, [filteredData]);

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
                totalValue: 0
            };
        }

        const totalStores = getUniqueStoreCount(reports);
        const totalInventory = reports.reduce((sum, report) => sum + parseIntSafe(report.INSTOCK), 0);
        const totalOnTransfer = reports.reduce((sum, report) => sum + parseIntSafe(report["ON TRANSFER"]), 0);
        const totalInTransit = reports.reduce((sum, report) => sum + parseIntSafe(report["IN Transit"]), 0);
        const totalBackdated = reports.reduce((sum, report) => sum + parseIntSafe(report.BACKDATED), 0);
        const totalValue = reports.reduce((sum, report) => sum + calculateTotalCost(report), 0);

        return {
            totalStores,
            totalInventory,
            totalOnTransfer,
            totalInTransit,
            totalBackdated,
            totalValue
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
            setSearchTerm("");
        } else {
            const newStack = historyStack.slice(0, -1);
            setHistoryStack(newStack);

            const previousLevel = newStack[newStack.length - 1];

            if (previousLevel.level === "Regions") {
                setCurrentData(reports);
                setCurrentView("regions");
                setSelectedRegion("");
                setSearchTerm("");
            } else if (previousLevel.level === "Markets") {
                const regionData = reports.filter((report) => report.Region === previousLevel.selected);
                setCurrentData(regionData);
                setCurrentView("markets");
                setSelectedMarket("");
            } else if (previousLevel.level === "Stores") {
                const marketData = reports.filter((report) => report.Market === previousLevel.selected);
                setCurrentData(marketData);
                setCurrentView("stores");
                setSelectedStore("");
            } else if (previousLevel.level === "Search Results") {
                setCurrentData(reports);
                setCurrentView("regions");
                setSelectedRegion("");
                setSearchTerm("");
            }
            setExpandedRow(null);
        }
    };

    const renderBreadcrumb = () => {
        return historyStack.map((item, index) => (
            <span key={index} className="ias-breadcrumb">
                {item.selected ? `${item.level} — ${item.selected}` : item.level}
                {index < historyStack.length - 1 && <span className="mx-2 text-gray-400">›</span>}
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

    const renderHierarchicalTable = (data: IASReport[], level: string, onRowClick: (group: AggregatedGroup) => void) => {
        const dataToAggregate = level === "regions" ? filteredData : data;
        const aggregated = aggregate(dataToAggregate, level);
        const maxCost = Math.max(...aggregated.map((a) => a.Cost), 1);
        const totalCost = aggregated.reduce((sum, group) => sum + group.Cost, 0);

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
                        {aggregated.length} groups — {getUniqueStoreCount(dataToAggregate)} unique stores — total value ${totalCost.toLocaleString()}
                        {searchTerm && ` • Filtered by: "${searchTerm}"`}
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
                                const pct = Math.round((group.Cost / maxCost) * 100);
                                const fillClass = pct >= 70 ? "ias-fill-green" : pct >= 40 ? "ias-fill-amber" : "ias-fill-red";

                                return (
                                    <tr key={index} onClick={() => onRowClick(group)} className="clickable-row">
                                        <td>{group.key}</td>
                                        <td className="ias-col-right">{group.count}</td>
                                        <td className="ias-col-right">{group.instock.toLocaleString()}</td>
                                        <td className="ias-col-right">{group.onTransfer.toLocaleString()}</td>
                                        <td className="ias-col-right">{group.inTransit.toLocaleString()}</td>
                                        <td className="ias-col-right">{group.backdated.toLocaleString()}</td>
                                        <td className="ias-col-right">${group.Cost.toLocaleString()}</td>
                                        <td>
                                            <div className="ias-bar-cell">
                                                <div className="ias-bar-track">
                                                    <div className={`ias-bar-fill ${fillClass}`} style={{ width: `${pct}%` }}></div>
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
    const handleExportCSV = () => {
        const csvData = currentView === "detailed" ? filteredReports : currentData;
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
    };
    const renderDetailedTable = () => {
        return (
            <div className="ias-table-block">
                <div className="ias-table-header">
                    <h2>
                        {historyStack[historyStack.length - 1]?.level === "Search Results"
                            ? `Search Results for "${searchTerm}"`
                            : `Detailed Report - ${selectedStore}`
                        }
                    </h2>
                    <div className="ias-meta">
                        {filteredReports.length} inventory records
                        {searchTerm && ` matching "${searchTerm}"`}
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
                                                    <div className="store-name">{report["Store Name"]}</div>
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
                                            <td className={`ias-col-right ${parseIntSafe(report.INSTOCK) > 0 ? "in-stock" : "out-of-stock"}`}>
                                                {report.INSTOCK}
                                            </td>
                                            <td className="ias-col-right">{report["ON TRANSFER"]}</td>
                                            <td className="ias-col-right">{report["IN Transit"]}</td>
                                            <td className="ias-col-right">{report.BACKDATED}</td>
                                            <td className="ias-col-right">${parseCurrency(report.Cost).toLocaleString()}</td>
                                            <td className="ias-col-right">${totalValue.toLocaleString()}</td>
                                            <td>
                                                <button onClick={() => showDetails(report)} className="details-btn">
                                                    Details
                                                </button>
                                                <button onClick={() => toggleRowExpansion(uniqueId)} className="expand-btn">
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
                                                                <div><strong>Friday:</strong> {report.Friday}</div>
                                                                <div><strong>Monday:</strong> {report.Monday}</div>
                                                                <div><strong>GROUND:</strong> {report.GROUND}</div>
                                                                <div><strong>TOTAL:</strong> {report.TOTAL}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Sales Performance</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>New Activation:</strong> {report["New Activation"]}</div>
                                                                <div><strong>SWITCHER:</strong> {report.SWITCHER}</div>
                                                                <div><strong>UPGRADE:</strong> {report.UPGRADE}</div>
                                                                <div><strong>Performance:</strong> {report["%"]}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Shipping & Allocation</h4>
                                                            <div className="detail-grid">
                                                                <div><strong>SUG QTY:</strong> {report["SUG QTY"]}</div>
                                                                <div><strong>OVERNIGHT QTY:</strong> {report["OVERNIGHT QTY"]}</div>
                                                                <div><strong>2nd DAY:</strong> {report["2nd DAY"]}</div>
                                                                <div><strong>GROUND QTY:</strong> {report["GROUND QTY"]}</div>
                                                                <div><strong>ALLOCATION:</strong> {report.ALLOCATION}</div>
                                                                <div><strong>Total ACC Sale:</strong> {report["Total ACC Sale"]}</div>
                                                            </div>
                                                        </div>

                                                        <div className="detail-section">
                                                            <h4>Store Information</h4>
                                                            <div className="store-address">{report["Store Address"]}</div>
                                                            <div><strong>Sub Market:</strong> {report["Sub Market"]}</div>
                                                            <div><strong>Net Worth:</strong> {report["Net Worth"]}</div>
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
                            {searchTerm
                                ? `No records found matching "${searchTerm}"`
                                : "No records found matching your criteria."
                            }
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

    // return (
    //     <div className="main-content">
    //         <div className="content-wrapper">
    //             <header className="topbar">
    //                 <div className="brand">
    //                     <div className="logo">📈</div>
    //                     <div className="title">
    //                         <div className="main">IAS Report</div>
    //                         <div className="sub">Inventory Analytics System - Store Performance</div>
    //                     </div>
    //                 </div>
    //             </header>

    //             <main className="main-area">
    //                 <div className="ias-layout-container">
    //                     {/* Left Sidebar with Search */}
    //                     <div className="ias-sidebar">
    //                         <div className="search-section">
    //                             <h3>Search Inventory</h3>
    //                             <div className="search-box">
    //                                 <input
    //                                     type="text"
    //                                     placeholder="Search TECH IDs, stores, markets, SKUs..."
    //                                     value={searchTerm}
    //                                     onChange={(e) => setSearchTerm(e.target.value)}
    //                                     className="search-input"
    //                                 />
    //                                 <span className="search-icon">🔍</span>
    //                                 {searchTerm && (
    //                                     <button
    //                                         onClick={() => setSearchTerm("")}
    //                                         className="clear-search"
    //                                         title="Clear search"
    //                                     >
    //                                         ✕
    //                                     </button>
    //                                 )}
    //                             </div>
    //                             <div className="search-hint">
    //                                 Try:  "Houston", "MOT XT24191", etc.
    //                             </div>
    //                         </div>

    //                         <div className="action-buttons">
    //                             <button
    //                                 className="btn btn-success"
    //                                 onClick={() => {
    //                                     const csvData = currentView === "detailed" ? filteredReports : currentData;
    //                                     if (csvData.length) {
    //                                         const keys = Object.keys(csvData[0]);
    //                                         const csv = [keys.join(",")]
    //                                             .concat(
    //                                                 csvData.map((r) =>
    //                                                     keys
    //                                                         .map((k) => `"${String(r[k as keyof IASReport] || "").replace(/"/g, '""')}"`)
    //                                                         .join(",")
    //                                                 )
    //                                             )
    //                                             .join("\n");

    //                                         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    //                                         const url = URL.createObjectURL(blob);
    //                                         const a = document.createElement("a");
    //                                         a.href = url;
    //                                         a.download = "ias_export.csv";
    //                                         document.body.appendChild(a);
    //                                         a.click();
    //                                         document.body.removeChild(a);
    //                                         URL.revokeObjectURL(url);
    //                                     }
    //                                 }}
    //                             >
    //                                 Export CSV
    //                             </button>
    //                             <button className="btn btn-primary" onClick={fetchIASData}>
    //                                 Refresh Data
    //                             </button>
    //                         </div>

    //                         {/* Quick Stats in Sidebar */}
    //                         <div className="sidebar-stats">
    //                             <h4>Quick Overview</h4>
    //                             <div className="stat-item">
    //                                 <span className="stat-label">Total Stores:</span>
    //                                 <span className="stat-value">{summaryStats.totalStores}</span>
    //                             </div>
    //                             <div className="stat-item">
    //                                 <span className="stat-label">IN STOCK:</span>
    //                                 <span className="stat-value">{summaryStats.totalInventory.toLocaleString()}</span>
    //                             </div>
    //                             <div className="stat-item">
    //                                 <span className="stat-label">Total Value:</span>
    //                                 <span className="stat-value">${summaryStats.totalValue.toLocaleString()}</span>
    //                             </div>
    //                         </div>
    //                     </div>

    //                     {/* Main Content Area */}
    //                     <div className="ias-main-content">
    //                         {/* Enhanced Dashboard Cards */}
    //                         <section className="dashboard-grid">
    //                             <div className="dashboard-card card-purple">
    //                                 <div className="card-icon">🏪</div>
    //                                 <div className="card-content">
    //                                     <h3 className="card-title">Total Stores</h3>
    //                                     <p className="card-description">{summaryStats.totalStores}</p>
    //                                 </div>
    //                             </div>
    //                             <div className="dashboard-card card-blue">
    //                                 <div className="card-icon">📦</div>
    //                                 <div className="card-content">
    //                                     <h3 className="card-title">IN STOCK</h3>
    //                                     <p className="card-description">{summaryStats.totalInventory.toLocaleString()}</p>
    //                                 </div>
    //                             </div>
    //                             <div className="dashboard-card card-orange">
    //                                 <div className="card-icon">🔄</div>
    //                                 <div className="card-content">
    //                                     <h3 className="card-title">ON TRANSFER</h3>
    //                                     <p className="card-description">{summaryStats.totalOnTransfer.toLocaleString()}</p>
    //                                 </div>
    //                             </div>
    //                             <div className="dashboard-card card-yellow">
    //                                 <div className="card-icon">🚚</div>
    //                                 <div className="card-content">
    //                                     <h3 className="card-title">IN TRANSIT</h3>
    //                                     <p className="card-description">{summaryStats.totalInTransit.toLocaleString()}</p>
    //                                 </div>
    //                             </div>
    //                             <div className="dashboard-card card-red">
    //                                 <div className="card-icon">📅</div>
    //                                 <div className="card-content">
    //                                     <h3 className="card-title">BACKDATED</h3>
    //                                     <p className="card-description">{summaryStats.totalBackdated.toLocaleString()}</p>
    //                                 </div>
    //                             </div>
    //                             <div className="dashboard-card card-green">
    //                                 <div className="card-icon">💰</div>
    //                                 <div className="card-content">
    //                                     <h3 className="card-title">Total Value</h3>
    //                                     <p className="card-description">${summaryStats.totalValue.toLocaleString()}</p>
    //                                 </div>
    //                             </div>
    //                         </section>

    //                         <div className="ias-nav-row">
    //                             <button className={`btn ${historyStack.length <= 1 ? "hidden" : ""}`} onClick={handleBackClick}>
    //                                 ← Back
    //                             </button>
    //                             <div className="ias-breadcrumb">{renderBreadcrumb()}</div>
    //                         </div>

    //                         <section className="ias-stacked">
    //                             {currentView === "regions" && renderHierarchicalTable(currentData, "regions", handleRegionClick)}
    //                             {currentView === "markets" && renderHierarchicalTable(currentData, "markets", handleMarketClick)}
    //                             {currentView === "stores" && renderHierarchicalTable(currentData, "stores", handleStoreClick)}
    //                             {currentView === "detailed" && renderDetailedTable()}
    //                         </section>
    //                     </div>
    //                 </div>

    //                 {selectedDetails && (
    //                     <div className="modal-overlay" onClick={closeDetails}>
    //                         <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    //                             <div className="modal-header">
    //                                 <h3>SKU Details - {selectedDetails.SKU}</h3>
    //                                 <button className="close-btn" onClick={closeDetails}>×</button>
    //                             </div>
    //                             <div className="modal-body">
    //                                 <div className="detail-grid">
    //                                     <div><strong>Store:</strong> {selectedDetails["Store Name"]}</div>
    //                                     <div><strong>Market:</strong> {selectedDetails.Market}</div>
    //                                     <div><strong>Model:</strong> {selectedDetails.Model}</div>
    //                                     <div><strong>Product:</strong> {selectedDetails.Product}</div>
    //                                     <div>
    //                                         <strong>Status:</strong>
    //                                         <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
    //                                             {selectedDetails.Status}
    //                                         </span>
    //                                     </div>
    //                                     <div><strong>IN STOCK:</strong> {selectedDetails.INSTOCK}</div>
    //                                     <div><strong>ON TRANSFER:</strong> {selectedDetails["ON TRANSFER"]}</div>
    //                                     <div><strong>IN TRANSIT:</strong> {selectedDetails["IN Transit"]}</div>
    //                                     <div><strong>BACKDATED:</strong> {selectedDetails.BACKDATED}</div>
    //                                     <div><strong>Unit Cost:</strong> {selectedDetails.Cost}</div>
    //                                     <div><strong>Net Worth:</strong> {selectedDetails["Net Worth"]}</div>
    //                                     <div><strong>Total Cost:</strong> {selectedDetails["TOTAL COST"]}</div>
    //                                     <div><strong>Calculated Value:</strong> ${calculateTotalCost(selectedDetails).toLocaleString()}</div>
    //                                     <div><strong>Allocation:</strong> {selectedDetails.ALLOCATION}</div>
    //                                     <div><strong>Performance:</strong> {selectedDetails["%"]}</div>
    //                                 </div>
    //                                 <div className="modal-actions">
    //                                     <button className="btn btn-primary" onClick={closeDetails}>Close</button>
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     </div>
    //                 )}
    //             </main>
    //         </div>
    //     </div>
    // );

    // return (
    //     <div className="main-content">
    //         <div className="content-wrapper">
    //             <header className="topbar">
    //                 <div className="brand">
    //                     <div className="logo">📈</div>
    //                     <div className="title">
    //                         <div className="main">IAS Report</div>
    //                         <div className="sub">Inventory Analytics System - Store Performance</div>
    //                     </div>
    //                 </div>
    //             </header>

    //             <main className="main-area">
    //                 {/* Controls Section - Exactly like audit report */}
    //                 <div className="audit-controls-section">
    //                     <div className="audit-controls-grid">
    //                         <div className="audit-action-buttons">
    //                             <button
    //                                 className="btn btn-success"
    //                                 onClick={handleExportCSV}
    //                             >
    //                                 Export CSV
    //                             </button>
    //                             <button
    //                                 className="btn btn-primary"
    //                                 onClick={fetchIASData}
    //                             >
    //                                 Refresh Data
    //                             </button>
    //                         </div>
    //                     </div>
    //                 </div>

    //                 {/* Dashboard Cards */}
    //                 <section className="dashboard-grid">
    //                     <div className="dashboard-card card-purple">
    //                         <div className="card-icon">🏪</div>
    //                         <div className="card-content">
    //                             <h3 className="card-title">Total Stores</h3>
    //                             <p className="card-description">{summaryStats.totalStores}</p>
    //                         </div>
    //                     </div>
    //                     <div className="dashboard-card card-blue">
    //                         <div className="card-icon">📦</div>
    //                         <div className="card-content">
    //                             <h3 className="card-title">IN STOCK</h3>
    //                             <p className="card-description">{summaryStats.totalInventory.toLocaleString()}</p>
    //                         </div>
    //                     </div>
    //                     <div className="dashboard-card card-orange">
    //                         <div className="card-icon">🔄</div>
    //                         <div className="card-content">
    //                             <h3 className="card-title">ON TRANSFER</h3>
    //                             <p className="card-description">{summaryStats.totalOnTransfer.toLocaleString()}</p>
    //                         </div>
    //                     </div>
    //                     <div className="dashboard-card card-yellow">
    //                         <div className="card-icon">🚚</div>
    //                         <div className="card-content">
    //                             <h3 className="card-title">IN TRANSIT</h3>
    //                             <p className="card-description">{summaryStats.totalInTransit.toLocaleString()}</p>
    //                         </div>
    //                     </div>
    //                     <div className="dashboard-card card-red">
    //                         <div className="card-icon">📅</div>
    //                         <div className="card-content">
    //                             <h3 className="card-title">BACKDATED</h3>
    //                             <p className="card-description">{summaryStats.totalBackdated.toLocaleString()}</p>
    //                         </div>
    //                     </div>
    //                     <div className="dashboard-card card-green">
    //                         <div className="card-icon">💰</div>
    //                         <div className="card-content">
    //                             <h3 className="card-title">Total Value</h3>
    //                             <p className="card-description">${summaryStats.totalValue.toLocaleString()}</p>
    //                         </div>
    //                     </div>
    //                 </section>

    //                 {/* Navigation */}
    //                 <div className="audit-nav-row">
    //                     <button className={`btn ${historyStack.length <= 1 ? "hidden" : ""}`} onClick={handleBackClick}>
    //                         ← Back
    //                     </button>
    //                     <div className="audit-breadcrumb">{renderBreadcrumb()}</div>
    //                 </div>

    //                 {/* Table Content */}
    //                 <section className="audit-stacked">
    //                     {currentView === "regions" && renderHierarchicalTable(currentData, "regions", handleRegionClick)}
    //                     {currentView === "markets" && renderHierarchicalTable(currentData, "markets", handleMarketClick)}
    //                     {currentView === "stores" && renderHierarchicalTable(currentData, "stores", handleStoreClick)}
    //                     {currentView === "detailed" && renderDetailedTable()}
    //                 </section>
    //             </main>
    //         </div>

    //         {/* Modal */}
    //         {selectedDetails && (
    //             <div className="modal-overlay" onClick={closeDetails}>
    //                 <div className="modal-content" onClick={(e) => e.stopPropagation()}>
    //                     <div className="modal-header">
    //                         <h3>SKU Details - {selectedDetails.SKU}</h3>
    //                         <button className="close-btn" onClick={closeDetails}>×</button>
    //                     </div>
    //                     <div className="modal-body">
    //                         <div className="detail-grid">
    //                             <div><strong>Store:</strong> {selectedDetails["Store Name"]}</div>
    //                             <div><strong>Market:</strong> {selectedDetails.Market}</div>
    //                             <div><strong>Model:</strong> {selectedDetails.Model}</div>
    //                             <div><strong>Product:</strong> {selectedDetails.Product}</div>
    //                             <div>
    //                                 <strong>Status:</strong>
    //                                 <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
    //                                     {selectedDetails.Status}
    //                                 </span>
    //                             </div>
    //                             <div><strong>IN STOCK:</strong> {selectedDetails.INSTOCK}</div>
    //                             <div><strong>ON TRANSFER:</strong> {selectedDetails["ON TRANSFER"]}</div>
    //                             <div><strong>IN TRANSIT:</strong> {selectedDetails["IN Transit"]}</div>
    //                             <div><strong>BACKDATED:</strong> {selectedDetails.BACKDATED}</div>
    //                             <div><strong>Unit Cost:</strong> {selectedDetails.Cost}</div>
    //                             <div><strong>Net Worth:</strong> {selectedDetails["Net Worth"]}</div>
    //                             <div><strong>Total Cost:</strong> {selectedDetails["TOTAL COST"]}</div>
    //                             <div><strong>Calculated Value:</strong> ${calculateTotalCost(selectedDetails).toLocaleString()}</div>
    //                             <div><strong>Allocation:</strong> {selectedDetails.ALLOCATION}</div>
    //                             <div><strong>Performance:</strong> {selectedDetails["%"]}</div>
    //                         </div>
    //                         <div className="modal-actions">
    //                             <button className="btn btn-primary" onClick={closeDetails}>Close</button>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>
    //         )}
    //     </div>
    // );


    return (
        <div className="main-content">
            <div className="content-wrapper">
                <header className="topbar">
                    <div className="brand">
                        <div className="logo">📈</div>
                        <div className="title">
                            <div className="main">IAS Report</div>
                            <div className="sub">Inventory Analytics System - Store Performance</div>
                        </div>
                    </div>
                </header>

                <main className="main-area">
                    {/* Controls Section with Search on Left, Buttons on Right */}
                    <div className="ias-controls-section">
                        <div className="ias-controls-grid">
                            {/* Search Bar on Left */}
                            <div className="search-box">
                                <input
                                    type="text"
                                    placeholder="Search TECH IDs, stores, markets, SKUs..."
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

                            {/* Buttons on Right */}
                            <div className="ias-action-buttons">
                                <button
                                    className="btn btn-success"
                                    onClick={handleExportCSV}
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

                    {/* Dashboard Cards */}
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
                                <p className="card-description">{summaryStats.totalInventory.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="dashboard-card card-orange">
                            <div className="card-icon">🔄</div>
                            <div className="card-content">
                                <h3 className="card-title">ON TRANSFER</h3>
                                <p className="card-description">{summaryStats.totalOnTransfer.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="dashboard-card card-yellow">
                            <div className="card-icon">🚚</div>
                            <div className="card-content">
                                <h3 className="card-title">IN TRANSIT</h3>
                                <p className="card-description">{summaryStats.totalInTransit.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="dashboard-card card-red">
                            <div className="card-icon">📅</div>
                            <div className="card-content">
                                <h3 className="card-title">BACKDATED</h3>
                                <p className="card-description">{summaryStats.totalBackdated.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="dashboard-card card-green">
                            <div className="card-icon">💰</div>
                            <div className="card-content">
                                <h3 className="card-title">Total Value</h3>
                                <p className="card-description">${summaryStats.totalValue.toLocaleString()}</p>
                            </div>
                        </div>
                    </section>

                    {/* Navigation */}
                    <div className="ias-nav-row">
                        <button className={`btn ${historyStack.length <= 1 ? "hidden" : ""}`} onClick={handleBackClick}>
                            ← Back
                        </button>
                        <div className="ias-breadcrumb">{renderBreadcrumb()}</div>
                    </div>

                    {/* Table Content */}
                    <section className="ias-stacked">
                        {currentView === "regions" && renderHierarchicalTable(currentData, "regions", handleRegionClick)}
                        {currentView === "markets" && renderHierarchicalTable(currentData, "markets", handleMarketClick)}
                        {currentView === "stores" && renderHierarchicalTable(currentData, "stores", handleStoreClick)}
                        {currentView === "detailed" && renderDetailedTable()}
                    </section>
                </main>
            </div>

            {/* Modal */}
            {selectedDetails && (
                <div className="modal-overlay" onClick={closeDetails}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>SKU Details - {selectedDetails.SKU}</h3>
                            <button className="close-btn" onClick={closeDetails}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div><strong>Store:</strong> {selectedDetails["Store Name"]}</div>
                                <div><strong>Market:</strong> {selectedDetails.Market}</div>
                                <div><strong>Model:</strong> {selectedDetails.Model}</div>
                                <div><strong>Product:</strong> {selectedDetails.Product}</div>
                                <div>
                                    <strong>Status:</strong>
                                    <span className={`status-indicator status-${getStatusColor(selectedDetails.Status)}`}>
                                        {selectedDetails.Status}
                                    </span>
                                </div>
                                <div><strong>IN STOCK:</strong> {selectedDetails.INSTOCK}</div>
                                <div><strong>ON TRANSFER:</strong> {selectedDetails["ON TRANSFER"]}</div>
                                <div><strong>IN TRANSIT:</strong> {selectedDetails["IN Transit"]}</div>
                                <div><strong>BACKDATED:</strong> {selectedDetails.BACKDATED}</div>
                                <div><strong>Unit Cost:</strong> {selectedDetails.Cost}</div>
                                <div><strong>Net Worth:</strong> {selectedDetails["Net Worth"]}</div>
                                <div><strong>Total Cost:</strong> {selectedDetails["TOTAL COST"]}</div>
                                <div><strong>Calculated Value:</strong> ${calculateTotalCost(selectedDetails).toLocaleString()}</div>
                                <div><strong>Allocation:</strong> {selectedDetails.ALLOCATION}</div>
                                <div><strong>Performance:</strong> {selectedDetails["%"]}</div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-primary" onClick={closeDetails}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}