import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  routineId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "default" | "overlay";
}

export function FavoriteButton({ 
  routineId, 
  size = "md", 
  className,
  variant = "default"
}: FavoriteButtonProps) {
  const { data: isFavorite = false, isLoading } = useIsFavorite(routineId);
  const toggleFavorite = useToggleFavorite();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate({ routineId, isFavorite });
  };

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const variantClasses = {
    default: "bg-secondary/80 hover:bg-secondary border border-border/30",
    overlay: "bg-black/40 backdrop-blur-sm hover:bg-black/60",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || toggleFavorite.isPending}
      className={cn(
        "rounded-full flex items-center justify-center transition-all",
        sizeClasses[size],
        variantClasses[variant],
        "hover:scale-110 active:scale-95",
        className
      )}
      aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          "transition-colors",
          isFavorite 
            ? "text-destructive fill-destructive" 
            : variant === "overlay" 
              ? "text-white/80" 
              : "text-muted-foreground"
        )} 
      />
    </button>
  );
}
