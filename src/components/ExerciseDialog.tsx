import { useState } from "react";
import { Plus, Pencil, ArrowUpRight, Heart, ImagePlus } from "lucide-react";
import {
  apparatusLabels,
  exerciseSchema,
  focuses,
  inferFocus,
  levels,
  phaseLabels,
  props,
  uid,
  formatDate,
  type Exercise,
  type AppState,
} from "../domain/model";
import { Modal, MovementArt, Tags } from "./ui";

export function ExerciseDetail({
  exercise,
  state,
  allExercises,
  onClose,
  onAdd,
  onEdit,
  onRelated,
  onSession,
}: {
  exercise: Exercise;
  state: AppState;
  allExercises: Exercise[];
  onClose: () => void;
  onAdd: () => void;
  onEdit: () => void;
  onRelated: (e: Exercise) => void;
  onSession: (id: string) => void;
}) {
  const usage = state.sessions
    .filter(
      (s) =>
        s.status !== "cancelled" &&
        s.lines.some((l) => l.exercise.id === exercise.id),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);
  return (
    <Modal
      title={exercise.name}
      eyebrow={exercise.englishName || "TWOJA BIBLIOTEKA"}
      onClose={onClose}
      wide
    >
      {exercise.image ? (
        <img
          className="detail-image"
          src={exercise.image}
          alt={exercise.name}
        />
      ) : (
        <MovementArt kind={exercise.apparatus} large />
      )}
      <div className="detail-body">
        <Tags exercise={exercise} />
        <p className="detail-lead">{exercise.description}</p>
        <div className="detail-grid">
          <section>
            <h3>Przebieg ruchu</h3>
            <ol className="steps">
              {exercise.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <h3>Wskazówki do prowadzenia</h3>
            <p>
              {exercise.cues || "Dodaj własne wskazówki w edycji ćwiczenia."}
            </p>
            <div className="focus-tags">
              {exercise.focus.map((f) => (
                <span key={f}>{f}</span>
              ))}
              {exercise.props
                .filter((p) => p !== "Bez przyborów")
                .map((p) => (
                  <span key={p}>{p}</span>
                ))}
            </div>
          </section>
          <section className="variant-panel">
            <h3>Dobierz wariant</h3>
            <p className="variant-label">ŁATWIEJ</p>
            <p>{exercise.easier || "Wariant do uzupełnienia."}</p>
            <p className="variant-label">TRUDNIEJ</p>
            <p>{exercise.harder || "Wariant do uzupełnienia."}</p>
          </section>
        </div>
        <div className="care-note">
          <Heart size={19} />
          <div>
            <strong>Uwaga instruktorska</strong>
            <p>{exercise.caution}</p>
          </div>
        </div>
        {exercise.preparesFor.length > 0 && (
          <section>
            <h3>Może przygotować do</h3>
            <div className="related">
              {exercise.preparesFor.map((id) => {
                const related = allExercises.find((e) => e.id === id);
                return (
                  related && (
                    <button key={id} onClick={() => onRelated(related)}>
                      {related.name}
                      <ArrowUpRight size={15} />
                    </button>
                  )
                );
              })}
            </div>
          </section>
        )}
        <section>
          <h3>To ćwiczenie w Twoich zajęciach</h3>
          {usage.length ? (
            usage.map((s) => (
              <button
                className="usage-row"
                key={s.id}
                onClick={() => onSession(s.id)}
              >
                <span>
                  {formatDate(s.date)} · {s.time}
                </span>
                <strong>{s.groupName || s.title}</strong>
                <ArrowUpRight size={16} />
              </button>
            ))
          ) : (
            <p className="muted">
              Nie było jeszcze zapisane w żadnych zajęciach.
            </p>
          )}
        </section>
        <div className="modal-actions">
          <button className="button secondary" onClick={onEdit}>
            <Pencil size={16} />
            {exercise.custom ? "Edytuj ćwiczenie" : "Utwórz własny wariant"}
          </button>
          <button className="button" onClick={onAdd}>
            <Plus size={18} />
            Dodaj do planu · {exercise.minutes} min
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ExerciseForm({
  exercise,
  onClose,
  onSave,
}: {
  exercise?: Exercise;
  onClose: () => void;
  onSave: (e: Exercise) => Promise<boolean>;
}) {
  const [value, setValue] = useState<Exercise>(
    exercise
      ? {
          ...structuredClone(exercise),
          id: exercise.custom ? exercise.id : uid(),
          custom: true,
          name: exercise.custom
            ? exercise.name
            : `${exercise.name} — mój wariant`,
        }
      : {
          id: uid(),
          name: "",
          englishName: "",
          apparatus: "mat",
          focus: ["Centrum"],
          props: ["Bez przyborów"],
          level: "Podstawowy",
          phase: "main",
          minutes: 4,
          description: "",
          steps: [],
          cues: "",
          caution: "Dobierz do możliwości grupy. Przerwij ruch wywołujący ból.",
          easier: "",
          harder: "",
          preparesFor: [],
          image: "",
          custom: true,
        },
  );
  const [autoTags, setAutoTags] = useState(!exercise);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<Exercise>) =>
    setValue((v) => ({ ...v, ...patch }));
  const suggested = inferFocus(value.name, value.description);
  async function image(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Wybierz JPG, PNG lub WebP.");
      return;
    }
    if (file.size > 2_000_000) {
      setError("Zdjęcie może mieć maksymalnie 2 MB.");
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      set({ image: data });
      setError("");
    } catch {
      setError("Nie udało się odczytać zdjęcia.");
    }
  }
  return (
    <Modal
      title={exercise?.custom ? "Edytuj ćwiczenie" : "Twój nowy ruch"}
      eyebrow="BIBLIOTEKA"
      onClose={onClose}
      wide
    >
      <form
        className="exercise-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const result = exerciseSchema.safeParse({
            ...value,
            name: value.name.trim(),
            focus: autoTags ? suggested : value.focus,
          });
          if (!result.success) {
            setError("Sprawdź nazwę, czas i kategorie ćwiczenia.");
            return;
          }
          setSaving(true);
          if (await onSave(result.data)) onClose();
          setSaving(false);
        }}
      >
        <div className="form-row">
          <label>
            Nazwa ćwiczenia
            <input
              required
              maxLength={160}
              value={value.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </label>
          <label>
            Nazwa angielska (opcjonalna)
            <input
              value={value.englishName}
              onChange={(e) => set({ englishName: e.target.value })}
            />
          </label>
        </div>
        <div className="form-row three">
          <label>
            Sprzęt
            <select
              value={value.apparatus}
              onChange={(e) =>
                set({ apparatus: e.target.value as Exercise["apparatus"] })
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
              value={value.level}
              onChange={(e) =>
                set({ level: e.target.value as Exercise["level"] })
              }
            >
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label>
            Etap
            <select
              value={value.phase}
              onChange={(e) =>
                set({ phase: e.target.value as Exercise["phase"] })
              }
            >
              {Object.entries(phaseLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Opis
          <textarea
            required
            rows={3}
            value={value.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </label>
        <fieldset>
          <legend>Cele ruchowe</legend>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoTags}
              onChange={(e) => setAutoTags(e.target.checked)}
            />
            Sugeruj kategorie na podstawie nazwy i opisu
          </label>
          {autoTags ? (
            <p className="small muted">
              Sugestia: {suggested.join(" · ")}. Możesz odznaczyć i wybrać
              samodzielnie.
            </p>
          ) : (
            <div className="choice-chips">
              {focuses.map((f) => (
                <button
                  type="button"
                  key={f}
                  className={value.focus.includes(f) ? "active" : ""}
                  aria-pressed={value.focus.includes(f)}
                  onClick={() =>
                    set({
                      focus: value.focus.includes(f)
                        ? value.focus.filter((x) => x !== f)
                        : [...value.focus, f],
                    })
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </fieldset>
        <fieldset>
          <legend>Przybory</legend>
          <div className="choice-chips">
            {props.map((p) => (
              <button
                type="button"
                key={p}
                className={value.props.includes(p) ? "active" : ""}
                aria-pressed={value.props.includes(p)}
                onClick={() =>
                  set({
                    props:
                      p === "Bez przyborów"
                        ? ["Bez przyborów"]
                        : value.props.includes(p)
                          ? value.props.filter((x) => x !== p).length
                            ? value.props.filter((x) => x !== p)
                            : ["Bez przyborów"]
                          : [
                              ...value.props.filter(
                                (x) => x !== "Bez przyborów",
                              ),
                              p,
                            ],
                  })
                }
              >
                {p}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          Przebieg — jeden krok w wierszu
          <textarea
            rows={4}
            required
            value={value.steps.join("\n")}
            onChange={(e) => set({ steps: e.target.value.split("\n") })}
          />
        </label>
        <label>
          Wskazówki do prowadzenia
          <textarea
            rows={2}
            value={value.cues}
            onChange={(e) => set({ cues: e.target.value })}
          />
        </label>
        <div className="form-row">
          <label>
            Łatwiejszy wariant
            <textarea
              rows={2}
              value={value.easier}
              onChange={(e) => set({ easier: e.target.value })}
            />
          </label>
          <label>
            Trudniejszy wariant
            <textarea
              rows={2}
              value={value.harder}
              onChange={(e) => set({ harder: e.target.value })}
            />
          </label>
        </div>
        <label>
          Uwagi i ograniczenia
          <textarea
            rows={2}
            value={value.caution}
            onChange={(e) => set({ caution: e.target.value })}
          />
        </label>
        <div className="form-row">
          <label>
            Orientacyjny czas (min)
            <input
              type="number"
              min="1"
              max="60"
              required
              value={value.minutes}
              onChange={(e) => set({ minutes: Number(e.target.value) })}
            />
          </label>
          <label className="image-upload">
            <span>
              <ImagePlus size={16} />
              Zdjęcie (do 2 MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => void image(e.target.files?.[0])}
            />
          </label>
        </div>
        {value.image && (
          <div className="image-preview">
            <img src={value.image} alt="Podgląd zdjęcia ćwiczenia" />
            <button
              type="button"
              className="text-button"
              onClick={() => set({ image: "" })}
            >
              Usuń zdjęcie
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Anuluj
          </button>
          <button type="submit" className="button" disabled={saving}>
            <Plus size={17} />
            Zapisz ćwiczenie
          </button>
        </div>
      </form>
    </Modal>
  );
}
