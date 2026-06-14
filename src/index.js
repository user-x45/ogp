export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing "url" parameter', {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
      });

      if (!res.ok) {
        return new Response(`Failed to fetch: ${res.status} ${res.statusText} from ${targetUrl}`, {
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      let ogImage = null;

      const rewriter = new HTMLRewriter()
        .on('meta[property="og:image"]', {
          element(el) { ogImage = ogImage || el.getAttribute('content'); }
        })
        .on('meta[name="twitter:image"]', {
          element(el) { ogImage = ogImage || el.getAttribute('content'); }
        });

      await rewriter.transform(res).text();

      if (ogImage) {
        return new Response(ogImage, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        return new Response('og:image not found', {
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  },
};
