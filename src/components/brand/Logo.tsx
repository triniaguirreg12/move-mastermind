import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo-just-muv.jpeg";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  return (
    <img
      src={logoImage}
      alt="Just MUV"
      className={cn(sizeClasses[size], "w-auto object-contain", className)}
    />
  );
};
