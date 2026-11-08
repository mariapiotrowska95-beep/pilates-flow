import { useState } from "react";
import {
  Search,
  Plus,
  Heart,
  SlidersHorizontal,
  ArrowUpRight,
  X,
} from "lucide-react";
import {
  apparatusLabels,
  focuses,
  props,
  levels,
  type Exercise,
  type AppState,
} from "../domain/model";
import { Empty } from "./ui";
import { ExercisePhoto } from "./ExerciseMedia";

export default function Library({
  exercises,
  state,
  onAdd,
  onDetail,
  onFavorite,
  onCreate,
}: {
  exercises: Exercise[];
  state: AppState;
  onAdd: (e: Exercise) => void;
  onDetail: (e: Exercise) => void;
  onFavorite: (id: string) => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = useState("");
  const [apparatus, setApparatus] = useState("all");
  const [focus, setFocus] = useState("");
  const [prop, setProp] = useState("");
  const [level, setLevel] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const normal = (s: string) =>
    s
      .toLocaleLowerCase("pl")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l");
  const filtered = exercises.filter(
    (e) =>
      (apparatus === "all" || e.apparatus === apparatus) &&
      (!focus || e.focus.includes(focus as Exercise["focus"][number])) &&
      (!prop || e.props.includes(prop as Exercise["props"][number])) &&
      (!level || e.level === level) &&
      (!favoritesOnly || state.favorites.includes(e.id)) &&
      normal(
        `${e.name} ${e.englishName} ${e.focus.join(" ")} ${e.description}`,
      ).includes(normal(search)),
  );
  const reset = () => {
    setSearch("");
    setApparatus("all");
    setFocus("");
    setProp("");
    setLevel("");
    setFavoritesOnly(false);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OD INSPIRACJI DO SEKWENCJI</p>
          <h1>
            Biblioteka ćwiczeń<span className="heading-dot">.</span>
          </h1>
          <p>Znajdź dobry ruch dla swojej grupy.</p>
        </div>
        <button className="button" onClick={onCreate}>
          <Plus size={18} />
          Dodaj ćwiczenie
        </button>
      </div>
      <div className="category-tabs" aria-label="Sprzęt">
        <button
          className={apparatus === "all" ? "active" : ""}
          onClick={() => setApparatus("all")}
        >
          Wszystkie <span>{exercises.length}</span>
        </button>
        {Object.entries(apparatusLabels).map(([key, label]) => (
          <button
            key={key}
            className={apparatus === key ? "active" : ""}
            onClick={() => setApparatus(key)}
          >
            {label}
            <span>{exercises.filter((e) => e.apparatus === key).length}</span>
          </button>
        ))}
      </div>
      <div className="search-row">
        <div className="search">
          <Search size={19} />
          <input
            aria-label="Szukaj ćwiczeń"
            placeholder="Szukaj nazwy, partii ciała lub ruchu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="icon-button"
              onClick={() => setSearch("")}
              aria-label="Wyczyść wyszukiwanie"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className={`button secondary filter-toggle ${expanded ? "selected" : ""}`}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          <SlidersHorizontal size={17} />
          Filtry
          {[focus, prop, level].filter(Boolean).length > 0 && (
            <span className="count">
              {[focus, prop, level].filter(Boolean).length}
            </span>
          )}
        </button>
        <button
          className={`icon-button favorite-filter ${favoritesOnly ? "selected" : ""}`}
          aria-label="Tylko ulubione"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          <Heart size={20} fill={favoritesOnly ? "currentColor" : "none"} />
        </button>
      </div>
      {expanded && (
        <div className="filter-panel">
          <label>
            Cel ruchowy
            <select value={focus} onChange={(e) => setFocus(e.target.value)}>
              <option value="">Wszystkie cele</option>
              {focuses.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label>
            Przybory
            <select value={prop} onChange={(e) => setProp(e.target.value)}>
              <option value="">Wszystkie przybory</option>
              {props.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Poziom
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Każdy poziom</option>
              {levels.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <button className="text-button" onClick={reset}>
            Wyczyść filtry
          </button>
        </div>
      )}
      <div className="section-heading">
        <span className="muted">
          {filtered.length} {filtered.length === 1 ? "ćwiczenie" : "ćwiczeń"}
        </span>
        <span className="small muted">Dodawaj do planu przyciskiem +</span>
      </div>
      {!filtered.length ? (
        <Empty
          title="Miejsce na nowy ruch"
          text={
            apparatus === "rower"
              ? "Kategoria wiosło czeka na Twoje ćwiczenia. Dodaj opis odpowiedni dla używanego sprzętu."
              : "Zmień filtry albo dodaj własne ćwiczenie do biblioteki."
          }
          action={reset}
          label="Pokaż wszystkie"
        />
      ) : (
        <div className="exercise-grid">
          {filtered.map((exercise) => {
            const selected = state.draft.lines.some(
              (l) => l.exercise.id === exercise.id,
            );
            return (
              <article className="exercise-card" key={exercise.id}>
                <div className="card-art-wrap">
                  <button
                    className="card-art-button"
                    onClick={() => onDetail(exercise)}
                    aria-label={`Szczegóły: ${exercise.name}`}
                  >
                    <ExercisePhoto exercise={exercise} />
                  </button>
                  <span className={`apparatus-pill ${exercise.apparatus}`}>
                    {apparatusLabels[exercise.apparatus]}
                  </span>
                  <button
                    className={`favorite-button ${state.favorites.includes(exercise.id) ? "is-favorite" : ""}`}
                    aria-label={`${state.favorites.includes(exercise.id) ? "Usuń z" : "Dodaj do"} ulubionych: ${exercise.name}`}
                    onClick={() => onFavorite(exercise.id)}
                  >
                    <Heart
                      size={17}
                      fill={
                        state.favorites.includes(exercise.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </div>
                <div className="exercise-card-body">
                  <div className="exercise-meta">
                    <span>{exercise.level}</span>
                    <span>·</span>
                    <span>{exercise.minutes} min</span>
                    {exercise.custom && (
                      <span className="custom-label">Twoje</span>
                    )}
                  </div>
                  <button
                    className="card-title"
                    onClick={() => onDetail(exercise)}
                  >
                    <h3>{exercise.name}</h3>
                    <ArrowUpRight size={17} />
                  </button>
                  <p className="english-name">
                    {exercise.englishName || exercise.focus.join(" · ")}
                  </p>
                  <div className="card-bottom">
                    <div className="focus-tags">
                      {exercise.focus.slice(0, 2).map((f) => (
                        <span key={f}>{f}</span>
                      ))}
                    </div>
                    <button
                      className={`add-button ${selected ? "added" : ""}`}
                      aria-label={`Dodaj do planu: ${exercise.name}`}
                      onClick={() => onAdd(exercise)}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <p className="library-note">
        Zdjęcia przy filmach to miniatury YouTube. Opisy startowe i szablony
        sprawdź przed użyciem z grupą; nie stanowią indywidualnego programu
        rehabilitacji.
      </p>
    </>
  );
}
