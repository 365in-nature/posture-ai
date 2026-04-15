/**
 * Vercel 서버리스 함수 — Anthropic API 프록시
 * 브라우저 → /api/proxy → api.anthropic.com
 * 병원/회사 방화벽 우회용
 */

// Vercel body 파서 — 이미지 base64 3장 포함으로 크기 20mb로 설정
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  // preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API 키 확인
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return res.status(401).json({
      error: {
        type: 'authentication_error',
        message: 'API 키가 없거나 올바르지 않습니다.',
      },
    });
  }

  // body 확인
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: {
        type: 'invalid_request',
        message: '요청 본문이 비어 있습니다.',
      },
    });
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
    return res.status(response.status).json(data);

  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({
      error: {
        type: 'proxy_error',
        message: '서버 오류: ' + err.message,
      },
    });
  }
}
