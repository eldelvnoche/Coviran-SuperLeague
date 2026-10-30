// Función de Supabase que envía las notificaciones push de la Superliga Covirán.
// La llaman la base de datos (cuando un jugador publica o comenta) y la acción de GitHub (resultados, Champions, golazos, crónicas).
// Se protege con el secreto PUSH_SECRET (cabecera x-push-secret). Desplegar con "Verify JWT" DESACTIVADO.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const NOMBRES: Record<string, string> = {
  dm: "Demian", rb: "Reda", th: "Taha", md: "Mouad", hs: "Husam", zk: "Zaka",
  bd: "Badr", ej: "Elouejdi", fd: "Fahd", hi: "Hicham", ch: "El Niño",
};
const corto = (t: unknown, n: number) => String(t ?? "").replace(/\s+/g, " ").trim().slice(0, n);

type Aviso = {
  titulo: string;
  cuerpo: string;
  url: string;
  tag: string;
  pref: "resultados" | "cronicas" | "comentarios" | "directos";
  destino?: string;
  excluir?: string;
};

function construir(b: Record<string, unknown>): Aviso | null {
  const autor = NOMBRES[String(b.autor ?? "")] ?? "Un jugador";
  switch (b.tipo) {
    case "cronica":
      return {
        titulo: b.autor ? `Nueva crónica de ${autor}` : "Nueva crónica",
        cuerpo: corto(b.titulo, 120),
        url: "#cronicas",
        tag: "cronica",
        pref: "cronicas",
        excluir: String(b.autor ?? "") || undefined,
      };
    case "comentario":
      if (!b.destino) return null;
      return {
        titulo: `${autor} ha comentado tu crónica`,
        cuerpo: corto(b.texto, 120),
        url: "#cronicas",
        tag: "comentario",
        pref: "comentarios",
        destino: String(b.destino),
      };
    case "resultado":
      return { titulo: corto(b.titulo || "Nuevo resultado", 80), cuerpo: corto(b.texto, 160), url: "#jornadas", tag: "resultado", pref: "resultados" };
    case "champions":
      return { titulo: corto(b.titulo || "Mercadona Champions League", 80), cuerpo: corto(b.texto, 160), url: "#champions", tag: "champions", pref: "resultados" };
    case "directo":
      return {
        titulo: `${autor} está en directo`,
        cuerpo: corto(b.titulo, 120),
        url: "#directos",
        tag: "directo",
        pref: "directos",
        excluir: String(b.autor ?? "") || undefined,
      };
    case "golazo":
      return { titulo: "Nuevo golazo", cuerpo: corto(b.titulo, 120), url: "#golazos", tag: "golazo", pref: "cronicas" };
    default:
      return null;
  }
}

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "método no permitido" }, 405);
  const secreto = Deno.env.get("PUSH_SECRET");
  if (!secreto || req.headers.get("x-push-secret") !== secreto) return json({ error: "no autorizado" }, 401);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: "cuerpo no válido" }, 400);
  }
  const aviso = construir(b);
  if (!aviso) return json({ ok: true, enviados: 0, motivo: "sin aviso" });

  webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await sb.from("suscripciones").select("id,endpoint,p256dh,auth,jugador,prefs");
  if (error) return json({ error: "no se pudo leer las suscripciones" }, 500);

  const destinatarios = (data ?? []).filter((s) => {
    if (s.prefs && s.prefs[aviso.pref] === false) return false;
    if (aviso.destino) return s.jugador === aviso.destino;
    if (aviso.excluir && s.jugador === aviso.excluir) return false;
    return true;
  });

  const carga = JSON.stringify({ titulo: aviso.titulo, cuerpo: aviso.cuerpo, url: aviso.url, tag: aviso.tag });
  const caducadas: number[] = [];
  let enviados = 0;
  await Promise.all(destinatarios.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, { TTL: 86400 });
      enviados++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) caducadas.push(s.id);
    }
  }));
  if (caducadas.length) await sb.from("suscripciones").delete().in("id", caducadas);
  return json({ ok: true, enviados, caducadas: caducadas.length });
});
