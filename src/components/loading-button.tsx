"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Loading button component that prevents spam clicking and shows loading state
// Used for navigation and form submissions that require user feedback
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  href,
  children,
  variant = "default",
  size = "default",
  isLoading = false,
  loadingText = "Loading...",
  onClick,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = React.useState(false);
  
  // Combined loading state
  const loading = isLoading || internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }

    if (href) {
      e.preventDefault();
      setInternalLoading(true);
      
      try {
        router.push(href);
        // Small delay to show loading state before navigation
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error("Navigation error:", error);
      } finally {
        // Reset loading state after a delay
        setTimeout(() => setInternalLoading(false), 1000);
      }
    } else if (onClick) {
      setInternalLoading(true);
      try {
        await onClick(e);
      } catch (error) {
        console.error("Button action error:", error);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading || disabled}
      className={`transition-all duration-200 ${loading ? 'cursor-not-allowed opacity-70' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
} 