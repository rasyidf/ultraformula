"use client";

import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "secondary";
}

export function Loader({
  className,
  size = "md",
  variant = "default",
  ...props
}: LoaderProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const variantMap = {
    default: "text-primary",
    secondary: "text-secondary",
  };

  return (
    <div 
      className={cn("flex justify-center items-center", className)}
      {...props}
    >
      <Loader2 
        className={cn(
          "animate-spin",
          sizeMap[size],
          variantMap[variant]
        )} 
      />
    </div>
  );
}