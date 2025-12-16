import { Ejercicio } from "@/components/admin/CreateExerciseModal";

export interface RutinaEjercicio {
  id: string;
  ejercicio: Ejercicio;
  tipoEjecucion: "tiempo" | "repeticiones";
  tiempo: number; // seconds
  repeticiones: number;
  descansoOverride?: number; // optional override for rest after this exercise
}

export interface RutinaBloque {
  id: string;
  nombre: string;
  ejercicios: RutinaEjercicio[];
  repetirBloque: boolean;
  series: number;
  descansoEntreEjercicios: number; // seconds
  descansoEntreSeries: number; // seconds
  usarMismoDescanso: boolean;
}

export interface RutinaObjetivo {
  fuerza: number;
  potencia: number;
  agilidad: number;
  coordinacion: number;
  velocidad: number;
  estabilidad: number;
  movilidad: number;
  resistencia: number;
}

export type DificultadRutina = "Principiante" | "Intermedio" | "Avanzado";

export const DIFICULTADES_RUTINA: DificultadRutina[] = ["Principiante", "Intermedio", "Avanzado"];

export interface Rutina {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: "Funcional" | "Kinesiología" | "Activación" | "";
  dificultad: DificultadRutina | "";
  dificultadMode: "manual" | "auto";
  objetivoMode: "manual" | "auto";
  objetivo: RutinaObjetivo;
  bloques: RutinaBloque[];
  estado: "borrador" | "publicada";
  descansoEntreBloques: number; // seconds
  portadaType: "ejercicio" | "custom" | "";
  portadaEjercicioId?: number;
  portadaCustomUrl?: string;
  // New fields for library display
  calificacion?: number; // average rating (0-5)
  vecesRealizada?: number; // times completed
}

export const APTITUDES_KEYS: (keyof RutinaObjetivo)[] = [
  "fuerza",
  "potencia",
  "agilidad",
  "coordinacion",
  "velocidad",
  "estabilidad",
  "movilidad",
  "resistencia",
];

export const APTITUDES_LABELS: Record<keyof RutinaObjetivo, string> = {
  fuerza: "Fuerza",
  potencia: "Potencia",
  agilidad: "Agilidad",
  coordinacion: "Coordinación",
  velocidad: "Velocidad",
  estabilidad: "Estabilidad",
  movilidad: "Movilidad",
  resistencia: "Resistencia",
};

export const CATEGORIAS_RUTINA = ["Funcional", "Kinesiología", "Activación"] as const;

export const createEmptyObjetivo = (): RutinaObjetivo => ({
  fuerza: 0,
  potencia: 0,
  agilidad: 0,
  coordinacion: 0,
  velocidad: 0,
  estabilidad: 0,
  movilidad: 0,
  resistencia: 0,
});

export const createEmptyBloque = (): RutinaBloque => ({
  id: crypto.randomUUID(),
  nombre: "",
  ejercicios: [],
  repetirBloque: false,
  series: 1,
  descansoEntreEjercicios: 30,
  descansoEntreSeries: 60,
  usarMismoDescanso: true,
});

export const createEmptyRutina = (): Rutina => ({
  id: 0,
  nombre: "",
  descripcion: "",
  categoria: "",
  dificultad: "",
  dificultadMode: "auto",
  objetivoMode: "auto",
  objetivo: createEmptyObjetivo(),
  bloques: [],
  estado: "borrador",
  descansoEntreBloques: 60,
  portadaType: "",
  portadaEjercicioId: undefined,
  portadaCustomUrl: undefined,
  calificacion: undefined,
  vecesRealizada: 0,
});

// Helper to calculate total duration in seconds
export const calcularDuracionRutina = (rutina: Rutina): number => {
  const SEGUNDOS_POR_REP = 3; // estimated seconds per rep
  let totalSegundos = 0;

  rutina.bloques.forEach((bloque, bloqueIndex) => {
    const series = bloque.repetirBloque ? bloque.series : 1;
    
    bloque.ejercicios.forEach((ej, ejIndex) => {
      // Time for exercise
      const tiempoEjercicio = ej.tipoEjecucion === "tiempo" 
        ? ej.tiempo 
        : ej.repeticiones * SEGUNDOS_POR_REP;
      
      // Rest after exercise (except last in block)
      const descansoEj = ejIndex < bloque.ejercicios.length - 1 
        ? (ej.descansoOverride ?? bloque.descansoEntreEjercicios)
        : 0;
      
      totalSegundos += (tiempoEjercicio + descansoEj) * series;
    });

    // Rest between series (for repeated blocks)
    if (bloque.repetirBloque && series > 1) {
      const descansoSeries = bloque.usarMismoDescanso 
        ? bloque.descansoEntreEjercicios 
        : bloque.descansoEntreSeries;
      totalSegundos += descansoSeries * (series - 1);
    }

    // Rest between blocks (except last)
    if (bloqueIndex < rutina.bloques.length - 1) {
      totalSegundos += rutina.descansoEntreBloques;
    }
  });

  return totalSegundos;
};

// Helper to get unique implements from routine
export const obtenerImplementosRutina = (rutina: Rutina): string[] => {
  const implementosSet = new Set<string>();
  
  rutina.bloques.forEach(bloque => {
    bloque.ejercicios.forEach(ej => {
      ej.ejercicio.implementos?.forEach(impl => {
        implementosSet.add(impl);
      });
    });
  });

  const implementos = Array.from(implementosSet);
  
  // If there are real implements, filter out "Sin implemento"
  const realImplementos = implementos.filter(i => i !== "Sin implemento");
  if (realImplementos.length > 0) {
    return realImplementos;
  }
  
  // If all exercises are "Sin implemento" or no implements
  return implementos.length > 0 ? ["Sin implemento"] : [];
};
