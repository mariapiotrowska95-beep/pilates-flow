import { openDB, type DBSchema } from "idb";
import { initialState, stateSchema, type AppState } from "../domain/model";

interface PilatesDB extends DBSchema {
  state: { key: string; value: AppState };
}
const getDB = () =>
  openDB<PilatesDB>("pilates-flow", 1, {
    upgrade(db) {
      db.createObjectStore("state");
    },
  });

export const repository = {
  async read(): Promise<AppState> {
    const db = await getDB();
    try {
      const value = await db.get("state", "current");
      return value ? stateSchema.parse(value) : initialState();
    } finally {
      db.close();
    }
  },
  async write(
    next: AppState,
    expectedRevision: number,
    beforeImport = false,
  ): Promise<AppState> {
    const parsed = stateSchema.parse(next);
    const db = await getDB();
    try {
      const tx = db.transaction("state", "readwrite");
      const current = await tx.store.get("current");
      if ((current?.revision ?? 0) !== expectedRevision) {
        tx.abort();
        await tx.done.catch(() => undefined);
        throw new Error(
          "Dane zmieniły się w innej karcie. Odśwież aplikację przed kolejnym zapisem.",
        );
      }
      if (beforeImport)
        await tx.store.put(current ?? initialState(), "before-import");
      const result = { ...parsed, revision: expectedRevision + 1 };
      await tx.store.put(result, "current");
      await tx.done;
      return result;
    } finally {
      db.close();
    }
  },
  async beforeImport(): Promise<AppState | undefined> {
    const db = await getDB();
    try {
      return await db.get("state", "before-import");
    } finally {
      db.close();
    }
  },
};
