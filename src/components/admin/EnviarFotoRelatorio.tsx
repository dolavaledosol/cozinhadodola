import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Send, Loader2, Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClienteFoto {
  cliente_id: string;
  nome: string;
  from: string | null;
  checked: boolean;
}

interface ProdutoFoto {
  produto_id: string;
  nome: string;
  url_imagem: string | null;
}

const safeJsonParse = (value: string) => {
  try { return JSON.parse(value); } catch { return null; }
};

const invokeWebhookProxy = async (body: {
  webhook_url: string;
  webhook_apikey?: string;
  log_tipo?: string;
  payload: unknown;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke("webhook-proxy", { body });
    if (error) throw error;
    return data;
  } catch (error: any) {
    const isFetchError =
      error?.name === "FunctionsFetchError" ||
      error?.message?.includes("Failed to send a request to the Edge Function");
    if (!isFetchError) throw error;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw error;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    const responseJson = responseText ? safeJsonParse(responseText) : null;
    if (!response.ok) {
      const errorMessage = responseJson?.error ? String(responseJson.error) : responseText || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    return responseJson ?? responseText;
  }
};

const EnviarFotoRelatorio = ({ inline = false }: { inline?: boolean }) => {
  const [clientes, setClientes] = useState<ClienteFoto[]>([]);
  const [produtos, setProdutos] = useState<ProdutoFoto[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [sending, setSending] = useState(false);

  const [searchCliente, setSearchCliente] = useState("");
  const [selectedProdutoId, setSelectedProdutoId] = useState<string | null>(null);
  const [searchProduto, setSearchProduto] = useState("");
  const [textoFoto, setTextoFoto] = useState("");

  const isMobile = useIsMobile();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoadingData(true);

    const [{ data: clientesDb }, { data: clienteWhatsDb }, { data: telefones }, { data: prods }] = await Promise.all([
      supabase.from("cliente").select("cliente_id, nome").eq("ativo", true).order("nome"),
      supabase.from("clientewhats").select("clientewhats_id, nome, lid, pn, cliente_id"),
      supabase.from("cliente_telefone").select("cliente_id, lid, pn"),
      supabase.from("produto").select("produto_id, nome, produto_imagem(url_imagem, ordem)").eq("ativo", true).order("nome"),
    ]);

    // Build from map: prioritize clientewhats, fallback to cliente_telefone
    const cwFromMap = new Map<string, string>();
    const cwStandalone: ClienteFoto[] = [];
    if (clienteWhatsDb) {
      for (const cw of clienteWhatsDb as any[]) {
        const effectiveFrom = cw.lid || cw.pn || null;
        if (!effectiveFrom) continue;
        if (cw.cliente_id) {
          if (!cwFromMap.has(cw.cliente_id)) cwFromMap.set(cw.cliente_id, effectiveFrom);
        } else {
          cwStandalone.push({ cliente_id: `cw_${cw.clientewhats_id}`, nome: cw.nome || "—", from: effectiveFrom, checked: false });
        }
      }
    }

    // Fallback: cliente_telefone (only for clients not already in cwFromMap)
    if (telefones) {
      for (const t of telefones as any[]) {
        const effectiveFrom = t.lid || t.pn || null;
        if (effectiveFrom && !cwFromMap.has(t.cliente_id)) {
          cwFromMap.set(t.cliente_id, effectiveFrom);
        }
      }
    }

    // Build final client list
    const clienteMap = new Map<string, ClienteFoto>();
    if (clientesDb) {
      for (const c of clientesDb as any[]) {
        const from = cwFromMap.get(c.cliente_id) || null;
        if (from) {
          clienteMap.set(c.cliente_id, { cliente_id: c.cliente_id, nome: c.nome, from, checked: false });
        }
      }
    }
    for (const cw of cwStandalone) {
      if (!clienteMap.has(cw.cliente_id)) clienteMap.set(cw.cliente_id, cw);
    }

    const result = Array.from(clienteMap.values());

    setClientes(result);

    // Build products with images
    if (prods) {
      setProdutos((prods as any[]).map((p) => {
        const imgs = p.produto_imagem || [];
        const imgPrincipal = imgs.length > 0 ? imgs.sort((a: any, b: any) => a.ordem - b.ordem)[0].url_imagem : null;
        return { produto_id: p.produto_id, nome: p.nome, url_imagem: imgPrincipal };
      }));
    }

    setLoadingData(false);
  }, []);

  useEffect(() => {
    if (inline) loadData();
  }, [inline, loadData]);

  const filteredClientes = useMemo(() => {
    const term = searchCliente.toLowerCase();
    return clientes.filter((c) => c.from && (!term || c.nome.toLowerCase().includes(term)));
  }, [clientes, searchCliente]);

  const filteredProdutos = useMemo(() => {
    const term = searchProduto.toLowerCase();
    return produtos.filter((p) => p.url_imagem && (!term || p.nome.toLowerCase().includes(term)));
  }, [produtos, searchProduto]);

  const selectedProduto = useMemo(() => produtos.find((p) => p.produto_id === selectedProdutoId), [produtos, selectedProdutoId]);

  const checkedClientes = useMemo(() => clientes.filter((c) => c.checked), [clientes]);

  const toggleCliente = useCallback((id: string, checked: boolean) => {
    setClientes((prev) => prev.map((c) => c.cliente_id === id ? { ...c, checked } : c));
  }, []);

  const allFilteredChecked = useMemo(
    () => filteredClientes.length > 0 && filteredClientes.every((c) => c.checked),
    [filteredClientes]
  );

  const toggleAll = useCallback((checked: boolean) => {
    const ids = new Set(filteredClientes.map((c) => c.cliente_id));
    setClientes((prev) => prev.map((c) => ids.has(c.cliente_id) ? { ...c, checked } : c));
  }, [filteredClientes]);

  const handleSend = async () => {
    if (checkedClientes.length === 0) {
      toast({ title: "Selecione ao menos um cliente", variant: "destructive" });
      return;
    }
    if (!selectedProduto || !selectedProduto.url_imagem) {
      toast({ title: "Selecione um produto com imagem", variant: "destructive" });
      return;
    }

    const { data: configs } = await supabase
      .from("configuracao").select("chave, valor")
      .in("chave", ["webhook_envia_foto_url", "webhook_envia_foto_apikey"])
      .is("user_id", null);

    const configMap: Record<string, string> = {};
    if (configs) configs.forEach((c: any) => { configMap[c.chave] = c.valor || ""; });

    const webhookUrl = configMap["webhook_envia_foto_url"];
    const webhookApikey = configMap["webhook_envia_foto_apikey"];

    if (!webhookUrl) {
      toast({ title: "Webhook não configurado", description: "Configure a URL do webhook 'Enviar Foto' em Configurações.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const payload = {
        tipo: "envia_foto",
        clientes: checkedClientes.map((c) => ({ nome: c.nome, from: c.from })),
        urlFoto: selectedProduto.url_imagem,
        nomeProduto: selectedProduto.nome,
        textoFoto: textoFoto.trim() || null,
      };

      const response = await invokeWebhookProxy({
        webhook_url: webhookUrl,
        webhook_apikey: webhookApikey,
        log_tipo: "webhook_envia_foto",
        payload,
      });

      if (response && typeof response === "object" && "error" in response && response.error) {
        throw new Error(String(response.error));
      }

      toast({ title: "Foto enviada com sucesso!" });
    } catch (err: any) {
      console.error("Erro ao enviar foto", err);
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const produtosComImagem = useMemo(() => produtos.filter((p) => p.url_imagem), [produtos]);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Produto selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Produto (com imagem)</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={searchProduto} onChange={(e) => setSearchProduto(e.target.value)} className="pl-9" />
        </div>

        {selectedProduto && (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/40 bg-primary/5">
            {selectedProduto.url_imagem && (
              <img src={selectedProduto.url_imagem} alt={selectedProduto.nome} className="w-16 h-16 rounded-md object-cover" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{selectedProduto.nome}</p>
              <p className="text-xs text-muted-foreground">Selecionado</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedProdutoId(null)}>Trocar</Button>
          </div>
        )}

        {!selectedProdutoId && (
          <div className="border rounded-lg max-h-[250px] overflow-y-auto">
            {filteredProdutos.length === 0 ? (
              <p className="text-center py-4 text-sm text-muted-foreground">Nenhum produto com imagem encontrado</p>
            ) : (
              <div className="divide-y">
                {filteredProdutos.map((p) => (
                  <button
                    key={p.produto_id}
                    onClick={() => setSelectedProdutoId(p.produto_id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    {p.url_imagem && (
                      <img src={p.url_imagem} alt={p.nome} className="w-10 h-10 rounded object-cover" />
                    )}
                    <span className="text-sm font-medium">{p.nome}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Texto da foto */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Texto da foto (opcional)</Label>
        <Textarea
          placeholder="Texto que acompanha a foto..."
          value={textoFoto}
          onChange={(e) => setTextoFoto(e.target.value)}
          rows={3}
        />
      </div>

      {/* Clientes selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Clientes ({checkedClientes.length} selecionados)</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={searchCliente} onChange={(e) => setSearchCliente(e.target.value)} className="pl-9" />
        </div>

        {isMobile ? (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            <button
              onClick={() => toggleAll(!allFilteredChecked)}
              className="w-full text-left rounded-xl border p-3 bg-muted/30 text-sm font-medium"
            >
              <Checkbox checked={allFilteredChecked} className="mr-2" />
              Selecionar todos ({filteredClientes.length})
            </button>
            {filteredClientes.map((c) => (
              <button
                key={c.cliente_id}
                onClick={() => toggleCliente(c.cliente_id, !c.checked)}
                className={`w-full text-left rounded-xl border p-3 flex justify-between items-center transition-colors ${c.checked ? "border-primary/40 bg-primary/5" : "bg-card"}`}
              >
                <div className="flex items-center gap-2">
                  <Checkbox checked={c.checked} />
                  <span className="font-medium text-sm">{c.nome}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{c.from}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allFilteredChecked} onCheckedChange={(v) => toggleAll(!!v)} />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>From</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</TableCell></TableRow>
                ) : filteredClientes.map((c) => (
                  <TableRow key={c.cliente_id} className={c.checked ? "bg-muted/30" : ""}>
                    <TableCell><Checkbox checked={c.checked} onCheckedChange={(v) => toggleCliente(c.cliente_id, !!v)} /></TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{c.from}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Send button */}
      <div className="flex justify-end">
        <Button onClick={handleSend} disabled={sending || checkedClientes.length === 0 || !selectedProdutoId}>
          {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Enviar Foto ({checkedClientes.length} cliente{checkedClientes.length !== 1 ? "s" : ""})
        </Button>
      </div>
    </div>
  );
};

export default EnviarFotoRelatorio;
