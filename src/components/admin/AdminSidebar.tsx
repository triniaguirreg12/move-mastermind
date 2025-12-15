import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Dumbbell,
  ListVideo,
  Calendar,
  Handshake,
  HeadphonesIcon,
  Users,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

const menuItems = [
  { icon: BarChart3, label: "Estadísticas", path: "/admin" },
  { icon: Dumbbell, label: "Ejercicios", path: "/admin/ejercicios" },
  { icon: ListVideo, label: "Rutinas", path: "/admin/rutinas" },
  { icon: LayoutGrid, label: "Programas", path: "/admin/programas" },
  { icon: Calendar, label: "Agenda", path: "/admin/agenda" },
  { icon: Handshake, label: "Alianzas", path: "/admin/alianzas" },
  { icon: HeadphonesIcon, label: "Soporte", path: "/admin/soporte" },
  { icon: Users, label: "Usuarios", path: "/admin/usuarios" },
];

export const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && <Logo size="sm" showIcon={true} />}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-muted/50",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Admin info */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary text-xs font-medium">IR</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Isabel Rencoret</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
