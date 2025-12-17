import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock data - would come from database
const mockRoutine = {
  id: "1",
  title: "Funcional Full Body",
  subtitle: "Entrenamiento completo",
  description: "Una rutina diseñada para trabajar todo el cuerpo con movimientos funcionales. Ideal para mejorar fuerza, estabilidad y coordinación en una sola sesión. Perfecta para quienes buscan eficiencia en su entrenamiento.",
  imageUrl: "/placeholder.svg",
  rating: 4.6,
  difficulty: "Intermedio" as const,
  duration: "25 min",
  category: "funcional" as const,
  equipment: ["Mancuernas", "Kettlebell", "Banda"],
  tags: ["Funcional", "Full Body", "Fuerza"],
  meta: "3 circuitos · 3 series",
  blocks: [
    {
      id: "1",
      name: "Calentamiento",
      exercises: [
        { id: "1", name: "Jumping Jacks", thumbnail: "/placeholder.svg", videoUrl: "/placeholder.svg", tips: "Mantén los brazos extendidos y el core activado durante todo el movimiento." },
        { id: "2", name: "Rotación de cadera", thumbnail: "/placeholder.svg", videoUrl: "/placeholder.svg", tips: "Realiza el movimiento de forma controlada, sin forzar el rango." },
      ]
    },
    {
      id: "2",
      name: "Circuito Principal",
      exercises: [
        { id: "3", name: "Sentadilla con press", thumbnail: "/placeholder.svg", videoUrl: "/placeholder.svg", tips: "Baja hasta que los muslos estén paralelos al suelo antes de realizar el press." },
        { id: "4", name: "Remo con mancuerna", thumbnail: "/placeholder.svg", videoUrl: "/placeholder.svg", tips: "Mantén la espalda recta y el codo cerca del cuerpo." },
        { id: "5", name: "Zancadas alternas", thumbnail: "/placeholder.svg", videoUrl: "/placeholder.svg", tips: "Da un paso amplio y baja la rodilla trasera cerca del suelo." },
        { id: "6", name: "Push-ups", thumbnail: "/placeholder.svg", videoUrl: "/placeholder.svg", tips: "Mantén el cuerpo en línea recta desde cabeza hasta talones." },
      ]
    },
    {
      id: "3",
      name: "Enfriamiento",
      exercises: [
        { id: "7", name: "Estiramiento de isquiotibiales", thumbnail: "/placeholder.svg", videoUrl: "/placeholder.svg", tips: "Mantén la pierna estirada y flexiona desde la cadera." },
        { id: "8", name: "Estiramiento de cuádriceps", thumbnail: "/placeholder.svg", videoUrl: "/placeholder.svg", tips: "Mantén las rodillas juntas y el core activado." },
      ]
    }
  ]
};

// Padel ball SVG component
function PadelBall({ filled, size = "md" }: { filled: boolean; size?: "sm" | "md" }) {
  const dimensions = size === "sm" ? 12 : 16;
  return (
    <svg
      width={dimensions}
      height={dimensions}
      viewBox="0 0 16 16"
      className={cn(
        "transition-colors",
        filled ? "text-primary" : "text-muted-foreground/40"
      )}
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        fill={filled ? "currentColor" : "transparent"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 3.5C6 5.5 6 10.5 4 12.5"
        stroke={filled ? "hsl(var(--primary-foreground))" : "currentColor"}
        strokeWidth="1"
        fill="none"
        opacity={filled ? 0.6 : 0.5}
      />
      <path
        d="M12 3.5C10 5.5 10 10.5 12 12.5"
        stroke={filled ? "hsl(var(--primary-foreground))" : "currentColor"}
        strokeWidth="1"
        fill="none"
        opacity={filled ? 0.6 : 0.5}
      />
    </svg>
  );
}

function DifficultyIndicator({ level }: { level: string }) {
  const filled = level === "Principiante" ? 1 : level === "Intermedio" ? 2 : 3;
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((i) => (
        <PadelBall key={i} filled={i <= filled} size="md" />
      ))}
    </div>
  );
}

interface ExerciseItemProps {
  exercise: {
    id: string;
    name: string;
    thumbnail: string;
    videoUrl: string;
    tips: string;
  };
}

function ExerciseItem({ exercise }: ExerciseItemProps) {
  const [isLongPress, setIsLongPress] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      setIsLongPress(true);
      setShowPreview(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsLongPress(false);
    setShowPreview(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-all cursor-pointer"
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
          <img
            src={exercise.thumbnail}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name */}
        <span className="text-sm font-medium text-foreground flex-1">
          {exercise.name}
        </span>

        {/* Long press hint */}
        <span className="text-[10px] text-muted-foreground">
          Mantener para ver
        </span>
      </div>

      {/* Preview Modal on Long Press */}
      {showPreview && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onMouseUp={handleTouchEnd}
          onTouchEnd={handleTouchEnd}
        >
          <div className="max-w-md w-full space-y-4">
            {/* Video */}
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <video
                ref={videoRef}
                src={exercise.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                poster={exercise.thumbnail}
              />
            </div>

            {/* Exercise name */}
            <h3 className="text-lg font-semibold text-white text-center">
              {exercise.name}
            </h3>

            {/* Tips */}
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/30">
              <p className="text-sm text-muted-foreground leading-relaxed">
                💡 {exercise.tips}
              </p>
            </div>

            {/* Release instruction */}
            <p className="text-xs text-white/60 text-center">
              Suelta para cerrar
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default function RutinaDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // In real app, fetch routine by id
  const routine = mockRoutine;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero Section */}
      <div className="relative h-72 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={routine.imageUrl}
            alt={routine.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-background" />
        </div>

        {/* Top Overlay - Back + Rating */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {routine.rating && routine.rating > 0 && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-sm font-semibold text-white">{routine.rating.toFixed(1)}</span>
              <Star className="w-4 h-4 text-warning fill-warning" />
            </div>
          )}
        </div>

        {/* Bottom Overlay - Title, Difficulty, Meta */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Difficulty */}
          <DifficultyIndicator level={routine.difficulty} />

          {/* Title */}
          <h1 className="text-2xl font-bold text-white leading-tight">
            {routine.title}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{routine.duration}</span>
            <span className="text-white/40">·</span>
            <span className="text-sm">{routine.meta}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Description Section */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Descripción
          </h2>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {routine.description}
          </p>
        </section>

        {/* Equipment */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Implementos
          </h2>
          <div className="flex flex-wrap gap-2">
            {routine.equipment.map((item) => (
              <span
                key={item}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Tags */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Etiquetas
          </h2>
          <div className="flex flex-wrap gap-2">
            {routine.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Exercise List by Blocks */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Ejercicios
          </h2>
          
          <div className="space-y-4">
            {routine.blocks.map((block, blockIndex) => (
              <div key={block.id} className="space-y-2">
                {/* Block separator - subtle divider between blocks */}
                {blockIndex > 0 && (
                  <div className="py-2">
                    <div className="h-px bg-border/50" />
                  </div>
                )}
                
                {/* Block name - subtle header */}
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
                  {block.name}
                </p>

                {/* Exercises in block */}
                <div className="space-y-2">
                  {block.exercises.map((exercise) => (
                    <ExerciseItem key={exercise.id} exercise={exercise} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-12 text-sm font-medium"
            onClick={() => {
              // Navigate to calendar or open scheduling modal
              navigate("/calendario");
            }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Programar
          </Button>
          <Button
            className="flex-[2] h-12 text-sm font-semibold"
            onClick={() => {
              // Start routine - would navigate to workout execution view
              console.log("Starting routine:", routine.id);
            }}
          >
            Comenzar rutina
          </Button>
        </div>
      </div>
    </div>
  );
}
