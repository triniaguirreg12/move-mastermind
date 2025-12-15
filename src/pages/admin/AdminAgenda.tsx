import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, Video, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

const kinesiologos = [
  {
    id: 1,
    nombre: "Isabel Rencoret",
    especialidad: "Rehabilitación deportiva",
    avatar: "IR",
    color: "bg-primary",
  },
  {
    id: 2,
    nombre: "Magdalena Torres",
    especialidad: "Kinesiología general",
    avatar: "MT",
    color: "bg-accent",
  },
  {
    id: 3,
    nombre: "Diego Fuentes",
    especialidad: "Traumatología",
    avatar: "DF",
    color: "bg-success",
  },
];

const citas = [
  {
    id: 1,
    kinesiologo: "Isabel Rencoret",
    paciente: "Rosario González",
    fecha: new Date(),
    hora: "09:00",
    duracion: 60,
    tipo: "presencial",
    estado: "confirmada",
  },
  {
    id: 2,
    kinesiologo: "Isabel Rencoret",
    paciente: "Carlos López",
    fecha: new Date(),
    hora: "10:30",
    duracion: 45,
    tipo: "online",
    estado: "confirmada",
  },
  {
    id: 3,
    kinesiologo: "Magdalena Torres",
    paciente: "María Fernández",
    fecha: new Date(),
    hora: "11:00",
    duracion: 60,
    tipo: "presencial",
    estado: "pendiente",
  },
  {
    id: 4,
    kinesiologo: "Diego Fuentes",
    paciente: "Pepito Pérez",
    fecha: addDays(new Date(), 1),
    hora: "14:00",
    duracion: 60,
    tipo: "presencial",
    estado: "confirmada",
  },
  {
    id: 5,
    kinesiologo: "Isabel Rencoret",
    paciente: "Ana Martínez",
    fecha: addDays(new Date(), 2),
    hora: "16:00",
    duracion: 30,
    tipo: "online",
    estado: "confirmada",
  },
];

const AdminAgenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate, { locale: es });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getKinesiologo = (nombre: string) =>
    kinesiologos.find((k) => k.nombre === nombre);

  const getCitasByDay = (date: Date) =>
    citas.filter(
      (c) => format(c.fecha, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">Gestión de citas y sesiones</p>
        </div>
        <Button className="gap-2">
          <Calendar className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      {/* Kinesiologos */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {kinesiologos.map((k) => (
          <Card
            key={k.id}
            className="bg-card border-border p-4 min-w-[200px] hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${k.color} flex items-center justify-center`}
              >
                <span className="text-white text-sm font-medium">{k.avatar}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{k.nombre}</p>
                <p className="text-xs text-muted-foreground">{k.especialidad}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentDate(addDays(currentDate, -7))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="font-heading font-semibold text-foreground">
          {format(weekStart, "d 'de' MMMM", { locale: es })} -{" "}
          {format(addDays(weekStart, 6), "d 'de' MMMM, yyyy", { locale: es })}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentDate(addDays(currentDate, 7))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week View */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayCitas = getCitasByDay(day);
          const isToday =
            format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div key={day.toISOString()} className="space-y-2">
              <div
                className={`text-center p-2 rounded-lg ${
                  isToday ? "bg-primary text-primary-foreground" : "bg-card"
                }`}
              >
                <p className="text-xs uppercase">
                  {format(day, "EEE", { locale: es })}
                </p>
                <p className="text-lg font-bold">{format(day, "d")}</p>
              </div>

              <div className="space-y-2 min-h-[300px]">
                {dayCitas.map((cita) => {
                  const k = getKinesiologo(cita.kinesiologo);
                  return (
                    <Card
                      key={cita.id}
                      className="bg-card border-border p-3 hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-6 h-6 rounded-full ${k?.color} flex items-center justify-center`}
                        >
                          <span className="text-white text-[10px] font-medium">
                            {k?.avatar}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate">
                          {cita.kinesiologo.split(" ")[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-foreground mb-1">
                        <Clock className="h-3 w-3" />
                        {cita.hora} ({cita.duracion}min)
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <User className="h-3 w-3" />
                        {cita.paciente}
                      </div>

                      <div className="flex items-center gap-1">
                        {cita.tipo === "online" ? (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Video className="h-2 w-2" /> Online
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-1 border-border">
                            <MapPin className="h-2 w-2" /> Presencial
                          </Badge>
                        )}
                        <Badge
                          className={`text-[10px] ${
                            cita.estado === "confirmada"
                              ? "bg-success/20 text-success"
                              : "bg-warning/20 text-warning"
                          }`}
                        >
                          {cita.estado}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminAgenda;
