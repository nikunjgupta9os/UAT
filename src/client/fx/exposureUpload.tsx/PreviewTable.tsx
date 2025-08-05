
import React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { X } from "lucide-react";
import NyneOSTable from "./ReusableTable"; // Adjust import path as needed

interface PreviewTableProps {
  headers: string[];
  rows: string[][];
  onRemoveRow: (index: number) => void;
  onUpdateRow?: (rowIndex: number, updatedData: Record<string, any>) => void;
}

interface PreviewRowData {
  exposure_header_id: string; // Required by EditableRowData
  id: string;
  originalIndex: number;
  [key: string]: any;
}

const PreviewTable: React.FC<PreviewTableProps> = ({
  headers,
  rows,
  onRemoveRow,
  onUpdateRow,
}) => {
  // Transform rows data into format expected by NyneOSTable
  const data: PreviewRowData[] = React.useMemo(() => {
    return rows.map((row, index) => {
      const obj: PreviewRowData = {
        id: `row_${index}`,
        exposure_header_id: `preview_row_${index}`, // Required by EditableRowData
        originalIndex: index,
      };
      
      // Add each column value with proper key
      row.forEach((value, colIndex) => {
        obj[`col_${colIndex}`] = value || "";
      });
      
      return obj;
    });
  }, [rows]);

  // Determine which columns should be visible by default (first 4 columns + actions)
  const defaultVisibility = React.useMemo(() => {
    const visibility: Record<string, boolean> = {};
    headers.forEach((_, index) => {
      visibility[`col_${index}`] = index < 4; // Show first 4 columns
    });
    visibility["remove"] = true;
    visibility["actions"] = false; // Always show actions
 // Always show actions
    return visibility;
  }, [headers]);

  const expandedRowConfig = React.useMemo(() => {
    if (headers.length === 0) return undefined;

    const capitalize = (str: string) =>
      str
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

    const allColumns = headers.map((header, index) => ({ header, index }));

    return {
      sections: [
        {
          title: "All Columns",
          fields: allColumns.map(({ index }) => `col_${index}`),
        },
      ],
      fieldLabels: allColumns.reduce((acc, { header, index }) => {
        acc[`col_${index}`] = capitalize(header) || `Column ${index + 1}`;
        return acc;
      }, {} as Record<string, string>),
      editableFields: allColumns.map(({ index }) => `col_${index}`), // Make all fields editable
    };
  }, [headers]);

  // Handle row updates from the table
  const handleRowUpdate = React.useCallback(async (exposureHeaderId: string, updatedFields: Record<string, any>) => {
    if (!onUpdateRow) return true;

    // Extract the row index from the exposure_header_id
    const rowIndex = parseInt(exposureHeaderId.replace('preview_row_', ''));
    
    if (isNaN(rowIndex)) return false;

    try {
      onUpdateRow(rowIndex, updatedFields);
      return true;
    } catch (error) {
      console.error('Error updating row:', error);
      return false;
    }
  }, [onUpdateRow]);





  // Generate columns based on headers
  const columns: ColumnDef<PreviewRowData>[] = React.useMemo(() => {
    const dataColumns = headers.map((header, index) => ({
      id: `col_${index}`,
      accessorKey: `col_${index}`,
      header: () => (
        <span
          className={`font-semibold ${
            !header.trim() ? "text-red-500" : "text-gray-700"
          }`}
        >
          {header.trim() || `Missing Header (${index + 1})`}
        </span>
      ),
      cell: ({ getValue }: { getValue: () => any }) => {
        const value = getValue() as string;
        const isMissing =
          !value || value.trim() === "" || value.trim() === '""';
        return (
          <span
            className={`text-sm ${
              isMissing 
                ? "bg-red-100 text-red-800 px-2 py-1 rounded italic" 
                : "text-gray-900"
            }`}
          >
            {isMissing ? "Missing" : value}
          </span>
        );
      },
    }));

    // Add actions column
    const actionsColumn: ColumnDef<PreviewRowData> = {
      id: "remove",
      header: () => (
        <div className="flex items-center justify-center">
          <span className="text-gray-700 font-semibold">Actions</span>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors duration-150"
            onClick={() => onRemoveRow(row.original.originalIndex)}
            aria-label="Remove row"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ),
    };

    return [...dataColumns, actionsColumn];
  }, [headers, onRemoveRow]);

  // Show empty state if no data
  if (!headers.length || !rows.length) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="text-center py-12 text-gray-500">
            <div className="flex flex-col items-center">
              <p className="text-lg font-medium text-gray-900 mb-1">
                No data to preview
              </p>
              <p className="text-sm text-gray-500">
                Upload a file or add data to see the preview.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

    return (
      <div className="space-y-4">
        <NyneOSTable<PreviewRowData>
          data={data}
          columns={columns}
          defaultColumnVisibility={defaultVisibility}
          expandedRowConfig={expandedRowConfig}
          className="max-h-[500px]"
          edit={true}
          onUpdate={handleRowUpdate}
        />      {/* Footer with row count info */}
      <div className="bg-gray-50 px-6 py-3 border border-gray-200 rounded-xl">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {rows.length > 50 
              ? `Showing first 50 rows of ${rows.length} total rows`
              : `Showing ${rows.length} row${rows.length !== 1 ? 's' : ''}`
            }
          </span>
          <span className="text-xs text-gray-500">
            {headers.length} column{headers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PreviewTable;
