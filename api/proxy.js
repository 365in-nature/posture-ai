/**
 * Vercel 서버리스 함수 — Anthropic API 프록시
 * 브라우저 → /api/proxy → api.anthropic.com
 * 병원/회사 방화벽 우회용
 */

// body 파서 비활성화 — raw body를 직접 읽어서 처리 (큰 이미지 데이터 대응)
export const config = {
  api: {
    bodyParser: false,
  },
};

// raw body를 문자열로 읽기
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

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

  try {
    // raw body 직접 읽기 (bodyParser 우회)
    const rawBody = await getRawBody(req);

    if (!rawBody || rawBody.trim() === '' || rawBody.trim() === '{}') {
      return res.status(400).json({
        error: {
          type: 'invalid_request',
          message: '요청 본문이 비어 있습니다.',
        },
      });
    }

    // Anthropic API로 그대로 전달
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: rawBody,  // 파싱 없이 원본 그대로 전달
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
