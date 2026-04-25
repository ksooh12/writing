export default async function handler(req, res) {
  // CORS 허용 (내 GitHub Pages 도메인에서 오는 요청만 받기)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 허용" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt 없음" });

  // API 키는 Vercel 환경변수에서 꺼냄 — 브라우저에 절대 노출 안 됨
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "서버에 API 키가 설정되지 않았어요" });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const geminiRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  const data = await geminiRes.json();
  if (!geminiRes.ok) {
    return res.status(geminiRes.status).json({ error: data?.error?.message || "Gemini 오류" });
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return res.status(500).json({ error: "Gemini 응답이 비어있어요" });

  try {
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch {
    return res.status(500).json({ error: "JSON 파싱 실패", raw: text });
  }
}
