import { fetchSnapshot } from "@/server/api";
import { ensureDb } from "@/server/db";
import { startSimulator } from "@/server/simulator";
import { subscribe } from "@/server/socket";
import { eventFor } from "@/server/visibility";
import { LoadStatus } from "./enums";
import { loadReadMarks, persistReadMarks } from "./readMarks";
import { ticketsStore } from "./ticketsStore";

export function startRealtime(userId: string): () => void {
  let stopped = false;
  let unsubscribe = () => {};
  let stopSimulator = () => {};

  void ensureDb().then((database) => {
    const viewer = database.usuarios.find((person) => person.id === userId);
    if (stopped || !viewer) return;
    unsubscribe = subscribe(
      (event) => ticketsStore.applyEvent(event),
      (event) => eventFor(viewer, event, database),
    );
    stopSimulator = startSimulator(viewer);
  });

  if (ticketsStore.getState().status === LoadStatus.Idle) {
    void ticketsStore.load(() => fetchSnapshot(userId), loadReadMarks(userId));
  }
  const stopPersisting = persistReadMarks(userId, ticketsStore);

  return () => {
    stopped = true;
    unsubscribe();
    stopSimulator();
    stopPersisting();
    ticketsStore.reset();
  };
}
