"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface LowDataContextType {
  isLowData: boolean;
  toggleLowData: () => void;
}

const LowDataContext = createContext<LowDataContextType>({
  isLowData: false,
  toggleLowData: () => {},
});

export function LowDataProvider({ children }: { children: React.ReactNode }) {
  const [isLowData, setIsLowData] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("arena_low_data_mode");
      if (saved !== null) {
        setIsLowData(saved === "true");
        if (saved === "true") {
          document.documentElement.classList.add("low-data-mode");
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleLowData = () => {
    setIsLowData((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("arena_low_data_mode", String(next));
        if (next) {
          document.documentElement.classList.add("low-data-mode");
        } else {
          document.documentElement.classList.remove("low-data-mode");
        }
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  return (
    <LowDataContext.Provider value={{ isLowData, toggleLowData }}>
      {children}
    </LowDataContext.Provider>
  );
}

export function useLowData() {
  return useContext(LowDataContext);
}
