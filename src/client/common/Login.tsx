import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import Button from "../ui/Button";
import type { LoginSchemaType } from "./validation/loginScehma";
import { loginSchema } from "./validation/loginScehma";
import loginImage from "../../public/assets/logo2.png";
import loginBackground from "../../public/assets/login.png";
import React, { useState, useEffect } from "react";
import { Clock, MapPin, TrendingUp, TrendingDown } from "lucide-react";

<<<<<<< HEAD
=======
// Clock Widget Component with 12/24 hour toggle and country selection
const ClockWidget = ({ selectedCountry }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTimeZone = (country) => {
    const timeZones = {
      USA: "America/New_York",
      UK: "Europe/London",
      Germany: "Europe/Berlin",
      Japan: "Asia/Tokyo",
      Australia: "Australia/Sydney",
      India: "Asia/Kolkata",
      China: "Asia/Shanghai",
      Canada: "America/Toronto",
      France: "Europe/Paris",
      Brazil: "America/Sao_Paulo",
    };
    return timeZones[country] || "UTC";
  };

  const formatTime = (date) => {
    const timeZone = getTimeZone(selectedCountry);
    return date.toLocaleTimeString("en-US", {
      timeZone: timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: !is24Hour,
    });
  };

  const formatDate = (date) => {
    const timeZone = getTimeZone(selectedCountry);
    return date.toLocaleDateString("en-US", {
      timeZone: timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-gradient-to-br from-emerald-600/60 to-emerald-800/60 rounded-full px-8 py-4 text-white shadow-lg min-w-[280px]">
      <div className="text-center">
        <div className="flex justify-center items-center mb-2">
          <div className="text-sm tracking-tight opacity-90">
            {formatDate(currentTime)}
          </div>
          {/* <button
            onClick={() => setIs24Hour(!is24Hour)}
            className="text-xs bg-white/20 rounded-full px-2 py-1 hover:bg-white/30 transition-colors"
          >
            {is24Hour ? "24H" : "12H"}
          </button> */}
        </div>
        <div className="text-6xl font-medium tracking-wide mb-3">
          {formatTime(currentTime)}
        </div>
        <div className="flex w-full justify-center">
        <div className="flex items-center justify-center text-sm opacity-90 bg-white/20 rounded-full py-1 px-4">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="font-medium">{selectedCountry}</span>
        </div>
        </div>
      </div>
    </div>
  );
};

// Country Selector Widget Component (replaces LastLoginWidget)
const CountrySelector = ({ selectedCountry, onCountryChange }) => {
  const countries = [
    { name: "USA", flag: "🇺🇸", timezone: "EST" },
    { name: "UK", flag: "🇬🇧", timezone: "GMT" },
    { name: "Germany", flag: "🇩🇪", timezone: "CET" },
    { name: "Japan", flag: "🇯🇵", timezone: "JST" },
    { name: "Australia", flag: "🇦🇺", timezone: "AEST" },
    { name: "India", flag: "🇮🇳", timezone: "IST" },
    { name: "China", flag: "🇨🇳", timezone: "CST" },
    { name: "Canada", flag: "🇨🇦", timezone: "EST" },
    { name: "France", flag: "🇫🇷", timezone: "CET" },
    { name: "Brazil", flag: "🇧🇷", timezone: "BRT" },
  ];

  const selectedCountryData = countries.find((c) => c.name === selectedCountry);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg min-w-[280px]">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2 text-blue-500" />
        Select Country
      </h3>

      <div className="space-y-3 flex gap-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {countries.map((country) => (
            <button
              key={country.name}
              onClick={() => onCountryChange(country.name)}
              className={`flex flex-col items-center p-1 rounded-xl border-2 transition-colors shadow-sm
                ${
                  selectedCountry === country.name
                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-300"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }
              `}
            >
              <span className="text-gray-800 font-medium">{country.name}</span>
              <span className="text-gray-500 text-xs">
                ({country.timezone})
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const BASE = "USD";
const CURRENCIES = ["INR", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "CNY", "HKD", "NZD"];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getRandomRate = (base = 80, volatility = 0.5) =>
  base + (Math.random() - 0.5) * volatility;

const CurrencyStatsWidget = ({ symbol = "INR" }) => {
  const [rates, setRates] = useState<number[]>([]);
  const [current, setCurrent] = useState<number>(getRandomRate());
  const [change, setChange] = useState<number>(0);

  // Initialize with 7 days of mock data
  useEffect(() => {
    const initial = Array.from({ length: 7 }, (_, i) =>
      getRandomRate(80 + i * 0.1, 0.7)
    );
    setRates(initial);
    setCurrent(initial[6]);
    setChange(((initial[6] - initial[0]) / initial[0]) * 100);
  }, [symbol]);

  // Simulate update every 15s (new day, shift data)
  useEffect(() => {
    const interval = setInterval(() => {
      setRates((prev) => {
        const next = [...prev.slice(1), getRandomRate(prev[6], 0.7)];
        setCurrent(next[6]);
        setChange(((next[6] - next[0]) / next[0]) * 100);
        return next;
      });
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // SVG path for chart
  const generatePath = (data: number[]) => {
    if (data.length === 0) return "";
    const width = 240, height = 50, padding = 4;
    const minValue = Math.min(...data), maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;
    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((value - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    });
    return `M ${points.join(" L ")}`;
  };

  const isPositive = change >= 0;

  return (
    <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-3 text-white shadow-lg min-w-[280px] max-w-[280px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-3xl font-medium">
            {current.toFixed(4)}
          </div>
          <div className="text-xs opacity-70 mt-1">
            {BASE}/{symbol} • {isPositive ? "+" : ""}
            {change.toFixed(2)}%
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPositive ? "bg-green-500" : "bg-red-500"}`}>
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-white" />
          ) : (
            <TrendingDown className="w-4 h-4 text-white" />
          )}
        </div>
      </div>
      {/* Chart */}
      <div className="mb-2 h-12 relative">
        <svg width="100%" height="50" className="overflow-visible">
          <line x1="0" y1="12.5" x2="240" y2="12.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <line x1="0" y1="25" x2="240" y2="25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <line x1="0" y1="37.5" x2="240" y2="37.5" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          <path
            d={generatePath(rates)}
            stroke="#10b981"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {/* Week legend */}
      <div className="flex justify-between text-xs text-white/70 px-1">
        {WEEK_DAYS.map((d, i) => (
          <span key={d} className="w-7 text-center">{d}</span>
        ))}
      </div>
    </div>
  );
};


const LastLoginWidget = () => {
  const [lastLoginTime, setLastLoginTime] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Simulate stored data for preview
    const mockLastLogin = new Date(Date.now() - 25 * 60 * 1000).toISOString(); // 25 minutes ago
    const mockUser = {
      email: "john.doe@company.com",
      role: "CFO",
    };

    setLastLoginTime(mockLastLogin);
    setCurrentUser(mockUser);
  }, []);

  const formatLastLoginTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      // less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getUserInitials = (email) => {
    if (!email) return "U";
    const name = email.split("@")[0];
    return name.charAt(0).toUpperCase() + (name.charAt(1) || "").toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg min-w-[250px]">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">Last Login</h3>
        <span className="text-gray-800 font-medium text-sm relative top-0.5">
          {formatLastLoginTime(lastLoginTime)}
        </span>
      </div>

      {lastLoginTime && currentUser ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {getUserInitials(currentUser.email)}
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <p className="text-gray-800 font-medium">{currentUser.email}</p>
              <div className="flex justify-between">
                <p className="text-gray-500 text-sm capitalize">
                  {currentUser.role}
                </p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 text-sm font-medium">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No recent login</p>
        </div>
      )}
    </div>
  );
};

>>>>>>> 36f2cc2 (n)
const Login: React.FC = () => {
  const [bgColor, setBgColor] = useState("via-purple-300");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState("USA");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setLoginError("");
    setBgColor("via-purple-300");

    try {
      const response = await axios.post(
        "https://backend-slqi.onrender.com/api/auth/login",
        {
          email: data.email,
          password: data.password,
        }
      );

      const user = response.data.user;

      if (user?.isLoggedIn) {
        // Store userId and email in localStorage
        localStorage.setItem("userId", user.userId);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userEmail", user.email);

        setBgColor("via-green-100");
        navigate("/cfo-dashboard", { state: { user } });
      } else {
        setLoginError("Unexpected login response");
      }
    } catch (error) {
      setBgColor("via-red-300");

      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          setLoginError("Invalid credentials");
        } else {
          setLoginError("Login failed. Try again later.");
        }
      } else {
        setLoginError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div
      className="flex flex-col lg:flex-row items-start justify-center min-h-screen bg-white pt-32 lg:pt-64 px-4 lg:px-10"
      style={{
        backgroundImage: `url(${loginBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex flex-col justify-center items-center mb-8 lg:mb-0 lg:mr-16">
        <img src={loginImage} className="max-w-4xl w-auto h-auto" alt="Login" />
<<<<<<< HEAD
=======
        <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
          <ClockWidget selectedCountry={selectedCountry} />
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
          {/* <LastLoginWidget /> */}
          <CurrencyStatsWidget />
        </div>
>>>>>>> 36f2cc2 (n)
      </div>
      <div className="relative right-14 -top-10 w-full ml-4 max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`bg-gradient-to-tr from-blue-400/50 ${bgColor}  border-green-600/20 to-blue-600/50 rounded-2xl z-50 shadow-2xl shadow-green-700 px-10 py-10 w-full max-w-md transition-all duration-300`}
        >
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

          {loginError && (
            <p className="mb-4 text-red-900 font-semibold bg-red-100 px-3 py-2 rounded">
              {loginError}
            </p>
          )}

          <div className="mb-4">
            <Input
              label="Email"
              type="email"
              placeholder="Email"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          <div className="mb-6">
            <Input
              label="Password"
              type="password"
              placeholder="Password"
              {...register("password")}
              error={errors.password?.message}
            />
          </div>
          <Button color="Blue">Login</Button>

          <div className="mt-6 text-center">
            <p className="mt-4 text-sm text-gray-600">
              <a
                href="/forgot-password"
                className="text-blue-600 hover:underline"
              >
                Forgot Password?
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
