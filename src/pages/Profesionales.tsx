import { AppLayout } from "@/components/layout/AppLayout";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import { toast } from "sonner";

const professionals = [
  {
    id: 1,
    name: "Isabel Rencoret",
    title: "Kinesióloga Deportiva",
    specialty: "Especialista en rehabilitación deportiva y prevención de lesiones",
    experience: "7 años de experiencia",
    location: "Santiago, Chile",
    available: true,
  },
  {
    id: 2,
    name: "Carlos Mendoza",
    title: "Kinesiólogo Deportivo",
    specialty: "Entrenamiento funcional y readaptación física",
    experience: "5 años de experiencia",
    location: "Santiago, Chile",
    available: true,
  },
  {
    id: 3,
    name: "María González",
    title: "Kinesióloga Deportiva",
    specialty: "Terapia manual y tratamiento de lesiones crónicas",
    experience: "10 años de experiencia",
    location: "Santiago, Chile",
    available: false,
  },
];

const Profesionales = () => {
  const handleSchedule = (name: string) => {
    toast.success(`Solicitud enviada a ${name}`, {
      description: "Te contactaremos pronto para confirmar la cita.",
    });
  };

  return (
    <AppLayout>
      <div className="min-h-screen px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
        {/* Header */}
        <header>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Profesionales
          </h1>
          <p className="text-muted-foreground mt-1">
            Agenda una sesión con nuestros especialistas
          </p>
        </header>

        {/* Professionals List */}
        <div className="space-y-4">
          {professionals.map((professional, index) => (
            <div
              key={professional.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProfessionalCard
                name={professional.name}
                title={professional.title}
                specialty={professional.specialty}
                experience={professional.experience}
                location={professional.location}
                available={professional.available}
                onSchedule={() => handleSchedule(professional.name)}
              />
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Profesionales;
