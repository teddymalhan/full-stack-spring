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
    <div className="dashboard">
      <Navigation />

      <main className="dashboard-main pt-24">
        <div className="dashboard-container">
          <section className="welcome-section">
            <h1>Welcome to your Dashboard</h1>
            <p className="welcome-text">
              Hello, {user?.firstName || "there"}! You're now signed in and can access protected features.
            </p>
          </section>

          <section className="dashboard-card">
            <h2>Test Protected API</h2>
            <p>Click the button below to test calling a protected backend API endpoint.</p>
            <button
              className="btn-primary"
              onClick={callBackend}
              disabled={loading}
            >
              {loading ? "Loading..." : "Call Protected API"}
            </button>
            {msg && (
              <div className="api-response">
                <strong>Response:</strong>
                <p>{msg}</p>
              </div>
            )}
          </section>

          <section className="dashboard-card">
            <h2>Your Account</h2>
            <div className="account-info">
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.emailAddresses[0]?.emailAddress}</span>
              </div>
              <div className="info-row">
                <span className="info-label">User ID:</span>
                <span className="info-value">{user?.id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Joined:</span>
                <span className="info-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <h2>Your Virtual CRT TV</h2>
            <p className="mb-4">Experience RetroWatch on an authentic Sony Trinitron CRT. Drag to rotate, scroll to zoom.</p>
            <div className="w-full h-[600px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
              <CRTModelViewer />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
