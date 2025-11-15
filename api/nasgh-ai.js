export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Only POST allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const soil = body.soil;
    const lang = body.language || "ar";

    if (!soil) {
      return new Response("Missing soil data", { status: 400 });
    }

    // استدعاء جيميني (Vertex API Web)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("Missing API KEY", { status: 500 });
    }

    const prompt = `
أنت نظام متخصص يقدم توصيات زراعية دقيقة بناءً على قراءات مستشعر التربة.
هذه هي البيانات:

الحرارة: ${soil.temp}
الرطوبة: ${soil.moisture}
الملوحة EC: ${soil.ec}
الأس الهيدروجيني pH: ${soil.ph}
N: ${soil.n}
P: ${soil.p}
K: ${soil.k}
مؤشر صحة التربة SHS: ${soil.shs}
مؤشر الهيوميك: ${soil.humic}

قدّم توصية واضحة ومباشرة للمزارع العماني باللهجة العربية الفصحى.
ارفع الدقة وقدم نصائح ري وتسميد فقط.
  `;

    const aiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const aiJson = await aiRes.json();

    if (!aiJson.candidates) {
      return new Response("AI Error: " + JSON.stringify(aiJson), { status: 500 });
    }

    const text = aiJson.candidates[0].content.parts[0].text;

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (e) {
    return new Response("Server Error: " + e.message, { status: 500 });
  }
}
