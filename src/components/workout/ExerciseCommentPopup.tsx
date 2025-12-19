import { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";

interface ExerciseCommentPopupProps {
  comment: string | null | undefined;
}

export function ExerciseCommentPopup({ comment }: ExerciseCommentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show popup when comment exists and hasn't been dismissed
    if (comment && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [comment, isDismissed]);

  // Reset dismissed state when comment changes
  useEffect(() => {
    setIsDismissed(false);
  }, [comment]);

  if (!comment || !isVisible) return null;

  return (
    <div className="absolute bottom-24 left-4 right-4 z-30 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-md mx-auto">
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-foreground flex-1">{comment}</p>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-muted rounded-full transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
