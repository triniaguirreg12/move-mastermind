import { Users, DollarSign, TrendingUp, UserPlus, Activity, Star } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { TopRoutinesChart } from "@/components/admin/TopRoutinesChart";
import { RevenueDistributionChart } from "@/components/admin/RevenueDistributionChart";
import { TopUsersTable } from "@/components/admin/TopUsersTable";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Estadísticas</h1>
          <p className="text-muted-foreground">Vista general del rendimiento de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="month">
            <SelectTrigger className="w-[140px] bg-card border-border">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Ingresos Totales"
          value="$31,200"
          change="+12% vs mes anterior"
          changeType="positive"
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Usuarios Activos"
          value="9,200"
          change="+8% vs mes anterior"
          changeType="positive"
          icon={Users}
          iconColor="text-primary"
        />
        <StatCard
          title="Nuevos Usuarios"
          value="950"
          change="+15% vs mes anterior"
          changeType="positive"
          icon={UserPlus}
          iconColor="text-accent"
        />
        <StatCard
          title="Retención"
          value="68%"
          change="-2% vs mes anterior"
          changeType="negative"
          icon={TrendingUp}
          iconColor="text-warning"
        />
        <StatCard
          title="Tasa Conversión"
          value="24%"
          change="+3% vs mes anterior"
          changeType="positive"
          icon={Activity}
          iconColor="text-primary"
        />
        <StatCard
          title="Calificación Prom."
          value="4.6"
          change="Sobre 5 estrellas"
          changeType="neutral"
          icon={Star}
          iconColor="text-warning"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Top/Lowest Routines */}
      <TopRoutinesChart />

      {/* Revenue Distribution */}
      <RevenueDistributionChart />

      {/* Top Users */}
      <TopUsersTable />
    </div>
  );
};

export default AdminDashboard;
