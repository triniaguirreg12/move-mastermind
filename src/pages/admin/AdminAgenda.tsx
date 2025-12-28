import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock } from "lucide-react";
import { useAllProfessionals } from "@/hooks/useProfessionals";
import { AvailabilityTab } from "@/components/admin/agenda/AvailabilityTab";
import { AppointmentsTab } from "@/components/admin/agenda/AppointmentsTab";

const AdminAgenda = () => {
  const [activeTab, setActiveTab] = useState("appointments");
  const { data: professionals = [] } = useAllProfessionals();

  // Use first professional as default (can be extended for multi-professional)
  const defaultProfessionalId = professionals[0]?.id;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Agenda</h1>
        <p className="text-muted-foreground">Gestión de disponibilidad y citas</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="appointments" className="gap-2">
            <Calendar className="h-4 w-4" />
            Citas Agendadas
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2">
            <Clock className="h-4 w-4" />
            Disponibilidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="mt-6">
          <AppointmentsTab />
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          {defaultProfessionalId ? (
            <AvailabilityTab professionalId={defaultProfessionalId} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No hay profesionales registrados.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAgenda;
