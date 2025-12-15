import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star } from "lucide-react";

const topUsers = [
  {
    name: "Pepito Pérez",
    email: "pepito@email.com",
    routinesCompleted: 156,
    totalSpent: 3200,
    rating: 4.9,
  },
  {
    name: "Rosario González",
    email: "rosario@email.com",
    routinesCompleted: 142,
    totalSpent: 2800,
    rating: 4.8,
  },
  {
    name: "María Fernández",
    email: "maria@email.com",
    routinesCompleted: 128,
    totalSpent: 2400,
    rating: 4.7,
  },
  {
    name: "Carlos López",
    email: "carlos@email.com",
    routinesCompleted: 115,
    totalSpent: 2100,
    rating: 4.6,
  },
  {
    name: "Ana Martínez",
    email: "ana@email.com",
    routinesCompleted: 98,
    totalSpent: 1800,
    rating: 4.5,
  },
];

export const TopUsersTable = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-heading font-semibold text-foreground mb-4">
        Top Usuarios por Actividad
      </h3>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Usuario</TableHead>
            <TableHead className="text-muted-foreground text-right">Rutinas</TableHead>
            <TableHead className="text-muted-foreground text-right">Gasto Total</TableHead>
            <TableHead className="text-muted-foreground text-right">Calificación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topUsers.map((user) => (
            <TableRow key={user.email} className="border-border">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xs font-medium">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium text-foreground">
                {user.routinesCompleted}
              </TableCell>
              <TableCell className="text-right font-medium text-success">
                ${user.totalSpent.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-medium text-foreground">{user.rating}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
