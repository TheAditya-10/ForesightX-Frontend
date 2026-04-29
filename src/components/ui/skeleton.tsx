import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  variant?: "rect" | "text" | "circle";
  animated?: boolean;
};

function Skeleton({ className, width, height, variant = "rect", animated = true, style, ...props }: SkeletonProps) {
  const baseClass = cn(animated ? "animate-pulse" : "", variant === "circle" ? "rounded-full" : "rounded-md", "bg-muted", className);
  const computedStyle = { ...(style || {}), ...(width ? { width: typeof width === "number" ? `${width}px` : width } : {}), ...(height ? { height: typeof height === "number" ? `${height}px` : height } : {}) };
  return <div className={baseClass} style={computedStyle} {...props} />;
}

export { Skeleton };
