import { withCors } from "../utils/cors";
import { inferFranchiseName } from "../utils/franchise";
import { Env, RawgSeriesItem } from "../types";

export async function handleRawgSearch(request: Request, env: Env) {
  const url = new URL(request.url);
  if (url.pathname !== "/rawg/search") {
    return null;
  }

  const q = (url.searchParams.get("q") ?? "").trim();
  const pageSize = (url.searchParams.get("page_size") ?? "20").trim();
  const metacritic = (url.searchParams.get("metacritic") ?? "").trim();
  if (q.length < 3) {
    return withCors(Response.json({ error: "Query too short" }, { status: 400 }));
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  const upstream = new URL("https://api.rawg.io/api/games");
  upstream.searchParams.set("key", env.RAWG_API_KEY);
  upstream.searchParams.set("search", q);
  const hasMultipleWords = tokens.length > 1;
  if (hasMultipleWords) {
    upstream.searchParams.set("search_precise", "true");
  }
  upstream.searchParams.set("page_size", pageSize);
  if (metacritic) {
    upstream.searchParams.set("ordering", "-metacritic");
    upstream.searchParams.set("metacritic", metacritic);
  } else if (!hasMultipleWords) {
    upstream.searchParams.set("ordering", "-metacritic");
    upstream.searchParams.set("metacritic", "60,100");
  }

  const r = await fetch(upstream.toString(), {
    headers: { "Accept": "application/json" },
  });

  if (!metacritic) {
    return withCors(r);
  }

  if (!r.ok) {
    const err = await r.text();
    return withCors(Response.json({ error: "RAWG error", detail: err }, { status: 502 }));
  }

  const data = (await r.json()) as { count?: number; results?: Array<{ metacritic?: number | null }> };
  const results = Array.isArray(data.results) ? data.results.filter(item => item.metacritic != null) : [];
  return withCors(Response.json({
    count: results.length,
    next: null,
    previous: null,
    results
  }));
}

export async function handleRawgGame(request: Request, env: Env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/rawg\/game\/(\d+)$/);
  if (!match) {
    return null;
  }

  const id = match[1];
  const upstream = new URL(`https://api.rawg.io/api/games/${id}`);
  upstream.searchParams.set("key", env.RAWG_API_KEY);

  const r = await fetch(upstream.toString(), {
    headers: { "Accept": "application/json" },
  });

  return withCors(r);
}

export async function handleRawgSeries(request: Request, env: Env) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/rawg\/game\/(\d+)\/series$/);
  if (!match) {
    return null;
  }

  const id = match[1];
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
