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