let history = [];

const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("usertext");
const sendButton = document.getElementById("sendButton");
const messagesEl = document.getElementById("messages");

const characterEl = document.querySelector(".character");
const moodLabelEl = document.getElementById("moodLabel");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `msg ${sender}`;
  div.textContent = text;
  messagesEl.appendChild(div);

  messagesEl.scrollTop = messagesEl.scrollHeight;

  return div;
}

function addTypingIndicator() {
  const div = document.createElement("div");
  div.className = "msg typing";
  div.textContent = "Aria está escribiendo...";
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function setEmotion(emotion) {
  const emociones = ["feliz", "enojada", "triste", "neutral"];

  // quita cualquier clase de emoción anterior
  emociones.forEach((e) => characterEl.classList.remove(e));

  const emocionValida = emociones.includes(emotion) ? emotion : "neutral";
  characterEl.classList.add(emocionValida);

  moodLabelEl.textContent = emocionValida;
}

function parseModelJSON(rawText) {
  let cleaned = rawText.trim();
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return { respuesta: rawText, emocion: "neutral" };
  }
}

async function sendToGemini(userText) {
  // agregamos el mensaje del usuario al historial ANTES de enviarlo
  history.push({ role: "user", parts: [{ text: userText }] });

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Error ${res.status}: ${errorBody}`);
  }

  const data = await res.json();

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  history.push({ role: "model", parts: [{ text: rawText }] });

  return parseModelJSON(rawText);
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  userInput.disabled = true;
  sendButton.disabled = true;

  const typingEl = addTypingIndicator();

  try {
    const { respuesta, emocion } = await sendToGemini(text);
    typingEl.remove();
    addMessage(respuesta, "char");
    setEmotion(emocion);
  } catch (err) {
    typingEl.remove();
    addMessage("Algo salió mal al conectar con la IA: " + err.message, "char");
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
});

setEmotion("neutral");
