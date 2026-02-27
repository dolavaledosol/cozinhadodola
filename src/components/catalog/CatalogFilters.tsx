import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  nome: string;
}

interface FamiliaOption extends FilterOption {
  familia_pai_id: string | null;
}

interface CatalogFiltersProps {
  familias: FamiliaOption[];
  fabricantes: FilterOption[];
  selectedFamilia: string;
  selectedFabricante: string;
  onFamiliaChange: (value: string) => void;
  onFabricanteChange: (value: string) => void;
}

// Palette of distinct hue-based colors for family groups
const GROUP_COLORS = [
  { bg: "bg-rose-100 dark:bg-rose-900/40", border: "border-rose-300 dark:border-rose-700", active: "bg-rose-500 dark:bg-rose-600 text-white border-rose-500" },
  { bg: "bg-sky-100 dark:bg-sky-900/40", border: "border-sky-300 dark:border-sky-700", active: "bg-sky-500 dark:bg-sky-600 text-white border-sky-500" },
  { bg: "bg-amber-100 dark:bg-amber-900/40", border: "border-amber-300 dark:border-amber-700", active: "bg-amber-500 dark:bg-amber-600 text-white border-amber-500" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/40", border: "border-emerald-300 dark:border-emerald-700", active: "bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-500" },
  { bg: "bg-violet-100 dark:bg-violet-900/40", border: "border-violet-300 dark:border-violet-700", active: "bg-violet-500 dark:bg-violet-600 text-white border-violet-500" },
  { bg: "bg-orange-100 dark:bg-orange-900/40", border: "border-orange-300 dark:border-orange-700", active: "bg-orange-500 dark:bg-orange-600 text-white border-orange-500" },
  { bg: "bg-teal-100 dark:bg-teal-900/40", border: "border-teal-300 dark:border-teal-700", active: "bg-teal-500 dark:bg-teal-600 text-white border-teal-500" },
  { bg: "bg-pink-100 dark:bg-pink-900/40", border: "border-pink-300 dark:border-pink-700", active: "bg-pink-500 dark:bg-pink-600 text-white border-pink-500" },
];

const CatalogFilters = ({
  familias,
  fabricantes,
  selectedFamilia,
  selectedFabricante,
  onFamiliaChange,
  onFabricanteChange,
}: CatalogFiltersProps) => {
  const hasFilters = selectedFamilia !== "all" || selectedFabricante !== "all";

  // Build hierarchy and assign colors per parent group
  const familiaButtons = useMemo(() => {
    const parents = familias.filter((f) => !f.familia_pai_id);
    const items: { id: string; label: string; colorIdx: number }[] = [];

    parents.forEach((parent, idx) => {
      const colorIdx = idx % GROUP_COLORS.length;
      const children = familias.filter((f) => f.familia_pai_id === parent.id);
      items.push({ id: parent.id, label: parent.nome, colorIdx });
      children.forEach((child) => {
        items.push({ id: child.id, label: child.nome, colorIdx });
      });
    });

    // orphans (parent not in active list)
    const parentIds = new Set(parents.map((p) => p.id));
    const childIds = new Set(items.map((i) => i.id));
    familias.forEach((f, idx) => {
      if (!childIds.has(f.id)) {
        items.push({ id: f.id, label: f.nome, colorIdx: (parents.length + idx) % GROUP_COLORS.length });
      }
    });

    return items;
  }, [familias]);

  return (
    <div className="space-y-3">
      {/* Família filter */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Família</p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedFamilia === "all" ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => onFamiliaChange("all")}
            >
              Todas
            </Button>
            {familiaButtons.map((f) => {
              const colors = GROUP_COLORS[f.colorIdx];
              const isActive = selectedFamilia === f.id;
              return (
                <button
                  key={f.id}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
                    isActive
                      ? colors.active
                      : `${colors.bg} ${colors.border} hover:opacity-80`
                  )}
                  onClick={() => onFamiliaChange(isActive ? "all" : f.id)}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Fabricante filter */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Fabricante</p>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedFabricante === "all" ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => onFabricanteChange("all")}
            >
              Todos
            </Button>
            {fabricantes.map((f) => (
              <Button
                key={f.id}
                variant={selectedFabricante === f.id ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => onFabricanteChange(selectedFabricante === f.id ? "all" : f.id)}
              >
                {f.nome}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => {
            onFamiliaChange("all");
            onFabricanteChange("all");
          }}
        >
          <X className="h-3 w-3" /> Limpar filtros
        </Button>
      )}
    </div>
  );
};

export default CatalogFilters;
