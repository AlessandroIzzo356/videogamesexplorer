import { withCors } from "../utils/cors";
import { Env } from "../types";

type AiRequestBody = {
  name?: string;
  released?: string | null;
  genres?: string[] | null;
  platforms?: string[] | null;
  description?: string | null;
};

export async function handleAiInsight(request: Request, env: Env) {
  const url = new URL(request.url);
  if (request.method !== "POST" || url.pathname !== "/ai/insight") {
    return null;
  }

  try {
    const body = (await request.json()) as AiRequestBody | null;
    const { name, released, genres, platforms, description } = body ?? {};

    if (!name) {
      return withCors(
        Response.json({ error: "Missing game name" }, { status: 400 })
      );
    }

    const prompt = `
Sei un giocatore esperto, onesto e schietto. Parla come se fossi al bar: niente termini tecnici noiosi, solo la verità sul gioco.

IMPORTANTE: Gli esempi tra parentesi servono solo a farti capire il TONO. Non copiarli mai se non si adattano al gioco specifico.

Regole di contenuto:
1. "consiglio": Qual è il compromesso? (Es. per un gioco comico: "Accetta una grafica vecchia per farti le migliori risate di sempre").
2. "vibe": Un'emozione reale (Es. Nostalgia, Bullismo goliardico, Relax totale, Adrenalina pura).
3. "cosa_aspettarti": Descrivi il "flow" reale. Cosa farai pad alla mano? (Es. per Bully: "Andrai a lezione per sbloccare potenziamenti, farai scherzi ai secchioni e cercherai di non farti beccare dai prefetti mentre giri in skateboard").
4. "perche_difficile": Se il gioco è facile, dillo! Se è difficile, spiega perché (Es. "I comandi sono vecchi e legnosi" oppure "I nemici sono spugne per proiettili").
5. "sinossi": Riassunto narrativo in 2-3 frasi, senza spoiler.

Dati del gioco:
Nome: ${name}
Anno: ${released ?? "n/a"}
Generi: ${(Array.isArray(genres) ? genres : []).join(", ")}
Piattaforme: ${(Array.isArray(platforms) ? platforms : []).join(", ")}
Descrizione: ${description ?? ""}

Genera ESCLUSIVAMENTE questo JSON in italiano (senza blocchi di codice):
{
  "consiglio": "Il patto onesto adattato al titolo.",
  "vibe": "L'emozione specifica del gioco.",
  "cosa_aspettarti": "La realtà delle azioni senza usare i miei esempi se non c'entrano.",
  "durata_stimata": "15-25 ore",
  "difficolta": "Facile | Media | Difficile | Punitivo",
  "perche_difficile": "Il vero motivo del nervoso o della semplicità.",
  "sinossi": "Riassunto narrativo in 2-3 frasi."
}
`.trim();

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return withCors(
        Response.json({ error: "OpenAI error", detail: err }, { status: 502 })
      );
    }

    const data = (await r.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };
    const text =
      data.output_text?.trim() ??
      data.output?.[0]?.content?.find(item => item.type === "output_text")?.text?.trim();

    try {
      const cleaned = (text ?? "")
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      const json = JSON.parse(cleaned);
      return withCors(Response.json(json));
    } catch {
      return withCors(
        Response.json({ error: "Invalid AI response", raw: text }, { status: 502 })
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return withCors(
      Response.json({ error: "AI endpoint failed", detail: message }, { status: 500 })
    );
  }
}
