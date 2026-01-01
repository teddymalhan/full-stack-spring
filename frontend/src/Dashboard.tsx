import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Navigation } from "@/components/ui/navigation";
import { CRTModelViewer } from "@/components/CRTModelViewer";
import "./Dashboard.css";

function Dashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const callBackend = async () => {
    setLoading(true);
    try {
      const token = await getToken();

      const res = await fetch("/api/protected/hello", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      setMsg(text);
    } catch (error) {
      setMsg("Error calling API: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Full viewport CRT viewer below navigation */}
      <div className="fixed inset-x-0 top-20 bottom-0 z-40">
        <CRTModelViewer videoUrl="/movie.webm" />
      </div>
    </div>
  );
}

export default Dashboard;
