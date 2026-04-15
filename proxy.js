/**
 * Vercel 서버리스 함수 — Anthropic API 프록시
 * 브라우저 → /api/proxy → api.anthropic.com
 * 병원/회사 방화벽 우회용
 */
export default async function handler(req, res) {
  // CORS 헤더 설정 — 같은 Vercel 도메인에서만 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API 키는 요청 헤더에서 받음 (클라이언트가 전달)
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'API 키가 없거나 올바르지 않습니다.' } });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Anthropic 응답을 그대로 클라이언트에 전달
    return res.status(response.status).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({
      error: {
        type: 'proxy_error',
        message: '서버에서 API 호출 중 오류가 발생했습니다: ' + err.message
      }
    });
  }
}
