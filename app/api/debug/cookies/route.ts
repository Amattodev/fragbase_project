export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const host = req.headers.get("host") || "";
  const ua = req.headers.get("user-agent") || "";
  return new Response(
    JSON.stringify({ cookie, host, ua }, null, 2),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    }
  );
}

