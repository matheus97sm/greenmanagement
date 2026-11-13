import { fetchSnapshot } from "../server/api";
import { ensureDb } from "../server/db";
import { startSimulator } from "../server/simulator";
import { subscribe } from "../server/socket";
import { eventFor } from "../server/visibility";
import { ticketsStore } from "./ticketsStore";

let loadedFor: string | null = null;

export function startRealtime(userId: string): () => void {
  if (loadedFor !== userId) ticketsStore.reset();
  loadedFor = userId;

  let stopped = false;
  let unsubscribe = () => {};
  let stopSimulator = () => {};

  void ensureDb().then((db) => {
    const viewer = db.usuarios.find((u) => u.id === userId);
    if (stopped || !viewer) return;
    unsubscribe = subscribe(
      (event) => ticketsStore.applyEvent(event),
      (event) => eventFor(viewer, event, db),
    );
    stopSimulator = startSimulator(viewer);
  });

  if (ticketsStore.getState().status === "idle") {
    void ticketsStore.load(() => fetchSnapshot(userId));
  }

  return () => {
    stopped = true;
    unsubscribe();
    stopSimulator();
  };
}
