import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  label: string;
}

interface FiltersState {
  category: string[];
  difficulty: string[];
  equipment: string[];
  duration: string;
  aptitude: string[];
  sortBy: string;
}

interface LibraryFiltersProps {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

const categories: FilterOption[] = [
  { id: "funcional", label: "Funcional" },
  { id: "kinesiologia", label: "Kinesiología" },
  { id: "activacion", label: "Activación" },
];

const difficulties: FilterOption[] = [
  { id: "Principiante", label: "Principiante" },
  { id: "Intermedio", label: "Intermedio" },
  { id: "Avanzado", label: "Avanzado" },
];

const durations: FilterOption[] = [
  { id: "short", label: "< 15 min" },
  { id: "medium", label: "15-30 min" },
  { id: "long", label: "> 30 min" },
];

const aptitudes: FilterOption[] = [
  { id: "Fuerza", label: "Fuerza" },
  { id: "Potencia", label: "Potencia" },
  { id: "Agilidad", label: "Agilidad" },
  { id: "Coordinación", label: "Coordinación" },
  { id: "Estabilidad", label: "Estabilidad" },
  { id: "Velocidad", label: "Velocidad" },
  { id: "Resistencia", label: "Resistencia" },
  { id: "Movilidad", label: "Movilidad" },
];

const sortOptions: FilterOption[] = [
  { id: "rating-desc", label: "Mejor calificadas" },
  { id: "completed-desc", label: "Más realizadas" },
  { id: "duration-asc", label: "Más cortas" },
  { id: "duration-desc", label: "Más largas" },
];

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
      )}
    >
      {children}
    </button>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function LibraryFilters({ filters, onFiltersChange }: LibraryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleArrayFilter = (
    key: keyof FiltersState,
    value: string
  ) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    onFiltersChange({ ...filters, [key]: newArray });
  };

  const setFilter = (key: keyof FiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: [],
      difficulty: [],
      equipment: [],
      duration: "",
      aptitude: [],
      sortBy: "",
    });
  };

  const activeFiltersCount =
    filters.category.length +
    filters.difficulty.length +
    filters.equipment.length +
    filters.aptitude.length +
    (filters.duration ? 1 : 0) +
    (filters.sortBy ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 relative"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Filtros y orden</SheetTitle>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(85vh-120px)] pb-6">
          {/* Sort By */}
          <FilterSection title="Ordenar por">
            {sortOptions.map((option) => (
              <FilterChip
                key={option.id}
                selected={filters.sortBy === option.id}
                onClick={() =>
                  setFilter("sortBy", filters.sortBy === option.id ? "" : option.id)
                }
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterSection>

          {/* Category */}
          <FilterSection title="Categoría">
            {categories.map((option) => (
              <FilterChip
                key={option.id}
                selected={filters.category.includes(option.id)}
                onClick={() => toggleArrayFilter("category", option.id)}
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterSection>

          {/* Difficulty */}
          <FilterSection title="Dificultad">
            {difficulties.map((option) => (
              <FilterChip
                key={option.id}
                selected={filters.difficulty.includes(option.id)}
                onClick={() => toggleArrayFilter("difficulty", option.id)}
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterSection>

          {/* Duration */}
          <FilterSection title="Duración">
            {durations.map((option) => (
              <FilterChip
                key={option.id}
                selected={filters.duration === option.id}
                onClick={() =>
                  setFilter("duration", filters.duration === option.id ? "" : option.id)
                }
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterSection>

          {/* Aptitudes */}
          <FilterSection title="Aptitud principal">
            {aptitudes.map((option) => (
              <FilterChip
                key={option.id}
                selected={filters.aptitude.includes(option.id)}
                onClick={() => toggleArrayFilter("aptitude", option.id)}
              >
                {option.label}
              </FilterChip>
            ))}
          </FilterSection>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <SheetClose asChild>
            <Button className="w-full">Aplicar filtros</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}