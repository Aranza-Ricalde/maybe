import type { MerchantNameCleaner } from "@/domain/merchants/ports";
import { sanitizeCleanName } from "@/domain/merchants/rules";

const MODEL = "gemini-flash-lite-latest";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export class GeminiMerchantNameCleaner implements MerchantNameCleaner {
  constructor(private readonly apiKey: string = requireApiKey()) {}

  async clean(rawDescription: string): Promise<string> {
    const response = await fetch(`${ENDPOINT}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Responde ÚNICAMENTE con el nombre comercial limpio del comercio, sin explicación ni puntuación extra. Descripción bancaria cruda: ${rawDescription}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini respondió ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(`Respuesta de Gemini sin texto: ${JSON.stringify(data)}`);
    }
    return sanitizeCleanName(text);
  }
}

function requireApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no está definida (ver .env.example)");
  return key;
}
