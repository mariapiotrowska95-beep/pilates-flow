import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  FilePlus2,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import {
  duration,
  phaseLabels,
  sequenceHints,
  type AppState,
  type Draft,
  type PlanLine,
  type PlanTemplate,
} from "../domain/model";
import { Empty, Modal } from "./ui";

export default function Planner({
  state,
  onDraft,
  onLibrary,
  onSave,
  onReset,
  onTemplate,
  onSaveTemplate,
  templates,
  onDetail,
  pending,
}: {
  state: AppState;
  onDraft: (patch: Partial<Draft>) => void;
  onLibrary: () => void;
  onSave: () => void;
  onReset: () => void;
  onTemplate: (t: PlanTemplate) => void;
  onSaveTemplate: (name: string) => void;
  templates: PlanTemplate[];
  onDetail: (line: PlanLine) => void;
  pending: boolean;
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const { draft } = state;
  const patchLine = (id: string, patch: Partial<PlanLine>) =>
    onDraft({
      lines: draft.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  const move = (i: number, offset: number) => {
    const lines = [...draft.lines];
    [lines[i], lines[i + offset]] = [lines[i + offset], lines[i]];
    onDraft({ lines });
  };
  const hints = sequenceHints(draft.lines);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">KAŻDY RUCH MA SWOJE MIEJSCE</p>
          <h1>
            {draft.editingId ? "Edytuj zajęcia" : "Ułóż swoje zajęcia"}
            <span className="heading-dot">.</span>
          </h1>
          <p>
            {draft.editingId
              ? "Zmieniasz tylko ten termin. Pozostałe zajęcia z serii zachowają swój plan."
              : "Zbuduj sekwencję, która pasuje do Twojej grupy."}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() => setShowTemplates(true)}
        >
          <Copy size={17} />
          Szablony
        </button>
      </div>
      <div className="planner-layout">
        <section className="plan-sequence">
          <div className="panel-title">
            <div>
              <h2>
                Twoja sekwencja{" "}
                <span className="count">{draft.lines.length}</span>
              </h2>
              <p className="muted small">
                Kolejność zmienisz strzałkami. Szkic zapisuje się na urządzeniu.
              </p>
            </div>
            {draft.lines.length > 0 && (
              <button
                className="icon-button"
                aria-label="Nowy pusty plan"
                onClick={onReset}
              >
                <FilePlus2 size={20} />
              </button>
            )}
          </div>
          {draft.lines.length === 0 ? (
            <Empty
              title="Zacznij od pierwszego ruchu"
              text="Wybierz ćwiczenia z biblioteki lub skorzystaj ze startowego szablonu."
              action={onLibrary}
              label="Otwórz bibliotekę"
            />
          ) : (
            <div className="sequence-list">
              {draft.lines.map((line, i) => (
                <article className="sequence-item" key={line.id}>
                  <span className="sequence-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="sequence-content">
                    <div className="sequence-title">
                      <button onClick={() => onDetail(line)}>
                        {line.exercise.name}
                      </button>
                      <button
                        className="icon-button danger-text"
                        aria-label={`Usuń z planu: ${line.exercise.name}`}
                        onClick={() =>
                          onDraft({
                            lines: draft.lines.filter((l) => l.id !== line.id),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="line-controls">
                      <label className="sr-only" htmlFor={`phase-${line.id}`}>
                        Etap: {line.exercise.name}
                      </label>
                      <select
                        id={`phase-${line.id}`}
                        value={line.phase}
                        className={`phase-select ${line.phase}`}
                        onChange={(e) =>
                          patchLine(line.id, {
                            phase: e.target.value as PlanLine["phase"],
                          })
                        }
                      >
                        {Object.entries(phaseLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <label className="minutes-field">
                        <input
                          aria-label={`Minuty: ${line.exercise.name}`}
                          type="number"
                          min="1"
                          max="60"
                          value={line.minutes}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isInteger(n) && n >= 1 && n <= 60)
                              patchLine(line.id, { minutes: n });
                          }}
                        />
                        min
                      </label>
                      <div className="move-buttons">
                        <button
                          className="icon-button"
                          disabled={i === 0}
                          onClick={() => move(i, -1)}
                          aria-label={`Przesuń w górę: ${line.exercise.name}`}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={i === draft.lines.length - 1}
                          onClick={() => move(i, 1)}
                          aria-label={`Przesuń w dół: ${line.exercise.name}`}
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </div>
                    <input
                      className="line-note"
                      aria-label={`Notatka: ${line.exercise.name}`}
                      placeholder="Powtórzenia, oddech, wariant dla grupy…"
                      value={line.note}
                      onChange={(e) =>
                        patchLine(line.id, { note: e.target.value })
                      }
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
          <button className="add-exercise-row" onClick={onLibrary}>
            <Plus size={20} />
            Dodaj ćwiczenie z biblioteki
          </button>
          {hints.length > 0 && (
            <div className="sequence-hints">
              <Info size={18} />
              <div>
                <strong>Sprawdź przepływ zajęć</strong>
                {hints.map((h) => (
                  <p key={h}>{h}</p>
                ))}
              </div>
            </div>
          )}
          {draft.lines.length > 0 && (
            <button
              className="text-button save-template-button"
              onClick={() => setSaveTemplate(true)}
            >
              <Bookmark size={16} />
              Zapisz sekwencję jako szablon
            </button>
          )}
        </section>
        <aside className="schedule-panel">
          <p className="eyebrow">SZCZEGÓŁY ZAJĘĆ</p>
          <h2>
            Zarezerwuj czas
            <br />
            na dobry ruch.
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
          >
            <label>
              Nazwa zajęć
              <input
                required
                maxLength={160}
                placeholder="np. Mobilność i spokojna siła"
                value={draft.title}
                onChange={(e) => onDraft({ title: e.target.value })}
              />
            </label>
            <label>
              Grupa
              <select
                value={draft.groupId}
                onChange={(e) => onDraft({ groupId: e.target.value })}
              >
                <option value="">Bez przypisanej grupy</option>
                {state.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            {state.groups.find((g) => g.id === draft.groupId)?.notes && (
              <div className="group-notes">
                <Info size={15} />
                <p>{state.groups.find((g) => g.id === draft.groupId)?.notes}</p>
              </div>
            )}
            <div className="form-row">
              <label>
                <span>
                  <CalendarDays size={14} />
                  Data
                </span>
                <input
                  required
                  type="date"
                  value={draft.date}
                  onInput={(e) => {
                    if (e.currentTarget.value) onDraft({ date: e.currentTarget.value });
                  }}
                  onChange={(e) => {
                    if (e.target.value) onDraft({ date: e.target.value });
                  }}
                />
              </label>
              <label>
                <span>
                  <Clock3 size={14} />
                  Godzina
                </span>
                <input
                  required
                  type="time"
                  value={draft.time}
                  onInput={(e) => {
                    if (e.currentTarget.value) onDraft({ time: e.currentTarget.value });
                  }}
                  onChange={(e) => {
                    if (e.target.value) onDraft({ time: e.target.value });
                  }}
                />
              </label>
            </div>
            {!draft.editingId && (
              <label>
                Powtarzaj
                <select
                  value={draft.repeat}
                  onChange={(e) =>
                    onDraft({ repeat: e.target.value as Draft["repeat"] })
                  }
                >
                  <option value="none">Nie powtarzaj</option>
                  <option value="weekly">Co tydzień</option>
                  <option value="daily">Codziennie</option>
                </select>
              </label>
            )}
            {!draft.editingId && draft.repeat !== "none" && (
              <label>
                Ostatni możliwy termin
                <input
                  required
                  type="date"
                  min={draft.date}
                  value={draft.until}
                  onInput={(e) => {
                    if (e.currentTarget.value) onDraft({ until: e.currentTarget.value });
                  }}
                  onChange={(e) => {
                    if (e.target.value) onDraft({ until: e.target.value });
                  }}
                />
              </label>
            )}
            <label>
              Notatka do zajęć
              <textarea
                maxLength={20000}
                rows={3}
                placeholder="Cel zajęć, potrzebne przybory, uwagi…"
                value={draft.notes}
                onChange={(e) => onDraft({ notes: e.target.value })}
              />
            </label>
            <div className="plan-summary">
              <span>Łączny czas ćwiczeń</span>
              <strong>
                {duration(draft.lines)} <small>min</small>
              </strong>
            </div>
            <p className="small muted">
              Dodaj czas na instrukcje i zmianę pozycji.
            </p>
            <button
              className="button full"
              disabled={!draft.lines.length || pending}
              type="submit"
            >
              <Check size={18} />
              {draft.editingId ? "Zapisz zmiany" : "Zapisz zajęcia"}
            </button>
          </form>
        </aside>
      </div>
      {showTemplates && (
        <Modal
          title="Dobry punkt wyjścia"
          eyebrow="TWOJE SZABLONY"
          onClose={() => setShowTemplates(false)}
        >
          <p className="muted">
            Szablon zastąpi sekwencję w szkicu. Dopasuj go do grupy przed
            zajęciami.
          </p>
          <div className="template-list">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  onTemplate(t);
                  setShowTemplates(false);
                }}
              >
                <span className="template-icon">
                  <Copy size={21} />
                </span>
                <span>
                  <strong>{t.name}</strong>
                  <small>
                    {t.lines.length} ćwiczeń · {duration(t.lines)} min
                    {t.id.startsWith("starter") ? " · przykład" : ""}
                  </small>
                </span>
                <Plus size={18} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {saveTemplate && (
        <Modal
          title="Zachowaj ten przepływ"
          onClose={() => setSaveTemplate(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (templateName.trim()) {
                onSaveTemplate(templateName.trim());
                setSaveTemplate(false);
              }
            }}
          >
            <label>
              Nazwa szablonu
              <input
                autoFocus
                required
                maxLength={160}
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="np. Biodra i stabilizacja"
              />
            </label>
            <button className="button full" type="submit">
              Zapisz szablon
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
