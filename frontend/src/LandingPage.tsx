import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="logo">MyApp</div>
        <nav className="landing-nav">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-secondary">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-primary">Sign Up</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          </SignedIn>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero">
          <h1 className="hero-title">Welcome to MyApp</h1>
          <p className="hero-subtitle">
            The best solution for your full-stack application needs
          </p>
          <div className="hero-actions">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="btn-primary btn-large">Get Started</button>
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
              <h3>Secure Authentication</h3>
              <p>Built with Clerk for enterprise-grade security</p>
            </div>
            <div className="feature-card">
              <h3>Real-time Data</h3>
              <p>Powered by Supabase for instant updates</p>
            </div>
            <div className="feature-card">
              <h3>Modern Stack</h3>
              <p>React + Spring Boot for reliable performance</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; 2025 MyApp. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
