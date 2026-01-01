import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { Navigation } from "@/components/ui/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-950 min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 pt-32 pb-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6">
              Beta Access Available
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white"
          >
            Experience TV Like It's{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              1985
            </span>{" "}
            Again
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto"
          >
            Relive the golden age of television with authentic CRT simulation and AI-generated period commercials
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <SignedOut>
              <SignUpButton mode="modal">
                <ShinyButton className="text-lg px-8 py-4">
                  Start Watching Free
                </ShinyButton>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button
                size="lg"
                className="text-lg px-8 py-4"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </SignedIn>
          </motion.div>

        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative w-full flex justify-center"
        >
          <img
            src="/product-mockup.png"
            alt="RetroWatch CRT TV Experience"
            className="min-w-[100vw] h-auto object-contain drop-shadow-[0_0_100px_rgba(59,130,246,0.5)]"
          />
        </motion.div>
      </section>


      <footer className="py-8 text-center text-muted-foreground border-t">
        <p>&copy; 2025 RetroWatch. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
