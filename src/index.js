export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "url parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OGImageBot/1.0)" },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();

    const match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );

    if (!match) {
      return new Response(JSON.stringify({ ogImage: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ogImage = match[1].startsWith("http")
      ? match[1]
      : new URL(match[1], parsedUrl.origin).toString();

    return new Response(JSON.stringify({ ogImage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
