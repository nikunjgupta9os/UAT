

import React, { useState } from "react";
import Button from "../ui/Button";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "../ui/Footer";

type LayoutProps = {
  children: React.ReactNode;
  title: string;
  showButton?: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
};

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  showButton = false,
  buttonText = "Click Me",
  onButtonClick,
}) => {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebar-collapsed", String(newState));
      return newState;
    });
  };

  return (
    <div className="relative">
      <Sidebar isOpen={collapsed} onClose={toggleCollapse} />
      <Navbar />

      <main
        className={`pl-[6rem] mt-[1.75rem] transition-all duration-500 pt-[4rem] p-6 bg-body min-h-screen`}>

        <div className="bg-secondary-color rounded-xl p-6 h-full w-full overflow-y-auto">

          <div className="border-b border-border pb-4 mb-10">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-wider text-secondary-text ">{title}</h1>
              <div>
                {showButton && (
                  <Button onClick={onButtonClick}>
                    <span className="text-white">{buttonText}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
          {children}
        </div>

        

      </main>
      <Footer/>
    </div>
  );
};

export default Layout;