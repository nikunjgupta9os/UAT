import axios from "axios";
import {
  Building,
  Building2,
  ChevronDown,
  ChevronRight,
  // Edit,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import Layout from "../common/Layout";
import LoadingSpinner from "../ui/LoadingSpinner";
// import { set } from "date-fns";
import { useNotification } from "../Notification/Notification.tsx";
// import { no } from "zod/v4/locales";
import Button from "../ui/Button.tsx";
const cURL = "https://backend-slqi.onrender.com/api";
type ApprovalStatus = "pending" | "approved" | "rejected" | "delete-approval";

// const cURLHOST = "https://backend-slqi.onrender.com/api";

interface TreeNodeData {
  entity_id: string;
  entity_name: string;
  parentname: string | null;
  is_top_level_entity: boolean;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  registration_number: string | null;
  pan_gst: string | null;
  legal_entity_identifier: string | null;
  tax_identification_number: string | null;
  default_currency: string | null;
  associated_business_units?: string | null;
  reporting_currency: string | null;
  unique_identifier: string | null;
  legal_entity_type: string | null;
  fx_trading_authority: string | null;
  internal_fx_trading_limit: string | null;
  associated_treasury_contact: string | null;
  is_deleted: boolean;
  approval_status: string;
  level: string | null;
}

type TreeNodeType = {
  id: string;
  name: string;
  data: TreeNodeData;
  children?: TreeNodeType[];
};

// Node type configuration based on level
const getNodeConfig = (level: string) => {
  switch (level) {
    case "Level 1":
      return {
        icon: Building,
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
      };
    case "Level 2":
      return {
        icon: Building2,
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
      };
    case "Level 3":
      return {
        icon: Building2,
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-800",
      };
    case "Level 4":
      return {
        icon: Building2,
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
      };
    default:
      return {
        icon: Building,
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-800",
      };
  }
};

type TabVisibility = {
  approve: boolean;
  reject: boolean;
  edit: boolean;
};

const HierarchicalTree = () => {
  // const [treeData, setTreeData] = useState<TreeNodeType | null>();
  const [approvalComment, setApprovalComment] = useState("");
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNodeType | null>(null);
  const [Visibility, setVisibility] = useState<TabVisibility>({
    approve: false,
    reject: false,
    edit: false,
  });
  const [loading, setLoading] = useState(true); // 👈 Loading state

  const { notify, confirm } = useNotification();
  const [treeData, setTreeData] = useState<TreeNodeType | null>();
  const lineColors = [
    "border-l-blue-600",
    "border-l-green-600",
    "border-l-yellow-600",
    "border-l-purple-600",
    // "border-l-pink-600",
    // "border-l-indigo-600"
  ];

  useEffect(() => {
    const syncAndFetchHierarchy = async () => {
      console.log("🔄 Syncing and fetching hierarchy...");
      try {
        await axios.post(`${cURL}/entity/sync-relationships`);
        const response = await axios.get(
          `${cURL}/entity/getRenderVarsHierarchical`
          // {
          //   userId: localStorage.getItem("UserId"),
          //   roleName: localStorage.getItem("userRole"), // 👈 Ensure userId is set
          // } // 👈 Updated endpoint
        );
        // setVisibility({
        //   approve: response.data.hierarchical.tabs.default.showApproveButton,
        //   reject: response.data.hierarchical.tabs.default.showRejectButton,
        //   edit: response.data.hierarchical.tabs.default.showEditButton,
        // });

        console.log("✅ Hierarchy synced and fetched successfully");
        setTreeData(response.data.pageData);
        setVisibility({
          approve: response.data.hierarchical.tabs.default.showApproveButton,
          reject: response.data.hierarchical.tabs.default.showRejectButton,
          edit: response.data.hierarchical.tabs.default.showEditButton,
        });
        // console.log("🔄 Visibility settings:", response.data.hierarchical.default);
        // console.log("🔄 Tree data:", Visibility.app);
      } catch (error) {
        console.error("❌ Error syncing or fetching hierarchy:", error);
      } finally {
        setLoading(false); // ✅ Stop loading after request
      }
    };

    syncAndFetchHierarchy();
  }, []);
  // console.log(Visibility.approve, "Visibility approve");
  // Load from localStorage on mount
  // useEffect(() => {
  //   // const saved = localStorage.getItem("treeData");
  //   // if (saved) {
  //   //   setTreeData(JSON.parse(saved));
  //   console.log("🔄 Loading hierarchy from localStorage...");
  //   // } else {
  //     const syncAndFetchHierarchy = async () => {
  //       console.log("🔄 Syncing and fetching hierarchy...");
  //       try {
  //         await axios.post(
  //           "https://backend-slqi.onrender.com/api/entity/sync-relationships"
  //         );
  //         const response = await axios.get(
  //           "https://backend-slqi.onrender.com/api/entity/hierarchy"
  //         );

  //         console.log("✅ Hierarchy synced and fetched successfully");
  //         setTreeData(response.data);

  //       } catch (error) {

  //          console.error("❌ Error syncing or fetching hierarchy:", error);
  //         // Fallback mock data
  //         // setTreeData(response.data);
  //       }
  //     };
  //     syncAndFetchHierarchy();

  //   }
  // // }
  // , []);

  // Save to localStorage whenever treeData changes
  useEffect(() => {
    if (treeData) {
      localStorage.setItem("treeData", JSON.stringify(treeData));
    }
  }, [treeData]);

  // Helper functions
  // const findNodeById = (
  //   node: TreeNodeType,
  //   nodeId: string
  // ): TreeNodeType | null => {
  //   if (node.id === nodeId) return node;
  //   if (node.children) {
  //     for (const child of node.children) {
  //       const found = findNodeById(child, nodeId);
  //       if (found) return found;
  //     }
  //   }
  //   return null;
  // };

  const findNodeByIdUniversal = (
    node: TreeNodeType | TreeNodeType[],
    nodeId: string
  ): TreeNodeType | null => {
    if (Array.isArray(node)) {
      for (const n of node) {
        const found = findNodeByIdUniversal(n, nodeId);
        if (found) return found;
      }
      return null;
    }
    if (node.id === nodeId) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeByIdUniversal(child, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  const getAllNodeIds = (
    node: TreeNodeType | TreeNodeType[] | null
  ): string[] => {
    if (!node) return [];

    if (Array.isArray(node)) {
      return node.flatMap((n) => {
        const ids = [n.id];
        if (n.children) {
          ids.push(...getAllNodeIds(n.children));
        }
        return ids;
      });
    }

    const ids = [node.id];
    if (node.children) {
      node.children.forEach((child) => {
        ids.push(...getAllNodeIds(child));
      });
    }
    return ids;
  };

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Effects
  useEffect(() => {
    if (treeData && selectedNode) {
      const node = findNodeByIdUniversal(treeData, selectedNode.id);
      setSelectedNode(node || null);
      // console.log("🔍 Selected node updated:", node);
      // console.log("🔄 Expanded nodes:", selectedNode.id);
    }
  }, [treeData, selectedNode?.id]);

  // Reset expanded nodes when treeData changes
  useEffect(() => {
    if (treeData) {
      if (isAllExpanded) {
        const allNodeIds = getAllNodeIds(treeData);
        setExpandedNodes(new Set(allNodeIds));
      } else {
        setExpandedNodes(new Set());
      }
    }
  }, [treeData, isAllExpanded]);

  // Node operations
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.has(nodeId) ? newSet.delete(nodeId) : newSet.add(nodeId);
      return newSet;
    });
  };

  const toggleAllNodes = () => {
    if (isAllExpanded) {
      // Collapse all - completely collapse to level 0
      setExpandedNodes(new Set());
    } else {
      // Expand all - get all node IDs including all children
      const allNodeIds = getAllNodeIds(treeData);
      setExpandedNodes(new Set(allNodeIds));
    }
    setIsAllExpanded(!isAllExpanded);
  };

  const deleteNode = (
    nodeId: string,
    currentNode: TreeNodeType | null
  ): TreeNodeType | null => {
    if (!currentNode) return null;
    if (currentNode.id === nodeId) return null;
    if (currentNode.children) {
      const updatedChildren = currentNode.children
        .map((child) => deleteNode(nodeId, child))
        .filter((child): child is TreeNodeType => child !== null);
      return {
        ...currentNode,
        children: updatedChildren.length > 0 ? updatedChildren : undefined,
      };
    }
    return currentNode;
  };

  const updateApprovalStatus = (nodeId: string, status: ApprovalStatus) => {
    // Helper to recursively set status for all descendants
    const setStatusForAllDescendants = (
      node: TreeNodeType,
      status: ApprovalStatus
    ): TreeNodeType => ({
      ...node,
      data: {
        ...node.data,
        approval_status: status,
      },
      children: node.children?.map((child) =>
        setStatusForAllDescendants(child, status)
      ),
    });

    const updateStatus = (node: TreeNodeType): TreeNodeType => {
      if (node.id === nodeId) {
        if (status === "rejected") {
          return setStatusForAllDescendants(node, "rejected");
        } else {
          return {
            ...node,
            data: {
              ...node.data,
              approval_status: status,
            },
          };
        }
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateStatus),
        };
      }
      return node;
    };

    if (Array.isArray(treeData)) {
      // setTreeData(treeData.map(updateStatus));
    } else if (treeData) {
      setTreeData(updateStatus(treeData));
    }
  };

  // const approveAllNodes = () => {
  //   const approveAll = (node: TreeNodeType): TreeNodeType => {
  //     return {
  //       ...node,
  //       data: {
  //         ...node.data,
  //         approval_status: "approved",
  //       },
  //       children: node.children?.map(approveAll),
  //     };
  //   };

  //   if (treeData) {
  //     setTreeData(approveAll(treeData));
  //   }
  // };

  // Component for rendering node details
  const TreeNodeDetails = ({
    node,
    onUpdateNode,
  }: {
    node: TreeNodeType;
    onUpdateNode: (updatedData: TreeNodeType["data"]) => void;
  }) => {
    const isLevel1 = node.data.level === "Level 1";
    // const config = getNodeConfig(node.data.level);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ ...node.data });

    useEffect(() => {
      setFormData({ ...node.data });
      setEditing(false);
    }, [node]);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
      try {
        const payload = {
          // entity_name: formData.entity_name,
          // parentname: formData.parentname || "",
          address: formData.address || "",
          contact_phone: formData.contact_phone || "",
          contact_email: formData.contact_email || "",
          registration_number: formData.registration_number || "",
          pan_gst: formData.pan_gst || "",
          legal_entity_identifier: formData.legal_entity_identifier || "",
          tax_identification_number: formData.tax_identification_number || "",
          default_currency: formData.default_currency || "",
          associated_business_units: formData.associated_business_units || "",
          reporting_currency: formData.reporting_currency || "",
          unique_identifier: formData.unique_identifier || "",
          legal_entity_type: formData.legal_entity_type || "",
          fx_trading_authority: formData.fx_trading_authority || "",
          internal_fx_trading_limit: formData.internal_fx_trading_limit || "",
          associated_treasury_contact:
            formData.associated_treasury_contact || "",
          // entity: node.data.entity_id, // Use correct field here from TreeNodeData
        };

        const response = await fetch(
          `https://backend-slqi.onrender.com/api/entity/update/${node.data.entity_id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Entity updated successfully:", result);
        notify("Entity updated successfully!", "success");
        onUpdateNode({ ...formData });

        setEditing(false);
      } catch (error) {
        console.error("Error updating entity:", error);
        notify(
          "Failed to update entity. Please check your input or try again later.",
          "error"
        );
      }
    };

    // const handleSave = () => {
    //   // You can add logic to update the node in the tree here
    //   setEditing(false);
    //   // Optionally, call a prop or context to update the treeData
    // };

    return (
      <div className="bg-secondary-color rounded-lg border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{node.name} Details</h2>
          {/* <button
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
            onClick={() => setEditing((prev) => !prev)}
          >
            {editing ? "Cancel" : "Edit"}
          </button> */}
          <div className="w-[5rem] flex justify-end">
            {Visibility.edit && (
              <Button
                categories="Medium"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>
        </div>
        {editing ? (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLevel1 ? (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-primary">
                      Company Name
                    </label>
                    <input
                      name="entity_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Address
                    </label>
                    <input
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Contact Number
                    </label>
                    <input
                      name="contact_phone"
                      value={formData.contact_phone || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Contact Email
                    </label>
                    <input
                      name="contact_email"
                      value={formData.contact_email || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Registration Number
                    </label>
                    <input
                      name="registration_number"
                      value={formData.registration_number || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-primary">
                      PAN/GST
                    </label>
                    <input
                      name="pan_gst"
                      value={formData.pan_gst || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Legal Entity Identifier
                    </label>
                    <input
                      name="legal_entity_identifier"
                      value={formData.legal_entity_identifier || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Tax Identification Number
                    </label>
                    <input
                      name="tax_identification_number"
                      value={formData.tax_identification_number || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Default Currency
                    </label>
                    <input
                      name="default_currency"
                      value={formData.default_currency || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Business Units
                    </label>
                    {/* <input
                      name="associated_business_units"
                      value={
                        formData.associated_business_units?.join(", ") || ""
                      }
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1"
                    /> */}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-primary">
                      Entity Name
                    </label>
                    <input
                      name="entity_name"
                      value={formData.entity_name}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">Parent</label>
                    <input
                      name="parentname"
                      value={formData.parentname || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Address
                    </label>
                    <input
                      name="address"
                      value={formData.address || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Contact Number
                    </label>
                    <input
                      name="contact_phone"
                      value={formData.contact_phone || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Contact Email
                    </label>
                    <input
                      name="contact_email"
                      value={formData.contact_email || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-primary">
                      Unique Identifier
                    </label>
                    <input
                      name="unique_identifier"
                      value={formData.unique_identifier || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Legal Entity Type
                    </label>
                    <input
                      name="legal_entity_type"
                      value={formData.legal_entity_type || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Reporting Currency
                    </label>
                    <input
                      name="reporting_currency"
                      value={formData.reporting_currency || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      FX Authority
                    </label>
                    <input
                      name="fx_trading_authority"
                      value={formData.fx_trading_authority || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      FX Limit
                    </label>
                    <input
                      name="internal_fx_trading_limit"
                      value={formData.internal_fx_trading_limit || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-primary">
                      Treasury Contact
                    </label>
                    <input
                      name="associated_treasury_contact"
                      value={formData.associated_treasury_contact || ""}
                      onChange={handleChange}
                      className="w-full border rounded px-2 py-1 bg-secondary-color-lt text-secondary-text outline-none border-border"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="col-span-2 flex justify-end mt-4">
              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLevel1 ? (
              <>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-500">
                      Company Name
                    </h3>
                    <p>{node.data.entity_name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Address</h3>
                    <p className="text-secondary-text-dark">
                      {node.data.address}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Contact Number
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.contact_phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Contact Email
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.contact_email}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Registration Number
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.registration_number}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-primary">PAN/GST</h3>
                    <p className="text-secondary-text-dark">
                      {node.data.pan_gst}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Legal Entity Identifier
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.legal_entity_identifier}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Tax Identification Number
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.tax_identification_number}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Default Currency
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.default_currency}
                    </p>
                  </div>
                  <div>
                    {/* <h3 className="font-semibold text-primary">Business Units</h3>
                    <p className="text-secondary-text-dark">{node.data.associated_business_units?.join(", ")}</p> */}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-primary">Entity Name</h3>
                    <p className="text-secondary-text-dark">
                      {node.data.entity_name}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Parent</h3>
                    <p className="text-secondary-text-dark">
                      {node.data.parentname}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">Address</h3>
                    <p className="text-secondary-text-dark">
                      {node.data.address}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Contact Number
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.contact_phone}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Contact Email
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.contact_email}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-primary">
                      Unique Identifier
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.unique_identifier}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Legal Entity Type
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.legal_entity_type}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Reporting Currency
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.reporting_currency}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">FX Authority</h3>
                    <p className="text-secondary-text-dark">
                      {node.data.fx_trading_authority}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">FX Limit</h3>
                    <p className="text-secondary-text-dark">
                      {node.data.internal_fx_trading_limit}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      Treasury Contact
                    </h3>
                    <p className="text-secondary-text-dark">
                      {node.data.associated_treasury_contact}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleApprove = async (entityId: string) => {
    try {
      const response = await fetch(
        `https://backend-slqi.onrender.com/api/entity/approve/${entityId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comments: approvalComment }), // send comment here
        }
      );

      if (!response.ok) {
        throw new Error(`Approval failed. Status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Entity approved successfully:", result);
      // alert("Entity approved successfully!");
      notify("Entity approved successfully!", "success");

      // Optionally update UI or clear comment:
      setApprovalComment("");
    } catch (error) {
      console.error("Error approving entity:", error);
      // alert("Failed to approve entity.");
      notify("Failed to approve entity. Please try again.", "error");
    }
  };

  const handleRejectBulk = async (entityIds: string[], comments: string) => {
    try {
      const response = await fetch(
        "https://backend-slqi.onrender.com/api/entity/reject-bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ entityIds, comments }),
        }
      );

      if (!response.ok) {
        throw new Error(`Reject failed. Status: ${response.status}`);
      }

      // const result = await response.json();
      // console.log("Entities rejected successfully:", result);
      // alert("Entities rejected successfully!");
      notify("Entities rejected successfully!", "success");
    } catch (error) {
      // console.error("Error rejecting entities:", error);
      notify("Failed to reject entities. Please try again.", "error");
    }
  };

  const handleDelete = async (node: TreeNodeType) => {
    const confirmed = await confirm(
      `Delete ${node.name} and all its children?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch(
        `https://backend-slqi.onrender.com/api/entity/delete/${node.data.entity_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ comments: approvalComment }), // send comment here
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed. Status: ${response.status}`);
      }

      setTreeData((prev) => deleteNode(node.id, prev));

      if (selectedNode?.id === node.id) {
        setSelectedNode(null);
      }

      // alert(`Deleted ${node.name} successfully.`);
      notify(`Deleted ${node.name} successfully.`, "success");
    } catch (error) {
      // console.error("Error deleting entity:", error);
      notify(`Failed to delete ${node.name}. Please try again.`, "error");
    }
  };

  // TreeNode component
  const TreeNode = ({
    node,
    level = 0,
  }: {
    node: TreeNodeType;
    level?: number;
  }) => {
    // Hide rejected nodes when edit visibility is false
    if (node.data.approval_status === "Rejected" && !Visibility.edit) {
      return null;
    }

    const hasChildren = node.children?.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const config = getNodeConfig(node.data.level);
    const Icon = config.icon;
    const status = node.data.approval_status;

    // Filter children to hide rejected nodes when edit visibility is false
    const visibleChildren =
      hasChildren && node.children
        ? node.children.filter(
            (child) =>
              !(child.data.approval_status === "rejected" && !Visibility.edit)
          )
        : [];

    const hasVisibleChildren = visibleChildren.length > 0;

    return (
      <div className="relative">
        <div
          className={`flex items-center gap-4 mb-6`}
          style={{ marginLeft: level * 10, cursor: "pointer" }}
          onClick={() => setSelectedNode(node)}
        >
          <div
            className={`relative flex items-center gap-0 p-0 rounded-lg border-2 w-[400px] hover:shadow-md transition-all ${config.border} bg-white`}
          >
            {/* Colored left strip */}
            <div className={`w-2 h-full rounded-l-md ${config.bg}`}></div>

            {/* Main content area */}
            <div className="flex items-center gap-2 p-3 flex-grow">
              {hasVisibleChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode(node.id);
                  }}
                  className={`p-1 rounded-full ${config.bg} hover:opacity-80`}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} className={config.text} />
                  ) : (
                    <ChevronRight size={16} className={config.text} />
                  )}
                </button>
              )}

              <Icon size={16} className={config.text} />
              <span className={`font-medium flex-grow ${config.text}`}>
                {node.name}
              </span>

              <div className="flex items-center gap-1 ml-2">
                <div className="absolute -right-2.5 -top-4">
                  <span
                    className={`px-2 py-0.5 font-bold rounded-xl border-2 text-xs
                    ${
                      {
                        approved: "bg-green-400 border-green-500 text-white",
                        rejected: "bg-red-500 border-red-500 text-white",
                        pending: "bg-gray-200 border-gray-400 text-gray-600",
                        "delete-approval": "bg-purple-400 border-purple-600 text-white",
                      }[status.toLowerCase()] || "bg-gray-200 border-gray-400 text-gray-600"
                    }
                  `}
                    >
                    {status.replace(
                      /\w+/g,
                      (word) =>
                        word[0].toUpperCase() + word.substring(1).toLowerCase()
                    )}
                  </span>
                </div>

                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`View ${node.name}`);
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                >
                  <Edit className="text-primary" size={16} />
                </button> */}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node);
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                >
                  <Trash2 className="text-red-500" size={16} />
                </button>

                {/* <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        `Delete ${node.name} and all its children?`
                      )
                    ) {
                      setTreeData((prev) => deleteNode(node.id, prev));
                      if (selectedNode?.id === node.id) {
                        setSelectedNode(null);
                      }
                    }
                  }}
                  className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                >
                  <Trash2 className="text-red-500" size={16} />
                </button> */}
              </div>
            </div>
          </div>
        </div>

        {hasVisibleChildren && isExpanded && (
          <div
            className={`pl-6 mt-4 border-l-2 ${
              lineColors[level % lineColors.length]
            } border-dashed relative`}
            style={{
              marginLeft: level * 10 + 16,
              minHeight: 40,
              position: "relative",
            }}
          >
            {visibleChildren.map((child) => (
              <TreeNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  function updateNodeDataInTree(tree, nodeId, updatedData) {
    return tree.map((node) => {
      if (node.data.entity_id === nodeId) {
        return { ...node, data: { ...updatedData } };
      } else if (node.children) {
        return {
          ...node,
          children: updateNodeDataInTree(node.children, nodeId, updatedData),
        };
      }
      return node;
    });
  }

  return (
    <Layout title="Entity Hierarchy">
      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          {/* <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div> */}
          <LoadingSpinner />
        </div>
      ) : (
        <div className="min-h-screen">
          <div className="w-full">
            <div className="flex space-x-4 w-full">
              {/* Left panel (tree view) */}
              <div className="bg-secondary-color-lt text-secondary-text-dark w-full rounded-lg border border-border p-6">
                <div className="flex justify-between items-center mt-6 border-b border-border mb-8 pb-2">
                  <h2 className="text-[24px] font-semibold">Hierarchy Tree</h2>
                  <div className="flex items-center gap-2 w-[7rem] justify-end">
                    <Button
                      categories="Medium"
                      color="Fade"
                      onClick={toggleAllNodes}
                    >
                      {isAllExpanded ? "Collapse All" : "Expand All"}
                    </Button>
                  </div>
                </div>
                {Array.isArray(treeData) ? (
                  treeData.map((node) => <TreeNode key={node.id} node={node} />)
                ) : treeData ? (
                  <TreeNode node={treeData} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hierarchy data available. Create a new one.
                  </div>
                )}
              </div>

              {/* Right panel (details and actions) */}
              <div className="flex flex-col bg-secondary-color-lt w-full space-y-10 rounded-lg border border-border p-6">
                {selectedNode ? (
                  <>
                    <div className="bg-white mt-6 w-full rounded-lg border border-gray-200 p-6">
                      <h3 className="font-semibold text-gray-700">
                        Current Node: {selectedNode.id}
                      </h3> */}
                      <div className="flex justify-end gap-2 ml-10 mt-4">
                        {Visibility.approve &&
                          selectedNode.data.approval_status !== "Approved" && (
                            <button
                              onClick={() => {
                                updateApprovalStatus(
                                  selectedNode.id,
                                  "approved"
                                );
                                handleApprove(selectedNode.data.entity_id);
                              }}
                              className="bg-primary hover:bg-primary-hover text-center text-white rounded px-4 py-2 font-bold transition min-w-[4rem]"
                            >
                              Approve
                            </button>
                          )}
                        {Visibility.reject &&
                          selectedNode.data.approval_status !== "Approved" && (
                            <button
                              onClick={() => {
                                updateApprovalStatus(
                                  selectedNode.id,
                                  "rejected"
                                );
                                handleRejectBulk(
                                  [selectedNode.data.entity_id],
                                  approvalComment
                                );
                              }}
                              className="bg-primary hover:bg-primary-hover text-center text-white rounded px-4 py-2 font-bold transition min-w-[4rem]"
                            >
                              Reject
                            </button>
                          )}
                      </div>
                      <div className="mb-3">
                        <label className="block font-semibold mb-1 text-secondary-text-dark">
                          Description <span className="text-red-500">*</span>
                        </label>

                        <textarea
                          name="description"
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          className="w-full text-secondary-text-dark bg-secondary-color px-3 py-2 border border-border rounded-lg shadow-sm focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div>
                          <p className="text-sm text-secondary-text-dark font-semibold">
                            Parent:{" "}
                            <span
                              className={
                                selectedNode?.data?.parentname
                                  ? "text-primary"
                                  : ""
                              }
                            >
                              {selectedNode?.data?.parentname || "None"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <TreeNodeDetails
                      node={selectedNode}
                      onUpdateNode={(updatedData) => {
                        setTreeData((prevTree) =>
                          updateNodeDataInTree(
                            prevTree,
                            selectedNode.id,
                            updatedData
                          )
                        );
                      }}
                    />
                  </>
                ) : (
                  <div className="text-center py-8 text-primary">
                    Select a node to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HierarchicalTree;
