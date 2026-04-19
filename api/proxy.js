// 기존 코드에서 max_tokens를 고정값으로 쓰고 있다면
// 클라이언트가 보낸 값을 그대로 전달하도록 수정

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body;
  // ✅ max_tokens를 클라이언트 요청값 그대로 사용
  // ❌ max_tokens: 1000  ← 이런 하드코딩 제거

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body), // body 그대로 전달
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
