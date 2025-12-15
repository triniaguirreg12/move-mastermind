import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Ene", ingresos: 12340, usuarios: 4200 },
  { month: "Feb", ingresos: 14500, usuarios: 4800 },
  { month: "Mar", ingresos: 13200, usuarios: 5100 },
  { month: "Abr", ingresos: 15800, usuarios: 5400 },
  { month: "May", ingresos: 17200, usuarios: 5800 },
  { month: "Jun", ingresos: 19500, usuarios: 6200 },
  { month: "Jul", ingresos: 21000, usuarios: 6800 },
  { month: "Ago", ingresos: 23500, usuarios: 7200 },
  { month: "Sep", ingresos: 22100, usuarios: 7600 },
  { month: "Oct", ingresos: 25800, usuarios: 8100 },
  { month: "Nov", ingresos: 28400, usuarios: 8600 },
  { month: "Dic", ingresos: 31200, usuarios: 9200 },
];

export const RevenueChart = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-heading font-semibold text-foreground">
            Ingresos y Usuarios Activos
          </h3>
          <p className="text-sm text-muted-foreground">Últimos 12 meses</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent" />
            <span className="text-muted-foreground">Usuarios</span>
          </div>
        </div>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUsuarios" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${value / 1000}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="ingresos"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIngresos)"
            />
            <Area
              type="monotone"
              dataKey="usuarios"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorUsuarios)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
