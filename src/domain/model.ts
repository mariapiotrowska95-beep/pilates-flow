import { z } from "zod";

export const apparatusLabels = {
  mat: "Mata",
  reformer: "Reformer",
  tower: "Wieża",
  rower: "Wiosło",
} as const;
export const phaseLabels = {
  warmup: "Rozgrzewka",
  main: "Część główna",
  cooldown: "Wyciszenie",
} as const;
export const focuses = [
  "Centrum",
  "Biodra",
  "Pośladki",
  "Nogi",
  "Plecy",
  "Barki",
  "Mobilność",
  "Oddech",
  "Równowaga",
] as const;
export const props = [
  "Bez przyborów",
  "Magic Circle",
  "Mała piłka",
  "Wałek",
  "Hantle",
  "Taśma",
  "Jumpboard",
  "Skrzynia",
] as const;
export const levels = ["Podstawowy", "Średni", "Zaawansowany"] as const;
export const apparatusSchema = z.enum(["mat", "reformer", "tower", "rower"]);
export const phaseSchema = z.enum(["warmup", "main", "cooldown"]);
const text = z.string().max(20000);
const id = z.string().min(1).max(120);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const d = new Date(value + "T12:00:00");
    return (
      !Number.isNaN(d.getTime()) &&
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` ===
        value
    );
  }, "Nieprawidłowa data");
export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const exerciseSchema = z.object({
  id,
  name: z.string().min(1).max(160),
  englishName: text,
  apparatus: apparatusSchema,
  focus: z.array(z.enum(focuses)).min(1).max(9),
  props: z.array(z.enum(props)).min(1).max(6),
  level: z.enum(levels),
  phase: phaseSchema,
  minutes: z.number().int().min(1).max(60),
  description: text,
  steps: z.array(text).max(20),
  cues: text,
  caution: text,
  easier: text,
  harder: text,
  preparesFor: z.array(id).max(20),
  image: z
    .string()
    .max(3_000_000)
    .refine(
      (s) =>
        s === "" ||
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s),
      "Niedozwolony format obrazu",
    ),
  video: z
    .object({
      id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
      start: z.number().int().min(0),
      title: z.string(),
      channel: z.string(),
    })
    .optional(),
  custom: z.boolean(),
});
export type Exercise = z.infer<typeof exerciseSchema>;
export type Apparatus = Exercise["apparatus"];
export type Phase = Exercise["phase"];
export const lineSchema = z.object({
  id,
  exercise: exerciseSchema,
  minutes: z.number().int().min(1).max(60),
  phase: phaseSchema,
  note: text,
});
export type PlanLine = z.infer<typeof lineSchema>;
export const groupSchema = z.object({
  id,
  name: z.string().min(1).max(120),
  apparatus: apparatusSchema,
  level: z.enum(levels),
  notes: text,
  color: z.enum(["sage", "peach", "lavender"]),
});
export type Group = z.infer<typeof groupSchema>;
export const sessionSchema = z.object({
  id,
  seriesId: id.nullable(),
  title: z.string().min(1).max(160),
  date: dateSchema,
  time: timeSchema,
  groupId: id.nullable(),
  groupName: text,
  notes: text,
  lines: z.array(lineSchema).min(1).max(100),
  status: z.enum(["planned", "completed", "cancelled"]),
  createdAt: z.string().datetime(),
});
export type Session = z.infer<typeof sessionSchema>;
export const draftSchema = z.object({
  editingId: id.nullable(),
  title: text,
  date: dateSchema,
  time: timeSchema,
  groupId: z.string().max(120),
  notes: text,
  repeat: z.enum(["none", "weekly", "daily"]),
  until: dateSchema,
  lines: z.array(lineSchema).max(100),
});
export type Draft = z.infer<typeof draftSchema>;
export const templateSchema = z.object({
  id,
  name: z.string().min(1).max(160),
  lines: z.array(lineSchema).min(1).max(100),
});
export type PlanTemplate = z.infer<typeof templateSchema>;
export const stateSchema = z.object({
  schemaVersion: z.literal(1),
  revision: z.number().int().min(0),
  customExercises: z.array(exerciseSchema).max(1000),
  favorites: z.array(id).max(2000),
  groups: z.array(groupSchema).max(500),
  sessions: z.array(sessionSchema).max(50000),
  templates: z.array(templateSchema).max(1000),
  draft: draftSchema,
  lastBackup: z.string().datetime().nullable(),
});
export type AppState = z.infer<typeof stateSchema>;

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T12:00:00");
  d.setDate(d.getDate() + days);
  return localDate(d);
}
export function emptyDraft(date = localDate()): Draft {
  return {
    editingId: null,
    title: "",
    date,
    time: "18:00",
    groupId: "",
    notes: "",
    repeat: "none",
    until: addDays(date, 84),
    lines: [],
  };
}
export function initialState(): AppState {
  return {
    schemaVersion: 1,
    revision: 0,
    customExercises: [],
    favorites: [],
    groups: [],
    sessions: [],
    templates: [],
    draft: emptyDraft(),
    lastBackup: null,
  };
}
export const uid = () => crypto.randomUUID();
export const duration = (lines: PlanLine[]) =>
  lines.reduce((sum, line) => sum + line.minutes, 0);
export const formatDate = (
  date: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
) => new Date(date + "T12:00:00").toLocaleDateString("pl-PL", options);

export function recurrenceDates(
  start: string,
  repeat: Draft["repeat"],
  until: string,
): string[] {
  dateSchema.parse(start);
  dateSchema.parse(until);
  if (repeat === "none") return [start];
  if (until < start)
    throw new Error("Koniec powtarzania musi być później niż początek.");
  const dates: string[] = [];
  for (
    let date = start;
    date <= until;
    date = addDays(date, repeat === "daily" ? 1 : 7)
  ) {
    if (dates.length >= 366)
      throw new Error(
        "Jedna seria może zawierać maksymalnie 366 zajęć. Skróć okres powtarzania.",
      );
    dates.push(date);
  }
  return dates;
}

export function saveDraft(state: AppState): { state: AppState; count: number } {
  const draft = state.draft;
  if (!draft.lines.length)
    throw new Error("Dodaj przynajmniej jedno ćwiczenie.");
  if (!draft.title.trim()) throw new Error("Nadaj nazwę zajęciom.");
  dateSchema.parse(draft.date);
  timeSchema.parse(draft.time);
  if (draft.editingId && !state.sessions.some((s) => s.id === draft.editingId))
    throw new Error(
      "Te zajęcia zostały już usunięte. Skopiuj plan do nowych zajęć.",
    );
  const dates = recurrenceDates(
    draft.date,
    draft.editingId ? "none" : draft.repeat,
    draft.until,
  );
  const existing = state.sessions.find((s) => s.id === draft.editingId);
  const seriesId = dates.length > 1 ? uid() : (existing?.seriesId ?? null);
  const group = state.groups.find((g) => g.id === draft.groupId);
  const sessions = dates.map((date) =>
    sessionSchema.parse({
      id: existing?.id ?? uid(),
      seriesId,
      title: draft.title.trim(),
      date,
      time: draft.time,
      groupId: group?.id ?? null,
      groupName: group?.name ?? "",
      notes: draft.notes,
      lines: structuredClone(draft.lines),
      status: existing?.status ?? "planned",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }),
  );
  return {
    state: {
      ...state,
      sessions: [
        ...state.sessions.filter((s) => s.id !== draft.editingId),
        ...sessions,
      ],
      draft: emptyDraft(),
    },
    count: sessions.length,
  };
}

export function sequenceHints(lines: PlanLine[], targetMinutes = 60): string[] {
  if (!lines.length) return [];
  const hints: string[] = [];
  if (lines[0].phase !== "warmup")
    hints.push("Rozważ spokojne przygotowanie ruchowe na początku.");
  if (lines[lines.length - 1].phase !== "cooldown")
    hints.push("Zostaw chwilę na wyciszenie na końcu.");
  const phaseOrder = { warmup: 0, main: 1, cooldown: 2 };
  if (
    lines.some(
      (line, i) =>
        i > 0 && phaseOrder[line.phase] < phaseOrder[lines[i - 1].phase],
    )
  )
    hints.push(
      "Sprawdź kolejność etapów: rozgrzewka → część główna → wyciszenie.",
    );
  if (duration(lines) > targetMinutes)
    hints.push(
      `Plan przekracza ${targetMinutes} min. Uwzględnij też czas na przejścia i zmianę sprzętu.`,
    );
  const equipment = new Set(
    lines
      .filter((l) => l.exercise.apparatus !== "mat")
      .map((l) => l.exercise.apparatus),
  );
  if (equipment.size > 1)
    hints.push(
      "Plan łączy kilka urządzeń. Sprawdź ich dostępność i czas na zmianę stanowisk.",
    );
  return hints;
}

export function parseBackup(raw: string): AppState {
  if (raw.length > 30_000_000)
    throw new Error("Kopia jest zbyt duża (limit 30 MB).");
  const state = stateSchema.parse(JSON.parse(raw));
  for (const collection of [
    state.customExercises,
    state.groups,
    state.sessions,
    state.templates,
  ]) {
    if (new Set(collection.map((x) => x.id)).size !== collection.length)
      throw new Error("Kopia zawiera powtarzające się identyfikatory.");
  }
  return state;
}

export function inferFocus(
  name: string,
  description: string,
): Exercise["focus"] {
  const input = `${name} ${description}`.toLocaleLowerCase("pl");
  const rules: [RegExp, Exercise["focus"][number]][] = [
    [/biod|hip|clam/, "Biodra"],
    [/poślad|bridge|most/, "Pośladki"],
    [/nog|leg|foot|stop/, "Nogi"],
    [/plec|spine|swan|grzbiet/, "Plecy"],
    [/bark|rami|arm|łopat/, "Barki"],
    [/oddech|breath/, "Oddech"],
    [/równow|balance/, "Równowaga"],
    [/mobil|stretch|rozciąg/, "Mobilność"],
  ];
  const matches = rules
    .filter(([rule]) => rule.test(input))
    .map(([, focus]) => focus);
  return matches.length ? matches.slice(0, 3) : ["Centrum"];
}
