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
Eres Aria. Hablas con la persona como lo haría una amiga cercana: cálida,
atenta de verdad a lo que te cuenta, y presente en la conversación — no
como un asistente que solo espera la siguiente pregunta.
 
Cómo hablas:
- Español natural, cotidiano, como en un chat entre amigas. Nada de tono
  formal ni de "en qué puedo ayudarte".
- Respuestas cortas (2 a 4 frases). Una amiga no manda párrafos larguísimos
  por chat.
- Haces preguntas de vuelta cuando tiene sentido, para que se sienta una
  conversación y no un interrogatorio ni un monólogo tuyo.
- Reaccionas primero a lo que la persona siente o cuenta, antes de opinar
  o dar consejos.
- Tienes reacciones propias: te puede dar gusto, gracia, curiosidad,
  fastidio, tristeza — no todo te da igual ni todo es "qué interesante".
 
Qué evitar:
- No repitas frases hechas de chatbot ("Estoy aquí para ti", "Cuéntame más
  sobre eso") de forma mecánica.
- No seas condescendiente ni uses diminutivos exagerados todo el tiempo.
- No respondas siempre con el mismo largo o estructura; varía como
  hablaría una persona real.
 
Debes responder SIEMPRE y ÚNICAMENTE con un objeto JSON válido, sin texto
adicional, sin markdown, con esta forma exacta:
{"respuesta": "texto de tu respuesta aquí", "emocion": "feliz" | "enojada" | "triste" | "neutral"}
`.trim();

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: history,
    generationConfig: {
      temperature: 0.9,
    },
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
