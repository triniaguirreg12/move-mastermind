import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink, Edit, Trash2 } from "lucide-react";

const alianzas = [
  {
    id: 1,
    nombre: "Nike",
    tipo: "Sponsor",
    descripcion: "Equipamiento deportivo oficial",
    estado: "activa",
    fechaInicio: "2024-01-15",
    logo: "N",
  },
  {
    id: 2,
    nombre: "Clínica Santa María",
    tipo: "Salud",
    descripcion: "Servicios médicos y evaluaciones",
    estado: "activa",
    fechaInicio: "2024-03-01",
    logo: "CSM",
  },
  {
    id: 3,
    nombre: "Gatorade",
    tipo: "Nutrición",
    descripcion: "Hidratación y suplementos",
    estado: "activa",
    fechaInicio: "2024-02-10",
    logo: "G",
  },
  {
    id: 4,
    nombre: "Gimnasio FitLife",
    tipo: "Infraestructura",
    descripcion: "Espacios para sesiones presenciales",
    estado: "pendiente",
    fechaInicio: null,
    logo: "FL",
  },
];

const AdminAlianzas = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Alianzas</h1>
          <p className="text-muted-foreground">Gestión de partnerships y sponsors</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Alianza
        </Button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {alianzas.map((alianza) => (
          <Card
            key={alianza.id}
            className="bg-card border-border p-5 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-bold">{alianza.logo}</span>
              </div>
              <Badge
                className={
                  alianza.estado === "activa"
                    ? "bg-success/20 text-success"
                    : "bg-warning/20 text-warning"
                }
              >
                {alianza.estado}
              </Badge>
            </div>

            <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
              {alianza.nombre}
            </h3>
            <Badge variant="outline" className="mb-3 border-border">
              {alianza.tipo}
            </Badge>

            <p className="text-sm text-muted-foreground mb-4">{alianza.descripcion}</p>

            {alianza.fechaInicio && (
              <p className="text-xs text-muted-foreground mb-4">
                Desde: {new Date(alianza.fechaInicio).toLocaleDateString("es-CL")}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ExternalLink className="h-3 w-3" />
                Ver detalles
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminAlianzas;
