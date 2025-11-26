"use client";
import { useAuth } from "../../../components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import "./rma-styles.css";

interface RMAItem {
  [key: string]: string | number;
}

interface AggregatedGroup {
  key: string;
  count: number;
  devices: number;
  cost: number;
  days: string[];
  rows: RMAItem[];
  rmaDays7?: number;
  rmaDays14?: number;
  rmaDays14Plus?: number;
  xbmDays7?: number;
  xbmDays14?: number;
  xbmDays14Plus?: number;
  tradeInDays7?: number;
  tradeInDays14?: number;
  tradeInDays14Plus?: number;
}

export default function RMADashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [rawData, setRawData] = useState<RMAItem[]>([]);
  const [filteredData, setFilteredData] = useState<RMAItem[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sheetUrl] = useState<string>(
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vS_xc8D53b3lTNKPM5cvwe2Fpdrr4N_zYYTAaScr0N7o2CHwSyWoW_PJxBMrjk5Fw/pub?gid=73302648&single=true&output=csv"
  );
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<
    "regions" | "market" | "dm" | "type" | "detailed"
  >("regions");
  const [currentData, setCurrentData] = useState<RMAItem[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [selectedDM, setSelectedDM] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [historyStack, setHistoryStack] = useState<
    { level: string; selected?: string }[]
  >([{ level: "Regions" }]);

  // New state for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // 100 lines per page

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

  const getField = (obj: RMAItem, candidates: string[]): string => {
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

  // Enhanced search function for RMA data - SIMPLIFIED VERSION
  const searchData = (data: RMAItem[], searchTerm: string): RMAItem[] => {
    if (!searchTerm.trim()) {
      return data;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    console.log(`🔍 Searching RMA data for: "${searchLower}" in ${data.length} records`);

    const results = data.filter((row) => {
      // Search across key RMA fields
      const searchableFields = [
        getField(row, ["Regions", "Region", "REGIONS"]),
        getField(row, ["Market", "Market Name", "MARKET"]),
        getField(row, ["DM NAME", "DM Name", "DM"]),
        getField(row, ["Type", "TYPE", "type"]),
        getField(row, ["Customer IMEI", "IMEI", "imei"]),
        getField(row, ["Assurant Status", "Assurant_STATUS", "Assurant"]),
        getField(row, ["Days", "DAY", "day"])
      ].filter((field) => field && field !== "" && field !== "Unknown");

      return searchableFields.some((field) =>
        String(field).toLowerCase().includes(searchLower)
      );
    });

    console.log(`✅ Found ${results.length} RMA results for: "${searchTerm}"`);
    return results;
  };

  // Apply search filter to data
  const searchedData = useMemo(() => {
    if (searchTerm.trim()) {
      return searchData(filteredData, searchTerm);
    }
    return filteredData;
  }, [filteredData, searchTerm]);

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
      setSelectedType(`Search: "${searchTerm}"`);
      setHistoryStack([
        { level: "Regions" },
        { level: "Search Results", selected: searchTerm },
      ]);
      setCurrentPage(1);

    } else if (searchTerm === "") {
      // Only reset when search is explicitly cleared
      setCurrentData(filteredData);
      setCurrentView("regions");
      setSelectedType("");
      setHistoryStack([{ level: "Regions" }]);
      setCurrentPage(1);
    }
  }, [searchTerm, filteredData]);

  const parseCurrency = (v: any): number => {
    if (v == null) return 0;
    const s = String(v).replace(/[^0-9.\-]/g, "");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  const parseDateDMY = (s: string): Date | null => {
    if (!s) return null;
    if (/\d{2}\/\d{2}\/\d{4}/.test(s)) {
      const [dd, mm, yy] = s.split("/");
      return new Date(Number(yy), Number(mm) - 1, Number(dd));
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatCurrency = (v: number): string => {
    return (
      "$" +
      Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
    );
  };

  const countNonEmptyIMEI = (row: RMAItem): number => {
    const imeiValue = getField(row, [
      "Customer IMEI",
      "IMEI",
      "imei",
      "CUSTOMER IMEI",
    ]);
    return imeiValue &&
      String(imeiValue).trim() !== "" &&
      imeiValue !== "Unknown"
      ? 1
      : 0;
  };

  const detectKey = (candidates: string[]): string => {
    if (!filteredData || filteredData.length === 0) return candidates[0];

    const allKeys = Object.keys(filteredData[0] || {});

    // First, try exact match
    for (const candidate of candidates) {
      const hasKey = filteredData.some((row) => {
        const value = getField(row, [candidate]);
        return value && value !== "Unknown" && value !== "";
      });
      if (hasKey) return candidate;
    }

    // If exact match fails, try case-insensitive partial match
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

    // If still no match, try to find any field that might contain relevant data
    for (const key of allKeys) {
      const hasData = filteredData.some((row) => {
        const value = String(row[key] || "").trim();
        return value && value !== "Unknown" && value !== "";
      });
      if (hasData) {
        console.log(
          "Fallback detected field:",
          key,
          "for candidates:",
          candidates
        );
        return key;
      }
    }

    return candidates[0];
  };

  // Improved aggregation with better region filtering
  const aggregate = (data: RMAItem[], keyField: string, level: string = ""): AggregatedGroup[] => {
    const groups: {
      [key: string]: {
        count: number;
        devices: number;
        cost: number;
        daysSet: Set<string>;
        rows: RMAItem[];
        rmaDays7: number;
        rmaDays14: number;
        rmaDays14Plus: number;
        xbmDays7: number;
        xbmDays14: number;
        xbmDays14Plus: number;
        tradeInDays7: number;
        tradeInDays14: number;
        tradeInDays14Plus: number;
      };
    } = {};

    // Define valid region names to filter out invalid entries
    const validRegions = ["Aleem Ghori", "Hasnain Mustaqeem", "North", "South", "East", "West"];

    data.forEach((row) => {
      const keyRaw = getField(row, [keyField]);
      const key = String(keyRaw || "").trim();

      // Skip empty or "Unknown" values
      if (!key || key === "Unknown" || key === "") return;

      // For regions level, filter out non-region values like "21 days"
      if (level === "regions") {
        // Check if the key looks like a day value (contains "day" or "days" or is just a number)
        const isDayValue = /(\d+\s*days?|\bday\b)/i.test(key) || /^\d+$/.test(key);
        if (isDayValue) {
          console.log("Filtering out day value as region:", key);
          return; // Skip this row for regions aggregation
        }

        // Also check if it's a valid region name (case insensitive)
        const isValidRegion = validRegions.some(region =>
          region.toLowerCase() === key.toLowerCase()
        );
        if (!isValidRegion && keyField.toLowerCase().includes("region")) {
          console.log("Filtering out invalid region:", key);
          return;
        }
      }

      if (!groups[key])
        groups[key] = {
          count: 0,
          devices: 0,
          cost: 0,
          daysSet: new Set(),
          rows: [],
          rmaDays7: 0,
          rmaDays14: 0,
          rmaDays14Plus: 0,
          xbmDays7: 0,
          xbmDays14: 0,
          xbmDays14Plus: 0,
          tradeInDays7: 0,
          tradeInDays14: 0,
          tradeInDays14Plus: 0,
        };

      groups[key].count += 1;
      groups[key].devices += countNonEmptyIMEI(row);
      groups[key].cost += parseCurrency(
        getField(row, ["COST", "Cost", "cost"])
      );

      const daysVal = getField(row, ["Days", "DAY", "day"]);
      // Keep the list of distinct Days strings for display
      if (daysVal && daysVal !== "Unknown" && daysVal !== "") {
        groups[key].daysSet.add(String(daysVal).trim());
      }

      // Determine numeric days for bucketed counts
      const daysNum = parseInt(String(daysVal).replace(/[^0-9\-]/g, ""));
      const rawType = getField(row, ["RecordType", "Record Type", "Type", "TYPE", "type"]).toLowerCase();
      const isRMA = rawType.includes("rma");
      const isXBM = rawType.includes("xbm");
      const isTrade = rawType.includes("trade");

      if (!isNaN(daysNum)) {
        if (daysNum <= 7) {
          if (isRMA) groups[key].rmaDays7 += 1;
          else if (isXBM) groups[key].xbmDays7 += 1;
          else if (isTrade) groups[key].tradeInDays7 += 1;
        } else if (daysNum <= 14) {
          if (isRMA) groups[key].rmaDays14 += 1;
          else if (isXBM) groups[key].xbmDays14 += 1;
          else if (isTrade) groups[key].tradeInDays14 += 1;
        } else if (daysNum > 14) {
          if (isRMA) groups[key].rmaDays14Plus += 1;
          else if (isXBM) groups[key].xbmDays14Plus += 1;
          else if (isTrade) groups[key].tradeInDays14Plus += 1;
        }
      }
      groups[key].rows.push(row);
    });

    const result = Object.keys(groups)
      .map((k) => ({
        key: k,
        count: groups[k].count,
        devices: groups[k].devices,
        cost: groups[k].cost,
        days: Array.from(groups[k].daysSet),
        rows: groups[k].rows,
        rmaDays7: groups[k].rmaDays7,
        rmaDays14: groups[k].rmaDays14,
        rmaDays14Plus: groups[k].rmaDays14Plus,
        xbmDays7: groups[k].xbmDays7,
        xbmDays14: groups[k].xbmDays14,
        xbmDays14Plus: groups[k].xbmDays14Plus,
        tradeInDays7: groups[k].tradeInDays7,
        tradeInDays14: groups[k].tradeInDays14,
        tradeInDays14Plus: groups[k].tradeInDays14Plus,
      }))
      .sort((a, b) => b.cost - a.cost);

    // Debug logging
    if (keyField.toLowerCase().includes("region")) {
      console.log("Regions aggregation result:", result);
    }

    return result;
  };

  // Data fetching and processing
  const fetchCSV = async (url: string): Promise<RMAItem[]> => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch error " + res.status);
      const txt = await res.text();

      // Parse CSV using PapaParse logic
      const lines = txt.split("\n").filter((line) => line.trim());
      if (lines.length < 2) return [];

      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));
      const data = lines
        .slice(1)
        .map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          const obj: RMAItem = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || "";
          });
          return obj;
        })
        .filter((row) => Object.values(row).some((val) => val !== ""));

      // Debug: Log available fields
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

  const applyFilters = (data: RMAItem[]): RMAItem[] => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (!from && !to) return data;

    return data.filter((row) => {
      const raw = getField(row, [
        "Processed Date",
        "ProcessedDate",
        "Processed_Date",
      ]);
      const d = parseDateDMY(raw);
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

  // UI rendering functions
  const buildSummaryCards = (data: RMAItem[]) => {
    const dataToUse = searchTerm.trim() ? searchedData : data;

    const totalRecords = dataToUse.length;
    const totalDevices = dataToUse.reduce((s, r) => s + countNonEmptyIMEI(r), 0);
    const totalCost = dataToUse.reduce(
      (s, r) => s + parseCurrency(getField(r, ["COST", "Cost", "cost"])),
      0
    );

    // Robust detection of record types
    const getRecordType = (row: RMAItem) =>
      getField(row, ["RecordType", "Record Type", "Type", "TYPE", "type"]).toLowerCase();

    const rmaCount = dataToUse.filter((r) => getRecordType(r).includes("rma")).length;
    const xbmCount = dataToUse.filter((r) => getRecordType(r).includes("xbm")).length;
    const tradeInCount = dataToUse.filter((r) => getRecordType(r).includes("trade")).length;

    const getStatus = (row: RMAItem) =>
      getField(row, ["Status", "Assurant Status", "Assurant_STATUS", "Assurant"]).toLowerCase();

    const pendingCount = dataToUse.filter((r) => getStatus(r).includes("pending")).length;

    const cards = [
      { label: "Total Records", value: totalRecords, icon: "📊" },
      { label: "Total Cost", value: formatCurrency(totalCost), icon: "💰" },
      { label: "RMA Records", value: rmaCount, icon: "📦" },
      { label: "XBM Records", value: xbmCount, icon: "🔄" },
      { label: "Trade IN", value: tradeInCount, icon: "🤝" },
      { label: "Pending", value: pendingCount, icon: "⏳" },
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

      // Set default dates
      const dateVals = data
        .map((r) =>
          parseDateDMY(getField(r, ["Processed Date", "ProcessedDate"]))
        )
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
    setSelectedDM("");
    setSelectedType("");
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
    setSelectedDM("");
    setSelectedType("");
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
    a.download = "rma_export.csv";
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
    setSearchTerm("");
    setCurrentPage(1); // Reset to page 1
  };

  const handleMarketClick = (market: AggregatedGroup) => {
    const dmData = market.rows;
    setCurrentData(dmData);
    setCurrentView("dm");
    setSelectedMarket(market.key);
    setHistoryStack([
      { level: "Regions" },
      { level: "Market", selected: selectedRegion },
      { level: "DM", selected: market.key },
    ]);
    setSearchTerm("");
    setCurrentPage(1); // Reset to page 1
  };

  const handleDMClick = (dm: AggregatedGroup) => {
    const typeData = dm.rows;
    setCurrentData(typeData);
    setCurrentView("type");
    setSelectedDM(dm.key);
    setHistoryStack([
      { level: "Regions" },
      { level: "Market", selected: selectedRegion },
      { level: "DM", selected: selectedMarket },
      { level: "Type", selected: dm.key },
    ]);
    setSearchTerm("");
    setCurrentPage(1); // Reset to page 1
  };

  const handleTypeClick = (type: AggregatedGroup) => {
    const detailedData = type.rows;
    setCurrentData(detailedData);
    setCurrentView("detailed");
    setSelectedType(type.key);
    setHistoryStack([
      { level: "Regions" },
      { level: "Market", selected: selectedRegion },
      { level: "DM", selected: selectedMarket },
      { level: "Type", selected: selectedDM },
      { level: "Detailed", selected: type.key },
    ]);
    setSearchTerm("");
    setCurrentPage(1); // Reset to page 1
  };

  const handleBackClick = () => {
    if (historyStack.length <= 1) {
      setCurrentData(filteredData);
      setCurrentView("regions");
      setHistoryStack([{ level: "Regions" }]);
      setSelectedRegion("");
      setSelectedMarket("");
      setSelectedDM("");
      setSelectedType("");
      setSearchTerm("");
      setCurrentPage(1); // Reset to page 1
    } else {
      const newStack = historyStack.slice(0, -1);
      setHistoryStack(newStack);

      const previousLevel = newStack[newStack.length - 1];

      if (previousLevel.level === "Regions") {
        setCurrentData(filteredData);
        setCurrentView("regions");
        setSelectedRegion("");
        setSearchTerm("");
        setCurrentPage(1); // Reset to page 1
      } else if (previousLevel.level === "Market") {
        const regionKey = detectKey([
          "Regions",
          "Region",
          "REGIONS",
          "regions",
        ]);
        const regionData = filteredData.filter(
          (row) => getField(row, [regionKey]) === previousLevel.selected
        );
        setCurrentData(regionData);
        setCurrentView("market");
        setSelectedMarket("");
        setSearchTerm("");
        setCurrentPage(1); // Reset to page 1
      } else if (previousLevel.level === "DM") {
        const regionKey = detectKey([
          "Regions",
          "Region",
          "REGIONS",
          "regions",
        ]);
        const marketKey = detectKey([
          "Market",
          "Market Name",
          "Market Name ",
          "MARKET",
        ]);
        const dmData = filteredData.filter(
          (row) =>
            getField(row, [regionKey]) === selectedRegion &&
            getField(row, [marketKey]) === previousLevel.selected
        );
        setCurrentData(dmData);
        setCurrentView("dm");
        setSelectedDM("");
        setSearchTerm("");
        setCurrentPage(1); // Reset to page 1
      } else if (previousLevel.level === "Type") {
        const regionKey = detectKey([
          "Regions",
          "Region",
          "REGIONS",
          "regions",
        ]);
        const marketKey = detectKey([
          "Market",
          "Market Name",
          "Market Name ",
          "MARKET",
        ]);
        const dmKey = detectKey(["DM NAME", "DM Name", "DM", "Dm Name"]);
        const typeData = filteredData.filter(
          (row) =>
            getField(row, [regionKey]) === selectedRegion &&
            getField(row, [marketKey]) === selectedMarket &&
            getField(row, [dmKey]) === previousLevel.selected
        );
        setCurrentData(typeData);
        setCurrentView("type");
        setSelectedType("");
        setSearchTerm("");
        setCurrentPage(1);
      }
    }
  };

  const renderBreadcrumb = () => {
    return historyStack.map((item, index) => {
      const isLast = index === historyStack.length - 1;
      return (
        <span key={index} className="text-gray-600">
          <button
            className={`breadcrumb-link ${isLast ? 'breadcrumb-current' : ''}`}
            onClick={() => handleBreadcrumbClick(index)}
            title={`Go to ${item.level}${item.selected ? ` — ${item.selected}` : ''}`}
            aria-current={isLast ? 'true' : 'false'}
          >
            {item.selected ? `${item.level} — ${item.selected}` : item.level}
          </button>
          {index < historyStack.length - 1 && (
            <span className="mx-2 text-gray-400"> › </span>
          )}
        </span>
      );
    });
  };

  function handleBreadcrumbClick(index: number) {
    // slice the history to the clicked position
    const newStack = historyStack.slice(0, index + 1);
    setHistoryStack(newStack);

    // helper to find selections
    const regionSelection = newStack.find((s) => s.level === 'Market')?.selected;
    const marketSelection = newStack.find((s) => s.level === 'DM')?.selected;
    const typeSelection = newStack.find((s) => s.level === 'Type')?.selected;
    const filteredSelection = newStack.find((s) => s.level === 'Filtered')?.selected;

    // detect keys
    const regionKey = detectKey(['Regions', 'Region', 'REGIONS', 'regions']);
    const marketKey = detectKey(['Market', 'Market Name', 'MARKET']);
    const dmKey = detectKey(['DM NAME', 'DM Name', 'DM']);
    const typeKey = detectKey(['Type', 'TYPE', 'type']);

    // start from the full filtered dataset and apply selections found in the breadcrumb stack
    let base = filteredData;
    if (regionSelection) {
      base = base.filter((r) => getField(r, [regionKey]) === regionSelection);
    }
    if (marketSelection) {
      base = base.filter((r) => getField(r, [marketKey]) === marketSelection);
    }
    if (typeSelection) {
      base = base.filter((r) => getField(r, [typeKey]) === typeSelection);
    }

    // if breadcrumb points to a 'Filtered' bucket like 'RMA • 14', apply that filtering
    if (filteredSelection) {
      const parts = filteredSelection.split('•').map((p) => p.trim());
      if (parts.length === 2) {
        const filterType = parts[0].toLowerCase();
        const daysRange = parts[1];
        base = base.filter((r) => {
          const recordType = getField(r, ['RecordType', 'Record Type', 'Type', 'TYPE', 'type']).toLowerCase();
          if (!recordType.includes(filterType)) return false;
          const daysVal = getField(r, ['Days', 'DAY', 'day']);
          const daysNum = parseInt(String(daysVal).replace(/[^0-9\-]/g, ''));
          if (isNaN(daysNum)) return false;
          if (daysRange === '7') return daysNum <= 7;
          if (daysRange === '14') return daysNum > 7 && daysNum <= 14;
          return daysNum > 14;
        });
      }
    }

    // set appropriate view and state markers
    const last = newStack[newStack.length - 1];
    const mapView = (lvl: string) => {
      const lower = lvl.toLowerCase();
      if (lower.includes('region')) return 'regions';
      if (lower.includes('market')) return 'market';
      if (lower.includes('dm')) return 'dm';
      if (lower.includes('type')) return 'type';
      return 'detailed';
    };

    const view = mapView(last.level);

    setCurrentData(base);
    setCurrentView(view as any);
    setCurrentPage(1);
    setSearchTerm('');

    // set selectors for UI
    setSelectedRegion(regionSelection || '');
    setSelectedMarket(marketSelection || '');
    setSelectedDM(typeSelection || '');
    if (view === 'detailed') setSelectedType(last.selected || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }



  const renderTable = (
    data: RMAItem[],
    level: string,
    onRowClick: (group: AggregatedGroup) => void
  ) => {
    let keyField = "";
    let title = "";

    switch (level) {
      case "regions":
        keyField = detectKey(["Regions", "Region", "REGIONS", "regions"]);
        title = "Regions";
        break;
      case "market":
        keyField = detectKey([
          "Market",
          "Market Name",
          "Market Name ",
          "MARKET",
        ]);
        title = "Markets";
        break;
      case "dm":
        keyField = detectKey(["DM NAME", "DM Name", "DM", "Dm Name"]);
        title = "DMs";
        break;
      case "type":
        keyField = detectKey(["Type", "TYPE", "type"]);
        title = "Types";
        break;
      case "detailed":
        return renderDetailedTable(data);
      default:
        keyField = "Unknown";
        title = "Data";
    }

    console.log(`Rendering ${level} table with key field:`, keyField);

    // Pass the level to aggregate function for better filtering
    const aggregated = aggregate(data, keyField, level);
    const maxCost = Math.max(...aggregated.map((a) => a.cost), 1);

    return (
      <div className="rma-table-block">
        <div className="rma-table-header">
          <h2>{title}</h2>
          <div className="rma-meta">
            {aggregated.length} groups — total cost{" "}
            {formatCurrency(aggregated.reduce((s, a) => s + a.cost, 0))}
            {searchTerm && ` • Filtered by: "${searchTerm}"`}
          </div>
        </div>

        <div className="rma-table-wrapper">
          <table className="rma-table">
            <thead>
              <tr>
                <th>{title}</th>
                <th className="rma-col-right">Total</th>
                <th className="rma-col-right">Total Cost</th>
                <th colSpan={3} className="rma-col-center">RMA</th>
                <th colSpan={3} className="rma-col-center">XBM</th>
                <th colSpan={3} className="rma-col-center">Trade-IN</th>
              </tr>
              <tr className="sub-header">
                <th></th>
                <th></th>
                <th></th>
                <th className="rma-col-right">7d</th>
                <th className="rma-col-right">14d</th>
                <th className="rma-col-right">14+d</th>
                <th className="rma-col-right">7d</th>
                <th className="rma-col-right">14d</th>
                <th className="rma-col-right">14+d</th>
                <th className="rma-col-right">7d</th>
                <th className="rma-col-right">14d</th>
                <th className="rma-col-right">14+d</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((group, index) => {
                const pct = Math.round((group.cost / maxCost) * 100);
                const fillClass =
                  pct >= 70 ? "rma-fill-green" : pct >= 40 ? "rma-fill-amber" : "rma-fill-red";

                return (
                  <tr key={index} onClick={() => onRowClick(group)}>
                    <td>{group.key}</td>
                    <td className="rma-col-right">
                      <span
                        className="clickable-count"
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.count || 0) > 0) {
                            setCurrentData(group.rows);
                            setCurrentView("detailed");
                            setHistoryStack([
                              { level: "Regions" },
                              { level: "Selected", selected: group.key },
                              { level: "All Records", selected: `${group.count} records` },
                            ]);
                            setSearchTerm("");
                            setCurrentPage(1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        style={{
                          cursor: (group.count || 0) > 0 ? "pointer" : "default",
                          color: (group.count || 0) > 0 ? "var(--accent)" : "var(--text-muted)",
                          fontWeight: 600,
                          transition: "all 0.3s ease",
                        }}
                      >
                        {group.count}
                      </span>
                    </td>
                    <td className="rma-col-right">{formatCurrency(group.cost)}</td>

                    {/* RMA */}
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.rmaDays7 && group.rmaDays7 > 0 ? "age-badge-7 clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.rmaDays7 || 0) > 0) handleCountClick(group, "rma", "7");
                        }}
                        style={{ cursor: (group.rmaDays7 || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.rmaDays7 || 0}
                      </span>
                    </td>
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.rmaDays14 && group.rmaDays14 > 0 ? "age-badge-14 clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.rmaDays14 || 0) > 0) handleCountClick(group, "rma", "14");
                        }}
                        style={{ cursor: (group.rmaDays14 || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.rmaDays14 || 0}
                      </span>
                    </td>
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.rmaDays14Plus && group.rmaDays14Plus > 0 ? "age-badge-14plus clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.rmaDays14Plus || 0) > 0) handleCountClick(group, "rma", "14Plus");
                        }}
                        style={{ cursor: (group.rmaDays14Plus || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.rmaDays14Plus || 0}
                      </span>
                    </td>

                    {/* XBM */}
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.xbmDays7 && group.xbmDays7 > 0 ? "age-badge-7 clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.xbmDays7 || 0) > 0) handleCountClick(group, "xbm", "7");
                        }}
                        style={{ cursor: (group.xbmDays7 || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.xbmDays7 || 0}
                      </span>
                    </td>
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.xbmDays14 && group.xbmDays14 > 0 ? "age-badge-14 clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.xbmDays14 || 0) > 0) handleCountClick(group, "xbm", "14");
                        }}
                        style={{ cursor: (group.xbmDays14 || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.xbmDays14 || 0}
                      </span>
                    </td>
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.xbmDays14Plus && group.xbmDays14Plus > 0 ? "age-badge-14plus clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.xbmDays14Plus || 0) > 0) handleCountClick(group, "xbm", "14Plus");
                        }}
                        style={{ cursor: (group.xbmDays14Plus || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.xbmDays14Plus || 0}
                      </span>
                    </td>

                    {/* Trade-IN */}
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.tradeInDays7 && group.tradeInDays7 > 0 ? "age-badge-7 clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.tradeInDays7 || 0) > 0) handleCountClick(group, "tradeIn", "7");
                        }}
                        style={{ cursor: (group.tradeInDays7 || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.tradeInDays7 || 0}
                      </span>
                    </td>
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.tradeInDays14 && group.tradeInDays14 > 0 ? "age-badge-14 clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.tradeInDays14 || 0) > 0) handleCountClick(group, "tradeIn", "14");
                        }}
                        style={{ cursor: (group.tradeInDays14 || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.tradeInDays14 || 0}
                      </span>
                    </td>
                    <td className="rma-col-right">
                      <span
                        className={`age-badge ${group.tradeInDays14Plus && group.tradeInDays14Plus > 0 ? "age-badge-14plus clickable-count" : "age-badge-empty"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ((group.tradeInDays14Plus || 0) > 0) handleCountClick(group, "tradeIn", "14Plus");
                        }}
                        style={{ cursor: (group.tradeInDays14Plus || 0) > 0 ? "pointer" : "default" }}
                      >
                        {group.tradeInDays14Plus || 0}
                      </span>
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

  const renderDetailedTable = (data: RMAItem[]) => {
    // For detailed view, we need to use the drilled-down data (currentData) but apply pagination to it
    const detailedData = data; // This is the drilled-down data
    const totalRecords = detailedData.length;

    // Apply pagination to the detailed data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDetailedData = detailedData.slice(startIndex, startIndex + itemsPerPage);

    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    const shouldShowPagination = totalRecords > itemsPerPage;

    return (
      <div className="rma-table-block">
        <div className="rma-table-header">
          <h2>Detailed — {selectedType}</h2>
          <div className="rma-meta">
            {totalRecords} rows
            {searchTerm && ` matching "${searchTerm}"`}
            {shouldShowPagination && ` • Page ${currentPage} of ${totalPages}`}
          </div>
        </div>

        <div className="rma-table-wrapper">
          <table className="rma-table">
            <thead>
              <tr>
                <th>Processed Date</th>
                <th>Market</th>
                <th>DM NAME</th>
                <th>Type</th>
                <th>IMEI</th>
                <th className="rma-col-right">Devices</th>
                <th className="rma-col-right">Cost</th>
                <th>Days</th>
                <th>Assurant Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDetailedData.map((row, index) => {
                const processedDate = getField(row, [
                  "Processed Date",
                  "ProcessedDate",
                ]);
                const market = getField(row, ["Market", "Market Name"]);
                const dm = getField(row, ["DM NAME", "DM Name"]);
                const type = getField(row, ["Type", "TYPE"]);
                const imei = getField(row, [
                  "Customer IMEI",
                  "IMEI",
                  "imei",
                  "CUSTOMER IMEI",
                ]);
                const devices = countNonEmptyIMEI(row);
                const cost = formatCurrency(
                  parseCurrency(getField(row, ["COST", "Cost"]))
                );
                const days = getField(row, ["Days", "DAY", "day"]);
                const assurant = getField(row, [
                  "Assurant Status",
                  "Assurant_STATUS",
                  "Assurant",
                  "assurant",
                ]);

                return (
                  <tr key={index}>
                    <td>{processedDate}</td>
                    <td>{market}</td>
                    <td>{dm}</td>
                    <td>{type}</td>
                    <td>{imei}</td>
                    <td className="rma-col-right">{devices}</td>
                    <td className="rma-col-right">{cost}</td>
                    <td>
                      {days && days !== "Unknown" && (
                        <span className="rma-days-pill">{days}</span>
                      )}
                    </td>
                    <td>{assurant}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* No data message */}
          {paginatedDetailedData.length === 0 && (
            <div className="no-data">
              {searchTerm
                ? `No RMA records found matching "${searchTerm}"`
                : "No RMA records found matching your criteria."
              }
            </div>
          )}
        </div>

        {/* Pagination - Only show when needed */}
        {shouldShowPagination && (
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
            <div className="logo">📊</div>
            <div className="title">
              <div className="main">RMA Dashboard</div>
              <div className="sub">
                Return Merchandise Authorization analytics and reports
              </div>
            </div>
          </div>
        </header>

        <main className="main-area">
          {/* Controls Section with Filters on Left and Buttons on Right */}
          <div className="rma-controls-section">
            <div className="rma-controls-grid">
              {/* FILTERS ON LEFT SIDE */}
              <div className="rma-date-inputs">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="rma-input"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="rma-input"
                  placeholder="To Date"
                />
              </div>

              {/* BUTTONS ON RIGHT SIDE */}
              <div className="rma-action-buttons">
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
          {/* <section className="dashboard-grid">
            {summaryCards.map((card, index) => (
              <div key={index} className="dashboard-card card-purple">
                <div className="card-icon">{card.icon || (index === 0 ? "🏷️" : index === 1 ? "📱" : "💰")}</div>
                <div className="card-content">
                  <h3 className="card-title">{card.label}</h3>
                  <p className="card-description">{card.value}</p>
                </div>
              </div>
            ))}
          </section> */}

          {/* Search Bar */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Region, Market, DM, Type, IMEI..."
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
          <div className="rma-nav-row">
            <button
              className={`btn ${historyStack.length <= 1 ? 'hidden' : ''}`}
              onClick={handleBackClick}
            >
              ← Back
            </button>
            <div className="rma-breadcrumb">
              {renderBreadcrumb()}
            </div>
          </div>

          <section className="rma-stacked">
            {currentView === "regions" &&
              renderTable(currentData, "regions", handleRegionClick)}
            {currentView === "market" &&
              renderTable(currentData, "market", handleMarketClick)}
            {currentView === "dm" &&
              renderTable(currentData, "dm", handleDMClick)}
            {currentView === "type" &&
              renderTable(currentData, "type", handleTypeClick)}
            {currentView === "detailed" && renderDetailedTable(currentData)}
          </section>

          {/* Loading State */}
          {isLoadingData && (
            <div className="rma-loading">
              <div className="loading-spinner"></div>
              <p>Loading data...</p>
            </div>
          )}

          <section className="dashboard-grid">
            {summaryCards.map((card, index) => (
              <div key={index} className="dashboard-card card-purple">
                <div className="card-icon">
                  {index === 0 ? "🏷️" : index === 1 ? "📱" : "💰"}
                </div>
                <div className="card-content">
                  <h3 className="card-title">{card.label}</h3>
                  <p className="card-description">{card.value}</p>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );

  function handleCountClick(
    group: AggregatedGroup,
    filterType: "rma" | "xbm" | "tradeIn",
    daysRange: "7" | "14" | "14Plus"
  ) {
    // Filter group's rows by record type and days range
    const rows = (group.rows || []).filter((record) => {
      const rawType = getField(record, ["RecordType", "Record Type", "Type", "TYPE", "type"]).toLowerCase();
      let matchesType = false;
      if (filterType === "rma") matchesType = rawType.includes("rma");
      else if (filterType === "xbm") matchesType = rawType.includes("xbm");
      else if (filterType === "tradeIn") matchesType = rawType.includes("trade");

      if (!matchesType) return false;

      const daysVal = getField(record, ["Days", "DAY", "day"]);
      const daysNum = parseInt(String(daysVal).replace(/[^0-9\-]/g, ""));
      if (isNaN(daysNum)) return false;

      if (daysRange === "7") return daysNum <= 7;
      if (daysRange === "14") return daysNum > 7 && daysNum <= 14;
      return daysNum > 14;
    });

    setCurrentData(rows);
    setCurrentView("detailed");
    setHistoryStack([
      { level: "Regions" },
      { level: "Selected", selected: group.key },
      { level: "Filtered", selected: `${filterType.toUpperCase()} • ${daysRange}` },
    ]);
    setSelectedType(`${filterType.toUpperCase()} • ${daysRange}`);
    setSearchTerm("");
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}