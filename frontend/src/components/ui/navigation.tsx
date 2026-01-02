import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Channel Guide", href: "/channels", protected: true },
  { name: "Settings", href: "/settings", protected: true },
];

export function Navigation() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        aria-label="Primary navigation"
        className="hidden lg:block fixed left-0 right-0 z-50 top-4 px-6"
        initial={prefersReducedMotion ? false : { opacity: 0, y: -20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? undefined : { duration: 0.3 }}
      >
        <div
          className={cn(
            "backdrop-blur-xl border px-6 py-3 shadow-lg rounded-full max-w-7xl mx-auto transition-all duration-300",
            isScrolled
              ? "bg-background/80 border-border shadow-lg"
              : "bg-background/60 border-border/50"
          )}
        >
          <div className="flex items-center justify-between">
            {/* Left side - Logo and Navigation */}
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="text-xl font-bold hover:opacity-80 transition-opacity flex items-center gap-2"
              >
                <span>📺</span>
                <span>RetroWatch</span>
              </Link>

              <div className="flex space-x-1">
                {navItems.map((item) => {
                  if (item.protected) {
                    return (
                      <SignedIn key={item.name}>
                        <Link
                          to={item.href}
                          className={cn(
                            "px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200",
                            location.pathname === item.href
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          {item.name}
                        </Link>
                      </SignedIn>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200",
                        location.pathname === item.href
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side - Auth */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign Up</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <header
        className={cn(
          "lg:hidden fixed top-4 left-4 right-4 z-50 transition-all duration-300 ease-in-out"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3 transition-all duration-300",
            "bg-background/95 backdrop-blur-md",
            "border border-border shadow-lg",
            isMobileMenuOpen ? "rounded-t-2xl rounded-b-none border-b-0" : "rounded-2xl"
          )}
        >
          <Link
            to="/"
            className="text-xl font-bold hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            <span>📺</span>
            <span>RetroWatch</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMobileMenu}
              className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-accent/50 transition-colors duration-200"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={toggleMobileMenu}
            />

            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              aria-label="Mobile navigation"
              className="lg:hidden fixed top-[75px] left-4 right-4 z-40 bg-background border border-t-0 border-border rounded-b-2xl shadow-2xl p-6"
            >
              <div className="space-y-2">
                {navItems.map((item) => {
                  if (item.protected) {
                    return (
                      <SignedIn key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "block w-full py-3 px-4 rounded-full transition-colors duration-200",
                            location.pathname === item.href
                              ? "text-primary bg-primary/10"
                              : "text-foreground hover:bg-accent/50"
                          )}
                        >
                          {item.name}
                        </Link>
                      </SignedIn>
                    );
                  }
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "block w-full py-3 px-4 rounded-full transition-colors duration-200",
                        location.pathname === item.href
                          ? "text-primary bg-primary/10"
                          : "text-foreground hover:bg-accent/50"
                      )}
                    >
                      {item.name}
                    </Link>
                  );
                })}

                <div className="pt-4 border-t border-border mt-4 space-y-2">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button className="w-full">Sign Up</Button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center justify-center py-2">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  </SignedIn>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
