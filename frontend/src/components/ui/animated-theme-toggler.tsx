import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { useTheme } from "@/components/theme-provider";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export const AnimatedThemeToggler = ({ className }: Props) => {
  const { theme, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsDark(theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    // Type assertion for View Transition API
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => { ready: Promise<void> };
    };

    const updateTheme = () => {
      flushSync(() => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        setIsDark(newTheme === "dark");
      });
    };

    if (doc.startViewTransition) {
      const transition = doc.startViewTransition(updateTheme);
      await transition.ready;
    } else {
      updateTheme();
      return;
    }

    
  }, [theme, setTheme]);

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={cn(className)}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-foreground" />
      ) : (
        <Moon className="h-4 w-4 text-foreground" />
      )}
    </button>
  );
};
