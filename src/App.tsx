import { useEffect, useMemo, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  CircleHelp,
  ClipboardList,
  Download,
  History as HistoryIcon,
  Leaf,
  Menu,
  Settings as SettingsIcon,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { exercises as builtins, starterTemplates } from "./data/exercises";
import { useStore } from "./data/useStore";
import {
  duration,
  emptyDraft,
  formatDate,
  localDate,
  saveDraft,
  uid,
  type Draft,
  type Exercise,
  type Group,
  type PlanTemplate,
} from "./domain/model";
import Library from "./components/Library";
import Planner from "./components/Planner";
import Groups from "./components/Groups";
import Settings, { downloadFile } from "./components/Settings";
import { ExerciseDetail, ExerciseForm } from "./components/ExerciseDialog";
import { History, Overview, SessionDetail } from "./components/Agenda";
import { Modal } from "./components/ui";

type View =
  | "overview"
  | "library"
  | "planner"
  | "groups"
  | "history"
  | "settings";
const nav = [
  { id: "overview" as const, label: "Przegląd", Icon: CalendarDays },
  { id: "library" as const, label: "Biblioteka", Icon: BookOpen },
  { id: "planner" as const, label: "Plan zajęć", Icon: ClipboardList },
  { id: "groups" as const, label: "Grupy", Icon: Users },
  { id: "history" as const, label: "Historia", Icon: HistoryIcon },
  { id: "settings" as const, label: "Ustawienia", Icon: SettingsIcon },
];
const validViews = new Set(nav.map((n) => n.id));
export default function App() {
  const { state, mutate, error, clearError, pending } = useStore();
  const [view, setView] = useState<View>(() => {
    const h = location.hash.slice(1) as View;
    return validViews.has(h) ? h : "overview";
  });
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [exerciseForm, setExerciseForm] = useState<{
    exercise?: Exercise;
  } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    text: string;
    action: () => void;
  } | null>(null);
  const [help, setHelp] = useState(false);
  const [historyGroup, setHistoryGroup] = useState("");
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setToast(
        "Tryb offline nie został jeszcze przygotowany. Spróbuj ponownie przy połączeniu z internetem.",
      ),
  });
  const allExercises = useMemo(
    () => [...builtins, ...(state?.customExercises ?? [])],
    [state?.customExercises],
  );
  const initialTemplates = useMemo(starterTemplates, []);
  const templates = useMemo(
    () => [...initialTemplates, ...(state?.templates ?? [])],
    [initialTemplates, state?.templates],
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const onHash = () => {
      const h = location.hash.slice(1) as View;
      if (validViews.has(h)) setView(h);
    };
    const onOnline = () => setOffline(!navigator.onLine);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
    };
  }, []);
  function go(v: View) {
    location.hash = v;
    setView(v);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function confirm(title: string, text: string, action: () => void) {
    setConfirmation({ title, text, action });
  }
  async function patchDraft(patch: Partial<Draft>) {
    await mutate((s) => ({ ...s, draft: { ...s.draft, ...patch } }));
  }
  async function addExercise(exercise: Exercise) {
    if (
      await mutate((s) => ({
        ...s,
        draft: {
          ...s.draft,
          lines: [
            ...s.draft.lines,
            {
              id: uid(),
              exercise: structuredClone(exercise),
              minutes: exercise.minutes,
              phase: exercise.phase,
              note: "",
            },
          ],
        },
      }))
    )
      setToast(`Dodano: ${exercise.name}`);
  }
  function replaceDraft(draft: Draft) {
    const run = () => {
      void mutate((s) => ({ ...s, draft })).then((ok) => {
        if (ok) {
          setSessionId(null);
          go("planner");
        }
      });
    };
    if (state?.draft.lines.length)
      confirm(
        "Zastąpić obecny szkic?",
        "Obecny szkic ma już wybrane ćwiczenia. Zapisz go wcześniej, jeśli chcesz do niego wrócić.",
        run,
      );
    else run();
  }
  function newPlan(date?: string, group?: Group) {
    const draft = emptyDraft(date);
    if (group) {
      draft.groupId = group.id;
      draft.title = group.name;
    }
    replaceDraft(draft);
  }
  async function persistPlan() {
    let count = 0;
    const ok = await mutate((s) => {
      const result = saveDraft(s);
      count = result.count;
      return result.state;
    });
    if (ok) {
      setToast(
        count === 1
          ? "Zajęcia zapisane."
          : "Zapisano " + count + " terminów zajęć.",
      );
      go("overview");
    }
  }
  function applyTemplate(t: PlanTemplate) {
    const action = () => {
      void mutate((s) => ({
        ...s,
        draft: {
          ...s.draft,
          title: s.draft.title || t.name,
          lines: structuredClone(t.lines).map((l) => ({ ...l, id: uid() })),
        },
      })).then((ok) => {
        if (ok) setToast("Szablon dodany. Dopasuj plan do grupy.");
      });
    };
    if (state?.draft.lines.length)
      confirm(
        "Użyć tego szablonu?",
        "Sekwencja w obecnym szkicu zostanie zastąpiona.",
        action,
      );
    else action();
  }
  async function backup() {
    if (!state) return;
    const exported = { ...state, lastBackup: new Date().toISOString() };
    downloadFile(
      JSON.stringify(exported, null, 2),
      `pilates-flow-kopia-${localDate()}.json`,
      "application/json",
    );
    await mutate((s) => ({ ...s, lastBackup: exported.lastBackup }));
    setToast(
      "Plik kopii został przekazany do pobrania. Zachowaj go w bezpiecznym miejscu.",
    );
  }
  if (!state)
    return (
      <div className="loading-screen">
        <Leaf size={38} />
        <h1>Pilates Flow</h1>
        <p>{error || "Przygotowuję Twoją przestrzeń…"}</p>
        {error && (
          <button className="button" onClick={() => location.reload()}>
            Spróbuj ponownie
          </button>
        )}
      </div>
    );
  const session = state.sessions.find((s) => s.id === sessionId);
  const saveGroup = async (group: Group) => {
    const ok = await mutate((s) => ({
      ...s,
      groups: [...s.groups.filter((g) => g.id !== group.id), group],
    }));
    if (ok) setToast("Grupa zapisana.");
    return ok;
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <a className="brand" href="#overview" onClick={() => go("overview")}>
          <span className="brand-symbol">
            <img src="/icon.svg" alt="" />
          </span>
          <span>
            pilates<span className="brand-flow">flow</span>
            <small>TWÓJ RYTM. DOBRY RUCH.</small>
          </span>
        </a>
        <p className="nav-label">TWOJA PRZESTRZEŃ</p>
        <nav className="desktop-nav" aria-label="Nawigacja główna">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              aria-current={view === id ? "page" : undefined}
              onClick={() => go(id)}
            >
              <Icon size={20} strokeWidth={1.65} />
              {label}
              {id === "planner" && state.draft.lines.length > 0 && (
                <span className="nav-badge">{state.draft.lines.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="status-dot" />
            <strong>Twoje dane są tutaj</strong>
            <p>
              Plany zapisują się
              <br />
              na tym urządzeniu.
            </p>
            <button className="text-button" onClick={() => go("settings")}>
              Zadbaj o kopię
              <ArrowRight size={14} />
            </button>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={17} />
            Jak zacząć?
          </button>
          <span className="version">PILATES FLOW · v0.1</span>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-overlay"
          aria-label="Zamknij menu"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Otwórz menu"
            onClick={() => setMenu(true)}
          >
            <Menu size={22} />
          </button>
          <span className="topbar-label">Z uważnością na każdy ruch.</span>
          <div className="topbar-right">
            <span className={`save-indicator ${offline ? "is-offline" : ""}`}>
              {offline ? <WifiOff size={14} /> : <CheckCheck size={16} />}
              <span>
                {pending
                  ? "Zapisywanie…"
                  : offline
                    ? "Tryb offline"
                    : "Zapis na urządzeniu"}
              </span>
            </span>
            <button
              className="icon-button"
              aria-label="Pobierz kopię zapasową"
              onClick={() => void backup()}
            >
              <Download size={19} />
            </button>
            <span className="profile-mark" aria-label="Osobista przestrzeń">
              m.
            </span>
          </div>
        </header>
        <main id="main-content">
          {view === "overview" && (
            <Overview
              state={state}
              onNew={newPlan}
              onOpen={(s) => setSessionId(s.id)}
              onLibrary={() => go("library")}
              exerciseCount={allExercises.length}
              onTemplates={() => go("planner")}
            />
          )}
          {view === "library" && (
            <Library
              exercises={allExercises}
              state={state}
              onAdd={(e) => void addExercise(e)}
              onDetail={setSelected}
              onFavorite={(id) =>
                void mutate((s) => ({
                  ...s,
                  favorites: s.favorites.includes(id)
                    ? s.favorites.filter((x) => x !== id)
                    : [...s.favorites, id],
                }))
              }
              onCreate={() => setExerciseForm({})}
            />
          )}
          {view === "planner" && (
            <Planner
              state={state}
              onDraft={(p) => void patchDraft(p)}
              onLibrary={() => go("library")}
              onSave={() => void persistPlan()}
              onReset={() =>
                confirm(
                  "Zacząć nowy szkic?",
                  "Wybrane ćwiczenia w obecnym szkicu zostaną usunięte.",
                  () => void mutate((s) => ({ ...s, draft: emptyDraft() })),
                )
              }
              onTemplate={applyTemplate}
              onSaveTemplate={(name) =>
                void mutate((s) => ({
                  ...s,
                  templates: [
                    ...s.templates,
                    { id: uid(), name, lines: structuredClone(s.draft.lines) },
                  ],
                })).then((ok) => {
                  if (ok) setToast("Szablon zapisany.");
                })
              }
              templates={templates}
              onDetail={(line) => setSelected(line.exercise)}
              pending={pending > 0}
            />
          )}
          {view === "groups" && (
            <Groups
              state={state}
              onSave={saveGroup}
              onDelete={(g) =>
                confirm(
                  "Usunąć grupę?",
                  `Nazwa „${g.name}” pozostanie w zapisanych zajęciach. Grupa zniknie z listy.`,
                  () =>
                    void mutate((s) => ({
                      ...s,
                      groups: s.groups.filter((x) => x.id !== g.id),
                      draft: {
                        ...s.draft,
                        groupId:
                          s.draft.groupId === g.id ? "" : s.draft.groupId,
                      },
                    })),
                )
              }
              onPlan={(g) => newPlan(undefined, g)}
              onHistory={(group) => { setHistoryGroup(group.id); go("history"); }}
            />
          )}
          {view === "history" && (
            <History state={state} initialGroup={historyGroup} onOpen={(s) => setSessionId(s.id)} />
          )}
          {view === "settings" && (
            <Settings
              state={state}
              onBackup={() => void backup()}
              onRestore={async (incoming) => {
                const ok = await mutate(
                  (s) => ({ ...incoming, revision: s.revision }),
                  true,
                );
                if (ok) setToast("Kopia przywrócona.");
                return ok;
              }}
              onToast={setToast}
            />
          )}
          <footer className="page-footer">
            <span>pilates flow</span>
            <span>Twoja praktyka. Krok po kroku.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Nawigacja mobilna">
        {nav.slice(0, 4).map(({ id, label, Icon }) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            onClick={() => go(id)}
            aria-current={view === id ? "page" : undefined}
          >
            <Icon size={21} />
            <span>{label}</span>
            {id === "planner" && state.draft.lines.length > 0 && (
              <i>{state.draft.lines.length}</i>
            )}
          </button>
        ))}
        <button
          className={view === "history" || view === "settings" ? "active" : ""}
          onClick={() => go("history")}
        >
          <HistoryIcon size={21} />
          <span>Historia</span>
        </button>
      </nav>
      {state.draft.lines.length > 0 && view === "library" && (
        <div className="selection-bar">
          <div>
            <span className="selection-count">{state.draft.lines.length}</span>
            <div>
              <strong>Twój plan nabiera kształtu</strong>
              <span>{duration(state.draft.lines)} min ruchu</span>
            </div>
          </div>
          <button className="button" onClick={() => go("planner")}>
            Przejdź do planu
            <ArrowRight size={17} />
          </button>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toast}</span>
          <button
            aria-label="Zamknij powiadomienie"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button onClick={clearError} aria-label="Zamknij błąd">
            <X size={18} />
          </button>
        </div>
      )}
      {needRefresh && (
        <div className="update-banner">
          <span>Nowa wersja aplikacji jest gotowa.</span>
          <button
            className="button"
            disabled={pending > 0}
            onClick={() => void updateServiceWorker(true)}
          >
            Odśwież aplikację
          </button>
        </div>
      )}
      {selected && (
        <ExerciseDetail
          exercise={selected}
          state={state}
          allExercises={allExercises}
          onClose={() => setSelected(null)}
          onAdd={() => void addExercise(selected)}
          onEdit={() => {
            setExerciseForm({ exercise: selected });
            setSelected(null);
          }}
          onRelated={setSelected}
          onSession={(id) => {
            setSelected(null);
            setSessionId(id);
          }}
        />
      )}
      {exerciseForm && (
        <ExerciseForm
          exercise={exerciseForm.exercise}
          onClose={() => setExerciseForm(null)}
          onSave={async (e) => {
            const ok = await mutate((s) => ({
              ...s,
              customExercises: [
                ...s.customExercises.filter((x) => x.id !== e.id),
                e,
              ],
            }));
            if (ok) setToast("Ćwiczenie zapisane w Twojej bibliotece.");
            return ok;
          }}
        />
      )}
      {session && (
        <SessionDetail
          session={session}
          onClose={() => setSessionId(null)}
          onEdit={replaceDraft}
          onCopy={replaceDraft}
          onStatus={(status) =>
            void mutate((s) => ({
              ...s,
              sessions: s.sessions.map((x) =>
                x.id === session.id ? { ...x, status } : x,
              ),
            }))
          }
          onDelete={(future) =>
            void mutate((s) => ({
              ...s,
              sessions: s.sessions.filter((x) =>
                future
                  ? !(x.seriesId === session.seriesId && x.date >= session.date)
                  : x.id !== session.id,
              ),
            })).then((ok) => {
              if (ok) {
                setSessionId(null);
                setToast("Zajęcia usunięte.");
              }
            })
          }
        />
      )}
      {confirmation && (
        <Modal title={confirmation.title} onClose={() => setConfirmation(null)}>
          <p>{confirmation.text}</p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirmation(null)}
            >
              Anuluj
            </button>
            <button
              className="button"
              onClick={() => {
                const action = confirmation.action;
                setConfirmation(null);
                action();
              }}
            >
              Potwierdź
            </button>
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title="Dobrze mieć plan"
          eyebrow="WITAJ W PILATES FLOW"
          onClose={() => setHelp(false)}
        >
          <ol className="help-steps">
            <li>
              <strong>Poznaj swoją bibliotekę.</strong>
              <p>
                Wyszukaj ćwiczenia po sprzęcie, celu ruchowym, poziomie i
                przyborach. Dodaj własne opisy oraz zdjęcia.
              </p>
            </li>
            <li>
              <strong>Ułóż przepływ zajęć.</strong>
              <p>
                Przyciskiem + zbierz ćwiczenia, ustal kolejność, czas i warianty
                dla grupy.
              </p>
            </li>
            <li>
              <strong>Wpisz zajęcia do kalendarza.</strong>
              <p>
                Wybierz datę, godzinę i grupę. Jeśli chcesz, utwórz serię
                codzienną lub tygodniową.
              </p>
            </li>
            <li>
              <strong>Zachowaj swoją praktykę.</strong>
              <p>
                Po zajęciach oznacz je jako odbyte. Regularnie pobieraj kopię
                JSON z ustawień.
              </p>
            </li>
          </ol>
          <p className="small muted">
            Dzisiaj jest {formatDate(localDate())}. Zaczynamy od Twoich własnych
            danych — kalendarz jest pusty.
          </p>
          <button
            className="button full"
            onClick={() => {
              setHelp(false);
              go("library");
            }}
          >
            Przejdź do biblioteki
            <ArrowRight size={17} />
          </button>
        </Modal>
      )}
    </div>
  );
}
