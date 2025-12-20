import { useNavigate, Link } from "react-router-dom";
import { Lock, Play, RotateCcw, ChevronRight, Check, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { UserProgramItem, UserProgramStatus } from "@/hooks/useUserAllPrograms";
import { useEnrollInProgram } from "@/hooks/useUserPrograms";
import { toast } from "sonner";

interface YourProgramsSectionProps {
  programs: UserProgramItem[];
  activeProgramId?: string;
}

export function YourProgramsSection({ programs, activeProgramId }: YourProgramsSectionProps) {
  const navigate = useNavigate();
  const enrollInProgram = useEnrollInProgram();

  // Filter out the active program (it's shown in its own section)
  const otherPrograms = programs.filter(p => p.id !== activeProgramId);

  if (otherPrograms.length === 0) return null;

  const getStatusBadge = (status: UserProgramStatus, isPrivate: boolean) => {
    const badges = [];

    if (isPrivate) {
      badges.push(
        <Badge 
          key="private" 
          variant="outline" 
          className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/5"
        >
          <Lock className="h-2.5 w-2.5 mr-0.5" />
          Personalizado
        </Badge>
      );
    }

    switch (status) {
      case "not_started":
        badges.push(
          <Badge key="status" variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted-foreground/30 text-muted-foreground">
            No iniciado
          </Badge>
        );
        break;
      case "active":
        badges.push(
          <Badge key="status" className="text-[10px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-primary/30">
            Activo
          </Badge>
        );
        break;
      case "completed":
        badges.push(
          <Badge key="status" className="text-[10px] px-1.5 py-0 h-4 bg-activity-training/20 text-activity-training border-activity-training/30">
            <Check className="h-2.5 w-2.5 mr-0.5" />
            Completado
          </Badge>
        );
        break;
      case "paused":
        badges.push(
          <Badge key="status" variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-warning/30 text-warning">
            <Pause className="h-2.5 w-2.5 mr-0.5" />
            Pausado
          </Badge>
        );
        break;
    }

    return badges;
  };

  const getActionButton = (program: UserProgramItem) => {
    switch (program.status) {
      case "not_started":
        return (
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleStart(program);
            }}
          >
            <Play className="h-3 w-3 mr-1" />
            Comenzar
          </Button>
        );
      case "paused":
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleResume(program);
            }}
          >
            <Play className="h-3 w-3 mr-1" />
            Retomar
          </Button>
        );
      case "completed":
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleRepeat(program);
            }}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Repetir
          </Button>
        );
      default:
        return null;
    }
  };

  const handleStart = (program: UserProgramItem) => {
    enrollInProgram.mutate(
      { programId: program.id, startWeek: 1 },
      {
        onSuccess: () => {
          toast.success("¡Programa iniciado!");
          navigate(`/programa/${program.id}`, { state: { from: "/" } });
        },
      }
    );
  };

  const handleResume = (program: UserProgramItem) => {
    enrollInProgram.mutate(
      { programId: program.id, startWeek: program.currentWeek },
      {
        onSuccess: () => {
          toast.success("¡Programa retomado!");
          navigate(`/programa/${program.id}`, { state: { from: "/" } });
        },
      }
    );
  };

  const handleRepeat = (program: UserProgramItem) => {
    enrollInProgram.mutate(
      { programId: program.id, startWeek: 1 },
      {
        onSuccess: () => {
          toast.success("¡Programa reiniciado!");
          navigate(`/programa/${program.id}`, { state: { from: "/" } });
        },
      }
    );
  };

  const handleProgramClick = (program: UserProgramItem) => {
    navigate(`/programa/${program.id}`, { state: { from: "/" } });
  };

  return (
    <div className="mt-4">
      <h2 className="text-base font-semibold text-foreground mb-3">
        Tus programas personalizados
      </h2>
      <div className="space-y-2">
        {otherPrograms.map((program) => {
          const progressPercent = program.totalWeeks > 0 
            ? Math.round((program.completedWeeks / program.totalWeeks) * 100)
            : 0;

          return (
            <div
              key={program.id}
              onClick={() => handleProgramClick(program)}
              className="bg-card rounded-xl p-3 border border-border hover:border-primary/30 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Cover image */}
                {program.portada_url && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={program.portada_url}
                      alt={program.nombre}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 mb-1">
                    {getStatusBadge(program.status, program.isPrivate)}
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-sm font-medium text-foreground line-clamp-1">
                    {program.nombre}
                  </h3>
                  
                  {/* Progress */}
                  {program.totalWeeks > 0 && program.status !== "not_started" && (
                    <div className="mt-1.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Semana {program.currentWeek} de {program.totalWeeks}</span>
                        <span>{program.completedWeeks}/{program.totalWeeks}</span>
                      </div>
                      <Progress value={progressPercent} className="h-1" />
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {getActionButton(program)}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA to request a new personalized program */}
      <Link to="/profesionales" className="block mt-3">
        <Button variant="outline" className="w-full" size="sm">
          Solicitar nuevo programa personalizado
        </Button>
      </Link>
    </div>
  );
}
