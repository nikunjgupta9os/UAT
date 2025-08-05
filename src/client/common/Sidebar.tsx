import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  FileText,
  Building,
  Layers,
  Upload,
  CheckCircle,
  Settings,
  UserPlus,
  HandCoins,
  ChevronDown,
  UserRoundCog,
  ChevronRight,
  LayoutDashboard,
  FileBarChart,
  SquareChartGantt,
  ChartArea,
  FileSymlink,
  Landmark,
  BarChart2,
  Receipt,
  Proportions,
  Handshake,
  BookUp,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type NavItem = {
  label: string;
  path?: string;
  icon: React.ReactNode;
  subItems?: NavItem[];
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const [openSubMenus, setOpenSubMenus] = useState<Set<string>>(new Set());
  const [floatingSubMenu, setFloatingSubMenu] = useState<NavItem | null>(null);
  const floatingMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleCollapse = () => {
    setCollapsed(prev => !prev);
    setOpenSubMenus(new Set());
    setFloatingSubMenu(null);
  };

  // Logout handler
  const handleLogout = async () => {
    const userId = localStorage.getItem("userId");
    try {
      await fetch("https://backend-slqi.onrender.com/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("isLoggedIn");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems: NavItem[] = [
  { label: "Entity", path: "/entity", icon: <Building /> },
  { label: "Entity hierarchy", path: "/hierarchical", icon: <Layers /> },
  {
    label: "Settings",
    icon: <Settings />,
    subItems: [
      { label: "Roles", path: "/role", icon: <UserRoundCog /> },
      { label: "Permissions", path: "/permission", icon: <HandCoins /> },
      { label: "Users", path: "/user", icon: <UserPlus /> },
    ],
  },
  {
    label: "Dashboard",
    icon: <FileBarChart />,
    subItems: [
      { label: "CFO Dashboard", path: "/cfo-dashboard", icon: <ChartArea /> },
      { label: "FX Ops Dashboard", path: "/ops-dashboard", icon: <SquareChartGantt /> },
      { label: "Hedging Dashboard", path: "/hedging-dashboard", icon: <LayoutDashboard /> },
      { label: "Dashboard Builder", path: "/cfo-dashboard-builder", icon: <Proportions /> },
    ],
  },
  {
    label: "Exposure",
    icon: <Landmark />,
    subItems: [
      { label: "Exposure Upload", path: "/exposure-upload", icon: <Upload /> },
      { label: "Exposure Bucketing", path: "/exposure-bucketing", icon: <BarChart2 /> },
      { label: "Hedging Proposal", path: "/hedging-proposal", icon: <FileText /> },
      { label: "Exposure Linkage", path: "/linking-screen", icon: <FileSymlink /> },
    ],
  },
  {
    label: "Forwards",
    icon: <Receipt />,
    subItems: [
      { label: "FX Forward Booking", path: "/fxbooking", icon: <BookUp /> },
      { label: "FX Confirmation", path: "/fx-confirmation", icon: <CheckCircle /> },
    ],
  },
  { label: "Reports", path: "/reports", icon: <Proportions /> },
  { label: "Settlement", path: "/exposure-selection", icon: <Handshake /> },
  // Logout nav item
  { label: "Logout", icon: <LogOut />, path: "__logout__" },
  ];

  useEffect(() => {
    const newOpenSubMenus = new Set<string>();
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some(
          (subItem) => subItem.path === location.pathname
        );
        if (hasActiveChild) {
          newOpenSubMenus.add(item.label);
        }
      }
    });
    setOpenSubMenus(newOpenSubMenus);
    setFloatingSubMenu(null);
  }, [location.pathname]);

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus((prev) => {
      const newSet = new Set(prev);
      newSet.has(label) ? newSet.delete(label) : newSet.add(label);
      return newSet;
    });
  };

  const handleItemClick = (item: NavItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (collapsed && item.subItems) {
      setFloatingSubMenu(item === floatingSubMenu ? null : item);
      return;
    }

    if (item.subItems) {
      toggleSubMenu(item.label);
      if (!item.path) return;
    }

    if (item.path) {
      if (item.path === "__logout__") {
        handleLogout();
        return;
      }
      navigate(item.path);
      if (!collapsed) {
        onClose();
      }
    }
  };

  const isItemOrSubItemActive = (item: NavItem): boolean => {
    if (item.path && location.pathname === item.path) return true;
    if (item.subItems) {
      return item.subItems.some(
        (subItem) => subItem.path && location.pathname === subItem.path
      );
    }
    return false;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        floatingMenuRef.current &&
        !floatingMenuRef.current.contains(event.target as Node) &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setFloatingSubMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const calculateFloatingMenuPosition = (): React.CSSProperties => {
    if (!floatingSubMenu) return {};
    
    const index = navItems.findIndex(item => item.label === floatingSubMenu.label);
    const itemHeight = 56; // Height of each menu item
    const topPosition = 100 + (index * itemHeight); // 100 is the offset from top
    
    return {
      top: `${topPosition}px`,
      left: '80px' // Width of collapsed sidebar
    };
  };

  return (
    <>
      {/* Mobile overlay - removed opacity to prevent black screen */}
      {isOpen && !collapsed && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-transparent"
          onClick={onClose}
        />
      )}

      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen z-50 bg-gradient-to-b from-primary to-primary-lt ${
          collapsed ? "w-20" : "w-64"
        } text-white p-4 shadow-lg flex flex-col transition-all duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <button
          onClick={toggleCollapse}
          className="cursor-pointer text-white mb-8 self-end focus:outline-none hover:bg-primary-bg-hover rounded px-2 py-2 transition-colors duration-200"
        >
          {collapsed ? <Menu size={24} /> : <X size={24} />}
        </button>

        <nav className="flex flex-col space-y-2 w-full">
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isSubMenuOpen = openSubMenus.has(item.label);
            const isActive = isItemOrSubItemActive(item);

            return (
              <div key={item.label} className="relative group w-full">
                <button
                  onClick={(e) => handleItemClick(item, e)}
                  className={`flex items-center rounded-lg px-3 py-3 transition-colors w-full text-left ${
                    isActive
                      ? "bg-primary-bg-hover font-semibold"
                      : "hover:bg-primary-bg-active"
                  }`}
                >
                  <span className="w-6 flex justify-center">{item.icon}</span>
                  <span
                    className={`ml-3 text-sm whitespace-nowrap transition-all duration-200 ${
                      collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                    }`}
                  >
                    {item.label}
                  </span>

                  {!collapsed && hasSubItems && (
                    <span className="ml-auto w-4 transition-transform duration-200">
                      {isSubMenuOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </span>
                  )}

                  {collapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                      <div className="whitespace-nowrap rounded bg-gray-800 px-3 py-2 text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg ml-2">
                        {item.label}
                      </div>
                    </div>
                  )}
                </button>

                {!collapsed && hasSubItems && isSubMenuOpen && (
                  <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {item.subItems?.map((subItem) => (
                      <button
                        key={subItem.label}
                        onClick={() => {
                          if (subItem.path) {
                            navigate(subItem.path);
                            if (!collapsed) {
                              onClose();
                            }
                          }
                        }}
                        className={`flex items-center rounded-lg px-3 py-2 transition-colors w-full text-left ${
                          location.pathname === subItem.path
                            ? "bg-primary-bg-hover font-semibold"
                            : "hover:bg-primary-bg-active"
                        }`}
                      >
                        <span className="w-6 flex justify-center">{subItem.icon}</span>
                        <span className="ml-3 text-sm">{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

      

        {/* Floating submenu */}
        {collapsed && floatingSubMenu && (
          <div
            ref={floatingMenuRef}
            className="fixed z-50 bg-primary text-white rounded-md shadow-xl p-2 w-56 border border-primary-border"
            style={calculateFloatingMenuPosition()}
            onClick={(e) => e.stopPropagation()}
          >
            {floatingSubMenu.subItems?.map((subItem) => (
              <button
                key={subItem.label}
                onClick={() => {
                  if (subItem.path) {
                    navigate(subItem.path);
                    setFloatingSubMenu(null);
                    onClose();
                  }
                }}
                className={`flex items-center w-full px-3 py-2 rounded hover:bg-primary-bg-active transition-colors ${
                  location.pathname === subItem.path
                    ? "bg-primary-bg-hover font-semibold"
                    : ""
                }`}
              >
                <span className="w-6 flex justify-center">{subItem.icon}</span>
                <span className="ml-3 text-sm">{subItem.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
