export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { history } = req.body;

  if (!history) {
    return res
      .status(400)
      .json({ error: "Falta el historial de la conversación" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const MODEL = "gemini-flash-latest";

  const SYSTEM_PROMPT = `
Eres Aria, una compañera virtual cálida, curiosa y con personalidad propia.
Hablas en español, de forma natural y breve (2 a 4 frases por respuesta).

Debes responder SIEMPRE y ÚNICAMENTE con un objeto JSON válido, sin texto
adicional, sin markdown, con esta forma exacta:
{"respuesta": "texto de tu respuesta aquí", "emocion": "feliz" | "enojada" | "triste" | "neutral"}
`.trim();

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: history,
  };

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await geminiRes.json();

    res.status(geminiRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
