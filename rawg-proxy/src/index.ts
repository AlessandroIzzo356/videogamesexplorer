type Env = {
  RAWG_API_KEY: string;
  OPENAI_API_KEY: string;
};

type RawgSeriesItem = {
  id: number;
  name: string;
  slug?: string;
  released?: string | null;
  background_image?: string | null;
};

const ROMAN_NUMERALS = new Set([
  "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
  "xi", "xii", "xiii", "xiv", "xv", "xvi", "xvii", "xviii", "xix", "xx"
]);

function normalizeTokens(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function stripTrailingSequence(tokens: string[]) {
  const next = [...tokens];
  while (next.length > 1) {
    const last = next[next.length - 1];
    if (/^\d+$/.test(last) || ROMAN_NUMERALS.has(last)) {
      next.pop();
      continue;
    }
    break;
  }
  return next;
}

function inferFranchiseName(seedName: string, seriesNames: string[]) {
  const seedBase = stripTrailingSequence(
    normalizeTokens(seedName.split(/[:\-–—]/)[0] ?? seedName)
  ).join(" ");

  if (seedBase && seriesNames.some(name => normalizeTokens(name).join(" ").startsWith(seedBase))) {
    return seedBase
      .split(" ")
      .map(token => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");
  }

  const tokenSets = seriesNames.map(name => stripTrailingSequence(normalizeTokens(name)));
  if (!tokenSets.length) {
    return null;
  }

  const shortest = tokenSets.reduce((acc, tokens) => Math.min(acc, tokens.length), Infinity);
  const common: string[] = [];
  for (let i = 0; i < shortest; i += 1) {
    const token = tokenSets[0][i];
    if (tokenSets.every(tokens => tokens[i] === token)) {
      common.push(token);
    } else {
      break;
    }
  }

  const candidate = common.join(" ").trim();
  if (!candidate || candidate.length < 3) {
    return null;
  }

  return candidate
    .split(" ")
    .map(token => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
	"Access-Control-Max-Age": "86400",
};

function withCors(resp: Response) {
	const headers = new Headers(resp.headers);
	Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
	return new Response(resp.body, { status: resp.status, headers });
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Preflight CORS
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		const url = new URL(request.url);

		// Endpoint: /rawg/search?q=elden
		if (url.pathname === "/rawg/search") {
			const q = (url.searchParams.get("q") ?? "").trim();
			if (q.length < 3) {
				return withCors(Response.json({ error: "Query too short" }, { status: 400 }));
			}

			const upstream = new URL("https://api.rawg.io/api/games");
			upstream.searchParams.set("key", env.RAWG_API_KEY);
			upstream.searchParams.set("search", q);
			upstream.searchParams.set("page_size", "20");

			const r = await fetch(upstream.toString(), {
				headers: { "Accept": "application/json" },
			});

			return withCors(r);
		}

		// Endpoint: /rawg/game/3498
		const m = url.pathname.match(/^\/rawg\/game\/(\d+)$/);
    if (m) {
      const id = m[1];
      const upstream = new URL(`https://api.rawg.io/api/games/${id}`);
      upstream.searchParams.set("key", env.RAWG_API_KEY);

			const r = await fetch(upstream.toString(), {
				headers: { "Accept": "application/json" },
			});

      return withCors(r);
    }

    const seriesMatch = url.pathname.match(/^\/rawg\/game\/(\d+)\/series$/);
    if (seriesMatch) {
      const id = seriesMatch[1];
      const seedName = (url.searchParams.get("name") ?? "").trim();
      const upstream = new URL(`https://api.rawg.io/api/games/${id}/game-series`);
      upstream.searchParams.set("key", env.RAWG_API_KEY);

      const r = await fetch(upstream.toString(), {
        headers: { "Accept": "application/json" },
      });

      if (!r.ok) {
        const err = await r.text();
        return withCors(
          Response.json({ error: "RAWG error", detail: err }, { status: 502 })
        );
      }

      const data = (await r.json()) as { count?: number; results?: RawgSeriesItem[] };
      const results = Array.isArray(data.results) ? data.results : [];
      const names = results.map(item => item.name).filter(Boolean);
      const franchise = inferFranchiseName(seedName, names);

      return withCors(Response.json({
        franchise,
        count: data.count ?? results.length,
        results
      }));
    }

    if (request.method === "POST" && url.pathname === "/ai/insight") {
      try {
				const body = (await request.json()) as {
					name?: string;
					released?: string | null;
					genres?: string[] | null;
					platforms?: string[] | null;
					description?: string | null;
				} | null;
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
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : "Unknown error";
				return withCors(
					Response.json({ error: "AI endpoint failed", detail: message }, { status: 500 })
				);
			}
		}

		return withCors(Response.json({ error: "Not found" }, { status: 404 }));
	},
};
