import { useEffect, useRef } from "react";

export function usePolling(
  fn: () => Promise<void>,
  intervalMs: number,
  enabled: boolean,
): void {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const run = async () => {
      if (!mounted) return;
      try {
        await fnRef.current();
      } catch {
        // Silently fail; caller should handle errors
      }
      if (mounted) {
        timeoutId = setTimeout(run, intervalMs);
      }
    };

    run();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [intervalMs, enabled]);
}
