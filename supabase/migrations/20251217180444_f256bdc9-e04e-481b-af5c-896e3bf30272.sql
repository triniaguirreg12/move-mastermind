-- Create exercises table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tips TEXT,
  dificultad TEXT NOT NULL CHECK (dificultad IN ('Principiante', 'Intermedio', 'Avanzado')),
  mecanicas TEXT[] DEFAULT '{}',
  grupo_muscular TEXT[] DEFAULT '{}',
  musculos_principales TEXT[] DEFAULT '{}',
  aptitudes_primarias TEXT[] DEFAULT '{}',
  aptitudes_secundarias TEXT[] DEFAULT '{}',
  implementos TEXT[] DEFAULT '{}',
  video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routines table
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Funcional', 'Kinesiología', 'Activación')),
  dificultad TEXT NOT NULL CHECK (dificultad IN ('Principiante', 'Intermedio', 'Avanzado')),
  dificultad_mode TEXT DEFAULT 'auto' CHECK (dificultad_mode IN ('auto', 'manual')),
  objetivo_mode TEXT DEFAULT 'auto' CHECK (objetivo_mode IN ('auto', 'manual')),
  objetivo JSONB DEFAULT '{"fuerza": 0, "potencia": 0, "agilidad": 0, "coordinacion": 0, "velocidad": 0, "estabilidad": 0, "movilidad": 0, "resistencia": 0}',
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicada')),
  descanso_entre_bloques INTEGER DEFAULT 60,
  portada_type TEXT DEFAULT '',
  portada_url TEXT,
  calificacion DECIMAL(2,1),
  veces_realizada INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routine blocks table
CREATE TABLE public.routine_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  repetir_bloque BOOLEAN DEFAULT false,
  series INTEGER DEFAULT 1,
  descanso_entre_ejercicios INTEGER DEFAULT 30,
  descanso_entre_series INTEGER DEFAULT 60,
  usar_mismo_descanso BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create block exercises table (junction table)
CREATE TABLE public.block_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_id UUID NOT NULL REFERENCES public.routine_blocks(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
  orden INTEGER NOT NULL DEFAULT 0,
  tipo_ejecucion TEXT NOT NULL DEFAULT 'tiempo' CHECK (tipo_ejecucion IN ('tiempo', 'repeticiones')),
  tiempo INTEGER DEFAULT 0,
  repeticiones INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_exercises ENABLE ROW LEVEL SECURITY;

-- Create public read policies (all users can view published content)
CREATE POLICY "Anyone can view exercises"
  ON public.exercises FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view published routines"
  ON public.routines FOR SELECT
  USING (estado = 'publicada' OR true); -- Allow all for now, can restrict later

CREATE POLICY "Anyone can view routine blocks"
  ON public.routine_blocks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view block exercises"
  ON public.block_exercises FOR SELECT
  USING (true);

-- Admin write policies (using auth.uid() for now, can add admin role later)
CREATE POLICY "Authenticated users can manage exercises"
  ON public.exercises FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage routines"
  ON public.routines FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage routine blocks"
  ON public.routine_blocks FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage block exercises"
  ON public.block_exercises FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_routines_categoria ON public.routines(categoria);
CREATE INDEX idx_routines_estado ON public.routines(estado);
CREATE INDEX idx_routine_blocks_routine_id ON public.routine_blocks(routine_id);
CREATE INDEX idx_block_exercises_block_id ON public.block_exercises(block_id);

-- Create trigger for updated_at on exercises
CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on routines
CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();