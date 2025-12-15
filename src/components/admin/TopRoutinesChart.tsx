import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const topRatedData = [
  { name: "Full Body Strength", rating: 4.8 },
  { name: "HIT Burn", rating: 4.7 },
  { name: "Core Challenge", rating: 4.6 },
  { name: "Yoga Flow", rating: 4.5 },
  { name: "Cardio Blast", rating: 4.4 },
];

const lowestRatedData = [
  { name: "Morning Energizer", rating: 3.5 },
  { name: "Quick Stretch", rating: 3.6 },
  { name: "Beginner Cardio", rating: 3.7 },
  { name: "Light Mobility", rating: 3.8 },
  { name: "Recovery Session", rating: 3.9 },
];

export const TopRoutinesChart = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top Rated */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4">
          Rutinas Mejor Calificadas
        </h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRatedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                domain={[0, 5]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                width={100}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="rating" radius={[0, 4, 4, 0]}>
                {topRatedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="hsl(var(--success))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lowest Rated */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading font-semibold text-foreground mb-4">
          Rutinas Peor Calificadas
        </h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lowestRatedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                domain={[0, 5]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                width={100}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="rating" radius={[0, 4, 4, 0]}>
                {lowestRatedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="hsl(var(--warning))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
