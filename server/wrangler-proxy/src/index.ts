import { handleCorsPreflight, withCors } from "./utils/cors";
import { handleAiInsight } from "./routes/ai";
import { handleRawgGame, handleRawgSearch, handleRawgSeries } from "./routes/rawg";
import { Env } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const preflight = handleCorsPreflight(request);
    if (preflight) {
      return preflight;
    }

    const handlers = [
      () => handleRawgSearch(request, env),
      () => handleRawgGame(request, env),
      () => handleRawgSeries(request, env),
      () => handleAiInsight(request, env),
    ];

    for (const handle of handlers) {
      const response = await handle();
      if (response) {
        return response;
      }
    }

    return withCors(Response.json({ error: "Not found" }, { status: 404 }));
  },
};
