import * as XLSX from "xlsx";
import { isLikelyDate, formatToDDMMYYYY } from "./dateUtils";

const parseExcel = (arrayBuffer: ArrayBuffer): string[][] => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    const filteredData = data
      .filter((row) =>
        row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
      )
      .map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          if (rowIdx === 0) return String(cell || "").trim();
          if (isLikelyDate(cell)) return formatToDDMMYYYY(cell);
          return String(cell || "").trim();
        })
      );

    return filteredData;
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error(
      "Failed to parse Excel file. Please ensure it's a valid Excel file."
    );
  }
};

export default parseExcel;