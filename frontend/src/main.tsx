import { ClerkProvider } from "@clerk/clerk-react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

type Config = { clerkPublishableKey: string };

function ConfiguredApp() {
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/config")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Config fetch failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((cfg: Config) => setConfig(cfg))
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div>Failed to load config: {error}</div>;
  }

  if (!config?.clerkPublishableKey) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={config.clerkPublishableKey}>
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfiguredApp />
  </StrictMode>,
);
