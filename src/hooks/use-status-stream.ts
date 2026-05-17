"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardSnapshotDto } from "@/types/status";

export function useStatusStream(onSnapshot: (snapshot: DashboardSnapshotDto) => void) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handlerRef = useRef(onSnapshot);
  handlerRef.current = onSnapshot;

  useEffect(() => {
    const source = new EventSource("/api/events");

    source.addEventListener("open", () => {
      setConnected(true);
      setError(null);
    });

    source.addEventListener("snapshot", (event) => {
      try {
        handlerRef.current(JSON.parse((event as MessageEvent).data) as DashboardSnapshotDto);
      } catch {
        setError("SSE payload не удалось прочитать.");
      }
    });

    source.addEventListener("error", () => {
      setConnected(false);
      setError("Real-time соединение временно недоступно.");
    });

    return () => {
      source.close();
    };
  }, []);

  return { connected, error };
}
