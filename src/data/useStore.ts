import { useEffect, useRef, useState } from "react";
import type { AppState } from "../domain/model";
import { repository } from "./repository";

export function useStore() {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const current = useRef<AppState | null>(null);
  const optimistic = useRef<AppState | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const failed = useRef(false);
  useEffect(() => {
    let alive = true;
    repository
      .read()
      .then((s) => {
        if (alive) {
          current.current = s;
          optimistic.current = s;
          setState(s);
        }
      })
      .catch(() => {
        if (alive)
          setError(
            "Pamięć lokalna jest niedostępna lub dane mają nieobsługiwany format. Spróbuj użyć zwykłego okna przeglądarki. Nie czyść danych witryny.",
          );
      });
    return () => {
      alive = false;
    };
  }, []);
  // Inputs update immediately; success is acknowledged only after the queued commit.
  async function mutate(
    update: (s: AppState) => AppState,
    beforeImport = false,
  ): Promise<boolean> {
    if (failed.current) {
      setError("Zapis został wstrzymany po błędzie. Odśwież aplikację przed dalszą pracą.");
      return false;
    }
    if (!optimistic.current) return false;
    let proposed: AppState;
    try {
      proposed = update(optimistic.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sprawdź dane formularza.");
      return false;
    }
    optimistic.current = proposed;
    setState(proposed);
    setPending((n) => n + 1);
    let success = false;
    const job = queue.current
      .catch(() => undefined)
      .then(async () => {
        if (failed.current || !current.current) return;
        try {
          const next = await repository.write(
            proposed,
            current.current.revision,
            beforeImport,
          );
          current.current = next;
          if (optimistic.current === proposed) {
            optimistic.current = next;
            setState(next);
          }
          success = true;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Nie udało się zapisać danych.";
          failed.current = true;
          optimistic.current = current.current;
          setState(current.current);
          setError(message + " Zapis wstrzymany. Odśwież aplikację przed dalszą pracą.");
        }
      });
    queue.current = job;
    await job;
    setPending((n) => n - 1);
    return success;
  }
  return { state, mutate, error, clearError: () => setError(""), pending };
}
