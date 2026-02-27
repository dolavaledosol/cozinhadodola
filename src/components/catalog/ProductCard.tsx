import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  produto_id: string;
  nome: string;
  preco: number;
  descricao?: string;
  url_imagem?: string;
  familia_nome?: string;
  fabricante_nome?: string;
}

const ProductCard = ({
  produto_id,
  nome,
  preco,
  descricao,
  url_imagem,
  familia_nome,
  fabricante_nome,
}: ProductCardProps) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAdd = () => {
    addItem({ produto_id, nome, preco, url_imagem });
    toast({ title: "Adicionado ao carrinho", description: nome });
  };

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <div className="aspect-square relative bg-muted overflow-hidden">
        {url_imagem ? (
          <img
            src={url_imagem}
            alt={nome}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        {(familia_nome || fabricante_nome) && (
          <div className="flex flex-wrap gap-1">
            {familia_nome && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {familia_nome}
              </span>
            )}
            {fabricante_nome && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {fabricante_nome}
              </span>
            )}
          </div>
        )}
        <h3 className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
          {nome}
        </h3>
        {descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">{descricao}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-primary">
            R$ {preco.toFixed(2)}
          </span>
          <Button size="sm" onClick={handleAdd} className="gap-1.5 shrink-0">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
