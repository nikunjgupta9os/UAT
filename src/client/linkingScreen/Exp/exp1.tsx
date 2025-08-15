import { useState, useMemo, useEffect } from "react";
import CustomSelect from "../../common/SearchSelect";
import Layout from "../../common/Layout";
import Button from "../../ui/Button";
import Pagination from "../../ui/Pagination";
import axios from "axios";
import { useNotification } from "../../Notification/Notification"; // Add this import
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Link } from "lucide-react";
import { Draggable } from "../../common/Draggable";
import { Droppable } from "../../common/Droppable";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { mockLinkedSummaryData } from "../utils";
import UnlinkedExposure from "./av";
import AvailableForward from "./un";
type LinkedSummaryData = {
  srNo: number;
  exposureId: string;
  forwardId: string;
  linkedAmount: number;
  linkDate: string;
};
const nonDraggableColumns = ["srNo", "actions"];

const typeOptions = [
  { value: "", label: "Select" },
  { value: "PO", label: "PO" },
  { value: "LC", label: "LC" },
  { value: "SO", label: "SO" },
];

type TabVisibility = {
  add: boolean;
  approve: boolean;
  reject: boolean;
  edit: boolean;
};

const LinkingScreen = () => {
  const { notify } = useNotification(); // Add this hook

  // const [selectedEntity, setSelectedEntity] = useState("");
  const [entityOptions, setEntityOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "", label: "Select" }]);

  const [buOptions, setBuOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "", label: "Select" }]);

  const [currencyOptions, setCurrencyOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "", label: "Select" }]);

  // const [selectedType, setSelectedType] = useState("");

  // const [data, setData] = useState<LinkedSummaryData[]>(mockLinkedSummaryData);
  const [data, setData] = useState<LinkedSummaryData[]>([]);
  const [selectedSystemTransactionId, setSelectedSystemTransactionId] =
    useState<string | null>(null);
  const [selectedExposureHeaderId, setSelectedExposureHeaderId] = useState<
    string | null
  >(null);
  const [hedgedValue, setHedgedValue] = useState<number | null>(null);

  console.log(
    setSelectedSystemTransactionId,
    setSelectedExposureHeaderId,
    setHedgedValue
  );

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "srNo",
    "exposureId",
    "forwardId",
    "linkedAmount",
    "linkDate",
    "actions",
  ]);

  const [filters, setFilters] = useState({
    businessUnit: "",
    currency: "",
    type: "",
    bank: "",
    maturityMonths: "",
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [Visibility, setVisibility] = useState<TabVisibility>({
    add: false,
    approve: false,
    edit: false,
    reject: false,
  });
  const roleName = localStorage.getItem("userRole");

  useEffect(() => {
    const fetchLinkedSummary = async () => {
      try {
        const response = await axios.get(
          "https://backend-slqi.onrender.com/api/exposureUpload/hedgeLinksDetails"
        );

        // Type the response according to the actual API structure
        const apiResponse = response.data as Array<{
          link_id: string;
          exposure_header_id: string;
          booking_id: string;
          hedged_amount: string;
          link_date: string;
          is_active: boolean;
          document_id: string;
          internal_reference_id: string;
        }>;

        setData(
          apiResponse.map((item, index) => ({
            srNo: index + 1,
            exposureId: item.document_id,
            forwardId: item.internal_reference_id,
            linkedAmount: parseFloat(item.hedged_amount), // More precise than Number()
            // You might want to include additional fields in your table:
            exposure_Id: item.exposure_header_id,
            Booking_Id: item.booking_id,
            linkDate: new Date(item.link_date).toLocaleDateString(),
            // isActive: item.is_active ? "Active" : "Inactive"
          }))
        );
      } catch (error) {
        console.error("Failed to fetch linked summary:", error);
        setData([]);
        // Consider adding error state handling here
      }
    };

    fetchLinkedSummary();

    const fetchPermissions = async () => {
      try {
        const response = await axios.post(
          "https://backend-slqi.onrender.com/api/permissions/permissionjson",
          { roleName }
        );
        console.log("Permissions response:", response.data);
        const pages = response.data?.pages;
        const userTabs = pages?.["exposure-linkage"]?.tabs;
        //  console.log(userTabs.allTab.hasAccess);
        if (userTabs) {
          setVisibility({
            add: userTabs.default.showCreateButton || false,
            edit: userTabs.default.showEditButton || false,
            approve: userTabs.default.showApproveButton || false,
            reject: userTabs.default.showRejectButton || false,
          });
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    fetchPermissions();
  }, []); // Add dependencies here if needed (e.g., [filters] if you want to refetch when filters change)

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over?.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  function formatDate(rawDate) {
    const date = new Date(rawDate);
    if (!rawDate || isNaN(date.getTime())) {
      return "N/A"; // or return ""
    }
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  // console.log(
  //   "Selected System Transaction ID:",
  //   selectedSystemTransactionId,
  //   "Selected Exposure Header ID:",
  //   selectedExposureHeaderId,
  //   "Hedged Value:",
  //   hedgedValue
  // );

  const columns = useMemo<ColumnDef<LinkedSummaryData>[]>(
    () => [
      {
        accessorKey: "srNo",
        header: "Sr No.",
        cell: ({ row }) => (
          <span className="text-sm text-secondary-text-dark">{row.index + 1}</span>
        ),
      },

      {
        accessorKey: "exposureId",
        header: "Exposure ID",
        cell: ({ getValue }) => (
          <span className="text-sm text-secondary-text-dark">{getValue() as string}</span>
        ),
      },

      {
        accessorKey: "forwardId",
        header: "Forward ID",
        cell: ({ getValue }) => (
          <span className="text-sm text-secondary-text-dark">{getValue() as string}</span>
        ),
      },

      {
        accessorKey: "linkedAmount",
        header: "Linked Amount",
        cell: ({ getValue }) => (
          <span className="text-sm text-secondary-text-dark">{getValue() as number}</span>
        ),
      },
      {
        accessorKey: "linkDate",
        header: "Link Date",
        cell: ({ getValue }) => {
          const rawDate = getValue() as string;

          const formattedDate = formatDate(rawDate);
          return <span className="text-sm text-secondary-text-dark">{formattedDate}</span>;
        },
      },

      {
        accessorKey: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center space-x-1">
            <button className="p-1.5 text-primary hover:bg-primary-xl rounded transition-colors">
              <Link size={16} strokeWidth={2} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    state: {
      columnOrder,
      pagination,
    },
  });

  const handleLinked = async () => {
    try {
      const payload = {
        exposure_header_id: String(selectedExposureHeaderId),
        booking_id: String(selectedSystemTransactionId),
        hedged_amount: Number(hedgedValue),
      };

      // Validate input (optional but recommended)
      if (!payload.exposure_header_id || !payload.booking_id) {
        notify("Missing Exposure Header ID or Booking ID.", "error");
        return;
      }

      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/forwards/exposure-hedge-links/link",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      notify("Linking successful!", "success");

      // Optionally refresh the linked summary data
      const fetchLinkedSummary = async () => {
        try {
          const response = await axios.get(
            "https://backend-slqi.onrender.com/api/exposureUpload/hedgeLinksDetails"
          );

          const apiResponse = response.data as Array<{
            link_id: string;
            exposure_header_id: string;
            booking_id: string;
            hedged_amount: string;
            link_date: string;
            is_active: boolean;
            document_id: string;
            internal_reference_id: string;
          }>;

          setData(
            apiResponse.map((item, index) => ({
              srNo: index + 1,
              exposureId: item.document_id,
              forwardId: item.internal_reference_id,
              linkedAmount: parseFloat(item.hedged_amount),
              exposure_Id: item.exposure_header_id,
              Booking_Id: item.booking_id,
              linkDate: new Date(item.link_date).toLocaleDateString(),
            }))
          );
        } catch (error) {
          console.error("Failed to refresh linked summary:", error);
        }
      };

      // Refresh the table after successful linking
      await fetchLinkedSummary();

      // Clear selections
      setSelectedExposureHeaderId(null);
      setSelectedSystemTransactionId(null);
      setHedgedValue(null);
    } catch (error) {
      console.error(
        "❌ Error linking exposure to forward:",
        error.response?.data || error.message
      );
      notify("Linking failed. Please try again.", "error");
    }
  };

  return (
    <Layout title="Manual / Auto Exposure-to-Forward Linkage">
      <div className="space-y-4">
        {/* All the Select Components */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <CustomSelect
            label="Business Unit"
            options={buOptions}
            selectedValue={filters.businessUnit}
            onChange={(value) => handleFilterChange("businessUnit", value)}
            placeholder="Select business unit"
            isClearable={true}
          />

          <CustomSelect
            label="Currency"
            options={currencyOptions}
            selectedValue={filters.currency}
            onChange={(value) => handleFilterChange("currency", value)}
            placeholder="Select currency"
            isClearable={true}
          />

          <CustomSelect
            label="Type"
            options={typeOptions}
            selectedValue={filters.type}
            onChange={(value) => handleFilterChange("type", value)}
            placeholder="Select type"
            isClearable={true}
          />

          <CustomSelect
            label="Bank"
            options={entityOptions}
            selectedValue={filters.bank}
            onChange={(value) => handleFilterChange("bank", value)}
            placeholder="Select bank"
            isClearable={true}
          />
        </div>

        {/* Maturity Input and Link Button */}
        {/* <div className="mt-4 flex flex-wrap justify-end gap-4 items-end">
            <input
              type="number"
              step={1}
              value={filters.maturityMonths}
              onChange={(e) =>
                handleFilterChange("maturityMonths", e.target.value)
              }
              placeholder="Maturity < (months)"
              className="border border-gray-300 rounded px-4 py-2 w-[240px] md:w-[260px] lg:w-[280px]"
            />

            <div className="bg-primary text-white rounded px-4 w-[200px] md:w-[200px] lg:w-[200px] flex items-center justify-center">
              <Button>Apply Filter</Button>
            </div>
          </div> */}

        {/* Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="w-full">
            <UnlinkedExposure
              selectedExposureHeaderId={selectedExposureHeaderId}
              onSelectExposureHeaderId={setSelectedExposureHeaderId}
              hedgedValue={hedgedValue}
              onEditHedged={setHedgedValue}
              setBuOptions={setBuOptions}
              setCurrencyOptions={setCurrencyOptions}
              filters={filters}
              edit={Visibility.edit}
            />
          </div>

          <div className="w-full">
            <AvailableForward
              edit={Visibility.edit}
              selectedSystemTransactionId={selectedSystemTransactionId}
              setSelectedSystemTransactionId={setSelectedSystemTransactionId}
              setEntityOptions={setEntityOptions}
              setCurrencyOptions={setCurrencyOptions}
              filters={filters}
            />
          </div>
        </div>

        <div className="pt-4 flex flex-wrap justify-end gap-4 items-end">
          <div className="bg-primary text-white rounded w-[200px] md:w-[200px] lg:w-[200px] flex items-center justify-center">
            {Visibility.add && (
              <Button onClick={handleLinked}>Link Selected</Button>
            )}
          </div>
        </div>

        {/* Linked Summary */}
        <div className="w-full space-y-4 pt-6">
          <h2 className="text-2xl font-bold text-secondary-text">
            Linking Summary
          </h2>

          <div className="mt-4 flex flex-wrap justify-end gap-4 items-end">
            <div className="bg-primary text-white rounded flex items-center justify-center">
              {Visibility.approve && <Button>Approve</Button>}
            </div>
            <div className="bg-primary text-white rounded flex items-center justify-center">
              {Visibility.reject && <Button color="Fade">Reject</Button>}
            </div>
          </div>

          <div className=" shadow-lg border border-border">
            <DndContext
              onDragEnd={handleDragEnd}
              modifiers={[restrictToFirstScrollableAncestor]}
            >
              <table className="min-w-[800px] w-full table-auto">
                <colgroup>
                  {table.getVisibleLeafColumns().map((col) => (
                    <col key={col.id} className="font-medium min-w-full" />
                  ))}
                </colgroup>
                <thead className="bg-secondary-color rounded-xl">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const isDraggable = !nonDraggableColumns.includes(
                          header.column.id
                        );

                        return (
                          <th
                            key={header.id}
                            className="px-6 py-4 text-left text-xs font-semibold text-header-color uppercase tracking-wider border-b border-border"
                            style={{ width: header.getSize() }}
                          >
                            {isDraggable ? (
                              <Droppable id={header.column.id}>
                                <Draggable id={header.column.id}>
                                  <div className="cursor-move border-border text-header-color hover:bg-primary-lg rounded px-1 py-1 transition duration-150 ease-in-out">
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                  </div>
                                </Draggable>
                              </Droppable>
                            ) : (
                              <div className="px-1">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-6 py-12 text-left text-primary"
                      >
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <svg
                              className="w-6 h-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <p className="text-lg font-medium text-primary mb-1">
                            No Data available
                          </p>
                          <p className="text-sm text-primary">
                            There are no data to display at the moment.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={
                          row.index % 2 === 0
                            ? "bg-primary-md"
                            : "bg-secondary-color-lt"
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>

        </div>
        <div className="pt-2">
          <Pagination
              table={table}
              totalItems={data.length}
              currentPageItems={table.getRowModel().rows.length}
              startIndex={pagination.pageIndex * pagination.pageSize + 1}
              endIndex={Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                data.length
              )}
            />
        </div>
      </div>
    </Layout>
  );
};

export default LinkingScreen;
