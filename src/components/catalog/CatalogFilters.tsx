import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

const CatalogFilters = ({
  familias,
  fabricantes,
  selectedFamilia,
  selectedFabricante,
  onFamiliaChange,
  onFabricanteChange,
}: CatalogFiltersProps) => {
  const hasFilters = selectedFamilia !== "all" || selectedFabricante !== "all";

  // Build hierarchy: parents with their children
  const familiaTree = useMemo(() => {
    const parents = familias.filter((f) => !f.familia_pai_id);
    return parents.map((parent) => ({
      ...parent,
      children: familias.filter((f) => f.familia_pai_id === parent.id),
    }));
  }, [familias]);

  // Also include orphan subfamilies (whose parent isn't active)
  const allFamiliaButtons = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    for (const parent of familiaTree) {
      items.push({ id: parent.id, label: parent.nome });
      for (const child of parent.children) {
        items.push({ id: child.id, label: `${parent.nome} › ${child.nome}` });
      }
    }
    // orphans
    const parentIds = new Set(familiaTree.map((p) => p.id));
    const childIds = new Set(familiaTree.flatMap((p) => p.children.map((c) => c.id)));
    for (const f of familias) {
      if (!parentIds.has(f.id) && !childIds.has(f.id)) {
        items.push({ id: f.id, label: f.nome });
      }
    }
    return items;
  }, [familiaTree, familias]);

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
            {allFamiliaButtons.map((f) => (
              <Button
                key={f.id}
                variant={selectedFamilia === f.id ? "default" : "outline"}
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => onFamiliaChange(selectedFamilia === f.id ? "all" : f.id)}
              >
                {f.label}
              </Button>
            ))}
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
