export default {
  async fetch(request, env, ctx) {
    // 1. プリフライトリクエスト（OPTIONS）のハンドリング
    // ブラウザが事前に安全性を確認するために送るリクエストに対応します
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*', // すべてのドメインからのアクセスを許可
          'Access-Control-Allow-Methods': 'GET, OPTIONS', // 許可するメソッド
          'Access-Control-Allow-Headers': 'Content-Type', // 許可するヘッダー
        },
      });
    }

    // GETリクエストのみを受け付ける
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 2. URLパラメータの取得
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing "url" parameter', {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' } // エラー時もCORSヘッダーを返す
      });
    }

    try {
      // 3. 指定されたURLのHTMLを取得
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });

      if (!res.ok) {
        return new Response(`Failed to fetch target URL: ${res.status}`, {
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }

      let ogImage = null;

      // 4. HTMLRewriterを使って <meta property="og:image"> を探す
      const rewriter = new HTMLRewriter().on(
        'meta[property="og:image"]',
        {
          element(element) {
            ogImage = element.getAttribute('content');
          },
        }
      );

      await rewriter.transform(res).text();

      // 5. 結果を返却（ここにもCORSヘッダーを付与）
      if (ogImage) {
        return new Response(ogImage, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*', // 💡これでブラウザ側のJSから読み込めるようになります
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
