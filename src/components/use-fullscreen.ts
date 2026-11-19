"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useFullscreen() {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    function update() {
      const fullScreen = document.fullscreenElement === document.documentElement;
      setActive(fullScreen);
      if (fullScreen) setError("");
    }

    update();
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const enter = useCallback((quiet = false): Promise<boolean> => {
    const root = document.documentElement;
    if (document.fullscreenElement === root) return Promise.resolve(true);
    if (pending.current) return pending.current;

    if (!document.fullscreenEnabled || typeof root.requestFullscreen !== "function") {
      if (!quiet) setError("Open the assessment in a desktop browser that supports full screen.");
      return Promise.resolve(false);
    }

    pending.current = root.requestFullscreen()
      .then(() => {
        const fullScreen = document.fullscreenElement === root;
        setActive(fullScreen);
        if (fullScreen) setError("");
        return fullScreen;
      })
      .catch(() => {
        if (!quiet) setError("The browser could not enter full screen. Select the full screen button to try again.");
        return false;
      })
      .finally(() => { pending.current = null; });

    return pending.current;
  }, []);

  const leave = useCallback(() => {
    setError("");
    function exit() {
      if (document.fullscreenElement === document.documentElement) {
        void document.exitFullscreen().catch(() => {});
      }
    }

    if (pending.current) {
      void pending.current.then(exit);
    } else {
      exit();
    }
  }, []);

  return { active, error, enter, leave };
}
