import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Input from "../../components/Input";
import Button from "../ui/Button";
import type { LoginSchemaType } from "./validation/loginScehma";
import { loginSchema } from "./validation/loginScehma";
import loginImage from "../../public/assets/logo2.png";
import loginBackground from "../../public/assets/login.png";
import { useEffect } from "react";
import { ClockAlert } from "lucide-react";

const ClockWidget = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatAlarm = (date) => {
    const alarmTime = new Date(date);
    alarmTime.setHours(7, 0, 0, 0);
    return alarmTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="bg-gradient-to-br from-emerald-600/60 to-emerald-800/60 rounded-full px-4 py-3 text-white shadow-lg min-w-[240px]">
      <div className="text-center">
        <div className="text-sm tracking-tight opacity-90">
          {formatDate(currentTime)}
        </div>
        <div className="text-6xl font-normal tracking-wide mb-1">
          {formatTime(currentTime)}
        </div>
        <div className="flex items-center justify-center text-xs opacity-90">
          <span className="mr-1 text-white">
            <ClockAlert />
          </span>
          <span>{formatAlarm(currentTime)}</span>
        </div>
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

const Login: React.FC = () => {
  const [bgColor, setBgColor] = useState("via-purple-300");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

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
        <div className="flex flex-wrap justify-center items-center gap-4 mt-8">
          <ClockWidget />
          <LastLoginWidget />
        </div>
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
