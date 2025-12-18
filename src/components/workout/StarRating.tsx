import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function StarRating({ value, onChange, disabled = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverValue || value);
        
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            className={cn(
              "p-1 transition-all duration-200",
              !disabled && "hover:scale-110 active:scale-95",
              disabled && "cursor-default"
            )}
          >
            <Star
              className={cn(
                "w-8 h-8 transition-colors duration-200",
                isFilled
                  ? "fill-primary text-primary"
                  : "fill-transparent text-muted-foreground/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
