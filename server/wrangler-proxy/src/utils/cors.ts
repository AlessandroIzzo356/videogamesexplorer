const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function withCors(resp: Response) {
  const headers = new Headers(resp.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return new Response(resp.body, { status: resp.status, headers });
}

export function handleCorsPreflight(request: Request) {
  if (request.method !== "OPTIONS") {
    return null;
  }
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
