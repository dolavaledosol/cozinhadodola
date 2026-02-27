import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterOption {
  id: string;
  nome: string;
}

interface CatalogFiltersProps {
  familias: FilterOption[];
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

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <Select value={selectedFamilia} onValueChange={onFamiliaChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Família" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as famílias</SelectItem>
          {familias.map((f) => (
            <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedFabricante} onValueChange={onFabricanteChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Fabricante" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os fabricantes</SelectItem>
          {fabricantes.map((f) => (
            <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
          ))}
        </SelectContent>
      </Select>

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
