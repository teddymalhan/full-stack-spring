import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface SettingsContextType {
  debugMode: boolean;
  setDebugMode: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [debugMode, setDebugModeState] = useState<boolean>(() => {
    const stored = localStorage.getItem("debugMode");
    return stored === "true";
  });

  const setDebugMode = (enabled: boolean) => {
    setDebugModeState(enabled);
    localStorage.setItem("debugMode", String(enabled));
  };

  useEffect(() => {
    const stored = localStorage.getItem("debugMode");
    if (stored !== null) {
      setDebugModeState(stored === "true");
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ debugMode, setDebugMode }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
