import React, { useEffect, useState } from "react";
import axios from "axios";

const Footer: React.FC = () => {
  const [version, setVersion] = useState("...");

  useEffect(() => {
    axios.get("http://localhost:5000/api/version")
      .then((res) => {
        setVersion(res.data.version);
      });
  }, []);

  return (
    <footer className="w-full border-t font-bold border-gray-200 flex justify-between items-center text-xs text-gray-400 py-4 px-6 bg-white min-h-[50px]">
      <span>
        <strong>Copyright © 2025–2026 Cashinvoice.</strong> All rights reserved
      </span>
      <span className="text-gray-400">Version {version}</span>
    </footer>
  );
};

export default Footer;
