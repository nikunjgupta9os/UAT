
import axios from "axios";
import React, { useEffect, useState } from "react";
import Button from "../../ui/Button";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { useNotification } from "../../Notification/Notification";

interface prop {
  roleName: string;
}

type PermissionAttributes = {
  hasAccess: boolean;
  showCreateButton: boolean;
  showEditButton: boolean;
  showDeleteButton: boolean;
  showApproveButton: boolean;
  showRejectButton: boolean;
  canView: boolean;
  canUpload: boolean;
};

type PagePermissions = {
  hasAccess: boolean;
};

type PageTabs = {
  [tab: string]: PermissionAttributes;
};

type PagePermissionData = {
  pagePermissions: PagePermissions;
  tabs: PageTabs;
};

type PermissionData = {
  role_name: string;
  pages: {
    [pageKey: string]: PagePermissionData;
  };
};

const defaultPermissionAttributes: PermissionAttributes = {
  hasAccess: false,
  showCreateButton: false,
  showEditButton: false,
  showDeleteButton: false,
  showApproveButton: false,
  showRejectButton: false,
  canView: false,
  canUpload: false,
};

const pageList = [
  { key: "entity", label: "Entity" },
  { key: "hierarchical", label: "Hierarchical" },
  { key: "masters", label: "Masters" },
  { key: "dashboard", label: "Dashboard" },
  { key: "exposure-bucketing", label: "Exposure Bucketing" },
  { key: "hedging-proposal", label: "Hedging Proposal" },
  // { key: "hedging-dashboard", label: "Hedging Dashboard" },
  // { key: "fxstatusdash", label: "FX Status Dashboard" },
  { key: "roles", label: "Roles" },
  { key: "permissions", label: "Permissions" },
  { key: "user-creation", label: "User Creation" },
  { key: "exposure-upload", label: "Exposure Upload" },
];

const pagesWithTabs = [
  "roles",
  "permissions",
  "user-creation",
  "exposure-upload",
];

const tabLabels: Record<string, string> = {
  allTab: "All Tab",
  uploadTab: "Upload Tab",
  pendingTab: "Pending Tab",
  default: "Default",
};

const permissionCheckboxes = [
  { key: "showCreateButton", label: "Add" },
  { key: "showEditButton", label: "Edit" },
  { key: "showDeleteButton", label: "Delete" },
  { key: "showApproveButton", label: "Approve" },
  { key: "showRejectButton", label: "Reject" },
  { key: "canView", label: "View" },
  { key: "canUpload", label: "Upload" },
];

const PermissionsTable: React.FC<prop> = ({ roleName }) => {
  const [loading, setLoading] = useState(false);
  const [permissionData, setPermissionData] = useState<PermissionData>({
    role_name: roleName,
    pages: {
      entity: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      hierarchical: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      masters: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      dashboard: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      "exposure-bucketing": { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      "hedging-proposal": { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      // "hedging-dashboard": { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      // fxstatusdash: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
      roles: { pagePermissions: { hasAccess: false }, tabs: { allTab: { ...defaultPermissionAttributes }, uploadTab: { ...defaultPermissionAttributes }, pendingTab: { ...defaultPermissionAttributes } } },
      permissions: { pagePermissions: { hasAccess: false }, tabs: { allTab: { ...defaultPermissionAttributes }, uploadTab: { ...defaultPermissionAttributes }, pendingTab: { ...defaultPermissionAttributes } } },
      "user-creation": { pagePermissions: { hasAccess: false }, tabs: { allTab: { ...defaultPermissionAttributes }, uploadTab: { ...defaultPermissionAttributes }, pendingTab: { ...defaultPermissionAttributes } } },
      "exposure-upload": { pagePermissions: { hasAccess: false }, tabs: { allTab: { ...defaultPermissionAttributes }, uploadTab: { ...defaultPermissionAttributes }, pendingTab: { ...defaultPermissionAttributes } } },
    },
  });

  const { notify } = useNotification();

  // Helper to get tabs for a page
  const getTabsForPage = (pageKey: string) => {
    return pagesWithTabs.includes(pageKey)
      ? ["allTab", "uploadTab", "pendingTab"]
      : ["default"];
  };

  // Get permissions for a page/tab (new API structure)
  const getPermissions = (pageKey: string, tab: string): PermissionAttributes => {
    const page = permissionData.pages[pageKey];
    if (!page || !page.tabs) return { ...defaultPermissionAttributes };
    return page.tabs[tab] || { ...defaultPermissionAttributes };
  };


  // Helper to get page access (checked if all tabs have hasAccess true)
  // Always return true so Page Access checkbox is always clickable
  const getPageAccess = (pageKey: string) => {
    return true;
  };

  // Update page access: set all tabs' hasAccess to the new value
  const updatePageAccess = (pageKey: string, hasAccess: boolean) => {
    setPermissionData(prev => {
      const page = prev.pages[pageKey];
      if (!page || !page.tabs) return prev;
      const newTabs = Object.fromEntries(
        Object.entries(page.tabs).map(([tab, attrs]) => [
          tab,
          { ...attrs, hasAccess }
        ])
      );
      return {
        ...prev,
        pages: {
          ...prev.pages,
          [pageKey]: {
            ...page,
            tabs: newTabs
          }
        }
      };
    });
  };

  // Update tab access (new API structure)
  const updateTabAccess = (pageKey: string, tab: string, hasAccess: boolean) => {
    setPermissionData((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: {
          ...prev.pages[pageKey],
          tabs: {
            ...prev.pages[pageKey]?.tabs,
            [tab]: {
              ...getPermissions(pageKey, tab),
              hasAccess,
            },
          },
        },
      },
    }));
  };


  // Normalize backend data to always have {tabs: {tab: {}}} structure for each page
  const normalizePermissions = (rawPages: any): PermissionData["pages"] => {
    const normalizedPages: PermissionData["pages"] = {};
    for (const [pageKey, pageValue] of Object.entries(rawPages)) {
      // If already has tabs, just use them
      if (pageValue && typeof pageValue === "object" && "tabs" in pageValue) {
        normalizedPages[pageKey] = {
          pagePermissions: { hasAccess: Object.values((pageValue as any).tabs).every((tab: any) => tab.hasAccess) },
          tabs: (pageValue as any).tabs,
        };
        continue;
      }
      // fallback for legacy/empty
      const tabs = pagesWithTabs.includes(pageKey)
        ? ["allTab", "uploadTab", "pendingTab"]
        : ["default"];
      const tabsData: PageTabs = {};
      tabs.forEach((tab) => {
        const tabData = (pageValue as any)[tab] ?? {};
        tabsData[tab] = {
          ...defaultPermissionAttributes,
          ...tabData,
        };
      });
      normalizedPages[pageKey] = {
        pagePermissions: {
          hasAccess: Object.values(tabsData).every((tab: any) => tab.hasAccess),
        },
        tabs: tabsData,
      };
    }
    return normalizedPages;
  };


  // Update permission checkbox (new API structure)
  const updatePermissionCheckbox = (
    pageKey: string,
    tab: string,
    field: keyof PermissionAttributes,
    value: boolean
  ) => {
    setPermissionData((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageKey]: {
          ...prev.pages[pageKey],
          tabs: {
            ...prev.pages[pageKey]?.tabs,
            [tab]: {
              ...getPermissions(pageKey, tab),
              [field]: value,
            },
          },
        },
      },
    }));
  };

  console.log("Permission data:", permissionData);


  // Fetch permission data from API
 useEffect(() => {
  const fetchPermissionData = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/permissions/permissionjson",
        { roleName }
      );
      console.log("Response:", response.data); 
      if (response.data.page === null) {
        // Set all permissions to false, but allow editing by not disabling checkboxes
        setPermissionData({
          role_name: roleName,
          pages: {
            entity: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
            hierarchical: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
            masters: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
            dashboard: { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
            "exposure-bucketing": { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
            "hedging-proposal": { pagePermissions: { hasAccess: false }, tabs: { default: { ...defaultPermissionAttributes } } },
            roles: { pagePermissions: { hasAccess: false }, tabs: { allTab: { ...defaultPermissionAttributes }, uploadTab: { ...defaultPermissionAttributes }, pendingTab: { ...defaultPermissionAttributes } } },
            permissions: { pagePermissions: { hasAccess: false }, tabs: { allTab: { ...defaultPermissionAttributes }, uploadTab: { ...defaultPermissionAttributes }, pendingTab: { ...defaultPermissionAttributes } } },
            "user-creation": { pagePermissions: { hasAccess: false }, tabs: { allTab: { ...defaultPermissionAttributes }, uploadTab: { ...defaultPermissionAttributes }, pendingTab: { ...defaultPermissionAttributes } } },
            "exposure-upload": { pagePermissions: { hasAccess: false }, tabs: { allTab: { ...defaultPermissionAttributes }, uploadTab: { ...defaultPermissionAttributes }, pendingTab: { ...defaultPermissionAttributes } } },
          },
        });
        return;
      }

      if (response.data && response.data.pages) {
        setPermissionData({
          role_name: response.data.roleName,
          pages: normalizePermissions(response.data.pages),
        });
      } else {
        notify("Permission data not found.", "error");
      }
    } catch (err) {
      notify(`Failed to load permission data: ${err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  fetchPermissionData();
}, [roleName]);

console.log("Permission data:", permissionData);


  // Submit/save handler
  const handleSave = async () => {
    const dataToSend = {
      roleName: permissionData.role_name,
      // status: "pending",
      pages: permissionData.pages,
    };
    // console.log("Data to send:", dataToSend);
    try {
      setLoading(true);
      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/permissions/assign",
        dataToSend
      );
      console.log("Response2:", response.data);
      if (response.data.success) {
        notify("Permissions saved successfully!", "success");
      } else {
        notify("Error saving permissions: " + response.data.error, "error");
      }
    } catch (err) {
      notify(`Request failed. Check console: ${err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if  (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-text">
            Role Permissions Management
          </h1>
        </div>
        <div>
          <Button onClick={handleSave}>Submit</Button>
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="shadow-lg border border-border">
          <table className="min-w-full">
            <thead className="bg-body rounded-xl">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-primary uppercase border-b border-border text-start">Page Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-primary uppercase border-b border-border">Page Access</th>
                <th className="px-4 py-3 text-xs font-semibold text-primary uppercase border-b border-border text-start">Tab Access</th>
                {permissionCheckboxes.map((perm) => (
                  <th key={perm.key} className="px-4 py-3 text-xs font-semibold text-primary uppercase border-b border-border">{perm.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageList.map((page) => {
                const tabs = getTabsForPage(page.key);
                return tabs.map((tab, tabIdx) => {
                  const pageAccess = getPageAccess(page.key);
                  const tabPerms = getPermissions(page.key, tab);
                  return (
                    <tr key={page.key + "-" + tab} className={tabIdx % 2 === 0 ? "bg-primary-md" : "bg-secondary-color-lt"}>
                      {tabIdx === 0 ? (
                        <td rowSpan={tabs.length} className="px-4 py-3 font-semibold text-secondary-text-dark capitalize align-middle">{page.label}</td>
                      ) : null}
                      <td className="px-4 py-3 text-center align-middle">
                        {tabIdx === 0 ? (
                  <input
                    type="checkbox"
                    checked={getTabsForPage(page.key).every(tab => getPermissions(page.key, tab).hasAccess)}
                    onChange={e => updatePageAccess(page.key, e.target.checked)}
                    className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-start align-middle flex justify-between">
                        {tabs.length > 1 ? (
                          <>
                            <span className="mr-2 text-xs font-medium text-secondary-text">{tabLabels[tab]}</span>
                            <input
                              type="checkbox"
                              checked={tabPerms.hasAccess}
                              onChange={e => updateTabAccess(page.key, tab, e.target.checked)}
                              // disabled={pageAccess}
                              className="mr-[5rem] accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-secondary-text">-</span>
                        )}
                      </td>
                      {permissionCheckboxes.map((perm) => (
                        <td key={perm.key} className="px-4 py-3 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={tabPerms[perm.key as keyof PermissionAttributes]}
                            onChange={e => updatePermissionCheckbox(page.key, tab, perm.key as keyof PermissionAttributes, e.target.checked)}
                            disabled={tabs.length > 1 ? (!tabPerms.hasAccess) : false}
                            className="accent-primary w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PermissionsTable;
