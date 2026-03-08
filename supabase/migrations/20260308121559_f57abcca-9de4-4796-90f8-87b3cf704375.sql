-- Mark phones as whatsapp when they have pn or lid filled
UPDATE public.cliente_telefone
SET is_whatsapp = true
WHERE (pn IS NOT NULL AND pn != '') OR (lid IS NOT NULL AND lid != '');