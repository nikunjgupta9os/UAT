import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, `${filename}.xlsx`);
};

export const exportToPDF = (
  data: any[],
  filename: string,
  columns: any[],
  fxType?: string
) => {
  try {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    const title = fxType ? `FX ${fxType} Report` : 'FX Report';
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Title Bar
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(title, pageWidth / 2, 14, { align: 'center' });

    // Sub-header
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Date: ${dateString}`, 14, 24);
    doc.text(`Total Records: ${data.length}`, pageWidth - 40, 24, { align: 'right' });

    // Filter only present columns
    const presentColumns = columns.filter(col => {
      const key = col.accessorKey || col.id;
      return data.some(item => Object.prototype.hasOwnProperty.call(item, key));
    });

    // Split columns into chunks of 12
    const chunkSize = 12;
    for (let i = 0; i < presentColumns.length; i += chunkSize) {
      const chunk = presentColumns.slice(i, i + chunkSize);

      const headers = chunk.map(col =>
        col.header || (col.columnDef?.header) || col.accessorKey || col.id
      );

      const formattedData = data.map(item =>
        chunk.map(col => {
          const key = col.accessorKey || col.id;
          let value = item[key];
          if (value === undefined || value === null) return '';
          if (typeof value === 'string' && value.match(/\d{4}-\d{2}-\d{2}/)) {
            return new Date(value).toLocaleDateString();
          }
          return String(value);
        })
      );

      autoTable(doc, {
        startY: i === 0 ? 32 : undefined,
        head: [headers],
        body: formattedData,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left',
          valign: 'middle',
          minCellWidth: 20,
          textColor: [33, 33, 33],
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: {
          top: i === 0 ? 32 : 10,
          left: 8,
          right: 8,
        },
        tableWidth: 'auto',
        didDrawPage: (dataArg) => {
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${dataArg.pageNumber}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        },
      });

      // Add a page if more column chunks are left
      if (i + chunkSize < presentColumns.length) {
        doc.addPage();
      }
    }

    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error("PDF export error:", error);
    alert("Failed to export PDF. Check console for details.");
  }
};

