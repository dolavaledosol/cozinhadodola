import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Instagram } from "lucide-react";

/**
 * Botões flutuantes sobrepostos à página (canto inferior direito):
 * - WhatsApp (sempre exibido se houver número configurado)
 * - Instagram (exibido se houver handle configurado)
 *
 * Lê as chaves `whatsapp_numero` e `instagram_handle` da tabela `configuracao` (user_id IS NULL).
 */
const SocialFloatingButtons = () => {
  const [whats, setWhats] = useState<string>("");
  const [insta, setInsta] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("configuracao")
        .select("chave, valor")
        .is("user_id", null)
        .in("chave", ["whatsapp_numero", "instagram_handle"]);
      const w = data?.find((d) => d.chave === "whatsapp_numero")?.valor || "";
      const i = data?.find((d) => d.chave === "instagram_handle")?.valor || "";
      setWhats(w);
      setInsta(i);
    };
    load();
  }, []);

  const whatsDigits = whats.replace(/\D/g, "");
  const instaHandle = insta.replace(/^@/, "").trim();

  if (!whatsDigits && !instaHandle) return null;

  const openExternal = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      (window.top ?? window).open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {instaHandle && (
        <a
          href={`https://www.instagram.com/${instaHandle}`}
          onClick={openExternal(`https://www.instagram.com/${instaHandle}`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="pointer-events-auto h-9 w-9 rounded-full shadow-md flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
          style={{
            background:
              "linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
          }}
        >
          <Instagram className="h-4 w-4" />
        </a>
      )}
      {whatsDigits && (
        <a
          href={`https://wa.me/${whatsDigits}`}
          onClick={openExternal(`https://wa.me/${whatsDigits}`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fale conosco no WhatsApp"
          className="pointer-events-auto h-10 w-10 rounded-full shadow-md flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
          style={{ backgroundColor: "#25D366" }}
        >
          <svg viewBox="0 0 32 32" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.515 0 2.392-.43 2.564-.989.158-.516.158-.96.086-1.06-.13-.187-.43-.3-.86-.515z" />
            <path d="M16.001 0C7.166 0 0 7.166 0 16c0 2.846.78 5.515 2.135 7.802L0 32l8.42-2.106A15.94 15.94 0 0 0 16 32c8.836 0 16-7.166 16-16S24.836 0 16 0zm0 28.96a12.93 12.93 0 0 1-6.604-1.798l-.473-.282-4.9 1.225 1.247-4.79-.31-.488A12.95 12.95 0 0 1 3.04 16C3.04 8.85 8.85 3.04 16 3.04c7.15 0 12.96 5.81 12.96 12.96 0 7.15-5.81 12.96-12.96 12.96z" />
          </svg>
        </a>
      )}
    </div>
  );
};

export default SocialFloatingButtons;
