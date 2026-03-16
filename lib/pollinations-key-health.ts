export const POLLINATIONS_ACCOUNT_KEY_URL = "https://gen.pollinations.ai/account/key";
export const POLLINATIONS_GENERATION_PROBE_MODEL = "openai-fast";
export const POLLINATIONS_GENERATION_PROBE_URL = "https://gen.pollinations.ai/v1/chat/completions";

export interface PollinationsProbeResponse {
  account: {
    ok: boolean;
    status: number;
    message: string;
    valid: boolean | null;
    keyType: string | null;
  };
  generation: {
    ok: boolean;
    status: number;
    message: string;
    model: string;
  };
}

export function buildGenerationProbeBody() {
  return {
    model: POLLINATIONS_GENERATION_PROBE_MODEL,
    messages: [{ role: "user" as const, content: 'Return exactly {"ok":true} as JSON.' }],
    response_format: { type: "json_object" as const },
    max_tokens: 40,
  };
}
