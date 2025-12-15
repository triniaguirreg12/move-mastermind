import { Home, Dumbbell, Users, Settings } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Inicio" },
  { to: "/entrenamiento", icon: Dumbbell, label: "Entrenamiento" },
  { to: "/profesionales", icon: Users, label: "Profesionales" },
  { to: "/configuracion", icon: Settings, label: "Config" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200"
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-200",
                  isActive && "bg-accent/10"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-accent" : "text-muted-foreground"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
}
