"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "pollenApiKey";
const ACCOUNT_POLL_INTERVAL = 60_000;
export const POLLINATIONS_ACCOUNT_BALANCE_URL = "https://gen.pollinations.ai/account/balance";

interface PollenAccountInfo {
  balance: number | null;
  expiresAt: string | null;
  expiresIn: number | null;
  valid: boolean;
  keyType: string | null;
  pollenBudget: number | null;
  rateLimitEnabled: boolean;
}

export type AccountStatus = "idle" | "checking" | "valid" | "invalid" | "unknown";

export interface UsePollenKeyReturn {
  pollenKey: string | null;
  isConnected: boolean;
  accountInfo: PollenAccountInfo | null;
  isLoadingAccount: boolean;
  accountStatus: AccountStatus;
  connectOAuth: () => void;
  connectManual: (key: string) => void;
  disconnect: () => void;
  refreshAccount: () => Promise<void>;
}

function getStoredKey() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key);
}

function removeKey() {
  localStorage.removeItem(STORAGE_KEY);
}

function extractKeyFromFragment() {
  if (typeof window === "undefined") {
    return null;
  }

  const hash = window.location.hash;
  if (!hash || !hash.includes("api_key=")) {
    return null;
  }

  try {
    const params = new URLSearchParams(hash.slice(1));
    const key = params.get("api_key");

    if (key) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      return key;
    }
  } catch {
    // Ignore malformed fragments.
  }

  return null;
}

export function usePollenKey(): UsePollenKeyReturn {
  const [pollenKey, setPollenKey] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<PollenAccountInfo | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>("idle");
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const fragmentKey = extractKeyFromFragment();
    if (fragmentKey) {
      storeKey(fragmentKey);
      setPollenKey(fragmentKey);
      return;
    }

    const storedKey = getStoredKey();
    if (storedKey) {
      setPollenKey(storedKey);
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    const key = getStoredKey();
    if (!key) {
      setAccountInfo(null);
      setAccountStatus("idle");
      return;
    }

    setIsLoadingAccount(true);
    setAccountStatus("checking");
    try {
      const response = await fetch(POLLINATIONS_ACCOUNT_BALANCE_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      if (!response.ok) {
        setAccountInfo(null);
        setAccountStatus(response.status === 401 || response.status === 403 ? "invalid" : "unknown");
        return;
      }

      const data = (await response.json()) as Record<string, unknown>;
      setAccountInfo({
        balance: typeof data.balance === "number" ? data.balance : typeof data.pollen_count === "number" ? data.pollen_count : null,
        expiresAt: typeof data.expires_at === "string" ? data.expires_at : null,
        expiresIn: typeof data.expires_in === "number" ? data.expires_in : null,
        valid: true,
        keyType: typeof data.key_type === "string" ? data.key_type : null,
        pollenBudget: typeof data.pollen_budget === "number" ? data.pollen_budget : null,
        rateLimitEnabled: typeof data.rate_limit_enabled === "boolean" ? data.rate_limit_enabled : false,
      });
      setAccountStatus("valid");
    } catch {
      setAccountInfo(null);
      setAccountStatus("unknown");
    } finally {
      setIsLoadingAccount(false);
    }
  }, []);

  useEffect(() => {
    if (!pollenKey) {
      setAccountInfo(null);
      setAccountStatus("idle");
      return;
    }

    void refreshAccount();

    const handleFocus = () => {
      void refreshAccount();
    };

    window.addEventListener("focus", handleFocus);
    pollIntervalRef.current = window.setInterval(() => {
      void refreshAccount();
    }, ACCOUNT_POLL_INTERVAL);

    return () => {
      window.removeEventListener("focus", handleFocus);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pollenKey, refreshAccount]);

  const connectOAuth = useCallback(() => {
    const redirectUrl = window.location.href.split("#")[0];
    const authorizeUrl = new URL("https://enter.pollinations.ai/authorize");
    authorizeUrl.searchParams.set("redirect_url", redirectUrl);
    authorizeUrl.searchParams.set("permissions", "profile,balance,usage");
    authorizeUrl.searchParams.set("expiry", "30");
    window.location.href = authorizeUrl.toString();
  }, []);

  const connectManual = useCallback((key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      return;
    }

    storeKey(trimmed);
    setPollenKey(trimmed);
    setAccountStatus("checking");
  }, []);

  const disconnect = useCallback(() => {
    removeKey();
    setPollenKey(null);
    setAccountInfo(null);
    setAccountStatus("idle");
  }, []);

  return {
    pollenKey,
    isConnected: !!pollenKey && accountStatus === "valid",
    accountInfo,
    isLoadingAccount,
    accountStatus,
    connectOAuth,
    connectManual,
    disconnect,
    refreshAccount,
  };
}
