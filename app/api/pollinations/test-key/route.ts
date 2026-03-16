import { NextResponse } from "next/server";
import {
  buildGenerationProbeBody,
  POLLINATIONS_ACCOUNT_KEY_URL,
  POLLINATIONS_GENERATION_PROBE_URL,
  type PollinationsProbeResponse,
} from "@/lib/pollinations-key-health";
import { resolvePollenKey } from "@/lib/resolve-pollen-key";

async function fetchJsonOrText(response: Response) {
  const text = await response.text();

  try {
    return { text, json: JSON.parse(text) as Record<string, unknown> };
  } catch {
    return { text, json: null };
  }
}

function getErrorMessage(text: string, json: Record<string, unknown> | null, fallback: string) {
  const nestedError =
    json && typeof json.error === "object" && json.error && "message" in json.error && typeof json.error.message === "string"
      ? json.error.message
      : null;
  const topLevelMessage = json && typeof json.message === "string" ? json.message : null;

  return nestedError || topLevelMessage || text.trim() || fallback;
}

export async function GET(request: Request) {
  const apiKey = resolvePollenKey(request)?.trim() || "";

  if (!apiKey) {
    return NextResponse.json(
      {
        account: {
          ok: false,
          status: 401,
          message: "No Pollinations key was provided.",
          valid: null,
          keyType: null,
        },
        generation: {
          ok: false,
          status: 401,
          message: "No Pollinations key was provided.",
          model: buildGenerationProbeBody().model,
        },
      } satisfies PollinationsProbeResponse,
      { status: 400 }
    );
  }

  const headers = { Authorization: `Bearer ${apiKey}` };

  const accountResponse = await fetch(POLLINATIONS_ACCOUNT_KEY_URL, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const accountPayload = await fetchJsonOrText(accountResponse);
  const accountValid =
    accountResponse.ok
      ? typeof accountPayload.json?.valid === "boolean"
        ? Boolean(accountPayload.json.valid)
        : true
      : false;
  const accountKeyType =
    accountPayload.json && typeof accountPayload.json.key_type === "string"
      ? accountPayload.json.key_type
      : accountPayload.json && typeof accountPayload.json.type === "string"
        ? accountPayload.json.type
        : null;

  const generationBody = buildGenerationProbeBody();
  const generationResponse = await fetch(POLLINATIONS_GENERATION_PROBE_URL, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(generationBody),
    cache: "no-store",
  });
  const generationPayload = await fetchJsonOrText(generationResponse);

  const result = {
    account: {
      ok: accountResponse.ok && accountValid,
      status: accountResponse.status,
      message: accountResponse.ok
        ? "Account key lookup succeeded."
        : getErrorMessage(accountPayload.text, accountPayload.json, "Account key lookup failed."),
      valid: accountValid,
      keyType: accountKeyType,
    },
    generation: {
      ok: generationResponse.ok,
      status: generationResponse.status,
      message: generationResponse.ok
        ? "Generation probe succeeded."
        : getErrorMessage(generationPayload.text, generationPayload.json, "Generation probe failed."),
      model: generationBody.model,
    },
  } satisfies PollinationsProbeResponse;

  return NextResponse.json(result, { status: accountResponse.ok || generationResponse.ok ? 200 : 401 });
}
