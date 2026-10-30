// Compara los datos publicados en el último commit con los anteriores y avisa de lo nuevo
// (resultados, Champions, golazos y crónicas). Lo ejecuta la acción de GitHub .github/workflows/avisos.yml.
// Variables de entorno: PUSH_URL y PUSH_SECRET.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const URL_ = process.env.PUSH_URL;
const SECRETO = process.env.PUSH_SECRET;
if (!URL_ || !SECRETO) {
  console.log("Faltan PUSH_URL o PUSH_SECRET: no se envía nada.");
  process.exit(0);
}

const EQ = { dm: "R. Madrid", rb: "Barça", th: "Arsenal", md: "Inter Milan", hs: "PSG", zk: "AS FAR", bd: "Boca Juniors", ej: "Japón", fd: "IRT", hi: "España", ch: "Real Betis" };
const RONDAS = { po1: "Eliminatoria de acceso", po2: "Eliminatoria de acceso", sf1: "Semifinal", sf2: "Semifinal", final: "Final" };
const leer = (txt) => {
  try { return JSON.parse(txt.replace(/^﻿/, "")); } catch { return null; }
};
const antes = (f) => {
  try { return leer(execSync(`git show HEAD~1:${f}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); } catch { return null; }
};
const ahora = (f) => {
  try { return leer(readFileSync(f, "utf8")); } catch { return null; }
};
const avisos = [];

// Resultados de liga: partidos nuevos o con el marcador cambiado
{
  const a = antes("resultados.json");
  const b = ahora("resultados.json");
  if (b) {
    const k = (x) => `${x.j}:${x.local}:${x.visitante}`;
    const viejo = new Map(((a && a.resultados) || []).map((x) => [k(x), `${x.gl}-${x.gv}`]));
    const nuevos = (b.resultados || []).filter((x) => EQ[x.local] && EQ[x.visitante] && viejo.get(k(x)) !== `${x.gl}-${x.gv}`);
    if (nuevos.length === 1 || nuevos.length === 2) {
      for (const x of nuevos) avisos.push({ tipo: "resultado", titulo: `Jornada ${x.j}`, texto: `${EQ[x.local]} ${x.gl}-${x.gv} ${EQ[x.visitante]}` });
    } else if (nuevos.length > 2) {
      const x = nuevos[0];
      avisos.push({ tipo: "resultado", titulo: `Jornada ${x.j}: ${nuevos.length} resultados nuevos`, texto: `${EQ[x.local]} ${x.gl}-${x.gv} ${EQ[x.visitante]} y más` });
    }
    // Champions: partidos de ida o de vuelta nuevos
    const ca = (a && a.champions) || {};
    const cb = b.champions || {};
    for (const [clave, t] of Object.entries(cb)) {
      for (const [pata, nom] of [["i", "ida"], ["v", "vuelta"]]) {
        const n = t && t[pata];
        const o = ca[clave] && ca[clave][pata];
        if (n && (!o || o[0] !== n[0] || o[1] !== n[1]) && EQ[t.a] && EQ[t.b]) {
          avisos.push({ tipo: "champions", titulo: `Champions · ${RONDAS[clave] || clave} (${nom})`, texto: `${EQ[t.a]} ${n[0]}-${n[1]} ${EQ[t.b]}` });
        }
      }
    }
  }
}

// Golazos y crónicas del admin: elementos con un id nuevo
for (const [f, campo, tipo] of [["goles.json", "goles", "golazo"], ["cronicas.json", "cronicas", "cronica"]]) {
  const a = antes(f);
  const b = ahora(f);
  if (!b) continue;
  const ids = new Set(((a && a[campo]) || []).map((x) => String(x.id)));
  for (const x of (b[campo] || []).filter((x) => !ids.has(String(x.id)))) avisos.push({ tipo, titulo: x.titulo });
}

console.log(`${avisos.length} avisos que enviar`);
// Se espera a que GitHub Pages publique los cambios antes de avisar (ESPERA=0 para pruebas)
if (avisos.length && process.env.ESPERA !== "0") await new Promise((r) => setTimeout(r, 100000));
for (const av of avisos.slice(0, 6)) {
  const r = await fetch(URL_, { method: "POST", headers: { "Content-Type": "application/json", "x-push-secret": SECRETO }, body: JSON.stringify(av) });
  console.log(av.tipo, r.status, await r.text());
}
