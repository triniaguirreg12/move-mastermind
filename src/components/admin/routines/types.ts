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

export interface Rutina {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: "Funcional" | "Kinesiología" | "Activación" | "";
  objetivoMode: "manual" | "auto";
  objetivo: RutinaObjetivo;
  bloques: RutinaBloque[];
  estado: "borrador" | "publicada";
  descansoEntreBloques: number; // seconds
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
  objetivoMode: "auto",
  objetivo: createEmptyObjetivo(),
  bloques: [],
  estado: "borrador",
  descansoEntreBloques: 60,
});
