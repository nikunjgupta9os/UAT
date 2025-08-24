import * as XLSX from "xlsx";

const handleDownload = (template: any, format: "csv" | "xlsx") => {
  let headers: string[] = [];
  let sampleRow: string[] = [];

  if (template.id === "po") {
    headers = [
      "company_code",
      "controlling_area",
      "entity",
      "entity1",
      "entity2",
      "document_no",
      "lc_indicator",
      "lc_year",
      "contract_date",
      "reference_no",
      "reference_date",
      "vendor_code",
      "vendor_name",
      "price_basis",
      "currency_code",
      "payment_terms",
      "inco_terms",
      "destination_port",
      "payment_to_vendor",
      "uom_code",
      "uom_quantity",
      "net_price",
      "net_value",
      "exchange_rate",
      "exchange_rate_date",
      "documenting",
      "profit_cost_center",
      "entity3",
    ];
    sampleRow = [
      "COMP001",
      "CA01",
      "ENT01",
      "ENT1_001",
      "ENT2_001",
      "DOC001",
      "Y",
      "2024",
      "15-01-2024",
      "REF001",
      "10-01-2024",
      "VEN001",
      "Vendor ABC Ltd",
      "CIF",
      "USD",
      "NET30",
      "FOB",
      "Mumbai Port",
      "1000000",
      "PCS",
      "100",
      "50.00",
      "5000.00",
      "1.0",
      "15-01-2024",
      "DOC_001",
      "CC001",
      "ENT3_001",
    ];
  } else if (template.id === "lc") {
    headers = [
      "system_lc_number",
      "bank_reference_number",
      "other_references",
      "lc_type",
      "applicant_name",
      "beneficiary_name",
      "issuing_bank",
      "currency",
      "amount",
      "issue_date",
      "expiry_date",
      "linked_po_so_number",
    ];
    sampleRow = [
      "LC001",
      "BANK001",
      "REF001",
      "COMMERCIAL",
      "ABC Company Ltd",
      "XYZ Supplier Inc",
      "Standard Bank",
      "USD",
      "100000",
      "15-01-2024",
      "15-06-2024",
      "PO001",
    ];
  } else if (template.id === "grn") {
    headers = [
      "account",
      "company_code",
      "business_area",
      "document_type",
      "customer",
      "assignment",
      "document_number",
      "document_date",
      "posting_date",
      "supplier",
      "reference",
      "amount_in_doc_curr",
      "document_currency",
      "amount_in_local_currency",
      "text",
      "clearing_document",
      "clearing_date",
      "special_gl_ind",
      "offsetting_account",
      "currency_2",
      "company",
      "loaded_at",
      "linked_id",
    ];
    sampleRow = [
      "1000",
      "COMP001",
      "BA01",
      "GR",
      "CUST001",
      "ASSIGN001",
      "DOC001",
      "15-01-2024",
      "15-01-2024",
      "VEN001",
      "REF001",
      "1000",
      "USD",
      "750000",
      "Goods Receipt",
      "CLEAR001",
      "15-01-2024",
      "S",
      "1000",
      "USD",
      "COMP001",
      "2024-08-18T12:00:00Z",
      "LINK123",
    ];
  } else if (template.id === "creditor") {
    headers = [
      "payment_block",
      "company_code",
      "business_area",
      "account",
      "pann",
      "gl_account",
      "document_date",
      "net_due_date",
      "posting_date",
      "document_type",
      "posting_key",
      "amount_in_doc_curr",
      "document_currency",
      "local_currency",
      "currency_2",
      "bank_reference",
      "linked_id",
      "company",
    ];
    sampleRow = [
      "N",
      "7000",
      "CHEN",
      "2000001",
      "PAN123456789",
      "400000",
      "15-01-2024",
      "30-01-2024",
      "15-01-2024",
      "KR",
      "31",
      "100000.00",
      "USD",
      "USD",
      "USD",
      "BANKREF001",
      "LINK123",
      "TACO",
    ];
  } else if (template.id === "debtors") {
    headers = [
      "reference",
      "company_code",
      "assignment",
      "document_number",
      "net_due_date",
      "document_type",
      "document_date",
      "posting_date",
      "special_gl_ind",
      "amount_in_local_currency",
      "amount_in_doc_curr",
      "document_currency",
      "text",
      "customer",
      "clearing_document",
      "gl_account",
      "currency_2",
      "company",
      "bank_reference",
      "linked_id",
    ];
    sampleRow = [
      "REF001",
      "7000",
      "ASSIGN001",
      "7050000252",
      "30-01-2024",
      "DR",
      "15-01-2024",
      "15-01-2024",
      "A",
      "150000.00",
      "150000.00",
      "USD",
      "Customer payment received",
      "CUST001",
      "CLEAR001",
      "130000",
      "USD",
      "ABC Company Ltd",
      "BANKREF002",
      "LINK123",
    ];
  } else {
    headers = [
      "company_code",
      "controlling_area",
      "entity",
      "entity1",
      "entity2",
      "entity3",
      "document_no",
      "document_type",
      "contract_date",
      "reference_no",
      "reference_date",
      "customer_code",
      "customer_name",
      "currency_code",
      "price_basis",
      "payment_terms",
      "inco_terms",
      "total_invoice_value",
      "last_lot_number",
      "product_description",
      "uom_code",
      "uom_quantity",
      "net_price",
      "net_value",
      "remarks",
      "delivery_date",
      "lc_indicator",
      "exchange_rate_preference",
      "profit_cost_center",
      "linked_id",
    ];
    sampleRow = [
      "COMP001",
      "CA01",
      "ENT01",
      "ENT1_001",
      "ENT2_001",
      "ENT3_001",
      "DOC001",
      "SO",
      "15-01-2024",
      "REF001",
      "10-01-2024",
      "CUST001",
      "Customer ABC Ltd",
      "USD",
      "CIF",
      "NET30",
      "FOB",
      "1000000",
      "LOT001",
      "Steel Products",
      "PCS",
      "100",
      "50.00",
      "5000.00",
      "Quality products",
      "15-02-2024",
      "Y",
      "FIXED",
      "CC001",
      "LIN123",
    ];
  }

  if (format === "csv") {
    const csvContent = [headers, sampleRow]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      template?.name ? `${template.name}.csv` : "Template.csv"
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const wsData = [headers, sampleRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      template?.name ? `${template.name}.xlsx` : "Template.xlsx"
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export default handleDownload;