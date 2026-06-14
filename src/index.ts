export default {
  async fetch(request, env, ctx) {
    // 1. リクエストのURLから解析対象の「url」パラメータを取得
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing "url" parameter', { status: 400 });
    }

    try {
      // 2. 指定されたURLのHTMLを取得
      const res = await fetch(targetUrl, {
        headers: {
          // ボット弾き対策として一般的なUser-Agentを設定
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });

      if (!res.ok) {
        return new Response(`Failed to fetch target URL: ${res.status}`, { status: 500 });
      }

      let ogImage = null;

      // 3. HTMLRewriterを使って <meta property="og:image"> を探す
      const rewriter = new HTMLRewriter().on(
        'meta[property="og:image"]',
        {
          element(element) {
            ogImage = element.getAttribute('content');
          },
        }
      );

      // HTMLをストリーミング解析（メモリを消費せず爆速）
      await rewriter.transform(res).text();

      // 4. 結果を返却
      if (ogImage) {
        return new Response(ogImage, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      } else {
        return new Response('og:image not found', { status: 404 });
      }

    } catch (error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
  },
};
