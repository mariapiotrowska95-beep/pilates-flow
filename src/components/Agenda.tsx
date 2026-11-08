import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Play,
  Plus,
  Printer,
  Trash2,
  Users,
} from "lucide-react";
import {
  addDays,
  duration,
  emptyDraft,
  formatDate,
  localDate,
  phaseLabels,
  type AppState,
  type Draft,
  type Session,
} from "../domain/model";
import { Empty, Modal } from "./ui";

export function SessionCard({
  session,
  onOpen,
}: {
  session: Session;
  onOpen: () => void;
}) {
  return (
    <button
      className={`session-card status-${session.status}`}
      onClick={onOpen}
    >
      <div className="session-time">
        <strong>{session.time}</strong>
        <span>{duration(session.lines)} min</span>
      </div>
      <span className="session-divider" />
      <div className="session-card-content">
        <div className="session-card-meta">
          <span>{session.groupName || "Plan indywidualny"}</span>
          {session.status === "completed" && (
            <span className="status-tag">
              <Check size={12} />
              Odbyte
            </span>
          )}
          {session.status === "cancelled" && (
            <span className="status-tag">Odwołane</span>
          )}
        </div>
        <h3>{session.title}</h3>
        <span className="muted small">
          {session.lines.length} ćwiczeń
          {session.seriesId ? " · cyklicznie" : ""}
        </span>
      </div>
      <ArrowUpRight size={20} />
    </button>
  );
}

export function Overview({
  state,
  onNew,
  onOpen,
  onLibrary,
  exerciseCount,
  onTemplates,
}: {
  state: AppState;
  onNew: (date?: string) => void;
  onOpen: (s: Session) => void;
  onLibrary: () => void;
  exerciseCount: number;
  onTemplates: () => void;
}) {
  const [day, setDay] = useState(localDate());
  const today = localDate();
  const weekStart = (() => {
    const d = new Date(day + "T12:00:00");
    return addDays(day, -((d.getDay() + 6) % 7));
  })();
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const sessions = state.sessions
    .filter((s) => s.date === day)
    .sort((a, b) => a.time.localeCompare(b.time));
  const thisWeek = state.sessions.filter(
    (s) =>
      s.date >= weekStart &&
      s.date <= addDays(weekStart, 6) &&
      s.status !== "cancelled",
  );
  const next = state.sessions
    .filter((s) => s.date > day && s.status === "planned")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);
  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow">TWÓJ RYTM. TWOJA PRAKTYKA.</p>
          <h1>
            Przestrzeń na
            <br />
            dobry <em>ruch.</em>
          </h1>
          <p>
            Mniej planowania w głowie.
            <br />
            Więcej uważności na macie.
          </p>
          <button className="button" onClick={() => onNew()}>
            <Plus size={18} />
            Zaplanuj zajęcia
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-ring" />
          <svg viewBox="0 0 400 300" fill="none">
            <path d="M60 252H349" stroke="#819184" strokeWidth="2" />
            <circle cx="155" cy="107" r="21" fill="#bf826a" />
            <path
              d="M176 140L213 201L276 244M212 201L145 247"
              stroke="#5a6e58"
              strokeWidth="27"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M179 150L121 159L81 117M182 153L237 118L254 64"
              stroke="#bf826a"
              strokeWidth="17"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M252 65L262 41"
              stroke="#bf826a"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M135 247H111M277 245H301"
              stroke="#bf826a"
              strokeWidth="14"
              strokeLinecap="round"
            />
          </svg>
          <span className="hero-caption">ZACZNIJ OD ODDECHU</span>
          <span className="hero-sparkle">✳</span>
        </div>
      </div>
      <div className="stats">
        <div>
          <span className="stat-icon">
            <CalendarDays size={21} />
          </span>
          <div>
            <strong>{thisWeek.length}</strong>
            <span>zajęć w wybranym tygodniu</span>
          </div>
        </div>
        <button onClick={onLibrary}>
          <span className="stat-icon peach">
            <Play size={20} />
          </span>
          <div>
            <strong>{exerciseCount}</strong>
            <span>ćwiczeń w Twojej bibliotece</span>
          </div>
          <ArrowUpRight size={17} />
        </button>
        <div>
          <span className="stat-icon lavender">
            <Users size={21} />
          </span>
          <div>
            <strong>{state.groups.length}</strong>
            <span>
              {state.groups.length === 1 ? "Twoja grupa" : "Twoich grup"}
            </span>
          </div>
        </div>
      </div>
      <div className="overview-columns">
        <section className="calendar-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">TWÓJ KALENDARZ</p>
              <h2>{formatDate(day, { month: "long", year: "numeric" })}</h2>
            </div>
            <div className="week-controls">
              <button className="text-button" onClick={() => setDay(today)}>
                Dzisiaj
              </button>
              <button
                className="icon-button"
                aria-label="Poprzedni tydzień"
                onClick={() => setDay(addDays(day, -7))}
              >
                <ArrowLeft size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="Następny tydzień"
                onClick={() => setDay(addDays(day, 7))}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="week-strip">
            {week.map((date) => (
              <button
                key={date}
                className={`${day === date ? "active" : ""} ${today === date ? "today" : ""}`}
                onClick={() => setDay(date)}
                aria-label={formatDate(date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                aria-pressed={day === date}
              >
                <span>
                  {formatDate(date, { weekday: "short" }).replace(".", "")}
                </span>
                <strong>{Number(date.slice(-2))}</strong>
                <i
                  className={
                    state.sessions.some(
                      (s) => s.date === date && s.status !== "cancelled",
                    )
                      ? "has-sessions"
                      : ""
                  }
                />
              </button>
            ))}
          </div>
          <div className="day-heading">
            <h3>
              {day === today ? "Dzisiaj" : formatDate(day, { weekday: "long" })}
              <span> · {formatDate(day)}</span>
            </h3>
            <label className="date-jump">
              <CalendarDays size={16} />
              <input
                aria-label="Przejdź do daty"
                type="date"
                value={day}
                onInput={(e) => {
                  if (e.currentTarget.value) setDay(e.currentTarget.value);
                }}
                onChange={(e) => {
                  if (e.target.value) setDay(e.target.value);
                }}
              />
            </label>
          </div>
          {sessions.length ? (
            <div className="session-list">
              {sessions.map((s) => (
                <SessionCard key={s.id} session={s} onOpen={() => onOpen(s)} />
              ))}
            </div>
          ) : (
            <Empty
              title="Dzień z czystą kartą"
              text="Zostaw przestrzeń na odpoczynek lub zaplanuj kolejne zajęcia."
              action={() => onNew(day)}
              label="Dodaj zajęcia"
            />
          )}
        </section>
        <aside className="inspiration-panel">
          <p className="eyebrow">MAŁA PODPOWIEDŹ</p>
          <span className="big-flower" aria-hidden="true">
            ✳
          </span>
          <h2>
            Dobry plan
            <br />
            zaczyna się
            <br />
            od grupy.
          </h2>
          <p>
            Przygotowanie, cel ruchowy, spokojne zakończenie. Własny rytm
            znajdziesz pomiędzy nimi.
          </p>
          <button className="text-button" onClick={onTemplates}>
            Odkryj szablony
            <ArrowUpRight size={16} />
          </button>
          <div className="inspiration-bottom">
            ZAPLANUJ · POPROWADŹ · ZAPAMIĘTAJ
          </div>
        </aside>
      </div>
      {next.length > 0 && (
        <section className="upcoming">
          <div className="section-heading">
            <h2>Na horyzoncie</h2>
          </div>
          {next.map((s) => (
            <div key={s.id} className="upcoming-row">
              <span className="upcoming-date">
                {formatDate(s.date, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <SessionCard session={s} onOpen={() => onOpen(s)} />
            </div>
          ))}
        </section>
      )}
    </>
  );
}

export function History({
  state,
  onOpen,
  initialGroup = "",
}: {
  state: AppState;
  onOpen: (s: Session) => void;
  initialGroup?: string;
}) {
  const [group, setGroup] = useState(initialGroup);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(30);
  const sessions = state.sessions
    .filter(
      (s) =>
        (!group || s.groupId === group) &&
        (!status || s.status === status) &&
        `${s.title} ${s.groupName} ${s.date}`
          .toLocaleLowerCase("pl")
          .includes(query.toLocaleLowerCase("pl")),
    )
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DOBRE SEKWENCJE WARTO PAMIĘTAĆ</p>
          <h1>
            Twoje zajęcia<span className="heading-dot">.</span>
          </h1>
          <p>
            Wracaj do planów, sprawdzaj historię i korzystaj z tego, co działa.
          </p>
        </div>
      </div>
      <div className="history-filters">
        <label>
          Szukaj
          <input
            value={query}
            placeholder="Nazwa, grupa, data…"
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(30);
            }}
          />
        </label>
        <label>
          Grupa
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Wszystkie grupy</option>
            {state.groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Wszystkie zajęcia</option>
            <option value="planned">Zaplanowane</option>
            <option value="completed">Odbyte</option>
            <option value="cancelled">Odwołane</option>
          </select>
        </label>
      </div>
      {sessions.length ? (
        <div className="history-list">
          {sessions.slice(0, visible).map((s) => (
            <div key={s.id}>
              <p className="history-date">
                {formatDate(s.date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <SessionCard session={s} onOpen={() => onOpen(s)} />
            </div>
          ))}
          {sessions.length > visible && (
            <button
              className="button secondary"
              onClick={() => setVisible(visible + 30)}
            >
              Pokaż kolejne zajęcia
            </button>
          )}
        </div>
      ) : (
        <Empty
          title="Tutaj zamieszka Twoja praktyka"
          text="Zapisane plany pojawią się tutaj. Możesz wracać do nich i kopiować je na nowe terminy."
        />
      )}
    </>
  );
}

export function SessionDetail({
  session,
  onClose,
  onEdit,
  onCopy,
  onStatus,
  onDelete,
}: {
  session: Session;
  onClose: () => void;
  onEdit: (draft: Draft) => void;
  onCopy: (draft: Draft) => void;
  onStatus: (status: Session["status"]) => void;
  onDelete: (future: boolean) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const asDraft = (copy: boolean): Draft => ({
    ...emptyDraft(copy ? localDate() : session.date),
    editingId: copy ? null : session.id,
    title: session.title,
    time: session.time,
    groupId: session.groupId || "",
    notes: session.notes,
    lines: structuredClone(session.lines),
  });
  return (
    <Modal
      title={session.title}
      eyebrow={`${formatDate(session.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${session.time}`}
      onClose={onClose}
      wide
    >
      <div className="session-detail">
        <div className="session-detail-meta">
          <span>
            <Users size={17} />
            {session.groupName || "Bez przypisanej grupy"}
          </span>
          <span>
            <Clock3 size={17} />
            {duration(session.lines)} min
          </span>
          <span>{session.lines.length} ćwiczeń</span>
        </div>
        {session.notes && <p className="session-notes">{session.notes}</p>}
        <div className="session-tools">
          <button
            className="button secondary"
            onClick={() => setShowSteps(!showSteps)}
          >
            <Play size={16} />
            {showSteps ? "Zwiń opisy" : "Tryb prowadzenia"}
          </button>
          <button
            className="icon-button"
            aria-label="Drukuj plan"
            onClick={() => window.print()}
          >
            <Printer size={19} />
          </button>
        </div>
        <ol className="saved-sequence">
          {session.lines.map((line, i) => (
            <li key={line.id}>
              <span className="sequence-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <span className={`tag ${line.phase}`}>
                  {phaseLabels[line.phase]}
                </span>
                <h3>{line.exercise.name}</h3>
                {line.note && <p className="line-note-text">{line.note}</p>}
                {showSteps && (
                  <div className="teaching-steps">
                    <p>{line.exercise.description}</p>
                    {line.exercise.steps.map((step, i) => (
                      <p key={i}>
                        {i + 1}. {step}
                      </p>
                    ))}
                    <p>
                      <strong>Wskazówka:</strong> {line.exercise.cues}
                    </p>
                    <p>
                      <strong>Łatwiej:</strong> {line.exercise.easier}
                    </p>
                    <p>
                      <strong>Trudniej:</strong> {line.exercise.harder}
                    </p>
                    <p className="small muted">{line.exercise.caution}</p>
                  </div>
                )}
              </div>
              <strong className="saved-minutes">
                {line.minutes}
                <small>min</small>
              </strong>
            </li>
          ))}
        </ol>
        <label className="session-status">
          Status zajęć
          <select
            value={session.status}
            onChange={(e) => onStatus(e.target.value as Session["status"])}
          >
            <option value="planned">Zaplanowane</option>
            <option value="completed">Odbyte</option>
            <option value="cancelled">Odwołane</option>
          </select>
        </label>
        <div className="modal-actions">
          <button
            className="button secondary"
            onClick={() => onEdit(asDraft(false))}
          >
            Edytuj ten termin
          </button>
          <button className="button" onClick={() => onCopy(asDraft(true))}>
            <Copy size={17} />
            Kopiuj na nowy termin
          </button>
        </div>
        {confirmDelete ? (
          <div className="delete-confirm">
            <p>
              Usunąć te zajęcia? Historię możesz odzyskać z kopii zapasowej.
            </p>
            <div className="button-row">
              <button className="button danger" onClick={() => onDelete(false)}>
                Usuń ten termin
              </button>
              {session.seriesId && (
                <button
                  className="button danger"
                  onClick={() => onDelete(true)}
                >
                  Usuń ten i przyszłe z serii
                </button>
              )}
              <button
                className="button secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <button
            className="text-button danger-text"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={15} />
            Usuń zajęcia
          </button>
        )}
      </div>
    </Modal>
  );
}
