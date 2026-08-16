export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages, system } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: system || "You are a helpful assistant.",
        messages: messages.map((m) => {
          if (m.image) {
            return {
              role: m.role,
              content: [
                { type: "image", source: { type: "base64", media_type: m.image.mediaType, data: m.image.data } },
                { type: "text", text: m.content || "What is this? Explain what it is and pull out any key content, text, or details from it." },
              ],
            };
          }
          return { role: m.role, content: m.content };
        }),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      res.status(response.status).json({ error: "Anthropic API error" });
      return;
    }

    const data = await response.json();
    const textBlock = data.content.find((b) => b.type === "text");
    res.status(200).json({ reply: textBlock ? textBlock.text : "" });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Server error" });
  }
        }
