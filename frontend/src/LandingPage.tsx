import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import "./LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <Navigation />

      <main className="landing-main pt-24">
        <section className="hero">
          <h1 className="hero-title">Welcome to RetroWatch</h1>
          <p className="hero-subtitle">
            Relive the golden age of TV. Watch your favorite classics on a virtual CRT with AI-generated period-accurate commercials.
          </p>
          <div className="hero-actions">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="btn-primary btn-large">Start Watching</button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="btn-secondary btn-large">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button className="btn-primary btn-large" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </button>
            </SignedIn>
          </div>
        </section>

        <section className="features">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>CRT Simulation</h3>
              <p>Authentic scanlines, phosphor glow, and that warm vintage feel</p>
            </div>
            <div className="feature-card">
              <h3>AI-Generated Ads</h3>
              <p>Period-accurate commercials seamlessly baked into your content</p>
            </div>
            <div className="feature-card">
              <h3>Time Travel</h3>
              <p>Pick a decade and experience TV exactly as it was</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2025 RetroWatch. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
