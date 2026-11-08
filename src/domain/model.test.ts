import { describe, expect, it } from "vitest";
import { exercises, starterTemplates } from "../data/exercises";
import {
  addDays,
  duration,
  exerciseSchema,
  inferFocus,
  initialState,
  parseBackup,
  recurrenceDates,
  saveDraft,
  sequenceHints,
  uid,
} from "./model";

function populated() {
  const s = initialState();
  s.draft = {
    ...s.draft,
    title: "Poranna mata",
    date: "2026-11-10",
    lines: starterTemplates()[0].lines,
  };
  return s;
}
describe("kalendarz i serie", () => {
  it("zachowuje lokalne daty przez zmianę czasu wiosną", () => {
    expect(recurrenceDates("2026-03-22", "weekly", "2026-04-05")).toEqual([
      "2026-03-22",
      "2026-03-29",
      "2026-04-05",
    ]);
  });
  it("zachowuje lokalne daty jesienią i na przełomie roku", () => {
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(recurrenceDates("2026-12-30", "daily", "2027-01-02")).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });
  it("sprawdza daty i ogranicza rozmiar serii", () => {
    expect(() => recurrenceDates("2026-02-30", "none", "2026-03-01")).toThrow();
    expect(() =>
      recurrenceDates("2026-11-10", "weekly", "2026-11-01"),
    ).toThrow();
    expect(() => recurrenceDates("2026-01-01", "daily", "2028-01-01")).toThrow(
      /366/,
    );
  });
  it("tworzy serię z niezależnymi migawkami planu", () => {
    const s = populated();
    s.draft.repeat = "weekly";
    s.draft.until = "2026-11-24";
    const { state, count } = saveDraft(s);
    expect(count).toBe(3);
    expect(new Set(state.sessions.map((x) => x.id)).size).toBe(3);
    expect(new Set(state.sessions.map((x) => x.seriesId)).size).toBe(1);
    s.draft.lines[0].exercise.name = "Zmieniona nazwa";
    expect(state.sessions[0].lines[0].exercise.name).toBe(
      "Oddech i ustawienie",
    );
    state.sessions[0].lines[0].exercise.name = "Inny plan";
    expect(state.sessions[1].lines[0].exercise.name).toBe(
      "Oddech i ustawienie",
    );
    expect(state.draft.lines).toHaveLength(0);
  });
  it("edytuje wyłącznie wybrany termin i zachowuje status", () => {
    const s = populated();
    s.draft.repeat = "weekly";
    s.draft.until = "2026-11-24";
    const result = saveDraft(s).state;
    const original = result.sessions[1];
    original.status = "completed";
    result.draft = {
      ...s.draft,
      editingId: original.id,
      title: "Nowa nazwa",
      date: original.date,
    };
    const updated = saveDraft(result).state;
    expect(updated.sessions).toHaveLength(3);
    expect(updated.sessions.find((x) => x.id === original.id)?.status).toBe(
      "completed",
    );
    expect(
      updated.sessions.filter((x) => x.title === "Poranna mata"),
    ).toHaveLength(2);
  });
  it("nie pozwala zapisać pustego planu ani edytować usuniętych zajęć", () => {
    expect(() => saveDraft(initialState())).toThrow();
    const s = populated();
    s.draft.editingId = uid();
    expect(() => saveDraft(s)).toThrow(/usunięte/);
  });
});
describe("katalog i kopie", () => {
  it("wszystkie ćwiczenia i powiązania są poprawne", () => {
    const ids = new Set(exercises.map((e) => e.id));
    expect(ids.size).toBe(exercises.length);
    exercises.forEach((e) => {
      expect(exerciseSchema.safeParse(e).success).toBe(true);
      e.preparesFor.forEach((id) => expect(ids.has(id)).toBe(true));
    });
  });
  it("wylicza czas i podpowiada brak rozgrzewki i wyciszenia", () => {
    const lines = starterTemplates()[0].lines;
    expect(duration(lines)).toBe(lines.reduce((sum, l) => sum + l.minutes, 0));
    expect(sequenceHints(lines)).toEqual([]);
    expect(sequenceHints([lines[3]])).toHaveLength(2);
  });
  it("odtwarza pełny stan z migawkami i odrzuca nowszy format", () => {
    const s = saveDraft(populated()).state;
    expect(parseBackup(JSON.stringify(s))).toEqual(s);
    expect(() =>
      parseBackup(JSON.stringify({ ...s, schemaVersion: 2 })),
    ).toThrow();
  });
  it("odrzuca duplikaty i obrazy zawierające aktywną treść", () => {
    const s = saveDraft(populated()).state;
    s.sessions.push(s.sessions[0]);
    expect(() => parseBackup(JSON.stringify(s))).toThrow(/identyfikatory/);
    expect(
      exerciseSchema.safeParse({
        ...exercises[0],
        image: "data:image/svg+xml,<svg onload=alert(1) />",
      }).success,
    ).toBe(false);
  });
  it("sugeruje wielowymiarowe tagi z polskich nazw", () => {
    expect(inferFocus("Most biodrowy", "Praca pośladków")).toEqual([
      "Biodra",
      "Pośladki",
    ]);
    expect(inferFocus("Nowe ćwiczenie", "")).toEqual(["Centrum"]);
    expect(inferFocus("Mobilność bioder", "")).toEqual(["Biodra", "Mobilność"]);
  });
});
