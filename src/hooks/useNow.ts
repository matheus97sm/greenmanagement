import { useEffect, useState } from "react";
import { now } from "../lib/clock";

export function useNow(intervalMs = 30_000): number {
  const [current, setCurrent] = useState(now);
  useEffect(() => {
    const id = setInterval(() => setCurrent(now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return current;
}
