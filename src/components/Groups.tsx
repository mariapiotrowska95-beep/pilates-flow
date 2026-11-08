import { useState } from "react";
import { ArrowUpRight, CalendarDays, Pencil, Plus, Users } from "lucide-react";
import {
  apparatusLabels,
  groupSchema,
  levels,
  localDate,
  uid,
  type AppState,
  type Group,
} from "../domain/model";
import { Empty, Modal } from "./ui";

export default function Groups({
  state,
  onSave,
  onDelete,
  onPlan,
  onHistory,
}: {
  state: AppState;
  onSave: (g: Group) => Promise<boolean>;
  onDelete: (g: Group) => void;
  onPlan: (g: Group) => void;
  onHistory: (g: Group) => void;
}) {
  const [editing, setEditing] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);
  const create = () =>
    setEditing({
      id: uid(),
      name: "",
      apparatus: "mat",
      level: "Podstawowy",
      notes: "",
      color: "sage",
    });
  const patch = (p: Partial<Group>) =>
    setEditing((g) => (g ? { ...g, ...p } : g));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ZA KAŻDĄ GRUPĄ SĄ LUDZIE</p>
          <h1>
            Twoje grupy<span className="heading-dot">.</span>
          </h1>
          <p>Zapamiętaj potrzeby grupy. Dopasuj do nich kolejne zajęcia.</p>
        </div>
        <button className="button" onClick={create}>
          <Plus size={18} />
          Dodaj grupę
        </button>
      </div>
      {state.groups.length ? (
        <div className="groups-grid">
          {state.groups.map((g) => {
            const sessions = state.sessions.filter(
              (s) => s.groupId === g.id && s.status !== "cancelled",
            );
            const next = sessions
              .filter((s) => s.date >= localDate())
              .sort((a, b) =>
                (a.date + a.time).localeCompare(b.date + b.time),
              )[0];
            return (
              <article className={`group-card ${g.color}`} key={g.id}>
                <div className="group-card-top">
                  <span className="group-icon">
                    <Users size={24} />
                  </span>
                  <button
                    className="icon-button"
                    aria-label={`Edytuj grupę: ${g.name}`}
                    onClick={() => setEditing({ ...g })}
                  >
                    <Pencil size={17} />
                  </button>
                </div>
                <span className="eyebrow">
                  {apparatusLabels[g.apparatus]} · {g.level}
                </span>
                <h2>{g.name}</h2>
                <p>
                  {g.notes || "Dodaj cel grupy i wskazówki do prowadzenia."}
                </p>
                <button className="group-history" onClick={() => onHistory(g)}>
                  <CalendarDays size={16} />
                  {sessions.length} zapisanych zajęć
                  <ArrowUpRight size={15} />
                </button>
                {next && (
                  <span className="small muted">
                    Najbliższe: {next.date.split("-").reverse().join(".")} ·{" "}
                    {next.time}
                  </span>
                )}
                <button
                  className="button secondary full"
                  onClick={() => onPlan(g)}
                >
                  <Plus size={16} />
                  Zaplanuj dla grupy
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          title="Każda grupa ma swój rytm"
          text="Dodaj grupę, sprzęt i wskazówki. Później przypiszesz do niej terminy i plany zajęć."
          action={create}
          label="Stwórz pierwszą grupę"
        />
      )}
      {editing && (
        <Modal
          title={
            state.groups.some((g) => g.id === editing.id)
              ? "Edytuj grupę"
              : "Poznajmy Twoją grupę"
          }
          eyebrow="TWOJE GRUPY"
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const result = groupSchema.safeParse({
                ...editing,
                name: editing.name.trim(),
              });
              if (!result.success) return;
              setSaving(true);
              if (await onSave(result.data)) setEditing(null);
              setSaving(false);
            }}
          >
            <label>
              Nazwa grupy
              <input
                autoFocus
                required
                maxLength={120}
                placeholder="np. Wtorek · spokojne poranki"
                value={editing.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
            <div className="form-row">
              <label>
                Główny sprzęt
                <select
                  value={editing.apparatus}
                  onChange={(e) =>
                    patch({ apparatus: e.target.value as Group["apparatus"] })
                  }
                >
                  {Object.entries(apparatusLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Poziom
                <select
                  value={editing.level}
                  onChange={(e) =>
                    patch({ level: e.target.value as Group["level"] })
                  }
                >
                  {levels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Wskazówki do prowadzenia
              <textarea
                rows={4}
                placeholder="Cel, preferowane tempo, dostępne przybory. Bez nazwisk i diagnoz uczestników."
                value={editing.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </label>
            <fieldset>
              <legend>Kolor grupy</legend>
              <div className="color-choices">
                {(["sage", "peach", "lavender"] as const).map((c, i) => (
                  <button
                    type="button"
                    key={c}
                    className={`${c} ${editing.color === c ? "active" : ""}`}
                    aria-label={["Szałwiowy", "Brzoskwiniowy", "Lawendowy"][i]}
                    aria-pressed={editing.color === c}
                    onClick={() => patch({ color: c })}
                  />
                ))}
              </div>
            </fieldset>
            <div className="modal-actions">
              {state.groups.some((g) => g.id === editing.id) && (
                <button
                  type="button"
                  className="text-button danger-text"
                  onClick={() => {
                    onDelete(editing);
                    setEditing(null);
                  }}
                >
                  Usuń grupę
                </button>
              )}
              <button type="submit" className="button" disabled={saving}>
                Zapisz grupę
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
