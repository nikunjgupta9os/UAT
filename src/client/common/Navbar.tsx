"use client";

import "../styles/theme.css";
import { motion } from "framer-motion";
import loginImage from "../../public/assets/logo.png";
import TacoLogo from "../../public/assets/taco.png";
import React, { useEffect, useState, useRef } from "react";
import {
  Home,
  CreditCard,
  TrendingUp,
  Shield,
  Bell,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import axios from "axios";
import FXTickerPro from "./FXTickerPro";
import ThemeToggle from "./ThemeToggle";
import { useNavigate } from "react-router-dom";

const CURRENCIES_TO_SHOW = ["INR", "EUR", "GBP", "JPY", "AUD"];

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    title: "New message received",
    description: "You have a new message from the support team",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    title: "Payment processed",
    description: "Your payment of $1,200.00 has been processed",
    time: "1 day ago",
    read: true,
  },
  {
    id: 3,
    title: "System update",
    description: "A new system update is available for your account",
    time: "3 days ago",
    read: true,
  },
];

const Navbar: React.FC = () => {
  const navItems = [
    { icon: Home, label: "Dashboard" },
    { icon: CreditCard, label: "Cash Management" },
    { icon: TrendingUp, label: "FX Hedging" },
    { icon: Shield, label: "Bank Guarantee" },
  ];

  const [activeNav, setActiveNav] = useState("Dashboard");
  const navigate = useNavigate();

  const handleLogout = async () => {
    const userId = localStorage.getItem("userId");

    try {
      await axios.post("https://backend-slqi.onrender.com/api/auth/logout", { userId });

      // Clear localStorage
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("isLoggedIn");

      // Navigate to login
      navigate("/", { replace: true });
    } catch (error) {
       console.error("Logout failed:", error);
    }
  };

  const [rates, setRates] = useState<Record<string, number>>({});
  const prevRates = useRef<Record<string, number>>({});
  const [userData, setUserData] = useState<null | {
    name: string;
    email: string;
    lastLoginTime?: string;
    role?: string;
  }>(null);

  const [isUserDetailsVisible, setIsUserDetailsVisible] = useState(false);
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(
    mockNotifications.filter((n) => !n.read).length
  );

  const fetchUserDetails = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
       console.warn("User ID not found in localStorage");
      return;
    }

    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(
        `https://backend-slqi.onrender.com/api/getuserdetails/${userId}?t=${timestamp}`
      );

      if (response.data.success && response.data.sessions?.length > 0) {
        const userSession = response.data.sessions[0]; // Get first session
        setUserData({
          name: userSession.name,
          email: userSession.email,
          lastLoginTime: userSession.lastLoginTime || new Date().toISOString(),
          role: userSession.role || "User",
        });
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      // Fallback mock data if API fails
      // setUserData({
      //   name: "John Doe",
      //   email: "john.doe@example.com",
      //   lastLoginTime: new Date().toISOString(),
      //   role: "Admin",
      // });
    }
  };

  const toggleUserDetails = () => {
    if (!isUserDetailsVisible) {
      fetchUserDetails();
    }
    setIsUserDetailsVisible(!isUserDetailsVisible);
    setIsNotificationsVisible(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsVisible(!isNotificationsVisible);
    setIsUserDetailsVisible(false);

    // Mark notifications as read when opened
    if (!isNotificationsVisible) {
      const updatedNotifications = notifications.map((n) => ({
        ...n,
        read: true,
      }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    }
  };

  // useEffect(() => {
  //   const fetchRates = async () => {
  //     try {
  //       const { data } = await axios.get(API_URL);
  //       const newRates: Record<string, number> = {};
  //       CURRENCIES_TO_SHOW.forEach((currency) => {
  //         newRates[currency] = parseFloat(data.rates[currency]);
  //       });
  //       prevRates.current = rates;
  //       setRates(newRates);
  //     } catch (error) {
  //        console.error("Failed to fetch rates", error);
  //     }
  //   };
  //
  //   fetchRates();
  //   const interval = setInterval(fetchRates, 15000);
  //   return () => clearInterval(interval);
  // }, []);

  // Use only mock data for rates
  useEffect(() => {
    const generateMockRates = () => {
      const mockRates: Record<string, number> = {};
      CURRENCIES_TO_SHOW.forEach((currency) => {
        mockRates[currency] = 60 + Math.random() * 80; // random value for demo
      });
      prevRates.current = rates;
      setRates(mockRates);
    };
    generateMockRates();
    const interval = setInterval(generateMockRates, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="fixed top-0 right-0 h-[4rem] bg-body flex items-center pl-[6rem] shadow-sm z-30 transition-all duration-500 w-full">
      <div className="flex items-center ">
        <span className="text-primary font-bold font-base text-lg">
          <img src={loginImage} className="w-26 h-10" alt="Login" />
        </span>
        <span className="text-primary font-bold font-base text-lg">
          <img src={TacoLogo} className="w-30 h-12" alt="Login" />
        </span>
      </div>
      <FXTickerPro />

      <div className="ml-auto mr-6">
        <div className="flex items-center space-x-4 ml-8">
          {navItems.map((item, index) => {
            const isActive = activeNav === item.label;
            return (
              <div
                key={index}
                onClick={() => setActiveNav(item.label)}
                className={`group flex items-center space-x-2 px-2 py-2 cursor-pointer transition-colors ${
                  isActive
                    ? "text-primary font-medium border-b-2 border-primary"
                    : "text-primary-lt hover:text-primary"
                }`}
              >
                <item.icon
                  size={18}
                  className={`transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-primary-lt group-hover:text-primary"
                  }`}
                />
                <span
                  className={`
                  text-sm 
                  overflow-hidden 
                  transition-all 
                  duration-500 
                  ease-in-out 
                  ${isActive ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"}
                  group-hover:max-w-[140px] 
                  group-hover:opacity-100
                  whitespace-nowrap
                `}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center space-x-4 mr-4">
        <div className="relative cursor-pointer hover:text-primary-lt text-text transition-colors">
          <ThemeToggle />
        </div>

        <div className="relative cursor-pointer transition-colors">
          <div onClick={toggleNotifications}>
            <Bell size={20} className="text-text hover:text-primary-lt" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {unreadCount}
              </div>
            )}
          </div>

          {isNotificationsVisible && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-72 border border-border rounded-xl shadow-xl overflow-hidden z-50"
              style={{
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(255, 255, 255, 0.96)",
              }}
            >
              <div className="bg-gradient-to-r from-primary-lt to-primary px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-body">Notifications</h3>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm text-gray-900">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                )}
              </div>

              <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-lt border-t border-border flex justify-center">
                <button className="text-xs text-body transition-colors">
                  Mark all as read
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="relative">
          <div
            onClick={toggleUserDetails}
            className="flex items-center space-x-2 cursor-pointer hover:bg-primary-xl px-3 py-2 rounded-full transition-colors"
          >
            <div className="w-8 h-8 bg-primary-md rounded-full flex items-center justify-center">
              <User size={16} className="text-primary-lt" />
            </div>
          </div>

          {isUserDetailsVisible && userData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-72 border border-border rounded-xl shadow-xl overflow-hidden z-50"
              style={{
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                backdropFilter: "blur(8px)",
                backgroundColor: "rgba(255, 255, 255, 0.96)",
              }}
            >
              <div className="bg-gradient-to-r from-primary-lt to-primary px-5 py-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-body font-semibold">
                      {userData.name.charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-border rounded-full"></span>
                  </div>
                  <div>
                    <p className="font-semibold text-body">{userData.name}</p>
                    <p className="text-xs text-secondary-color-lt">
                      {userData.role}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-secondary-color">
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-secondary-text mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-secondary-text break-all">
                    {userData.email}
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-4 h-4 text-secondary-text mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-secondary-text">Last active</p>
                    <p className="text-xs font-medium text-secondary-text">
                      {new Date(userData.lastLoginTime).toLocaleString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-lt border-t border-border flex justify-end">
                <button
                  className="text-xs text-body transition-colors"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
