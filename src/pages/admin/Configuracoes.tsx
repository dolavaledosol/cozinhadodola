import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Webhook, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

interface Configuracao {
  configuracao_id: string;
  chave: string;
  valor: string | null;
}

const WEBHOOK_SECTIONS = [
  {
    title: "Webhook Enviar Foto",
    description: "Configure a URL e a chave de autenticação para envio de fotos de produtos para clientes via webhook.",
    keys: [
      { chave: "webhook_envia_foto_url", label: "URL do Webhook Enviar Foto", placeholder: "https://exemplo.com/webhook-envia-foto" },
      { chave: "webhook_envia_foto_apikey", label: "API Key do Webhook Enviar Foto", placeholder: "Bearer token ou chave de autenticação" },
    ],
  },
];

const SOCIAL_KEYS = [
  { chave: "whatsapp_numero", label: "Número do WhatsApp (com DDI e DDD)", placeholder: "+55 31 99999-9999", help: "Apenas dígitos serão usados no link wa.me. Ex: +5531999999999" },
  { chave: "instagram_handle", label: "Usuário do Instagram (sem @)", placeholder: "cozinhadodola", help: "Apenas o handle, sem @ ou URL. O link gerado será https://instagram.com/handle" },
];

const ALL_WEBHOOK_KEYS = WEBHOOK_SECTIONS.flatMap((s) => s.keys.map((k) => k.chave));

const Configuracoes = () => {
  const [items, setItems] = useState<Configuracao[]>([]);
  const [webhookValues, setWebhookValues] = useState<Record<string, string>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("configuracao")
      .select("configuracao_id, chave, valor")
      .is("user_id", null)
      .order("chave");

    if (error) {
      toast({ title: "Erro ao carregar configurações", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const loadedItems = data || [];
    setItems(loadedItems);

    const wv: Record<string, string> = {};
    for (const key of ALL_WEBHOOK_KEYS) {
      const found = loadedItems.find((d) => d.chave === key);
      wv[key] = found?.valor || "";
    }
    setWebhookValues(wv);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveWebhookSection = async (sectionTitle: string, keys: typeof WEBHOOK_SECTIONS[0]["keys"]) => {
    setSavingSection(sectionTitle);
    for (const wk of keys) {
      const existing = items.find((i) => i.chave === wk.chave);
      const val = webhookValues[wk.chave] || null;
      if (existing) {
        await supabase.from("configuracao").update({ valor: val }).eq("configuracao_id", existing.configuracao_id);
      } else {
        await supabase.from("configuracao").insert({ chave: wk.chave, valor: val, user_id: null });
      }
    }
    setSavingSection(null);
    toast({ title: `Configurações de ${sectionTitle.toLowerCase()} salvas` });
    load();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurações"
        subtitle="URLs dos payloads ficam visíveis abaixo de cada campo para facilitar a conferência."
      />

      {WEBHOOK_SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" /> {section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.keys.map((wk) => (
              <div key={wk.chave} className="space-y-2">
                <Label>{wk.label}</Label>
                <Input
                  value={webhookValues[wk.chave] || ""}
                  onChange={(e) => setWebhookValues((prev) => ({ ...prev, [wk.chave]: e.target.value }))}
                  placeholder={wk.placeholder}
                  type={wk.chave.includes("apikey") ? "password" : "text"}
                />
                {wk.chave.includes("_url") && (
                  <p className="text-xs text-muted-foreground break-all">
                    URL atual: {loading ? "Carregando..." : webhookValues[wk.chave] || "Não configurada"}
                  </p>
                )}
              </div>
            ))}
            <Button onClick={() => saveWebhookSection(section.title, section.keys)} disabled={savingSection === section.title} className="gap-2">
              <Save className="h-4 w-4" />
              {savingSection === section.title ? "Salvando..." : `Salvar ${section.title}`}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Configuracoes;
