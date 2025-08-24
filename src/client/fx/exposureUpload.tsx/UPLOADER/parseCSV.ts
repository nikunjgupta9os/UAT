import { isLikelyDate, formatToDDMMYYYY } from "./dateUtils";

const parseCSV = (text: string): string[][] => {
  const lines = text.split("\n").filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        let value = current.trim().replace(/^"|"$/g, "");
        if (isLikelyDate(value)) {
          value = formatToDDMMYYYY(value);
        }
        result.push(value);
        current = "";
      } else {
        current += char;
      }
    }
    let value = current.trim().replace(/^"|"$/g, "");
    if (isLikelyDate(value)) {
      value = formatToDDMMYYYY(value);
    }
    result.push(value);
    return result;
  });
};

export default parseCSV;