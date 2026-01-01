import { Navigation } from "@/components/ui/navigation";
import { CRTModelViewer } from "@/components/CRTModelViewer";
import "./Dashboard.css";

function Dashboard() {
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
