import { beforeEach, describe, expect, it } from "vitest";
import { deleteDB } from "idb";
import { initialState } from "../domain/model";
import { repository } from "./repository";

beforeEach(async () => {
  await deleteDB("pilates-flow");
});
describe("trwałość i bezpieczeństwo zapisu", () => {
  it("odczytuje nową bazę i zachowuje zapis po ponownym otwarciu", async () => {
    const initial = await repository.read();
    expect(initial.revision).toBe(0);
    initial.draft.title = "Zapamiętany szkic";
    await repository.write(initial, 0);
    const reopened = await repository.read();
    expect(reopened.draft.title).toBe("Zapamiętany szkic");
    expect(reopened.revision).toBe(1);
  });
  it("nie nadpisuje danych ze starej karty", async () => {
    const s = initialState();
    await repository.write(
      { ...s, draft: { ...s.draft, title: "Ważny plan" } },
      0,
    );
    await expect(repository.write(s, 0)).rejects.toThrow(/innej karcie/);
    expect((await repository.read()).draft.title).toBe("Ważny plan");
  });
  it("import i kopia bezpieczeństwa zapisują się razem", async () => {
    const s = initialState();
    const first = await repository.write(
      { ...s, draft: { ...s.draft, title: "Przed importem" } },
      0,
    );
    await repository.write(
      { ...s, draft: { ...s.draft, title: "Po imporcie" } },
      first.revision,
      true,
    );
    expect((await repository.beforeImport())?.draft.title).toBe(
      "Przed importem",
    );
    expect((await repository.read()).draft.title).toBe("Po imporcie");
  });
  it("nie zapisuje danych o nieobsługiwanym formacie", async () => {
    await expect(
      repository.write({ ...initialState(), schemaVersion: 2 } as never, 0),
    ).rejects.toThrow();
    expect((await repository.read()).revision).toBe(0);
  });
});
