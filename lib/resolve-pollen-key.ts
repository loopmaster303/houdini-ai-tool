export function resolvePollenKey(request: Request) {
  const userKey = request.headers.get("X-Pollen-Key");
  if (userKey && userKey.trim()) {
    return userKey.trim();
  }

  return process.env.POLLEN_API_KEY || process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_API_TOKEN;
}

