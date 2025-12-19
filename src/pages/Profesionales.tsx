import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProfessionalCard } from "@/components/professionals/ProfessionalCard";
import { BookingFlow } from "@/components/professionals/BookingFlow";
import { AuthPromptModal } from "@/components/auth/AuthPromptModal";
import { useProfessionals, Professional } from "@/hooks/useProfessionals";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const Profesionales = () => {
  const { data: professionals, isLoading } = useProfessionals();
  const { user } = useAuth();
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleSchedule = (professional: Professional) => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }
    setSelectedProfessional(professional);
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
            Agenda una sesión personalizada con nuestros especialistas
          </p>
        </header>

        {/* Professionals List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          ) : professionals && professionals.length > 0 ? (
            professionals.map((professional, index) => (
              <div
                key={professional.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProfessionalCard
                  professional={professional}
                  onSchedule={() => handleSchedule(professional)}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No hay profesionales disponibles en este momento.
            </div>
          )}
        </div>

        {/* Coming Soon Notice */}
        <div className="text-center py-6 text-muted-foreground/70 text-xs italic" style={{ fontWeight: 300 }}>
          <p>🔒 Próximamente podrás acceder a más profesionales certificados Just Muv.</p>
        </div>
      </div>

      {/* Booking Flow */}
      {selectedProfessional && (
        <BookingFlow
          professional={selectedProfessional}
          isOpen={!!selectedProfessional}
          onClose={() => setSelectedProfessional(null)}
        />
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        title="Necesitas una cuenta para continuar"
        description="Para agendar una cita personalizada y guardar tu información, debes iniciar sesión o crear una cuenta."
      />
    </AppLayout>
  );
};

export default Profesionales;
