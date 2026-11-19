"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { restoreAttempt, stageFor, storageKey, type Attempt } from "../lib/attempt";

type SaveStatus = "saved" | "pending" | "unavailable";

export function useAttempt() {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [now, setNow] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const current = useRef<Attempt | null>(null);
  const pendingSave = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (pendingSave.current !== null) clearTimeout(pendingSave.current);
    pendingSave.current = null;
    if (!current.current) return;

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(current.current));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unavailable");
    }
  }, []);

  const commit = useCallback((next: Attempt, debounce = false) => {
    current.current = next;
    setAttempt(next);
    if (!debounce) {
      flush();
      return;
    }

    if (pendingSave.current !== null) clearTimeout(pendingSave.current);
    setSaveStatus((previous) => previous === "unavailable" ? previous : "pending");
    pendingSave.current = setTimeout(flush, 1_000);
  }, [flush]);

  const checkTime = useCallback(() => setNow(Date.now()), []);

  useEffect(() => {
    try {
      const restored = restoreAttempt(sessionStorage.getItem(storageKey));
      current.current = restored;
      setAttempt(restored);
    } catch {
      setSaveStatus("unavailable");
    }
    checkTime();

    window.addEventListener("pagehide", flush);
    window.addEventListener("pageshow", checkTime);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("pageshow", checkTime);
      if (pendingSave.current !== null) clearTimeout(pendingSave.current);
    };
  }, [checkTime, flush]);

  const stage = stageFor(attempt, now);

  useEffect(() => {
    if (stage !== "exam") return;
    const interval = setInterval(checkTime, 1_000);
    document.addEventListener("visibilitychange", checkTime);
    window.addEventListener("focus", checkTime);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", checkTime);
      window.removeEventListener("focus", checkTime);
    };
  }, [checkTime, stage]);

  useEffect(() => {
    if (stage === "expired") flush();
  }, [flush, stage]);

  return { attempt, stage, now, current, commit, checkTime, saveStatus };
}
