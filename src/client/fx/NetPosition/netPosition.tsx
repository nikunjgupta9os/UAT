import React, { useEffect, useState, useMemo } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Download, Trash2 } from "lucide-react";
import Layout from "../../common/Layout";
import "../../styles/theme.css";
import MaturityTable from "./MaturityTable";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { formatCurrency } from "./MaturityTable";
import DetailedViews from "./DetailedViews.tsx";
import axios from "axios";

export interface NetExposureCurrency {
  bu: string;
  maturity: string;
  currency: string;
  payable: number;
  receivable: number;
  forwardBuy: number;
  forwardSell: number;
}

interface ApiExposureData {
  bu: string;
  maturity: string;
  currency: string;
  payable: number;
  receivable: number;
}

interface ApiForwardData {
  bu: string;
  maturity: string;
  currency: string;
  forwardBuy: number;
  forwardSell: number;
}


async function fetchForwardData(): Promise<ApiForwardData[]> {
  try {
    const response = await axios.get<ApiForwardData[]>(
      "https://backend-slqi.onrender.com/api/forwardDash/bu-maturity-currency-summary"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching forward data:", error);
    return [];
  }
}

const MATURITY_ORDER: Record<string, number> = {
  "1 Month": 1,
  "2 Month": 2,
  "3 Month": 3,
  "4-6 Month": 4,
  "6 Month +": 5,
};

// Normalize maturity values to match MATURITY_ORDER keys
function normalizeMaturity(maturity: string): string {
  if (maturity === "4 Month") return "4-6 Month";
  if (maturity === "4-6 Month") return "4-6 Month";
  // Normalize any maturity greater than 6 months to '6 Month +'
  if (
    /^([7-9]|[1-9][0-9]+) Month$/.test(maturity) ||
    maturity === "6 Month +" ||
    maturity === "6+ Month" ||
    maturity === "Greater than 6 Month"
  ) {
    return "6 Month +";
  }
  return maturity;
}

async function fetchExposureData(): Promise<ApiExposureData[]> {
  try {
    const response = await axios.get(
      "https://backend-slqi.onrender.com/api/exposureUpload/netanalysis-joined"
    );
    console.log("Exposure API data:", response.data);

    // Map API keys to expected keys and normalize maturity
    const data = Array.isArray(response.data)
      ? response.data.map((item) => ({
          bu: item.business_unit,
          maturity: normalizeMaturity(item.maturity),
          currency: item.currency,
          payable: Number(item.payables) || 0,
          receivable: Number(item.receivables) || 0,
        }))
      : [];

    return data;
  } catch (error) {
    console.error("Error fetching exposure data:", error);
    return [];
  }
}


const NetExposure: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [exposureData, setExposureData] = useState<ApiExposureData[]>([]);
  const [forwardData, setForwardData] = useState<ApiForwardData[]>([]);
  const [selectedBU, setSelectedBU] = useState<string>("All");
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Merge exposure and forward data
  const mergedData = useMemo<NetExposureCurrency[]>(() => {
    const result: NetExposureCurrency[] = [];

    // Process exposure data
    exposureData.forEach((expItem) => {
      // Find matching forward data
      const forwardItem = forwardData.find(
        (fwd) =>
          fwd.bu === expItem.bu &&
          fwd.maturity === expItem.maturity &&
          fwd.currency === expItem.currency
      );

      result.push({
        bu: expItem.bu,
        maturity: expItem.maturity,
        currency: expItem.currency,
        payable: expItem.payable,
        receivable: expItem.receivable,
        forwardBuy: forwardItem?.forwardBuy || 0,
        forwardSell: forwardItem?.forwardSell || 0,
      });
    });

    // Add forward data that doesn't have exposure entries
    forwardData.forEach((fwdItem) => {
      const exists = exposureData.some(
        (exp) =>
          exp.bu === fwdItem.bu &&
          exp.maturity === fwdItem.maturity &&
          exp.currency === fwdItem.currency
      );

      if (!exists) {
        result.push({
          bu: fwdItem.bu,
          maturity: fwdItem.maturity,
          currency: fwdItem.currency,
          payable: 0,
          receivable: 0,
          forwardBuy: fwdItem.forwardBuy,
          forwardSell: fwdItem.forwardSell,
        });
      }
    });

    return result;
  }, [exposureData, forwardData]);

  // Filter data by selected BU
  const filteredData = useMemo(() => {
    if (selectedBU === "All") return mergedData;
    return mergedData.filter((item) => item.bu === selectedBU);
  }, [mergedData, selectedBU]);

  // Get unique BUs for dropdown
  const buOptions = useMemo(() => {
    const bus = new Set(mergedData.map((item) => item.bu));
    return ["All", ...Array.from(bus)].sort();
  }, [mergedData]);

  // Group data by Maturity only (sorted)
  const groupedDataByMaturity = useMemo(() => {
    const result: Record<string, NetExposureCurrency[]> = {};

    filteredData.forEach((row) => {
      if (!result[row.maturity]) result[row.maturity] = [];
      result[row.maturity].push(row);
    });

    // Sort maturities and return sorted object
    const sortedMaturities = Object.keys(result).sort(
      (a, b) => (MATURITY_ORDER[a] || 999) - (MATURITY_ORDER[b] || 999)
    );

    const sortedGroup: Record<string, NetExposureCurrency[]> = {};
    sortedMaturities.forEach((maturity) => {
      sortedGroup[maturity] = result[maturity];
    });

    return sortedGroup;
  }, [filteredData]);

  // Helper: check if a row is 'empty' (all numeric values are zero/null/undefined)
  function isRowEmpty(row: NetExposureCurrency) {
    return (
      (!row.payable || row.payable === 0) &&
      (!row.receivable || row.receivable === 0) &&
      (!row.forwardBuy || row.forwardBuy === 0) &&
      (!row.forwardSell || row.forwardSell === 0)
    );
  }

  // Initialize expanded state: collapse tables if all rows are 'empty'
  useEffect(() => {
    if (filteredData.length > 0) {
      const newExpandedMap: Record<string, boolean> = {};
      Object.entries(groupedDataByMaturity).forEach(([maturity, rows]) => {
        // Collapse if all rows are empty
        const allRowsEmpty = rows.length === 0 || rows.every(isRowEmpty);
        newExpandedMap[maturity] = !allRowsEmpty;
      });
      setExpandedMap(newExpandedMap);
      setIsLoading(false);
    }
  }, [filteredData, groupedDataByMaturity]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [exposure, forward] = await Promise.all([
          fetchExposureData(),
          fetchForwardData(),
        ]);
        setExposureData(exposure);
        setForwardData(forward);
      } catch (error) {
        console.error("Error fetching exposure or forward data:", error);
      }
    };

    fetchData();
  }, []);

  const toggleExpand = (maturity: string) => {
    setExpandedMap((prev) => ({ ...prev, [maturity]: !prev[maturity] }));
  };

  // Get unique maturities for summary tables (sorted)
  const maturityList = useMemo(() => {
    const maturities = new Set(filteredData.map((item) => item.maturity));
    return Array.from(maturities).sort(
      (a, b) => (MATURITY_ORDER[a] || 999) - (MATURITY_ORDER[b] || 999)
    );
  }, [filteredData]);

  // Exposure summary
  const exposureByMaturity = useMemo(() => {
    return maturityList.map((mat) => {
      const filtered = filteredData.filter((d) => d.maturity === mat);
      const payable = filtered.reduce((acc, r) => acc + r.payable, 0);
      const receivable = filtered.reduce((acc, r) => acc + r.receivable, 0);
      return { maturity: mat, payable, receivable };
    });
  }, [maturityList, filteredData]);

  // Forward summary
  const forwardByMaturity = useMemo(() => {
    return maturityList.map((mat) => {
      const filtered = filteredData.filter((d) => d.maturity === mat);
      const forwardBuy = filtered.reduce((acc, r) => acc + r.forwardBuy, 0);
      const forwardSell = filtered.reduce((acc, r) => acc + r.forwardSell, 0);
      return { maturity: mat, forwardBuy, forwardSell };
    });
  }, [maturityList, filteredData]);

  // Grand totals
  const grandTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc.payable += row.payable;
        acc.receivable += row.receivable;
        acc.forwardBuy += row.forwardBuy;
        acc.forwardSell += row.forwardSell;
        return acc;
      },
      { payable: 0, receivable: 0, forwardBuy: 0, forwardSell: 0 }
    );
  }, [filteredData]);

  const netExp = grandTotals.receivable - grandTotals.payable;
  const netFwd = grandTotals.forwardBuy - grandTotals.forwardSell;
  const diff = netExp - netFwd;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Layout title="Net Exposure Dashboard">
        <div className="p-4 max-w-full mx-auto">
          <h2 className="text-2xl text-secondary-text font-semibold text-center mb-6">
            Net Position Analysis: Exposure, Forwards, and Net Exposure by
            Currency and Maturity
          </h2>

          {/* BU Filter Dropdown */}
          <div className="mb-4">
            <label htmlFor="bu-filter" className="mr-2 text-secondary-text">
              Filter by Business Unit:
            </label>
            <select
              id="bu-filter"
              value={selectedBU}
              onChange={(e) => setSelectedBU(e.target.value)}
              className="px-3 py-1 bg-secondary-color text-secondary-text border border-border rounded"
            >
              {buOptions.map((bu) => (
                <option key={bu} value={bu}>
                  {bu}
                </option>
              ))}
            </select>
          </div>

          {/* Main tables */}
          {Object.entries(groupedDataByMaturity).map(([maturity, rows]) => (
            <MaturityTable
              key={maturity + '-' + rows.map(r => r.bu + '-' + r.currency).join('-')}
              maturity={`Maturity : ${maturity}`}
              rows={rows}
              expanded={expandedMap[maturity] || false}
              toggleExpand={() => toggleExpand(maturity)}
            />
          ))}

          {/* Grand totals table */}
          <div className="mb-6 overflow-x-auto">
            <table className="min-w-full mt-8 text-sm text-center">
              <thead className="font-semibold">
                <tr>
                  <th className="px-4 text-secondary-text py-2 border border-border">
                    Grand Total (All Months)
                  </th>
                  <th className="px-4 text-secondary-text py-2 border border-border">
                    Payable
                  </th>
                  <th className="px-4 text-secondary-text py-2 border border-border">
                    Receivable
                  </th>
                  <th className="px-4 text-secondary-text py-2 border border-border">
                    Net (R - P)
                  </th>
                  <th className="px-4 text-secondary-text py-2 border border-border">
                    Forward Buy
                  </th>
                  <th className="px-4 text-secondary-text py-2 border border-border">
                    Forward Sell
                  </th>
                  <th className="px-4 text-secondary-text py-2 border border-border">
                    Net (B - S)
                  </th>
                  <th className="px-4 text-secondary-text py-2 border border-border">
                    Diff (Net Exp - Net Fwd)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border bg-secondary-color-lt font-semibold text-secondary-text border-border">
                    Grand Total
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt text-secondary-text border-border">
                    {formatCurrency(grandTotals.payable)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt text-secondary-text border-border">
                    {formatCurrency(grandTotals.receivable)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt text-secondary-text border-border">
                    {formatCurrency(netExp)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt text-secondary-text border-border">
                    {formatCurrency(grandTotals.forwardBuy)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt text-secondary-text border-border">
                    {formatCurrency(grandTotals.forwardSell)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt text-secondary-text border-border">
                    {formatCurrency(netFwd)}
                  </td>
                  <td
                    className={`px-4 py-2 border bg-secondary-color-lt font-bold border-border ${
                      diff > 0
                        ? "text-green-600"
                        : diff < 0
                        ? "text-red-600"
                        : ""
                    }`}
                  >
                    {formatCurrency(diff)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 mt-10 gap-4 mb-8">
            <div className="border border-border shadow rounded p-2">
              <h3 className="text-lg py-2 tracking-wider font-semibold text-center text-primary mb-2">
                Exposure : Payable vs. Receivable by Maturity
              </h3>
              <table className="min-w-full text-center text-secondary-text text-sm bg-primary-xl">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border border-border text-secondary-text bg-primary-lg">
                      Type
                    </th>
                    {exposureByMaturity.map((row) => (
                      <th
                        key={row.maturity}
                        className="px-2 py-1 border text-secondary-text border-border bg-primary-lg"
                      >
                        {row.maturity}
                      </th>
                    ))}
                    <th className="px-2 py-1 border border-border bg-primary-lg">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {["Payable", "Receivable"].map((type) => (
                    <tr key={type}>
                      <td className="px-2 py-1 border border-border">{type}</td>
                      {exposureByMaturity.map((row) => (
                        <td
                          key={`${type}-${row.maturity}`}
                          className="px-2 py-1 border border-border"
                        >
                          {formatCurrency(
                            type === "Payable" ? row.payable : row.receivable
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1 border font-semibold border-border">
                        {formatCurrency(
                          type === "Payable"
                            ? grandTotals.payable
                            : grandTotals.receivable
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-primary-lg">
                    <td className="px-2 py-1 border border-border">Total</td>
                    {exposureByMaturity.map((row) => (
                      <td
                        key={`total-${row.maturity}`}
                        className="px-2 py-1 border border-border"
                      >
                        {formatCurrency(row.payable + row.receivable)}
                      </td>
                    ))}
                    <td className="px-2 py-1 border font-bold border-border ">
                      {formatCurrency(
                        grandTotals.payable + grandTotals.receivable
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border shadow border-border p-2">
              <h3 className="text-lg py-2 tracking-wider font-semibold text-center text-primary mb-2">
                Forwards : Buy vs. Sell by Maturity
              </h3>
              <table className="min-w-full text-center text-secondary-text text-sm bg-primary-xl">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border border-border text-secondary-text bg-primary-lg">
                      Type
                    </th>
                    {forwardByMaturity.map((row) => (
                      <th
                        key={row.maturity}
                        className="px-2 py-1 border text-secondary-text border-border bg-primary-lg"
                      >
                        {row.maturity}
                      </th>
                    ))}
                    <th className="px-2 py-1 border border-border bg-primary-lg">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {["Buy", "Sell"].map((type) => (
                    <tr key={type}>
                      <td className="px-2 py-1 border border-border">{type}</td>
                      {forwardByMaturity.map((row) => (
                        <td
                          key={`${type}-${row.maturity}`}
                          className="px-2 py-1 border border-border"
                        >
                          {formatCurrency(
                            type === "Buy" ? row.forwardBuy : row.forwardSell
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1 border font-semibold border-border">
                        {formatCurrency(
                          type === "Buy"
                            ? grandTotals.forwardBuy
                            : grandTotals.forwardSell
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-primary-lg">
                    <td className="px-2 py-1 border border-border">Total</td>
                    {forwardByMaturity.map((row) => (
                      <td
                        key={`total-${row.maturity}`}
                        className="px-2 py-1 border border-border"
                      >
                        {formatCurrency(row.forwardBuy + row.forwardSell)}
                      </td>
                    ))}
                    <td className="px-2 py-1 border font-bold border-border">
                      {formatCurrency(
                        grandTotals.forwardBuy + grandTotals.forwardSell
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* <DetailedViews /> */}
        </div>
      </Layout>
    </>
  );
};

export default NetExposure;
