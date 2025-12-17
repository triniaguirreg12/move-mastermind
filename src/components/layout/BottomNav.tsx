import { NavLink, useLocation } from "react-router-dom";
import { Home, Library, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Library, label: "Biblioteca", path: "/entrenamiento" },
  { icon: Users, label: "Profesionales", path: "/profesionales" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-pb z-50">
      <div className="flex items-center justify-around py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 px-6 py-1 min-w-[80px] relative"
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
