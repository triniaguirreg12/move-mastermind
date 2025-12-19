import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

// Category gradients matching LibraryCard
const categoryGradients: Record<string, string> = {
  funcional: "from-primary/80 to-primary/20",
  kinesiologia: "from-[hsl(280,70%,60%)]/80 to-[hsl(280,70%,60%)]/20",
  activacion: "from-warning/80 to-warning/20",
};

export function FavoritesSection() {
  const navigate = useNavigate();
  const { data: favorites = [], isLoading } = useFavorites();

  if (isLoading) return null;
  if (favorites.length === 0) return null;

  // Group favorites by category
  const groupedFavorites = favorites.reduce((acc, fav) => {
    const category = fav.routine?.categoria || "funcional";
    if (!acc[category]) acc[category] = [];
    acc[category].push(fav);
    return acc;
  }, {} as Record<string, typeof favorites>);

  const categoryLabels: Record<string, string> = {
    funcional: "Funcional",
    kinesiologia: "Kinesiología",
    activacion: "Activación",
  };

  return (
    <div className="mt-6">
      <h2 className="text-base font-semibold text-foreground mb-3">Favoritos</h2>

      <div className="space-y-4">
        {Object.entries(groupedFavorites).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
              {categoryLabels[category] || category}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {items.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => navigate(`/rutina/${fav.routine_id}`)}
                  className="flex-shrink-0 w-28 group focus:outline-none"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-card border border-border/30 hover:border-primary/50 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]">
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      categoryGradients[category] || categoryGradients.funcional
                    )}>
                      {fav.routine?.portada_url && (
                        <img
                          src={fav.routine.portada_url}
                          alt={fav.routine.nombre}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70" />
                    
                    {/* Favorite indicator */}
                    <div className="absolute top-2 right-2">
                      <Heart className="h-3.5 w-3.5 text-destructive fill-destructive" />
                    </div>

                    {/* Type badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[9px] bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-white/80">
                        {fav.routine?.tipo === "programa" ? "Programa" : "Rutina"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1.5 text-left">
                    <h4 className="font-medium text-xs text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {fav.routine?.nombre}
                    </h4>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
