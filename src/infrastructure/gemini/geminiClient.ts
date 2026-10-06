const DEFAULT_MODEL = "gemini-flash-lite-latest";
const REQUEST_TIMEOUT_MS = 8000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export interface GeminiJsonRequest {
  systemInstruction: string;
  userText: string;
  responseSchema: object;
  maxOutputTokens: number;
}

export class GeminiClient {
  constructor(
    private readonly apiKey: string = requireApiKey(),
    private readonly model: string = process.env.GEMINI_MODEL || DEFAULT_MODEL,
  ) {}

  async generateJson(request: GeminiJsonRequest): Promise<unknown> {
    const startedAt = Date.now();
    const response = await this.requestWithRetries(request);
    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini respondió sin texto");
    console.info(`gemini ${this.model} ${Date.now() - startedAt}ms`);
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async requestWithRetries(request: GeminiJsonRequest): Promise<Response> {
    let lastStatus = 0;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": this.apiKey },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: request.systemInstruction }] },
            contents: [{ parts: [{ text: request.userText }] }],
            generationConfig: { temperature: 0, maxOutputTokens: request.maxOutputTokens, responseMimeType: "application/json", responseSchema: request.responseSchema },
          }),
        });
        if (response.ok) return response;
        lastStatus = response.status;
        if (!TRANSIENT_STATUSES.has(response.status)) break;
      } catch {
        lastStatus = 0;
      }
      if (attempt < MAX_ATTEMPTS) await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1) * (0.5 + Math.random()));
    }
    throw new Error(`Gemini no respondió correctamente (estado ${lastStatus || "sin respuesta"})`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no está definida (ver .env.example)");
  return key;
}
