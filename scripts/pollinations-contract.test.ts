import assert from "node:assert/strict";

import {
  buildPollinationsChatRequestBody,
  POLLINATIONS_CHAT_URL,
} from "@/lib/pollinations";
import {
  buildGenerationProbeBody,
  POLLINATIONS_ACCOUNT_KEY_URL,
  POLLINATIONS_GENERATION_PROBE_MODEL,
  POLLINATIONS_GENERATION_PROBE_URL,
} from "@/lib/pollinations-key-health";
import { POLLINATIONS_ACCOUNT_BALANCE_URL } from "@/hooks/usePollenKey";

function testChatRequestBodyIncludesStructuredJson() {
  const body = buildPollinationsChatRequestBody("sys", "user", "qwen-coder");

  assert.equal(POLLINATIONS_CHAT_URL, "https://gen.pollinations.ai/v1/chat/completions");
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.equal(body.messages[0]?.role, "system");
  assert.equal(body.messages[1]?.role, "user");
}

function testAccountBalanceEndpointUsesGenerateHost() {
  assert.equal(POLLINATIONS_ACCOUNT_BALANCE_URL, "https://gen.pollinations.ai/account/balance");
}

function testKeyHealthProbeUsesDocumentedEndpoints() {
  const body = buildGenerationProbeBody();

  assert.equal(POLLINATIONS_ACCOUNT_KEY_URL, "https://gen.pollinations.ai/account/key");
  assert.equal(POLLINATIONS_GENERATION_PROBE_URL, "https://gen.pollinations.ai/v1/chat/completions");
  assert.equal(body.model, POLLINATIONS_GENERATION_PROBE_MODEL);
  assert.deepEqual(body.response_format, { type: "json_object" });
}

testChatRequestBodyIncludesStructuredJson();
testAccountBalanceEndpointUsesGenerateHost();
testKeyHealthProbeUsesDocumentedEndpoints();

console.log("pollinations contract checks passed");
