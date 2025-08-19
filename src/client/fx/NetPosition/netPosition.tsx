import React, { useEffect, useState, useMemo } from "react";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { Download, Trash2 } from "lucide-react";
import Layout from "../../common/Layout";
import "../../styles/theme.css";
import MaturityTable from "./MaturityTable";
import LoadingSpinner from "../../ui/LoadingSpinner";
import axios from "axios";
import DetailedViews from "./DetailedViews.tsx";

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

export const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(2);
};

const MATURITY_ORDER: Record<string, number> = {
  "1 Month": 1,
  "2 Month": 2,
  "3 Month": 3,
  "4 Month": 4,
  "4-6 Month": 4,
  "6 Month +": 6,
};

function normalizeMaturity(maturity: string): string {
  if (maturity === "4 Month") return "4 Month";
  if (maturity === "4-6 Month") return "4 Month";

  if (
    /^([7-9]|[1-9][0-9]+) Month$/.test(maturity) ||
    ["6 Month +", "6+ Month", "Greater than 6 Month"].includes(maturity)
  ) {
    return "6 Month +";
  }
  return maturity;
}

const isRowEmpty = (row: NetExposureCurrency): boolean =>
  !row.payable && !row.receivable && !row.forwardBuy && !row.forwardSell;

const NetExposure: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [exposureData, setExposureData] = useState<ApiExposureData[]>([]);
  const [forwardData, setForwardData] = useState<ApiForwardData[]>([]);
  const [selectedBU, setSelectedBU] = useState<string>("All");
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const mergedData = useMemo<NetExposureCurrency[]>(() => {
    const result: NetExposureCurrency[] = [];

    exposureData.forEach((expItem) => {
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

  const filteredData = useMemo(
    () =>
      selectedBU === "All"
        ? mergedData
        : mergedData.filter((d) => d.bu === selectedBU),
    [mergedData, selectedBU]
  );

  const buOptions = useMemo(
    () => ["All", ...new Set(mergedData.map((d) => d.bu))].sort(),
    [mergedData]
  );

  const groupedDataByMaturity = useMemo(() => {
    const groups: Record<string, NetExposureCurrency[]> = {};
    filteredData.forEach((row) => {
      (groups[row.maturity] ||= []).push(row);
    });

    return Object.fromEntries(
      Object.entries(groups).sort(
        ([a], [b]) => (MATURITY_ORDER[a] || 999) - (MATURITY_ORDER[b] || 999)
      )
    );
  }, [filteredData]);

  useEffect(() => {
    if (!filteredData.length) return;
    const map: Record<string, boolean> = {};
    Object.entries(groupedDataByMaturity).forEach(([mat, rows]) => {
      map[mat] = !rows.every(isRowEmpty);
    });
    setExpandedMap(map);
    setIsLoading(false);
  }, [filteredData, groupedDataByMaturity]);

  const toggleExpand = (mat: string) =>
    setExpandedMap((prev) => ({ ...prev, [mat]: !prev[mat] }));

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);

      axios
        .get(
          "https://backend-slqi.onrender.com/api/exposureUpload/netanalysis-joined"
        )
        .then((response) => {
          console.log("Exposure API data:", response.data);

          const data = Array.isArray(response.data)
            ? response.data.map((item) => ({
                bu: item.business_unit,
                maturity: normalizeMaturity(item.maturity),
                currency: item.currency,
                payable: Number(item.payables) || 0,
                receivable: Number(item.receivables) || 0,
              }))
            : [];

          setExposureData(data);
        })
        .catch((error) => {
          console.error("Error fetching exposure data:", error);
          setExposureData([]);
        });

      axios
        .get(
          "https://backend-slqi.onrender.com/api/forwardDash/bu-maturity-currency-summary"
        )
        .then((response) => {
          setForwardData(response.data);
        })
        .catch((error) => {
          console.error("Error fetching forward data:", error);
          setForwardData([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    fetchData();
  }, []);

  const maturityList = useMemo(() => {
    const maturities = new Set(filteredData.map((item) => item.maturity));
    return Array.from(maturities).sort(
      (a, b) => (MATURITY_ORDER[a] || 999) - (MATURITY_ORDER[b] || 999)
    );
  }, [filteredData]);

  const exposureByMaturity = useMemo(
    () =>
      maturityList.map((m) => ({
        maturity: m,
        payable: filteredData
          .filter((d) => d.maturity === m)
          .reduce((a, r) => a + r.payable, 0),
        receivable: filteredData
          .filter((d) => d.maturity === m)
          .reduce((a, r) => a + r.receivable, 0),
      })),
    [maturityList, filteredData]
  );

  const forwardByMaturity = useMemo(
    () =>
      maturityList.map((m) => ({
        maturity: m,
        forwardBuy: filteredData
          .filter((d) => d.maturity === m)
          .reduce((a, r) => a + r.forwardBuy, 0),
        forwardSell: filteredData
          .filter((d) => d.maturity === m)
          .reduce((a, r) => a + r.forwardSell, 0),
      })),
    [maturityList, filteredData]
  );

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
              key={
                maturity +
                "-" +
                rows.map((r) => r.bu + "-" + r.currency).join("-")
              }
              maturity={`Maturity : ${maturity}`}
              rows={rows}
              expanded={expandedMap[maturity] || false}
              toggleExpand={() => toggleExpand(maturity)}
            />
          ))}

          {/* Grand totals table */}
          <div className="mb-6 overflow-x-auto">
            <table className="min-w-full mt-8 text-sm text-center">
              <thead className="font-semibold text-secondary-text">
                <tr>
                  <th className="px-4 py-2 border border-border bg-primary-xl text-secondary-text">
                    Grand Total (All Months)
                  </th>
                  <th className="px-4 py-2 border border-border bg-primary-xl text-secondary-text">
                    Payable
                  </th>
                  <th className="px-4 py-2 border border-border bg-primary-xl text-secondary-text">
                    Receivable
                  </th>
                  <th className="px-4 py-2 border border-border bg-primary-xl text-secondary-text">
                    Net (R - P)
                  </th>
                  <th className="px-4 py-2 border border-border bg-primary-xl text-secondary-text">
                    Forward Buy
                  </th>
                  <th className="px-4 py-2 border border-border bg-primary-xl text-secondary-text">
                    Forward Sell
                  </th>
                  <th className="px-4 py-2 border border-border bg-primary-xl text-secondary-text">
                    Net (B - S)
                  </th>
                  <th className="px-4 py-2 border border-border bg-primary-xl text-secondary-text">
                    Diff (Net Exp - Net Fwd)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border bg-secondary-color-lt text-primary-lt font-semibold border-border">
                    Grand Total
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt border-border">
                    {formatCurrency(grandTotals.payable)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt border-border">
                    {formatCurrency(grandTotals.receivable)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt border-border">
                    {formatCurrency(netExp)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt border-border">
                    {formatCurrency(grandTotals.forwardBuy)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt border-border">
                    {formatCurrency(grandTotals.forwardSell)}
                  </td>
                  <td className="px-4 py-2 border bg-secondary-color-lt border-border">
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
                    <th className="px-2 py-1 border border-border text-secondary-text bg-primary-xl">
                      Type
                    </th>
                    {exposureByMaturity.map((row) => (
                      <th
                        key={row.maturity}
                        className="px-2 py-1 border text-secondary-text border-border bg-primary-xl"
                      >
                        {row.maturity}
                      </th>
                    ))}
                    <th className="px-2 py-1 border border-border bg-primary-xl">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {["Payable", "Receivable"].map((type) => (
                    <tr key={type}>
                      <td className="px-2 py-1 border border-border bg-white">{type}</td>
                      {exposureByMaturity.map((row) => (
                        <td
                          key={`${type}-${row.maturity}`}
                          className="px-2 py-1 border border-border bg-white"
                        >
                          {formatCurrency(
                            type === "Payable" ? row.payable : row.receivable
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1 border font-semibold border-border bg-white">
                        {formatCurrency(
                          type === "Payable"
                            ? grandTotals.payable
                            : grandTotals.receivable
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-primary-lg">
                    <td className="px-2 py-1 border border-border bg-primary-lt text-white">Total</td>
                    {exposureByMaturity.map((row) => (
                      <td
                        key={`total-${row.maturity}`}
                        className="px-2 py-1 border border-border bg-primary-lt text-white"
                      >
                        {formatCurrency(row.payable + row.receivable)}
                      </td>
                    ))}
                    <td className="px-2 py-1 border font-bold border-border bg-primary-lt text-white">
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
                    <th className="px-2 py-1 border border-border text-secondary-text bg-primary-xl">
                      Type
                    </th>
                    {forwardByMaturity.map((row) => (
                      <th
                        key={row.maturity}
                        className="px-2 py-1 border text-secondary-text border-border bg-primary-xl"
                      >
                        {row.maturity}
                      </th>
                    ))}
                    <th className="px-2 py-1 border border-border bg-primary-xl">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {["Buy", "Sell"].map((type) => (
                    <tr key={type}>
                      <td className="px-2 py-1 border border-border bg-white">{type}</td>
                      {forwardByMaturity.map((row) => (
                        <td
                          key={`${type}-${row.maturity}`}
                          className="px-2 py-1 border border-border bg-white"
                        >
                          {formatCurrency(
                            type === "Buy" ? row.forwardBuy : row.forwardSell
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-1 border font-semibold border-border bg-white">
                        {formatCurrency(
                          type === "Buy"
                            ? grandTotals.forwardBuy
                            : grandTotals.forwardSell
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-primary-lg">
                    <td className="px-2 py-1 border border-border bg-primary-lt text-white">Total</td>
                    {forwardByMaturity.map((row) => (
                      <td
                        key={`total-${row.maturity}`}
                        className="px-2 py-1 border border-border bg-primary-lt text-white"
                      >
                        {formatCurrency(row.forwardBuy + row.forwardSell)}
                      </td>
                    ))}
                    <td className="px-2 py-1 border font-bold border-border bg-primary-lt text-white">
                      {formatCurrency(
                        grandTotals.forwardBuy + grandTotals.forwardSell
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <DetailedViews />
        </div>
      </Layout>
    </>
  );
};

export default NetExposure;
