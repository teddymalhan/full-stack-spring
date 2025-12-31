import type { ElementType } from "react";
import { cn } from "@/lib/utils";

type InstantHighlighterProps = {
  /**
   * The text content to be highlighted
   */
  children: React.ReactNode;

  /**
   * HTML element to render as
   * @default "span"
   */
  as?: ElementType;

  /**
   * Class name for the container element
   */
  className?: string;

  /**
   * Highlight color (CSS color string)
   * @default 'hsl(25, 90%, 80%)'
   */
  highlightColor?: string;
} & React.HTMLAttributes<HTMLElement>;

/**
 * Lightweight CSS-only text highlighter for instant highlighting
 * Use this instead of TextHighlighter when instant={true} to avoid loading motion library
 */
export function InstantHighlighter({
  children,
  as: ElementTag = "span",
  className,
  highlightColor = "hsl(25, 90%, 80%)",
  ...props
}: InstantHighlighterProps) {
  const highlightStyle = {
    backgroundImage: `linear-gradient(${highlightColor}, ${highlightColor})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "0% 0%",
    backgroundSize: "100% 100%",
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  } as React.CSSProperties;

  return (
    <ElementTag {...props}>
      <span className={cn("inline", className)} style={highlightStyle}>
        {children}
      </span>
    </ElementTag>
  );
}

export default InstantHighlighter;

