"use client";

import { useState } from "react";
import { Loader2, LogOut, Zap } from "lucide-react";
import { usePollenKey } from "@/hooks/usePollenKey";
import type { ProviderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PollenKeyPanelProps {
  latestProviderStatus?: ProviderStatus;
}

export function PollenKeyPanel({ latestProviderStatus }: PollenKeyPanelProps) {
  const { pollenKey, accountInfo, isLoadingAccount, accountStatus, connectOAuth, connectManual, disconnect } = usePollenKey();
  const [manualKeyInput, setManualKeyInput] = useState("");

  const maskedKey = pollenKey ? `${pollenKey.slice(0, 6)}...${pollenKey.slice(-4)}` : "";
  const hasKey = !!pollenKey;

  const badgeLabel =
    !hasKey ? "Not connected" : accountStatus === "checking" ? "Checking..." : accountStatus === "valid" ? "Connected" : accountStatus === "invalid" ? "Balance check failed" : "Account status unknown";
  const badgeClass =
    !hasKey
      ? "border-zinc-700 bg-zinc-800 text-zinc-400"
      : accountStatus === "valid"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        : accountStatus === "checking"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-rose-500/30 bg-rose-500/10 text-rose-300";
  const dotClass =
    !hasKey ? "bg-zinc-500" : accountStatus === "valid" ? "bg-emerald-400" : accountStatus === "checking" ? "bg-amber-300" : "bg-rose-300";

  function handleManualConnect() {
    if (!manualKeyInput.trim()) {
      return;
    }

    connectManual(manualKeyInput.trim());
    setManualKeyInput("");
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Pollinations</p>
          <p className="mt-1 text-sm text-zinc-300">Connect your own Pollen key or use the server fallback.</p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${badgeClass}`}
        >
          <span className={`h-2 w-2 rounded-full ${dotClass}`} />
          {badgeLabel}
        </span>
      </div>

      {hasKey ? (
        <div className="mt-4 space-y-3">
          <div
            className={`rounded-lg p-3 ${
              accountStatus === "valid"
                ? "border border-emerald-500/15 bg-emerald-500/5"
                : accountStatus === "checking"
                  ? "border border-amber-500/15 bg-amber-500/5"
                  : "border border-zinc-800 bg-zinc-900/60"
            }`}
          >
            <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
              <span>Key</span>
              <span className="font-mono text-zinc-200">{maskedKey}</span>
            </div>

            {isLoadingAccount || accountStatus === "checking" ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking balance...
              </div>
            ) : accountInfo?.balance !== null && accountInfo?.balance !== undefined ? (
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-400">
                <span>Balance</span>
                <span className="font-semibold text-zinc-100">{accountInfo.balance.toLocaleString()} pollen</span>
              </div>
            ) : accountStatus === "invalid" ? (
              <div className="mt-3 text-xs text-rose-300">Balance check failed. The saved key may still work for generation, but reconnect if model calls keep failing.</div>
            ) : (
              <div className="mt-3 text-xs text-zinc-500">Account status is advisory only. Generation availability is determined by the actual model request.</div>
            )}

            {latestProviderStatus === "auth_error" ? (
              <div className="mt-3 rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                Generation auth failed. Reconnect your Pollinations key.
              </div>
            ) : null}
          </div>

          <Button variant="ghost" className="w-full justify-center text-rose-300 hover:bg-rose-500/10 hover:text-rose-200" onClick={disconnect}>
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Button onClick={connectOAuth} className="w-full justify-center">
            <Zap className="h-4 w-4" />
            Connect with Pollinations
          </Button>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">or</span>
            <Separator className="flex-1" />
          </div>

          <div className="flex gap-2">
            <input
              value={manualKeyInput}
              onChange={(event) => setManualKeyInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleManualConnect();
                }
              }}
              type="password"
              placeholder="Paste API key (sk_...)"
              className="h-10 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 font-mono text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-accent/50"
            />
            <Button variant="outline" disabled={!manualKeyInput.trim()} onClick={handleManualConnect}>
              Connect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
