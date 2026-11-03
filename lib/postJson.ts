// Client-side POST of a JSON body to one of our API routes. A failed
// response throws an Error carrying the route's own readable "error"
// message (every route answers { error } on failure, see lib/apiError.ts),
// so callers can show it as is.
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return (await res.json()) as T;
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (typeof data === "object" && data !== null && "error" in data) {
      const error = (data as { error: unknown }).error;
      if (typeof error === "string" && error.trim()) return error;
    }
    return "request failed";
  } catch {
    // A proxy's HTML page or an empty body: say at least what came back.
    return `request failed (HTTP ${res.status})`;
  }
}
